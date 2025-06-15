#!/usr/bin/env python3
"""
Secure deployment script for staging environment
Reads configuration from .env.deployment
"""
import boto3
import time
import sys
from pathlib import Path

# Load deployment configuration from .env.deployment
def load_deployment_config():
    """Load configuration from .env.deployment file"""
    config = {}
    env_file = Path('.env.deployment')
    
    if not env_file.exists():
        print("❌ Error: .env.deployment file not found!")
        print("Please run: python ./temp/ai/create-deployment-env.py")
        exit(1)
    
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                config[key.strip()] = value.strip()
    
    # Validate required configuration
    required_keys = ['STAGING_INSTANCE_ID', 'AWS_REGION', 'MONGO_SECRET_ARN', 'APP_PORT', 'APP_NAME']
    missing_keys = [key for key in required_keys if key not in config]
    
    if missing_keys:
        print(f"❌ Error: Missing required configuration keys: {', '.join(missing_keys)}")
        exit(1)
    
    return config

# Load configuration
config = load_deployment_config()

INSTANCE_ID = config['STAGING_INSTANCE_ID']
REGION = config['AWS_REGION']
APP_PORT = int(config['APP_PORT'])
APP_NAME = config['APP_NAME']
MONGO_SECRET_ARN = config['MONGO_SECRET_ARN']

# Create SSM client
ssm = boto3.client('ssm', region_name=REGION)

def run_ssm_command(commands, description, wait_time=10, check_interval=2):
    """Run SSM command and return the output"""
    print(f"\n{description}:")
    print("-" * 50)
    
    try:
        # Send command
        response = ssm.send_command(
            InstanceIds=[INSTANCE_ID],
            DocumentName="AWS-RunShellScript",
            Parameters={
                'commands': commands
            }
        )
        
        command_id = response['Command']['CommandId']
        print(f"Command ID: {command_id}")
        
        # Wait for command to complete with status checks
        elapsed = 0
        while elapsed < wait_time:
            try:
                invocation = ssm.get_command_invocation(
                    CommandId=command_id,
                    InstanceId=INSTANCE_ID
                )
                
                status = invocation['Status']
                
                if status in ['Success', 'Failed', 'Cancelled']:
                    print(f"Status: {status}")
                    
                    if status == 'Success':
                        output = invocation['StandardOutputContent']
                        if output:
                            print("\nOutput:")
                            print(output[:2000])
                            if len(output) > 2000:
                                print("... (output truncated)")
                    else:
                        error = invocation.get('StandardErrorContent', '')
                        if error:
                            print(f"\nError: {error[:1000]}")
                    
                    return status, invocation
                else:
                    print(f"Status: {status} (waiting...)", end='\r')
                    
            except ssm.exceptions.InvocationDoesNotExist:
                print(f"Status: Pending (waiting...)", end='\r')
            
            time.sleep(check_interval)
            elapsed += check_interval
        
        print(f"\nTimeout waiting for command (waited {wait_time}s)")
        return 'Timeout', None
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return None, None

print("=== Staging Deployment Script ===")
print(f"Target Instance: {INSTANCE_ID}")
print(f"Region: {REGION}")

# Ask for confirmation
print("\n⚠️  This will deploy to the staging environment.")
response = input("Continue? (y/N): ")
if response.lower() != 'y':
    print("Deployment cancelled.")
    exit(0)

# 1. Check instance is running
print("\n1. Checking instance status...")
try:
    ec2 = boto3.client('ec2', region_name=REGION)
    response = ec2.describe_instances(InstanceIds=[INSTANCE_ID])
    instance = response['Reservations'][0]['Instances'][0]
    state = instance['State']['Name']
    public_ip = instance.get('PublicIpAddress', 'No public IP')
    
    if state != 'running':
        print(f"❌ Instance is {state}, not running!")
        exit(1)
    
    print(f"✅ Instance is running")
    print(f"   Public IP: {public_ip}")
except Exception as e:
    print(f"❌ Error checking instance: {str(e)}")
    exit(1)

# 2. Update code from GitHub
run_ssm_command(
    ["cd /var/www/app && git pull origin staging"],
    "2. Pulling latest code from GitHub",
    wait_time=20
)

# 3. Install dependencies
run_ssm_command(
    ["cd /var/www/app && npm install --legacy-peer-deps"],
    "3. Installing npm dependencies",
    wait_time=120
)

# 4. Get MongoDB URI and create .env
run_ssm_command(
    [f"""aws ssm get-parameter --name '{MONGO_SECRET_ARN}' --with-decryption --region {REGION} --query 'Parameter.Value' --output text > /tmp/mongo_uri.txt"""],
    "4. Getting MongoDB URI",
    wait_time=10
)

env_file_content = f"""NODE_ENV=production
PORT={APP_PORT}
DATABASE_URL=$(cat /tmp/mongo_uri.txt)
MONGO_URI=$(cat /tmp/mongo_uri.txt)
NEXT_PUBLIC_SCHEME=http
NEXT_PUBLIC_SECOND_LEVEL_DOMAIN=staging
NEXT_PUBLIC_TOP_LEVEL_DOMAIN=lawlzer.com
NEXT_PUBLIC_FRONTEND_PORT=3000
NEXT_PUBLIC_AUTH_GOOGLE_ID=dummy-google-id-staging
AUTH_GOOGLE_SECRET=dummy-google-secret-staging
NEXT_PUBLIC_AUTH_DISCORD_ID=dummy-discord-id-staging
AUTH_DISCORD_SECRET=dummy-discord-secret-staging
NEXT_PUBLIC_AUTH_GITHUB_ID=dummy-github-id-staging
AUTH_GITHUB_SECRET=dummy-github-secret-staging"""

run_ssm_command(
    [f"""cd /var/www/app && cat > .env << 'EOF'
{env_file_content}
EOF
rm -f /tmp/mongo_uri.txt"""],
    "5. Creating .env file",
    wait_time=10
)

# 5. Generate Prisma client
run_ssm_command(
    ["cd /var/www/app && npx prisma generate"],
    "6. Generating Prisma client",
    wait_time=30
)

# 6. Build the application
run_ssm_command(
    ["cd /var/www/app && npm run build"],
    "7. Building Next.js application",
    wait_time=180
)

# 7. Stop old process
run_ssm_command(
    ["pm2 delete all || true"],
    "8. Stopping old processes",
    wait_time=10
)

# 8. Start new process
run_ssm_command(
    [f"cd /var/www/app && PORT={APP_PORT} pm2 start npm --name '{APP_NAME}' -- start"],
    "9. Starting application with PM2",
    wait_time=20
)

# 9. Save PM2 config
run_ssm_command(
    ["pm2 save"],
    "10. Saving PM2 configuration",
    wait_time=10
)

# 10. Check status
print("\n11. Waiting 15 seconds for application to stabilize...")
time.sleep(15)

run_ssm_command(
    ["pm2 status"],
    "12. Checking PM2 status",
    wait_time=10
)

# 11. Test application
run_ssm_command(
    [f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:{APP_PORT}"],
    "13. Testing application locally",
    wait_time=10
)

run_ssm_command(
    ["curl -s -o /dev/null -w '%{{http_code}}' http://localhost"],
    "14. Testing through nginx",
    wait_time=10
)

print("\n=== Deployment Complete ===")
print(f"✅ Application URL: http://{public_ip}")
print(f"✅ Future URL: https://staging.lawlzer.com (after DNS setup)")
print("\nPlease visit the URL to verify the deployment was successful.") 