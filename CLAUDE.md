# HR SaaS Platform - Project Context

## Overview

Enterprise-grade multi-tenant HR SaaS platform for large corporate groups with 100+ subsidiaries.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Java 17 |
| Framework | Spring Boot 3.2, Spring Cloud 2023.x |
| Database | PostgreSQL 15 + Row Level Security |
| Cache | Redis 7.x |
| Messaging | Apache Kafka 3.x |
| Authentication | Keycloak 23.x (OAuth 2.0 / OIDC) |
| Build | Gradle 8.x (Multi-module) |
| Container | Docker, Kubernetes (EKS) |

## Project Structure

```
hr-platform/
├── docker/                     # Docker Compose configurations
│   ├── docker-compose.yml
│   ├── postgres/init.sql
│   ├── keycloak/realm-export.json
│   ├── prometheus/prometheus.yml
│   └── grafana/provisioning/
├── common/                     # Shared modules (9 modules)
│   ├── common-core/            # Base exceptions, ErrorCode, utilities
│   ├── common-entity/          # BaseEntity, AuditableEntity, TenantAwareEntity
│   ├── common-response/        # ApiResponse, GlobalExceptionHandler
│   ├── common-database/        # RLS Interceptor, Flyway config
│   ├── common-tenant/          # TenantContext, TenantFilter
│   ├── common-security/        # JWT, Permission, RoleHierarchy
│   ├── common-privacy/         # Masking, Encryption
│   ├── common-cache/           # Redis key strategy, TTL
│   └── common-event/           # DomainEvent, Kafka integration
├── services/                   # Microservices (10 services)
│   ├── gateway-service/        # Port 8080 - API Gateway
│   ├── auth-service/           # Port 8081 - Authentication
│   ├── tenant-service/         # Port 8082 - Multi-tenancy
│   ├── organization-service/   # Port 8083 - Org structure
│   ├── employee-service/       # Port 8084 - Employee management
│   ├── attendance-service/     # Port 8085 - Attendance/Leave
│   ├── approval-service/       # Port 8086 - Workflow engine
│   ├── mdm-service/            # Port 8087 - Master data
│   ├── notification-service/   # Port 8088 - Notifications
│   └── file-service/           # Port 8089 - File management
├── infra/
│   └── config-server/          # Port 8888 - Spring Cloud Config
├── config/                     # Centralized configuration files
├── scripts/                    # Utility scripts
├── build.gradle                # Root build configuration
└── settings.gradle             # Module definitions
```

## Development Conventions

### Package Structure (per service)

```
com.hrsaas.{service}/
├── config/             # Spring configurations
├── controller/         # REST controllers
├── service/            # Business logic
├── repository/         # Data access
├── domain/
│   ├── entity/         # JPA entities
│   ├── dto/            # Request/Response DTOs
│   └── event/          # Domain events
├── client/             # Feign clients
└── infrastructure/     # External integrations
```

### Coding Standards

- Use Lombok for boilerplate reduction
- Follow Google Java Style Guide
- All public APIs must have Javadoc
- Use `@Transactional(readOnly = true)` for read operations
- Prefer constructor injection over field injection

### API Conventions

- Base path: `/api/v1/{resource}`
- Use plural nouns for resources
- HTTP methods: GET (read), POST (create), PUT (update), DELETE (delete)
- Response format: `ApiResponse<T>` wrapper
- Error codes: `{SERVICE}_{NUMBER}` (e.g., `EMP_001`)

### Database Conventions

- Table names: snake_case, plural (e.g., `employees`)
- Primary key: `id UUID DEFAULT gen_random_uuid()`
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by`
- All tables with tenant data must have `tenant_id` column
- Enable RLS on all tenant-specific tables

### Testing

- Unit tests: JUnit 5 + Mockito
- Integration tests: Testcontainers
- Target coverage: 80%
- Test naming: `{method}_{scenario}_{expectedResult}`

## Key Design Patterns

### Multi-tenancy (Row Level Security)

```java
// Set tenant context
TenantContext.setCurrentTenant(tenantId);

// RLS automatically filters data
"SET app.current_tenant = '" + tenantId + "';"
```

### Event-Driven Communication

```java
// Publish domain event
kafkaTemplate.send("hr-saas.{domain}.{event-type}", event);

// Topic naming: hr-saas.{domain}.{event-type}
// Examples: hr-saas.employee.created, hr-saas.approval.completed
```

### Privacy Protection

```java
@Masked(type = MaskingType.PHONE)
private String mobile;

@Encrypted
private String residentNumber;
```

## Key Reference Documents

| Document | Purpose |
|----------|---------|
| `PRD.md` | Product requirements, user roles, features |
| `SDD_Infrastructure.md` | Docker, AWS, Kubernetes configuration |
| `SDD_Auth_Service.md` | Keycloak integration, JWT, sessions |
| `SDD_Tenant_Service.md` | Multi-tenancy, policies, features |
| `SDD_MDM_Service.md` | Common codes, tenant mapping |
| `SDD_Employee_Service.md` | Employee CRUD, privacy masking |
| `SDD_Approval_Service.md` | Workflow engine, state machine |
| `SDD_Common_Modules.md` | Shared module specifications |

## Quick Commands

```bash
# Start local environment
cd docker && docker-compose up -d

# Build all modules
./gradlew build

# Run specific service
./gradlew :services:employee-service:bootRun

# Run tests
./gradlew test

# Generate test coverage report
./gradlew jacocoTestReport
```

## Port Assignments

| Service | Port |
|---------|------|
| Gateway | 8080 |
| Auth | 8081 |
| Tenant | 8082 |
| Organization | 8083 |
| Employee | 8084 |
| Attendance | 8085 |
| Approval | 8086 |
| MDM | 8087 |
| Notification | 8088 |
| File | 8089 |
| Config Server | 8888 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Kafka | 9092 |
| Keycloak | 8180 |
| Prometheus | 9090 |
| Grafana | 3000 |
| Jaeger | 16686 |
