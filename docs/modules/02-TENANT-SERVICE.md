# Module 02: Tenant Service — 프로덕션 정책/설정 분석

> **분석 일자**: 2026-02-06
> **분석 범위**: `services/tenant-service/`, `common/common-tenant/`, `common/common-database/rls/`

---

## 1. 현재 구현 상태 요약

### 1.1 구현 완료

| 기능 | 상태 | 위치 |
|------|------|------|
| 테넌트 CRUD (생성/조회/수정) | ✅ 완료 | `TenantServiceImpl` |
| 테넌트 상태 관리 (활성/정지/종료) | ✅ 완료 | `Tenant.activate/suspend/terminate()` |
| 테넌트 코드/ID 조회 | ✅ 완료 | `TenantRepository.findByCode()` |
| 테넌트 목록 페이징 조회 | ✅ 완료 | `TenantServiceImpl.getAll()` |
| 테넌트 정책 CRUD | ✅ 완료 | `TenantPolicyServiceImpl` |
| 테넌트 기능 플래그 관리 | ✅ 완료 | `TenantFeatureServiceImpl` |
| 기능 활성화 여부 확인 API | ✅ 완료 | `isFeatureEnabled()` |
| 정책/기능 캐싱 (Redis) | ✅ 완료 | `@Cacheable` |
| 캐시 무효화 (변경 시) | ✅ 완료 | `@CacheEvict` |
| RLS 정책 (정책/기능 테이블) | ✅ 완료 | `V30__init_tenant.sql` |
| 테넌트 생성 이벤트 발행 | ✅ 완료 | `TenantCreatedEvent` |
| 사업자번호/코드 중복 검증 | ✅ 완료 | `TenantServiceImpl.create()` |
| 개인정보 마스킹 (응답) | ✅ 완료 | `TenantResponse` — @Masked 적용 |
| TenantContext (ThreadLocal) | ✅ 완료 | `common-tenant` |
| TenantFilter (헤더 추출) | ✅ 완료 | `common-tenant` |
| @RequireTenant AOP | ✅ 완료 | `TenantAspect` |
| TenantResolver 인터페이스 | ✅ 완료 | `common-tenant` |
| RLS Connection Interceptor | ✅ 완료 | `TenantConnectionInterceptor` |
| updated_at 자동 갱신 트리거 | ✅ 완료 | DB 트리거 |

### 1.2 미구현 / TODO

| 기능 | 상태 | 위치 | 구현 방향 |
|------|------|------|-----------|
| 테넌트 초기 프로비저닝 | ❌ 미구현 | 생성 시 기본 정책/기능/관리자 자동 설정 없음 | 이벤트 소비자에서 처리 또는 create() 확장 |
| 그룹 대시보드 | ❌ 스텁 | `GroupDashboardService` — 모든 값이 0/하드코딩 | Feign Client로 각 서비스 집계 |
| TenantResolver 구현체 | ❌ 미구현 | 인터페이스만 존재, 구현체 없음 | Feign 또는 캐시 기반 구현 |
| 플랜별 기능 제한 | ❌ 미구현 | 플랜 타입 존재하나 기능 연동 없음 | 플랜-기능 매핑 테이블 또는 로직 |
| 계약 만료 자동 처리 | ❌ 미구현 | contract_end_date 필드 존재, 스케줄러 없음 | 배치 작업 + 알림 |
| 테넌트 종료 시 데이터 정리 | ❌ 미구현 | terminate()는 상태만 변경 | 보존 기간 후 데이터 삭제 스케줄러 |
| 정책 데이터 JSON 스키마 검증 | ❌ 미구현 | policyData가 free-form TEXT | PolicyType별 JSON 스키마 검증 |
| 정책 기본값 관리 | ❌ 미구현 | 시스템 기본 정책값 정의 없음 | 정책 조회 시 기본값 폴백 |
| 테넌트 감사 로그 | ❌ 미구현 | 생성/수정/상태변경 감사 로그 없음 | 이벤트 발행 또는 AuditLog 연동 |
| 테넌트 간 데이터 격리 검증 | ⚠️ 부분 | tenant 테이블은 RLS 미적용 (정상), 정책/기능은 적용 | — |
| 테넌트 정지 시 로그인 차단 | ❌ 미구현 | SUSPENDED 상태에서 로그인 가능 | Auth Service에서 테넌트 상태 확인 필요 |
| 테넌트별 인원 제한 체크 | ❌ 미구현 | maxEmployees 필드만 존재 | Employee Service에서 생성 시 체크 |
| 기능 config JSON 스키마 정의 | ❌ 미구현 | config가 free-form TEXT | 기능별 config 스키마 정의 |
| 테넌트 검색/필터 (이름, 상태 등) | ❌ 미구현 | 전체 목록만 가능 | QueryDSL 또는 Specification 기반 검색 |

---

## 2. 정책 결정사항

### 2.1 테넌트 초기 프로비저닝 (결정 완료)

**결정**: 기본 정책 + 기능 플래그 + 관리자 계정 자동 생성

| 초기 생성 항목 | 내용 |
|----------------|------|
| **기본 정책 7종** | PASSWORD, ATTENDANCE, LEAVE, APPROVAL, SECURITY, NOTIFICATION, ORGANIZATION 각각 기본값 |
| **기능 플래그** | 플랜에 따른 기본 기능 활성화 |
| **관리자 계정** | TENANT_ADMIN 역할의 초기 관리자 1명 (Auth Service 연동) |

**프로비저닝 흐름**:
```
1. TenantService.create() → Tenant 저장
2. TenantCreatedEvent 발행
3. [이벤트 소비자] 기본 정책 7종 생성 (기본값 JSON)
4. [이벤트 소비자] 플랜별 기능 플래그 생성
5. [이벤트 소비자] Auth Service로 관리자 계정 생성 요청
6. [이벤트 소비자] 기본 조직 구조 생성 요청 (Organization Service)
```

### 2.2 플랜별 기능 제한 (결정 완료)

**결정**: 플랜별로 사용 가능 기능이 다름

| 기능 코드 | BASIC | STANDARD | PREMIUM | ENTERPRISE |
|-----------|:-----:|:--------:|:-------:|:----------:|
| EMPLOYEE | ✅ | ✅ | ✅ | ✅ |
| ORGANIZATION | ✅ | ✅ | ✅ | ✅ |
| ATTENDANCE | ✅ | ✅ | ✅ | ✅ |
| LEAVE | ✅ | ✅ | ✅ | ✅ |
| APPROVAL | ❌ | ✅ | ✅ | ✅ |
| RECRUITMENT | ❌ | ❌ | ✅ | ✅ |
| TRANSFER | ❌ | ❌ | ✅ | ✅ |
| HEADCOUNT | ❌ | ❌ | ✅ | ✅ |
| CONDOLENCE | ❌ | ✅ | ✅ | ✅ |
| COMMITTEE | ❌ | ❌ | ✅ | ✅ |
| EMPLOYEE_CARD | ❌ | ✅ | ✅ | ✅ |
| CERTIFICATE | ❌ | ✅ | ✅ | ✅ |
| APPOINTMENT | ❌ | ❌ | ❌ | ✅ |
| AUDIT_LOG | ❌ | ❌ | ✅ | ✅ |
| MFA | ❌ | ❌ | ✅ | ✅ |
| GROUP_DASHBOARD | ❌ | ❌ | ❌ | ✅ |

**구현 방향**:
- `PlanFeatureMapping` 상수 맵 또는 DB 테이블로 관리
- 테넌트 생성 시 플랜에 맞는 feature 레코드 자동 생성
- 플랜 업그레이드 시 추가 기능 활성화, 다운그레이드 시 비활성화

### 2.3 계약 만료 처리 (결정 완료)

**결정**: 자동 정지 + 알림

| 시점 | 처리 |
|------|------|
| 만료 30일 전 | TENANT_ADMIN에게 알림 (Notification Service) |
| 만료 7일 전 | TENANT_ADMIN + SUPER_ADMIN에게 알림 |
| 만료 1일 전 | 긴급 알림 |
| 만료일 | 테넌트 상태 → SUSPENDED, 로그인 시 경고 메시지 |
| 만료 + 90일 | 데이터 보존 기간 종료, TERMINATED 상태로 전환 |

**스케줄러 구현**:
```java
@Scheduled(cron = "0 0 1 * * *")  // 매일 01:00
public void checkContractExpiry() {
    // 1. 만료 30일/7일/1일 전 알림 발송
    // 2. 만료된 테넌트 SUSPENDED 처리
    // 3. 보존 기간 종료 테넌트 TERMINATED 처리
}
```

### 2.4 테넌트 종료 시 데이터 처리 (결정 완료)

**결정**: 소프트 삭제 + 90일 보존

| 단계 | 상태 | 데이터 접근 | 복구 가능 |
|------|------|------------|-----------|
| 활성 | ACTIVE | 전체 | — |
| 정지 | SUSPENDED | 읽기 전용 | ✅ 즉시 |
| 종료 | TERMINATED | 차단 | ✅ 90일 이내 |
| 완전 삭제 | — | 삭제됨 | ❌ |

---

## 3. 비즈니스 로직 사양

### 3.1 테넌트 생성 흐름

```
1. SUPER_ADMIN → POST /api/v1/tenants { code, name, planType, ... }
2. 코드 유니크 검증 (existsByCode)
3. 사업자번호 유니크 검증 (existsByBusinessNumber)
4. Tenant 엔티티 저장 (status=ACTIVE)
5. TenantCreatedEvent 발행
6. ★ [미구현] 이벤트 소비자에서 프로비저닝:
   a. 기본 정책 7종 생성 (PolicyType 각각에 기본 JSON)
   b. 플랜별 기능 플래그 생성 (활성화/비활성화)
   c. Auth Service: 초기 TENANT_ADMIN 계정 생성
   d. Organization Service: 기본 조직(본사) 생성
7. TenantResponse 반환
```

### 3.2 테넌트 상태 전이

```
        activate()           suspend()           terminate()
ACTIVE ←──────→ SUSPENDED ──────────→ TERMINATED
  ↑                                        │
  └── (90일 이내 복구 가능) ←──────────────┘
```

| 전이 | 트리거 | 부수 효과 |
|------|--------|-----------|
| ACTIVE → SUSPENDED | 관리자 수동 / 계약 만료 / 요금 미납 | 로그인 차단 (AUTH에서 확인), 데이터 읽기 전용 |
| SUSPENDED → ACTIVE | 관리자 수동 / 계약 갱신 | 정상 운영 복귀 |
| SUSPENDED → TERMINATED | 관리자 수동 / 보존 기간 종료 | 데이터 접근 차단 |
| TERMINATED → ACTIVE | 관리자 복구 (90일 이내) | 데이터 접근 복원 |

### 3.3 정책 관리 흐름

```
1. SUPER_ADMIN/TENANT_ADMIN → PUT /api/v1/tenants/{tenantId}/policies/{policyType}
2. 테넌트 존재 확인
3. 기존 정책 존재 → 업데이트, 미존재 → 생성 (upsert)
4. ★ [미구현] policyData JSON 스키마 검증 (PolicyType별)
5. ★ [미구현] 시스템 최소 기준 검증 (PASSWORD 정책 등)
6. 캐시 무효화
7. TenantPolicyResponse 반환
```

### 3.4 기능 플래그 관리 흐름

```
1. SUPER_ADMIN/TENANT_ADMIN → PATCH /api/v1/tenants/{tenantId}/features/{featureCode}
2. 테넌트 존재 확인
3. ★ [미구현] 플랜 제한 확인 (해당 플랜에서 허용된 기능인지)
4. 기존 기능 존재 → 업데이트, 미존재 → 생성 (upsert)
5. 캐시 무효화
6. TenantFeatureResponse 반환
```

### 3.5 RLS (Row Level Security) 동작

```
요청 → TenantFilter (헤더 X-Tenant-Id 추출) → TenantContext 설정
                    ↓
SecurityFilter (JWT에서 tenant_id 추출) → TenantContext 덮어쓰기
                    ↓
DB 쿼리 실행 → TenantConnectionInterceptor
                    ↓
SET app.current_tenant = '{tenantId}'
                    ↓
RLS 정책: tenant_id = get_current_tenant_safe() 자동 필터
```

**필터 실행 순서**: TenantFilter (HIGHEST_PRECEDENCE+10) → SecurityFilter (HIGHEST_PRECEDENCE+20)
- SecurityFilter의 JWT 추출이 TenantFilter의 헤더 추출보다 우선 (나중에 실행되어 덮어씀)
- 즉, 최종 tenant_id는 JWT 토큰에서 결정됨

**RLS 적용 테이블**: `tenant_policy`, `tenant_feature`
**RLS 미적용 테이블**: `tenant` (SUPER_ADMIN만 접근)

---

## 4. 설정값 목록

### 4.1 application.yml 설정

```yaml
server:
  port: 8082

spring:
  application:
    name: tenant-service
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/hr_saas
    username: ${DB_USERNAME:hr_saas}
    password: ${DB_PASSWORD:hr_saas_password}
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: tenant_common
  flyway:
    enabled: true
    locations: classpath:db/migration
    schemas: tenant_common
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6381}
      password: ${REDIS_PASSWORD:redis_password}
```

### 4.2 캐시 키 패턴

| 캐시명 | 키 패턴 | TTL | 용도 |
|--------|---------|-----|------|
| `tenant` | `{id}` 또는 `code:{code}` | 설정 필요 | 테넌트 기본 정보 |
| `tenant-policy` | `{tenantId}-{policyType}` | 설정 필요 | 테넌트 정책 |
| `tenant-feature` | `{tenantId}-{featureCode}` | 설정 필요 | 테넌트 기능 플래그 |
| `tenant-feature-enabled` | `{tenantId}-{featureCode}` | 설정 필요 | 기능 활성화 여부 (boolean) |

**주의**: 현재 Redis 캐시 TTL이 명시적으로 설정되어 있지 않음 → 기본값 또는 무한 TTL 가능성.
`CacheNames.TENANT`이 `common-cache`에서 정의됨.

### 4.3 정책 타입별 policyData JSON 스키마 (기본값 정의)

#### PASSWORD 정책
```json
{
  "minLength": 8,
  "maxLength": 100,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireDigit": true,
  "requireSpecialChar": true,
  "minCharTypes": 4,
  "expiryDays": 90,
  "historyCount": 5,
  "expiryWarningDays": 7
}
```

#### ATTENDANCE 정책
```json
{
  "workStartTime": "09:00",
  "workEndTime": "18:00",
  "lunchStartTime": "12:00",
  "lunchEndTime": "13:00",
  "standardWorkHours": 8,
  "flexibleWorkEnabled": false,
  "remoteWorkEnabled": false,
  "lateGraceMinutes": 10,
  "overtimeApprovalRequired": true
}
```

#### LEAVE 정책
```json
{
  "annualLeaveBaseCount": 15,
  "annualLeaveAccrualType": "YEARLY",
  "sickLeaveMaxDays": 60,
  "halfDayEnabled": true,
  "quarterDayEnabled": false,
  "carryOverEnabled": true,
  "carryOverMaxDays": 5,
  "carryOverExpiryMonths": 3,
  "minLeaveNoticeHours": 24
}
```

#### APPROVAL 정책
```json
{
  "autoApproveEnabled": false,
  "escalationEnabled": true,
  "escalationDays": 3,
  "reminderEnabled": true,
  "reminderIntervalHours": 24,
  "maxApprovalLevels": 5,
  "parallelApprovalEnabled": false,
  "delegationEnabled": true,
  "delegationMaxDays": 30
}
```

#### SECURITY 정책
```json
{
  "sessionTimeoutMinutes": 480,
  "maxSessions": 5,
  "mfaPolicy": "DISABLED",
  "ipWhitelistEnabled": false,
  "ipWhitelist": [],
  "loginNotificationEnabled": true,
  "passwordResetTokenExpiryHours": 24
}
```

#### NOTIFICATION 정책
```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true,
  "sseEnabled": true,
  "quietHoursEnabled": false,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "07:00",
  "digestEnabled": false,
  "digestSchedule": "DAILY"
}
```

#### ORGANIZATION 정책
```json
{
  "maxDepartmentDepth": 5,
  "positionSystem": "GRADE_POSITION",
  "gradeCount": 10,
  "teamEnabled": true,
  "matrixOrgEnabled": false,
  "departmentCodeAutoGenerate": true,
  "departmentCodePrefix": "DEPT"
}
```

---

## 5. 갭 구현 사양

### 5.1 [HIGH] 테넌트 초기 프로비저닝

**현재 상태**: 테넌트 생성 시 빈 테넌트만 생성, 기본 정책/기능/관리자 없음

**구현 사양**:

**방법 A (이벤트 기반 — 추천)**:
```java
// TenantCreatedEvent 소비자 (같은 서비스 내)
@EventListener
@Transactional
public void onTenantCreated(TenantCreatedEvent event) {
    UUID tenantId = event.getTenantId();
    PlanType planType = event.getPlanType();  // 이벤트에 planType 추가 필요

    // 1. 기본 정책 7종 생성
    for (PolicyType type : PolicyType.values()) {
        tenantPolicyService.saveOrUpdate(tenantId, type,
            new UpdateTenantPolicyRequest(getDefaultPolicyData(type), true));
    }

    // 2. 플랜별 기능 플래그 생성
    Map<String, Boolean> features = PlanFeatureMapping.getFeatures(planType);
    features.forEach((code, enabled) ->
        tenantFeatureService.update(tenantId, code,
            new UpdateTenantFeatureRequest(enabled, null)));

    // 3. Auth Service: 초기 관리자 계정 생성 (Feign)
    authServiceClient.createUser(CreateUserRequest.builder()
        .tenantId(tenantId)
        .username(event.getTenantCode() + "_admin")
        .email(event.getEmail())
        .roles(List.of("ROLE_TENANT_ADMIN"))
        .temporaryPassword(true)
        .build());
}
```

**변경 필요**:
- `TenantCreatedEvent`에 `planType`, `email` 필드 추가
- `PlanFeatureMapping` 상수 클래스 생성
- 각 PolicyType별 기본 JSON 상수 정의
- Auth Service Feign Client 추가

### 5.2 [HIGH] 플랜별 기능 제한 적용

**현재 상태**: PlanType enum 존재하나 기능 제한 로직 없음

**구현 사양**:
```java
public class PlanFeatureMapping {
    private static final Map<PlanType, Set<String>> PLAN_FEATURES = Map.of(
        PlanType.BASIC, Set.of("EMPLOYEE", "ORGANIZATION", "ATTENDANCE", "LEAVE"),
        PlanType.STANDARD, Set.of(/* BASIC + */ "APPROVAL", "CONDOLENCE", "EMPLOYEE_CARD", "CERTIFICATE"),
        PlanType.PREMIUM, Set.of(/* STANDARD + */ "RECRUITMENT", "TRANSFER", "HEADCOUNT",
                                 "COMMITTEE", "AUDIT_LOG", "MFA"),
        PlanType.ENTERPRISE, Set.of(/* PREMIUM + */ "APPOINTMENT", "GROUP_DASHBOARD")
    );

    public static boolean isAllowed(PlanType plan, String featureCode) {
        return PLAN_FEATURES.get(plan).contains(featureCode);
    }
}
```

**적용 위치**:
- `TenantFeatureServiceImpl.update()` — 기능 활성화 시 플랜 체크
- 프로비저닝 시 플랜에 맞는 기능만 활성화

### 5.3 [HIGH] 테넌트 상태에 따른 로그인 차단

**현재 상태**: 테넌트가 SUSPENDED여도 로그인 가능

**구현 사양**:
```
Auth Service login() 흐름 수정:
1. 사용자 인증 성공 후
2. user.getTenantId()로 Tenant Service 호출 (Feign)
3. tenant.status == SUSPENDED → AUTH_011 "서비스가 일시 중지되었습니다"
4. tenant.status == TERMINATED → AUTH_012 "서비스가 종료되었습니다"
```

**또는 JWT에 tenant status를 포함하지 않고, 별도 체크 API**:
```
GET /api/v1/tenants/{tenantId}/status → { status: "ACTIVE" | "SUSPENDED" | "TERMINATED" }
```
이 API는 인증 없이 내부 서비스 간 호출용 (actuator처럼 permitAll 또는 내부 네트워크만)

### 5.4 [HIGH] 정책 JSON 스키마 검증

**현재 상태**: policyData가 free-form TEXT, 검증 없음

**구현 사양**:
- PolicyType별로 Java DTO 클래스 정의 (PasswordPolicyDto, AttendancePolicyDto 등)
- 저장 시 ObjectMapper로 JSON → DTO 역직렬화하여 검증
- 시스템 최소 기준 하회 시 오류 반환

```java
public void validatePolicyData(PolicyType type, String policyData) {
    switch (type) {
        case PASSWORD -> {
            PasswordPolicyDto dto = objectMapper.readValue(policyData, PasswordPolicyDto.class);
            if (dto.getMinLength() < 8) throw new BusinessException(...);
            if (dto.getMinCharTypes() < 3) throw new BusinessException(...);
        }
        case ATTENDANCE -> { ... }
        // ...
    }
}
```

### 5.5 [HIGH] 계약 만료 자동 처리 스케줄러

**현재 상태**: contract_end_date 필드만 존재, 체크 로직 없음

**구현 사양**:
```java
@Scheduled(cron = "0 0 1 * * *")
public void checkContractExpiry() {
    LocalDate today = LocalDate.now();

    // 1. 만료 알림 (30일/7일/1일 전)
    List<Tenant> expiring30 = tenantRepository.findByContractEndDate(today.plusDays(30));
    List<Tenant> expiring7 = tenantRepository.findByContractEndDate(today.plusDays(7));
    List<Tenant> expiring1 = tenantRepository.findByContractEndDate(today.plusDays(1));
    // → 알림 이벤트 발행

    // 2. 만료된 테넌트 SUSPENDED 처리
    List<Tenant> expired = tenantRepository.findByContractEndDateBeforeAndStatus(today, ACTIVE);
    expired.forEach(tenant -> {
        tenant.suspend();
        tenantRepository.save(tenant);
        // → 이벤트 발행
    });

    // 3. 보존 기간 종료 테넌트 TERMINATED 처리
    LocalDate terminateDate = today.minusDays(90);
    List<Tenant> toTerminate = tenantRepository
        .findByContractEndDateBeforeAndStatus(terminateDate, SUSPENDED);
    toTerminate.forEach(tenant -> {
        tenant.terminate();
        tenantRepository.save(tenant);
    });
}
```

**추가 Repository 메서드 필요**:
```java
List<Tenant> findByContractEndDate(LocalDate date);
List<Tenant> findByContractEndDateBeforeAndStatus(LocalDate date, TenantStatus status);
```

### 5.6 [MEDIUM] TenantResolver 구현체

**현재 상태**: 인터페이스만 존재, 어떤 서비스에서도 구현하지 않음

**구현 사양**:
```java
@Service
public class TenantResolverImpl implements TenantResolver {
    private final TenantRepository tenantRepository;
    private final RedisTemplate<String, TenantInfo> redisTemplate;

    @Override
    @Cacheable(value = "tenant-info", key = "#tenantId")
    public TenantInfo resolve(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new NotFoundException(...));
        return TenantInfo.builder()
            .tenantId(tenant.getId())
            .tenantCode(tenant.getCode())
            .tenantName(tenant.getName())
            .active(tenant.isActive())
            .build();
    }

    @Override
    public TenantInfo resolveByCode(String tenantCode) { ... }

    @Override
    public boolean isActive(UUID tenantId) { ... }
}
```

다른 서비스에서는 Feign Client로 호출:
```java
@FeignClient(name = "tenant-service")
public interface TenantClient {
    @GetMapping("/api/v1/tenants/{id}")
    ApiResponse<TenantResponse> getById(@PathVariable UUID id);

    @GetMapping("/api/v1/tenants/{tenantId}/features/{featureCode}/enabled")
    ApiResponse<Boolean> isFeatureEnabled(@PathVariable UUID tenantId, @PathVariable String featureCode);

    @GetMapping("/api/v1/tenants/{tenantId}/policies/{policyType}")
    ApiResponse<TenantPolicyResponse> getPolicy(@PathVariable UUID tenantId, @PathVariable PolicyType policyType);
}
```

### 5.7 [MEDIUM] 그룹 대시보드 구현

**현재 상태**: 모든 값 하드코딩 (0)

**구현 사양**:
```java
public Map<String, Object> getGroupDashboard() {
    Map<String, Object> dashboard = new HashMap<>();
    dashboard.put("totalTenants", tenantRepository.count());
    dashboard.put("activeTenants", tenantRepository.findByStatus(ACTIVE).size());
    dashboard.put("suspendedTenants", tenantRepository.findByStatus(SUSPENDED).size());

    // Feign 호출 (Circuit Breaker 적용)
    dashboard.put("totalEmployees", employeeClient.getTotalCount());
    dashboard.put("activeApprovals", approvalClient.getPendingCount());
    dashboard.put("pendingLeaveRequests", attendanceClient.getPendingLeaveCount());

    // 계약 만료 임박 테넌트
    dashboard.put("expiringTenants", tenantRepository
        .findByContractEndDateBetween(LocalDate.now(), LocalDate.now().plusDays(30)));

    return dashboard;
}
```

### 5.8 [MEDIUM] 테넌트별 인원 제한 체크

**현재 상태**: maxEmployees 필드만 존재

**구현 사양**:
- Employee Service에서 직원 생성 시 Tenant Service API 호출
- `GET /api/v1/tenants/{tenantId}` → maxEmployees 확인
- 현재 직원 수 ≥ maxEmployees → 생성 거부

```java
// Employee Service에서
int currentCount = employeeRepository.countByTenantId(tenantId);
TenantResponse tenant = tenantClient.getById(tenantId);
if (tenant.getMaxEmployees() != null && currentCount >= tenant.getMaxEmployees()) {
    throw new BusinessException("EMP_010", "테넌트 최대 인원을 초과했습니다.");
}
```

### 5.9 [MEDIUM] 정책 기본값 폴백

**현재 상태**: 정책이 없으면 NotFoundException

**구현 사양**:
```java
public TenantPolicyResponse getByTenantIdAndPolicyType(UUID tenantId, PolicyType policyType) {
    return tenantPolicyRepository.findByTenantIdAndPolicyType(tenantId, policyType)
        .map(TenantPolicyResponse::from)
        .orElseGet(() -> TenantPolicyResponse.builder()
            .tenantId(tenantId)
            .policyType(policyType)
            .policyData(DefaultPolicyData.get(policyType))  // 시스템 기본값
            .isActive(true)
            .build());
}
```

### 5.10 [LOW] 테넌트 검색 기능

**현재 상태**: 전체 목록 페이징만 가능

**구현 사양**:
```java
// TenantSearchRequest
private String keyword;       // 이름/코드 검색
private TenantStatus status;  // 상태 필터
private PlanType planType;    // 플랜 필터
private LocalDate contractEndDateFrom;
private LocalDate contractEndDateTo;
```

### 5.11 [LOW] 테넌트 감사 로그

**현재 상태**: 생성 이벤트만 발행, 수정/상태변경 이벤트 없음

**추가 이벤트**:
- `TenantUpdatedEvent`
- `TenantStatusChangedEvent` (activated, suspended, terminated)
- `TenantPolicyChangedEvent`
- `TenantFeatureChangedEvent`

---

## 6. 테스트 시나리오

### 6.1 단위 테스트

#### TenantServiceImpl 테스트
| # | 시나리오 | 상태 |
|---|---------|------|
| 1 | 정상 테넌트 생성 | ❌ 추가 필요 |
| 2 | 중복 코드 → DuplicateException | ❌ 추가 필요 |
| 3 | 중복 사업자번호 → DuplicateException | ❌ 추가 필요 |
| 4 | ID로 조회 (캐시 미스 → DB) | ❌ 추가 필요 |
| 5 | 코드로 조회 | ❌ 추가 필요 |
| 6 | 존재하지 않는 테넌트 → NotFoundException | ❌ 추가 필요 |
| 7 | 부분 업데이트 (null 필드 무시) | ❌ 추가 필요 |
| 8 | 상태 전이 (activate, suspend, terminate) | ❌ 추가 필요 |
| 9 | 생성 시 이벤트 발행 확인 | ❌ 추가 필요 |

#### TenantPolicyServiceImpl 테스트
| # | 시나리오 | 상태 |
|---|---------|------|
| 1 | 정책 조회 (존재) | ❌ 추가 필요 |
| 2 | 정책 조회 (미존재 → 기본값 폴백) | ❌ 추가 필요 |
| 3 | 정책 생성 (upsert — 신규) | ❌ 추가 필요 |
| 4 | 정책 업데이트 (upsert — 기존) | ❌ 추가 필요 |
| 5 | 정책 삭제 | ❌ 추가 필요 |
| 6 | JSON 스키마 검증 실패 | ❌ 추가 필요 |
| 7 | 시스템 최소 기준 하회 → 오류 | ❌ 추가 필요 |
| 8 | 테넌트 미존재 → NotFoundException | ❌ 추가 필요 |
| 9 | 캐시 무효화 확인 | ❌ 추가 필요 |

#### TenantFeatureServiceImpl 테스트
| # | 시나리오 | 상태 |
|---|---------|------|
| 1 | 기능 조회 | ❌ 추가 필요 |
| 2 | 기능 활성화/비활성화 | ❌ 추가 필요 |
| 3 | isFeatureEnabled (true/false) | ❌ 추가 필요 |
| 4 | 플랜 제한 체크 → 미허용 기능 활성화 시도 → 오류 | ❌ 추가 필요 |
| 5 | 활성화된 기능 목록 조회 | ❌ 추가 필요 |

### 6.2 통합 테스트

| # | 시나리오 | 상태 |
|---|---------|------|
| 1 | 테넌트 생성 → 프로비저닝 (정책+기능+관리자) 전체 플로우 | ❌ 추가 필요 |
| 2 | RLS 격리 검증 (다른 테넌트 정책/기능 접근 불가) | ❌ 추가 필요 |
| 3 | 테넌트 상태 전이 → 로그인 차단 검증 | ❌ 추가 필요 |
| 4 | 계약 만료 스케줄러 실행 → 상태 변경 검증 | ❌ 추가 필요 |
| 5 | 플랜 업그레이드 → 기능 활성화 변경 검증 | ❌ 추가 필요 |
| 6 | 캐시 동작 검증 (조회 캐시, 변경 시 무효화) | ❌ 추가 필요 |

---

## 7. 의존성

### 7.1 Tenant Service가 의존하는 모듈

| 의존 대상 | 용도 | 현재 상태 |
|-----------|------|-----------|
| `common-core` | 예외 처리 | ✅ 연동 |
| `common-entity` | AuditableEntity 상속 | ✅ 연동 |
| `common-response` | ApiResponse, PageResponse | ✅ 연동 |
| `common-database` | RLS 인터셉터 | ✅ 연동 |
| `common-tenant` | TenantContext | ✅ 연동 |
| `common-security` | JWT 필터, 권한 체크 | ✅ 연동 |
| `common-privacy` | @Masked 마스킹 | ✅ 연동 |
| `common-cache` | Redis 캐시 | ✅ 연동 |
| `common-event` | 이벤트 발행 | ✅ 연동 |
| **Auth Service** | 초기 관리자 계정 생성 | ❌ **미연동** (프로비저닝에 필요) |
| **Organization Service** | 기본 조직 생성 | ❌ **미연동** (프로비저닝에 필요) |
| **Employee Service** | 총 직원 수 (대시보드) | ❌ **미연동** (대시보드에 필요) |

### 7.2 Tenant Service를 의존하는 모듈

| 의존 주체 | 용도 |
|-----------|------|
| **Auth Service** | 테넌트 상태 확인 (로그인 시), 비밀번호 정책 조회 |
| **Employee Service** | 인원 제한 확인, 테넌트 정보 조회 |
| **Attendance Service** | 근태/휴가 정책 조회 |
| **Approval Service** | 결재 정책 조회 |
| **Notification Service** | 알림 정책 조회 |
| **Organization Service** | 조직 정책 조회 |
| **모든 서비스** | 기능 플래그 확인 (isFeatureEnabled) |

### 7.3 이벤트 발행/소비

| 이벤트 | 토픽 | 발행 | 소비자 |
|--------|------|------|--------|
| `TenantCreatedEvent` | `hr-saas.tenant.created` | ✅ 발행 | 프로비저닝 리스너 (내부), Org Service |
| ★ `TenantUpdatedEvent` | `hr-saas.tenant.updated` | ❌ 미구현 | 캐시 갱신 |
| ★ `TenantStatusChangedEvent` | `hr-saas.tenant.status-changed` | ❌ 미구현 | Auth (로그인 차단), Notification |
| ★ `ContractExpiryWarningEvent` | `hr-saas.tenant.contract-expiry` | ❌ 미구현 | Notification |

---

## 8. API 엔드포인트 요약

### 현재 구현

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/api/v1/tenants` | ✅ SUPER_ADMIN | 테넌트 생성 |
| `GET` | `/api/v1/tenants/{id}` | ✅ SUPER_ADMIN/TENANT_ADMIN | 테넌트 상세 조회 |
| `GET` | `/api/v1/tenants/code/{code}` | ✅ SUPER_ADMIN/TENANT_ADMIN | 코드로 조회 |
| `GET` | `/api/v1/tenants` | ✅ SUPER_ADMIN | 테넌트 목록 |
| `PUT` | `/api/v1/tenants/{id}` | ✅ SUPER_ADMIN | 테넌트 수정 |
| `POST` | `/api/v1/tenants/{id}/activate` | ✅ SUPER_ADMIN | 활성화 |
| `POST` | `/api/v1/tenants/{id}/suspend` | ✅ SUPER_ADMIN | 정지 |
| `DELETE` | `/api/v1/tenants/{id}` | ✅ SUPER_ADMIN | 종료 |
| `GET` | `/api/v1/tenants/{tenantId}/policies` | ✅ SUPER_ADMIN/TENANT_ADMIN | 정책 목록 |
| `GET` | `/api/v1/tenants/{tenantId}/policies/{policyType}` | ✅ SUPER_ADMIN/TENANT_ADMIN | 정책 상세 |
| `PUT` | `/api/v1/tenants/{tenantId}/policies/{policyType}` | ✅ SUPER_ADMIN/TENANT_ADMIN | 정책 저장 |
| `DELETE` | `/api/v1/tenants/{tenantId}/policies/{policyType}` | ✅ SUPER_ADMIN | 정책 삭제 |
| `GET` | `/api/v1/tenants/{tenantId}/features` | ✅ SUPER_ADMIN/TENANT_ADMIN | 기능 목록 |
| `GET` | `/api/v1/tenants/{tenantId}/features/{featureCode}` | ✅ SUPER_ADMIN/TENANT_ADMIN | 기능 상세 |
| `PATCH` | `/api/v1/tenants/{tenantId}/features/{featureCode}` | ✅ SUPER_ADMIN/TENANT_ADMIN | 기능 활성/비활성 |
| `GET` | `/api/v1/tenants/{tenantId}/features/{featureCode}/enabled` | ✅ 인증됨 | 기능 활성화 여부 |
| `GET` | `/api/v1/tenants/group/dashboard` | ✅ SUPER_ADMIN | 그룹 대시보드 |

### 추가 필요 (내부 서비스 간 API)

| Method | Path | 용도 |
|--------|------|------|
| `GET` | `/api/v1/tenants/{tenantId}/status` | 테넌트 상태 확인 (Auth에서 로그인 차단용) |
| `GET` | `/api/v1/tenants/{tenantId}/max-employees` | 인원 제한 확인 (Employee에서 사용) |

---

## 9. 에러 코드 정리

| 코드 | HTTP | 메시지 | 비고 |
|------|------|--------|------|
| `TNT_001` | 404 | 테넌트를 찾을 수 없습니다 | |
| `TNT_002` | 404 | 정책을 찾을 수 없습니다 | |
| `TNT_003` | 403/404 | 테넌트 컨텍스트 미설정 / 기능 미존재 | 코드 중복 — 정리 필요 |
| `TNT_004` | 409 | 중복된 코드/사업자번호 | |
| ★ `TNT_005` | 400 | 정책 데이터 검증 실패 | 추가 필요 |
| ★ `TNT_006` | 403 | 플랜에서 허용되지 않은 기능 | 추가 필요 |
| ★ `TNT_007` | 403 | 정지된 테넌트 접근 시도 | 추가 필요 |
| ★ `TNT_008` | 400 | 시스템 최소 기준 하회 | 추가 필요 |

---

## 10. 데이터베이스 스키마

### 현재 테이블 (tenant_common 스키마)

```
tenant_common.tenant          — 테넌트 마스터 (RLS 미적용)
tenant_common.tenant_policy   — 테넌트 정책 (RLS 적용)
tenant_common.tenant_feature  — 테넌트 기능 플래그 (RLS 적용)
```

### 시드 데이터

```sql
-- 기본 테넌트 (ID: 00000000-0000-0000-0000-000000000001)
INSERT INTO tenant (id, code, name, status, plan_type)
VALUES ('00000000-...001', 'DEFAULT', '기본 테넌트', 'ACTIVE', 'ENTERPRISE');
```

### 추가 필요 인덱스/컬럼

```sql
-- 계약 만료 검색용
CREATE INDEX idx_tenant_contract_end_date ON tenant_common.tenant(contract_end_date);

-- 테넌트 종료 시 데이터 보존 기간 추적
ALTER TABLE tenant_common.tenant ADD COLUMN terminated_at TIMESTAMPTZ;
ALTER TABLE tenant_common.tenant ADD COLUMN data_retention_until TIMESTAMPTZ;
```

---

## 11. 구현 우선순위 요약

| 순위 | 항목 | 복잡도 | 의존성 |
|------|------|--------|--------|
| 1 | 테넌트 초기 프로비저닝 | 높음 | Auth, Organization |
| 2 | 플랜별 기능 제한 적용 | 중간 | 없음 |
| 3 | 정책 JSON 스키마 검증 | 중간 | 없음 |
| 4 | 테넌트 상태별 로그인 차단 | 중간 | Auth Service |
| 5 | 계약 만료 자동 처리 스케줄러 | 중간 | Notification |
| 6 | TenantResolver 구현체 | 낮음 | 없음 |
| 7 | 정책 기본값 폴백 | 낮음 | 없음 |
| 8 | 테넌트별 인원 제한 체크 | 낮음 | Employee Service |
| 9 | 그룹 대시보드 연동 | 높음 | 모든 서비스 Feign |
| 10 | 테넌트 검색 기능 | 낮음 | 없음 |
| 11 | 감사 이벤트 발행 | 낮음 | Audit Service |
| 12 | 테넌트 종료 데이터 정리 스케줄러 | 중간 | 없음 |
