# HR SaaS Platform

Enterprise-grade multi-tenant HR SaaS platform for large corporate groups with 100+ subsidiaries.

---

## 🚧 프로젝트 현재 상태 (Project Status)

> **최종 업데이트**: 2026년 2월 5일

### ✅ 완료된 작업 (Frontend UI)

프론트엔드 화면 개발이 완료되었습니다. 현재 **MSW(Mock Service Worker)**를 사용하여 API를 모킹하고 있으며, 실제 백엔드 연동 없이 모든 화면을 확인할 수 있습니다.

| 기능 | 화면 | 상태 |
|------|------|------|
| **인증** | 로그인, 로그아웃 | ✅ 완료 |
| **대시보드** | 메인 대시보드, 위젯 커스터마이징 | ✅ 완료 |
| **직원 관리** | 목록, 상세, 등록, 수정, 겸직 관리 | ✅ 완료 |
| **조직 관리** | 조직도, 부서 관리, 직급/직위 관리, 이력 | ✅ 완료 |
| **근태 관리** | 출퇴근, 연장근무, 휴가 신청/승인/캘린더 | ✅ 완료 |
| **결재** | 문서 작성/목록/상세, 템플릿, 위임 설정 | ✅ 완료 |
| **채용** | 채용공고, 지원자 관리, 면접 관리 | ✅ 완료 |
| **공지사항** | 목록, 상세, 작성 | ✅ 완료 |
| **위원회** | 목록, 생성, 멤버 관리 | ✅ 완료 |
| **정원 관리** | 현황, 요청 생성 | ✅ 완료 |
| **인사이동** | 요청, 목록, 상세 | ✅ 완료 |
| **증명서** | 발급 신청, 내 증명서 | ✅ 완료 |
| **알림** | 알림 센터, 설정 | ✅ 완료 |
| **설정** | 시스템 설정, 테마, 언어 | ✅ 완료 |
| **도움말** | FAQ, 가이드, 문의 | ✅ 완료 |
| **모바일 대응** | 반응형 UI, PWA 지원 | ✅ 완료 |
| **접근성** | WCAG 2.1 AA 준수 | ✅ 완료 |
| **다국어** | 한국어/영어 지원 | ✅ 완료 |

### 🔄 진행 예정 (Backend Integration)

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

### 🌐 현재 배포 상태

| 환경 | URL | 상태 |
|------|-----|------|
| **Frontend (Production)** | https://app.port-sw.com | ✅ 운영 중 |
| **Backend API** | https://api-hr.port-sw.com | ⏸️ 정비 중 |
| **Keycloak** | - | ⏸️ 정비 중 |

### 💡 로컬에서 프론트엔드 실행하기

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

## Overview

A comprehensive Human Resource Management System built with microservices architecture, designed for enterprise-scale operations with robust multi-tenancy support using PostgreSQL Row Level Security (RLS).

### Key Features

- **Employee Management**: Full lifecycle management from onboarding to offboarding
- **Attendance & Leave**: Time tracking, leave requests, and approval workflows
- **Approval Workflow**: Configurable multi-step approval processes
- **Organization Management**: Hierarchical org chart, departments, positions, grades
- **Recruitment**: Job postings, applicant tracking, interview scheduling
- **Multi-tenancy**: Complete data isolation between tenants using RLS

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Java 17 |
| Framework | Spring Boot 3.2, Spring Cloud 2023.x |
| Database | PostgreSQL 15 + Row Level Security |
| Cache | Redis 7.x |
| Messaging | Apache Kafka 3.x (KRaft mode) |
| Authentication | Keycloak 23.x (OAuth 2.0 / OIDC) |
| Build | Gradle 8.x (Multi-module) |
| Container | Docker, AWS ECS Fargate (Graviton ARM64) |
| Frontend | React 18, TypeScript, Vite, TanStack Query |

## Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      VPC (10.0.0.0/16)                 │
                    │                                                        │
    Internet ───────┤►  ALB (Public Subnet)    CloudFront ◄── S3 (Frontend)  │
                    │       │                                                │
                    │       ▼                                                │
                    │   ┌────────────────────────────────────────────────┐  │
                    │   │           ECS Fargate (Private Subnet)          │  │
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
                    │   │           VPC Endpoints (No NAT)             │     │
                    │   │  ECR API │ ECR DKR │ Logs │ Secrets │ S3(GW) │     │
                    │   └─────────────────────────────────────────────┘     │
                    └────────────────────────────────────────────────────────┘
```

### Microservices

| Service | Port | Description |
|---------|------|-------------|
| Gateway | 8080 | API Gateway, routing, rate limiting |
| Auth | 8081 | Authentication, session management |
| Tenant | 8082 | Multi-tenancy management |
| Organization | 8083 | Org structure, departments, positions |
| Employee | 8084 | Employee data management |
| Attendance | 8085 | Time tracking, leave management |
| Approval | 8086 | Workflow engine |
| MDM | 8087 | Master data (codes, menus) |
| Notification | 8088 | Push notifications, emails |
| File | 8089 | File storage (S3 integration) |

## Project Structure

```
hr-platform/
├── docker/                     # Docker configurations
├── common/                     # Shared modules
│   ├── common-core/            # Base exceptions, utilities
│   ├── common-entity/          # JPA base entities
│   ├── common-security/        # JWT, permissions
│   ├── common-tenant/          # Multi-tenancy support
│   └── ...
├── services/                   # Microservices
│   ├── gateway-service/
│   ├── auth-service/
│   ├── employee-service/
│   └── ...
├── frontend/
│   └── apps/web/               # React SPA
├── infra/
│   └── aws/terraform/          # Infrastructure as Code
└── config/                     # Centralized configs
```

## Local Development

### Prerequisites

- Java 17+
- Node.js 18+ with pnpm
- Docker & Docker Compose
- Gradle 8.x

### Quick Start

```bash
# 1. Start infrastructure (PostgreSQL, Redis, Kafka, Keycloak)
cd docker && docker-compose up -d

# 2. Run backend services
./gradlew :services:gateway-service:bootRun &
./gradlew :services:auth-service:bootRun &
./gradlew :services:employee-service:bootRun &
# ... or run all services

# 3. Start frontend
cd frontend/apps/web
pnpm install
pnpm dev
```

### Running Individual Services

```bash
# Build all modules
./gradlew build

# Run specific service
./gradlew :services:employee-service:bootRun

# Run tests
./gradlew test

# Generate test coverage
./gradlew jacocoTestReport
```

### Frontend Development

**Important: Use pnpm, not npm or yarn**

```bash
cd frontend/apps/web

# Install dependencies
pnpm install

# Development server (http://localhost:5173)
pnpm dev

# Production build
pnpm build

# Type checking
pnpm typecheck
```

## AWS Deployment

### Infrastructure Overview

- **Compute**: ECS Fargate with Graviton (ARM64) for cost efficiency
- **Database**: RDS PostgreSQL with Row Level Security
- **Cache**: Redis on Fargate (ARM64)
- **Messaging**: Kafka on EC2 (KRaft mode, no ZooKeeper)
- **Auth**: Keycloak on Fargate (ARM64)
- **Networking**: VPC Endpoints instead of NAT Gateway (~$20/month savings)

### Deployment Steps

```bash
# 1. Initialize Terraform
cd infra/aws/terraform/environments/dev
terraform init

# 2. Review planned changes
terraform plan -out=tfplan

# 3. Apply infrastructure
terraform apply tfplan

# 4. Build and push Docker images (ARM64)
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com

# Build ARM64 images using buildx
docker buildx create --use
services="gateway-service auth-service tenant-service organization-service employee-service attendance-service approval-service mdm-service"
for service in $services; do
  docker buildx build --platform linux/arm64 \
    -t <account-id>.dkr.ecr.ap-northeast-2.amazonaws.com/hr-platform/$service:latest \
    --build-arg SERVICE_NAME=$service \
    -f docker/Dockerfile.service . --push
done

# 5. Deploy frontend
cd frontend/apps/web && pnpm build
aws s3 sync dist/ s3://hr-platform-dev-frontend/ --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

### Infrastructure Validation

```bash
# Check VPC Endpoints
aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=<vpc-id>"

# Verify ECS tasks are running ARM64
aws ecs describe-tasks --cluster hr-platform-dev --tasks <task-arn>

# Test service health
curl -k https://<alb-dns>/actuator/health
```

### Estimated Monthly Cost (Dev Environment)

| Resource | Configuration | Cost |
|----------|--------------|------|
| ECS Fargate (8 services) | ARM64, 256 CPU, 512MB | ~$96 |
| Redis (Fargate) | ARM64, 256 CPU, 512MB | ~$8 |
| Keycloak (Fargate) | ARM64, 512 CPU, 1GB | ~$16 |
| Kafka (EC2) | t3.small | ~$15 |
| RDS | db.t3.micro | ~$25 |
| ALB | - | ~$20 |
| VPC Endpoints | ECR, Logs, Secrets | ~$14 |
| CloudFront + S3 | - | ~$5 |
| **Total** | | **~$200/month** |

## API Documentation

### Accessing Swagger UI

After starting services locally or on AWS:

- Gateway Swagger: `http://localhost:8080/swagger-ui.html`
- Individual services: `http://localhost:<port>/swagger-ui.html`

### Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | User authentication |
| `/api/v1/employees` | GET | List employees |
| `/api/v1/employees/{id}` | GET | Get employee details |
| `/api/v1/attendance/check-in` | POST | Record check-in |
| `/api/v1/leaves` | POST | Submit leave request |
| `/api/v1/approvals` | GET | List pending approvals |

### Authentication

All API requests require Bearer token authentication:

```bash
# Get access token
curl -X POST https://auth.example.com/realms/hr-saas/protocol/openid-connect/token \
  -d "grant_type=password" \
  -d "client_id=hr-saas-api" \
  -d "username=user@example.com" \
  -d "password=password"

# Use token in requests
curl -H "Authorization: Bearer <access_token>" \
  https://api.example.com/api/v1/employees
```

## Development Conventions

### API Standards

- Base path: `/api/v1/{resource}`
- Use plural nouns for resources
- Response format: `ApiResponse<T>` wrapper
- Error codes: `{SERVICE}_{NUMBER}` (e.g., `EMP_001`)

### Database Conventions

- Table names: snake_case, plural (e.g., `employees`)
- All tenant tables must have `tenant_id` column
- RLS policies for automatic tenant filtering

### Testing

- Unit tests: JUnit 5 + Mockito
- Integration tests: Testcontainers
- Target coverage: 80%
- Test naming: `{method}_{scenario}_{expectedResult}`

## Contributing

1. Create a feature branch from `master`
2. Make changes following code conventions
3. Write tests for new functionality
4. Submit a pull request with clear description

## License

Proprietary - All rights reserved
