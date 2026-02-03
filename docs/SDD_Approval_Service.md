# SDD: Approval Service (전자결재 서비스)

## 1. 서비스 개요

### 1.1 목적
Approval Service는 HR SaaS 플랫폼의 전자결재 워크플로우를 담당하는 핵심 서비스입니다. State Machine 패턴 기반의 워크플로우 엔진을 제공하며, 테넌트별 맞춤 결재 정책을 지원합니다.

### 1.2 책임 범위
- 결재 요청 생성 및 관리
- 결재선 자동 생성 (조직도 기반)
- 병렬 승인, 합의, 전결, 대결 처리
- 조건부 결재선 분기
- 결재 에스컬레이션 및 자동 리마인드
- 결재 이력 관리
- 그룹웨어 연동

### 1.3 Phase
**Phase 1 (MVP)**

---

## 2. 아키텍처

### 2.1 서비스 구조
```
┌─────────────────────────────────────────────────────────────┐
│                     Approval Service                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Workflow Engine (State Machine)             ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  ││
│  │  │ DRAFT   │→ │ PENDING │→ │APPROVED │  │ REJECTED  │  ││
│  │  └─────────┘  └────┬────┘  └─────────┘  └───────────┘  ││
│  │                    ↓                                     ││
│  │              ┌─────────┐                                 ││
│  │              │IN_REVIEW│ (병렬/합의)                     ││
│  │              └─────────┘                                 ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Approval   │  │   Proxy     │  │    Escalation       │ │
│  │Line Builder │  │  Handler    │  │      Handler        │ │
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
| Tenant Service | REST (OpenFeign) | 테넌트별 결재 정책 조회 |
| Organization Service | REST (OpenFeign) | 결재선 생성용 조직도 조회 |
| Employee Service | REST (OpenFeign) | 결재자 정보 조회 |
| Notification Service | Kafka Event | 결재 요청/완료 알림 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────────┐       ┌─────────────────────────┐
│    approval_request     │       │    approval_line        │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │──┬───<│ id (PK, UUID)           │
│ tenant_id               │  │    │ approval_request_id(FK) │
│ requester_id            │  │    │ step_order              │
│ document_type           │  │    │ approver_id             │
│ document_id             │  │    │ approver_type           │
│ title                   │  │    │ approval_type           │
│ content                 │  │    │ status                  │
│ amount                  │  │    │ approved_at             │
│ status                  │  │    │ comment                 │
│ current_step            │  │    │ delegated_from          │
│ total_steps             │  │    │ created_at              │
│ due_date                │  │    └─────────────────────────┘
│ completed_at            │  │
│ created_at              │  │    ┌─────────────────────────┐
│ updated_at              │  │    │   approval_history      │
└─────────────────────────┘  │    ├─────────────────────────┤
                             └───<│ id (PK, UUID)           │
┌─────────────────────────┐       │ approval_request_id(FK) │
│   approval_template     │       │ action                  │
├─────────────────────────┤       │ actor_id                │
│ id (PK, UUID)           │       │ from_status             │
│ tenant_id               │       │ to_status               │
│ document_type           │       │ comment                 │
│ template_name           │       │ created_at              │
│ approval_line_config    │       │ ip_address              │
│ conditions              │       └─────────────────────────┘
│ is_default              │
│ status                  │       ┌─────────────────────────┐
│ created_at              │       │    delegation_rule      │
└─────────────────────────┘       ├─────────────────────────┤
                                  │ id (PK, UUID)           │
┌─────────────────────────┐       │ tenant_id               │
│    approval_comment     │       │ delegator_id            │
├─────────────────────────┤       │ delegate_id             │
│ id (PK, UUID)           │       │ document_types          │
│ approval_request_id(FK) │       │ start_date              │
│ approval_line_id (FK)   │       │ end_date                │
│ commenter_id            │       │ status                  │
│ comment                 │       │ created_at              │
│ is_private              │       └─────────────────────────┘
│ created_at              │
└─────────────────────────┘
```

### 3.2 테이블 DDL

#### approval_request (결재 요청)
```sql
CREATE TABLE approval_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    amount DECIMAL(18, 2),
    urgency VARCHAR(20) DEFAULT 'NORMAL'
        CHECK (urgency IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 
                         'REJECTED', 'CANCELLED', 'RECALLED')),
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    final_approver_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    CONSTRAINT uk_approval_document UNIQUE (tenant_id, document_type, document_id)
);

-- 인덱스
CREATE INDEX idx_approval_request_tenant ON approval_request(tenant_id);
CREATE INDEX idx_approval_request_requester ON approval_request(requester_id);
CREATE INDEX idx_approval_request_status ON approval_request(status);
CREATE INDEX idx_approval_request_document ON approval_request(document_type, document_id);
CREATE INDEX idx_approval_request_created ON approval_request(created_at DESC);

-- RLS 정책
ALTER TABLE approval_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY approval_request_isolation ON approval_request
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### approval_line (결재선)
```sql
CREATE TABLE approval_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_request_id UUID NOT NULL REFERENCES approval_request(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_id UUID NOT NULL,
    approver_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL'
        CHECK (approver_type IN ('INDIVIDUAL', 'POSITION', 'DEPARTMENT', 'ROLE')),
    approval_type VARCHAR(20) NOT NULL DEFAULT 'APPROVAL'
        CHECK (approval_type IN ('APPROVAL', 'AGREEMENT', 'REVIEW', 
                                'NOTIFICATION', 'DIRECT')),
    parallel_group INTEGER,
    consensus_required BOOLEAN DEFAULT false,
    consensus_count INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'APPROVED', 
                         'REJECTED', 'SKIPPED', 'DELEGATED')),
    approved_at TIMESTAMP WITH TIME ZONE,
    comment TEXT,
    delegated_from UUID,
    delegated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_approval_line UNIQUE (approval_request_id, step_order, approver_id)
);

-- 인덱스
CREATE INDEX idx_approval_line_request ON approval_line(approval_request_id);
CREATE INDEX idx_approval_line_approver ON approval_line(approver_id);
CREATE INDEX idx_approval_line_status ON approval_line(status);

-- approval_type 설명
-- APPROVAL: 승인 (필수)
-- AGREEMENT: 합의 (필수, 병렬 가능)
-- REVIEW: 검토 (선택)
-- NOTIFICATION: 통보 (자동 통과)
-- DIRECT: 전결 (최종 결재)
```

#### approval_template (결재선 템플릿)
```sql
CREATE TABLE approval_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    description TEXT,
    approval_line_config JSONB NOT NULL,
    conditions JSONB,
    is_default BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 템플릿 조건 예시
-- conditions: {
--   "amount_gte": 1000000,
--   "days_gte": 5,
--   "department_in": ["HR", "FINANCE"]
-- }
```

#### delegation_rule (대결 규칙)
```sql
CREATE TABLE delegation_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    delegator_id UUID NOT NULL,
    delegate_id UUID NOT NULL,
    document_types TEXT[],
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_delegation UNIQUE (tenant_id, delegator_id, start_date, end_date)
);

-- RLS 정책
ALTER TABLE delegation_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY delegation_isolation ON delegation_rule
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### approval_history (결재 이력)
```sql
CREATE TABLE approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_request_id UUID NOT NULL,
    approval_line_id UUID,
    action VARCHAR(30) NOT NULL
        CHECK (action IN ('CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED',
                         'RECALLED', 'CANCELLED', 'DELEGATED', 'ESCALATED',
                         'COMMENT_ADDED', 'RETURNED')),
    actor_id UUID NOT NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20),
    comment TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
) PARTITION BY RANGE (created_at);

-- 파티셔닝
CREATE TABLE approval_history_2024 PARTITION OF approval_history
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE approval_history_2025 PARTITION OF approval_history
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- 인덱스
CREATE INDEX idx_approval_history_request ON approval_history(approval_request_id);
CREATE INDEX idx_approval_history_actor ON approval_history(actor_id);
```

### 3.3 결재선 템플릿 JSON 구조

```json
{
  "documentType": "LEAVE_REQUEST",
  "templateName": "연차 휴가 (3일 이상)",
  "approvalLineConfig": {
    "lines": [
      {
        "stepOrder": 1,
        "approverType": "DYNAMIC",
        "approverRule": "DIRECT_MANAGER",
        "approvalType": "APPROVAL",
        "required": true
      },
      {
        "stepOrder": 2,
        "approverType": "DYNAMIC",
        "approverRule": "DEPARTMENT_HEAD",
        "approvalType": "APPROVAL",
        "required": true
      },
      {
        "stepOrder": 3,
        "approverType": "POSITION",
        "positionCode": "HR_MANAGER",
        "approvalType": "AGREEMENT",
        "parallelGroup": 1,
        "required": false
      }
    ],
    "parallelGroups": [
      {
        "groupId": 1,
        "consensusRequired": false,
        "minimumApprovals": 1
      }
    ]
  },
  "conditions": {
    "days_gte": 3
  },
  "priority": 10
}
```

---

## 4. API 명세

### 4.1 결재 요청 API

#### 결재 요청 생성
```
POST /api/v1/approvals
```
**Request:**
```json
{
  "documentType": "LEAVE_REQUEST",
  "documentId": "uuid",
  "title": "연차 휴가 신청 (2024.02.01 ~ 2024.02.03)",
  "content": "개인 사유로 연차 휴가를 신청합니다.",
  "amount": null,
  "urgency": "NORMAL",
  "customApprovalLine": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "documentType": "LEAVE_REQUEST",
    "documentId": "uuid",
    "title": "연차 휴가 신청 (2024.02.01 ~ 2024.02.03)",
    "status": "PENDING",
    "currentStep": 1,
    "totalSteps": 3,
    "approvalLines": [
      {
        "stepOrder": 1,
        "approver": {
          "id": "uuid",
          "name": "김팀장",
          "position": "팀장"
        },
        "approvalType": "APPROVAL",
        "status": "IN_PROGRESS"
      },
      {
        "stepOrder": 2,
        "approver": {
          "id": "uuid",
          "name": "이부장",
          "position": "부장"
        },
        "approvalType": "APPROVAL",
        "status": "PENDING"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 결재 요청 목록 조회
```
GET /api/v1/approvals
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| type | String | N | requested(내가 신청), pending(내가 결재할) |
| documentType | String | N | 문서 유형 |
| status | String | N | 상태 |
| startDate | Date | N | 시작일 |
| endDate | Date | N | 종료일 |
| page | Integer | N | 페이지 |
| size | Integer | N | 크기 |

#### 결재 요청 상세 조회
```
GET /api/v1/approvals/{approvalId}
```

#### 결재 대기 목록
```
GET /api/v1/approvals/pending
```
**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "documentType": "LEAVE_REQUEST",
        "title": "연차 휴가 신청",
        "requester": {
          "id": "uuid",
          "name": "홍길동",
          "department": "개발팀"
        },
        "urgency": "HIGH",
        "myApprovalType": "APPROVAL",
        "myStepOrder": 2,
        "waitingDays": 2,
        "dueDate": "2024-01-20T18:00:00Z",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "totalElements": 5
  }
}
```

### 4.2 결재 처리 API

#### 승인
```
POST /api/v1/approvals/{approvalId}/approve
```
**Request:**
```json
{
  "comment": "승인합니다."
}
```

#### 반려
```
POST /api/v1/approvals/{approvalId}/reject
```
**Request:**
```json
{
  "reason": "첨부 서류가 부족합니다."
}
```

#### 회수 (기안자)
```
POST /api/v1/approvals/{approvalId}/recall
```
**Request:**
```json
{
  "reason": "내용 수정이 필요하여 회수합니다."
}
```

#### 대결 처리
```
POST /api/v1/approvals/{approvalId}/delegate
```
**Request:**
```json
{
  "delegateId": "uuid",
  "comment": "출장으로 인해 대결 처리합니다."
}
```

#### 전결 처리
```
POST /api/v1/approvals/{approvalId}/direct-approve
```

### 4.3 대결 설정 API

#### 대결 설정 목록
```
GET /api/v1/approvals/delegations
```

#### 대결 설정 생성
```
POST /api/v1/approvals/delegations
```
**Request:**
```json
{
  "delegateId": "uuid",
  "documentTypes": ["LEAVE_REQUEST", "OVERTIME_REQUEST"],
  "startDate": "2024-02-01",
  "endDate": "2024-02-10",
  "reason": "해외 출장"
}
```

#### 대결 설정 취소
```
DELETE /api/v1/approvals/delegations/{delegationId}
```

### 4.4 결재선 템플릿 API

#### 템플릿 목록 조회
```
GET /api/v1/approvals/templates
```
**Query Parameters:** documentType

#### 템플릿 생성
```
POST /api/v1/approvals/templates
```
**Request:**
```json
{
  "documentType": "EXPENSE_REQUEST",
  "templateName": "경비 청구 (100만원 이상)",
  "approvalLineConfig": {
    "lines": [
      {
        "stepOrder": 1,
        "approverRule": "DIRECT_MANAGER",
        "approvalType": "APPROVAL"
      },
      {
        "stepOrder": 2,
        "approverRule": "DEPARTMENT_HEAD",
        "approvalType": "APPROVAL"
      },
      {
        "stepOrder": 3,
        "positionCode": "CFO",
        "approvalType": "APPROVAL"
      }
    ]
  },
  "conditions": {
    "amount_gte": 1000000
  },
  "priority": 10
}
```

### 4.5 결재 이력 API

#### 결재 이력 조회
```
GET /api/v1/approvals/{approvalId}/history
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "CREATED",
      "actor": {
        "id": "uuid",
        "name": "홍길동"
      },
      "fromStatus": null,
      "toStatus": "DRAFT",
      "comment": null,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "action": "SUBMITTED",
      "actor": {
        "id": "uuid",
        "name": "홍길동"
      },
      "fromStatus": "DRAFT",
      "toStatus": "PENDING",
      "createdAt": "2024-01-15T10:31:00Z"
    },
    {
      "id": "uuid",
      "action": "APPROVED",
      "actor": {
        "id": "uuid",
        "name": "김팀장"
      },
      "fromStatus": "PENDING",
      "toStatus": "PENDING",
      "comment": "승인합니다.",
      "createdAt": "2024-01-15T14:00:00Z"
    }
  ]
}
```

---

## 5. 비즈니스 로직

### 5.1 State Machine 워크플로우 엔진

```java
@Service
@RequiredArgsConstructor
public class ApprovalStateMachine {
    
    private static final Map<ApprovalStatus, Set<ApprovalStatus>> VALID_TRANSITIONS = Map.of(
        ApprovalStatus.DRAFT, Set.of(ApprovalStatus.PENDING, ApprovalStatus.CANCELLED),
        ApprovalStatus.PENDING, Set.of(ApprovalStatus.IN_REVIEW, ApprovalStatus.APPROVED, 
            ApprovalStatus.REJECTED, ApprovalStatus.RECALLED),
        ApprovalStatus.IN_REVIEW, Set.of(ApprovalStatus.APPROVED, ApprovalStatus.REJECTED,
            ApprovalStatus.RECALLED),
        ApprovalStatus.APPROVED, Set.of(), // Final state
        ApprovalStatus.REJECTED, Set.of(), // Final state
        ApprovalStatus.CANCELLED, Set.of(), // Final state
        ApprovalStatus.RECALLED, Set.of(ApprovalStatus.PENDING) // 재상신 가능
    );
    
    public void validateTransition(ApprovalStatus from, ApprovalStatus to) {
        Set<ApprovalStatus> validTargets = VALID_TRANSITIONS.get(from);
        if (validTargets == null || !validTargets.contains(to)) {
            throw new InvalidStateTransitionException(
                String.format("Invalid transition: %s -> %s", from, to));
        }
    }
    
    public ApprovalStatus getNextStatus(ApprovalRequest request, ApprovalAction action) {
        ApprovalStatus current = request.getStatus();
        
        return switch (action) {
            case SUBMIT -> ApprovalStatus.PENDING;
            case APPROVE -> determineApproveNextStatus(request);
            case REJECT -> ApprovalStatus.REJECTED;
            case RECALL -> ApprovalStatus.RECALLED;
            case CANCEL -> ApprovalStatus.CANCELLED;
        };
    }
    
    private ApprovalStatus determineApproveNextStatus(ApprovalRequest request) {
        // 현재 단계의 모든 결재가 완료되었는지 확인
        boolean stepCompleted = isCurrentStepCompleted(request);
        
        if (!stepCompleted) {
            return ApprovalStatus.IN_REVIEW; // 병렬/합의 진행 중
        }
        
        // 다음 단계가 있는지 확인
        if (request.getCurrentStep() < request.getTotalSteps()) {
            return ApprovalStatus.PENDING; // 다음 단계로
        }
        
        return ApprovalStatus.APPROVED; // 최종 승인
    }
}
```

### 5.2 결재선 자동 생성

```java
@Service
@RequiredArgsConstructor
public class ApprovalLineBuilder {
    
    private final ApprovalTemplateRepository templateRepository;
    private final OrganizationServiceClient organizationServiceClient;
    private final EmployeeServiceClient employeeServiceClient;
    private final TenantServiceClient tenantServiceClient;
    
    /**
     * 결재선 자동 생성
     */
    public List<ApprovalLine> buildApprovalLine(ApprovalRequest request) {
        UUID tenantId = request.getTenantId();
        UUID requesterId = request.getRequesterId();
        
        // 1. 적용 가능한 템플릿 조회
        ApprovalTemplate template = findMatchingTemplate(request);
        
        if (template == null) {
            throw new BusinessException("적용 가능한 결재 템플릿이 없습니다.");
        }
        
        // 2. 결재선 구성
        List<ApprovalLine> lines = new ArrayList<>();
        ApprovalLineConfig config = template.getApprovalLineConfig();
        
        for (ApprovalLineConfigItem item : config.getLines()) {
            ApprovalLine line = buildApprovalLineItem(
                request, requesterId, item
            );
            if (line != null) {
                lines.add(line);
            }
        }
        
        // 3. 전결 규칙 적용
        lines = applyDirectApprovalRules(lines, request);
        
        return lines;
    }
    
    private ApprovalTemplate findMatchingTemplate(ApprovalRequest request) {
        List<ApprovalTemplate> templates = templateRepository
            .findByTenantIdAndDocumentTypeAndStatus(
                request.getTenantId(),
                request.getDocumentType(),
                TemplateStatus.ACTIVE
            );
        
        // 조건에 맞는 템플릿 필터링 (우선순위 순)
        return templates.stream()
            .filter(t -> matchesConditions(t.getConditions(), request))
            .max(Comparator.comparingInt(ApprovalTemplate::getPriority))
            .orElse(templates.stream()
                .filter(ApprovalTemplate::getIsDefault)
                .findFirst()
                .orElse(null));
    }
    
    private boolean matchesConditions(JsonNode conditions, ApprovalRequest request) {
        if (conditions == null || conditions.isEmpty()) {
            return true;
        }
        
        // amount 조건
        if (conditions.has("amount_gte")) {
            BigDecimal threshold = conditions.get("amount_gte").decimalValue();
            if (request.getAmount() == null || 
                request.getAmount().compareTo(threshold) < 0) {
                return false;
            }
        }
        
        // days 조건 (휴가 등)
        if (conditions.has("days_gte")) {
            // document에서 days 정보 조회
            int threshold = conditions.get("days_gte").asInt();
            int days = getDocumentDays(request);
            if (days < threshold) {
                return false;
            }
        }
        
        return true;
    }
    
    private ApprovalLine buildApprovalLineItem(ApprovalRequest request, 
                                                UUID requesterId,
                                                ApprovalLineConfigItem item) {
        UUID approverId = resolveApprover(request.getTenantId(), requesterId, item);
        
        if (approverId == null) {
            if (item.isRequired()) {
                throw new BusinessException("필수 결재자를 찾을 수 없습니다: " + item);
            }
            return null; // 선택적 결재선은 스킵
        }
        
        // 본인 결재 방지
        if (approverId.equals(requesterId) && !item.isAllowSelfApproval()) {
            return null;
        }
        
        return ApprovalLine.builder()
            .stepOrder(item.getStepOrder())
            .approverId(approverId)
            .approverType(item.getApproverType())
            .approvalType(item.getApprovalType())
            .parallelGroup(item.getParallelGroup())
            .consensusRequired(item.isConsensusRequired())
            .consensusCount(item.getConsensusCount())
            .status(ApprovalLineStatus.PENDING)
            .build();
    }
    
    private UUID resolveApprover(UUID tenantId, UUID requesterId, 
                                  ApprovalLineConfigItem item) {
        return switch (item.getApproverRule()) {
            case "DIRECT_MANAGER" -> {
                EmployeeDto employee = employeeServiceClient.getEmployee(requesterId);
                DepartmentDto dept = organizationServiceClient
                    .getDepartment(employee.getDepartmentId());
                yield dept.getManagerId();
            }
            case "DEPARTMENT_HEAD" -> {
                EmployeeDto employee = employeeServiceClient.getEmployee(requesterId);
                yield organizationServiceClient
                    .getDepartmentHead(employee.getDepartmentId());
            }
            case "SKIP_LEVEL_MANAGER" -> {
                EmployeeDto employee = employeeServiceClient.getEmployee(requesterId);
                yield organizationServiceClient
                    .getSkipLevelManager(employee.getDepartmentId());
            }
            case "POSITION" -> {
                yield employeeServiceClient
                    .getEmployeeByPosition(tenantId, item.getPositionCode());
            }
            case "INDIVIDUAL" -> item.getApproverId();
            default -> throw new BusinessException("Unknown approver rule: " + 
                item.getApproverRule());
        };
    }
    
    /**
     * 전결 규칙 적용
     */
    private List<ApprovalLine> applyDirectApprovalRules(List<ApprovalLine> lines,
                                                        ApprovalRequest request) {
        // 테넌트 정책에서 전결 규칙 조회
        TenantPolicy policy = tenantServiceClient
            .getPolicy(request.getTenantId(), "APPROVAL");
        
        DirectApprovalConfig directConfig = policy.getDirectApprovalConfig();
        if (directConfig == null || !directConfig.isEnabled()) {
            return lines;
        }
        
        // 금액/일수 기준 전결 가능 여부 판단
        // 예: 3일 이하 휴가는 팀장 전결
        // 구현 생략...
        
        return lines;
    }
}
```

### 5.3 결재 처리

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ApprovalService {
    
    private final ApprovalRequestRepository requestRepository;
    private final ApprovalLineRepository lineRepository;
    private final ApprovalHistoryRepository historyRepository;
    private final ApprovalStateMachine stateMachine;
    private final DelegationService delegationService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    /**
     * 결재 승인
     */
    public ApprovalRequestDto approve(UUID approvalId, ApprovalActionRequest actionRequest) {
        UUID currentUserId = SecurityContextHolder.getCurrentUserId();
        
        ApprovalRequest request = requestRepository.findById(approvalId)
            .orElseThrow(() -> new NotFoundException("결재 요청을 찾을 수 없습니다."));
        
        // 1. 현재 사용자의 결재선 조회
        ApprovalLine myLine = findMyApprovalLine(request, currentUserId);
        if (myLine == null) {
            throw new ForbiddenException("결재 권한이 없습니다.");
        }
        
        // 2. 결재 가능 상태 확인
        validateCanApprove(request, myLine);
        
        // 3. 결재선 상태 업데이트
        myLine.setStatus(ApprovalLineStatus.APPROVED);
        myLine.setApprovedAt(LocalDateTime.now());
        myLine.setComment(actionRequest.getComment());
        lineRepository.save(myLine);
        
        // 4. 다음 상태 결정
        ApprovalStatus nextStatus = stateMachine.getNextStatus(request, ApprovalAction.APPROVE);
        stateMachine.validateTransition(request.getStatus(), nextStatus);
        
        // 5. 요청 상태 업데이트
        ApprovalStatus previousStatus = request.getStatus();
        request.setStatus(nextStatus);
        
        if (nextStatus == ApprovalStatus.APPROVED) {
            request.setCompletedAt(LocalDateTime.now());
            request.setFinalApproverId(currentUserId);
        } else if (nextStatus == ApprovalStatus.PENDING) {
            // 다음 단계로 이동
            request.setCurrentStep(request.getCurrentStep() + 1);
            activateNextStep(request);
        }
        
        requestRepository.save(request);
        
        // 6. 이력 저장
        saveHistory(request, ApprovalAction.APPROVED, currentUserId, 
            previousStatus, nextStatus, actionRequest.getComment());
        
        // 7. 이벤트 발행
        publishApprovalEvent(request, nextStatus);
        
        return ApprovalRequestDto.from(request);
    }
    
    /**
     * 결재 반려
     */
    public ApprovalRequestDto reject(UUID approvalId, ApprovalRejectRequest rejectRequest) {
        UUID currentUserId = SecurityContextHolder.getCurrentUserId();
        
        ApprovalRequest request = requestRepository.findById(approvalId)
            .orElseThrow(() -> new NotFoundException("결재 요청을 찾을 수 없습니다."));
        
        ApprovalLine myLine = findMyApprovalLine(request, currentUserId);
        if (myLine == null) {
            throw new ForbiddenException("결재 권한이 없습니다.");
        }
        
        validateCanApprove(request, myLine);
        
        // 결재선 상태 업데이트
        myLine.setStatus(ApprovalLineStatus.REJECTED);
        myLine.setApprovedAt(LocalDateTime.now());
        myLine.setComment(rejectRequest.getReason());
        lineRepository.save(myLine);
        
        // 요청 상태 업데이트
        ApprovalStatus previousStatus = request.getStatus();
        request.setStatus(ApprovalStatus.REJECTED);
        request.setCompletedAt(LocalDateTime.now());
        requestRepository.save(request);
        
        // 이력 저장
        saveHistory(request, ApprovalAction.REJECTED, currentUserId,
            previousStatus, ApprovalStatus.REJECTED, rejectRequest.getReason());
        
        // 이벤트 발행
        kafkaTemplate.send("hr-saas.approval.completed", 
            ApprovalCompletedEvent.rejected(request, rejectRequest.getReason()));
        
        return ApprovalRequestDto.from(request);
    }
    
    private ApprovalLine findMyApprovalLine(ApprovalRequest request, UUID userId) {
        // 직접 결재선 확인
        ApprovalLine directLine = lineRepository
            .findByApprovalRequestIdAndApproverId(request.getId(), userId)
            .orElse(null);
        
        if (directLine != null) {
            return directLine;
        }
        
        // 대결 권한 확인
        List<DelegationRule> delegations = delegationService
            .getActiveDelegationsForDelegate(userId, request.getDocumentType());
        
        for (DelegationRule delegation : delegations) {
            ApprovalLine delegatedLine = lineRepository
                .findByApprovalRequestIdAndApproverId(request.getId(), delegation.getDelegatorId())
                .orElse(null);
            
            if (delegatedLine != null && 
                delegatedLine.getStatus() == ApprovalLineStatus.PENDING) {
                // 대결 처리
                delegatedLine.setDelegatedFrom(delegation.getDelegatorId());
                delegatedLine.setDelegatedAt(LocalDateTime.now());
                delegatedLine.setApproverId(userId);
                return delegatedLine;
            }
        }
        
        return null;
    }
    
    private void validateCanApprove(ApprovalRequest request, ApprovalLine line) {
        // 요청 상태 확인
        if (request.getStatus() != ApprovalStatus.PENDING && 
            request.getStatus() != ApprovalStatus.IN_REVIEW) {
            throw new BusinessException("결재 가능한 상태가 아닙니다.");
        }
        
        // 결재선 상태 확인
        if (line.getStatus() != ApprovalLineStatus.PENDING &&
            line.getStatus() != ApprovalLineStatus.IN_PROGRESS) {
            throw new BusinessException("이미 처리된 결재입니다.");
        }
        
        // 순서 확인 (이전 단계 완료 여부)
        if (line.getStepOrder() > request.getCurrentStep()) {
            throw new BusinessException("이전 결재가 완료되지 않았습니다.");
        }
    }
    
    private void activateNextStep(ApprovalRequest request) {
        List<ApprovalLine> nextLines = lineRepository
            .findByApprovalRequestIdAndStepOrder(request.getId(), request.getCurrentStep());
        
        for (ApprovalLine line : nextLines) {
            line.setStatus(ApprovalLineStatus.IN_PROGRESS);
            lineRepository.save(line);
            
            // 결재 요청 알림 발송
            kafkaTemplate.send("hr-saas.notification.send",
                NotificationEvent.approvalRequested(request, line.getApproverId()));
        }
    }
    
    private void publishApprovalEvent(ApprovalRequest request, ApprovalStatus status) {
        if (status == ApprovalStatus.APPROVED) {
            kafkaTemplate.send("hr-saas.approval.completed",
                ApprovalCompletedEvent.approved(request));
        } else if (status == ApprovalStatus.PENDING) {
            // 다음 결재자에게 알림
            List<ApprovalLine> currentLines = lineRepository
                .findByApprovalRequestIdAndStepOrder(request.getId(), request.getCurrentStep());
            
            for (ApprovalLine line : currentLines) {
                kafkaTemplate.send("hr-saas.notification.send",
                    NotificationEvent.approvalRequested(request, line.getApproverId()));
            }
        }
    }
}
```

### 5.4 에스컬레이션 처리

```java
@Service
@RequiredArgsConstructor
public class ApprovalEscalationService {
    
    private final ApprovalRequestRepository requestRepository;
    private final TenantServiceClient tenantServiceClient;
    private final NotificationServiceClient notificationServiceClient;
    
    /**
     * 에스컬레이션 체크 (스케줄러)
     */
    @Scheduled(cron = "0 0 9,14,18 * * *") // 하루 3번
    @Transactional
    public void checkEscalation() {
        List<UUID> tenantIds = tenantServiceClient.getAllActiveTenantIds();
        
        for (UUID tenantId : tenantIds) {
            processEscalation(tenantId);
        }
    }
    
    private void processEscalation(UUID tenantId) {
        TenantPolicy policy = tenantServiceClient.getPolicy(tenantId, "APPROVAL");
        EscalationConfig config = policy.getEscalationConfig();
        
        if (config == null || !config.isEnabled()) {
            return;
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        // 1. 리마인더 대상 조회
        LocalDateTime reminderThreshold = now.minusHours(config.getReminderAfterHours());
        List<ApprovalRequest> reminderTargets = requestRepository
            .findPendingRequestsCreatedBefore(tenantId, reminderThreshold);
        
        for (ApprovalRequest request : reminderTargets) {
            sendReminderNotification(request);
        }
        
        // 2. 에스컬레이션 대상 조회
        LocalDateTime escalationThreshold = now.minusHours(config.getEscalateAfterHours());
        List<ApprovalRequest> escalationTargets = requestRepository
            .findPendingRequestsCreatedBefore(tenantId, escalationThreshold);
        
        for (ApprovalRequest request : escalationTargets) {
            escalateToUpperManager(request);
        }
        
        // 3. 자동 반려 대상 조회
        if (config.getAutoRejectAfterHours() > 0) {
            LocalDateTime autoRejectThreshold = now.minusHours(config.getAutoRejectAfterHours());
            List<ApprovalRequest> autoRejectTargets = requestRepository
                .findPendingRequestsCreatedBefore(tenantId, autoRejectThreshold);
            
            for (ApprovalRequest request : autoRejectTargets) {
                autoReject(request);
            }
        }
    }
    
    private void sendReminderNotification(ApprovalRequest request) {
        List<ApprovalLine> pendingLines = lineRepository
            .findPendingLinesByRequestId(request.getId());
        
        for (ApprovalLine line : pendingLines) {
            notificationServiceClient.sendNotification(
                NotificationRequest.builder()
                    .recipientId(line.getApproverId())
                    .templateCode("APPROVAL_REMINDER")
                    .data(Map.of(
                        "title", request.getTitle(),
                        "requesterName", getRequesterName(request.getRequesterId()),
                        "waitingDays", calculateWaitingDays(request.getCreatedAt())
                    ))
                    .build()
            );
        }
    }
    
    private void escalateToUpperManager(ApprovalRequest request) {
        // 상위 관리자에게 에스컬레이션 알림
        UUID upperManagerId = organizationServiceClient
            .getSkipLevelManager(getRequesterDepartmentId(request.getRequesterId()));
        
        if (upperManagerId != null) {
            notificationServiceClient.sendNotification(
                NotificationRequest.builder()
                    .recipientId(upperManagerId)
                    .templateCode("APPROVAL_ESCALATION")
                    .data(Map.of(
                        "title", request.getTitle(),
                        "currentApprover", getCurrentApproverName(request),
                        "waitingDays", calculateWaitingDays(request.getCreatedAt())
                    ))
                    .build()
            );
        }
        
        // 이력 저장
        saveHistory(request, ApprovalAction.ESCALATED, null, null, null, 
            "장기 미처리로 인한 에스컬레이션");
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| ApprovalRequestedEvent | hr-saas.approval.requested | 결재 요청 생성 |
| ApprovalCompletedEvent | hr-saas.approval.completed | 결재 완료 (승인/반려) |
| ApprovalRecalledEvent | hr-saas.approval.recalled | 결재 회수 |
| ApprovalEscalatedEvent | hr-saas.approval.escalated | 에스컬레이션 |

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| EmployeeResignedEvent | hr-saas.employee.resigned | 퇴직자 결재선에서 제외 |
| DepartmentChangedEvent | hr-saas.organization.department-changed | 결재선 재계산 |

---

## 7. 보안

### 7.1 권한 매트릭스

| API | 관리자 | 결재자 | 기안자 | 일반 |
|-----|--------|--------|--------|------|
| 결재 요청 생성 | ✅ | ✅ | ✅ | ✅ |
| 결재 승인/반려 | ✅ | ✅ 본인건 | ❌ | ❌ |
| 결재 회수 | ✅ | ❌ | ✅ 본인건 | ❌ |
| 대결 설정 | ✅ | ✅ | ❌ | ❌ |
| 템플릿 관리 | ✅ | ❌ | ❌ | ❌ |
| 전체 이력 조회 | ✅ | ❌ | ❌ | ❌ |

---

## 8. 성능 최적화

### 8.1 캐싱 전략

| 데이터 | 캐시 TTL | 무효화 조건 |
|--------|---------|------------|
| 결재 템플릿 | 1시간 | 템플릿 수정 시 |
| 대결 규칙 | 30분 | 대결 설정 변경 시 |
| 조직도 (결재선용) | 10분 | 조직 변경 시 |

### 8.2 쿼리 최적화

```java
// 결재 대기 목록 조회 (인덱스 활용)
@Query("""
    SELECT ar FROM ApprovalRequest ar
    JOIN ApprovalLine al ON ar.id = al.approvalRequestId
    WHERE al.approverId = :approverId
    AND al.status IN ('PENDING', 'IN_PROGRESS')
    AND ar.status IN ('PENDING', 'IN_REVIEW')
    ORDER BY ar.urgency DESC, ar.createdAt ASC
    """)
Page<ApprovalRequest> findPendingApprovals(
    @Param("approverId") UUID approverId, 
    Pageable pageable
);
```

---

## 9. 모니터링

### 9.1 메트릭

```yaml
# Prometheus 메트릭
- name: approval_request_total
  type: counter
  labels: [tenant_id, document_type, status]
  description: 결재 요청 수

- name: approval_processing_time_seconds
  type: histogram
  labels: [tenant_id, document_type]
  description: 결재 처리 시간

- name: approval_pending_count
  type: gauge
  labels: [tenant_id, approver_id]
  description: 결재 대기 건수

- name: approval_escalation_total
  type: counter
  labels: [tenant_id]
  description: 에스컬레이션 발생 건수
```

### 9.2 알림 규칙

```yaml
# Grafana Alert Rules
- alert: ApprovalBacklogHigh
  expr: approval_pending_count > 20
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "결재 대기 건수가 20건을 초과했습니다."

- alert: ApprovalProcessingTimeSlow
  expr: histogram_quantile(0.95, approval_processing_time_seconds) > 86400
  labels:
    severity: warning
  annotations:
    summary: "결재 처리 시간이 24시간을 초과하는 건이 있습니다."
```

---

## 10. 배포 설정

### 10.1 Kubernetes 매니페스트

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: approval-service
  namespace: hr-saas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: approval-service
  template:
    metadata:
      labels:
        app: approval-service
    spec:
      containers:
        - name: approval-service
          image: hr-saas/approval-service:latest
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
  name: approval-service
  namespace: hr-saas
spec:
  selector:
    app: approval-service
  ports:
    - port: 8080
  type: ClusterIP
```

---

## 11. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |