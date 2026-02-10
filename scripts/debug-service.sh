#!/bin/bash
# ============================================
# Debug Service Helper Script
# ============================================
# Starts a service in debug mode with hot reload
#
# Usage:
#   ./scripts/debug-service.sh auth-service
#   ./scripts/debug-service.sh employee-service
#
# Debug ports (see docker-compose.dev.yml):
#   auth:         5005
#   tenant:       5006
#   organization: 5007
#   employee:     5008
#   attendance:   5009
#   approval:     5010
#   mdm:          5011
#   notification: 5012
#   file:         5013
#   appointment:  5014
#   certificate:  5015
#   recruitment:  5016
# ============================================

set -e

SERVICE_NAME=$1

if [ -z "$SERVICE_NAME" ]; then
  echo "Error: Service name required"
  echo ""
  echo "Usage: $0 <service-name>"
  echo ""
  echo "Available services:"
  echo "  - auth-service"
  echo "  - tenant-service"
  echo "  - organization-service"
  echo "  - employee-service"
  echo "  - attendance-service"
  echo "  - approval-service"
  echo "  - mdm-service"
  echo "  - notification-service"
  echo "  - file-service"
  echo "  - appointment-service"
  echo "  - certificate-service"
  echo "  - recruitment-service"
  exit 1
fi

# Map service name to debug port
case $SERVICE_NAME in
  auth-service) DEBUG_PORT=5005 ;;
  tenant-service) DEBUG_PORT=5006 ;;
  organization-service) DEBUG_PORT=5007 ;;
  employee-service) DEBUG_PORT=5008 ;;
  attendance-service) DEBUG_PORT=5009 ;;
  approval-service) DEBUG_PORT=5010 ;;
  mdm-service) DEBUG_PORT=5011 ;;
  notification-service) DEBUG_PORT=5012 ;;
  file-service) DEBUG_PORT=5013 ;;
  appointment-service) DEBUG_PORT=5014 ;;
  certificate-service) DEBUG_PORT=5015 ;;
  recruitment-service) DEBUG_PORT=5016 ;;
  *)
    echo "Error: Unknown service '$SERVICE_NAME'"
    exit 1
    ;;
esac

echo "==========================================="
echo "Starting $SERVICE_NAME in DEBUG mode"
echo "==========================================="
echo ""
echo "Debug port: localhost:$DEBUG_PORT"
echo "Hot reload: ENABLED (< 5s restart on code changes)"
echo ""
echo "IntelliJ IDEA:"
echo "  Run > Edit Configurations > Remote JVM Debug"
echo "  Host: localhost, Port: $DEBUG_PORT"
echo ""
echo "VS Code:"
echo '  Add to launch.json: {"type": "java", "request": "attach", "hostName": "localhost", "port": '$DEBUG_PORT'}'
echo ""

# Start service with dev mode
cd "$(dirname "$0")/.." || exit 1
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d "$SERVICE_NAME"

echo ""
echo "Service started! Attach your debugger to localhost:$DEBUG_PORT"
echo ""
echo "View logs:"
echo "  docker-compose logs -f $SERVICE_NAME"
echo ""
echo "Stop service:"
echo "  docker-compose stop $SERVICE_NAME"
