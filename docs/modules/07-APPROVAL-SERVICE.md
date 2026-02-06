# Module 07: Approval Service (결재 관리)

> 분석일: 2026-02-06
> 포트: 8086
> 패키지: `com.hrsaas.approval`
> DB 스키마: `hr_approval`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 결재 문서 생성 | ✅ 완료 | 제목/내용/문서유형/결재선 포함 생성, 즉시 상신 옵션 |
| 문서번호 자동채번 | ✅ 완료 | `{TYPE}-{yyyyMMdd}-{0001}` 형식, 일자별 순차 번호 |
| 결재 상신 | ✅ 완료 | DRAFT → IN_PROGRESS 상태 전이, StateMachine 기반 |
| 순차 결재 | ✅ 완료 | SEQUENTIAL 라인 타입, 순서대로 활성화 |
| 병렬 결재 | ✅ 완료 | PARALLEL 라인 타입, 같은 sequence의 모든 결재자 동시 활성화 |
| 합의 결재 | ✅ 완료 | AGREEMENT 라인 타입, 승인 권한 없이 의견만 제시 |
| 전결 | ✅ 완료 | ARBITRARY 라인 타입, 전결 시 남은 라인 SKIP 처리 |
| 반려 | ✅ 완료 | REJECT 액션 → IN_PROGRESS → REJECTED 상태 전이 |
| 회수 | ✅ 완료 | 기안자가 상신 후 회수, IN_PROGRESS/PENDING → RECALLED |
| 취소 | ✅ 완료 | 기안자가 임시저장/대기 중 취소, DRAFT/PENDING → CANCELED |
| 대결 (위임) | ✅ 완료 | DELEGATE 액션, delegateId/delegateName 설정 |
| 결재 이력 추적 | ✅ 완료 | ApprovalHistory 엔티티로 모든 액션 감사 추적 |
| 결재 요약 통계 | ✅ 완료 | 대기/승인/반려/임시저장 건수 집계 |
| 결재 검색 | ✅ 완료 | 상태, 문서유형, 요청자ID 기반 동적 검색 |
| 결재 템플릿 | ✅ 완료 | 재사용 가능한 결재선 템플릿 CRUD, 코드 유일성 검증 |
| 결재선 자동 해석 | ✅ 완료 | ApprovalLineResolver: 4종 결재자 유형 자동 해석 |
| 위임 규칙 | ✅ 완료 | DelegationRule CRUD, 기간/문서유형별 위임, 유효성 검사 |
| 전결 규칙 | ✅ 완료 | ArbitraryApprovalRule CRUD, 조건(금액/일수/등급) 평가 |
| 조건 분기 | ✅ 완료 | ConditionalRoute CRUD, 조건별 다른 템플릿으로 라우팅 |
| 이벤트 발행 | ✅ 완료 | ApprovalSubmittedEvent (상신 시), ApprovalCompletedEvent (완료 시) |
| StateMachine | ✅ 완료 | spring-statemachine-core 4.0.0, Guard/Action 완비 |
| RLS | ✅ 완료 | 5개 테이블 (document, template, delegation_rule, arbitrary_rule, conditional_route) |
| 캐싱 | ✅ 완료 | 결재 템플릿 Redis @Cacheable("approval-template") |
| ddl-auto: validate | ✅ 올바름 | Flyway 마이그레이션 + validate 모드 |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| APR-G01 | 결재선 미리보기 | HIGH | 템플릿 기반 결재선 미리보기 API 미구현 (ApprovalLineResolver 존재하나 컨트롤러에서 미노출) |
| APR-G02 | 결재 문서 수정 | MEDIUM | DRAFT 상태 문서 내용 수정 API 없음 (생성만 가능) |
| APR-G03 | 반송 (RETURN) | HIGH | ApprovalActionType.RETURN 정의되어 있으나 process() 미구현 → **정책결정: 구현** (§2.7) |
| APR-G04 | 보류 (HOLD) | LOW | ApprovalActionType.HOLD 정의되어 있으나 process() 미구현 |
| APR-G05 | 의견첨부 (COMMENT) | LOW | ApprovalActionType.COMMENT 정의되어 있으나 process() 미구현 |
| APR-G06 | 자기 결재 방지 | HIGH | 기안자가 결재선에 포함되는 경우 자기 자신 결재 방지 로직 없음 → **정책결정: 항상 차단** (§2.6) |
| APR-G07 | 결재 알림 | HIGH | notification-service 연동 없음 (결재 요청/완료 알림) |
| APR-G08 | 결재 문서 첨부파일 | MEDIUM | file-service 연동 없음 (결재 문서 첨부파일 관리) |
| APR-G09 | 관련 문서 조회 | MEDIUM | related_document_ids 컬럼 존재하나 서비스 로직/API 미구현 |
| APR-G10 | 결재 기한 관리 | HIGH | 결재 기한 설정 및 초과 시 자동 에스컬레이션 없음 → **정책결정: 기한+자동에스컬레이션** (§2.8) |
| APR-G11 | 위임 결재 시 원결재자 기록 | LOW | 대결 처리 시 원래 결재자 이력에 기록하는 로직 미흡 |
| APR-G12 | 결재선 수정 (진행 중) | MEDIUM | IN_PROGRESS 상태에서 결재선 추가/삭제 API 없음 |
| APR-G13 | 부서별/유형별 통계 | LOW | 관리자용 결재 통계 대시보드 (부서별, 기간별, 유형별) 없음 |
| APR-G14 | 일괄 결재 | HIGH | 여러 문서 동시 승인/반려 API 없음 → **정책결정: 구현, 부분실패 허용** (§2.9) |
| APR-G15 | 결재선 템플릿 권한 | LOW | 템플릿별 사용 가능 부서/직급 제한 없음 |

---

## 2. 정책 결정사항

### 2.1 결재 상태 전이 정책 ✅ 결정완료 (StateMachine 기반)

> **결정: Spring StateMachine으로 엄격한 상태 전이 관리**

**상태 전이 다이어그램:**
```
DRAFT ──SUBMIT──→ IN_PROGRESS ──COMPLETE──→ APPROVED (최종)
  │                    │
  │                    ├──REJECT_LINE──→ REJECTED (최종)
  │                    │
  │                    ├──APPROVE_LINE──→ IN_PROGRESS (내부 전이, 다음 라인 활성화)
  │                    │
  │                    ├──AGREE_LINE──→ IN_PROGRESS (내부 전이, 액션 없음)
  │                    │
  │                    ├──ARBITRARY_APPROVE──→ APPROVED (최종, 잔여 라인 SKIP)
  │                    │
  │                    └──RECALL──→ RECALLED (최종)
  │
  ├──CANCEL──→ CANCELED (최종)
  │
PENDING ──RECALL──→ RECALLED
        ──CANCEL──→ CANCELED
```

**가드 조건:**
- `parallelGroupCompleted()`: 병렬 결재 그룹의 모든 결재자가 처리 완료 시에만 다음 라인 활성화
- `isArbitraryApproval()`: 전결 라인이 승인된 경우에만 APPROVED 전이 허용
- `hasNextLine()`: 다음 결재 라인 존재 여부 확인
- `allLinesCompleted()`: 모든 결재 라인 완료 확인

### 2.2 결재 라인 유형 정책 ✅ 결정완료

| 유형 | 코드 | 동작 |
|------|------|------|
| 순차 결재 | SEQUENTIAL | 이전 결재자 완료 후 다음 결재자 활성화 |
| 병렬 결재 | PARALLEL | 같은 sequence의 모든 결재자 동시 활성화, 전원 완료 시 다음 단계 |
| 합의 | AGREEMENT | 승인 권한 없는 의견 제시, AGREED 상태로 완료 |
| 전결 | ARBITRARY | 승인 시 이후 모든 대기 라인 SKIP → 문서 즉시 APPROVED |

### 2.3 결재자 해석 정책 ✅ 결정완료

| 결재자 유형 | 코드 | 해석 방법 |
|-------------|------|-----------|
| 지정 사용자 | SPECIFIC_USER | 템플릿의 approverId 직접 사용 |
| 부서장 | DEPARTMENT_HEAD | OrganizationClient로 부서장 조회 |
| 기안자 상위자 | DRAFTER_MANAGER | EmployeeClient로 기안자의 매니저 조회 |
| 직위 보유자 | POSITION_HOLDER | OrganizationClient로 특정 직위 보유자 조회 |

**해석 실패 처리:** 해석 불가능한 라인은 `null` 반환 + 경고 로그 (결재선에서 제외)

### 2.4 문서번호 채번 정책 ✅ 결정완료

> **형식: `{TYPE}-{yyyyMMdd}-{0001}`**

- TYPE: 문서유형 대문자 (예: LEAVE, OVERTIME, GENERAL)
- 날짜: 생성일 기준 yyyyMMdd
- 순번: 4자리 zero-padded, 테넌트+접두사 기준 MAX+1

**예시:** `LEAVE-20260206-0001`, `OVERTIME-20260206-0002`

### 2.5 위임 규칙 정책 ✅ 결정완료

- 기간 기반: startDate ~ endDate 범위 내 유효
- 문서유형 필터링: `documentTypes` 필드 (null/blank = 전체 유형)
- 동시 활성 위임 허용 (여러 위임 규칙 공존 가능)
- `isEffective()`: `isActive == true && today BETWEEN startDate AND endDate`

### 2.6 자기 결재 방지 정책 ✅ 결정완료

> **결정: 항상 차단**

- 기안자가 결재선에 포함된 경우 자기 자신의 문서를 결재할 수 없음
- 결재 문서 생성 시: 결재선에 기안자가 포함되어 있으면 경고 또는 거부
- 결재 처리 시: `approverId == drafterId`인 경우 `ForbiddenException` 발생
- 에러코드: `APV_004` — "자기 자신에 대한 결재는 허용되지 않습니다"

### 2.7 반송 (RETURN) 정책 ✅ 결정완료

> **결정: 구현 — 수정 요청 후 재상신**

- 결재자가 반려 대신 반송 선택 가능
- 반송 시 문서 상태: IN_PROGRESS → RETURNED (새 상태 추가)
- 기안자가 수정 후 재상신 가능 (RETURNED → IN_PROGRESS)
- 반송 횟수 제한 없음 (무한 반송/재상신 가능)
- 재상신 시 결재선은 처음부터 다시 시작 (모든 라인 WAITING 초기화)
- ApprovalHistory에 반송/재상신 이력 기록

### 2.8 결재 기한 정책 ✅ 결정완료

> **결정: 기한 설정 + 자동 에스컬레이션**

- approval_document에 `due_date` 컬럼 추가
- approval_line에 `due_at` 컬럼 추가 (라인별 기한, 선택적)
- 기한 초과 시 자동 에스컬레이션:
  - 1단계: 결재자에게 독촉 알림 발송
  - 2단계 (추가 n일 초과): 상위 결재자에게 자동 이관 또는 관리자 알림
- 에스컬레이션 설정은 테넌트 정책으로 관리
- 스케줄러: 매일 1회 기한 초과 문서 스캔

### 2.9 일괄 결재 정책 ✅ 결정완료

> **결정: 구현 — 부분 실패 허용 방식**

- 선택한 여러 문서를 한 번에 승인/반려 처리
- 각 문서별로 개별 process() 호출 (트랜잭션 분리)
- 부분 실패 허용: 성공/실패 문서 목록을 결과에 포함
- 최대 처리 건수: 50건 (과부하 방지)
- 반려 시 일괄 사유 입력 지원

---

## 3. 아키텍처

### 3.1 서비스 구조

```
com.hrsaas.approval/
├── config/
│   ├── SecurityConfig.java                  # 보안 설정
│   ├── ApprovalStateMachineConfig.java      # 상태 머신 설정 (상태/전이/가드/액션)
│   └── ApprovalStateMachineFactory.java     # 상태 머신 팩토리 (생성/이벤트 전송)
├── controller/
│   ├── ApprovalController.java              # 결재 문서 REST API (16 엔드포인트)
│   ├── ApprovalTemplateController.java      # 결재 템플릿 REST API (6 엔드포인트)
│   ├── DelegationController.java            # 위임 규칙 REST API (9 엔드포인트)
│   └── ArbitraryApprovalRuleController.java # 전결 규칙 REST API (5 엔드포인트)
├── service/
│   ├── ApprovalService.java / impl/ApprovalServiceImpl.java
│   ├── ApprovalTemplateService.java / impl/ApprovalTemplateServiceImpl.java
│   ├── DelegationService.java / impl/DelegationServiceImpl.java
│   ├── ArbitraryApprovalRuleService.java
│   ├── ConditionalRouteService.java
│   └── ApprovalLineResolver.java            # 템플릿 결재선 → 실제 결재선 변환
├── statemachine/
│   ├── ApprovalEvent.java                   # 상태 머신 이벤트 enum (8종)
│   ├── ApprovalGuard.java                   # 상태 전이 가드 (4종)
│   └── ApprovalAction.java                  # 상태 전이 액션 (5종)
├── repository/
│   ├── ApprovalDocumentRepository.java      # 결재 문서 (11 쿼리)
│   ├── ApprovalTemplateRepository.java      # 결재 템플릿 (5 쿼리)
│   ├── DelegationRuleRepository.java        # 위임 규칙 (5 쿼리)
│   ├── ArbitraryApprovalRuleRepository.java # 전결 규칙 (2 쿼리)
│   └── ConditionalRouteRepository.java      # 조건 분기 (2 쿼리)
├── domain/
│   ├── entity/     # 8 엔티티 + 5 enum
│   ├── dto/        # 7 request + 7 response
│   └── event/      # 2 도메인 이벤트
└── client/         # OrganizationClient, EmployeeClient (Feign)
```

### 3.2 이벤트 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│ Approval Service (이벤트 발행)                                       │
│                                                                     │
│  submit() ──→ ApprovalSubmittedEvent                                │
│     - documentId, documentNumber, title, documentType               │
│     - drafterId, drafterName, currentApproverId, currentApproverName│
│     → Topic: EventTopics.APPROVAL_SUBMITTED                        │
│                                                                     │
│  process() (APPROVED/REJECTED) ──→ ApprovalCompletedEvent           │
│     - documentId, documentNumber, title, documentType, status       │
│     - drafterId, drafterName, referenceType, referenceId            │
│     → Topic: EventTopics.APPROVAL_COMPLETED                        │
└─────────────────────────────────────────────────────────────────────┘
         │                                        │
         ▼                                        ▼
┌─────────────────┐                    ┌──────────────────────┐
│ Notification Svc │                    │ Attendance Service    │
│ (결재요청 알림)   │                    │ (휴가승인/반려 처리)   │
│ ← 미연동         │                    │ ← ApprovalCompleted  │
│                  │                    │   Listener 구현됨      │
└─────────────────┘                    └──────────────────────┘
```

### 3.3 StateMachine 구조

```java
// ApprovalStateMachineConfig.java
@Configuration
@EnableStateMachineFactory
public class ApprovalStateMachineConfig
    extends StateMachineConfigurerAdapter<ApprovalStatus, ApprovalEvent> {

    // States
    states:
      initial: DRAFT
      states: PENDING, IN_PROGRESS
      end: APPROVED, REJECTED, CANCELED, RECALLED

    // Transitions (8종)
    transitions:
      DRAFT → IN_PROGRESS     [SUBMIT]         action: activateFirstLine
      DRAFT → CANCELED        [CANCEL]
      IN_PROGRESS → REJECTED  [REJECT_LINE]    action: rejectDocument
      IN_PROGRESS → APPROVED  [COMPLETE]       action: completeApproval
      IN_PROGRESS → APPROVED  [ARBITRARY]      action: processArbitraryApproval
      IN_PROGRESS → IN_PROGRESS [APPROVE_LINE] guard: parallelGroupCompleted
                                                action: activateNextLine
      IN_PROGRESS → IN_PROGRESS [AGREE_LINE]   (내부, 액션 없음)
      IN_PROGRESS → RECALLED  [RECALL]
      PENDING → RECALLED      [RECALL]
      PENDING → CANCELED      [CANCEL]
}
```

---

## 4. API 엔드포인트

### 4.1 결재 문서 (`/api/v1/approvals`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/` | 결재 문서 생성 | 인증 필요 |
| GET | `/{id}` | 결재 문서 조회 | 인증 필요 |
| GET | `/document-number/{documentNumber}` | 문서번호로 조회 | 인증 필요 |
| GET | `/my-drafts` | 내 기안 문서 목록 | 인증 필요 |
| GET | `/pending` | 내 결재 대기 목록 | 인증 필요 |
| GET | `/processed` | 내 처리 완료 목록 | 인증 필요 |
| GET | `/pending/count` | 결재 대기 건수 | 인증 필요 |
| GET | `/summary` | 결재 요약 통계 | 인증 필요 |
| GET | `/{id}/history` | 결재 이력 조회 | 인증 필요 |
| GET | `/` | 결재 검색 (status, type, userId) | 인증 필요 |
| POST | `/{id}/approve` | 승인 | 인증 필요 |
| POST | `/{id}/reject` | 반려 | 인증 필요 |
| POST | `/{id}/submit` | 상신 | 인증 필요 |
| POST | `/{id}/process` | 결재 처리 (범용) | 인증 필요 |
| POST | `/{id}/recall` | 회수 | 인증 필요 |
| POST | `/{id}/cancel` | 취소 | 인증 필요 |

### 4.2 결재 템플릿 (`/api/v1/approvals/templates`)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/` | 템플릿 생성 | HR_ADMIN, TENANT_ADMIN, SUPER_ADMIN |
| GET | `/{id}` | 템플릿 조회 | 인증 필요 |
| GET | `/code/{code}` | 코드로 조회 | 인증 필요 |
| GET | `/` | 템플릿 목록 (activeOnly, documentType) | 인증 필요 |
| PUT | `/{id}` | 템플릿 수정 | HR_ADMIN 이상 |
| DELETE | `/{id}` | 템플릿 비활성화 | HR_ADMIN 이상 |

### 4.3 위임 규칙 (`/api/v1/approvals/delegations`)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/` | 위임 규칙 생성 | 인증 필요 |
| GET | `/{id}` | 위임 규칙 조회 | 인증 필요 |
| GET | `/my` | 내 위임 목록 | 인증 필요 |
| GET | `/my/effective` | 현재 유효 위임 | 인증 필요 |
| GET | `/delegated-to-me` | 나에게 위임된 목록 | 인증 필요 |
| GET | `/` | 전체 위임 목록 | 관리자 전용 |
| POST | `/{id}/cancel` | 위임 취소 | 인증 필요 |
| DELETE | `/{id}` | 위임 삭제 | 관리자 전용 |
| POST | `/{id}/toggle-status` | 활성/비활성 토글 | 인증 필요 |

### 4.4 전결 규칙 (`/api/v1/approvals/arbitrary-rules`)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/` | 전결 규칙 생성 | 관리자 |
| GET | `/` | 전결 규칙 목록 | 관리자 |
| GET | `/{id}` | 전결 규칙 조회 | 관리자 |
| PUT | `/{id}` | 전결 규칙 수정 | 관리자 |
| DELETE | `/{id}` | 전결 규칙 삭제 | 관리자 |

---

## 5. 엔티티 모델

### 5.1 approval_document (결재 문서)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| tenant_id | UUID | NOT NULL | RLS 대상 |
| document_number | VARCHAR | UNIQUE, NOT NULL | `{TYPE}-{yyyyMMdd}-{0001}` |
| title | VARCHAR | NOT NULL | 문서 제목 |
| content | TEXT | | 문서 내용 |
| document_type | VARCHAR | NOT NULL | 문서 유형 (LEAVE, OVERTIME, GENERAL 등) |
| status | VARCHAR | NOT NULL, DEFAULT 'DRAFT' | DRAFT/PENDING/IN_PROGRESS/APPROVED/REJECTED/CANCELED/RECALLED |
| drafter_id | UUID | NOT NULL | 기안자 ID |
| drafter_name | VARCHAR | NOT NULL | 기안자 이름 |
| drafter_department_id | UUID | | 기안자 부서 ID |
| drafter_department_name | VARCHAR | | 기안자 부서명 |
| submitted_at | TIMESTAMP | | 상신 시각 |
| completed_at | TIMESTAMP | | 완료 시각 |
| reference_type | VARCHAR | | 참조 엔티티 유형 (LEAVE_REQUEST 등) |
| reference_id | UUID | | 참조 엔티티 ID |
| related_document_ids | UUID[] | | 관련 문서 ID 배열 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |
| created_by | VARCHAR | | |
| updated_by | VARCHAR | | |

**인덱스:** tenant_id, document_type, status, drafter_id, submitted_at, reference(type+id), (tenant_id, status), (tenant_id, drafter_id)

### 5.2 approval_line (결재 라인)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| document_id | UUID | FK → approval_document, NOT NULL | |
| sequence | INTEGER | NOT NULL | 결재 순서 |
| line_type | VARCHAR | NOT NULL, DEFAULT 'SEQUENTIAL' | SEQUENTIAL/PARALLEL/AGREEMENT/ARBITRARY |
| approver_id | UUID | NOT NULL | 결재자 ID |
| approver_name | VARCHAR | | 결재자 이름 |
| approver_position | VARCHAR | | 결재자 직위 |
| approver_department_name | VARCHAR | | 결재자 부서명 |
| delegate_id | UUID | | 대결자 ID |
| delegate_name | VARCHAR | | 대결자 이름 |
| status | VARCHAR | NOT NULL, DEFAULT 'WAITING' | WAITING/ACTIVE/APPROVED/REJECTED/AGREED/SKIPPED |
| action_type | VARCHAR | | APPROVE/REJECT/AGREE/DELEGATE/RETURN/HOLD/COMMENT |
| comment | TEXT | | 결재 의견 |
| activated_at | TIMESTAMP | | 활성화 시각 |
| completed_at | TIMESTAMP | | 완료 시각 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**인덱스:** document_id, approver_id, delegate_id, status, (document_id, sequence)

### 5.3 approval_history (결재 이력)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| document_id | UUID | FK → approval_document, NOT NULL | |
| actor_id | UUID | NOT NULL | 수행자 ID |
| actor_name | VARCHAR | | 수행자 이름 |
| action_type | VARCHAR | NOT NULL | 액션 유형 |
| from_status | VARCHAR | | 이전 상태 |
| to_status | VARCHAR | | 이후 상태 |
| comment | TEXT | | 코멘트 |
| ip_address | VARCHAR | | IP 주소 |
| step_order | INTEGER | DEFAULT 0 | 처리 순서 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |
| created_by | VARCHAR | | |
| updated_by | VARCHAR | | |

**인덱스:** document_id, actor_id, action_type, (document_id, step_order)

### 5.4 approval_template (결재 템플릿)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | RLS 대상 |
| code | VARCHAR | NOT NULL, UNIQUE(tenant_id+code) | 템플릿 코드 |
| name | VARCHAR | NOT NULL | 템플릿 이름 |
| document_type | VARCHAR | NOT NULL | 적용 문서 유형 |
| description | VARCHAR | | 설명 |
| is_active | BOOLEAN | DEFAULT true | 활성 여부 |
| sort_order | INTEGER | | 정렬 순서 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |
| created_by | VARCHAR | | |
| updated_by | VARCHAR | | |

**인덱스:** tenant_id, document_type, is_active, (tenant_id, document_type)

### 5.5 approval_template_line (결재 템플릿 라인)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| template_id | UUID | FK → approval_template, NOT NULL | |
| sequence | INTEGER | NOT NULL | 순서 |
| line_type | VARCHAR | NOT NULL, DEFAULT 'SEQUENTIAL' | 라인 유형 |
| approver_type | VARCHAR | NOT NULL | SPECIFIC_USER/DEPARTMENT_HEAD/POSITION_HOLDER/DRAFTER_MANAGER |
| approver_id | UUID | | 지정 결재자 ID (SPECIFIC_USER) |
| approver_name | VARCHAR | | 지정 결재자 이름 |
| position_code | VARCHAR | | 직위 코드 (POSITION_HOLDER) |
| department_id | UUID | | 부서 ID (DEPARTMENT_HEAD) |
| description | VARCHAR | | 설명 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**인덱스:** template_id, (template_id, sequence), approver_type

### 5.6 delegation_rule (위임 규칙)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | RLS 대상 |
| delegator_id | UUID | NOT NULL | 위임자 (원결재자) ID |
| delegator_name | VARCHAR | | 위임자 이름 |
| delegate_id | UUID | NOT NULL | 대결자 ID |
| delegate_name | VARCHAR | | 대결자 이름 |
| start_date | DATE | NOT NULL | 위임 시작일 |
| end_date | DATE | NOT NULL | 위임 종료일 |
| document_types | VARCHAR | | 대상 문서유형 (콤마 구분, null=전체) |
| reason | VARCHAR | | 위임 사유 |
| is_active | BOOLEAN | DEFAULT true | 활성 여부 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |
| created_by | VARCHAR | | |
| updated_by | VARCHAR | | |

**인덱스:** tenant_id, delegator_id, delegate_id, is_active, (start_date, end_date), (tenant_id, delegator_id)

### 5.7 arbitrary_approval_rule (전결 규칙)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | RLS 대상 |
| document_type | VARCHAR | | 대상 문서유형 (null=전체) |
| condition_type | VARCHAR | NOT NULL | 조건 유형 (AMOUNT, DAYS, GRADE) |
| condition_operator | VARCHAR | NOT NULL | 연산자 (LT, LTE, GT, GTE, EQ) |
| condition_value | VARCHAR | NOT NULL | 비교 값 |
| skip_to_sequence | INTEGER | | 건너뛸 시퀀스 |
| is_active | BOOLEAN | DEFAULT true | 활성 여부 |
| description | VARCHAR | | 설명 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**인덱스:** tenant_id, document_type, (tenant_id, document_type)

### 5.8 conditional_route (조건 분기)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | RLS 대상 |
| template_id | UUID | FK → approval_template | 원본 템플릿 |
| condition_field | VARCHAR | NOT NULL | 조건 필드 (amount, days, leave_type 등) |
| condition_operator | VARCHAR | NOT NULL | 연산자 (LT, LTE, GT, GTE, EQ) |
| condition_value | VARCHAR | NOT NULL | 비교 값 |
| target_template_id | UUID | FK → approval_template | 대상 템플릿 |
| priority | INTEGER | DEFAULT 0 | 평가 우선순위 (낮을수록 먼저) |
| is_active | BOOLEAN | DEFAULT true | 활성 여부 |
| created_at | TIMESTAMP | NOT NULL | |
| updated_at | TIMESTAMP | NOT NULL | |

**인덱스:** tenant_id, (tenant_id, template_id), target_template_id

---

## 6. 상태 머신 상세

### 6.1 ApprovalStatus (문서 상태)

| 상태 | 코드 | 설명 | 종료 상태 |
|------|------|------|-----------|
| 임시저장 | DRAFT | 기안 작성 중 | |
| 결재대기 | PENDING | 상신 대기 | |
| 결재진행 | IN_PROGRESS | 결재선 처리 중 | |
| 승인완료 | APPROVED | 최종 승인 | ✅ |
| 반려 | REJECTED | 반려됨 | ✅ |
| 취소 | CANCELED | 기안자 취소 | ✅ |
| 회수 | RECALLED | 기안자 회수 | ✅ |

### 6.2 ApprovalLineStatus (결재 라인 상태)

| 상태 | 코드 | 설명 |
|------|------|------|
| 대기 | WAITING | 결재 순서 대기 |
| 활성 | ACTIVE | 현재 결재 차례 |
| 승인 | APPROVED | 승인 완료 |
| 반려 | REJECTED | 반려됨 |
| 합의 | AGREED | 합의 완료 (의견만) |
| 건너뜀 | SKIPPED | 전결/기타 사유로 건너뜀 |

### 6.3 ApprovalEvent (상태 머신 이벤트)

| 이벤트 | 트리거 조건 | 소스 → 타겟 |
|--------|-----------|------------|
| SUBMIT | 기안자 상신 | DRAFT → IN_PROGRESS |
| APPROVE_LINE | 결재자 승인 (다음 라인 있음) | IN_PROGRESS → IN_PROGRESS |
| REJECT_LINE | 결재자 반려 | IN_PROGRESS → REJECTED |
| AGREE_LINE | 합의자 합의 | IN_PROGRESS → IN_PROGRESS |
| RECALL | 기안자 회수 | IN_PROGRESS/PENDING → RECALLED |
| CANCEL | 기안자 취소 | DRAFT/PENDING → CANCELED |
| COMPLETE | 모든 결재 라인 완료 | IN_PROGRESS → APPROVED |
| ARBITRARY_APPROVE | 전결 승인 | IN_PROGRESS → APPROVED |

### 6.4 ApprovalAction (상태 머신 액션)

| 액션 | 이벤트 | 동작 |
|------|--------|------|
| activateFirstLine | SUBMIT | 첫 번째 sequence의 결재 라인 활성화 |
| activateNextLine | APPROVE_LINE | 다음 sequence의 결재 라인 활성화 (PARALLEL 동시 활성화) |
| completeApproval | COMPLETE | 문서 completedAt 설정, 최종 승인 처리 |
| rejectDocument | REJECT_LINE | 문서 반려 처리 |
| processArbitraryApproval | ARBITRARY_APPROVE | 남은 WAITING 라인 SKIP 처리, completedAt 설정 |

### 6.5 ApprovalGuard (상태 전이 가드)

| 가드 | 적용 전이 | 조건 |
|------|----------|------|
| parallelGroupCompleted | APPROVE_LINE | 현재 sequence의 모든 PARALLEL 결재자 처리 완료 |
| isArbitraryApproval | ARBITRARY_APPROVE | 완료된 라인이 ARBITRARY 타입이고 APPROVED |
| hasNextLine | - | 다음 sequence의 결재 라인 존재 |
| allLinesCompleted | - | 모든 결재 라인이 WAITING/ACTIVE 아닌 상태 |

---

## 7. Enum 정의

### 7.1 ApprovalActionType (결재 액션 유형)

| 값 | 설명 | process()에서 처리 |
|----|------|-------------------|
| APPROVE | 승인 | ✅ |
| REJECT | 반려 | ✅ |
| AGREE | 합의 | ✅ |
| DELEGATE | 대결 | ✅ |
| RETURN | 반송 | ⏳ 구현 예정 (APR-G03, §2.7) |
| HOLD | 보류 | ❌ 미구현 (APR-G04) |
| COMMENT | 의견첨부 | ❌ 미구현 (APR-G05) |

### 7.2 조건 연산자

ArbitraryApprovalRule과 ConditionalRoute에서 공통 사용:

| 연산자 | 의미 | 숫자 비교 | 문자 비교 |
|--------|------|----------|----------|
| LT | < | double 비교 | 미지원 |
| LTE | <= | double 비교 | 미지원 |
| GT | > | double 비교 | 미지원 |
| GTE | >= | double 비교 | 미지원 |
| EQ | == | double 비교 | 문자열 equals |

**평가 로직:**
```java
// ArbitraryApprovalRule.evaluate(String actualValue)
try {
    double actual = Double.parseDouble(actualValue);
    double target = Double.parseDouble(conditionValue);
    return switch (conditionOperator) {
        case "LT"  -> actual < target;
        case "LTE" -> actual <= target;
        case "GT"  -> actual > target;
        case "GTE" -> actual >= target;
        case "EQ"  -> actual == target;
        default -> false;
    };
} catch (NumberFormatException e) {
    return "EQ".equals(conditionOperator) && conditionValue.equals(actualValue);
}
```

---

## 8. 설정값

### 8.1 application.yml

```yaml
server:
  port: 8086

spring:
  application:
    name: approval-service
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/hr_saas
    username: ${DB_USERNAME:hr_saas}
    password: ${DB_PASSWORD:hr_saas_password}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        default_schema: hr_approval
  flyway:
    enabled: true
    locations: classpath:db/migration
    schemas: hr_approval
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6381}
      password: ${REDIS_PASSWORD:redis_password}
  cloud:
    aws:
      region:
        static: ${AWS_REGION:ap-northeast-2}
      sns:
        endpoint: ${AWS_SNS_ENDPOINT:http://localhost:4566}
      sqs:
        endpoint: ${AWS_SQS_ENDPOINT:http://localhost:4566}

jwt:
  secret: ${JWT_SECRET:...}
  access-token-expiry: 1800    # 30분
  refresh-token-expiry: 604800 # 7일

logging:
  level:
    com.hrsaas: DEBUG
    org.springframework.security: DEBUG
```

### 8.2 build.gradle 의존성

```groovy
dependencies {
    // Common modules
    implementation project(':common:common-core')
    implementation project(':common:common-entity')
    implementation project(':common:common-response')
    implementation project(':common:common-database')
    implementation project(':common:common-tenant')
    implementation project(':common:common-security')
    implementation project(':common:common-cache')
    implementation project(':common:common-event')

    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'

    // Spring Cloud (Feign, CircuitBreaker)
    implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
    implementation 'org.springframework.cloud:spring-cloud-starter-circuitbreaker-resilience4j'

    // State Machine
    implementation 'org.springframework.statemachine:spring-statemachine-core:4.0.0'

    // Database
    runtimeOnly 'org.postgresql:postgresql'
    implementation 'org.flywaydb:flyway-core'

    // API Documentation
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui'

    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testImplementation 'org.testcontainers:postgresql'
    testImplementation 'org.testcontainers:junit-jupiter'
}
```

---

## 9. 에러코드

| 코드 | HTTP | 메시지 | 발생 위치 |
|------|------|--------|----------|
| APV_001 | 404 | 결재 문서를 찾을 수 없습니다 | ApprovalServiceImpl.findById(), getByDocumentNumber() |
| APV_002 | 403 | 결재 권한이 없습니다 | ApprovalServiceImpl.process() — ACTIVE 라인에 해당 결재자 없음 |
| APV_003 | 403 | 본인이 기안한 문서만 회수/취소할 수 있습니다 | ApprovalServiceImpl.recall(), cancel() |
| APV_004 | 403 | 자기 자신에 대한 결재는 허용되지 않습니다 | ApprovalServiceImpl.process() — 기안자=결재자 (§2.6) |
| APV_005 | 400 | 기안자를 결재선에 포함할 수 없습니다 | ApprovalServiceImpl.create() — 결재선 검증 (§2.6) |
| IllegalStateException | 400 | Cannot submit/recall/cancel document in current state | StateMachine 상태 전이 실패 시 |
| IllegalArgumentException | 400 | Unsupported action type / Cannot map action to SM event | process() — 미지원 액션 타입 |

---

## 10. 갭 구현 사양

### APR-G01: 결재선 미리보기 (HIGH)

**현재 상태:** `ApprovalLineResolver`가 존재하지만 컨트롤러에서 직접 호출하는 API 없음

**구현 방향:**
```java
// ApprovalTemplateController.java에 추가
@PostMapping("/{id}/preview")
public ResponseEntity<ApiResponse<List<ApprovalLineResponse>>> previewApprovalLines(
        @PathVariable UUID id,
        @RequestBody PreviewApprovalLineRequest request) {
    // 1. 템플릿 조회
    // 2. 조건 분기 평가 (ConditionalRouteService.evaluateRoutes)
    // 3. ApprovalLineResolver.resolveTemplateLines() 호출
    // 4. 결과 반환 (결재자 이름, 직위, 부서, 라인 타입)
}
```

### APR-G02: 결재 문서 수정 (MEDIUM)

**구현 방향:**
```java
// ApprovalController에 추가
@PutMapping("/{id}")
// DRAFT 상태에서만 제목, 내용, 결재선 수정 가능
// 결재선 변경 시 기존 라인 삭제 후 재생성
```

### APR-G03: 반송 (RETURN) (HIGH) — 정책결정 완료

**정책:** 결재자가 기안자에게 수정 요청 후 재상신 가능

**구현 방향:**
1. **새 상태 추가:**
   - `ApprovalStatus.RETURNED` 추가 (종료 상태 아님)
   - `ApprovalLineStatus.RETURNED` 추가
   - `ApprovalEvent.RETURN_LINE` 추가
2. **StateMachine 전이 추가:**
   - `IN_PROGRESS → RETURNED` (RETURN_LINE 이벤트)
   - `RETURNED → IN_PROGRESS` (SUBMIT 이벤트 재사용 — 재상신)
3. **process()에 RETURN 케이스 추가:**
   ```java
   case RETURN -> {
       currentLine.returnToSender(request.getComment());
       // 모든 라인 WAITING으로 초기화
       document.resetApprovalLines();
   }
   ```
4. **재상신 시:** 모든 결재 라인을 WAITING으로 초기화, 첫 번째 라인부터 재시작
5. **이력:** ApprovalHistory에 RETURN 액션, 재상신 액션 각각 기록
6. **SQL 마이그레이션:** `V3__add_returned_status.sql` — RETURNED 상태 관련 변경

### APR-G06: 자기 결재 방지 (HIGH) — 정책결정 완료

**정책:** 항상 차단 — 기안자는 자기 문서 결재 불가

**구현 방향:**
1. **결재 처리 시 검증 (ApprovalServiceImpl.process()):**
   ```java
   if (approverId.equals(document.getDrafterId())) {
       throw new ForbiddenException("APV_004", "자기 자신에 대한 결재는 허용되지 않습니다");
   }
   ```
2. **결재 문서 생성 시 경고 (ApprovalServiceImpl.create()):**
   - 결재선에 기안자가 포함된 경우 검증 후 거부
   ```java
   request.getApprovalLines().stream()
       .filter(l -> l.getApproverId().equals(drafterId))
       .findAny()
       .ifPresent(l -> {
           throw new BadRequestException("APV_005", "기안자를 결재선에 포함할 수 없습니다");
       });
   ```
3. **에러코드 추가:** APV_004 (자기 결재), APV_005 (결재선에 기안자 포함)

### APR-G07: 결재 알림 (HIGH)

**구현 방향:**
- `ApprovalSubmittedEvent` 발행 시 → notification-service에서 결재 요청 알림
- `ApprovalCompletedEvent` 발행 시 → notification-service에서 결재 완료/반려 알림
- 알림 유형: SSE 실시간 + 이메일 (선택적)
- notification-service에 SQS Listener 추가 필요

### APR-G10: 결재 기한 관리 (HIGH) — 정책결정 완료

**정책:** 기한 설정 + 자동 에스컬레이션

**구현 방향:**
1. **DB 스키마 변경:**
   ```sql
   ALTER TABLE approval_document ADD COLUMN due_date TIMESTAMP;
   ALTER TABLE approval_line ADD COLUMN due_at TIMESTAMP;
   ```
2. **에스컬레이션 설정 (테넌트 정책):**
   ```java
   // 테넌트 정책 설정
   approval.escalation.reminder_after_hours: 24   // 기한 초과 24시간 후 독촉 알림
   approval.escalation.escalate_after_hours: 72   // 기한 초과 72시간 후 자동 이관
   approval.escalation.target: UPPER_APPROVER     // UPPER_APPROVER / HR_ADMIN
   ```
3. **스케줄러 구현 (ApprovalDeadlineScheduler):**
   - `@Scheduled(cron = "0 0 9 * * *")` — 매일 09:00 실행
   - 기한 초과 문서 스캔
   - 1단계: `reminder_after_hours` 초과 → 결재자에게 독촉 알림 (notification-service)
   - 2단계: `escalate_after_hours` 초과 → 상위 결재자에게 자동 이관 또는 관리자 알림
4. **이관 로직:**
   - 현재 결재자의 상위자를 OrganizationClient로 조회
   - 새 결재 라인 추가 (에스컬레이션) 또는 위임 자동 적용
   - ApprovalHistory에 에스컬레이션 이력 기록

### APR-G14: 일괄 결재 (HIGH) — 정책결정 완료

**정책:** 구현, 부분 실패 허용, 최대 50건

**구현 방향:**
1. **API 엔드포인트:**
   ```java
   @PostMapping("/batch/approve")
   public ResponseEntity<ApiResponse<BatchApprovalResponse>> batchApprove(
           @Valid @RequestBody BatchApprovalRequest request) {
       // 최대 50건 제한
   }

   @PostMapping("/batch/reject")
   public ResponseEntity<ApiResponse<BatchApprovalResponse>> batchReject(
           @Valid @RequestBody BatchApprovalRequest request) {
       // 일괄 반려 (공통 사유)
   }
   ```
2. **Request/Response DTO:**
   ```java
   public class BatchApprovalRequest {
       @NotEmpty @Size(max = 50)
       List<UUID> documentIds;
       String comment;  // 일괄 사유 (반려 시 필수)
   }

   public class BatchApprovalResponse {
       List<BatchResultItem> results;
       int successCount;
       int failureCount;
   }

   public class BatchResultItem {
       UUID documentId;
       boolean success;
       String error;  // 실패 시 에러 메시지
   }
   ```
3. **트랜잭션:** 각 문서별 개별 트랜잭션 (`@Transactional(propagation = REQUIRES_NEW)`)
4. **부분 실패 허용:** 성공/실패 결과를 모두 응답에 포함

---

## 11. 테스트 시나리오

### 11.1 단위 테스트

| 대상 | 시나리오 | 검증 항목 |
|------|---------|----------|
| ApprovalServiceImpl | create_withSubmitImmediately_statusInProgress | 즉시 상신 시 IN_PROGRESS 상태 |
| ApprovalServiceImpl | create_withoutSubmit_statusDraft | 임시저장 시 DRAFT 상태 |
| ApprovalServiceImpl | submit_fromDraft_statusInProgress | DRAFT → IN_PROGRESS 전이 |
| ApprovalServiceImpl | submit_fromApproved_throwsException | 종료 상태에서 상신 불가 |
| ApprovalServiceImpl | process_approve_nextLineActivated | 승인 시 다음 결재자 활성화 |
| ApprovalServiceImpl | process_approve_lastLine_statusApproved | 마지막 결재자 승인 → APPROVED |
| ApprovalServiceImpl | process_reject_statusRejected | 반려 → REJECTED |
| ApprovalServiceImpl | process_notActiveApprover_throwsForbidden | 결재 권한 없는 사용자 거부 |
| ApprovalServiceImpl | process_delegate_setsDelegate | 대결 처리 확인 |
| ApprovalServiceImpl | process_arbitraryApprove_remainingSkipped | 전결 시 잔여 라인 SKIP |
| ApprovalServiceImpl | recall_byDrafter_statusRecalled | 기안자 회수 |
| ApprovalServiceImpl | recall_notDrafter_throwsForbidden | 타인 회수 거부 |
| ApprovalServiceImpl | cancel_fromDraft_statusCanceled | 임시저장 취소 |
| ApprovalServiceImpl | generateDocumentNumber_sequential | 순차 채번 |
| ApprovalDocument | processLineCompletion_parallel_allDone | 병렬 그룹 완료 확인 |
| ApprovalDocument | processLineCompletion_parallel_partialDone | 병렬 일부만 완료 시 대기 |
| ApprovalLine | approve_fromActive_statusApproved | ACTIVE → APPROVED |
| ApprovalLine | approve_fromWaiting_throwsException | WAITING 상태에서 승인 불가 |
| ApprovalLineResolver | resolve_specificUser_directMapping | 지정 사용자 해석 |
| ApprovalLineResolver | resolve_departmentHead_viaCient | 부서장 Feign 조회 |
| ApprovalLineResolver | resolve_unresolvedLine_returnsNull | 해석 실패 시 null |
| DelegationRule | isEffective_withinDateRange_true | 유효 기간 내 |
| DelegationRule | isEffective_outsideDateRange_false | 유효 기간 밖 |
| DelegationRule | isEffectiveForType_nullTypes_allMatch | 전체 유형 매칭 |
| ArbitraryApprovalRule | evaluate_amountLessThan_true | 금액 < 조건값 |
| ArbitraryApprovalRule | evaluate_stringEquality_true | 문자열 EQ |
| ConditionalRouteService | evaluateRoutes_firstMatch_returnsTargetId | 첫 매칭 라우트 반환 |
| ApprovalTemplateServiceImpl | create_duplicateCode_throwsException | 코드 중복 생성 거부 |

### 11.2 통합 테스트

| 시나리오 | 검증 항목 |
|---------|----------|
| 결재 문서 전체 라이프사이클 | 생성 → 상신 → 승인 → 완료 (APPROVED) |
| 병렬 결재 워크플로우 | 2명 병렬 → 모두 승인 → 다음 단계 |
| 전결 워크플로우 | 상신 → 1단계 전결 승인 → 나머지 SKIP → APPROVED |
| 반려 워크플로우 | 상신 → 2단계에서 반려 → REJECTED |
| 회수 워크플로우 | 상신 → 기안자 회수 → RECALLED |
| 위임 결재 | 위임 규칙 생성 → 대결자가 결재 |
| 조건 분기 | 금액 기반 조건 → 다른 템플릿 적용 |
| 이벤트 발행 검증 | 상신 시 ApprovalSubmittedEvent, 완료 시 ApprovalCompletedEvent |
| RLS 테넌트 격리 | A 테넌트 문서를 B 테넌트에서 조회 불가 |
| 동시성 처리 | 동시 승인/반려 시 상태 일관성 |

---

## 12. 의존성

### 12.1 이 서비스가 호출하는 서비스

| 대상 서비스 | 클라이언트 | 용도 |
|------------|-----------|------|
| organization-service | OrganizationClient (Feign) | 부서장 조회, 직위 보유자 조회 (결재선 해석) |
| employee-service | EmployeeClient (Feign) | 기안자 상위자(매니저) 조회 (결재선 해석) |

### 12.2 이 서비스를 호출하는 서비스

| 호출 서비스 | 방식 | 용도 |
|------------|------|------|
| attendance-service | 이벤트 구독 (ApprovalCompletedEvent via SQS) | 휴가/초과근무 승인/반려 결과 수신 |

### 12.3 발행하는 이벤트

| 이벤트 | 토픽 | 발행 시점 | 페이로드 |
|--------|------|----------|---------|
| ApprovalSubmittedEvent | EventTopics.APPROVAL_SUBMITTED | submit() 호출 시 | documentId, documentNumber, title, documentType, drafterId, drafterName, currentApproverId, currentApproverName |
| ApprovalCompletedEvent | EventTopics.APPROVAL_COMPLETED | process()에서 APPROVED/REJECTED 시 | documentId, documentNumber, title, documentType, status, drafterId, drafterName, referenceType, referenceId |

### 12.4 구독하는 이벤트

**없음** — approval-service는 이벤트를 발행만 하고 외부 이벤트를 구독하지 않음

---

## 13. 결재 흐름 상세 예시

### 13.1 순차 3단계 결재

```
기안자 → [상신] → 팀장(seq=1, SEQUENTIAL) → [승인] → 부장(seq=2, SEQUENTIAL) → [승인] → 임원(seq=3, SEQUENTIAL) → [승인] → APPROVED

1. create(): document(DRAFT), 3 lines(WAITING)
2. submit(): document(IN_PROGRESS), line1(ACTIVE)
3. process(approve, 팀장): line1(APPROVED), line2(ACTIVE)
4. process(approve, 부장): line2(APPROVED), line3(ACTIVE)
5. process(approve, 임원): line3(APPROVED), document(APPROVED)
```

### 13.2 병렬 결재 포함

```
기안자 → 팀장(seq=1) → [병렬] 부장A(seq=2), 부장B(seq=2) → 임원(seq=3) → APPROVED

1. submit(): line1(ACTIVE)
2. process(approve, 팀장): line1(APPROVED), line2A(ACTIVE), line2B(ACTIVE)
3. process(approve, 부장A): line2A(APPROVED), line2B 아직 ACTIVE
4. process(approve, 부장B): line2B(APPROVED), parallelGroupCompleted → line3(ACTIVE)
5. process(approve, 임원): line3(APPROVED), document(APPROVED)
```

### 13.3 전결 시나리오

```
기안자 → 팀장(seq=1, ARBITRARY) → 부장(seq=2) → 임원(seq=3) → APPROVED/SKIP

1. submit(): line1(ACTIVE)
2. process(approve, 팀장, ARBITRARY):
   line1(APPROVED), line2(SKIPPED), line3(SKIPPED),
   document(APPROVED) ← 전결로 즉시 승인
```

---

## 14. SQL 마이그레이션 요약

| 파일 | 내용 |
|------|------|
| V1__init.sql | 스키마 생성, 6개 테이블 (document, line, history, template, template_line, delegation_rule), RLS 정책, 인덱스, `get_current_tenant_safe()` 함수 |
| V2__add_arbitrary_approval_rules.sql | 2개 테이블 추가 (arbitrary_approval_rule, conditional_route), approval_document에 related_document_ids UUID[] 컬럼 추가, RLS 정책, 인덱스, updated_at 트리거 |

**총 8개 테이블, 5개 RLS 대상 테이블**
