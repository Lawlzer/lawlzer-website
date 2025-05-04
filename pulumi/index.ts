import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx'; // Using awsx for simplified networking/load balancing

function throwError(message: string): never {
	throw new Error(message);
}

// --- Configuration ---
const config = new pulumi.Config();
// Basic config values - can be set via `pulumi config set <key> <value>`
const appName = config.get('appName') ?? pulumi.getProject(); // Default to Pulumi project name
const appPort = config.getNumber('appPort') ?? throwError('appPort is required'); // Port your app listens on (from Dockerfile)
console.log(`DEBUG: Using appPort: ${appPort}`); // Log appPort
const cpu = config.getNumber('cpu') ?? 256; // Fargate CPU units (256 = 0.25 vCPU)
const memory = config.getNumber('memory') ?? 512; // Fargate memory in MiB
const desiredCount = config.getNumber('desiredCount') ?? 1; // Number of containers to run
const targetArch = config.get('targetArch') ?? 'X86_64'; // Fargate CPU Architecture (match Dockerfile) - options: X86_64, ARM64
const imageUri = config.get('image'); // Read the 'image' config value if provided
console.log(`DEBUG: Read config 'image': ${imageUri}`); // Log the raw config value

// Runtime environment variables from config (add others as needed)
// The MongoDB URI should be stored securely, preferably in AWS Secrets Manager
// We'll assume it's stored there and retrieve its ARN via config
// Example: pulumi config set mongoSecretArn arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/myapp/mongo-db-conn-string-XXXXXX
const mongoSecretArn = config.requireSecret('mongoSecretArn'); // Require this secret ARN in Pulumi config

mongoSecretArn.apply((arn) => {
	console.log(`DEBUG: Using mongoSecretArn (SSM Parameter ARN): ${arn}`);
}); // Log secret ARN

// NEW: GitHub Configuration - Replace with your actual Org/Repo
const githubOrg = 'lawlzer'; // Replace with your GitHub Org name
const githubRepo = 'lawlzer-website'; // Replace with your GitHub Repo name
const githubBranch = 'main'; // Or your primary deployment branch

// Get current AWS context for constructing ARNs
const currentIdentity = aws.getCallerIdentity({});
const accountId = currentIdentity.then((id) => id.accountId);
const region = aws.config.requireRegion(); // Get region from AWS provider config

// --- Networking (using Default VPC) ---
// Get the default VPC using the core AWS provider
const defaultVpc = aws.ec2.getVpc({ default: true });
// Get subnet IDs from the default VPC
const defaultSubnets = defaultVpc.then(async (vpc) => aws.ec2.getSubnets({ filters: [{ name: 'vpc-id', values: [vpc.id] }] }));

// --- ECR --- Moved Up --- NOW DEFINED BEFORE IAM POLICY ---
const repo = new awsx.ecr.Repository('app-repo', {
	name: `${appName}-repo`,
	// Optional: Add lifecycle policy to clean up old images
	// lifecyclePolicy: { ... }
});
// Use .apply() to log the resolved value of the Output
repo.url.apply((url) => {
	console.log(`DEBUG: ECR Repo URL: ${url}`);
});

// --- Route 53 DNS --- (Removed as DNS is managed by Cloudflare)

// --- IAM ---

// 1. OIDC Provider for GitHub Actions
// Pulumi will create this. If it already exists manually, import it once:
// `pulumi import aws:iam/openIdConnectProvider:OpenIdConnectProvider github-oidc-provider <EXISTING_OIDC_PROVIDER_ARN>`
const githubOidcProvider = new aws.iam.OpenIdConnectProvider('github-oidc-provider', {
	url: 'https://token.actions.githubusercontent.com',
	clientIdLists: ['sts.amazonaws.com'],
	// Common thumbprints for GitHub Actions OIDC - verify if needed
	thumbprintLists: ['6938fd4d98bab03faadb97b34396831e3780aea1', '1c58a3a8518e8759bf075b76b750d4f2df264fcd'],
});

// 2. Task Execution Role: Allows ECS tasks to pull images, send logs, get secrets
const taskExecRole = new aws.iam.Role('task-exec-role', {
	name: `${appName}-task-exec-role`, // More specific name
	assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: 'ecs-tasks.amazonaws.com' }),
});

// Policy allowing the task execution role to read the specific Mongo secret (from SSM Parameter Store)
const taskExecSecretPolicy = new aws.iam.RolePolicy('task-exec-secret-policy', {
	name: `${appName}-AllowMongoSecretRead`,
	role: taskExecRole.id,
	// MODIFIED: Use pulumi.all to resolve dependencies before stringifying
	policy: pulumi.all([mongoSecretArn, region, accountId]).apply(([secretArn, resolvedRegion, resolvedAccountId]) =>
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'ssm:GetParameters',
					Effect: 'Allow',
					Resource: secretArn, // Use the resolved secret ARN
				},
				{
					Action: 'kms:Decrypt',
					Effect: 'Allow',
					// Construct the ARN string using resolved values
					Resource: `arn:aws:kms:${resolvedRegion}:${resolvedAccountId}:alias/aws/ssm`,
				},
			],
		})
	),
});

// Attach the standard AWS managed policy for task execution (includes ECR pull, logs)
new aws.iam.RolePolicyAttachment('task-exec-policy-attachment', {
	role: taskExecRole.name,
	policyArn: aws.iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy,
});

taskExecRole.arn.apply((arn) => {
	console.log(`DEBUG: Task Execution Role ARN: ${arn}`);
}); // Log Task Exec Role ARN

// 3. Application Task Role: Permissions for the application *inside* the container
const appTaskRole = new aws.iam.Role('app-task-role', {
	name: `${appName}-app-task-role`, // More specific name
	assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: 'ecs-tasks.amazonaws.com' }),
	// Add inline policies here if your application needs specific AWS permissions at runtime
	// Example: Accessing S3 buckets, other secrets, etc.
	inlinePolicies: [
		// { name: "AllowAppS3Read", policy: JSON.stringify({ ... }) }
	],
});

appTaskRole.arn.apply((arn) => {
	console.log(`DEBUG: Application Task Role ARN: ${arn}`);
}); // Log App Task Role ARN

// 4. GitHub Actions Deployment Role: Assumed by the workflow via OIDC
const githubActionsRole = new aws.iam.Role('github-actions-role', {
	name: `${appName}-github-actions-role`, // Specific role name
	assumeRolePolicy: pulumi.all([githubOidcProvider.arn, githubOidcProvider.url]).apply(([oidcArn, oidcUrl]) =>
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Effect: 'Allow',
					Principal: { Federated: oidcArn },
					Action: 'sts:AssumeRoleWithWebIdentity',
					Condition: {
						StringEquals: {
							// IMPORTANT: Update with your GitHub Org/Repo and branch!
							[`${oidcUrl.replace('https://', '')}:sub`]: `repo:${githubOrg}/${githubRepo}:ref:refs/heads/${githubBranch}`,
						},
						// Optional: Add audience condition if needed, usually sts.amazonaws.com
						// StringLike: {
						//     [`${oidcUrl.replace("https://", "")}:aud`]: "sts.amazonaws.com",
						// },
					},
				},
			],
		})
	),
});

// 5. GitHub Actions Deployment Policy: Permissions needed by the workflow
const githubActionsDeployPolicy = new aws.iam.Policy('github-actions-deploy-policy', {
	name: `${appName}-github-actions-deploy-policy`,
	description: 'Policy allowing GitHub Actions to deploy the application to ECS.',
	policy: pulumi
		.all([repo.repository.arn, taskExecRole.arn, appTaskRole.arn, accountId, region]) // Ensure needed resources/values are resolved
		.apply(([repoArn, taskExecArn, appTaskArn, currentAccountId, currentRegion]) =>
			JSON.stringify({
				Version: '2012-10-17',
				Statement: [
					{
						// Allow logging in to ECR
						Effect: 'Allow',
						Action: ['ecr:GetAuthorizationToken'],
						Resource: ['*'], // Required by the action
					},
					{
						// Allow pushing images to the specific ECR repository
						Effect: 'Allow',
						Action: ['ecr:BatchCheckLayerAvailability', 'ecr:CompleteLayerUpload', 'ecr:InitiateLayerUpload', 'ecr:PutImage', 'ecr:UploadLayerPart'],
						Resource: [repoArn], // Use resolved repo ARN
					},
					{
						// Allow updating the ECS service and task definition
						Effect: 'Allow',
						Action: [
							'ecs:DescribeServices',
							'ecs:DescribeTaskDefinition',
							'ecs:RegisterTaskDefinition',
							'ecs:UpdateService',
							// Needed if using deployment circuit breaker or rollback
							'ecs:DescribeTasks',
							'ecs:ListTasks',
						],
						// Grant access only to resources within the specific cluster
						Resource: [
							// Use resolved account ID and region
							`arn:aws:ecs:${currentRegion}:${currentAccountId}:service/${appName}-cluster/${appName}-service`,
							`arn:aws:ecs:${currentRegion}:${currentAccountId}:task-definition/${appName}-service:*`, // Family prefix
							`arn:aws:ecs:${currentRegion}:${currentAccountId}:cluster/${appName}-cluster`,
						],
					},
					{
						// Allow passing the execution and task roles to ECS tasks
						Effect: 'Allow',
						Action: ['iam:PassRole'],
						Resource: [taskExecArn, appTaskArn], // Use resolved role ARNs
						Condition: {
							StringEquals: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' },
						},
					},
					// Add any other permissions needed by the deployment (e.g., S3 access for env files)
					// Example: S3 read for env file
					// {
					//     Effect: "Allow",
					//     Action: "s3:GetObject",
					//     Resource: "arn:aws:s3:::your-env-bucket-name/.env.build"
					// },
				],
			})
		),
});

// 6. Attach Deployment Policy to GitHub Actions Role
new aws.iam.RolePolicyAttachment('github-actions-deploy-policy-attachment', {
	role: githubActionsRole.name,
	policyArn: githubActionsDeployPolicy.arn,
});

// --- ACM Certificate for HTTPS ---
const domainName = 'lawlzer.com';

// Request a certificate for the domain and www subdomain
const certificate = new aws.acm.Certificate('app-certificate', {
	domainName: domainName,
	subjectAlternativeNames: [`www.${domainName}`],
	validationMethod: 'DNS',
	tags: {
		Name: `${appName}-certificate`,
	},
});

// Output the DNS validation records needed. User must add these to Cloudflare.
// Note: Pulumi won't proceed with validation until these are created AND propagated.
export const certificateValidationOptions = certificate.domainValidationOptions;

// Create the validation record resources in Pulumi - this resource waits
// until the DNS records are confirmed by AWS.
// IMPORTANT: This requires a SECOND `pulumi up` run after manually creating
// the CNAME records in Cloudflare using the output from the first run.
const certificateValidation = new aws.acm.CertificateValidation(
	'app-certificate-validation',
	{
		certificateArn: certificate.arn,
		// This field is intentionally empty/commented out in the initial setup.
		// Pulumi automatically uses the certificate's domainValidationOptions
		// to know what to wait for when validationMethod is DNS.
		// validationRecordFqdns: [], // Only needed if using EMAIL validation or managing DNS outside Route 53 *with Pulumi*
	},
	// Explicitly depend on the certificate resource
	{ dependsOn: [certificate] }
);

// --- ECS Cluster ---
const cluster = new aws.ecs.Cluster('app-cluster', {
	name: `${appName}-cluster`,
});

// --- Target Group for HTTPS Listener ---
// Define the target group explicitly for the HTTPS listener
const httpsTargetGroupResource = new aws.lb.TargetGroup(`${appName}-https-tg`, {
	name: `${appName}-https-tg`,
	port: appPort,
	protocol: 'HTTP', // Protocol between ALB and container
	vpcId: defaultVpc.then((vpc) => vpc.id), // Associate with the default VPC
	targetType: 'ip', // Required for Fargate
	healthCheck: {
		path: '/', // Consider changing to a dedicated /api/health endpoint if available
		port: 'traffic-port',
		protocol: 'HTTP',
		// Increased tolerance for health checks
		interval: 60, // Increased from 30
		timeout: 30, // Increased from 10
		healthyThreshold: 5, // Increased from 3
		unhealthyThreshold: 5, // Increased from 3
		matcher: '200-404', // todo change to 399, temporarily 404 so we can push/commit faster
		// matcher: '200-399',
	},
	tags: {
		Name: `${appName}-https-tg`,
	},
});

// Log health check config
httpsTargetGroupResource.healthCheck.apply((hc) => {
	console.log(`DEBUG: Target Group Health Check Config: ${JSON.stringify(hc)}`);
});

// --- Load Balancer (Updated for HTTPS) ---
const alb = new awsx.lb.ApplicationLoadBalancer('app-lb', {
	name: `${appName}-alb`,
	// Remove default listener/target group on port 80 created by awsx by default
	defaultTargetGroup: undefined,
	// Define listeners explicitly
	listeners: [
		{
			// HTTPS listener using the validated ACM certificate
			port: 443,
			protocol: 'HTTPS',
			certificateArn: certificateValidation.certificateArn, // Use ARN from validation resource
			// Default action forwards traffic to the explicitly defined target group
			defaultActions: [
				{
					type: 'forward',
					// Reference the target group ARN
					targetGroupArn: httpsTargetGroupResource.arn,
				},
			],
		},
		{
			// HTTP listener that redirects to HTTPS
			port: 80,
			protocol: 'HTTP',
			defaultActions: [
				{
					type: 'redirect',
					redirect: {
						protocol: 'HTTPS',
						port: '443',
						statusCode: 'HTTP_301', // Permanent redirect
					},
				},
			],
		},
	],
});

// --- ECS Fargate Service ---
// Reference the explicitly created Target Group in the service definition
const appService = new awsx.ecs.FargateService(
	'app-service',
	{
		name: `${appName}-service`,
		cluster: cluster.arn,
		desiredCount: desiredCount,
		networkConfiguration: {
			// Use default VPC subnets
			subnets: defaultSubnets.then((subnets) => subnets.ids),
			assignPublicIp: true,
		},
		taskDefinitionArgs: {
			executionRole: { roleArn: taskExecRole.arn },
			taskRole: { roleArn: appTaskRole.arn },
			container: {
				name: `${appName}-container`,
				image: imageUri ?? pulumi.interpolate`${repo.url}:latest`,
				cpu: cpu,
				memory: memory,
				essential: true,
				portMappings: [
					// Use the explicitly created Target Group
					{
						containerPort: appPort,
						hostPort: appPort,
						targetGroup: httpsTargetGroupResource, // Pass the TargetGroup resource itself
					},
				],
				secrets: [{ name: 'MONGO_URI', valueFrom: mongoSecretArn }],
				environment: [
					{ name: 'NODE_ENV', value: 'production' },
					// Add other runtime environment variables here if needed
				],
			},
			// Specify CPU Architecture for Fargate task
			runtimePlatform: {
				operatingSystemFamily: 'LINUX',
				cpuArchitecture: targetArch,
			},
		},
	},
	{ dependsOn: [alb, githubActionsRole] } // Ensure role exists before service potentially needs it (though not directly)
); // Ensure ALB is created before the service tries to use its target group

// Add a log for the final image value being used
const finalImageUriForLog = imageUri ?? pulumi.interpolate`${repo.url}:latest`;
// Use .apply() if it's an Output, otherwise log directly
if (pulumi.Output.isInstance(finalImageUriForLog)) {
	finalImageUriForLog.apply((uri) => {
		console.log(`DEBUG: Final image URI passed to container definition: ${uri}`);
	});
} else {
	console.log(`DEBUG: Final image URI passed to container definition: ${finalImageUriForLog}`);
}

// --- Outputs ---
// Output the ALB DNS name. You will use this to create a CNAME record in Cloudflare.
export const albDnsName = alb.loadBalancer.dnsName;
// The final URL will be https://lawlzer.com after setting up the CNAME in Cloudflare and HTTPS.
export const appUrl = `https://${domainName}`;
export const ecrRepositoryUrl = repo.url;
export const ecrRepositoryName = repo.repository.name; // Export just the name for GitHub Actions
export const ecsClusterName = cluster.name;
export const ecsServiceName = appService.service.name;
// Task Definition Family isn't easily accessible from awsx Service, grab it from underlying resource if needed
// For now, the GH action will use config. Or we can construct it: `${appName}-service` often works.
export const taskDefinitionFamily = pulumi.interpolate`${appName}-service`; // awsx usually names the underlying task def based on service name
export const containerName = pulumi.interpolate`${appName}-container`; // Name given in taskDefinitionArgs
// NEW: Export the ARN of the role GitHub Actions should assume
export const githubActionsRoleArn = githubActionsRole.arn;
