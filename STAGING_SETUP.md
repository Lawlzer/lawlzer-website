# Staging Environment Setup - Fully Automated (No SSH Required)

## Overview

We've set up a fully automated AWS infrastructure using a single EC2 t2.micro instance for the staging environment. Everything is configured through Pulumi and AWS Systems Manager (SSM) - **no SSH access is ever needed**.

## Infrastructure Details

### EC2 Instance

- **Instance ID**: i-000c051d1c069192f
- **IP Address**: 13.216.140.18
- **Instance Type**: t2.micro (free tier eligible)
- **Region**: us-east-1
- **URL**: http://13.216.140.18 (will be available after setup completes)
- **Future URL**: https://staging.lawlzer.com (after DNS setup)

### Cost Savings

- **Previous Setup**: Fargate + ALB with 7-8 public IPs = ~$25-30/month for IPs alone
- **New Setup**: Single EC2 instance with 1 public IP = $3.60/month for IP
- **Savings**: ~$21-26/month on IP addresses alone

## Automated Setup Process

The EC2 instance automatically configures itself using a user data script that:

1. Installs Node.js 20, nginx, PM2, git, and AWS CLI
2. Clones your repository from GitHub
3. Installs npm dependencies
4. Builds the application
5. Configures nginx as a reverse proxy
6. Starts the application with PM2
7. Sets up PM2 to restart on reboot

**This process takes approximately 3-5 minutes to complete.**

## Checking Status (No SSH Required)

### Using the Status Check Script

```bash
bash ./scripts/check-staging-no-ssh.sh
```

This script uses AWS SSM to check:

- If setup is complete
- PM2 process status
- Application HTTP status
- Recent setup logs
- Nginx status

### Manual Status Check Commands

```bash
# Check if setup is complete
aws ssm send-command --instance-ids i-000c051d1c069192f --document-name "AWS-RunShellScript" --parameters 'commands=["test -f /var/lib/cloud/instance/user-data-finished && echo Setup complete || echo Setup in progress"]' --region us-east-1

# Check PM2 processes
aws ssm send-command --instance-ids i-000c051d1c069192f --document-name "AWS-RunShellScript" --parameters 'commands=["pm2 list"]' --region us-east-1

# Check setup logs
aws ssm send-command --instance-ids i-000c051d1c069192f --document-name "AWS-RunShellScript" --parameters 'commands=["tail -50 /var/log/user-data.log"]' --region us-east-1

# Get command output (replace COMMAND_ID)
aws ssm get-command-invocation --command-id <COMMAND_ID> --instance-id i-000c051d1c069192f --region us-east-1
```

## Next Steps

### 1. DNS Configuration (Required)

Add the following DNS record in Cloudflare:

```
Type:    A
Name:    staging
Content: 13.216.140.18
TTL:     Auto
Proxy:   OFF (initially, can enable after SSL setup)
```

### 2. SSL Certificate Setup (After DNS)

Once DNS propagates, run this command (no SSH needed):

```bash
aws ssm send-command --instance-ids i-000c051d1c069192f --document-name "AWS-RunShellScript" --parameters 'commands=["sudo apt-get install -y certbot python3-certbot-nginx","sudo certbot --nginx -d staging.lawlzer.com --non-interactive --agree-tos --email your-email@example.com"]' --region us-east-1
```

### 3. Enable Cloudflare Proxy (After SSL)

After SSL is working, you can enable Cloudflare proxy for additional security and CDN benefits.

## Deployment

### Automatic Deployment (GitHub Actions)

Simply push to the `staging` branch:

```bash
git push origin staging
```

The GitHub Actions workflow (`.github/workflows/deploy-staging.yml`) will automatically deploy using SSM.

### Manual Deployment (No SSH)

```bash
aws ssm send-command --instance-ids i-000c051d1c069192f --document-name "AWS-RunShellScript" --parameters 'commands=["sudo /home/ubuntu/deploy.sh"]' --region us-east-1
```

## Troubleshooting (No SSH Required)

### View Application Logs

```bash
aws ssm send-command --instance-ids i-000c051d1c069192f --document-name "AWS-RunShellScript" --parameters 'commands=["pm2 logs lawlzer-website-staging --lines 100"]' --region us-east-1
```

### View Nginx Logs

```bash
aws ssm send-command --instance-ids i-000c051d1c069192f --document-name "AWS-RunShellScript" --parameters 'commands=["sudo tail -50 /var/log/nginx/error.log"]' --region us-east-1
```

### Restart Application

```bash
aws ssm send-command --instance-ids i-000c051d1c069192f --document-name "AWS-RunShellScript" --parameters 'commands=["pm2 restart lawlzer-website-staging"]' --region us-east-1
```

## Pulumi Commands

### View Stack Outputs

```bash
cd pulumi
pulumi stack select staging
pulumi stack output
```

### Update Infrastructure

```bash
cd pulumi
pulumi stack select staging
pulumi up
```

Note: If you update the user data script, you'll need to terminate and recreate the instance for changes to take effect.

### Destroy Infrastructure (if needed)

```bash
cd pulumi
pulumi stack select staging
pulumi destroy
```

## Architecture

The new simplified architecture:

- **Cloudflare** → **EC2 Instance** → **Nginx** → **Node.js App (PM2)**

All configuration is automated through:

- **Pulumi**: Infrastructure as Code
- **User Data Script**: Initial instance setup
- **AWS SSM**: Remote command execution (no SSH)
- **GitHub Actions**: Automated deployments

## Security Benefits

- **No SSH Keys**: No need to manage SSH keys or worry about key rotation
- **IAM-Based Access**: All access is controlled through IAM roles
- **Audit Trail**: All SSM commands are logged in CloudTrail
- **No Open SSH Port**: Can remove SSH from security group if desired

## Production Migration

When ready to migrate production:

1. Create a `prod` Pulumi stack with similar configuration
2. Update domain from `staging.lawlzer.com` to `lawlzer.com`
3. Deploy and test thoroughly
4. Update DNS records
5. Monitor for issues

## Key Principle

**Everything is automated through Infrastructure as Code (Pulumi) and AWS Systems Manager. SSH access is never required for setup, deployment, or troubleshooting.**
