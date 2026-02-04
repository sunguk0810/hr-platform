# HR SaaS Platform - PowerShell Database Migration Script
# Usage: .\migrate-db.ps1 [-Environment dev] [-Info]

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",

    [switch]$Info
)

# Configuration
$AwsRegion = "ap-northeast-2"
$Project = "hr-platform"

# Migration order (dependencies matter)
$MigrationOrder = @(
    "tenant-service",
    "auth-service",
    "mdm-service",
    "organization-service",
    "employee-service",
    "attendance-service",
    "approval-service"
)

# Color output functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "HR SaaS Platform - Database Migration" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get database credentials from Secrets Manager
Write-Info "Fetching database credentials from Secrets Manager..."

try {
    $dbCredsJson = aws secretsmanager get-secret-value `
        --secret-id "$Project/$Environment/db-credentials" `
        --query "SecretString" `
        --output text `
        --region $AwsRegion 2>$null

    if ([string]::IsNullOrEmpty($dbCredsJson)) {
        throw "Secret not found"
    }

    $dbCreds = $dbCredsJson | ConvertFrom-Json
    $DbHost = $dbCreds.host
    $DbPort = $dbCreds.port
    $DbUsername = $dbCreds.username
    $DbPassword = $dbCreds.password
    $DbName = $dbCreds.database

    Write-Info "Database: ${DbHost}:${DbPort}/${DbName}"
}
catch {
    Write-Err "Failed to get database credentials. Make sure AWS CLI is configured."
    Write-Err $_.Exception.Message
    exit 1
}

Write-Host ""

# Info mode - just show migration status
if ($Info) {
    Write-Info "Checking migration status..."
    Write-Host ""

    foreach ($service in $MigrationOrder) {
        Write-Host "--- $service ---" -ForegroundColor Yellow

        & .\gradlew.bat ":services:${service}:flywayInfo" --no-daemon `
            "-Dflyway.url=jdbc:postgresql://${DbHost}:${DbPort}/${DbName}" `
            "-Dflyway.user=$DbUsername" `
            "-Dflyway.password=$DbPassword" 2>$null

        Write-Host ""
    }

    exit 0
}

# Track results
$FailedServices = @()
$SuccessServices = @()

# Run migrations in order
foreach ($service in $MigrationOrder) {
    Write-Info "Running migrations for $service..."

    $migrationDir = "services\$service\src\main\resources\db\migration"

    if (-not (Test-Path $migrationDir)) {
        Write-Warn "No migration directory found for $service. Skipping..."
        continue
    }

    & .\gradlew.bat ":services:${service}:flywayMigrate" --no-daemon `
        "-Dflyway.url=jdbc:postgresql://${DbHost}:${DbPort}/${DbName}" `
        "-Dflyway.user=$DbUsername" `
        "-Dflyway.password=$DbPassword" `
        "-Dflyway.outOfOrder=true" `
        "-Dflyway.baselineOnMigrate=true"

    if ($LASTEXITCODE -eq 0) {
        Write-Info "✅ $service migration successful"
        $SuccessServices += $service
    }
    else {
        Write-Err "❌ $service migration failed"
        $FailedServices += $service
    }

    Write-Host ""
}

# Print summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host "Total services: $($MigrationOrder.Count)"
Write-Host "Successful: $($SuccessServices.Count)" -ForegroundColor Green
Write-Host "Failed: $($FailedServices.Count)" -ForegroundColor $(if ($FailedServices.Count -gt 0) { "Red" } else { "Green" })

if ($FailedServices.Count -gt 0) {
    Write-Host "Failed services: $($FailedServices -join ', ')" -ForegroundColor Red
}

Write-Host "============================================" -ForegroundColor Cyan

if ($FailedServices.Count -gt 0) {
    Write-Err "Some migrations failed!"
    exit 1
}
else {
    Write-Info "All migrations completed successfully!"
}
