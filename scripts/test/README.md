# HR SaaS Platform - Integration Test Scripts

## Overview

Automated test scripts for validating the HR SaaS platform across 5 phases:

| Script | Phase | Purpose | Tests |
|--------|-------|---------|-------|
| `smoke-test.sh` | Phase 3 | API endpoint validation | ~40 endpoints |
| `e2e-flow-test.sh` | Phase 4 | Business workflow E2E | 6 flows |
| `security-test.sh` | Phase 5 | Security & multi-tenancy | ~21 tests |
| `test-utils.sh` | - | Shared utilities | - |

## Prerequisites

1. **Docker infrastructure running:**
   ```bash
   cd docker && docker compose up -d
   ```

2. **Sample data loaded:**
   ```bash
   psql -h localhost -p 15432 -U hr_saas -d hr_saas -f scripts/sample-data/99_combined_all.sql
   ```

3. **All backend services running** (see startup order in CLAUDE.md)

4. **Required tools:** `curl`, `python3`, `bash`

## Usage

### Run All Tests
```bash
cd scripts/test
bash smoke-test.sh && bash e2e-flow-test.sh && bash security-test.sh
```

### Run Individual Phase
```bash
# Phase 3: API smoke tests
bash scripts/test/smoke-test.sh

# Phase 4: E2E business flows
bash scripts/test/e2e-flow-test.sh

# Phase 5: Security tests
bash scripts/test/security-test.sh
```

### Custom Gateway URL
```bash
GATEWAY_URL=http://localhost:18080 bash scripts/test/smoke-test.sh
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `GATEWAY_URL` | `http://localhost:18080` | Traefik gateway URL |
| `RESULTS_DIR` | `scripts/test/results/` | JSON results output |
| `REPORTS_DIR` | `docs/test-reports/` | Markdown report output |

## Output

### Console Output
- Color-coded PASS/FAIL/SKIP for each test
- Summary table with totals

### JSON Results
- Saved to `scripts/test/results/results_YYYYMMDD_HHMMSS.json`
- Each test records: phase, category, test name, HTTP method, endpoint, expected/actual status, response time

### Markdown Reports
- Auto-appended to `docs/test-reports/phase{N}-*.md`
- Summary dashboard updated in `docs/test-reports/TEST_HISTORY.md`

## Test Accounts

| Key | Username | Password | Role |
|-----|----------|----------|------|
| `superadmin` | `superadmin` | `Admin@2025!` | System Admin |
| `ceo` | `ceo.elec` | `Ceo@2025!` | CEO / Tenant Admin |
| `hr_admin` | `hr.admin.elec` | `HrAdmin@2025!` | HR Manager |
| `manager` | `dev.manager.elec` | `DevMgr@2025!` | Department Manager |
| `staff` | `dev.staff.elec` | `DevStaff@2025!` | Regular Employee |

## Troubleshooting

### Login Fails
- Check if auth-service is running on port 8081
- Verify sample data is loaded (test accounts exist)
- Check Traefik routing: `curl http://localhost:18090/api/overview`

### 403 Forbidden
- See CLAUDE.md "Security Troubleshooting" for SecurityFilter double-registration issue
- Verify `FilterRegistrationBean` is configured in the service's `SecurityConfig`

### Timeout
- Ensure all dependent services are healthy: `curl http://localhost:{port}/actuator/health`
- Check Docker network connectivity

### Python3 Not Found
- Scripts use `python3` for JSON processing
- Windows: Install Python 3.x and ensure `python3` is in PATH
- Alternative: Use Git Bash which may alias `python` to `python3`
