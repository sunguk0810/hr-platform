# HR SaaS Platform - Test Execution History

## Summary Dashboard

| Run # | Date | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Overall |
|-------|------|---------|---------|---------|---------|---------|---------|
| 1 | 2026-02-12 | N/A | N/A | 43/43 PASS | N/A | N/A | PASS |
| 1 | 2026-02-12 | N/A | N/A | 40/43 FAIL | N/A | N/A | FAIL |
| 1 | 2026-02-12 | N/A | N/A | 28/40 FAIL | N/A | N/A | FAIL |
| 1 | 2026-02-12 | N/A | N/A | 0/40 FAIL | N/A | N/A | FAIL |
| 1 | 2026-02-12 | N/A | N/A | 0/40 FAIL | N/A | N/A | FAIL |
|-------|------|---------|---------|---------|---------|---------|---------|

## Environment

- **OS:** Windows 11 Home
- **Java:** 17
- **Docker:** Docker Desktop
- **Database:** PostgreSQL 15 (port 15432)
- **Redis:** 7.x (port 16379)
- **Gateway:** Traefik v3 (port 18080)

## Test Phases

| Phase | Description | Script | Report |
|-------|-------------|--------|--------|
| Phase 1 | Infrastructure & Service Startup | Manual / Docker Compose | [phase1-infrastructure.md](phase1-infrastructure.md) |
| Phase 2 | Unit/Integration Tests | `./gradlew test` + `pnpm test` | [phase2-unit-tests.md](phase2-unit-tests.md) |
| Phase 3 | API Smoke Tests | `scripts/test/smoke-test.sh` | [phase3-api-smoke.md](phase3-api-smoke.md) |
| Phase 4 | Business Flow E2E | `scripts/test/e2e-flow-test.sh` | [phase4-e2e-flows.md](phase4-e2e-flows.md) |
| Phase 5 | Multi-tenancy & Security | `scripts/test/security-test.sh` | [phase5-security.md](phase5-security.md) |

## How to Run

```bash
# Phase 1: Start infrastructure
cd docker && docker compose up -d

# Phase 2: Run unit tests
./gradlew test --continue
cd frontend/apps/web && pnpm test

# Phase 3-5: Run test scripts (requires services to be running)
bash scripts/test/smoke-test.sh
bash scripts/test/e2e-flow-test.sh
bash scripts/test/security-test.sh
```

## Test Accounts

| Role | Username | Password |
|------|----------|----------|
| System Admin | `superadmin` | `Admin@2025!` |
| CEO | `ceo.elec` | `Ceo@2025!` |
| HR Admin | `hr.admin.elec` | `HrAdmin@2025!` |
| Dept Manager | `dev.manager.elec` | `DevMgr@2025!` |
| Staff | `dev.staff.elec` | `DevStaff@2025!` |
