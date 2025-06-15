# Staging Environment Cost Optimization Summary

## Overview

This document summarizes the cost optimizations implemented for migrating from a complex AWS Fargate/ALB setup to a simple EC2-based staging environment.

## Cost Comparison

### Previous Architecture (Fargate + ALB)

- **ALB (Application Load Balancer)**: ~$16/month
- **Fargate Tasks**: ~$20-30/month
- **Multiple Public IPs (7-8)**: ~$25-28/month ($3.60 per IP)
- **Other services**: ~$10/month
- **Total**: ~$70-80/month

### Optimized Architecture (Single EC2)

- **EC2 t3.micro**: ~$7.50/month (or free with AWS free tier)
- **EBS Storage (8GB gp3)**: ~$0.80/month
- **Single Elastic IP**: $3.60/month
- **Data Transfer**: ~$0.10/month
- **Total**: ~$12/month (or ~$8.40 with free tier)

### **Total Savings: ~$60-70/month (85% reduction)**

## Key Optimizations Implemented

### 1. Instance Type Optimization

- Changed from `t2.micro` to `t3.micro`
- Better price/performance ratio
- Burstable performance for staging workloads

### 2. Storage Optimization

- Reduced EBS volume from 20GB to 8GB (sufficient for staging)
- Changed from `gp2` to `gp3` volume type (cheaper and faster)
- Enabled `deleteOnTermination` to avoid orphaned volumes

### 3. Network Optimization

- Single public IP instead of 7-8 IPs (saves ~$25/month)
- No ALB needed - direct nginx proxy
- HTTPS via Cloudflare (free)

### 4. Application Optimization

- Added nginx gzip compression
- Limited Node.js memory to 512MB
- Implemented PM2 for process management
- Log rotation to prevent disk fill

### 5. Monitoring Optimization

- Disabled detailed monitoring (saves $3.50/month)
- Basic CloudWatch alarms only
- Health endpoint for simple monitoring

## Additional Cost Saving Options

### 1. Spot Instances (Save ~70%)

```typescript
spotOptions: {
    maxPrice: "0.0031",
    spotInstanceType: "one-time"
}
```

- **Risk**: Instance may be terminated with 2-minute notice
- **Best for**: Non-critical staging environments

### 2. Scheduled Shutdown (Save ~50%)

- Stop instance during off-hours (e.g., 8 PM - 8 AM)
- Implement via Lambda + CloudWatch Events
- 12 hours/day = 50% cost reduction

### 3. IPv6 Only (Save $3.60/month)

- Eliminate IPv4 address cost
- Use Cloudflare to proxy IPv4 traffic to IPv6
- Requires VPC IPv6 support

### 4. Reserved Instances (Save ~30%)

- 1-year commitment for predictable savings
- Only if staging needed long-term

### 5. ARM-based Instances (Save ~20%)

- Use `t4g.micro` instead of `t3.micro`
- Requires ARM-compatible build process
- Better performance per dollar

## Implementation Files

1. **Optimized Pulumi Configuration**: `./pulumi/staging-config-optimized.ts`

   - All cost optimizations implemented
   - Comprehensive user data script with fixes
   - Minimal IAM permissions

2. **Automated Deployment Script**: `./scripts/deploy-staging-optimized.py`

   - Handles complete deployment lifecycle
   - Automatic configuration updates
   - Built-in verification

3. **GitHub Actions Workflow**: `./.github/workflows/deploy-staging.yml`
   - Uses SSM for deployment (no SSH needed)
   - Includes --legacy-peer-deps fix

## Best Practices for Cost Control

1. **Tag Everything**

   - Use consistent tags: Environment, CostCenter, Project
   - Enable cost allocation tags in AWS

2. **Set Up Budget Alerts**

   ```bash
   aws budgets create-budget --account-id YOUR_ACCOUNT_ID \
     --budget "BudgetName=staging-budget,BudgetLimit={Amount=15,Unit=USD}"
   ```

3. **Regular Cost Reviews**

   - Check AWS Cost Explorer monthly
   - Look for unused resources
   - Review data transfer costs

4. **Automate Cleanup**
   - Delete old snapshots
   - Remove unattached volumes
   - Clean up old AMIs

## Quick Deployment

To deploy the optimized staging environment:

```bash
# 1. Configure your deployment settings
cp deployment.env.example .env.deployment
# Edit .env.deployment with your values

# 2. Run the optimized deployment
python ./scripts/deploy-staging-optimized.py

# 3. The script will:
#    - Destroy old infrastructure
#    - Deploy optimized setup
#    - Verify deployment
#    - Provide next steps
```

## Monitoring Costs

Use AWS Cost Explorer with these filters:

- Tag: Environment = staging
- Service: EC2, EBS, VPC
- Granularity: Daily

Set up a CloudWatch billing alarm:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name staging-cost-alarm \
  --alarm-description "Alert when staging costs exceed $15" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 15 \
  --comparison-operator GreaterThanThreshold
```

## Conclusion

By migrating from a complex Fargate/ALB architecture to a simple, optimized EC2 setup, we've achieved:

- **85% cost reduction** (~$60-70/month savings)
- **Simplified architecture** (easier to maintain)
- **Better performance** (t3.micro > t2.micro)
- **Full automation** (no manual steps)

The staging environment now costs less than a Netflix subscription while providing all necessary functionality for development and testing.
