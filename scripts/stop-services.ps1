<#
.SYNOPSIS
    HR SaaS Backend Services Stopper - Docker (PowerShell)
.DESCRIPTION
    Stops all running backend Docker containers.
.PARAMETER Down
    Remove containers and networks (docker-compose down) instead of just stopping
.PARAMETER All
    Stop all services including infrastructure (DB, Redis, etc.)
#>

param(
    [switch]$Down,
    [switch]$All
)

$ErrorActionPreference = "SilentlyContinue"
$DockerDir = (Resolve-Path "$PSScriptRoot\..\docker").Path

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " HR SaaS Backend Services Stopper" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $DockerDir

if ($All) {
    Write-Host "Stopping all services (including infrastructure)..." -ForegroundColor Yellow
    if ($Down) {
        docker-compose --profile app down
    } else {
        docker-compose --profile app stop
        docker-compose stop
    }
} else {
    Write-Host "Stopping application services..." -ForegroundColor Yellow
    if ($Down) {
        docker-compose --profile app down
    } else {
        docker-compose --profile app stop
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " Backend services stopped." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

if (-not $All) {
    Write-Host "Infrastructure (DB, Redis, etc.) is still running." -ForegroundColor Gray
    Write-Host "To stop everything: .\scripts\stop-services.ps1 -All" -ForegroundColor Gray
    Write-Host ""
}
