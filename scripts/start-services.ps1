<#
.SYNOPSIS
    HR SaaS Backend Services Starter - Docker (PowerShell)
.DESCRIPTION
    Builds and starts backend services as Docker containers using docker-compose profiles.
.PARAMETER NoBuild
    Skip Docker image build step (use existing images)
.PARAMETER Services
    Specific services to start (default: all)
.EXAMPLE
    .\start-services.ps1
.EXAMPLE
    .\start-services.ps1 -NoBuild
.EXAMPLE
    .\start-services.ps1 -Services auth-service,employee-service
#>

param(
    [switch]$NoBuild,
    [string[]]$Services,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$DockerDir = (Resolve-Path "$PSScriptRoot\..\docker").Path

$ServiceConfig = [ordered]@{
    "auth-service"        = @{ Port = 8081; Color = "Yellow" }
    "tenant-service"      = @{ Port = 8082; Color = "Magenta" }
    "organization-service"= @{ Port = 8083; Color = "Blue" }
    "employee-service"    = @{ Port = 8084; Color = "Red" }
    "attendance-service"  = @{ Port = 8085; Color = "DarkCyan" }
    "approval-service"    = @{ Port = 8086; Color = "DarkGreen" }
    "mdm-service"         = @{ Port = 8087; Color = "DarkYellow" }
    "notification-service"= @{ Port = 8088; Color = "DarkMagenta" }
    "file-service"        = @{ Port = 8089; Color = "White" }
    "appointment-service" = @{ Port = 8091; Color = "DarkRed" }
    "certificate-service" = @{ Port = 8092; Color = "Gray" }
    "recruitment-service" = @{ Port = 8093; Color = "DarkGray" }
}

if ($Help) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " HR SaaS Backend Services Starter" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\start-services.ps1 [-NoBuild] [-Services service1,service2]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -NoBuild    Skip Docker image build"
    Write-Host "  -Services   Comma-separated list of services to start"
    Write-Host "  -Help       Show this help"
    Write-Host ""
    Write-Host "Available Services:"
    $ServiceConfig.Keys | ForEach-Object {
        $cfg = $ServiceConfig[$_]
        Write-Host ("  {0,-24} port {1}" -f $_, $cfg.Port) -ForegroundColor $cfg.Color
    }
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\start-services.ps1"
    Write-Host "  .\scripts\start-services.ps1 -NoBuild"
    Write-Host "  .\scripts\start-services.ps1 -Services auth-service,employee-service"
    Write-Host ""
    Write-Host "View logs:  cd docker && docker-compose --profile app logs -f"
    Write-Host "Stop:       .\scripts\stop-services.ps1"
    exit 0
}

# ============================================
# Main Execution
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " HR SaaS Backend Services Starter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $DockerDir

# Check if infrastructure is running
$pgRunning = docker ps 2>$null | Select-String "hr-saas-postgres"
if (-not $pgRunning) {
    Write-Host "[WARNING] Infrastructure not running. Starting..." -ForegroundColor Yellow
    docker-compose up -d
    Write-Host ""

    Write-Host "Waiting for PostgreSQL..." -ForegroundColor Gray
    do { Start-Sleep -Seconds 2 } until (docker exec hr-saas-postgres pg_isready -U hr_saas 2>$null)
    Write-Host "[OK] PostgreSQL is ready" -ForegroundColor Green

    Write-Host "Waiting for Redis..." -ForegroundColor Gray
    do { Start-Sleep -Seconds 2 } until ((docker exec hr-saas-redis redis-cli -a redis_password ping 2>$null) -match "PONG")
    Write-Host "[OK] Redis is ready" -ForegroundColor Green

    Write-Host "Waiting for LocalStack..." -ForegroundColor Gray
    do { Start-Sleep -Seconds 3 } until (curl.exe -sf http://localhost:4566/_localstack/health 2>$null)
    Write-Host "[OK] LocalStack is ready" -ForegroundColor Green
    Write-Host ""
}
else {
    Write-Host "[OK] Infrastructure running" -ForegroundColor Green
}

# Determine services to start
$servicesToStart = if ($Services -and $Services.Count -gt 0) { $Services } else { $null }

if ($servicesToStart) {
    Write-Host "[INFO] Services: $($servicesToStart -join ', ')" -ForegroundColor Gray
} else {
    Write-Host "[INFO] Starting all application services" -ForegroundColor Gray
}
Write-Host ""

# Build and start
if ($servicesToStart) {
    if ($NoBuild) {
        Write-Host "[STEP] Starting selected services..." -ForegroundColor Yellow
        docker-compose up -d @servicesToStart
    } else {
        Write-Host "[STEP] Building and starting selected services..." -ForegroundColor Yellow
        docker-compose up -d --build @servicesToStart
    }
} else {
    if ($NoBuild) {
        Write-Host "[STEP] Starting all services..." -ForegroundColor Yellow
        docker-compose --profile app up -d
    } else {
        Write-Host "[STEP] Building and starting all services..." -ForegroundColor Yellow
        docker-compose --profile app up -d --build
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start services!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " All services are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Show service status
Write-Host "Service Ports:" -ForegroundColor Cyan
$ServiceConfig.Keys | ForEach-Object {
    $cfg = $ServiceConfig[$_]
    Write-Host ("  {0,-24} http://localhost:{1}" -f $_, $cfg.Port) -ForegroundColor $cfg.Color
}
Write-Host ""
Write-Host "  Traefik Gateway:       http://localhost:18080" -ForegroundColor Cyan
Write-Host ""
Write-Host "View logs: docker-compose --profile app logs -f" -ForegroundColor Gray
Write-Host "Stop:      .\scripts\stop-services.ps1" -ForegroundColor Gray
Write-Host ""
