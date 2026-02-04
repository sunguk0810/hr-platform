@echo off
REM HR SaaS Platform - Windows Docker Image Build Script
REM Usage: build-images.bat [service-name|all] [tag]

setlocal enabledelayedexpansion

set SERVICE=%1
set TAG=%2
set AWS_REGION=ap-northeast-2
set PROJECT=hr-platform

if "%SERVICE%"=="" set SERVICE=all
if "%TAG%"=="" set TAG=latest

set ALL_SERVICES=gateway-service auth-service tenant-service organization-service employee-service attendance-service approval-service mdm-service

echo ============================================
echo HR SaaS Platform - Docker Image Build
echo ============================================
echo Service: %SERVICE%
echo Tag: %TAG%
echo ============================================
echo.

REM Get ECR registry
echo [INFO] Getting ECR registry...
for /f "tokens=*" %%i in ('aws ecr describe-repositories --repository-names "%PROJECT%/gateway-service" --query "repositories[0].repositoryUri" --output text 2^>nul') do set ECR_URI=%%i

if "%ECR_URI%"=="" (
    echo [ERROR] Failed to get ECR registry. Make sure AWS CLI is configured and ECR repositories exist.
    exit /b 1
)

for /f "tokens=1 delims=/" %%a in ("%ECR_URI%") do set ECR_REGISTRY=%%a
echo [INFO] ECR Registry: %ECR_REGISTRY%
echo.

REM Login to ECR
echo [INFO] Logging in to ECR...
aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %ECR_REGISTRY%

if %errorlevel% neq 0 (
    echo [ERROR] Failed to login to ECR
    exit /b 1
)

echo.

REM Determine services to build
if "%SERVICE%"=="all" (
    set SERVICES_TO_BUILD=%ALL_SERVICES%
) else (
    set SERVICES_TO_BUILD=%SERVICE%
)

echo [INFO] Services to build: %SERVICES_TO_BUILD%
echo.

REM Build and push each service
for %%s in (%SERVICES_TO_BUILD%) do (
    echo ============================================
    echo [INFO] Building %%s...
    echo ============================================

    REM Determine Dockerfile
    if "%%s"=="gateway-service" (
        set DOCKERFILE=docker\Dockerfile.gateway
    ) else (
        set DOCKERFILE=docker\Dockerfile.service
    )

    REM Determine port
    if "%%s"=="gateway-service" set PORT=8080
    if "%%s"=="auth-service" set PORT=8081
    if "%%s"=="tenant-service" set PORT=8082
    if "%%s"=="organization-service" set PORT=8083
    if "%%s"=="employee-service" set PORT=8084
    if "%%s"=="attendance-service" set PORT=8085
    if "%%s"=="approval-service" set PORT=8086
    if "%%s"=="mdm-service" set PORT=8087

    echo [INFO] Using Dockerfile: !DOCKERFILE!
    echo [INFO] Port: !PORT!

    REM Build image
    docker build ^
        --build-arg SERVICE_NAME=%%s ^
        --build-arg SERVER_PORT=!PORT! ^
        -t %ECR_REGISTRY%/%PROJECT%/%%s:%TAG% ^
        -t %ECR_REGISTRY%/%PROJECT%/%%s:latest ^
        -f !DOCKERFILE! .

    if !errorlevel! neq 0 (
        echo [ERROR] Failed to build %%s
        continue
    )

    echo [INFO] Pushing %%s...

    REM Push images
    docker push %ECR_REGISTRY%/%PROJECT%/%%s:%TAG%
    docker push %ECR_REGISTRY%/%PROJECT%/%%s:latest

    if !errorlevel! equ 0 (
        echo [INFO] Successfully pushed %%s
    ) else (
        echo [ERROR] Failed to push %%s
    )

    echo.
)

echo ============================================
echo Build Summary
echo ============================================
echo Tag: %TAG%
echo Services: %SERVICES_TO_BUILD%
echo ============================================
echo.
echo [INFO] Build completed!

endlocal
