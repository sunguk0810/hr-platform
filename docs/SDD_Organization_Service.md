# SDD: Organization Service (조직 서비스)

## 1. 서비스 개요

### 1.1 목적
Organization Service는 조직도, 부서, 직급/직책, 직무 등 HR 시스템의 조직 구조를 관리하는 핵심 서비스입니다.

### 1.2 책임 범위
- 조직도 구조 관리 (계층형, 매트릭스형)
- 부서/팀 CRUD 및 계층 관리
- 직급(Grade)/직책(Position) 관리
- 직무(Job Family) 분류 체계 관리
- 조직 개편 이력 관리
- 시점별 조직도 히스토리 조회

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
│                   Organization Service                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Department  │  │   Grade /   │  │     Job Family      │ │
│  │ Management  │  │  Position   │  │     Management      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Organization Chart Service              │   │
│  └─────────────────────────────────────────────────────┘   │
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
| Tenant Service | REST (OpenFeign) | 테넌트 정보 및 조직 계층 구조 조회 |
| Employee Service | REST (OpenFeign) | 부서별 인원 수 조회 |
| Approval Service | Kafka Event | 조직 변경 시 결재선 재계산 트리거 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────┐       ┌─────────────────────┐
│    department       │       │  department_history │
├─────────────────────┤       ├─────────────────────┤
│ id (PK, UUID)       │──────<│ id (PK, UUID)       │
│ tenant_id (FK)      │       │ department_id (FK)  │
│ parent_id (FK)      │       │ change_type         │
│ code (UNIQUE/tenant)│       │ changed_field       │
│ name                │       │ old_value           │
│ name_en             │       │ new_value           │
│ level               │       │ effective_date      │
│ level_name          │       │ changed_by          │
│ sort_order          │       │ changed_at          │
│ manager_id          │       └─────────────────────┘
│ status              │
│ effective_from      │       ┌─────────────────────┐
│ effective_to        │       │       grade         │
│ cost_center_code    │       ├─────────────────────┤
│ created_at          │       │ id (PK, UUID)       │
│ updated_at          │       │ tenant_id (FK)      │
└─────────────────────┘       │ code                │
                              │ name                │
┌─────────────────────┐       │ level               │
│      position       │       │ sort_order          │
├─────────────────────┤       │ is_executive        │
│ id (PK, UUID)       │       │ status              │
│ tenant_id (FK)      │       │ created_at          │
│ department_id (FK)  │       └─────────────────────┘
│ code                │
│ name                │       ┌─────────────────────┐
│ position_type       │       │     job_family      │
│ is_manager          │       ├─────────────────────┤
│ sort_order          │       │ id (PK, UUID)       │
│ status              │       │ tenant_id (FK)      │
│ created_at          │       │ parent_id (FK)      │
└─────────────────────┘       │ code                │
                              │ name                │
┌─────────────────────┐       │ level (GROUP/FAMILY/│
│  org_chart_snapshot │       │        JOB)         │
├─────────────────────┤       │ description         │
│ id (PK, UUID)       │       │ status              │
│ tenant_id (FK)      │       │ created_at          │
│ snapshot_date       │       └─────────────────────┘
│ snapshot_data (JSON)│
│ created_by          │
│ created_at          │
└─────────────────────┘
```

### 3.2 테이블 상세

#### 3.2.1 department (부서)
```sql
CREATE TABLE department (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_id UUID REFERENCES department(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    level INTEGER NOT NULL DEFAULT 1,
    level_name VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0,
    manager_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING', 'DISSOLVED')),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    cost_center_code VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT uk_department_code UNIQUE (tenant_id, code)
);

-- 인덱스
CREATE INDEX idx_department_tenant ON department(tenant_id);
CREATE INDEX idx_department_parent ON department(parent_id);
CREATE INDEX idx_department_status ON department(status);
CREATE INDEX idx_department_level ON department(level);
CREATE INDEX idx_department_manager ON department(manager_id);

-- Nested Set 모델을 위한 컬럼 (선택적)
ALTER TABLE department ADD COLUMN lft INTEGER;
ALTER TABLE department ADD COLUMN rgt INTEGER;
CREATE INDEX idx_department_nested ON department(lft, rgt);

-- RLS 정책
ALTER TABLE department ENABLE ROW LEVEL SECURITY;

CREATE POLICY department_isolation ON department
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### 3.2.2 department_history (부서 변경 이력)
```sql
CREATE TABLE department_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES department(id),
    change_type VARCHAR(20) NOT NULL
        CHECK (change_type IN ('CREATE', 'UPDATE', 'DELETE', 'MERGE', 'SPLIT', 'MOVE')),
    changed_field VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    effective_date DATE NOT NULL,
    reason TEXT,
    approval_id UUID,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

-- 파티셔닝 (연도별)
CREATE TABLE department_history_2024 PARTITION OF department_history
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE department_history_2025 PARTITION OF department_history
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- 인덱스
CREATE INDEX idx_dept_history_dept ON department_history(department_id);
CREATE INDEX idx_dept_history_date ON department_history(effective_date);
CREATE INDEX idx_dept_history_type ON department_history(change_type);
```

#### 3.2.3 grade (직급)
```sql
CREATE TABLE grade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    level INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_executive BOOLEAN DEFAULT false,
    min_years INTEGER,
    max_years INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_grade_code UNIQUE (tenant_id, code),
    CONSTRAINT uk_grade_level UNIQUE (tenant_id, level)
);

-- RLS 정책
ALTER TABLE grade ENABLE ROW LEVEL SECURITY;

CREATE POLICY grade_isolation ON grade
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### 3.2.4 position (직책)
```sql
CREATE TABLE position (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    department_id UUID REFERENCES department(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    position_type VARCHAR(30) NOT NULL
        CHECK (position_type IN ('REGULAR', 'CONCURRENT', 'ACTING', 'DEPUTY')),
    is_manager BOOLEAN DEFAULT false,
    is_budget_holder BOOLEAN DEFAULT false,
    min_grade_id UUID REFERENCES grade(id),
    max_grade_id UUID REFERENCES grade(id),
    headcount INTEGER DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_position_code UNIQUE (tenant_id, code)
);

-- 직책 유형 설명
COMMENT ON COLUMN position.position_type IS '
    REGULAR: 정규 직책
    CONCURRENT: 겸직
    ACTING: 직무대리
    DEPUTY: 대행
';

-- RLS 정책
ALTER TABLE position ENABLE ROW LEVEL SECURITY;

CREATE POLICY position_isolation ON position
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### 3.2.5 job_family (직무 체계)
```sql
CREATE TABLE job_family (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_id UUID REFERENCES job_family(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    level VARCHAR(20) NOT NULL
        CHECK (level IN ('GROUP', 'FAMILY', 'JOB')),
    description TEXT,
    required_skills TEXT[],
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_job_family_code UNIQUE (tenant_id, code)
);

-- 직무 체계 레벨 설명
COMMENT ON COLUMN job_family.level IS '
    GROUP: 직무군 (예: 경영지원)
    FAMILY: 직무 (예: 인사, 총무)
    JOB: 직종 (예: 채용담당, 급여담당)
';

-- RLS 정책
ALTER TABLE job_family ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_family_isolation ON job_family
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### 3.2.6 org_chart_snapshot (조직도 스냅샷)
```sql
CREATE TABLE org_chart_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    snapshot_type VARCHAR(20) NOT NULL DEFAULT 'MANUAL'
        CHECK (snapshot_type IN ('MANUAL', 'SCHEDULED', 'REORGANIZATION')),
    snapshot_data JSONB NOT NULL,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_org_snapshot UNIQUE (tenant_id, snapshot_date, snapshot_type)
);

-- RLS 정책
ALTER TABLE org_chart_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_snapshot_isolation ON org_chart_snapshot
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### 3.3 조직도 스냅샷 JSON 구조

```json
{
  "snapshotDate": "2024-01-15",
  "totalDepartments": 45,
  "totalEmployees": 1234,
  "structure": [
    {
      "id": "dept-001",
      "code": "HQ",
      "name": "본사",
      "level": 1,
      "managerId": "emp-001",
      "managerName": "홍길동",
      "employeeCount": 50,
      "children": [
        {
          "id": "dept-002",
          "code": "HR",
          "name": "인사부",
          "level": 2,
          "managerId": "emp-010",
          "managerName": "김철수",
          "employeeCount": 15,
          "children": []
        }
      ]
    }
  ]
}
```

---

## 4. API 명세

### 4.1 부서 관리 API

#### 4.1.1 부서 목록 조회 (트리 구조)
```
GET /api/v1/organizations/departments/tree
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| status | String | N | ACTIVE, INACTIVE, ALL |
| includeEmployeeCount | Boolean | N | 인원 수 포함 여부 (default: false) |
| effectiveDate | Date | N | 특정 시점 조직도 조회 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "HQ",
      "name": "본사",
      "nameEn": "Headquarters",
      "level": 1,
      "levelName": "본부",
      "manager": {
        "id": "emp-001",
        "name": "홍길동",
        "position": "본부장"
      },
      "employeeCount": 500,
      "status": "ACTIVE",
      "children": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "code": "HR",
          "name": "인사부",
          "level": 2,
          "levelName": "부서",
          "manager": {
            "id": "emp-010",
            "name": "김철수",
            "position": "부장"
          },
          "employeeCount": 30,
          "status": "ACTIVE",
          "children": [
            {
              "id": "550e8400-e29b-41d4-a716-446655440002",
              "code": "HR-REC",
              "name": "채용팀",
              "level": 3,
              "levelName": "팀",
              "employeeCount": 10,
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

#### 4.1.2 부서 목록 조회 (Flat)
```
GET /api/v1/organizations/departments
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| parentId | UUID | N | 상위 부서 ID |
| level | Integer | N | 조직 레벨 |
| status | String | N | 상태 |
| keyword | String | N | 검색어 (이름, 코드) |
| page | Integer | N | 페이지 번호 |
| size | Integer | N | 페이지 크기 |

#### 4.1.3 부서 생성
```
POST /api/v1/organizations/departments
```

**Request Body:**
```json
{
  "parentId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "HR-NEW",
  "name": "신규사업팀",
  "nameEn": "New Business Team",
  "levelName": "팀",
  "managerId": "550e8400-e29b-41d4-a716-446655440010",
  "effectiveFrom": "2024-02-01",
  "costCenterCode": "CC-HR-001",
  "description": "신규 사업 추진을 위한 팀"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440003",
    "code": "HR-NEW",
    "name": "신규사업팀",
    "level": 3,
    "status": "PENDING"
  },
  "message": "부서가 성공적으로 생성되었습니다."
}
```

#### 4.1.4 부서 수정
```
PUT /api/v1/organizations/departments/{departmentId}
```

**Request Body:**
```json
{
  "name": "신규사업팀 (명칭변경)",
  "managerId": "550e8400-e29b-41d4-a716-446655440020",
  "reason": "부서장 변경"
}
```

#### 4.1.5 부서 이동
```
POST /api/v1/organizations/departments/{departmentId}/move
```

**Request Body:**
```json
{
  "newParentId": "550e8400-e29b-41d4-a716-446655440005",
  "effectiveDate": "2024-03-01",
  "reason": "조직 개편",
  "approvalId": "approval-123"
}
```

#### 4.1.6 부서 통합
```
POST /api/v1/organizations/departments/merge
```

**Request Body:**
```json
{
  "sourceDepartmentIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "targetDepartmentId": "550e8400-e29b-41d4-a716-446655440003",
  "effectiveDate": "2024-03-01",
  "employeeHandling": "MOVE_TO_TARGET",
  "reason": "중복 기능 통합"
}
```

#### 4.1.7 부서 분리
```
POST /api/v1/organizations/departments/{departmentId}/split
```

**Request Body:**
```json
{
  "newDepartments": [
    {
      "code": "HR-REC",
      "name": "채용팀",
      "employeeIds": ["emp-001", "emp-002"]
    },
    {
      "code": "HR-EDU",
      "name": "교육팀",
      "employeeIds": ["emp-003", "emp-004"]
    }
  ],
  "effectiveDate": "2024-03-01",
  "reason": "전문화를 위한 분리"
}
```

### 4.2 직급 관리 API

#### 4.2.1 직급 목록 조회
```
GET /api/v1/organizations/grades
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "code": "G1",
      "name": "사원",
      "nameEn": "Staff",
      "level": 1,
      "isExecutive": false,
      "minYears": 0,
      "maxYears": 3,
      "employeeCount": 500,
      "status": "ACTIVE"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "code": "G2",
      "name": "대리",
      "nameEn": "Assistant Manager",
      "level": 2,
      "isExecutive": false,
      "minYears": 3,
      "maxYears": 6,
      "employeeCount": 300,
      "status": "ACTIVE"
    }
  ]
}
```

#### 4.2.2 직급 생성
```
POST /api/v1/organizations/grades
```

**Request Body:**
```json
{
  "code": "G5",
  "name": "부장",
  "nameEn": "General Manager",
  "level": 5,
  "isExecutive": false,
  "minYears": 12,
  "maxYears": null
}
```

### 4.3 직책 관리 API

#### 4.3.1 직책 목록 조회
```
GET /api/v1/organizations/positions
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| departmentId | UUID | N | 부서별 필터 |
| positionType | String | N | REGULAR, CONCURRENT, ACTING, DEPUTY |
| isManager | Boolean | N | 관리자 직책만 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440001",
      "code": "POS-HR-MGR",
      "name": "인사부장",
      "department": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "인사부"
      },
      "positionType": "REGULAR",
      "isManager": true,
      "isBudgetHolder": true,
      "minGrade": { "code": "G4", "name": "과장" },
      "maxGrade": { "code": "G5", "name": "부장" },
      "headcount": 1,
      "currentCount": 1,
      "status": "ACTIVE"
    }
  ]
}
```

### 4.4 직무 체계 API

#### 4.4.1 직무 체계 조회 (트리)
```
GET /api/v1/organizations/job-families/tree
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "jf-001",
      "code": "JG-MGMT",
      "name": "경영지원",
      "level": "GROUP",
      "children": [
        {
          "id": "jf-002",
          "code": "JF-HR",
          "name": "인사",
          "level": "FAMILY",
          "children": [
            {
              "id": "jf-003",
              "code": "JOB-REC",
              "name": "채용",
              "level": "JOB",
              "requiredSkills": ["면접기법", "채용시스템"],
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

### 4.5 조직도 히스토리 API

#### 4.5.1 조직도 스냅샷 목록 조회
```
GET /api/v1/organizations/snapshots
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| fromDate | Date | N | 시작 일자 |
| toDate | Date | N | 종료 일자 |
| snapshotType | String | N | MANUAL, SCHEDULED, REORGANIZATION |

#### 4.5.2 특정 시점 조직도 조회
```
GET /api/v1/organizations/snapshots/{snapshotDate}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "snapshotDate": "2024-01-15",
    "snapshotType": "SCHEDULED",
    "totalDepartments": 45,
    "totalEmployees": 1234,
    "structure": [ ... ]
  }
}
```

#### 4.5.3 조직도 스냅샷 생성 (수동)
```
POST /api/v1/organizations/snapshots
```

**Request Body:**
```json
{
  "description": "2024년 1분기 조직개편 전 스냅샷"
}
```

#### 4.5.4 부서 변경 이력 조회
```
GET /api/v1/organizations/departments/{departmentId}/history
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "hist-001",
      "changeType": "UPDATE",
      "changedField": "manager_id",
      "oldValue": "emp-001",
      "newValue": "emp-002",
      "effectiveDate": "2024-01-15",
      "reason": "부서장 인사발령",
      "changedBy": {
        "id": "admin-001",
        "name": "관리자"
      },
      "changedAt": "2024-01-10T10:30:00Z"
    }
  ]
}
```

---

## 5. 비즈니스 로직

### 5.1 부서 생성 및 계층 관리

```java
@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {
    
    private final DepartmentRepository departmentRepository;
    private final TenantServiceClient tenantServiceClient;
    private final DepartmentHistoryRepository historyRepository;
    private final DepartmentEventPublisher eventPublisher;
    
    public DepartmentDto createDepartment(DepartmentCreateRequest request) {
        UUID tenantId = SecurityContextHolder.getCurrentTenantId();
        
        // 1. 코드 중복 검사
        if (departmentRepository.existsByTenantIdAndCode(tenantId, request.getCode())) {
            throw new DuplicateException("이미 존재하는 부서 코드입니다.");
        }
        
        // 2. 상위 부서 검증 및 레벨 계산
        int level = 1;
        String levelName = request.getLevelName();
        
        if (request.getParentId() != null) {
            Department parent = departmentRepository.findById(request.getParentId())
                .orElseThrow(() -> new NotFoundException("상위 부서를 찾을 수 없습니다."));
            
            level = parent.getLevel() + 1;
            
            // 테넌트 조직 계층 구조 검증
            validateHierarchyLevel(tenantId, level, levelName);
        }
        
        // 3. 부서 생성
        Department department = Department.builder()
            .tenantId(tenantId)
            .parentId(request.getParentId())
            .code(request.getCode())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .level(level)
            .levelName(levelName)
            .sortOrder(calculateSortOrder(request.getParentId()))
            .managerId(request.getManagerId())
            .status(DepartmentStatus.ACTIVE)
            .effectiveFrom(request.getEffectiveFrom())
            .costCenterCode(request.getCostCenterCode())
            .build();
        
        department = departmentRepository.save(department);
        
        // 4. Nested Set 인덱스 재계산
        recalculateNestedSetIndex(tenantId);
        
        // 5. 변경 이력 저장
        saveHistory(department, ChangeType.CREATE, null, null, request.getReason());
        
        // 6. 이벤트 발행
        eventPublisher.publish(new DepartmentCreatedEvent(
            department.getId(),
            department.getTenantId(),
            department.getCode(),
            department.getName(),
            department.getParentId()
        ));
        
        return DepartmentDto.from(department);
    }
    
    private void validateHierarchyLevel(UUID tenantId, int level, String levelName) {
        // 테넌트 설정에서 허용된 조직 계층 구조 조회
        TenantHierarchy hierarchy = tenantServiceClient.getTenantHierarchy(tenantId);
        
        if (level > hierarchy.getMaxLevels()) {
            throw new BusinessException("최대 조직 레벨을 초과했습니다.");
        }
        
        // 필수 레벨명 검증
        HierarchyLevel expectedLevel = hierarchy.getLevelAt(level);
        if (expectedLevel.isRequired() && !expectedLevel.getName().equals(levelName)) {
            throw new BusinessException(
                String.format("레벨 %d는 '%s'이어야 합니다.", level, expectedLevel.getName())
            );
        }
    }
    
    private int calculateSortOrder(UUID parentId) {
        if (parentId == null) {
            return departmentRepository.getMaxSortOrderAtRootLevel() + 1;
        }
        return departmentRepository.getMaxSortOrderByParentId(parentId) + 1;
    }
}
```

### 5.2 부서 이동 처리

```java
@Transactional
public void moveDepartment(UUID departmentId, DepartmentMoveRequest request) {
    Department department = departmentRepository.findById(departmentId)
        .orElseThrow(() -> new NotFoundException("부서를 찾을 수 없습니다."));
    
    Department newParent = departmentRepository.findById(request.getNewParentId())
        .orElseThrow(() -> new NotFoundException("이동할 상위 부서를 찾을 수 없습니다."));
    
    // 순환 참조 검증
    if (isDescendantOf(newParent.getId(), departmentId)) {
        throw new BusinessException("하위 부서로 이동할 수 없습니다.");
    }
    
    UUID oldParentId = department.getParentId();
    int oldLevel = department.getLevel();
    int newLevel = newParent.getLevel() + 1;
    int levelDiff = newLevel - oldLevel;
    
    // 부서 이동
    department.setParentId(request.getNewParentId());
    department.setLevel(newLevel);
    
    // 하위 부서 레벨 일괄 조정
    updateChildrenLevel(departmentId, levelDiff);
    
    // Nested Set 재계산
    recalculateNestedSetIndex(department.getTenantId());
    
    // 이력 저장
    saveHistory(department, ChangeType.MOVE, 
        oldParentId.toString(), 
        request.getNewParentId().toString(),
        request.getReason());
    
    // 이벤트 발행 (결재선 재계산 트리거)
    eventPublisher.publish(new DepartmentMovedEvent(
        departmentId,
        oldParentId,
        request.getNewParentId(),
        request.getEffectiveDate()
    ));
}

private boolean isDescendantOf(UUID targetId, UUID ancestorId) {
    Department target = departmentRepository.findById(targetId).orElse(null);
    while (target != null && target.getParentId() != null) {
        if (target.getParentId().equals(ancestorId)) {
            return true;
        }
        target = departmentRepository.findById(target.getParentId()).orElse(null);
    }
    return false;
}
```

### 5.3 조직도 트리 조회 (재귀 CTE)

```java
@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    
    @Query(nativeQuery = true, value = """
        WITH RECURSIVE dept_tree AS (
            -- Base case: 루트 부서
            SELECT 
                d.id, d.parent_id, d.code, d.name, d.name_en,
                d.level, d.level_name, d.manager_id, d.status,
                d.sort_order, 1 as depth,
                ARRAY[d.sort_order] as path
            FROM department d
            WHERE d.tenant_id = :tenantId
            AND d.parent_id IS NULL
            AND (:status IS NULL OR d.status = :status)
            
            UNION ALL
            
            -- Recursive case: 하위 부서
            SELECT 
                d.id, d.parent_id, d.code, d.name, d.name_en,
                d.level, d.level_name, d.manager_id, d.status,
                d.sort_order, dt.depth + 1,
                dt.path || d.sort_order
            FROM department d
            INNER JOIN dept_tree dt ON d.parent_id = dt.id
            WHERE (:status IS NULL OR d.status = :status)
        )
        SELECT * FROM dept_tree
        ORDER BY path
        """)
    List<DepartmentTreeProjection> findDepartmentTree(
        @Param("tenantId") UUID tenantId,
        @Param("status") String status
    );
}
```

### 5.4 조직도 스냅샷 생성

```java
@Service
@RequiredArgsConstructor
public class OrgChartSnapshotService {
    
    private final DepartmentRepository departmentRepository;
    private final EmployeeServiceClient employeeServiceClient;
    private final OrgChartSnapshotRepository snapshotRepository;
    
    @Transactional
    public void createSnapshot(UUID tenantId, String description, SnapshotType type) {
        LocalDate today = LocalDate.now();
        
        // 이미 오늘 스냅샷이 있는지 확인
        if (snapshotRepository.existsByTenantIdAndSnapshotDateAndSnapshotType(
                tenantId, today, type)) {
            throw new BusinessException("이미 오늘 날짜의 스냅샷이 존재합니다.");
        }
        
        // 조직 구조 조회
        List<DepartmentTreeProjection> departments = 
            departmentRepository.findDepartmentTree(tenantId, "ACTIVE");
        
        // 부서별 인원 수 조회
        Map<UUID, Integer> employeeCounts = 
            employeeServiceClient.getEmployeeCountByDepartment(tenantId);
        
        // 트리 구조로 변환
        List<DepartmentSnapshotNode> rootNodes = buildSnapshotTree(
            departments, employeeCounts
        );
        
        // 스냅샷 데이터 생성
        OrgChartSnapshotData snapshotData = OrgChartSnapshotData.builder()
            .snapshotDate(today)
            .totalDepartments(departments.size())
            .totalEmployees(employeeCounts.values().stream().mapToInt(i -> i).sum())
            .structure(rootNodes)
            .build();
        
        // 저장
        OrgChartSnapshot snapshot = OrgChartSnapshot.builder()
            .tenantId(tenantId)
            .snapshotDate(today)
            .snapshotType(type)
            .snapshotData(objectMapper.valueToTree(snapshotData))
            .description(description)
            .createdBy(SecurityContextHolder.getCurrentUserId())
            .build();
        
        snapshotRepository.save(snapshot);
    }
    
    // 매일 자정 자동 스냅샷 생성
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void createDailySnapshot() {
        List<UUID> activeTenantIds = tenantRepository.findAllActiveTenantIds();
        
        for (UUID tenantId : activeTenantIds) {
            try {
                createSnapshot(tenantId, "일일 자동 스냅샷", SnapshotType.SCHEDULED);
            } catch (Exception e) {
                log.error("테넌트 {} 스냅샷 생성 실패: {}", tenantId, e.getMessage());
            }
        }
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

#### 6.1.1 DepartmentCreatedEvent
```java
@Getter
@Builder
public class DepartmentCreatedEvent {
    private UUID departmentId;
    private UUID tenantId;
    private String code;
    private String name;
    private UUID parentId;
    private LocalDateTime createdAt;
}
```

**Kafka Topic:** `hr-saas.organization.department-created`

#### 6.1.2 DepartmentMovedEvent
```java
@Getter
@Builder
public class DepartmentMovedEvent {
    private UUID departmentId;
    private UUID tenantId;
    private UUID oldParentId;
    private UUID newParentId;
    private LocalDate effectiveDate;
    private LocalDateTime movedAt;
}
```

**Kafka Topic:** `hr-saas.organization.department-moved`

**소비자:**
- Approval Service: 결재선 재계산
- Employee Service: 소속 부서 변경 반영

#### 6.1.3 DepartmentDissolvedEvent
```java
@Getter
@Builder
public class DepartmentDissolvedEvent {
    private UUID departmentId;
    private UUID tenantId;
    private UUID targetDepartmentId;
    private LocalDate effectiveDate;
}
```

**Kafka Topic:** `hr-saas.organization.department-dissolved`

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| TenantCreatedEvent | hr-saas.tenant.created | 기본 조직 구조 생성 |
| EmployeeTransferredEvent | hr-saas.employee.transferred | 부서 인원 수 갱신 |

---

## 7. 보안

### 7.1 권한 매트릭스

| API | 그룹 HR 총괄 | 계열사 HR 관리자 | 부서 HR 담당자 | 일반 사원 |
|-----|-------------|-----------------|---------------|----------|
| 조직도 조회 | ✅ 전체 | ✅ 소속 계열사 | ✅ 소속 계열사 | ✅ 소속 계열사 |
| 부서 생성/수정 | ✅ | ✅ | ❌ | ❌ |
| 부서 이동/통합/분리 | ✅ | ✅ | ❌ | ❌ |
| 직급/직책 관리 | ✅ | ✅ | ❌ | ❌ |
| 히스토리 조회 | ✅ | ✅ | ✅ | ❌ |

---

## 8. 성능 최적화

### 8.1 캐싱 전략

| 데이터 | 캐시 TTL | 무효화 조건 |
|--------|---------|------------|
| 조직도 트리 | 10분 | 부서 생성/수정/삭제 시 |
| 직급 목록 | 1시간 | 직급 변경 시 |
| 직책 목록 | 30분 | 직책 변경 시 |
| 직무 체계 | 1시간 | 직무 체계 변경 시 |

### 8.2 조직도 조회 최적화

```java
@Service
@RequiredArgsConstructor
public class OrganizationCacheService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final DepartmentRepository departmentRepository;
    
    private static final String ORG_TREE_CACHE_KEY = "org:tree:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);
    
    @Cacheable(value = "orgTree", key = "#tenantId")
    public List<DepartmentTreeDto> getOrganizationTree(UUID tenantId) {
        String cacheKey = ORG_TREE_CACHE_KEY + tenantId;
        
        // 캐시 조회
        @SuppressWarnings("unchecked")
        List<DepartmentTreeDto> cached = 
            (List<DepartmentTreeDto>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return cached;
        }
        
        // DB 조회 및 트리 구성
        List<DepartmentTreeProjection> flat = 
            departmentRepository.findDepartmentTree(tenantId, "ACTIVE");
        List<DepartmentTreeDto> tree = buildTree(flat);
        
        // 캐시 저장
        redisTemplate.opsForValue().set(cacheKey, tree, CACHE_TTL);
        
        return tree;
    }
    
    @CacheEvict(value = "orgTree", key = "#tenantId")
    public void invalidateCache(UUID tenantId) {
        String cacheKey = ORG_TREE_CACHE_KEY + tenantId;
        redisTemplate.delete(cacheKey);
    }
}
```

---

## 9. 모니터링

### 9.1 메트릭

```yaml
# Prometheus 메트릭
- name: organization_department_total
  type: gauge
  labels: [tenant_id, status]
  description: 부서 총 수

- name: organization_tree_depth
  type: gauge
  labels: [tenant_id]
  description: 조직도 최대 깊이

- name: organization_api_request_duration_seconds
  type: histogram
  labels: [method, endpoint, status]
  description: API 응답 시간

- name: organization_cache_hit_ratio
  type: gauge
  description: 캐시 히트율
```

### 9.2 알림 규칙

```yaml
# Grafana Alert Rules
- alert: OrganizationTreeTooDeep
  expr: organization_tree_depth > 10
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "조직도 깊이가 10단계를 초과했습니다."

- alert: DepartmentChangeFrequencyHigh
  expr: increase(organization_department_changes_total[1h]) > 50
  labels:
    severity: info
  annotations:
    summary: "최근 1시간 동안 부서 변경이 50건 이상 발생했습니다."
```

---

## 10. 배포 설정

### 10.1 Kubernetes 매니페스트

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: organization-service
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: organization-service
  template:
    metadata:
      labels:
        app: organization-service
    spec:
      containers:
        - name: organization-service
          image: hr-saas/organization-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: organization-service
  namespace: hr-saas
spec:
  selector:
    app: organization-service
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