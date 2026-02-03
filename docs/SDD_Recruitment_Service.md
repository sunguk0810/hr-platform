# SDD: Recruitment Service (채용 서비스)

## 1. 서비스 개요

### 1.1 목적
Recruitment Service는 채용 공고 관리, 지원서 접수, 전형 진행, 합격자 관리까지 채용 프로세스 전반을 담당하는 서비스입니다.

### 1.2 책임 범위
- 채용 공고 생성/관리
- 지원서 접수 및 관리
- 전형 단계 관리 (서류/면접/최종)
- 면접 일정 관리
- 평가 점수 관리
- 합격자 관리 및 입사 연계
- 채용 통계

### 1.3 Phase
**Phase 2**

---

## 2. 아키텍처

### 2.1 서비스 구조
```
┌─────────────────────────────────────────────────────────────┐
│                   Recruitment Service                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Job      │  │ Application │  │    Selection        │ │
│  │  Posting    │  │   Manager   │  │     Process         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Interview  │  │ Evaluation  │  │     Onboarding      │ │
│  │  Scheduler  │  │   Manager   │  │      Handler        │ │
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
| Employee Service | Kafka Event | 합격자 입사 처리 |
| Organization Service | REST (OpenFeign) | 부서/직급 정보 조회 |
| Notification Service | Kafka Event | 전형 결과 알림 |
| File Service | REST (OpenFeign) | 이력서/포트폴리오 파일 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────────┐       ┌─────────────────────────┐
│      job_posting        │       │      application        │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │──┬───<│ id (PK, UUID)           │
│ tenant_id               │  │    │ job_posting_id (FK)     │
│ title                   │  │    │ tenant_id               │
│ department_id           │  │    │ applicant_name          │
│ position_id             │  │    │ applicant_email         │
│ employment_type         │  │    │ applicant_phone         │
│ job_description         │  │    │ resume_file_id          │
│ requirements            │  │    │ portfolio_url           │
│ preferred               │  │    │ cover_letter            │
│ salary_range            │  │    │ current_stage           │
│ headcount               │  │    │ status                  │
│ posting_start           │  │    │ applied_at              │
│ posting_end             │  │    │ created_at              │
│ status                  │  │    └─────────────────────────┘
│ created_at              │  │
└─────────────────────────┘  │    ┌─────────────────────────┐
                             │    │   selection_stage       │
┌─────────────────────────┐  │    ├─────────────────────────┤
│      interview          │  └───<│ id (PK, UUID)           │
├─────────────────────────┤       │ job_posting_id (FK)     │
│ id (PK, UUID)           │       │ stage_name              │
│ application_id (FK)     │       │ stage_order             │
│ stage_id (FK)           │       │ stage_type              │
│ interview_datetime      │       │ evaluators              │
│ location                │       │ pass_criteria           │
│ interviewers            │       │ created_at              │
│ status                  │       └─────────────────────────┘
│ created_at              │
└─────────────────────────┘       ┌─────────────────────────┐
                                  │      evaluation         │
┌─────────────────────────┐       ├─────────────────────────┤
│   application_history   │       │ id (PK, UUID)           │
├─────────────────────────┤       │ application_id (FK)     │
│ id (PK, UUID)           │       │ stage_id (FK)           │
│ application_id (FK)     │       │ evaluator_id            │
│ from_stage              │       │ score                   │
│ to_stage                │       │ criteria_scores         │
│ from_status             │       │ comments                │
│ to_status               │       │ result                  │
│ changed_by              │       │ evaluated_at            │
│ comment                 │       │ created_at              │
│ created_at              │       └─────────────────────────┘
└─────────────────────────┘
```

### 3.2 테이블 DDL

#### job_posting (채용 공고)
```sql
CREATE TABLE job_posting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    department_id UUID NOT NULL,
    position_id UUID,
    grade_id UUID,
    employment_type VARCHAR(20) NOT NULL
        CHECK (employment_type IN ('FULL_TIME', 'CONTRACT', 'INTERN', 'PART_TIME')),
    job_description TEXT NOT NULL,
    requirements TEXT,
    preferred_qualifications TEXT,
    salary_min DECIMAL(12, 0),
    salary_max DECIMAL(12, 0),
    is_salary_negotiable BOOLEAN DEFAULT false,
    headcount INTEGER DEFAULT 1,
    work_location VARCHAR(200),
    posting_start_date DATE NOT NULL,
    posting_end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED')),
    is_public BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 인덱스
CREATE INDEX idx_job_posting_tenant ON job_posting(tenant_id);
CREATE INDEX idx_job_posting_status ON job_posting(status);
CREATE INDEX idx_job_posting_dates ON job_posting(posting_start_date, posting_end_date);

-- RLS 정책
ALTER TABLE job_posting ENABLE ROW LEVEL SECURITY;
CREATE POLICY job_posting_isolation ON job_posting
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### selection_stage (전형 단계)
```sql
CREATE TABLE selection_stage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES job_posting(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    stage_type VARCHAR(30) NOT NULL
        CHECK (stage_type IN ('DOCUMENT', 'CODING_TEST', 'ASSIGNMENT', 
                              'PHONE_INTERVIEW', 'INTERVIEW', 'FINAL_INTERVIEW',
                              'REFERENCE_CHECK', 'OFFER')),
    description TEXT,
    evaluator_ids UUID[],
    evaluation_criteria JSONB,
    pass_score DECIMAL(5, 2),
    auto_pass BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 평가 기준 JSON 예시
-- {
--   "criteria": [
--     {"name": "기술역량", "weight": 40, "maxScore": 100},
--     {"name": "문제해결력", "weight": 30, "maxScore": 100},
--     {"name": "커뮤니케이션", "weight": 20, "maxScore": 100},
--     {"name": "문화적합성", "weight": 10, "maxScore": 100}
--   ]
-- }
```

#### application (지원서)
```sql
CREATE TABLE application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    job_posting_id UUID NOT NULL REFERENCES job_posting(id),
    applicant_name VARCHAR(100) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    resume_file_id UUID,
    portfolio_url VARCHAR(500),
    portfolio_file_id UUID,
    cover_letter TEXT,
    additional_info JSONB,
    source VARCHAR(50),
    current_stage_id UUID REFERENCES selection_stage(id),
    status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED'
        CHECK (status IN ('RECEIVED', 'SCREENING', 'IN_PROGRESS', 
                         'PASSED', 'FAILED', 'ON_HOLD', 'WITHDRAWN', 'HIRED')),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status_changed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_application UNIQUE (job_posting_id, applicant_email)
);

-- 인덱스
CREATE INDEX idx_application_posting ON application(job_posting_id);
CREATE INDEX idx_application_status ON application(status);
CREATE INDEX idx_application_email ON application(applicant_email);

-- RLS 정책
ALTER TABLE application ENABLE ROW LEVEL SECURITY;
CREATE POLICY application_isolation ON application
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### interview (면접 일정)
```sql
CREATE TABLE interview (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID NOT NULL REFERENCES application(id),
    stage_id UUID NOT NULL REFERENCES selection_stage(id),
    interview_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(300),
    meeting_url VARCHAR(500),
    interviewer_ids UUID[] NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
        CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 
                         'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    applicant_confirmed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_interview_datetime ON interview(interview_datetime);
CREATE INDEX idx_interview_status ON interview(status);
```

#### evaluation (평가)
```sql
CREATE TABLE evaluation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID NOT NULL REFERENCES application(id),
    stage_id UUID NOT NULL REFERENCES selection_stage(id),
    interview_id UUID REFERENCES interview(id),
    evaluator_id UUID NOT NULL,
    overall_score DECIMAL(5, 2),
    criteria_scores JSONB,
    strengths TEXT,
    weaknesses TEXT,
    comments TEXT,
    result VARCHAR(20)
        CHECK (result IN ('PASS', 'FAIL', 'HOLD', 'PENDING')),
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_evaluation UNIQUE (application_id, stage_id, evaluator_id)
);

-- 평가 점수 JSON 예시
-- {
--   "기술역량": 85,
--   "문제해결력": 90,
--   "커뮤니케이션": 80,
--   "문화적합성": 95
-- }
```

---

## 4. API 명세

### 4.1 채용 공고 API

#### 채용 공고 목록 조회
```
GET /api/v1/recruitment/postings
```
**Query Parameters:** status, departmentId, employmentType, page, size

#### 채용 공고 생성
```
POST /api/v1/recruitment/postings
```
**Request:**
```json
{
  "title": "백엔드 개발자",
  "departmentId": "uuid",
  "positionId": "uuid",
  "employmentType": "FULL_TIME",
  "jobDescription": "...",
  "requirements": "...",
  "salaryMin": 50000000,
  "salaryMax": 80000000,
  "headcount": 2,
  "postingStartDate": "2024-02-01",
  "postingEndDate": "2024-02-28",
  "stages": [
    {"stageName": "서류전형", "stageType": "DOCUMENT", "stageOrder": 1},
    {"stageName": "코딩테스트", "stageType": "CODING_TEST", "stageOrder": 2},
    {"stageName": "1차면접", "stageType": "INTERVIEW", "stageOrder": 3},
    {"stageName": "최종면접", "stageType": "FINAL_INTERVIEW", "stageOrder": 4}
  ]
}
```

#### 채용 공고 상세 조회
```
GET /api/v1/recruitment/postings/{postingId}
```

#### 채용 공고 상태 변경
```
PATCH /api/v1/recruitment/postings/{postingId}/status
```

### 4.2 지원서 API

#### 지원서 접수 (외부)
```
POST /api/v1/recruitment/postings/{postingId}/apply
```
**Request:**
```json
{
  "applicantName": "홍길동",
  "applicantEmail": "hong@email.com",
  "applicantPhone": "010-1234-5678",
  "resumeFileId": "uuid",
  "coverLetter": "...",
  "source": "WEBSITE"
}
```

#### 지원서 목록 조회
```
GET /api/v1/recruitment/postings/{postingId}/applications
```
**Query Parameters:** status, stageId, page, size

#### 지원서 상세 조회
```
GET /api/v1/recruitment/applications/{applicationId}
```

#### 지원자 전형 단계 이동
```
POST /api/v1/recruitment/applications/{applicationId}/move-stage
```
**Request:**
```json
{
  "targetStageId": "uuid",
  "status": "IN_PROGRESS",
  "comment": "서류 합격"
}
```

#### 지원자 불합격 처리
```
POST /api/v1/recruitment/applications/{applicationId}/reject
```
**Request:**
```json
{
  "reason": "경력 미달",
  "sendNotification": true
}
```

### 4.3 면접 API

#### 면접 일정 생성
```
POST /api/v1/recruitment/applications/{applicationId}/interviews
```
**Request:**
```json
{
  "stageId": "uuid",
  "interviewDatetime": "2024-02-15T14:00:00+09:00",
  "durationMinutes": 60,
  "location": "본사 3층 회의실",
  "interviewerIds": ["uuid1", "uuid2"],
  "sendNotification": true
}
```

#### 면접 일정 목록 조회
```
GET /api/v1/recruitment/interviews
```
**Query Parameters:** date, interviewerId, status

#### 면접 상태 변경
```
PATCH /api/v1/recruitment/interviews/{interviewId}/status
```

### 4.4 평가 API

#### 평가 등록
```
POST /api/v1/recruitment/applications/{applicationId}/evaluations
```
**Request:**
```json
{
  "stageId": "uuid",
  "interviewId": "uuid",
  "overallScore": 85.5,
  "criteriaScores": {
    "기술역량": 90,
    "문제해결력": 85,
    "커뮤니케이션": 80,
    "문화적합성": 87
  },
  "strengths": "문제 해결 능력이 뛰어남",
  "weaknesses": "협업 경험이 부족",
  "comments": "추가 면접 권장",
  "result": "PASS"
}
```

#### 평가 현황 조회
```
GET /api/v1/recruitment/applications/{applicationId}/evaluations
```

### 4.5 합격자 관리 API

#### 합격 처리 및 입사 연계
```
POST /api/v1/recruitment/applications/{applicationId}/hire
```
**Request:**
```json
{
  "hireDate": "2024-03-04",
  "departmentId": "uuid",
  "positionId": "uuid",
  "gradeId": "uuid",
  "salary": 60000000,
  "employmentType": "FULL_TIME"
}
```

---

## 5. 비즈니스 로직

### 5.1 지원서 처리

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {
    
    private final ApplicationRepository applicationRepository;
    private final JobPostingRepository postingRepository;
    private final SelectionStageRepository stageRepository;
    private final ApplicationHistoryRepository historyRepository;
    private final NotificationServiceClient notificationClient;
    
    public ApplicationDto submitApplication(UUID postingId, ApplicationSubmitRequest request) {
        JobPosting posting = postingRepository.findById(postingId)
            .orElseThrow(() -> new NotFoundException("채용 공고를 찾을 수 없습니다."));
        
        // 1. 공고 상태 확인
        if (posting.getStatus() != PostingStatus.OPEN) {
            throw new BusinessException("마감된 채용 공고입니다.");
        }
        
        // 2. 마감일 확인
        if (LocalDate.now().isAfter(posting.getPostingEndDate())) {
            throw new BusinessException("지원 기간이 종료되었습니다.");
        }
        
        // 3. 중복 지원 확인
        if (applicationRepository.existsByPostingIdAndEmail(postingId, request.getApplicantEmail())) {
            throw new DuplicateException("이미 지원한 공고입니다.");
        }
        
        // 4. 첫 번째 전형 단계 조회
        SelectionStage firstStage = stageRepository
            .findFirstByPostingId(postingId)
            .orElseThrow(() -> new BusinessException("전형 단계가 설정되지 않았습니다."));
        
        // 5. 지원서 생성
        Application application = Application.builder()
            .tenantId(posting.getTenantId())
            .jobPostingId(postingId)
            .applicantName(request.getApplicantName())
            .applicantEmail(request.getApplicantEmail())
            .applicantPhone(request.getApplicantPhone())
            .resumeFileId(request.getResumeFileId())
            .coverLetter(request.getCoverLetter())
            .source(request.getSource())
            .currentStageId(firstStage.getId())
            .status(ApplicationStatus.RECEIVED)
            .appliedAt(LocalDateTime.now())
            .build();
        
        application = applicationRepository.save(application);
        
        // 6. 지원 수 증가
        postingRepository.incrementApplicationCount(postingId);
        
        // 7. 접수 확인 이메일 발송
        notificationClient.sendEmail(
            request.getApplicantEmail(),
            "APPLICATION_RECEIVED",
            Map.of(
                "applicantName", request.getApplicantName(),
                "jobTitle", posting.getTitle(),
                "companyName", getCompanyName(posting.getTenantId())
            )
        );
        
        return ApplicationDto.from(application);
    }
    
    public ApplicationDto moveToNextStage(UUID applicationId, StageChangeRequest request) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new NotFoundException("지원서를 찾을 수 없습니다."));
        
        SelectionStage currentStage = stageRepository.findById(application.getCurrentStageId())
            .orElseThrow();
        SelectionStage targetStage = stageRepository.findById(request.getTargetStageId())
            .orElseThrow();
        
        // 이력 저장
        ApplicationHistory history = ApplicationHistory.builder()
            .applicationId(applicationId)
            .fromStageId(currentStage.getId())
            .toStageId(targetStage.getId())
            .fromStatus(application.getStatus())
            .toStatus(request.getStatus())
            .changedBy(SecurityContextHolder.getCurrentUserId())
            .comment(request.getComment())
            .build();
        
        historyRepository.save(history);
        
        // 상태 변경
        application.setCurrentStageId(targetStage.getId());
        application.setStatus(request.getStatus());
        application.setStatusChangedAt(LocalDateTime.now());
        
        return ApplicationDto.from(applicationRepository.save(application));
    }
}
```

### 5.2 합격자 입사 연계

```java
@Service
@RequiredArgsConstructor
public class HireService {
    
    private final ApplicationRepository applicationRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    @Transactional
    public void processHire(UUID applicationId, HireRequest request) {
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new NotFoundException("지원서를 찾을 수 없습니다."));
        
        // 1. 상태 변경
        application.setStatus(ApplicationStatus.HIRED);
        applicationRepository.save(application);
        
        // 2. 입사 이벤트 발행 → Employee Service에서 처리
        kafkaTemplate.send("hr-saas.recruitment.hired", 
            NewHireEvent.builder()
                .tenantId(application.getTenantId())
                .applicationId(applicationId)
                .name(application.getApplicantName())
                .email(application.getApplicantEmail())
                .phone(application.getApplicantPhone())
                .hireDate(request.getHireDate())
                .departmentId(request.getDepartmentId())
                .positionId(request.getPositionId())
                .gradeId(request.getGradeId())
                .salary(request.getSalary())
                .employmentType(request.getEmploymentType())
                .build()
        );
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| ApplicationReceivedEvent | hr-saas.recruitment.applied | 지원서 접수 |
| ApplicationStatusChangedEvent | hr-saas.recruitment.status-changed | 전형 상태 변경 |
| NewHireEvent | hr-saas.recruitment.hired | 합격자 입사 처리 |

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| EmployeeCreatedEvent | hr-saas.employee.created | 입사 완료 후 지원서 상태 갱신 |

---

## 7. 배포 설정

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: recruitment-service
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: recruitment-service
  template:
    spec:
      containers:
        - name: recruitment-service
          image: hr-saas/recruitment-service:latest
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