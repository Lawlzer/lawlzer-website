#!/bin/bash

echo "=== Staging Environment Status Check ==="
echo ""

# Configuration
INSTANCE_ID="i-000c051d1c069192f"
INSTANCE_IP="13.216.140.18"
DOMAIN="staging.lawlzer.com"
REGION="us-east-1"

# Check instance status
echo "1. Checking EC2 Instance Status..."
INSTANCE_STATE=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --query "Reservations[0].Instances[0].State.Name" \
  --output text 2>/dev/null)

if [ "$INSTANCE_STATE" = "running" ]; then
  echo "   ✅ Instance is running"
else
  echo "   ❌ Instance state: $INSTANCE_STATE"
fi

# Check if instance is reachable
echo ""
echo "2. Checking HTTP Connectivity..."
if curl -s -I http://$INSTANCE_IP > /dev/null 2>&1; then
  echo "   ✅ Instance is responding on HTTP"
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$INSTANCE_IP)
  echo "   HTTP Status Code: $HTTP_STATUS"
else
  echo "   ❌ Instance is not responding on HTTP yet"
  echo "   The user data script may still be running..."
fi

# Check SSM connectivity
echo ""
echo "3. Checking SSM Agent Status..."
SSM_STATUS=$(aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
  --region $REGION \
  --query "InstanceInformationList[0].PingStatus" \
  --output text 2>/dev/null)

if [ "$SSM_STATUS" = "Online" ]; then
  echo "   ✅ SSM Agent is online - can deploy via GitHub Actions"
else
  echo "   ⚠️  SSM Agent status: $SSM_STATUS"
fi

# DNS Setup Instructions
echo ""
echo "=== DNS Setup Instructions ==="
echo ""
echo "To set up staging.lawlzer.com, add the following DNS record in Cloudflare:"
echo ""
echo "  Type:    A"
echo "  Name:    staging"
echo "  Content: $INSTANCE_IP"
echo "  TTL:     Auto"
echo "  Proxy:   OFF (for initial setup)"
echo ""
echo "After DNS propagates, you can access the site at: http://$DOMAIN"
echo ""

# SSH Access
echo "=== SSH Access ==="
echo "To SSH into the instance:"
echo "  ssh ubuntu@$INSTANCE_IP"
echo ""

# Deployment
echo "=== Manual Deployment ==="
echo "To manually deploy:"
echo "  ssh ubuntu@$INSTANCE_IP 'sudo /home/ubuntu/deploy.sh'"
echo ""
echo "Or use GitHub Actions by pushing to the 'staging' branch"
echo "" 