#!/bin/bash

echo "Starting HR SaaS Local Environment..."

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Start Docker Compose (infrastructure only)
docker-compose up -d

echo "Waiting for services to be ready..."

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
until docker exec hr-saas-postgres pg_isready -U hr_saas > /dev/null 2>&1; do
    sleep 2
done
echo "PostgreSQL is ready"

# Wait for Redis
echo "Waiting for Redis..."
until docker exec hr-saas-redis redis-cli -a redis_password ping 2>/dev/null | grep PONG > /dev/null; do
    sleep 2
done
echo "Redis is ready"

# Wait for LocalStack
echo "Waiting for LocalStack..."
until curl -sf http://localhost:14566/_localstack/health > /dev/null 2>&1; do
    sleep 3
done
echo "LocalStack is ready"

echo ""
echo "============================================"
echo "All infrastructure services are ready!"
echo "============================================"
echo ""
echo "Service URLs:"
echo "  - PostgreSQL:    localhost:15432 (hr_saas/hr_saas_password)"
echo "  - Redis:         localhost:16379"
echo "  - LocalStack:    http://localhost:14566"
echo "  - Jaeger:        http://localhost:16686"
echo "  - Prometheus:    http://localhost:19090"
echo "  - Grafana:       http://localhost:13000 (admin/admin)"
echo "  - Traefik:       http://localhost:18080 (API Gateway)"
echo "  - Traefik Dash:  http://localhost:18090"
echo ""
echo "To start app services: docker-compose --profile app up -d"
echo "To stop: ./scripts/stop-local.sh"
