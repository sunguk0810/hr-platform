#!/bin/bash
# ============================================================================
# load-sample-data.sh
# HR SaaS Platform - Sample Data Loader for AWS RDS
# ============================================================================

set -e

echo "============================================"
echo "HR SaaS - Sample Data Loader"
echo "============================================"
echo ""

# Install aws cli and psql if needed
if ! command -v psql &> /dev/null; then
    echo "Installing postgresql-client..."
    apk add --no-cache postgresql-client aws-cli
fi

# Get credentials from environment
DB_HOST="${DB_HOST:-hr-platform-dev-postgres.ctcisj5baejq.ap-northeast-2.rds.amazonaws.com}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-hr_saas}"
DB_USER="${DB_USER:-hr_saas_admin}"
DB_PASSWORD="${DB_PASSWORD}"
S3_BUCKET="${S3_BUCKET:-hr-platform-dev-scripts}"

export PGPASSWORD="$DB_PASSWORD"

echo "Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "S3 Bucket: $S3_BUCKET"
echo ""

# Create working directory
mkdir -p /tmp/sql
cd /tmp/sql

# Download scripts from S3
echo "Downloading migration scripts from S3..."
aws s3 sync "s3://${S3_BUCKET}/migrations/" ./migrations/ --region ap-northeast-2

echo "Downloading sample data scripts from S3..."
aws s3 sync "s3://${S3_BUCKET}/sample-data/" ./sample-data/ --region ap-northeast-2

echo ""
echo "============================================"
echo "Step 1: Running Flyway Migrations"
echo "============================================"
echo ""

# Run migrations in order for each service
services="tenant-service mdm-service organization-service employee-service attendance-service approval-service notification-service file-service recruitment-service appointment-service certificate-service auth-service"

for service in $services; do
    echo "Running migrations for $service..."
    if [ -d "./migrations/${service}" ]; then
        for sql_file in $(ls ./migrations/${service}/*.sql 2>/dev/null | sort); do
            echo "  Executing: $(basename $sql_file)"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_file" -q 2>&1 || echo "    (may already exist)"
        done
    fi
done

echo ""
echo "============================================"
echo "Step 2: Running Sample Data Scripts"
echo "============================================"
echo ""

# Run sample data scripts in order
cd ./sample-data

# Skip the migrations runner since we already ran migrations
for script in 00_reset_sample_data.sql \
              01_tenant_seed.sql \
              02_tenant_policy_feature.sql \
              03_mdm_code_groups.sql \
              04_mdm_common_codes.sql \
              05_organization_grades_positions.sql \
              06_organization_departments.sql \
              07_employee_generator.sql \
              08_employee_execute.sql \
              09_employee_details_generator.sql \
              10_attendance_holidays.sql \
              11_leave_balance_generator.sql \
              12_attendance_generator.sql \
              13_leave_overtime_generator.sql \
              14_approval_templates.sql \
              15_approval_generator.sql \
              16_notification_generator.sql \
              17_file_generator.sql \
              18_recruitment_generator.sql \
              19_appointment_generator.sql \
              20_certificate_generator.sql \
              21_auth_login_history_generator.sql; do
    if [ -f "$script" ]; then
        echo "Executing: $script"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$script" 2>&1 || echo "Error in $script (continuing...)"
        echo ""
    fi
done

echo ""
echo "============================================"
echo "Step 3: Verification"
echo "============================================"
echo ""

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT '테넌트' as 테이블, COUNT(*)::TEXT as 건수 FROM tenant_common.tenant
UNION ALL SELECT '직원', COUNT(*)::TEXT FROM hr_core.employee
UNION ALL SELECT '부서', COUNT(*)::TEXT FROM hr_core.department
UNION ALL SELECT '근태기록', COUNT(*)::TEXT FROM hr_attendance.attendance_record
UNION ALL SELECT '결재문서', COUNT(*)::TEXT FROM hr_approval.approval_document;
"

echo ""
echo "============================================"
echo "Sample Data Load Complete!"
echo "============================================"
echo ""
echo "Test Accounts:"
echo "  - superadmin / Admin@2025!"
echo "  - ceo.elec / Ceo@2025!"
echo "  - hr.admin.elec / HrAdmin@2025!"
echo ""
