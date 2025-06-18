param(
    [Parameter(Mandatory=$true)]
    [string]$DeploymentUrl
)

# Extract deployment ID from URL
if ($DeploymentUrl -match 'https://([^.]+)\.vercel\.app') {
    $deploymentId = $matches[1]
} else {
    Write-Error "Invalid deployment URL format"
    exit 1
}

# Find Vercel token
$tokenPaths = @(
    "$env:USERPROFILE\.vercel\auth.json",
    "$env:LOCALAPPDATA\com.vercel.cli\auth.json",
    "$env:APPDATA\com.vercel.cli\auth.json"
)

$token = $null
foreach ($path in $tokenPaths) {
    if (Test-Path $path) {
        try {
            $authData = Get-Content $path | ConvertFrom-Json
            if ($authData.token) {
                $token = $authData.token
                Write-Host "Found token at: $path" -ForegroundColor Green
                break
            }
        } catch {
            # Continue to next path
        }
    }
}

# If no token found in files, try environment variable
if (-not $token -and $env:VERCEL_TOKEN) {
    $token = $env:VERCEL_TOKEN
    Write-Host "Using VERCEL_TOKEN from environment" -ForegroundColor Green
}

if (-not $token) {
    Write-Error "Failed to find Vercel token. Make sure you are logged in with: vercel login"
    Write-Host "`nAlternatively, set VERCEL_TOKEN environment variable:" -ForegroundColor Yellow
    Write-Host "  `$env:VERCEL_TOKEN = 'your-token-here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Fetching logs for deployment: $deploymentId`n" -ForegroundColor Cyan

# Headers for API requests
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

try {
    # Get deployment info
    $deployment = Invoke-RestMethod -Uri "https://api.vercel.com/v13/deployments/$deploymentId" -Headers $headers
    
    $status = if ($deployment.readyState) { $deployment.readyState } else { $deployment.state }
    Write-Host "Deployment Status: $status" -ForegroundColor Yellow
    Write-Host "Created: $([DateTime]::new(1970,1,1,0,0,0,0,[DateTimeKind]::Utc).AddMilliseconds($deployment.created).ToLocalTime())"
    Write-Host "URL: $($deployment.url)"
    Write-Host "---`n"

    # Fetch build logs
    Write-Host "BUILD LOGS:" -ForegroundColor Green
    Write-Host "===========`n" -ForegroundColor Green

    $events = Invoke-RestMethod -Uri "https://api.vercel.com/v3/deployments/$deploymentId/events?builds=1&limit=1000" -Headers $headers
    
    if ($events -is [array]) {
        foreach ($event in $events) {
            if ($event.type -eq 'stdout' -or $event.type -eq 'stderr') {
                Write-Host $event.payload.text
            } elseif ($event.type -eq 'command') {
                Write-Host "`n> $($event.payload.value)`n" -ForegroundColor Cyan
            } elseif ($event.type -eq 'error') {
                $errorMsg = if ($event.payload.value) { $event.payload.value } 
                           elseif ($event.payload.message) { $event.payload.message }
                           else { $event.payload | ConvertTo-Json -Compress }
                Write-Host "`nERROR: $errorMsg" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "No build logs available" -ForegroundColor Yellow
    }

    # Try to fetch runtime logs if deployment is ready
    if ($deployment.readyState -eq 'READY' -or $deployment.state -eq 'READY') {
        Write-Host "`n`nRUNTIME LOGS:" -ForegroundColor Green
        Write-Host "=============`n" -ForegroundColor Green
        
        $logs = Invoke-RestMethod -Uri "https://api.vercel.com/v2/deployments/$deploymentId/logs?limit=100" -Headers $headers
        
        if ($logs.logs -and $logs.logs -is [array]) {
            foreach ($log in $logs.logs) {
                $time = [DateTime]::new(1970,1,1,0,0,0,0,[DateTimeKind]::Utc).AddMilliseconds($log.timestamp).ToLocalTime()
                Write-Host "[$time] $($log.level): $($log.message)"
            }
        } else {
            Write-Host "No runtime logs available" -ForegroundColor Yellow
        }
    }

} catch {
    Write-Error "Failed to fetch logs: $_"
} 