# HR SaaS Platform

100개 이상의 계열사를 보유한 대기업 그룹을 위한 엔터프라이즈급 멀티테넌트 HR SaaS 플랫폼

---

## 프로젝트 현재 상태

> **최종 업데이트**: 2026년 2월 5일

### 완료된 작업 (프론트엔드 UI)

프론트엔드 화면 개발이 완료되었습니다. 현재 **MSW(Mock Service Worker)**를 사용하여 API를 모킹하고 있으며, 실제 백엔드 연동 없이 모든 화면을 확인할 수 있습니다.

| 기능 | 화면 | 상태 |
|------|------|------|
| **인증** | 로그인, 로그아웃 | 완료 |
| **대시보드** | 메인 대시보드, 위젯 커스터마이징 | 완료 |
| **직원 관리** | 목록, 상세, 등록, 수정, 겸직 관리 | 완료 |
| **조직 관리** | 조직도, 부서 관리, 직급/직위 관리, 이력 | 완료 |
| **근태 관리** | 출퇴근, 연장근무, 휴가 신청/승인/캘린더 | 완료 |
| **결재** | 문서 작성/목록/상세, 템플릿, 위임 설정 | 완료 |
| **채용** | 채용공고, 지원자 관리, 면접 관리 | 완료 |
| **공지사항** | 목록, 상세, 작성 | 완료 |
| **위원회** | 목록, 생성, 멤버 관리 | 완료 |
| **정원 관리** | 현황, 요청 생성 | 완료 |
| **인사이동** | 요청, 목록, 상세 | 완료 |
| **증명서** | 발급 신청, 내 증명서 | 완료 |
| **경조사** | 신청, 정책 관리, 지급 관리 | 완료 |
| **알림** | 알림 센터, 설정 | 완료 |
| **설정** | 시스템 설정, 테마, 언어 | 완료 |
| **도움말** | FAQ, 가이드, 문의 | 완료 |
| **모바일 대응** | 반응형 UI, PWA 지원 | 완료 |
| **접근성** | WCAG 2.1 AA 준수 | 완료 |
| **다국어** | 한국어/영어 지원 | 완료 |

### 진행 예정 (백엔드 연동)

백엔드 마이크로서비스는 개발이 완료되었으나, 프론트엔드와의 연동 작업이 필요합니다.

**추후 작업 예정 항목:**

1. **API 연동**
   - MSW 모킹을 실제 백엔드 API로 교체
   - 인증 플로우 연동 (Keycloak OAuth 2.0)
   - 에러 핸들링 및 재시도 로직 구현

2. **백엔드 인프라 재구성**
   - AWS ECS Fargate 서비스 재배포
   - Spring Cloud Gateway CORS 설정 최적화
   - API Gateway 연동 (CORS 처리)

3. **통합 테스트**
   - E2E 테스트 작성
   - 성능 테스트 및 최적화
   - 보안 점검

### 현재 배포 상태

| 환경 | URL | 상태 |
|------|-----|------|
| **프론트엔드** | https://app.port-sw.com | 운영 중 |
| **백엔드 API** | https://api-hr.port-sw.com | 정비 중 |
| **Keycloak** | - | 정비 중 |

### 로컬에서 프론트엔드 실행하기

```bash
cd frontend/apps/web
pnpm install
pnpm dev
# http://localhost:5173 에서 확인 가능
# MSW가 모든 API를 모킹하므로 백엔드 없이 동작
```

**테스트 계정 (MSW 모킹):**
- ID: `admin@example.com`
- PW: 아무 값이나 입력

---

## 개요

마이크로서비스 아키텍처로 구축된 종합 인사관리 시스템입니다. PostgreSQL Row Level Security(RLS)를 활용한 멀티테넌시 지원으로 엔터프라이즈 규모의 운영에 적합하게 설계되었습니다.

### 주요 기능

- **직원 관리**: 입사부터 퇴사까지 전체 생애주기 관리
- **근태/휴가**: 출퇴근 기록, 휴가 신청, 승인 워크플로우
- **결재 워크플로우**: 설정 가능한 다단계 결재 프로세스
- **조직 관리**: 계층형 조직도, 부서, 직위, 직급 관리
- **채용**: 채용공고, 지원자 추적, 면접 일정 관리
- **멀티테넌시**: RLS를 활용한 테넌트 간 완벽한 데이터 격리

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 언어 | Java 17 |
| 프레임워크 | Spring Boot 3.2, Spring Cloud 2023.x |
| 데이터베이스 | PostgreSQL 15 + Row Level Security |
| 캐시 | Redis 7.x |
| 메시징 | Apache Kafka 3.x (KRaft 모드) |
| 인증 | Keycloak 23.x (OAuth 2.0 / OIDC) |
| 빌드 | Gradle 8.x (멀티모듈) |
| 컨테이너 | Docker, AWS ECS Fargate (Graviton ARM64) |
| 프론트엔드 | React 18, TypeScript, Vite, TanStack Query |

---

## 시스템 아키텍처

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      VPC (10.0.0.0/16)                 │
                    │                                                        │
    인터넷 ─────────┤►  ALB (퍼블릭 서브넷)   CloudFront ◄── S3 (프론트엔드) │
                    │       │                                                │
                    │       ▼                                                │
                    │   ┌────────────────────────────────────────────────┐  │
                    │   │         ECS Fargate (프라이빗 서브넷)           │  │
                    │   │                    [ARM64]                       │  │
                    │   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │  │
                    │   │  │ Gateway │ │  Auth   │ │ Tenant  │ │  Org   │ │  │
                    │   │  └─────────┘ └─────────┘ └─────────┘ └────────┘ │  │
                    │   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │  │
                    │   │  │Employee │ │Attendance│ │Approval │ │  MDM   │ │  │
                    │   │  └─────────┘ └─────────┘ └─────────┘ └────────┘ │  │
                    │   │  ┌─────────┐ ┌─────────┐                        │  │
                    │   │  │Keycloak │ │  Redis  │                        │  │
                    │   │  └─────────┘ └─────────┘                        │  │
                    │   └────────────────────────────────────────────────┘  │
                    │              │                │                        │
                    │   ┌──────────┴────────────────┴──────────┐            │
                    │   │                                       │            │
                    │   ▼                                       ▼            │
                    │ ┌─────────┐                          ┌─────────┐      │
                    │ │   RDS   │                          │  Kafka  │      │
                    │ │PostgreSQL│                         │  (EC2)  │      │
                    │ └─────────┘                          └─────────┘      │
                    │                                                        │
                    │   ┌─────────────────────────────────────────────┐     │
                    │   │         VPC Endpoints (NAT 불필요)          │     │
                    │   │  ECR API │ ECR DKR │ Logs │ Secrets │ S3(GW) │     │
                    │   └─────────────────────────────────────────────┘     │
                    └────────────────────────────────────────────────────────┘
```

### 마이크로서비스 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Gateway | 8080 | API 게이트웨이, 라우팅, 속도 제한 |
| Auth | 8081 | 인증, 세션 관리 |
| Tenant | 8082 | 멀티테넌시 관리 |
| Organization | 8083 | 조직 구조, 부서, 직위 |
| Employee | 8084 | 직원 데이터 관리 |
| Attendance | 8085 | 근태 기록, 휴가 관리 |
| Approval | 8086 | 워크플로우 엔진 |
| MDM | 8087 | 마스터 데이터 (코드, 메뉴) |
| Notification | 8088 | 푸시 알림, 이메일 |
| File | 8089 | 파일 저장 (S3 연동) |

---

## 프로젝트 구조

```
hr-platform/
├── docker/                     # Docker 설정
├── common/                     # 공통 모듈
│   ├── common-core/            # 기본 예외, 유틸리티
│   ├── common-entity/          # JPA 기본 엔티티
│   ├── common-security/        # JWT, 권한
│   ├── common-tenant/          # 멀티테넌시 지원
│   └── ...
├── services/                   # 마이크로서비스
│   ├── gateway-service/
│   ├── auth-service/
│   ├── employee-service/
│   └── ...
├── frontend/
│   └── apps/web/               # React SPA
├── infra/
│   └── aws/terraform/          # Infrastructure as Code
└── config/                     # 중앙화된 설정
```

---

## 로컬 개발 환경

### 사전 요구사항

- Java 17 이상
- Node.js 18 이상 + pnpm
- Docker 및 Docker Compose
- Gradle 8.x

### 빠른 시작

```bash
# 1. 인프라 시작 (PostgreSQL, Redis, Kafka, Keycloak)
cd docker && docker-compose up -d

# 2. 백엔드 서비스 실행
./gradlew :services:gateway-service:bootRun &
./gradlew :services:auth-service:bootRun &
./gradlew :services:employee-service:bootRun &
# ... 또는 전체 서비스 실행

# 3. 프론트엔드 시작
cd frontend/apps/web
pnpm install
pnpm dev
```

### 개별 서비스 실행

```bash
# 전체 모듈 빌드
./gradlew build

# 특정 서비스 실행
./gradlew :services:employee-service:bootRun

# 테스트 실행
./gradlew test

# 테스트 커버리지 리포트 생성
./gradlew jacocoTestReport
```

### 프론트엔드 개발

**중요: npm이나 yarn이 아닌 pnpm을 사용하세요**

```bash
cd frontend/apps/web

# 의존성 설치
pnpm install

# 개발 서버 (http://localhost:5173)
pnpm dev

# 프로덕션 빌드
pnpm build

# 타입 체크
pnpm typecheck
```

---

## AWS 배포

### 인프라 개요

- **컴퓨팅**: ECS Fargate + Graviton (ARM64) - 비용 효율성
- **데이터베이스**: RDS PostgreSQL + Row Level Security
- **캐시**: Fargate 기반 Redis (ARM64)
- **메시징**: EC2 기반 Kafka (KRaft 모드, ZooKeeper 불필요)
- **인증**: Fargate 기반 Keycloak (ARM64)
- **네트워킹**: NAT Gateway 대신 VPC Endpoints 사용 (월 ~$20 절감)

### 배포 단계

```bash
# 1. Terraform 초기화
cd infra/aws/terraform/environments/dev
terraform init

# 2. 변경 사항 검토
terraform plan -out=tfplan

# 3. 인프라 적용
terraform apply tfplan

# 4. Docker 이미지 빌드 및 푸시 (ARM64)
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com

# buildx를 사용한 ARM64 이미지 빌드
docker buildx create --use
services="gateway-service auth-service tenant-service organization-service employee-service attendance-service approval-service mdm-service"
for service in $services; do
  docker buildx build --platform linux/arm64 \
    -t <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/hr-platform/$service:latest \
    --build-arg SERVICE_NAME=$service \
    -f docker/Dockerfile.service . --push
done

# 5. 프론트엔드 배포
cd frontend/apps/web && pnpm build
aws s3 sync dist/ s3://hr-platform-dev-frontend/ --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

### 인프라 검증

```bash
# VPC Endpoints 확인
aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=<vpc-id>"

# ECS 태스크 ARM64 실행 확인
aws ecs describe-tasks --cluster hr-platform-dev --tasks <task-arn>

# 서비스 헬스 체크
curl -k https://<alb-dns>/actuator/health
```

### 예상 월간 비용 (개발 환경)

| 리소스 | 구성 | 비용 |
|--------|------|------|
| ECS Fargate (8개 서비스) | ARM64, 256 CPU, 512MB | ~$96 |
| Redis (Fargate) | ARM64, 256 CPU, 512MB | ~$8 |
| Keycloak (Fargate) | ARM64, 512 CPU, 1GB | ~$16 |
| Kafka (EC2) | t3.small | ~$15 |
| RDS | db.t3.micro | ~$25 |
| ALB | - | ~$20 |
| VPC Endpoints | ECR, Logs, Secrets | ~$14 |
| CloudFront + S3 | - | ~$5 |
| **합계** | | **~$200/월** |

---

## API 문서

### Swagger UI 접근

로컬 또는 AWS에서 서비스 시작 후:

- Gateway Swagger: `http://localhost:8080/swagger-ui.html`
- 개별 서비스: `http://localhost:<port>/swagger-ui.html`

### 주요 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/v1/auth/login` | POST | 사용자 인증 |
| `/api/v1/employees` | GET | 직원 목록 조회 |
| `/api/v1/employees/{id}` | GET | 직원 상세 조회 |
| `/api/v1/attendance/check-in` | POST | 출근 기록 |
| `/api/v1/leaves` | POST | 휴가 신청 |
| `/api/v1/approvals` | GET | 대기 중인 결재 목록 |

### 인증

모든 API 요청에는 Bearer 토큰 인증이 필요합니다:

```bash
# 액세스 토큰 획득
curl -X POST https://auth.example.com/realms/hr-saas/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=hr-saas-api" \
  -d "username=user@example.com" \
  -d "password=password"

# 토큰을 사용한 요청
curl -H "Authorization: Bearer <access_token>" \
  https://api.example.com/api/v1/employees
```

---

## 개발 규칙

### API 표준

- 기본 경로: `/api/v1/{resource}`
- 리소스에는 복수형 명사 사용
- 응답 형식: `ApiResponse<T>` 래퍼
- 에러 코드: `{SERVICE}_{NUMBER}` (예: `EMP_001`)

### 데이터베이스 규칙

- 테이블명: snake_case, 복수형 (예: `employees`)
- 모든 테넌트 테이블에는 `tenant_id` 컬럼 필수
- 자동 테넌트 필터링을 위한 RLS 정책 적용

### 테스트

- 단위 테스트: JUnit 5 + Mockito
- 통합 테스트: Testcontainers
- 목표 커버리지: 80%
- 테스트 네이밍: `{method}_{scenario}_{expectedResult}`

---

## 기여 방법

1. `master`에서 기능 브랜치 생성
2. 코드 규칙에 따라 변경 사항 작성
3. 새 기능에 대한 테스트 작성
4. 명확한 설명과 함께 Pull Request 제출

---

## 라이선스

Proprietary - All rights reserved
