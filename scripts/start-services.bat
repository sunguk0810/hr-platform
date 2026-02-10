@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo HR SaaS Backend Services Starter (Docker)
echo ============================================
echo.

cd /d "%~dp0..\docker"

:: Parse arguments
set NO_BUILD=0
set SELECTED_SERVICES=

:parse_args
if "%~1"=="" goto :done_args
if /i "%~1"=="--no-build" set NO_BUILD=1 & shift & goto :parse_args
if /i "%~1"=="--service" set SELECTED_SERVICES=!SELECTED_SERVICES! %~2 & shift & shift & goto :parse_args
if /i "%~1"=="--help" goto :show_help
shift
goto :parse_args

:done_args

:: Check if infrastructure is running
docker ps | findstr hr-saas-postgres >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Infrastructure not running. Starting Docker services first...
    docker-compose up -d
    echo.
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
    curl -sf http://localhost:4566/_localstack/health >nul 2>&1
    if errorlevel 1 (
        timeout /t 3 /nobreak >nul
        goto wait_localstack
    )
    echo LocalStack is ready
    echo.
)

:: Build and start app services
if "%SELECTED_SERVICES%"=="" (
    echo Starting all application services...
    echo.

    if %NO_BUILD%==0 (
        echo [1/2] Building and starting services...
        docker-compose --profile app up -d --build
    ) else (
        echo [1/1] Starting services (skip build)...
        docker-compose --profile app up -d
    )
) else (
    echo Starting selected services:%SELECTED_SERVICES%
    echo.

    if %NO_BUILD%==0 (
        echo [1/2] Building and starting services...
        docker-compose up -d --build%SELECTED_SERVICES%
    ) else (
        echo [1/1] Starting services (skip build)...
        docker-compose up -d%SELECTED_SERVICES%
    )
)

if errorlevel 1 (
    echo [ERROR] Failed to start services!
    exit /b 1
)

echo.
echo ============================================
echo All services are starting!
echo ============================================
echo.
echo Service Ports:
echo   - Auth:              http://localhost:8081
echo   - Tenant:            http://localhost:8082
echo   - Organization:      http://localhost:8083
echo   - Employee:          http://localhost:8084
echo   - Attendance:        http://localhost:8085
echo   - Approval:          http://localhost:8086
echo   - MDM:               http://localhost:8087
echo   - Notification:      http://localhost:8088
echo   - File:              http://localhost:8089
echo   - Appointment:       http://localhost:8091
echo   - Certificate:       http://localhost:8092
echo   - Recruitment:       http://localhost:8093
echo.
echo   - Traefik Gateway:   http://localhost:18080
echo.
echo View logs: docker-compose --profile app logs -f
echo Stop:      scripts\stop-services.bat
echo.
goto :eof

:show_help
echo Usage: start-services.bat [options]
echo.
echo Options:
echo   --no-build          Skip Docker build (use existing images)
echo   --service NAME      Start specific service only (can be repeated)
echo   --help              Show this help
echo.
echo Examples:
echo   start-services.bat                          Start all services
echo   start-services.bat --no-build               Start without building images
echo   start-services.bat --service auth-service --service employee-service
echo.
goto :eof
