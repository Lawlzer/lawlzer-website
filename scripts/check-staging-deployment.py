#!/usr/bin/env python3
"""
Check the status of the staging deployment using secure configuration
"""
import boto3
import time
from pathlib import Path

# Load deployment configuration from .env.deployment
def load_deployment_config():
    """Load configuration from .env.deployment file"""
    config = {}
    env_file = Path('.env.deployment')
    
    if not env_file.exists():
        print("❌ Error: .env.deployment file not found!")
        print("Please create it by copying deployment.env.example and filling in the values.")
        exit(1)
    
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                config[key.strip()] = value.strip()
    
    return config

# Load configuration
config = load_deployment_config()

INSTANCE_ID = config['STAGING_INSTANCE_ID']
REGION = config['AWS_REGION']
APP_PORT = int(config['APP_PORT'])

# Create clients
ec2 = boto3.client('ec2', region_name=REGION)
ssm = boto3.client('ssm', region_name=REGION)

def check_instance_status():
    """Check if the EC2 instance is running"""
    try:
        response = ec2.describe_instances(InstanceIds=[INSTANCE_ID])
        instance = response['Reservations'][0]['Instances'][0]
        state = instance['State']['Name']
        public_ip = instance.get('PublicIpAddress', 'No public IP')
        print(f"✅ Instance Status: {state}")
        print(f"   Public IP: {public_ip}")
        return state == 'running', public_ip
    except Exception as e:
        print(f"❌ Error checking instance: {str(e)}")
        return False, None

def check_ssm_status():
    """Check if SSM agent is responsive"""
    try:
        response = ssm.describe_instance_information(
            Filters=[{'Key': 'InstanceIds', 'Values': [INSTANCE_ID]}]
        )
        if response['InstanceInformationList']:
            info = response['InstanceInformationList'][0]
            print(f"✅ SSM Agent: {info['PingStatus']}")
            print(f"   Agent Version: {info['AgentVersion']}")
            return info['PingStatus'] == 'Online'
        else:
            print("❌ SSM Agent: Not registered")
            return False
    except Exception as e:
        print(f"❌ Error checking SSM: {str(e)}")
        return False

def run_quick_command(command, description):
    """Run a quick command via SSM"""
    try:
        response = ssm.send_command(
            InstanceIds=[INSTANCE_ID],
            DocumentName="AWS-RunShellScript",
            Parameters={'commands': [command]}
        )
        command_id = response['Command']['CommandId']
        
        # Wait briefly
        time.sleep(3)
        
        result = ssm.get_command_invocation(
            CommandId=command_id,
            InstanceId=INSTANCE_ID
        )
        
        if result['Status'] == 'Success':
            return result['StandardOutputContent'].strip()
        else:
            return f"Command failed: {result.get('StandardErrorContent', 'Unknown error')}"
    except Exception as e:
        return f"Error: {str(e)}"

print("=== Staging Deployment Status Check ===\n")

# 1. Check instance
is_running, public_ip = check_instance_status()

if not is_running:
    print("\n⚠️  Instance is not running. Cannot proceed with checks.")
    exit(1)

# 2. Check SSM
print()
ssm_online = check_ssm_status()

if not ssm_online:
    print("\n⚠️  SSM Agent is not online. Cannot run remote commands.")
    print("The instance might still be initializing or there might be connectivity issues.")
    exit(1)

# 3. Quick status checks
print("\n=== Application Status ===")

# Check if setup completed
print("\n📁 Setup completion:")
result = run_quick_command(
    "test -f /var/lib/cloud/instance/user-data-finished && echo 'Setup complete' || echo 'Setup in progress'",
    "Checking setup status"
)
print(f"   {result}")

# Check PM2
print("\n🔄 PM2 Status:")
result = run_quick_command("pm2 list", "Checking PM2")
if "│" in result:  # PM2 table output
    print("   Application is managed by PM2")
else:
    print(f"   {result}")

# Check nginx
print("\n🌐 Nginx Status:")
result = run_quick_command("systemctl is-active nginx", "Checking nginx")
print(f"   Nginx: {result}")

# Test local application
print(f"\n🚀 Application Response (port {APP_PORT}):")
result = run_quick_command(
    f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{APP_PORT} || echo 'No response'",
    "Testing application"
)
print(f"   HTTP Status: {result}")

print("\n=== Summary ===")
if public_ip and public_ip != 'No public IP':
    print(f"✅ Application URL: http://{public_ip}")
    print(f"✅ Future URL: https://staging.lawlzer.com (after DNS setup)")
else:
    print("⚠️  No public IP found")

print("\nTo view detailed logs, you can run:")
print(f"  aws ssm send-command --instance-ids {INSTANCE_ID} --document-name 'AWS-RunShellScript' --parameters 'commands=[\"pm2 logs --lines 50\"]' --region {REGION}") 