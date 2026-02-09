# 기술 스택 요약

> **최종 업데이트**: 2026-02-09

---

## 목차

- [1. 백엔드](#1-백엔드)
- [2. 프론트엔드](#2-프론트엔드)
- [3. 인프라](#3-인프라)
- [4. 개발 도구](#4-개발-도구)
- [5. 기술 선택 근거](#5-기술-선택-근거)

---

## 1. 백엔드

| 계층 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **언어** | Java | 17 (LTS) | 기본 언어 |
| **프레임워크** | Spring Boot | 3.2 | 애플리케이션 프레임워크 |
| **클라우드** | Spring Cloud | 2023.x | 마이크로서비스 통합 |
| **AWS** | Spring Cloud AWS | 3.1.1 | SNS/SQS, S3 통합 |
| **데이터베이스** | PostgreSQL | 15 | 메인 RDBMS + RLS |
| **캐시** | Redis | 7.x | 캐시, 세션, 토큰 |
| **ORM** | Spring Data JPA | (Boot 내장) | 데이터 접근 |
| **마이그레이션** | Flyway | (Boot 내장) | DB 스키마 관리 |
| **보안** | Spring Security | (Boot 내장) | 인증/인가 |
| **인증** | Custom JWT | - | HMAC-SHA256 토큰 |
| **빌드** | Gradle | 8.x | 멀티모듈 빌드 |
| **컨테이너** | Docker | - | 서비스 패키징 |

### 멀티모듈 구조

```
common/ (9개 공통 모듈)
├── common-core        # 예외, 에러코드, 유틸
├── common-entity      # BaseEntity, AuditableEntity, TenantAwareEntity
├── common-response    # ApiResponse, GlobalExceptionHandler
├── common-database    # RLS Interceptor, Flyway 설정
├── common-tenant      # TenantContext, TenantFilter
├── common-security    # JWT, Permission, SecurityFilter
├── common-privacy     # 마스킹, 암호화
├── common-cache       # Redis 키 전략, TTL
└── common-event       # DomainEvent, SNS/SQS 통합

services/ (12개 마이크로서비스)
├── auth-service       # 인증/세션 (8081)
├── tenant-service     # 멀티테넌시 (8082)
├── organization-service # 조직 관리 (8083)
├── employee-service   # 인사 관리 (8084)
├── attendance-service # 근태/휴가 (8085)
├── approval-service   # 전자결재 (8086)
├── mdm-service        # 기준정보 (8087)
├── notification-service # 알림 (8088)
├── file-service       # 파일 관리 (8089)
├── appointment-service # 발령 (8091)
├── certificate-service # 증명서 (8092)
└── recruitment-service # 채용 (8093)
```

---

## 2. 프론트엔드

| 계층 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **언어** | TypeScript | 5.x | 타입 안전 |
| **UI 프레임워크** | React | 18 | SPA |
| **빌드** | Vite | - | 번들링/HMR |
| **라우팅** | React Router | v6 | 클라이언트 라우팅 |
| **상태 관리** | Zustand | - | 전역 상태 |
| **데이터 페칭** | TanStack Query | - | 서버 상태 |
| **UI 컴포넌트** | shadcn/ui | - | 재사용 컴포넌트 |
| **스타일** | Tailwind CSS | - | 유틸리티 CSS |
| **Mock** | MSW | - | API 모킹 |
| **패키지 관리** | pnpm | 8+ | 모노레포 워크스페이스 |
| **테스트** | Vitest + Playwright | - | 단위/E2E 테스트 |

---

## 3. 인프라

### 로컬 개발

| 기술 | 버전 | 용도 |
|------|------|------|
| Docker Compose | 2.20+ | 로컬 인프라 |
| LocalStack | 3.4 | AWS SNS/SQS 에뮬레이션 |
| Traefik | v3.3 | API 게이트웨이 (로컬) |

### 프로덕션 (AWS)

| 서비스 | 용도 |
|--------|------|
| **ECS Fargate** | 컨테이너 오케스트레이션 |
| **ECR** | Docker 이미지 레지스트리 |
| **RDS PostgreSQL 15** | 메인 데이터베이스 (Multi-AZ) |
| **ElastiCache Redis 7** | 캐시/세션 |
| **SNS + SQS** | 이벤트 기반 서비스 간 통신 |
| **ALB** | 로드밸런서 + 경로 기반 라우팅 |
| **S3 + CloudFront** | 프론트엔드 정적 호스팅 |
| **Secrets Manager** | 시크릿 관리 |
| **CloudWatch** | 로그/메트릭/알림 |
| **Route 53** | DNS |
| **ACM** | SSL 인증서 |

### 모니터링

| 기술 | 버전 | 용도 |
|------|------|------|
| Prometheus | v2.48.0 | 메트릭 수집 |
| Grafana | 10.2.0 | 대시보드/시각화 |
| Jaeger | 1.52 | 분산 추적 (OpenTelemetry) |

---

## 4. 개발 도구

| 도구 | 용도 |
|------|------|
| IntelliJ IDEA | Java/Spring 개발 (권장) |
| VS Code | 프론트엔드 개발 |
| DBeaver / DataGrip | DB GUI |
| Postman / httpie | API 테스트 |
| Git + GitHub | 버전 관리 + 협업 |

---

## 5. 기술 선택 근거

### Java 17 + Spring Boot 3.2

- 엔터프라이즈 검증된 안정성
- Spring 생태계 (Security, Data, Cloud) 활용
- LTS 지원 (2026년까지)

### PostgreSQL 15 + RLS

- Row Level Security로 DB 레벨 테넌트 격리
- 100+ 테넌트를 단일 DB로 관리 (비용 효율)
- JSONB, UUID, 풍부한 확장 기능

### AWS SQS + SNS (Kafka 대체)

- 완전 관리형 서비스 (운영 부담 최소)
- 초기 트래픽에 적합한 비용 구조
- LocalStack으로 로컬 개발 완전 지원

### Custom JWT (Keycloak 대체)

- 초기 구현 단순성
- Keycloak 운영 복잡도 제거
- 향후 Keycloak 재도입 가능 (인터페이스 동일)

### ECS Fargate (K8s 대체)

- 서버리스 컨테이너 (인프라 관리 불필요)
- K8s 대비 운영 팀 규모에 적합
- AWS 네이티브 통합 (ALB, CloudWatch, ECR)

> 상세 기술 전환 배경은 Phase 3의 `docs/architecture/MIGRATION_GUIDE.md`와 Phase 4의 ADR 문서에서 다룹니다.

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| [DOCKER_GUIDE.md](../operations/DOCKER_GUIDE.md) | 로컬 개발 인프라 |
| [AWS_INFRASTRUCTURE.md](../operations/AWS_INFRASTRUCTURE.md) | 프로덕션 인프라 |
| [SECURITY_PATTERNS.md](./SECURITY_PATTERNS.md) | JWT, 보안 구현 |
| [MULTI_TENANCY.md](./MULTI_TENANCY.md) | RLS 멀티테넌시 |
| [docs/deprecated/README.md](../deprecated/README.md) | 초기 설계 → 현재 전환 매핑 |
