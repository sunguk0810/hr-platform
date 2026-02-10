#!/bin/bash
# ============================================
# HR SaaS Platform - Health Check Script
# ============================================
# Quick validation of all services and infrastructure
#
# Usage:
#   ./scripts/health-check.sh
#
# Exit codes:
#   0 - All services healthy
#   1 - One or more services down
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "==========================================="
echo "HR SaaS Platform - Health Check"
echo "==========================================="
echo ""

# Track failures
FAILURES=0

# Service definitions: name:port:label
SERVICES=(
  # Infrastructure
  "localhost:5433:PostgreSQL Database"
  "localhost:6381:Redis Cache"
  "localhost:4566:LocalStack (AWS)"
  "localhost:16686:Jaeger Tracing"
  "localhost:9009:Prometheus Metrics"
  "localhost:3000:Grafana Dashboard"
  "localhost:18080:Traefik Gateway"

  # Application Services (with actuator health endpoints)
  "localhost:8081:Auth Service"
  "localhost:8082:Tenant Service"
  "localhost:8083:Organization Service"
  "localhost:8084:Employee Service"
  "localhost:8085:Attendance Service"
  "localhost:8086:Approval Service"
  "localhost:8087:MDM Service"
  "localhost:8088:Notification Service"
  "localhost:8089:File Service"
  "localhost:8091:Appointment Service"
  "localhost:8092:Certificate Service"
  "localhost:8093:Recruitment Service"
)

check_service() {
  local HOST_PORT=$1
  local LABEL=$2
  local HOST=$(echo $HOST_PORT | cut -d: -f1)
  local PORT=$(echo $HOST_PORT | cut -d: -f2)

  # Try actuator health endpoint first (for Spring Boot services)
  if curl -sf "http://${HOST_PORT}/actuator/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $LABEL - HEALTHY (Actuator)"
    return 0
  fi

  # Fallback to simple port check
  if nc -z $HOST $PORT 2>&1 > /dev/null; then
    echo -e "${GREEN}✓${NC} $LABEL - HEALTHY (Port)"
    return 0
  fi

  # Service is down
  echo -e "${RED}✗${NC} $LABEL - DOWN"
  ((FAILURES++))
  return 1
}

# Check each service
for service in "${SERVICES[@]}"; do
  IFS=':' read -r host port label <<< "$service"
  check_service "${host}:${port}" "$label"
done

echo ""
echo "==========================================="

# Summary
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All services are healthy!${NC}"
  exit 0
else
  echo -e "${YELLOW}$FAILURES service(s) are down or unreachable${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "  - Check if services are running: docker-compose ps"
  echo "  - View logs: docker-compose logs [service-name]"
  echo "  - Restart services: docker-compose restart [service-name]"
  exit 1
fi
