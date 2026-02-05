<#
.SYNOPSIS
    HR SaaS Backend Services Stopper (PowerShell)
.DESCRIPTION
    Stops all running backend Spring Boot services gracefully.
.PARAMETER Force
    Force stop Gradle daemons as well
#>

param(
    [switch]$Force
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "HR SaaS Backend Services Stopper" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ServicePorts = @(8888, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8091, 8092, 8093)

# Stop PowerShell background jobs first
Write-Host "Stopping PowerShell background jobs..." -ForegroundColor Yellow
$serviceNames = @(
    "config-server", "gateway-service", "auth-service", "tenant-service",
    "organization-service", "employee-service", "attendance-service",
    "approval-service", "mdm-service", "notification-service",
    "file-service", "appointment-service", "certificate-service", "recruitment-service"
)

foreach ($name in $serviceNames) {
    $job = Get-Job -Name $name -ErrorAction SilentlyContinue
    if ($job) {
        Write-Host "  Stopping job: $name..." -ForegroundColor Gray
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
    }
}

# Also stop any other running jobs
Get-Job | Where-Object { $_.State -eq 'Running' } | ForEach-Object {
    Write-Host "  Stopping job: $($_.Name)..." -ForegroundColor Gray
    Stop-Job -Job $_ -ErrorAction SilentlyContinue
    Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Stopping processes on service ports..." -ForegroundColor Yellow

foreach ($port in $ServicePorts) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
                       Where-Object { $_.State -eq 'Listen' }
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  Port $port -> PID $($process.Id) ($($process.ProcessName)) - stopping..." -ForegroundColor Gray
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        # Port not in use, ignore
    }
}

# Kill Java processes running bootRun
Write-Host ""
Write-Host "Stopping Java bootRun processes..." -ForegroundColor Yellow

Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*bootRun*" -or $_.CommandLine -like "*spring*" } |
    ForEach-Object {
        Write-Host "  Stopping Java process (PID: $($_.ProcessId))..." -ForegroundColor Gray
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

# Kill by window title (if any cmd windows are still open)
Write-Host ""
Write-Host "Stopping service windows..." -ForegroundColor Yellow

$windowTitles = @(
    "config-server", "gateway-service", "auth-service", "tenant-service",
    "organization-service", "employee-service", "attendance-service",
    "approval-service", "mdm-service", "notification-service",
    "file-service", "appointment-service", "certificate-service", "recruitment-service"
)

foreach ($title in $windowTitles) {
    Get-Process | Where-Object { $_.MainWindowTitle -like "*$title*" } | ForEach-Object {
        Write-Host "  Stopping window: $($_.MainWindowTitle)..." -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
}

# Force stop Gradle daemons if requested
if ($Force) {
    Write-Host ""
    Write-Host "Force stopping Gradle daemons..." -ForegroundColor Yellow
    $projectRoot = (Resolve-Path "$PSScriptRoot\..").Path
    Set-Location $projectRoot
    & .\gradlew.bat --stop 2>$null
}

# Clean up completed jobs
Get-Job | Where-Object { $_.State -eq 'Completed' -or $_.State -eq 'Failed' -or $_.State -eq 'Stopped' } |
    Remove-Job -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "All backend services stopped." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Docker infrastructure is still running." -ForegroundColor Gray
Write-Host "To stop Docker: cd docker && docker-compose down" -ForegroundColor Gray
Write-Host ""

# Show remaining jobs if any
$remainingJobs = Get-Job
if ($remainingJobs) {
    Write-Host "Remaining jobs:" -ForegroundColor Yellow
    $remainingJobs | Format-Table -Property Id, Name, State -AutoSize
}
