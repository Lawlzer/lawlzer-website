# GitHub Actions Deployment for Staging

## Overview

Due to memory constraints on the t3.micro instance, we've switched to building the application in GitHub Actions (free) and deploying only the built artifacts to EC2.

## What's Been Set Up

1. **EC2 Instance Prepared** ✅

   - Instance ID: `i-0f9f42a0ad229fae3`
   - Public IP: `18.205.183.127`
   - AWS CLI installed
   - Deployment script created at `/var/www/app/deploy-from-s3.sh`
   - PM2 configured for startup
   - Old failed builds cleaned up

2. **S3 Deployment Bucket** ✅

   - Bucket: `lawlzer-website-deployments`
   - IAM permissions added to EC2 role for S3 access

3. **GitHub Actions Workflow** ✅
   - File: `.github/workflows/deploy-staging-optimized.yml`
   - Builds application in GitHub (plenty of memory)
   - Uploads built artifacts to S3
   - Deploys to EC2 via SSM

## Next Steps

1. **Update GitHub Secrets**

   ```
   STAGING_INSTANCE_ID = i-0f9f42a0ad229fae3
   AWS_REGION = us-east-1
   ```

2. **Commit and Push Changes**

   ```bash
   git add .github/workflows/deploy-staging-optimized.yml
   git add staging-github-actions-deployment.md
   git commit -m "feat: Switch to GitHub Actions for builds due to EC2 memory constraints"
   git push origin staging
   ```

3. **Monitor the Deployment**
   - Go to GitHub Actions tab
   - Watch the "Build and Deploy to Staging EC2" workflow
   - Should take ~5-10 minutes total

## How It Works

1. **Build Phase** (GitHub Actions)

   - Checks out code
   - Installs dependencies with `--legacy-peer-deps`
   - Builds Next.js application
   - Creates deployment package with built files

2. **Deploy Phase** (GitHub Actions → EC2)
   - Uploads package to S3
   - Sends commands to EC2 via SSM
   - EC2 downloads package from S3
   - Replaces application files
   - Starts app with PM2

## Cost Impact

- **No additional costs** - GitHub Actions is free for public repos
- **Minimal S3 costs** - ~$0.01/month for storing deployment artifacts
- **Same EC2 costs** - Still using t3.micro instance

## Troubleshooting

If deployment fails:

1. Check GitHub Actions logs
2. Check EC2 logs: `aws ssm get-command-invocation --command-id <id> --instance-id i-0f9f42a0ad229fae3`
3. SSH alternative: Use SSM Session Manager (no SSH key needed)

## Manual Deployment (if needed)

If you need to manually deploy a build:

```bash
# On EC2 (via SSM)
cd /var/www/app
./deploy-from-s3.sh s3://lawlzer-website-deployments/deployments/staging/build-<commit-sha>.tar.gz
```
