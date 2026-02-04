@echo off
REM HR SaaS Platform - AWS Initial Setup Script for Windows
REM Usage: setup-aws.bat [environment]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
set AWS_REGION=ap-northeast-2
set PROJECT=hr-platform

if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

echo ============================================
echo HR SaaS Platform - AWS Initial Setup
echo ============================================
echo Environment: %ENVIRONMENT%
echo Region: %AWS_REGION%
echo ============================================
echo.

REM Check AWS CLI
echo [INFO] Checking AWS CLI...
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS CLI is not installed. Please install it first.
    echo Download: https://aws.amazon.com/cli/
    exit /b 1
)
echo [INFO] AWS CLI is installed
echo.

REM Check Terraform
echo [INFO] Checking Terraform...
terraform --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Terraform is not installed. Please install it first.
    echo Download: https://www.terraform.io/downloads
    exit /b 1
)
echo [INFO] Terraform is installed
echo.

REM Check Docker
echo [INFO] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    echo Download: https://www.docker.com/products/docker-desktop
    exit /b 1
)
echo [INFO] Docker is installed
echo.

REM Check AWS credentials
echo [INFO] Checking AWS credentials...
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] AWS credentials are not configured.
    echo Please run: aws configure
    exit /b 1
)
echo [INFO] AWS credentials are valid
echo.

REM Navigate to Terraform directory
echo [INFO] Initializing Terraform...
cd infra\aws\terraform\environments\%ENVIRONMENT%

REM Initialize Terraform
terraform init

if %errorlevel% neq 0 (
    echo [ERROR] Terraform initialization failed
    exit /b 1
)

echo.
echo [INFO] Running Terraform plan...
terraform plan -out=tfplan

if %errorlevel% neq 0 (
    echo [ERROR] Terraform plan failed
    exit /b 1
)

echo.
echo ============================================
echo Terraform plan completed successfully!
echo ============================================
echo.
echo To apply the changes, run:
echo   cd infra\aws\terraform\environments\%ENVIRONMENT%
echo   terraform apply tfplan
echo.
echo Or use the deployment script:
echo   infra\aws\scripts\deploy.bat %ENVIRONMENT% all latest
echo ============================================

cd ..\..\..\..\..\

endlocal
