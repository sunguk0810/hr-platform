<#
.SYNOPSIS
    HR SaaS Backend Services Starter (PowerShell)
.DESCRIPTION
    Starts all or selected backend Spring Boot services with proper dependency order.
.PARAMETER NoBuild
    Skip the build step and use existing builds
.PARAMETER Services
    Array of specific services to start (default: all)
.PARAMETER Parallel
    Start services in parallel (faster but harder to debug)
.EXAMPLE
    .\start-services.ps1
    Start all services
.EXAMPLE
    .\start-services.ps1 -NoBuild
    Start all services without building
.EXAMPLE
    .\start-services.ps1 -Services gateway-service,employee-service
    Start specific services only
#>

param(
    [switch]$NoBuild,
    [string[]]$Services,
    [switch]$Parallel,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Resolve project root path
$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path

# Service configuration
$ServiceConfig = @{
    "config-server"       = @{ Port = 8888; Path = ":infra:config-server"; Priority = 1 }
    "gateway-service"     = @{ Port = 8080; Path = ":services:gateway-service"; Priority = 2 }
    "auth-service"        = @{ Port = 8081; Path = ":services:auth-service"; Priority = 2 }
    "tenant-service"      = @{ Port = 8082; Path = ":services:tenant-service"; Priority = 2 }
    "organization-service"= @{ Port = 8083; Path = ":services:organization-service"; Priority = 2 }
    "employee-service"    = @{ Port = 8084; Path = ":services:employee-service"; Priority = 2 }
    "attendance-service"  = @{ Port = 8085; Path = ":services:attendance-service"; Priority = 2 }
    "approval-service"    = @{ Port = 8086; Path = ":services:approval-service"; Priority = 2 }
    "mdm-service"         = @{ Port = 8087; Path = ":services:mdm-service"; Priority = 2 }
    "notification-service"= @{ Port = 8088; Path = ":services:notification-service"; Priority = 2 }
    "file-service"        = @{ Port = 8089; Path = ":services:file-service"; Priority = 2 }
    "appointment-service" = @{ Port = 8091; Path = ":services:appointment-service"; Priority = 2 }
    "certificate-service" = @{ Port = 8092; Path = ":services:certificate-service"; Priority = 2 }
    "recruitment-service" = @{ Port = 8093; Path = ":services:recruitment-service"; Priority = 2 }
}

function Show-Help {
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "HR SaaS Backend Services Starter" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\start-services.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -NoBuild      Skip build step"
    Write-Host "  -Services     Comma-separated list of services"
    Write-Host "  -Parallel     Start services in parallel"
    Write-Host "  -Help         Show this help"
    Write-Host ""
    Write-Host "Available Services:"
    $ServiceConfig.Keys | Sort-Object | ForEach-Object {
        Write-Host "  - $_ (port: $($ServiceConfig[$_].Port))"
    }
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\start-services.ps1"
    Write-Host "  .\start-services.ps1 -NoBuild"
    Write-Host "  .\start-services.ps1 -Services gateway-service,employee-service"
}

function Test-Infrastructure {
    try {
        $result = docker ps 2>$null | Select-String "hr-saas-postgres"
        return $null -ne $result
    } catch {
        return $false
    }
}

function Wait-ForService {
    param([string]$ServiceName, [int]$Port, [int]$TimeoutSeconds = 120)

    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port/actuator/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch { }
        Start-Sleep -Seconds 3
        $elapsed += 3
        Write-Host "  Waiting for $ServiceName... ($elapsed s)" -ForegroundColor Yellow
    }
    return $false
}

function Start-Service {
    param([string]$ServiceName, [hashtable]$Config)

    $port = $Config.Port
    $gradlePath = $Config.Path

    Write-Host "Starting $ServiceName [port: $port]..." -ForegroundColor Green

    $process = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/k", "title $ServiceName [$port] && cd /d `"$ProjectRoot`" && .\gradlew.bat ${gradlePath}:bootRun" `
        -PassThru

    return $process
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "HR SaaS Backend Services Starter" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $ProjectRoot

# Check infrastructure
if (-not (Test-Infrastructure)) {
    Write-Host "[WARNING] Docker infrastructure not running!" -ForegroundColor Yellow
    Write-Host "Starting infrastructure first..." -ForegroundColor Yellow
    & "$PSScriptRoot\start-local.bat"
    Start-Sleep -Seconds 5
}

# Determine services to start
if ($Services -and $Services.Count -gt 0) {
    $servicesToStart = $Services
} else {
    $servicesToStart = $ServiceConfig.Keys
}

# Build if needed
if (-not $NoBuild) {
    Write-Host "[1/2] Building all services..." -ForegroundColor Cyan
    $buildResult = & .\gradlew.bat build -x test --parallel -q
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Build completed." -ForegroundColor Green
    Write-Host ""
}

Write-Host "[2/2] Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start config-server first if in the list
if ($servicesToStart -contains "config-server") {
    Start-Service -ServiceName "config-server" -Config $ServiceConfig["config-server"]

    Write-Host "Waiting for config-server to be ready..." -ForegroundColor Yellow
    if (Wait-ForService -ServiceName "config-server" -Port 8888 -TimeoutSeconds 90) {
        Write-Host "config-server is ready!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] config-server may not be fully ready" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Start remaining services
$remainingServices = $servicesToStart | Where-Object { $_ -ne "config-server" }

if ($Parallel) {
    # Start all at once
    $remainingServices | ForEach-Object {
        Start-Service -ServiceName $_ -Config $ServiceConfig[$_]
    }
} else {
    # Start with small delays
    foreach ($service in $remainingServices) {
        Start-Service -ServiceName $service -Config $ServiceConfig[$service]
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "All services are starting!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Ports:" -ForegroundColor White
Write-Host "  Config Server:     http://localhost:8888"
Write-Host "  Gateway:           http://localhost:8080"
Write-Host "  Auth:              http://localhost:8081"
Write-Host "  Tenant:            http://localhost:8082"
Write-Host "  Organization:      http://localhost:8083"
Write-Host "  Employee:          http://localhost:8084"
Write-Host "  Attendance:        http://localhost:8085"
Write-Host "  Approval:          http://localhost:8086"
Write-Host "  MDM:               http://localhost:8087"
Write-Host "  Notification:      http://localhost:8088"
Write-Host "  File:              http://localhost:8089"
Write-Host "  Appointment:       http://localhost:8091"
Write-Host "  Certificate:       http://localhost:8092"
Write-Host "  Recruitment:       http://localhost:8093"
Write-Host ""
Write-Host "To stop all services: .\scripts\stop-services.ps1" -ForegroundColor Yellow
