# ============================================
# HR SaaS Platform - SQL Validation Script
# ============================================
# Cross-validates SQL files before execution using:
#   Method 1: PostgreSQL native validation (syntax check via dry-run)
#   Method 2: Static analysis (FK integrity, RLS, transactions)
#
# Usage:
#   .\scripts\sample-data\validate-sql.ps1
#   .\scripts\sample-data\validate-sql.ps1 -File "path/to/file.sql"
#   .\scripts\sample-data\validate-sql.ps1 -SkipPostgresValidation
#
# Exit codes:
#   0 - All validations passed
#   1 - One or more validations failed
# ============================================

param(
    [string]$File = ".\99_combined_all.sql",
    [switch]$SkipPostgresValidation,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$Script:ValidationErrors = @()
$Script:ValidationWarnings = @()
$Script:StartTime = Get-Date

# ============================================
# Helper Functions
# ============================================

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Step, [string]$Description)
    Write-Host "[$Step] $Description" -NoNewline
    $padding = 50 - $Description.Length
    if ($padding -gt 0) {
        Write-Host (" " * $padding) -NoNewline
    }
}

function Write-Result {
    param([bool]$Success, [string]$Message = "", [double]$ElapsedSeconds = 0)

    if ($Success) {
        Write-Host " ✓ PASS" -ForegroundColor Green
        if ($ElapsedSeconds -gt 0) {
            Write-Host "      (${ElapsedSeconds}s)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        if ($ElapsedSeconds -gt 0) {
            Write-Host "      (${ElapsedSeconds}s)" -ForegroundColor DarkGray
        }
        if ($Message) {
            Write-Host "      - $Message" -ForegroundColor Yellow
        }
    }
}

function Add-ValidationError {
    param([string]$Message)
    $Script:ValidationErrors += $Message
}

function Add-ValidationWarning {
    param([string]$Message)
    $Script:ValidationWarnings += $Message
}

# ============================================
# Validation Functions
# ============================================

function Test-Infrastructure {
    $stepStart = Get-Date

    # Check Docker
    $dockerRunning = docker ps 2>&1 | Select-String -Pattern "hr-saas-postgres" -Quiet
    if (-not $dockerRunning) {
        Add-ValidationError "PostgreSQL container 'hr-saas-postgres' is not running"
        return $false
    }

    # Check PostgreSQL connectivity
    $pgReady = docker exec hr-saas-postgres pg_isready -U hr_saas 2>&1
    if ($LASTEXITCODE -ne 0) {
        Add-ValidationError "PostgreSQL is not ready: $pgReady"
        return $false
    }

    # Check Flyway migrations (count per-service Flyway tables)
    $flywayOutput = docker exec hr-saas-postgres psql -U hr_saas -d hr_saas -t -c `
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'flyway_schema_history_%'" 2>&1

    # Join array output and trim
    $flywayTableCount = ($flywayOutput -join " ").Trim()

    if ($flywayTableCount -match '(\d+)') {
        $count = [int]$Matches[1]
        if ($count -eq 0) {
            Add-ValidationError "Database schema not initialized. Run migrations first: docker exec -i hr-saas-postgres psql -U hr_saas < docker/postgres/init.sql"
            return $false, ((Get-Date) - $stepStart).TotalSeconds
        }
        elseif ($count -lt 10) {
            Add-ValidationWarning "Only $count service Flyway tables found (expected at least 10 services)"
        }
    } else {
        Add-ValidationWarning "Could not verify Flyway migrations (non-numeric output)"
    }

    $elapsed = (Get-Date) - $stepStart
    return $true, $elapsed.TotalSeconds
}

function Test-PostgreSQLSyntax {
    param([string]$SqlFile)

    $stepStart = Get-Date

    if (-not (Test-Path $SqlFile)) {
        Add-ValidationError "SQL file not found: $SqlFile"
        return $false, 0
    }

    # Create temporary SQL file with transaction wrapper
    $tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
    $sqlContent = Get-Content $SqlFile -Raw

    # Wrap in transaction and add ROLLBACK
    $validationSql = @"
-- Validation wrapper (dry-run)
BEGIN;

$sqlContent

-- Rollback to prevent data commit
ROLLBACK;
"@

    Set-Content -Path $tempFile -Value $validationSql -Encoding UTF8

    try {
        # Copy to container
        $containerPath = "/tmp/validate_sql.sql"
        docker cp $tempFile "hr-saas-postgres:$containerPath" 2>&1 | Out-Null

        # Execute with psql
        $output = docker exec hr-saas-postgres psql -U hr_saas -d hr_saas -f $containerPath 2>&1

        if ($LASTEXITCODE -ne 0) {
            # Parse error messages
            $errorLines = $output | Where-Object { $_ -match "ERROR:|syntax error|does not exist" }
            foreach ($line in $errorLines | Select-Object -First 5) {
                Add-ValidationError $line
            }
            return $false, ((Get-Date) - $stepStart).TotalSeconds
        }

        $elapsed = (Get-Date) - $stepStart
        return $true, $elapsed.TotalSeconds
    }
    finally {
        # Cleanup
        Remove-Item $tempFile -ErrorAction SilentlyContinue
        docker exec hr-saas-postgres rm -f $containerPath 2>&1 | Out-Null
    }
}

function Test-ForeignKeyIntegrity {
    param([string]$SqlFile)

    $stepStart = Get-Date
    $content = Get-Content $SqlFile -Raw

    # Extract defined tenant IDs
    $definedTenants = [regex]::Matches($content, "INSERT INTO tenant_common\.tenant[^;]*?id[^']*'([0-9a-f-]+)'") |
        ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

    # Extract used tenant IDs (in other tables)
    $usedTenants = [regex]::Matches($content, "tenant_id\s*=\s*'([0-9a-f-]+)'") |
        ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique |
        Where-Object { $_ -ne '00000000-0000-0000-0000-000000000000' } # Exclude RLS bypass ID

    # Find orphaned tenant IDs
    $orphaned = $usedTenants | Where-Object { $definedTenants -notcontains $_ }

    if ($orphaned) {
        foreach ($id in $orphaned | Select-Object -First 5) {
            Add-ValidationError "Orphaned tenant_id: $id"
        }
        $elapsed = (Get-Date) - $stepStart
        return $false, $elapsed.TotalSeconds
    }

    if ($Verbose) {
        Write-Host ""
        Write-Host "      Found $($definedTenants.Count) tenants, $($usedTenants.Count) references" -ForegroundColor DarkGray
    }

    $elapsed = (Get-Date) - $stepStart
    return $true, $elapsed.TotalSeconds
}

function Test-RLSContext {
    param([string]$SqlFile)

    $stepStart = Get-Date
    $content = Get-Content $SqlFile -Raw

    # Check for RLS bypass setting
    $rlsBypass = $content -match "SET app\.current_tenant\s*=\s*'00000000-0000-0000-0000-000000000000'"

    if (-not $rlsBypass) {
        Add-ValidationError "Missing RLS bypass (SET app.current_tenant = '00000000-0000-0000-0000-000000000000')"
        $elapsed = (Get-Date) - $stepStart
        return $false, $elapsed.TotalSeconds
    }

    # Check if RESET is used (optional, but good practice)
    $resetCount = ([regex]::Matches($content, "RESET app\.current_tenant")).Count

    if ($resetCount -eq 0 -and $Verbose) {
        Add-ValidationWarning "No 'RESET app.current_tenant' found (optional)"
    }

    $elapsed = (Get-Date) - $stepStart
    return $true, $elapsed.TotalSeconds
}

function Test-TransactionBoundary {
    param([string]$SqlFile)

    $stepStart = Get-Date
    $content = Get-Content $SqlFile -Raw

    # Count BEGIN and COMMIT
    $beginCount = ([regex]::Matches($content, "(?m)^BEGIN;")).Count
    $commitCount = ([regex]::Matches($content, "(?m)^COMMIT;")).Count

    if ($beginCount -ne $commitCount) {
        Add-ValidationError "Mismatched BEGIN ($beginCount) and COMMIT ($commitCount)"
        $elapsed = (Get-Date) - $stepStart
        return $false, $elapsed.TotalSeconds
    }

    if ($Verbose) {
        Write-Host ""
        Write-Host "      Found $beginCount transaction blocks" -ForegroundColor DarkGray
    }

    $elapsed = (Get-Date) - $stepStart
    return $true, $elapsed.TotalSeconds
}

function Test-ExecutionOrder {
    param([string]$SqlFile)

    $stepStart = Get-Date
    $content = Get-Content $SqlFile -Raw

    # Expected phase order
    $expectedOrder = @(
        "00_reset_sample_data_safe.sql",
        "01_tenants.sql",
        "02_mdm_codes.sql",
        "03_mdm_menus.sql",
        "04_organization.sql",
        "05_employees.sql",
        "06_auth.sql",
        "07_attendance.sql",
        "08_approvals.sql",
        "09_org_extras.sql",
        "10_recruitment.sql",
        "11_appointments_certificates.sql",
        "12_notifications_files.sql"
    )

    # Extract actual order from phase markers
    $actualOrder = [regex]::Matches($content, "\[\d+/\d+\]\s+(\S+\.sql)") |
        ForEach-Object { $_.Groups[1].Value }

    # Compare orders
    $mismatch = $false
    for ($i = 0; $i -lt [Math]::Min($expectedOrder.Count, $actualOrder.Count); $i++) {
        if ($expectedOrder[$i] -ne $actualOrder[$i]) {
            Add-ValidationError "Phase order mismatch at position $($i+1): expected '$($expectedOrder[$i])', got '$($actualOrder[$i])'"
            $mismatch = $true
        }
    }

    # Check count
    if ($expectedOrder.Count -ne $actualOrder.Count) {
        Add-ValidationError "Phase count mismatch: expected $($expectedOrder.Count), got $($actualOrder.Count)"
        $mismatch = $true
    }

    if ($mismatch) {
        $elapsed = (Get-Date) - $stepStart
        return $false, $elapsed.TotalSeconds
    }

    if ($Verbose) {
        Write-Host ""
        Write-Host "      Validated $($actualOrder.Count) phases in correct order" -ForegroundColor DarkGray
    }

    $elapsed = (Get-Date) - $stepStart
    return $true, $elapsed.TotalSeconds
}

# ============================================
# Main Execution
# ============================================

# Resolve file path
if (-not [System.IO.Path]::IsPathRooted($File)) {
    $File = Join-Path (Get-Location) $File
}

if (-not (Test-Path $File)) {
    Write-Host "Error: File not found: $File" -ForegroundColor Red
    exit 1
}

$fileInfo = Get-Item $File
$lineCount = (Get-Content $File | Measure-Object -Line).Lines

Write-Header "HR SaaS SQL Validation Report"
Write-Host "File: $($fileInfo.Name) ($lineCount lines)" -ForegroundColor White
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""

# Run validations
$validations = @()

# 1. Infrastructure
Write-Step "1/6" "Infrastructure Checks"
$result, $elapsed = Test-Infrastructure
$validations += @{Name="Infrastructure"; Success=$result; Elapsed=$elapsed}
Write-Result -Success $result -ElapsedSeconds $elapsed

# 2. PostgreSQL Syntax (optional skip)
if (-not $SkipPostgresValidation) {
    Write-Step "2/6" "Syntax Validation (PostgreSQL)"
    $result, $elapsed = Test-PostgreSQLSyntax -SqlFile $File
    $validations += @{Name="PostgreSQL Syntax"; Success=$result; Elapsed=$elapsed}
    Write-Result -Success $result -ElapsedSeconds $elapsed
} else {
    Write-Host "[2/6] Syntax Validation (PostgreSQL)............. SKIPPED" -ForegroundColor Yellow
}

# 3. Foreign Key Integrity
Write-Step "3/6" "Foreign Key Validation"
$result, $elapsed = Test-ForeignKeyIntegrity -SqlFile $File
$validations += @{Name="Foreign Key"; Success=$result; Elapsed=$elapsed}
Write-Result -Success $result -ElapsedSeconds $elapsed

# 4. RLS Context
Write-Step "4/6" "RLS Context Validation"
$result, $elapsed = Test-RLSContext -SqlFile $File
$validations += @{Name="RLS Context"; Success=$result; Elapsed=$elapsed}
Write-Result -Success $result -ElapsedSeconds $elapsed

# 5. Transaction Boundary
Write-Step "5/6" "Transaction Boundary"
$result, $elapsed = Test-TransactionBoundary -SqlFile $File
$validations += @{Name="Transaction Boundary"; Success=$result; Elapsed=$elapsed}
Write-Result -Success $result -ElapsedSeconds $elapsed

# 6. Execution Order
Write-Step "6/6" "Execution Order"
$result, $elapsed = Test-ExecutionOrder -SqlFile $File
$validations += @{Name="Execution Order"; Success=$result; Elapsed=$elapsed}
Write-Result -Success $result -ElapsedSeconds $elapsed

# ============================================
# Summary
# ============================================

$totalElapsed = (Get-Date) - $Script:StartTime
$passedCount = ($validations | Where-Object { $_.Success }).Count
$failedCount = $validations.Count - $passedCount

Write-Host ""
Write-Header "Summary"

if ($Script:ValidationErrors.Count -gt 0) {
    Write-Host "Errors:" -ForegroundColor Red
    foreach ($err in $Script:ValidationErrors) {
        Write-Host "  - $err" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($Script:ValidationWarnings.Count -gt 0) {
    Write-Host "Warnings:" -ForegroundColor Yellow
    foreach ($warn in $Script:ValidationWarnings) {
        Write-Host "  - $warn" -ForegroundColor DarkYellow
    }
    Write-Host ""
}

Write-Host "Results: $passedCount PASSED, $failedCount FAILED" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Red" })
Write-Host "Elapsed: $([math]::Round($totalElapsed.TotalSeconds, 1))s" -ForegroundColor White
Write-Host ""

if ($failedCount -eq 0) {
    Write-Host "Status: READY FOR EXECUTION ✓" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Status: VALIDATION FAILED ✗" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix errors and retry validation" -ForegroundColor Yellow
    exit 1
}
