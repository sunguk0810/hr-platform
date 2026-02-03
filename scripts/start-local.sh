#!/bin/bash

echo "Starting HR SaaS Local Environment..."

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Start Docker Compose
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

# Wait for Kafka
echo "Waiting for Kafka..."
sleep 10
echo "Kafka is ready"

# Wait for Keycloak
echo "Waiting for Keycloak..."
until curl -s http://localhost:8180/realms/master > /dev/null 2>&1; do
    sleep 5
done
echo "Keycloak is ready"

echo ""
echo "============================================"
echo "All services are ready!"
echo "============================================"
echo ""
echo "Service URLs:"
echo "  - PostgreSQL:  localhost:5432 (hr_saas/hr_saas_password)"
echo "  - Redis:       localhost:6379"
echo "  - Kafka:       localhost:9092"
echo "  - Kafka UI:    http://localhost:8090"
echo "  - Keycloak:    http://localhost:8180 (admin/admin)"
echo "  - Jaeger:      http://localhost:16686"
echo "  - Prometheus:  http://localhost:9090"
echo "  - Grafana:     http://localhost:3000 (admin/admin)"
echo ""
echo "To stop: ./scripts/stop-local.sh"
