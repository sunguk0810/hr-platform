# 요구사항 추적 매트릭스

> **최종 업데이트**: 2026-02-09
> **대상**: 프로젝트 관리자, QA 엔지니어, 개발자
> **출처**: [PRD.md](../PRD.md), [PRD_GAP_ANALYSIS.md](../PRD_GAP_ANALYSIS.md)

---

## 목차

- [1. 개요](#1-개요)
- [2. 범례](#2-범례)
- [3. Phase 1 기능 요구사항](#3-phase-1-기능-요구사항)
  - [3.1 FR-TM: 테넌트 관리](#31-fr-tm-테넌트-관리)
  - [3.2 FR-AUTH: 인증/인가](#32-fr-auth-인증인가)
  - [3.3 FR-MDM: 기준정보 관리](#33-fr-mdm-기준정보-관리)
  - [3.4 FR-ORG: 조직 관리](#34-fr-org-조직-관리)
  - [3.5 FR-EMP: 인사정보 관리](#35-fr-emp-인사정보-관리)
  - [3.6 FR-ATT: 근태/휴가 관리](#36-fr-att-근태휴가-관리)
  - [3.7 FR-APR: 전자결재](#37-fr-apr-전자결재)
  - [3.8 FR-NTF: 알림 시스템](#38-fr-ntf-알림-시스템)
  - [3.9 FR-FILE: 파일 관리](#39-fr-file-파일-관리)
- [4. 비기능 요구사항 (NFR)](#4-비기능-요구사항-nfr)
- [5. Phase 2 기능 현황](#5-phase-2-기능-현황)
- [6. 종합 요약](#6-종합-요약)
- [7. 관련 문서](#7-관련-문서)

---

## 1. 개요

이 문서는 PRD(Product Requirements Document)의 모든 요구사항(FR/NFR)을 백엔드 구현(Controller/Service/Entity)과 매핑하여 추적성을 확보합니다.

### 추적 목적

| 목적 | 설명 |
|------|------|
| **완전성 검증** | 모든 PRD 요구사항이 구현되었는지 확인 |
| **영향 분석** | 요구사항 변경 시 영향받는 코드 식별 |
| **테스트 계획** | 요구사항 기반 테스트 케이스 도출 |
| **감사 대응** | ISMS-P 감사 시 요구사항→구현 매핑 제시 |

---

## 2. 범례

### 상태 기호

| 기호 | 의미 |
|------|------|
| ✅ | 완전 구현 |
| 🟡 | 부분 구현 (일부 기능 누락 또는 TODO 잔존) |
| ❌ | 미구현 |

### 구현 위치 표기

- **Controller**: REST API 엔드포인트
- **Service**: 비즈니스 로직 계층
- **Entity**: JPA 엔티티 / DB 테이블
- **Event**: 도메인 이벤트 (SNS/SQS)
- **Common**: 공통 모듈 (common-*)

---

## 3. Phase 1 기능 요구사항

### 3.1 FR-TM: 테넌트 관리

| ID | 요구사항 | 우선순위 | 상태 | 서비스 | Controller | Service | Entity/기타 |
|----|---------|---------|------|--------|------------|---------|-------------|
| FR-TM-001-01 | 테넌트 등록 | Must | ✅ | tenant-service | `TenantController` | `TenantService` | `Tenant` |
| FR-TM-001-02 | 기본정보 관리 | Must | ✅ | tenant-service | `TenantController` | `TenantService` | `Tenant` (code, name, businessNumber, logo) |
| FR-TM-001-03 | 상태 관리 | Must | ✅ | tenant-service | `TenantController` | `TenantService` | `TenantStatus` enum (ACTIVE/SUSPENDED/TERMINATED) |
| FR-TM-001-04 | 모듈/기능 On/Off | Must | ✅ | tenant-service | `TenantController` | `TenantFeatureService` | `TenantFeature` |
| FR-TM-002-01 | 조직 계층 정의 | Must | ✅ | tenant-service | `TenantPolicyController` | `TenantPolicyService` | `HierarchySettings` JSON |
| FR-TM-002-02 | 직급/직책 체계 | Must | ✅ | tenant-service | `TenantPolicyController` | `TenantPolicyService` | `OrganizationPolicy` JSON |
| FR-TM-002-03 | 휴가 정책 설정 | Must | ✅ | tenant-service | `TenantPolicyController` | `TenantPolicyService` | `LeavePolicy` JSON |
| FR-TM-002-04 | 결재 기능 On/Off | Must | ✅ | tenant-service | `TenantPolicyController` | `TenantPolicyService` | `ApprovalPolicy` (7개 토글) |
| FR-TM-002-05 | 자동 결재선 규칙 | Should | ✅ | tenant-service | `TenantPolicyController` | `TenantPolicyService` | `autoApprovalLine` 설정 |
| FR-TM-003-01 | 그룹 통합 대시보드 | Must | 🟡 | tenant-service | `GroupDashboardController` | — | 서비스 간 Feign 연동 미완 (TODO) |
| FR-TM-003-02 | 그룹 공통 정책 일괄 적용 | Should | ✅ | tenant-service | `TenantPolicyController` | `TenantPolicyService` | `inheritPolicies()` |
| FR-TM-003-03 | 계열사 간 인사이동 | Must | ❌ | — | — | — | 전출/전입 워크플로우 전체 미구현 |

**완전율**: 83% (10/12 완전)

---

### 3.2 FR-AUTH: 인증/인가

> PRD 섹션 4 (사용자 정의) 및 NFR-SEC-001에서 도출

| 요구사항 | 우선순위 | 상태 | 서비스 | Controller | Service | Entity/기타 |
|---------|---------|------|--------|------------|---------|-------------|
| 로그인/로그아웃 | Must | ✅ | auth-service | `AuthController` | `AuthService` | `Session`, JWT 토큰 |
| 토큰 갱신 | Must | ✅ | auth-service | `AuthController` | `JwtTokenProvider` | Refresh token rotation, Redis 블랙리스트 |
| 세션 관리 | Must | ✅ | auth-service | `SessionController` | `SessionService` | 동시 5세션 제한, DB+Redis 하이브리드 |
| 비밀번호 관리 | Must | ✅ | auth-service | `AuthController` | `PasswordService` | bcrypt 해시, 이메일 리셋 |
| 계정 잠금 | Must | ✅ | auth-service | `AuthController` | `LoginAttemptService` | 5회 실패 → 30분 잠금 |
| 7단계 RBAC | Must | ✅ | common-security | — | `RoleHierarchyConfig` | 100+ 퍼미션, `@PreAuthorize` |
| 데이터 접근 제어 (scope) | Must | ✅ | common-security | — | `PermissionChecker` | self/team/dept/org 범위 |
| Keycloak SSO | Must | ❌ | — | — | — | 자체 JWT 사용, Keycloak 미연동 |
| API Gateway JWT 검증 | Must | 🟡 | gateway-service | — | — | Traefik 라우팅 존재, JWT 미들웨어 미완 |

**완전율**: 78% (7/9 완전)

---

### 3.3 FR-MDM: 기준정보 관리

| ID | 요구사항 | 우선순위 | 상태 | 서비스 | Controller | Service | Entity/기타 |
|----|---------|---------|------|--------|------------|---------|-------------|
| FR-MDM-001-01 | 공통코드 CRUD | Must | ✅ | mdm-service | `CommonCodeController` | `CommonCodeService` | `CommonCode` |
| FR-MDM-001-02 | 테넌트별 코드 사용 설정 | Must | ✅ | mdm-service | `TenantCodeController` | `TenantCodeService` | `TenantCode` |
| FR-MDM-001-03 | 코드 변경 시 일괄 갱신 | Should | ✅ | mdm-service | `CommonCodeController` | `CodeImportExportService` | 벌크 상태 변경 |
| FR-MDM-001-04 | 변경 이력 조회 | Must | ✅ | mdm-service | `CommonCodeController` | `CommonCodeService` | `CodeHistory` |
| FR-MDM-002-01 | 다단계 분류체계 | Must | ✅ | mdm-service | `CommonCodeController` | `CommonCodeService` | 4단계 (대/중/소/세), `parentCodeId` |
| FR-MDM-002-02 | 변경 영향도 시뮬레이션 | Should | ✅ | mdm-service | `CommonCodeController` | `CodeImpactAnalyzer` | 영향도 스코어 (0-100) |
| FR-MDM-002-03 | 유사/중복 코드 검색 | Should | ✅ | mdm-service | `CommonCodeController` | `CodeSearchService` | Levenshtein 유사도 |

**완전율**: 100% (7/7 완전)

---

### 3.4 FR-ORG: 조직 관리

| ID | 요구사항 | 우선순위 | 상태 | 서비스 | Controller | Service | Entity/기타 |
|----|---------|---------|------|--------|------------|---------|-------------|
| FR-ORG-001-01 | 부서/팀 CRUD | Must | ✅ | organization-service | `DepartmentController` | `DepartmentService` | `Department` |
| FR-ORG-001-02 | 조직도 트리 시각화 | Must | ✅ | organization-service | `DepartmentController` | `DepartmentService` | `getTree()` API |
| FR-ORG-001-03 | 시점별 조직 변경 이력 | Must | 🟡 | organization-service | `DepartmentController` | — | TODO: 감사 테이블 미생성 |
| FR-ORG-001-04 | 조직 개편 영향 미리보기 | Should | 🟡 | organization-service | — | `ReorgImpactAnalyzer` | 스켈레톤만 존재 |
| FR-ORG-002-01 | 보직(직책) 관리 | Must | ✅ | organization-service | `PositionController` | `PositionService` | `Position` |
| FR-ORG-002-02 | 겸직 지원 | Must | 🟡 | employee-service | `EmployeeAffiliationController` | `EmployeeAffiliationService` | `EmployeeAffiliation` (FE UI 미확인) |
| FR-ORG-002-03 | 주/부 소속 구분 | Must | 🟡 | employee-service | `EmployeeAffiliationController` | `EmployeeAffiliationService` | `affiliationType` (PRIMARY/SECONDARY/CONCURRENT) |
| FR-ORG-002-04 | 보직→위원회 당연직 갱신 | Should | ❌ | — | — | — | `AffiliationChangedListener` TODO 스텁 |
| FR-ORG-003-01 | 테넌트별 직급 체계 | Must | ✅ | organization-service | `GradeController` | `GradeService` | `Grade` |
| FR-ORG-003-02 | 직급/직책 분리 관리 | Must | ✅ | organization-service | 별도 Controller | 별도 Service | `Grade` + `Position` 분리 |
| FR-ORG-003-03 | 직급별 호봉 체계 | Should | 🟡 | — | — | — | FE 목업만, BE 미구현 |

**완전율**: 55% (6/11 완전)

---

### 3.5 FR-EMP: 인사정보 관리

| ID | 요구사항 | 우선순위 | 상태 | 서비스 | Controller | Service | Entity/기타 |
|----|---------|---------|------|--------|------------|---------|-------------|
| FR-EMP-001-01 | 사원 CRUD | Must | ✅ | employee-service | `EmployeeController` | `EmployeeService` | `Employee` |
| FR-EMP-001-02 | Excel/CSV 벌크 등록 | Must | 🟡 | employee-service | `EmployeeController` | `EmployeeBulkService` | 검증 로직 구현, Excel 직렬화 TODO |
| FR-EMP-001-03 | 인사기록카드 PDF | Must | 🟡 | employee-service | `EmployeeController` | `RecordCardService` | PDFBox, 한글 폰트 미탑재 |
| FR-EMP-001-04 | 본인 정보 변경 요청 | Must | ✅ | employee-service | `ChangeRequestController` | `ChangeRequestService` | `ChangeRequest` |
| FR-EMP-001-05 | 변경 요청 HR 승인 | Must | 🟡 | employee-service | `ChangeRequestController` | `ChangeRequestService` | 결재 서비스 연동 TODO |
| FR-EMP-002-01 | 민감정보 마스킹 | Must | ✅ | common-privacy | — | `MaskingService` | `@Masked` 어노테이션, 8종 마스킹 |
| FR-EMP-002-02 | 개인정보 열람 승인 | Must | ✅ | employee-service | `PrivacyAccessController` | `PrivacyAccessService` | 승인/반려 워크플로우 |
| FR-EMP-002-03 | 개인정보 열람 이력 | Must | ✅ | employee-service | `PrivacyAccessController` | `PrivacyAccessService` | 열람 이력 테이블 |
| FR-EMP-002-04 | Row Level 암호화 | Must | ✅ | common-privacy | — | `EncryptionService` | AES-GCM 256비트 |
| FR-EMP-003-01 | 사번 규칙 설정 | Must | ✅ | employee-service | `EmployeeController` | `EmployeeNumberGenerator` | `EmployeeNumberRule` |
| FR-EMP-003-02 | 퇴직 시 정보 분리 보관 | Must | 🟡 | employee-service | `EmployeeController` | `EmployeeService` | `resign()` 존재, 아카이브 테이블 미생성 |
| FR-EMP-003-03 | 재입사 사번 재활용 | Should | 🟡 | employee-service | — | `EmployeeNumberGenerator` | `allowReuse` 플래그, 아카이브 검색 TODO |
| FR-EMP-003-04 | 동명이인 감지 | Should | ❌ | — | — | — | 미구현 |
| FR-EMP-004-01 | 가족정보 CRUD | Must | ✅ | employee-service | `EmployeeFamilyController` | `EmployeeFamilyService` | `EmployeeFamily` |
| FR-EMP-004-02 | 가족관계 코드 관리 | Must | ✅ | employee-service | — | — | `FamilyRelationType` enum 6종 |
| FR-EMP-004-03 | 가족→수당 연계 | Should | 🟡 | employee-service | — | — | `isDependent` 플래그, 수당 계산 미구현 |

**완전율**: 56% (9/16 완전)

---

### 3.6 FR-ATT: 근태/휴가 관리

| ID | 요구사항 | 우선순위 | 상태 | 서비스 | Controller | Service | Entity/기타 |
|----|---------|---------|------|--------|------------|---------|-------------|
| FR-ATT-001-01 | 연차 발생 규칙 | Must | ✅ | attendance-service | `LeaveController` | `LeaveAccrualService` | `LeaveAccrualRule` (YEARLY/MONTHLY/HIRE_DATE_BASED) |
| FR-ATT-001-02 | 연차 잔여일수 조회 | Must | ✅ | attendance-service | `LeaveController` | `LeaveBalanceService` | `LeaveBalance.getAvailableDays()` |
| FR-ATT-001-03 | 연차 이월 규칙 | Must | ✅ | attendance-service | `LeaveController` | `LeaveCarryOverService` | `maxCarryOverDays` |
| FR-ATT-001-04 | 근속연수별 차등 연차 | Should | ✅ | attendance-service | — | `LeaveAccrualService` | `serviceYearBonuses` JSONB, 25일 상한 |
| FR-ATT-002-01 | 휴가 신청 | Must | ✅ | attendance-service | `LeaveController` | `LeaveService` | `Leave` |
| FR-ATT-002-02 | 반차/시간차 신청 | Must | ✅ | attendance-service | `LeaveController` | `LeaveService` | `HALF_DAY_AM/PM`, `leaveUnit`, `hoursCount` |
| FR-ATT-002-03 | 결재선 자동 지정 | Must | 🟡 | attendance-service | `LeaveController` | `LeaveService` | 추천 결재선 표시, 자동 결재 문서 생성 미완 |
| FR-ATT-002-04 | 결재자 승인/반려 | Must | ✅ | attendance-service | — | `ApprovalCompletedListener` | `handleApprovalCompleted()` 이벤트 처리 |
| FR-ATT-002-05 | 승인 시 연차 자동 차감 | Must | ✅ | attendance-service | — | `LeaveService` | `confirmUsedDays()`, `releasePendingDays()` |
| FR-ATT-002-06 | 캘린더 형태 조회 | Should | 🟡 | attendance-service | `LeaveController` | `LeaveService` | 기본 구현, 완성도 미확인 |
| FR-ATT-003-01 | 휴가 유형 정의 | Must | ✅ | attendance-service | `LeaveTypeController` | `LeaveTypeService` | `LeaveTypeConfig` (10종), `LeaveType` enum |
| FR-ATT-003-02 | 유형별 사용 조건 | Must | ✅ | attendance-service | `LeaveTypeController` | `LeaveTypeService` | `maxDaysPerYear`, `minNoticeDays`, `genderRestriction` |
| FR-ATT-003-03 | 유형별 결재선 규칙 | Should | 🟡 | attendance-service | — | — | `approvalTemplateCode` 필드 존재, 설정 UI 미완 |

**완전율**: 69% (9/13 완전)

---

### 3.7 FR-APR: 전자결재

| ID | 요구사항 | 우선순위 | 상태 | 서비스 | Controller | Service | Entity/기타 |
|----|---------|---------|------|--------|------------|---------|-------------|
| FR-APR-001-01 | 기안 양식 CRUD | Must | ✅ | approval-service | `ApprovalTemplateController` | `ApprovalTemplateService` | `ApprovalTemplate`, `ApprovalTemplateLine` |
| FR-APR-001-02 | 결재 문서 상신 | Must | ✅ | approval-service | `ApprovalController` | `ApprovalService` | `submit()` → State Machine DRAFT→IN_PROGRESS |
| FR-APR-001-03 | 결재 진행 실시간 조회 | Must | ✅ | approval-service | `ApprovalController` | `ApprovalService` | 상태 조회 API |
| FR-APR-001-04 | 관련 문서 링크 | Should | 🟡 | approval-service | `ApprovalController` | — | `related_document_ids` 컬럼 존재, API 연동 미완 |
| FR-APR-002-01 | 승인/반려 | Must | ✅ | approval-service | `ApprovalController` | `ApprovalService` | `approve()`/`reject()` + `ApprovalHistory` |
| FR-APR-002-02 | 순차 승인 | Must | ✅ | approval-service | — | `ApprovalService` | `activateFirstLine()` → `activateNextLines()` |
| FR-APR-002-03 | 병렬 승인 | Must | ✅ | approval-service | — | `ApprovalService` | `PARALLEL` lineType, `isParallelGroupCompleted()` |
| FR-APR-002-04 | 합의 (의견 제시) | Must | ✅ | approval-service | — | `ApprovalService` | `AGREEMENT` lineType, `agree()` |
| FR-APR-002-05 | 전결 | Must | ✅ | approval-service | — | `ArbitraryApprovalService` | `ArbitraryApprovalRule`, 조건 평가 엔진 |
| FR-APR-002-06 | 대결 (위임) | Must | ✅ | approval-service | — | `DelegationService` | `DelegationRule`, 기간/문서유형 제한 |
| FR-APR-003-01 | 결재선 자동 생성 | Must | ✅ | approval-service | — | `ApprovalLineResolver` | 4종 approverType |
| FR-APR-003-02 | 조건별 결재선 분기 | Must | ✅ | approval-service | — | `ApprovalLineResolver` | `ConditionalRoute` (금액/일수/유형) |
| FR-APR-003-03 | 위임전결 규칙 | Must | ✅ | approval-service | `DelegationController` | `DelegationService` | `DelegationRule` |
| FR-APR-003-04 | 기안자 결재선 수정 | Should | 🟡 | approval-service | — (BE 엔드포인트 없음) | — | FE 다이얼로그 존재, BE 미구현 |
| FR-APR-004-01 | State Machine 상태 전이 | Must | ✅ | approval-service | — | `ApprovalStateMachineConfig` | Spring State Machine, Guard/Action |
| FR-APR-004-02 | 워크플로우 히스토리 | Must | ✅ | approval-service | `ApprovalController` | `ApprovalService` | `ApprovalHistory` 엔티티 |
| FR-APR-004-03 | 결재 완료 → 모듈 반영 | Must | 🟡 | approval-service | — | — | 이벤트 발행 완비, 수신측 처리 일부 미완 |

**완전율**: 76% (13/17 완전)

---

### 3.8 FR-NTF: 알림 시스템

| ID | 요구사항 | 우선순위 | 상태 | 서비스 | Controller | Service | Entity/기타 |
|----|---------|---------|------|--------|------------|---------|-------------|
| FR-NTF-001-01 | 웹 푸시 알림 | Must | ✅ | notification-service | `NotificationController` | `NotificationDispatcher` | SSE + WebSocket/STOMP |
| FR-NTF-001-02 | 인앱 알림 센터 | Must | ✅ | notification-service | `NotificationController` | `NotificationService` | `Notification` 엔티티 |
| FR-NTF-001-03 | 읽음/안읽음 관리 | Must | ✅ | notification-service | `NotificationController` | `NotificationService` | `markAsRead()`, `markAllAsRead()` |
| FR-NTF-001-04 | 이메일 알림 | Could | 🟡 | notification-service | — | `EmailSender` | SMTP 구현 완료, AWS SES 미연동 |
| FR-NTF-001-05 | SMS 알림 | Could | ❌ | — | — | `SmsSender` | 스텁만 존재 |

**완전율**: 60% (3/5 완전)

---

### 3.9 FR-FILE: 파일 관리

| ID | 요구사항 | 우선순위 | 상태 | 서비스 | Controller | Service | Entity/기타 |
|----|---------|---------|------|--------|------------|---------|-------------|
| FR-FILE-001-01 | S3 업로드 | Must | ✅ | file-service | `FileController` | `FileStorageService` | `S3StorageStrategy`, 단건/다건 |
| FR-FILE-001-02 | Pre-signed URL 다운로드 | Must | ✅ | file-service | `FileController` | `FileStorageService` | `generatePresignedUrl()` (60분) |
| FR-FILE-001-03 | 이미지 미리보기 | Should | 🟡 | file-service | — | — | FE 타입 감지만, BE 미리보기 없음 |
| FR-FILE-001-04 | 파일 용량/형식 제한 | Must | 🟡 | file-service | `FileController` | `FileStorageService` | 전역 100MB만, 테넌트별 미구현 |

**완전율**: 50% (2/4 완전)

---

## 4. 비기능 요구사항 (NFR)

### 4.1 성능 (NFR-PERF)

| ID | 요구사항 | 목표치 | 상태 | 구현 위치 | 비고 |
|----|---------|--------|------|----------|------|
| NFR-PERF-001 | API P95 응답 | < 200ms | 🟡 | Micrometer + Prometheus | 부하 테스트 미실행 |
| NFR-PERF-002 | FCP | < 3초 | ✅ | Vite 빌드, React.lazy | 코드 스플리팅 적용 |
| NFR-PERF-003 | 동시 접속자 | 10,000명 | 🟡 | ECS Fargate Auto Scaling | 검증 필요 |
| NFR-PERF-004 | 처리량 | 1,000 TPS | 🟡 | HikariCP + Redis | 검증 필요 |

### 4.2 가용성 (NFR-AVAIL)

| ID | 요구사항 | 목표치 | 상태 | 구현 위치 | 비고 |
|----|---------|--------|------|----------|------|
| NFR-AVAIL-001 | 가용성 | 99.9% | ✅ | Multi-AZ RDS, ALB, ECS 3 replica | 아키텍처 수준 충족 |
| NFR-AVAIL-002 | RTO | < 1시간 | ✅ | RDS auto-failover | 자동 백업 7일 |
| NFR-AVAIL-003 | RPO | < 5분 | ✅ | RDS 스냅샷, 비동기 복제 | PITR 지원 |

### 4.3 확장성 (NFR-SCALE)

| ID | 요구사항 | 상태 | 구현 위치 | 비고 |
|----|---------|------|----------|------|
| NFR-SCALE-001 | 수평 확장 (K8s) | ✅ | ECS Fargate | CPU 70%/Memory 80% 기준 |
| NFR-SCALE-002 | DB Read Replica | ✅ | Terraform 모듈 | `aws_db_instance.replica` |
| NFR-SCALE-003 | 100+ 테넌트 | ✅ | PostgreSQL RLS | 13개 서비스 적용 |

### 4.4 보안 (NFR-SEC)

| ID | 요구사항 | 상태 | 구현 위치 | 비고 |
|----|---------|------|----------|------|
| NFR-SEC-001 | Keycloak SSO | ❌ | — | 자체 JWT 사용, 미연동 |
| NFR-SEC-002 | RBAC + RLS | ✅ | common-security, common-database | 7역할, 100+ 퍼미션, 전 테이블 RLS |
| NFR-SEC-003 | TLS + AES-256 | ✅ | common-privacy, RDS | AES-GCM 256비트, RDS SSL |
| NFR-SEC-004 | PIPA 마스킹 | ✅ | common-privacy | 8종 마스킹, `@Masked` |
| NFR-SEC-005 | 감사 로그 5년 | 🟡 | CloudWatch + PostgreSQL | 1년 보관, S3 WORM 미설정 |
| NFR-SEC-006 | ISMS 대비 | 🟡 | 다수 모듈 | 접근 제어 구현, 5년 보관 미충족 |

### 4.5 운영성 (NFR-OPS)

| ID | 요구사항 | 상태 | 구현 위치 | 비고 |
|----|---------|------|----------|------|
| NFR-OPS-001 | Grafana + Prometheus | ✅ | docker/prometheus, docker/grafana | 대시보드 패널 4종 |
| NFR-OPS-002 | FluentBit → CloudWatch | ✅ | K8s 설정 | 배포 대기 |
| NFR-OPS-003 | OpenTelemetry → Jaeger | ✅ | micrometer-tracing-bridge-otel | OTLP gRPC/HTTP |
| NFR-OPS-004 | Grafana Alerting | 🟡 | docker/grafana | 알림 규칙 미설정 |
| NFR-OPS-005 | RDS 백업 30일 | ✅ | Terraform | 7일(dev)/30일(prod) |

### 4.6 호환성 (NFR-COMPAT)

| ID | 요구사항 | 상태 | 구현 위치 | 비고 |
|----|---------|------|----------|------|
| NFR-COMPAT-001 | Chrome, Edge, Safari | ✅ | Playwright 설정 | 4개 브라우저 |
| NFR-COMPAT-002 | 반응형 | ✅ | Tailwind CSS | BottomTabBar 모바일 |
| NFR-COMPAT-003 | i18n 한/영 | ✅ | i18next | 400+ 번역 키, 11개 네임스페이스 |
| NFR-COMPAT-004 | WCAG 2.1 AA | 🟡 | React 컴포넌트 | ARIA 존재, 전체 감사 필요 |
| NFR-COMPAT-005 | 다크 모드 | ✅ | Tailwind dark: | ThemeToggle 컴포넌트 |

### 4.7 테스트 (NFR-TEST)

| ID | 요구사항 | 상태 | 구현 위치 | 비고 |
|----|---------|------|----------|------|
| NFR-TEST-001 | 코드 커버리지 80% | 🟡 | JaCoCo | 현재 ~5%, 24개 테스트 클래스 |
| NFR-TEST-002 | E2E Playwright | 🟡 | Playwright | 7개 테스트 파일 존재 |
| NFR-TEST-003 | Swagger/OpenAPI | 🟡 | springdoc 2.3.0 | 의존성 존재, 어노테이션 미적용 |
| NFR-TEST-004 | 데모 데이터 | 🟡 | MSW + SQL | 22개 핸들러, BE 샘플 준비 |

---

## 5. Phase 2 기능 현황

| 기능 영역 | 서비스 | 주요 Controller | 상태 | 잔여 작업 |
|----------|--------|----------------|------|----------|
| 채용 관리 | recruitment-service | `JobPostingController`, `ApplicationController`, `InterviewController`, `EvaluationController`, `BlacklistController` | ✅ BE/FE | 테스트, PDF 내보내기 |
| 발령 관리 | appointment-service | `AppointmentController`, `AppointmentBatchController` | ✅ BE/FE | 테스트, 결재 연동 |
| 증명서 관리 | certificate-service | `CertificateRequestController`, `CertificateTemplateController`, 등 6개 | ✅ BE/FE | 테스트, PDF 생성, 디지털 서명 |
| 정현원 관리 | organization-service | `HeadcountController` | ✅ BE/FE | 폼, 시각화, 결재 연동 |
| 경조비 관리 | organization-service | `CondolenceController` | ✅ BE/FE | 폼, 결재 연동 |
| 위원회 관리 | organization-service | `CommitteeController` | ✅ BE/FE | 멤버 선택 UI |
| 사원증 관리 | employee-service | `RecordCardController` | 🟡 FE | 상세/발급 페이지, BE 연동 |

---

## 6. 종합 요약

### Phase 1 기능 요구사항 (FR)

| 기능 영역 | 전체 | 완전 (✅) | 부분 (🟡) | 미구현 (❌) | 완전율 |
|-----------|------|-----------|-----------|------------|--------|
| FR-TM (테넌트) | 12 | 10 | 1 | 1 | 83% |
| FR-AUTH (인증) | 9 | 7 | 1 | 1 | 78% |
| FR-MDM (기준정보) | 7 | 7 | 0 | 0 | **100%** |
| FR-ORG (조직) | 11 | 6 | 4 | 1 | 55% |
| FR-EMP (인사) | 16 | 9 | 6 | 1 | 56% |
| FR-ATT (근태) | 13 | 9 | 4 | 0 | 69% |
| FR-APR (결재) | 17 | 13 | 3 | 0 | **76%** |
| FR-NTF (알림) | 5 | 3 | 1 | 1 | 60% |
| FR-FILE (파일) | 4 | 2 | 2 | 0 | 50% |
| **합계** | **94** | **66** | **23** | **5** | **70%** |

### 비기능 요구사항 (NFR) 요약

| 영역 | 전체 | 충족 | 부분 | 미충족 |
|------|------|------|------|--------|
| 성능 | 4 | 1 | 3 | 0 |
| 가용성 | 3 | 3 | 0 | 0 |
| 확장성 | 3 | 3 | 0 | 0 |
| 보안 | 6 | 3 | 2 | 1 |
| 운영성 | 5 | 4 | 1 | 0 |
| 호환성 | 5 | 4 | 1 | 0 |
| 테스트 | 4 | 0 | 4 | 0 |
| **합계** | **30** | **18** | **11** | **1** |

### 핵심 미구현/부분 구현 항목 (Must 우선순위)

| 순위 | 항목 | ID | 유형 | 영향도 |
|------|------|-----|------|--------|
| 1 | Keycloak SSO 미연동 | NFR-SEC-001 | 인프라 | 높음 |
| 2 | 계열사 간 인사이동 | FR-TM-003-03 | 기능 | 높음 |
| 3 | 테스트 커버리지 5% | NFR-TEST-001 | 품질 | 높음 |
| 4 | 감사 로그 5년 보관 | NFR-SEC-005 | 컴플라이언스 | 중간 |
| 5 | 조직 변경 이력 | FR-ORG-001-03 | 기능 | 중간 |

---

## 7. 관련 문서

| 문서 | 설명 |
|------|------|
| [PRD.md](../PRD.md) | 원본 제품 요구사항 |
| [PRD_GAP_ANALYSIS.md](../PRD_GAP_ANALYSIS.md) | 상세 갭 분석 |
| [CURRENT_STATUS.md](../status/CURRENT_STATUS.md) | 개발 현황 통합 |
| [SECURITY_COMPLIANCE.md](../operations/SECURITY_COMPLIANCE.md) | ISMS-P/PIPA 준수 현황 |
| [SECURITY_PATTERNS.md](../architecture/SECURITY_PATTERNS.md) | 보안 구현 패턴 |
