# ============================================
# Debug Service Helper Script (PowerShell)
# ============================================
# Starts a service in debug mode with hot reload
#
# Usage:
#   .\scripts\debug-service.ps1 auth-service
#   .\scripts\debug-service.ps1 employee-service
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName
)

# Debug port mapping
$DebugPorts = @{
    "auth-service" = 5005
    "tenant-service" = 5006
    "organization-service" = 5007
    "employee-service" = 5008
    "attendance-service" = 5009
    "approval-service" = 5010
    "mdm-service" = 5011
    "notification-service" = 5012
    "file-service" = 5013
    "appointment-service" = 5014
    "certificate-service" = 5015
    "recruitment-service" = 5016
}

if (-not $DebugPorts.ContainsKey($ServiceName)) {
    Write-Host "Error: Unknown service '$ServiceName'" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available services:" -ForegroundColor Yellow
    $DebugPorts.Keys | ForEach-Object { Write-Host "  - $_" }
    exit 1
}

$DebugPort = $DebugPorts[$ServiceName]

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Starting $ServiceName in DEBUG mode" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Debug port: localhost:$DebugPort" -ForegroundColor Green
Write-Host "Hot reload: ENABLED" -ForegroundColor Green
Write-Host ""
Write-Host "IntelliJ IDEA:" -ForegroundColor Yellow
Write-Host "  Run > Edit Configurations > Remote JVM Debug"
Write-Host "  Host: localhost, Port: $DebugPort"
Write-Host ""

# Change to project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Push-Location $projectRoot

try {
    docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d $ServiceName
    
    Write-Host ""
    Write-Host "Service started! Attach debugger to localhost:$DebugPort" -ForegroundColor Green
}
finally {
    Pop-Location
}
