# HR SaaS Platform - Service Startup Guide

## Overview

This document describes how to start the HR SaaS Platform from scratch, including all infrastructure components and microservices.

## Prerequisites

- **Java 17**: Required for all Spring Boot services
- **Docker Desktop**: Required for infrastructure and services
- **Gradle**: Build tool (included via wrapper)

---

## Option 1: Docker Compose (권장)

### Full Stack 실행

```bash
cd docker

# 전체 빌드 및 실행 (처음 실행 시)
docker-compose up --build -d

# 재시작 (이미 빌드된 경우)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f gateway-service

# 종료
docker-compose down

# 완전 초기화 (볼륨 포함)
docker-compose down -v
```

### Config Server 설정

Docker 환경에서는 Config Server가 자동으로 활성화됩니다:
- Config 파일 위치: `config/` 디렉토리
- 공통 설정: `config/application-docker.yml`
- Gateway 설정: `config/gateway-service.yml`

### 서비스 URL (Docker 내부)

| Service | Internal URL | External Port |
|---------|-------------|---------------|
| Gateway | http://gateway-service:8080 | 8080 |
| Auth | http://auth-service:8081 | 8081 |
| Keycloak | http://keycloak:8080 | 8180 |
| PostgreSQL | postgres:5432 | 5433 |
| Redis | redis:6379 | 6381 |
| Kafka | kafka:9092 | 29092 |

---

## Option 2: Local Development (Gradle 직접 실행)

## Infrastructure Components

| Component | Port | Description |
|-----------|------|-------------|
| PostgreSQL | 5433 | Primary database |
| Redis | 6381 | Cache and session store |
| Kafka | 29092 | Event messaging |
| Keycloak | 8180 | Identity and access management |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3000 | Metrics visualization |
| Jaeger | 16686 | Distributed tracing |

## Microservices

| Service | Port | Description |
|---------|------|-------------|
| Config Server | 8888 | Centralized configuration |
| Gateway | 8080 | API Gateway |
| Auth | 8081 | Authentication service |
| Tenant | 8082 | Multi-tenancy management |
| Organization | 8083 | Organization structure |
| Employee | 8084 | Employee management |
| Attendance | 8085 | Attendance/Leave management |
| Approval | 8086 | Workflow engine |
| MDM | 8087 | Master data management |
| Notification | 8088 | Notification service |
| File | 8089 | File management |
| Appointment | 8091 | Appointment management |
| Certificate | 8092 | Certificate issuance |
| Recruitment | 8093 | Recruitment management |

## Startup Procedure

### Step 1: Start Docker Infrastructure

```bash
cd docker
docker-compose up -d
```

Wait for all containers to be healthy (especially PostgreSQL and Keycloak).

### Step 2: Initialize Database

The database is automatically initialized by `docker/postgres/init.sql` which creates:
- All required schemas (tenant_common, hr_core, hr_attendance, hr_approval, etc.)
- UUID extensions (uuid-ossp, pgcrypto)
- Utility functions (set_tenant_context, get_current_tenant, update_updated_at_column)

### Step 3: Start Services in Order

**Batch 1 - Core Infrastructure:**
```bash
./gradlew :infra:config-server:bootRun &
# Wait 30 seconds for config server to start
```

**Batch 2 - Foundation Services:**
```bash
./gradlew :services:mdm-service:bootRun &
# Wait 40 seconds
```

**Batch 3 - Tenant & Auth:**
```bash
./gradlew :services:tenant-service:bootRun &
./gradlew :services:auth-service:bootRun &
# Wait 40 seconds
```

**Batch 4 - Organization & Employee:**
```bash
./gradlew :services:organization-service:bootRun &
./gradlew :services:employee-service:bootRun &
# Wait 45 seconds
```

**Batch 5 - Business Services:**
```bash
./gradlew :services:attendance-service:bootRun &
./gradlew :services:approval-service:bootRun &
./gradlew :services:notification-service:bootRun &
./gradlew :services:file-service:bootRun &
./gradlew :services:certificate-service:bootRun &
./gradlew :services:appointment-service:bootRun &
./gradlew :services:recruitment-service:bootRun &
# Wait 50 seconds
```

**Batch 6 - Gateway (Last):**
```bash
./gradlew :services:gateway-service:bootRun &
```

### Step 4: Verify All Services

```powershell
# Windows PowerShell
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -ge 8080 -and $_.LocalPort -le 8888} | Sort-Object LocalPort
```

```bash
# Linux/Mac
netstat -tlnp | grep -E '80[89][0-9]|888'
```

Expected ports: 8080, 8081, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089, 8091, 8092, 8093, 8888

## Key Configuration Notes

### 1. Flyway Migration

Each service manages its own schema via Flyway migrations:
- `spring.flyway.enabled: true`
- `spring.flyway.schemas: {service_schema}`
- Migrations located in `src/main/resources/db/migration/`

### 2. OAuth2 Security

All services require Keycloak JWT configuration:
```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/hr-saas
```

### 3. Database Schema Auto-Update

For development, some services use `ddl-auto: update`:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # or 'validate' for strict mode
```

### 4. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5433 | PostgreSQL port |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6381 | Redis port |
| KAFKA_BOOTSTRAP_SERVERS | localhost:29092 | Kafka servers |
| KEYCLOAK_ISSUER_URI | http://localhost:8180/realms/hr-saas | Keycloak issuer |

## Troubleshooting

### Service fails with "JwtDecoder not found"
- Ensure Keycloak is running and accessible
- Verify `spring.security.oauth2.resourceserver.jwt.issuer-uri` is configured

### Flyway migration conflicts
- Multiple services share schemas (tenant_common, hr_core)
- Use `validateOnMigrate: false` and `outOfOrder: true` in FlywayConfig

### Schema validation errors
- Run migrations first before starting services
- Use `ddl-auto: update` temporarily to sync entity changes

### Gateway Discovery Client errors
- Service Discovery (Eureka) is not used in local development
- Gateway uses static URLs (e.g., `http://localhost:8081`)
- Discovery/Config health indicators are disabled:
  ```yaml
  spring.cloud:
    loadbalancer.enabled: false
    discovery.enabled: false
  management.health:
    discovery.enabled: false
    config.enabled: false
  ```

## Health Check URLs

- Gateway: http://localhost:8080/actuator/health
- Each service: http://localhost:{port}/actuator/health

## Shutdown Procedure

```powershell
# Windows - Stop all services
$ports = @(8080,8081,8082,8083,8084,8085,8086,8087,8088,8089,8091,8092,8093,8888)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }
}

# Stop Docker infrastructure
cd docker
docker-compose down
```

---

*Last Updated: 2026-02-05*
*Platform Version: 1.0.0*
