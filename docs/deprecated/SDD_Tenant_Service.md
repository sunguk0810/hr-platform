> **DEPRECATED**: 이 문서는 초기 설계 문서로, Kafka 기반 이벤트 통신으로 작성되었습니다.
> 현재 구현(SQS/SNS)과 다릅니다. 최신 분석은 [`docs/modules/02-TENANT-SERVICE.md`](modules/02-TENANT-SERVICE.md)를 참조하세요.

# SDD: Tenant Service (테넌트 서비스)

## 1. 서비스 개요

### 1.1 목적
Tenant Service는 멀티테넌트 HR SaaS 플랫폼의 핵심 서비스로, 그룹사와 계열사(테넌트)의 생성, 관리, 정책 설정을 담당합니다.

### 1.2 책임 범위
- 그룹사/계열사 생성 및 관리
- 테넌트별 정책 설정 (휴가, 결재, 근태 등)
- 테넌트별 기능 On/Off 관리
- 테넌트 간 계층 구조 관리
- 라이선스 및 사용자 수 관리

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
│                      Tenant Service                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Tenant    │  │   Policy    │  │     Feature         │ │
│  │  Management │  │  Management │  │     Management      │ │
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
| Auth Service | REST (OpenFeign) | 테넌트별 사용자 권한 조회 |
| Organization Service | Kafka Event | 테넌트 생성 시 기본 조직 생성 이벤트 발행 |
| Notification Service | Kafka Event | 테넌트 생성/정책 변경 알림 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────┐       ┌─────────────────────┐
│      tenant         │       │   tenant_policy     │
├─────────────────────┤       ├─────────────────────┤
│ id (PK, UUID)       │──────<│ id (PK, UUID)       │
│ parent_id (FK)      │       │ tenant_id (FK)      │
│ code (UNIQUE)       │       │ policy_type         │
│ name                │       │ policy_config (JSON)│
│ type (GROUP/SUB)    │       │ effective_from      │
│ status              │       │ effective_to        │
│ license_type        │       │ is_active           │
│ max_users           │       │ created_at          │
│ contact_email       │       │ updated_at          │
│ contact_phone       │       └─────────────────────┘
│ address             │
│ business_number     │       ┌─────────────────────┐
│ created_at          │       │  tenant_feature     │
│ updated_at          │       ├─────────────────────┤
│ created_by          │──────<│ id (PK, UUID)       │
│ updated_by          │       │ tenant_id (FK)      │
└─────────────────────┘       │ feature_code        │
                              │ is_enabled          │
                              │ config (JSON)       │
┌─────────────────────┐       │ created_at          │
│  tenant_hierarchy   │       │ updated_at          │
├─────────────────────┤       └─────────────────────┘
│ id (PK, UUID)       │
│ tenant_id (FK)      │       ┌─────────────────────┐
│ level_name          │       │   tenant_history    │
│ level_order         │       ├─────────────────────┤
│ is_required         │       │ id (PK, UUID)       │
│ created_at          │       │ tenant_id (FK)      │
└─────────────────────┘       │ action_type         │
                              │ changed_field       │
                              │ old_value (JSON)    │
                              │ new_value (JSON)    │
                              │ changed_by          │
                              │ changed_at          │
                              │ ip_address          │
                              └─────────────────────┘
```

### 3.2 테이블 상세

#### 3.2.1 tenant (테넌트)
```sql
CREATE TABLE tenant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES tenant(id),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('GROUP', 'SUBSIDIARY')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')),
    license_type VARCHAR(50) NOT NULL DEFAULT 'STANDARD',
    max_users INTEGER NOT NULL DEFAULT 100,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    business_number VARCHAR(20),
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#1976D2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- 인덱스
CREATE INDEX idx_tenant_parent ON tenant(parent_id);
CREATE INDEX idx_tenant_code ON tenant(code);
CREATE INDEX idx_tenant_status ON tenant(status);
CREATE INDEX idx_tenant_type ON tenant(type);

-- RLS 정책 (그룹사는 모든 하위 테넌트 접근 가능)
ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant
    USING (
        id = current_setting('app.current_tenant')::UUID
        OR parent_id = current_setting('app.current_tenant')::UUID
        OR id IN (
            SELECT id FROM tenant 
            WHERE parent_id = current_setting('app.current_tenant')::UUID
        )
    );
```

#### 3.2.2 tenant_policy (테넌트 정책)
```sql
CREATE TABLE tenant_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    policy_type VARCHAR(50) NOT NULL,
    policy_config JSONB NOT NULL DEFAULT '{}',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT uk_tenant_policy UNIQUE (tenant_id, policy_type, effective_from)
);

-- 정책 유형 예시
COMMENT ON COLUMN tenant_policy.policy_type IS '
    LEAVE: 휴가 정책
    ATTENDANCE: 근태 정책
    APPROVAL: 결재 정책
    EVALUATION: 평가 정책
    SECURITY: 보안 정책
';

-- 인덱스
CREATE INDEX idx_tenant_policy_tenant ON tenant_policy(tenant_id);
CREATE INDEX idx_tenant_policy_type ON tenant_policy(policy_type);
CREATE INDEX idx_tenant_policy_active ON tenant_policy(is_active) WHERE is_active = true;

-- RLS 정책
ALTER TABLE tenant_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_policy_isolation ON tenant_policy
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### 3.2.3 tenant_feature (기능 활성화)
```sql
CREATE TABLE tenant_feature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    feature_code VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_tenant_feature UNIQUE (tenant_id, feature_code)
);

-- 기능 코드 예시
COMMENT ON COLUMN tenant_feature.feature_code IS '
    PARALLEL_APPROVAL: 병렬 승인
    CONSENSUS: 합의
    DIRECT_APPROVAL: 전결
    PROXY_APPROVAL: 대결
    AUTO_APPROVAL_LINE: 자동 결재선
    CONDITIONAL_BRANCH: 조건 분기
    OKR: OKR 성과관리
    KPI: KPI 성과관리
';

-- RLS 정책
ALTER TABLE tenant_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_feature_isolation ON tenant_feature
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### 3.3 정책 설정 JSON 스키마

#### 3.3.1 휴가 정책 (LEAVE)
```json
{
  "annual_leave": {
    "base_days": 15,
    "additional_days_per_year": 1,
    "max_annual_days": 25,
    "carryover_allowed": true,
    "carryover_max_days": 10,
    "carryover_expire_months": 3
  },
  "leave_types": [
    {
      "code": "ANNUAL",
      "name": "연차",
      "paid": true,
      "requires_approval": true,
      "min_days": 0.5,
      "max_consecutive_days": 30
    },
    {
      "code": "SICK",
      "name": "병가",
      "paid": true,
      "requires_approval": true,
      "requires_document": true,
      "document_required_days": 3
    }
  ],
  "approval_rules": {
    "days_threshold": [
      { "max_days": 3, "approval_levels": 1 },
      { "max_days": 7, "approval_levels": 2 },
      { "max_days": 999, "approval_levels": 3 }
    ]
  }
}
```

#### 3.3.2 결재 정책 (APPROVAL)
```json
{
  "features": {
    "parallel_approval": true,
    "consensus": true,
    "direct_approval": true,
    "proxy_approval": true,
    "auto_approval_line": true,
    "conditional_branch": true
  },
  "auto_approval_line": {
    "enabled": true,
    "base_on": "ORGANIZATION",
    "max_levels": 3
  },
  "escalation": {
    "enabled": true,
    "reminder_after_hours": 24,
    "escalate_after_hours": 72,
    "auto_reject_after_hours": 168
  },
  "proxy_rules": {
    "max_duration_days": 30,
    "requires_approval": true,
    "allowed_scope": ["LEAVE", "EXPENSE", "DOCUMENT"]
  }
}
```

#### 3.3.3 근태 정책 (ATTENDANCE)
```json
{
  "work_hours": {
    "standard_hours_per_day": 8,
    "standard_hours_per_week": 40,
    "max_hours_per_week": 52,
    "flex_time_enabled": true
  },
  "core_time": {
    "enabled": true,
    "start": "10:00",
    "end": "16:00"
  },
  "overtime": {
    "requires_approval": true,
    "max_hours_per_month": 52,
    "auto_calculate": true
  },
  "late_policy": {
    "grace_period_minutes": 10,
    "penalty_enabled": false
  }
}
```

---

## 4. API 명세

### 4.1 테넌트 관리 API

#### 4.1.1 테넌트 목록 조회
```
GET /api/v1/tenants
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| type | String | N | GROUP, SUBSIDIARY |
| status | String | N | ACTIVE, INACTIVE, SUSPENDED |
| parentId | UUID | N | 상위 테넌트 ID |
| page | Integer | N | 페이지 번호 (default: 0) |
| size | Integer | N | 페이지 크기 (default: 20) |

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "code": "CORP001",
        "name": "본사",
        "type": "GROUP",
        "status": "ACTIVE",
        "licenseType": "ENTERPRISE",
        "maxUsers": 10000,
        "currentUsers": 5432,
        "subsidiaryCount": 15,
        "contactEmail": "admin@corp.com",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "totalElements": 16,
    "totalPages": 1,
    "number": 0
  }
}
```

#### 4.1.2 테넌트 생성
```
POST /api/v1/tenants
```

**Request Body:**
```json
{
  "parentId": "550e8400-e29b-41d4-a716-446655440000",
  "code": "SUB001",
  "name": "계열사 A",
  "type": "SUBSIDIARY",
  "licenseType": "STANDARD",
  "maxUsers": 500,
  "contactEmail": "admin@sub-a.com",
  "contactPhone": "02-1234-5678",
  "address": "서울시 강남구",
  "businessNumber": "123-45-67890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "code": "SUB001",
    "name": "계열사 A",
    "type": "SUBSIDIARY",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "테넌트가 성공적으로 생성되었습니다."
}
```

#### 4.1.3 테넌트 상세 조회
```
GET /api/v1/tenants/{tenantId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "parentId": "550e8400-e29b-41d4-a716-446655440000",
    "parentName": "본사",
    "code": "SUB001",
    "name": "계열사 A",
    "type": "SUBSIDIARY",
    "status": "ACTIVE",
    "licenseType": "STANDARD",
    "maxUsers": 500,
    "currentUsers": 234,
    "contactEmail": "admin@sub-a.com",
    "contactPhone": "02-1234-5678",
    "address": "서울시 강남구",
    "businessNumber": "123-45-67890",
    "logoUrl": "https://s3.../logo.png",
    "primaryColor": "#1976D2",
    "hierarchy": [
      { "levelName": "본부", "levelOrder": 1, "isRequired": true },
      { "levelName": "부서", "levelOrder": 2, "isRequired": true },
      { "levelName": "팀", "levelOrder": 3, "isRequired": false }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:00:00Z"
  }
}
```

#### 4.1.4 테넌트 수정
```
PUT /api/v1/tenants/{tenantId}
```

**Request Body:**
```json
{
  "name": "계열사 A (신규명)",
  "maxUsers": 700,
  "contactEmail": "new-admin@sub-a.com",
  "primaryColor": "#2196F3"
}
```

#### 4.1.5 테넌트 상태 변경
```
PATCH /api/v1/tenants/{tenantId}/status
```

**Request Body:**
```json
{
  "status": "SUSPENDED",
  "reason": "라이선스 만료"
}
```

### 4.2 정책 관리 API

#### 4.2.1 정책 목록 조회
```
GET /api/v1/tenants/{tenantId}/policies
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| type | String | N | LEAVE, ATTENDANCE, APPROVAL, EVALUATION, SECURITY |
| activeOnly | Boolean | N | 활성 정책만 조회 (default: true) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "tenantId": "660e8400-e29b-41d4-a716-446655440001",
      "policyType": "LEAVE",
      "policyConfig": { ... },
      "effectiveFrom": "2024-01-01",
      "effectiveTo": null,
      "isActive": true
    }
  ]
}
```

#### 4.2.2 정책 생성/수정
```
PUT /api/v1/tenants/{tenantId}/policies/{policyType}
```

**Request Body:**
```json
{
  "effectiveFrom": "2024-02-01",
  "policyConfig": {
    "annual_leave": {
      "base_days": 15,
      "additional_days_per_year": 1
    }
  }
}
```

#### 4.2.3 정책 상세 조회
```
GET /api/v1/tenants/{tenantId}/policies/{policyType}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| effectiveDate | Date | N | 특정 시점 정책 조회 (default: 오늘) |

### 4.3 기능 관리 API

#### 4.3.1 기능 목록 조회
```
GET /api/v1/tenants/{tenantId}/features
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "featureCode": "PARALLEL_APPROVAL",
      "featureName": "병렬 승인",
      "category": "APPROVAL",
      "isEnabled": true,
      "config": {}
    },
    {
      "featureCode": "OKR",
      "featureName": "OKR 성과관리",
      "category": "PERFORMANCE",
      "isEnabled": false,
      "config": {}
    }
  ]
}
```

#### 4.3.2 기능 활성화/비활성화
```
PATCH /api/v1/tenants/{tenantId}/features/{featureCode}
```

**Request Body:**
```json
{
  "isEnabled": true,
  "config": {
    "maxParallelApprovers": 5
  }
}
```

### 4.4 계층 구조 관리 API

#### 4.4.1 조직 계층 구조 설정
```
PUT /api/v1/tenants/{tenantId}/hierarchy
```

**Request Body:**
```json
{
  "levels": [
    { "levelName": "사업부", "levelOrder": 1, "isRequired": true },
    { "levelName": "본부", "levelOrder": 2, "isRequired": true },
    { "levelName": "부서", "levelOrder": 3, "isRequired": true },
    { "levelName": "팀", "levelOrder": 4, "isRequired": false },
    { "levelName": "파트", "levelOrder": 5, "isRequired": false }
  ]
}
```

---

## 5. 비즈니스 로직

### 5.1 테넌트 생성 프로세스

```java
@Service
@RequiredArgsConstructor
@Transactional
public class TenantService {
    
    private final TenantRepository tenantRepository;
    private final TenantPolicyRepository policyRepository;
    private final TenantFeatureRepository featureRepository;
    private final TenantEventPublisher eventPublisher;
    
    public TenantDto createTenant(TenantCreateRequest request) {
        // 1. 코드 중복 검사
        if (tenantRepository.existsByCode(request.getCode())) {
            throw new DuplicateException("이미 존재하는 테넌트 코드입니다.");
        }
        
        // 2. 상위 테넌트 검증
        if (request.getParentId() != null) {
            Tenant parent = tenantRepository.findById(request.getParentId())
                .orElseThrow(() -> new NotFoundException("상위 테넌트를 찾을 수 없습니다."));
            
            if (parent.getType() != TenantType.GROUP) {
                throw new BusinessException("계열사는 그룹사 하위에만 생성할 수 있습니다.");
            }
        }
        
        // 3. 테넌트 생성
        Tenant tenant = Tenant.builder()
            .parentId(request.getParentId())
            .code(request.getCode())
            .name(request.getName())
            .type(request.getParentId() != null ? TenantType.SUBSIDIARY : TenantType.GROUP)
            .status(TenantStatus.PENDING)
            .licenseType(request.getLicenseType())
            .maxUsers(request.getMaxUsers())
            .build();
        
        tenant = tenantRepository.save(tenant);
        
        // 4. 기본 정책 생성
        createDefaultPolicies(tenant);
        
        // 5. 기본 기능 설정
        createDefaultFeatures(tenant);
        
        // 6. 이벤트 발행 (조직 서비스에서 기본 조직 생성)
        eventPublisher.publish(new TenantCreatedEvent(
            tenant.getId(),
            tenant.getCode(),
            tenant.getName()
        ));
        
        return TenantDto.from(tenant);
    }
    
    private void createDefaultPolicies(Tenant tenant) {
        // 기본 휴가 정책
        TenantPolicy leavePolicy = TenantPolicy.builder()
            .tenantId(tenant.getId())
            .policyType("LEAVE")
            .policyConfig(DefaultPolicies.getDefaultLeavePolicy())
            .effectiveFrom(LocalDate.now())
            .isActive(true)
            .build();
        policyRepository.save(leavePolicy);
        
        // 기본 결재 정책
        TenantPolicy approvalPolicy = TenantPolicy.builder()
            .tenantId(tenant.getId())
            .policyType("APPROVAL")
            .policyConfig(DefaultPolicies.getDefaultApprovalPolicy())
            .effectiveFrom(LocalDate.now())
            .isActive(true)
            .build();
        policyRepository.save(approvalPolicy);
        
        // 기본 근태 정책
        TenantPolicy attendancePolicy = TenantPolicy.builder()
            .tenantId(tenant.getId())
            .policyType("ATTENDANCE")
            .policyConfig(DefaultPolicies.getDefaultAttendancePolicy())
            .effectiveFrom(LocalDate.now())
            .isActive(true)
            .build();
        policyRepository.save(attendancePolicy);
    }
    
    private void createDefaultFeatures(Tenant tenant) {
        // 기본 기능 활성화
        List<String> defaultEnabledFeatures = List.of(
            "PARALLEL_APPROVAL", "PROXY_APPROVAL", "AUTO_APPROVAL_LINE"
        );
        
        for (FeatureDefinition feature : FeatureDefinition.values()) {
            TenantFeature tenantFeature = TenantFeature.builder()
                .tenantId(tenant.getId())
                .featureCode(feature.getCode())
                .isEnabled(defaultEnabledFeatures.contains(feature.getCode()))
                .config(Map.of())
                .build();
            featureRepository.save(tenantFeature);
        }
    }
}
```

### 5.2 정책 조회 (캐시 적용)

```java
@Service
@RequiredArgsConstructor
public class TenantPolicyService {
    
    private final TenantPolicyRepository policyRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final String POLICY_CACHE_PREFIX = "tenant:policy:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    
    @Cacheable(value = "tenantPolicy", key = "#tenantId + ':' + #policyType")
    public PolicyConfig getPolicy(UUID tenantId, String policyType) {
        return getPolicy(tenantId, policyType, LocalDate.now());
    }
    
    public PolicyConfig getPolicy(UUID tenantId, String policyType, LocalDate effectiveDate) {
        String cacheKey = POLICY_CACHE_PREFIX + tenantId + ":" + policyType + ":" + effectiveDate;
        
        // 캐시 조회
        PolicyConfig cached = (PolicyConfig) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }
        
        // DB 조회
        TenantPolicy policy = policyRepository
            .findEffectivePolicy(tenantId, policyType, effectiveDate)
            .orElseThrow(() -> new NotFoundException("정책을 찾을 수 없습니다."));
        
        PolicyConfig config = PolicyConfig.from(policy.getPolicyConfig());
        
        // 캐시 저장
        redisTemplate.opsForValue().set(cacheKey, config, CACHE_TTL);
        
        return config;
    }
    
    @CacheEvict(value = "tenantPolicy", allEntries = true)
    @Transactional
    public void updatePolicy(UUID tenantId, String policyType, PolicyUpdateRequest request) {
        // 기존 활성 정책 비활성화
        policyRepository.deactivatePolicy(tenantId, policyType);
        
        // 새 정책 생성
        TenantPolicy newPolicy = TenantPolicy.builder()
            .tenantId(tenantId)
            .policyType(policyType)
            .policyConfig(request.getPolicyConfig())
            .effectiveFrom(request.getEffectiveFrom())
            .isActive(true)
            .build();
        
        policyRepository.save(newPolicy);
        
        // 캐시 무효화
        String cachePattern = POLICY_CACHE_PREFIX + tenantId + ":" + policyType + ":*";
        Set<String> keys = redisTemplate.keys(cachePattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
```

### 5.3 기능 활성화 확인

```java
@Service
@RequiredArgsConstructor
public class TenantFeatureService {
    
    private final TenantFeatureRepository featureRepository;
    
    @Cacheable(value = "tenantFeature", key = "#tenantId + ':' + #featureCode")
    public boolean isFeatureEnabled(UUID tenantId, String featureCode) {
        return featureRepository.findByTenantIdAndFeatureCode(tenantId, featureCode)
            .map(TenantFeature::getIsEnabled)
            .orElse(false);
    }
    
    public FeatureConfig getFeatureConfig(UUID tenantId, String featureCode) {
        TenantFeature feature = featureRepository
            .findByTenantIdAndFeatureCode(tenantId, featureCode)
            .orElseThrow(() -> new NotFoundException("기능 설정을 찾을 수 없습니다."));
        
        if (!feature.getIsEnabled()) {
            throw new BusinessException("해당 기능이 활성화되어 있지 않습니다.");
        }
        
        return FeatureConfig.from(feature.getConfig());
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

#### 6.1.1 TenantCreatedEvent
```java
@Getter
@Builder
public class TenantCreatedEvent {
    private UUID tenantId;
    private String tenantCode;
    private String tenantName;
    private TenantType type;
    private UUID parentId;
    private LocalDateTime createdAt;
}
```

**Kafka Topic:** `hr-saas.tenant.created`

**소비자:**
- Organization Service: 기본 조직 구조 생성
- Auth Service: 테넌트 관리자 역할 생성
- Notification Service: 테넌트 생성 완료 알림

#### 6.1.2 TenantStatusChangedEvent
```java
@Getter
@Builder
public class TenantStatusChangedEvent {
    private UUID tenantId;
    private TenantStatus previousStatus;
    private TenantStatus newStatus;
    private String reason;
    private UUID changedBy;
    private LocalDateTime changedAt;
}
```

**Kafka Topic:** `hr-saas.tenant.status-changed`

#### 6.1.3 TenantPolicyChangedEvent
```java
@Getter
@Builder
public class TenantPolicyChangedEvent {
    private UUID tenantId;
    private String policyType;
    private JsonNode previousConfig;
    private JsonNode newConfig;
    private LocalDate effectiveFrom;
    private UUID changedBy;
    private LocalDateTime changedAt;
}
```

**Kafka Topic:** `hr-saas.tenant.policy-changed`

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| UserCountChangedEvent | hr-saas.employee.count-changed | 테넌트별 현재 사용자 수 업데이트 |

---

## 7. 보안

### 7.1 권한 매트릭스

| API | 그룹 HR 총괄 | 계열사 HR 관리자 | 부서 HR 담당자 |
|-----|-------------|-----------------|---------------|
| 테넌트 목록 조회 | ✅ 전체 | ✅ 소속 계열사만 | ❌ |
| 테넌트 생성 | ✅ | ❌ | ❌ |
| 테넌트 수정 | ✅ 전체 | ✅ 소속 계열사만 | ❌ |
| 정책 조회 | ✅ 전체 | ✅ 소속 계열사만 | ✅ 소속 계열사만 |
| 정책 수정 | ✅ 전체 | ✅ 소속 계열사만 | ❌ |
| 기능 관리 | ✅ 전체 | ✅ 소속 계열사만 | ❌ |

### 7.2 데이터 접근 제어

```java
@Aspect
@Component
@RequiredArgsConstructor
public class TenantAccessAspect {
    
    private final SecurityContext securityContext;
    
    @Before("@annotation(TenantAccess)")
    public void checkTenantAccess(JoinPoint joinPoint) {
        UUID currentUserTenantId = securityContext.getCurrentTenantId();
        UserRole role = securityContext.getCurrentUserRole();
        
        // 파라미터에서 tenantId 추출
        UUID targetTenantId = extractTenantId(joinPoint);
        
        if (targetTenantId == null) {
            return;
        }
        
        // 그룹 HR 총괄은 모든 테넌트 접근 가능
        if (role == UserRole.GROUP_HR_ADMIN) {
            return;
        }
        
        // 같은 테넌트만 접근 가능
        if (!currentUserTenantId.equals(targetTenantId)) {
            throw new AccessDeniedException("해당 테넌트에 접근 권한이 없습니다.");
        }
    }
}
```

---

## 8. 성능 최적화

### 8.1 캐싱 전략

| 데이터 | 캐시 TTL | 무효화 조건 |
|--------|---------|------------|
| 테넌트 기본 정보 | 1시간 | 테넌트 수정 시 |
| 테넌트 정책 | 30분 | 정책 변경 시 |
| 테넌트 기능 목록 | 1시간 | 기능 활성화/비활성화 시 |

### 8.2 쿼리 최적화

```java
// 테넌트 목록 조회 시 서브쿼리 대신 JOIN 사용
@Query("""
    SELECT new com.hrsaas.tenant.dto.TenantListDto(
        t.id, t.code, t.name, t.type, t.status,
        t.licenseType, t.maxUsers,
        COALESCE(e.userCount, 0),
        COALESCE(s.subsidiaryCount, 0)
    )
    FROM Tenant t
    LEFT JOIN (
        SELECT e.tenantId as tenantId, COUNT(e) as userCount
        FROM Employee e
        WHERE e.status = 'ACTIVE'
        GROUP BY e.tenantId
    ) e ON t.id = e.tenantId
    LEFT JOIN (
        SELECT t2.parentId as parentId, COUNT(t2) as subsidiaryCount
        FROM Tenant t2
        WHERE t2.parentId IS NOT NULL
        GROUP BY t2.parentId
    ) s ON t.id = s.parentId
    WHERE (:type IS NULL OR t.type = :type)
    AND (:status IS NULL OR t.status = :status)
    """)
Page<TenantListDto> findAllWithCounts(
    @Param("type") TenantType type,
    @Param("status") TenantStatus status,
    Pageable pageable
);
```

---

## 9. 모니터링

### 9.1 메트릭

```yaml
# Prometheus 메트릭
- name: tenant_total
  type: gauge
  labels: [type, status]
  description: 테넌트 총 수

- name: tenant_user_count
  type: gauge
  labels: [tenant_id, tenant_code]
  description: 테넌트별 사용자 수

- name: tenant_policy_cache_hit_ratio
  type: gauge
  description: 정책 캐시 히트율

- name: tenant_api_request_duration_seconds
  type: histogram
  labels: [method, endpoint, status]
  description: API 응답 시간
```

### 9.2 알림 규칙

```yaml
# Grafana Alert Rules
- alert: TenantUserLimitWarning
  expr: tenant_user_count / tenant_max_users > 0.9
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "테넌트 사용자 수가 한도의 90%에 도달했습니다."

- alert: TenantSuspended
  expr: changes(tenant_status_change{new_status="SUSPENDED"}[1h]) > 0
  labels:
    severity: critical
  annotations:
    summary: "테넌트가 일시 중지되었습니다."
```

---

## 10. 테스트

### 10.1 단위 테스트

```java
@ExtendWith(MockitoExtension.class)
class TenantServiceTest {
    
    @Mock
    private TenantRepository tenantRepository;
    
    @Mock
    private TenantEventPublisher eventPublisher;
    
    @InjectMocks
    private TenantService tenantService;
    
    @Test
    @DisplayName("테넌트 생성 - 성공")
    void createTenant_Success() {
        // given
        TenantCreateRequest request = TenantCreateRequest.builder()
            .code("SUB001")
            .name("계열사 A")
            .licenseType("STANDARD")
            .maxUsers(500)
            .build();
        
        when(tenantRepository.existsByCode("SUB001")).thenReturn(false);
        when(tenantRepository.save(any())).thenAnswer(inv -> {
            Tenant tenant = inv.getArgument(0);
            ReflectionTestUtils.setField(tenant, "id", UUID.randomUUID());
            return tenant;
        });
        
        // when
        TenantDto result = tenantService.createTenant(request);
        
        // then
        assertThat(result.getCode()).isEqualTo("SUB001");
        assertThat(result.getName()).isEqualTo("계열사 A");
        assertThat(result.getStatus()).isEqualTo(TenantStatus.PENDING);
        
        verify(eventPublisher).publish(any(TenantCreatedEvent.class));
    }
    
    @Test
    @DisplayName("테넌트 생성 - 중복 코드 실패")
    void createTenant_DuplicateCode_Fail() {
        // given
        TenantCreateRequest request = TenantCreateRequest.builder()
            .code("EXISTING")
            .name("테스트")
            .build();
        
        when(tenantRepository.existsByCode("EXISTING")).thenReturn(true);
        
        // when & then
        assertThrows(DuplicateException.class, () -> 
            tenantService.createTenant(request)
        );
    }
}
```

### 10.2 통합 테스트

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TenantControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Test
    @WithMockUser(roles = "GROUP_HR_ADMIN")
    @DisplayName("테넌트 목록 조회 API 테스트")
    void getTenants_Success() throws Exception {
        // given
        Tenant tenant = createTestTenant("TEST001", "테스트 테넌트");
        tenantRepository.save(tenant);
        
        // when & then
        mockMvc.perform(get("/api/v1/tenants")
                .param("status", "ACTIVE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.content[0].code").value("TEST001"));
    }
}
```

---

## 11. 배포 설정

### 11.1 Kubernetes 매니페스트

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tenant-service
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tenant-service
  template:
    metadata:
      labels:
        app: tenant-service
    spec:
      containers:
        - name: tenant-service
          image: hr-saas/tenant-service:latest
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "prod"
            - name: SPRING_DATASOURCE_URL
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: jdbc-url
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
  name: tenant-service
  namespace: hr-saas
spec:
  selector:
    app: tenant-service
  ports:
    - port: 8080
      targetPort: 8080
  type: ClusterIP
```

### 11.2 Application 설정

```yaml
# application-prod.yml
spring:
  application:
    name: tenant-service
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
  
  redis:
    host: ${REDIS_HOST}
    port: 6379
    
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS}
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  tracing:
    sampling:
      probability: 1.0

# OpenTelemetry 설정
otel:
  exporter:
    otlp:
      endpoint: ${OTEL_EXPORTER_ENDPOINT}
  service:
    name: tenant-service
```

---

## 12. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |