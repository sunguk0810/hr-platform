# Redis 캐싱 전략 가이드

> **최종 업데이트**: 2026-02-09
> **대상**: 백엔드 개발자
> **소스 코드**: `common/common-cache/`

---

## 목차

- [1. 개요](#1-개요)
- [2. Redis 구성](#2-redis-구성)
- [3. 캐시 키 명명 규칙](#3-캐시-키-명명-규칙)
- [4. TTL 전략](#4-ttl-전략)
- [5. 캐시 이름 상수 (CacheNames)](#5-캐시-이름-상수-cachenames)
- [6. Spring Cache 어노테이션](#6-spring-cache-어노테이션)
- [7. CacheKeyGenerator](#7-cachekeygenerator)
- [8. 직렬화 설정](#8-직렬화-설정)
- [9. 서비스별 캐시 사용 현황](#9-서비스별-캐시-사용-현황)
- [10. 캐시 무효화 패턴](#10-캐시-무효화-패턴)
- [11. 수동 Redis 접근 (RedisTemplate)](#11-수동-redis-접근-redistemplate)
- [12. 성능 모니터링](#12-성능-모니터링)
- [13. 트러블슈팅](#13-트러블슈팅)
- [14. 관련 문서](#14-관련-문서)

---

## 1. 개요

HR SaaS 플랫폼은 Redis 7.x를 캐시 계층으로 사용합니다. Spring Cache Abstraction을 통해 어노테이션 기반 캐싱을 제공하며, 토큰 관리와 세션 관리에는 `RedisTemplate`을 직접 사용합니다.

### 캐시 용도 분류

| 용도 | 방식 | 서비스 |
|------|------|--------|
| 엔티티 캐시 | `@Cacheable` / `@CacheEvict` | 대부분의 서비스 |
| 토큰 블랙리스트 | `RedisTemplate` 직접 사용 | auth-service |
| 세션 관리 | `RedisTemplate` 직접 사용 | auth-service |
| 리프레시 토큰 | `RedisTemplate` 직접 사용 | auth-service |

---

## 2. Redis 구성

### 환경별 설정

| 환경 | 호스트 | 포트 | SSL | 비밀번호 |
|------|--------|------|-----|---------|
| 로컬 (Docker) | `localhost` | `6381` | 아니오 | `redis_password` |
| 프로덕션 (ElastiCache) | `hr-saas-cache.xxxx.cache.amazonaws.com` | `6379` | 예 | Secrets Manager |

### Spring 설정 (application.yml)

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6381}
      password: ${REDIS_PASSWORD:redis_password}
      ssl:
        enabled: ${SPRING_DATA_REDIS_SSL_ENABLED:false}
```

---

## 3. 캐시 키 명명 규칙

### 표준 형식

```
{캐시이름}:{테넌트ID}:{키}
```

### CacheKeyGenerator 사용

```java
// 테넌트 범위 키 (자동으로 TenantContext에서 tenantId 추출)
String key = CacheKeyGenerator.generateKey("employee", employeeId.toString());
// → "employee:550e8400-e29b:emp-001"

// 글로벌 키 (테넌트 무관)
String key = CacheKeyGenerator.generateGlobalKey("config", "system-version");
// → "global:config:system-version"

// 사용자 범위 키
String key = CacheKeyGenerator.generateUserKey(userId, "session", "data");
// → "user:123e4567:session:data"
```

### 키 패턴 요약

| 패턴 | 형식 | 예시 |
|------|------|------|
| 테넌트 범위 | `{prefix}:{tenantId}:{key}` | `employee:550e8400:emp-001` |
| 글로벌 | `global:{prefix}:{key}` | `global:config:version` |
| 사용자 범위 | `user:{userId}:{prefix}:{key}` | `user:123e4567:session:data` |
| 토큰 | `token:{type}:{identifier}` | `token:blacklist:abc123` |

---

## 4. TTL 전략

### 캐시별 TTL

`CacheConfig`에서 캐시 이름별 TTL을 차등 설정합니다:

| 캐시 이름 | TTL | 사유 |
|----------|-----|------|
| **기본값** | 30분 | 미지정 캐시의 기본 TTL |
| `tenant`, `tenant:policy` | 1시간 | 테넌트 설정은 자주 변경되지 않음 |
| `mdm:codeGroup`, `mdm:commonCode` | 24시간 | 기준정보는 매우 안정적 |
| `employee` | 15분 | 직원 정보는 수정 빈도 중간 |
| `department`, `organization:tree`, `position`, `grade`, `committee` | 1시간 | 조직 구조는 비교적 안정적 |
| `approval:template` | 1시간 | 결재 양식은 자주 변경되지 않음 |

### TTL 선정 기준

```
업데이트 빈도가 높음 (15분 이하)
├── employee: 15분
├── session: TTL = 토큰 남은 시간

업데이트 빈도가 보통 (1시간)
├── tenant, department, position, grade: 1시간
├── approval:template, committee: 1시간

업데이트 빈도가 낮음 (24시간)
├── mdm:codeGroup, mdm:commonCode: 24시간
```

---

## 5. 캐시 이름 상수 (CacheNames)

**소스**: `common/common-cache/src/.../CacheNames.java`

하드코딩된 문자열 대신 상수를 사용합니다:

```java
public final class CacheNames {

    // 테넌트
    public static final String TENANT = "tenant";
    public static final String TENANT_POLICY = "tenant:policy";
    public static final String TENANT_FEATURE = "tenant:feature";
    public static final String TENANT_FEATURE_ENABLED = "tenant:feature:enabled";

    // 기준정보 (MDM)
    public static final String CODE_GROUP = "mdm:codeGroup";
    public static final String COMMON_CODE = "mdm:commonCode";
    public static final String TENANT_CODE = "mdm:tenantCode";
    public static final String CODE_TREE = "mdm:codeTree";

    // 조직
    public static final String ORGANIZATION = "organization";
    public static final String ORGANIZATION_TREE = "organization:tree";
    public static final String DEPARTMENT = "department";
    public static final String POSITION = "position";
    public static final String GRADE = "grade";
    public static final String COMMITTEE = "committee";

    // 직원
    public static final String EMPLOYEE = "employee";
    public static final String EMPLOYEE_PROFILE = "employee:profile";

    // 인증
    public static final String SESSION = "session";
    public static final String TOKEN = "token";
    public static final String PERMISSIONS = "permissions";

    // 근태
    public static final String HOLIDAY = "attendance:holiday";

    // 결재
    public static final String APPROVAL_TEMPLATE = "approval:template";

    // 발령
    public static final String APPOINTMENT_DRAFT = "appointment:draft";

    // 증명서
    public static final String CERTIFICATE_TYPE = "certificate:type";
    public static final String CERTIFICATE_TYPES = "certificate:types";
    public static final String CERTIFICATE_TEMPLATE = "certificate:template";
    public static final String CERTIFICATE_TEMPLATES = "certificate:templates";

    // 채용
    public static final String JOB_POSTING = "recruitment:jobPosting";
    public static final String JOB_POSTINGS = "recruitment:jobPostings";
}
```

---

## 6. Spring Cache 어노테이션

### @Cacheable (조회 시 캐시)

```java
@Cacheable(value = CacheNames.EMPLOYEE, key = "#employeeId")
@Transactional(readOnly = true)
public EmployeeResponse getById(UUID employeeId) {
    return employeeRepository.findById(employeeId)
        .map(this::toResponse)
        .orElseThrow(() -> new NotFoundException("EMP_001"));
}
```

### @CacheEvict (수정/삭제 시 캐시 무효화)

```java
@CacheEvict(value = CacheNames.EMPLOYEE, key = "#employeeId")
@Transactional
public EmployeeResponse update(UUID employeeId, EmployeeUpdateRequest request) {
    // 직원 정보 수정
}
```

### @CachePut (수정 후 캐시 갱신)

```java
@CachePut(value = CacheNames.EMPLOYEE, key = "#result.id")
@Transactional
public EmployeeResponse create(EmployeeCreateRequest request) {
    // 직원 생성 후 결과를 캐시에 저장
}
```

### @Caching (복합 캐시 작업)

```java
@Caching(evict = {
    @CacheEvict(value = CacheNames.EMPLOYEE, key = "#employeeId"),
    @CacheEvict(value = CacheNames.EMPLOYEE_PROFILE, key = "#employeeId"),
    @CacheEvict(value = CacheNames.DEPARTMENT, allEntries = true)
})
@Transactional
public void resign(UUID employeeId) {
    // 퇴사 처리 (여러 캐시 무효화)
}
```

---

## 7. CacheKeyGenerator

**소스**: `common/common-cache/src/.../CacheKeyGenerator.java`

### 테넌트 격리 보장

`CacheKeyGenerator`는 자동으로 `TenantContext`에서 테넌트 ID를 가져와 캐시 키에 포함합니다:

```java
// 테넌트 A의 직원 캐시: "employee:tenant-a-uuid:emp-001"
// 테넌트 B의 직원 캐시: "employee:tenant-b-uuid:emp-001"
// → 같은 employeeId라도 테넌트별 별도 캐시
```

### API

```java
// 테넌트 범위 (자동 tenantId 포함)
CacheKeyGenerator.generateKey("employee", "emp-001");
CacheKeyGenerator.generateKey("employee", tenantId, employeeId);

// 글로벌 범위 (tenantId 미포함)
CacheKeyGenerator.generateGlobalKey("config", "system-version");

// 사용자 범위
CacheKeyGenerator.generateUserKey(userId, "session", "data");
```

> **주의**: `@Cacheable`에서 `key` 속성을 사용할 때는 SpEL 표현식으로 직접 키를 지정합니다. `CacheKeyGenerator`는 프로그래밍 방식으로 캐시 키를 생성할 때 사용합니다.

---

## 8. 직렬화 설정

### 기본 직렬화

`CacheConfig`에서 Redis 값 직렬화를 설정합니다:

| 대상 | 직렬화기 | 비고 |
|------|---------|------|
| 키 | `StringRedisSerializer` | 문자열 키 |
| 값 | `GenericJackson2JsonRedisSerializer` | JSON 형태 |

### ObjectMapper 설정

```java
// CacheConfig.java의 ObjectMapper 설정
objectMapper.registerModule(new JavaTimeModule());  // Instant, LocalDate 지원
objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
objectMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
objectMapper.activateDefaultTyping(
    objectMapper.getPolymorphicTypeValidator(),
    ObjectMapper.DefaultTyping.NON_FINAL,
    JsonTypeInfo.As.PROPERTY
);
```

### 트랜잭션 인식

```java
// 트랜잭션 커밋 후에만 캐시 업데이트
cacheManager.setTransactionAware(true);
```

> `setTransactionAware(true)`는 트랜잭션 롤백 시 캐시 업데이트도 롤백되도록 보장합니다.

---

## 9. 서비스별 캐시 사용 현황

| 서비스 | 캐시 방식 | 캐시 이름 | TTL |
|--------|----------|----------|-----|
| auth-service | `RedisTemplate` 직접 | `token:blacklist`, `token:refresh`, `session` | 토큰 만료 시간 |
| tenant-service | `@Cacheable` | `tenant`, `tenant:policy`, `tenant:feature` | 1시간 |
| mdm-service | `@Cacheable` | `mdm:codeGroup`, `mdm:commonCode`, `mdm:tenantCode` | 24시간 |
| organization-service | `@Cacheable` | `department`, `organization:tree`, `position`, `grade` | 1시간 |
| employee-service | `@Cacheable` | `employee`, `employee:profile` | 15분 |
| attendance-service | `@Cacheable` | `attendance:holiday` | 기본 30분 |
| approval-service | `@Cacheable` | `approval:template` | 1시간 |
| appointment-service | `@Cacheable` | `appointment:draft` | 기본 30분 |
| certificate-service | `@Cacheable` | `certificate:type`, `certificate:template` | 기본 30분 |
| recruitment-service | `@Cacheable` | `recruitment:jobPosting` | 기본 30분 |

---

## 10. 캐시 무효화 패턴

### 기본 원칙

1. **CUD 작업 시 무효화**: 생성, 수정, 삭제 시 관련 캐시 제거
2. **연관 캐시 함께 무효화**: 직원 퇴사 시 직원 캐시 + 부서 캐시 등
3. **이벤트 기반 무효화**: 다른 서비스의 변경 이벤트 수신 시 로컬 캐시 무효화

### 이벤트 기반 크로스 서비스 무효화

```
employee-affiliation-changed 이벤트
  → organization-service가 수신
  → department 캐시, organization:tree 캐시 무효화
```

### 전체 무효화 (비상 시)

```bash
# Redis CLI로 특정 패턴 캐시 삭제
docker exec -it hr-saas-redis redis-cli -a redis_password \
  EVAL "for _,k in ipairs(redis.call('KEYS','employee:*')) do redis.call('DEL',k) end" 0

# 전체 캐시 삭제 (주의!)
docker exec -it hr-saas-redis redis-cli -a redis_password FLUSHALL
```

---

## 11. 수동 Redis 접근 (RedisTemplate)

auth-service의 토큰 관리처럼 Spring Cache 어노테이션으로 처리할 수 없는 경우 `RedisTemplate`을 직접 사용합니다:

### 토큰 블랙리스트

```java
// 로그아웃 시 토큰을 블랙리스트에 추가
redisTemplate.opsForValue().set(
    "token:blacklist:" + tokenHash,
    "1",
    remainingExpiry,
    TimeUnit.SECONDS
);

// 토큰 검증 시 블랙리스트 확인
boolean isBlacklisted = redisTemplate.hasKey("token:blacklist:" + tokenHash);
```

### 세션 관리

```java
// 세션 생성
redisTemplate.opsForValue().set(
    "session:" + accessToken,
    sessionData,
    24, TimeUnit.HOURS
);

// 사용자 세션 수 확인
Set<String> sessions = redisTemplate.keys("session:*:user:" + userId);
if (sessions.size() >= MAX_SESSIONS) {
    // 가장 오래된 세션 삭제
}
```

---

## 12. 성능 모니터링

### Redis 메트릭

```bash
# Redis 정보 확인
docker exec -it hr-saas-redis redis-cli -a redis_password INFO

# 메모리 사용량
docker exec -it hr-saas-redis redis-cli -a redis_password INFO memory

# 키 수 확인
docker exec -it hr-saas-redis redis-cli -a redis_password DBSIZE

# 슬로우 로그
docker exec -it hr-saas-redis redis-cli -a redis_password SLOWLOG GET 10
```

### Prometheus 메트릭

Spring Boot Actuator가 노출하는 Redis 관련 메트릭:

```
spring_data_redis_connections_active
spring_data_redis_connections_idle
lettuce_command_completion_seconds
```

---

## 13. 트러블슈팅

### 캐시 미스 (항상 DB 조회)

**원인 1**: `@Cacheable`이 self-invocation에서 작동하지 않음

```java
// ❌ 잘못된 예: 같은 클래스 내부 호출 → 캐시 미적용
public EmployeeResponse getEmployee(UUID id) {
    return this.getCachedEmployee(id);  // 프록시를 거치지 않음
}

@Cacheable(CacheNames.EMPLOYEE)
public EmployeeResponse getCachedEmployee(UUID id) { ... }
```

**해결**: 별도 빈으로 분리하거나, `@Lazy` 자기 참조 사용

**원인 2**: 직렬화/역직렬화 오류

```
SerializationException: Could not deserialize...
```

**해결**: `ObjectMapper`에 `JavaTimeModule` 등록 확인, `DefaultTyping` 설정 확인

### ClassCastException

**증상**: 캐시에서 값을 꺼낼 때 `ClassCastException` 발생

**원인**: `GenericJackson2JsonRedisSerializer`의 polymorphic typing 불일치

**해결**: 캐시 삭제 후 재구축, 또는 캐시 값 클래스의 패키지 경로 변경 여부 확인

### 메모리 부족 (OOM)

**증상**: Redis `maxmemory` 초과

**해결**:
1. TTL 미설정 캐시 확인 (`KEYS *` → `TTL {key}`)
2. 불필요한 캐시 제거
3. `maxmemory-policy` 설정 (권장: `allkeys-lru`)

---

## 14. 관련 문서

| 문서 | 설명 |
|------|------|
| [MULTI_TENANCY.md](./MULTI_TENANCY.md) | 캐시 키의 테넌트 격리 |
| [SECURITY_PATTERNS.md](./SECURITY_PATTERNS.md) | 토큰 블랙리스트, 세션 관리 |
| [DATABASE_PATTERNS.md](./DATABASE_PATTERNS.md) | 캐시 vs DB 접근 패턴 |
| [DOCKER_GUIDE.md](../operations/DOCKER_GUIDE.md) | Redis 로컬 설정 |
