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
| Messaging | AWS SQS + SNS (spring-cloud-aws 3.1.1) |
| Authentication | Custom JWT (Spring Security) |
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
│   └── common-event/           # DomainEvent, SQS/SNS integration
├── services/                   # Microservices (13 services)
│   ├── gateway-service/        # Port 8080 - API Gateway
│   ├── auth-service/           # Port 8081 - Authentication
│   ├── tenant-service/         # Port 8082 - Multi-tenancy
│   ├── organization-service/   # Port 8083 - Org structure
│   ├── employee-service/       # Port 8084 - Employee management
│   ├── attendance-service/     # Port 8085 - Attendance/Leave
│   ├── approval-service/       # Port 8086 - Workflow engine
│   ├── mdm-service/            # Port 8087 - Master data
│   ├── notification-service/   # Port 8088 - Notifications
│   ├── file-service/           # Port 8089 - File management
│   ├── appointment-service/    # Port 8091 - Appointment (발령)
│   ├── certificate-service/    # Port 8092 - Certificate (증명서)
│   └── recruitment-service/    # Port 8093 - Recruitment (채용)
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

### Event-Driven Communication (SQS/SNS)

```java
// Publish domain event via SNS
snsTemplate.sendNotification("hr-saas-{domain}-{event-type}", event, message);

// Topic naming: hr-saas-{domain}-{event-type}
// Examples: hr-saas-employee-created, hr-saas-approval-completed
// Consumer: SQS queue subscribed to SNS topic
// Local dev: LocalStack 3.4 for SNS/SQS emulation
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
| `PRD_GAP_ANALYSIS.md` | PRD 대비 구현 현황 갭 분석 |
| `API_CONVENTIONS.md` | REST API 설계 가이드 (상세) |
| `FRONTEND_SCREEN_INVENTORY.md` | 프론트엔드 85개 화면 추적 |

> **Note**: 초기 SDD 문서들은 `docs/deprecated/`로 이동되었습니다 (Kafka/Keycloak 기반 설계).
> 현재 구현 상태는 아래 Module Analysis Documents를 참조하세요.

### Module Analysis Documents (프로덕션 정책/설정 분석)

| Document | Purpose |
|----------|---------|
| `docs/modules/01-AUTH-SERVICE.md` | Auth: 세션, 비밀번호, 감사로그 정책 |
| `docs/modules/02-TENANT-SERVICE.md` | Tenant: 구독, 과금, 기능 플래그 정책 |
| `docs/modules/03-MDM-SERVICE.md` | MDM: 코드 체계, 4단계 분류, 메뉴 정책 |
| `docs/modules/04-ORGANIZATION-SERVICE.md` | Org: 부서/직급/경조/위원회/공지/정원 정책 |
| `docs/modules/05-EMPLOYEE-SERVICE.md` | Employee: 생애주기, 개인정보, 사원증 정책 |
| `docs/modules/06-ATTENDANCE-SERVICE.md` | Attendance: 근태, 휴가, 초과근무 정책 |
| `docs/modules/07-APPROVAL-SERVICE.md` | Approval: 결재선, 병렬/조건부 라우팅 정책 |
| `docs/modules/08-NOTIFICATION-SERVICE.md` | Notification: 채널, 템플릿, SSE 정책 |
| `docs/modules/09-FILE-SERVICE.md` | File: 업로드, 바이러스 스캔, 보존 정책 |
| `docs/modules/10-RECRUITMENT-SERVICE.md` | Recruitment: 채용 프로세스, 면접, 블랙리스트 정책 |
| `docs/modules/11-CERTIFICATE-SERVICE.md` | Certificate: 증명서 유형, PDF 생성, 검증 정책 |
| `docs/modules/12-APPOINTMENT-SERVICE.md` | Appointment: 발령 유형, 예약 실행, 롤백 정책 |

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

## Frontend Development

**IMPORTANT: Use pnpm for frontend package management, NOT npm or yarn.**

```bash
# Install dependencies
cd frontend && pnpm install

# Add a package
cd frontend/apps/web && pnpm add <package-name>

# Run development server
cd frontend/apps/web && pnpm dev

# Build frontend
cd frontend/apps/web && pnpm build
```

## Security Troubleshooting

### SecurityFilter 이중 등록 문제 (403 Forbidden)

**증상**: JWT 토큰이 유효한데도 인증된 엔드포인트에서 403 응답. 로그에 `JWT authenticated: userId=...`가 찍히지만 `AnonymousAuthenticationToken`으로 인식됨.

**원인**: `SecurityFilter`가 `@Component`이므로 두 곳에서 실행됨:
1. 서블릿 필터로 자동 등록 (Spring Security 체인 밖에서 먼저 실행)
2. `SecurityConfig`의 `.addFilterBefore()`로 체인 안에도 등록

실행 순서:
```
1. SecurityFilter (서블릿 필터) → Spring Security context 설정
2. SecurityContextHolderFilter (체인 3/13) → context를 repository에서 로드 → 비어있으므로 초기화!
3. SecurityFilter (체인 7/13) → OncePerRequestFilter라 스킵
4. AnonymousAuthenticationFilter → anonymous로 설정
5. AuthorizationFilter → 403 반환
```

**해결 (2가지 모두 필요)**:

1. `SecurityFilter`에서 Spring Security의 `SecurityContextHolder`도 설정:
```java
// common/common-security/.../SecurityFilter.java
var authentication = new UsernamePasswordAuthenticationToken(context, null, authorities);
org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
```

2. 각 서비스 `SecurityConfig`에서 서블릿 필터 자동 등록 차단:
```java
@Bean
public FilterRegistrationBean<SecurityFilter> securityFilterRegistration(SecurityFilter securityFilter) {
    FilterRegistrationBean<SecurityFilter> registration = new FilterRegistrationBean<>(securityFilter);
    registration.setEnabled(false); // 서블릿 필터 자동 등록 방지
    return registration;
}
```

**새 서비스 추가 시**: 반드시 `SecurityConfig`에 `FilterRegistrationBean`을 추가할 것. 누락하면 동일한 403 문제 발생.

### Custom vs Spring SecurityContextHolder

이 프로젝트는 두 개의 SecurityContextHolder를 사용:
- `com.hrsaas.common.security.SecurityContextHolder` — ThreadLocal 기반 커스텀 (UserContext 저장)
- `org.springframework.security.core.context.SecurityContextHolder` — Spring Security 내장

`SecurityFilter`가 양쪽 모두 설정해야 정상 동작. 컨트롤러에서는 커스텀 `SecurityContextHolder.getCurrentUser()`를 사용.

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
| Appointment | 8091 |
| Certificate | 8092 |
| Recruitment | 8093 |
| Config Server | 8888 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| Prometheus | 9090 |
| Grafana | 3000 |
| Jaeger | 16686 |
