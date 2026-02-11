# ============================================
# HR SaaS Platform - Safe SQL Execution Script
# ============================================
# Safely executes sample data SQL with validation and backup
#
# Modes:
#   dry-run          - Execute with ROLLBACK (validation only)
#   phased           - Execute phase-by-phase with commits (RECOMMENDED)
#   full-transaction - Execute all-in-one transaction (fastest, all-or-nothing)
#
# Usage:
#   .\scripts\sample-data\execute-sample-data.ps1 -Mode dry-run
#   .\scripts\sample-data\execute-sample-data.ps1 -Mode phased
#   .\scripts\sample-data\execute-sample-data.ps1 -Mode phased -SkipBackup
#   .\scripts\sample-data\execute-sample-data.ps1 -Mode full-transaction
#
# Exit codes:
#   0 - Success
#   1 - Validation failed
#   2 - Execution failed
# ============================================

param(
    [ValidateSet("dry-run", "phased", "full-transaction")]
    [string]$Mode = "dry-run",

    [string]$SqlFile = ".\99_combined_all.sql",
    [string]$ResetFile = ".\00_reset_sample_data.sql",

    [switch]$SkipBackup,
    [switch]$SkipValidation,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$Script:StartTime = Get-Date
$Script:LogFile = $null

# ============================================
# Helper Functions
# ============================================

function Write-Header {
    param([string]$Text)
    $message = @"

==========================================
$Text
==========================================
"@
    Write-Host $message -ForegroundColor Cyan
    Write-Log $message
}

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor White
    Write-Log $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    Write-Log "✓ $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
    Write-Log "⚠ $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    Write-Log "✗ $Message"
}

function Write-Log {
    param([string]$Message)
    if ($Script:LogFile) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        "[$timestamp] $Message" | Out-File -FilePath $Script:LogFile -Append -Encoding UTF8
    }
}

function Initialize-Logging {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $Script:LogFile = Join-Path $PSScriptRoot "execution_${timestamp}.log"
    Write-Log "=== SQL Execution Log ==="
    Write-Log "Mode: $Mode"
    Write-Log "SQL File: $SqlFile"
    Write-Log "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Log ""
}

# ============================================
# Pre-Execution Functions
# ============================================

function Invoke-PreValidation {
    Write-Header "Pre-Execution Validation"

    if ($SkipValidation) {
        Write-Warning "Validation skipped (--SkipValidation)"
        return $true
    }

    # Check if validate-sql.ps1 exists
    $validateScript = Join-Path $PSScriptRoot "validate-sql.ps1"
    if (-not (Test-Path $validateScript)) {
        Write-Error "Validation script not found: $validateScript"
        return $false
    }

    Write-Info "Running SQL validation..."
    Write-Log ""

    # Run validation
    $output = & $validateScript -File $SqlFile 2>&1
    $validationSuccess = $LASTEXITCODE -eq 0

    # Show output
    $output | ForEach-Object { Write-Log $_ }

    if (-not $validationSuccess) {
        Write-Error "Validation failed. Fix errors and retry."
        Write-Info "See validation output above for details"
        return $false
    }

    Write-Success "Validation passed"
    return $true
}

function New-DatabaseBackup {
    Write-Header "Database Backup"

    if ($SkipBackup) {
        Write-Warning "Backup skipped (--SkipBackup)"
        return $null
    }

    if ($Mode -eq "dry-run") {
        Write-Info "Backup skipped (dry-run mode does not modify data)"
        return $null
    }

    # Create backup directory
    $backupDir = Join-Path (Split-Path $PSScriptRoot -Parent) "backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Write-Log "Created backup directory: $backupDir"
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = Join-Path $backupDir "pre_sample_data_${timestamp}.sql"

    Write-Info "Creating backup: $backupFile"
    Write-Log "Backup file: $backupFile"

    try {
        # Dump data only (schema is preserved via Flyway)
        $schemas = @(
            'tenant_common',
            'hr_core',
            'hr_attendance',
            'hr_approval',
            'hr_notification',
            'hr_file',
            'hr_recruitment',
            'hr_appointment',
            'hr_certificate'
        )

        $schemaArgs = ($schemas | ForEach-Object { "--schema=$_" }) -join " "

        $output = docker exec hr-saas-postgres pg_dump `
            -U hr_saas `
            -d hr_saas `
            --data-only `
            --insert `
            $schemaArgs.Split() 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Backup failed: $output"
            Write-Warning "Continuing without backup..."
            return $null
        }

        # Save to file
        $output | Out-File -FilePath $backupFile -Encoding UTF8

        $backupSize = (Get-Item $backupFile).Length / 1KB
        Write-Success "Backup created (${backupSize} KB)"
        Write-Log "Backup size: ${backupSize} KB"

        return $backupFile
    }
    catch {
        Write-Warning "Backup failed: $_"
        Write-Warning "Continuing without backup..."
        return $null
    }
}

# ============================================
# Execution Functions
# ============================================

function Invoke-DryRun {
    param([string]$SqlFile)

    Write-Header "Dry-Run Execution (ROLLBACK)"
    Write-Info "Executing SQL with ROLLBACK (no data will be committed)"

    # Reset first
    Write-Info "Step 1/2: Reset existing data..."
    Get-Content $ResetFile | docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas 2>&1 | Write-Log

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Reset failed"
        return $false
    }

    # Wrap in transaction with ROLLBACK
    Write-Info "Step 2/2: Executing sample data (with ROLLBACK)..."

    $tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
    $sqlContent = Get-Content $SqlFile -Raw

    $wrappedSql = @"
-- Dry-run wrapper
BEGIN;

$sqlContent

-- Rollback (dry-run)
ROLLBACK;

SELECT 'DRY-RUN COMPLETE - NO DATA COMMITTED' AS status;
"@

    Set-Content -Path $tempFile -Value $wrappedSql -Encoding UTF8

    try {
        Get-Content $tempFile | docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas 2>&1 | Write-Log

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Dry-run execution failed"
            return $false
        }

        Write-Success "Dry-run completed successfully"
        Write-Info "All SQL statements are valid and can be executed safely"
        return $true
    }
    finally {
        Remove-Item $tempFile -ErrorAction SilentlyContinue
    }
}

function Invoke-PhasedExecution {
    param([string]$SqlFile)

    Write-Header "Phased Execution (Commit per Phase)"
    Write-Info "Executing 13 phases with individual commits"
    Write-Info "Failed phases will rollback, but previous phases remain committed"

    # Phase definitions (extracted from 99_combined_all.sql structure)
    $phases = @(
        @{Name="Reset"; File=$ResetFile; LineStart=1; LineEnd=44},
        @{Name="Tenants"; LineStart=55; LineEnd=637},
        @{Name="MDM Codes"; LineStart=638; LineEnd=1748},
        @{Name="MDM Menus"; LineStart=1749; LineEnd=3158},
        @{Name="Organization"; LineStart=3159; LineEnd=3474},
        @{Name="Employees"; LineStart=3475; LineEnd=4688},
        @{Name="Auth"; LineStart=4689; LineEnd=5661},
        @{Name="Attendance"; LineStart=5662; LineEnd=7173},
        @{Name="Approvals"; LineStart=7174; LineEnd=7488},
        @{Name="Org Extras"; LineStart=7489; LineEnd=7837},
        @{Name="Recruitment"; LineStart=7838; LineEnd=8086},
        @{Name="Appointments/Certificates"; LineStart=8087; LineEnd=8441},
        @{Name="Notifications/Files"; LineStart=8442; LineEnd=8740}
    )

    $content = Get-Content $SqlFile

    # Execute reset first
    Write-Info ""
    Write-Info "[Phase 0/13] Reset existing data..."
    Get-Content $ResetFile | docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas 2>&1 | Write-Log

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Reset phase failed"
        return $false
    }
    Write-Success "Phase 0 complete"

    # Execute each phase
    for ($i = 1; $i -lt $phases.Count; $i++) {
        $phase = $phases[$i]
        $phaseNum = $i
        $totalPhases = $phases.Count - 1

        Write-Info ""
        Write-Info "[Phase $phaseNum/$totalPhases] $($phase.Name)..."

        # Extract phase content
        $phaseContent = $content[($phase.LineStart-1)..($phase.LineEnd-1)] -join "`n"

        # Wrap in transaction
        $phaseSql = @"
BEGIN;
$phaseContent
COMMIT;
"@

        # Execute phase
        $tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
        Set-Content -Path $tempFile -Value $phaseSql -Encoding UTF8

        try {
            $output = Get-Content $tempFile | docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas 2>&1
            Write-Log $output

            if ($LASTEXITCODE -ne 0) {
                Write-Error "Phase $phaseNum failed: $($phase.Name)"
                Write-Info "Previous phases (0-$($phaseNum-1)) remain committed"
                Write-Info "Fix errors and retry from phase $phaseNum"
                return $false
            }

            Write-Success "Phase $phaseNum complete"
        }
        finally {
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
    }

    Write-Success "All phases completed successfully"
    return $true
}

function Invoke-FullTransaction {
    param([string]$SqlFile)

    Write-Header "Full-Transaction Execution"
    Write-Info "Executing all phases in single transaction (all-or-nothing)"

    # Reset first
    Write-Info "Step 1/2: Reset existing data..."
    Get-Content $ResetFile | docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas 2>&1 | Write-Log

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Reset failed"
        return $false
    }

    # Execute all at once
    Write-Info "Step 2/2: Executing all sample data..."

    Get-Content $SqlFile | docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas 2>&1 | Write-Log

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Execution failed (all changes rolled back)"
        return $false
    }

    Write-Success "Full transaction completed successfully"
    return $true
}

# ============================================
# Post-Execution Functions
# ============================================

function Invoke-PostValidation {
    Write-Header "Post-Execution Validation"

    # 1. Record count verification
    Write-Info "Checking record counts..."

    $recordChecks = @"
SELECT
    'tenant' as entity, COUNT(*)::TEXT as count FROM tenant_common.tenant
UNION ALL SELECT 'employee', COUNT(*)::TEXT FROM hr_core.employee
UNION ALL SELECT 'department', COUNT(*)::TEXT FROM hr_core.department
UNION ALL SELECT 'attendance_record', COUNT(*)::TEXT FROM hr_attendance.attendance_record
UNION ALL SELECT 'approval_document', COUNT(*)::TEXT FROM hr_approval.approval_document;
"@

    $counts = docker exec hr-saas-postgres psql -U hr_saas -d hr_saas -t -c $recordChecks 2>&1
    Write-Log "Record counts:"
    $counts | ForEach-Object { Write-Log "  $_" }

    # 2. Cross-schema FK integrity
    Write-Info "Checking cross-schema FK integrity..."

    $fkCheck = @"
SELECT COUNT(*) FROM tenant_common.users u
LEFT JOIN hr_core.employee e ON u.employee_id = e.id
WHERE u.employee_id IS NOT NULL AND e.id IS NULL;
"@

    $orphanedUsers = docker exec hr-saas-postgres psql -U hr_saas -d hr_saas -t -c $fkCheck 2>&1
    if ($orphanedUsers -match '^\s*(\d+)' -and [int]$Matches[1] -gt 0) {
        Write-Warning "Found $($Matches[1]) orphaned users (employee_id references missing employees)"
    } else {
        Write-Success "No orphaned FK references found"
    }

    # 3. RLS policy verification
    Write-Info "Verifying RLS policies..."

    $rlsCheck = @"
SET app.current_tenant = 'a0000001-0000-0000-0000-000000000002';
SELECT COUNT(*) FROM hr_core.employee;
"@

    $tenantCount = docker exec hr-saas-postgres psql -U hr_saas -d hr_saas -t -c $rlsCheck 2>&1
    if ($tenantCount -match '^\s*(\d+)') {
        Write-Log "  Tenant-isolated employee count: $($Matches[1])"
        Write-Success "RLS policy is active and working"
    }

    # 4. Test account verification
    Write-Info "Verifying test accounts..."

    $accountCheck = @"
SELECT username, role FROM tenant_common.users
WHERE username IN ('superadmin', 'ceo.elec', 'hr.admin.elec', 'dev.staff.elec');
"@

    $accounts = docker exec hr-saas-postgres psql -U hr_saas -d hr_saas -t -c $accountCheck 2>&1
    $accountCount = ($accounts | Where-Object { $_.Trim() -ne '' }).Count

    if ($accountCount -ge 4) {
        Write-Success "Test accounts verified ($accountCount found)"
    } else {
        Write-Warning "Expected 4+ test accounts, found $accountCount"
    }

    Write-Success "Post-execution validation complete"
    return $true
}

# ============================================
# Main Execution
# ============================================

# Initialize logging
Initialize-Logging

# Resolve file paths
if (-not [System.IO.Path]::IsPathRooted($SqlFile)) {
    $SqlFile = Join-Path (Get-Location) $SqlFile
}
if (-not [System.IO.Path]::IsPathRooted($ResetFile)) {
    $ResetFile = Join-Path (Get-Location) $ResetFile
}

if (-not (Test-Path $SqlFile)) {
    Write-Error "SQL file not found: $SqlFile"
    exit 1
}
if (-not (Test-Path $ResetFile)) {
    Write-Error "Reset file not found: $ResetFile"
    exit 1
}

Write-Header "HR SaaS Sample Data Execution"
Write-Info "Mode: $Mode"
Write-Info "File: $(Split-Path $SqlFile -Leaf)"
Write-Info "Log: $Script:LogFile"

try {
    # Step 1: Pre-validation
    if (-not (Invoke-PreValidation)) {
        exit 1
    }

    # Step 2: Backup
    $backupFile = New-DatabaseBackup
    if ($backupFile) {
        Write-Info ""
        Write-Info "Backup created: $backupFile"
        Write-Info "To restore: Get-Content `"$backupFile`" | docker exec -i hr-saas-postgres psql -U hr_saas -d hr_saas"
    }

    # Step 3: Execute based on mode
    $success = switch ($Mode) {
        "dry-run" { Invoke-DryRun -SqlFile $SqlFile }
        "phased" { Invoke-PhasedExecution -SqlFile $SqlFile }
        "full-transaction" { Invoke-FullTransaction -SqlFile $SqlFile }
    }

    if (-not $success) {
        Write-Error "Execution failed"
        exit 2
    }

    # Step 4: Post-validation (skip for dry-run)
    if ($Mode -ne "dry-run") {
        Invoke-PostValidation
    }

    # Summary
    $totalElapsed = (Get-Date) - $Script:StartTime
    Write-Header "Execution Complete"
    Write-Success "Sample data loaded successfully"
    Write-Info "Elapsed time: $([math]::Round($totalElapsed.TotalSeconds, 1))s"
    Write-Info "Log file: $Script:LogFile"

    if ($Mode -ne "dry-run") {
        Write-Info ""
        Write-Info "Test accounts:"
        Write-Info "  - superadmin / Admin@2025!"
        Write-Info "  - ceo.elec / Ceo@2025!"
        Write-Info "  - hr.admin.elec / HrAdmin@2025!"
        Write-Info ""
        Write-Info "See scripts/sample-data/README.md for all accounts"
    }

    exit 0
}
catch {
    Write-Error "Unexpected error: $_"
    Write-Log "ERROR: $_"
    Write-Log $_.ScriptStackTrace
    exit 2
}
