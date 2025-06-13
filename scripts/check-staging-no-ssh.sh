#!/bin/bash

echo "=== Staging Environment Status Check (No SSH Required) ==="
echo ""

# Configuration
INSTANCE_ID="i-034ccdc628aa156e8"
INSTANCE_IP="174.129.250.173"
REGION="us-east-1"

# Function to run SSM command and get output
run_ssm_command() {
    local commands=$1
    local description=$2
    
    echo "Running: $description"
    
    # Send command
    COMMAND_OUTPUT=$(aws ssm send-command \
        --instance-ids "$INSTANCE_ID" \
        --document-name "AWS-RunShellScript" \
        --parameters "commands=$commands" \
        --region "$REGION" \
        --output json 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "   ❌ Failed to send command"
        return 1
    fi
    
    COMMAND_ID=$(echo "$COMMAND_OUTPUT" | jq -r '.Command.CommandId')
    echo "   Command ID: $COMMAND_ID"
    
    # Wait for command to complete
    echo "   Waiting for command to complete..."
    sleep 5
    
    # Get command output
    INVOCATION_OUTPUT=$(aws ssm get-command-invocation \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --region "$REGION" \
        --output json 2>/dev/null)
    
    STATUS=$(echo "$INVOCATION_OUTPUT" | jq -r '.Status')
    
    if [ "$STATUS" = "Success" ]; then
        echo "   ✅ Command succeeded"
        echo "$INVOCATION_OUTPUT" | jq -r '.StandardOutputContent' | sed 's/^/   /'
    else
        echo "   ❌ Command failed with status: $STATUS"
        echo "$INVOCATION_OUTPUT" | jq -r '.StandardErrorContent' | sed 's/^/   /'
    fi
    
    echo ""
}

# Check if instance is running
echo "1. Checking EC2 Instance Status..."
INSTANCE_STATE=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query "Reservations[0].Instances[0].State.Name" \
    --output text 2>/dev/null)

if [ "$INSTANCE_STATE" = "running" ]; then
    echo "   ✅ Instance is running"
else
    echo "   ❌ Instance state: $INSTANCE_STATE"
    exit 1
fi

echo ""

# Check if user data script completed
echo "2. Checking if setup is complete..."
run_ssm_command '["test -f /var/lib/cloud/instance/user-data-finished && echo \"Setup complete!\" || echo \"Setup still in progress...\""]' "Setup status"

# Check PM2 processes
echo "3. Checking PM2 processes..."
run_ssm_command '["pm2 list"]' "PM2 process list"

# Check if app is responding
echo "4. Checking if app is responding..."
run_ssm_command '["curl -s -o /dev/null -w \"%{http_code}\" http://localhost:3000"]' "App HTTP status"

# Check recent logs
echo "5. Checking recent user data logs..."
run_ssm_command '["tail -20 /var/log/user-data.log"]' "Recent setup logs"

# Check nginx status
echo "6. Checking nginx status..."
run_ssm_command '["systemctl is-active nginx"]' "Nginx status"

echo "=== Summary ==="
echo ""
echo "Instance IP: $INSTANCE_IP"
echo "If setup is complete, the app should be available at: http://$INSTANCE_IP"
echo ""
echo "To manually trigger deployment (no SSH needed):"
echo "aws ssm send-command --instance-ids $INSTANCE_ID --document-name \"AWS-RunShellScript\" --parameters 'commands=[\"sudo /home/ubuntu/deploy.sh\"]' --region $REGION"
echo "" 