#!/bin/bash
# HR SaaS Platform - Database Migration Script
# Usage: ./migrate-db.sh <environment>

set -e

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-ap-northeast-2}
PROJECT="hr-platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Migration order (dependencies matter)
MIGRATION_ORDER=(
  "tenant-service"
  "auth-service"
  "mdm-service"
  "organization-service"
  "employee-service"
  "attendance-service"
  "approval-service"
)

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

# Get database credentials from Secrets Manager
get_db_credentials() {
  log_info "Fetching database credentials from Secrets Manager..."

  DB_CREDS=$(aws secretsmanager get-secret-value \
    --secret-id "${PROJECT}/${ENVIRONMENT}/db-credentials" \
    --query 'SecretString' \
    --output text \
    --region "$AWS_REGION")

  DB_HOST=$(echo "$DB_CREDS" | jq -r '.host')
  DB_PORT=$(echo "$DB_CREDS" | jq -r '.port')
  DB_USERNAME=$(echo "$DB_CREDS" | jq -r '.username')
  DB_PASSWORD=$(echo "$DB_CREDS" | jq -r '.password')
  DB_NAME=$(echo "$DB_CREDS" | jq -r '.database')

  log_info "Database: $DB_HOST:$DB_PORT/$DB_NAME"
}

# Run migration for a service
run_migration() {
  local SERVICE=$1

  log_info "Running migrations for $SERVICE..."

  # Check if migration directory exists
  MIGRATION_DIR="services/${SERVICE}/src/main/resources/db/migration"
  if [ ! -d "$MIGRATION_DIR" ]; then
    log_warn "No migration directory found for $SERVICE. Skipping..."
    return 0
  fi

  # Run Flyway migration
  ./gradlew ":services:${SERVICE}:flywayMigrate" --no-daemon \
    -Dflyway.url="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    -Dflyway.user="${DB_USERNAME}" \
    -Dflyway.password="${DB_PASSWORD}" \
    -Dflyway.outOfOrder=true \
    -Dflyway.baselineOnMigrate=true

  if [ $? -eq 0 ]; then
    log_info "Migration completed for $SERVICE"
  else
    log_error "Migration failed for $SERVICE"
    return 1
  fi
}

# Check migration status
check_status() {
  local SERVICE=$1

  log_info "Checking migration status for $SERVICE..."

  ./gradlew ":services:${SERVICE}:flywayInfo" --no-daemon \
    -Dflyway.url="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}" \
    -Dflyway.user="${DB_USERNAME}" \
    -Dflyway.password="${DB_PASSWORD}" \
    2>/dev/null || true
}

# Main migration logic
main() {
  validate_environment

  log_info "Starting database migrations for $ENVIRONMENT environment"

  # Get database credentials
  get_db_credentials

  # Ensure gradlew is executable
  chmod +x gradlew

  # Run migrations in order
  FAILED_SERVICES=()

  for SERVICE in "${MIGRATION_ORDER[@]}"; do
    if run_migration "$SERVICE"; then
      log_info "✅ $SERVICE migration successful"
    else
      log_error "❌ $SERVICE migration failed"
      FAILED_SERVICES+=("$SERVICE")
    fi
  done

  # Print summary
  echo ""
  echo "=========================================="
  echo "Migration Summary"
  echo "=========================================="
  echo "Environment: $ENVIRONMENT"
  echo "Total services: ${#MIGRATION_ORDER[@]}"
  echo "Failed services: ${#FAILED_SERVICES[@]}"

  if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo "Failed: ${FAILED_SERVICES[*]}"
    exit 1
  else
    log_info "All migrations completed successfully!"
  fi
  echo "=========================================="
}

# Check for info flag
if [ "$2" == "--info" ]; then
  validate_environment
  get_db_credentials

  for SERVICE in "${MIGRATION_ORDER[@]}"; do
    check_status "$SERVICE"
  done
  exit 0
fi

# Run main
main
