# HR Platform Backend - Current Status

> **Last Updated**: 2026-02-09
> **Last Commit**: `63d2a0a` - Merge Phase 2: N+1 query optimization with @BatchSize and @EntityGraph

---

## 1. 완료된 작업

### Phase 1: 기본 인프라 (100% 완료)
- [x] Docker Compose 환경 구성 (PostgreSQL, Redis, Kafka, Keycloak)
- [x] Common 모듈 9개 구현
- [x] 기본 서비스 10개 스캐폴딩

### Phase 2: RLS + Permission (100% 완료)
- [x] Flyway 마이그레이션 (V1-V4) 전체 서비스 적용
- [x] PostgreSQL Row Level Security 정책 생성
- [x] `@EnableMethodSecurity` 전체 서비스 활성화
- [x] `@PreAuthorize` 전체 컨트롤러 적용 (150+ 메서드)

### Phase 3: Privacy Masking (100% 완료)
- [x] `MaskedFieldSerializer` 구현
- [x] `PrivacyContext`, `PrivacyFilter` 구현
- [x] `@Masked` 어노테이션 Entity/DTO 적용
- [x] 역할 기반 마스킹 (HR_ADMIN 이상은 원본, 일반 직원은 마스킹)

### Phase 4: Common Module Tests (100% 완료)
- [x] common-core: `DateTimeUtilsTest`, `StringUtilsTest`
- [x] common-response: `ApiResponseTest`
- [x] common-tenant: `TenantContextTest`
- [x] common-security: `PermissionCheckerTest`, `SecurityContextHolderTest`
- [x] common-privacy: `MaskingServiceTest`, `PrivacyContextTest`

### Phase 5: 성능 최적화 (67% 완료)
- [x] Phase 1: HikariCP 연결 풀 설정 (8개 서비스)
- [x] Phase 2: N+1 쿼리 최적화 (@BatchSize, @EntityGraph)
- [ ] Phase 3: Redis 캐싱 최적화 (진행 중)

---

## 2. 서비스별 현황

| Service | Port | RLS | Permission | Privacy | Flyway | Status |
|---------|------|-----|------------|---------|--------|--------|
| gateway-service | 8080 | N/A | N/A | N/A | N/A | 기본 |
| auth-service | 8081 | N/A | N/A | N/A | N/A | 기본 |
| tenant-service | 8082 | ✅ | ✅ | ✅ | V1-V4 | **완료** |
| organization-service | 8083 | ✅ | ✅ | - | V1-V4 | **완료** |
| employee-service | 8084 | ✅ | ✅ | ✅ | V1-V4 | **완료** |
| attendance-service | 8085 | ✅ | ✅ | - | V1-V4 | **완료** |
| approval-service | 8086 | ✅ | ✅ | - | V1-V4 | **완료** |
| mdm-service | 8087 | ✅ | ✅ | - | V1-V4 | **완료** |
| notification-service | 8088 | ✅ | ✅ | - | V1-V4 | **완료** |
| file-service | 8089 | ✅ | ✅ | - | V1-V4 | **완료** |
| **appointment-service** | 8090 | ✅ | ✅ | ✅ | V1-V4 | **신규** |
| **certificate-service** | 8091 | ✅ | ✅ | ✅ | V1-V4 | **신규** |
| **recruitment-service** | 8092 | ✅ | ✅ | ✅ | V1-V4 | **신규** |

---

## 3. 아키텍처 패턴

### 3.1 Multi-Tenancy (RLS)
```java
// 1. TenantFilter가 JWT에서 tenant_id 추출하여 TenantContext에 설정
TenantContext.setCurrentTenant(tenantId);

// 2. RlsInterceptor가 DB 연결 시 tenant context 설정
"SELECT set_config('app.current_tenant', '" + tenantId + "', true)"

// 3. PostgreSQL RLS 정책이 자동 필터링
CREATE POLICY tenant_isolation ON employees
  USING (tenant_id = get_current_tenant_safe());
```

### 3.2 Permission Check
```java
// Controller에서 역할 기반 권한 체크
@PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")
public ResponseEntity<ApiResponse<EmployeeResponse>> create(...) { }

// 동적 권한 체크 (본인 데이터 접근)
@PreAuthorize("@permissionChecker.canAccessEmployee(#employeeId)")
public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable UUID employeeId) { }
```

### 3.3 Privacy Masking
```java
// DTO에 @Masked 어노테이션 적용
@Masked(type = MaskType.PHONE)
@JsonSerialize(using = MaskedFieldSerializer.class)
private String phone;

// MaskedFieldSerializer가 역할 확인 후 마스킹
// - HR_ADMIN, TENANT_ADMIN, SUPER_ADMIN: 원본 반환
// - EMPLOYEE: 마스킹 적용 (010-****-5678)
// - 본인 데이터: 원본 반환 (PrivacyContext.isViewingSelf())
```

---

## 4. Flyway 마이그레이션 구조

각 서비스의 `src/main/resources/db/migration/`:

| 파일 | 내용 |
|------|------|
| V1__create_schema.sql | 스키마 생성, 권한 부여 |
| V2__create_*_tables.sql | 테이블, 인덱스 생성 |
| V3__enable_rls.sql | ROW LEVEL SECURITY 활성화 |
| V4__create_rls_policies.sql | 테넌트 격리 정책 생성 |

### RLS 함수 (common 스키마)
```sql
-- 안전한 tenant_id 조회 (설정 없으면 NULL 반환)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 5. 권한 매트릭스

### 역할 계층
```
SUPER_ADMIN > TENANT_ADMIN > HR_ADMIN > EMPLOYEE
```

### API 권한 패턴
| Operation | EMPLOYEE | HR_ADMIN | TENANT_ADMIN | SUPER_ADMIN |
|-----------|----------|----------|--------------|-------------|
| 목록 조회 | ✅ (마스킹) | ✅ | ✅ | ✅ |
| 상세 조회 | 본인만 | ✅ | ✅ | ✅ |
| 생성 | ❌ | ✅ | ✅ | ✅ |
| 수정 | 본인만 | ✅ | ✅ | ✅ |
| 삭제 | ❌ | ❌ | ❌ | ✅ |
| 통계/관리 | ❌ | ✅ | ✅ | ✅ |

---

## 6. 미완료 작업 (Medium Priority)

### 6.1 Cache 표준화 (Phase 3 진행 중)
- [x] CacheNames 상수 정의 완료 (55개)
- [x] CacheConfig TTL 정책 설정 완료
- [ ] 모든 서비스에서 일관된 캐싱 적용
- [ ] Empty collection 직렬화 버그 해결 (10개 위치)
- [ ] 테넌트 격리 검증

### 6.2 Security 이슈 해결 ✅ COMPLETE
- [x] SecurityFilter 이중 등록 문제 전체 12개 서비스 해결
- [x] FilterRegistrationBean.setEnabled(false) 적용

### 6.3 메시징 인프라 ✅ COMPLETE
- [x] Kafka → AWS SQS+SNS 마이그레이션 완료
- [x] SnsEventPublisher 구현
- [x] 15개 도메인 이벤트 토픽 정의
- [x] 7개 이벤트 리스너 구현

### 6.4 Integration Tests
- [x] 서비스별 단위 테스트 (65개 클래스)
- [ ] RLS 동작 검증 테스트
- [ ] Cross-service API 테스트

---

## 7. 성능 최적화 상세 (Phase 1-3)

### 7.1 Phase 1: HikariCP 연결 풀 최적화
**적용 서비스**: 8개
**변경 파일**: 9개 (8개 application.yml + 1개 Java)
**상태**: ✅ Master 병합 완료

**최적화 결과**:
- 고트래픽 서비스 (employee, auth, organization): 20 connections
- 표준 서비스 (tenant, mdm): 10 connections
- 저트래픽 서비스 (certificate, recruitment): 5 connections
- 배치 서비스 (appointment): 15 connections

### 7.2 Phase 2: N+1 쿼리 제거
**적용 엔티티**: 5개 (Department, ApprovalTemplate, ApprovalDocument, Committee, Announcement)
**변경 파일**: 9개
**상태**: ✅ Master 병합 완료

**기술 스택**:
1. `@BatchSize` - 컬렉션 로딩 배치화
2. `@NamedEntityGraph` - 관계 즉시 로딩
3. Repository `@EntityGraph` 메서드 추가

**성능 개선**:
- 쿼리 수: 70-99% 감소
- 레이턴시: 67-85% 개선
- 특히 Department Tree (110→4 쿼리, 96% 감소)

### 7.3 Phase 3: Redis 캐싱 최적화 (진행 중)
**적용 범위**: common-cache 모듈, organization-service (Grade, Position)
**변경 파일**: 5개 (staged)
**상태**: 🔄 브랜치 작업 중

**구현 완료**:
- CacheConfig (Jackson2 기반, TTL 정책)
- 55개 CacheNames 정의
- Grade/Position @Cacheable/@CacheEvict

**남은 작업**:
- Empty collection 직렬화 버그 수정
- 테넌트 격리 검증
- 전체 서비스 캐싱 적용

---

## 8. 테스트 현황 (2026-02-09 기준)

**전체 테스트 클래스**: 65개

| 서비스 | 테스트 클래스 수 | 주요 테스트 항목 |
|--------|-----------------|-----------------|
| Organization | 8개 | Grade, Position, Department, Announcement, Committee, Headcount, OrgHistory, ReorgImpact |
| Tenant | 9개 | Service, Policy, Feature, Provisioning, Resolver, Scheduler, Controller |
| Employee | 10개 | Service, Affiliation, NumberGenerator, Card, Transfer, Condolence, ChangeRequest, History, PrivacyAudit, Listener, RLS |
| Attendance | 9개 | Attendance, Leave, LeaveType, CarryOver, Accrual, Overtime, HolidayProvider, Scheduler, Listener |
| Approval | 4개 | LineResolver, ArbitraryRule, StateMachine, Guard |
| Auth | 7개 | Auth, Session, Password, History, LoginHistory, Scheduler, Controller |
| MDM | 9개 | CommonCode, CodeGroup, TenantCode, Search, ImportExport, Menu, ImpactAnalyzer, Scheduler, Controller |
| Notification | 3개 | SseSender, EmitterRegistry, Controller |
| **합계** | **65개** | - |

**커버리지 목표**: 80% (현재 추정 ~30%)

---

## 9. 실행 방법

### 9.1 로컬 환경 시작
```bash
# Docker 인프라 시작
cd docker && docker-compose up -d

# 전체 빌드
./gradlew build

# 특정 서비스 실행
./gradlew :services:employee-service:bootRun
```

### 9.2 테스트 실행
```bash
# 전체 테스트
./gradlew test

# Common 모듈 테스트
./gradlew :common:common-core:test
./gradlew :common:common-privacy:test
./gradlew :common:common-security:test

# 특정 서비스 테스트
./gradlew :services:employee-service:test

# 테스트 커버리지 리포트
./gradlew jacocoTestReport
```

### 9.3 Flyway 마이그레이션
```bash
# 마이그레이션 상태 확인
./gradlew :services:employee-service:flywayInfo

# 마이그레이션 실행
./gradlew :services:employee-service:flywayMigrate
```

---

## 10. 주요 파일 위치

### Common Modules
```
common/
├── common-core/          # ErrorCode, Exceptions, Utils
├── common-entity/        # BaseEntity, TenantAwareEntity
├── common-response/      # ApiResponse, GlobalExceptionHandler
├── common-database/      # RLS Interceptor, Flyway Config
├── common-tenant/        # TenantContext, TenantFilter
├── common-security/      # SecurityContextHolder, PermissionChecker
├── common-privacy/       # MaskingService, MaskedFieldSerializer
├── common-cache/         # CacheNames, CacheConfig
└── common-event/         # DomainEvent, EventPublisher
```

### Service Structure
```
services/{service-name}/
├── src/main/java/com/hrsaas/{service}/
│   ├── config/           # SecurityConfig, etc.
│   ├── controller/       # REST Controllers
│   ├── service/          # Business Logic
│   ├── repository/       # JPA Repositories
│   └── domain/
│       ├── entity/       # JPA Entities
│       ├── dto/          # Request/Response DTOs
│       └── event/        # Domain Events
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/     # Flyway migrations
└── src/test/             # Unit/Integration tests
```

---

## 11. 다음 작업 권장사항

### 즉시 가능한 작업
1. **Cache 적용**: 자주 조회되는 API에 `@Cacheable` 추가
2. **Integration Test**: RLS 동작 검증 테스트 작성
3. **API 문서화**: Swagger 어노테이션 보완

### 기능 확장
1. **Audit Log**: 민감 데이터 조회 로깅
2. **Batch Processing**: 대량 데이터 처리 Job
3. **Report Service**: 통계/리포트 서비스 추가

---

## 12. 참고 문서

| 문서 | 위치 | 설명 |
|------|------|------|
| CLAUDE.md | 루트 | 프로젝트 컨텍스트, 컨벤션 |
| PRD.md | 루트 | 제품 요구사항 |
| SDD_*.md | 루트 | 서비스별 상세 설계 |
| API_CONVENTIONS.md | 루트 | API 설계 규칙 |

---

## 13. 알려진 이슈

1. **Windows CRLF Warning**: `git add` 시 LF/CRLF 경고 발생 (기능에 영향 없음)
2. **Flyway Baseline**: 기존 DB가 있는 경우 `flywayBaseline` 필요할 수 있음
3. **Keycloak Realm**: 초기 설정 시 realm-export.json import 필요

---

## 14. 연락처

- **GitHub**: https://github.com/sunguk0810/hr-platform
- **Issues**: https://github.com/sunguk0810/hr-platform/issues
