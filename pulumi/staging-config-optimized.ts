import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Get configuration
const config = new pulumi.Config();
const appName = config.get('appName') ?? 'lawlzer-website-staging';
const appPort = config.getNumber('appPort') ?? 3000;
const instanceType = config.get('instanceType') ?? 't3.micro'; // t3.micro for better price/performance
const domain = config.get('domain') ?? 'staging.lawlzer.com';
const githubOrg = config.get('githubOrg') ?? 'Lawlzer';
const githubRepo = config.get('githubRepo') ?? 'lawlzer-website';
const githubBranch = config.get('githubBranch') ?? 'staging';

// Get the mongo secret ARN from config
const mongoSecretArn = config.requireSecret('mongoSecretArn');

// Get current AWS context
const currentIdentity = aws.getCallerIdentity({});
const accountId = currentIdentity.then((id) => id.accountId);
const region = aws.config.requireRegion();

// Create a MINIMAL security group (cost optimization)
const webSecurityGroup = new aws.ec2.SecurityGroup('staging-web-sg', {
	name: `${appName}-sg`,
	description: 'Minimal security group for staging web server',
	ingress: [
		// HTTP only - HTTPS via Cloudflare
		{
			protocol: 'tcp',
			fromPort: 80,
			toPort: 80,
			cidrBlocks: ['0.0.0.0/0'],
			description: 'HTTP from anywhere',
		},
		// SSH - Consider removing after setup
		{
			protocol: 'tcp',
			fromPort: 22,
			toPort: 22,
			cidrBlocks: ['0.0.0.0/0'], // TODO: Restrict to GitHub Actions IPs
			description: 'SSH for emergency access',
		},
	],
	egress: [
		{
			protocol: '-1',
			fromPort: 0,
			toPort: 0,
			cidrBlocks: ['0.0.0.0/0'],
			description: 'Allow all outbound',
		},
	],
	tags: {
		Name: `${appName}-sg`,
		Environment: 'staging',
		CostCenter: 'staging',
	},
});

// Create IAM role with minimal permissions
const ec2Role = new aws.iam.Role('staging-ec2-role', {
	name: `${appName}-role`,
	assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
		Service: 'ec2.amazonaws.com',
	}),
	tags: {
		Environment: 'staging',
		CostCenter: 'staging',
	},
});

// Minimal policy for secrets access
const ec2SecretPolicy = new aws.iam.RolePolicy('staging-ec2-secret-policy', {
	name: `${appName}-secret-policy`,
	role: ec2Role.id,
	policy: pulumi.all([mongoSecretArn, region, accountId]).apply(([secretArn, resolvedRegion, resolvedAccountId]) =>
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Action: ['ssm:GetParameter'],
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

// SSM for deployment only
new aws.iam.RolePolicyAttachment('staging-ec2-ssm-policy', {
	role: ec2Role.name,
	policyArn: aws.iam.ManagedPolicy.AmazonSSMManagedInstanceCore,
});

// Create instance profile
const instanceProfile = new aws.iam.InstanceProfile('staging-ec2-profile', {
	name: `${appName}-profile`,
	role: ec2Role.name,
});

// Optimized user data script with all fixes
const userData = pulumi.all([mongoSecretArn, region]).apply(
	([secretArn, resolvedRegion]) =>
		`#!/bin/bash
# Enhanced logging and error handling
exec > >(tee /var/log/user-data.log)
exec 2>&1
set -euxo pipefail

echo "=== STARTING OPTIMIZED STAGING SETUP ==="
echo "Instance type: t3.micro (cost-optimized)"
echo "Started at: $(date)"

# Function to log errors
log_error() {
    echo "ERROR: $1" >&2
    echo "ERROR: $1" >> /var/log/user-data-errors.log
}

# Trap errors
trap 'log_error "Script failed at line $LINENO"' ERR

# Update system with minimal packages
echo "=== SYSTEM UPDATE ==="
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

# Install only essential packages
echo "=== INSTALLING ESSENTIAL PACKAGES ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs nginx git unzip

# Install PM2
npm install -g pm2@latest

# Install AWS CLI v2 (required for secrets)
echo "=== INSTALLING AWS CLI ==="
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install
rm -rf awscliv2.zip aws/

# Setup application
echo "=== SETTING UP APPLICATION ==="
mkdir -p /var/www/app
cd /var/www/app

# Clone with depth 1 for faster clone
git clone --depth 1 -b ${githubBranch} https://github.com/${githubOrg}/${githubRepo}.git . || {
    log_error "Failed to clone repository"
    exit 1
}

# Install dependencies with legacy peer deps fix
echo "=== INSTALLING NPM DEPENDENCIES ==="
npm install --legacy-peer-deps --production || {
    log_error "Failed to install dependencies"
    exit 1
}

# Get MongoDB URI from Parameter Store
echo "=== CONFIGURING DATABASE ==="
MONGO_URI=$(aws ssm get-parameter --name "${secretArn}" --with-decryption --region ${resolvedRegion} --query 'Parameter.Value' --output text) || {
    log_error "Failed to get MongoDB URI"
    exit 1
}

# Create comprehensive .env file
cat > .env << EOF
NODE_ENV=production
PORT=${appPort}

# Database
DATABASE_URL=\$MONGO_URI
MONGO_URI=\$MONGO_URI

# Domain configuration
NEXT_PUBLIC_SCHEME=https
NEXT_PUBLIC_SECOND_LEVEL_DOMAIN=staging
NEXT_PUBLIC_TOP_LEVEL_DOMAIN=lawlzer.com
NEXT_PUBLIC_FRONTEND_PORT=${appPort}

# OAuth (minimal for staging)
NEXT_PUBLIC_AUTH_GOOGLE_ID=staging-placeholder
AUTH_GOOGLE_SECRET=staging-placeholder
NEXT_PUBLIC_AUTH_DISCORD_ID=staging-placeholder  
AUTH_DISCORD_SECRET=staging-placeholder
NEXT_PUBLIC_AUTH_GITHUB_ID=staging-placeholder
AUTH_GITHUB_SECRET=staging-placeholder

# Performance optimizations
NODE_OPTIONS="--max-old-space-size=512"
EOF

# Build application
echo "=== BUILDING APPLICATION ==="
SKIP_ENV_VALIDATION=true npm run build || {
    log_error "Build failed"
    exit 1
}

# Configure nginx with caching
echo "=== CONFIGURING NGINX ==="
cat > /etc/nginx/sites-available/default << 'NGINX_CONFIG'
# Optimized nginx config with caching
server {
    listen 80 default_server;
    server_name _;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://localhost:${appPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
NGINX_CONFIG

systemctl restart nginx
systemctl enable nginx

# Start application with PM2
echo "=== STARTING APPLICATION ==="
cd /var/www/app
PORT=${appPort} pm2 start npm --name "${appName}" -- start --max-memory-restart 450M
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Create deployment script
echo "=== CREATING DEPLOYMENT SCRIPT ==="
cat > /home/ubuntu/deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -euo pipefail

echo "Starting deployment at $(date)"
cd /var/www/app

# Pull latest code
git pull origin ${githubBranch}

# Install dependencies
npm install --legacy-peer-deps --production

# Build
SKIP_ENV_VALIDATION=true npm run build

# Restart with zero downtime
pm2 reload ${appName}

echo "Deployment completed at $(date)"
DEPLOY_SCRIPT

chmod +x /home/ubuntu/deploy.sh
chown ubuntu:ubuntu /home/ubuntu/deploy.sh

# Setup log rotation to save disk space
echo "=== CONFIGURING LOG ROTATION ==="
cat > /etc/logrotate.d/pm2 << 'LOGROTATE'
/home/ubuntu/.pm2/logs/*.log {
    daily
    rotate 3
    compress
    delaycompress
    missingok
    notifempty
    create 0640 ubuntu ubuntu
}
LOGROTATE

# Signal completion
echo "=== SETUP COMPLETE ==="
echo "Setup completed at $(date)"
touch /var/lib/cloud/instance/user-data-finished

# Optional: Send metric to CloudWatch
aws cloudwatch put-metric-data --namespace "Staging/Deployment" --metric-name "SetupComplete" --value 1 --region ${resolvedRegion} || true

# Final status check
pm2 list
curl -f http://localhost:${appPort}/health || echo "WARNING: Health check failed"
`
);

// Get the latest Ubuntu AMI (cost-optimized)
const ami = aws.ec2.getAmi({
	mostRecent: true,
	owners: ['099720109477'], // Canonical
	filters: [
		{ name: 'name', values: ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*'] },
		{ name: 'virtualization-type', values: ['hvm'] },
		{ name: 'architecture', values: ['x86_64'] },
	],
});

// Create EC2 instance with cost optimizations
const webServer = new aws.ec2.Instance('staging-server', {
	instanceType: instanceType,
	ami: ami.then((amiResult) => amiResult.id),
	iamInstanceProfile: instanceProfile.name,
	vpcSecurityGroupIds: [webSecurityGroup.id],
	userData: userData,
	rootBlockDevice: {
		volumeSize: 8, // Minimal storage for staging
		volumeType: 'gp3', // Cheaper than gp2
		deleteOnTermination: true,
	},
	creditSpecification: {
		cpuCredits: 'standard', // Don't use unlimited for cost savings
	},
	tags: {
		Name: `${appName}-server`,
		Environment: 'staging',
		CostCenter: 'staging',
		AutoShutdown: 'false', // Could implement auto-shutdown for additional savings
	},
	// Disable detailed monitoring to save costs
	monitoring: false,
});

// Allocate Elastic IP (unfortunately still costs $3.60/month)
const eip = new aws.ec2.Eip('staging-eip', {
	instance: webServer.id,
	tags: {
		Name: `${appName}-eip`,
		Environment: 'staging',
		Note: 'Costs $3.60/month for IPv4',
	},
});

// Simple CloudWatch alarm for basic monitoring
const cpuAlarm = new aws.cloudwatch.MetricAlarm('staging-cpu-alarm', {
	comparisonOperator: 'GreaterThanThreshold',
	evaluationPeriods: 2,
	metricName: 'CPUUtilization',
	namespace: 'AWS/EC2',
	period: 300,
	statistic: 'Average',
	threshold: 80,
	alarmDescription: 'Triggers when CPU exceeds 80%',
	dimensions: {
		InstanceId: webServer.id,
	},
});

// GitHub Actions role for automated deployments
const githubActionsRole = new aws.iam.Role('staging-github-actions-role', {
	name: `${appName}-github-role`,
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

// Minimal deployment permissions
const githubActionsPolicy = new aws.iam.Policy('staging-github-deploy-policy', {
	name: `${appName}-github-deploy-policy`,
	policy: pulumi.all([webServer.arn, region]).apply(([instanceArn, resolvedRegion]) =>
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Action: ['ssm:SendCommand', 'ssm:GetCommandInvocation'],
					Resource: [instanceArn, `arn:aws:ssm:${resolvedRegion}::document/AWS-RunShellScript`],
				},
				{
					Effect: 'Allow',
					Action: ['ec2:DescribeInstances'],
					Resource: '*',
					Condition: {
						StringEquals: {
							'ec2:InstanceId': webServer.id,
						},
					},
				},
			],
		})
	),
});

new aws.iam.RolePolicyAttachment('staging-github-policy-attachment', {
	role: githubActionsRole.name,
	policyArn: githubActionsPolicy.arn,
});

// Outputs
export const instanceId = webServer.id;
export const { publicIp } = eip;
export const { publicDns } = webServer;
export const instanceUrl = pulumi.interpolate`http://${eip.publicIp}`;
export const domainName = domain;
export const githubActionsRoleArn = githubActionsRole.arn;

// Cost breakdown
export const costBreakdown = pulumi.interpolate`
=== MONTHLY COST BREAKDOWN ===
EC2 t3.micro: ~$7.50/month (750 free tier hours if eligible)
EBS Storage (8GB): ~$0.80/month  
Elastic IP: $3.60/month
Data Transfer: ~$0.10/month (minimal)
Total: ~$12/month (or ~$8.40 with free tier)

Savings vs Previous:
- No ALB: saves ~$16/month
- No Fargate: saves ~$20-30/month
- Single IP vs 7-8: saves ~$21-25/month
Total Savings: ~$57-71/month
`;

// Deployment instructions
export const deploymentInstructions = pulumi.interpolate`
=== DEPLOYMENT INSTRUCTIONS ===

1. Update GitHub Secrets:
   - STAGING_INSTANCE_ID: ${webServer.id}
   - AWS_REGION: ${region}

2. Configure DNS (Cloudflare):
   - Type: A Record
   - Name: staging
   - Value: ${eip.publicIp}
   - Proxy: Enabled (for HTTPS)

3. Monitor Setup Progress:
   aws ssm send-command --instance-ids ${webServer.id} --document-name "AWS-RunShellScript" --parameters 'commands=["tail -f /var/log/user-data.log"]' --region ${region}

4. Verify Deployment:
   curl http://${eip.publicIp}/health

5. For manual deployment:
   aws ssm send-command --instance-ids ${webServer.id} --document-name "AWS-RunShellScript" --parameters 'commands=["/home/ubuntu/deploy.sh"]' --region ${region}
`;

// Additional cost-saving suggestions
export const additionalSavings = `
=== ADDITIONAL COST SAVING OPTIONS ===

1. Use Spot Instances (save ~70%):
   - Add: spotOptions: { maxPrice: "0.0031" } to instance config
   - Risk: Instance may be terminated with 2-min notice

2. Schedule-based shutdown (save ~50%):
   - Implement Lambda to stop instance during off-hours
   - Start: 8 AM, Stop: 8 PM = 12 hours/day

3. Use IPv6 only (save $3.60/month):
   - Configure Cloudflare to proxy IPv4 to IPv6
   - Requires IPv6 support in your VPC

4. Reserved Instance (save ~30%):
   - 1-year commitment for staging
   - Only if long-term staging needed

5. ARM-based instance (save ~20%):
   - Use t4g.micro instead of t3.micro
   - Requires ARM-compatible build process
`;
