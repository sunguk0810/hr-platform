# ADR-003: Keycloak 대신 Custom JWT 인증 사용

> **상태**: 수락됨 (임시)
> **날짜**: 2025-02
> **관련 ADR**: 없음

---

## 컨텍스트

PRD(NFR-SEC-001)에서 Keycloak 기반 SSO (OAuth 2.0 / OIDC)를 요구하고 있으며, 초기 설계(SDD)에서도 Keycloak 23.x를 인증 서버로 계획했습니다. 그러나 MVP 단계에서 Keycloak의 설정/운영 복잡도가 개발 진행을 저해하는 요인이 되었습니다.

### 현재 상황

- Keycloak Docker 이미지 + Realm Export 준비 완료
- 서비스 연동은 미실시
- JWT 기반 인증 흐름은 Spring Security로 구현 필요
- SSO/Federation 기능은 MVP에서 불필요

---

## 고려한 대안

### 대안 1: Keycloak 23.x (OAuth 2.0 / OIDC)

외부 IdP로 Keycloak을 운영합니다.

- **장점**:
  - SSO, OAuth 2.0, OIDC 표준 준수
  - Social Login (Google, GitHub 등) 쉽게 추가
  - User Federation (LDAP/AD 연동)
  - Admin Console로 사용자/클라이언트 관리
  - PRD 요구사항 직접 충족
- **단점**:
  - Realm/Client 설정 복잡 (13개 서비스 × Client 등록)
  - 별도 PostgreSQL DB 필요 (Keycloak 전용)
  - 메모리 ~500MB (JVM 기반)
  - 버전 업그레이드 시 Realm Export/Import 주의
  - 로컬 개발 시 추가 컨테이너 필요

### 대안 2: Custom JWT (현재 선택)

Spring Security + 자체 JwtTokenProvider로 구현합니다.

- **장점**:
  - 초기 구현 단순 (JwtTokenProvider 클래스 1개)
  - 별도 서비스 불필요 (auth-service 내장)
  - 메모리 0 (추가 프로세스 없음)
  - 완전한 제어 (토큰 구조, 클레임 커스터마이징)
  - 로컬 개발 환경 단순화
- **단점**:
  - SSO 미지원 (각 테넌트별 로그인 필요)
  - Social Login 직접 구현 필요
  - LDAP/AD Federation 직접 구현 필요
  - 토큰 검증 로직 자체 관리
  - HMAC-SHA256 → 비대칭 키(RSA/EC) 전환 시 변경 필요

### 대안 3: AWS Cognito

AWS 관리형 인증 서비스를 사용합니다.

- **장점**:
  - 완전 관리형
  - OAuth 2.0 / OIDC 지원
  - Social Login 내장
- **단점**:
  - 7단계 RBAC 커스터마이징 어려움
  - 테넌트별 User Pool 관리 복잡
  - 비용 (MAU 기반)
  - AWS Lock-in

---

## 결정

**대안 2: Custom JWT**를 MVP/Phase 1-2에서 사용하고, Phase 3 이후 Keycloak 재도입을 계획합니다.

### 결정 근거

1. **개발 속도**: Keycloak 설정 2주 vs Custom JWT 2일
2. **운영 단순성**: 추가 인프라 불필요
3. **MVP 적합성**: SSO/Federation 불필요 단계
4. **인터페이스 추상화**: `JwtTokenProvider`를 교체 가능하도록 설계
5. **점진적 전환**: 동일한 JWT 기반이므로 Keycloak 토큰 검증으로 전환 용이

### 현재 구현

```java
// JwtTokenProvider.java - 토큰 생성/검증
generateAccessToken(UserContext) → JWT (HMAC-SHA256)
generateRefreshToken(UUID userId) → JWT
parseToken(String token) → UserContext
validateToken(String token) → Claims

// SecurityFilter.java - 요청별 인증
Authorization: Bearer {token} → UserContext → SecurityContext

// 보안 설정
Access Token 만료: 30분
Refresh Token 만료: 7일
동시 세션: 5개/사용자
로그인 실패 잠금: 5회 → 30분
토큰 블랙리스트: Redis
```

---

## 결과

### 긍정적 결과

- auth-service 내 완전한 인증 흐름 구현 (로그인, 토큰 갱신, 로그아웃)
- 세션 관리 (동시 5세션, Redis 블랙리스트)
- 계정 보안 (잠금, 비밀번호 정책, bcrypt 해시)
- 7단계 RBAC + 100+ 퍼미션 완전 구현
- 개발 환경 단순화 (Keycloak 컨테이너 불필요)

### 부정적 결과 / 트레이드오프

- PRD NFR-SEC-001 (Keycloak SSO) 미충족 → Phase 3 작업 항목
- SSO 미지원으로 테넌트 간 단일 로그인 불가
- HMAC-SHA256 사용 (비대칭 키 대비 보안 수준 낮음)
- Social Login, LDAP Federation 미지원

### Keycloak 재도입 시 변경 범위

| 변경 대상 | 작업 |
|----------|------|
| `JwtTokenProvider` | Keycloak 공개키 기반 토큰 검증으로 교체 |
| `SecurityFilter` | Keycloak 토큰 Claims 파싱 |
| auth-service | 로그인 → Keycloak Authorization Code Flow |
| Docker | Keycloak 컨테이너 추가 |
| `UserContext` | Keycloak Claims 매핑 |
| `PermissionChecker` | 변경 없음 (역할 기반 동일) |

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [SECURITY_PATTERNS.md](../architecture/SECURITY_PATTERNS.md) | JWT 인증 흐름 구현 상세 |
| [MIGRATION_GUIDE.md](../architecture/MIGRATION_GUIDE.md) | Keycloak → JWT 전환 배경 |
| [01-AUTH-SERVICE.md](../modules/01-AUTH-SERVICE.md) | auth-service 정책 상세 |
| [SECURITY_COMPLIANCE.md](../operations/SECURITY_COMPLIANCE.md) | 보안 컴플라이언스 |
