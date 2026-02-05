@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo HR SaaS Backend Services Starter
echo ============================================
echo.

cd /d "%~dp0.."

:: Check if infrastructure is running
docker ps | findstr hr-saas-postgres >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Infrastructure not running. Starting Docker services first...
    call scripts\start-local.bat
    echo.
)

:: Service list with ports
set SERVICES=config-server gateway-service auth-service tenant-service organization-service employee-service attendance-service approval-service mdm-service notification-service file-service appointment-service certificate-service recruitment-service

:: Service ports for display
set PORT_config-server=8888
set PORT_gateway-service=8080
set PORT_auth-service=8081
set PORT_tenant-service=8082
set PORT_organization-service=8083
set PORT_employee-service=8084
set PORT_attendance-service=8085
set PORT_approval-service=8086
set PORT_mdm-service=8087
set PORT_notification-service=8088
set PORT_file-service=8089
set PORT_appointment-service=8091
set PORT_certificate-service=8092
set PORT_recruitment-service=8093

:: Parse arguments
set START_ALL=1
set SKIP_BUILD=0
set SELECTED_SERVICES=

:parse_args
if "%~1"=="" goto :done_args
if /i "%~1"=="--no-build" set SKIP_BUILD=1 & shift & goto :parse_args
if /i "%~1"=="--service" set START_ALL=0 & set SELECTED_SERVICES=!SELECTED_SERVICES! %~2 & shift & shift & goto :parse_args
if /i "%~1"=="--help" goto :show_help
shift
goto :parse_args

:done_args

:: Show help
if "%1"=="--help" goto :show_help

echo Starting backend services...
echo.

:: Build first (optional)
if %SKIP_BUILD%==0 (
    echo [1/2] Building all services...
    call .\gradlew.bat build -x test --parallel -q
    if errorlevel 1 (
        echo [ERROR] Build failed!
        exit /b 1
    )
    echo Build completed.
    echo.
)

:: Start config-server first (required by other services)
echo [2/2] Starting services...
echo.

:: Determine which services to start
if %START_ALL%==1 (
    set SERVICES_TO_START=%SERVICES%
) else (
    set SERVICES_TO_START=%SELECTED_SERVICES%
)

:: Start config-server first if in the list
echo %SERVICES_TO_START% | findstr /i "config-server" >nul
if not errorlevel 1 (
    echo Starting config-server [port: 8888]...
    start "config-server [8888]" cmd /k "cd /d %~dp0.. && .\gradlew.bat :infra:config-server:bootRun"

    :: Wait for config-server to be ready
    echo Waiting for config-server to be ready...
    :wait_config
    curl -s http://localhost:8888/actuator/health >nul 2>&1
    if errorlevel 1 (
        timeout /t 3 /nobreak >nul
        goto :wait_config
    )
    echo config-server is ready.
    echo.
)

:: Start remaining services
for %%s in (%SERVICES_TO_START%) do (
    if /i not "%%s"=="config-server" (
        set SERVICE_NAME=%%s
        set PORT=!PORT_%%s!

        :: Determine gradle path
        if "%%s"=="gateway-service" (
            set GRADLE_PATH=:services:gateway-service
        ) else if "%%s"=="auth-service" (
            set GRADLE_PATH=:services:auth-service
        ) else if "%%s"=="tenant-service" (
            set GRADLE_PATH=:services:tenant-service
        ) else if "%%s"=="organization-service" (
            set GRADLE_PATH=:services:organization-service
        ) else if "%%s"=="employee-service" (
            set GRADLE_PATH=:services:employee-service
        ) else if "%%s"=="attendance-service" (
            set GRADLE_PATH=:services:attendance-service
        ) else if "%%s"=="approval-service" (
            set GRADLE_PATH=:services:approval-service
        ) else if "%%s"=="mdm-service" (
            set GRADLE_PATH=:services:mdm-service
        ) else if "%%s"=="notification-service" (
            set GRADLE_PATH=:services:notification-service
        ) else if "%%s"=="file-service" (
            set GRADLE_PATH=:services:file-service
        ) else if "%%s"=="appointment-service" (
            set GRADLE_PATH=:services:appointment-service
        ) else if "%%s"=="certificate-service" (
            set GRADLE_PATH=:services:certificate-service
        ) else if "%%s"=="recruitment-service" (
            set GRADLE_PATH=:services:recruitment-service
        )

        echo Starting %%s [port: !PORT!]...
        start "%%s [!PORT!]" cmd /k "cd /d %~dp0.. && .\gradlew.bat !GRADLE_PATH!:bootRun"

        :: Small delay to prevent port conflicts during startup
        timeout /t 2 /nobreak >nul
    )
)

echo.
echo ============================================
echo All services are starting!
echo ============================================
echo.
echo Service Ports:
echo   - Config Server:     http://localhost:8888
echo   - Gateway:           http://localhost:8080
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
echo To stop all services: scripts\stop-services.bat
echo.
goto :eof

:show_help
echo Usage: start-services.bat [options]
echo.
echo Options:
echo   --no-build          Skip build step (use existing builds)
echo   --service NAME      Start specific service only (can be repeated)
echo   --help              Show this help
echo.
echo Examples:
echo   start-services.bat                          Start all services
echo   start-services.bat --no-build               Start without building
echo   start-services.bat --service employee-service --service gateway-service
echo.
goto :eof
