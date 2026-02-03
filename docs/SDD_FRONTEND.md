# SDD: Frontend Application (프론트엔드 애플리케이션)

**문서 버전**: 1.0  
**작성일**: 2025-02-03  
**애플리케이션명**: hr-platform-web  
**Phase**: Phase 1 (MVP)

---

## 목차

1. [개요](#1-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [아키텍처](#4-아키텍처)
5. [라우팅 구조](#5-라우팅-구조)
6. [상태 관리](#6-상태-관리)
7. [컴포넌트 아키텍처](#7-컴포넌트-아키텍처)
8. [페이지별 상세 설계](#8-페이지별-상세-설계)
9. [API 연동](#9-api-연동)
10. [인증 및 인가](#10-인증-및-인가)
11. [스타일링 시스템](#11-스타일링-시스템)
12. [국제화 (i18n)](#12-국제화-i18n)
13. [실시간 기능](#13-실시간-기능)
14. [성능 최적화](#14-성능-최적화)
15. [테스트 전략](#15-테스트-전략)
16. [배포 설정](#16-배포-설정)

---

## 1. 개요

### 1.1 목적

HR SaaS Platform의 웹 프론트엔드 애플리케이션으로, 대기업 그룹사 및 계열사의 HR 담당자와 일반 직원이 사용하는 반응형 웹 애플리케이션입니다.

### 1.2 주요 특징

| 특징 | 설명 |
|------|------|
| **멀티테넌트 지원** | 계열사별 브랜딩, 정책 기반 UI 동적 구성 |
| **역할 기반 UI** | 7개 역할에 따른 메뉴/기능 접근 제어 |
| **커스터마이징** | 드래그앤드롭 위젯 대시보드 |
| **실시간 알림** | WebSocket 기반 실시간 알림 |
| **다국어 지원** | 한국어/영어 (i18n) |
| **다크 모드** | 시스템 연동 + 수동 전환 |
| **반응형** | Desktop First, 모바일 최적화 |

### 1.3 지원 브라우저

| 브라우저 | 최소 버전 |
|----------|----------|
| Chrome | 최신 2개 버전 |
| Edge | 최신 2개 버전 |
| Safari | 최신 2개 버전 |
| Firefox | 최신 2개 버전 |

---

## 2. 기술 스택

### 2.1 Core

| 구분 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **Language** | TypeScript | 5.x | 타입 안전성 |
| **Framework** | React | 18.x | UI 라이브러리 |
| **Build Tool** | Vite | 5.x | 빌드 및 개발 서버 |
| **Package Manager** | pnpm | 8.x | 패키지 관리 |

### 2.2 상태 관리 & 데이터

| 구분 | 기술 | 용도 |
|------|------|------|
| **Client State** | Zustand | 전역 상태 관리 |
| **Server State** | TanStack Query | API 캐싱, 동기화 |
| **Form** | React Hook Form + Zod | 폼 관리, 유효성 검증 |

### 2.3 라우팅 & 네비게이션

| 구분 | 기술 | 용도 |
|------|------|------|
| **Router** | React Router v6 | SPA 라우팅 |

### 2.4 UI & 스타일링

| 구분 | 기술 | 용도 |
|------|------|------|
| **UI Components** | shadcn/ui | 기본 UI 컴포넌트 |
| **Styling** | TailwindCSS | 유틸리티 CSS |
| **Icons** | Lucide React | 아이콘 |
| **Animation** | Framer Motion | 애니메이션 |

### 2.5 시각화 & 차트

| 구분 | 기술 | 용도 |
|------|------|------|
| **Charts** | Recharts | 통계 차트 |
| **Org Chart** | React Flow | 조직도 시각화 |
| **Calendar** | React Big Calendar | 휴가 캘린더 |
| **Gantt** | Frappe Gantt / dhtmlx | 팀 휴가 Gantt |
| **Workflow** | React Flow | 결재 플로우차트 |

### 2.6 유틸리티

| 구분 | 기술 | 용도 |
|------|------|------|
| **Date** | date-fns | 날짜 처리 |
| **i18n** | react-i18next | 다국어 |
| **HTTP** | Axios | API 통신 |
| **WebSocket** | Socket.io-client | 실시간 통신 |
| **Excel** | SheetJS (xlsx) | 엑셀 내보내기 |
| **PDF** | react-to-print | 인쇄 |
| **Image Crop** | react-image-crop | 이미지 크롭 |
| **DnD** | @dnd-kit | 드래그앤드롭 |
| **Tour** | react-joyride | 온보딩 투어 |

### 2.7 개발 도구

| 구분 | 기술 | 용도 |
|------|------|------|
| **Linting** | ESLint | 코드 품질 |
| **Formatting** | Prettier | 코드 포맷팅 |
| **Testing** | Vitest + Testing Library | 단위/통합 테스트 |
| **E2E** | Playwright | E2E 테스트 |
| **Storybook** | Storybook | 컴포넌트 문서화 |

---

## 3. 프로젝트 구조

### 3.1 전체 프로젝트 구조

```
hr-platform/
├── frontend/                         # ⭐ 프론트엔드 모노레포
│   ├── apps/
│   │   └── web/                      # React 웹 애플리케이션
│   ├── packages/
│   │   ├── ui/                       # 공통 UI 컴포넌트
│   │   ├── shared-types/             # API 타입 정의
│   │   └── eslint-config/            # ESLint 설정
│   ├── pnpm-workspace.yaml
│   ├── turbo.json
│   ├── package.json
│   └── tsconfig.base.json
│
├── services/                         # 백엔드 마이크로서비스
│   ├── gateway-service/
│   ├── auth-service/
│   ├── tenant-service/
│   ├── organization-service/
│   ├── employee-service/
│   ├── attendance-service/
│   ├── approval-service/
│   ├── mdm-service/
│   ├── notification-service/
│   └── file-service/
│
├── common/                           # 백엔드 공통 모듈
│   ├── common-core/
│   ├── common-entity/
│   ├── common-response/
│   └── ...
│
├── infra/                            # 인프라 서비스
│   └── config-server/
│
├── docker/                           # Docker 설정
├── config/                           # 백엔드 설정
├── scripts/                          # 유틸리티 스크립트
├── docs/                             # 문서
│
├── build.gradle                      # 백엔드 Gradle 설정
├── settings.gradle
└── README.md
```

### 3.2 프론트엔드 상세 구조

```
frontend/
├── apps/
│   └── web/                          # React 웹 애플리케이션
│       ├── public/
│       │   ├── locales/              # i18n 번역 파일
│       │   │   ├── ko/
│       │   │   │   ├── common.json
│       │   │   │   ├── auth.json
│       │   │   │   ├── employee.json
│       │   │   │   └── ...
│       │   │   └── en/
│       │   │       └── ...
│       │   ├── images/
│       │   └── favicon.ico
│       ├── src/
│       │   ├── app/                  # App 진입점
│       │   │   ├── App.tsx
│       │   │   ├── providers.tsx     # Context Providers
│       │   │   └── main.tsx
│       │   ├── assets/               # 정적 자산
│       │   │   ├── icons/
│       │   │   └── illustrations/
│       │   ├── components/           # 공통 컴포넌트
│       │   │   ├── ui/               # shadcn/ui
│       │   │   ├── common/           # 커스텀 공통
│       │   │   └── layout/           # 레이아웃
│       │   ├── features/             # 기능별 모듈
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── tenant/
│       │   │   ├── organization/
│       │   │   ├── employee/
│       │   │   ├── attendance/
│       │   │   ├── approval/
│       │   │   ├── notification/
│       │   │   ├── settings/
│       │   │   ├── mdm/
│       │   │   ├── audit/
│       │   │   └── help/
│       │   ├── hooks/                # 전역 커스텀 훅
│       │   │   ├── useMediaQuery.ts
│       │   │   ├── useDebounce.ts
│       │   │   └── useLocalStorage.ts
│       │   ├── lib/                  # 유틸리티, 설정
│       │   │   ├── apiClient.ts
│       │   │   ├── queryClient.ts
│       │   │   ├── websocket.ts
│       │   │   ├── i18n.ts
│       │   │   ├── branding.ts
│       │   │   ├── theme.ts
│       │   │   └── utils.ts
│       │   ├── routes/               # 라우팅 설정
│       │   │   ├── index.tsx
│       │   │   ├── routes.tsx
│       │   │   └── guards/
│       │   ├── stores/               # Zustand 스토어
│       │   │   ├── authStore.ts
│       │   │   ├── tenantStore.ts
│       │   │   ├── uiStore.ts
│       │   │   ├── notificationStore.ts
│       │   │   └── dashboardStore.ts
│       │   ├── styles/               # 전역 스타일
│       │   │   ├── globals.css
│       │   │   └── fonts.css
│       │   └── types/                # TypeScript 타입
│       │       ├── api.ts
│       │       ├── auth.ts
│       │       ├── employee.ts
│       │       └── index.ts
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── components.json           # shadcn/ui 설정
│       └── package.json
│
├── packages/
│   ├── ui/                           # 공통 UI 컴포넌트 라이브러리
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-types/                 # API 타입 정의 (백엔드와 공유 가능)
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── common.ts         # 공통 응답 타입
│   │   │   │   ├── employee.ts
│   │   │   │   ├── organization.ts
│   │   │   │   ├── approval.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── eslint-config/                # 공유 ESLint 설정
│       ├── base.js
│       ├── react.js
│       └── package.json
│
├── .gitignore
├── .npmrc
├── pnpm-workspace.yaml               # pnpm 워크스페이스 설정
├── turbo.json                        # Turborepo 설정
├── package.json                      # 루트 package.json
├── tsconfig.base.json                # 기본 TypeScript 설정
└── README.md
```

### 3.2 Feature 모듈 구조

```
src/features/
├── auth/                             # 인증
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── PasswordChangeForm.tsx
│   │   └── SessionExpiredDialog.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   └── LogoutPage.tsx
│   ├── services/
│   │   └── authService.ts
│   └── index.ts
│
├── dashboard/                        # 대시보드
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── AttendanceWidget.tsx
│   │   │   ├── LeaveBalanceWidget.tsx
│   │   │   ├── PendingApprovalsWidget.tsx
│   │   │   ├── TeamLeaveWidget.tsx
│   │   │   ├── OrgSummaryWidget.tsx
│   │   │   └── WidgetContainer.tsx
│   │   ├── DashboardGrid.tsx
│   │   └── WidgetCustomizer.tsx
│   ├── hooks/
│   │   └── useDashboard.ts
│   ├── pages/
│   │   └── DashboardPage.tsx
│   └── index.ts
│
├── tenant/                           # 테넌트 관리
│   ├── components/
│   │   ├── TenantSelector.tsx
│   │   ├── TenantCard.tsx
│   │   ├── TenantForm.tsx
│   │   ├── PolicySettings.tsx
│   │   └── BrandingSettings.tsx
│   ├── pages/
│   │   ├── TenantListPage.tsx
│   │   ├── TenantDetailPage.tsx
│   │   └── TenantComparisonPage.tsx
│   └── index.ts
│
├── organization/                     # 조직 관리
│   ├── components/
│   │   ├── OrgChart/
│   │   │   ├── OrgChartView.tsx
│   │   │   ├── OrgChartNode.tsx
│   │   │   ├── OrgChartEdge.tsx
│   │   │   └── OrgChartControls.tsx
│   │   ├── OrgTreeView.tsx
│   │   ├── OrgTableView.tsx
│   │   ├── DepartmentForm.tsx
│   │   ├── GradeList.tsx
│   │   ├── PositionList.tsx
│   │   └── OrgHistoryTimeline.tsx
│   ├── pages/
│   │   ├── OrgChartPage.tsx
│   │   ├── DepartmentListPage.tsx
│   │   ├── GradeManagePage.tsx
│   │   └── PositionManagePage.tsx
│   └── index.ts
│
├── employee/                         # 인사정보
│   ├── components/
│   │   ├── EmployeeCard.tsx
│   │   ├── EmployeeForm.tsx
│   │   ├── EmployeeDetail/
│   │   │   ├── BasicInfo.tsx
│   │   │   ├── FamilyInfo.tsx
│   │   │   ├── CareerInfo.tsx
│   │   │   ├── EducationInfo.tsx
│   │   │   └── CertificateInfo.tsx
│   │   ├── EmployeeSearch.tsx
│   │   ├── ProfileImageUpload.tsx
│   │   ├── MaskedField.tsx
│   │   ├── ChangeRequestForm.tsx
│   │   └── PersonnelCard.tsx
│   ├── pages/
│   │   ├── EmployeeListPage.tsx
│   │   ├── EmployeeDetailPage.tsx
│   │   ├── EmployeeCreatePage.tsx
│   │   └── MyInfoPage.tsx
│   └── index.ts
│
├── attendance/                       # 근태/휴가
│   ├── components/
│   │   ├── CheckInOutButton.tsx
│   │   ├── AttendanceCalendar.tsx
│   │   ├── LeaveRequestForm.tsx
│   │   ├── LeaveBalanceCard.tsx
│   │   ├── LeaveCalendar/
│   │   │   ├── MonthView.tsx
│   │   │   ├── WeekView.tsx
│   │   │   ├── DayView.tsx
│   │   │   └── GanttView.tsx
│   │   ├── TeamLeaveStatus.tsx
│   │   └── OvertimeRequestForm.tsx
│   ├── pages/
│   │   ├── AttendancePage.tsx
│   │   ├── LeaveRequestPage.tsx
│   │   ├── LeaveCalendarPage.tsx
│   │   ├── MyLeavePage.tsx
│   │   └── OvertimePage.tsx
│   └── index.ts
│
├── approval/                         # 전자결재
│   ├── components/
│   │   ├── ApprovalList.tsx
│   │   ├── ApprovalDetail.tsx
│   │   ├── ApprovalForm.tsx
│   │   ├── ApprovalLine/
│   │   │   ├── ApprovalLineBuilder.tsx
│   │   │   ├── ApprovalLineFlow.tsx
│   │   │   ├── ApproverSelector.tsx
│   │   │   └── ApprovalStepIndicator.tsx
│   │   ├── DocumentTemplateSelector.tsx
│   │   ├── ApprovalActions.tsx
│   │   ├── ApprovalHistory.tsx
│   │   └── DelegationSettings.tsx
│   ├── pages/
│   │   ├── ApprovalListPage.tsx
│   │   ├── ApprovalDetailPage.tsx
│   │   ├── ApprovalCreatePage.tsx
│   │   ├── MyApprovalsPage.tsx
│   │   └── DelegationPage.tsx
│   └── index.ts
│
├── notification/                     # 알림
│   ├── components/
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationDropdown.tsx
│   │   ├── NotificationItem.tsx
│   │   ├── NotificationGroup.tsx
│   │   └── NotificationSettings.tsx
│   ├── hooks/
│   │   └── useNotification.ts
│   ├── pages/
│   │   └── NotificationCenterPage.tsx
│   └── index.ts
│
├── settings/                         # 설정
│   ├── components/
│   │   ├── ProfileSettings.tsx
│   │   ├── PasswordChange.tsx
│   │   ├── NotificationPreferences.tsx
│   │   ├── LanguageSettings.tsx
│   │   ├── ThemeSettings.tsx
│   │   └── SessionManager.tsx
│   ├── pages/
│   │   └── SettingsPage.tsx
│   └── index.ts
│
├── mdm/                              # 기준정보
│   ├── components/
│   │   ├── CodeGroupList.tsx
│   │   ├── CommonCodeList.tsx
│   │   └── CodeForm.tsx
│   ├── pages/
│   │   ├── CodeGroupPage.tsx
│   │   └── CommonCodePage.tsx
│   └── index.ts
│
├── audit/                            # 감사 로그
│   ├── components/
│   │   ├── AuditTimeline.tsx
│   │   ├── AuditFilter.tsx
│   │   └── AuditDetail.tsx
│   ├── pages/
│   │   └── AuditLogPage.tsx
│   └── index.ts
│
└── help/                             # 도움말
    ├── components/
    │   ├── OnboardingTour.tsx
    │   ├── HelpPanel.tsx
    │   └── HelpArticle.tsx
    └── index.ts
```

### 3.3 공통 컴포넌트 구조

```
src/components/
├── ui/                               # shadcn/ui 기반 컴포넌트
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── table.tsx
│   ├── toast.tsx
│   └── ...
│
├── common/                           # 커스텀 공통 컴포넌트
│   ├── DataTable/
│   │   ├── DataTable.tsx
│   │   ├── DataTablePagination.tsx
│   │   ├── DataTableFilter.tsx
│   │   ├── DataTableExport.tsx
│   │   └── DataTableSkeleton.tsx
│   ├── FileUpload/
│   │   ├── FileUpload.tsx
│   │   ├── ImageUpload.tsx
│   │   ├── ImageCropper.tsx
│   │   └── FilePreview.tsx
│   ├── Search/
│   │   ├── GlobalSearch.tsx
│   │   ├── SearchInput.tsx
│   │   └── SearchResults.tsx
│   ├── Empty/
│   │   ├── EmptyState.tsx
│   │   └── illustrations/
│   ├── Loading/
│   │   ├── PageLoader.tsx
│   │   ├── Skeleton.tsx
│   │   └── SpinnerOverlay.tsx
│   ├── Error/
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorPage.tsx
│   │   └── ErrorToast.tsx
│   ├── Form/
│   │   ├── FormField.tsx
│   │   ├── FormSection.tsx
│   │   ├── DatePicker.tsx
│   │   ├── TimePicker.tsx
│   │   ├── DateRangePicker.tsx
│   │   └── ComboBox.tsx
│   ├── Lightbox.tsx
│   ├── ConfirmDialog.tsx
│   ├── PageHeader.tsx
│   └── StatusBadge.tsx
│
└── layout/                           # 레이아웃 관련
    ├── Header/
    │   ├── Header.tsx
    │   ├── TenantSwitcher.tsx
    │   ├── UserMenu.tsx
    │   └── ThemeToggle.tsx
    ├── Sidebar/
    │   ├── Sidebar.tsx
    │   ├── SidebarNav.tsx
    │   └── SidebarItem.tsx
    ├── MobileNav/
    │   └── BottomTabBar.tsx
    └── MainLayout.tsx
```

---

## 4. 아키텍처

### 4.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Browser                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    React Application (SPA)                              ││
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐  ││
│  │  │   Pages    │ │ Components │ │   Hooks    │ │  State (Zustand)   │  ││
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘  ││
│  │                              │                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │              TanStack Query (Server State Cache)                │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │                              │                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │                    API Service Layer (Axios)                     │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Spring Cloud Gateway (BFF)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  OAuth2 Client  │  │  Session Mgmt   │  │     API Routing             │ │
│  │  (Keycloak)     │  │  (Redis)        │  │     Rate Limiting           │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Microservices                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 BFF 인증 플로우

```
┌──────────┐     ┌─────────────┐     ┌──────────┐     ┌──────────────┐
│  Browser │     │   Gateway   │     │   Redis  │     │   Keycloak   │
└────┬─────┘     └──────┬──────┘     └────┬─────┘     └──────┬───────┘
     │                  │                 │                   │
     │ 1. Login Request │                 │                   │
     │─────────────────>│                 │                   │
     │                  │ 2. Redirect to Keycloak             │
     │                  │────────────────────────────────────>│
     │                  │                 │                   │
     │                  │ 3. Auth Code    │                   │
     │                  │<────────────────────────────────────│
     │                  │                 │                   │
     │                  │ 4. Exchange Code for Token          │
     │                  │────────────────────────────────────>│
     │                  │                 │                   │
     │                  │ 5. Access Token + Refresh Token     │
     │                  │<────────────────────────────────────│
     │                  │                 │                   │
     │                  │ 6. Store Tokens │                   │
     │                  │────────────────>│                   │
     │                  │                 │                   │
     │ 7. Set HttpOnly Cookie (Session)   │                   │
     │<─────────────────│                 │                   │
     │                  │                 │                   │
     │ 8. API Request   │                 │                   │
     │─────────────────>│                 │                   │
     │                  │ 9. Get Token    │                   │
     │                  │────────────────>│                   │
     │                  │                 │                   │
     │                  │ 10. Forward with Bearer Token       │
     │                  │──────────────────────────────────────────>
```

### 4.3 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                        Component                                 │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │  UI State       │     │  Server State (TanStack Query)  │   │
│  │  (useState)     │     │  - useQuery (조회)              │   │
│  └─────────────────┘     │  - useMutation (변경)           │   │
│                          └──────────────┬──────────────────┘   │
└─────────────────────────────────────────┼───────────────────────┘
                                          │
                          ┌───────────────┴───────────────┐
                          ▼                               ▼
              ┌─────────────────────┐       ┌─────────────────────┐
              │  API Service        │       │  Zustand Store      │
              │  (Axios Instance)   │       │  (Global State)     │
              │                     │       │  - User Info        │
              │  - Request/Response │       │  - Tenant Context   │
              │  - Error Handling   │       │  - UI Preferences   │
              │  - Interceptors     │       │  - Notifications    │
              └──────────┬──────────┘       └─────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Gateway (Backend)  │
              └─────────────────────┘
```

---

## 5. 라우팅 구조

### 5.1 라우트 정의

```typescript
// src/routes/index.tsx

const routes = [
    // 공개 라우트 (인증 불필요)
    {
        path: '/login',
        element: <LoginPage />,
        public: true,
    },
    {
        path: '/logout',
        element: <LogoutPage />,
        public: true,
    },

    // 보호된 라우트 (인증 필요)
    {
        path: '/',
        element: <MainLayout />,
        children: [
            // 대시보드
            { index: true, element: <Navigate to="/dashboard" /> },
            { path: 'dashboard', element: <DashboardPage /> },

            // 테넌트 관리 (SUPER_ADMIN, GROUP_ADMIN)
            {
                path: 'tenants',
                children: [
                    { index: true, element: <TenantListPage /> },
                    { path: ':tenantId', element: <TenantDetailPage /> },
                    { path: 'compare', element: <TenantComparisonPage /> },
                ],
                roles: ['SUPER_ADMIN', 'GROUP_ADMIN'],
            },

            // 조직 관리
            {
                path: 'organization',
                children: [
                    { index: true, element: <OrgChartPage /> },
                    { path: 'departments', element: <DepartmentListPage /> },
                    { path: 'grades', element: <GradeManagePage /> },
                    { path: 'positions', element: <PositionManagePage /> },
                ],
                roles: ['TENANT_ADMIN', 'HR_MANAGER'],
            },

            // 인사정보
            {
                path: 'employees',
                children: [
                    { index: true, element: <EmployeeListPage /> },
                    { path: 'new', element: <EmployeeCreatePage /> },
                    { path: ':employeeId', element: <EmployeeDetailPage /> },
                ],
                roles: ['TENANT_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'TEAM_LEADER'],
            },

            // 내 정보 (전체)
            { path: 'my-info', element: <MyInfoPage /> },

            // 근태/휴가
            {
                path: 'attendance',
                children: [
                    { index: true, element: <AttendancePage /> },
                    { path: 'leave', element: <LeaveRequestPage /> },
                    { path: 'leave/calendar', element: <LeaveCalendarPage /> },
                    { path: 'my-leave', element: <MyLeavePage /> },
                    { path: 'overtime', element: <OvertimePage /> },
                ],
            },

            // 전자결재
            {
                path: 'approvals',
                children: [
                    { index: true, element: <ApprovalListPage /> },
                    { path: 'new', element: <ApprovalCreatePage /> },
                    { path: ':approvalId', element: <ApprovalDetailPage /> },
                    { path: 'my', element: <MyApprovalsPage /> },
                    { path: 'delegation', element: <DelegationPage /> },
                ],
            },

            // 기준정보 (MDM)
            {
                path: 'mdm',
                children: [
                    { path: 'code-groups', element: <CodeGroupPage /> },
                    { path: 'codes', element: <CommonCodePage /> },
                ],
                roles: ['TENANT_ADMIN', 'HR_MANAGER'],
            },

            // 설정
            { path: 'settings', element: <SettingsPage /> },

            // 알림 센터
            { path: 'notifications', element: <NotificationCenterPage /> },

            // 감사 로그 (관리자)
            {
                path: 'audit',
                element: <AuditLogPage />,
                roles: ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN'],
            },
        ],
    },

    // 에러 페이지
    { path: '/403', element: <ForbiddenPage /> },
    { path: '/404', element: <NotFoundPage /> },
    { path: '/500', element: <ServerErrorPage /> },
    { path: '*', element: <Navigate to="/404" /> },
];
```

### 5.2 라우트 가드

```typescript
// src/routes/guards/AuthGuard.tsx

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

// src/routes/guards/RoleGuard.tsx

export const RoleGuard: React.FC<{
    children: React.ReactNode;
    allowedRoles: Role[];
}> = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    if (!user || !allowedRoles.some(role => user.roles.includes(role))) {
        return <Navigate to="/403" replace />;
    }

    return <>{children}</>;
};
```

### 5.3 URL 구조

| 경로 | 페이지 | 접근 권한 |
|------|--------|----------|
| `/login` | 로그인 | 공개 |
| `/dashboard` | 대시보드 | 전체 |
| `/tenants` | 테넌트 목록 | SUPER_ADMIN, GROUP_ADMIN |
| `/tenants/:id` | 테넌트 상세 | SUPER_ADMIN, GROUP_ADMIN |
| `/tenants/compare` | 테넌트 비교 | GROUP_ADMIN |
| `/organization` | 조직도 | 전체 (조회), HR (수정) |
| `/organization/departments` | 부서 관리 | HR |
| `/organization/grades` | 직급 관리 | HR |
| `/organization/positions` | 직책 관리 | HR |
| `/employees` | 직원 목록 | HR, 팀장 이상 |
| `/employees/new` | 직원 등록 | HR |
| `/employees/:id` | 직원 상세 | HR, 해당 부서 관리자 |
| `/my-info` | 내 정보 | 전체 |
| `/attendance` | 출퇴근 | 전체 |
| `/attendance/leave` | 휴가 신청 | 전체 |
| `/attendance/leave/calendar` | 휴가 캘린더 | 전체 |
| `/attendance/my-leave` | 내 휴가 | 전체 |
| `/approvals` | 결재 목록 | 전체 |
| `/approvals/new` | 결재 작성 | 전체 |
| `/approvals/:id` | 결재 상세 | 관련자 |
| `/settings` | 설정 | 전체 |
| `/audit` | 감사 로그 | 관리자 |

---

## 6. 상태 관리

### 6.1 Zustand 스토어 구조

```typescript
// src/stores/index.ts

// 1. 인증 스토어
interface AuthStore {
    user: User | null;
    isAuthenticated: boolean;
    permissions: string[];
    setUser: (user: User | null) => void;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: Role) => boolean;
}

// 2. 테넌트 스토어
interface TenantStore {
    currentTenant: Tenant | null;
    availableTenants: Tenant[];
    setCurrentTenant: (tenant: Tenant) => void;
    setAvailableTenants: (tenants: Tenant[]) => void;
}

// 3. UI 스토어
interface UIStore {
    sidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system';
    language: 'ko' | 'en';
    toggleSidebar: () => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setLanguage: (language: 'ko' | 'en') => void;
}

// 4. 알림 스토어
interface NotificationStore {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

// 5. 대시보드 스토어
interface DashboardStore {
    widgets: WidgetConfig[];
    setWidgets: (widgets: WidgetConfig[]) => void;
    addWidget: (widget: WidgetConfig) => void;
    removeWidget: (widgetId: string) => void;
    reorderWidgets: (newOrder: string[]) => void;
}
```

### 6.2 스토어 구현 예시

```typescript
// src/stores/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            permissions: [],

            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                permissions: user?.permissions || [],
            }),

            logout: () => set({
                user: null,
                isAuthenticated: false,
                permissions: [],
            }),

            hasPermission: (permission) => {
                return get().permissions.includes(permission);
            },

            hasRole: (role) => {
                return get().user?.roles.includes(role) || false;
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
);
```

### 6.3 TanStack Query 설정

```typescript
// src/lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5분
            gcTime: 1000 * 60 * 30, // 30분
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});

// Query Keys Factory
export const queryKeys = {
    // 테넌트
    tenants: {
        all: ['tenants'] as const,
        lists: () => [...queryKeys.tenants.all, 'list'] as const,
        list: (filters: TenantFilters) => [...queryKeys.tenants.lists(), filters] as const,
        details: () => [...queryKeys.tenants.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.tenants.details(), id] as const,
    },

    // 직원
    employees: {
        all: ['employees'] as const,
        lists: () => [...queryKeys.employees.all, 'list'] as const,
        list: (filters: EmployeeFilters) => [...queryKeys.employees.lists(), filters] as const,
        details: () => [...queryKeys.employees.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.employees.details(), id] as const,
    },

    // 조직
    organization: {
        tree: (tenantId: string) => ['organization', 'tree', tenantId] as const,
        departments: (tenantId: string) => ['organization', 'departments', tenantId] as const,
        grades: (tenantId: string) => ['organization', 'grades', tenantId] as const,
        positions: (tenantId: string) => ['organization', 'positions', tenantId] as const,
    },

    // 결재
    approvals: {
        all: ['approvals'] as const,
        pending: () => [...queryKeys.approvals.all, 'pending'] as const,
        my: () => [...queryKeys.approvals.all, 'my'] as const,
        detail: (id: string) => [...queryKeys.approvals.all, 'detail', id] as const,
    },

    // 휴가
    leaves: {
        balance: (employeeId: string, year: number) =>
            ['leaves', 'balance', employeeId, year] as const,
        requests: (filters: LeaveFilters) => ['leaves', 'requests', filters] as const,
        calendar: (year: number, month: number) =>
            ['leaves', 'calendar', year, month] as const,
    },

    // 알림
    notifications: {
        all: ['notifications'] as const,
        unreadCount: () => [...queryKeys.notifications.all, 'unread'] as const,
    },
};
```

---

## 7. 컴포넌트 아키텍처

### 7.1 컴포넌트 분류

```
┌─────────────────────────────────────────────────────────────────┐
│                      Component Hierarchy                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Pages (페이지 컴포넌트)                                    ││
│  │ - 라우트와 1:1 매핑                                        ││
│  │ - 데이터 페칭 로직 포함                                    ││
│  │ - 레이아웃 조합                                            ││
│  └────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Feature Components (기능 컴포넌트)                          ││
│  │ - 특정 도메인/기능 담당                                     ││
│  │ - 비즈니스 로직 포함                                        ││
│  │ - features/ 디렉토리에 위치                                 ││
│  └────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ Common Components (공통 컴포넌트)                           ││
│  │ - 재사용 가능한 UI 패턴                                     ││
│  │ - 비즈니스 로직 없음                                        ││
│  │ - components/common/ 디렉토리에 위치                        ││
│  └────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ UI Components (UI 프리미티브)                               ││
│  │ - shadcn/ui 기반                                           ││
│  │ - 스타일링만 담당                                          ││
│  │ - components/ui/ 디렉토리에 위치                           ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 DataTable 컴포넌트 (핵심)

```typescript
// src/components/common/DataTable/DataTable.tsx

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];

    // 페이지네이션
    pagination?: {
        pageIndex: number;
        pageSize: number;
        totalPages: number;
        totalElements: number;
    };
    onPaginationChange?: (pagination: PaginationState) => void;

    // 정렬
    sorting?: SortingState;
    onSortingChange?: (sorting: SortingState) => void;

    // 필터
    filters?: ColumnFiltersState;
    onFiltersChange?: (filters: ColumnFiltersState) => void;

    // 선택
    enableRowSelection?: boolean;
    onRowSelectionChange?: (rows: TData[]) => void;

    // 내보내기
    enableExport?: boolean;
    exportFileName?: string;

    // 상태
    isLoading?: boolean;
    emptyState?: React.ReactNode;

    // 반응형
    mobileCardRenderer?: (row: TData) => React.ReactNode;
}

export function DataTable<TData, TValue>({
                                             columns,
                                             data,
                                             pagination,
                                             onPaginationChange,
                                             sorting,
                                             onSortingChange,
                                             enableRowSelection = false,
                                             enableExport = false,
                                             exportFileName = 'export',
                                             isLoading = false,
                                             emptyState,
                                             mobileCardRenderer,
                                         }: DataTableProps<TData, TValue>) {
    const isMobile = useMediaQuery('(max-width: 768px)');

    // 모바일에서 카드 뷰 렌더링
    if (isMobile && mobileCardRenderer) {
        return (
            <div className="space-y-4">
                {data.map((row, index) => (
                        <Card key={index}>
                            {mobileCardRenderer(row)}
                            </Card>
                    ))}
                <DataTablePagination pagination={pagination} onChange={onPaginationChange} />
        </div>
    );
    }

    // 데스크톱 테이블 렌더링
    return (
        <div className="space-y-4">
        <div className="flex items-center justify-between">
        <DataTableFilter filters={filters} onChange={onFiltersChange} />
    {enableExport && (
        <DataTableExport data={data} columns={columns} fileName={exportFileName} />
    )}
    </div>

    {isLoading ? (
        <DataTableSkeleton columns={columns.length} rows={10} />
    ) : data.length === 0 ? (
        emptyState || <EmptyState message="데이터가 없습니다" />
    ) : (
        <Table>
            {/* 테이블 렌더링 */}
        </Table>
    )}

    <DataTablePagination pagination={pagination} onChange={onPaginationChange} />
    </div>
);
}
```

### 7.3 위젯 시스템 (대시보드)

```typescript
// src/features/dashboard/components/widgets/WidgetContainer.tsx

interface WidgetConfig {
    id: string;
    type: WidgetType;
    title: string;
    size: 'small' | 'medium' | 'large';
    position: { x: number; y: number };
}

type WidgetType =
    | 'attendance'
    | 'leave-balance'
    | 'pending-approvals'
    | 'team-leave'
    | 'org-summary'
    | 'statistics'
    | 'announcements'
    | 'birthdays';

// 역할별 기본 위젯 설정
const defaultWidgetsByRole: Record<Role, WidgetType[]> = {
    SUPER_ADMIN: ['org-summary', 'statistics', 'pending-approvals'],
    GROUP_ADMIN: ['org-summary', 'statistics', 'pending-approvals'],
    TENANT_ADMIN: ['org-summary', 'statistics', 'pending-approvals'],
    HR_MANAGER: ['org-summary', 'statistics', 'pending-approvals', 'team-leave'],
    DEPT_MANAGER: ['team-leave', 'pending-approvals', 'statistics'],
    TEAM_LEADER: ['team-leave', 'pending-approvals', 'attendance'],
    EMPLOYEE: ['attendance', 'leave-balance', 'pending-approvals', 'announcements'],
};

// 위젯 레지스트리
const widgetRegistry: Record<WidgetType, React.ComponentType<WidgetProps>> = {
    'attendance': AttendanceWidget,
    'leave-balance': LeaveBalanceWidget,
    'pending-approvals': PendingApprovalsWidget,
    'team-leave': TeamLeaveWidget,
    'org-summary': OrgSummaryWidget,
    'statistics': StatisticsWidget,
    'announcements': AnnouncementsWidget,
    'birthdays': BirthdaysWidget,
};
```

### 7.4 폼 컴포넌트 패턴

```typescript
// src/features/employee/components/EmployeeForm.tsx

const employeeSchema = z.object({
    employeeNo: z.string().min(1, '사번은 필수입니다'),
    name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    departmentId: z.string().uuid(),
    gradeId: z.string().uuid().optional(),
    positionId: z.string().uuid().optional(),
    employmentType: z.enum(['REGULAR', 'CONTRACT', 'PARTTIME', 'INTERN']),
    hireDate: z.date(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export const EmployeeForm: React.FC<{
    defaultValues?: Partial<EmployeeFormData>;
    onSubmit: (data: EmployeeFormData) => void;
    isSubmitting?: boolean;
}> = ({ defaultValues, onSubmit, isSubmitting }) => {
    const { t } = useTranslation();

    const form = useForm<EmployeeFormData>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            employmentType: 'REGULAR',
            hireDate: new Date(),
            ...defaultValues,
        },
    });

    return (
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <FormSection title={t('employee.basicInfo')}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
        control={form.control}
    name="employeeNo"
    render={({ field }) => (
        <FormItem>
            <FormLabel>{t('employee.employeeNo')}</FormLabel>
    <FormControl>
    <Input {...field} />
    </FormControl>
    <FormMessage />
    </FormItem>
)}
    />
    {/* 다른 필드들... */}
    </div>
    </FormSection>

    <div className="flex justify-end gap-2">
    <Button type="button" variant="outline">
        {t('common.cancel')}
    </Button>
    <Button type="submit" disabled={isSubmitting}>
    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {t('common.save')}
    </Button>
    </div>
    </form>
    </Form>
);
};
```

---

## 8. 페이지별 상세 설계

### 8.1 로그인 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    [테넌트 로고 - 동적]                          │
│                                                                  │
│              ┌──────────────────────────────┐                   │
│              │                              │                   │
│              │      Welcome Back            │                   │
│              │                              │                   │
│              │  ┌────────────────────────┐  │                   │
│              │  │ Username               │  │                   │
│              │  └────────────────────────┘  │                   │
│              │                              │                   │
│              │  ┌────────────────────────┐  │                   │
│              │  │ Password          👁   │  │                   │
│              │  └────────────────────────┘  │                   │
│              │                              │                   │
│              │  □ Remember me              │                   │
│              │                              │                   │
│              │  ┌────────────────────────┐  │                   │
│              │  │       Sign In          │  │                   │
│              │  └────────────────────────┘  │                   │
│              │                              │                   │
│              │  Forgot password?            │                   │
│              │                              │                   │
│              └──────────────────────────────┘                   │
│                                                                  │
│                    [배경 이미지 - 동적]                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 대시보드 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│ [로고] 그룹명 ▼ 계열사명                [🔍] [🔔 3] [👤 홍길동]│
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│ 📊 대시보드│  대시보드                    [위젯 추가] [편집 모드] │
│          │                                                       │
│ 🏢 조직관리│  ┌─────────────────┐  ┌─────────────────┐          │
│          │  │ 오늘의 출퇴근   │  │ 연차 잔여일     │          │
│ 👥 인사정보│  │                 │  │                 │          │
│          │  │ 출근 09:02      │  │ 12일 / 15일     │          │
│ 📅 근태/휴가│  │ [퇴근하기]      │  │ ████████░░░     │          │
│          │  │                 │  │                 │          │
│ 📝 전자결재│  └─────────────────┘  └─────────────────┘          │
│          │                                                       │
│ ⚙️ 설정   │  ┌─────────────────┐  ┌─────────────────┐          │
│          │  │ 결재 대기       │  │ 팀 휴가 현황    │          │
│          │  │                 │  │                 │          │
│          │  │ 🔔 5건          │  │ 2/1 김철수 연차 │          │
│          │  │                 │  │ 2/3 이영희 오전 │          │
│          │  │ [바로가기 →]    │  │                 │          │
│          │  └─────────────────┘  └─────────────────┘          │
│          │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

### 8.3 조직도 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│ 조직도                                                          │
│                                                                  │
│ [트리 뷰] [차트 뷰] [테이블 뷰]     📅 2025-02-03 ▼  [편집 모드] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────── 타임라인 슬라이더 ──────────────────┐ │
│  │ ◀ ════════════════════●══════════════════════════════ ▶   │ │
│  │   2024-01      2024-07      2025-01      2025-07           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                    ┌───────────────┐                            │
│                    │   대표이사    │                            │
│                    │   홍길동      │                            │
│                    └───────┬───────┘                            │
│              ┌─────────────┼─────────────┐                      │
│              ▼             ▼             ▼                      │
│       ┌───────────┐ ┌───────────┐ ┌───────────┐                │
│       │ 경영지원  │ │ 개발본부  │ │ 영업본부  │                │
│       │ 본부장    │ │ 본부장    │ │ 본부장    │                │
│       │ 김철수    │ │ 이영희    │ │ 박민수    │                │
│       └─────┬─────┘ └─────┬─────┘ └───────────┘                │
│             │             │                                      │
│       ┌─────┴─────┐ ┌─────┴─────┐                               │
│       ▼           ▼ ▼           ▼                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │ 인사팀  │ │ 총무팀  │ │ 개발1팀 │                           │
│  │ 🏷️겸직  │ │         │ │         │                           │
│  └─────────┘ └─────────┘ └─────────┘                           │
│                                                                  │
│  [+ Zoom In] [- Zoom Out] [⊞ Fit] [📥 Export]                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 직원 목록 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│ 직원 관리                                      [+ 직원 등록]    │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 🔍 검색...                    [필터 ▼]  [📥 Excel]          ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ □ │ 사번    │ 이름   │ 부서   │ 직급 │ 입사일   │ 상태    ││
│ ├───┼─────────┼────────┼────────┼──────┼──────────┼─────────┤│
│ │ □ │ E001    │ 홍길동 │ 개발1팀│ 과장 │ 2020-03  │ ● 재직  ││
│ │ □ │ E002    │ 김철수 │ 인사팀 │ 대리 │ 2021-07  │ ● 재직  ││
│ │ □ │ E003    │ 이영희 │ 총무팀 │ 사원 │ 2023-01  │ ● 휴직  ││
│ │ □ │ E004    │ 박민수 │ 영업1팀│ 차장 │ 2018-05  │ ● 재직  ││
│ │ □ │ E005    │ 최지원 │ 개발2팀│ 과장 │ 2019-11  │ ● 재직  ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ◀ 1 2 3 ... 10 ▶              총 150명 | 페이지당 20명 ▼       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

[모바일 - 카드 뷰]
┌─────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 🔍 검색...                                    [≡ 필터]      ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │  [👤]  홍길동                               ● 재직          ││
│ │        E001 | 개발1팀 | 과장                                ││
│ │        입사일: 2020-03-02                                   ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │  [👤]  김철수                               ● 재직          ││
│ │        E002 | 인사팀 | 대리                                 ││
│ │        입사일: 2021-07-15                                   ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 휴가 캘린더 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│ 휴가 캘린더                                                     │
│                                                                  │
│ [월간] [주간] [일간] [Gantt]          ◀ 2025년 2월 ▶           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ [월간 뷰]                                                       │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                   │
│ │ 일  │ 월  │ 화  │ 수  │ 목  │ 금  │ 토  │                   │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│ │     │     │     │     │     │     │  1  │                   │
│ │     │     │     │     │     │     │     │                   │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│ │  2  │  3  │  4  │  5  │  6  │  7  │  8  │                   │
│ │     │홍길동│홍길동│     │     │     │     │                   │
│ │     │ 연차│ 연차│     │     │     │     │                   │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                   │
│ │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │                   │
│ │     │김철수│김철수│김철수│     │     │     │                   │
│ │     │ 병가│ 병가│ 병가│     │     │     │                   │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                   │
│                                                                  │
│ [Gantt 뷰]                                                      │
│ ┌─────────┬───────────────────────────────────────────────────┐│
│ │ 직원    │ 1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 ... ││
│ ├─────────┼───────────────────────────────────────────────────┤│
│ │ 홍길동  │    ████████                                       ││
│ │ 김철수  │                   ████████████                    ││
│ │ 이영희  │       █████                                       ││
│ └─────────┴───────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.6 전자결재 상세 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│ ◀ 결재 목록    연차 휴가 신청                     [인쇄] [PDF] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌───────────────────── 결재선 (병렬 표현) ─────────────────────┐│
│ │                                                               ││
│ │  ┌─────────┐    ┌─────────┐    ┌─────────┐                  ││
│ │  │ 기안자  │───▶│ 팀장    │───▶│ 부서장  │                  ││
│ │  │ 홍길동  │    │ 김철수  │    │ 이영희  │                  ││
│ │  │ ✓ 완료  │    │ ⏳대기  │    │ ○ 예정  │                  ││
│ │  └─────────┘    └─────────┘    └─────────┘                  ││
│ │                      │                                        ││
│ │               ┌──────┴──────┐  (합의 - 병렬)                 ││
│ │               ▼             ▼                                 ││
│ │         ┌─────────┐   ┌─────────┐                            ││
│ │         │ HR담당  │   │ 재무팀  │                            ││
│ │         │ 박민수  │   │ 최지원  │                            ││
│ │         │ ○ 예정  │   │ ○ 예정  │                            ││
│ │         └─────────┘   └─────────┘                            ││
│ │                                                               ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────── 문서 내용 ─────────────────────────────┐│
│ │ 제목: 연차 휴가 신청 (2025.02.03 ~ 2025.02.05)              ││
│ │                                                               ││
│ │ 휴가 유형: 연차                                              ││
│ │ 기간: 2025.02.03 (월) ~ 2025.02.05 (수) [3일]               ││
│ │ 사유: 가족 행사 참석                                         ││
│ │                                                               ││
│ │ 연차 잔여: 12일 → 9일 (3일 사용)                            ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 의견                                                        │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │                                                         │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                 [반려]  [승인]              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.7 설정 페이지

```
┌─────────────────────────────────────────────────────────────────┐
│ 설정                                                            │
├──────────────────┬──────────────────────────────────────────────┤
│                  │                                               │
│ 👤 프로필        │  프로필 설정                                  │
│                  │                                               │
│ 🔒 비밀번호 변경 │  ┌─────────────────────────────────────────┐ │
│                  │  │ [👤 프로필 이미지]                      │ │
│ 🔔 알림 설정     │  │                                         │ │
│                  │  │  [이미지 변경]                          │ │
│ 🌐 언어          │  └─────────────────────────────────────────┘ │
│                  │                                               │
│ 🎨 테마          │  이름: 홍길동                                 │
│                  │  이메일: hong@example.com                    │
│ 📱 세션 관리     │  부서: 개발1팀                                │
│                  │  직급: 과장                                   │
│                  │                                               │
│                  │  ──────────────────────────────────────────── │
│                  │                                               │
│                  │  테마                                         │
│                  │  ○ 라이트  ○ 다크  ● 시스템                  │
│                  │                                               │
│                  │  언어                                         │
│                  │  [한국어              ▼]                     │
│                  │                                               │
│                  │                           [저장]              │
│                  │                                               │
└──────────────────┴──────────────────────────────────────────────┘
```

---

## 9. API 연동

### 9.1 API 클라이언트 설정

```typescript
// src/lib/apiClient.ts

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useTenantStore } from '@/stores/tenantStore';
import { toast } from '@/components/ui/toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // BFF 패턴: 쿠키 기반 세션
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 테넌트 ID 헤더 추가
        const { currentTenant } = useTenantStore.getState();
        if (currentTenant?.id) {
            config.headers['X-Tenant-Id'] = currentTenant.id;
        }

        // Request ID 추가 (추적용)
        config.headers['X-Request-Id'] = crypto.randomUUID();

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => {
        // 공통 응답 구조 처리
        const { success, data, message } = response.data;

        if (success) {
            return { ...response, data };
        } else {
            return Promise.reject(new Error(message));
        }
    },
    (error: AxiosError<ApiErrorResponse>) => {
        const { response } = error;

        if (response) {
            const { status, data } = response;

            switch (status) {
                case 401:
                    // 세션 만료 - 로그인 페이지로
                    window.location.href = '/login?expired=true';
                    break;

                case 403:
                    toast.error('접근 권한이 없습니다.');
                    break;

                case 404:
                    // 리소스 없음 - 개별 처리
                    break;

                case 422:
                    // 비즈니스 로직 에러 - 개별 처리
                    break;

                case 429:
                    toast.error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
                    break;

                case 500:
                case 502:
                case 503:
                    toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    break;
            }

            return Promise.reject({
                code: data?.code || 'UNKNOWN_ERROR',
                message: data?.message || '알 수 없는 오류가 발생했습니다.',
                errors: data?.errors || [],
                status,
            });
        }

        // 네트워크 에러
        toast.error('네트워크 연결을 확인해주세요.');
        return Promise.reject(error);
    }
);
```

### 9.2 API 서비스 패턴

```typescript
// src/features/employee/services/employeeService.ts

import { apiClient } from '@/lib/apiClient';
import type { Employee, EmployeeCreateRequest, EmployeeUpdateRequest, EmployeeFilters } from '@/types';

export const employeeService = {
    // 목록 조회
    getList: async (filters: EmployeeFilters) => {
        const params = new URLSearchParams();

        if (filters.page !== undefined) params.append('page', String(filters.page));
        if (filters.size !== undefined) params.append('size', String(filters.size));
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.name) params.append('name', filters.name);
        if (filters.departmentId) params.append('departmentId', filters.departmentId);
        if (filters.status) params.append('status', filters.status);

        const response = await apiClient.get<PageResponse<Employee>>(`/employees?${params}`);
        return response.data;
    },

    // 단건 조회
    getById: async (id: string) => {
        const response = await apiClient.get<Employee>(`/employees/${id}`);
        return response.data;
    },

    // 생성
    create: async (data: EmployeeCreateRequest) => {
        const response = await apiClient.post<Employee>('/employees', data);
        return response.data;
    },

    // 수정
    update: async (id: string, data: EmployeeUpdateRequest) => {
        const response = await apiClient.patch<Employee>(`/employees/${id}`, data);
        return response.data;
    },

    // 삭제
    delete: async (id: string) => {
        await apiClient.delete(`/employees/${id}`);
    },

    // 인사기록카드 조회
    getPersonnelCard: async (id: string) => {
        const response = await apiClient.get<PersonnelCard>(`/employees/${id}/personnel-card`);
        return response.data;
    },

    // 민감정보 조회 (마스킹 해제)
    getSensitiveInfo: async (id: string, field: string, reason: string) => {
        const response = await apiClient.post<{ value: string }>(
            `/employees/${id}/sensitive/${field}`,
            { reason }
        );
        return response.data;
    },
};
```

### 9.3 React Query 훅 패턴

```typescript
// src/features/employee/hooks/useEmployees.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import { queryKeys } from '@/lib/queryClient';
import { toast } from '@/components/ui/toast';

// 목록 조회
export const useEmployees = (filters: EmployeeFilters) => {
    return useQuery({
        queryKey: queryKeys.employees.list(filters),
        queryFn: () => employeeService.getList(filters),
        placeholderData: (previousData) => previousData,
    });
};

// 단건 조회
export const useEmployee = (id: string) => {
    return useQuery({
        queryKey: queryKeys.employees.detail(id),
        queryFn: () => employeeService.getById(id),
        enabled: !!id,
    });
};

// 생성
export const useCreateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: employeeService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
            toast.success('직원이 등록되었습니다.');
        },
        onError: (error: ApiError) => {
            toast.error(error.message);
        },
    });
};

// 수정
export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: EmployeeUpdateRequest }) =>
            employeeService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
            toast.success('직원 정보가 수정되었습니다.');
        },
        onError: (error: ApiError) => {
            toast.error(error.message);
        },
    });
};

// 삭제
export const useDeleteEmployee = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: employeeService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
            toast.success('직원이 삭제되었습니다.');
        },
        onError: (error: ApiError) => {
            toast.error(error.message);
        },
    });
};
```

---

## 10. 인증 및 인가

### 10.1 인증 훅

```typescript
// src/features/auth/hooks/useAuth.ts

import { useAuthStore } from '@/stores/authStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '../services/authService';

export const useAuth = () => {
    const { user, isAuthenticated, setUser, logout: clearAuth } = useAuthStore();

    // 현재 사용자 정보 조회
    const { isLoading, refetch: refreshUser } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: authService.getCurrentUser,
        enabled: isAuthenticated,
        retry: false,
        onSuccess: setUser,
        onError: () => clearAuth(),
    });

    // 로그아웃
    const logoutMutation = useMutation({
        mutationFn: authService.logout,
        onSuccess: () => {
            clearAuth();
            window.location.href = '/login';
        },
    });

    return {
        user,
        isAuthenticated,
        isLoading,
        refreshUser,
        logout: logoutMutation.mutate,
        hasRole: (role: Role) => user?.roles.includes(role) || false,
        hasPermission: (permission: string) => user?.permissions.includes(permission) || false,
        hasAnyRole: (roles: Role[]) => roles.some(role => user?.roles.includes(role)),
    };
};
```

### 10.2 권한 체크 컴포넌트

```typescript
// src/components/common/PermissionGate.tsx

interface PermissionGateProps {
    children: React.ReactNode;
    roles?: Role[];
    permissions?: string[];
    fallback?: React.ReactNode;
    requireAll?: boolean; // true: AND, false: OR
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
                                                                  children,
                                                                  roles = [],
                                                                  permissions = [],
                                                                  fallback = null,
                                                                  requireAll = false,
                                                              }) => {
    const { hasRole, hasPermission } = useAuth();

    const roleCheck = roles.length === 0 || (
        requireAll
            ? roles.every(role => hasRole(role))
            : roles.some(role => hasRole(role))
    );

    const permissionCheck = permissions.length === 0 || (
        requireAll
            ? permissions.every(perm => hasPermission(perm))
            : permissions.some(perm => hasPermission(perm))
    );

    if (roleCheck && permissionCheck) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};

// 사용 예시
<PermissionGate roles={['TENANT_ADMIN', 'HR_MANAGER']}>
<Button onClick={handleCreate}>직원 등록</Button>
</PermissionGate>
```

### 10.3 민감정보 조회 컴포넌트

```typescript
// src/features/employee/components/MaskedField.tsx

interface MaskedFieldProps {
    label: string;
    maskedValue: string;
    fieldName: string;
    employeeId: string;
    canView: boolean;
}

export const MaskedField: React.FC<MaskedFieldProps> = ({
                                                            label,
                                                            maskedValue,
                                                            fieldName,
                                                            employeeId,
                                                            canView,
                                                        }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [realValue, setRealValue] = useState<string | null>(null);
    const [reasonDialogOpen, setReasonDialogOpen] = useState(false);

    const revealMutation = useMutation({
        mutationFn: (reason: string) =>
            employeeService.getSensitiveInfo(employeeId, fieldName, reason),
        onSuccess: (data) => {
            setRealValue(data.value);
            setIsRevealed(true);
            setReasonDialogOpen(false);
        },
    });

    const handleToggle = () => {
        if (isRevealed) {
            setIsRevealed(false);
            setRealValue(null);
        } else {
            setReasonDialogOpen(true);
        }
    };

    return (
        <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}:</span>
    <span className="font-mono">
    {isRevealed && realValue ? realValue : maskedValue}
    </span>
    {canView && (
        <Button
            variant="ghost"
        size="sm"
        onClick={handleToggle}
            >
            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
    )}

    <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>조회 사유 입력</DialogTitle>
    <DialogDescription>
    민감정보 조회 시 사유를 입력해주세요. 조회 기록이 남습니다.
    </DialogDescription>
    </DialogHeader>
    <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        revealMutation.mutate(formData.get('reason') as string);
    }}>
    <Textarea name="reason" placeholder="조회 사유를 입력하세요" required />
    <DialogFooter className="mt-4">
    <Button type="button" variant="outline" onClick={() => setReasonDialogOpen(false)}>
    취소
    </Button>
    <Button type="submit" disabled={revealMutation.isPending}>
        확인
        </Button>
        </DialogFooter>
        </form>
        </DialogContent>
        </Dialog>
        </div>
);
};
```

---

## 11. 스타일링 시스템

### 11.1 Tailwind 설정

```typescript
// tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
    content: ['./src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                // CSS 변수 기반 (테넌트별 동적 변경)
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                // ... shadcn/ui 기본 컬러
            },
            fontFamily: {
                sans: ['Pretendard', 'sans-serif'],
            },
            keyframes: {
                'slide-in-right': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                'slide-in-right': 'slide-in-right 0.3s ease-out',
                'fade-in': 'fade-in 0.2s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 11.2 테넌트 브랜딩 시스템

```typescript
// src/lib/branding.ts

interface TenantBranding {
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    loginBackgroundUrl: string;
}

export const applyTenantBranding = (branding: TenantBranding) => {
    const root = document.documentElement;

    // Primary Color HSL 변환 후 적용
    const hsl = hexToHSL(branding.primaryColor);
    root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);

    // Favicon 변경
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon && branding.faviconUrl) {
        favicon.href = branding.faviconUrl;
    }

    // 메타 테마 색상
    const metaTheme = document.querySelector("meta[name='theme-color']");
    if (metaTheme) {
        metaTheme.setAttribute('content', branding.primaryColor);
    }
};

// 테넌트 변경 시 자동 적용
useTenantStore.subscribe(
    (state) => state.currentTenant,
    (tenant) => {
        if (tenant?.branding) {
            applyTenantBranding(tenant.branding);
        }
    }
);
```

### 11.3 다크 모드

```typescript
// src/lib/theme.ts

type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
    const { theme, setTheme } = useUIStore();

    useEffect(() => {
        const root = document.documentElement;

        const applyTheme = (isDark: boolean) => {
            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches);

            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            applyTheme(theme === 'dark');
        }
    }, [theme]);

    return { theme, setTheme };
};
```

---

## 12. 국제화 (i18n)

### 12.1 i18n 설정

```typescript
// src/lib/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'ko',
        supportedLngs: ['ko', 'en'],

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },

        ns: [
            'common',
            'auth',
            'dashboard',
            'employee',
            'organization',
            'attendance',
            'approval',
            'settings',
        ],
        defaultNS: 'common',

        interpolation: {
            escapeValue: false,
        },

        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
```

### 12.2 번역 파일 구조

```json
// public/locales/ko/common.json
{
  "app": {
    "name": "HR SaaS Platform"
  },
  "actions": {
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "수정",
    "create": "등록",
    "search": "검색",
    "filter": "필터",
    "export": "내보내기",
    "import": "가져오기",
    "confirm": "확인",
    "close": "닫기"
  },
  "status": {
    "active": "활성",
    "inactive": "비활성",
    "pending": "대기중",
    "approved": "승인됨",
    "rejected": "반려됨"
  },
  "messages": {
    "saveSuccess": "저장되었습니다.",
    "deleteSuccess": "삭제되었습니다.",
    "error": "오류가 발생했습니다.",
    "confirmDelete": "정말 삭제하시겠습니까?",
    "noData": "데이터가 없습니다."
  },
  "pagination": {
    "showing": "{{total}}건 중 {{from}}-{{to}}",
    "perPage": "페이지당 {{count}}개"
  }
}
```

```json
// public/locales/ko/employee.json
{
  "title": "인사정보",
  "list": {
    "title": "직원 목록",
    "create": "직원 등록"
  },
  "fields": {
    "employeeNo": "사번",
    "name": "이름",
    "email": "이메일",
    "department": "부서",
    "grade": "직급",
    "position": "직책",
    "hireDate": "입사일",
    "status": "상태"
  },
  "status": {
    "active": "재직",
    "onLeave": "휴직",
    "resigned": "퇴사"
  },
  "messages": {
    "createSuccess": "직원이 등록되었습니다.",
    "updateSuccess": "직원 정보가 수정되었습니다."
  }
}
```

### 12.3 사용 예시

```typescript
// 컴포넌트에서 사용
import { useTranslation } from 'react-i18next';

const EmployeeList: React.FC = () => {
    const { t } = useTranslation(['employee', 'common']);

    return (
        <div>
            <h1>{t('employee:list.title')}</h1>
    <Button>{t('employee:list.create')}</Button>

    <DataTable
    columns={[
            { header: t('employee:fields.employeeNo'), ... },
    { header: t('employee:fields.name'), ... },
    { header: t('employee:fields.department'), ... },
]}
    emptyState={
        <EmptyState message={t('common:messages.noData')} />
}
    />
    </div>
);
};
```

---

## 13. 실시간 기능

### 13.1 WebSocket 연결 관리

```typescript
// src/lib/websocket.ts

import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';

class WebSocketManager {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect() {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;

        this.socket = io(import.meta.env.VITE_WS_URL || '', {
            withCredentials: true,
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        this.socket.on('connect_error', () => {
            this.reconnectAttempts++;
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('WebSocket connection failed');
                this.socket?.close();
            }
        });

        // 알림 이벤트
        this.socket.on('notification', (notification: Notification) => {
            const { addNotification } = useNotificationStore.getState();
            addNotification(notification);

            // 브라우저 알림 (권한 있을 경우)
            if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                });
            }
        });

        // 결재 상태 변경 이벤트
        this.socket.on('approval:updated', (data: ApprovalUpdateEvent) => {
            // React Query 캐시 무효화
            queryClient.invalidateQueries({
                queryKey: queryKeys.approvals.detail(data.approvalId)
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.approvals.pending()
            });
        });
    }

    disconnect() {
        this.socket?.close();
        this.socket = null;
    }

    // 특정 채널 구독
    subscribe(channel: string) {
        this.socket?.emit('subscribe', { channel });
    }

    unsubscribe(channel: string) {
        this.socket?.emit('unsubscribe', { channel });
    }
}

export const wsManager = new WebSocketManager();
```

### 13.2 알림 컴포넌트

```typescript
// src/features/notification/components/NotificationBell.tsx

export const NotificationBell: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
    const [open, setOpen] = useState(false);

    // 그룹핑된 알림
    const groupedNotifications = useMemo(() => {
        const groups: Record<string, Notification[]> = {};

        notifications.forEach((notification) => {
            const key = notification.type;
            if (!groups[key]) groups[key] = [];
            groups[key].push(notification);
        });

        return Object.entries(groups).sort((a, b) => {
            // 중요도순 정렬
            const priority = { urgent: 0, high: 1, normal: 2, low: 3 };
            return priority[a[1][0].priority] - priority[b[1][0].priority];
        });
    }, [notifications]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
    <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
            <Badge
                variant="destructive"
    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
    >
    {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
)}
    </Button>
    </PopoverTrigger>

    <PopoverContent className="w-80 p-0" align="end">
    <div className="flex items-center justify-between p-4 border-b">
    <h4 className="font-semibold">알림</h4>
    {unreadCount > 0 && (
        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
        모두 읽음
    </Button>
    )}
    </div>

    <ScrollArea className="h-[400px]">
        {groupedNotifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                    새로운 알림이 없습니다.
        </div>
) : (
        groupedNotifications.map(([type, items]) => (
            <NotificationGroup
                key={type}
    type={type}
    notifications={items}
    onRead={markAsRead}
    />
))
)}
    </ScrollArea>

    <div className="p-2 border-t">
    <Button
        variant="ghost"
    className="w-full"
    onClick={() => {
        setOpen(false);
        navigate('/notifications');
    }}
>
    전체 보기
    </Button>
    </div>
    </PopoverContent>
    </Popover>
);
};
```

---

## 14. 성능 최적화

### 14.1 코드 스플리팅

```typescript
// src/routes/index.tsx

import { lazy, Suspense } from 'react';
import { PageLoader } from '@/components/common/Loading/PageLoader';

// Lazy Loading
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const EmployeeListPage = lazy(() => import('@/features/employee/pages/EmployeeListPage'));
const OrgChartPage = lazy(() => import('@/features/organization/pages/OrgChartPage'));
const ApprovalListPage = lazy(() => import('@/features/approval/pages/ApprovalListPage'));

// Suspense Wrapper
const LazyPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Suspense fallback={<PageLoader />}>
{children}
</Suspense>
);

// 라우트 설정
const routes = [
    {
        path: 'dashboard',
        element: <LazyPage><DashboardPage /></LazyPage>,
    },
    // ...
];
```

### 14.2 이미지 최적화

```typescript
// src/components/common/OptimizedImage.tsx

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    fallback?: string;
    lazy?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
                                                                  src,
                                                                  fallback = '/images/placeholder.png',
                                                                  lazy = true,
                                                                  alt,
                                                                  className,
                                                                  ...props
                                                              }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={cn('relative overflow-hidden', className)}>
    {isLoading && (
        <Skeleton className="absolute inset-0" />
    )}
    <img
        src={imageSrc}
    alt={alt}
    loading={lazy ? 'lazy' : 'eager'}
    onLoad={() => setIsLoading(false)}
    onError={() => {
        setImageSrc(fallback);
        setIsLoading(false);
    }}
    className={cn(
        'transition-opacity duration-300',
        isLoading ? 'opacity-0' : 'opacity-100'
)}
    {...props}
    />
    </div>
);
};
```

### 14.3 가상화 (대량 데이터)

```typescript
// src/components/common/VirtualizedList.tsx

import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
    items: T[];
    height: number;
    itemHeight: number;
    renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualizedList<T>({
                                       items,
                                       height,
                                       itemHeight,
                                       renderItem,
                                   }: VirtualizedListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => itemHeight,
        overscan: 5,
    });

    return (
        <div
            ref={parentRef}
    style={{ height, overflow: 'auto' }}
>
    <div
        style={{
        height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
    }}
>
    {virtualizer.getVirtualItems().map((virtualItem) => (
        <div
            key={virtualItem.key}
        style={{
        position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
    }}
    >
        {renderItem(items[virtualItem.index], virtualItem.index)}
        </div>
    ))}
    </div>
    </div>
);
}
```

### 14.4 번들 최적화 (Vite)

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    plugins: [
        react(),
        visualizer({ open: true }), // 번들 분석
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // 벤더 청크 분리
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
                    'vendor-charts': ['recharts', 'reactflow'],
                    'vendor-utils': ['date-fns', 'axios', 'zustand'],
                },
            },
        },
        chunkSizeWarningLimit: 500,
    },
    optimizeDeps: {
        include: ['react', 'react-dom'],
    },
});
```

---

## 15. 테스트 전략

### 15.1 테스트 구조

```
src/
├── __tests__/                    # 통합 테스트
│   ├── integration/
│   │   ├── auth.test.tsx
│   │   └── employee.test.tsx
│   └── e2e/
│       └── flows/
├── features/
│   └── employee/
│       ├── __tests__/            # 기능별 단위 테스트
│       │   ├── EmployeeForm.test.tsx
│       │   └── employeeService.test.ts
│       └── ...
└── components/
    └── common/
        └── __tests__/            # 공통 컴포넌트 테스트
            └── DataTable.test.tsx
```

### 15.2 단위 테스트 예시

```typescript
// src/features/employee/components/__tests__/EmployeeForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeForm } from '../EmployeeForm';
import { TestProviders } from '@/test/TestProviders';

describe('EmployeeForm', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
    });

    it('renders all required fields', () => {
        render(
            <TestProviders>
                <EmployeeForm onSubmit={mockOnSubmit} />
        </TestProviders>
    );

        expect(screen.getByLabelText(/사번/)).toBeInTheDocument();
        expect(screen.getByLabelText(/이름/)).toBeInTheDocument();
        expect(screen.getByLabelText(/이메일/)).toBeInTheDocument();
        expect(screen.getByLabelText(/부서/)).toBeInTheDocument();
    });

    it('shows validation errors for empty required fields', async () => {
        render(
            <TestProviders>
                <EmployeeForm onSubmit={mockOnSubmit} />
        </TestProviders>
    );

        await userEvent.click(screen.getByRole('button', { name: /저장/ }));

        await waitFor(() => {
            expect(screen.getByText(/사번은 필수입니다/)).toBeInTheDocument();
            expect(screen.getByText(/이름은 2자 이상/)).toBeInTheDocument();
        });

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
        render(
            <TestProviders>
                <EmployeeForm onSubmit={mockOnSubmit} />
        </TestProviders>
    );

        await userEvent.type(screen.getByLabelText(/사번/), 'E001');
        await userEvent.type(screen.getByLabelText(/이름/), '홍길동');
        await userEvent.type(screen.getByLabelText(/이메일/), 'hong@example.com');
        // ... 다른 필드 입력

        await userEvent.click(screen.getByRole('button', { name: /저장/ }));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(
                expect.objectContaining({
                    employeeNo: 'E001',
                    name: '홍길동',
                    email: 'hong@example.com',
                })
            );
        });
    });
});
```

### 15.3 E2E 테스트 예시

```typescript
// e2e/employee.spec.ts

import { test, expect } from '@playwright/test';

test.describe('직원 관리', () => {
    test.beforeEach(async ({ page }) => {
        // 로그인
        await page.goto('/login');
        await page.fill('[name="username"]', 'admin');
        await page.fill('[name="password"]', 'password');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
    });

    test('직원 목록 조회', async ({ page }) => {
        await page.goto('/employees');

        // 테이블 로딩 완료 대기
        await expect(page.locator('table')).toBeVisible();

        // 데이터 확인
        await expect(page.locator('tbody tr')).toHaveCount(20);
    });

    test('직원 검색', async ({ page }) => {
        await page.goto('/employees');

        await page.fill('[placeholder*="검색"]', '홍길동');
        await page.keyboard.press('Enter');

        await expect(page.locator('tbody tr')).toContainText('홍길동');
    });

    test('직원 등록', async ({ page }) => {
        await page.goto('/employees/new');

        await page.fill('[name="employeeNo"]', 'E999');
        await page.fill('[name="name"]', '테스트사용자');
        await page.fill('[name="email"]', 'test@example.com');
        // ... 다른 필드

        await page.click('button[type="submit"]');

        // 성공 토스트 확인
        await expect(page.locator('[role="alert"]')).toContainText('등록되었습니다');

        // 목록으로 이동 확인
        await expect(page).toHaveURL('/employees');
    });
});
```

---

## 16. 배포 설정

### 16.1 환경 변수

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_URL=ws://localhost:8080
VITE_KEYCLOAK_URL=http://localhost:8180

# .env.production
VITE_API_BASE_URL=/api/v1
VITE_WS_URL=wss://api.hrplatform.com
VITE_KEYCLOAK_URL=https://auth.hrplatform.com
```

### 16.2 Docker 설정

```dockerfile
# apps/web/Dockerfile

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

# 의존성 설치
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/

RUN pnpm install --frozen-lockfile

# 소스 복사 및 빌드
COPY . .
RUN pnpm --filter web build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 16.3 Nginx 설정

```nginx
# apps/web/nginx.conf

server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 라우팅
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 (개발용)
    location /api {
        proxy_pass http://gateway:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket 프록시
    location /ws {
        proxy_pass http://gateway:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 16.4 Kubernetes 배포

```yaml
# k8s/web-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: hr-platform-web
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hr-platform-web
  template:
    metadata:
      labels:
        app: hr-platform-web
    spec:
      containers:
        - name: web
          image: hr-saas/web:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: hr-platform-web
  namespace: hr-saas
spec:
  selector:
    app: hr-platform-web
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hr-platform-web
  namespace: hr-saas
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - hrplatform.com
      secretName: hr-platform-tls
  rules:
    - host: hrplatform.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: hr-platform-web
                port:
                  number: 80
```

---

## 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2025-02-03 | - | 최초 작성 |

---

**문서 끝**