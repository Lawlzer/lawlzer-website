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
console.log(`DEBUG: Read config 'image': ${imageUri}`); // Log the raw config value

// Runtime environment variables from config (add others as needed)
// The MongoDB URI should be stored securely, preferably in AWS Secrets Manager
// We'll assume it's stored there and retrieve its ARN via config
// Example: pulumi config set mongoSecretArn arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/myapp/mongo-db-conn-string-XXXXXX
const mongoSecretArn = config.requireSecret('mongoSecretArn'); // Require this secret ARN in Pulumi config

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
	policy: mongoSecretArn.apply(
		(
			arn // Assuming mongoSecretArn holds the SSM Parameter ARN
		) =>
			JSON.stringify({
				Version: '2012-10-17',
				Statement: [
					{
						Action: 'ssm:GetParameters', // CHANGED from secretsmanager:GetSecretValue
						Effect: 'Allow',
						Resource: arn, // The ARN of the SSM Parameter
					},
					// If the SSM parameter is KMS encrypted with a customer key,
					// you also need kms:Decrypt permission on that key here.
					// {
					//     Action: "kms:Decrypt",
					//     Effect: "Allow",
					//     Resource: "arn:aws:kms:<region>:<account-id>:key/<your-kms-key-id>"
					// }
				],
			})
	),
});

// Attach the standard AWS managed policy for task execution (includes ECR pull, logs)
new aws.iam.RolePolicyAttachment('task-exec-policy-attachment', {
	role: taskExecRole.name,
	policyArn: aws.iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy,
});

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
			taskRole: { roleArn: appTaskRole.arn }, // Explicitly assign the task role
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
	{ dependsOn: [alb, githubActionsRole] } // Ensure role exists before service potentially needs it (though not directly)
); // Ensure ALB is created before the service tries to use its target group

// Add a log for the final image value being used
const finalImageUriForLog = imageUri ?? pulumi.interpolate`${repo.url}:latest`;
// Use .apply() if it's an Output, otherwise log directly
if (pulumi.Output.isInstance(finalImageUriForLog)) {
	finalImageUriForLog.apply((uri) => {
		console.log(`DEBUG: Final image URI for container: ${uri}`);
	});
} else {
	console.log(`DEBUG: Final image URI for container: ${finalImageUriForLog}`);
}

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
// NEW: Export the ARN of the role GitHub Actions should assume
export const githubActionsRoleArn = githubActionsRole.arn;
