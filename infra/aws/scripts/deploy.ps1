# HR SaaS Platform - PowerShell Deployment Script
# Usage: .\deploy.ps1 [-Environment dev] [-Service all] [-ImageTag latest]

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",

    [Parameter(Position=1)]
    [string]$Service = "all",

    [Parameter(Position=2)]
    [string]$ImageTag = "latest"
)

# Configuration
$AwsRegion = "ap-northeast-2"
$Project = "hr-platform"

$AllServices = @(
    "gateway-service",
    "auth-service",
    "tenant-service",
    "organization-service",
    "employee-service",
    "attendance-service",
    "approval-service",
    "mdm-service"
)

# Color output functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "HR SaaS Platform - AWS Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host "Service: $Service"
Write-Host "Image Tag: $ImageTag"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get ECR registry
Write-Info "Getting ECR registry..."
try {
    $EcrUri = aws ecr describe-repositories `
        --repository-names "$Project/gateway-service" `
        --query "repositories[0].repositoryUri" `
        --output text 2>$null

    if ([string]::IsNullOrEmpty($EcrUri)) {
        throw "ECR repository not found"
    }

    $EcrRegistry = $EcrUri.Split('/')[0]
    Write-Info "ECR Registry: $EcrRegistry"
}
catch {
    Write-Error "Failed to get ECR registry. Make sure AWS CLI is configured."
    exit 1
}

Write-Host ""

# Determine services to deploy
if ($Service -eq "all") {
    $ServicesToDeploy = $AllServices
}
else {
    $ServicesToDeploy = @($Service)
}

Write-Info "Services to deploy: $($ServicesToDeploy -join ', ')"
Write-Host ""

# Deploy each service
foreach ($svc in $ServicesToDeploy) {
    Write-Info "Deploying $svc..."

    # Check if task definition exists
    $taskDef = aws ecs describe-task-definition `
        --task-definition "$Project-$Environment-$svc" `
        --query "taskDefinition" `
        --output json 2>$null

    if ([string]::IsNullOrEmpty($taskDef)) {
        Write-Warn "Task definition not found for $svc. Skipping..."
        continue
    }

    # Update image in task definition
    $NewImage = "$EcrRegistry/$Project/${svc}:$ImageTag"
    $taskDefObj = $taskDef | ConvertFrom-Json
    $taskDefObj.containerDefinitions[0].image = $NewImage

    # Remove fields not needed for registration
    $taskDefObj.PSObject.Properties.Remove('taskDefinitionArn')
    $taskDefObj.PSObject.Properties.Remove('revision')
    $taskDefObj.PSObject.Properties.Remove('status')
    $taskDefObj.PSObject.Properties.Remove('requiresAttributes')
    $taskDefObj.PSObject.Properties.Remove('compatibilities')
    $taskDefObj.PSObject.Properties.Remove('registeredAt')
    $taskDefObj.PSObject.Properties.Remove('registeredBy')

    # Register new task definition
    $newTaskDef = $taskDefObj | ConvertTo-Json -Depth 10 -Compress
    $newTaskArn = aws ecs register-task-definition `
        --cli-input-json $newTaskDef `
        --query "taskDefinition.taskDefinitionArn" `
        --output text 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Info "Registered task definition: $newTaskArn"

        # Update service
        aws ecs update-service `
            --cluster "$Project-$Environment" `
            --service $svc `
            --task-definition $newTaskArn `
            --force-new-deployment `
            --output text 2>$null | Out-Null

        if ($LASTEXITCODE -eq 0) {
            Write-Info "Service update initiated for $svc"
        }
        else {
            Write-Error "Failed to update service $svc"
        }
    }
    else {
        Write-Error "Failed to register task definition for $svc"
    }
}

Write-Host ""
Write-Info "Waiting for services to stabilize..."

# Wait for stability
foreach ($svc in $ServicesToDeploy) {
    Write-Info "Waiting for $svc..."

    aws ecs wait services-stable `
        --cluster "$Project-$Environment" `
        --services $svc `
        --region $AwsRegion 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Info "$svc is stable!"
    }
    else {
        Write-Warn "Timeout or error waiting for $svc"
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host "Image Tag: $ImageTag"
Write-Host "Services: $($ServicesToDeploy -join ', ')"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Info "Deployment completed!"
