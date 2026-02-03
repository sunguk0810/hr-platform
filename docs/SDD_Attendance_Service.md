# SDD: Attendance Service (근태/휴가 서비스)

## 1. 서비스 개요

### 1.1 목적
Attendance Service는 직원의 근태 관리(출퇴근, 시간외근무)와 휴가 관리(연차, 병가, 경조휴가 등)를 담당하는 핵심 서비스입니다.

### 1.2 책임 범위
- 출퇴근 기록 및 근무시간 계산
- 연차 자동 부여 및 잔여일 관리
- 휴가 신청/승인 워크플로우
- 시간외근무 신청/승인
- 근로기준법 준수 모니터링 (주 52시간)
- 근태 통계 및 리포트

### 1.3 Phase
**Phase 1 (MVP)**

---

## 2. 아키텍처

### 2.1 서비스 구조
```
┌─────────────────────────────────────────────────────────────┐
│                    Attendance Service                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Attendance  │  │    Leave    │  │     Overtime        │ │
│  │   Tracker   │  │  Management │  │    Management       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Annual    │  │  Work Hour  │  │     Statistics      │ │
│  │  Calculator │  │  Validator  │  │      Engine         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐    ┌──────────┐
        │PostgreSQL│   │  Redis   │    │  Kafka   │
        │  (RLS)   │   │ (Cache)  │    │ (Events) │
        └──────────┘   └──────────┘    └──────────┘
```

### 2.2 의존 서비스
| 서비스 | 통신 방식 | 용도 |
|--------|----------|------|
| Tenant Service | REST (OpenFeign) | 테넌트별 근태/휴가 정책 조회 |
| Employee Service | REST (OpenFeign) | 사원 정보, 입사일 조회 |
| Organization Service | REST (OpenFeign) | 부서 정보, 관리자 조회 |
| Approval Service | Kafka Event | 휴가/시간외근무 승인 요청 |
| Notification Service | Kafka Event | 휴가 승인/반려 알림 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────────┐       ┌─────────────────────────┐
│     attendance_record   │       │     leave_request       │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │       │ id (PK, UUID)           │
│ tenant_id               │       │ tenant_id               │
│ employee_id             │       │ employee_id             │
│ work_date               │       │ leave_type_id           │
│ check_in_time           │       │ start_date              │
│ check_out_time          │       │ end_date                │
│ work_minutes            │       │ start_time              │
│ overtime_minutes        │       │ end_time                │
│ late_minutes            │       │ days                    │
│ early_leave_minutes     │       │ reason                  │
│ attendance_status       │       │ status                  │
│ check_in_method         │       │ approval_id             │
│ check_in_location       │       │ approved_by             │
│ remarks                 │       │ approved_at             │
│ created_at              │       │ created_at              │
└─────────────────────────┘       └─────────────────────────┘

┌─────────────────────────┐       ┌─────────────────────────┐
│     leave_balance       │       │      leave_type         │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │       │ id (PK, UUID)           │
│ tenant_id               │       │ tenant_id               │
│ employee_id             │       │ code                    │
│ leave_type_id           │       │ name                    │
│ year                    │       │ is_paid                 │
│ granted_days            │       │ is_annual               │
│ used_days               │       │ requires_approval       │
│ carried_days            │       │ requires_document       │
│ adjusted_days           │       │ max_days                │
│ remaining_days          │       │ min_days                │
│ expires_at              │       │ deduct_from_annual      │
│ created_at              │       │ sort_order              │
│ updated_at              │       │ status                  │
└─────────────────────────┘       └─────────────────────────┘

┌─────────────────────────┐       ┌─────────────────────────┐
│    overtime_request     │       │    work_schedule        │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │       │ id (PK, UUID)           │
│ tenant_id               │       │ tenant_id               │
│ employee_id             │       │ employee_id             │
│ request_date            │       │ schedule_type           │
│ start_time              │       │ work_start_time         │
│ end_time                │       │ work_end_time           │
│ overtime_type           │       │ break_start_time        │
│ planned_minutes         │       │ break_end_time          │
│ actual_minutes          │       │ effective_from          │
│ reason                  │       │ effective_to            │
│ status                  │       │ created_at              │
│ approval_id             │       └─────────────────────────┘
│ created_at              │
└─────────────────────────┘
```

### 3.2 테이블 DDL

#### attendance_record (출퇴근 기록)
```sql
CREATE TABLE attendance_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    work_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    work_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    late_minutes INTEGER DEFAULT 0,
    early_leave_minutes INTEGER DEFAULT 0,
    attendance_status VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
        CHECK (attendance_status IN ('NORMAL', 'LATE', 'EARLY_LEAVE', 
               'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'BUSINESS_TRIP', 'WORK_FROM_HOME')),
    check_in_method VARCHAR(20)
        CHECK (check_in_method IN ('WEB', 'MOBILE', 'BEACON', 'KIOSK', 'MANUAL')),
    check_in_location JSONB,
    check_out_method VARCHAR(20),
    check_out_location JSONB,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_attendance_record UNIQUE (tenant_id, employee_id, work_date)
);

-- 인덱스
CREATE INDEX idx_attendance_tenant_date ON attendance_record(tenant_id, work_date);
CREATE INDEX idx_attendance_employee ON attendance_record(employee_id, work_date);
CREATE INDEX idx_attendance_status ON attendance_record(attendance_status);

-- 파티셔닝 (월별)
-- CREATE TABLE attendance_record_2024_01 PARTITION OF attendance_record
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- RLS 정책
ALTER TABLE attendance_record ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendance_isolation ON attendance_record
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### leave_type (휴가 유형)
```sql
CREATE TABLE leave_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    is_paid BOOLEAN DEFAULT true,
    is_annual BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    requires_document BOOLEAN DEFAULT false,
    document_required_days INTEGER,
    max_days DECIMAL(5,1),
    min_days DECIMAL(5,1) DEFAULT 0.5,
    deduct_from_annual BOOLEAN DEFAULT false,
    allow_half_day BOOLEAN DEFAULT true,
    allow_hourly BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_leave_type UNIQUE (tenant_id, code)
);

-- 기본 휴가 유형 (코드)
-- ANNUAL: 연차, SICK: 병가, MATERNITY: 출산휴가, PATERNITY: 배우자출산휴가,
-- BEREAVEMENT: 경조휴가, MARRIAGE: 결혼휴가, OFFICIAL: 공가, UNPAID: 무급휴가
```

#### leave_balance (휴가 잔여일)
```sql
CREATE TABLE leave_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    leave_type_id UUID NOT NULL REFERENCES leave_type(id),
    year INTEGER NOT NULL,
    granted_days DECIMAL(5,1) NOT NULL DEFAULT 0,
    used_days DECIMAL(5,1) NOT NULL DEFAULT 0,
    carried_days DECIMAL(5,1) NOT NULL DEFAULT 0,
    adjusted_days DECIMAL(5,1) NOT NULL DEFAULT 0,
    remaining_days DECIMAL(5,1) GENERATED ALWAYS AS 
        (granted_days + carried_days + adjusted_days - used_days) STORED,
    expires_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_leave_balance UNIQUE (tenant_id, employee_id, leave_type_id, year)
);

-- RLS 정책
ALTER TABLE leave_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY leave_balance_isolation ON leave_balance
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### leave_request (휴가 신청)
```sql
CREATE TABLE leave_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    leave_type_id UUID NOT NULL REFERENCES leave_type(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    days DECIMAL(5,1) NOT NULL,
    reason TEXT,
    emergency_contact VARCHAR(50),
    attachment_urls TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 
                         'CANCELLED', 'RECALLED')),
    approval_id UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 인덱스
CREATE INDEX idx_leave_request_employee ON leave_request(employee_id, start_date);
CREATE INDEX idx_leave_request_status ON leave_request(status);
CREATE INDEX idx_leave_request_dates ON leave_request(start_date, end_date);

-- RLS 정책
ALTER TABLE leave_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY leave_request_isolation ON leave_request
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### overtime_request (시간외근무 신청)
```sql
CREATE TABLE overtime_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    request_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    overtime_type VARCHAR(20) NOT NULL
        CHECK (overtime_type IN ('WEEKDAY', 'WEEKEND', 'HOLIDAY', 'NIGHT')),
    planned_minutes INTEGER NOT NULL,
    actual_minutes INTEGER,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED')),
    approval_id UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS 정책
ALTER TABLE overtime_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY overtime_isolation ON overtime_request
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### work_schedule (근무 스케줄)
```sql
CREATE TABLE work_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID,
    department_id UUID,
    schedule_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD'
        CHECK (schedule_type IN ('STANDARD', 'FLEXIBLE', 'SHIFT', 'COMPRESSED')),
    schedule_name VARCHAR(100),
    work_start_time TIME NOT NULL DEFAULT '09:00',
    work_end_time TIME NOT NULL DEFAULT '18:00',
    break_start_time TIME DEFAULT '12:00',
    break_end_time TIME DEFAULT '13:00',
    work_days INTEGER[] DEFAULT '{1,2,3,4,5}',
    core_start_time TIME,
    core_end_time TIME,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API 명세

### 4.1 출퇴근 API

#### 출근 기록
```
POST /api/v1/attendance/check-in
```
**Request:**
```json
{
  "method": "MOBILE",
  "location": {
    "latitude": 37.5665,
    "longitude": 126.9780,
    "accuracy": 10
  }
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workDate": "2024-01-15",
    "checkInTime": "2024-01-15T09:02:30+09:00",
    "attendanceStatus": "NORMAL",
    "lateMinutes": 0
  }
}
```

#### 퇴근 기록
```
POST /api/v1/attendance/check-out
```

#### 출퇴근 기록 조회
```
GET /api/v1/attendance/records
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| employeeId | UUID | N | 사원 ID (관리자용) |
| departmentId | UUID | N | 부서별 조회 |
| startDate | Date | Y | 시작일 |
| endDate | Date | Y | 종료일 |
| status | String | N | 근태 상태 |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [{
      "id": "uuid",
      "employeeId": "uuid",
      "employeeName": "홍길동",
      "workDate": "2024-01-15",
      "checkInTime": "09:02",
      "checkOutTime": "18:30",
      "workMinutes": 510,
      "overtimeMinutes": 30,
      "attendanceStatus": "NORMAL"
    }],
    "summary": {
      "totalWorkDays": 22,
      "presentDays": 20,
      "absentDays": 0,
      "lateDays": 2,
      "totalWorkHours": 176,
      "totalOvertimeHours": 10
    }
  }
}
```

#### 근태 수정 (관리자)
```
PUT /api/v1/attendance/records/{recordId}
```
**Request:**
```json
{
  "checkInTime": "2024-01-15T09:00:00+09:00",
  "checkOutTime": "2024-01-15T18:00:00+09:00",
  "attendanceStatus": "NORMAL",
  "remarks": "시스템 오류로 인한 수정"
}
```

### 4.2 휴가 API

#### 휴가 유형 목록
```
GET /api/v1/attendance/leave-types
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "ANNUAL",
      "name": "연차",
      "isPaid": true,
      "requiresApproval": true,
      "allowHalfDay": true,
      "maxDays": null
    },
    {
      "id": "uuid",
      "code": "SICK",
      "name": "병가",
      "isPaid": true,
      "requiresApproval": true,
      "requiresDocument": true,
      "documentRequiredDays": 3
    }
  ]
}
```

#### 휴가 잔여일 조회
```
GET /api/v1/attendance/leave-balance
```
**Query Parameters:** employeeId, year

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "balances": [
      {
        "leaveType": {
          "code": "ANNUAL",
          "name": "연차"
        },
        "grantedDays": 15,
        "usedDays": 5,
        "carriedDays": 3,
        "adjustedDays": 0,
        "remainingDays": 13,
        "expiresAt": "2025-03-31"
      }
    ],
    "summary": {
      "totalGranted": 15,
      "totalUsed": 5,
      "totalRemaining": 13
    }
  }
}
```

#### 휴가 신청
```
POST /api/v1/attendance/leave-requests
```
**Request:**
```json
{
  "leaveTypeCode": "ANNUAL",
  "startDate": "2024-02-01",
  "endDate": "2024-02-02",
  "startTime": null,
  "endTime": null,
  "days": 2,
  "reason": "개인 사유",
  "emergencyContact": "010-1234-5678"
}
```

#### 휴가 신청 목록 조회
```
GET /api/v1/attendance/leave-requests
```
**Query Parameters:** status, startDate, endDate, employeeId, departmentId

#### 휴가 신청 상세 조회
```
GET /api/v1/attendance/leave-requests/{requestId}
```

#### 휴가 취소
```
POST /api/v1/attendance/leave-requests/{requestId}/cancel
```
**Request:**
```json
{
  "reason": "일정 변경"
}
```

#### 휴가 승인 대기 목록 (관리자)
```
GET /api/v1/attendance/leave-requests/pending
```

### 4.3 시간외근무 API

#### 시간외근무 신청
```
POST /api/v1/attendance/overtime-requests
```
**Request:**
```json
{
  "requestDate": "2024-01-20",
  "startTime": "18:00",
  "endTime": "21:00",
  "overtimeType": "WEEKDAY",
  "reason": "프로젝트 마감"
}
```

#### 시간외근무 목록 조회
```
GET /api/v1/attendance/overtime-requests
```

#### 월간 시간외근무 현황
```
GET /api/v1/attendance/overtime/monthly-summary
```
**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 1,
    "employeeId": "uuid",
    "weekdayHours": 20,
    "weekendHours": 8,
    "holidayHours": 0,
    "nightHours": 4,
    "totalHours": 32,
    "limit": 52,
    "remaining": 20,
    "warningLevel": "NORMAL"
  }
}
```

### 4.4 근무 스케줄 API

#### 근무 스케줄 조회
```
GET /api/v1/attendance/schedules
```

#### 근무 스케줄 설정
```
POST /api/v1/attendance/schedules
```
**Request:**
```json
{
  "employeeId": "uuid",
  "scheduleType": "FLEXIBLE",
  "workStartTime": "08:00",
  "workEndTime": "17:00",
  "coreStartTime": "10:00",
  "coreEndTime": "16:00",
  "effectiveFrom": "2024-02-01"
}
```

### 4.5 통계 API

#### 부서별 근태 현황
```
GET /api/v1/attendance/statistics/department
```
**Query Parameters:** departmentId, year, month

#### 주 52시간 모니터링
```
GET /api/v1/attendance/statistics/work-hours
```
**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2024-W03",
    "employees": [
      {
        "employeeId": "uuid",
        "employeeName": "홍길동",
        "department": "개발팀",
        "regularHours": 40,
        "overtimeHours": 15,
        "totalHours": 55,
        "status": "EXCEEDED",
        "exceededHours": 3
      }
    ],
    "summary": {
      "totalEmployees": 100,
      "normalCount": 85,
      "warningCount": 10,
      "exceededCount": 5
    }
  }
}
```

---

## 5. 비즈니스 로직

### 5.1 연차 자동 부여

```java
@Service
@RequiredArgsConstructor
public class AnnualLeaveGrantService {
    
    private final LeaveBalanceRepository balanceRepository;
    private final EmployeeServiceClient employeeServiceClient;
    private final TenantServiceClient tenantServiceClient;
    
    /**
     * 연차 자동 부여 (매년 1월 1일 또는 입사일 기준)
     */
    @Scheduled(cron = "0 0 1 1 1 *") // 매년 1월 1일 01:00
    @Transactional
    public void grantAnnualLeaveForAllTenants() {
        List<UUID> tenantIds = tenantServiceClient.getAllActiveTenantIds();
        
        for (UUID tenantId : tenantIds) {
            grantAnnualLeaveForTenant(tenantId);
        }
    }
    
    public void grantAnnualLeaveForTenant(UUID tenantId) {
        TenantPolicy policy = tenantServiceClient.getPolicy(tenantId, "LEAVE");
        LeavePolicy leavePolicy = LeavePolicy.from(policy);
        
        List<EmployeeDto> employees = employeeServiceClient
            .getActiveEmployees(tenantId);
        
        int currentYear = LocalDate.now().getYear();
        
        for (EmployeeDto employee : employees) {
            try {
                grantAnnualLeave(tenantId, employee, currentYear, leavePolicy);
            } catch (Exception e) {
                log.error("연차 부여 실패 - 사원: {}, 오류: {}", 
                    employee.getId(), e.getMessage());
            }
        }
    }
    
    private void grantAnnualLeave(UUID tenantId, EmployeeDto employee, 
                                   int year, LeavePolicy policy) {
        LocalDate hireDate = employee.getHireDate();
        int yearsOfService = Period.between(hireDate, LocalDate.now()).getYears();
        
        // 연차 일수 계산
        BigDecimal grantedDays = calculateAnnualLeaveDays(yearsOfService, policy);
        
        // 이월 일수 계산
        BigDecimal carriedDays = BigDecimal.ZERO;
        if (policy.isCarryoverAllowed()) {
            LeaveBalance lastYearBalance = balanceRepository
                .findByEmployeeAndTypeAndYear(employee.getId(), "ANNUAL", year - 1)
                .orElse(null);
            
            if (lastYearBalance != null && lastYearBalance.getRemainingDays()
                    .compareTo(BigDecimal.ZERO) > 0) {
                carriedDays = lastYearBalance.getRemainingDays()
                    .min(BigDecimal.valueOf(policy.getCarryoverMaxDays()));
            }
        }
        
        // 연차 잔여 생성/갱신
        LeaveBalance balance = LeaveBalance.builder()
            .tenantId(tenantId)
            .employeeId(employee.getId())
            .leaveTypeId(getAnnualLeaveTypeId(tenantId))
            .year(year)
            .grantedDays(grantedDays)
            .carriedDays(carriedDays)
            .usedDays(BigDecimal.ZERO)
            .adjustedDays(BigDecimal.ZERO)
            .expiresAt(calculateExpiryDate(year, policy))
            .build();
        
        balanceRepository.save(balance);
        
        log.info("연차 부여 완료 - 사원: {}, 부여: {}일, 이월: {}일", 
            employee.getId(), grantedDays, carriedDays);
    }
    
    private BigDecimal calculateAnnualLeaveDays(int yearsOfService, LeavePolicy policy) {
        // 기본 연차 + (근속연수 * 추가일수)
        int baseDays = policy.getBaseDays();
        int additionalDays = yearsOfService * policy.getAdditionalDaysPerYear();
        int totalDays = Math.min(baseDays + additionalDays, policy.getMaxAnnualDays());
        
        return BigDecimal.valueOf(totalDays);
    }
}
```

### 5.2 휴가 신청 처리

```java
@Service
@RequiredArgsConstructor
@Transactional
public class LeaveRequestService {
    
    private final LeaveRequestRepository requestRepository;
    private final LeaveBalanceRepository balanceRepository;
    private final LeaveTypeRepository leaveTypeRepository;
    private final ApprovalServiceClient approvalServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public LeaveRequestDto createLeaveRequest(LeaveRequestCreateDto request) {
        UUID tenantId = SecurityContextHolder.getCurrentTenantId();
        UUID employeeId = SecurityContextHolder.getCurrentEmployeeId();
        
        // 1. 휴가 유형 조회
        LeaveType leaveType = leaveTypeRepository
            .findByTenantIdAndCode(tenantId, request.getLeaveTypeCode())
            .orElseThrow(() -> new NotFoundException("휴가 유형을 찾을 수 없습니다."));
        
        // 2. 휴가 일수 계산
        BigDecimal days = calculateLeaveDays(
            request.getStartDate(), 
            request.getEndDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        // 3. 잔여일 확인
        if (leaveType.getIsAnnual() || leaveType.getDeductFromAnnual()) {
            LeaveBalance balance = balanceRepository
                .findCurrentBalance(employeeId, leaveType.getId())
                .orElseThrow(() -> new BusinessException("휴가 잔여일 정보가 없습니다."));
            
            if (balance.getRemainingDays().compareTo(days) < 0) {
                throw new BusinessException("휴가 잔여일이 부족합니다. " +
                    "잔여: " + balance.getRemainingDays() + "일, 신청: " + days + "일");
            }
        }
        
        // 4. 기간 중복 검사
        boolean hasOverlap = requestRepository.existsOverlappingRequest(
            employeeId,
            request.getStartDate(),
            request.getEndDate(),
            List.of(LeaveStatus.PENDING, LeaveStatus.APPROVED)
        );
        
        if (hasOverlap) {
            throw new BusinessException("해당 기간에 이미 신청된 휴가가 있습니다.");
        }
        
        // 5. 휴가 신청 저장
        LeaveRequest leaveRequest = LeaveRequest.builder()
            .tenantId(tenantId)
            .employeeId(employeeId)
            .leaveTypeId(leaveType.getId())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .days(days)
            .reason(request.getReason())
            .emergencyContact(request.getEmergencyContact())
            .status(LeaveStatus.PENDING)
            .build();
        
        leaveRequest = requestRepository.save(leaveRequest);
        
        // 6. 결재 요청 (승인 필요 시)
        if (leaveType.getRequiresApproval()) {
            ApprovalRequestDto approvalRequest = ApprovalRequestDto.builder()
                .tenantId(tenantId)
                .requesterId(employeeId)
                .documentType("LEAVE_REQUEST")
                .documentId(leaveRequest.getId())
                .title(String.format("%s 신청 (%s ~ %s)", 
                    leaveType.getName(),
                    request.getStartDate(),
                    request.getEndDate()))
                .build();
            
            UUID approvalId = approvalServiceClient.createApproval(approvalRequest);
            leaveRequest.setApprovalId(approvalId);
        } else {
            // 승인 불필요 시 즉시 승인
            leaveRequest.setStatus(LeaveStatus.APPROVED);
            deductLeaveBalance(leaveRequest);
        }
        
        requestRepository.save(leaveRequest);
        
        return LeaveRequestDto.from(leaveRequest);
    }
    
    private BigDecimal calculateLeaveDays(LocalDate startDate, LocalDate endDate,
                                          LocalTime startTime, LocalTime endTime) {
        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        
        // 반차 처리
        if (startTime != null && endTime != null) {
            // 시간 기반 계산
            long hours = ChronoUnit.HOURS.between(startTime, endTime);
            return BigDecimal.valueOf(hours / 8.0);
        }
        
        // 반일 휴가 (오전/오후)
        if (startDate.equals(endDate) && (startTime != null || endTime != null)) {
            return BigDecimal.valueOf(0.5);
        }
        
        return BigDecimal.valueOf(totalDays);
    }
    
    /**
     * 휴가 승인 처리 (Saga - Approval Service에서 이벤트 수신)
     */
    @KafkaListener(topics = "hr-saas.approval.completed")
    @Transactional
    public void handleApprovalCompleted(ApprovalCompletedEvent event) {
        if (!"LEAVE_REQUEST".equals(event.getDocumentType())) {
            return;
        }
        
        LeaveRequest leaveRequest = requestRepository.findById(event.getDocumentId())
            .orElseThrow();
        
        if (event.isApproved()) {
            leaveRequest.setStatus(LeaveStatus.APPROVED);
            leaveRequest.setApprovedBy(event.getApproverId());
            leaveRequest.setApprovedAt(event.getCompletedAt());
            
            // 잔여일 차감
            deductLeaveBalance(leaveRequest);
            
            // 근태 기록에 휴가 반영
            updateAttendanceRecords(leaveRequest);
            
            // 알림 발송
            kafkaTemplate.send("hr-saas.notification.send",
                NotificationEvent.leaveApproved(leaveRequest));
        } else {
            leaveRequest.setStatus(LeaveStatus.REJECTED);
            leaveRequest.setRejectionReason(event.getRejectionReason());
            
            kafkaTemplate.send("hr-saas.notification.send",
                NotificationEvent.leaveRejected(leaveRequest));
        }
        
        requestRepository.save(leaveRequest);
    }
    
    private void deductLeaveBalance(LeaveRequest request) {
        LeaveType leaveType = leaveTypeRepository.findById(request.getLeaveTypeId())
            .orElseThrow();
        
        if (!leaveType.getIsAnnual() && !leaveType.getDeductFromAnnual()) {
            return; // 연차 차감 대상 아님
        }
        
        LeaveBalance balance = balanceRepository
            .findCurrentBalance(request.getEmployeeId(), request.getLeaveTypeId())
            .orElseThrow();
        
        balance.setUsedDays(balance.getUsedDays().add(request.getDays()));
        balanceRepository.save(balance);
    }
}
```

### 5.3 주 52시간 모니터링

```java
@Service
@RequiredArgsConstructor
public class WorkHourMonitoringService {
    
    private final AttendanceRecordRepository attendanceRepository;
    private final OvertimeRequestRepository overtimeRepository;
    private final NotificationServiceClient notificationServiceClient;
    
    private static final int WEEKLY_LIMIT = 52;
    private static final int WARNING_THRESHOLD = 48;
    
    /**
     * 주간 근무시간 체크 (매일 실행)
     */
    @Scheduled(cron = "0 0 22 * * *") // 매일 22:00
    public void checkWeeklyWorkHours() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = today.with(DayOfWeek.SUNDAY);
        
        List<UUID> tenantIds = tenantServiceClient.getAllActiveTenantIds();
        
        for (UUID tenantId : tenantIds) {
            checkTenantWorkHours(tenantId, weekStart, weekEnd);
        }
    }
    
    private void checkTenantWorkHours(UUID tenantId, LocalDate weekStart, LocalDate weekEnd) {
        List<WorkHourSummary> summaries = attendanceRepository
            .getWeeklyWorkHourSummary(tenantId, weekStart, weekEnd);
        
        for (WorkHourSummary summary : summaries) {
            int totalHours = summary.getRegularHours() + summary.getOvertimeHours();
            
            if (totalHours > WEEKLY_LIMIT) {
                // 초과 알림
                notificationServiceClient.sendNotification(
                    NotificationRequest.builder()
                        .tenantId(tenantId)
                        .recipientId(summary.getEmployeeId())
                        .templateCode("WORK_HOUR_EXCEEDED")
                        .data(Map.of(
                            "totalHours", totalHours,
                            "exceededHours", totalHours - WEEKLY_LIMIT
                        ))
                        .build()
                );
                
                // 관리자에게도 알림
                notificationServiceClient.sendNotification(
                    NotificationRequest.builder()
                        .tenantId(tenantId)
                        .recipientId(summary.getManagerId())
                        .templateCode("WORK_HOUR_EXCEEDED_MANAGER")
                        .data(Map.of(
                            "employeeName", summary.getEmployeeName(),
                            "totalHours", totalHours
                        ))
                        .build()
                );
                
            } else if (totalHours >= WARNING_THRESHOLD) {
                // 경고 알림
                notificationServiceClient.sendNotification(
                    NotificationRequest.builder()
                        .tenantId(tenantId)
                        .recipientId(summary.getEmployeeId())
                        .templateCode("WORK_HOUR_WARNING")
                        .data(Map.of(
                            "totalHours", totalHours,
                            "remainingHours", WEEKLY_LIMIT - totalHours
                        ))
                        .build()
                );
            }
        }
    }
    
    public WorkHourStatus getEmployeeWorkHourStatus(UUID employeeId) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        
        // 이번 주 근무시간
        int weeklyHours = attendanceRepository
            .getWeeklyWorkHours(employeeId, weekStart, today);
        
        // 이번 달 시간외근무
        int monthlyOvertimeHours = overtimeRepository
            .getMonthlyOvertimeHours(employeeId, today.getYear(), today.getMonthValue());
        
        WorkHourLevel level;
        if (weeklyHours > WEEKLY_LIMIT) {
            level = WorkHourLevel.EXCEEDED;
        } else if (weeklyHours >= WARNING_THRESHOLD) {
            level = WorkHourLevel.WARNING;
        } else {
            level = WorkHourLevel.NORMAL;
        }
        
        return WorkHourStatus.builder()
            .weeklyHours(weeklyHours)
            .weeklyLimit(WEEKLY_LIMIT)
            .remainingHours(Math.max(0, WEEKLY_LIMIT - weeklyHours))
            .monthlyOvertimeHours(monthlyOvertimeHours)
            .level(level)
            .build();
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| LeaveRequestCreatedEvent | hr-saas.attendance.leave-requested | 휴가 신청 |
| LeaveApprovedEvent | hr-saas.attendance.leave-approved | 휴가 승인 |
| LeaveRejectedEvent | hr-saas.attendance.leave-rejected | 휴가 반려 |
| LeaveCancelledEvent | hr-saas.attendance.leave-cancelled | 휴가 취소 |
| OvertimeRequestedEvent | hr-saas.attendance.overtime-requested | 시간외근무 신청 |
| WorkHourExceededEvent | hr-saas.attendance.work-hour-exceeded | 주 52시간 초과 |

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| ApprovalCompletedEvent | hr-saas.approval.completed | 휴가/시간외근무 승인 결과 반영 |
| EmployeeCreatedEvent | hr-saas.employee.created | 신규 입사자 연차 부여 |
| EmployeeResignedEvent | hr-saas.employee.resigned | 퇴직자 잔여 연차 정산 |

---

## 7. 보안

### 7.1 권한 매트릭스

| API | HR 관리자 | 부서장 | 팀장 | 본인 |
|-----|----------|--------|------|------|
| 출퇴근 기록 | ✅ 전체 | ✅ 부서 | ✅ 팀 | ✅ |
| 출퇴근 수정 | ✅ | ❌ | ❌ | ❌ |
| 휴가 신청 | ✅ | ✅ | ✅ | ✅ |
| 휴가 승인 | ✅ | ✅ | ✅ | ❌ |
| 휴가 잔여 조회 | ✅ 전체 | ✅ 부서 | ✅ 팀 | ✅ |
| 시간외근무 신청 | ✅ | ✅ | ✅ | ✅ |
| 통계 조회 | ✅ 전체 | ✅ 부서 | ✅ 팀 | ✅ 본인 |

---

## 8. 성능 최적화

### 8.1 캐싱 전략

| 데이터 | 캐시 TTL | 무효화 조건 |
|--------|---------|------------|
| 휴가 유형 목록 | 1시간 | 휴가 유형 변경 시 |
| 휴가 잔여일 | 10분 | 휴가 신청/승인/취소 시 |
| 근무 스케줄 | 30분 | 스케줄 변경 시 |

### 8.2 배치 처리

```java
@Configuration
public class AttendanceBatchConfig {
    
    @Bean
    public Job dailyAttendanceJob() {
        return jobBuilder.get("dailyAttendanceJob")
            .start(calculateDailyWorkHoursStep())
            .next(checkAbsentEmployeesStep())
            .next(sendLateNotificationsStep())
            .build();
    }
    
    @Bean
    public Job monthlyLeaveGrantJob() {
        return jobBuilder.get("monthlyLeaveGrantJob")
            .start(grantMonthlyLeaveStep())
            .next(processLeaveExpiryStep())
            .build();
    }
}
```

---

## 9. 모니터링

### 9.1 메트릭

```yaml
# Prometheus 메트릭
- name: attendance_checkin_total
  type: counter
  labels: [tenant_id, method]
  description: 출근 기록 수

- name: leave_request_total
  type: counter
  labels: [tenant_id, leave_type, status]
  description: 휴가 신청 수

- name: work_hour_exceeded_total
  type: counter
  labels: [tenant_id]
  description: 주 52시간 초과 건수

- name: leave_balance_days
  type: gauge
  labels: [tenant_id, employee_id]
  description: 휴가 잔여일
```

### 9.2 알림 규칙

```yaml
# Grafana Alert Rules
- alert: HighAbsenteeRate
  expr: (absent_count / total_employees) > 0.1
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "결근율이 10%를 초과했습니다."

- alert: WorkHourExceeded
  expr: work_hour_exceeded_total > 0
  labels:
    severity: critical
  annotations:
    summary: "주 52시간 초과 직원이 발생했습니다."
```

---

## 10. 배포 설정

### 10.1 Kubernetes 매니페스트

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: attendance-service
  namespace: hr-saas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: attendance-service
  template:
    metadata:
      labels:
        app: attendance-service
    spec:
      containers:
        - name: attendance-service
          image: hr-saas/attendance-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
          resources:
            requests:
              memory: "768Mi"
              cpu: "500m"
            limits:
              memory: "1.5Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: attendance-service
  namespace: hr-saas
spec:
  selector:
    app: attendance-service
  ports:
    - port: 8080
  type: ClusterIP
```

---

## 11. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |