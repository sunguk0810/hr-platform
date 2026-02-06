# Module 06: Attendance Service (근태 관리)

> 분석일: 2026-02-06
> 포트: 8085
> 패키지: `com.hrsaas.attendance`
> DB 스키마: `hr_attendance`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 출퇴근 기록 | ✅ 완료 | 출근/퇴근 체크, 위치 기록, 지각/조퇴/초과근무 자동 계산 |
| 오늘 출근 현황 | ✅ 완료 | 직원별 당일 출근 상태 조회 |
| 기간별 출근 조회 | ✅ 완료 | 시작일~종료일 근태 이력 조회 |
| 월간 근태 요약 | ✅ 완료 | 월별 출근일수/지각/조퇴/초과근무/총근무시간 집계 |
| 52시간 근로 모니터링 | ✅ 완료 | ISO주 기준 주간 근로시간 통계, NORMAL/WARNING/EXCEEDED 상태 분류 |
| 휴일 관리 | ✅ 완료 | 공휴일/회사휴일/대체휴일 CRUD, 일괄 등록, 연도별/유형별 조회 |
| 휴가 신청 | ✅ 완료 | 연차/반차/병가/특별휴가 등 10종 휴가 신청 워크플로우 |
| 휴가 잔여일수 관리 | ✅ 완료 | 직원별/연도별/유형별 잔여일수 추적 (총일수, 사용일수, 대기일수, 이월일수) |
| 휴가 중복 검사 | ✅ 완료 | PENDING/APPROVED 상태 휴가와의 기간 중복 방지 |
| 초과근무 신청 | ✅ 완료 | 신청/승인/반려/취소/완료(실제시간기록) 5단계 워크플로우 |
| 휴가 유형 설정 | ✅ 완료 | 테넌트별 휴가 유형 커스터마이징 (유급/무급, 최대일수, 성별제한 등) |
| 휴가 발생 규칙 | ✅ 완료 | YEARLY/MONTHLY/HIRE_DATE_BASED 발생 유형, 근속 보너스 JSONB |
| 휴가 이월 서비스 | ✅ 완료 | 전년도 잔여 → 다음연도 이월 (상한/만료개월 설정 가능) |
| 결재 연동 (이벤트) | ✅ 완료 | LeaveRequestCreatedEvent 발행 → approval-service 연동 |
| 결재 완료 수신 | ✅ 완료 | SQS ApprovalCompletedListener로 휴가 승인/반려 자동 처리 |
| RLS | ✅ 완료 | 모든 7개 테이블에 테넌트 격리 정책 적용 |
| 캐싱 | ✅ 완료 | 휴일 조회 Redis @Cacheable("holiday") |
| ddl-auto: validate | ✅ 올바름 | Flyway 마이그레이션 + validate 모드 |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| ATT-G01 | 스케줄러 구현 (연간 발생) | HIGH | generateYearlyLeave() TODO 스텁 — 테넌트 순회 + 직원 조회 + 발생 |
| ATT-G02 | 스케줄러 구현 (월간 발생) | HIGH | generateMonthlyLeave() TODO 스텁 — MONTHLY 유형 규칙 처리 |
| ATT-G03 | 스케줄러 구현 (입사일 기준) | HIGH | checkHireDateBasedAccrual() TODO 스텁 — 입사일 기념일 체크 |
| ATT-G04 | 월간 요약에서 공휴일 제외 | MEDIUM | calculateWorkDays()에서 주말만 제외, 공휴일 미제외 |
| ATT-G05 | 에러코드 중복 | MEDIUM | ATT_003이 출퇴근/공휴일 도메인에서 재사용됨 — 코드 분리 필요 |
| ATT-G06 | 초과근무 → 결재서비스 연동 | HIGH | 현재 직접 approve/reject, Approval Service 이벤트 연동 필요 |
| ATT-G07 | 출근 상태 자동 판정 | MEDIUM | checkIn/checkOut에서 status 자동 업데이트 미흡 (LATE 설정 누락) |
| ATT-G08 | 공휴일 자동 등록 | LOW | 대한민국 공휴일 자동 임포트 기능 없음 (수동 등록만 가능) |
| ATT-G09 | 근태 알림 | MEDIUM | 미출근 알림, 52시간 초과 경고 알림 등 notification-service 연동 |
| ATT-G10 | 부서별 근태 현황 | MEDIUM | 관리자용 부서별 출근율, 휴가 현황 대시보드 조회 API |
| ATT-G11 | 휴가 잔여일수 자동 생성 | MEDIUM | 직원 입사 시 LeaveBalance 레코드 자동 생성 (employee-service 이벤트 구독) |
| ATT-G12 | 시간 단위 휴가 잔여 관리 | LOW | usedHours/pendingHours 필드 존재하나 서비스 로직 미구현 |

---

## 2. 정책 결정사항

### 2.1 표준 근무시간 정책 ✅ 결정완료 (코드 기반)

> **결정: 09:00~18:00, 점심 1시간 자동 공제**

**현재 코드 하드코딩:**
```java
// AttendanceRecord.java
private static final LocalTime STANDARD_START = LocalTime.of(9, 0);  // 09:00
private static final LocalTime STANDARD_END = LocalTime.of(18, 0);    // 18:00
private static final int LUNCH_BREAK_MINUTES = 60;                     // 1시간
```

**향후 개선사항:**
- 테넌트별 근무시간 설정 가능하도록 확장 필요 (유연근무제 지원)
- 설정 테이블: `work_schedule_config` (tenant_id, start_time, end_time, lunch_break_minutes)

### 2.2 52시간 근로 모니터링 정책 ✅ 결정완료 (코드 기반)

> **결정: 모니터링 전용 (차단 없음), 3단계 상태 분류**

**상태 기준:**
| 상태 | 주간 근로시간 | 의미 |
|------|-------------|------|
| NORMAL | < 40시간 | 정상 |
| WARNING | 40~52시간 | 주의 (관리자 알림 권장) |
| EXCEEDED | > 52시간 | 초과 (근로기준법 위반) |

**계산 방식:**
- 정규 근무: `min(workHours, 8)` / 일
- 초과 근무: OvertimeRequest.actualHours 또는 attendance.overtimeMinutes
- 합산: 정규 + 초과 = 주간 총 근로시간

**정책:**
- 현재: 통계 조회만 제공, 차단 없음
- 초과 시 조치: notification-service 알림 발송 (ATT-G09로 구현 예정)
- 법적 근거: 근로기준법 제53조 (주 52시간 상한)

### 2.3 휴가 발생 규칙 정책 ✅ 결정완료 (코드 기반)

> **결정: 근로기준법 기반 연차 발생, 최대 25일 상한**

**연차 발생 공식:**
```
연차일수 = 기본부여일수 + 근속연수 보너스
최대 상한 = 25일 (근로기준법 제60조)
```

**기본 설정값:**
| 항목 | 기본값 | 설명 |
|------|--------|------|
| 기본 부여일수 (baseEntitlement) | 15일 | 1년 미만 근속: 월 1일씩 (별도) |
| 근속 보너스 | JSONB 배열 | `[{"minYears":1,"maxYears":3,"bonusDays":1}, ...]` |
| 최대 이월일수 (maxCarryOverDays) | 0일 | 기본: 이월 불가 (테넌트 설정 가능) |
| 이월 만료 (carryOverExpiryMonths) | 3개월 | 이월분은 3개월 내 사용 |

**발생 유형:**
| 유형 | 실행 시점 | 설명 |
|------|----------|------|
| YEARLY | 매년 1/1 00:10 | 전 직원 연차 일괄 발생 |
| MONTHLY | 매월 1일 00:20 | 월 단위 발생 규칙 처리 |
| HIRE_DATE_BASED | 매일 01:00 | 입사일 기준 기념일 체크 |

### 2.4 휴가 잔여일수 관리 정책 ✅ 결정완료 (코드 기반)

> **결정: 신청 시 대기일수 차감 → 승인 시 사용일수 전환**

**잔여일수 상태 머신:**
```
가용일수 = 총부여일수 + 이월일수 - 사용일수 - 대기일수

[휴가 신청]     → pendingDays += daysCount
[결재 승인]     → usedDays += daysCount, pendingDays -= daysCount
[결재 반려]     → pendingDays -= daysCount
[신청 취소]     → 대기 중이면 pendingDays -= daysCount
                   승인 후면 usedDays -= daysCount
```

---

## 3. 아키텍처 개요

### 3.1 서비스 구조

```
attendance-service (port: 8085)
├── config/
│   └── SecurityConfig.java          # JWT 인증, @EnableMethodSecurity
├── controller/
│   ├── AttendanceController.java    # 출퇴근 기록 API
│   ├── LeaveController.java         # 휴가 신청/조회 API
│   ├── HolidayController.java       # 공휴일 관리 API
│   ├── OvertimeController.java      # 초과근무 API
│   ├── LeaveTypeConfigController.java  # 휴가 유형 설정 API
│   └── LeaveAccrualRuleController.java # 휴가 발생 규칙 API
├── service/
│   ├── AttendanceService(Impl)      # 출퇴근 + 52시간 모니터링
│   ├── LeaveService(Impl)           # 휴가 신청/잔여관리
│   ├── HolidayService(Impl)         # 공휴일 관리
│   ├── OvertimeService(Impl)        # 초과근무 관리
│   ├── LeaveTypeConfigService       # 휴가 유형 설정
│   ├── LeaveAccrualService          # 연차 발생 계산
│   └── LeaveCarryOverService        # 연차 이월 처리
├── repository/  (7개)
│   ├── AttendanceRecordRepository
│   ├── LeaveRequestRepository
│   ├── LeaveBalanceRepository
│   ├── OvertimeRequestRepository
│   ├── HolidayRepository
│   ├── LeaveTypeConfigRepository
│   └── LeaveAccrualRuleRepository
├── domain/
│   ├── entity/  (13개)
│   ├── dto/request/  (6개)
│   ├── dto/response/ (8개)
│   └── event/
│       └── LeaveRequestCreatedEvent
├── listener/
│   └── ApprovalCompletedListener    # SQS 결재완료 이벤트 수신
└── scheduler/
    └── LeaveAccrualScheduler        # 연차 발생 스케줄러 (TODO)
```

### 3.2 이벤트 흐름

```
[출퇴근]
  직원 → checkIn/checkOut → AttendanceRecord 저장 → 지각/조퇴/초과 자동계산

[휴가 신청]
  직원 → create(leave) → LeaveBalance.pendingDays += N
       → submit() → 상태: DRAFT → PENDING
       → LeaveRequestCreatedEvent 발행 (SNS)
       → approval-service 에서 결재 워크플로우 생성

[결재 완료]
  approval-service → ApprovalCompletedEvent (SNS → SQS)
       → ApprovalCompletedListener.handleMessage()
       → leaveService.handleApprovalCompleted()
            ├→ APPROVED: pendingDays → usedDays
            └→ REJECTED: pendingDays 반환

[초과근무]
  직원 → create(overtime) → 상태: PENDING
       → approve/reject → APPROVED/REJECTED
       → complete(actualHours) → COMPLETED (실제시간 기록)

[연차 발생] (스케줄러)
  1/1 00:10 → generateYearlyLeave() → LeaveBalance 생성 + 이월 처리
  매월 1일  → generateMonthlyLeave() → 월 단위 발생
  매일 01:00 → checkHireDateBasedAccrual() → 입사일 기념일 체크
```

---

## 4. API 엔드포인트

### 4.1 출퇴근 관리 (`/api/v1/attendance`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/check-in` | 출근 체크 | 일반 |
| POST | `/check-out` | 퇴근 체크 | 일반 |
| GET | `/today` | 오늘 출근 현황 | 일반 |
| GET | `/my` | 내 근태 이력 (기간별) | 일반 |
| GET | `/monthly-summary` | 월간 근태 요약 | 일반 |
| GET | `/{id}` | 근태 상세 | 일반 |
| GET | `/work-hours/statistics` | 52시간 근로 통계 | 관리자 |

### 4.2 휴가 관리 (`/api/v1/leaves`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/` | 휴가 신청 | 일반 |
| GET | `/{id}` | 휴가 상세 | 일반 |
| GET | `/my` | 내 휴가 목록 | 일반 |
| POST | `/{id}/submit` | 결재 제출 | 일반 |
| POST | `/{id}/cancel` | 휴가 취소 | 일반 |
| GET | `/balances` | 잔여 휴가 조회 | 일반 |

### 4.3 공휴일 관리 (`/api/v1/holidays`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/` | 공휴일 등록 | HR관리자 |
| GET | `/{id}` | 공휴일 상세 | 일반 |
| GET | `/year/{year}` | 연도별 공휴일 | 일반 |
| GET | `/year/{year}/type/{type}` | 유형별 공휴일 | 일반 |
| GET | `/range` | 기간별 공휴일 | 일반 |
| GET | `/check` | 특정일 공휴일 여부 | 일반 |
| GET | `/count` | 기간 내 공휴일 수 | 일반 |
| DELETE | `/{id}` | 공휴일 삭제 | HR관리자 |
| POST | `/batch` | 일괄 등록 | HR관리자 |

### 4.4 초과근무 관리 (`/api/v1/overtime`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/` | 초과근무 신청 | 일반 |
| GET | `/{id}` | 초과근무 상세 | 일반 |
| GET | `/my` | 내 초과근무 목록 | 일반 |
| GET | `/my/status/{status}` | 상태별 내 초과근무 | 일반 |
| GET | `/department/{departmentId}/status/{status}` | 부서별 상태 조회 | 관리자 |
| GET | `/range` | 기간별 조회 | 관리자 |
| POST | `/{id}/approve` | 승인 | 관리자 |
| POST | `/{id}/reject` | 반려 | 관리자 |
| POST | `/{id}/cancel` | 취소 | 일반 |
| POST | `/{id}/complete` | 완료 (실제시간 기록) | 관리자 |
| GET | `/total-hours` | 총 초과근무 시간 조회 | 관리자 |

### 4.5 휴가 유형 설정 (`/api/v1/leave-type-configs`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/` | 전체 설정 목록 | 관리자 |
| GET | `/active` | 활성 설정 목록 | 일반 |
| GET | `/code/{code}` | 코드별 설정 조회 | 일반 |
| POST | `/` | 설정 생성 | 관리자 |
| PUT | `/{id}` | 설정 수정 | 관리자 |
| DELETE | `/{id}` | 설정 삭제 | 관리자 |

### 4.6 휴가 발생 규칙 (`/api/v1/leave-accrual-rules`)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/` | 활성 규칙 목록 | 관리자 |
| GET | `/code/{leaveTypeCode}` | 코드별 규칙 조회 | 관리자 |
| POST | `/` | 규칙 생성 | 관리자 |
| PUT | `/{id}` | 규칙 수정 | 관리자 |
| DELETE | `/{id}` | 규칙 삭제 | 관리자 |
| POST | `/generate` | 수동 연차 발생 | 관리자 |
| POST | `/carry-over` | 수동 이월 처리 | 관리자 |

---

## 5. 엔티티 데이터 모델

### 5.1 attendance_record (출퇴근 기록)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | gen_random_uuid() |
| tenant_id | UUID | NOT NULL | 테넌트 ID |
| employee_id | UUID | NOT NULL | 직원 ID |
| work_date | DATE | NOT NULL | 근무일 |
| check_in_time | TIME | | 출근 시간 |
| check_out_time | TIME | | 퇴근 시간 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'NORMAL' | NORMAL/LATE/EARLY_LEAVE/ABSENT/ON_LEAVE/BUSINESS_TRIP/REMOTE_WORK/HOLIDAY |
| late_minutes | INTEGER | NOT NULL, DEFAULT 0 | 지각 분 |
| early_leave_minutes | INTEGER | NOT NULL, DEFAULT 0 | 조퇴 분 |
| overtime_minutes | INTEGER | NOT NULL, DEFAULT 0 | 초과근무 분 |
| work_hours | INTEGER | NOT NULL, DEFAULT 0 | 근무 시간 (분 단위) |
| check_in_location | VARCHAR(500) | | 출근 위치 |
| check_out_location | VARCHAR(500) | | 퇴근 위치 |
| note | TEXT | | 비고 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| created_by | VARCHAR(100) | | |
| updated_by | VARCHAR(100) | | |

**UNIQUE**: (tenant_id, employee_id, work_date)
**인덱스**: tenant_id, employee_id, work_date, status, (tenant_id, work_date), (tenant_id, employee_id)

### 5.2 leave_request (휴가 신청)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | |
| employee_id | UUID | NOT NULL | 신청자 |
| employee_name | VARCHAR(100) | NOT NULL | 신청자명 |
| department_id | UUID | | 부서 ID |
| department_name | VARCHAR(200) | | 부서명 |
| leave_type | VARCHAR(30) | NOT NULL | ANNUAL/HALF_DAY_AM/PM/SICK/SPECIAL 등 |
| start_date | DATE | NOT NULL | 시작일 |
| end_date | DATE | NOT NULL | 종료일 |
| days_count | DECIMAL(3,1) | NOT NULL | 일수 (0.5=반차) |
| leave_unit | VARCHAR(10) | DEFAULT 'DAY' | DAY/HALF_DAY/HOUR (V2 추가) |
| hours_count | DECIMAL(5,1) | | 시간 단위 휴가 시간 (V2 추가) |
| reason | TEXT | | 사유 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'DRAFT' | DRAFT/PENDING/APPROVED/REJECTED/CANCELED |
| approval_document_id | UUID | | 결재 문서 ID |
| emergency_contact | VARCHAR(50) | | 비상 연락처 |
| handover_to_id | UUID | | 업무 인수자 ID |
| handover_to_name | VARCHAR(100) | | 업무 인수자명 |
| handover_notes | TEXT | | 인수 사항 |

**인덱스**: tenant_id, employee_id, status, start_date, end_date, (tenant_id, employee_id), (tenant_id, status)

### 5.3 leave_balance (휴가 잔여일수)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | |
| employee_id | UUID | NOT NULL | |
| year | INTEGER | NOT NULL | 대상 연도 |
| leave_type | VARCHAR(30) | NOT NULL | 휴가 유형 |
| total_days | DECIMAL(5,1) | NOT NULL, DEFAULT 0 | 총 부여일수 |
| used_days | DECIMAL(5,1) | NOT NULL, DEFAULT 0 | 사용일수 |
| pending_days | DECIMAL(5,1) | NOT NULL, DEFAULT 0 | 결재 대기일수 |
| carried_over_days | DECIMAL(5,1) | NOT NULL, DEFAULT 0 | 이월일수 |
| used_hours | DECIMAL(7,1) | DEFAULT 0 | 사용 시간 (V2 추가) |
| pending_hours | DECIMAL(7,1) | DEFAULT 0 | 대기 시간 (V2 추가) |

**UNIQUE**: (tenant_id, employee_id, year, leave_type)
**인덱스**: tenant_id, employee_id, year, (tenant_id, employee_id), (tenant_id, year)

### 5.4 holiday (공휴일)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | |
| holiday_date | DATE | NOT NULL | 공휴일 날짜 |
| name | VARCHAR(100) | NOT NULL | 이름 (한글) |
| name_en | VARCHAR(100) | | 이름 (영문) |
| holiday_type | VARCHAR(20) | NOT NULL | NATIONAL/PUBLIC/COMPANY/SUBSTITUTE |
| is_paid | BOOLEAN | NOT NULL, DEFAULT TRUE | 유급 여부 |
| description | VARCHAR(500) | | 설명 |
| year | INTEGER | NOT NULL | 연도 (holiday_date에서 자동 계산) |

**UNIQUE**: (tenant_id, holiday_date)
**인덱스**: tenant_id, holiday_date, year, (tenant_id, year)

### 5.5 overtime_request (초과근무 신청)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | |
| employee_id | UUID | NOT NULL | |
| employee_name | VARCHAR(100) | NOT NULL | |
| department_id | UUID | | |
| department_name | VARCHAR(200) | | |
| overtime_date | DATE | NOT NULL | 초과근무일 |
| start_time | TIME | NOT NULL | 시작 시간 |
| end_time | TIME | NOT NULL | 종료 시간 |
| planned_hours | DECIMAL(4,2) | NOT NULL | 계획 시간 |
| actual_hours | DECIMAL(4,2) | | 실제 시간 (완료 후 기록) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | PENDING/APPROVED/REJECTED/CANCELED/COMPLETED |
| reason | TEXT | NOT NULL | 사유 |
| rejection_reason | VARCHAR(500) | | 반려 사유 |
| approval_document_id | UUID | | 결재 문서 ID |

**인덱스**: tenant_id, employee_id, overtime_date, status, (tenant_id, employee_id), (tenant_id, status)

### 5.6 leave_type_config (휴가 유형 설정)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | |
| code | VARCHAR(30) | NOT NULL | 유형 코드 (ANNUAL, SICK 등) |
| name | VARCHAR(100) | NOT NULL | 표시명 |
| is_paid | BOOLEAN | DEFAULT TRUE | 유급 여부 |
| max_days_per_year | DECIMAL(5,1) | | 연간 최대 사용일 |
| requires_approval | BOOLEAN | DEFAULT TRUE | 결재 필요 여부 |
| min_notice_days | INTEGER | DEFAULT 0 | 최소 사전 신청일 |
| allow_half_day | BOOLEAN | DEFAULT TRUE | 반차 허용 |
| allow_hourly | BOOLEAN | DEFAULT FALSE | 시간단위 허용 |
| deduct_from_annual | BOOLEAN | DEFAULT FALSE | 연차에서 차감 |
| min_service_months | INTEGER | | 최소 근속개월 |
| gender_restriction | VARCHAR(10) | | "M"/"F"/NULL(무관) |
| max_consecutive_days | INTEGER | | 최대 연속 사용일 |
| blackout_periods | JSONB | | 사용 불가 기간 `[{startMonth, startDay, endMonth, endDay}]` |
| approval_template_code | VARCHAR(50) | | 결재 양식 코드 |
| is_active | BOOLEAN | DEFAULT TRUE | 활성 여부 |

**UNIQUE**: (tenant_id, code)
**인덱스**: (tenant_id)

### 5.7 leave_accrual_rule (휴가 발생 규칙)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | UUID | PK | |
| tenant_id | UUID | NOT NULL | |
| leave_type_code | VARCHAR(30) | NOT NULL | 대상 휴가 유형 코드 |
| accrual_type | VARCHAR(20) | NOT NULL | YEARLY/MONTHLY/HIRE_DATE_BASED |
| base_entitlement | DECIMAL(5,1) | NOT NULL, DEFAULT 15 | 기본 부여일수 |
| service_year_bonuses | JSONB | | 근속 보너스 `[{"minYears":1,"maxYears":3,"bonusDays":1}]` |
| max_carry_over_days | DECIMAL(5,1) | DEFAULT 0 | 최대 이월일수 |
| carry_over_expiry_months | INTEGER | DEFAULT 3 | 이월 만료 개월수 |
| is_active | BOOLEAN | DEFAULT TRUE | 활성 여부 |

**UNIQUE**: (tenant_id, leave_type_code)
**인덱스**: (tenant_id)

---

## 6. 상태 머신

### 6.1 출퇴근 상태 (AttendanceStatus)

```
NORMAL ─── 09:00 이전 출근, 18:00 이후 퇴근
LATE ───── 09:00 이후 출근
EARLY_LEAVE ── 18:00 이전 퇴근
ABSENT ──── 미출근
ON_LEAVE ─── 휴가 중
BUSINESS_TRIP ── 출장
REMOTE_WORK ── 재택근무
HOLIDAY ──── 공휴일/휴일
```

### 6.2 휴가 상태 (LeaveStatus)

```
                    submit()
    DRAFT ─────────────────→ PENDING ────────→ APPROVED
      │                        │                   │
      │     cancel()           │  reject()         │  cancel()
      └────→ CANCELED ←───────┘                    └───→ CANCELED
                               │
                               └────→ REJECTED
```

**상태 전이 규칙:**
- `submit()`: DRAFT → PENDING (approvalDocumentId 설정)
- `approve()`: PENDING → APPROVED
- `reject()`: PENDING → REJECTED
- `cancel()`: DRAFT/PENDING/APPROVED → CANCELED (언제든 취소 가능)

### 6.3 초과근무 상태 (OvertimeStatus)

```
                approve()              complete(actualHours)
    PENDING ──────────→ APPROVED ────────────────→ COMPLETED
      │                    │
      │  reject(reason)    │  cancel()
      └──→ REJECTED        └──→ CANCELED
      │
      │  cancel()
      └──→ CANCELED
```

**상태 전이 규칙:**
- `approve()`: PENDING → APPROVED
- `reject(reason)`: PENDING → REJECTED (반려 사유 필수)
- `cancel()`: PENDING/APPROVED → CANCELED
- `complete(actualHours)`: APPROVED → COMPLETED (실제 시간 기록)

---

## 7. 설정값 목록

### 7.1 application.yml 핵심 설정

```yaml
server:
  port: 8085

spring:
  application:
    name: attendance-service
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/hr_saas
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
  jpa:
    hibernate:
      ddl-auto: validate                # ✅ 올바른 설정
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        default_schema: hr_attendance
  flyway:
    enabled: true
    schemas: hr_attendance
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6381}
  cloud:
    aws:
      sns:
        endpoint: ${AWS_SNS_ENDPOINT:http://localhost:4566}
      sqs:
        endpoint: ${AWS_SQS_ENDPOINT:http://localhost:4566}
```

### 7.2 비즈니스 상수

| 상수 | 값 | 위치 | 설명 |
|------|-----|------|------|
| STANDARD_START | 09:00 | AttendanceRecord | 표준 출근시간 |
| STANDARD_END | 18:00 | AttendanceRecord | 표준 퇴근시간 |
| LUNCH_BREAK_MINUTES | 60 | AttendanceRecord | 점심시간 (분) |
| MAX_ANNUAL_LEAVE | 25 | LeaveAccrualService | 연차 상한 (근로기준법) |
| BASE_ENTITLEMENT | 15 | LeaveAccrualRule | 기본 연차 부여일수 |
| MAX_CARRY_OVER_DAYS | 0 | LeaveAccrualRule | 기본 이월 상한 |
| CARRY_OVER_EXPIRY_MONTHS | 3 | LeaveAccrualRule | 이월 만료 기간 |
| NORMAL_THRESHOLD | 40h | AttendanceServiceImpl | 정상 상태 상한 |
| WARNING_THRESHOLD | 52h | AttendanceServiceImpl | 경고 상태 상한 |
| DAILY_REGULAR_HOURS | 8h | AttendanceServiceImpl | 일 정규 근무시간 |

### 7.3 스케줄러 Cron 표현식

| 작업 | Cron | 실행 시점 | 상태 |
|------|------|----------|------|
| 연간 연차 발생 | `0 10 0 1 1 *` | 매년 1/1 00:10 | TODO |
| 월간 발생 | `0 20 0 1 * *` | 매월 1일 00:20 | TODO |
| 입사일 기준 체크 | `0 0 1 * * *` | 매일 01:00 | TODO |

### 7.4 SQS 큐 설정

| 큐 | 값 | 용도 |
|----|-----|------|
| 수신 큐 | `attendance-service-queue` | 결재 완료 이벤트 수신 |
| 필터 이벤트 | `ApprovalCompletedEvent` | 결재 완료 |
| 필터 문서유형 | `LEAVE_REQUEST` | 휴가 신청 문서만 처리 |

### 7.5 캐시 설정

| 캐시명 | 적용 대상 | TTL | 설명 |
|--------|----------|------|------|
| holiday | HolidayService | Redis 기본 | 연도별 공휴일 목록 |

---

## 8. 에러코드 체계

### 8.1 출퇴근 에러 (ATT_xxx)

| 코드 | 메시지 | 상황 |
|------|--------|------|
| ATT_001 | Already checked in today | 중복 출근 |
| ATT_002 | No check-in record today | 출근 없이 퇴근 |
| ATT_003 | Cannot check out without check-in | 출근시간 미설정 상태 퇴근 |
| ATT_004 | Already checked out today | 중복 퇴근 |
| ATT_005 | Start date after end date | 잘못된 날짜 범위 |
| ATT_006 | Attendance record not found | 근태 기록 미존재 |

### 8.2 휴가 에러 (LEV_xxx)

| 코드 | 메시지 | 상황 |
|------|--------|------|
| LEV_001 | Overlapping leave requests | 기간 중복 신청 |
| LEV_002 | Leave balance not found | 잔여일수 레코드 없음 |
| LEV_003 | Insufficient leave balance | 잔여 일수 부족 |
| LEV_004 | Forbidden - not owner | 타인 휴가 조작 시도 |

### 8.3 에러코드 중복 문제 (ATT-G05)

**현재 문제:**
- `ATT_003`: 출퇴근 도메인 ("Cannot check out without check-in")과 공휴일 도메인 ("Duplicate holiday date", "Holiday not found")에서 공용
- `ATT_004`: 출퇴근 도메인 ("Already checked out")과 초과근무 도메인 ("Overtime request not found")에서 공용
- `LEV_001`: 휴가 중복 ("Overlapping leave requests")과 조회 ("Leave request not found")에서 공용

**개선 방안:**
```
출퇴근: ATT_001 ~ ATT_010
공휴일: HOL_001 ~ HOL_010
초과근무: OVT_001 ~ OVT_010
휴가: LEV_001 ~ LEV_010
```

---

## 9. 갭 구현 사양

### 9.1 ATT-G01: 연간 연차 발생 스케줄러 (HIGH)

**현재 상태:** `LeaveAccrualScheduler.generateYearlyLeave()` — TODO 스텁

**구현 사양:**
```java
@Scheduled(cron = "0 10 0 1 1 *")
public void generateYearlyLeave() {
    int year = LocalDate.now().getYear();

    // 1. 전체 활성 테넌트 목록 조회 (tenant-service Feign)
    List<UUID> tenantIds = tenantServiceClient.getActiveTenantIds();

    for (UUID tenantId : tenantIds) {
        TenantContext.setCurrentTenant(tenantId);
        try {
            // 2. 테넌트 직원 목록 조회 (employee-service Feign)
            List<EmployeeLeaveInfo> employees = employeeServiceClient
                .getActiveEmployees(tenantId);

            // 3. 이월 처리 (전년도 잔여 → 금년 이월)
            int carryOvers = carryOverService.processCarryOver(tenantId, year - 1);

            // 4. 연차 발생
            int generated = accrualService.generateAnnualLeave(tenantId, year, employees);

            log.info("Tenant {}: generated={}, carryOvers={}", tenantId, generated, carryOvers);
        } finally {
            TenantContext.clear();
        }
    }
}
```

**필요 의존성:**
- TenantServiceClient (Feign): 활성 테넌트 목록
- EmployeeServiceClient (Feign): 테넌트별 활성 직원 목록 (employeeId, hireDate, gender)

### 9.2 ATT-G02: 월간 발생 스케줄러 (HIGH)

**현재 상태:** `LeaveAccrualScheduler.generateMonthlyLeave()` — TODO 스텁

**구현 사양:**
```java
@Scheduled(cron = "0 20 0 1 * *")
public void generateMonthlyLeave() {
    int year = LocalDate.now().getYear();
    int month = LocalDate.now().getMonthValue();

    List<UUID> tenantIds = tenantServiceClient.getActiveTenantIds();

    for (UUID tenantId : tenantIds) {
        TenantContext.setCurrentTenant(tenantId);
        try {
            // MONTHLY 유형 규칙만 조회
            List<LeaveAccrualRule> monthlyRules = accrualRuleRepository
                .findActiveByTenantIdAndAccrualType(tenantId, "MONTHLY");

            if (monthlyRules.isEmpty()) continue;

            // 직원별로 월할 발생
            List<EmployeeLeaveInfo> employees = employeeServiceClient
                .getActiveEmployees(tenantId);

            for (LeaveAccrualRule rule : monthlyRules) {
                BigDecimal monthlyEntitlement = rule.getBaseEntitlement()
                    .divide(BigDecimal.valueOf(12), 1, RoundingMode.HALF_UP);

                for (EmployeeLeaveInfo emp : employees) {
                    // LeaveBalance.totalDays += monthlyEntitlement
                    accrualService.addMonthlyEntitlement(
                        emp.getEmployeeId(), rule.getLeaveTypeCode(),
                        year, monthlyEntitlement);
                }
            }
        } finally {
            TenantContext.clear();
        }
    }
}
```

### 9.3 ATT-G03: 입사일 기준 발생 스케줄러 (HIGH)

**현재 상태:** `LeaveAccrualScheduler.checkHireDateBasedAccrual()` — TODO 스텁

**구현 사양:**
```java
@Scheduled(cron = "0 0 1 * * *")
public void checkHireDateBasedAccrual() {
    LocalDate today = LocalDate.now();
    int year = today.getYear();

    List<UUID> tenantIds = tenantServiceClient.getActiveTenantIds();

    for (UUID tenantId : tenantIds) {
        TenantContext.setCurrentTenant(tenantId);
        try {
            // HIRE_DATE_BASED 규칙이 있는 테넌트만 처리
            List<LeaveAccrualRule> rules = accrualRuleRepository
                .findActiveByTenantIdAndAccrualType(tenantId, "HIRE_DATE_BASED");

            if (rules.isEmpty()) continue;

            // 오늘이 입사 기념일인 직원 조회
            List<EmployeeLeaveInfo> employees = employeeServiceClient
                .getEmployeesWithHireDateAnniversary(tenantId, today);

            for (EmployeeLeaveInfo emp : employees) {
                accrualService.generateForEmployee(
                    emp.getEmployeeId(), emp.getHireDate(), year);
            }
        } finally {
            TenantContext.clear();
        }
    }
}
```

### 9.4 ATT-G06: 초과근무 결재 서비스 연동 (HIGH)

**현재 상태:** OvertimeService에서 직접 approve/reject 처리

**목표:** 휴가와 동일하게 Approval Service 이벤트 연동

**구현 사양:**
```
1. OvertimeRequestCreatedEvent 도메인 이벤트 추가
   - topic: EventTopics.OVERTIME_REQUESTED
   - 필드: overtimeRequestId, employeeId, employeeName, departmentId,
           overtimeDate, startTime, endTime, plannedHours, reason

2. OvertimeServiceImpl.create() 수정
   - 상태: PENDING → DRAFT 기본값 변경
   - submit() 메서드 추가: DRAFT → PENDING + 이벤트 발행

3. ApprovalCompletedListener 확장
   - documentType 필터에 "OVERTIME_REQUEST" 추가
   - 분기: LEAVE_REQUEST → leaveService, OVERTIME_REQUEST → overtimeService

4. OvertimeService에 handleApprovalCompleted() 추가
   - APPROVED: overtimeRequest.approve()
   - REJECTED: overtimeRequest.reject(reason)
```

### 9.5 ATT-G04: 월간 요약에서 공휴일 제외 (MEDIUM)

**현재 상태:** `calculateWorkDays(YearMonth)` — 주말만 제외

**구현 사양:**
```java
private int calculateWorkDays(YearMonth yearMonth) {
    LocalDate startDate = yearMonth.atDay(1);
    LocalDate endDate = yearMonth.atEndOfMonth();

    int workDays = 0;
    LocalDate date = startDate;
    while (!date.isAfter(endDate)) {
        DayOfWeek dow = date.getDayOfWeek();
        if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) {
            workDays++;
        }
        date = date.plusDays(1);
    }

    // ✅ 공휴일 제외 추가
    long holidays = holidayService.countHolidaysInRange(startDate, endDate);
    workDays -= (int) holidays;

    return workDays;
}
```

**의존성:** AttendanceServiceImpl에 HolidayService 주입 추가

### 9.6 ATT-G07: 출근 상태 자동 판정 (MEDIUM)

**현재 상태:** checkIn()에서 지각 분만 계산, status는 NORMAL 유지

**구현 사양:**
```java
public void checkIn(LocalTime time, String location) {
    this.checkInTime = time;
    this.checkInLocation = location;
    this.lateMinutes = calculateLateMinutes();

    // ✅ 자동 상태 판정 추가
    if (this.lateMinutes > 0) {
        this.status = AttendanceStatus.LATE;
    } else {
        this.status = AttendanceStatus.NORMAL;
    }
}

public void checkOut(LocalTime time, String location) {
    this.checkOutTime = time;
    this.checkOutLocation = location;
    this.workHours = calculateWorkHours();
    this.earlyLeaveMinutes = calculateEarlyLeaveMinutes();
    this.overtimeMinutes = calculateOvertimeMinutes();

    // ✅ 조퇴 상태 판정 (지각보다 우선)
    if (this.earlyLeaveMinutes > 0) {
        this.status = AttendanceStatus.EARLY_LEAVE;
    }
}
```

### 9.7 ATT-G11: 직원 입사 시 잔여일수 자동 생성 (MEDIUM)

**현재 상태:** LeaveBalance 레코드가 없으면 LEV_002 에러

**구현 사양:**
```
1. employee-service에서 EmployeeCreatedEvent 발행 (이미 구현됨)

2. attendance-service에 EmployeeCreatedListener 추가
   - @SqsListener("attendance-employee-queue")
   - EmployeeCreatedEvent 수신
   - 해당 직원의 LeaveBalance 초기 레코드 생성:
     - ANNUAL: 기본 15일 (또는 테넌트 규칙에 따라 계산)
     - 입사 연도는 월할 계산: 15일 × (잔여개월 / 12)
```

---

## 10. 테스트 시나리오

### 10.1 출퇴근 테스트

| ID | 시나리오 | 기대 결과 |
|----|---------|----------|
| ATT-T01 | 정상 출근 (08:50) | 출근 기록 생성, lateMinutes=0, status=NORMAL |
| ATT-T02 | 지각 출근 (09:15) | lateMinutes=15, status=LATE |
| ATT-T03 | 정상 퇴근 (18:30) | workHours 계산, overtimeMinutes=30 |
| ATT-T04 | 조퇴 (16:00) | earlyLeaveMinutes=120, status=EARLY_LEAVE |
| ATT-T05 | 중복 출근 | ATT_001 에러 |
| ATT-T06 | 출근 없이 퇴근 | ATT_002 에러 |
| ATT-T07 | 중복 퇴근 | ATT_004 에러 |
| ATT-T08 | 날짜 범위 역전 | ATT_005 에러 |
| ATT-T09 | 월간 요약 조회 | 정상 집계 (출근일/지각일/총시간) |

### 10.2 휴가 테스트

| ID | 시나리오 | 기대 결과 |
|----|---------|----------|
| LEV-T01 | 연차 3일 신청 (잔여 15일) | 생성 성공, pendingDays=3 |
| LEV-T02 | 잔여일수 부족 상태 신청 | LEV_003 에러 |
| LEV-T03 | 기간 겹치는 신청 | LEV_001 에러 |
| LEV-T04 | 반차(오전) 신청 | daysCount=0.5, pendingDays=0.5 |
| LEV-T05 | 결재 제출 | DRAFT → PENDING, 이벤트 발행 |
| LEV-T06 | 결재 승인 이벤트 | PENDING → APPROVED, pendingDays→usedDays |
| LEV-T07 | 결재 반려 이벤트 | PENDING → REJECTED, pendingDays 반환 |
| LEV-T08 | 승인 후 취소 | APPROVED → CANCELED, usedDays 반환 |
| LEV-T09 | 대기 중 취소 | PENDING → CANCELED, pendingDays 반환 |
| LEV-T10 | 타인 휴가 취소 시도 | LEV_004 에러 |

### 10.3 초과근무 테스트

| ID | 시나리오 | 기대 결과 |
|----|---------|----------|
| OVT-T01 | 초과근무 2시간 신청 | PENDING 상태 생성 |
| OVT-T02 | 승인 | PENDING → APPROVED |
| OVT-T03 | 반려 (사유 포함) | PENDING → REJECTED, rejectionReason 저장 |
| OVT-T04 | 완료 (실제 1.5h) | APPROVED → COMPLETED, actualHours=1.5 |
| OVT-T05 | REJECTED 상태에서 승인 | IllegalStateException |
| OVT-T06 | PENDING 상태에서 완료 | IllegalStateException |

### 10.4 휴가 발생/이월 테스트

| ID | 시나리오 | 기대 결과 |
|----|---------|----------|
| ACR-T01 | 신입 (1년 미만) 연차 계산 | 월할 계산 |
| ACR-T02 | 3년차 연차 (보너스 적용) | 15 + bonusDays |
| ACR-T03 | 25일 상한 초과 | 최대 25일로 캡 |
| ACR-T04 | 이월 (잔여 5일, 상한 3일) | carriedOverDays=3 |
| ACR-T05 | 이월 불가 (maxCarryOver=0) | carriedOverDays=0 |

### 10.5 52시간 모니터링 테스트

| ID | 시나리오 | 기대 결과 |
|----|---------|----------|
| WH-T01 | 주간 38시간 | status=NORMAL |
| WH-T02 | 주간 48시간 | status=WARNING |
| WH-T03 | 주간 55시간 | status=EXCEEDED, exceededHours=3 |
| WH-T04 | 초과근무 포함 합산 | regularHours + overtimeHours 정확 합산 |

---

## 11. 의존성

### 11.1 이 서비스가 호출하는 서비스

| 대상 서비스 | 방식 | 용도 | 구현 상태 |
|------------|------|------|-----------|
| approval-service | SNS 이벤트 발행 | 휴가 결재 워크플로우 생성 | ✅ 완료 |
| tenant-service | Feign (예정) | 활성 테넌트 목록 (스케줄러) | ❌ 미구현 |
| employee-service | Feign (예정) | 직원 목록/입사일 (스케줄러) | ❌ 미구현 |

### 11.2 이 서비스를 호출하는 서비스

| 호출 서비스 | 방식 | 용도 |
|------------|------|------|
| approval-service | SQS 이벤트 | 결재 완료 알림 (승인/반려) |
| employee-service | SNS 이벤트 (예정) | 직원 생성 시 잔여일수 초기화 |

### 11.3 발행 이벤트

| 이벤트 | 토픽 | 발행 시점 |
|--------|------|----------|
| LeaveRequestCreatedEvent | LEAVE_REQUESTED | 휴가 신청 제출 시 |
| OvertimeRequestCreatedEvent (예정) | OVERTIME_REQUESTED | 초과근무 결재 제출 시 |

### 11.4 구독 이벤트

| 이벤트 | 큐 | 처리 내용 |
|--------|-----|----------|
| ApprovalCompletedEvent | attendance-service-queue | 휴가 승인/반려 상태 전환 |
| EmployeeCreatedEvent (예정) | attendance-employee-queue | 잔여일수 초기 레코드 생성 |

---

## 12. 휴가 유형 상세

### 12.1 기본 제공 휴가 유형

| 코드 | 한글명 | 유급 | 연차차감 | 성별제한 | 결재필요 | 비고 |
|------|--------|------|---------|---------|---------|------|
| ANNUAL | 연차 | ✅ | - | 무관 | ✅ | 기본 15일, 근속 보너스, 최대 25일 |
| HALF_DAY_AM | 오전반차 | ✅ | ✅ | 무관 | ✅ | 0.5일 차감 |
| HALF_DAY_PM | 오후반차 | ✅ | ✅ | 무관 | ✅ | 0.5일 차감 |
| SICK | 병가 | ✅ | ❌ | 무관 | ✅ | 진단서 제출 권장 |
| SPECIAL | 경조휴가 | ✅ | ❌ | 무관 | ✅ | employee-service 경조정책 연동 |
| MATERNITY | 출산휴가 | ✅ | ❌ | F | ✅ | 90일 (근로기준법 제74조) |
| PATERNITY | 배우자출산휴가 | ✅ | ❌ | M | ✅ | 10일 (남녀고용평등법) |
| FAMILY_CARE | 가족돌봄휴가 | ✅ | ❌ | 무관 | ✅ | 연 10일 (남녀고용평등법) |
| PUBLIC_DUTY | 공가 | ✅ | ❌ | 무관 | ✅ | 예비군, 투표 등 |
| UNPAID | 무급휴가 | ❌ | ❌ | 무관 | ✅ | 급여 미지급 |

### 12.2 LeaveTypeConfig 커스터마이징 예시

```json
{
  "code": "ANNUAL",
  "name": "연차",
  "isPaid": true,
  "maxDaysPerYear": 25,
  "requiresApproval": true,
  "minNoticeDays": 1,
  "allowHalfDay": true,
  "allowHourly": false,
  "deductFromAnnual": false,
  "minServiceMonths": null,
  "genderRestriction": null,
  "maxConsecutiveDays": 5,
  "blackoutPeriods": [
    {"startMonth": 12, "startDay": 25, "endMonth": 12, "endDay": 31}
  ],
  "approvalTemplateCode": "LEAVE_STANDARD"
}
```

---

## 13. SQL 마이그레이션 요약

### V1__init.sql
- 스키마: `hr_attendance`
- 함수: `get_current_tenant_safe()`
- 테이블 5개: attendance_record, leave_request, leave_balance, holiday, overtime_request
- 인덱스 28개
- RLS 정책 5개
- 트리거: set_updated_at (전 테이블)

### V2__add_leave_policy.sql
- 테이블 2개 추가: leave_type_config, leave_accrual_rule
- 기존 테이블 변경:
  - leave_request: + leave_unit, hours_count
  - leave_balance: + used_hours, pending_hours
- RLS 정책 2개 추가
- 트리거 2개 추가
