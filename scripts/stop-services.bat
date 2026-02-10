@echo off
echo ============================================
echo HR SaaS Backend Services Stopper (Docker)
echo ============================================
echo.

cd /d "%~dp0..\docker"

echo Stopping all application services...
docker-compose --profile app stop

echo.
echo ============================================
echo All backend services stopped.
echo ============================================
echo.
echo Note: Infrastructure services (DB, Redis, etc.) are still running.
echo To stop everything: cd docker ^&^& docker-compose --profile app down
echo To stop all (including infra): cd docker ^&^& docker-compose down
echo.
