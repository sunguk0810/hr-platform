@echo off
echo Stopping HR SaaS Local Environment...

cd /d "%~dp0..\docker"

docker-compose down

echo All services stopped.
