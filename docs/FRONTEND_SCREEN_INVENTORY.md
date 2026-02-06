# 프론트엔드 화면 목록 및 구현 현황

> **작성일**: 2026-02-06
> **목적**: Mock API → 실제 백엔드 전환을 위한 프론트엔드 전체 현황 정리
> **기준**: `frontend/apps/web/src/routes/config.ts` + Mock 핸들러 23개 파일 + 서비스 파일 22개

---

## 1. 개요

### 1.1 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| UI 라이브러리 | shadcn/ui + TailwindCSS |
| 상태관리 | TanStack Query (React Query) |
| 라우팅 | React Router v6 |
| API 모킹 | MSW (Mock Service Worker) |
| 빌드 도구 | Vite |
| 패키지 관리 | pnpm (Turborepo) |
| 테스트 | Vitest + Playwright (E2E) |

### 1.2 현황 요약

| 항목 | 수량 |
|------|------|
| 페이지 컴포넌트 | 85개 |
| 기능 모듈 (features/) | 25개 |
| Mock 핸들러 파일 | 23개 (318 엔드포인트) |
| 서비스 파일 | 22개 (316 API 호출) |
| 실제 백엔드 API 연동 | **0건** (전부 MSW Mock) |
| Storybook 스토리 | 15개 (공통 컴포넌트 중심) |
| E2E 테스트 | 7개 파일 |
| 서비스 내 TODO | 13건 |

---

## 2. 화면 목록

### 2.1 인증/에러 페이지 (라우트 외부)

| 화면명 | 라우트 경로 | 페이지 컴포넌트 | 구현 상태 | 비고 |
|--------|-----------|---------------|----------|------|
| 로그인 | `/login` | `features/auth/pages/LoginPage.tsx` | ✅ 완료 | 공개 라우트 |
| 로그아웃 | `/logout` | `features/auth/pages/LogoutPage.tsx` | ✅ 완료 | 공개 라우트 |
| 403 접근거부 | `/403` | `features/error/pages/ForbiddenPage.tsx` | ✅ 완료 | 에러 페이지 |
| 404 찾을 수 없음 | `/404` | `features/error/pages/NotFoundPage.tsx` | ✅ 완료 | 에러 페이지 |
| 500 서버오류 | `/500` | `features/error/pages/ServerErrorPage.tsx` | ✅ 완료 | 에러 페이지 |

### 2.2 그룹 ① 메인

| 화면명 | 라우트 경로 | 페이지 컴포넌트 | 구현 상태 | 주요 기능 | 대응 Mock 핸들러 |
|--------|-----------|---------------|----------|----------|-----------------|
| 대시보드 | `/dashboard` | `features/dashboard/pages/DashboardPage.tsx` | ✅ 완료 | 출퇴근, 잔여 연차, 결재 대기, 조직 현황, 통계, 공지, 생일, 팀 휴가 위젯 | dashboardHandlers (11개) |
| 내 정보 | `/my-info` | `features/my-info/pages/MyInfoPage.tsx` | ✅ 완료 | 프로필 조회/수정, 사진 업로드 | profileHandlers (4개) |
| 공지사항 목록 | `/announcements` | `features/announcement/pages/AnnouncementListPage.tsx` | ✅ 완료 | 공지 목록 조회 | announcementHandlers (2개) |
| 공지사항 상세 | `/announcements/:id` | `features/announcement/pages/AnnouncementDetailPage.tsx` | ✅ 완료 | 공지 상세 조회 | announcementHandlers |
| 공지사항 작성 | `/announcements/new` | `features/announcement/pages/AnnouncementCreatePage.tsx` | ✅ 완료 | 공지 작성 (관리자) | announcementHandlers |
| 공지사항 수정 | `/announcements/:id/edit` | `features/announcement/pages/AnnouncementCreatePage.tsx` | ✅ 완료 | 공지 수정 (관리자, 같은 컴포넌트 재사용) | announcementHandlers |
| 알림센터 | `/notifications` | `features/notification/pages/NotificationCenterPage.tsx` | ✅ 완료 | 알림 목록, 읽음 처리, 설정 | notificationHandlers (11개) |

### 2.3 그룹 ② 인사관리

| 화면명 | 라우트 경로 | 페이지 컴포넌트 | 구현 상태 | 주요 기능 | 대응 Mock 핸들러 |
|--------|-----------|---------------|----------|----------|-----------------|
| 직원 목록 | `/employees` | `features/employee/pages/EmployeeListPage.tsx` | ✅ 완료 | 직원 검색/조회, 엑셀 일괄 등록/내보내기, 삭제 | employeeHandlers (28개) |
| 직원 상세 | `/employees/:id` | `features/employee/pages/EmployeeDetailPage.tsx` | ✅ 완료 | 직원 상세 정보, 마스킹 해제, 퇴직 처리, 겸직 관리 | employeeHandlers |
| 직원 등록 | `/employees/new` | `features/employee/pages/EmployeeCreatePage.tsx` | ✅ 완료 | 직원 신규 등록 | employeeHandlers |
| 인사기록카드 | `/employees/:id/record-card` | `features/employee/pages/RecordCardPage.tsx` | ✅ 완료 | 인사기록카드 조회, PDF 출력 | employeeHandlers |
| 조직도 | `/organization` | `features/organization/pages/OrganizationPage.tsx` | ✅ 완료 | 트리형 조직도 시각화 | organizationHandlers (16개) |
| 부서 목록 | `/organization/departments` | `features/organization/pages/DepartmentListPage.tsx` | ✅ 완료 | 부서 CRUD | organizationHandlers |
| 직급 관리 | `/organization/grades` | `features/organization/pages/GradeManagePage.tsx` | ✅ 완료 | 직급 CRUD | organizationHandlers |
| 직책 관리 | `/organization/positions` | `features/organization/pages/PositionManagePage.tsx` | ✅ 완료 | 직책 CRUD | organizationHandlers |
| 변경 이력 | `/organization/history` | `features/organization/pages/OrgHistoryPage.tsx` | ✅ 완료 | 조직 변경 이력 조회 | organizationHandlers |
| 발령 목록 | `/appointments` | `features/appointment/pages/AppointmentListPage.tsx` | ✅ 완료 | 발령안 목록, 요약 통계 | appointmentHandlers (11개) |
| 발령안 작성 | `/appointments/new` | `features/appointment/pages/AppointmentCreatePage.tsx` | ✅ 완료 | 발령안 작성, 상세 추가 | appointmentHandlers |
| 발령안 상세 | `/appointments/:id` | `features/appointment/pages/AppointmentDetailPage.tsx` | ✅ 완료 | 발령안 상세, 제출/실행/취소 | appointmentHandlers |
| 인사이동 목록 | `/transfer` | `features/transfer/pages/TransferListPage.tsx` | ✅ 완료 | 계열사간 인사이동 목록, 요약 | transferHandlers (18개) |
| 인사이동 요청 | `/transfer/new` | `features/transfer/pages/TransferRequestPage.tsx` | ✅ 완료 | 인사이동 요청 작성 | transferHandlers |
| 인사이동 상세 | `/transfer/:id` | `features/transfer/pages/TransferDetailPage.tsx` | ✅ 완료 | 인사이동 상세, 승인/반려/완료, 인수인계 | transferHandlers |
| 정현원 현황 | `/headcount` | `features/headcount/pages/HeadcountPage.tsx` | ✅ 완료 | 정현원 계획 목록, 요약 통계 | headcountHandlers (13개) |
| 변경 요청 | `/headcount/requests` | `features/headcount/pages/HeadcountRequestsPage.tsx` | ✅ 완료 | 정현원 변경 요청 목록 | headcountHandlers |
| 변경 요청 등록 | `/headcount/requests/new` | `features/headcount/pages/HeadcountRequestCreatePage.tsx` | ✅ 완료 | 정현원 변경 요청 등록 | headcountHandlers |
| 채용 공고 목록 | `/recruitment` | `features/recruitment/pages/JobPostingListPage.tsx` | ✅ 완료 | 채용 공고 관리 | recruitmentHandlers (44개) |
| 공고 등록 | `/recruitment/jobs/new` | `features/recruitment/pages/JobPostingCreatePage.tsx` | ✅ 완료 | 채용 공고 등록 | recruitmentHandlers |
| 공고 상세 | `/recruitment/jobs/:id` | `features/recruitment/pages/JobPostingDetailPage.tsx` | ✅ 완료 | 공고 상세, 게시/마감/완료 | recruitmentHandlers |
| 공고 수정 | `/recruitment/jobs/:id/edit` | `features/recruitment/pages/JobPostingCreatePage.tsx` | ✅ 완료 | 공고 수정 (같은 컴포넌트 재사용) | recruitmentHandlers |
| 지원서 관리 | `/recruitment/applications` | `features/recruitment/pages/ApplicationListPage.tsx` | ✅ 완료 | 지원서 목록, 심사, 불합격, 채용 확정 | recruitmentHandlers |
| 지원서 상세 | `/recruitment/applications/:id` | `features/recruitment/pages/ApplicationDetailPage.tsx` | ✅ 완료 | 지원서 상세, 단계 관리 | recruitmentHandlers |
| 면접 일정 | `/recruitment/interviews` | `features/recruitment/pages/InterviewListPage.tsx` | ✅ 완료 | 면접 일정 목록, 평가 | recruitmentHandlers |
| 내 면접 | `/recruitment/my-interviews` | `features/recruitment/pages/MyInterviewsPage.tsx` | ✅ 완료 | 내 면접 일정, 평가 제출 | recruitmentHandlers |

### 2.4 그룹 ③ 근무관리

| 화면명 | 라우트 경로 | 페이지 컴포넌트 | 구현 상태 | 주요 기능 | 대응 Mock 핸들러 |
|--------|-----------|---------------|----------|----------|-----------------|
| 근태 현황 | `/attendance` | `features/attendance/pages/AttendancePage.tsx` | ✅ 완료 | 출퇴근 기록, 월별 요약 | attendanceHandlers (25개) |
| 휴가 신청 | `/attendance/leave` | `features/attendance/pages/LeaveRequestPage.tsx` | ✅ 완료 | 휴가 신청, 잔여 일수 확인 | attendanceHandlers |
| 내 휴가 | `/attendance/my-leave` | `features/attendance/pages/MyLeavePage.tsx` | ✅ 완료 | 내 휴가 내역, 취소 | attendanceHandlers |
| 휴가 캘린더 | `/attendance/leave/calendar` | `features/attendance/pages/LeaveCalendarPage.tsx` | ✅ 완료 | 휴가 캘린더 뷰 | attendanceHandlers |
| 휴가 승인 | `/attendance/leave/approval` | `features/attendance/pages/LeaveApprovalPage.tsx` | ✅ 완료 | 휴가 승인/반려, 일괄 처리 | attendanceHandlers |
| 초과근무 | `/attendance/overtime` | `features/attendance/pages/OvertimePage.tsx` | ✅ 완료 | 초과근무 신청, 총 시간 조회 | attendanceHandlers |
| 52시간 모니터링 | `/attendance/work-hours` | `features/attendance/pages/WorkHourMonitoringPage.tsx` | ✅ 완료 | 주 52시간 근무시간 통계 | attendanceHandlers |

### 2.5 그룹 ④ 전자결재

| 화면명 | 라우트 경로 | 페이지 컴포넌트 | 구현 상태 | 주요 기능 | 대응 Mock 핸들러 |
|--------|-----------|---------------|----------|----------|-----------------|
| 결재 목록 | `/approvals` | `features/approval/pages/ApprovalListPage.tsx` | ✅ 완료 | 결재 목록, 요약 통계 | approvalHandlers (26개) |
| 결재 작성 | `/approvals/new` | `features/approval/pages/ApprovalCreatePage.tsx` | ✅ 완료 | 결재 문서 작성 | approvalHandlers |
| 내 결재 | `/approvals/my` | `features/approval/pages/MyApprovalsPage.tsx` | ✅ 완료 | 내가 상신한 결재 목록 | approvalHandlers |
| 결재 위임 | `/approvals/delegation` | `features/approval/pages/DelegationPage.tsx` | ✅ 완료 | 결재 위임 설정 | approvalHandlers |
| 결재 상세 | `/approvals/:id` | `features/approval/pages/ApprovalDetailPage.tsx` | ✅ 완료 | 결재 상세, 승인/반려/회수, 이력 | approvalHandlers |

### 2.6 그룹 ⑤ 복리후생

| 화면명 | 라우트 경로 | 페이지 컴포넌트 | 구현 상태 | 주요 기능 | 대응 Mock 핸들러 |
|--------|-----------|---------------|----------|----------|-----------------|
| 내 증명서 | `/certificates` | `features/certificate/pages/MyCertificatesPage.tsx` | ✅ 완료 | 내 증명서 신청 내역 | certificateHandlers (9개) |
| 증명서 신청 | `/certificates/request` | `features/certificate/pages/CertificateRequestPage.tsx` | ✅ 완료 | 증명서 유형 선택 및 신청 | certificateHandlers |
| 발급 이력 | `/certificates/issued` | `features/certificate/pages/CertificateIssueHistoryPage.tsx` | ✅ 완료 | 발급된 증명서 이력, 다운로드 | certificateHandlers |
| 진위확인 | `/certificates/verify` | `features/certificate/pages/CertificateVerifyPage.tsx` | ✅ 완료 | 인증코드로 증명서 진위 확인 | certificateHandlers |
| 경조비 목록 | `/condolence` | `features/condolence/pages/CondolenceListPage.tsx` | ✅ 완료 | 경조비 신청 목록 | condolenceHandlers (13개) |
| 경조비 신청 | `/condolence/new` | `features/condolence/pages/CondolenceCreatePage.tsx` | ✅ 완료 | 경조비 신청 등록 | condolenceHandlers |
| 경조금 지급 관리 | `/condolence/payments` | `features/condolence/pages/CondolencePaymentPage.tsx` | ✅ 완료 | 지급 대기 목록, 일괄 지급 | condolenceHandlers |
| 경조비 상세 | `/condolence/:id` | `features/condolence/pages/CondolenceDetailPage.tsx` | ✅ 완료 | 경조비 상세, 승인/반려 | condolenceHandlers |
| 사원증 관리 | `/employee-card` | `features/employee-card/pages/EmployeeCardListPage.tsx` | ✅ 완료 | 사원증 목록, 발급 신청, 분실 신고 | employeeCardHandlers (8개) |
| 위원회 목록 | `/committee` | `features/committee/pages/CommitteeListPage.tsx` | ✅ 완료 | 위원회 목록, 위원 관리 | committeeHandlers (4개) |
| 위원회 등록 | `/committee/new` | `features/committee/pages/CommitteeCreatePage.tsx` | ✅ 완료 | 위원회 등록 | committeeHandlers |

### 2.7 그룹 ⑥ 시스템 관리

| 화면명 | 라우트 경로 | 페이지 컴포넌트 | 구현 상태 | 주요 기능 | 대응 Mock 핸들러 |
|--------|-----------|---------------|----------|----------|-----------------|
| 설정 | `/settings` | `features/settings/pages/SettingsPage.tsx` | ✅ 완료 | 시스템 설정 (테넌트 정책 포함) | tenantHandlers (18개) |
| 결재 양식 관리 | `/settings/approval-templates` | `features/approval/pages/ApprovalTemplatesPage.tsx` | ✅ 완료 | 결재 양식 목록 | approvalHandlers |
| 양식 등록 | `/settings/approval-templates/new` | `features/approval/pages/ApprovalTemplateEditPage.tsx` | ✅ 완료 | 결재 양식 등록 | approvalHandlers |
| 양식 수정 | `/settings/approval-templates/:id` | `features/approval/pages/ApprovalTemplateEditPage.tsx` | ✅ 완료 | 결재 양식 수정 | approvalHandlers |
| 개인정보 열람 이력 | `/settings/privacy-access` | `features/employee/pages/PrivacyAccessLogPage.tsx` | ✅ 완료 | 개인정보 열람 승인/이력 | employeeHandlers |
| 위임전결 규칙 | `/settings/delegation-rules` | `features/approval/pages/DelegationRulesPage.tsx` | ✅ 완료 | 위임전결 규칙 CRUD | approvalHandlers |
| 테넌트 메뉴 설정 | `/settings/tenant-menus` | `features/menu/pages/TenantMenuConfigPage.tsx` | ✅ 완료 | 테넌트별 메뉴 활성화/비활성화 | menuHandlers (14개) |
| 코드그룹 관리 | `/mdm` / `/mdm/code-groups` | `features/mdm/pages/CodeGroupPage.tsx` | ✅ 완료 | 코드그룹 CRUD, 상태 변경 | mdmHandlers (23개) |
| 공통코드 관리 | `/mdm/common-codes` | `features/mdm/pages/CommonCodePage.tsx` | ✅ 완료 | 공통코드 CRUD, 영향도 조회, 이력 | mdmHandlers |
| 테넌트 코드 관리 | `/mdm/tenant-codes` | `features/mdm/pages/TenantCodePage.tsx` | ✅ 완료 | 테넌트별 코드 사용 설정 | mdmHandlers |
| 파일 관리 | `/files` | `features/file/pages/FileManagementPage.tsx` | ✅ 완료 | 파일 목록, 업로드, 다운로드 | fileHandlers (6개) |

### 2.8 그룹 ⑦ 운영관리

| 화면명 | 라우트 경로 | 페이지 컴포넌트 | 구현 상태 | 주요 기능 | 대응 Mock 핸들러 |
|--------|-----------|---------------|----------|----------|-----------------|
| 메뉴 관리 | `/admin/menus` | `features/menu/pages/MenuManagementPage.tsx` | ✅ 완료 | 메뉴 트리 관리, 순서 변경 | menuHandlers (14개) |
| 테넌트 목록 | `/admin/tenants` | `features/tenant/pages/TenantListPage.tsx` | ✅ 완료 | 테넌트(계열사) 목록, 등록 | tenantHandlers (18개) |
| 테넌트 상세 | `/admin/tenants/:id` | `features/tenant/pages/TenantDetailPage.tsx` | ✅ 완료 | 테넌트 상세 정보, 정책, 기능, 브랜딩 | tenantHandlers |
| 테넌트 비교 | `/tenants/compare` | `features/tenant/pages/TenantComparisonPage.tsx` | ✅ 완료 | 테넌트간 정책/기능 비교 (숨김 메뉴) | tenantHandlers |
| 감사 로그 | `/audit` | `features/audit/pages/AuditLogPage.tsx` | ✅ 완료 | 감사 로그 조회, 상세, 내보내기 | auditHandlers (3개) |

### 2.9 그룹 ⑧ 지원

| 화면명 | 라우트 경로 | 페이지 컴포넌트 | 구현 상태 | 주요 기능 | 대응 Mock 핸들러 |
|--------|-----------|---------------|----------|----------|-----------------|
| 사용자 가이드 | `/help` / `/help/guide` | `features/help/pages/HelpGuidePage.tsx` | ✅ 완료 | 도움말 가이드 | helpHandlers (5개) |
| 자주 묻는 질문 | `/help/faq` | `features/help/pages/HelpFAQPage.tsx` | ✅ 완료 | FAQ 목록 | helpHandlers |
| 문의하기 | `/help/contact` | `features/help/pages/HelpContactPage.tsx` | ✅ 완료 | 문의 제출, 첨부파일 | helpHandlers |

---

## 3. Mock API 엔드포인트 전체 목록

> 모든 엔드포인트는 MSW(Mock Service Worker)로 구현되어 있으며, 실제 백엔드 연동은 0건입니다.
> 각 엔드포인트의 기본 경로 프리픽스는 `/api/v1`입니다.

### 3.1 인증 (authHandlers.ts) — 6개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| POST | `/auth/login` | auth-service | authService.ts | |
| POST | `/auth/logout` | auth-service | authService.ts | |
| POST | `/auth/token/refresh` | auth-service | authService.ts | |
| GET | `/auth/me` | auth-service | authService.ts | |
| GET | `/auth/tenants` | auth-service | authService.ts | |
| POST | `/auth/switch-tenant` | auth-service | authService.ts | TODO: 실제 테넌트 API 연동 |

### 3.2 대시보드 (dashboardHandlers.ts) — 11개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/dashboard/attendance` | attendance-service | (대시보드 내부) | |
| POST | `/attendances/check-in` | attendance-service | attendanceService.ts | |
| POST | `/attendances/check-out` | attendance-service | attendanceService.ts | |
| GET | `/dashboard/leave-balance` | attendance-service | (대시보드 내부) | |
| GET | `/dashboard/pending-approvals` | approval-service | (대시보드 내부) | |
| GET | `/dashboard/widgets` | gateway-service | (대시보드 내부) | 위젯 구성 |
| GET | `/dashboard/org-summary` | organization-service | (대시보드 내부) | |
| GET | `/dashboard/statistics` | gateway-service | (대시보드 내부) | 통합 통계 |
| GET | `/dashboard/announcements` | notification-service | (대시보드 내부) | |
| GET | `/dashboard/birthdays` | employee-service | (대시보드 내부) | |
| GET | `/dashboard/team-leave` | attendance-service | (대시보드 내부) | |

### 3.3 직원관리 (employeeHandlers.ts) — 28개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/employees` | employee-service | employeeService.ts | 검색/필터/페이징 |
| GET | `/employees/:id` | employee-service | employeeService.ts | |
| POST | `/employees` | employee-service | employeeService.ts | |
| PUT | `/employees/:id` | employee-service | employeeService.ts | |
| DELETE | `/employees/:id` | employee-service | employeeService.ts | |
| POST | `/employees/:id/resign` | employee-service | employeeService.ts | |
| POST | `/employees/:id/resign/cancel` | employee-service | employeeService.ts | TODO: 퇴직 취소 엔드포인트 |
| POST | `/employees/:id/unmask` | employee-service | employeeService.ts | 개인정보 마스킹 해제 |
| GET | `/employees/:id/record-card` | employee-service | employeeService.ts | |
| GET | `/employees/:id/record-card/pdf` | employee-service | employeeService.ts | PDF 출력 |
| GET | `/employees/:id/histories` | employee-service | employeeService.ts | |
| GET | `/employees/:id/concurrent-positions` | employee-service | employeeService.ts | 겸직 목록 |
| GET | `/employees/:eid/concurrent-positions/:pid` | employee-service | employeeService.ts | |
| POST | `/employees/:id/concurrent-positions` | employee-service | employeeService.ts | |
| PUT | `/employees/:eid/concurrent-positions/:pid` | employee-service | employeeService.ts | |
| POST | `/employees/:eid/concurrent-positions/:pid/end` | employee-service | employeeService.ts | |
| DELETE | `/employees/:eid/concurrent-positions/:pid` | employee-service | employeeService.ts | |
| POST | `/employees/:eid/concurrent-positions/:pid/set-primary` | employee-service | employeeService.ts | |
| GET | `/employees/privacy/requests` | employee-service | employeeService.ts | 개인정보 열람 요청 |
| GET | `/employees/privacy/requests/:id` | employee-service | employeeService.ts | |
| POST | `/employees/privacy/requests` | employee-service | employeeService.ts | |
| POST | `/employees/privacy/requests/:id/approve` | employee-service | employeeService.ts | |
| GET | `/employees/privacy/logs` | employee-service | employeeService.ts | 열람 이력 |
| GET | `/employees/:id/privacy/logs` | employee-service | employeeService.ts | |
| POST | `/employees/:id/transfer/request` | employee-service | employeeService.ts | (레거시 — transferHandlers로 이관) |
| GET | `/employees/transfers` | employee-service | employeeService.ts | (레거시) |
| POST | `/employees/transfers/:id/approve` | employee-service | employeeService.ts | (레거시) |
| POST | `/employees/transfers/:id/cancel` | employee-service | employeeService.ts | (레거시) |

### 3.4 조직관리 (organizationHandlers.ts) — 16개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/departments/tree` | organization-service | organizationService.ts | |
| GET | `/departments` | organization-service | organizationService.ts | |
| GET | `/departments/:id` | organization-service | organizationService.ts | |
| POST | `/departments` | organization-service | organizationService.ts | |
| PUT | `/departments/:id` | organization-service | organizationService.ts | |
| DELETE | `/departments/:id` | organization-service | organizationService.ts | |
| GET | `/positions` | organization-service | organizationService.ts | |
| POST | `/positions` | organization-service | organizationService.ts | |
| PUT | `/positions/:id` | organization-service | organizationService.ts | |
| DELETE | `/positions/:id` | organization-service | organizationService.ts | |
| GET | `/grades` | organization-service | organizationService.ts | |
| POST | `/grades` | organization-service | organizationService.ts | |
| PUT | `/grades/:id` | organization-service | organizationService.ts | |
| DELETE | `/grades/:id` | organization-service | organizationService.ts | |
| GET | `/departments/history` | organization-service | organizationService.ts | TODO: 백엔드 구현 필요 |
| GET | `/departments/:id/history` | organization-service | organizationService.ts | TODO: 백엔드 구현 필요 |

### 3.5 근태/휴가 (attendanceHandlers.ts) — 25개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/attendances/today` | attendance-service | attendanceService.ts | |
| POST | `/attendances/check-in` | attendance-service | attendanceService.ts | |
| POST | `/attendances/check-out` | attendance-service | attendanceService.ts | |
| GET | `/attendances/my` | attendance-service | attendanceService.ts | |
| GET | `/attendances/my/summary` | attendance-service | attendanceService.ts | |
| GET | `/attendances/:id` | attendance-service | attendanceService.ts | |
| PUT | `/attendances/:id` | attendance-service | attendanceService.ts | TODO: PUT 엔드포인트 구현 필요 |
| GET | `/attendances/statistics/work-hours` | attendance-service | attendanceService.ts | TODO: 근무시간 통계 엔드포인트 |
| GET | `/leaves/my/balances` | attendance-service | attendanceService.ts | |
| GET | `/leaves/balance/by-type` | attendance-service | attendanceService.ts | |
| GET | `/leaves/my` | attendance-service | attendanceService.ts | |
| GET | `/leaves/:id` | attendance-service | attendanceService.ts | |
| POST | `/leaves` | attendance-service | attendanceService.ts | |
| POST | `/leaves/:id/cancel` | attendance-service | attendanceService.ts | |
| GET | `/leaves/calendar` | attendance-service | attendanceService.ts | TODO: 캘린더 엔드포인트 구현 필요 |
| GET | `/leaves/pending` | attendance-service | attendanceService.ts | |
| GET | `/leaves/pending/summary` | attendance-service | attendanceService.ts | |
| POST | `/leaves/:id/approve` | attendance-service | attendanceService.ts | |
| POST | `/leaves/:id/reject` | attendance-service | attendanceService.ts | |
| POST | `/leaves/bulk-approve` | attendance-service | attendanceService.ts | |
| POST | `/leaves/bulk-reject` | attendance-service | attendanceService.ts | |
| GET | `/overtimes/my` | attendance-service | attendanceService.ts | |
| GET | `/overtimes/my/total-hours` | attendance-service | attendanceService.ts | |
| POST | `/overtimes` | attendance-service | attendanceService.ts | |
| POST | `/overtimes/:id/cancel` | attendance-service | attendanceService.ts | |

### 3.6 전자결재 (approvalHandlers.ts) — 26개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/approvals` | approval-service | approvalService.ts | |
| GET | `/approvals/summary` | approval-service | approvalService.ts | |
| GET | `/approvals/:id` | approval-service | approvalService.ts | |
| POST | `/approvals` | approval-service | approvalService.ts | |
| POST | `/approvals/:id/approve` | approval-service | approvalService.ts | |
| POST | `/approvals/:id/reject` | approval-service | approvalService.ts | |
| POST | `/approvals/:id/cancel` | approval-service | approvalService.ts | |
| POST | `/approvals/:id/recall` | approval-service | approvalService.ts | |
| GET | `/approvals/:id/history` | approval-service | approvalService.ts | |
| POST | `/approvals/:id/steps/:stepId/delegate` | approval-service | approvalService.ts | |
| POST | `/approvals/:id/direct-approve` | approval-service | approvalService.ts | |
| GET | `/approvals/templates` | approval-service | approvalService.ts | |
| GET | `/approvals/templates/:id` | approval-service | approvalService.ts | |
| POST | `/approvals/templates` | approval-service | approvalService.ts | |
| PUT | `/approvals/templates/:id` | approval-service | approvalService.ts | |
| DELETE | `/approvals/templates/:id` | approval-service | approvalService.ts | |
| GET | `/approvals/delegations` | approval-service | approvalService.ts | |
| GET | `/approvals/delegations/:id` | approval-service | approvalService.ts | |
| POST | `/approvals/delegations` | approval-service | approvalService.ts | |
| PUT | `/approvals/delegations/:id` | approval-service | approvalService.ts | TODO: 위임 업데이트 구현 필요 |
| DELETE | `/approvals/delegations/:id` | approval-service | approvalService.ts | |
| POST | `/approvals/delegations/:id/cancel` | approval-service | approvalService.ts | |
| POST | `/approvals/delegations/:id/toggle-status` | approval-service | approvalService.ts | TODO: toggle-status 구현 필요 |
| GET | `/employees/search` | employee-service | approvalService.ts | 결재선 직원 검색 |

### 3.7 발령관리 (appointmentHandlers.ts) — 11개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/appointments/drafts` | appointment-service | appointmentService.ts | |
| GET | `/appointments/drafts/summary` | appointment-service | appointmentService.ts | |
| GET | `/appointments/drafts/:id` | appointment-service | appointmentService.ts | |
| POST | `/appointments/drafts` | appointment-service | appointmentService.ts | |
| PUT | `/appointments/drafts/:id` | appointment-service | appointmentService.ts | |
| DELETE | `/appointments/drafts/:id` | appointment-service | appointmentService.ts | |
| POST | `/appointments/drafts/:id/details` | appointment-service | appointmentService.ts | |
| DELETE | `/appointments/drafts/:draftId/details/:detailId` | appointment-service | appointmentService.ts | |
| POST | `/appointments/drafts/:id/submit` | appointment-service | appointmentService.ts | |
| POST | `/appointments/drafts/:id/execute` | appointment-service | appointmentService.ts | |
| POST | `/appointments/drafts/:id/cancel` | appointment-service | appointmentService.ts | |

### 3.8 기준정보 (mdmHandlers.ts) — 23개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/mdm/code-groups` | mdm-service | mdmService.ts | |
| GET | `/mdm/code-groups/:id` | mdm-service | mdmService.ts | |
| POST | `/mdm/code-groups` | mdm-service | mdmService.ts | |
| PUT | `/mdm/code-groups/:id` | mdm-service | mdmService.ts | |
| DELETE | `/mdm/code-groups/:id` | mdm-service | mdmService.ts | |
| PATCH | `/mdm/code-groups/:id/status` | mdm-service | mdmService.ts | |
| GET | `/mdm/common-codes` | mdm-service | mdmService.ts | |
| GET | `/mdm/common-codes/:id` | mdm-service | mdmService.ts | |
| GET | `/mdm/common-codes/group/:groupCode` | mdm-service | mdmService.ts | |
| POST | `/mdm/common-codes` | mdm-service | mdmService.ts | |
| PUT | `/mdm/common-codes/:id` | mdm-service | mdmService.ts | |
| DELETE | `/mdm/common-codes/:id` | mdm-service | mdmService.ts | |
| PATCH | `/mdm/common-codes/:id/status` | mdm-service | mdmService.ts | |
| POST | `/mdm/common-codes/check-duplicate` | mdm-service | mdmService.ts | |
| GET | `/mdm/common-codes/:id/impact` | mdm-service | mdmService.ts | |
| GET | `/mdm/common-codes/:id/history` | mdm-service | mdmService.ts | |
| GET | `/mdm/common-codes/search` | mdm-service | mdmService.ts | |
| GET | `/mdm/common-codes/tree` | mdm-service | mdmService.ts | |
| GET | `/mdm/common-codes/migration/preview` | mdm-service | mdmService.ts | |
| POST | `/mdm/common-codes/migrate` | mdm-service | mdmService.ts | |
| GET | `/mdm/tenant-codes` | mdm-service | mdmService.ts | |
| PUT | `/mdm/tenant-codes/:codeId` | mdm-service | mdmService.ts | |
| POST | `/mdm/tenant-codes/:codeId/reset` | mdm-service | mdmService.ts | |

### 3.9 테넌트 관리 (tenantHandlers.ts) — 18개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/tenants` | tenant-service | tenantService.ts | |
| GET | `/tenants/tree` | tenant-service | tenantService.ts | |
| GET | `/tenants/:id` | tenant-service | tenantService.ts | |
| GET | `/tenants/:id/subsidiaries` | tenant-service | tenantService.ts | |
| GET | `/tenants/:id/features` | tenant-service | tenantService.ts | |
| POST | `/tenants` | tenant-service | tenantService.ts | |
| PUT | `/tenants/:id` | tenant-service | tenantService.ts | |
| POST | `/tenants/:id/status` | tenant-service | tenantService.ts | |
| DELETE | `/tenants/:id` | tenant-service | tenantService.ts | |
| PUT | `/tenants/:id/policies/:policyType` | tenant-service | tenantService.ts | |
| PUT | `/tenants/:id/features/:code` | tenant-service | tenantService.ts | |
| POST | `/tenants/:id/branding/images` | tenant-service | tenantService.ts | |
| PUT | `/tenants/:id/branding` | tenant-service | tenantService.ts | |
| POST | `/tenants/:id/inherit-policies` | tenant-service | tenantService.ts | |
| PUT | `/tenants/:id/modules` | tenant-service | tenantService.ts | |
| GET | `/tenants/:id/policy-history` | tenant-service | tenantService.ts | |
| GET | `/tenants/:id/hierarchy` | tenant-service | tenantService.ts | |
| PUT | `/tenants/:id/hierarchy` | tenant-service | tenantService.ts | |

### 3.10 메뉴 관리 (menuHandlers.ts) — 14개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/menus/me` | gateway-service | menuService.ts | 사용자별 메뉴 |
| GET | `/admin/menus` | gateway-service | menuService.ts | 전체 메뉴 트리 |
| GET | `/admin/menus/flat` | gateway-service | menuService.ts | |
| GET | `/admin/menus/:id` | gateway-service | menuService.ts | |
| GET | `/admin/menus/code/:code` | gateway-service | menuService.ts | |
| POST | `/admin/menus` | gateway-service | menuService.ts | |
| PUT | `/admin/menus/:id` | gateway-service | menuService.ts | |
| DELETE | `/admin/menus/:id` | gateway-service | menuService.ts | |
| PATCH | `/admin/menus/reorder` | gateway-service | menuService.ts | |
| GET | `/tenants/:tid/menus/config` | tenant-service | menuService.ts | |
| GET | `/tenants/:tid/menus/:mid/config` | tenant-service | menuService.ts | |
| PUT | `/tenants/:tid/menus/:mid/config` | tenant-service | menuService.ts | |
| DELETE | `/tenants/:tid/menus/:mid/config` | tenant-service | menuService.ts | |
| DELETE | `/tenants/:tid/menus/config` | tenant-service | menuService.ts | 전체 초기화 |

### 3.11 공지사항 (announcementHandlers.ts) — 2개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/announcements` | notification-service | announcementService.ts | Mock에서는 2개만 구현, 서비스에서 5개 호출 |
| GET | `/announcements/:id` | notification-service | announcementService.ts | |

> **참고**: announcementService.ts에는 POST(작성), PUT(수정), DELETE(삭제) 엔드포인트 호출이 있으나 Mock 핸들러에는 GET 2개만 구현됨.

### 3.12 인사이동 (transferHandlers.ts) — 18개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/transfers` | employee-service | transferService.ts | |
| GET | `/transfers/summary` | employee-service | transferService.ts | |
| GET | `/transfers/available-tenants` | tenant-service | transferService.ts | |
| GET | `/transfers/tenants/:tid/departments` | organization-service | transferService.ts | |
| GET | `/transfers/tenants/:tid/positions` | organization-service | transferService.ts | |
| GET | `/transfers/tenants/:tid/grades` | organization-service | transferService.ts | |
| GET | `/transfers/:id` | employee-service | transferService.ts | |
| POST | `/transfers` | employee-service | transferService.ts | |
| PUT | `/transfers/:id` | employee-service | transferService.ts | |
| POST | `/transfers/:id/submit` | employee-service | transferService.ts | |
| POST | `/transfers/:id/approve-source` | employee-service | transferService.ts | |
| POST | `/transfers/:id/approve-target` | employee-service | transferService.ts | |
| POST | `/transfers/:id/reject` | employee-service | transferService.ts | |
| POST | `/transfers/:id/complete` | employee-service | transferService.ts | |
| POST | `/transfers/:id/cancel` | employee-service | transferService.ts | |
| DELETE | `/transfers/:id` | employee-service | transferService.ts | |
| GET | `/transfers/:tid/handover-items` | employee-service | transferService.ts | |
| POST | `/transfers/:tid/handover-items/:iid/complete` | employee-service | transferService.ts | |

### 3.13 알림 (notificationHandlers.ts) — 11개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/notifications/my` | notification-service | notificationService.ts | |
| GET | `/notifications/my/unread/count` | notification-service | notificationService.ts | |
| POST | `/notifications/:id/read` | notification-service | notificationService.ts | |
| POST | `/notifications/my/read-all` | notification-service | notificationService.ts | |
| DELETE | `/notifications/:id` | notification-service | notificationService.ts | TODO: 백엔드 구현 필요 |
| GET | `/notifications/settings` | notification-service | notificationService.ts | TODO: 백엔드 구현 필요 |
| PUT | `/notifications/settings` | notification-service | notificationService.ts | TODO: 백엔드 구현 필요 |
| POST | `/notifications/push/subscribe` | notification-service | (Mock 전용) | 웹 푸시 구독 |
| POST | `/notifications/push/unsubscribe` | notification-service | (Mock 전용) | |
| POST | `/notifications/push/resubscribe` | notification-service | (Mock 전용) | |
| POST | `/notifications/analytics/dismissed` | notification-service | (Mock 전용) | |

### 3.14 증명서 (certificateHandlers.ts) — 9개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/certificates/types` | certificate-service | certificateService.ts | |
| GET | `/certificates/types/:code` | certificate-service | certificateService.ts | |
| POST | `/certificates/requests` | certificate-service | certificateService.ts | |
| GET | `/certificates/requests/my` | certificate-service | certificateService.ts | |
| GET | `/certificates/requests/:id` | certificate-service | certificateService.ts | |
| POST | `/certificates/requests/:id/cancel` | certificate-service | certificateService.ts | |
| GET | `/certificates/issues/my` | certificate-service | certificateService.ts | |
| GET | `/certificates/issues/:issueNumber/download` | certificate-service | certificateService.ts | |
| GET | `/certificates/verify/:verificationCode` | certificate-service | certificateService.ts | |

### 3.15 채용관리 (recruitmentHandlers.ts) — 44개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/jobs` | recruitment-service | recruitmentService.ts | |
| GET | `/jobs/summary` | recruitment-service | recruitmentService.ts | |
| GET | `/jobs/:id` | recruitment-service | recruitmentService.ts | |
| POST | `/jobs` | recruitment-service | recruitmentService.ts | |
| PUT | `/jobs/:id` | recruitment-service | recruitmentService.ts | |
| DELETE | `/jobs/:id` | recruitment-service | recruitmentService.ts | |
| POST | `/jobs/:id/publish` | recruitment-service | recruitmentService.ts | |
| POST | `/jobs/:id/close` | recruitment-service | recruitmentService.ts | |
| POST | `/jobs/:id/complete` | recruitment-service | recruitmentService.ts | |
| GET | `/jobs/:jobId/applications` | recruitment-service | recruitmentService.ts | |
| GET | `/jobs/:jobId/applications/stages` | recruitment-service | recruitmentService.ts | |
| GET | `/applications` | recruitment-service | recruitmentService.ts | |
| GET | `/applications/summary` | recruitment-service | recruitmentService.ts | |
| GET | `/applications/:id` | recruitment-service | recruitmentService.ts | |
| POST | `/applications/:id/screen` | recruitment-service | recruitmentService.ts | |
| POST | `/applications/:id/reject` | recruitment-service | recruitmentService.ts | |
| POST | `/applications/:id/next-stage` | recruitment-service | recruitmentService.ts | |
| POST | `/applications/:id/hire` | recruitment-service | recruitmentService.ts | |
| POST | `/applications/:id/withdraw` | recruitment-service | recruitmentService.ts | |
| GET | `/applications/:aid/interviews` | recruitment-service | recruitmentService.ts | |
| GET | `/applications/:aid/offer` | recruitment-service | recruitmentService.ts | |
| GET | `/interviews` | recruitment-service | recruitmentService.ts | |
| GET | `/interviews/my` | recruitment-service | recruitmentService.ts | |
| GET | `/interviews/today` | recruitment-service | recruitmentService.ts | |
| GET | `/interviews/summary` | recruitment-service | recruitmentService.ts | |
| GET | `/interviews/:id` | recruitment-service | recruitmentService.ts | |
| POST | `/interviews` | recruitment-service | recruitmentService.ts | |
| PUT | `/interviews/:id` | recruitment-service | recruitmentService.ts | |
| PATCH | `/interviews/:id/status` | recruitment-service | recruitmentService.ts | |
| POST | `/interviews/:id/cancel` | recruitment-service | recruitmentService.ts | |
| POST | `/interviews/:id/confirm` | recruitment-service | recruitmentService.ts | |
| POST | `/interviews/:id/complete` | recruitment-service | recruitmentService.ts | |
| GET | `/interviews/:iid/scores` | recruitment-service | recruitmentService.ts | |
| POST | `/interviews/:iid/scores` | recruitment-service | recruitmentService.ts | |
| PUT | `/interviews/:iid/scores/:sid` | recruitment-service | recruitmentService.ts | |
| GET | `/interviews/:iid/scores/my` | recruitment-service | recruitmentService.ts | |
| GET | `/offers` | recruitment-service | recruitmentService.ts | |
| GET | `/offers/:id` | recruitment-service | recruitmentService.ts | |
| GET | `/offers/summary` | recruitment-service | recruitmentService.ts | |
| POST | `/offers` | recruitment-service | recruitmentService.ts | |
| PUT | `/offers/:id` | recruitment-service | recruitmentService.ts | |
| POST | `/offers/:id/send` | recruitment-service | recruitmentService.ts | |
| POST | `/offers/:id/respond` | recruitment-service | recruitmentService.ts | |
| POST | `/offers/:id/withdraw` | recruitment-service | recruitmentService.ts | |

### 3.16 감사 로그 (auditHandlers.ts) — 3개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/audit/logs` | gateway-service | auditService.ts | |
| GET | `/audit/logs/:id` | gateway-service | auditService.ts | |
| GET | `/audit/logs/export` | gateway-service | auditService.ts | CSV/Excel 내보내기 |

### 3.17 사원증 (employeeCardHandlers.ts) — 8개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/employee-cards` | employee-service | employeeCardService.ts | |
| GET | `/employee-cards/my` | employee-service | employeeCardService.ts | |
| GET | `/employee-cards/:id` | employee-service | employeeCardService.ts | |
| GET | `/employee-cards/issue-requests` | employee-service | employeeCardService.ts | |
| POST | `/employee-cards/issue-requests` | employee-service | employeeCardService.ts | |
| POST | `/employee-cards/issue-requests/:id/approve` | employee-service | employeeCardService.ts | |
| POST | `/employee-cards/report-lost` | employee-service | employeeCardService.ts | |
| POST | `/employee-cards/:id/revoke` | employee-service | employeeCardService.ts | |

### 3.18 프로필 (profileHandlers.ts) — 4개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/profile/me` | employee-service | profileService.ts | |
| PUT | `/profile/me` | employee-service | profileService.ts | |
| POST | `/profile/me/photo` | file-service | profileService.ts | |
| DELETE | `/profile/me/photo` | file-service | profileService.ts | |

### 3.19 도움말 (helpHandlers.ts) — 5개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| POST | `/help/inquiries` | notification-service | helpService.ts | |
| GET | `/help/inquiries/me` | notification-service | helpService.ts | |
| GET | `/help/inquiries/:id` | notification-service | helpService.ts | |
| POST | `/help/attachments` | file-service | helpService.ts | |
| DELETE | `/help/attachments/:id` | file-service | helpService.ts | |

### 3.20 파일 관리 (fileHandlers.ts) — 6개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/files` | file-service | fileService.ts | |
| GET | `/files/:id` | file-service | fileService.ts | |
| POST | `/files` | file-service | fileService.ts | 파일 업로드 |
| DELETE | `/files/:id` | file-service | fileService.ts | |
| GET | `/files/:id/download` | file-service | fileService.ts | |
| GET | `/files/:id/preview` | file-service | fileService.ts | 이미지 미리보기 |

### 3.21 경조비 (condolenceHandlers.ts) — 13개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/condolences` | employee-service | condolenceService.ts | |
| GET | `/condolences/policies` | employee-service | condolenceService.ts | |
| GET | `/condolences/:id` | employee-service | condolenceService.ts | |
| POST | `/condolences` | employee-service | condolenceService.ts | |
| PUT | `/condolences/:id` | employee-service | condolenceService.ts | |
| DELETE | `/condolences/:id` | employee-service | condolenceService.ts | |
| POST | `/condolences/:id/approve` | employee-service | condolenceService.ts | |
| POST | `/condolences/:id/reject` | employee-service | condolenceService.ts | |
| POST | `/condolences/:id/cancel` | employee-service | condolenceService.ts | |
| GET | `/condolences/payments/pending` | employee-service | condolenceService.ts | |
| POST | `/condolences/:id/pay` | employee-service | condolenceService.ts | |
| POST | `/condolences/payments/bulk` | employee-service | condolenceService.ts | |
| GET | `/condolences/payments/history` | employee-service | condolenceService.ts | |

### 3.22 정현원 (headcountHandlers.ts) — 13개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/headcounts/plans` | organization-service | headcountService.ts | |
| GET | `/headcounts/plans/:id` | organization-service | headcountService.ts | |
| POST | `/headcounts/plans` | organization-service | headcountService.ts | |
| PUT | `/headcounts/plans/:id` | organization-service | headcountService.ts | |
| DELETE | `/headcounts/plans/:id` | organization-service | headcountService.ts | |
| POST | `/headcounts/plans/:id/approve` | organization-service | headcountService.ts | |
| GET | `/headcounts/summary` | organization-service | headcountService.ts | |
| GET | `/headcounts/requests` | organization-service | headcountService.ts | |
| GET | `/headcounts/requests/:id` | organization-service | headcountService.ts | |
| POST | `/headcounts/requests` | organization-service | headcountService.ts | |
| POST | `/headcounts/requests/:id/approve` | organization-service | headcountService.ts | |
| POST | `/headcounts/requests/:id/reject` | organization-service | headcountService.ts | |
| POST | `/headcounts/requests/:id/cancel` | organization-service | headcountService.ts | |

### 3.23 위원회 (committeeHandlers.ts) — 4개

| Method | 엔드포인트 | 대응 백엔드 서비스 | 프론트 서비스 파일 | 비고 |
|--------|-----------|------------------|------------------|------|
| GET | `/committees` | organization-service | committeeService.ts | |
| GET | `/committees/:id` | organization-service | committeeService.ts | |
| GET | `/committees/:id/members` | organization-service | committeeService.ts | |
| POST | `/committees` | organization-service | committeeService.ts | |

> **참고**: committeeService.ts에는 PUT(수정), POST(위원 추가), DELETE(위원 삭제) 호출이 있으나 Mock 핸들러에는 GET 3개 + POST 1개만 구현됨.

### 엔드포인트 요약

| 핸들러 파일 | 엔드포인트 수 | 대응 백엔드 서비스 |
|------------|:----------:|-----------------|
| recruitmentHandlers.ts | 44 | recruitment-service |
| employeeHandlers.ts | 28 | employee-service |
| approvalHandlers.ts | 26 | approval-service |
| attendanceHandlers.ts | 25 | attendance-service |
| mdmHandlers.ts | 23 | mdm-service |
| tenantHandlers.ts | 18 | tenant-service |
| transferHandlers.ts | 18 | employee-service |
| organizationHandlers.ts | 16 | organization-service |
| menuHandlers.ts | 14 | gateway-service / tenant-service |
| condolenceHandlers.ts | 13 | employee-service |
| headcountHandlers.ts | 13 | organization-service |
| dashboardHandlers.ts | 11 | (다중 서비스) |
| appointmentHandlers.ts | 11 | appointment-service |
| notificationHandlers.ts | 11 | notification-service |
| certificateHandlers.ts | 9 | certificate-service |
| employeeCardHandlers.ts | 8 | employee-service |
| authHandlers.ts | 6 | auth-service |
| fileHandlers.ts | 6 | file-service |
| helpHandlers.ts | 5 | notification-service / file-service |
| profileHandlers.ts | 4 | employee-service / file-service |
| committeeHandlers.ts | 4 | organization-service |
| auditHandlers.ts | 3 | gateway-service |
| announcementHandlers.ts | 2 | notification-service |
| **합계** | **318** | |

---

## 4. PRD 대비 구현 현황

> PRD(`docs/PRD.md`) 기준 기능 요구사항 86건 (FR-* ID 기준)

### 4.1 구현 완료 (프론트엔드 UI + Mock API 존재)

| 카테고리 | 요구사항 ID | 구현 상태 |
|----------|-----------|----------|
| **테넌트 관리** | FR-TM-001-01 ~ 04 | ✅ 테넌트 등록/관리/상태/모듈 설정 UI 완료 |
| | FR-TM-002-01 ~ 04 | ✅ 정책 설정 UI 완료 (SettingsPage 내) |
| | FR-TM-002-05 | ✅ 자동 결재선 규칙 설정 (DelegationRulesPage) |
| | FR-TM-003-01 | ✅ 그룹 대시보드 (DashboardPage) |
| | FR-TM-003-03 | ✅ 계열사 인사이동 (TransferListPage 등) |
| **기준정보** | FR-MDM-001-01 ~ 04 | ✅ 공통코드 CRUD, 이력 조회 완료 |
| | FR-MDM-002-01 | ✅ 다단계 분류체계 (CodeTreePage) |
| | FR-MDM-002-03 | ✅ 코드 검색 (searchCodes) |
| **조직관리** | FR-ORG-001-01 ~ 03 | ✅ 조직 CRUD, 트리 시각화, 변경 이력 |
| | FR-ORG-002-01 ~ 03 | ✅ 보직/겸직 관리, 주/부 소속 구분 |
| | FR-ORG-003-01 ~ 02 | ✅ 직급/직책 분리 관리 |
| **인사정보** | FR-EMP-001-01 ~ 05 | ✅ 사원 CRUD, 일괄 등록, 인사기록카드, 내 정보 |
| | FR-EMP-002-01 ~ 03 | ✅ 마스킹, 열람 승인, 이력 관리 |
| | FR-EMP-002-04 | ✅ (백엔드 RLS 영역이나 프론트 마스킹 UI 구현) |
| | FR-EMP-003-02 | ✅ 퇴직 처리 UI (resign 엔드포인트) |
| | FR-EMP-004-01 ~ 02 | ✅ 가족 정보 관리 (직원 상세 내) |
| **근태/휴가** | FR-ATT-001-02 | ✅ 연차 잔여일수 조회 |
| | FR-ATT-002-01 ~ 06 | ✅ 휴가 신청/승인/캘린더 전체 구현 |
| | FR-ATT-003-01 ~ 02 | ✅ 휴가 유형 정의/조건 (SettingsPage 내) |
| **전자결재** | FR-APR-001-01 ~ 03 | ✅ 양식 관리, 문서 상신, 진행 상태 |
| | FR-APR-002-01 ~ 06 | ✅ 승인/반려, 순차/병렬/합의/전결/대결 |
| | FR-APR-003-01 ~ 03 | ✅ 결재선 자동 생성, 조건 분기, 위임전결 규칙 |
| | FR-APR-004-01 ~ 03 | ✅ 워크플로우 엔진, 히스토리, 연계 반영 |
| **알림** | FR-NTF-001-01 ~ 03 | ✅ 웹 푸시, 알림 센터, 읽음 관리 |
| **파일관리** | FR-FILE-001-01 ~ 04 | ✅ 업로드, 다운로드, 미리보기, 제한 설정 |

### 4.2 미구현 기능 (PRD에 있으나 프론트엔드에 없는 것)

| PRD 항목 | Phase | 우선순위 | 상태 | 설명 |
|----------|:-----:|---------|:----:|------|
| 통계/리포트 모듈 | 3 | - | **미구현** | `features/report/` 모듈 자체가 없음. `SDD_Report_Service.md`에 정형리포트, 리포트빌더, 스케줄링, 대시보드 위젯 정의됨 |
| FR-EMP-003-01 사번 생성 규칙 설정 | 1 | Must | **미구현** | 테넌트별 사번 자동생성 규칙 설정 UI 없음 |
| FR-EMP-003-03 재입사 시 사번 재활용 | 1 | Should | **미구현** | 사번 재활용 옵션 UI 없음 |
| FR-EMP-003-04 동명이인 식별/관리 | 1 | Should | **미구현** | 동명이인 검색/식별 UI 없음 |
| FR-EMP-004-03 가족 정보 수당 연계 | 1 | Should | **미구현** | 가족 정보→수당 연계 UI 없음 (급여는 Out of Scope이나 인터페이스 필요) |
| FR-ORG-003-03 직급별 호봉 체계 | 1 | Should | **미구현** | 호봉 체계 설정 UI 없음 |
| 조직 데이터 일괄 등록 | 1 | - | **미구현** | 조직 구조 Excel/CSV 벌크 임포트 없음 (직원 임포트만 존재) |
| 데이터 마이그레이션 도구 (PRD 3.4) | - | - | **미구현** | 조직/인사이력 마이그레이션 UI 없음 |
| FR-APR-001-04 관련 문서 링크 | 1 | Should | **미구현** | 결재 문서에 관련 문서 연결 기능 없음 |

### 4.3 부분 구현 (기능은 있으나 PRD 요건 일부 누락)

| PRD 항목 | 현재 상태 | 누락 사항 |
|----------|-----------|-----------|
| FR-ATT-001-01 연차 발생 규칙 | LeavePolicySettings에 포함 | 전용 관리 페이지 없음, 테넌트 정책에 임베딩됨 |
| FR-ATT-001-03 ~ 04 연차 이월/차등 규칙 | 정책 설정 내 존재 | 독립 관리 화면 없음 |
| FR-ATT-003-03 휴가 유형별 결재선 규칙 | 결재 양식에 유형 연동 | 유형별 세부 결재선 분기 UI 없음 |
| FR-TM-003-02 그룹 공통 정책 일괄 적용 | 정책 설정 UI 있음 | 계열사 일괄 적용 전용 UI 없음 |
| FR-ORG-001-04 조직 개편 영향도 | 조직 관리 UI 있음 | 개편 시 영향받는 직원 미리보기 없음 |
| FR-ORG-002-04 보직 발령→위원회 당연직 자동 업데이트 | 위원회 관리 UI 있음 | 발령 연동 자동화 없음 |
| FR-MDM-002-02 분류체계 영향도 시뮬레이션 | 코드 impact 조회 있음 | 시뮬레이션 UI 불완전 |
| FR-APR-003-04 기안자 결재선 수동 수정 | 결재 작성 UI 있음 | 결재선 수정 기능 제한적 |
| FR-NTF-001-04 ~ 05 이메일/SMS 알림 | Mock 핸들러에 push 관련 있음 | 이메일/SMS 발송 설정 UI 없음 |

### 4.4 서비스 파일 내 TODO 항목 (13건)

| 서비스 파일 | TODO 내용 | 관련 백엔드 서비스 |
|-------------|-----------|------------------|
| `approvalService.ts` | 위임 업데이트 PUT 엔드포인트 구현 필요 | approval-service |
| `approvalService.ts` | toggle-status 엔드포인트 구현 필요 | approval-service |
| `attendanceService.ts` | 휴가 캘린더 백엔드 엔드포인트 구현 필요 | attendance-service |
| `attendanceService.ts` | 근무시간 통계 엔드포인트 구현 필요 | attendance-service |
| `attendanceService.ts` | 근태 기록 PUT 엔드포인트 구현 필요 | attendance-service |
| `authService.ts` | 실제 테넌트 API 연동 시 수정 필요 | auth-service / tenant-service |
| `employeeService.ts` | 퇴직 취소 백엔드 엔드포인트 구현 필요 | employee-service |
| `notificationService.ts` | 단일 알림 조회 엔드포인트 구현 필요 | notification-service |
| `notificationService.ts` | 알림 삭제 엔드포인트 구현 필요 | notification-service |
| `notificationService.ts` | 여러 알림 벌크 삭제 엔드포인트 구현 필요 | notification-service |
| `notificationService.ts` | 알림 설정 조회 엔드포인트 구현 필요 | notification-service |
| `notificationService.ts` | 알림 설정 수정 엔드포인트 구현 필요 | notification-service |
| `organizationService.ts` | 조직 변경 이력 백엔드 엔드포인트 구현 필요 | organization-service |

---

## 5. 테스트 현황

### 5.1 E2E 테스트 (Playwright)

| 테스트 파일 | 커버 영역 |
|------------|----------|
| `e2e/auth.spec.ts` | 로그인/로그아웃 |
| `e2e/employee.spec.ts` | 직원 목록/상세 |
| `e2e/attendance.spec.ts` | 근태/휴가 |
| `e2e/approval.spec.ts` | 전자결재 |
| `e2e/organization.spec.ts` | 조직관리 |
| `e2e/notification.spec.ts` | 알림 |
| `e2e/settings.spec.ts` | 설정 |

**미커버 영역**: 채용관리, 발령관리, 증명서, 경조비, 사원증, 위원회, 인사이동, 정현원, 파일관리, MDM, 테넌트 관리, 감사 로그

### 5.2 Storybook 스토리 (15개)

| 스토리 파일 | 컴포넌트 |
|------------|----------|
| `components/ui/Button.stories.tsx` | Button |
| `components/ui/Card.stories.tsx` | Card |
| `components/common/StatusBadge.stories.tsx` | StatusBadge |
| `components/common/ConfirmDialog.stories.tsx` | ConfirmDialog |
| `components/common/MaskedField.stories.tsx` | MaskedField |
| `components/common/Pagination.stories.tsx` | Pagination |
| `components/common/EmptyState.stories.tsx` | EmptyState |
| `components/common/PageHeader.stories.tsx` | PageHeader |
| `components/common/DataTable/DataTable.stories.tsx` | DataTable |
| `components/common/FileUpload/FileUpload.stories.tsx` | FileUpload |
| `components/common/Form/FormField.stories.tsx` | FormField |
| `components/common/Form/ComboBox.stories.tsx` | ComboBox |
| `components/layout/Header/Header.stories.tsx` | Header |
| `components/layout/Sidebar/Sidebar.stories.tsx` | Sidebar |
| `features/auth/components/LoginForm.stories.tsx` | LoginForm |

> 공통 UI 컴포넌트 중심으로 스토리가 존재하며, 비즈니스 기능(features) 컴포넌트 스토리는 LoginForm 1개뿐임.

---

## 6. 백엔드 연동 우선순위 제안

### Phase 1: 인증 및 핵심 인프라 (최우선)

| 백엔드 서비스 | 프론트 엔드포인트 수 | 근거 |
|--------------|:----------------:|------|
| auth-service | 6 | 모든 API 호출의 전제 조건. Keycloak 연동 |
| tenant-service | 18 | 멀티테넌시 기반, 테넌트 컨텍스트 설정 |
| mdm-service | 23 | 공통코드는 모든 화면의 드롭다운/필터 데이터 |

### Phase 2: 핵심 데이터

| 백엔드 서비스 | 프론트 엔드포인트 수 | 근거 |
|--------------|:----------------:|------|
| employee-service | 28 + 8 + 4 | 인사정보 + 사원증 + 프로필 = 핵심 도메인 |
| organization-service | 16 + 13 | 조직관리 + 정현원 = 조직 구조 기반 |

### Phase 3: 업무 기능

| 백엔드 서비스 | 프론트 엔드포인트 수 | 근거 |
|--------------|:----------------:|------|
| attendance-service | 25 | 일상 업무 (출퇴근, 휴가) |
| approval-service | 26 | 전자결재 워크플로우 |

### Phase 4: 알림 및 파일

| 백엔드 서비스 | 프론트 엔드포인트 수 | 근거 |
|--------------|:----------------:|------|
| notification-service | 11 + 2 + 5 | 알림 + 공지 + 도움말 |
| file-service | 6 | 파일 업로드/다운로드 |
| gateway-service | 11 + 14 + 3 | 대시보드 + 메뉴 + 감사로그 |

### Phase 5: 확장 기능

| 백엔드 서비스 | 프론트 엔드포인트 수 | 근거 |
|--------------|:----------------:|------|
| recruitment-service | 44 | 채용관리 (Phase 2 PRD) |
| appointment-service | 11 | 발령관리 (Phase 2 PRD) |
| certificate-service | 9 | 증명서 발급 (Phase 2 PRD) |
| (경조비/인사이동/정현원/위원회) | 13+18+13+4 | employee/org 서비스에 포함 |

### Phase 6: 분석 (신규 개발 필요)

| 백엔드 서비스 | 프론트 엔드포인트 수 | 근거 |
|--------------|:----------------:|------|
| report-service | **신규** | 프론트엔드 모듈 자체를 새로 개발해야 함 (Phase 3 PRD) |

---

## 부록: 파일 경로 참조

- **라우트 설정**: `frontend/apps/web/src/routes/config.ts`
- **라우트 렌더링**: `frontend/apps/web/src/routes/index.tsx`
- **Mock 핸들러**: `frontend/apps/web/src/mocks/handlers/`
- **서비스 파일**: `frontend/apps/web/src/features/*/services/*Service.ts`
- **E2E 테스트**: `frontend/apps/web/e2e/`
- **Storybook 설정**: `frontend/apps/web/.storybook/`
- **PRD**: `docs/PRD.md`
