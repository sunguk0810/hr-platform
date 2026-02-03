# SDD: Appointment Service (발령 서비스)

## 1. 서비스 개요

### 1.1 목적
Appointment Service는 인사발령(승진, 전보, 보직, 직무변경 등) 전반을 관리하는 서비스입니다. 발령안 작성부터 결재, 시행까지 전 과정을 지원합니다.

### 1.2 책임 범위
- 발령안 작성 및 관리
- 발령 유형별 처리 (승진, 전보, 보직, 직무변경, 휴직, 복직, 퇴직)
- 발령 결재 연동
- 예약 발령 (미래 시점)
- 발령 이력 관리
- 발령 통보문 생성
- 대량 발령 처리

### 1.3 Phase
**Phase 2**

---

## 2. 아키텍처

### 2.1 서비스 구조
```
┌─────────────────────────────────────────────────────────────┐
│                   Appointment Service                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Appointment │  │   Batch     │  │    Notification     │ │
│  │   Manager   │  │  Processor  │  │     Generator       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Approval   │  │   History   │  │     Scheduler       │ │
│  │  Connector  │  │   Manager   │  │    (Effective)      │ │
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
| Employee Service | REST + Kafka | 사원 정보 조회 및 발령 반영 |
| Organization Service | REST | 부서/직급/직책 정보 조회 |
| Approval Service | Kafka Event | 발령 결재 요청 및 결과 수신 |
| Notification Service | Kafka Event | 발령 통보 발송 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────────┐       ┌─────────────────────────┐
│    appointment_draft    │       │   appointment_detail    │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │──┬───<│ id (PK, UUID)           │
│ tenant_id               │  │    │ draft_id (FK)           │
│ draft_number            │  │    │ employee_id             │
│ title                   │  │    │ appointment_type        │
│ effective_date          │  │    │ from_department_id      │
│ description             │  │    │ to_department_id        │
│ status                  │  │    │ from_position_id        │
│ approval_id             │  │    │ to_position_id          │
│ approved_at             │  │    │ from_grade_id           │
│ executed_at             │  │    │ to_grade_id             │
│ created_by              │  │    │ from_job_id             │
│ created_at              │  │    │ to_job_id               │
└─────────────────────────┘  │    │ reason                  │
                             │    │ status                  │
┌─────────────────────────┐  │    │ executed_at             │
│   appointment_history   │  │    │ created_at              │
├─────────────────────────┤  │    └─────────────────────────┘
│ id (PK, UUID)           │──┘
│ detail_id (FK)          │       ┌─────────────────────────┐
│ employee_id             │       │  appointment_template   │
│ appointment_type        │       ├─────────────────────────┤
│ effective_date          │       │ id (PK, UUID)           │
│ from_values             │       │ tenant_id               │
│ to_values               │       │ template_name           │
│ reason                  │       │ appointment_type        │
│ draft_number            │       │ notification_template   │
│ created_at              │       │ approval_template_id    │
└─────────────────────────┘       │ status                  │
                                  │ created_at              │
                                  └─────────────────────────┘
```

### 3.2 테이블 DDL

#### appointment_draft (발령안)
```sql
CREATE TABLE appointment_draft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    draft_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    effective_date DATE NOT NULL,
    description TEXT,
    attachment_ids UUID[],
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 
                         'REJECTED', 'EXECUTED', 'CANCELLED')),
    approval_id UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    executed_by UUID,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID,
    cancel_reason TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_appointment_draft UNIQUE (tenant_id, draft_number)
);

-- 인덱스
CREATE INDEX idx_appointment_draft_tenant ON appointment_draft(tenant_id);
CREATE INDEX idx_appointment_draft_status ON appointment_draft(status);
CREATE INDEX idx_appointment_draft_effective ON appointment_draft(effective_date);

-- RLS 정책
ALTER TABLE appointment_draft ENABLE ROW LEVEL SECURITY;
CREATE POLICY appointment_draft_isolation ON appointment_draft
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### appointment_detail (발령 상세)
```sql
CREATE TABLE appointment_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES appointment_draft(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    appointment_type VARCHAR(30) NOT NULL
        CHECK (appointment_type IN ('PROMOTION', 'TRANSFER', 'POSITION_CHANGE', 
                                   'JOB_CHANGE', 'LEAVE_OF_ABSENCE', 'REINSTATEMENT',
                                   'RESIGNATION', 'RETIREMENT', 'DEMOTION', 'CONCURRENT')),
    from_department_id UUID,
    to_department_id UUID,
    from_position_id UUID,
    to_position_id UUID,
    from_grade_id UUID,
    to_grade_id UUID,
    from_job_id UUID,
    to_job_id UUID,
    from_employment_type VARCHAR(20),
    to_employment_type VARCHAR(20),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'EXECUTED', 'CANCELLED', 'ROLLED_BACK')),
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_appointment_detail UNIQUE (draft_id, employee_id, appointment_type)
);

-- 인덱스
CREATE INDEX idx_appointment_detail_employee ON appointment_detail(employee_id);
CREATE INDEX idx_appointment_detail_type ON appointment_detail(appointment_type);

-- 발령 유형 설명
-- PROMOTION: 승진 (직급 상승)
-- TRANSFER: 전보 (부서 이동)
-- POSITION_CHANGE: 보직 변경 (직책 변경)
-- JOB_CHANGE: 직무 변경
-- LEAVE_OF_ABSENCE: 휴직
-- REINSTATEMENT: 복직
-- RESIGNATION: 사직
-- RETIREMENT: 정년퇴직
-- DEMOTION: 강등
-- CONCURRENT: 겸직 발령
```

#### appointment_history (발령 이력)
```sql
CREATE TABLE appointment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    detail_id UUID,
    employee_id UUID NOT NULL,
    appointment_type VARCHAR(30) NOT NULL,
    effective_date DATE NOT NULL,
    from_values JSONB NOT NULL,
    to_values JSONB NOT NULL,
    reason TEXT,
    draft_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- 파티셔닝
CREATE TABLE appointment_history_2024 PARTITION OF appointment_history
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 인덱스
CREATE INDEX idx_appointment_history_employee ON appointment_history(employee_id);
CREATE INDEX idx_appointment_history_date ON appointment_history(effective_date);

-- from_values / to_values JSON 예시
-- {
--   "departmentId": "uuid",
--   "departmentName": "개발팀",
--   "positionId": "uuid",
--   "positionName": "팀장",
--   "gradeId": "uuid",
--   "gradeName": "과장"
-- }
```

#### appointment_schedule (예약 발령)
```sql
CREATE TABLE appointment_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    draft_id UUID NOT NULL REFERENCES appointment_draft(id),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME DEFAULT '00:00:00',
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    executed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointment_schedule_date ON appointment_schedule(scheduled_date, status);
```

---

## 4. API 명세

### 4.1 발령안 API

#### 발령안 목록 조회
```
GET /api/v1/appointments/drafts
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| status | String | N | 상태 필터 |
| effectiveDateFrom | Date | N | 시행일 시작 |
| effectiveDateTo | Date | N | 시행일 종료 |
| page | Integer | N | 페이지 |
| size | Integer | N | 크기 |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "draftNumber": "APT-2024-0001",
        "title": "2024년 1월 정기 인사발령",
        "effectiveDate": "2024-01-15",
        "status": "APPROVED",
        "detailCount": 15,
        "createdBy": {
          "id": "uuid",
          "name": "인사담당자"
        },
        "createdAt": "2024-01-10T10:00:00Z"
      }
    ],
    "totalElements": 50
  }
}
```

#### 발령안 생성
```
POST /api/v1/appointments/drafts
```
**Request:**
```json
{
  "title": "2024년 1월 정기 인사발령",
  "effectiveDate": "2024-01-15",
  "description": "2024년 1월 정기 인사발령입니다.",
  "details": [
    {
      "employeeId": "uuid",
      "appointmentType": "PROMOTION",
      "toGradeId": "uuid",
      "reason": "업무 성과 우수"
    },
    {
      "employeeId": "uuid",
      "appointmentType": "TRANSFER",
      "toDepartmentId": "uuid",
      "reason": "조직 개편"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "draftNumber": "APT-2024-0002",
    "title": "2024년 1월 정기 인사발령",
    "effectiveDate": "2024-01-15",
    "status": "DRAFT",
    "detailCount": 2
  }
}
```

#### 발령안 상세 조회
```
GET /api/v1/appointments/drafts/{draftId}
```

#### 발령안 수정
```
PUT /api/v1/appointments/drafts/{draftId}
```

#### 발령안 삭제
```
DELETE /api/v1/appointments/drafts/{draftId}
```

#### 발령 상세 추가
```
POST /api/v1/appointments/drafts/{draftId}/details
```

#### 발령 상세 삭제
```
DELETE /api/v1/appointments/drafts/{draftId}/details/{detailId}
```

### 4.2 결재 및 시행 API

#### 발령 결재 요청
```
POST /api/v1/appointments/drafts/{draftId}/submit
```
**Response:**
```json
{
  "success": true,
  "data": {
    "draftId": "uuid",
    "approvalId": "uuid",
    "status": "PENDING_APPROVAL"
  }
}
```

#### 발령 즉시 시행
```
POST /api/v1/appointments/drafts/{draftId}/execute
```

#### 발령 예약 시행
```
POST /api/v1/appointments/drafts/{draftId}/schedule
```
**Request:**
```json
{
  "scheduledDate": "2024-02-01",
  "scheduledTime": "09:00:00"
}
```

#### 발령 취소
```
POST /api/v1/appointments/drafts/{draftId}/cancel
```
**Request:**
```json
{
  "reason": "발령 내용 변경으로 취소"
}
```

#### 발령 롤백
```
POST /api/v1/appointments/drafts/{draftId}/rollback
```

### 4.3 발령 이력 API

#### 사원별 발령 이력 조회
```
GET /api/v1/appointments/history/employee/{employeeId}
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "appointmentType": "PROMOTION",
      "effectiveDate": "2024-01-15",
      "from": {
        "gradeName": "대리"
      },
      "to": {
        "gradeName": "과장"
      },
      "reason": "정기 승진",
      "draftNumber": "APT-2024-0001"
    }
  ]
}
```

#### 발령 통계 조회
```
GET /api/v1/appointments/statistics
```
**Query Parameters:** year, month, departmentId

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "2024-01",
    "byType": [
      {"type": "PROMOTION", "count": 25},
      {"type": "TRANSFER", "count": 30},
      {"type": "POSITION_CHANGE", "count": 15}
    ],
    "byDepartment": [
      {"departmentId": "uuid", "departmentName": "개발본부", "count": 20}
    ],
    "total": 70
  }
}
```

### 4.4 대량 발령 API

#### 대량 발령 업로드
```
POST /api/v1/appointments/bulk/upload
Content-Type: multipart/form-data
```
**Request:** Excel 파일 업로드

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadId": "uuid",
    "totalRows": 100,
    "validRows": 98,
    "errorRows": 2,
    "errors": [
      {"row": 15, "column": "employeeId", "message": "존재하지 않는 사원입니다."},
      {"row": 45, "column": "toDepartmentId", "message": "존재하지 않는 부서입니다."}
    ]
  }
}
```

#### 대량 발령 확정
```
POST /api/v1/appointments/bulk/{uploadId}/confirm
```

---

## 5. 비즈니스 로직

### 5.1 발령 시행 처리

```java
@Service
@RequiredArgsConstructor
@Transactional
public class AppointmentExecutionService {
    
    private final AppointmentDraftRepository draftRepository;
    private final AppointmentDetailRepository detailRepository;
    private final AppointmentHistoryRepository historyRepository;
    private final EmployeeServiceClient employeeServiceClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public void executeDraft(UUID draftId) {
        AppointmentDraft draft = draftRepository.findById(draftId)
            .orElseThrow(() -> new NotFoundException("발령안을 찾을 수 없습니다."));
        
        // 1. 상태 검증
        if (draft.getStatus() != DraftStatus.APPROVED) {
            throw new BusinessException("승인된 발령안만 시행할 수 있습니다.");
        }
        
        // 2. 시행일 검증
        if (draft.getEffectiveDate().isAfter(LocalDate.now())) {
            throw new BusinessException("시행일이 도래하지 않았습니다. 예약 발령을 사용하세요.");
        }
        
        List<AppointmentDetail> details = detailRepository.findByDraftId(draftId);
        
        // 3. 각 발령 상세 처리
        for (AppointmentDetail detail : details) {
            try {
                executeDetail(draft, detail);
            } catch (Exception e) {
                log.error("발령 시행 실패 - detailId: {}, error: {}", detail.getId(), e.getMessage());
                detail.setStatus(DetailStatus.FAILED);
                detail.setErrorMessage(e.getMessage());
                detailRepository.save(detail);
            }
        }
        
        // 4. 발령안 상태 갱신
        draft.setStatus(DraftStatus.EXECUTED);
        draft.setExecutedAt(LocalDateTime.now());
        draft.setExecutedBy(SecurityContextHolder.getCurrentUserId());
        draftRepository.save(draft);
        
        // 5. 발령 통보 이벤트 발행
        kafkaTemplate.send("hr-saas.appointment.executed",
            AppointmentExecutedEvent.builder()
                .draftId(draftId)
                .draftNumber(draft.getDraftNumber())
                .effectiveDate(draft.getEffectiveDate())
                .detailCount(details.size())
                .build()
        );
    }
    
    private void executeDetail(AppointmentDraft draft, AppointmentDetail detail) {
        // 1. 현재 사원 정보 조회
        EmployeeDto employee = employeeServiceClient.getEmployee(detail.getEmployeeId());
        
        // 2. from 값 저장 (이력용)
        Map<String, Object> fromValues = buildFromValues(employee, detail.getAppointmentType());
        
        // 3. 사원 정보 변경 이벤트 발행
        kafkaTemplate.send("hr-saas.appointment.apply",
            AppointmentApplyEvent.builder()
                .tenantId(draft.getTenantId())
                .employeeId(detail.getEmployeeId())
                .appointmentType(detail.getAppointmentType())
                .effectiveDate(draft.getEffectiveDate())
                .toDepartmentId(detail.getToDepartmentId())
                .toPositionId(detail.getToPositionId())
                .toGradeId(detail.getToGradeId())
                .toJobId(detail.getToJobId())
                .toEmploymentType(detail.getToEmploymentType())
                .build()
        );
        
        // 4. 발령 이력 저장
        AppointmentHistory history = AppointmentHistory.builder()
            .tenantId(draft.getTenantId())
            .detailId(detail.getId())
            .employeeId(detail.getEmployeeId())
            .appointmentType(detail.getAppointmentType())
            .effectiveDate(draft.getEffectiveDate())
            .fromValues(fromValues)
            .toValues(buildToValues(detail))
            .reason(detail.getReason())
            .draftNumber(draft.getDraftNumber())
            .build();
        
        historyRepository.save(history);
        
        // 5. 상세 상태 갱신
        detail.setStatus(DetailStatus.EXECUTED);
        detail.setExecutedAt(LocalDateTime.now());
        detailRepository.save(detail);
    }
    
    private Map<String, Object> buildFromValues(EmployeeDto employee, AppointmentType type) {
        Map<String, Object> values = new HashMap<>();
        
        switch (type) {
            case PROMOTION, DEMOTION -> {
                values.put("gradeId", employee.getGradeId());
                values.put("gradeName", employee.getGradeName());
            }
            case TRANSFER -> {
                values.put("departmentId", employee.getDepartmentId());
                values.put("departmentName", employee.getDepartmentName());
            }
            case POSITION_CHANGE -> {
                values.put("positionId", employee.getPositionId());
                values.put("positionName", employee.getPositionName());
            }
            // ... 기타 유형
        }
        
        return values;
    }
}
```

### 5.2 예약 발령 스케줄러

```java
@Service
@RequiredArgsConstructor
public class AppointmentScheduler {
    
    private final AppointmentScheduleRepository scheduleRepository;
    private final AppointmentExecutionService executionService;
    
    /**
     * 예약 발령 처리 (매일 00:01)
     */
    @Scheduled(cron = "0 1 0 * * *")
    @Transactional
    public void processScheduledAppointments() {
        LocalDate today = LocalDate.now();
        
        List<AppointmentSchedule> schedules = scheduleRepository
            .findByScheduledDateAndStatus(today, ScheduleStatus.SCHEDULED);
        
        log.info("예약 발령 처리 시작 - 대상: {}건", schedules.size());
        
        for (AppointmentSchedule schedule : schedules) {
            try {
                schedule.setStatus(ScheduleStatus.PROCESSING);
                scheduleRepository.save(schedule);
                
                executionService.executeDraft(schedule.getDraftId());
                
                schedule.setStatus(ScheduleStatus.COMPLETED);
                schedule.setExecutedAt(LocalDateTime.now());
                
            } catch (Exception e) {
                log.error("예약 발령 실패 - scheduleId: {}", schedule.getId(), e);
                schedule.setStatus(ScheduleStatus.FAILED);
                schedule.setErrorMessage(e.getMessage());
                schedule.setRetryCount(schedule.getRetryCount() + 1);
            }
            
            scheduleRepository.save(schedule);
        }
    }
}
```

### 5.3 발령 결재 완료 처리

```java
@Service
@RequiredArgsConstructor
public class AppointmentApprovalHandler {
    
    private final AppointmentDraftRepository draftRepository;
    
    @KafkaListener(topics = "hr-saas.approval.completed")
    @Transactional
    public void handleApprovalCompleted(ApprovalCompletedEvent event) {
        if (!"APPOINTMENT".equals(event.getDocumentType())) {
            return;
        }
        
        AppointmentDraft draft = draftRepository.findByApprovalId(event.getApprovalId())
            .orElse(null);
        
        if (draft == null) {
            return;
        }
        
        if (event.isApproved()) {
            draft.setStatus(DraftStatus.APPROVED);
            draft.setApprovedBy(event.getApproverId());
            draft.setApprovedAt(event.getCompletedAt());
        } else {
            draft.setStatus(DraftStatus.REJECTED);
        }
        
        draftRepository.save(draft);
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| AppointmentApplyEvent | hr-saas.appointment.apply | 사원 정보 변경 요청 |
| AppointmentExecutedEvent | hr-saas.appointment.executed | 발령 시행 완료 |
| AppointmentCancelledEvent | hr-saas.appointment.cancelled | 발령 취소 |

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| ApprovalCompletedEvent | hr-saas.approval.completed | 발령 결재 결과 반영 |
| EmployeeUpdatedEvent | hr-saas.employee.updated | 사원 정보 변경 확인 |

---

## 7. 배포 설정

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: appointment-service
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: appointment-service
  template:
    spec:
      containers:
        - name: appointment-service
          image: hr-saas/appointment-service:latest
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
```

---

## 8. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |