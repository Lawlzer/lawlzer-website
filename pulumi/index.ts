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
const cpu = config.getNumber('cpu') ?? 256; // Fargate CPU units (256 = 0.25 vCPU)
const memory = config.getNumber('memory') ?? 512; // Fargate memory in MiB
const desiredCount = config.getNumber('desiredCount') ?? 1; // Number of containers to run
const targetArch = config.get('targetArch') ?? 'ARM64'; // Fargate CPU Architecture (match Dockerfile) - options: X86_64, ARM64
const imageUri = config.get('image'); // Read the 'image' config value if provided

// Runtime environment variables from config (add others as needed)
// The MongoDB URI should be stored securely, preferably in AWS Secrets Manager
// We'll assume it's stored there and retrieve its ARN via config
// Example: pulumi config set mongoSecretArn arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/myapp/mongo-db-conn-string-XXXXXX
const mongoSecretArn = config.requireSecret('mongoSecretArn'); // Require this secret ARN in Pulumi config

// Configuration for the GitHub OIDC Role
const githubOrg = config.require('githubOrg'); // Your GitHub username or organization
const githubRepo = config.require('githubRepo'); // Your GitHub repository name (e.g., lawlzer-website)

// --- Networking (using Default VPC) ---
// Get the default VPC using the core AWS provider
const defaultVpc = aws.ec2.getVpc({ default: true });
// Get subnet IDs from the default VPC
const defaultSubnets = defaultVpc.then(async (vpc) => aws.ec2.getSubnets({ filters: [{ name: 'vpc-id', values: [vpc.id] }] }));

// --- IAM ---

// OIDC Provider for GitHub Actions
const githubOidcProvider = new aws.iam.OpenIdConnectProvider('github-oidc-provider', {
	url: 'https://token.actions.githubusercontent.com',
	clientIdLists: ['sts.amazonaws.com'],
	// Use a common thumbprint for GitHub Actions OIDC. Verify this against AWS docs if needed.
	// Updated to include both known thumbprints as per GitHub/AWS recommendations (June 2023)
	thumbprintLists: ['6938fd4d98bab03faadb97b34396831e3780aea1', '1c58a3a8518e8759bf075b76b750d4f2df264fcd'],
});

// 1. Task Execution Role: Allows ECS tasks to pull images from ECR and send logs
const taskExecRole = new aws.iam.Role('task-exec-role', {
	assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: 'ecs-tasks.amazonaws.com' }),
	// Add inline policy to allow reading the specific SSM parameter
	inlinePolicies: [
		{
			name: 'AllowSSMParameterRead',
			policy: mongoSecretArn.apply((arn) =>
				JSON.stringify({
					Version: '2012-10-17',
					Statement: [
						{
							Action: 'ssm:GetParameters',
							Effect: 'Allow',
							Resource: arn, // Use the ARN from the config
						},
						// If using KMS CMK for SecureString, might need kms:Decrypt here too
					],
				})
			),
		},
	],
});
new aws.iam.RolePolicyAttachment('task-exec-policy-attachment', {
	role: taskExecRole.name,
	policyArn: aws.iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy,
});

// 2. GitHub Actions OIDC Role: Allows GitHub Actions to deploy to AWS
const githubActionsRole = new aws.iam.Role('github-actions-role', {
	name: `${appName}-github-actions-role`,
	assumeRolePolicy: pulumi.jsonStringify({
		Version: '2012-10-17',
		Statement: [
			{
				Effect: 'Allow',
				Principal: { Federated: githubOidcProvider.arn }, // Reference the provider ARN
				Action: 'sts:AssumeRoleWithWebIdentity',
				Condition: {
					StringEquals: {
						'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
						// Scope the role to your specific repository
						'token.actions.githubusercontent.com:sub': `repo:${githubOrg}/${githubRepo}:ref:refs/heads/main`, // Restrict to main branch pushes
					},
				},
			},
		],
	}),
	// Define inline policy for necessary permissions
	inlinePolicies: [
		{
			name: 'GitHubActionsECSPermissions',
			policy: pulumi.jsonStringify({
				Version: '2012-10-17',
				Statement: [
					// --- Core Deployment Permissions ---
					{ Action: ['ecr:GetAuthorizationToken'], Effect: 'Allow', Resource: '*' }, // ECR Login
					{
						Action: ['ecr:BatchCheckLayerAvailability', 'ecr:InitiateLayerUpload', 'ecr:UploadLayerPart', 'ecr:CompleteLayerUpload', 'ecr:PutImage'],
						Effect: 'Allow',
						Resource: pulumi.interpolate`arn:aws:ecr:${aws.config.region}:${aws.getCallerIdentityOutput().accountId}:repository/${appName}-repo`, // ECR Push
					},
					{
						Action: ['ecs:UpdateService', 'ecs:RegisterTaskDefinition'], // Core actions to update service and task def
						Effect: 'Allow',
						Resource: '*', // Scoping is complex, be cautious in production
					},
					{ Action: ['secretsmanager:GetSecretValue'], Effect: 'Allow', Resource: mongoSecretArn }, // Read runtime secret
					{ Action: ['s3:GetObject'], Effect: 'Allow', Resource: 'arn:aws:s3:::lawlzer-website-env/.env' }, // Read build-time env
					{ Action: ['iam:PassRole'], Effect: 'Allow', Resource: taskExecRole.arn }, // Allow passing Task Execution role

					// --- Permissions needed for Pulumi Refresh/Up operations ---
					{
						Action: ['ecs:DescribeClusters', 'ecs:DescribeServices', 'ecs:DescribeTaskDefinition', 'iam:GetRole', 'iam:GetRolePolicy', 'iam:ListAttachedRolePolicies', 'iam:ListRolePolicies', 'iam:GetOpenIDConnectProvider', 'elasticloadbalancing:DescribeListeners', 'elasticloadbalancing:DescribeLoadBalancers', 'elasticloadbalancing:DescribeTargetGroups', 'elasticloadbalancing:DescribeListenerAttributes', 'elasticloadbalancing:DescribeLoadBalancerAttributes', 'elasticloadbalancing:DescribeTargetGroupAttributes', 'elasticloadbalancing:DescribeTags', 'ecr:DescribeRepositories', 'ecr:GetLifecyclePolicy', 'ecr:ListTagsForResource', 'logs:DescribeLogGroups', 'logs:ListTagsForResource', 'ec2:DescribeSecurityGroups', 'ec2:DescribeVpcs', 'ec2:DescribeSubnets'],
						Effect: 'Allow',
						Resource: '*', // Scoping these broadly is often necessary for Pulumi refresh
					},
				],
			}),
		},
	],
});

// --- ECR ---
// Create a repository to store the Docker images
const repo = new awsx.ecr.Repository('app-repo', {
	name: `${appName}-repo`,
	// Optional: Add lifecycle policy to clean up old images
	// lifecyclePolicy: { ... }
});

// --- ECS Cluster ---
const cluster = new aws.ecs.Cluster('app-cluster', {
	name: `${appName}-cluster`,
});

// --- Load Balancer ---
// Using awsx.lb.ApplicationLoadBalancer for easier setup
// Let awsx determine subnets from the default VPC context
const alb = new awsx.lb.ApplicationLoadBalancer('app-lb', {
	name: `${appName}-alb`,
	// No explicit target group port needed since appPort is now 80 (the default)
	// defaultTargetGroupPort: appPort, // REMOVED
	// No explicit subnets needed here if using default VPC
	// external: true, // awsx determines this based on subnets implicitly
	// Security groups are managed by awsx component
});

// --- ECS Fargate Service ---
const appService = new awsx.ecs.FargateService(
	'app-service',
	{
		name: `${appName}-service`,
		cluster: cluster.arn,
		desiredCount: desiredCount,
		networkConfiguration: {
			// Use default VPC subnets
			subnets: defaultSubnets.then((subnets) => subnets.ids), // Use the public subnet IDs from the lookup
			assignPublicIp: true, // Required for Fargate tasks in public subnets to pull images if no NAT Gateway
			// Security groups are managed by awsx component
		},
		taskDefinitionArgs: {
			executionRole: { roleArn: taskExecRole.arn },
			// Define the container using the ECR image
			// The image URI will be dynamically built using the repo URL and a tag configured during deployment
			container: {
				name: `${appName}-container`,
				image: imageUri ?? pulumi.interpolate`${repo.url}:latest`,
				cpu: cpu,
				memory: memory,
				essential: true,
				portMappings: [
					{
						containerPort: appPort,
						hostPort: appPort, // Add hostPort, must match containerPort for awsvpc mode
						targetGroup: alb.defaultTargetGroup, // Connect container to the ALB's default target group
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
	{ dependsOn: [alb] }
); // Ensure ALB is created before the service tries to use its target group

// --- Outputs ---
export const appUrl = pulumi.interpolate`http://${alb.loadBalancer.dnsName}`; // URL to access the app
export const ecrRepositoryUrl = repo.url;
export const ecrRepositoryName = repo.repository.name; // Export just the name for GitHub Actions
export const ecsClusterName = cluster.name;
export const ecsServiceName = appService.service.name;
// Task Definition Family isn't easily accessible from awsx Service, grab it from underlying resource if needed
// For now, the GH action will use config. Or we can construct it: `${appName}-service` often works.
export const taskDefinitionFamily = pulumi.interpolate`${appName}-service`; // awsx usually names the underlying task def based on service name
export const containerName = pulumi.interpolate`${appName}-container`; // Name given in taskDefinitionArgs
export const githubActionsRoleArn = githubActionsRole.arn; // ARN for GitHub Actions OIDC config
