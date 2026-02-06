# Module 12: Appointment Service (발령관리)

> 분석일: 2026-02-06
> 포트: 8091
> 패키지: `com.hrsaas.appointment`
> DB 스키마: `hr_appointment`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 발령안(Draft) CRUD | ✅ 완료 | 생성/수정/삭제, 발령번호 자동채번 (APT-{YYYY}-{NNNN}) |
| 발령상세(Detail) 관리 | ✅ 완료 | 발령안에 대상 직원 추가/제거, 중복 방지 (동일 직원+발령유형) |
| 발령유형 10종 | ✅ 완료 | 승진, 전보, 보직변경, 직무변경, 휴직, 복직, 사직, 정년퇴직, 강등, 겸직 |
| 상태머신 | ✅ 완료 | DRAFT→PENDING_APPROVAL→APPROVED→EXECUTED, CANCELLED |
| 발령 이력 | ✅ 완료 | AppointmentHistory — fromValues/toValues JSONB, 발령번호 추적 |
| 예약 발령 | ✅ 완료 | AppointmentSchedule — 예약일시 설정, 자동 시행, 실패 재시도 (최대 3회) |
| 발령 통계 | ✅ 완료 | 연도/월별 발령유형별 집계 |
| 결재 이벤트 리스너 | ✅ 완료 | ApprovalCompletedListener — SQS 수신 (처리 로직은 TODO) |
| 스케줄러 | ✅ 완료 | 매일 00:01 예약 발령 처리, 매시 :30 실패 건 재시도 |
| RLS | ✅ 완료 | 전 테이블 tenant_id 기반 Row Level Security |
| 개인정보 마스킹 | ✅ 완료 | AppointmentDetailResponse, HistoryResponse에 @Masked 적용 |
| Redis 캐시 | ✅ 완료 | Draft 변경 시 @CacheEvict |
| 에러 코드 체계 | ✅ 완료 | APT_001~012 비즈니스 예외 정의 |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| APT-G01 | Employee Service 연동 | HIGH | 발령 시행 시 직원 정보 변경 없음 (TODO 스텁) → **정책결정: 이벤트 기반 비동기** (§2.1) |
| APT-G02 | Approval Service 연동 | HIGH | submit() 시 random UUID 할당 스텁 → **정책결정: Approval 연동** (§2.2) |
| APT-G03 | 발령 롤백 | HIGH | rollback() TODO 스텁 → **정책결정: 완전 롤백** (§2.3) |
| APT-G04 | 결재 완료 처리 | HIGH | ApprovalCompletedListener.handleApprovalCompleted() TODO 스텁 |
| APT-G05 | 직원 정보 조회 | HIGH | createDetail() 시 Employee Service 미조회 (이름/사번/현재 부서·직급 미자동) |
| APT-G06 | 현재 사용자 ID | MEDIUM | executedBy에 tenantId 사용 (TODO: 현재 로그인 사용자 ID) |
| APT-G07 | FE 발령이력 페이지 | MEDIUM | BE에 이력 API 있으나 FE에 이력 조회 페이지 없음 |
| APT-G08 | FE 통계 페이지 | LOW | BE에 통계 API 있으나 FE에 통계 대시보드 없음 |
| APT-G09 | 일괄 발령 | MEDIUM | 엑셀/CSV 업로드를 통한 대량 발령 미지원 |
| APT-G10 | 발령 알림 | MEDIUM | 발령 시행 시 대상 직원에게 알림 없음 |
| APT-G11 | FE-BE 필드명 불일치 | MEDIUM | FE detail DTO 필드명 차이 (§3.1) |
| APT-G12 | Summary 엔드포인트 | MEDIUM | FE에서 호출하는 `GET /drafts/summary` BE에 없음 |

---

## 2. 정책 결정사항

### 2.1 Employee Service 동기화 ✅ 결정완료

> **결정: 이벤트 기반 비동기 (SNS/SQS)**

- 발령 시행(execute) 시:
  1. 각 Detail별로 `AppointmentExecutedEvent` 발행 (SNS 토픽: `hr-saas.appointment.executed`)
  2. Employee Service가 이벤트 수신하여 직원 정보 변경 반영
  3. 변경 결과 이벤트 수신으로 Detail 상태 업데이트 (EXECUTED/FAILED)
- 이벤트 페이로드:
  ```json
  {
    "eventType": "appointment.executed",
    "draftNumber": "APT-2026-0001",
    "detailId": "...",
    "employeeId": "...",
    "appointmentType": "PROMOTION",
    "effectiveDate": "2026-03-01",
    "changes": {
      "departmentId": {"from": "dept-001", "to": "dept-002"},
      "gradeCode": {"from": "G4", "to": "G3"},
      "positionCode": {"from": "P02", "to": "P01"}
    },
    "tenantId": "..."
  }
  ```
- Employee Service 처리:
  - PROMOTION: grade 변경
  - TRANSFER: department 변경
  - POSITION_CHANGE: position 변경
  - LEAVE_OF_ABSENCE: 상태를 ON_LEAVE로 변경
  - REINSTATEMENT: 상태를 ACTIVE로 복원
  - RESIGNATION/RETIREMENT: 상태를 TERMINATED로 변경 + 퇴직일 기록
  - DEMOTION: grade 변경
  - CONCURRENT: 겸직 정보 추가
- 실패 처리: DLQ + Detail 상태 FAILED + errorMessage 기록 → HR 알림

### 2.2 Approval Service 연동 ✅ 결정완료

> **결정: Approval Service 결재 엔진과 연동**

- submit() 수정:
  1. Draft 상태를 PENDING_APPROVAL로 변경
  2. Approval Service에 결재 요청 생성 (Feign Client)
  3. 반환된 approvalId 저장
- 결재 양식:
  ```
  제목: [발령] {title}
  본문: 시행일, 대상자 수, 발령 유형별 요약
  첨부: 발령안 상세 링크
  ```
- 결재 결과 처리 (ApprovalCompletedListener):
  - 승인: Draft.approve(approvedBy) 실행
  - 반려: Draft.reject() 실행
- 결재 라인: 발령 규모(대상자 수)에 따라 자동 결정
  - 5명 이하: HR팀장 1단계
  - 10명 이하: HR팀장+인사본부장 2단계
  - 10명 초과: 3단계 (+대표이사)

### 2.3 발령 롤백 ✅ 결정완료

> **결정: 완전 롤백 — Employee Service에 원상복구 요청**

- rollback() 수정:
  1. Draft의 모든 EXECUTED Detail에 대해 역방향 변경 이벤트 발행
  2. AppointmentHistory의 fromValues/toValues를 역으로 적용
  3. 이벤트 페이로드:
     ```json
     {
       "eventType": "appointment.rollback",
       "detailId": "...",
       "employeeId": "...",
       "appointmentType": "PROMOTION",
       "restoreValues": { ... fromValues 복원 ... },
       "tenantId": "..."
     }
     ```
  4. Employee Service가 수신하여 이전 상태로 복원
  5. 성공 시 Detail 상태: ROLLED_BACK
  6. 롤백 이력도 AppointmentHistory에 기록 (appointmentType + "_ROLLBACK")
- 제약: 시행일로부터 일정 기간(예: 30일) 내에만 롤백 가능
- 롤백도 결재 필요 여부: 향후 정책 결정 (현재는 HR 관리자 권한으로 즉시 롤백)

---

## 3. FE-BE 불일치 분석

### 3.1 필드명/DTO 불일치

| 구분 | FE (types) | BE (DTO/Entity) | 조치 |
|------|-----------|-----------------|------|
| Detail 목적지 | `toPositionId`, `toGradeId`, `toJobId` | `toPositionCode`, `toGradeCode`, `toJobCode` | **Code vs Id** — BE가 Code 기반 (MDM 코드), FE를 code 기반으로 통일 |
| Detail 출처 | `fromGradeId` | `fromGradeCode` | 동일 이슈 |
| Summary 응답 | `AppointmentSummary` type | BE에 summary 엔드포인트 없음 | **BE에 `GET /drafts/summary` 추가 필요** |
| Creator 정보 | `draftCreatedBy: AppointmentCreator` | 없음 (createdBy만 문자열) | **BE 응답에 creator 정보 추가 필요** |
| 검색 키워드 | `keyword` 파라미터 | BE search에 keyword 파라미터 없음 | **BE에 keyword 검색 지원 추가** |

### 3.2 누락 기능

| FE 존재 | BE 존재 | 조치 |
|---------|---------|------|
| 발령안 목록 ✅ | getDrafts API ✅ | OK |
| 발령안 상세 ✅ | getDraft API ✅ | OK |
| 발령안 생성 ✅ | create API ✅ | OK |
| 발령안 수정 ✅ | update API ✅ | OK |
| 상세 추가/삭제 ✅ | addDetail/removeDetail ✅ | OK |
| 제출/시행/취소 ✅ | submit/execute/cancel ✅ | OK |
| Summary 조회 ✅ | **없음** | BE 추가 필요 |
| 발령 이력 ❌ | getHistory API ✅ | FE 페이지 개발 필요 |
| 발령 통계 ❌ | getStatistics API ✅ | FE 대시보드 개발 필요 |
| 예약 발령 UI ❌ | schedule API ✅ | FE 스케줄링 UI 개발 필요 |
| 롤백 UI ❌ | rollback API ✅ | FE 롤백 버튼/확인 UI 필요 |

---

## 4. 비즈니스 로직 사양

### 4.1 발령안 상태 머신

```
DRAFT ──submit()──→ PENDING_APPROVAL
  │                     │
  │                     ├─ (결재 승인) → APPROVED ──execute()──→ EXECUTED
  │                     │                  │                      │
  │                     │                  ├─ schedule()          └─ rollback() → (상태복원)
  │                     │                  │   └→ 예약 후 자동 시행
  │                     │                  │
  │                     ├─ (결재 반려) → REJECTED → submit() → PENDING_APPROVAL
  │                     │
  ├─ cancel()           ├─ cancel()        ├─ cancel()
  └→ CANCELLED          └→ CANCELLED       └→ CANCELLED
```

### 4.2 발령유형별 변경 항목

| 발령유형 | 변경 대상 | 필수 입력 |
|---------|----------|----------|
| PROMOTION (승진) | 직급(grade) 상향 | toGradeCode |
| TRANSFER (전보) | 부서 변경 | toDepartmentId |
| POSITION_CHANGE (보직변경) | 직위 변경 | toPositionCode |
| JOB_CHANGE (직무변경) | 직무 변경 | toJobCode |
| LEAVE_OF_ABSENCE (휴직) | 직원 상태 → ON_LEAVE | reason 필수 |
| REINSTATEMENT (복직) | 직원 상태 → ACTIVE | — |
| RESIGNATION (사직) | 직원 상태 → TERMINATED | reason 필수 |
| RETIREMENT (정년퇴직) | 직원 상태 → TERMINATED | — |
| DEMOTION (강등) | 직급(grade) 하향 | toGradeCode |
| CONCURRENT (겸직) | 부서+직위 추가 | toDepartmentId, toPositionCode |

### 4.3 예약 발령

- 발령안 APPROVED 상태에서만 예약 가능
- `scheduledDate`는 미래 날짜여야 함
- `scheduledTime` 기본값 00:00 (자정)
- 스케줄러: 매일 00:01 실행하여 당일 예약 건 시행
- 실패 시: 자동 재시도 최대 3회 (매시 :30분)
- 이미 활성 스케줄이 있으면 중복 예약 불가

### 4.4 발령번호 채번 규칙

- 형식: `APT-{YYYY}-{4자리 시퀀스}` (예: APT-2026-0001)
- 시퀀스: `findMaxDraftNumberByPrefix` 쿼리로 최대값 조회 후 +1
- DB 시퀀스 기반이 아닌 쿼리 기반 — 동시성 이슈 가능 (개선 권장)

---

## 5. 설정값 목록

### 5.1 application.yml 현재 설정

| 설정 | 값 | 비고 |
|------|-----|------|
| `server.port` | 8091 | CLAUDE.md 포트표에 미등록 |
| `spring.jpa.properties.hibernate.default_schema` | hr_appointment | |
| `spring.flyway.schemas` | hr_appointment | |
| `spring.data.redis.port` | 6381 | |
| SQS 리스너 큐 | `appointment-service-queue` | ApprovalCompleted 이벤트 수신 |

### 5.2 필요한 설정 추가

| 설정 | 값 | 사유 |
|------|-----|------|
| `appointment.rollback.max-days` | 30 | 시행 후 롤백 가능 기간 |
| `appointment.schedule.max-retry` | 3 | 예약 발령 최대 재시도 (현재 하드코딩) |
| `appointment.approval.line-threshold-small` | 5 | 1단계 결재 기준 (대상자 수) |
| `appointment.approval.line-threshold-medium` | 10 | 2단계 결재 기준 |
| `spring.jpa.hibernate.ddl-auto` | validate | 프로덕션 안전 설정 확인 필요 |

---

## 6. 갭 구현 사양

### 6.1 APT-G01: Employee Service 이벤트 발행

**변경 대상**: AppointmentDraftServiceImpl.executeAppointment()

1. `AppointmentExecutedEvent` 도메인 이벤트 클래스 생성
2. executeAppointment() 루프 내 각 Detail마다:
   ```java
   eventPublisher.publish("hr-saas.appointment.executed",
       AppointmentExecutedEvent.builder()
           .draftNumber(draft.getDraftNumber())
           .detailId(detail.getId())
           .employeeId(detail.getEmployeeId())
           .appointmentType(detail.getAppointmentType())
           .effectiveDate(draft.getEffectiveDate())
           .changes(buildChanges(detail))
           .tenantId(TenantContext.getCurrentTenant())
           .build()
   );
   ```
3. Employee Service에 리스너 추가 → 발령유형별 처리 분기

### 6.2 APT-G02: Approval Service 연동

**변경 대상**: AppointmentDraftServiceImpl.submit()

1. `ApprovalServiceClient` Feign 인터페이스 생성:
   ```java
   @FeignClient("approval-service")
   public interface ApprovalServiceClient {
       @PostMapping("/api/v1/approvals")
       ApiResponse<ApprovalResponse> createApproval(@RequestBody CreateApprovalRequest request);
   }
   ```
2. submit() 수정: random UUID 제거 → Approval Service 호출
3. ApprovalCompletedListener.handleApprovalCompleted() 구현:
   ```java
   if ("APPROVED".equals(status)) {
       draft.approve(approvedBy);
   } else if ("REJECTED".equals(status)) {
       draft.reject();
   }
   ```

### 6.3 APT-G03: 완전 롤백

**변경 대상**: AppointmentDraftServiceImpl.rollback()

1. 롤백 가능 기간 검증 (시행일 + 30일 이내)
2. EXECUTED 상태 Detail 순회:
   ```java
   for (AppointmentDetail detail : executedDetails) {
       Map<String, Object> fromValues = historyRepository
           .findByDetailId(detail.getId()).getFromValues();

       eventPublisher.publish("hr-saas.appointment.rollback",
           AppointmentRollbackEvent.builder()
               .detailId(detail.getId())
               .employeeId(detail.getEmployeeId())
               .restoreValues(fromValues)
               .build()
       );
       detail.rollback();
   }
   ```
3. 롤백 이력을 AppointmentHistory에 별도 기록

### 6.4 APT-G05: 직원 정보 자동 조회

**변경 대상**: AppointmentDraftServiceImpl.createDetail()

1. `EmployeeServiceClient` Feign 인터페이스:
   ```java
   @GetMapping("/api/v1/employees/{id}")
   ApiResponse<EmployeeResponse> getEmployee(@PathVariable UUID id);
   ```
2. Detail 생성 시 employeeId로 Employee Service 조회:
   - employeeName, employeeNumber 자동 설정
   - from 필드 (현재 부서/직급/직위/직무) 자동 채움

### 6.5 APT-G12: Summary 엔드포인트

**변경 대상**: AppointmentDraftController

```java
@GetMapping("/summary")
public ApiResponse<AppointmentSummary> getSummary() {
    long draftCount = repository.countByTenantIdAndStatus(tenantId, DRAFT);
    long pendingCount = repository.countByTenantIdAndStatus(tenantId, PENDING_APPROVAL);
    long approvedCount = repository.countByTenantIdAndStatus(tenantId, APPROVED);
    long executedCount = repository.countByTenantIdAndStatus(tenantId, EXECUTED);
    return ApiResponse.success(new AppointmentSummary(...));
}
```

---

## 7. 테스트 시나리오

### 7.1 발령안 관리

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 발령안 생성 (상세 2건 포함) | DRAFT 상태, 발령번호 자동 생성, 상세 2건 |
| 2 | DRAFT 상태에서 수정 | 제목/시행일/설명 변경 성공 |
| 3 | PENDING_APPROVAL 상태에서 수정 시도 | 예외: APT_002 |
| 4 | 동일 직원+동일 발령유형 중복 추가 | 예외: APT_003 |
| 5 | 상세 없이 제출 | 예외: APT_006 |

### 7.2 결재 연동

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | submit() 호출 | PENDING_APPROVAL, Approval Service 결재 생성 |
| 2 | 결재 승인 이벤트 수신 | APPROVED 상태, approvedBy/approvedAt 기록 |
| 3 | 결재 반려 이벤트 수신 | REJECTED 상태 |
| 4 | REJECTED 후 재제출 | 다시 PENDING_APPROVAL |

### 7.3 발령 시행

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 즉시 시행 (APPROVED, 시행일 도래) | EXECUTED, Detail 각각 이벤트 발행 |
| 2 | 시행일 미도래 시 즉시 시행 | 예외: APT_008 (예약 사용 안내) |
| 3 | Detail 일부 실패 | 해당 Detail만 FAILED + errorMessage |
| 4 | 이벤트 수신 후 Employee 변경 확인 | 부서/직급/직위 변경 반영 |

### 7.4 예약 발령

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 미래 날짜 예약 | 스케줄 생성, SCHEDULED 상태 |
| 2 | 과거 날짜 예약 | 예외: APT_009 |
| 3 | 중복 예약 | 예외: APT_010 |
| 4 | 스케줄러 당일 실행 | PROCESSING → COMPLETED |
| 5 | 실패 후 재시도 (3회 미만) | 자동 재시도, retryCount 증가 |
| 6 | 3회 실패 | canRetry()=false, 수동 처리 필요 |

### 7.5 롤백

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 시행 후 30일 이내 롤백 | Detail들 ROLLED_BACK, 복원 이벤트 발행 |
| 2 | 시행 후 30일 초과 롤백 | 예외: 롤백 기간 초과 |
| 3 | 비EXECUTED 상태 롤백 | 예외: APT_012 |

---

## 8. 의존성 (다른 모듈 연동)

| 연동 모듈 | 연동 방식 | 내용 |
|-----------|----------|------|
| Employee Service | 이벤트 (SNS/SQS) | 발령 시행 시 직원 정보 변경 이벤트, 롤백 이벤트 |
| Employee Service | Feign Client | 발령 상세 생성 시 직원 현재 정보 조회 |
| Approval Service | Feign Client + 이벤트 | 결재 요청 생성, 승인/반려 이벤트 수신 |
| Organization Service | Feign Client (향후) | 부서 정보 조회, 조직도 반영 |
| Notification Service | 이벤트 (SNS/SQS) | 발령 통보, 시행 알림 |
| Recruitment Service | 이벤트 (수신) | 채용 합격 시 입사 발령 자동 생성 |

---

## 9. 엔티티 구조 요약

### 9.1 주요 엔티티

| 엔티티 | 설명 | 주요 관계 |
|--------|------|----------|
| AppointmentDraft | 발령안 (건 단위) | 1:N → AppointmentDetail |
| AppointmentDetail | 발령 대상 (직원 단위) | N:1 → AppointmentDraft |
| AppointmentHistory | 발령 이력 (불변) | detailId 참조 |
| AppointmentSchedule | 예약 발령 | draftId 참조 |

### 9.2 발령유형 한글 매핑

| enum | 한글 | 주요 변경 |
|------|------|----------|
| PROMOTION | 승진 | grade 상향 |
| TRANSFER | 전보 | department 변경 |
| POSITION_CHANGE | 보직변경 | position 변경 |
| JOB_CHANGE | 직무변경 | job 변경 |
| LEAVE_OF_ABSENCE | 휴직 | 상태 → ON_LEAVE |
| REINSTATEMENT | 복직 | 상태 → ACTIVE |
| RESIGNATION | 사직 | 상태 → TERMINATED |
| RETIREMENT | 정년퇴직 | 상태 → TERMINATED |
| DEMOTION | 강등 | grade 하향 |
| CONCURRENT | 겸직 | 부서+직위 추가 |

### 9.3 FE 컴포넌트 현황

| 페이지/컴포넌트 | 상태 | 비고 |
|----------------|------|------|
| AppointmentListPage | ✅ 구현 | 목록, 검색, 요약 카드 |
| AppointmentCreatePage | ✅ 구현 | 폼 + 상세 추가 (클라이언트 사이드) |
| AppointmentDetailPage | ✅ 구현 | 상세 보기, 상태 전이 액션 |
| AppointmentDetailForm | ✅ 구현 | 대상 직원 추가 다이얼로그 |
| AppointmentDetailTable | ✅ 구현 | 변경 전→후 시각화 |
| AppointmentHistoryPage | ❌ 미구현 | BE API 존재, FE 필요 |
| AppointmentStatisticsPage | ❌ 미구현 | BE API 존재, FE 필요 |
| 예약 발령 UI | ❌ 미구현 | BE API 존재, FE 필요 |
| 롤백 UI | ❌ 미구현 | BE API 존재, FE 필요 |
