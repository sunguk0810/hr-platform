# ============================================
# HR SaaS Platform - Health Check Script (PowerShell)
# ============================================
# Quick validation of all services and infrastructure
#
# Usage:
#   .\scripts\health-check.ps1
#
# Exit codes:
#   0 - All services healthy
#   1 - One or more services down
# ============================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "HR SaaS Platform - Health Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$Failures = 0

# Service definitions
$Services = @(
    # Infrastructure
    @{Host="localhost"; Port=15432; Label="PostgreSQL Database"}
    @{Host="localhost"; Port=16379; Label="Redis Cache"}
    @{Host="localhost"; Port=14566; Label="LocalStack (AWS)"}
    @{Host="localhost"; Port=16686; Label="Jaeger Tracing"}
    @{Host="localhost"; Port=19090; Label="Prometheus Metrics"}
    @{Host="localhost"; Port=13000; Label="Grafana Dashboard"}
    @{Host="localhost"; Port=18080; Label="Traefik Gateway"}

    # Application Services
    @{Host="localhost"; Port=8081; Label="Auth Service"}
    @{Host="localhost"; Port=8082; Label="Tenant Service"}
    @{Host="localhost"; Port=8083; Label="Organization Service"}
    @{Host="localhost"; Port=8084; Label="Employee Service"}
    @{Host="localhost"; Port=8085; Label="Attendance Service"}
    @{Host="localhost"; Port=8086; Label="Approval Service"}
    @{Host="localhost"; Port=8087; Label="MDM Service"}
    @{Host="localhost"; Port=8088; Label="Notification Service"}
    @{Host="localhost"; Port=8089; Label="File Service"}
    @{Host="localhost"; Port=8091; Label="Appointment Service"}
    @{Host="localhost"; Port=8092; Label="Certificate Service"}
    @{Host="localhost"; Port=8093; Label="Recruitment Service"}
)

function Test-Service {
    param (
        [string]$Host,
        [int]$Port,
        [string]$Label
    )

    # Try actuator health endpoint first (for Spring Boot services)
    try {
        $response = Invoke-WebRequest -Uri "http://${Host}:${Port}/actuator/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ $Label - HEALTHY (Actuator)" -ForegroundColor Green
            return $true
        }
    }
    catch {
        # Fallback to port check
    }

    # Fallback to simple port check
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($Host, $Port)
        $tcpClient.Close()
        Write-Host "✓ $Label - HEALTHY (Port)" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ $Label - DOWN" -ForegroundColor Red
        return $false
    }
}

# Check each service
foreach ($service in $Services) {
    $result = Test-Service -Host $service.Host -Port $service.Port -Label $service.Label
    if (-not $result) {
        $Failures++
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan

# Summary
if ($Failures -eq 0) {
    Write-Host "All services are healthy!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "$Failures service(s) are down or unreachable" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Check if services are running: docker-compose ps"
    Write-Host "  - View logs: docker-compose logs [service-name]"
    Write-Host "  - Restart services: docker-compose restart [service-name]"
    exit 1
}
