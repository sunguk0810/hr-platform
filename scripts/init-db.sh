#!/bin/bash
# ============================================
# Database Initialization Script
# ============================================
# Initializes the database schema and optionally loads sample data
#
# Usage:
#   ./scripts/init-db.sh              # Schema only
#   ./scripts/init-db.sh --sample     # Schema + sample data
#   ./scripts/init-db.sh --reset      # Drop all + recreate schema
#
# Options:
#   --sample    Load sample data after schema initialization
#   --reset     Drop all tables before initialization (DESTRUCTIVE!)
#   --help      Show this help
# ============================================

set -e

SCRIPT_DIR="$(dirname "$0")"
DOCKER_DIR="$SCRIPT_DIR/../docker"
SAMPLE_DATA_DIR="$SCRIPT_DIR/sample-data"

LOAD_SAMPLE=false
RESET=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --sample)
            LOAD_SAMPLE=true
            ;;
        --reset)
            RESET=true
            ;;
        --help)
            echo "Usage: $0 [--sample] [--reset] [--help]"
            echo ""
            echo "Options:"
            echo "  --sample    Load sample data (100+ test users, attendance, etc.)"
            echo "  --reset     Drop all tables first (DESTRUCTIVE!)"
            echo "  --help      Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                # Initialize schema only"
            echo "  $0 --sample       # Initialize schema + load sample data"
            echo "  $0 --reset        # Drop all and reinitialize"
            exit 0
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "==========================================="
echo "HR SaaS Platform - Database Initialization"
echo "==========================================="
echo ""

# Check if PostgreSQL is running
if ! docker ps | grep -q hr-saas-postgres; then
    echo "Error: PostgreSQL container is not running"
    echo "Start it with: cd docker && docker-compose up -d postgres"
    exit 1
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec hr-saas-postgres pg_isready -U hr_saas > /dev/null 2>&1; do
    sleep 2
done
echo "[OK] PostgreSQL is ready"
echo ""

# Reset if requested
if [ "$RESET" = true ]; then
    echo "[WARNING] Dropping all tables..."
    docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas <<EOF
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
EOF
    echo "[OK] All tables dropped"
    echo ""
fi

# Initialize schema
echo "[STEP] Initializing database schema..."
cd "$DOCKER_DIR"
docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas < postgres/init.sql

if [ $? -eq 0 ]; then
    echo "[OK] Database schema initialized successfully"
else
    echo "[ERROR] Failed to initialize database schema"
    exit 1
fi
echo ""

# Load sample data if requested
if [ "$LOAD_SAMPLE" = true ]; then
    echo "[STEP] Validating sample data SQL..."

    # Run validation (PowerShell preferred on Windows, Bash fallback)
    if command -v pwsh &> /dev/null; then
        pwsh "$SAMPLE_DATA_DIR/validate-sql.ps1" -File "$SAMPLE_DATA_DIR/99_combined_all.sql"
        VALIDATION_RESULT=$?
    elif command -v powershell &> /dev/null; then
        powershell -ExecutionPolicy Bypass -File "$SAMPLE_DATA_DIR/validate-sql.ps1" -File "$SAMPLE_DATA_DIR/99_combined_all.sql"
        VALIDATION_RESULT=$?
    else
        echo "[WARNING] PowerShell not found, skipping validation"
        echo "Install PowerShell for enhanced validation: https://aka.ms/powershell"
        VALIDATION_RESULT=0
    fi

    if [ $VALIDATION_RESULT -ne 0 ]; then
        echo "[ERROR] SQL validation failed. See validation report above."
        echo "Fix errors and retry with: $0 --sample"
        exit 1
    fi

    echo "[OK] SQL validation passed"
    echo ""

    echo "[STEP] Loading sample data (with safe execution)..."

    # Execute with validation and backup
    if command -v pwsh &> /dev/null; then
        pwsh "$SAMPLE_DATA_DIR/execute-sample-data.ps1" -Mode phased
        EXECUTION_RESULT=$?
    elif command -v powershell &> /dev/null; then
        powershell -ExecutionPolicy Bypass -File "$SAMPLE_DATA_DIR/execute-sample-data.ps1" -Mode phased
        EXECUTION_RESULT=$?
    else
        # Fallback to direct psql execution (no validation/backup)
        echo "[WARNING] PowerShell not found, using direct execution (no backup)"
        if [ -f "$SAMPLE_DATA_DIR/99_combined_all.sql" ]; then
            docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas < "$SAMPLE_DATA_DIR/99_combined_all.sql"
            EXECUTION_RESULT=$?
        else
            echo "[ERROR] Sample data file not found: $SAMPLE_DATA_DIR/99_combined_all.sql"
            exit 1
        fi
    fi

    if [ $EXECUTION_RESULT -eq 0 ]; then
        echo "[OK] Sample data loaded successfully"
        echo ""
        echo "Test accounts created:"
        echo "  - superadmin / Admin@2025!"
        echo "  - ceo.elec / Ceo@2025!"
        echo "  - hr.admin.elec / HrAdmin@2025!"
        echo "  - dev.manager.elec / DevMgr@2025!"
        echo "  - dev.staff.elec / DevStaff@2025!"
        echo ""
        echo "See scripts/sample-data/README.md for all accounts"
    else
        echo "[ERROR] Failed to load sample data"
        exit 1
    fi
fi

echo ""
echo "==========================================="
echo "Database initialization complete!"
echo "==========================================="
echo ""
echo "Connect to database:"
echo "  psql -h localhost -p 15432 -U hr_saas -d hr_saas"
echo ""
echo "View tables:"
echo '  docker exec hr-saas-postgres psql -U hr_saas -d hr_saas -c "\dt"'
echo ""
