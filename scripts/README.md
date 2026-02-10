# Scripts Directory - HR SaaS Platform

## 📋 Overview

This directory contains utility scripts for development, deployment, and database management.

---

## 🚀 Development Scripts

### Service Management

#### `start-services.ps1` / `start-services.bat`
**Purpose**: Start Docker services with various modes

**Usage:**
```powershell
# Standard mode
.\scripts\start-services.ps1

# Development mode (hot reload + debugging)
.\scripts\start-services.ps1 -DevMode

# With resource limits
.\scripts\start-services.ps1 -DevMode -WithResources

# Specific services only
.\scripts\start-services.ps1 -Services auth-service,employee-service -DevMode

# Skip build (faster startup)
.\scripts\start-services.ps1 -NoBuild -DevMode
```

**Features:**
- ✅ Auto-starts infrastructure (Postgres, Redis, LocalStack) if not running
- ✅ Supports dev mode (hot reload, debug ports)
- ✅ Supports resource limits (prevent OOM)
- ✅ Service selection (start specific services)
- ✅ Build control (skip build with `-NoBuild`)

**Options:**
- `-DevMode` - Enable hot reload (<5s restart) and remote debugging
- `-WithResources` - Apply CPU/memory limits (prevents OOM cascade)
- `-NoBuild` - Skip Docker build, use existing images
- `-Services` - Comma-separated service names
- `-Help` - Show detailed help

---

#### `stop-services.ps1` / `stop-services.bat`
**Purpose**: Stop all Docker services

**Usage:**
```powershell
.\scripts\stop-services.ps1        # Stop services, keep volumes
.\scripts\stop-services.ps1 -Down  # Stop and remove volumes (DESTRUCTIVE)
```

---

### Health & Debugging

#### `health-check.ps1` / `health-check.sh`
**Purpose**: Quick health check for all services

**Usage:**
```powershell
# Windows
.\scripts\health-check.ps1

# Linux/Mac
./scripts/health-check.sh
```

**Checks:**
- ✅ Infrastructure (Postgres, Redis, LocalStack, Jaeger, Prometheus, Grafana, Traefik)
- ✅ All 12 application services (actuator health endpoints)

**Output:**
```
✓ PostgreSQL Database - HEALTHY
✓ Auth Service - HEALTHY (Actuator)
✗ Employee Service - DOWN
```

**Exit codes:**
- `0` - All services healthy
- `1` - One or more services down

---

#### `debug-service.ps1` / `debug-service.sh`
**Purpose**: Start a service in debug mode with one command

**Usage:**
```powershell
# Windows
.\scripts\debug-service.ps1 auth-service

# Linux/Mac
./scripts/debug-service.sh auth-service
```

**Features:**
- ✅ Starts service with hot reload enabled
- ✅ Enables remote debugging (JDWP)
- ✅ Shows debug port and IDE instructions

**Debug Ports:**
| Service | Debug Port |
|---------|------------|
| auth-service | 5005 |
| tenant-service | 5006 |
| organization-service | 5007 |
| employee-service | 5008 |
| attendance-service | 5009 |
| approval-service | 5010 |
| mdm-service | 5011 |
| notification-service | 5012 |
| file-service | 5013 |
| appointment-service | 5014 |
| certificate-service | 5015 |
| recruitment-service | 5016 |

---

## 🗄️ Database Scripts

#### `init-db.sh`
**Purpose**: Initialize database schema and optionally load sample data

**Usage:**
```bash
# Schema only
./scripts/init-db.sh

# Schema + sample data (100+ test users)
./scripts/init-db.sh --sample

# Drop all tables and reinitialize (DESTRUCTIVE!)
./scripts/init-db.sh --reset --sample
```

**Options:**
- `--sample` - Load sample data (tenants, users, attendance, approvals, etc.)
- `--reset` - Drop all tables before initialization (DESTRUCTIVE!)
- `--help` - Show help

**Test Accounts** (with `--sample`):
- `superadmin` / `Admin@2025!` - System admin
- `ceo.elec` / `Ceo@2025!` - CEO (한성전자)
- `hr.admin.elec` / `HrAdmin@2025!` - HR Manager
- `dev.manager.elec` / `DevMgr@2025!` - Department Manager
- `dev.staff.elec` / `DevStaff@2025!` - Regular Employee

See `scripts/sample-data/README.md` for all accounts.

---

#### `combine_migrations.py`
**Purpose**: Combine Flyway migrations into single SQL file for Docker init

**Usage:**
```bash
cd scripts
python combine_migrations.py
```

**Output**: `sample-data/00_migrations_combined.sql`

---

#### `combine_sql.py`
**Purpose**: Combine sample data SQL files into single file

**Usage:**
```bash
cd scripts/sample-data
python ../combine_sql.py
```

**Output**: `sample-data/99_combined_all.sql`

---

## 🏗️ Build Scripts

#### `build-all.sh` / `build-all.bat`
**Purpose**: Build all Gradle modules (common + services)

**Usage:**
```bash
# Linux/Mac
./scripts/build-all.sh

# Windows
.\scripts\build-all.bat
```

**What it does:**
- Runs `./gradlew clean build -x test --parallel`
- Skips tests for faster builds
- Uses parallel execution

**When to use:**
- After pulling latest code
- Before Docker build
- To verify all modules compile

---

## 🛠️ Claude Code Integration

#### `install-claude-skills.sh` / `install-claude-skills.ps1` / `install-claude-skills.bat`
**Purpose**: Install Claude Code skills for this project

**Usage:**
```bash
# Linux/Mac
./scripts/install-claude-skills.sh

# Windows PowerShell
.\scripts\install-claude-skills.ps1

# Windows CMD
.\scripts\install-claude-skills.bat
```

**What it installs:**
- Custom Claude Code skills for HR SaaS project
- Project-specific commands and shortcuts

---

## 🌐 AWS Deployment

### `aws/load-sample-data.sh`
**Purpose**: Load sample data to AWS RDS instance

**Usage:**
```bash
cd scripts/aws
./load-sample-data.sh <rds-endpoint> <db-name> <username>
```

### `aws/init-rds-lambda/`
**Purpose**: Lambda function to initialize RDS schema on deployment

**Contents:**
- `index.py` - Lambda handler
- `psycopg2/` - PostgreSQL driver for Lambda

---

## 📁 Directory Structure

```
scripts/
├── README.md                      # This file
├── start-services.ps1             # Start services (RECOMMENDED)
├── start-services.bat             # Start services (Windows CMD)
├── stop-services.ps1              # Stop services
├── stop-services.bat              # Stop services (Windows CMD)
├── health-check.ps1               # Health check (Windows)
├── health-check.sh                # Health check (Linux/Mac)
├── debug-service.ps1              # Debug helper (Windows)
├── debug-service.sh               # Debug helper (Linux/Mac)
├── init-db.sh                     # Database initialization
├── build-all.sh                   # Gradle build all
├── build-all.bat                  # Gradle build all (Windows)
├── combine_migrations.py          # SQL migration combiner
├── combine_sql.py                 # SQL sample data combiner
├── install-claude-skills.*        # Claude Code skills installer
├── aws/                           # AWS deployment scripts
│   ├── load-sample-data.sh
│   └── init-rds-lambda/
├── sample-data/                   # Sample data SQL files
│   ├── README.md
│   ├── 00_migrations_combined.sql
│   ├── 01_tenant_seed.sql
│   ├── 02-20_*.sql
│   └── 99_combined_all.sql
└── deprecated/                    # Old scripts (DO NOT USE)
    ├── start-local.sh             # → Use start-services.ps1 instead
    ├── start-local.bat
    ├── stop-local.sh
    └── stop-local.bat
```

---

## 🎯 Common Workflows

### Daily Development

```powershell
# 1. Start all services in dev mode (hot reload + debugging)
.\scripts\start-services.ps1 -DevMode

# 2. Check health (wait 2-3 minutes for startup)
.\scripts\health-check.ps1

# 3. Edit code → Auto-restart in < 5s (no rebuild needed!)

# 4. View logs
cd docker
docker-compose logs -f auth-service

# 5. Stop when done
cd ..
.\scripts\stop-services.ps1
```

### New Developer Setup

```powershell
# 1. Build all modules
.\scripts\build-all.bat

# 2. Start infrastructure + services
.\scripts\start-services.ps1 -DevMode

# 3. Initialize database with sample data
bash -c "./scripts/init-db.sh --sample"

# 4. Check health
.\scripts\health-check.ps1

# 5. Test login
# Username: dev.staff.elec
# Password: DevStaff@2025!
```

### Debugging Specific Service

```powershell
# 1. Start service in debug mode
.\scripts\debug-service.ps1 employee-service

# 2. Attach debugger (IntelliJ/VS Code)
# Host: localhost
# Port: 5008 (see debug port table above)

# 3. Set breakpoints and trigger API call
```

### Database Reset

```bash
# Drop all tables and reload with sample data
./scripts/init-db.sh --reset --sample
```

---

## 📚 Related Documentation

- **Docker Quick Reference**: `docs/operations/DOCKER_QUICK_REFERENCE.md`
- **Docker Optimization**: `docker/OPTIMIZATION_SUMMARY.md`
- **Sample Data**: `scripts/sample-data/README.md`
- **Project Guide**: `CLAUDE.md`

---

## 🆘 Troubleshooting

### Scripts won't run (Windows)

**Problem**: "Permission denied" or "Execution policy"

**Solution**:
```powershell
# Option 1: Run in Git Bash
bash -c "./scripts/script-name.sh"

# Option 2: Allow PowerShell scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Option 3: Use .bat files
.\scripts\start-services.bat
```

### PostgreSQL not ready

**Problem**: "PostgreSQL container is not running"

**Solution**:
```bash
cd docker
docker-compose up -d postgres
# Wait 30 seconds
docker exec hr-saas-postgres pg_isready -U hr_saas
```

### Port already in use

**Problem**: "Address already in use"

**Solution**:
```powershell
# Windows: Find process using port 8081
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8081 | xargs kill -9
```

---

**Last Updated**: 2026-02-10
**Maintained By**: DevOps Team
