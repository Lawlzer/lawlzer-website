<#
.SYNOPSIS
Fetches the latest CloudWatch logs for the most recently stopped task of a specified ECS service.

.DESCRIPTION
This script uses the AWS CLI to:
1. Find the most recent stopped task for a given ECS cluster and service.
2. Describe the task to determine its CloudWatch log configuration (group and stream).
3. Retrieve and display the log events from that log stream.

.PARAMETER ClusterName
The name of the ECS cluster.

.PARAMETER ServiceName
The name of the ECS service within the cluster.

.PARAMETER ContainerName
The name of the container within the task definition for which to fetch logs.

.EXAMPLE
.	emp.ps1 -ClusterName "lawlzer-website-cluster" -ServiceName "lawlzer-website-service" -ContainerName "lawlzer-website-container"

.NOTES
- Requires AWS CLI to be installed and configured with appropriate permissions (ecs:ListTasks, ecs:DescribeTasks, logs:GetLogEvents).
- Assumes the container uses the 'awslogs' log driver.
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$ClusterName = "lawlzer-website-cluster",

    [Parameter(Mandatory=$true)]
    [string]$ServiceName = "lawlzer-website-service",

    [Parameter(Mandatory=$true)]
    [string]$ContainerName = "lawlzer-website-container"
)

Write-Host "Attempting to fetch logs for the latest stopped task..."
Write-Host "Cluster: $ClusterName"
Write-Host "Service: $ServiceName"
Write-Host "Container: $ContainerName"

# 1. Find the most recent stopped task ARN
Write-Host "Finding the latest stopped task ARN..."
try {
    # Get all stopped task ARNs, sort by stoppedAt timestamp descending (requires jq for easy sorting, fallback otherwise)
    # Using --max-items 1 and sorting on AWS side might be more efficient if available/reliable across versions
    $stoppedTasksJson = aws ecs list-tasks --cluster $ClusterName --service-name $ServiceName --desired-status STOPPED --output json --no-cli-pager | ConvertFrom-Json
    if (-not $stoppedTasksJson -or -not $stoppedTasksJson.taskArns -or $stoppedTasksJson.taskArns.Count -eq 0) {
        Write-Warning "No stopped tasks found for service '$ServiceName' in cluster '$ClusterName'."
        exit 1
    }

    # Describe the tasks to get stop times for sorting
    $taskDetailsJson = aws ecs describe-tasks --cluster $ClusterName --tasks $stoppedTasksJson.taskArns --output json --no-cli-pager | ConvertFrom-Json
    if (-not $taskDetailsJson -or -not $taskDetailsJson.tasks) {
         Write-Error "Failed to describe stopped tasks."
         exit 1
    }

    # Sort tasks by 'stoppedAt' timestamp descending and get the latest one's ARN
    $latestTask = $taskDetailsJson.tasks | Sort-Object -Property stoppedAt -Descending | Select-Object -First 1
    $latestTaskArn = $latestTask.taskArn
    $taskId = $latestTaskArn.Split('/')[-1] # Extract Task ID from ARN

    if (-not $latestTaskArn) {
        Write-Warning "Could not determine the latest stopped task ARN."
        exit 1
    }
    Write-Host "Found latest stopped task ARN: $latestTaskArn"
    Write-Host "Task ID: $taskId"

} catch {
    Write-Error "Error listing or describing stopped tasks: $($_.Exception.Message)"
    exit 1
}


# 2. Get Log Configuration from the latest task description
Write-Host "Describing task to get log configuration..."
try {
    # We already have the details from the previous step
    $containerLogConfig = $latestTask.containers | Where-Object { $_.name -eq $ContainerName } | Select-Object -ExpandProperty logConfiguration

    if (-not $containerLogConfig -or $containerLogConfig.logDriver -ne 'awslogs') {
        Write-Error "Could not find 'awslogs' log configuration for container '$ContainerName' in task '$latestTaskArn'."
        exit 1
    }

    $logGroupName = $containerLogConfig.options."awslogs-group"
    $logStreamPrefix = $containerLogConfig.options."awslogs-stream-prefix"

    if (-not $logGroupName -or -not $logStreamPrefix) {
        Write-Error "Could not extract log group name or stream prefix from task description."
        exit 1
    }

    # Construct the full log stream name
    # Format is typically: prefix/containerName/taskId
    $logStreamName = "$logStreamPrefix/$ContainerName/$taskId"

    Write-Host "Log Group Name: $logGroupName"
    Write-Host "Log Stream Name: $logStreamName"

} catch {
    Write-Error "Error extracting log configuration: $($_.Exception.Message)"
    exit 1
}

# 3. Get Log Events
Write-Host "Fetching log events..."
try {
    $logEvents = aws logs get-log-events --log-group-name $logGroupName --log-stream-name $logStreamName --output json --no-cli-pager | ConvertFrom-Json

    if ($logEvents -and $logEvents.events) {
        Write-Host "--- Log Output ---"
        $logEvents.events | ForEach-Object { $_.message }
        Write-Host "--- End of Logs ---"
    } else {
        Write-Host "No log events found for stream '$logStreamName' in group '$logGroupName'."
    }

} catch {
    Write-Error "Error getting log events: $($_.Exception.Message)"
    # Often the stream might not exist *yet* if the container failed very early
    if ($_.Exception.Message -like '*ResourceNotFoundException*') {
         Write-Warning "Log stream might not exist. Did the container start correctly?"
    }
    exit 1
}

Write-Host "Script finished."
