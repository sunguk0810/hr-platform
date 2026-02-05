<#
.SYNOPSIS
    HR SaaS Backend Services Stopper (PowerShell)
.DESCRIPTION
    Stops all running backend Spring Boot services gracefully.
#>

param(
    [switch]$Force
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "HR SaaS Backend Services Stopper" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ServicePorts = @(8888, 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8091, 8092, 8093)

Write-Host "Stopping backend services..." -ForegroundColor Yellow

# Kill by window title
$windowTitles = @(
    "config-server", "gateway-service", "auth-service", "tenant-service",
    "organization-service", "employee-service", "attendance-service",
    "approval-service", "mdm-service", "notification-service",
    "file-service", "appointment-service", "certificate-service", "recruitment-service"
)

foreach ($title in $windowTitles) {
    Get-Process | Where-Object { $_.MainWindowTitle -like "*$title*" } | ForEach-Object {
        Write-Host "  Stopping $($_.MainWindowTitle)..." -ForegroundColor Gray
        $_ | Stop-Process -Force -ErrorAction SilentlyContinue
    }
}

# Kill processes by port
Write-Host ""
Write-Host "Checking remaining processes on ports..." -ForegroundColor Yellow

foreach ($port in $ServicePorts) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    foreach ($conn in $connections) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  Killing process on port $port (PID: $($process.Id))..." -ForegroundColor Gray
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

# Kill any remaining gradle daemons (optional)
if ($Force) {
    Write-Host ""
    Write-Host "Force stopping Gradle daemons..." -ForegroundColor Yellow
    & .\gradlew.bat --stop 2>$null
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "All backend services stopped." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Docker infrastructure is still running." -ForegroundColor Gray
Write-Host "To stop Docker: .\scripts\stop-local.bat" -ForegroundColor Gray
