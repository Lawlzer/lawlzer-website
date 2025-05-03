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

// Configuration for the GitHub OIDC Role
// const githubOrg = config.require('githubOrg'); // REMOVED - Not needed if role is manual
// const githubRepo = config.require('githubRepo'); // REMOVED - Not needed if role is manual

// --- Networking (using Default VPC) ---
// Get the default VPC using the core AWS provider
const defaultVpc = aws.ec2.getVpc({ default: true });
// Get subnet IDs from the default VPC
const defaultSubnets = defaultVpc.then(async (vpc) => aws.ec2.getSubnets({ filters: [{ name: 'vpc-id', values: [vpc.id] }] }));

// --- IAM ---

// OIDC Provider for GitHub Actions - REMOVED
// const githubOidcProvider = new aws.iam.OpenIdConnectProvider('github-oidc-provider', {
// 	url: 'https://token.actions.githubusercontent.com',
// 	clientIdLists: ['sts.amazonaws.com'],
// 	thumbprintLists: ['6938fd4d98bab03faadb97b34396831e3780aea1', '1c58a3a8518e8759bf075b76b750d4f2df264fcd'],
// });

// 1. Task Execution Role: Allows ECS tasks to pull images from ECR and send logs
const taskExecRole = new aws.iam.Role('task-exec-role', {
	assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: 'ecs-tasks.amazonaws.com' }),
	// Removed inline policy - will be managed as a separate resource
});

// Policy allowing the task execution role to read the specific Mongo secret
const taskExecSecretPolicy = new aws.iam.RolePolicy('task-exec-secret-policy', {
	name: 'AllowSecretManagerRead', // Explicit policy name
	role: taskExecRole.id, // Attach to the task execution role
	policy: mongoSecretArn.apply((arn) =>
		JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'secretsmanager:GetSecretValue',
					Effect: 'Allow',
					Resource: arn,
				},
				// Add kms:Decrypt here if using customer-managed KMS key for the secret
			],
		})
	),
});

// Attach the standard AWS managed policy for task execution
new aws.iam.RolePolicyAttachment('task-exec-policy-attachment', {
	role: taskExecRole.name,
	policyArn: aws.iam.ManagedPolicy.AmazonECSTaskExecutionRolePolicy,
});

// 3. Task Role: Permissions for the application running inside the container
const appTaskRole = new aws.iam.Role('app-task-role', {
	name: `${appName}-task-role`,
	assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({ Service: 'ecs-tasks.amazonaws.com' }),
	// Add inline policies here if your application needs specific AWS permissions at runtime
	inlinePolicies: [
		// Example: Allow reading from a specific S3 bucket
		// {
		//     name: "AllowAppS3Read",
		//     policy: JSON.stringify({
		//         Version: "2012-10-17",
		//         Statement: [{
		//             Action: ["s3:GetObject"],
		//             Effect: "Allow",
		//             Resource: "arn:aws:s3:::your-app-data-bucket/*"
		//         }]
		//     })
		// }
	],
});

// 4. GitHub Actions OIDC Role: Allows GitHub Actions to deploy to AWS - REMOVED
// const githubActionsPolicyDocument = pulumi.jsonStringify({ ... }); // REMOVED
// const githubActionsPolicy = new aws.iam.Policy('github-actions-policy', { ... }); // REMOVED
// const githubActionsRole = new aws.iam.Role('github-actions-role', { ... }); // REMOVED
// new aws.iam.RolePolicyAttachment('github-actions-policy-attachment', { ... }); // REMOVED

// --- ECR ---
// Create a repository to store the Docker images
const repo = new awsx.ecr.Repository('app-repo', {
	name: `${appName}-repo`,
	// Optional: Add lifecycle policy to clean up old images
	// lifecyclePolicy: { ... }
});
// Use .apply() to log the resolved value of the Output
repo.url.apply((url) => {
	console.log(`DEBUG: ECR Repo URL: ${url}`);
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
	{ dependsOn: [alb] }
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
// export const githubActionsRoleArn = githubActionsRole.arn; // REMOVED
