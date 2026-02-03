@echo off
echo Starting HR SaaS Local Environment...

cd /d "%~dp0..\docker"

docker-compose up -d

echo Waiting for services to be ready...

:wait_postgres
echo Waiting for PostgreSQL...
docker exec hr-saas-postgres pg_isready -U hr_saas >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo PostgreSQL is ready

:wait_redis
echo Waiting for Redis...
docker exec hr-saas-redis redis-cli -a redis_password ping 2>nul | findstr PONG >nul
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto wait_redis
)
echo Redis is ready

echo Waiting for Kafka...
timeout /t 10 /nobreak >nul
echo Kafka is ready

:wait_keycloak
echo Waiting for Keycloak...
curl -s http://localhost:8180/realms/master >nul 2>&1
if errorlevel 1 (
    timeout /t 5 /nobreak >nul
    goto wait_keycloak
)
echo Keycloak is ready

echo.
echo ============================================
echo All services are ready!
echo ============================================
echo.
echo Service URLs:
echo   - PostgreSQL:  localhost:5432 (hr_saas/hr_saas_password)
echo   - Redis:       localhost:6379
echo   - Kafka:       localhost:9092
echo   - Kafka UI:    http://localhost:8090
echo   - Keycloak:    http://localhost:8180 (admin/admin)
echo   - Jaeger:      http://localhost:16686
echo   - Prometheus:  http://localhost:9090
echo   - Grafana:     http://localhost:3000 (admin/admin)
echo.
echo To stop: scripts\stop-local.bat
