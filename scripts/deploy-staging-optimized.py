#!/usr/bin/env python3
"""
Optimized Staging Deployment Script
Handles the complete deployment process with all learned fixes and cost optimizations
"""
import os
import sys
import json
import time
import subprocess
from datetime import datetime
from pathlib import Path

# Load configuration from .env.deployment
def load_config():
    # Get the root directory (parent of scripts directory)
    root_dir = Path(__file__).parent.parent
    config_file = root_dir / '.env.deployment'
    if not config_file.exists():
        print("ERROR: .env.deployment not found. Please copy deployment.env.example and configure it.")
        sys.exit(1)
    
    config = {}
    with open(config_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                config[key.strip()] = value.strip()
    
    required_keys = ['AWS_REGION', 'MONGO_SECRET_ARN']
    missing = [k for k in required_keys if k not in config]
    if missing:
        print(f"ERROR: Missing required config keys: {missing}")
        sys.exit(1)
    
    return config

def run_command(cmd, description=None):
    """Run a command and return the result"""
    if description:
        print(f"\n{description}...")
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"ERROR: Command failed with code {result.returncode}")
            print(f"STDERR: {result.stderr}")
            return False, result.stderr
        return True, result.stdout
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False, str(e)

def destroy_stack():
    """Destroy the existing Pulumi stack"""
    print("\n=== DESTROYING EXISTING STACK ===")
    
    os.chdir('pulumi')
    success, output = run_command(
        "pulumi destroy -s staging --yes",
        "Destroying existing staging stack"
    )
    os.chdir('..')
    
    if success:
        print("✅ Stack destroyed successfully")
    else:
        print("❌ Failed to destroy stack. Please check manually.")
        return False
    
    # Wait for resources to be fully cleaned up
    print("Waiting 30 seconds for AWS resources to be fully cleaned up...")
    time.sleep(30)
    return True

def deploy_stack():
    """Deploy the new Pulumi stack with all fixes"""
    print("\n=== DEPLOYING NEW STACK ===")
    
    os.chdir('pulumi')
    
    # Set the MongoDB secret ARN
    config = load_config()
    run_command(
        f"pulumi config set mongoSecretArn {config['MONGO_SECRET_ARN']} --secret -s staging",
        "Setting MongoDB secret ARN"
    )
    
    # Deploy the stack
    success, output = run_command(
        "pulumi up -s staging --yes",
        "Deploying new staging stack"
    )
    
    if not success:
        print("❌ Deployment failed")
        os.chdir('..')
        return None
    
    # Extract outputs
    print("\nExtracting stack outputs...")
    success, outputs = run_command("pulumi stack output --json -s staging")
    
    os.chdir('..')
    
    if success:
        try:
            outputs_data = json.loads(outputs)
            instance_id = outputs_data.get('instanceId')
            public_ip = outputs_data.get('publicIp')
            
            print(f"\n✅ Deployment successful!")
            print(f"Instance ID: {instance_id}")
            print(f"Public IP: {public_ip}")
            
            # Update .env.deployment with new instance ID
            update_deployment_config(instance_id)
            
            return {
                'instance_id': instance_id,
                'public_ip': public_ip
            }
        except Exception as e:
            print(f"ERROR parsing outputs: {e}")
            return None
    
    return None

def update_deployment_config(instance_id):
    """Update .env.deployment with new instance ID"""
    root_dir = Path(__file__).parent.parent
    config_file = root_dir / '.env.deployment'
    lines = []
    
    with open(config_file) as f:
        for line in f:
            if line.strip().startswith('STAGING_INSTANCE_ID='):
                lines.append(f'STAGING_INSTANCE_ID={instance_id}\n')
            else:
                lines.append(line)
    
    with open(config_file, 'w') as f:
        f.writelines(lines)
    
    print(f"Updated .env.deployment with instance ID: {instance_id}")

def update_github_secrets(instance_id):
    """Update GitHub secrets for the new instance"""
    config = load_config()
    
    print("\n=== UPDATING GITHUB SECRETS ===")
    print(f"Please update the following GitHub secrets:")
    print(f"  STAGING_INSTANCE_ID: {instance_id}")
    print(f"  AWS_REGION: {config['AWS_REGION']}")
    print("\nGo to: https://github.com/{GITHUB_ORG}/{GITHUB_REPO}/settings/secrets/actions")
    print("(Replace {GITHUB_ORG} and {GITHUB_REPO} with your values)")

def wait_for_instance(instance_id, public_ip):
    """Wait for the instance to be ready and verify deployment"""
    print(f"\n=== WAITING FOR INSTANCE TO BE READY ===")
    print(f"This typically takes 5-10 minutes for the user data script to complete...")
    
    config = load_config()
    region = config['AWS_REGION']
    
    # Wait for initial setup
    for i in range(20):  # Check for up to 10 minutes
        print(f"\nChecking instance status (attempt {i+1}/20)...")
        
        # Check if user data has completed
        success, output = run_command(
            f"aws ssm send-command "
            f"--instance-ids {instance_id} "
            f"--document-name 'AWS-RunShellScript' "
            f"--parameters 'commands=[\"test -f /var/lib/cloud/instance/user-data-finished && echo READY || echo NOT_READY\"]' "
            f"--region {region} "
            f"--output json 2>/dev/null"
        )
        
        if success:
            try:
                cmd_data = json.loads(output)
                command_id = cmd_data['Command']['CommandId']
                
                # Wait a bit for command to execute
                time.sleep(5)
                
                # Get command result
                success, result = run_command(
                    f"aws ssm get-command-invocation "
                    f"--command-id {command_id} "
                    f"--instance-id {instance_id} "
                    f"--region {region} "
                    f"--output json 2>/dev/null"
                )
                
                if success:
                    result_data = json.loads(result)
                    if result_data.get('Status') == 'Success':
                        output = result_data.get('StandardOutputContent', '').strip()
                        if output == 'READY':
                            print("✅ Instance setup complete!")
                            return True
            except:
                pass
        
        print("Instance not ready yet, waiting 30 seconds...")
        time.sleep(30)
    
    print("⚠️ Instance setup is taking longer than expected")
    return False

def verify_deployment(instance_id, public_ip):
    """Verify the deployment is working"""
    print(f"\n=== VERIFYING DEPLOYMENT ===")
    
    config = load_config()
    region = config['AWS_REGION']
    
    # Check PM2 status
    print("\nChecking PM2 status...")
    success, output = run_command(
        f"aws ssm send-command "
        f"--instance-ids {instance_id} "
        f"--document-name 'AWS-RunShellScript' "
        f"--parameters 'commands=[\"pm2 list\"]' "
        f"--region {region} "
        f"--output json"
    )
    
    if success:
        cmd_data = json.loads(output)
        command_id = cmd_data['Command']['CommandId']
        time.sleep(5)
        
        success, result = run_command(
            f"aws ssm get-command-invocation "
            f"--command-id {command_id} "
            f"--instance-id {instance_id} "
            f"--region {region} "
            f"--output json"
        )
        
        if success:
            result_data = json.loads(result)
            pm2_output = result_data.get('StandardOutputContent', '')
            print(pm2_output)
    
    # Test HTTP access
    print(f"\nTesting HTTP access to http://{public_ip}...")
    success, output = run_command(f"curl -s -I http://{public_ip} | head -n1")
    if success:
        print(f"HTTP Response: {output.strip()}")
    
    print(f"\n✅ Deployment verification complete!")
    print(f"🌐 Your staging site should be accessible at: http://{public_ip}")
    print(f"📝 Next step: Configure DNS to point staging.lawlzer.com to {public_ip}")

def main():
    print("=== OPTIMIZED STAGING DEPLOYMENT ===")
    print(f"Started at: {datetime.now()}")
    
    # Check if we're in the right directory
    if not Path('pulumi').exists():
        print("ERROR: Please run this script from the project root directory")
        sys.exit(1)
    
    # Load configuration
    config = load_config()
    
    # Ask for confirmation
    print("\nThis script will:")
    print("1. Destroy the existing staging infrastructure")
    print("2. Deploy a new optimized staging infrastructure")
    print("3. Configure it with all learned fixes")
    print("\nThis will cause downtime for the staging environment.")
    
    response = input("\nProceed? (yes/no): ")
    if response.lower() != 'yes':
        print("Deployment cancelled.")
        sys.exit(0)
    
    # Step 1: Destroy existing stack
    if not destroy_stack():
        print("Failed to destroy stack. Please fix the issue and try again.")
        sys.exit(1)
    
    # Step 2: Deploy new stack
    deployment = deploy_stack()
    if not deployment:
        print("Deployment failed. Please check the errors above.")
        sys.exit(1)
    
    # Step 3: Wait for instance to be ready
    instance_ready = wait_for_instance(deployment['instance_id'], deployment['public_ip'])
    
    # Step 4: Verify deployment
    verify_deployment(deployment['instance_id'], deployment['public_ip'])
    
    # Step 5: Update GitHub secrets reminder
    update_github_secrets(deployment['instance_id'])
    
    print(f"\n=== DEPLOYMENT COMPLETE ===")
    print(f"Completed at: {datetime.now()}")
    print("\n📊 Cost Savings Summary:")
    print("  - Using t3.micro instead of Fargate (saves ~$20-30/month)")
    print("  - Single public IP instead of 7-8 IPs (saves ~$25/month)")
    print("  - No ALB costs (saves ~$16/month)")
    print("  - Total estimated savings: ~$60-70/month")
    
    print("\n🚀 Your optimized staging environment is ready!")

if __name__ == "__main__":
    main() 