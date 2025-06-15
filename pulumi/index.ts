import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Get configuration
const config = new pulumi.Config();
const appName = config.get('appName') ?? pulumi.getProject();
const appPort = config.getNumber('appPort') ?? 3000;
const instanceType = config.get('instanceType') ?? 't3.micro'; // t3.micro is cheaper and more performant
const domain = config.get('domain') ?? 'staging.lawlzer.com';
const githubOrg = config.get('githubOrg') ?? 'Lawlzer';
const githubRepo = config.get('githubRepo') ?? 'lawlzer-website';
const githubBranch = config.get('githubBranch') ?? 'staging';

// Get the mongo secret ARN from config
const mongoSecretArn = config.getSecret('mongoSecretArn');

// Get current AWS context
const currentIdentity = aws.getCallerIdentity({});
const accountId = currentIdentity.then((id) => id.accountId);
const region = aws.config.requireRegion();

// Create a security group for the EC2 instance
const webSecurityGroup = new aws.ec2.SecurityGroup('web-sg', {
	name: `${appName}-web-sg`,
	description: 'Security group for web server',
	ingress: [
		// HTTP
		{
			protocol: 'tcp',
			fromPort: 80,
			toPort: 80,
			cidrBlocks: ['0.0.0.0/0'],
			description: 'HTTP from anywhere',
		},
		// HTTPS
		{
			protocol: 'tcp',
			fromPort: 443,
			toPort: 443,
			cidrBlocks: ['0.0.0.0/0'],
			description: 'HTTPS from anywhere',
		},
		// SSH (restrict this to your IP in production)
		{
			protocol: 'tcp',
			fromPort: 22,
			toPort: 22,
			cidrBlocks: ['0.0.0.0/0'], // TODO: Restrict to specific IPs
			description: 'SSH access',
		},
		// Node.js app port (internal)
		{
			protocol: 'tcp',
			fromPort: appPort,
			toPort: appPort,
			cidrBlocks: ['127.0.0.1/32'],
			description: 'Node.js app port',
		},
	],
	egress: [
		{
			protocol: '-1',
			fromPort: 0,
			toPort: 0,
			cidrBlocks: ['0.0.0.0/0'],
			description: 'Allow all outbound traffic',
		},
	],
	tags: {
		Name: `${appName}-web-sg`,
	},
});

// Create an IAM role for the EC2 instance
const ec2Role = new aws.iam.Role('ec2-role', {
	name: `${appName}-ec2-role`,
	assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
		Service: 'ec2.amazonaws.com',
	}),
});

// Attach policies to allow EC2 to read secrets and use SSM
const ec2SecretPolicy = new aws.iam.RolePolicy('ec2-secret-policy', {
	name: `${appName}-ec2-secret-policy`,
	role: ec2Role.id,
	policy: pulumi.all([mongoSecretArn, region, accountId]).apply(([secretArn, resolvedRegion, resolvedAccountId]) =>
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Action: ['ssm:GetParameters', 'ssm:GetParameter'],
					Resource: secretArn,
				},
				{
					Effect: 'Allow',
					Action: 'kms:Decrypt',
					Resource: `arn:aws:kms:${resolvedRegion}:${resolvedAccountId}:alias/aws/ssm`,
				},
			],
		})
	),
});

// Attach SSM managed instance policy for Session Manager access
new aws.iam.RolePolicyAttachment('ec2-ssm-policy', {
	role: ec2Role.name,
	policyArn: aws.iam.ManagedPolicy.AmazonSSMManagedInstanceCore,
});

// Create instance profile
const instanceProfile = new aws.iam.InstanceProfile('ec2-instance-profile', {
	name: `${appName}-instance-profile`,
	role: ec2Role.name,
});

// User data script to set up the EC2 instance
const userData = pulumi.all([mongoSecretArn, region]).apply(
	([secretArn, resolvedRegion]) =>
		`#!/bin/bash
# Log all output
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user data script at $(date)"

# Exit on error
set -e

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js 20
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install nginx
echo "Installing nginx..."
apt-get install -y nginx

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Install git
echo "Installing git..."
apt-get install -y git

# Install AWS CLI v2
echo "Installing AWS CLI v2..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
apt-get install -y unzip
unzip awscliv2.zip
./aws/install
rm -rf awscliv2.zip aws/

# Create app directory
echo "Setting up application directory..."
mkdir -p /var/www/app
cd /var/www/app

# Clone the repository
echo "Cloning repository from ${githubOrg}/${githubRepo} branch ${githubBranch}..."
git clone -b ${githubBranch} https://github.com/${githubOrg}/${githubRepo}.git .

# Install dependencies
echo "Installing npm dependencies..."
npm install --legacy-peer-deps

# Build the application
echo "Building application..."
npm run build

# Get MongoDB connection string from Parameter Store
echo "Fetching MongoDB connection string..."
export MONGO_URI=$(aws ssm get-parameter --name "${secretArn}" --with-decryption --region ${resolvedRegion} --query 'Parameter.Value' --output text)

# Create .env file
echo "Creating .env file..."
cat > .env << EOF
NODE_ENV=production
PORT=${appPort}
MONGO_URI=$MONGO_URI
EOF

# Configure nginx as reverse proxy
echo "Configuring nginx..."
cat > /etc/nginx/sites-available/default << 'NGINX_CONFIG'
server {
	listen 80;
	server_name _;

	location / {
		proxy_pass http://localhost:${appPort};
		proxy_http_version 1.1;
		proxy_set_header Upgrade \\$http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host \\$host;
		proxy_cache_bypass \\$http_upgrade;
		proxy_set_header X-Real-IP \\$remote_addr;
		proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto \\$scheme;
	}
}
NGINX_CONFIG

# Restart nginx
echo "Restarting nginx..."
systemctl restart nginx

# Start the app with PM2
echo "Starting application with PM2..."
cd /var/www/app
PORT=${appPort} pm2 start npm --name "${appName}" -- start
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Create a simple deployment script
echo "Creating deployment script..."
cat > /home/ubuntu/deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
cd /var/www/app
git pull origin ${githubBranch}
npm install
npm run build
pm2 restart ${appName}
DEPLOY_SCRIPT

chmod +x /home/ubuntu/deploy.sh
chown ubuntu:ubuntu /home/ubuntu/deploy.sh

# Create a status check endpoint
echo "Creating health check endpoint..."
cat > /var/www/html/health << 'HEALTH'
OK
HEALTH

# Signal completion
echo "User data script completed successfully at $(date)"
touch /var/lib/cloud/instance/user-data-finished

# Send completion signal to CloudWatch (optional)
aws ssm put-parameter --name "/ec2/${appName}/setup-complete" --value "$(date)" --type String --overwrite --region ${resolvedRegion} || true
`
);

// Get the latest Ubuntu AMI
const ami = aws.ec2.getAmi({
	mostRecent: true,
	owners: ['099720109477'], // Canonical
	filters: [
		{ name: 'name', values: ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*'] },
		{ name: 'virtualization-type', values: ['hvm'] },
	],
});

// Create the EC2 instance
const webServer = new aws.ec2.Instance('web-server', {
	instanceType: instanceType,
	ami: ami.then((amiResult) => amiResult.id),
	iamInstanceProfile: instanceProfile.name,
	vpcSecurityGroupIds: [webSecurityGroup.id],
	userData: userData,
	rootBlockDevice: {
		volumeSize: 20, // 20GB storage
		volumeType: 'gp3',
		deleteOnTermination: true,
	},
	tags: {
		Name: `${appName}-web-server`,
		Environment: 'staging',
	},
	// Enable detailed monitoring (optional)
	monitoring: false,
});

// Allocate an Elastic IP for the instance
const eip = new aws.ec2.Eip('web-eip', {
	instance: webServer.id,
	tags: {
		Name: `${appName}-eip`,
	},
});

// Create ACM certificate for HTTPS (optional - for future use with CloudFront or ALB)
const certificate = new aws.acm.Certificate('app-certificate', {
	domainName: domain,
	validationMethod: 'DNS',
	tags: {
		Name: `${appName}-certificate`,
	},
});

// Output the certificate validation options
export const certificateValidationOptions = certificate.domainValidationOptions;

// Wait for instance to be ready (optional - uncomment if you want Pulumi to wait)
// const instanceReady = new aws.ssm.Command('wait-for-setup', {
// 	instanceIds: [webServer.id],
// 	documentName: 'AWS-RunShellScript',
// 	parameters: {
// 		commands: [
// 			'while [ ! -f /var/lib/cloud/instance/user-data-finished ]; do echo "Waiting for setup..."; sleep 10; done',
// 			'echo "Setup complete!"',
// 			'pm2 list'
// 		]
// 	}
// }, { dependsOn: [webServer] });

// Outputs
export const instanceId = webServer.id;
export const { publicIp } = eip;
export const { publicDns } = webServer;
export const instanceUrl = pulumi.interpolate`http://${eip.publicIp}`;
export const domainName = domain;

// Commands to check status (no SSH needed!)
export const checkStatusCommand = pulumi.interpolate`aws ssm send-command --instance-ids ${webServer.id} --document-name "AWS-RunShellScript" --parameters 'commands=["pm2 list","curl -s http://localhost:${appPort}/","tail -20 /var/log/user-data.log"]' --region ${region}`;
export const checkLogsCommand = pulumi.interpolate`aws ssm send-command --instance-ids ${webServer.id} --document-name "AWS-RunShellScript" --parameters 'commands=["tail -100 /var/log/user-data.log"]' --region ${region}`;
export const deployCommand = pulumi.interpolate`aws ssm send-command --instance-ids ${webServer.id} --document-name "AWS-RunShellScript" --parameters 'commands=["sudo /home/ubuntu/deploy.sh"]' --region ${region}`;

// Instructions for DNS setup
export const dnsInstructions = pulumi.interpolate`
Please create an A record in Cloudflare:
  Domain: ${domain}
  Type: A
  Value: ${eip.publicIp}
  Proxy: Disabled (for initial setup)
`;

// Status check instructions
export const statusInstructions = pulumi.interpolate`
To check if setup is complete (no SSH needed):
1. Check status: ${checkStatusCommand}
2. Check logs: ${checkLogsCommand}
3. Then get output: aws ssm get-command-invocation --command-id <COMMAND_ID> --instance-id ${webServer.id} --region ${region}

The app will be available at: http://${eip.publicIp} once setup completes (usually 3-5 minutes).
`;

// GitHub Actions deployment role (simplified for EC2)
// The OIDC provider already exists from the production stack, so we'll reference it
const githubActionsRole = new aws.iam.Role('github-actions-role', {
	name: `${appName}-github-actions-role`,
	assumeRolePolicy: pulumi.all([accountId]).apply(([accId]) =>
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Principal: {
						Federated: `arn:aws:iam::${accId}:oidc-provider/token.actions.githubusercontent.com`,
					},
					Action: 'sts:AssumeRoleWithWebIdentity',
					Condition: {
						StringEquals: {
							'token.actions.githubusercontent.com:sub': `repo:${githubOrg}/${githubRepo}:ref:refs/heads/${githubBranch}`,
						},
					},
				},
			],
		})
	),
});

// Policy for GitHub Actions to deploy to EC2
const githubActionsPolicy = new aws.iam.Policy('github-actions-deploy-policy', {
	name: `${appName}-github-actions-deploy-policy`,
	description: 'Policy allowing GitHub Actions to deploy to EC2 via SSM',
	policy: pulumi.all([webServer.arn, region]).apply(([instanceArn, resolvedRegion]) =>
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Action: ['ssm:SendCommand', 'ssm:GetCommandInvocation', 'ssm:ListCommandInvocations'],
					Resource: [instanceArn, `arn:aws:ssm:${resolvedRegion}::document/AWS-RunShellScript`],
				},
				{
					Effect: 'Allow',
					Action: ['ec2:DescribeInstances'],
					Resource: '*',
				},
			],
		})
	),
});

new aws.iam.RolePolicyAttachment('github-actions-policy-attachment', {
	role: githubActionsRole.name,
	policyArn: githubActionsPolicy.arn,
});

export const githubActionsRoleArn = githubActionsRole.arn;
