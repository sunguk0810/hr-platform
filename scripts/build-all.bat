@echo off
echo Building all modules...

cd /d "%~dp0.."

call gradlew.bat clean build -x test --parallel

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Build completed successfully!
    echo ============================================
) else (
    echo.
    echo ============================================
    echo Build failed!
    echo ============================================
    exit /b 1
)
