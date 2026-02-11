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

:wait_localstack
echo Waiting for LocalStack...
curl -sf http://localhost:14566/_localstack/health >nul 2>&1
if errorlevel 1 (
    timeout /t 3 /nobreak >nul
    goto wait_localstack
)
echo LocalStack is ready

echo.
echo ============================================
echo All infrastructure services are ready!
echo ============================================
echo.
echo Service URLs:
echo   - PostgreSQL:    localhost:15432 (hr_saas/hr_saas_password)
echo   - Redis:         localhost:16379
echo   - LocalStack:    http://localhost:14566
echo   - Jaeger:        http://localhost:16686
echo   - Prometheus:    http://localhost:19090
echo   - Grafana:       http://localhost:13000 (admin/admin)
echo   - Traefik:       http://localhost:18080 (API Gateway)
echo   - Traefik Dash:  http://localhost:18090
echo.
echo To start app services: docker-compose --profile app up -d
echo To stop: scripts\stop-local.bat
echo.
