@echo off
echo ============================================
echo HR SaaS Backend Services Stopper
echo ============================================
echo.

:: Kill all Java processes related to Spring Boot services
echo Stopping all backend services...

:: Find and kill processes by window title
taskkill /FI "WINDOWTITLE eq config-server*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq gateway-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq auth-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq tenant-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq organization-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq employee-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq attendance-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq approval-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq mdm-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq notification-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq file-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq appointment-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq certificate-service*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq recruitment-service*" /F >nul 2>&1

:: Also kill by port if processes are still running
echo Checking for remaining processes on service ports...

for %%p in (8888 8080 8081 8082 8083 8084 8085 8086 8087 8088 8089 8091 8092 8093) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo.
echo ============================================
echo All backend services stopped.
echo ============================================
echo.
echo Note: Docker infrastructure is still running.
echo To stop Docker: scripts\stop-local.bat
