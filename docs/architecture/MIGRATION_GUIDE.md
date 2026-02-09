# 기술 전환 가이드

> **최종 업데이트**: 2026-02-09
> **대상**: 아키텍트, 시니어 개발자

---

## 목차

- [1. 개요](#1-개요)
- [2. Kafka → SQS/SNS 전환](#2-kafka--sqssns-전환)
- [3. Keycloak → Custom JWT 전환](#3-keycloak--custom-jwt-전환)
- [4. Spring Cloud Gateway → Traefik 전환](#4-spring-cloud-gateway--traefik-전환)
- [5. Deprecated 문서 활용](#5-deprecated-문서-활용)
- [6. 관련 문서](#6-관련-문서)

---

## 1. 개요

프로젝트 초기 설계에서 현재 구현까지 3가지 주요 기술 전환이 이루어졌습니다. 이 문서는 각 전환의 배경, 비교, 영향을 설명합니다.

| 전환 | 이전 | 이후 | 사유 |
|------|------|------|------|
| 메시징 | Apache Kafka 3.x | AWS SQS + SNS | 운영 복잡도 ↓, 비용 ↓ |
| 인증 | Keycloak 23.x | Custom JWT | 초기 구현 단순성, 운영 부담 ↓ |
| 게이트웨이 | Spring Cloud Gateway | Traefik v3.3 | Docker 네이티브 통합 |

---

## 2. Kafka → SQS/SNS 전환

### 전환 배경

| 관점 | Kafka | SQS/SNS |
|------|-------|---------|
| **운영 복잡도** | Broker, ZooKeeper, 파티션 관리 | 완전 관리형 (설정 불필요) |
| **초기 비용** | 높음 (최소 3 broker) | 종량제 (사용한 만큼) |
| **로컬 개발** | Docker Kafka + KafkaUI | LocalStack (경량) |
| **메시지 보장** | Exactly-once 가능 | At-least-once (DLQ) |
| **순서 보장** | 파티션 내 보장 | FIFO 큐로 보장 가능 |
| **처리량** | 수백만 msg/s | 수만 msg/s |
| **학습 곡선** | 높음 | 낮음 |

### 전환 결정

- 현재 트래픽 수준에서 Kafka의 처리량이 불필요
- 3인 이하 팀에서 Kafka 클러스터 운영은 과도한 부담
- SQS/SNS의 DLQ + 재시도가 충분한 안정성 제공
- LocalStack으로 로컬 개발 완전 호환

### 코드 변경 범위

```
변경된 모듈:
- common/common-event/  → SnsEventPublisher (KafkaTemplate → SnsTemplate)
- docker/localstack/    → init-aws.sh (토픽/큐 초기화)
- 각 서비스 application.yml → spring-cloud-aws 설정

영향 없는 부분:
- DomainEvent 인터페이스 동일
- EventPublisher 인터페이스 동일
- 비즈니스 로직 변경 없음
```

### 향후 Kafka 재도입 시

`EventPublisher` 인터페이스가 추상화되어 있으므로, `KafkaEventPublisher` 구현체를 추가하고 프로파일로 전환하면 됩니다.

---

## 3. Keycloak → Custom JWT 전환

### 전환 배경

| 관점 | Keycloak | Custom JWT |
|------|----------|-----------|
| **기능** | SSO, OAuth2, OIDC, 사용자 관리 | JWT 발급/검증만 |
| **운영 복잡도** | Realm/Client 관리, DB 필요 | 코드 내 구현 |
| **초기 구현** | 설정 복잡 (Realm Export 등) | 단순 (JwtTokenProvider) |
| **확장성** | Federation, Social Login | 직접 구현 필요 |
| **메모리** | ~500MB | 0 (별도 서비스 없음) |

### 전환 결정

- 초기 MVP 단계에서 Keycloak 설정/운영이 불필요한 복잡도 추가
- Custom JWT로 동일한 인증 흐름 구현 가능
- 향후 SSO/Federation 필요 시 Keycloak 재도입 예정

### 현재 구현

```java
// JwtTokenProvider.java - 토큰 생성/검증
generateAccessToken(UserContext) → JWT (HS256)
generateRefreshToken(UUID userId) → JWT
parseToken(String token) → UserContext
validateToken(String token) → Claims

// SecurityFilter.java - 요청별 인증
Authorization: Bearer {token} → UserContext → SecurityContext
```

### 향후 Keycloak 재도입 시

| 변경 대상 | 작업 |
|----------|------|
| `JwtTokenProvider` | Keycloak 토큰 검증으로 변경 (공개키 사용) |
| `SecurityFilter` | Keycloak 토큰 형식 파싱 |
| auth-service | 로그인 → Keycloak Authorization Code Flow |
| Docker | Keycloak 컨테이너 추가 |
| `UserContext` | Keycloak 토큰 Claims 매핑 |

---

## 4. Spring Cloud Gateway → Traefik 전환

### 전환 배경

| 관점 | Spring Cloud Gateway | Traefik v3 |
|------|---------------------|------------|
| **설정** | Java 코드/YAML | YAML/Docker Labels |
| **빌드** | Gradle 빌드 필요 | Docker 이미지 직접 사용 |
| **서비스 발견** | Eureka/Consul 필요 | Docker Labels 자동 감지 |
| **메모리** | ~300MB (JVM) | ~50MB |
| **대시보드** | Spring Actuator | 내장 대시보드 |

### 전환 결정

- Docker Compose 환경에서 Traefik Labels로 라우팅 자동 설정
- 별도 빌드/배포 없이 Docker 이미지로 바로 사용
- 내장 CORS, Rate Limit 미들웨어 제공
- 프로덕션에서는 ALB가 라우팅 담당 (Traefik은 로컬만)

### 현재 구성

```
docker/traefik/
├── traefik.yml           # 메인 설정 (대시보드, 엔트리포인트)
└── dynamic/
    ├── middlewares.yml    # CORS, Rate Limit
    └── services.yml      # 라우팅 규칙, 서비스 URL
```

---

## 5. Deprecated 문서 활용

`docs/deprecated/` 디렉토리의 SDD 문서에서 여전히 유효한 내용:

| 유효 | 무효 |
|------|------|
| 도메인 모델/ERD | Kafka 토픽/컨슈머 설정 |
| 비즈니스 규칙 | Keycloak Realm/Client 설정 |
| API 엔드포인트 목록 | Spring Cloud Gateway 라우팅 |
| RBAC 역할 정의 | Kubernetes Deployment |
| 개인정보 보호 규칙 | ZooKeeper 설정 |

> 상세 매핑은 [docs/deprecated/README.md](../deprecated/README.md) 참조

---

## 6. 관련 문서

| 문서 | 설명 |
|------|------|
| [EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md) | SNS/SQS 현재 구현 |
| [SECURITY_PATTERNS.md](./SECURITY_PATTERNS.md) | Custom JWT 현재 구현 |
| [TECH_STACK.md](./TECH_STACK.md) | 기술 스택 요약 |
| [docs/deprecated/README.md](../deprecated/README.md) | Deprecated 문서 안내 |
