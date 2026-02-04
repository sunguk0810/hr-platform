@echo off
REM HR SaaS Platform - Windows Deployment Script
REM Usage: deploy.bat [environment] [service-name] [image-tag]

setlocal enabledelayedexpansion

REM Configuration
set ENVIRONMENT=%1
set SERVICE=%2
set IMAGE_TAG=%3
set AWS_REGION=ap-northeast-2
set PROJECT=hr-platform

REM Default values
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev
if "%SERVICE%"=="" set SERVICE=all
if "%IMAGE_TAG%"=="" set IMAGE_TAG=latest

REM All services
set ALL_SERVICES=gateway-service auth-service tenant-service organization-service employee-service attendance-service approval-service mdm-service

REM Validate environment
if not "%ENVIRONMENT%"=="dev" if not "%ENVIRONMENT%"=="staging" if not "%ENVIRONMENT%"=="prod" (
    echo [ERROR] Invalid environment: %ENVIRONMENT%. Must be dev, staging, or prod.
    exit /b 1
)

echo ============================================
echo HR SaaS Platform - AWS Deployment
echo ============================================
echo Environment: %ENVIRONMENT%
echo Service: %SERVICE%
echo Image Tag: %IMAGE_TAG%
echo ============================================
echo.

REM Get ECR registry
echo [INFO] Getting ECR registry...
for /f "tokens=*" %%i in ('aws ecr describe-repositories --repository-names "%PROJECT%/gateway-service" --query "repositories[0].repositoryUri" --output text 2^>nul') do set ECR_URI=%%i

if "%ECR_URI%"=="" (
    echo [ERROR] Failed to get ECR registry. Make sure AWS CLI is configured.
    exit /b 1
)

REM Extract registry from URI
for /f "tokens=1 delims=/" %%a in ("%ECR_URI%") do set ECR_REGISTRY=%%a
echo [INFO] ECR Registry: %ECR_REGISTRY%
echo.

REM Determine services to deploy
if "%SERVICE%"=="all" (
    set SERVICES_TO_DEPLOY=%ALL_SERVICES%
) else (
    set SERVICES_TO_DEPLOY=%SERVICE%
)

echo [INFO] Services to deploy: %SERVICES_TO_DEPLOY%
echo.

REM Deploy each service
for %%s in (%SERVICES_TO_DEPLOY%) do (
    echo [INFO] Deploying %%s...

    REM Get current task definition
    aws ecs describe-task-definition --task-definition "%PROJECT%-%ENVIRONMENT%-%%s" --query "taskDefinition" --output json > temp_task_def.json 2>nul

    if not exist temp_task_def.json (
        echo [WARN] Task definition not found for %%s. Skipping...
    ) else (
        REM Update service with force new deployment
        aws ecs update-service --cluster "%PROJECT%-%ENVIRONMENT%" --service "%%s" --force-new-deployment --output text >nul 2>&1

        if !errorlevel! equ 0 (
            echo [INFO] Service update initiated for %%s
        ) else (
            echo [ERROR] Failed to update %%s
        )

        del temp_task_def.json 2>nul
    )
)

echo.
echo [INFO] Waiting for services to stabilize...

REM Wait for stability
for %%s in (%SERVICES_TO_DEPLOY%) do (
    echo [INFO] Waiting for %%s...
    aws ecs wait services-stable --cluster "%PROJECT%-%ENVIRONMENT%" --services "%%s" --region "%AWS_REGION%" 2>nul

    if !errorlevel! equ 0 (
        echo [INFO] %%s is stable!
    ) else (
        echo [WARN] Timeout waiting for %%s
    )
)

echo.
echo ============================================
echo Deployment Summary
echo ============================================
echo Environment: %ENVIRONMENT%
echo Image Tag: %IMAGE_TAG%
echo Services: %SERVICES_TO_DEPLOY%
echo ============================================

echo.
echo [INFO] Deployment completed!

endlocal
