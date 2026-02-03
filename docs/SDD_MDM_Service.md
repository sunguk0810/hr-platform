# SDD: MDM Service (기준정보 서비스)

## 1. 서비스 개요

### 1.1 목적
MDM(Master Data Management) Service는 HR SaaS 플랫폼에서 사용되는 모든 기준정보(공통코드, 분류체계 등)를 통합 관리하는 서비스입니다.

### 1.2 책임 범위
- 공통코드 관리 (휴가유형, 직급, 직책, 학력 등)
- 다단계 분류 체계 관리 (대분류 → 중분류 → 소분류)
- 코드 변경 이력 관리
- 테넌트간 공통코드 동기화
- 코드 중복 검사 및 유사코드 검색
- 코드 삭제/변경 시 영향도 분석

### 1.3 Phase
**Phase 1 (MVP)**

---

## 2. 아키텍처

### 2.1 서비스 구조
```
┌─────────────────────────────────────────────────────────────┐
│                       MDM Service                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Common Code │  │ Category    │  │    Code Search      │ │
│  │ Management  │  │ Management  │  │      Engine         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Impact    │  │    Sync     │  │      History        │ │
│  │  Analyzer   │  │   Handler   │  │      Manager        │ │
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
| Tenant Service | REST (OpenFeign) | 테넌트 정보 조회 |
| Employee Service | Kafka Event | 코드 변경 시 영향 데이터 조회 |
| Attendance Service | Kafka Event | 휴가 유형 코드 동기화 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────────┐       ┌─────────────────────────┐
│      code_group         │       │      common_code        │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │──┬───<│ id (PK, UUID)           │
│ tenant_id               │  │    │ code_group_id (FK)      │
│ group_code              │  │    │ code                    │
│ group_name              │  │    │ name                    │
│ description             │  │    │ name_en                 │
│ is_system               │  │    │ description             │
│ is_hierarchical         │  │    │ parent_code_id          │
│ max_level               │  │    │ level                   │
│ status                  │  │    │ sort_order              │
│ created_at              │  │    │ extra_value1            │
│ updated_at              │  │    │ extra_value2            │
└─────────────────────────┘  │    │ extra_value3            │
                             │    │ is_default              │
┌─────────────────────────┐  │    │ status                  │
│  code_tenant_mapping    │  │    │ created_at              │
├─────────────────────────┤  │    │ updated_at              │
│ id (PK, UUID)           │  │    └─────────────────────────┘
│ code_id (FK)            │──┘
│ tenant_id               │       ┌─────────────────────────┐
│ is_enabled              │       │      code_history       │
│ custom_name             │       ├─────────────────────────┤
│ custom_sort_order       │       │ id (PK, UUID)           │
│ created_at              │       │ code_id (FK)            │
└─────────────────────────┘       │ action                  │
                                  │ changed_field           │
┌─────────────────────────┐       │ old_value               │
│     code_relation       │       │ new_value               │
├─────────────────────────┤       │ changed_by              │
│ id (PK, UUID)           │       │ changed_at              │
│ source_code_id (FK)     │       │ reason                  │
│ target_code_id (FK)     │       └─────────────────────────┘
│ relation_type           │
│ created_at              │
└─────────────────────────┘
```

### 3.2 테이블 DDL

#### code_group (코드 그룹)
```sql
CREATE TABLE code_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    group_code VARCHAR(50) NOT NULL,
    group_name VARCHAR(200) NOT NULL,
    group_name_en VARCHAR(200),
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_hierarchical BOOLEAN DEFAULT false,
    max_level INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEPRECATED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    CONSTRAINT uk_code_group UNIQUE (tenant_id, group_code)
);

-- 시스템 코드 그룹 (tenant_id가 NULL)
COMMENT ON COLUMN code_group.tenant_id IS '
    NULL: 시스템 공통 코드 그룹
    UUID: 테넌트별 커스텀 코드 그룹
';

-- 시스템 코드 그룹 예시
-- EMPLOYMENT_TYPE: 고용형태 (정규직, 계약직, 파트타임 등)
-- EMPLOYMENT_STATUS: 재직상태 (재직, 휴직, 퇴직 등)
-- LEAVE_TYPE: 휴가유형 (연차, 병가, 경조 등)
-- GRADE: 직급
-- EDUCATION_TYPE: 학력구분
-- MILITARY_STATUS: 병역상태
-- BANK_CODE: 은행코드
```

#### common_code (공통코드)
```sql
CREATE TABLE common_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_group_id UUID NOT NULL REFERENCES code_group(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    description TEXT,
    parent_code_id UUID REFERENCES common_code(id),
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    extra_value1 VARCHAR(500),
    extra_value2 VARCHAR(500),
    extra_value3 VARCHAR(500),
    extra_json JSONB,
    is_default BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEPRECATED')),
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT uk_common_code UNIQUE (code_group_id, code)
);

-- 인덱스
CREATE INDEX idx_common_code_group ON common_code(code_group_id);
CREATE INDEX idx_common_code_parent ON common_code(parent_code_id);
CREATE INDEX idx_common_code_status ON common_code(status);

-- Full-text search 인덱스
CREATE INDEX idx_common_code_search ON common_code 
    USING GIN (to_tsvector('simple', name || ' ' || COALESCE(name_en, '') || ' ' || code));
```

#### code_tenant_mapping (테넌트별 코드 매핑)
```sql
CREATE TABLE code_tenant_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id UUID NOT NULL REFERENCES common_code(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    custom_name VARCHAR(200),
    custom_name_en VARCHAR(200),
    custom_sort_order INTEGER,
    custom_extra_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_code_tenant UNIQUE (code_id, tenant_id)
);

-- 인덱스
CREATE INDEX idx_code_tenant_mapping ON code_tenant_mapping(tenant_id, is_enabled);
```

#### code_history (코드 변경 이력)
```sql
CREATE TABLE code_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id UUID NOT NULL,
    code_group_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL
        CHECK (action IN ('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'MERGED')),
    changed_field VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    affected_count INTEGER
) PARTITION BY RANGE (changed_at);

-- 파티셔닝
CREATE TABLE code_history_2024 PARTITION OF code_history
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 인덱스
CREATE INDEX idx_code_history_code ON code_history(code_id);
CREATE INDEX idx_code_history_group ON code_history(code_group_id);
```

---

## 4. API 명세

### 4.1 코드 그룹 API

#### 코드 그룹 목록 조회
```
GET /api/v1/mdm/code-groups
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| isSystem | Boolean | N | 시스템 코드만 조회 |
| status | String | N | 상태 필터 |
| keyword | String | N | 검색어 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "groupCode": "LEAVE_TYPE",
      "groupName": "휴가유형",
      "groupNameEn": "Leave Type",
      "isSystem": true,
      "isHierarchical": false,
      "codeCount": 8,
      "status": "ACTIVE"
    },
    {
      "id": "uuid",
      "groupCode": "GRADE",
      "groupName": "직급",
      "isSystem": false,
      "isHierarchical": false,
      "codeCount": 10,
      "status": "ACTIVE"
    }
  ]
}
```

#### 코드 그룹 생성
```
POST /api/v1/mdm/code-groups
```
**Request:**
```json
{
  "groupCode": "SKILL_LEVEL",
  "groupName": "스킬 레벨",
  "groupNameEn": "Skill Level",
  "description": "직원 스킬 레벨 코드",
  "isHierarchical": false
}
```

### 4.2 공통코드 API

#### 코드 목록 조회
```
GET /api/v1/mdm/codes
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| groupCode | String | Y | 코드 그룹 코드 |
| parentCode | String | N | 상위 코드 (계층형) |
| status | String | N | 상태 |
| includeDisabled | Boolean | N | 비활성 포함 여부 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "ANNUAL",
      "name": "연차",
      "nameEn": "Annual Leave",
      "level": 1,
      "sortOrder": 1,
      "isDefault": true,
      "extraValue1": "true",
      "extraJson": {
        "isPaid": true,
        "deductFromAnnual": false
      },
      "status": "ACTIVE",
      "children": []
    },
    {
      "id": "uuid",
      "code": "SICK",
      "name": "병가",
      "nameEn": "Sick Leave",
      "level": 1,
      "sortOrder": 2,
      "isDefault": false,
      "extraJson": {
        "isPaid": true,
        "requiresDocument": true
      },
      "status": "ACTIVE"
    }
  ]
}
```

#### 코드 트리 조회 (계층형)
```
GET /api/v1/mdm/codes/tree
```
**Query Parameters:** groupCode

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "TECH",
      "name": "기술직군",
      "level": 1,
      "children": [
        {
          "id": "uuid",
          "code": "TECH_DEV",
          "name": "개발",
          "level": 2,
          "children": [
            {
              "id": "uuid",
              "code": "TECH_DEV_BE",
              "name": "백엔드",
              "level": 3,
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

#### 코드 생성
```
POST /api/v1/mdm/codes
```
**Request:**
```json
{
  "groupCode": "LEAVE_TYPE",
  "code": "REFRESH",
  "name": "리프레시 휴가",
  "nameEn": "Refresh Leave",
  "sortOrder": 10,
  "extraJson": {
    "isPaid": true,
    "maxDays": 5
  }
}
```

#### 코드 수정
```
PUT /api/v1/mdm/codes/{codeId}
```
**Request:**
```json
{
  "name": "리프레시 휴가 (수정)",
  "sortOrder": 11,
  "reason": "명칭 변경"
}
```

#### 코드 상태 변경
```
PATCH /api/v1/mdm/codes/{codeId}/status
```
**Request:**
```json
{
  "status": "INACTIVE",
  "reason": "더 이상 사용하지 않음",
  "migrateTo": "NEW_CODE_ID"
}
```

#### 코드 일괄 변경 (마이그레이션)
```
POST /api/v1/mdm/codes/migrate
```
**Request:**
```json
{
  "sourceCodeId": "uuid",
  "targetCodeId": "uuid",
  "affectedTables": ["employee", "leave_request"],
  "reason": "코드 통합"
}
```

### 4.3 테넌트별 코드 관리 API

#### 테넌트 코드 설정 조회
```
GET /api/v1/mdm/tenant-codes
```
**Query Parameters:** groupCode

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "codeId": "uuid",
      "code": "ANNUAL",
      "originalName": "연차",
      "customName": "연차휴가",
      "isEnabled": true,
      "customSortOrder": 1
    }
  ]
}
```

#### 테넌트 코드 설정 수정
```
PUT /api/v1/mdm/tenant-codes/{codeId}
```
**Request:**
```json
{
  "isEnabled": true,
  "customName": "연차휴가 (사용)",
  "customSortOrder": 1
}
```

### 4.4 코드 검색 API

#### 유사 코드 검색
```
GET /api/v1/mdm/codes/search
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| keyword | String | Y | 검색어 |
| groupCode | String | N | 그룹 필터 |
| threshold | Double | N | 유사도 임계값 (0.0~1.0) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "ANNUAL",
      "name": "연차",
      "groupCode": "LEAVE_TYPE",
      "similarity": 0.95,
      "matchType": "NAME"
    }
  ]
}
```

#### 중복 코드 검사
```
POST /api/v1/mdm/codes/check-duplicate
```
**Request:**
```json
{
  "groupCode": "LEAVE_TYPE",
  "code": "ANNUA",
  "name": "연차휴가"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "hasDuplicate": true,
    "duplicateType": "SIMILAR_NAME",
    "similarCodes": [
      {
        "id": "uuid",
        "code": "ANNUAL",
        "name": "연차",
        "similarity": 0.85
      }
    ]
  }
}
```

### 4.5 영향도 분석 API

#### 코드 변경 영향도 분석
```
GET /api/v1/mdm/codes/{codeId}/impact
```
**Response:**
```json
{
  "success": true,
  "data": {
    "codeId": "uuid",
    "code": "ANNUAL",
    "name": "연차",
    "affectedEntities": [
      {
        "entityType": "LEAVE_REQUEST",
        "tableName": "leave_request",
        "columnName": "leave_type_id",
        "affectedCount": 1523,
        "sampleData": [
          {"id": "uuid", "identifier": "LEAVE-2024-001"}
        ]
      },
      {
        "entityType": "LEAVE_BALANCE",
        "tableName": "leave_balance",
        "columnName": "leave_type_id",
        "affectedCount": 500
      }
    ],
    "totalAffectedRecords": 2023,
    "canDelete": false,
    "deleteBlockReason": "사용 중인 데이터가 존재합니다."
  }
}
```

### 4.6 코드 이력 API

#### 코드 변경 이력 조회
```
GET /api/v1/mdm/codes/{codeId}/history
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "UPDATED",
      "changedField": "name",
      "oldValue": "연차",
      "newValue": "연차휴가",
      "changedBy": {
        "id": "uuid",
        "name": "관리자"
      },
      "changedAt": "2024-01-15T10:30:00Z",
      "reason": "명칭 통일"
    }
  ]
}
```

---

## 5. 비즈니스 로직

### 5.1 코드 생성/수정

```java
@Service
@RequiredArgsConstructor
@Transactional
public class CommonCodeService {
    
    private final CommonCodeRepository codeRepository;
    private final CodeGroupRepository groupRepository;
    private final CodeHistoryRepository historyRepository;
    private final CodeSearchService searchService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public CommonCodeDto createCode(CodeCreateRequest request) {
        // 1. 코드 그룹 조회
        CodeGroup group = groupRepository
            .findByGroupCode(request.getGroupCode())
            .orElseThrow(() -> new NotFoundException("코드 그룹을 찾을 수 없습니다."));
        
        // 2. 코드 중복 검사
        if (codeRepository.existsByGroupIdAndCode(group.getId(), request.getCode())) {
            throw new DuplicateException("이미 존재하는 코드입니다.");
        }
        
        // 3. 유사 코드 검사 (경고)
        List<SimilarCode> similarCodes = searchService.findSimilarCodes(
            group.getId(), request.getCode(), request.getName(), 0.8
        );
        
        if (!similarCodes.isEmpty() && !request.isIgnoreSimilarWarning()) {
            throw new SimilarCodeException("유사한 코드가 존재합니다.", similarCodes);
        }
        
        // 4. 계층형 코드인 경우 레벨 계산
        int level = 1;
        if (group.getIsHierarchical() && request.getParentCodeId() != null) {
            CommonCode parent = codeRepository.findById(request.getParentCodeId())
                .orElseThrow(() -> new NotFoundException("상위 코드를 찾을 수 없습니다."));
            level = parent.getLevel() + 1;
            
            if (level > group.getMaxLevel()) {
                throw new BusinessException("최대 계층 레벨을 초과했습니다.");
            }
        }
        
        // 5. 코드 생성
        CommonCode code = CommonCode.builder()
            .codeGroupId(group.getId())
            .code(request.getCode())
            .name(request.getName())
            .nameEn(request.getNameEn())
            .description(request.getDescription())
            .parentCodeId(request.getParentCodeId())
            .level(level)
            .sortOrder(request.getSortOrder())
            .extraValue1(request.getExtraValue1())
            .extraValue2(request.getExtraValue2())
            .extraJson(request.getExtraJson())
            .isDefault(request.getIsDefault())
            .status(CodeStatus.ACTIVE)
            .build();
        
        code = codeRepository.save(code);
        
        // 6. 이력 저장
        saveHistory(code, CodeAction.CREATED, null, null, null);
        
        // 7. 이벤트 발행
        kafkaTemplate.send("hr-saas.mdm.code-created",
            CodeCreatedEvent.of(code, group.getGroupCode()));
        
        return CommonCodeDto.from(code);
    }
    
    public CommonCodeDto updateCode(UUID codeId, CodeUpdateRequest request) {
        CommonCode code = codeRepository.findById(codeId)
            .orElseThrow(() -> new NotFoundException("코드를 찾을 수 없습니다."));
        
        // 시스템 코드 수정 제한
        CodeGroup group = groupRepository.findById(code.getCodeGroupId()).orElseThrow();
        if (group.getIsSystem() && !SecurityContextHolder.hasSystemAdminRole()) {
            throw new ForbiddenException("시스템 코드는 수정할 수 없습니다.");
        }
        
        // 변경 사항 추적
        Map<String, String[]> changes = new HashMap<>();
        
        if (request.getName() != null && !request.getName().equals(code.getName())) {
            changes.put("name", new String[]{code.getName(), request.getName()});
            code.setName(request.getName());
        }
        
        if (request.getSortOrder() != null && !request.getSortOrder().equals(code.getSortOrder())) {
            changes.put("sortOrder", new String[]{
                String.valueOf(code.getSortOrder()), 
                String.valueOf(request.getSortOrder())
            });
            code.setSortOrder(request.getSortOrder());
        }
        
        // ... 기타 필드 변경
        
        code = codeRepository.save(code);
        
        // 변경 이력 저장
        for (Map.Entry<String, String[]> change : changes.entrySet()) {
            saveHistory(code, CodeAction.UPDATED, 
                change.getKey(), change.getValue()[0], change.getValue()[1]);
        }
        
        // 이벤트 발행
        kafkaTemplate.send("hr-saas.mdm.code-updated",
            CodeUpdatedEvent.of(code, group.getGroupCode(), changes));
        
        return CommonCodeDto.from(code);
    }
}
```

### 5.2 코드 검색 (유사도)

```java
@Service
@RequiredArgsConstructor
public class CodeSearchService {
    
    private final CommonCodeRepository codeRepository;
    
    /**
     * 유사 코드 검색 (Levenshtein Distance 기반)
     */
    public List<SimilarCode> findSimilarCodes(UUID groupId, String code, 
                                               String name, double threshold) {
        List<CommonCode> allCodes = codeRepository.findByCodeGroupId(groupId);
        List<SimilarCode> results = new ArrayList<>();
        
        for (CommonCode existingCode : allCodes) {
            // 코드 유사도
            double codeSimilarity = calculateSimilarity(code, existingCode.getCode());
            if (codeSimilarity >= threshold) {
                results.add(new SimilarCode(existingCode, codeSimilarity, "CODE"));
                continue;
            }
            
            // 이름 유사도
            double nameSimilarity = calculateSimilarity(name, existingCode.getName());
            if (nameSimilarity >= threshold) {
                results.add(new SimilarCode(existingCode, nameSimilarity, "NAME"));
            }
        }
        
        return results.stream()
            .sorted(Comparator.comparingDouble(SimilarCode::getSimilarity).reversed())
            .collect(Collectors.toList());
    }
    
    /**
     * Full-text 검색
     */
    public List<CommonCode> searchCodes(String keyword, String groupCode) {
        if (groupCode != null) {
            return codeRepository.searchByKeywordAndGroup(keyword, groupCode);
        }
        return codeRepository.searchByKeyword(keyword);
    }
    
    private double calculateSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        
        int maxLength = Math.max(s1.length(), s2.length());
        if (maxLength == 0) return 1.0;
        
        int distance = levenshteinDistance(s1, s2);
        return 1.0 - ((double) distance / maxLength);
    }
    
    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        
        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;
        
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i-1) == s2.charAt(j-1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(
                    dp[i-1][j] + 1,
                    dp[i][j-1] + 1),
                    dp[i-1][j-1] + cost
                );
            }
        }
        
        return dp[s1.length()][s2.length()];
    }
}
```

### 5.3 영향도 분석

```java
@Service
@RequiredArgsConstructor
public class CodeImpactAnalyzer {
    
    private final JdbcTemplate jdbcTemplate;
    
    // 코드가 사용되는 테이블 매핑
    private static final Map<String, List<CodeUsageMapping>> CODE_USAGE_MAP = Map.of(
        "LEAVE_TYPE", List.of(
            new CodeUsageMapping("leave_request", "leave_type_id", "LEAVE_REQUEST"),
            new CodeUsageMapping("leave_balance", "leave_type_id", "LEAVE_BALANCE"),
            new CodeUsageMapping("leave_type", "id", "LEAVE_TYPE_CONFIG")
        ),
        "EMPLOYMENT_TYPE", List.of(
            new CodeUsageMapping("employee", "employment_type", "EMPLOYEE")
        ),
        "GRADE", List.of(
            new CodeUsageMapping("employee", "grade_id", "EMPLOYEE"),
            new CodeUsageMapping("position", "min_grade_id", "POSITION"),
            new CodeUsageMapping("position", "max_grade_id", "POSITION")
        )
    );
    
    public CodeImpactResult analyzeImpact(UUID codeId, String groupCode) {
        List<CodeUsageMapping> usages = CODE_USAGE_MAP.get(groupCode);
        
        if (usages == null || usages.isEmpty()) {
            return CodeImpactResult.noImpact();
        }
        
        List<AffectedEntity> affectedEntities = new ArrayList<>();
        int totalAffected = 0;
        
        for (CodeUsageMapping usage : usages) {
            String countQuery = String.format(
                "SELECT COUNT(*) FROM %s WHERE %s = ?",
                usage.getTableName(), usage.getColumnName()
            );
            
            int count = jdbcTemplate.queryForObject(countQuery, Integer.class, codeId);
            
            if (count > 0) {
                affectedEntities.add(AffectedEntity.builder()
                    .entityType(usage.getEntityType())
                    .tableName(usage.getTableName())
                    .columnName(usage.getColumnName())
                    .affectedCount(count)
                    .build());
                
                totalAffected += count;
            }
        }
        
        return CodeImpactResult.builder()
            .codeId(codeId)
            .affectedEntities(affectedEntities)
            .totalAffectedRecords(totalAffected)
            .canDelete(totalAffected == 0)
            .deleteBlockReason(totalAffected > 0 ? "사용 중인 데이터가 존재합니다." : null)
            .build();
    }
    
    /**
     * 코드 마이그레이션 (일괄 변경)
     */
    @Transactional
    public MigrationResult migrateCode(UUID sourceCodeId, UUID targetCodeId, 
                                       String groupCode, String reason) {
        CodeImpactResult impact = analyzeImpact(sourceCodeId, groupCode);
        
        List<CodeUsageMapping> usages = CODE_USAGE_MAP.get(groupCode);
        int totalMigrated = 0;
        
        for (CodeUsageMapping usage : usages) {
            String updateQuery = String.format(
                "UPDATE %s SET %s = ?, updated_at = CURRENT_TIMESTAMP WHERE %s = ?",
                usage.getTableName(), usage.getColumnName(), usage.getColumnName()
            );
            
            int updated = jdbcTemplate.update(updateQuery, targetCodeId, sourceCodeId);
            totalMigrated += updated;
        }
        
        // 원본 코드 비활성화
        // ...
        
        return MigrationResult.builder()
            .sourceCodeId(sourceCodeId)
            .targetCodeId(targetCodeId)
            .totalMigrated(totalMigrated)
            .build();
    }
}
```

### 5.4 테넌트 동기화

```java
@Service
@RequiredArgsConstructor
public class CodeSyncService {
    
    private final CommonCodeRepository codeRepository;
    private final CodeTenantMappingRepository mappingRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    /**
     * 시스템 코드 추가 시 전체 테넌트에 동기화
     */
    @KafkaListener(topics = "hr-saas.mdm.code-created")
    @Transactional
    public void syncNewCodeToTenants(CodeCreatedEvent event) {
        if (!event.isSystemCode()) {
            return;
        }
        
        List<UUID> tenantIds = tenantServiceClient.getAllActiveTenantIds();
        
        for (UUID tenantId : tenantIds) {
            // 이미 매핑이 있는지 확인
            if (mappingRepository.existsByCodeIdAndTenantId(event.getCodeId(), tenantId)) {
                continue;
            }
            
            // 기본 매핑 생성 (활성화 상태)
            CodeTenantMapping mapping = CodeTenantMapping.builder()
                .codeId(event.getCodeId())
                .tenantId(tenantId)
                .isEnabled(true)
                .build();
            
            mappingRepository.save(mapping);
        }
    }
    
    /**
     * 신규 테넌트 생성 시 시스템 코드 동기화
     */
    @KafkaListener(topics = "hr-saas.tenant.created")
    @Transactional
    public void syncSystemCodesToNewTenant(TenantCreatedEvent event) {
        List<CommonCode> systemCodes = codeRepository.findAllSystemCodes();
        
        for (CommonCode code : systemCodes) {
            CodeTenantMapping mapping = CodeTenantMapping.builder()
                .codeId(code.getId())
                .tenantId(event.getTenantId())
                .isEnabled(true)
                .build();
            
            mappingRepository.save(mapping);
        }
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| CodeCreatedEvent | hr-saas.mdm.code-created | 코드 생성 |
| CodeUpdatedEvent | hr-saas.mdm.code-updated | 코드 수정 |
| CodeDeletedEvent | hr-saas.mdm.code-deleted | 코드 삭제 |
| CodeMigratedEvent | hr-saas.mdm.code-migrated | 코드 마이그레이션 |

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| TenantCreatedEvent | hr-saas.tenant.created | 신규 테넌트에 시스템 코드 동기화 |

---

## 7. 보안

### 7.1 권한 매트릭스

| API | 시스템 관리자 | 테넌트 관리자 | 일반 사용자 |
|-----|--------------|--------------|------------|
| 시스템 코드 조회 | ✅ | ✅ | ✅ |
| 시스템 코드 관리 | ✅ | ❌ | ❌ |
| 테넌트 코드 조회 | ✅ | ✅ | ✅ |
| 테넌트 코드 관리 | ✅ | ✅ | ❌ |
| 영향도 분석 | ✅ | ✅ | ❌ |
| 코드 마이그레이션 | ✅ | ❌ | ❌ |

---

## 8. 성능 최적화

### 8.1 캐싱 전략

| 데이터 | 캐시 TTL | 무효화 조건 |
|--------|---------|------------|
| 코드 그룹 목록 | 1시간 | 그룹 생성/수정 시 |
| 코드 목록 (그룹별) | 30분 | 코드 생성/수정/삭제 시 |
| 테넌트 코드 매핑 | 1시간 | 매핑 변경 시 |

### 8.2 Redis 캐시 구현

```java
@Service
@RequiredArgsConstructor
public class CodeCacheService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String CODE_CACHE_PREFIX = "mdm:codes:";
    
    @Cacheable(value = "codes", key = "#groupCode + ':' + #tenantId")
    public List<CommonCodeDto> getCodes(String groupCode, UUID tenantId) {
        // DB 조회 로직
    }
    
    @CacheEvict(value = "codes", allEntries = true)
    public void evictCodeCache() {
        // 캐시 무효화
    }
}
```

---

## 9. 모니터링

### 9.1 메트릭

```yaml
# Prometheus 메트릭
- name: mdm_code_total
  type: gauge
  labels: [group_code, status]
  description: 코드 총 수

- name: mdm_code_usage_count
  type: gauge
  labels: [code_id, entity_type]
  description: 코드 사용 건수

- name: mdm_cache_hit_ratio
  type: gauge
  description: 캐시 히트율
```

---

## 10. 배포 설정

### 10.1 Kubernetes 매니페스트

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mdm-service
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mdm-service
  template:
    metadata:
      labels:
        app: mdm-service
    spec:
      containers:
        - name: mdm-service
          image: hr-saas/mdm-service:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: mdm-service
  namespace: hr-saas
spec:
  selector:
    app: mdm-service
  ports:
    - port: 8080
  type: ClusterIP
```

---

## 11. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |