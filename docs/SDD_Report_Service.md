# SDD: Report Service (리포트 서비스)

## 1. 서비스 개요

### 1.1 목적
Report Service는 HR 데이터를 기반으로 각종 통계, 분석, 리포트를 생성하고 관리하는 서비스입니다. 정형 리포트와 사용자 정의 리포트를 모두 지원합니다.

### 1.2 책임 범위
- 정형 리포트 생성 (인원현황, 근태현황, 휴가현황 등)
- 사용자 정의 리포트 빌더
- 대시보드 데이터 제공
- 리포트 스케줄링 (정기 발송)
- 데이터 내보내기 (Excel, PDF, CSV)
- 리포트 권한 관리
- 리포트 캐싱

### 1.3 Phase
**Phase 3**

---

## 2. 아키텍처

### 2.1 서비스 구조
```
┌─────────────────────────────────────────────────────────────┐
│                      Report Service                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Report    │  │   Query     │  │     Dashboard       │ │
│  │  Generator  │  │   Builder   │  │      Provider       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Export    │  │  Scheduler  │  │       Cache         │ │
│  │   Handler   │  │   Manager   │  │      Manager        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┬───────────────┐
              ▼               ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐    ┌──────────┐    ┌──────────┐
        │PostgreSQL│   │  Redis   │    │  Kafka   │    │ AWS S3   │
        │(Read Rep)│   │ (Cache)  │    │ (Events) │    │ (Export) │
        └──────────┘   └──────────┘    └──────────┘    └──────────┘
```

### 2.2 의존 서비스
| 서비스 | 통신 방식 | 용도 |
|--------|----------|------|
| Employee Service | REST (OpenFeign) | 인원 데이터 조회 |
| Attendance Service | REST (OpenFeign) | 근태/휴가 데이터 조회 |
| Organization Service | REST (OpenFeign) | 조직 구조 데이터 |
| Notification Service | Kafka Event | 리포트 발송 |
| File Service | REST (OpenFeign) | 리포트 파일 저장 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────────┐       ┌─────────────────────────┐
│   report_definition     │       │    report_schedule      │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │──────<│ id (PK, UUID)           │
│ tenant_id               │       │ report_definition_id(FK)│
│ code                    │       │ schedule_name           │
│ name                    │       │ cron_expression         │
│ description             │       │ parameters              │
│ category                │       │ export_format           │
│ report_type             │       │ recipients              │
│ query_config            │       │ is_active               │
│ parameters              │       │ last_run_at             │
│ chart_config            │       │ next_run_at             │
│ access_level            │       │ created_at              │
│ is_system               │       └─────────────────────────┘
│ is_favorite             │
│ created_by              │       ┌─────────────────────────┐
│ created_at              │       │    report_execution     │
└─────────────────────────┘       ├─────────────────────────┤
                                  │ id (PK, UUID)           │
┌─────────────────────────┐       │ report_definition_id(FK)│
│   report_template       │       │ schedule_id             │
├─────────────────────────┤       │ parameters              │
│ id (PK, UUID)           │       │ status                  │
│ tenant_id               │       │ started_at              │
│ name                    │       │ completed_at            │
│ description             │       │ row_count               │
│ base_query              │       │ file_id                 │
│ available_columns       │       │ error_message           │
│ available_filters       │       │ executed_by             │
│ default_sort            │       │ created_at              │
│ created_at              │       └─────────────────────────┘
└─────────────────────────┘
                                  ┌─────────────────────────┐
┌─────────────────────────┐       │    dashboard_widget     │
│  user_report_config     │       ├─────────────────────────┤
├─────────────────────────┤       │ id (PK, UUID)           │
│ id (PK, UUID)           │       │ tenant_id               │
│ user_id                 │       │ dashboard_id            │
│ report_definition_id(FK)│       │ widget_type             │
│ custom_columns          │       │ title                   │
│ custom_filters          │       │ data_source             │
│ custom_sort             │       │ query_config            │
│ created_at              │       │ chart_config            │
│ updated_at              │       │ position                │
└─────────────────────────┘       │ size                    │
                                  │ refresh_interval        │
                                  │ created_at              │
                                  └─────────────────────────┘
```

### 3.2 테이블 DDL

#### report_definition (리포트 정의)
```sql
CREATE TABLE report_definition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    description TEXT,
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('HR', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 
                           'RECRUITMENT', 'ORGANIZATION', 'CUSTOM')),
    report_type VARCHAR(20) NOT NULL DEFAULT 'TABLE'
        CHECK (report_type IN ('TABLE', 'CHART', 'MIXED', 'KPI')),
    query_config JSONB NOT NULL,
    parameters JSONB DEFAULT '[]',
    chart_config JSONB,
    default_export_format VARCHAR(10) DEFAULT 'XLSX',
    access_level VARCHAR(20) DEFAULT 'TENANT'
        CHECK (access_level IN ('SYSTEM', 'TENANT', 'DEPARTMENT', 'PERSONAL')),
    required_permission VARCHAR(100),
    is_system BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_report_definition UNIQUE (tenant_id, code)
);

-- 시스템 리포트는 tenant_id가 NULL
-- 쿼리 설정 예시
-- {
--   "dataSource": "employee",
--   "columns": [
--     {"field": "employeeNumber", "label": "사번", "type": "string"},
--     {"field": "name", "label": "성명", "type": "string"},
--     {"field": "departmentName", "label": "부서", "type": "string"}
--   ],
--   "joins": [
--     {"table": "department", "on": "employee.department_id = department.id"}
--   ],
--   "filters": [],
--   "groupBy": [],
--   "orderBy": [{"field": "employeeNumber", "direction": "ASC"}]
-- }
```

#### report_template (리포트 템플릿)
```sql
CREATE TABLE report_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    base_query TEXT NOT NULL,
    available_columns JSONB NOT NULL,
    available_filters JSONB DEFAULT '[]',
    available_group_by JSONB DEFAULT '[]',
    default_columns TEXT[],
    default_sort JSONB,
    supports_chart BOOLEAN DEFAULT false,
    chart_types TEXT[],
    is_system BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 사용 가능한 컬럼 예시
-- [
--   {"field": "employee_number", "label": "사번", "type": "string", "filterable": true, "sortable": true},
--   {"field": "name", "label": "성명", "type": "string", "filterable": true, "sortable": true},
--   {"field": "hire_date", "label": "입사일", "type": "date", "filterable": true, "sortable": true},
--   {"field": "department_name", "label": "부서", "type": "string", "filterable": true, "groupable": true}
-- ]
```

#### report_schedule (리포트 스케줄)
```sql
CREATE TABLE report_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_definition_id UUID NOT NULL REFERENCES report_definition(id),
    schedule_name VARCHAR(200) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL,
    parameters JSONB DEFAULT '{}',
    export_format VARCHAR(10) NOT NULL DEFAULT 'XLSX',
    recipients JSONB NOT NULL,
    cc_recipients JSONB DEFAULT '[]',
    email_subject VARCHAR(500),
    email_body TEXT,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(20),
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- recipients 예시
-- {
--   "type": "USERS",
--   "userIds": ["uuid1", "uuid2"]
-- }
-- 또는
-- {
--   "type": "ROLES",
--   "roles": ["HR_ADMIN", "DEPT_HEAD"]
-- }
```

#### report_execution (리포트 실행 이력)
```sql
CREATE TABLE report_execution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    report_definition_id UUID NOT NULL,
    schedule_id UUID,
    parameters JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING'
        CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    row_count INTEGER,
    file_id UUID,
    file_format VARCHAR(10),
    file_size BIGINT,
    error_message TEXT,
    executed_by UUID,
    execution_type VARCHAR(20) DEFAULT 'MANUAL'
        CHECK (execution_type IN ('MANUAL', 'SCHEDULED', 'API')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

-- 파티셔닝
CREATE TABLE report_execution_2024_01 PARTITION OF report_execution
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 인덱스
CREATE INDEX idx_report_execution_def ON report_execution(report_definition_id);
CREATE INDEX idx_report_execution_status ON report_execution(status);
```

#### dashboard_widget (대시보드 위젯)
```sql
CREATE TABLE dashboard_widget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    dashboard_id UUID NOT NULL,
    widget_type VARCHAR(30) NOT NULL
        CHECK (widget_type IN ('KPI', 'LINE_CHART', 'BAR_CHART', 'PIE_CHART',
                               'TABLE', 'GAUGE', 'MAP', 'CALENDAR')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    data_source VARCHAR(100) NOT NULL,
    query_config JSONB NOT NULL,
    chart_config JSONB,
    position_x INTEGER NOT NULL DEFAULT 0,
    position_y INTEGER NOT NULL DEFAULT 0,
    width INTEGER NOT NULL DEFAULT 4,
    height INTEGER NOT NULL DEFAULT 3,
    refresh_interval INTEGER DEFAULT 300,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API 명세

### 4.1 리포트 목록 API

#### 리포트 카테고리별 목록 조회
```
GET /api/v1/reports
```
**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| category | String | N | 카테고리 필터 |
| search | String | N | 검색어 |
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
        "code": "HR_HEADCOUNT",
        "name": "인원현황 리포트",
        "description": "부서별/직급별 인원 현황",
        "category": "HR",
        "reportType": "MIXED",
        "isSystem": true,
        "isFavorite": false
      }
    ],
    "categories": [
      {"code": "HR", "name": "인사", "count": 10},
      {"code": "ATTENDANCE", "name": "근태", "count": 8}
    ]
  }
}
```

#### 리포트 상세 조회
```
GET /api/v1/reports/{reportId}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "HR_HEADCOUNT",
    "name": "인원현황 리포트",
    "description": "부서별/직급별 인원 현황",
    "parameters": [
      {
        "name": "baseDate",
        "label": "기준일",
        "type": "date",
        "required": true,
        "defaultValue": "TODAY"
      },
      {
        "name": "departmentId",
        "label": "부서",
        "type": "select",
        "required": false,
        "dataSource": "departments"
      }
    ],
    "columns": [
      {"field": "departmentName", "label": "부서", "width": 150},
      {"field": "totalCount", "label": "총원", "width": 80, "align": "right"}
    ],
    "chartConfig": {
      "type": "BAR",
      "xAxis": "departmentName",
      "yAxis": "totalCount"
    }
  }
}
```

### 4.2 리포트 실행 API

#### 리포트 실행 (미리보기)
```
POST /api/v1/reports/{reportId}/execute
```
**Request:**
```json
{
  "parameters": {
    "baseDate": "2024-01-15",
    "departmentId": null
  },
  "page": 0,
  "size": 50
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "columns": [
      {"field": "departmentName", "label": "부서"},
      {"field": "totalCount", "label": "총원"},
      {"field": "fullTimeCount", "label": "정규직"},
      {"field": "contractCount", "label": "계약직"}
    ],
    "rows": [
      {
        "departmentName": "개발본부",
        "totalCount": 50,
        "fullTimeCount": 45,
        "contractCount": 5
      }
    ],
    "summary": {
      "totalCount": 500,
      "fullTimeCount": 450,
      "contractCount": 50
    },
    "chartData": {
      "labels": ["개발본부", "영업본부", "경영지원본부"],
      "datasets": [
        {"label": "총원", "data": [50, 30, 20]}
      ]
    },
    "totalRows": 10,
    "page": 0,
    "size": 50
  }
}
```

#### 리포트 내보내기
```
POST /api/v1/reports/{reportId}/export
```
**Request:**
```json
{
  "parameters": {
    "baseDate": "2024-01-15"
  },
  "format": "XLSX",
  "includeChart": true
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "status": "PROCESSING",
    "estimatedTime": 30
  }
}
```

#### 내보내기 상태 조회
```
GET /api/v1/reports/executions/{executionId}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "uuid",
    "status": "COMPLETED",
    "downloadUrl": "https://...",
    "fileSize": 102400,
    "rowCount": 500,
    "completedAt": "2024-01-15T10:35:00Z"
  }
}
```

### 4.3 대시보드 API

#### 대시보드 데이터 조회
```
GET /api/v1/reports/dashboard
```
**Response:**
```json
{
  "success": true,
  "data": {
    "widgets": [
      {
        "id": "uuid",
        "type": "KPI",
        "title": "총 인원",
        "value": 500,
        "change": 5,
        "changeType": "INCREASE",
        "period": "전월 대비"
      },
      {
        "id": "uuid",
        "type": "PIE_CHART",
        "title": "고용형태별 인원",
        "data": {
          "labels": ["정규직", "계약직", "인턴"],
          "datasets": [{"data": [450, 40, 10]}]
        }
      },
      {
        "id": "uuid",
        "type": "LINE_CHART",
        "title": "월별 입퇴사 현황",
        "data": {
          "labels": ["1월", "2월", "3월"],
          "datasets": [
            {"label": "입사", "data": [10, 15, 8]},
            {"label": "퇴사", "data": [5, 3, 4]}
          ]
        }
      }
    ]
  }
}
```

#### 위젯 데이터 새로고침
```
GET /api/v1/reports/dashboard/widgets/{widgetId}/refresh
```

### 4.4 스케줄 API

#### 스케줄 목록 조회
```
GET /api/v1/reports/schedules
```

#### 스케줄 생성
```
POST /api/v1/reports/schedules
```
**Request:**
```json
{
  "reportDefinitionId": "uuid",
  "scheduleName": "월간 인원현황 리포트",
  "cronExpression": "0 9 1 * *",
  "parameters": {
    "baseDate": "LAST_DAY_OF_PREV_MONTH"
  },
  "exportFormat": "XLSX",
  "recipients": {
    "type": "USERS",
    "userIds": ["uuid1", "uuid2"]
  },
  "emailSubject": "[HR] {{year}}년 {{month}}월 인원현황 리포트",
  "emailBody": "안녕하세요.\n\n{{year}}년 {{month}}월 인원현황 리포트를 첨부합니다."
}
```

#### 스케줄 수정
```
PUT /api/v1/reports/schedules/{scheduleId}
```

#### 스케줄 활성화/비활성화
```
PATCH /api/v1/reports/schedules/{scheduleId}/status
```

#### 스케줄 즉시 실행
```
POST /api/v1/reports/schedules/{scheduleId}/run
```

### 4.5 사용자 정의 리포트 API

#### 사용 가능한 데이터 소스 목록
```
GET /api/v1/reports/builder/datasources
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "employee",
      "name": "사원",
      "columns": [
        {"field": "employee_number", "label": "사번", "type": "string"},
        {"field": "name", "label": "성명", "type": "string"},
        {"field": "hire_date", "label": "입사일", "type": "date"}
      ],
      "relations": [
        {"code": "department", "name": "부서", "joinField": "department_id"}
      ]
    }
  ]
}
```

#### 리포트 정의 생성
```
POST /api/v1/reports/definitions
```
**Request:**
```json
{
  "name": "부서별 근속연수 분석",
  "description": "부서별 평균 근속연수 분석 리포트",
  "category": "HR",
  "reportType": "MIXED",
  "queryConfig": {
    "dataSource": "employee",
    "columns": [
      {"field": "departmentName", "label": "부서"},
      {"field": "avgTenure", "label": "평균 근속연수", "aggregate": "AVG"}
    ],
    "groupBy": ["departmentName"]
  },
  "chartConfig": {
    "type": "BAR",
    "xAxis": "departmentName",
    "yAxis": "avgTenure"
  }
}
```

---

## 5. 비즈니스 로직

### 5.1 리포트 실행 엔진

```java
@Service
@RequiredArgsConstructor
public class ReportExecutionService {
    
    private final ReportDefinitionRepository definitionRepository;
    private final ReportExecutionRepository executionRepository;
    private final QueryBuilderService queryBuilderService;
    private final ExportService exportService;
    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final String CACHE_PREFIX = "report:result:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);
    
    public ReportExecutionResult execute(UUID reportId, ReportExecuteRequest request) {
        UUID tenantId = SecurityContextHolder.getCurrentTenantId();
        
        // 1. 리포트 정의 조회
        ReportDefinition definition = definitionRepository.findById(reportId)
            .orElseThrow(() -> new NotFoundException("리포트를 찾을 수 없습니다."));
        
        // 2. 권한 검증
        validateAccess(definition);
        
        // 3. 캐시 확인
        String cacheKey = buildCacheKey(reportId, request.getParameters());
        ReportExecutionResult cachedResult = getCachedResult(cacheKey);
        if (cachedResult != null && !request.isForceRefresh()) {
            return cachedResult;
        }
        
        // 4. 실행 기록 생성
        ReportExecution execution = ReportExecution.builder()
            .tenantId(tenantId)
            .reportDefinitionId(reportId)
            .parameters(request.getParameters())
            .status(ExecutionStatus.RUNNING)
            .startedAt(LocalDateTime.now())
            .executedBy(SecurityContextHolder.getCurrentUserId())
            .executionType(ExecutionType.MANUAL)
            .build();
        
        execution = executionRepository.save(execution);
        
        try {
            // 5. 쿼리 빌드 및 실행
            QueryConfig queryConfig = definition.getQueryConfig();
            String sql = queryBuilderService.buildQuery(queryConfig, request.getParameters());
            
            List<Map<String, Object>> rows = executeQuery(sql, request.getPage(), request.getSize());
            int totalRows = countQuery(sql);
            
            // 6. 집계 데이터 계산
            Map<String, Object> summary = calculateSummary(queryConfig, rows);
            
            // 7. 차트 데이터 생성
            ChartData chartData = null;
            if (definition.getChartConfig() != null) {
                chartData = buildChartData(definition.getChartConfig(), rows);
            }
            
            // 8. 결과 구성
            ReportExecutionResult result = ReportExecutionResult.builder()
                .executionId(execution.getId())
                .columns(definition.getQueryConfig().getColumns())
                .rows(rows)
                .summary(summary)
                .chartData(chartData)
                .totalRows(totalRows)
                .page(request.getPage())
                .size(request.getSize())
                .build();
            
            // 9. 실행 완료 처리
            execution.setStatus(ExecutionStatus.COMPLETED);
            execution.setCompletedAt(LocalDateTime.now());
            execution.setRowCount(totalRows);
            executionRepository.save(execution);
            
            // 10. 캐시 저장
            cacheResult(cacheKey, result);
            
            return result;
            
        } catch (Exception e) {
            execution.setStatus(ExecutionStatus.FAILED);
            execution.setErrorMessage(e.getMessage());
            execution.setCompletedAt(LocalDateTime.now());
            executionRepository.save(execution);
            
            throw new ReportExecutionException("리포트 실행에 실패했습니다.", e);
        }
    }
    
    private String buildCacheKey(UUID reportId, Map<String, Object> parameters) {
        String paramHash = DigestUtils.md5Hex(new ObjectMapper().writeValueAsString(parameters));
        return CACHE_PREFIX + reportId + ":" + paramHash;
    }
}
```

### 5.2 쿼리 빌더

```java
@Service
@RequiredArgsConstructor
public class QueryBuilderService {
    
    private final TenantContextHolder tenantContextHolder;
    
    public String buildQuery(QueryConfig config, Map<String, Object> parameters) {
        StringBuilder sql = new StringBuilder();
        
        // SELECT
        sql.append("SELECT ");
        List<String> selectColumns = new ArrayList<>();
        for (ColumnConfig column : config.getColumns()) {
            String columnExpr = buildColumnExpression(column);
            selectColumns.add(columnExpr + " AS " + column.getField());
        }
        sql.append(String.join(", ", selectColumns));
        
        // FROM
        sql.append(" FROM ").append(config.getDataSource());
        
        // JOIN
        if (config.getJoins() != null) {
            for (JoinConfig join : config.getJoins()) {
                sql.append(" LEFT JOIN ").append(join.getTable())
                   .append(" ON ").append(join.getOn());
            }
        }
        
        // WHERE (테넌트 격리 + 사용자 필터)
        List<String> conditions = new ArrayList<>();
        conditions.add("tenant_id = :tenantId");
        
        if (config.getFilters() != null) {
            for (FilterConfig filter : config.getFilters()) {
                String condition = buildFilterCondition(filter, parameters);
                if (condition != null) {
                    conditions.add(condition);
                }
            }
        }
        
        sql.append(" WHERE ").append(String.join(" AND ", conditions));
        
        // GROUP BY
        if (config.getGroupBy() != null && !config.getGroupBy().isEmpty()) {
            sql.append(" GROUP BY ").append(String.join(", ", config.getGroupBy()));
        }
        
        // ORDER BY
        if (config.getOrderBy() != null && !config.getOrderBy().isEmpty()) {
            List<String> orders = new ArrayList<>();
            for (OrderConfig order : config.getOrderBy()) {
                orders.add(order.getField() + " " + order.getDirection());
            }
            sql.append(" ORDER BY ").append(String.join(", ", orders));
        }
        
        return sql.toString();
    }
    
    private String buildColumnExpression(ColumnConfig column) {
        if (column.getAggregate() != null) {
            return column.getAggregate() + "(" + column.getSourceField() + ")";
        }
        return column.getSourceField();
    }
    
    private String buildFilterCondition(FilterConfig filter, Map<String, Object> parameters) {
        Object value = parameters.get(filter.getParameter());
        if (value == null) {
            return null;
        }
        
        return switch (filter.getOperator()) {
            case "EQ" -> filter.getField() + " = :" + filter.getParameter();
            case "NE" -> filter.getField() + " != :" + filter.getParameter();
            case "GT" -> filter.getField() + " > :" + filter.getParameter();
            case "GTE" -> filter.getField() + " >= :" + filter.getParameter();
            case "LT" -> filter.getField() + " < :" + filter.getParameter();
            case "LTE" -> filter.getField() + " <= :" + filter.getParameter();
            case "LIKE" -> filter.getField() + " LIKE :" + filter.getParameter();
            case "IN" -> filter.getField() + " IN (:" + filter.getParameter() + ")";
            case "BETWEEN" -> filter.getField() + " BETWEEN :" + filter.getParameter() + "From AND :" + filter.getParameter() + "To";
            default -> null;
        };
    }
}
```

### 5.3 내보내기 서비스

```java
@Service
@RequiredArgsConstructor
public class ExportService {
    
    private final FileServiceClient fileServiceClient;
    
    @Async
    public void exportAsync(UUID executionId, ReportDefinition definition, 
                           List<Map<String, Object>> rows, ExportRequest request) {
        try {
            byte[] fileBytes = switch (request.getFormat()) {
                case "XLSX" -> exportToExcel(definition, rows, request.isIncludeChart());
                case "CSV" -> exportToCsv(definition, rows);
                case "PDF" -> exportToPdf(definition, rows, request.isIncludeChart());
                default -> throw new IllegalArgumentException("지원하지 않는 형식입니다.");
            };
            
            // 파일 저장
            UUID fileId = fileServiceClient.uploadFile(
                fileBytes,
                definition.getName() + "." + request.getFormat().toLowerCase(),
                getMimeType(request.getFormat()),
                "REPORT"
            );
            
            // 실행 상태 업데이트
            updateExecutionCompleted(executionId, fileId, fileBytes.length, rows.size());
            
        } catch (Exception e) {
            updateExecutionFailed(executionId, e.getMessage());
        }
    }
    
    private byte[] exportToExcel(ReportDefinition definition, 
                                  List<Map<String, Object>> rows,
                                  boolean includeChart) throws Exception {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            
            Sheet sheet = workbook.createSheet(definition.getName());
            
            // 헤더 스타일
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            // 헤더 행
            Row headerRow = sheet.createRow(0);
            List<ColumnConfig> columns = definition.getQueryConfig().getColumns();
            for (int i = 0; i < columns.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns.get(i).getLabel());
                cell.setCellStyle(headerStyle);
            }
            
            // 데이터 행
            int rowNum = 1;
            for (Map<String, Object> row : rows) {
                Row dataRow = sheet.createRow(rowNum++);
                for (int i = 0; i < columns.size(); i++) {
                    Cell cell = dataRow.createCell(i);
                    Object value = row.get(columns.get(i).getField());
                    setCellValue(cell, value);
                }
            }
            
            // 열 너비 자동 조정
            for (int i = 0; i < columns.size(); i++) {
                sheet.autoSizeColumn(i);
            }
            
            // 차트 추가 (필요시)
            if (includeChart && definition.getChartConfig() != null) {
                addChartToSheet(workbook, sheet, definition.getChartConfig(), rows);
            }
            
            workbook.write(baos);
            return baos.toByteArray();
        }
    }
}
```

### 5.4 리포트 스케줄러

```java
@Service
@RequiredArgsConstructor
public class ReportSchedulerService {
    
    private final ReportScheduleRepository scheduleRepository;
    private final ReportExecutionService executionService;
    private final ExportService exportService;
    private final NotificationServiceClient notificationClient;
    
    /**
     * 스케줄된 리포트 실행 (매분 체크)
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void processScheduledReports() {
        LocalDateTime now = LocalDateTime.now();
        
        List<ReportSchedule> dueSchedules = scheduleRepository
            .findDueSchedules(now);
        
        for (ReportSchedule schedule : dueSchedules) {
            try {
                executeScheduledReport(schedule);
            } catch (Exception e) {
                log.error("스케줄 리포트 실행 실패 - scheduleId: {}", schedule.getId(), e);
                schedule.setLastRunStatus("FAILED");
            }
            
            // 다음 실행 시간 계산
            schedule.setLastRunAt(now);
            schedule.setNextRunAt(calculateNextRunTime(schedule.getCronExpression()));
            scheduleRepository.save(schedule);
        }
    }
    
    private void executeScheduledReport(ReportSchedule schedule) {
        // 1. 파라미터 처리 (동적 값 치환)
        Map<String, Object> parameters = resolveParameters(schedule.getParameters());
        
        // 2. 리포트 실행
        ReportExecuteRequest request = ReportExecuteRequest.builder()
            .parameters(parameters)
            .build();
        
        ReportExecutionResult result = executionService.execute(
            schedule.getReportDefinitionId(), request);
        
        // 3. 파일 내보내기
        ExportRequest exportRequest = ExportRequest.builder()
            .format(schedule.getExportFormat())
            .includeChart(true)
            .build();
        
        byte[] fileBytes = exportService.export(
            schedule.getReportDefinition(), result.getRows(), exportRequest);
        
        // 4. 이메일 발송
        List<String> recipientEmails = resolveRecipientEmails(schedule.getRecipients());
        
        String subject = resolveTemplate(schedule.getEmailSubject(), parameters);
        String body = resolveTemplate(schedule.getEmailBody(), parameters);
        
        notificationClient.sendEmailWithAttachment(
            recipientEmails,
            schedule.getCcRecipients(),
            subject,
            body,
            fileBytes,
            schedule.getReportDefinition().getName() + "." + schedule.getExportFormat().toLowerCase()
        );
        
        schedule.setLastRunStatus("SUCCESS");
    }
    
    private Map<String, Object> resolveParameters(Map<String, Object> parameters) {
        Map<String, Object> resolved = new HashMap<>(parameters);
        
        LocalDate today = LocalDate.now();
        
        for (Map.Entry<String, Object> entry : resolved.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof String strValue) {
                resolved.put(entry.getKey(), switch (strValue) {
                    case "TODAY" -> today;
                    case "YESTERDAY" -> today.minusDays(1);
                    case "FIRST_DAY_OF_MONTH" -> today.withDayOfMonth(1);
                    case "LAST_DAY_OF_MONTH" -> today.withDayOfMonth(today.lengthOfMonth());
                    case "FIRST_DAY_OF_PREV_MONTH" -> today.minusMonths(1).withDayOfMonth(1);
                    case "LAST_DAY_OF_PREV_MONTH" -> today.minusMonths(1).withDayOfMonth(
                        today.minusMonths(1).lengthOfMonth());
                    default -> value;
                });
            }
        }
        
        return resolved;
    }
}
```

---

## 6. 정형 리포트 목록

### 6.1 인사 (HR)
| 코드 | 이름 | 설명 |
|------|------|------|
| HR_HEADCOUNT | 인원현황 | 부서별/직급별/고용형태별 인원 현황 |
| HR_TURNOVER | 입퇴사현황 | 월별 입퇴사 현황 및 이직률 |
| HR_TENURE | 근속현황 | 부서별 평균 근속연수 |
| HR_AGE | 연령분포 | 연령대별 인원 분포 |
| HR_GENDER | 성별현황 | 부서별 성별 인원 비율 |

### 6.2 근태 (ATTENDANCE)
| 코드 | 이름 | 설명 |
|------|------|------|
| ATT_DAILY | 일별근태현황 | 일별 출근/지각/결근 현황 |
| ATT_MONTHLY | 월별근태현황 | 월별 근태 집계 |
| ATT_OVERTIME | 초과근무현황 | 부서별/개인별 초과근무 현황 |
| ATT_52HOURS | 52시간모니터링 | 주 52시간 초과 현황 |

### 6.3 휴가 (LEAVE)
| 코드 | 이름 | 설명 |
|------|------|------|
| LV_BALANCE | 휴가잔여현황 | 부서별/개인별 휴가 잔여일 |
| LV_USAGE | 휴가사용현황 | 월별 휴가 사용 현황 |
| LV_EXPIRY | 휴가소멸예정 | 연차 소멸 예정 현황 |

---

## 7. 배포 설정

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: report-service
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: report-service
  template:
    spec:
      containers:
        - name: report-service
          image: hr-saas/report-service:latest
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
```

---

## 8. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |