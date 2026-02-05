<#
.SYNOPSIS
    HR SaaS Backend Services Starter (PowerShell)
.DESCRIPTION
    Starts backend Spring Boot services with real-time prefixed log output.
.PARAMETER NoBuild
    Skip the build step
.PARAMETER Services
    Specific services to start (default: all)
.EXAMPLE
    .\start-services.ps1 -NoBuild
.EXAMPLE
    .\start-services.ps1 -NoBuild -Services config-server,gateway-service
#>

param(
    [switch]$NoBuild,
    [string[]]$Services,
    [switch]$Help
)

$ErrorActionPreference = "SilentlyContinue"
$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $ProjectRoot

$ServiceConfig = [ordered]@{
    "config-server"       = @{ Port = 8888; Path = ":infra:config-server"; Color = "Cyan" }
    "gateway-service"     = @{ Port = 8080; Path = ":services:gateway-service"; Color = "Green" }
    "auth-service"        = @{ Port = 8081; Path = ":services:auth-service"; Color = "Yellow" }
    "tenant-service"      = @{ Port = 8082; Path = ":services:tenant-service"; Color = "Magenta" }
    "organization-service"= @{ Port = 8083; Path = ":services:organization-service"; Color = "Blue" }
    "employee-service"    = @{ Port = 8084; Path = ":services:employee-service"; Color = "Red" }
    "attendance-service"  = @{ Port = 8085; Path = ":services:attendance-service"; Color = "DarkCyan" }
    "approval-service"    = @{ Port = 8086; Path = ":services:approval-service"; Color = "DarkGreen" }
    "mdm-service"         = @{ Port = 8087; Path = ":services:mdm-service"; Color = "DarkYellow" }
    "notification-service"= @{ Port = 8088; Path = ":services:notification-service"; Color = "DarkMagenta" }
    "file-service"        = @{ Port = 8089; Path = ":services:file-service"; Color = "White" }
    "appointment-service" = @{ Port = 8091; Path = ":services:appointment-service"; Color = "DarkRed" }
    "certificate-service" = @{ Port = 8092; Path = ":services:certificate-service"; Color = "Gray" }
    "recruitment-service" = @{ Port = 8093; Path = ":services:recruitment-service"; Color = "DarkGray" }
}

if ($Help) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " HR SaaS Backend Services Starter" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\start-services.ps1 [-NoBuild] [-Services service1,service2]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -NoBuild    Skip Gradle build step"
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
    Write-Host "  .\scripts\start-services.ps1 -NoBuild"
    Write-Host "  .\scripts\start-services.ps1 -NoBuild -Services config-server,gateway-service"
    Write-Host ""
    Write-Host "Stop services:"
    Write-Host "  .\scripts\stop-services.ps1"
    exit 0
}

function Stop-Port {
    param([int]$Port)

    # Try multiple times to ensure port is freed
    for ($i = 0; $i -lt 3; $i++) {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
                Where-Object State -eq 'Listen'

        if (-not $conn) { return }

        foreach ($c in $conn) {
            $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "[system] Stopping process on port $Port (PID: $($proc.Id), $($proc.ProcessName))..." -ForegroundColor DarkGray
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Milliseconds 500
    }
}

function Stop-AllJobs {
    # Stop existing PowerShell jobs
    Get-Job | Where-Object { $_.Name -in $ServiceConfig.Keys } | ForEach-Object {
        Stop-Job -Job $_ -ErrorAction SilentlyContinue
        Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue
    }
}

# ============================================
# Main Execution
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " HR SaaS Backend Services Starter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
if (-not (docker ps 2>$null | Select-String "hr-saas-postgres")) {
    Write-Host "[ERROR] Docker infrastructure not running!" -ForegroundColor Red
    Write-Host "[INFO]  Start with: cd docker && docker-compose up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Docker infrastructure running" -ForegroundColor Green

# Determine services to start
$servicesToStart = if ($Services -and $Services.Count -gt 0) { $Services } else { @($ServiceConfig.Keys) }

Write-Host "[INFO] Services to start: $($servicesToStart -join ', ')" -ForegroundColor Gray
Write-Host ""

# Stop existing services
Write-Host "[STEP] Stopping existing services..." -ForegroundColor Yellow
Stop-AllJobs

foreach ($svc in $servicesToStart) {
    $port = $ServiceConfig[$svc].Port
    Stop-Port -Port $port
}

# Wait for ports to be fully released
Start-Sleep -Seconds 2

# Verify ports are free
$portsInUse = @()
foreach ($svc in $servicesToStart) {
    $port = $ServiceConfig[$svc].Port
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
            Where-Object State -eq 'Listen'
    if ($conn) {
        $portsInUse += $port
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "[WARNING] Ports still in use: $($portsInUse -join ', ')" -ForegroundColor Red
    Write-Host "[INFO] Trying to force stop..." -ForegroundColor Yellow
    foreach ($port in $portsInUse) {
        Stop-Port -Port $port
    }
    Start-Sleep -Seconds 2
}

Write-Host "[OK] Ports cleared" -ForegroundColor Green
Write-Host ""

# Build if needed
if (-not $NoBuild) {
    Write-Host "[STEP] Building all services..." -ForegroundColor Yellow
    & .\gradlew.bat build -x test --parallel -q
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Build completed" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[STEP] Starting $($servicesToStart.Count) services..." -ForegroundColor Yellow
Write-Host "[INFO] Press Ctrl+C to stop all services" -ForegroundColor DarkGray
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# Start services as background jobs
$jobs = @{}

foreach ($svc in $servicesToStart) {
    $cfg = $ServiceConfig[$svc]
    $gradlePath = $cfg.Path

    $jobs[$svc] = Start-Job -Name $svc -ScriptBlock {
        param($Root, $GradlePath)
        Set-Location $Root
        & cmd.exe /c ".\gradlew.bat ${GradlePath}:bootRun 2>&1"
    } -ArgumentList $ProjectRoot, $gradlePath

    Write-Host "[$svc] Starting on port $($cfg.Port)..." -ForegroundColor $cfg.Color

    # Small delay between service starts
    Start-Sleep -Milliseconds 800
}

Write-Host ""

# Monitor and display output
try {
    while ($true) {
        $hasRunning = $false
        $hasOutput = $false

        foreach ($svc in $jobs.Keys) {
            $job = $jobs[$svc]
            $color = $ServiceConfig[$svc].Color

            # Get new output from job
            $output = Receive-Job -Job $job -ErrorAction SilentlyContinue

            if ($output) {
                $hasOutput = $true
                $lines = $output -split "`n"

                foreach ($line in $lines) {
                    $trimmed = $line.Trim()
                    if ($trimmed) {
                        $ts = Get-Date -Format "HH:mm:ss"
                        $prefix = "[$svc]".PadRight(24)
                        Write-Host "$prefix $ts $trimmed" -ForegroundColor $color
                    }
                }
            }

            if ($job.State -eq 'Running') {
                $hasRunning = $true
            }
        }

        # All services stopped
        if (-not $hasRunning) {
            Write-Host ""
            Write-Host "[system] All services have stopped!" -ForegroundColor Red
            break
        }

        # Small sleep to avoid CPU spinning
        if (-not $hasOutput) {
            Start-Sleep -Milliseconds 200
        }
    }
}
finally {
    Write-Host ""
    Write-Host "[system] Shutting down services..." -ForegroundColor Yellow

    # Stop and remove all jobs
    foreach ($svc in $jobs.Keys) {
        $job = $jobs[$svc]
        Stop-Job -Job $job -ErrorAction SilentlyContinue
        Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
    }

    # Stop processes on ports
    foreach ($svc in $servicesToStart) {
        $port = $ServiceConfig[$svc].Port
        Stop-Port -Port $port
    }

    Write-Host "[system] All services stopped." -ForegroundColor Green
    Write-Host ""
}
