# Module 01: Auth Service — 프로덕션 정책/설정 분석

> **분석 일자**: 2026-02-06
> **분석 범위**: `services/auth-service/`, `common/common-security/`

---

## 1. 현재 구현 상태 요약

### 1.1 구현 완료

| 기능 | 상태 | 위치 |
|------|------|------|
| 로그인 (username/password) | ✅ 완료 | `AuthServiceImpl.login()` |
| JWT 발급 (Access + Refresh) | ✅ 완료 | `JwtTokenProvider.generateAccessToken/RefreshToken()` |
| 토큰 갱신 (Refresh) | ✅ 완료 | `AuthServiceImpl.refreshToken()` |
| 로그아웃 (토큰 블랙리스트) | ✅ 완료 | `AuthServiceImpl.logout()` |
| 현재 사용자 정보 조회 | ✅ 완료 | `AuthServiceImpl.getCurrentUser()` |
| 비밀번호 변경 | ✅ 완료 | `PasswordServiceImpl.changePassword()` |
| 비밀번호 초기화 요청/확인 | ✅ 완료 | `PasswordServiceImpl.requestPasswordReset/confirmPasswordReset()` |
| 세션 관리 (생성/조회/종료) | ✅ 완료 | `SessionServiceImpl` |
| 계정 잠금 (5회 실패/30분) | ✅ 완료 | `AuthServiceImpl.login()` |
| 역할 계층 (7단계) | ✅ 완료 | `RoleHierarchyConfig` |
| 권한 매핑 (역할→권한) | ✅ 완료 | `PermissionMappingService` |
| 스코프 기반 권한 체크 | ✅ 완료 | `PermissionChecker` |
| JWT 필터 (모든 서비스 공통) | ✅ 완료 | `SecurityFilter` |
| 토큰 블랙리스트 (Redis) | ✅ 완료 | Redis `token:blacklist:` prefix |
| IP 주소 마스킹 (세션 응답) | ✅ 완료 | `SessionServiceImpl.maskIpAddress()` |
| 비밀번호 초기화 이벤트 발행 | ✅ 완료 | `PasswordResetRequestedEvent` → Notification |

### 1.2 미구현 / TODO

| 기능 | 상태 | 위치 | 구현 방향 |
|------|------|------|-----------|
| IP Geolocation | ❌ TODO | `SessionServiceImpl.resolveLocation()` | 외부 API 연동 또는 MaxMind GeoIP2 |
| 같은 부서 확인 | ❌ TODO | `PermissionChecker.isSameDepartment()` | Employee Service Feign 호출 |
| 같은 팀 확인 | ❌ TODO | `PermissionChecker.isSameTeam()` | Employee Service Feign 호출 |
| 로그인 이력 기록 | ❌ 스키마만 | `login_history` 테이블 존재, 코드 미연동 | 로그인 성공/실패 시 기록 |
| account_locks 테이블 연동 | ❌ 스키마만 | `account_locks` 테이블 존재, 코드는 UserEntity 내장 필드 사용 | UserEntity 필드로 충분, 테이블 제거 또는 연동 |
| 세션 생성 호출 연결 | ❌ 미연결 | 로그인 시 `SessionService.createSession()` 미호출 | `AuthServiceImpl.login()`에서 세션 생성 추가 |
| 비밀번호 복잡도 validation (서버측) | ⚠️ 부분 | DTO 검증만, 서비스 레벨 검증 없음 | 테넌트별 정책 적용 시 서비스 레벨 검증 필요 |
| 만료 세션 정리 스케줄러 | ❌ 미구현 | `UserSessionRepository.deleteExpiredSessions()` 존재, 스케줄러 없음 | `@Scheduled` 배치 작업 추가 |
| 비밀번호 만료 체크 | ❌ 미구현 | `password_changed_at` 필드 존재, 체크 로직 없음 | 로그인 시 만료 여부 확인, 강제 변경 유도 |
| 비밀번호 이력 관리 | ❌ 미구현 | 테이블/코드 없음 | `password_history` 테이블 + 재사용 방지 로직 |
| MFA (다중 인증) | ❌ 미구현 | 코드/스키마 없음 | TOTP 기반 구현, 테넌트별 ON/OFF |
| 테넌트별 비밀번호 정책 | ❌ 미구현 | 하드코딩된 정책 | Tenant Policy 연동 |
| Gateway Service 인증 | ❌ 미구현 | gateway-service 디렉토리 비어있음 | 설계 문서만 존재 (SDD_Gateway_Service.md) |
| 사용자 계정 CRUD (관리자용) | ❌ 미구현 | 컨트롤러/서비스 없음 | HR 관리자의 사용자 계정 생성/수정/비활성화 API |
| Refresh Token Rotation | ⚠️ 부분 | 갱신 시 새 토큰 발급하지만 이전 토큰 블랙리스트 미처리 | 이전 refresh token 블랙리스트 추가 |
| CORS 설정 (프로덕션) | ⚠️ 위험 | `addAllowedOriginPattern("*")` | 프로덕션 도메인으로 제한 필요 |
| username 글로벌 유니크 | ⚠️ 설계 검토 | `users.username UNIQUE` (전체 테넌트) | 테넌트별 유니크로 변경 필요 (같은 username이 다른 테넌트에 존재 가능해야 함) |

---

## 2. 정책 결정사항

### 2.1 비밀번호 정책 (결정 완료)

| 항목 | 결정 | 비고 |
|------|------|------|
| **정책 관리 수준** | 테넌트별 설정 가능 | 기본 최소 기준 이상으로만 강화 허용 |
| **시스템 최소 기준** | 8자 이상, 대문자+소문자+숫자+특수문자 각 1개 | 이 기준 아래로는 설정 불가 |
| **테넌트 설정 가능 항목** | 최소 길이 (8~20), 조합 규칙 (3종/4종), 만료 기간, 재사용 금지 개수 | `tenant_password_policy` 테이블 추가 |
| **비밀번호 만료** | 기본 90일 | 테넌트별 미사용/30/60/90일 설정 가능 |
| **재사용 금지** | 기본 5개 | 테넌트별 0~10 설정 가능 |
| **만료 알림** | 만료 7일 전 알림 | Notification Service 연동 |

#### 테넌트 비밀번호 정책 기본값
```yaml
password-policy:
  min-length: 8              # 최소 길이 (시스템 최소: 8)
  max-length: 100             # 최대 길이
  require-uppercase: true     # 대문자 필수
  require-lowercase: true     # 소문자 필수
  require-digit: true         # 숫자 필수
  require-special-char: true  # 특수문자 필수
  min-char-types: 4           # 최소 문자 종류 (시스템 최소: 3)
  expiry-days: 90             # 만료 기간 (0=미사용, 시스템 최소: 0)
  history-count: 5            # 재사용 금지 개수 (시스템 최소: 0)
  expiry-warning-days: 7      # 만료 경고 일수
```

### 2.2 계정 잠금 정책 (결정 완료)

| 항목 | 결정 | 비고 |
|------|------|------|
| 최대 실패 횟수 | 5회 | 현행 유지 |
| 잠금 시간 | 30분 | 현행 유지 |
| 잠금 해제 | 시간 경과 시 자동 해제 | 관리자 수동 해제도 필요 |

### 2.3 JWT 토큰 정책 (결정 완료)

| 항목 | 결정 | 비고 |
|------|------|------|
| Access Token 만료 | 1800초 (30분) | 현행 유지 |
| Refresh Token 만료 | 604800초 (7일) | 현행 유지 |
| 서명 알고리즘 | HMAC-SHA256 | 현행 유지 |
| Token Type | Bearer | 현행 유지 |

### 2.4 세션 정책 (결정 완료)

| 항목 | 결정 | 비고 |
|------|------|------|
| 최대 동시 세션 | 5개 | 현행 유지 |
| 초과 시 처리 | 가장 오래된 세션 자동 종료 | 현행 유지 |
| 세션 타임아웃 | 24시간 | 현행 유지 |

### 2.5 MFA 정책 (결정 완료)

| 항목 | 결정 | 비고 |
|------|------|------|
| MFA 방식 | TOTP (Google Authenticator 호환) | RFC 6238 |
| 정책 수준 | 테넌트별 선택 | 필수/선택/비활성화 3단계 |
| 기본값 | 비활성화 | 테넌트 관리자가 활성화 |

### 2.6 인증 시스템 (결정 완료)

| 항목 | 결정 | 비고 |
|------|------|------|
| 인증 방식 | 자체 JWT 인증 유지 | Keycloak 전환 안 함 |

---

## 3. 비즈니스 로직 사양

### 3.1 로그인 흐름

```
1. 클라이언트 → POST /api/v1/auth/login { username, password, tenantCode? }
2. UserRepository.findByUsername(username) → UserEntity
3. 계정 존재 여부 확인 (없으면 AUTH_001)
4. 계정 활성 상태 확인 (비활성 AUTH_008)
5. 계정 잠금 상태 확인 (잠금 AUTH_009)
6. BCrypt 비밀번호 검증 (실패 시 failedAttempts++ → 5회 시 잠금)
7. ★ [미구현] 비밀번호 만료 여부 확인 → 만료 시 강제 변경 유도 (AUTH_010)
8. ★ [미구현] MFA 활성화 시 MFA 챌린지 응답
9. 성공 시 failedAttempts 초기화, lastLoginAt 갱신
10. UserContext 빌드 → Access Token + Refresh Token 생성
11. Refresh Token Redis 저장 (TTL: 7일)
12. ★ [미구현] 세션 생성 (SessionService.createSession)
13. ★ [미구현] 로그인 이력 기록 (login_history 테이블)
14. TokenResponse 반환
```

### 3.2 토큰 갱신 흐름

```
1. 클라이언트 → POST /api/v1/auth/token/refresh { refreshToken }
2. 블랙리스트 확인 (Redis token:blacklist:{token})
3. JwtTokenProvider.isRefreshToken() 검증
4. userId 추출 → UserEntity 조회
5. 계정 활성 상태 확인
6. 새 Access Token + Refresh Token 생성
7. ★ [갭] 이전 Refresh Token 블랙리스트 미처리 → 구현 필요
8. 새 Refresh Token Redis 저장
9. TokenResponse 반환
```

### 3.3 로그아웃 흐름

```
1. 클라이언트 → POST /api/v1/auth/logout (Authorization 헤더)
2. Access Token 추출
3. Redis 블랙리스트에 추가 (TTL: Access Token 만료 시간)
4. ★ [미연결] 세션 비활성화 처리 필요
```

### 3.4 비밀번호 변경 흐름

```
1. 인증된 사용자 → POST /api/v1/auth/password/change { currentPassword, newPassword, confirmPassword }
2. DTO 검증: 8자 이상, 대소문자+숫자+특수문자
3. newPassword == confirmPassword 확인
4. 현재 비밀번호 BCrypt 검증
5. ★ [미구현] 테넌트별 비밀번호 정책 추가 검증
6. ★ [미구현] 비밀번호 이력 확인 (재사용 방지)
7. 새 비밀번호 BCrypt 인코딩 → 저장
8. passwordChangedAt 갱신
9. 모든 세션 종료 (SessionService.terminateAllSessions)
```

### 3.5 비밀번호 초기화 흐름

```
요청 단계:
1. POST /api/v1/auth/password/reset { username, email }
2. 기존 미사용 토큰 무효화
3. UUID 토큰 생성 (24시간 만료)
4. password_reset_tokens 저장
5. PasswordResetRequestedEvent 발행 → Notification Service

확인 단계:
1. POST /api/v1/auth/password/reset/confirm { token, newPassword, confirmPassword }
2. 토큰 유효성 검증 (존재 + 미사용 + 미만료)
3. 새 비밀번호 검증 (DTO + 정책)
4. 비밀번호 업데이트 + failedAttempts 초기화
5. 토큰 사용 처리
6. 모든 세션 종료
```

### 3.6 세션 관리 흐름

```
세션 생성:
1. 활성 세션 수 확인 (max 5)
2. 초과 시 가장 오래된 세션 비활성화
3. 새 세션 DB 저장 + Redis 캐시

세션 조회:
1. GET /api/v1/auth/sessions
2. 활성 세션 목록 반환 (IP 마스킹 적용)
3. 현재 세션 표시 (currentSession: true)

세션 종료:
1. DELETE /api/v1/auth/sessions/{sessionId} — 특정 세션
2. DELETE /api/v1/auth/sessions — 전체 세션
3. DELETE /api/v1/auth/sessions/others — 현재 제외 전체
4. 블랙리스트에 session + refresh token 추가
```

---

## 4. 설정값 목록

### 4.1 application.yml 설정

```yaml
server:
  port: 8081

spring:
  application:
    name: auth-service

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/hr_saas
    username: ${DB_USERNAME:hr_saas}
    password: ${DB_PASSWORD:hr_saas_password}

  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: tenant_common    # Auth 테이블은 tenant_common 스키마

  flyway:
    enabled: true
    locations: classpath:db/migration
    schemas: tenant_common

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6381}
      password: ${REDIS_PASSWORD:redis_password}

jwt:
  secret: ${JWT_SECRET:hr-saas-secret-key-for-jwt-token-signing-minimum-256-bits-required}
  access-token-expiry: 1800       # 30분
  refresh-token-expiry: 604800    # 7일
```

### 4.2 환경변수 (프로덕션)

| 변수 | 설명 | 필수 | 기본값 |
|------|------|------|--------|
| `DB_HOST` | PostgreSQL 호스트 | ✅ | localhost |
| `DB_PORT` | PostgreSQL 포트 | ❌ | 5433 (로컬), 5432 (AWS) |
| `DB_USERNAME` | DB 사용자 | ✅ | hr_saas |
| `DB_PASSWORD` | DB 비밀번호 | ✅ | hr_saas_password |
| `REDIS_HOST` | Redis 호스트 | ✅ | localhost |
| `REDIS_PORT` | Redis 포트 | ❌ | 6381 (로컬), 6379 (AWS) |
| `REDIS_PASSWORD` | Redis 비밀번호 | ✅ | redis_password |
| `JWT_SECRET` | JWT 서명 키 (256bit 이상) | ✅ | 개발용 기본값 |
| `AWS_REGION` | AWS 리전 | ❌ | ap-northeast-2 |
| `AWS_SNS_ENDPOINT` | SNS 엔드포인트 | ❌ | LocalStack |
| `AWS_SQS_ENDPOINT` | SQS 엔드포인트 | ❌ | LocalStack |

### 4.3 하드코딩된 상수 (설정 외부화 필요)

| 상수 | 현재값 | 위치 | 비고 |
|------|--------|------|------|
| `MAX_FAILED_ATTEMPTS` | 5 | `AuthServiceImpl` | 설정으로 이동 필요 |
| `LOCK_DURATION_MINUTES` | 30 | `AuthServiceImpl` | 설정으로 이동 필요 |
| `maxSessions` | 5 | `SessionServiceImpl` | `auth.session.max-sessions`로 설정화 완료 |
| `sessionTimeoutHours` | 24 | `SessionServiceImpl` | `auth.session.timeout-hours`로 설정화 완료 |
| 비밀번호 복잡도 규칙 | regex | DTO `@Pattern` | 테넌트별 정책 적용 시 서비스 레벨로 이동 |
| 비밀번호 초기화 토큰 만료 | 24시간 | `PasswordResetToken` | 설정으로 이동 필요 |
| 블랙리스트 토큰 TTL | 24시간 | `SessionServiceImpl` | Access Token 만료 시간과 동기화 필요 |

### 4.4 Redis 키 패턴

| 패턴 | 용도 | TTL |
|------|------|-----|
| `token:blacklist:{token}` | 무효화된 토큰 | Access: 1800s, Session: 24h |
| `token:refresh:{userId}` | Refresh Token 저장 | 604800s (7일) |
| `session:{accessToken}` | 세션 캐시 | 24시간 |

---

## 5. 갭 구현 사양

### 5.1 [HIGH] 로그인 시 세션 생성 연결

**현재 상태**: `AuthServiceImpl.login()`에서 토큰만 발급, `SessionService.createSession()` 미호출

**구현 사양**:
```java
// AuthServiceImpl.login() 마지막에 추가
// request에서 IP, User-Agent 정보를 HttpServletRequest로 받아야 함
// 또는 Controller에서 추출하여 전달
sessionService.createSession(
    user.getId().toString(),
    user.getTenantId(),
    accessToken,
    refreshToken,
    extractDeviceInfo(userAgent),
    ipAddress,
    userAgent
);
```

**변경 필요 파일**:
- `AuthController.java` — HttpServletRequest 파라미터 추가
- `AuthService.java` — login 메서드 시그니처 변경 또는 오버로드
- `AuthServiceImpl.java` — SessionService 호출 추가

### 5.2 [HIGH] Refresh Token Rotation 완성

**현재 상태**: 갱신 시 새 토큰 발급하지만 이전 토큰 블랙리스트 미처리

**구현 사양**:
```java
// AuthServiceImpl.refreshToken()에서
// 1. 이전 refresh token 블랙리스트 추가
String oldBlacklistKey = BLACKLIST_PREFIX + refreshToken;
redisTemplate.opsForValue().set(oldBlacklistKey, "1",
    jwtTokenProvider.getRefreshTokenExpiry(), TimeUnit.SECONDS);
```

### 5.3 [HIGH] 로그인 이력 기록

**현재 상태**: `login_history` 테이블 존재, 엔티티/리포지토리/서비스 코드 없음

**구현 사양**:
- 새 엔티티 `LoginHistory` 생성
- 로그인 성공/실패 시 기록: userId, tenantId, loginType, status(SUCCESS/FAILED), ipAddress, userAgent, failureReason
- 비동기 처리 가능 (`@Async` 또는 이벤트)

### 5.4 [HIGH] 비밀번호 만료 체크

**현재 상태**: `password_changed_at` 필드 존재, 로그인 시 체크 로직 없음

**구현 사양**:
```
로그인 성공 후:
1. 테넌트 비밀번호 정책에서 expiry_days 조회
2. password_changed_at + expiry_days < now → 만료
3. 만료 시: 로그인은 허용하되 응답에 passwordExpired: true 플래그 추가
4. 프론트에서 비밀번호 변경 화면으로 리다이렉트
5. 만료 7일 전 알림 (Notification Service)
```

**TokenResponse 변경**:
```java
private boolean passwordExpired;
private Integer passwordExpiresInDays;  // 만료까지 남은 일수
```

### 5.5 [HIGH] 테넌트별 비밀번호 정책

**현재 상태**: DTO `@Pattern` 어노테이션으로 하드코딩

**구현 사양**:
- Tenant Service에서 비밀번호 정책 조회 (Feign Client)
- 정책 항목: minLength, maxLength, requireUppercase, requireLowercase, requireDigit, requireSpecialChar, minCharTypes, expiryDays, historyCount
- 시스템 최소 기준 하회 불가 (최소 8자, 3종 이상 조합)
- 비밀번호 변경/초기화 시 서비스 레벨에서 정책 검증
- 캐싱: Redis에 `tenant:password-policy:{tenantId}` (TTL 1시간)

**새 구조**:
```java
public class PasswordPolicyDto {
    private int minLength = 8;         // 시스템 최소 8
    private int maxLength = 100;
    private boolean requireUppercase = true;
    private boolean requireLowercase = true;
    private boolean requireDigit = true;
    private boolean requireSpecialChar = true;
    private int minCharTypes = 4;      // 시스템 최소 3
    private int expiryDays = 90;       // 0 = 미사용
    private int historyCount = 5;      // 0 = 미사용
}
```

### 5.6 [MEDIUM] 비밀번호 이력 관리

**현재 상태**: 테이블/코드 없음

**구현 사양**:
```sql
CREATE TABLE tenant_common.password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tenant_common.users(id),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_password_history_user_id ON tenant_common.password_history(user_id);
```

- 비밀번호 변경 시 이전 해시 저장
- 변경 시 최근 N개 (정책의 historyCount) 비교
- BCrypt 해시 비교로 재사용 판단

### 5.7 [MEDIUM] MFA (다중 인증)

**현재 상태**: 코드/스키마 없음

**구현 사양**:
```sql
CREATE TABLE tenant_common.user_mfa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES tenant_common.users(id),
    mfa_type VARCHAR(20) NOT NULL DEFAULT 'TOTP',   -- TOTP, SMS, EMAIL
    secret_key VARCHAR(255) NOT NULL,                 -- 암호화 저장
    is_enabled BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mfa_type)
);
```

**로그인 흐름 변경**:
```
1. 비밀번호 검증 성공 후
2. 테넌트 MFA 정책 확인 (필수/선택/비활성화)
3. 사용자 MFA 활성화 여부 확인
4. MFA 필요 시: 임시 토큰 발급 + MFA 챌린지 응답 요구
   → POST /api/v1/auth/mfa/verify { mfaToken, code }
5. MFA 검증 성공 → 정상 Access/Refresh 토큰 발급
```

**MFA 관리 API**:
- `POST /api/v1/auth/mfa/setup` — QR 코드 생성 (secret 발급)
- `POST /api/v1/auth/mfa/verify-setup` — 설정 검증 (첫 코드 확인)
- `POST /api/v1/auth/mfa/disable` — MFA 비활성화
- `GET /api/v1/auth/mfa/status` — MFA 상태 조회
- `POST /api/v1/auth/mfa/recovery-codes` — 복구 코드 생성

### 5.8 [MEDIUM] 부서/팀 기반 권한 체크 구현

**현재 상태**: `PermissionChecker.isSameDepartment()`와 `isSameTeam()`이 항상 `true` 반환

**구현 사양**:
- Employee Service에 Feign Client 추가
- `GET /api/v1/employees/{employeeId}/affiliation` → { departmentId, teamId }
- Redis 캐시: `employee:affiliation:{employeeId}` (TTL: 5분)
- 현재 사용자의 departmentId/teamId와 비교

### 5.9 [MEDIUM] 만료 세션 정리 스케줄러

**현재 상태**: Repository 메서드 존재, 스케줄러 없음

**구현 사양**:
```java
@Scheduled(fixedRate = 3600000)  // 1시간마다
public void cleanupExpiredSessions() {
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime cleanupTime = now.minusDays(7);  // 비활성 세션 7일 후 삭제
    int deleted = sessionRepository.deleteExpiredSessions(now, cleanupTime);
    log.info("Cleaned up {} expired sessions", deleted);
}
```

### 5.10 [MEDIUM] username 테넌트별 유니크 전환

**현재 상태**: `users.username`이 전체 시스템에서 UNIQUE

**문제**: 다른 테넌트의 사용자가 같은 username을 사용할 수 없음

**구현 사양**:
```sql
-- 기존
ALTER TABLE tenant_common.users DROP CONSTRAINT users_username_key;
-- 새 유니크 제약
ALTER TABLE tenant_common.users ADD CONSTRAINT uq_users_tenant_username UNIQUE(tenant_id, username);
```

- `findByUsername(username)` → `findByUsernameAndTenantId(username, tenantId)` 변경
- 로그인 시 tenantCode로 tenantId 해석 필요 (Tenant Service 연동)
- LoginRequest에 tenantCode 필드 이미 존재하나 미활용

### 5.11 [LOW] IP Geolocation 구현

**현재 상태**: `resolveLocation()` → "Unknown" 반환

**구현 사양**:
- MaxMind GeoIP2 Lite (무료) 또는 외부 API
- 국가 + 도시 수준 정보
- 오프라인 DB 방식 권장 (latency 최소화)

### 5.12 [LOW] CORS 프로덕션 설정

**현재 상태**: `addAllowedOriginPattern("*")` — 모든 도메인 허용

**구현 사양**:
```yaml
cors:
  allowed-origins:
    - ${CORS_ORIGIN:http://localhost:5173}   # 개발
    - https://hr.example.com                 # 프로덕션
```

### 5.13 [LOW] account_locks 테이블 정리

**현재 상태**: DDL에 `account_locks` 테이블 존재하지만, 실제 잠금은 `users.failed_login_attempts`와 `users.locked_until` 필드로 처리

**결정**: `account_locks` 테이블 제거 (불필요한 중복)

---

## 6. 테스트 시나리오

### 6.1 단위 테스트 (기존 + 추가 필요)

#### AuthServiceImpl 테스트
| # | 시나리오 | 상태 |
|---|---------|------|
| 1 | 정상 로그인 → 토큰 발급 | ✅ 기존 |
| 2 | 존재하지 않는 사용자 → AUTH_001 | ✅ 기존 |
| 3 | 비활성 계정 → AUTH_008 | ✅ 기존 |
| 4 | 잠긴 계정 → AUTH_009 | ✅ 기존 |
| 5 | 잘못된 비밀번호 → failedAttempts 증가 | ✅ 기존 |
| 6 | 5회 실패 → 계정 잠금 | ✅ 기존 |
| 7 | 정상 토큰 갱신 | ✅ 기존 |
| 8 | 블랙리스트 토큰 → AUTH_002 | ✅ 기존 |
| 9 | 유효하지 않은 리프레시 토큰 | ✅ 기존 |
| 10 | 로그아웃 → 토큰 블랙리스트 추가 | ✅ 기존 |
| 11 | 로그인 시 세션 생성 | ❌ 추가 필요 |
| 12 | 로그인 시 이력 기록 | ❌ 추가 필요 |
| 13 | 비밀번호 만료 시 플래그 반환 | ❌ 추가 필요 |
| 14 | Refresh Token Rotation (이전 토큰 무효화) | ❌ 추가 필요 |
| 15 | tenantCode로 테넌트 해석 후 로그인 | ❌ 추가 필요 |

#### PasswordServiceImpl 테스트
| # | 시나리오 | 상태 |
|---|---------|------|
| 1 | 정상 비밀번호 변경 | ✅ 기존 |
| 2 | 현재 비밀번호 불일치 | ✅ 기존 |
| 3 | 새 비밀번호 확인 불일치 | ✅ 기존 |
| 4 | 비밀번호 초기화 요청 → 토큰 생성 + 이벤트 발행 | ✅ 기존 |
| 5 | 비밀번호 초기화 확인 → 비밀번호 변경 | ✅ 기존 |
| 6 | 만료된 토큰 → AUTH_007 | ✅ 기존 |
| 7 | 이미 사용된 토큰 → AUTH_007 | ✅ 기존 |
| 8 | 테넌트별 비밀번호 정책 검증 | ❌ 추가 필요 |
| 9 | 비밀번호 이력 검사 (재사용 방지) | ❌ 추가 필요 |
| 10 | 시스템 최소 기준 하회 불가 | ❌ 추가 필요 |

#### SessionServiceImpl 테스트
| # | 시나리오 | 상태 |
|---|---------|------|
| 1 | 세션 생성 | ✅ 기존 |
| 2 | 최대 세션 초과 → 가장 오래된 세션 종료 | ✅ 기존 |
| 3 | 활성 세션 조회 (IP 마스킹 확인) | ✅ 기존 |
| 4 | 특정 세션 종료 | ✅ 기존 |
| 5 | 전체 세션 종료 | ✅ 기존 |
| 6 | 다른 세션 종료 (현재 유지) | ✅ 기존 |
| 7 | 세션 유효성 검증 (Redis → DB fallback) | ✅ 기존 |

#### PermissionChecker 테스트
| # | 시나리오 | 상태 |
|---|---------|------|
| 1 | 역할 확인 (hasRole) | ✅ 기존 |
| 2 | 권한 확인 (와일드카드 매칭) | ✅ 기존 |
| 3 | 상위 역할 판단 (isHrManager 등) | ✅ 기존 |
| 4 | 직원 접근 권한 (canAccessEmployee) | ✅ 기존 |
| 5 | 같은 부서 확인 (실제 Employee 조회) | ❌ 추가 필요 |
| 6 | 같은 팀 확인 (실제 Employee 조회) | ❌ 추가 필요 |

### 6.2 통합 테스트 (추가 필요)

| # | 시나리오 | 상태 |
|---|---------|------|
| 1 | 전체 로그인 → 토큰 → API 호출 → 로그아웃 플로우 | ❌ 추가 필요 |
| 2 | 비밀번호 초기화 전체 플로우 (요청→이메일→확인) | ❌ 추가 필요 |
| 3 | 세션 제한 도달 → 자동 종료 → 새 세션 생성 | ❌ 추가 필요 |
| 4 | 계정 잠금 → 30분 후 자동 해제 → 로그인 성공 | ❌ 추가 필요 |
| 5 | Refresh Token Rotation 전체 플로우 | ❌ 추가 필요 |
| 6 | 테넌트별 비밀번호 정책 적용 플로우 | ❌ 추가 필요 |
| 7 | MFA 설정 → 로그인 → MFA 검증 전체 플로우 | ❌ 추가 필요 |

---

## 7. 의존성

### 7.1 Auth Service가 의존하는 모듈

| 의존 대상 | 용도 | 현재 상태 |
|-----------|------|-----------|
| `common-core` | 예외 처리 (BusinessException, ForbiddenException) | ✅ 연동 |
| `common-entity` | 기본 엔티티 (사용 안 함 — 자체 엔티티 사용) | ⚠️ 의존성 있으나 미사용 |
| `common-response` | ApiResponse 래퍼 | ✅ 연동 |
| `common-database` | Flyway 설정 | ✅ 연동 |
| `common-tenant` | TenantContext | ✅ 연동 |
| `common-security` | JwtTokenProvider, SecurityFilter, PermissionChecker | ✅ 연동 |
| `common-cache` | Redis 설정 | ✅ 연동 |
| `common-event` | DomainEvent, EventPublisher | ✅ 연동 |
| **Tenant Service** | 테넌트별 비밀번호 정책, tenantCode→tenantId 해석 | ❌ **미연동** (Feign 필요) |
| **Employee Service** | 부서/팀 정보 조회 (PermissionChecker용) | ❌ **미연동** (Feign 필요) |
| **Notification Service** | 비밀번호 초기화 이메일, 만료 알림 | ✅ 이벤트 발행 연동 |

### 7.2 Auth Service를 의존하는 모듈

| 의존 주체 | 용도 |
|-----------|------|
| 모든 서비스 | `common-security` 의존 (SecurityFilter, JWT 검증) |
| Gateway Service | JWT 검증 + 라우팅 (미구현) |
| 프론트엔드 | 로그인/토큰 갱신/로그아웃 API 호출 |

### 7.3 이벤트 발행

| 이벤트 | 토픽 | 소비자 |
|--------|------|--------|
| `PasswordResetRequestedEvent` | `hr-saas.notification.send` | Notification Service |
| ★ [미구현] `LoginSuccessEvent` | `hr-saas.auth.login-success` | Audit, Notification |
| ★ [미구현] `LoginFailedEvent` | `hr-saas.auth.login-failed` | Audit, Security |
| ★ [미구현] `AccountLockedEvent` | `hr-saas.auth.account-locked` | Notification, Admin |
| ★ [미구현] `PasswordExpiredEvent` | `hr-saas.auth.password-expired` | Notification |

---

## 8. API 엔드포인트 요약

### 현재 구현

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/api/v1/auth/login` | ❌ 공개 | 로그인 |
| `POST` | `/api/v1/auth/token/refresh` | ❌ 공개 | 토큰 갱신 |
| `POST` | `/api/v1/auth/logout` | ✅ | 로그아웃 |
| `GET` | `/api/v1/auth/me` | ✅ | 현재 사용자 정보 |
| `POST` | `/api/v1/auth/password/change` | ✅ | 비밀번호 변경 |
| `POST` | `/api/v1/auth/password/reset` | ❌ 공개 | 비밀번호 초기화 요청 |
| `POST` | `/api/v1/auth/password/reset/confirm` | ❌ 공개 | 비밀번호 초기화 확인 |
| `GET` | `/api/v1/auth/sessions` | ✅ | 활성 세션 조회 |
| `DELETE` | `/api/v1/auth/sessions/{sessionId}` | ✅ | 특정 세션 종료 |
| `DELETE` | `/api/v1/auth/sessions` | ✅ | 전체 세션 종료 |
| `DELETE` | `/api/v1/auth/sessions/others` | ✅ | 다른 세션 종료 |

### 추가 필요 (MFA)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/api/v1/auth/mfa/setup` | ✅ | MFA 설정 시작 (QR 생성) |
| `POST` | `/api/v1/auth/mfa/verify-setup` | ✅ | MFA 설정 확인 |
| `POST` | `/api/v1/auth/mfa/verify` | ⚠️ 임시토큰 | 로그인 시 MFA 검증 |
| `POST` | `/api/v1/auth/mfa/disable` | ✅ | MFA 비활성화 |
| `GET` | `/api/v1/auth/mfa/status` | ✅ | MFA 상태 조회 |
| `POST` | `/api/v1/auth/mfa/recovery-codes` | ✅ | 복구 코드 생성 |

### 추가 필요 (사용자 관리 — 관리자용)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| `POST` | `/api/v1/auth/users` | ✅ HR_MANAGER+ | 사용자 계정 생성 |
| `GET` | `/api/v1/auth/users` | ✅ HR_MANAGER+ | 사용자 목록 조회 |
| `GET` | `/api/v1/auth/users/{userId}` | ✅ HR_MANAGER+ | 사용자 상세 조회 |
| `PUT` | `/api/v1/auth/users/{userId}/status` | ✅ TENANT_ADMIN+ | 계정 활성/비활성 |
| `PUT` | `/api/v1/auth/users/{userId}/roles` | ✅ TENANT_ADMIN+ | 역할 변경 |
| `POST` | `/api/v1/auth/users/{userId}/unlock` | ✅ HR_MANAGER+ | 계정 잠금 해제 |
| `POST` | `/api/v1/auth/users/{userId}/reset-password` | ✅ HR_MANAGER+ | 관리자 비밀번호 초기화 |

---

## 9. 에러 코드 정리

| 코드 | HTTP | 메시지 | 비고 |
|------|------|--------|------|
| `AUTH_001` | 401 | 아이디 또는 비밀번호가 올바르지 않습니다 | 로그인 실패 |
| `AUTH_002` | 401 | 토큰 관련 오류 | 토큰 만료/무효/갱신 실패 |
| `AUTH_003` | 400/401 | 비밀번호 불일치 / 인증 정보 없음 | 코드 중복 사용 — 정리 필요 |
| `AUTH_004` | 400/403 | 사용자 없음 / 권한 부족 | 코드 중복 사용 — 정리 필요 |
| `AUTH_006` | 400 | 유효하지 않은 토큰 | 비밀번호 초기화 토큰 |
| `AUTH_007` | 400 | 만료/사용된 토큰 | 비밀번호 초기화 토큰 |
| `AUTH_008` | 401/404 | 비활성 계정 / 세션 없음 | 코드 중복 사용 — 정리 필요 |
| `AUTH_009` | 401 | 계정 잠김 | |

**개선 필요**: 에러 코드 중복 해소 (AUTH_003, AUTH_004, AUTH_008)

---

## 10. 데이터베이스 스키마

### 현재 테이블 (tenant_common 스키마)

```
tenant_common.users                 — 사용자 계정 (✅ 사용 중)
tenant_common.user_sessions         — 활성 세션 (✅ 사용 중)
tenant_common.password_reset_tokens — 초기화 토큰 (✅ 사용 중)
tenant_common.login_history         — 로그인 이력 (⚠️ DDL만, 코드 미연동)
tenant_common.account_locks         — 계정 잠금 (⚠️ DDL만, 코드 미연동, 삭제 고려)
```

### 추가 필요 테이블

```
tenant_common.password_history      — 비밀번호 이력 (재사용 방지)
tenant_common.user_mfa              — MFA 설정 (TOTP secret 등)
tenant_common.mfa_recovery_codes    — MFA 복구 코드
```

### RLS 참고

Auth 테이블은 RLS 미적용 (서비스 레벨에서 tenant_id 필터링). 이유: 인증 과정에서 tenant_id가 확정되기 전에 조회가 필요하므로.

---

## 11. 구현 우선순위 요약

| 순위 | 항목 | 복잡도 | 의존성 |
|------|------|--------|--------|
| 1 | 로그인 시 세션 생성 연결 | 낮음 | 없음 |
| 2 | Refresh Token Rotation 완성 | 낮음 | 없음 |
| 3 | username 테넌트별 유니크 전환 | 중간 | Tenant Service |
| 4 | 로그인 이력 기록 | 중간 | 없음 |
| 5 | 비밀번호 만료 체크 | 중간 | Tenant Service |
| 6 | 테넌트별 비밀번호 정책 | 높음 | Tenant Service |
| 7 | 비밀번호 이력 관리 | 중간 | 없음 |
| 8 | 사용자 관리 CRUD (관리자용) | 높음 | 없음 |
| 9 | 부서/팀 기반 권한 체크 | 중간 | Employee Service |
| 10 | MFA (TOTP) | 높음 | 없음 |
| 11 | 만료 세션 정리 스케줄러 | 낮음 | 없음 |
| 12 | CORS 프로덕션 설정 | 낮음 | 없음 |
| 13 | IP Geolocation | 낮음 | 외부 라이브러리 |
| 14 | 에러 코드 정리 | 낮음 | 없음 |
| 15 | account_locks 테이블 제거 | 낮음 | 없음 |

---

## 13. 감사 로그 (Audit Log) — 추가 모듈

> 추가 분석일: 2026-02-06
> BE 귀속: Auth Service (감사 로그 저장/조회 API) + common-audit (이벤트 발행 AOP)
> BE 상태: **미구현** (FE만 존재)
> 보존 기간: **5년** (개인정보보호법 기준)

### 13.1 현재 구현 상태

| 구분 | 상태 | 설명 |
|------|------|------|
| FE 목록 페이지 | ✅ 완료 | AuditLogPage — 필터(keyword/action/result), 페이지네이션, CSV/Excel 내보내기, 상세 다이얼로그 |
| FE 필터 컴포넌트 | ✅ 완료 | AuditFilter — 기본+고급 검색 (키워드, 액션, 결과, 대상유형, 기간, 사용자ID), 활성필터 태그 |
| FE 타임라인 | ✅ 완료 | AuditTimeline — 날짜별 그룹핑, 액션별 아이콘/색상, 클릭 가능 |
| FE 상세 뷰 | ✅ 완료 | AuditDetail — 일시, 사용자, IP, 액션, 대상, 오류, 상세(JSON), 요청정보, 복사 기능 |
| FE hooks/service | ✅ 완료 | useAuditLogs, useAuditLogDetail + exportAuditLogs (Blob 다운로드) |
| FE mock | ✅ 완료 | 10건 샘플 (LOGIN, UPDATE, CREATE, DELETE, APPROVE, EXPORT, LOGOUT 등) |
| shared-types | ✅ 완료 | AuditLog, AuditAction(12종), AuditResult, AuditTargetType 타입 정의 |
| BE 엔티티/API | ❌ 미구현 | 전체 신규 개발 필요 |

### 13.2 아키텍처 결정 ✅ 결정완료

> **결정: 공통 모듈(AOP) + Auth Service(저장/조회)**

Traefik 액세스 로그만으로는 비즈니스 레벨 감사 불가 (누가 어떤 직원 정보를 수정했는지 등 추적 불가).

```
[각 서비스]                        [Auth Service]
┌─────────────────┐               ┌─────────────────┐
│ common-audit    │               │ audit_logs 테이블│
│ @Audited AOP    │──SNS/SQS──→  │ AuditLogListener│
│ 이벤트 자동 발행 │               │ AuditLogService │
└─────────────────┘               │ AuditLogAPI     │
                                  └─────────────────┘
[Traefik]
┌─────────────────┐
│ Access Log      │──→ ELK/CloudWatch (HTTP 레벨 보조 로그)
└─────────────────┘
```

- **1계층 (Traefik)**: HTTP 액세스 로그 — 모든 요청의 method/URL/status/IP 기록 (ELK 또는 CloudWatch)
- **2계층 (common-audit)**: 비즈니스 감사 로그 — Spring AOP `@Audited` 어노테이션으로 컨트롤러 메서드 자동 인터셉트, SNS 이벤트 발행
- **3계층 (Auth Service)**: 감사 로그 저장/조회 API — SQS로 이벤트 수신, DB 저장, 조회/내보내기 API 제공

### 13.3 BE 구현 사양

#### 13.3.1 common-audit 모듈 (신규)

**위치**: `common/common-audit/`

```java
// 1. @Audited 어노테이션
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
    AuditAction action();
    String targetType() default "";  // 자동 추론 가능
    String description() default "";
}

// 2. AuditAspect (Spring AOP)
@Aspect @Component
public class AuditAspect {
    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint pjp, Audited audited) {
        // Before: 요청 정보 수집 (userId, IP, targetId 등)
        Object result = pjp.proceed();
        // After: AuditEvent 발행 (SNS)
        // 실패 시: errorMessage 포함
    }
}

// 3. AuditEvent 도메인 이벤트
public record AuditEvent(
    String tenantId, String userId, String userName, String userEmail,
    String ipAddress, String userAgent,
    AuditAction action, String targetType, String targetId, String targetName,
    AuditResult result, String errorMessage,
    Map<String, Object> details,
    String requestMethod, String requestUrl,
    Instant timestamp
) {}
```

**사용 예시** (각 서비스 컨트롤러):
```java
@Audited(action = AuditAction.UPDATE, targetType = "EMPLOYEE")
@PutMapping("/{id}")
public ApiResponse<EmployeeResponse> update(@PathVariable UUID id, ...) { ... }
```

#### 13.3.2 Auth Service 감사 로그 테이블

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(100),
    user_email VARCHAR(200),
    ip_address VARCHAR(45),
    user_agent TEXT,
    action VARCHAR(30) NOT NULL,       -- LOGIN, CREATE, UPDATE, DELETE, ...
    target_type VARCHAR(50),            -- USER, EMPLOYEE, APPROVAL, ...
    target_id VARCHAR(100),
    target_name VARCHAR(200),
    result VARCHAR(10) NOT NULL,        -- SUCCESS, FAILURE
    error_message TEXT,
    details JSONB,                      -- 변경 필드, 브라우저 정보 등
    request_method VARCHAR(10),         -- GET, POST, PUT, DELETE
    request_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- 파티셔닝 키
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 월별 파티션 (5년치)
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- ... (자동 파티션 생성 스케줄러 필요)

-- 인덱스
CREATE INDEX idx_audit_tenant_created ON audit_logs (tenant_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs (action, created_at DESC);
CREATE INDEX idx_audit_target ON audit_logs (target_type, target_id);
```

**RLS 적용**: tenant_id 기반 (다른 테넌트 감사 로그 접근 차단)

#### 13.3.3 API 엔드포인트

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/v1/audit/logs` | HR_ADMIN+ | 목록 조회 (keyword, action, result, targetType, startDate, endDate, userId 필터) |
| GET | `/api/v1/audit/logs/{id}` | HR_ADMIN+ | 상세 조회 |
| GET | `/api/v1/audit/logs/export` | HR_ADMIN+ | CSV/Excel 내보내기 (Blob 반환) |
| GET | `/api/v1/audit/logs/statistics` | TENANT_ADMIN+ | 통계 (액션별, 기간별 집계) |

### 13.4 감사 대상 액션/타입

#### 13.4.1 AuditAction (12종)

| 액션 | 설명 | 자동/수동 |
|------|------|----------|
| LOGIN | 로그인 | Auth Service 자체 기록 |
| LOGOUT | 로그아웃 | Auth Service 자체 기록 |
| CREATE | 리소스 생성 | @Audited AOP |
| READ | 민감 정보 조회 | @Audited AOP (선별적) |
| UPDATE | 리소스 수정 | @Audited AOP |
| DELETE | 리소스 삭제 | @Audited AOP |
| EXPORT | 데이터 내보내기 | @Audited AOP |
| IMPORT | 데이터 가져오기 | @Audited AOP |
| APPROVE | 결재 승인 | @Audited AOP |
| REJECT | 결재 반려 | @Audited AOP |
| PASSWORD_CHANGE | 비밀번호 변경 | Auth Service 자체 기록 |
| PERMISSION_CHANGE | 권한 변경 | @Audited AOP |

#### 13.4.2 AuditTargetType (FE 기준 7종+)

| 대상 유형 | 서비스 | 예시 |
|-----------|--------|------|
| USER | Auth | 로그인, 비밀번호 변경 |
| EMPLOYEE | Employee | 직원 정보 CRUD |
| APPROVAL | Approval | 결재 생성/승인/반려 |
| DOCUMENT | File | 파일 업로드/삭제 |
| ORGANIZATION | Organization | 부서 변경, 공지사항 |
| ATTENDANCE | Attendance | 출결, 휴가 신청 |
| APPOINTMENT | Appointment | 발령 시행 |
| CERTIFICATE | Certificate | 증명서 발급 |
| RECRUITMENT | Recruitment | 채용 공고, 오퍼 |
| TENANT | Tenant | 테넌트 설정 변경 |

### 13.5 설정값

| 설정 | 값 | 사유 |
|------|-----|------|
| `audit.retention-years` | 5 | 개인정보보호법 기준 |
| `audit.partition.auto-create` | true | 월별 파티션 자동 생성 |
| `audit.export.max-rows` | 100000 | 내보내기 최대 건수 |
| `audit.sensitive-actions` | READ | READ 액션 기록 대상 (민감 정보만 선별) |
| SNS 토픽 | `hr-saas.audit.event` | 감사 이벤트 발행 토픽 |
| SQS 큐 | `auth-service-audit-queue` | Auth Service 수신 큐 |

### 13.6 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 로그인 성공 | LOGIN + SUCCESS 로그 기록 |
| 2 | 로그인 실패 (비밀번호 불일치) | LOGIN + FAILURE + errorMessage 기록 |
| 3 | 직원 정보 수정 (@Audited) | UPDATE + EMPLOYEE + 변경 필드 details |
| 4 | 데이터 내보내기 | EXPORT + recordCount/format details |
| 5 | 키워드 검색 | userName, targetName, ipAddress 매칭 |
| 6 | 액션별 필터 | 해당 액션 로그만 반환 |
| 7 | CSV 내보내기 | Blob 반환, 헤더 올바름 |
| 8 | 5년 초과 로그 | 자동 파티션 드롭 또는 아카이브 |

### 13.7 FE 컴포넌트 현황

| 컴포넌트 | 상태 | 설명 |
|----------|------|------|
| AuditLogPage | ✅ 완료 | 목록 테이블 + 모바일 카드 뷰, 필터, 내보내기, 상세 다이얼로그 |
| AuditFilter | ✅ 완료 | 기본(keyword/action/result) + 고급(targetType/기간/userId) 검색 |
| AuditTimeline | ✅ 완료 | 날짜별 그룹핑 타임라인 뷰, 액션별 아이콘/색상 |
| AuditDetail | ✅ 완료 | 상세 다이얼로그 — 사용자/IP/액션/대상/오류/상세JSON/요청정보, JSON 복사 |
| 통계 대시보드 | ❌ 미구현 | 액션별 분포, 기간별 추이 차트 |

### 13.8 의존성

| 연동 모듈 | 방식 | 내용 |
|-----------|------|------|
| common-audit (신규) | AOP + SNS | 각 서비스에서 @Audited 메서드 감사 이벤트 자동 발행 |
| Auth Service | SQS 리스너 | 이벤트 수신, DB 저장, 조회/내보내기 API |
| Traefik | Access Log | HTTP 레벨 보조 로그 (ELK/CloudWatch) |
| 전 서비스 | common-audit 의존 | @Audited 어노테이션 사용 |
