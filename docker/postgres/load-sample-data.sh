#!/bin/sh
# ============================================================================
# load-sample-data.sh
# HR SaaS Platform - Sample Data Loader
# ============================================================================

set -e

echo "============================================"
echo "HR SaaS - Loading Sample Data"
echo "============================================"
echo ""

# Check if sample data directory exists
if [ ! -d "/sample-data" ]; then
    echo "WARNING: Sample data directory not found at /sample-data"
    echo "Skipping sample data loading..."
    exit 0
fi

# Check if the main run script exists
if [ ! -f "/sample-data/99_run_all.sql" ]; then
    echo "WARNING: Main sample data script not found at /sample-data/99_run_all.sql"
    echo "Skipping sample data loading..."
    exit 0
fi

echo "Starting sample data load..."
echo "This may take 40-60 minutes for full dataset (~75,000 employees)"
echo ""

# Change to sample-data directory for relative path includes
cd /sample-data

# Execute the main sample data script
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f 99_run_all.sql

echo ""
echo "============================================"
echo "Sample data loaded successfully!"
echo "============================================"
echo ""
echo "Test Accounts:"
echo "  - superadmin / Admin@2025!    (SUPER_ADMIN)"
echo "  - ceo.elec / Ceo@2025!        (TENANT_ADMIN)"
echo "  - hr.admin.elec / HrAdmin@2025! (HR_ADMIN)"
echo "  - hr.manager.elec / HrMgr@2025! (HR_MANAGER)"
echo "  - dev.manager.elec / DevMgr@2025! (MANAGER)"
echo "  - dev.staff.elec / DevStaff@2025! (EMPLOYEE)"
echo ""
