#!/bin/bash
# HR SaaS Platform - Manual Deployment Script
# Usage: ./deploy.sh <environment> [service-name] [image-tag]

set -e

# Configuration
ENVIRONMENT=${1:-dev}
SERVICE=${2:-all}
IMAGE_TAG=${3:-latest}
AWS_REGION=${AWS_REGION:-ap-northeast-2}
PROJECT="hr-platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# All services
ALL_SERVICES=(
  "gateway-service"
  "auth-service"
  "tenant-service"
  "organization-service"
  "employee-service"
  "attendance-service"
  "approval-service"
  "mdm-service"
)

# Functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_environment() {
  if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod."
    exit 1
  fi
}

# Get ECR registry
get_ecr_registry() {
  aws ecr describe-repositories \
    --repository-names "${PROJECT}/gateway-service" \
    --query 'repositories[0].repositoryUri' \
    --output text | cut -d'/' -f1
}

# Deploy a single service
deploy_service() {
  local SERVICE_NAME=$1
  local ECR_REGISTRY=$2

  log_info "Deploying $SERVICE_NAME..."

  # Get current task definition
  TASK_DEF=$(aws ecs describe-task-definition \
    --task-definition "${PROJECT}-${ENVIRONMENT}-${SERVICE_NAME}" \
    --query 'taskDefinition' \
    --output json 2>/dev/null || echo "")

  if [ -z "$TASK_DEF" ]; then
    log_warn "Task definition not found for $SERVICE_NAME. Skipping..."
    return
  fi

  # Update image
  NEW_IMAGE="${ECR_REGISTRY}/${PROJECT}/${SERVICE_NAME}:${IMAGE_TAG}"

  NEW_TASK_DEF=$(echo $TASK_DEF | jq --arg IMAGE "$NEW_IMAGE" \
    '.containerDefinitions[0].image = $IMAGE |
     del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')

  # Register new task definition
  NEW_TASK_ARN=$(aws ecs register-task-definition \
    --cli-input-json "$NEW_TASK_DEF" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

  log_info "Registered task definition: $NEW_TASK_ARN"

  # Update service
  aws ecs update-service \
    --cluster "${PROJECT}-${ENVIRONMENT}" \
    --service "$SERVICE_NAME" \
    --task-definition "$NEW_TASK_ARN" \
    --force-new-deployment \
    --output text > /dev/null

  log_info "Service update initiated for $SERVICE_NAME"
}

# Wait for service stability
wait_for_stability() {
  local SERVICE_NAME=$1

  log_info "Waiting for $SERVICE_NAME to stabilize..."

  aws ecs wait services-stable \
    --cluster "${PROJECT}-${ENVIRONMENT}" \
    --services "$SERVICE_NAME" \
    --region "$AWS_REGION"

  log_info "$SERVICE_NAME is stable!"
}

# Main deployment logic
main() {
  validate_environment

  log_info "Starting deployment to $ENVIRONMENT environment"
  log_info "Image tag: $IMAGE_TAG"

  # Get ECR registry
  ECR_REGISTRY=$(get_ecr_registry)
  log_info "ECR Registry: $ECR_REGISTRY"

  # Determine services to deploy
  if [ "$SERVICE" == "all" ]; then
    SERVICES_TO_DEPLOY=("${ALL_SERVICES[@]}")
  else
    SERVICES_TO_DEPLOY=("$SERVICE")
  fi

  log_info "Services to deploy: ${SERVICES_TO_DEPLOY[*]}"

  # Deploy services
  for SVC in "${SERVICES_TO_DEPLOY[@]}"; do
    deploy_service "$SVC" "$ECR_REGISTRY"
  done

  # Wait for stability
  log_info "Waiting for all services to stabilize..."
  for SVC in "${SERVICES_TO_DEPLOY[@]}"; do
    wait_for_stability "$SVC"
  done

  log_info "Deployment completed successfully!"

  # Print summary
  echo ""
  echo "=========================================="
  echo "Deployment Summary"
  echo "=========================================="
  echo "Environment: $ENVIRONMENT"
  echo "Image Tag: $IMAGE_TAG"
  echo "Services: ${SERVICES_TO_DEPLOY[*]}"
  echo "=========================================="
}

# Run main
main
