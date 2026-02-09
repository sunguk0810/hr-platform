# 데이터베이스 패턴 가이드

> **최종 업데이트**: 2026-02-09
> **대상**: 백엔드 개발자, DBA
> **소스 코드**: `common/common-database/`, `common/common-entity/`

---

## 목차

- [1. 개요](#1-개요)
- [2. 스키마 구조](#2-스키마-구조)
- [3. HikariCP 커넥션 풀 설정](#3-hikaricp-커넥션-풀-설정)
- [4. Flyway 마이그레이션](#4-flyway-마이그레이션)
- [5. 엔티티 패턴](#5-엔티티-패턴)
- [6. 트랜잭션 관리](#6-트랜잭션-관리)
- [7. JPA Auditing](#7-jpa-auditing)
- [8. 컨버터 (Converter)](#8-컨버터-converter)
- [9. PostgreSQL 확장 기능](#9-postgresql-확장-기능)
- [10. 인덱스 전략](#10-인덱스-전략)
- [11. 쿼리 최적화](#11-쿼리-최적화)
- [12. 프로덕션 설정](#12-프로덕션-설정)
- [13. 트러블슈팅](#13-트러블슈팅)
- [14. 관련 문서](#14-관련-문서)

---

## 1. 개요

HR SaaS 플랫폼은 PostgreSQL 15를 메인 데이터베이스로 사용합니다. 10개 스키마에 12개 서비스의 데이터를 저장하며, Row Level Security(RLS)로 테넌트 데이터를 격리합니다.

### 핵심 기술

| 항목 | 기술 |
|------|------|
| RDBMS | PostgreSQL 15 |
| 커넥션 풀 | HikariCP |
| ORM | Spring Data JPA (Hibernate 6.x) |
| 마이그레이션 | Flyway |
| 확장 기능 | uuid-ossp, pgcrypto |

---

## 2. 스키마 구조

### 스키마 목록

`docker/postgres/init.sql`에서 초기화되는 10개 스키마:

| 스키마 | 서비스 | 설명 |
|--------|--------|------|
| `tenant_common` | auth, tenant | 인증, 테넌트 관리 |
| `hr_core` | organization, employee, mdm | 조직, 인사, 기준정보 |
| `hr_attendance` | attendance | 근태, 휴가, 초과근무 |
| `hr_approval` | approval | 전자결재 |
| `hr_audit` | auth | 감사 로그 |
| `hr_notification` | notification | 알림 |
| `hr_file` | file | 파일 메타데이터 |
| `hr_recruitment` | recruitment | 채용 |
| `hr_appointment` | appointment | 발령 |
| `hr_certificate` | certificate | 증명서 |

### 스키마 생성 SQL

```sql
-- docker/postgres/init.sql
CREATE SCHEMA IF NOT EXISTS tenant_common;
CREATE SCHEMA IF NOT EXISTS hr_core;
CREATE SCHEMA IF NOT EXISTS hr_attendance;
CREATE SCHEMA IF NOT EXISTS hr_approval;
CREATE SCHEMA IF NOT EXISTS hr_audit;
CREATE SCHEMA IF NOT EXISTS hr_notification;
CREATE SCHEMA IF NOT EXISTS hr_file;
CREATE SCHEMA IF NOT EXISTS hr_recruitment;
CREATE SCHEMA IF NOT EXISTS hr_appointment;
CREATE SCHEMA IF NOT EXISTS hr_certificate;

-- 모든 스키마에 대한 권한 부여
GRANT ALL PRIVILEGES ON SCHEMA {schema} TO hr_saas;

-- 확장 기능
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID 생성
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- 암호화 함수
```

---

## 3. HikariCP 커넥션 풀 설정

### 서비스별 풀 크기

트래픽 패턴에 따라 서비스별 차등 풀 크기를 적용합니다:

| 티어 | 서비스 | 풀 크기 | minimum-idle | 사유 |
|------|--------|---------|-------------|------|
| **High-traffic** | auth, employee, organization | 20 | 5 | 핵심 서비스, 높은 동시성 |
| **Standard** | tenant, mdm | 10 | 5 | 참조 데이터, 보통 빈도 |
| **Batch-heavy** | appointment | 15 | 5 | 배치 발령 실행 시 집중 사용 |
| **Low-traffic** | certificate, recruitment | 5 | 5 | 비정기적 사용 |

### 공통 설정

```yaml
# application.yml (모든 서비스 공통)
spring:
  datasource:
    hikari:
      minimum-idle: 5                # 최소 유지 커넥션
      connection-timeout: 30000      # 커넥션 획득 타임아웃 (30초)
      idle-timeout: 600000           # 유휴 커넥션 해제 (10분)
      max-lifetime: 1800000          # 커넥션 최대 수명 (30분)
      leak-detection-threshold: 60000 # 커넥션 누수 감지 (60초, 개발만)
```

### 설정 설명

| 설정 | 값 | 설명 |
|------|------|------|
| `maximum-pool-size` | 5-20 | 최대 동시 커넥션 수 |
| `minimum-idle` | 5 | 유휴 상태에서도 유지할 최소 커넥션 (콜드 스타트 방지) |
| `connection-timeout` | 30초 | 풀 고갈 시 대기 시간, 초과 시 예외 발생 |
| `idle-timeout` | 10분 | 유휴 커넥션 해제 시간 (DB 리소스 절약) |
| `max-lifetime` | 30분 | 커넥션 갱신 주기 (오래된 커넥션 방지) |
| `leak-detection-threshold` | 60초 | 60초 이상 반환 안 된 커넥션 경고 로그 |

### PostgreSQL max_connections

전체 서비스의 풀 합계가 PostgreSQL `max_connections`를 초과하면 안 됩니다:

```
High-traffic:    3 서비스 × 20 = 60
Standard:        2 서비스 × 10 = 20
Batch-heavy:     1 서비스 × 15 = 15
Low-traffic:     2 서비스 ×  5 = 10
                                 ───
                         합계 = 105 커넥션
```

> **필수**: PostgreSQL `max_connections`를 200으로 설정해야 합니다 (여유분 95 포함).

#### Docker Compose 설정

```yaml
postgres:
  image: postgres:15-alpine
  command: postgres -c max_connections=200
```

#### 프로덕션 (RDS 파라미터 그룹)

```
max_connections = 200
```

### 프로덕션에서 leak-detection 비활성화

```yaml
# application-prod.yml 또는 환경변수
spring:
  datasource:
    hikari:
      leak-detection-threshold: 0  # 성능 오버헤드 제거
```

---

## 4. Flyway 마이그레이션

### 마이그레이션 파일 구조

각 서비스의 `src/main/resources/db/migration/` 디렉토리:

```
db/migration/
├── V1__create_schema.sql            # 스키마 생성, 권한 부여
├── V2__create_{entity}_tables.sql   # 테이블, 인덱스, 제약조건
├── V3__enable_rls.sql               # ROW LEVEL SECURITY 활성화
├── V4__create_rls_policies.sql      # 테넌트 격리 정책
└── V5__add_{feature}.sql            # 이후 변경사항
```

### Flyway 설정

```java
// FlywayConfig.java (common/common-database/)
@Configuration
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true")
public class FlywayConfig {
    // baselineOnMigrate: true   → 기존 스키마에 Flyway 적용 가능
    // validateOnMigrate: false  → 멀티 서비스가 같은 DB를 공유하므로 검증 완화
    // outOfOrder: true          → 순서 무관 마이그레이션 허용
    // ignoreMigrationPatterns: *:missing, *:ignored
}
```

### 마이그레이션 명명 규칙

| 접두사 | 의미 | 예시 |
|--------|------|------|
| `V{N}__` | 버전 마이그레이션 (순차적) | `V1__create_schema.sql` |
| `R__` | 반복 마이그레이션 (변경 시 재실행) | `R__create_views.sql` |

### 마이그레이션 작성 가이드

```sql
-- V2__create_employee_tables.sql

-- 테이블 생성
CREATE TABLE IF NOT EXISTS hr_core.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    employee_number VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    department_id UUID,
    position_id UUID,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id
    ON hr_core.employees (tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_department_id
    ON hr_core.employees (tenant_id, department_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_number_unique
    ON hr_core.employees (tenant_id, employee_number);

-- 타임스탬프 자동 업데이트 트리거
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON hr_core.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 마이그레이션 명령

```bash
# 상태 확인
./gradlew :services:employee-service:flywayInfo

# 마이그레이션 실행
./gradlew :services:employee-service:flywayMigrate

# 베이스라인 설정 (기존 DB에 Flyway 적용 시)
./gradlew :services:employee-service:flywayBaseline

# 클린 (주의: 전체 삭제!)
./gradlew :services:employee-service:flywayClean
```

---

## 5. 엔티티 패턴

### 상속 구조

```
BaseEntity
├── id: UUID (자동 생성)
│
└── AuditableEntity
    ├── createdAt: Instant (@CreatedDate)
    ├── updatedAt: Instant (@LastModifiedDate)
    ├── createdBy: String (@CreatedBy)
    ├── updatedBy: String (@LastModifiedBy)
    │
    └── TenantAwareEntity
        ├── tenantId: UUID (자동 설정, 수정 불가)
        │
        └── SoftDeleteEntity
            ├── deletedAt: Instant
            └── deletedBy: UUID
```

### BaseEntity

```java
@MappedSuperclass
@Getter
@SuperBuilder
@NoArgsConstructor
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    // Hibernate 프록시 안전 equals/hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || Hibernate.getClass(this) != Hibernate.getClass(o)) return false;
        BaseEntity that = (BaseEntity) o;
        return id != null && Objects.equals(id, that.id);
    }
}
```

### AuditableEntity

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity extends BaseEntity {

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;
}
```

### TenantAwareEntity

```java
@MappedSuperclass
public abstract class TenantAwareEntity extends AuditableEntity {

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @PrePersist
    protected void prePersist() {
        if (this.tenantId == null) {
            this.tenantId = TenantContextHolder.getCurrentTenant();
        }
        if (this.tenantId == null) {
            throw new IllegalStateException("Tenant ID is required");
        }
    }
}
```

### SoftDeleteEntity

```java
@MappedSuperclass
@SQLRestriction("deleted_at IS NULL")  // 자동 필터링
public abstract class SoftDeleteEntity extends TenantAwareEntity {

    private Instant deletedAt;
    private UUID deletedBy;

    public void softDelete() {
        this.deletedAt = Instant.now();
        this.deletedBy = SecurityContextHolder.getCurrentUserId();
    }

    public void restore() {
        this.deletedAt = null;
        this.deletedBy = null;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }
}
```

### 엔티티 선택 가이드

| 상황 | 상속할 엔티티 |
|------|-------------|
| 테넌트 데이터 + 소프트 삭제 필요 | `SoftDeleteEntity` |
| 테넌트 데이터 (물리 삭제 OK) | `TenantAwareEntity` |
| 감사 필요하지만 테넌트 무관 | `AuditableEntity` |
| 최소한의 엔티티 | `BaseEntity` |

---

## 6. 트랜잭션 관리

### 기본 규칙

```java
// 읽기 전용 (쿼리 최적화, Dirty Checking 비활성화)
@Transactional(readOnly = true)
public EmployeeResponse getById(UUID id) { ... }

// 쓰기 (기본 전파: REQUIRED)
@Transactional
public EmployeeResponse create(EmployeeCreateRequest request) { ... }
```

### 트랜잭션 전파 (Propagation)

| 전파 유형 | 사용 케이스 |
|---------|-----------|
| `REQUIRED` (기본) | 대부분의 서비스 메서드 |
| `REQUIRES_NEW` | 독립 트랜잭션 필요 (예: 이벤트 리스너) |
| `MANDATORY` | 반드시 기존 트랜잭션 내에서 호출 |

### 이벤트 리스너 트랜잭션 격리

```java
// EmployeeCreatedCardListener.java
@TransactionalEventListener
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void onEmployeeCreated(EmployeeCreatedEvent event) {
    try {
        employeeCardService.autoIssueForNewEmployee(event.getEmployeeId());
    } catch (Exception e) {
        // 카드 발급 실패가 직원 생성을 롤백하지 않음
        log.error("카드 자동 발급 실패: {}", event.getEmployeeId(), e);
    }
}
```

> `REQUIRES_NEW`로 부모 트랜잭션과 격리합니다. 비핵심 후처리가 실패해도 핵심 엔티티는 보존됩니다.

---

## 7. JPA Auditing

### 설정

```java
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> Optional.ofNullable(
            SecurityContextHolder.getCurrentUserId()
        ).map(UUID::toString);
    }
}
```

### 자동 설정되는 필드

| 필드 | 어노테이션 | 값 |
|------|----------|------|
| `createdAt` | `@CreatedDate` | 엔티티 최초 저장 시각 |
| `updatedAt` | `@LastModifiedDate` | 엔티티 수정 시각 |
| `createdBy` | `@CreatedBy` | 현재 로그인 사용자 ID |
| `updatedBy` | `@LastModifiedBy` | 현재 로그인 사용자 ID |

---

## 8. 컨버터 (Converter)

### JsonNodeConverter

PostgreSQL JSONB 컬럼을 Jackson `JsonNode`로 변환합니다:

```java
@Entity
public class ApprovalTemplate extends TenantAwareEntity {

    @Convert(converter = JsonNodeConverter.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode formSchema;  // 동적 양식 스키마
}
```

### StringListConverter

PostgreSQL TEXT[] 배열을 `List<String>`으로 변환합니다:

```java
@Entity
public class DelegationRule extends TenantAwareEntity {

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "text[]")
    private List<String> documentTypes;  // 위임 대상 문서 유형
}
```

---

## 9. PostgreSQL 확장 기능

### uuid-ossp

UUID 생성 함수를 제공합니다:

```sql
-- PK 기본값으로 사용
id UUID DEFAULT gen_random_uuid() PRIMARY KEY
```

### pgcrypto

암호화 함수를 제공합니다:

```sql
-- gen_random_uuid()는 pgcrypto에서 제공 (PostgreSQL 13+는 내장)
-- 해시 함수 등 추가 암호화 기능 사용 가능
```

---

## 10. 인덱스 전략

### 필수 인덱스

| 인덱스 | 대상 | 사유 |
|--------|------|------|
| PK (id) | 모든 테이블 | 기본 조회 |
| `tenant_id` | 모든 테넌트 테이블 | RLS 성능, 테넌트 쿼리 |
| `tenant_id + 자주 조회하는 컬럼` | 복합 인덱스 | 테넌트 범위 내 검색 |
| Unique 제약 | 비즈니스 키 | 데이터 무결성 |

### 인덱스 명명 규칙

```sql
-- 일반 인덱스: idx_{table}_{columns}
CREATE INDEX idx_employees_tenant_id ON hr_core.employees (tenant_id);

-- 복합 인덱스: idx_{table}_{col1}_{col2}
CREATE INDEX idx_employees_dept ON hr_core.employees (tenant_id, department_id);

-- 유니크 인덱스: idx_{table}_{columns}_unique
CREATE UNIQUE INDEX idx_employees_number_unique
    ON hr_core.employees (tenant_id, employee_number);
```

### 인덱스 모니터링

```sql
-- 사용되지 않는 인덱스 확인
SELECT schemaname, relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- 인덱스 크기
SELECT pg_size_pretty(pg_indexes_size('hr_core.employees'));
```

---

## 11. 쿼리 최적화

### N+1 문제 방지

```java
// ❌ N+1 발생: 직원 목록 조회 후 각 직원의 부서 개별 조회
@Query("SELECT e FROM Employee e")
List<Employee> findAllEmployees();

// ✅ 해결 1: @EntityGraph
@EntityGraph(attributePaths = {"department", "position"})
@Query("SELECT e FROM Employee e")
List<Employee> findAllWithDepartment();

// ✅ 해결 2: JPQL JOIN FETCH
@Query("SELECT e FROM Employee e JOIN FETCH e.department")
List<Employee> findAllWithDepartmentFetch();
```

### 페이징

```java
// Spring Data JPA 페이징
Page<Employee> findByStatus(EmployeeStatus status, Pageable pageable);

// 사용
Pageable pageable = PageRequest.of(0, 20, Sort.by("name").ascending());
Page<Employee> page = repository.findByStatus(ACTIVE, pageable);
```

### 슬로우 쿼리 모니터링

```sql
-- PostgreSQL 슬로우 쿼리 로그 설정 (1초 이상)
-- RDS 파라미터 그룹: log_min_duration_statement = 1000

-- 현재 실행 중인 쿼리 확인
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

---

## 12. 프로덕션 설정

### RDS 파라미터 그룹

| 파라미터 | 값 | 설명 |
|---------|------|------|
| `max_connections` | 200 | 전체 서비스 풀 (105) + 여유분 |
| `shared_buffers` | `{DBInstanceClassMemory/4}` | 메모리의 25% |
| `work_mem` | 16MB | 정렬/해시 메모리 |
| `effective_cache_size` | `{DBInstanceClassMemory*3/4}` | 메모리의 75% |
| `log_min_duration_statement` | 1000 | 1초 이상 쿼리 로그 |
| `rds.force_ssl` | 1 | SSL 강제 |

### 백업 정책

| 방법 | RPO | 주기 |
|------|-----|------|
| RDS 자동 백업 | 5분 (PITR) | 연속적 |
| 수동 스냅샷 | 스냅샷 시점 | 배포 전 |

---

## 13. 트러블슈팅

### 커넥션 풀 고갈

**증상**: `Connection is not available, request timed out after 30000ms`

```bash
# 1. 현재 커넥션 수 확인
docker exec -it hr-saas-postgres psql -U hr_saas -d hr_saas \
  -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# 2. Actuator 메트릭 확인
curl http://localhost:8084/actuator/metrics/hikaricp.connections.active

# 3. 유휴 커넥션 확인
curl http://localhost:8084/actuator/metrics/hikaricp.connections.idle
```

**해결**:
- `maximum-pool-size` 증가
- PostgreSQL `max_connections` 확인
- 커넥션 누수 확인 (`leak-detection-threshold`)

### Flyway 마이그레이션 충돌

**증상**: `Found non-empty schema(s) "hr_core" but no schema history table`

```bash
# 베이스라인 생성
./gradlew :services:employee-service:flywayBaseline
```

**증상**: `Migration checksum mismatch`

```bash
# 체크섬 리페어 (이미 적용된 마이그레이션의 checksum 업데이트)
./gradlew :services:employee-service:flywayRepair
```

### 트랜잭션 타임아웃

**증상**: 오래 걸리는 작업에서 트랜잭션 타임아웃

```java
// 기본 타임아웃 증가 (특정 메서드만)
@Transactional(timeout = 120)  // 120초
public void batchProcess() { ... }
```

---

## 14. 관련 문서

| 문서 | 설명 |
|------|------|
| [MULTI_TENANCY.md](./MULTI_TENANCY.md) | PostgreSQL RLS, TenantAwareDataSource |
| [CACHING_STRATEGY.md](./CACHING_STRATEGY.md) | 캐시 vs DB 접근 |
| [DOCKER_GUIDE.md](../operations/DOCKER_GUIDE.md) | PostgreSQL 로컬 설정 |
| [AWS_INFRASTRUCTURE.md](../operations/AWS_INFRASTRUCTURE.md) | RDS 프로덕션 설정 |
| [docs/PHASE_1_ACTION_ITEMS.md](../PHASE_1_ACTION_ITEMS.md) | HikariCP 설정 상세 리뷰 |
| [docs/PHASE_1_REVIEW.md](../PHASE_1_REVIEW.md) | Phase 1 성능 최적화 리뷰 |
