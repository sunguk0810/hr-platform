# HR Platform 개발 현황
> 마지막 업데이트: 2026-02-04 17:30

## 프로젝트 개요

Enterprise-grade 멀티테넌트 HR SaaS 플랫폼 (100+ 계열사 지원)

---

## 🚀 AWS MVP 배포 계획 (2026-02-05 14:00 목표)

### 배포 전략: MVP (Minimum Viable Product)

핵심 기능만 우선 배포하여 데모 가능한 환경 구축

### MVP 배포 대상

| 구분 | 포함 항목 | 상태 |
|------|----------|------|
| **Frontend** | React SPA 전체 | ✅ 준비완료 |
| **Backend (Core)** | gateway, auth, tenant | 🔄 Dockerfile 필요 |
| **Backend (HR)** | employee, organization, attendance, approval | 🔄 Dockerfile 필요 |
| **Database** | RDS PostgreSQL | ⏳ 생성 필요 |
| **Cache** | ElastiCache Redis | ⏳ 생성 필요 |

### MVP 제외 (2차 배포)

| 서비스 | 사유 |
|--------|------|
| mdm-service | 기준정보 (초기 데이터로 대체) |
| notification-service | 알림 (Mock 유지) |
| file-service | 파일 (S3 직접 연동 가능) |
| certificate-service | 증명서 (2차) |
| appointment-service | 발령 (2차) |
| recruitment-service | 채용 (2차) |

### 배포 일정

```
2026-02-04 (오늘)
├── 17:30 - 18:30  Frontend 프로덕션 빌드 테스트
├── 18:30 - 19:30  Backend Gradle 빌드 검증
├── 19:30 - 21:30  백엔드 Dockerfile 작성 (7개 서비스)
└── 21:30 - 22:30  docker-compose.prod.yml 작성

2026-02-05 (내일)
├── 09:00 - 10:00  AWS ECR 레포지토리 생성 & 이미지 푸시
├── 10:00 - 11:00  RDS PostgreSQL 생성 & Flyway 마이그레이션
├── 11:00 - 12:00  ECS Fargate 클러스터 & Task Definition
├── 12:00 - 13:00  ALB 생성 & Frontend (S3/CloudFront) 배포
├── 13:00 - 13:30  Backend 서비스 배포 (7개)
└── 13:30 - 14:00  통합 테스트 & 데모 준비
```

### AWS 리소스 계획

| 리소스 | 스펙 | 예상 비용 (월) |
|--------|------|---------------|
| ECS Fargate | 7 tasks x 0.5 vCPU, 1GB | ~$80 |
| RDS PostgreSQL | db.t3.medium | ~$50 |
| ElastiCache Redis | cache.t3.micro | ~$15 |
| ALB | 1개 | ~$20 |
| S3 + CloudFront | Frontend 호스팅 | ~$5 |
| **합계** | | **~$170/월** |

---

## 개발 진행률 요약

| 영역 | 완료 | 전체 | 진행률 |
|------|------|------|--------|
| 백엔드 서비스 | 13 | 13 | ✅ 100% |
| 프론트엔드 Features | 23 | 23 | ✅ 100% |
| 프론트엔드 Pages | 61 | 61 | ✅ 100% |
| MSW Mock Handlers | 22 | 22 | ✅ 100% |
| Shared Types | 16 | 16 | ✅ 100% |
| E2E 테스트 | 7 | 10+ | 🔄 70% |
| AWS 인프라 | 2 | 10 | 🔄 20% |

---

## 백엔드 서비스 (13개)

| 서비스 | 포트 | 컨트롤러 | MVP | 상태 |
|--------|------|----------|-----|------|
| gateway-service | 8080 | - | ✅ | ✅ 완료 |
| auth-service | 8081 | 3 | ✅ | ✅ 완료 |
| tenant-service | 8082 | 2 | ✅ | ✅ 완료 |
| organization-service | 8083 | 3 | ✅ | ✅ 완료 |
| employee-service | 8084 | 5 | ✅ | ✅ 완료 |
| attendance-service | 8085 | 4 | ✅ | ✅ 완료 |
| approval-service | 8086 | 3 | ✅ | ✅ 완료 |
| mdm-service | 8087 | 4 | ❌ | ✅ 완료 |
| notification-service | 8088 | 2 | ❌ | ✅ 완료 |
| file-service | 8089 | 1 | ❌ | ✅ 완료 |
| certificate-service | 8090 | 6 | ❌ | ✅ 완료 |
| appointment-service | 8091 | 2 | ❌ | ✅ 완료 |
| recruitment-service | 8092 | 5 | ❌ | ✅ 완료 |

---

## 프론트엔드 현황

### Feature 모듈 (23개)

| Feature | Pages | Components | Hooks | Service | MSW | 상태 |
|---------|-------|------------|-------|---------|-----|------|
| auth | 2 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| dashboard | 1 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| employee | 5 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| organization | 5 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| attendance | 7 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| approval | 9 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| recruitment | 7 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| appointment | 3 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| certificate | 4 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| tenant | 3 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| mdm | 3 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| notification | 1 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| my-info | 1 | ✅ | ✅ | ✅ | - | ✅ 완료 |
| settings | 1 | ✅ | - | - | - | ✅ 완료 |
| audit | 1 | ✅ | - | - | ✅ | ✅ 완료 |
| announcement | 2 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| help | 3 | ✅ | ✅ | ✅ | - | ✅ 완료 |
| transfer | 3 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| headcount | 2 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| condolence | 1 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| committee | 1 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| employee-card | 1 | ✅ | ✅ | ✅ | ✅ | ✅ 완료 |
| error | 3 | ✅ | - | - | - | ✅ 완료 |

### 주요 페이지 목록 (61개+)

#### 인증 (2)
- `LoginPage` - 로그인 (8개 테스트 계정 지원)
- `LogoutPage` - 로그아웃

#### 대시보드 (1)
- `DashboardPage` - 메인 대시보드 (위젯 기반)

#### 인사정보 (5)
- `EmployeeListPage` - 직원 목록/검색
- `EmployeeDetailPage` - 직원 상세정보
- `EmployeeCreatePage` - 직원 등록
- `RecordCardPage` - 인사기록카드
- `PrivacyAccessLogPage` - 개인정보 열람이력

#### 조직관리 (5)
- `OrganizationPage` - 조직도
- `DepartmentListPage` - 부서 목록
- `GradeManagePage` - 직급 관리
- `PositionManagePage` - 직책 관리
- `OrgHistoryPage` - 조직 변경이력

#### 발령관리 (3)
- `AppointmentListPage` - 발령안 목록
- `AppointmentDetailPage` - 발령안 상세
- `AppointmentCreatePage` - 발령안 작성

#### 근태/휴가 (7)
- `AttendancePage` - 근태 현황
- `LeaveRequestPage` - 휴가 신청
- `MyLeavePage` - 내 휴가
- `LeaveCalendarPage` - 휴가 캘린더
- `LeaveApprovalPage` - 휴가 승인
- `OvertimePage` - 초과근무
- `WorkHourMonitoringPage` - 52시간 모니터링

#### 전자결재 (9)
- `ApprovalListPage` - 결재 목록
- `ApprovalCreatePage` - 결재 작성
- `ApprovalDetailPage` - 결재 상세
- `MyApprovalsPage` - 내 결재함
- `DelegationPage` - 결재 위임
- `DelegationRulesPage` - 위임전결 규칙
- `ApprovalTemplatesPage` - 결재 양식 관리
- `ApprovalTemplateEditPage` - 양식 편집

#### 채용관리 (7)
- `JobPostingListPage` - 채용공고 목록
- `JobPostingDetailPage` - 공고 상세
- `JobPostingCreatePage` - 공고 등록/수정
- `ApplicationListPage` - 지원서 목록
- `ApplicationDetailPage` - 지원서 상세
- `InterviewListPage` - 면접 일정 (HR)
- `MyInterviewsPage` - 내 면접 (면접관)

#### 증명서 (4)
- `MyCertificatesPage` - 내 증명서
- `CertificateRequestPage` - 증명서 신청
- `CertificateIssueHistoryPage` - 발급 이력
- `CertificateVerifyPage` - 진위 확인

#### 테넌트 관리 (3)
- `TenantListPage` - 테넌트 목록
- `TenantDetailPage` - 테넌트 상세
- `TenantComparisonPage` - 테넌트 비교

#### 기준정보 (3)
- `CodeGroupPage` - 코드그룹 관리
- `CommonCodePage` - 공통코드 관리
- `TenantCodePage` - 테넌트 코드 관리

#### P2 신규 기능 (8)
- `TransferListPage` - 계열사 인사이동 목록
- `TransferRequestPage` - 인사이동 요청
- `TransferDetailPage` - 인사이동 상세
- `HeadcountPage` - 정현원 관리
- `HeadcountRequestsPage` - 정현원 변경 요청
- `CondolenceListPage` - 경조비 관리
- `CommitteeListPage` - 위원회 관리
- `EmployeeCardListPage` - 사원증 관리

#### 기타 (12)
- `NotificationCenterPage` - 알림 센터
- `SettingsPage` - 설정
- `MyInfoPage` - 내 정보
- `AuditLogPage` - 감사 로그
- `AnnouncementListPage` - 공지사항 목록
- `AnnouncementDetailPage` - 공지사항 상세
- `HelpGuidePage` - 사용자 가이드
- `HelpFAQPage` - FAQ
- `HelpContactPage` - 문의하기
- `NotFoundPage` - 404
- `ForbiddenPage` - 403
- `ServerErrorPage` - 500

---

## Shared Types (16 모듈)

| 타입 모듈 | 주요 인터페이스 |
|----------|----------------|
| common | PageResponse, SearchParams, ApiResponse |
| employee | Employee, EmployeeSearchParams, EmployeeDetail |
| organization | Department, Grade, Position, OrgHistory |
| attendance | Attendance, LeaveRequest, Overtime, Holiday |
| approval | Approval, ApprovalLine, ApprovalTemplate, Delegation |
| recruitment | JobPosting, Application, Interview, InterviewScore |
| appointment | AppointmentDraft, AppointmentItem, AppointmentHistory |
| certificate | Certificate, CertificateRequest, CertificateType |
| tenant | Tenant, TenantPolicy, TenantFeature |
| mdm | CodeGroup, CommonCode, TenantCode |
| notification | Notification, NotificationTemplate |
| file | FileInfo, UploadResponse |
| transfer | TransferRequest, TransferStatus |
| headcount | HeadcountPlan, HeadcountRequest |
| condolence | CondolenceRequest, CondolencePolicy |
| committee | Committee, CommitteeMember |
| employeeCard | EmployeeCard, CardIssueRequest |

---

## 인증 및 권한

### 테스트 계정

| 역할 | 계정 | 비밀번호 | 접근 범위 |
|------|------|----------|----------|
| 시스템 관리자 | admin | admin1234 | 전체 (모든 테넌트) |
| 그룹 HR 총괄 | group | group1234 | 전체 (모든 테넌트) |
| 테넌트 관리자 | tenant | tenant1234 | 단일 테넌트 |
| HR 관리자 | hradmin | hradmin1234 | HR 기능 전체 |
| HR 담당자 | hr | hr1234 | HR 기능 (제한적) |
| 부서장 | deptmgr | deptmgr1234 | 부서 결재 |
| 팀장 | teamlead | teamlead1234 | 팀 결재 |
| 일반 직원 | employee | employee1234 | 본인 정보 |

### 역할 기반 접근제어 (RBAC)

- `SUPER_ADMIN` - 시스템 전체 관리
- `GROUP_ADMIN` - 그룹 HR 총괄 (계열사 전체)
- `TENANT_ADMIN` - 테넌트 관리자
- `HR_ADMIN` - HR 관리자
- `HR_MANAGER` - HR 담당자
- `DEPT_MANAGER` - 부서장
- `TEAM_LEADER` - 팀장
- `EMPLOYEE` - 일반 직원

### 멀티테넌트 지원

- `group`, `admin` 계정: 5개 계열사 전환 가능
  - HR그룹 지주회사 (HOLDINGS)
  - HR테크 (TECH)
  - HR컨설팅 (CONSULTING)
  - HR아카데미 (ACADEMY)
  - HR파트너스 (PARTNERS)
- 기타 계정: 단일 테넌트 (HR테크)

---

## 인프라 구성

### Docker 컨테이너 (로컬 개발)

| 서비스 | 포트 | 용도 |
|--------|------|------|
| PostgreSQL | 5433 | 메인 DB |
| Redis | 6381 | 캐시/세션 |
| Kafka | 9093 | 이벤트 스트리밍 |
| Kafka UI | 8090 | Kafka 관리 |
| Keycloak | 8180 | 인증/SSO |
| Jaeger | 16686 | 분산 추적 |
| Prometheus | 9090 | 메트릭 수집 |
| Grafana | 3000 | 모니터링 대시보드 |

### AWS 인프라 (MVP 계획)

| 서비스 | 용도 | 상태 |
|--------|------|------|
| ECR | 컨테이너 레지스트리 | ⏳ 생성 필요 |
| ECS Fargate | 컨테이너 오케스트레이션 | ⏳ 생성 필요 |
| RDS PostgreSQL | 메인 데이터베이스 | ⏳ 생성 필요 |
| ElastiCache | Redis 캐시 | ⏳ 생성 필요 |
| ALB | 로드밸런서 | ⏳ 생성 필요 |
| S3 + CloudFront | 프론트엔드 호스팅 | ⏳ 생성 필요 |
| Route53 | DNS 관리 | ⏳ 생성 필요 |
| ACM | SSL 인증서 | ⏳ 생성 필요 |

### DB 스키마 (10개)

- hr_auth, hr_tenant, hr_organization
- hr_employee, hr_attendance, hr_approval
- hr_mdm, hr_notification, hr_file, hr_core

---

## 기술 스택

### Backend
- Java 17, Spring Boot 3.2, Spring Cloud 2023.x
- PostgreSQL 15 + Row Level Security
- Redis 7.x, Apache Kafka 3.x
- Keycloak 23.x (OAuth 2.0 / OIDC)
- Gradle 8.x (Multi-module)

### Frontend
- React 18, TypeScript 5.x
- Vite, TanStack Query (React Query)
- Zustand (상태관리)
- Tailwind CSS, shadcn/ui
- MSW (Mock Service Worker)
- Playwright (E2E 테스트)

---

## 최근 완료 작업

### 2026-02-04 (오늘)
- ✅ Phase 2 프론트엔드 기능 완성
  - Transfer (계열사 인사이동)
  - Headcount (정현원 관리)
  - Condolence (경조비)
  - Committee (위원회)
  - Employee Card (사원증)
- ✅ 역할 기반 권한 체계 PRD 정합성 맞춤
- ✅ Mock 인증 시스템 8개 계정 지원
- ✅ P2 기능 i18n 번역 파일 추가
- ✅ MSW Mock 핸들러 22개 완성
- ✅ AWS MVP 배포 계획 수립

### 이전 작업
- ✅ Phase 1: 기본 UI/레이아웃 구현
- ✅ Phase 2: 핵심 HR 기능 (직원, 조직, 근태, 결재)
- ✅ Phase 3: 확장 기능 (발령, 증명서, 채용)
- ✅ 백엔드 13개 서비스 API 구현

---

## 알려진 이슈

### TypeScript 경고 (Minor)
- 일부 미사용 변수 경고 (TS6133)
- 중복 export 경고 (TS2308)
- 영향 없음, 추후 정리 예정

### 기능 제한 (MVP)
- Notification 서비스: 메일 서버 미설정 (Mock 유지)
- File 서비스: S3 연동 필요 (Mock 유지)
- Keycloak: SSO 미연동 (Mock 인증 사용)

---

## 다음 단계 체크리스트

### 오늘 (2026-02-04)
- [ ] Frontend 프로덕션 빌드 테스트 (`pnpm build`)
- [ ] Backend Gradle 빌드 테스트 (`./gradlew build`)
- [ ] 백엔드 Dockerfile 작성 (7개 MVP 서비스)
- [ ] docker-compose.prod.yml 작성

### 내일 오전 (2026-02-05)
- [ ] AWS ECR 레포지토리 생성
- [ ] Docker 이미지 빌드 & 푸시
- [ ] RDS PostgreSQL 생성
- [ ] ECS Fargate 클러스터 생성

### 내일 오후 (14:00 전)
- [ ] ALB 생성 & Target Group 연결
- [ ] Frontend S3/CloudFront 배포
- [ ] Backend 서비스 배포 (7개)
- [ ] 통합 테스트 & 데모 준비

---

## 실행 방법

### 프론트엔드 (개발)
```bash
cd frontend/apps/web
pnpm install
pnpm dev
# http://localhost:5173
```

### 프론트엔드 (프로덕션 빌드)
```bash
cd frontend/apps/web
pnpm build
pnpm preview
```

### 백엔드 (Docker)
```bash
cd docker
docker-compose up -d
```

### 백엔드 (개별 서비스)
```bash
./gradlew :services:employee-service:bootRun
```

---

## 주요 접속 URL

### 로컬 개발
| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://localhost:5173 |
| Gateway API | http://localhost:8080 |
| Keycloak | http://localhost:8180 |
| Kafka UI | http://localhost:8090 |
| Grafana | http://localhost:3000 |

### AWS (배포 후)
| 서비스 | URL |
|--------|-----|
| 프론트엔드 | https://hr.example.com (예정) |
| API Gateway | https://api.hr.example.com (예정) |
