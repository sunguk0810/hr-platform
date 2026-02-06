> **DEPRECATED**: 이 문서는 초기 설계 문서로, Kafka 기반으로 작성되었습니다.
> 현재 구현(SQS/SNS)과 다릅니다. 최신 분석은 [`docs/modules/05-EMPLOYEE-SERVICE.md`](modules/05-EMPLOYEE-SERVICE.md)를 참조하세요.

# SDD: Employee Service (인사정보 서비스)

## 1. 서비스 개요

### 1.1 목적
Employee Service는 사원의 인사정보를 종합적으로 관리하는 핵심 서비스입니다. 사원 마스터 데이터, 가족정보, 경력정보, 인사기록카드 등을 관리합니다.

### 1.2 책임 범위
- 사원 기본정보 CRUD
- 사번 생성 및 관리
- 가족정보 관리
- 경력/학력/자격증 관리
- 인사기록카드 조회/출력
- 개인정보 마스킹 및 접근 제어
- 계열사 간 인사이동(전출/전입)
- 퇴직자 관리

### 1.3 Phase
**Phase 1 (MVP)**

---

## 2. 아키텍처

### 2.1 서비스 위치
```
┌─────────────────────────────────────────────────────────────┐
│                    Spring Cloud Gateway                      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Employee Service                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Employee   │  │   Family    │  │      Career         │ │
│  │    Core     │  │ Management  │  │    Management       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Privacy   │  │  Transfer   │  │    Employee ID      │ │
│  │   Control   │  │   Handler   │  │     Generator       │ │
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
| Tenant Service | REST (OpenFeign) | 테넌트 정책 조회 |
| Organization Service | REST (OpenFeign) | 부서/직급/직책 정보 조회 |
| Auth Service | REST (OpenFeign) | 사용자 계정 생성/연동 |
| File Service | REST (OpenFeign) | 프로필 사진, 첨부파일 관리 |
| Approval Service | Kafka Event | 인사정보 변경 승인 처리 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────┐       ┌─────────────────────┐
│      employee       │       │   employee_detail   │
├─────────────────────┤       ├─────────────────────┤
│ id (PK, UUID)       │──────<│ id (PK, UUID)       │
│ tenant_id           │       │ employee_id (FK)    │
│ employee_no         │       │ resident_number_enc │
│ name                │       │ address             │
│ name_en             │       │ address_detail      │
│ email               │       │ postal_code         │
│ phone               │       │ emergency_contact   │
│ mobile              │       │ emergency_phone     │
│ department_id       │       │ bank_code           │
│ grade_id            │       │ bank_account_enc    │
│ position_id         │       │ blood_type          │
│ job_family_id       │       │ military_status     │
│ employment_type     │       │ disability_grade    │
│ employment_status   │       │ updated_at          │
│ hire_date           │       └─────────────────────┘
│ resignation_date    │
│ profile_image_url   │       ┌─────────────────────┐
│ created_at          │       │   employee_family   │
│ updated_at          │       ├─────────────────────┤
└─────────────────────┘       │ id (PK, UUID)       │
                              │ employee_id (FK)    │
┌─────────────────────┐       │ relation_type       │
│  employee_career    │       │ name                │
│───────────────────────       │ birth_date          │
│ id (PK, UUID)       │       │ is_cohabitant       │
│ employee_id (FK)    │       │ is_dependent        │
│ career_type         │       │ occupation          │
│ company_name        │       │ company_name        │
│ department          │       │ employee_id_spouse  │
│ position            │       │ created_at          │
│ start_date          │       └─────────────────────┘
│ end_date            │
│ job_description     │       ┌─────────────────────┐
│ resignation_reason  │       │ employee_education  │
│ is_verified         │       ├─────────────────────┤
│ created_at          │       │ id (PK, UUID)       │
└─────────────────────┘       │ employee_id (FK)    │
                              │ education_type      │
┌─────────────────────┐       │ school_name         │
│employee_certificate │       │ major               │
├─────────────────────┤       │ degree              │
│ id (PK, UUID)       │       │ admission_date      │
│ employee_id (FK)    │       │ graduation_date     │
│ certificate_name    │       │ graduation_status   │
│ issuing_org         │       │ is_verified         │
│ issue_date          │       │ created_at          │
│ expiry_date         │       └─────────────────────┘
│ certificate_no      │
│ grade               │       ┌─────────────────────┐
│ attachment_url      │       │  employee_history   │
│ is_verified         │       ├─────────────────────┤
│ created_at          │       │ id (PK, UUID)       │
└─────────────────────┘       │ employee_id (FK)    │
                              │ history_type        │
                              │ changed_field       │
                              │ old_value           │
                              │ new_value           │
                              │ effective_date      │
                              │ changed_by          │
                              │ changed_at          │
                              │ ip_address          │
                              └─────────────────────┘
```

### 3.2 테이블 상세

#### 3.2.1 employee (사원)
```sql
CREATE TABLE employee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_no VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    name_chinese VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    department_id UUID NOT NULL,
    grade_id UUID,
    position_id UUID,
    job_family_id UUID,
    employment_type VARCHAR(20) NOT NULL
        CHECK (employment_type IN ('REGULAR', 'CONTRACT', 'PARTTIME', 'INTERN', 'DISPATCH')),
    employment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (employment_status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'RETIRED')),
    hire_date DATE NOT NULL,
    contract_end_date DATE,
    resignation_date DATE,
    resignation_type VARCHAR(30),
    resignation_reason TEXT,
    work_location VARCHAR(100),
    profile_image_url VARCHAR(500),
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT uk_employee_no UNIQUE (tenant_id, employee_no),
    CONSTRAINT uk_employee_email UNIQUE (tenant_id, email)
);

-- 인덱스
CREATE INDEX idx_employee_tenant ON employee(tenant_id);
CREATE INDEX idx_employee_department ON employee(department_id);
CREATE INDEX idx_employee_status ON employee(employment_status);
CREATE INDEX idx_employee_name ON employee(name);
CREATE INDEX idx_employee_hire_date ON employee(hire_date);

-- RLS 정책
ALTER TABLE employee ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_isolation ON employee
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### 3.2.2 employee_detail (사원 상세정보 - 민감정보)
```sql
CREATE TABLE employee_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL UNIQUE REFERENCES employee(id) ON DELETE CASCADE,
    -- 암호화 필드
    resident_number_enc BYTEA,
    passport_number_enc BYTEA,
    bank_account_enc BYTEA,
    -- 일반 필드
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    nationality VARCHAR(50) DEFAULT 'KR',
    address VARCHAR(500),
    address_detail VARCHAR(200),
    postal_code VARCHAR(10),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    emergency_relation VARCHAR(50),
    bank_code VARCHAR(10),
    blood_type VARCHAR(5),
    military_status VARCHAR(20),
    military_branch VARCHAR(50),
    military_rank VARCHAR(50),
    military_start_date DATE,
    military_end_date DATE,
    disability_grade VARCHAR(10),
    disability_type VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS 정책 (employee 테이블과 동일)
ALTER TABLE employee_detail ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_detail_isolation ON employee_detail
    USING (employee_id IN (
        SELECT id FROM employee 
        WHERE tenant_id = current_setting('app.current_tenant')::UUID
    ));
```

#### 3.2.3 employee_family (가족정보)
```sql
CREATE TABLE employee_family (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    relation_type VARCHAR(20) NOT NULL
        CHECK (relation_type IN ('SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDPARENT', 'OTHER')),
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    gender VARCHAR(10),
    is_cohabitant BOOLEAN DEFAULT false,
    is_dependent BOOLEAN DEFAULT false,
    is_disabled BOOLEAN DEFAULT false,
    disability_grade VARCHAR(10),
    occupation VARCHAR(100),
    company_name VARCHAR(200),
    -- 사내 배우자인 경우
    employee_id_spouse UUID REFERENCES employee(id),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_employee_family_employee ON employee_family(employee_id);
CREATE INDEX idx_employee_family_spouse ON employee_family(employee_id_spouse);

-- RLS 정책
ALTER TABLE employee_family ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_family_isolation ON employee_family
    USING (employee_id IN (
        SELECT id FROM employee 
        WHERE tenant_id = current_setting('app.current_tenant')::UUID
    ));
```

#### 3.2.4 employee_career (경력정보)
```sql
CREATE TABLE employee_career (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    career_type VARCHAR(20) NOT NULL
        CHECK (career_type IN ('INTERNAL', 'EXTERNAL')),
    company_name VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    job_description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    resignation_reason TEXT,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    attachment_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS 정책
ALTER TABLE employee_career ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_career_isolation ON employee_career
    USING (employee_id IN (
        SELECT id FROM employee 
        WHERE tenant_id = current_setting('app.current_tenant')::UUID
    ));
```

#### 3.2.5 employee_education (학력정보)
```sql
CREATE TABLE employee_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    education_type VARCHAR(20) NOT NULL
        CHECK (education_type IN ('HIGH_SCHOOL', 'COLLEGE', 'UNIVERSITY', 'GRADUATE', 'DOCTORATE', 'OTHER')),
    school_name VARCHAR(200) NOT NULL,
    major VARCHAR(100),
    minor VARCHAR(100),
    degree VARCHAR(50),
    admission_date DATE,
    graduation_date DATE,
    graduation_status VARCHAR(20)
        CHECK (graduation_status IN ('GRADUATED', 'ENROLLED', 'DROPPED', 'EXPECTED')),
    gpa DECIMAL(3, 2),
    gpa_scale DECIMAL(3, 2),
    is_verified BOOLEAN DEFAULT false,
    attachment_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS 정책
ALTER TABLE employee_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_education_isolation ON employee_education
    USING (employee_id IN (
        SELECT id FROM employee 
        WHERE tenant_id = current_setting('app.current_tenant')::UUID
    ));
```

#### 3.2.6 employee_certificate (자격증)
```sql
CREATE TABLE employee_certificate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    certificate_name VARCHAR(200) NOT NULL,
    certificate_type VARCHAR(50),
    issuing_org VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    certificate_no VARCHAR(100),
    grade VARCHAR(50),
    is_verified BOOLEAN DEFAULT false,
    attachment_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS 정책
ALTER TABLE employee_certificate ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_certificate_isolation ON employee_certificate
    USING (employee_id IN (
        SELECT id FROM employee 
        WHERE tenant_id = current_setting('app.current_tenant')::UUID
    ));
```

#### 3.2.7 employee_history (인사정보 변경 이력)
```sql
CREATE TABLE employee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    history_type VARCHAR(30) NOT NULL
        CHECK (history_type IN ('CREATE', 'UPDATE', 'STATUS_CHANGE', 'TRANSFER', 'PROMOTION', 'RESIGNATION')),
    changed_field VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    effective_date DATE NOT NULL,
    reason TEXT,
    approval_id UUID,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
) PARTITION BY RANGE (changed_at);

-- 연도별 파티션
CREATE TABLE employee_history_2024 PARTITION OF employee_history
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE employee_history_2025 PARTITION OF employee_history
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- 인덱스
CREATE INDEX idx_emp_history_employee ON employee_history(employee_id);
CREATE INDEX idx_emp_history_type ON employee_history(history_type);
CREATE INDEX idx_emp_history_date ON employee_history(changed_at);
```

#### 3.2.8 privacy_access_log (개인정보 조회 로그)
```sql
CREATE TABLE privacy_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    accessed_by UUID NOT NULL,
    access_type VARCHAR(20) NOT NULL
        CHECK (access_type IN ('VIEW', 'EXPORT', 'PRINT', 'UNMASK')),
    accessed_fields TEXT[],
    purpose TEXT,
    approval_id UUID,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
) PARTITION BY RANGE (accessed_at);

-- 5년 보관을 위한 파티션
CREATE TABLE privacy_access_log_2024 PARTITION OF privacy_access_log
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

---

## 4. API 명세

### 4.1 사원 관리 API

#### 4.1.1 사원 목록 조회
```
GET /api/v1/employees
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| departmentId | UUID | N | 부서 ID |
| gradeId | UUID | N | 직급 ID |
| employmentType | String | N | REGULAR, CONTRACT, PARTTIME |
| employmentStatus | String | N | ACTIVE, ON_LEAVE, RESIGNED |
| keyword | String | N | 검색어 (이름, 사번, 이메일) |
| hireDateFrom | Date | N | 입사일 시작 |
| hireDateTo | Date | N | 입사일 종료 |
| page | Integer | N | 페이지 번호 (default: 0) |
| size | Integer | N | 페이지 크기 (default: 20) |
| sort | String | N | 정렬 (예: name,asc) |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "employeeNo": "EMP-2024-001",
        "name": "홍길동",
        "email": "hong@company.com",
        "mobile": "010-****-5678",
        "department": {
          "id": "dept-001",
          "name": "인사부",
          "path": "본사 > 경영지원본부 > 인사부"
        },
        "grade": {
          "id": "grade-003",
          "name": "과장"
        },
        "position": {
          "id": "pos-001",
          "name": "인사팀장"
        },
        "employmentType": "REGULAR",
        "employmentStatus": "ACTIVE",
        "hireDate": "2020-03-02",
        "profileImageUrl": "https://s3.../profile.jpg"
      }
    ],
    "totalElements": 1234,
    "totalPages": 62,
    "number": 0
  }
}
```

#### 4.1.2 사원 상세 조회
```
GET /api/v1/employees/{employeeId}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| includeDetail | Boolean | N | 상세정보 포함 (권한 필요) |
| includeFamliy | Boolean | N | 가족정보 포함 |
| includeCareer | Boolean | N | 경력정보 포함 |
| includeEducation | Boolean | N | 학력정보 포함 |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "employeeNo": "EMP-2024-001",
    "name": "홍길동",
    "nameEn": "Hong Gil-dong",
    "email": "hong@company.com",
    "phone": "02-1234-5678",
    "mobile": "010-1234-5678",
    "department": {
      "id": "dept-001",
      "code": "HR",
      "name": "인사부",
      "path": "본사 > 경영지원본부 > 인사부"
    },
    "grade": {
      "id": "grade-003",
      "code": "G3",
      "name": "과장",
      "level": 3
    },
    "position": {
      "id": "pos-001",
      "code": "HR-MGR",
      "name": "인사팀장",
      "isManager": true
    },
    "jobFamily": {
      "id": "jf-001",
      "name": "인사"
    },
    "employmentType": "REGULAR",
    "employmentStatus": "ACTIVE",
    "hireDate": "2020-03-02",
    "workLocation": "본사 10층",
    "profileImageUrl": "https://s3.../profile.jpg",
    "detail": {
      "birthDate": "1985-**-**",
      "gender": "MALE",
      "address": "서울시 강남구 ***",
      "emergencyContact": "김**",
      "emergencyPhone": "010-****-1234"
    },
    "family": [
      {
        "id": "fam-001",
        "relationType": "SPOUSE",
        "name": "김**",
        "isDependent": true
      }
    ],
    "createdAt": "2020-03-02T09:00:00Z",
    "updatedAt": "2024-01-15T14:30:00Z"
  }
}
```

#### 4.1.3 사원 등록
```
POST /api/v1/employees
```

**Request Body:**
```json
{
  "name": "김신입",
  "nameEn": "Kim Sin-ip",
  "email": "newbie@company.com",
  "mobile": "010-9876-5432",
  "departmentId": "550e8400-e29b-41d4-a716-446655440001",
  "gradeId": "550e8400-e29b-41d4-a716-446655440010",
  "positionId": null,
  "jobFamilyId": "550e8400-e29b-41d4-a716-446655440020",
  "employmentType": "REGULAR",
  "hireDate": "2024-02-01",
  "workLocation": "본사",
  "detail": {
    "birthDate": "1995-05-15",
    "gender": "MALE",
    "residentNumber": "950515-1******",
    "address": "서울시 강남구 테헤란로 123",
    "addressDetail": "101동 1001호",
    "postalCode": "06234",
    "bankCode": "004",
    "bankAccount": "123-456-789012"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "employeeNo": "EMP-2024-099",
    "name": "김신입",
    "email": "newbie@company.com",
    "employmentStatus": "ACTIVE"
  },
  "message": "사원이 성공적으로 등록되었습니다."
}
```

#### 4.1.4 사원 정보 수정
```
PUT /api/v1/employees/{employeeId}
```

**Request Body:**
```json
{
  "mobile": "010-1111-2222",
  "departmentId": "550e8400-e29b-41d4-a716-446655440002",
  "gradeId": "550e8400-e29b-41d4-a716-446655440011",
  "reason": "승진 및 부서 이동"
}
```

#### 4.1.5 사원 일괄 등록
```
POST /api/v1/employees/bulk
```

**Request Body:**
```json
{
  "employees": [
    {
      "name": "김신입1",
      "email": "newbie1@company.com",
      "departmentId": "...",
      "hireDate": "2024-02-01"
    },
    {
      "name": "김신입2",
      "email": "newbie2@company.com",
      "departmentId": "...",
      "hireDate": "2024-02-01"
    }
  ],
  "skipErrors": false
}
```

### 4.2 가족정보 API

#### 4.2.1 가족정보 조회
```
GET /api/v1/employees/{employeeId}/family
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fam-001",
      "relationType": "SPOUSE",
      "name": "김배우",
      "birthDate": "1987-03-15",
      "isCohabitant": true,
      "isDependent": true,
      "occupation": "회사원",
      "companyName": "삼성전자",
      "isInternalSpouse": false
    },
    {
      "id": "fam-002",
      "relationType": "CHILD",
      "name": "홍자녀",
      "birthDate": "2015-08-20",
      "isCohabitant": true,
      "isDependent": true
    }
  ]
}
```

#### 4.2.2 가족정보 등록
```
POST /api/v1/employees/{employeeId}/family
```

**Request Body:**
```json
{
  "relationType": "CHILD",
  "name": "홍둘째",
  "birthDate": "2020-01-10",
  "gender": "FEMALE",
  "isCohabitant": true,
  "isDependent": true
}
```

### 4.3 퇴직 처리 API

#### 4.3.1 퇴직 처리
```
POST /api/v1/employees/{employeeId}/resignation
```

**Request Body:**
```json
{
  "resignationDate": "2024-02-29",
  "resignationType": "VOLUNTARY",
  "resignationReason": "개인 사유",
  "lastWorkingDate": "2024-02-28",
  "handoverEmployeeId": "550e8400-e29b-41d4-a716-446655440010",
  "approvalId": "approval-123"
}
```

#### 4.3.2 퇴직 취소
```
POST /api/v1/employees/{employeeId}/resignation/cancel
```

**Request Body:**
```json
{
  "reason": "퇴직 의사 철회",
  "approvalId": "approval-124"
}
```

### 4.4 계열사 간 전출/전입 API

#### 4.4.1 전출 요청
```
POST /api/v1/employees/{employeeId}/transfer/request
```

**Request Body:**
```json
{
  "targetTenantId": "660e8400-e29b-41d4-a716-446655440000",
  "targetDepartmentId": "770e8400-e29b-41d4-a716-446655440000",
  "effectiveDate": "2024-03-01",
  "transferType": "PERMANENT",
  "reason": "그룹사 인력 재배치"
}
```

#### 4.4.2 전입 승인
```
POST /api/v1/employees/transfer/{transferId}/approve
```

**Request Body:**
```json
{
  "approved": true,
  "targetGradeId": "grade-003",
  "targetPositionId": null,
  "remarks": "전입 승인"
}
```

### 4.5 개인정보 마스킹 해제 API

#### 4.5.1 마스킹 해제 요청
```
POST /api/v1/employees/{employeeId}/unmask
```

**Request Body:**
```json
{
  "fields": ["residentNumber", "bankAccount", "address"],
  "purpose": "급여 처리를 위한 정보 확인",
  "approvalId": "approval-125"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "residentNumber": "850515-1234567",
    "bankAccount": "123-456-789012",
    "address": "서울시 강남구 테헤란로 123",
    "validUntil": "2024-01-15T15:30:00Z"
  }
}
```

### 4.6 인사기록카드 API

#### 4.6.1 인사기록카드 조회
```
GET /api/v1/employees/{employeeId}/record-card
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employee": { ... },
    "detail": { ... },
    "family": [ ... ],
    "education": [ ... ],
    "career": [ ... ],
    "certificates": [ ... ],
    "appointments": [ ... ],
    "awards": [ ... ],
    "disciplinary": [ ... ]
  }
}
```

#### 4.6.2 인사기록카드 PDF 출력
```
GET /api/v1/employees/{employeeId}/record-card/pdf
```

---

## 5. 비즈니스 로직

### 5.1 사번 생성 로직

```java
@Service
@RequiredArgsConstructor
public class EmployeeNoGenerator {
    
    private final EmployeeRepository employeeRepository;
    private final TenantServiceClient tenantServiceClient;
    private final RedisTemplate<String, String> redisTemplate;
    
    private static final String EMPLOYEE_NO_SEQUENCE_KEY = "employee:no:sequence:";
    
    @Transactional
    public String generateEmployeeNo(UUID tenantId) {
        // 테넌트별 사번 형식 조회
        TenantPolicy policy = tenantServiceClient.getPolicy(tenantId, "EMPLOYEE_NO");
        EmployeeNoConfig config = parseConfig(policy);
        
        // 형식: {PREFIX}-{YEAR}-{SEQUENCE}
        // 예: EMP-2024-001, KRH-2024-0001
        
        String year = String.valueOf(LocalDate.now().getYear());
        String sequenceKey = EMPLOYEE_NO_SEQUENCE_KEY + tenantId + ":" + year;
        
        // Redis를 이용한 원자적 시퀀스 증가
        Long sequence = redisTemplate.opsForValue().increment(sequenceKey);
        
        // 연도 변경 시 시퀀스 리셋
        if (sequence == 1) {
            redisTemplate.expire(sequenceKey, Duration.ofDays(366));
        }
        
        String employeeNo = String.format("%s-%s-%0" + config.getSequenceDigits() + "d",
            config.getPrefix(),
            year,
            sequence
        );
        
        // 중복 체크 (혹시 모를 상황 대비)
        while (employeeRepository.existsByTenantIdAndEmployeeNo(tenantId, employeeNo)) {
            sequence = redisTemplate.opsForValue().increment(sequenceKey);
            employeeNo = String.format("%s-%s-%0" + config.getSequenceDigits() + "d",
                config.getPrefix(),
                year,
                sequence
            );
        }
        
        return employeeNo;
    }
}
```

### 5.2 사원 등록 프로세스

```java
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {
    
    private final EmployeeRepository employeeRepository;
    private final EmployeeDetailRepository detailRepository;
    private final EmployeeNoGenerator employeeNoGenerator;
    private final EncryptionService encryptionService;
    private final AuthServiceClient authServiceClient;
    private final EmployeeEventPublisher eventPublisher;
    
    public EmployeeDto createEmployee(EmployeeCreateRequest request) {
        UUID tenantId = SecurityContextHolder.getCurrentTenantId();
        
        // 1. 이메일 중복 검사
        if (employeeRepository.existsByTenantIdAndEmail(tenantId, request.getEmail())) {
            throw new DuplicateException("이미 등록된 이메일입니다.");
        }
        
        // 2. 사번 생성
        String employeeNo = employeeNoGenerator.generateEmployeeNo(tenantId);
        
        // 3. 사원 기본정보 저장
        Employee employee = Employee.builder()
            .tenantId(tenantId)
            .employeeNo(employeeNo)
            .name(request.getName())
            .nameEn(request.getNameEn())
            .email(request.getEmail())
            .mobile(request.getMobile())
            .departmentId(request.getDepartmentId())
            .gradeId(request.getGradeId())
            .positionId(request.getPositionId())
            .jobFamilyId(request.getJobFamilyId())
            .employmentType(request.getEmploymentType())
            .employmentStatus(EmploymentStatus.ACTIVE)
            .hireDate(request.getHireDate())
            .contractEndDate(request.getContractEndDate())
            .workLocation(request.getWorkLocation())
            .build();
        
        employee = employeeRepository.save(employee);
        
        // 4. 상세정보 저장 (민감정보 암호화)
        if (request.getDetail() != null) {
            EmployeeDetail detail = createEmployeeDetail(employee.getId(), request.getDetail());
            detailRepository.save(detail);
        }
        
        // 5. 사용자 계정 생성 요청
        UserCreateRequest userRequest = UserCreateRequest.builder()
            .tenantId(tenantId)
            .employeeId(employee.getId())
            .email(employee.getEmail())
            .name(employee.getName())
            .build();
        
        UUID userId = authServiceClient.createUser(userRequest);
        employee.setUserId(userId);
        
        // 6. 이벤트 발행
        eventPublisher.publish(new EmployeeCreatedEvent(
            employee.getId(),
            tenantId,
            employeeNo,
            employee.getDepartmentId()
        ));
        
        // 7. 이력 저장
        saveHistory(employee, HistoryType.CREATE, null);
        
        return EmployeeDto.from(employee);
    }
    
    private EmployeeDetail createEmployeeDetail(UUID employeeId, EmployeeDetailRequest request) {
        return EmployeeDetail.builder()
            .employeeId(employeeId)
            .birthDate(request.getBirthDate())
            .gender(request.getGender())
            // 민감정보 암호화
            .residentNumberEnc(encryptionService.encrypt(request.getResidentNumber()))
            .bankAccountEnc(encryptionService.encrypt(request.getBankAccount()))
            .address(request.getAddress())
            .addressDetail(request.getAddressDetail())
            .postalCode(request.getPostalCode())
            .bankCode(request.getBankCode())
            .emergencyContact(request.getEmergencyContact())
            .emergencyPhone(request.getEmergencyPhone())
            .build();
    }
}
```

### 5.3 개인정보 마스킹 처리

```java
@Service
@RequiredArgsConstructor
public class PrivacyMaskingService {
    
    private final PrivacyAccessLogRepository accessLogRepository;
    
    public String maskResidentNumber(String residentNumber) {
        if (residentNumber == null || residentNumber.length() != 14) {
            return "******-*******";
        }
        return residentNumber.substring(0, 6) + "-" + residentNumber.charAt(7) + "******";
    }
    
    public String maskPhone(String phone) {
        if (phone == null || phone.length() < 8) {
            return "***-****-****";
        }
        // 010-1234-5678 -> 010-****-5678
        return phone.replaceAll("(\\d{3})-(\\d{4})-(\\d{4})", "$1-****-$3");
    }
    
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***@***.***";
        }
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        
        if (local.length() <= 2) {
            return "**@" + domain;
        }
        return local.substring(0, 2) + "***@" + domain;
    }
    
    public String maskName(String name) {
        if (name == null || name.length() < 2) {
            return "**";
        }
        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }
    
    public String maskAddress(String address) {
        if (address == null || address.length() < 10) {
            return "***";
        }
        // 시/도 + 구/군까지만 표시
        String[] parts = address.split(" ");
        if (parts.length >= 2) {
            return parts[0] + " " + parts[1] + " ***";
        }
        return address.substring(0, Math.min(10, address.length())) + "***";
    }
    
    @Transactional
    public void logPrivacyAccess(UUID tenantId, UUID employeeId, UUID accessedBy,
                                  AccessType accessType, List<String> fields, String purpose) {
        PrivacyAccessLog log = PrivacyAccessLog.builder()
            .tenantId(tenantId)
            .employeeId(employeeId)
            .accessedBy(accessedBy)
            .accessType(accessType)
            .accessedFields(fields.toArray(new String[0]))
            .purpose(purpose)
            .ipAddress(RequestContextHolder.getCurrentIpAddress())
            .userAgent(RequestContextHolder.getCurrentUserAgent())
            .build();
        
        accessLogRepository.save(log);
    }
}
```

### 5.4 계열사 간 전출/전입 처리

```java
@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeTransferService {
    
    private final EmployeeRepository employeeRepository;
    private final EmployeeTransferRepository transferRepository;
    private final TenantServiceClient tenantServiceClient;
    private final EmployeeEventPublisher eventPublisher;
    
    public TransferDto requestTransfer(UUID employeeId, TransferRequest request) {
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new NotFoundException("사원을 찾을 수 없습니다."));
        
        // 대상 테넌트 검증
        TenantDto targetTenant = tenantServiceClient.getTenant(request.getTargetTenantId());
        if (targetTenant.getStatus() != TenantStatus.ACTIVE) {
            throw new BusinessException("전입 대상 계열사가 활성 상태가 아닙니다.");
        }
        
        // 전출 요청 생성
        EmployeeTransfer transfer = EmployeeTransfer.builder()
            .employeeId(employeeId)
            .sourceTenantId(employee.getTenantId())
            .targetTenantId(request.getTargetTenantId())
            .targetDepartmentId(request.getTargetDepartmentId())
            .effectiveDate(request.getEffectiveDate())
            .transferType(request.getTransferType())
            .status(TransferStatus.PENDING_SOURCE_APPROVAL)
            .reason(request.getReason())
            .requestedBy(SecurityContextHolder.getCurrentUserId())
            .build();
        
        transfer = transferRepository.save(transfer);
        
        // 전출처 승인 요청 이벤트 발행
        eventPublisher.publish(new TransferRequestedEvent(
            transfer.getId(),
            employeeId,
            employee.getTenantId(),
            request.getTargetTenantId(),
            request.getEffectiveDate()
        ));
        
        return TransferDto.from(transfer);
    }
    
    public void approveTransfer(UUID transferId, TransferApprovalRequest request) {
        EmployeeTransfer transfer = transferRepository.findById(transferId)
            .orElseThrow(() -> new NotFoundException("전출/전입 요청을 찾을 수 없습니다."));
        
        UUID currentTenantId = SecurityContextHolder.getCurrentTenantId();
        
        if (transfer.getStatus() == TransferStatus.PENDING_SOURCE_APPROVAL 
            && currentTenantId.equals(transfer.getSourceTenantId())) {
            // 전출처 승인
            transfer.setStatus(TransferStatus.PENDING_TARGET_APPROVAL);
            transfer.setSourceApprovedBy(SecurityContextHolder.getCurrentUserId());
            transfer.setSourceApprovedAt(LocalDateTime.now());
            
        } else if (transfer.getStatus() == TransferStatus.PENDING_TARGET_APPROVAL 
            && currentTenantId.equals(transfer.getTargetTenantId())) {
            // 전입처 승인 -> 실제 전출/전입 처리
            transfer.setStatus(TransferStatus.COMPLETED);
            transfer.setTargetApprovedBy(SecurityContextHolder.getCurrentUserId());
            transfer.setTargetApprovedAt(LocalDateTime.now());
            transfer.setTargetGradeId(request.getTargetGradeId());
            transfer.setTargetPositionId(request.getTargetPositionId());
            
            // 사원 정보 업데이트
            executeTransfer(transfer);
            
        } else {
            throw new BusinessException("승인 권한이 없습니다.");
        }
        
        transferRepository.save(transfer);
    }
    
    private void executeTransfer(EmployeeTransfer transfer) {
        Employee employee = employeeRepository.findById(transfer.getEmployeeId())
            .orElseThrow();
        
        // 기존 테넌트에서 상태 변경 (전출)
        employee.setEmploymentStatus(EmploymentStatus.TRANSFERRED);
        employeeRepository.save(employee);
        
        // 새 테넌트에 사원 복제 생성 (전입)
        Employee newEmployee = Employee.builder()
            .tenantId(transfer.getTargetTenantId())
            .employeeNo(generateNewEmployeeNo(transfer.getTargetTenantId()))
            .name(employee.getName())
            .nameEn(employee.getNameEn())
            .email(employee.getEmail())
            .mobile(employee.getMobile())
            .departmentId(transfer.getTargetDepartmentId())
            .gradeId(transfer.getTargetGradeId())
            .positionId(transfer.getTargetPositionId())
            .employmentType(employee.getEmploymentType())
            .employmentStatus(EmploymentStatus.ACTIVE)
            .hireDate(transfer.getEffectiveDate())
            .previousEmployeeId(employee.getId())
            .build();
        
        newEmployee = employeeRepository.save(newEmployee);
        
        // 경력/학력/자격증 등 복사
        copyEmployeeRelatedData(employee.getId(), newEmployee.getId());
        
        // 이벤트 발행
        eventPublisher.publish(new EmployeeTransferredEvent(
            employee.getId(),
            newEmployee.getId(),
            transfer.getSourceTenantId(),
            transfer.getTargetTenantId(),
            transfer.getEffectiveDate()
        ));
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| EmployeeCreatedEvent | hr-saas.employee.created | 사원 등록 |
| EmployeeUpdatedEvent | hr-saas.employee.updated | 사원 정보 변경 |
| EmployeeResignedEvent | hr-saas.employee.resigned | 퇴직 처리 |
| EmployeeTransferredEvent | hr-saas.employee.transferred | 계열사 간 전출/전입 |
| EmployeeDepartmentChangedEvent | hr-saas.employee.department-changed | 부서 변경 |

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| DepartmentDissolvedEvent | hr-saas.organization.department-dissolved | 소속 부서 해체 시 처리 |
| ApprovalCompletedEvent | hr-saas.approval.completed | 인사정보 변경 승인 완료 시 반영 |

---

## 7. 보안

### 7.1 권한 매트릭스

| API | 그룹 HR | 계열사 HR | 부서 HR | 팀장 | 본인 |
|-----|---------|----------|--------|------|------|
| 사원 목록 조회 | ✅ 전체 | ✅ 계열사 | ✅ 부서 | ✅ 팀 | ❌ |
| 사원 상세 조회 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 민감정보 조회 | ✅ | ✅ | 승인필요 | ❌ | ✅ |
| 사원 등록 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 사원 수정 | ✅ | ✅ | ❌ | ❌ | 일부 |
| 퇴직 처리 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 전출/전입 | ✅ | ✅ | ❌ | ❌ | ❌ |

### 7.2 개인정보 보호

```java
@Aspect
@Component
@RequiredArgsConstructor
public class PrivacyProtectionAspect {
    
    private final PrivacyMaskingService maskingService;
    private final PrivacyAccessLogRepository accessLogRepository;
    
    @Around("@annotation(PrivacyProtected)")
    public Object protectPrivacy(ProceedingJoinPoint joinPoint) throws Throwable {
        Object result = joinPoint.proceed();
        
        if (result instanceof EmployeeDto) {
            EmployeeDto dto = (EmployeeDto) result;
            
            // 본인 또는 권한이 있는 경우가 아니면 마스킹
            if (!hasPrivacyAccess(dto.getId())) {
                maskEmployeeDto(dto);
            }
        }
        
        return result;
    }
    
    private void maskEmployeeDto(EmployeeDto dto) {
        dto.setMobile(maskingService.maskPhone(dto.getMobile()));
        dto.setEmail(maskingService.maskEmail(dto.getEmail()));
        
        if (dto.getDetail() != null) {
            dto.getDetail().setBirthDate(null);
            dto.getDetail().setAddress(maskingService.maskAddress(dto.getDetail().getAddress()));
        }
    }
}
```

---

## 8. 성능 최적화

### 8.1 캐싱 전략

| 데이터 | 캐시 TTL | 무효화 조건 |
|--------|---------|------------|
| 사원 기본정보 | 30분 | 사원 정보 변경 시 |
| 부서별 사원 목록 | 10분 | 부서 인원 변경 시 |
| 사원 수 통계 | 1시간 | 입사/퇴사 발생 시 |

### 8.2 검색 최적화

```java
// Full-text Search를 위한 GIN 인덱스
@Query(nativeQuery = true, value = """
    CREATE INDEX idx_employee_search ON employee 
    USING GIN (to_tsvector('simple', name || ' ' || COALESCE(name_en, '') || ' ' || employee_no))
    """)
void createSearchIndex();

// 검색 쿼리
@Query(nativeQuery = true, value = """
    SELECT * FROM employee 
    WHERE tenant_id = :tenantId
    AND to_tsvector('simple', name || ' ' || COALESCE(name_en, '') || ' ' || employee_no) 
        @@ plainto_tsquery('simple', :keyword)
    AND (:status IS NULL OR employment_status = :status)
    ORDER BY name
    LIMIT :limit OFFSET :offset
    """)
List<Employee> searchEmployees(
    @Param("tenantId") UUID tenantId,
    @Param("keyword") String keyword,
    @Param("status") String status,
    @Param("limit") int limit,
    @Param("offset") int offset
);
```

---

## 9. 모니터링

### 9.1 메트릭

```yaml
# Prometheus 메트릭
- name: employee_total
  type: gauge
  labels: [tenant_id, employment_status]
  description: 사원 총 수

- name: employee_hire_count
  type: counter
  labels: [tenant_id, employment_type]
  description: 입사자 수

- name: employee_resignation_count
  type: counter
  labels: [tenant_id, resignation_type]
  description: 퇴사자 수

- name: privacy_access_count
  type: counter
  labels: [tenant_id, access_type]
  description: 개인정보 조회 횟수
```

---

## 10. 배포 설정

### 10.1 Kubernetes 매니페스트

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: employee-service
  namespace: hr-saas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: employee-service
  template:
    metadata:
      labels:
        app: employee-service
    spec:
      containers:
        - name: employee-service
          image: hr-saas/employee-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
            - name: ENCRYPTION_KEY
              valueFrom:
                secretKeyRef:
                  name: encryption-secrets
                  key: aes-key
          resources:
            requests:
              memory: "768Mi"
              cpu: "500m"
            limits:
              memory: "1.5Gi"
              cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: employee-service
  namespace: hr-saas
spec:
  selector:
    app: employee-service
  ports:
    - port: 8080
      targetPort: 8080
  type: ClusterIP
```

---

## 11. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |