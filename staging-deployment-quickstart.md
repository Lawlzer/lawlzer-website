# Staging Deployment Quick Start Guide

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Pulumi CLI installed** and logged in
3. **Python 3.x** installed
4. **MongoDB URI** stored in AWS Systems Manager Parameter Store

## Quick Deployment Steps

### 1. Configure Environment

```bash
# If you don't have .env.deployment yet
cp deployment.env.example .env.deployment

# Edit with your values
# Required values:
# - AWS_REGION (e.g., us-east-1)
# - MONGO_SECRET_ARN (e.g., arn:aws:ssm:us-east-1:123456789:parameter/mongo-uri)
```

### 2. Run Optimized Deployment

```bash
python ./scripts/deploy-staging-optimized.py
```

This script will:

- ✅ Destroy any existing staging infrastructure
- ✅ Deploy new optimized t3.micro instance
- ✅ Configure with all learned fixes (--legacy-peer-deps, etc.)
- ✅ Wait for deployment to complete
- ✅ Verify the application is running
- ✅ Update your .env.deployment with new instance ID

### 3. Update GitHub Secrets

After deployment, update these secrets in GitHub:

- `STAGING_INSTANCE_ID`: (provided by the script)
- `AWS_REGION`: (from your .env.deployment)

Go to: `https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions`

### 4. Configure DNS (Optional)

In Cloudflare:

1. Add A record for `staging.lawlzer.com`
2. Point to the IP address provided by the script
3. Enable proxy for HTTPS

## Verification Commands

```bash
# Check instance status
aws ec2 describe-instances --instance-ids YOUR_INSTANCE_ID --region YOUR_REGION

# Check application logs
aws ssm send-command \
  --instance-ids YOUR_INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["pm2 logs --lines 50"]' \
  --region YOUR_REGION

# Test health endpoint
curl http://YOUR_IP/health
```

## Cost Monitoring

### Monthly costs:

- **With free tier**: ~$8.40/month
- **Without free tier**: ~$12/month
- **Savings**: ~$60-70/month vs previous setup

### Set up cost alert:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name staging-overspend \
  --alarm-description "Staging costs exceed $15" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 15 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD
```

## Troubleshooting

### Application not starting?

```bash
# Check user data logs
aws ssm send-command \
  --instance-ids YOUR_INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["tail -100 /var/log/user-data.log"]' \
  --region YOUR_REGION
```

### SSM commands failing?

- Wait 5-10 minutes after instance launch
- Verify instance has SSM role attached
- Check security group allows outbound HTTPS

### MongoDB connection issues?

```bash
# Verify secret exists
aws ssm get-parameter \
  --name YOUR_MONGO_SECRET_ARN \
  --with-decryption \
  --region YOUR_REGION
```

## Manual Deployment

If GitHub Actions fail, deploy manually:

```bash
aws ssm send-command \
  --instance-ids YOUR_INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["/home/ubuntu/deploy.sh"]' \
  --region YOUR_REGION
```

## Additional Optimizations

To save even more:

1. **Enable auto-shutdown** (save 50%):

   - Stop instance at 8 PM, start at 8 AM
   - Use Lambda + CloudWatch Events

2. **Use spot instances** (save 70%):

   - Add to Pulumi config: `spotOptions: { maxPrice: "0.0031" }`
   - Risk: 2-minute termination notice

3. **Switch to ARM** (save 20%):
   - Use t4g.micro instead of t3.micro
   - Requires ARM-compatible builds

## Support

- Check `./docs/staging-cost-optimization-summary.md` for detailed cost breakdown
- Review `./plans/current.md` for implementation status
- Run MCP server (`npx -y playwright-mcp`) to test the deployed site
