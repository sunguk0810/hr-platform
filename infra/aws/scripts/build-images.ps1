# HR SaaS Platform - PowerShell Docker Image Build Script
# Usage: .\build-images.ps1 [-Service all] [-Tag latest]

param(
    [Parameter(Position=0)]
    [string]$Service = "all",

    [Parameter(Position=1)]
    [string]$Tag = "latest"
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

$ServicePorts = @{
    "gateway-service" = 8080
    "auth-service" = 8081
    "tenant-service" = 8082
    "organization-service" = 8083
    "employee-service" = 8084
    "attendance-service" = 8085
    "approval-service" = 8086
    "mdm-service" = 8087
}

# Color output functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "HR SaaS Platform - Docker Image Build" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Service: $Service"
Write-Host "Tag: $Tag"
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
    Write-Err "Failed to get ECR registry. Make sure AWS CLI is configured and ECR repositories exist."
    exit 1
}

Write-Host ""

# Login to ECR
Write-Info "Logging in to ECR..."
$loginPassword = aws ecr get-login-password --region $AwsRegion
$loginPassword | docker login --username AWS --password-stdin $EcrRegistry

if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to login to ECR"
    exit 1
}

Write-Host ""

# Determine services to build
if ($Service -eq "all") {
    $ServicesToBuild = $AllServices
}
else {
    $ServicesToBuild = @($Service)
}

Write-Info "Services to build: $($ServicesToBuild -join ', ')"
Write-Host ""

# Build and push each service
$Results = @{
    Success = @()
    Failed = @()
}

foreach ($svc in $ServicesToBuild) {
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Info "Building $svc..."
    Write-Host "============================================" -ForegroundColor Yellow

    # Determine Dockerfile
    if ($svc -eq "gateway-service") {
        $Dockerfile = "docker/Dockerfile.gateway"
    }
    else {
        $Dockerfile = "docker/Dockerfile.service"
    }

    $Port = $ServicePorts[$svc]

    Write-Info "Using Dockerfile: $Dockerfile"
    Write-Info "Port: $Port"

    # Build image
    $imageName = "$EcrRegistry/$Project/${svc}"

    docker build `
        --build-arg SERVICE_NAME=$svc `
        --build-arg SERVER_PORT=$Port `
        -t "${imageName}:${Tag}" `
        -t "${imageName}:latest" `
        -f $Dockerfile .

    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to build $svc"
        $Results.Failed += $svc
        continue
    }

    Write-Info "Pushing $svc..."

    # Push images
    docker push "${imageName}:${Tag}"
    docker push "${imageName}:latest"

    if ($LASTEXITCODE -eq 0) {
        Write-Info "Successfully pushed $svc"
        $Results.Success += $svc
    }
    else {
        Write-Err "Failed to push $svc"
        $Results.Failed += $svc
    }

    Write-Host ""
}

# Print summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Build Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Tag: $Tag"
Write-Host "Total: $($ServicesToBuild.Count)"
Write-Host "Success: $($Results.Success.Count)" -ForegroundColor Green

if ($Results.Failed.Count -gt 0) {
    Write-Host "Failed: $($Results.Failed.Count)" -ForegroundColor Red
    Write-Host "Failed services: $($Results.Failed -join ', ')" -ForegroundColor Red
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($Results.Failed.Count -gt 0) {
    Write-Err "Some builds failed!"
    exit 1
}
else {
    Write-Info "All builds completed successfully!"
}
