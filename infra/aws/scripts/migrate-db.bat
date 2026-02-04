@echo off
REM HR SaaS Platform - Windows Database Migration Script
REM Usage: migrate-db.bat [environment]

setlocal enabledelayedexpansion

REM Configuration
set ENVIRONMENT=%1
set AWS_REGION=ap-northeast-2
set PROJECT=hr-platform

REM Default values
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

REM Migration order (dependencies matter)
set MIGRATION_ORDER=tenant-service auth-service mdm-service organization-service employee-service attendance-service approval-service

REM Validate environment
if not "%ENVIRONMENT%"=="dev" if not "%ENVIRONMENT%"=="staging" if not "%ENVIRONMENT%"=="prod" (
    echo [ERROR] Invalid environment: %ENVIRONMENT%. Must be dev, staging, or prod.
    exit /b 1
)

echo ============================================
echo HR SaaS Platform - Database Migration
echo ============================================
echo Environment: %ENVIRONMENT%
echo ============================================
echo.

REM Get database credentials from Secrets Manager
echo [INFO] Fetching database credentials from Secrets Manager...

for /f "tokens=*" %%i in ('aws secretsmanager get-secret-value --secret-id "%PROJECT%/%ENVIRONMENT%/db-credentials" --query "SecretString" --output text --region "%AWS_REGION%" 2^>nul') do set DB_CREDS=%%i

if "%DB_CREDS%"=="" (
    echo [ERROR] Failed to get database credentials. Make sure AWS CLI is configured.
    exit /b 1
)

REM Parse JSON credentials using PowerShell
for /f "tokens=*" %%i in ('powershell -Command "(ConvertFrom-Json '%DB_CREDS%').host"') do set DB_HOST=%%i
for /f "tokens=*" %%i in ('powershell -Command "(ConvertFrom-Json '%DB_CREDS%').port"') do set DB_PORT=%%i
for /f "tokens=*" %%i in ('powershell -Command "(ConvertFrom-Json '%DB_CREDS%').username"') do set DB_USERNAME=%%i
for /f "tokens=*" %%i in ('powershell -Command "(ConvertFrom-Json '%DB_CREDS%').password"') do set DB_PASSWORD=%%i
for /f "tokens=*" %%i in ('powershell -Command "(ConvertFrom-Json '%DB_CREDS%').database"') do set DB_NAME=%%i

echo [INFO] Database: %DB_HOST%:%DB_PORT%/%DB_NAME%
echo.

REM Track failed services
set FAILED_COUNT=0
set TOTAL_COUNT=0

REM Run migrations in order
for %%s in (%MIGRATION_ORDER%) do (
    set /a TOTAL_COUNT+=1
    echo [INFO] Running migrations for %%s...

    REM Check if migration directory exists
    if exist "services\%%s\src\main\resources\db\migration" (
        call gradlew.bat :services:%%s:flywayMigrate --no-daemon -Dflyway.url="jdbc:postgresql://%DB_HOST%:%DB_PORT%/%DB_NAME%" -Dflyway.user="%DB_USERNAME%" -Dflyway.password="%DB_PASSWORD%" -Dflyway.outOfOrder=true -Dflyway.baselineOnMigrate=true

        if !errorlevel! equ 0 (
            echo [INFO] Migration completed for %%s
        ) else (
            echo [ERROR] Migration failed for %%s
            set /a FAILED_COUNT+=1
        )
    ) else (
        echo [WARN] No migration directory found for %%s. Skipping...
    )
    echo.
)

echo ============================================
echo Migration Summary
echo ============================================
echo Environment: %ENVIRONMENT%
echo Total services: %TOTAL_COUNT%
echo Failed services: %FAILED_COUNT%
echo ============================================

if %FAILED_COUNT% gtr 0 (
    echo [ERROR] Some migrations failed!
    exit /b 1
) else (
    echo [INFO] All migrations completed successfully!
)

endlocal
