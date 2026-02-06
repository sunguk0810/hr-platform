# Module 03: MDM Service (Master Data Management)

> 분석일: 2026-02-06
> 포트: 8087
> 패키지: `com.hrsaas.mdm`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 코드 그룹 CRUD | ✅ 완료 | 시스템/테넌트 코드 그룹 생성/조회/삭제 |
| 공통 코드 CRUD | ✅ 완료 | 코드 생성/조회/수정/삭제, 상태 관리 (활성/비활성/폐기) |
| 계층형 코드 | ✅ 완료 | 4레벨(대/중/소/세분류) 계층 구조, 트리 조회 |
| 테넌트 코드 오버레이 | ✅ 완료 | 테넌트별 코드명/설명/정렬 커스터마이징, 숨기기/보이기 |
| 코드 변경 이력 | ✅ 완료 | @Async 비동기 이력 기록, 필드별 변경 추적 |
| 유사 코드 검색 | ✅ 완료 | Levenshtein 거리 기반 유사도 검색, 중복 검사 |
| 영향도 분석 | ✅ 완료 (부분) | 변경/삭제/폐기 영향도 분석 (참조 매핑 하드코딩) |
| 코드 임포트/엑스포트 | ✅ 완료 (부분) | JSON 기반 일괄 임포트/엑스포트, 검증 모드 |
| 메뉴 관리 시스템 | ✅ 완료 | 메뉴 CRUD, 권한 기반 필터링, 계층 구조 |
| 테넌트 메뉴 설정 | ✅ 완료 | 활성화/비활성화, 이름 변경, 순서 변경, 모바일 설정 |
| 사용자 메뉴 조회 | ✅ 완료 | 역할/권한/테넌트 설정 기반 메뉴 필터링 |
| 메뉴 캐싱 | ✅ 완료 | Redis 3계층 캐싱 (tree/tenant/user) |
| 도메인 이벤트 | ✅ 완료 | CodeGroupCreated, CommonCodeCreated, CommonCodeUpdated |
| RLS (Row Level Security) | ✅ 완료 | code_group, common_code, code_tenant_mapping, code_history, tenant_menu_config |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| MDM-G01 | 시스템 코드 권한 분리 | HIGH | 시스템 코드 생성/수정을 SUPER_ADMIN으로 제한 필요 |
| MDM-G02 | 영향도 분석 DB 관리 | HIGH | CODE_USAGE_MAP 하드코딩 → DB 테이블로 이관 |
| MDM-G03 | Excel 임포트/엑스포트 | MEDIUM | Apache POI 기반 Excel 형식 지원 추가 |
| MDM-G04 | 코드 폐기 마이그레이션 | MEDIUM | 대체코드 지정 + 유예기간(90일) 정책 구현 |
| MDM-G05 | 테넌트 커스텀 메뉴 | MEDIUM | TENANT_ADMIN이 자체 메뉴(외부 링크 등) 추가 가능 |
| MDM-G06 | 메뉴 JPA 엔티티 누락 | HIGH | menu_item, menu_permission, tenant_menu_config가 SQL에만 존재, JPA 엔티티 별도 패키지(`domain.entity.menu`)에 있으나 컨트롤러/서비스에서 사용 중 |
| MDM-G07 | 코드 그룹 수정 API | LOW | CodeGroup에 대한 PUT(수정) 엔드포인트 없음 |
| MDM-G08 | 코드 일괄 상태 변경 | LOW | 다중 코드 동시 활성화/비활성화/폐기 |
| MDM-G09 | 코드 유효기간 스케줄러 | MEDIUM | effectiveFrom/effectiveTo 기반 자동 활성/비활성 전환 |
| MDM-G10 | 이력 조회 성능 최적화 | LOW | 무제한 보존에 따른 인덱스/파티셔닝 전략 |
| MDM-G11 | 시드 데이터 확장 | MEDIUM | 직급, 직책, 부서유형 등 HR 기본 코드 시드 |
| MDM-G12 | 코드 그룹 수정 API | LOW | CodeGroupController에 PUT 엔드포인트 추가 |

---

## 2. 정책 결정사항

### 2.1 시스템 코드 관리 권한 ✅ 결정완료

> **결정: SUPER_ADMIN만 시스템 코드 관리 가능**

| 구분 | 시스템 코드 (tenantId=null) | 테넌트 코드 (tenantId=UUID) |
|------|---------------------------|---------------------------|
| 생성 | SUPER_ADMIN | TENANT_ADMIN 이상 |
| 수정 | SUPER_ADMIN | TENANT_ADMIN 이상 |
| 삭제 | SUPER_ADMIN | TENANT_ADMIN 이상 |
| 조회 | 인증된 사용자 | 인증된 사용자 (RLS 적용) |
| 상태 변경 | SUPER_ADMIN | TENANT_ADMIN 이상 |
| 커스터마이징 | N/A | HR_ADMIN 이상 |

**구현 방향:**
- `CommonCodeServiceImpl.create()`에서 `tenantId == null` 시 SUPER_ADMIN 체크 추가
- `CodeGroupController`, `CommonCodeController`에 시스템 코드 여부 분기 로직
- 프론트엔드에서 시스템 코드 그룹은 읽기 전용 UI로 표시 (SUPER_ADMIN 제외)

### 2.2 영향도 분석 관리 방식 ✅ 결정완료

> **결정: DB 테이블로 관리**

```sql
-- 새 테이블: code_usage_mapping
CREATE TABLE code_usage_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_code VARCHAR(50) NOT NULL,
    resource_type VARCHAR(20) NOT NULL,  -- TABLE, SERVICE, API, REPORT
    resource_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    estimated_impact VARCHAR(20) DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (group_code, resource_type, resource_name)
);
```

**구현 방향:**
- `CodeUsageMapping` JPA 엔티티 생성
- `CodeUsageMappingRepository` 생성
- `CodeImpactAnalyzerImpl`에서 하드코딩된 `CODE_USAGE_MAP` 제거 → Repository 조회로 변경
- SUPER_ADMIN이 관리할 수 있는 API 추가

### 2.3 임포트/엑스포트 형식 ✅ 결정완료

> **결정: JSON + Excel 지원**

| 형식 | 임포트 | 엑스포트 | 용도 |
|------|--------|---------|------|
| JSON | ✅ | ✅ | API 연동, 시스템 간 데이터 이관 |
| Excel (.xlsx) | ✅ (추가) | ✅ (추가) | 실무자 편의, 대량 데이터 작업 |

**구현 방향:**
- Apache POI 의존성 추가 (`poi-ooxml`)
- `ExcelCodeImportExportService` 구현
- Excel 템플릿 다운로드 API 추가
- 시트 구조: 시트1=코드그룹, 시트2=공통코드 (계층형 시 들여쓰기 표시)
- 최대 임포트 행 수 제한: 5,000건

### 2.4 코드 변경 이력 보존 ✅ 결정완료

> **결정: 무제한 보존**

**성능 최적화 전략:**
- `code_history` 테이블에 `created_at` 기반 Range Partitioning (연도별)
- 인덱스: `(code_id, created_at)`, `(tenant_id, created_at)`, `(group_code)`
- 조회 시 기본 페이지네이션 적용 (page size: 50)
- 1년 이상 된 이력은 아카이브 테이블로 이동하지 않고 파티션으로 관리

### 2.5 테넌트 메뉴 관리 ✅ 결정완료

> **결정: TENANT_ADMIN이 커스텀 메뉴 추가 허용**

| 작업 | SUPER_ADMIN | TENANT_ADMIN | HR_ADMIN |
|------|-------------|--------------|----------|
| 시스템 메뉴 CRUD | ✅ | ❌ | ❌ |
| 시스템 메뉴 활성화/비활성화 | ✅ | ✅ | ❌ |
| 메뉴 이름/순서 커스터마이징 | ✅ | ✅ | ❌ |
| 커스텀 메뉴 추가/수정/삭제 | ✅ | ✅ (자기 테넌트) | ❌ |

**구현 방향:**
- `MenuItem`에 `isSystem` 플래그 활용 (이미 존재)
- TENANT_ADMIN이 `isSystem=false`인 메뉴를 자기 테넌트 범위 내에서 CRUD 가능
- 커스텀 메뉴는 `tenantId` 컬럼 추가 (menu_item 테이블)
- 외부 링크(`MenuType.EXTERNAL`) 메뉴 주로 활용
- 커스텀 메뉴에는 `feature_code` 설정 불필요

### 2.6 코드 폐기(Deprecation) 정책 ✅ 결정완료

> **결정: 대체코드 지정 + 유예기간(90일)**

**폐기 프로세스:**
1. 폐기 요청 시 **대체 코드(replacement code)** 지정 (선택)
2. 상태를 `DEPRECATED`로 변경
3. 유예기간 시작 (기본 90일, 테넌트 정책으로 조정 가능)
4. 유예기간 중: 기존 데이터 유지, 신규 레코드에서 경고 표시 (soft block)
5. 유예기간 만료 후: 신규 사용 완전 차단 (hard block)
6. 기존 데이터는 영구 유지 (마이그레이션은 수동)

**구현 방향:**
- `CommonCode` 엔티티에 필드 추가:
  - `replacementCodeId UUID` (대체 코드 ID)
  - `deprecatedAt TIMESTAMPTZ` (폐기 시점)
  - `deprecationGracePeriodDays INTEGER DEFAULT 90` (유예기간)
- `CommonCodeService.deprecate(id, replacementCodeId)` 메서드 시그니처 변경
- 스케줄러: 매일 유예기간 만료 코드 체크 → 알림 이벤트 발행
- API 응답에 `deprecated` 플래그 + `replacementCode` 정보 포함

---

## 3. 아키텍처 및 비즈니스 로직 사양

### 3.1 코드 체계

```
┌─────────────────────────────────────────────────┐
│                  Code Group                      │
│  - groupCode: "GRADE" (직급)                     │
│  - isSystem: true/false                          │
│  - isHierarchical: true/false                    │
│  - maxLevel: 1~4                                 │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │           Common Code (Level 1)              │ │
│  │  code: "EXEC", codeName: "임원"              │ │
│  │  ┌───────────────────────────────────────┐   │ │
│  │  │       Common Code (Level 2)           │   │ │
│  │  │  code: "CEO", codeName: "대표이사"     │   │ │
│  │  │  ┌───────────────────────────────┐    │   │ │
│  │  │  │   Common Code (Level 3)       │    │   │ │
│  │  │  │  code: "CEO_01"               │    │   │ │
│  │  │  └───────────────────────────────┘    │   │ │
│  │  └───────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**코드 계층 규칙:**
- 계층형(`isHierarchical=true`) 코드 그룹만 하위 코드 허용
- 최대 4레벨까지 지원 (대분류 → 중분류 → 소분류 → 세분류)
- `maxLevel` 값으로 그룹별 최대 깊이 제한
- `CommonCodeServiceImpl.create()`에서 깊이 검증: 부모의 level + 1 ≤ maxLevel

### 3.2 시스템 코드 vs 테넌트 코드

```
┌──────────────────┐     ┌──────────────────┐
│  System Code     │     │  Tenant Code     │
│  tenantId = NULL │     │  tenantId = UUID │
│  isSystem = true │     │  isSystem = false│
│                  │     │                  │
│  모든 테넌트에   │     │  해당 테넌트     │
│  공통 적용       │     │  전용            │
└────────┬─────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐
│ Code Tenant      │
│ Mapping          │
│ (오버레이)       │
│                  │
│ 커스텀 이름      │
│ 커스텀 설명      │
│ 숨기기/보이기    │
│ 커스텀 정렬순서  │
└──────────────────┘
```

**조회 로직:**
- `findAllForTenant(tenantId)`: 시스템 코드(`tenantId IS NULL`) + 테넌트 코드(`tenantId = UUID`) 합집합
- `findByGroupCodeAndTenant(groupCode, tenantId)`: 해당 그룹의 시스템 + 테넌트 코드
- `TenantCodeResponse`에 `effectiveCodeName` 반환 (커스텀 있으면 커스텀, 없으면 원본)

### 3.3 메뉴 시스템

```
┌─────────────────────────────────────────────────────┐
│                   MenuItem                           │
│  - code: "EMPLOYEES"                                │
│  - menuType: INTERNAL / EXTERNAL / DIVIDER / HEADER │
│  - isSystem: true/false                             │
│  - featureCode: "EMPLOYEE_MGMT"                     │
│  - permissions: [ROLE:HR_MANAGER, PERM:employee:*]  │
│                                                      │
│  ┌─────────────────────────┐                        │
│  │    MenuPermission       │                        │
│  │  type: ROLE/PERMISSION  │                        │
│  │  value: "HR_MANAGER"    │                        │
│  └─────────────────────────┘                        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              TenantMenuConfig                        │
│  - isEnabled: true/false                            │
│  - customName: "직원관리"                            │
│  - customSortOrder: 5                                │
│  - showInMobile: true                                │
│  - mobileSortOrder: 3                                │
└─────────────────────────────────────────────────────┘
```

**메뉴 접근 제어 로직 (`canAccessMenu`):**
1. 메뉴가 `isActive=true` & `showInNav=true` 인지 확인
2. `MenuPermission`이 없으면 → 모든 인증 사용자 접근 가능
3. ROLE 타입만 있으면 → 해당 역할 중 하나 보유 시 접근 가능
4. PERMISSION 타입만 있으면 → 해당 권한 중 하나 보유 시 접근 가능
5. 둘 다 있으면 → 역할 OR 권한 중 하나 충족 시 접근 가능
6. 와일드카드 지원: `*:*`, `resource:*`, 스코프 확장 (`employee:read` ⊇ `employee:read:self`)

**캐싱 전략:**
| 캐시 키 | TTL | 무효화 조건 |
|---------|-----|------------|
| `menu:tree` | 24h | 메뉴 CRUD 시 전체 무효화 |
| `menu:tenant:{tenantId}` | 1h | 테넌트 메뉴 설정 변경 시 |
| `menu:user:{tenantId}:{userId}` | 15m | 테넌트/메뉴 변경 시 전체 무효화 |

### 3.4 코드 검색 (유사도)

**알고리즘:** Levenshtein Distance 기반

```
유사도 = 1.0 - (편집거리 / max(문자열1길이, 문자열2길이))
```

- 정확 일치: `similarity = 1.0`
- 포함 관계(contains): `+0.1` 보너스
- 검색 대상 필드: `code`, `codeName`, `codeNameEn`, `description`
- 가장 높은 유사도의 필드를 `matchedField`로 반환
- 기본 임계값: `0.6` (60%)
- 중복 검사 임계값: `0.85` (85%)

### 3.5 영향도 분석

**점수 산출 방식:**
| 항목 | 점수 | 최대 |
|------|------|------|
| 하위 코드 1개당 | 10점 | 30점 |
| 테넌트 매핑 1개당 | 15점 | 30점 |
| 참조 리소스 1개당 | 10점 | 40점 |
| 삭제 시 추가 | +20점 | - |
| **최대 총점** | | **100점** |

**영향도 레벨:**
| 레벨 | 점수 범위 | 설명 |
|------|----------|------|
| LOW | 0~25 | 안전한 변경 |
| MEDIUM | 26~50 | 모니터링 권장 |
| HIGH | 51~75 | 사전 공지 및 테스트 필요 |
| CRITICAL | 76~100 | 변경 불가 (삭제 시) |

---

## 4. API 엔드포인트 목록

### 4.1 코드 그룹 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/mdm/code-groups` | HR_ADMIN+ | 코드 그룹 생성 |
| GET | `/api/v1/mdm/code-groups/{groupCode}` | 인증 | 코드 그룹 조회 |
| GET | `/api/v1/mdm/code-groups` | 인증 | 코드 그룹 목록 |
| DELETE | `/api/v1/mdm/code-groups/{id}` | TENANT_ADMIN+ | 코드 그룹 삭제 |

### 4.2 공통 코드 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/mdm/common-codes` | HR_ADMIN+ | 코드 생성 |
| GET | `/api/v1/mdm/common-codes/{id}` | 인증 | 코드 상세 조회 |
| GET | `/api/v1/mdm/common-codes/group/{groupCode}` | 인증 | 그룹별 코드 목록 |
| GET | `/api/v1/mdm/common-codes/group/{groupCode}/code/{code}` | 인증 | 특정 코드 조회 |
| GET | `/api/v1/mdm/common-codes/tree?groupCode=` | 인증 | 계층형 트리 조회 |
| PUT | `/api/v1/mdm/common-codes/{id}` | HR_ADMIN+ | 코드 수정 |
| PUT | `/api/v1/mdm/common-codes/{id}/activate` | HR_ADMIN+ | 코드 활성화 |
| PUT | `/api/v1/mdm/common-codes/{id}/deactivate` | HR_ADMIN+ | 코드 비활성화 |
| PUT | `/api/v1/mdm/common-codes/{id}/deprecate` | TENANT_ADMIN+ | 코드 폐기 |
| DELETE | `/api/v1/mdm/common-codes/{id}` | TENANT_ADMIN+ | 코드 삭제 |
| GET | `/api/v1/mdm/common-codes/{id}/history` | 인증 | 변경 이력 조회 |
| GET | `/api/v1/mdm/common-codes/history/group/{groupCode}` | 인증 | 그룹별 이력 |
| GET | `/api/v1/mdm/common-codes/search?keyword=` | 인증 | 유사 코드 검색 |
| POST | `/api/v1/mdm/common-codes/check-duplicate` | 인증 | 중복 검사 |
| GET | `/api/v1/mdm/common-codes/{id}/impact` | HR_ADMIN+ | 변경 영향도 |
| GET | `/api/v1/mdm/common-codes/{id}/impact/delete` | TENANT_ADMIN+ | 삭제 영향도 |
| GET | `/api/v1/mdm/common-codes/{id}/impact/deprecate` | TENANT_ADMIN+ | 폐기 영향도 |

### 4.3 테넌트 코드 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/v1/mdm/tenant-codes/{codeId}` | 인증 | 테넌트 코드 조회 |
| GET | `/api/v1/mdm/tenant-codes?groupCode=` | 인증 | 그룹별 테넌트 코드 |
| PUT | `/api/v1/mdm/tenant-codes/{codeId}` | HR_ADMIN+ | 커스터마이징 수정 |
| POST | `/api/v1/mdm/tenant-codes/{codeId}/hide` | HR_ADMIN+ | 코드 숨기기 |
| POST | `/api/v1/mdm/tenant-codes/{codeId}/show` | HR_ADMIN+ | 코드 보이기 |
| DELETE | `/api/v1/mdm/tenant-codes/{codeId}` | HR_ADMIN+ | 원본으로 복원 |

### 4.4 임포트/엑스포트 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/mdm/import` | TENANT_ADMIN+ | 코드 일괄 임포트 |
| POST | `/api/v1/mdm/import/validate` | TENANT_ADMIN+ | 임포트 검증만 |
| GET | `/api/v1/mdm/export` | HR_ADMIN+ | 전체 코드 엑스포트 |
| GET | `/api/v1/mdm/export/groups?groupCodes=` | HR_ADMIN+ | 특정 그룹 엑스포트 |
| GET | `/api/v1/mdm/export/system` | SUPER_ADMIN | 시스템 코드 엑스포트 |

### 4.5 메뉴 관리 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/v1/admin/menus` | TENANT_ADMIN+ | 전체 메뉴 트리 |
| GET | `/api/v1/admin/menus/flat` | TENANT_ADMIN+ | 전체 메뉴 목록 (평면) |
| GET | `/api/v1/admin/menus/{id}` | TENANT_ADMIN+ | 메뉴 상세 |
| GET | `/api/v1/admin/menus/code/{code}` | TENANT_ADMIN+ | 코드로 메뉴 조회 |
| POST | `/api/v1/admin/menus` | SUPER_ADMIN | 메뉴 생성 |
| PUT | `/api/v1/admin/menus/{id}` | SUPER_ADMIN | 메뉴 수정 |
| DELETE | `/api/v1/admin/menus/{id}` | SUPER_ADMIN | 메뉴 삭제 (소프트) |
| PATCH | `/api/v1/admin/menus/reorder` | SUPER_ADMIN | 메뉴 순서 변경 |

### 4.6 테넌트 메뉴 설정 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/v1/tenants/{tenantId}/menus/config` | TENANT_ADMIN+ | 전체 설정 조회 |
| GET | `/api/v1/tenants/{tenantId}/menus/{menuId}/config` | TENANT_ADMIN+ | 특정 메뉴 설정 |
| PUT | `/api/v1/tenants/{tenantId}/menus/{menuId}/config` | TENANT_ADMIN+ | 메뉴 설정 수정 |
| DELETE | `/api/v1/tenants/{tenantId}/menus/{menuId}/config` | TENANT_ADMIN+ | 설정 초기화 |
| DELETE | `/api/v1/tenants/{tenantId}/menus/config` | TENANT_ADMIN+ | 전체 설정 초기화 |

### 4.7 사용자 메뉴 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/v1/menus/me` | 인증 | 내 메뉴 조회 (사이드바 + 모바일) |

---

## 5. 데이터 모델

### 5.1 엔티티 구조

```
CodeGroup (code_group)
├── id: UUID (PK)
├── tenant_id: UUID (nullable, null=시스템)
├── group_code: VARCHAR(50)
├── group_name: VARCHAR(100)
├── group_name_en: VARCHAR(100)
├── description: TEXT
├── is_system: BOOLEAN (default false)
├── is_hierarchical: BOOLEAN (default false)
├── max_level: INTEGER (default 1)
├── status: VARCHAR(20) (ACTIVE/INACTIVE/DEPRECATED)
├── sort_order: INTEGER (default 0)
├── created_at, updated_at, created_by, updated_by
└── UNIQUE(group_code, tenant_id)

CommonCode (common_code)
├── id: UUID (PK)
├── code_group_id: UUID (FK → code_group)
├── tenant_id: UUID (nullable)
├── parent_code_id: UUID (self FK, nullable)
├── level: INTEGER (default 1)
├── code: VARCHAR(50)
├── code_name: VARCHAR(100)
├── code_name_en: VARCHAR(100)
├── description: TEXT
├── extra_value_1~3: VARCHAR(100)
├── extra_json: TEXT (JSON)
├── is_default_code: BOOLEAN
├── effective_from: DATE
├── effective_to: DATE
├── status: VARCHAR(20)
├── sort_order: INTEGER (default 0)
├── replacement_code_id: UUID (추가 예정, MDM-G04)
├── deprecated_at: TIMESTAMPTZ (추가 예정, MDM-G04)
├── deprecation_grace_period_days: INTEGER (추가 예정, MDM-G04)
├── created_at, updated_at
└── UNIQUE(code_group_id, code, tenant_id)

CodeTenantMapping (code_tenant_mapping)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL)
├── common_code_id: UUID (FK → common_code)
├── custom_code_name: VARCHAR(100)
├── custom_code_name_en: VARCHAR(100)
├── custom_description: TEXT
├── custom_extra_value_1~3: VARCHAR(100)
├── custom_extra_json: TEXT
├── custom_sort_order: INTEGER
├── is_hidden: BOOLEAN (default false)
├── is_active: BOOLEAN (default true)
├── created_at, updated_at
└── UNIQUE(tenant_id, common_code_id)

CodeHistory (code_history)
├── id: UUID (PK)
├── tenant_id: UUID
├── code_id: UUID
├── code_group_id: UUID
├── group_code: VARCHAR(50)
├── code: VARCHAR(50)
├── action: VARCHAR(20) (CodeAction)
├── field_name: VARCHAR(50)
├── old_value: TEXT
├── new_value: TEXT
├── change_reason: TEXT
├── changed_by: VARCHAR(100)
├── changed_by_id: UUID
├── created_at: TIMESTAMPTZ
└── INDEX(code_id, created_at), INDEX(tenant_id, created_at)

MenuItem (menu_item) — RLS 미적용 (시스템 전역)
├── id: UUID (PK)
├── parent_id: UUID (self FK)
├── code: VARCHAR(50) UNIQUE
├── name: VARCHAR(100)
├── name_en: VARCHAR(100)
├── path: VARCHAR(200)
├── icon: VARCHAR(50)
├── menu_type: VARCHAR(20) (INTERNAL/EXTERNAL/DIVIDER/HEADER)
├── external_url: VARCHAR(500)
├── level: INTEGER (default 0)
├── sort_order: INTEGER (default 0)
├── feature_code: VARCHAR(50) — 기능 코드 연동
├── is_system: BOOLEAN (default true)
├── is_active: BOOLEAN (default true)
├── show_in_nav: BOOLEAN (default true)
├── show_in_mobile: BOOLEAN (default false)
├── mobile_sort_order: INTEGER
├── tenant_id: UUID (추가 예정, MDM-G05, null=시스템)
└── created_at, updated_at

MenuPermission (menu_permission) — RLS 미적용
├── id: UUID (PK)
├── menu_item_id: UUID (FK → menu_item)
├── permission_type: VARCHAR(20) (ROLE/PERMISSION)
├── permission_value: VARCHAR(100)
└── UNIQUE(menu_item_id, permission_type, permission_value)

TenantMenuConfig (tenant_menu_config) — RLS 적용
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL)
├── menu_item_id: UUID (FK → menu_item)
├── is_enabled: BOOLEAN (default true)
├── custom_name: VARCHAR(100)
├── custom_sort_order: INTEGER
├── show_in_mobile: BOOLEAN
├── mobile_sort_order: INTEGER
├── created_at, updated_at
└── UNIQUE(tenant_id, menu_item_id)
```

### 5.2 시드 데이터 (메뉴)

현재 SQL 마이그레이션에 포함된 시드 메뉴 (~50개):

| 코드 | 이름 | 레벨 | 권한 |
|------|------|------|------|
| DASHBOARD | 대시보드 | 0 | 전체 |
| MY_INFO | 내 정보 | 0 | 전체 |
| EMPLOYEES | 직원 관리 | 0 | HR_MANAGER+ |
| ├─ EMPLOYEE_LIST | 직원 목록 | 1 | employee:read |
| ├─ EMPLOYEE_REGISTER | 직원 등록 | 1 | employee:write |
| ORGANIZATION | 조직 관리 | 0 | HR_MANAGER+ |
| ├─ DEPT_LIST | 부서 목록 | 1 | organization:read |
| ├─ ORG_CHART | 조직도 | 1 | organization:read |
| ATTENDANCE | 근태 관리 | 0 | HR_MANAGER+ |
| APPROVALS | 결재 | 0 | 전체 |
| RECRUITMENT | 채용 관리 | 0 | HR_MANAGER+ |
| REPORTS | 리포트 | 0 | HR_MANAGER+ |
| SETTINGS | 설정 | 0 | TENANT_ADMIN+ |
| ADMIN | 시스템 관리 | 0 | SUPER_ADMIN |

---

## 6. 설정값 목록

### 6.1 application.yml

```yaml
server:
  port: 8087

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/hrdb
    hikari:
      schema: tenant_common
  flyway:
    schemas: tenant_common
  data:
    redis:
      port: 6381

# JWT (common-security에서 사용)
jwt:
  access-token-expiry: 1800
  refresh-token-expiry: 604800

# AWS SNS/SQS
cloud:
  aws:
    sns/sqs: LocalStack 연동
```

### 6.2 빌드 의존성

```groovy
dependencies {
    // Spring Boot
    implementation 'spring-boot-starter-web'
    implementation 'spring-boot-starter-data-jpa'
    implementation 'spring-boot-starter-validation'
    implementation 'spring-boot-starter-security'
    implementation 'spring-boot-starter-data-redis'

    // Spring Cloud
    implementation 'spring-cloud-starter-openfeign'
    implementation 'spring-cloud-starter-circuitbreaker-resilience4j'

    // Database
    runtimeOnly 'org.postgresql:postgresql'
    implementation 'org.flywaydb:flyway-core'

    // Documentation
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui'

    // 추가 예정 (MDM-G03)
    // implementation 'org.apache.poi:poi-ooxml:5.2.5'

    // Common modules
    implementation project(':common:common-core')
    implementation project(':common:common-entity')
    implementation project(':common:common-response')
    implementation project(':common:common-database')
    implementation project(':common:common-tenant')
    implementation project(':common:common-security')
    implementation project(':common:common-cache')
    implementation project(':common:common-event')
}
```

### 6.3 Redis 캐시 키 전략

| 캐시 이름 | 키 패턴 | TTL | 설명 |
|-----------|---------|-----|------|
| `mdm:commonCode` | `{groupCode}:{tenantId}` | 1h | 공통 코드 조회 |
| `mdm:codeGroup` | `{groupCode}:{tenantId}` | 1h | 코드 그룹 조회 |
| `mdm:tenantCode` | `{codeId}` | 1h | 테넌트 코드 조회 |
| `menu:tree` | (전체) | 24h | 전체 메뉴 트리 |
| `menu:tenant` | `{tenantId}` | 1h | 테넌트 메뉴 설정 |
| `menu:user` | `{tenantId}:{userId}` | 15m | 사용자 메뉴 |

---

## 7. 갭 구현 사양

### MDM-G01: 시스템 코드 권한 분리 (HIGH)

**현재 상태:** `@PreAuthorize("hasAnyRole('HR_ADMIN', 'TENANT_ADMIN', 'SUPER_ADMIN')")`로 모든 코드 생성/수정에 동일 권한

**구현:**
1. `CommonCodeServiceImpl.create()`:
   ```java
   if (codeGroup.isSystem() || codeGroup.getTenantId() == null) {
       SecurityContextHolder.requireRole("SUPER_ADMIN");
   }
   ```
2. `CommonCodeServiceImpl.update()`, `activate()`, `deactivate()`, `deprecate()`, `delete()` 동일 적용
3. `CodeGroupServiceImpl.create()`: 시스템 코드 그룹 생성 시 SUPER_ADMIN 체크
4. 프론트엔드: 시스템 코드 그룹에 "시스템" 뱃지 + 수정 버튼 조건부 렌더링

### MDM-G02: 영향도 분석 DB 관리 (HIGH)

**구현:**
1. SQL 마이그레이션: `code_usage_mapping` 테이블 생성 + 기존 하드코딩 데이터 시드
2. `CodeUsageMapping` JPA 엔티티
3. `CodeUsageMappingRepository`
4. `CodeImpactAnalyzerImpl` 리팩터링: `CODE_USAGE_MAP` → Repository 조회
5. SUPER_ADMIN용 관리 API: `/api/v1/admin/mdm/code-usages` (CRUD)
6. Redis 캐싱 (`mdm:codeUsage`, TTL: 24h)

### MDM-G03: Excel 임포트/엑스포트 (MEDIUM)

**구현:**
1. `build.gradle`에 `org.apache.poi:poi-ooxml:5.2.5` 추가
2. `ExcelCodeImportExportService` 인터페이스 + 구현체
3. 엑스포트:
   - 시트1: `코드그룹` (groupCode, groupName, description, ...)
   - 시트2: `공통코드` (groupCode, code, codeName, level, parentCode, ...)
   - 계층 표현: level에 따라 코드명 앞에 들여쓰기
4. 임포트:
   - 동일 시트 구조의 Excel 파일 업로드
   - MultipartFile 처리 → 내부적으로 `CodeImportBatchRequest`로 변환
   - 행 수 제한: 5,000건
5. 엔드포인트:
   - `POST /api/v1/mdm/import/excel` (MultipartFile)
   - `GET /api/v1/mdm/export/excel` (파일 다운로드)
   - `GET /api/v1/mdm/export/excel/template` (빈 템플릿)

### MDM-G04: 코드 폐기 마이그레이션 (MEDIUM)

**구현:**
1. SQL 마이그레이션:
   ```sql
   ALTER TABLE common_code ADD COLUMN replacement_code_id UUID REFERENCES common_code(id);
   ALTER TABLE common_code ADD COLUMN deprecated_at TIMESTAMPTZ;
   ALTER TABLE common_code ADD COLUMN deprecation_grace_period_days INTEGER DEFAULT 90;
   ```
2. `CommonCode` 엔티티에 필드 추가
3. `deprecate(id, replacementCodeId)` 메서드 확장
4. 응답 DTO에 `replacementCode` 정보 포함
5. 스케줄러 (`@Scheduled`):
   - 매일 00:00 실행
   - `deprecated_at + grace_period_days < NOW()` 인 코드 → 이벤트 발행 (`CODE_GRACE_PERIOD_EXPIRED`)
   - 유예기간 만료 7일 전 알림 이벤트
6. 조회 API에서 `isGracePeriodActive` 플래그 반환

### MDM-G05: 테넌트 커스텀 메뉴 (MEDIUM)

**구현:**
1. SQL 마이그레이션:
   ```sql
   ALTER TABLE menu_item ADD COLUMN tenant_id UUID;
   CREATE INDEX idx_menu_item_tenant ON menu_item(tenant_id);
   ```
2. `MenuItem` 엔티티에 `tenantId` 필드 추가
3. TENANT_ADMIN 전용 메뉴 CRUD API:
   - `POST /api/v1/tenants/{tenantId}/menus` (커스텀 메뉴 생성)
   - `PUT /api/v1/tenants/{tenantId}/menus/{menuId}` (커스텀 메뉴 수정)
   - `DELETE /api/v1/tenants/{tenantId}/menus/{menuId}` (커스텀 메뉴 삭제)
4. 생성 시 `isSystem=false`, `tenantId=현재테넌트` 자동 설정
5. 조회 시: 시스템 메뉴(`tenantId=null`) + 해당 테넌트 메뉴 합집합
6. 삭제: 시스템 메뉴는 삭제 불가 (기존 로직 유지)

### MDM-G09: 코드 유효기간 스케줄러 (MEDIUM)

**구현:**
1. `CodeEffectiveScheduler` 클래스 생성
2. 매일 01:00 실행:
   - `effectiveFrom > TODAY` → 비활성 유지 (아직 유효하지 않음)
   - `effectiveTo < TODAY` → `INACTIVE`로 변경 + 이력 기록
   - `effectiveFrom <= TODAY AND effectiveTo >= TODAY` → `ACTIVE` 유지
3. 상태 변경 시 `CodeHistory` 기록 + 이벤트 발행

### MDM-G11: 시드 데이터 확장 (MEDIUM)

**추가할 시스템 코드 그룹:**
| 그룹 코드 | 그룹명 | 계층형 | 코드 수 (예상) |
|-----------|--------|--------|---------------|
| GRADE | 직급 | N | 10+ |
| POSITION | 직책 | N | 10+ |
| DEPT_TYPE | 부서유형 | N | 5+ |
| LEAVE_TYPE | 휴가유형 | Y (2레벨) | 15+ |
| EMPLOYMENT_TYPE | 고용형태 | N | 5+ |
| CONTRACT_TYPE | 계약유형 | N | 4+ |
| GENDER | 성별 | N | 3 |
| MARITAL_STATUS | 혼인상태 | N | 3 |
| EDUCATION_LEVEL | 학력 | N | 7 |
| BANK_CODE | 은행코드 | N | 20+ |
| APPROVAL_TYPE | 결재유형 | N | 10+ |
| DOCUMENT_TYPE | 문서유형 | Y (2레벨) | 20+ |
| COUNTRY_CODE | 국가코드 | N | 200+ |
| CURRENCY_CODE | 통화코드 | N | 30+ |

---

## 8. 테스트 시나리오

### 8.1 단위 테스트

#### CodeGroupService
| 시나리오 | 검증 내용 |
|----------|-----------|
| create_systemCodeGroup_superAdminOnly | SUPER_ADMIN이 아닌 사용자가 시스템 코드 그룹 생성 시 403 |
| create_tenantCodeGroup_success | TENANT_ADMIN이 테넌트 코드 그룹 생성 성공 |
| create_duplicateGroupCode_throwsException | 동일 groupCode + tenantId 중복 시 예외 |
| delete_systemCodeGroup_blocked | 시스템 코드 그룹 삭제 시도 시 예외 |
| getAll_returnSystemAndTenantGroups | 시스템 + 테넌트 코드 그룹 합집합 반환 |

#### CommonCodeService
| 시나리오 | 검증 내용 |
|----------|-----------|
| create_hierarchicalCode_validateDepth | 4레벨 초과 시 예외 |
| create_duplicateCode_throwsException | 동일 그룹 내 코드 중복 시 예외 |
| create_nonHierarchicalGroup_withParent_throwsException | 비계층 그룹에 부모 코드 지정 시 예외 |
| deprecate_withReplacementCode_success | 대체 코드 지정 후 폐기 성공 |
| deprecate_gracePeriodActive_allowsSoftBlock | 유예기간 중 신규 사용 경고 |
| getCodeTree_returnsHierarchy | 계층형 트리 구조 반환 |
| getByGroupCode_includesTenantCodes | 테넌트 코드 포함 조회 |

#### TenantCodeService
| 시나리오 | 검증 내용 |
|----------|-----------|
| update_customCodeName_success | 커스텀 코드명 설정 성공 |
| hide_code_notVisibleInQueries | 숨기기 후 visible 조회에서 제외 |
| resetToDefault_removesMapping | 초기화 시 매핑 삭제 |
| getByGroupCode_noMapping_returnsOriginal | 매핑 없을 때 원본 값 반환 |

#### CodeSearchService
| 시나리오 | 검증 내용 |
|----------|-----------|
| searchSimilar_exactMatch_similarity1 | 정확 일치 시 유사도 1.0 |
| searchSimilar_containsBonus | 포함 관계 시 +0.1 보너스 |
| checkDuplicate_highThreshold | 85% 이상만 중복으로 판단 |
| calculateLevenshtein_correctDistance | 편집 거리 정확성 |

#### CodeImpactAnalyzer
| 시나리오 | 검증 내용 |
|----------|-----------|
| analyzeImpact_withChildren_addsScore | 하위 코드 있을 때 점수 증가 |
| analyzeDeletionImpact_cannotDeleteWithChildren | 하위 코드 있으면 삭제 불가 |
| canDelete_criticalImpact_returnsFalse | CRITICAL 영향도 시 삭제 불가 |

#### MenuService
| 시나리오 | 검증 내용 |
|----------|-----------|
| getUserMenus_filtersByRole | 역할에 따른 메뉴 필터링 |
| getUserMenus_filtersByPermission | 권한에 따른 메뉴 필터링 |
| getUserMenus_excludesDisabledByTenant | 테넌트가 비활성화한 메뉴 제외 |
| getUserMenus_appliesTenantCustomName | 테넌트 커스텀 이름 적용 |
| getUserMenus_wildcardPermission | `*:*` 권한으로 전체 메뉴 접근 |
| createMenu_duplicateCode_throwsException | 중복 메뉴 코드 생성 시 예외 |
| deleteMenu_systemMenu_throwsException | 시스템 메뉴 삭제 시 예외 |
| reorderMenus_updatesSortOrder | 순서 변경 성공 |

### 8.2 통합 테스트

| 시나리오 | 검증 내용 |
|----------|-----------|
| importAndExport_roundTrip | 엑스포트 → 임포트 → 데이터 일치 |
| importValidateOnly_noDataSaved | 검증 모드에서 DB 변경 없음 |
| codeLifecycle_createActivateDeprecate | 전체 코드 생명주기 |
| tenantIsolation_codesNotSharedBetweenTenants | 테넌트 간 코드 격리 |
| menuCacheInvalidation_onUpdate | 메뉴 수정 시 캐시 무효화 |
| hierarchicalCodeTree_4Levels | 4레벨 계층 트리 생성/조회 |

---

## 9. 의존성

### 9.1 이 모듈이 의존하는 모듈

| 모듈 | 용도 |
|------|------|
| common-core | BusinessException, NotFoundException, ValidationException |
| common-entity | BaseEntity, AuditableEntity |
| common-response | ApiResponse, GlobalExceptionHandler |
| common-database | RLS Interceptor, Flyway config |
| common-tenant | TenantContext, TenantFilter |
| common-security | SecurityContextHolder, PermissionChecker, JWT |
| common-cache | Redis 설정 |
| common-event | DomainEvent, EventPublisher, EventTopics |

### 9.2 이 모듈에 의존하는 모듈

| 모듈 | 사용 기능 |
|------|-----------|
| employee-service | 직급(GRADE), 직책(POSITION), 고용형태 등 코드 참조 |
| organization-service | 부서유형(DEPT_TYPE) 코드 참조 |
| attendance-service | 휴가유형(LEAVE_TYPE), 근무형태 코드 참조 |
| approval-service | 결재유형(APPROVAL_TYPE), 문서유형 코드 참조 |
| notification-service | 알림유형 코드 참조 |
| gateway-service | 메뉴 정보 조회 (프론트엔드 네비게이션) |
| 프론트엔드 | 코드 목록 조회, 메뉴 조회, 코드 관리 UI |

### 9.3 이벤트 연동

**발행하는 이벤트:**
| 이벤트 | 토픽 | 페이로드 |
|--------|------|----------|
| CodeGroupCreatedEvent | `EventTopics.CODE_GROUP_CREATED` | codeGroupId, groupCode, groupName |
| CommonCodeCreatedEvent | `EventTopics.COMMON_CODE_CREATED` | codeId, groupCode, code, codeName |
| CommonCodeUpdatedEvent | `EventTopics.COMMON_CODE_UPDATED` | codeId, groupCode, code, codeName, isActive |

**구독하는 이벤트:**
- 현재 없음 (이벤트 발행만 함)

**추가 예정 이벤트 (MDM-G04):**
| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| CodeDeprecatedEvent | `hr-saas.mdm.code-deprecated` | 코드 폐기 시 관련 서비스에 알림 |
| CodeGracePeriodExpiringEvent | `hr-saas.mdm.grace-period-expiring` | 유예기간 만료 7일 전 알림 |
| CodeGracePeriodExpiredEvent | `hr-saas.mdm.grace-period-expired` | 유예기간 만료 시 알림 |

---

## 10. 주요 코드 파일 위치

```
services/mdm-service/src/main/java/com/hrsaas/mdm/
├── config/
├── controller/
│   ├── CodeGroupController.java
│   ├── CommonCodeController.java
│   ├── TenantCodeController.java
│   ├── CodeImportExportController.java
│   └── menu/
│       ├── MenuController.java
│       ├── TenantMenuConfigController.java
│       └── UserMenuController.java
├── domain/
│   ├── dto/
│   │   ├── request/ (7 files)
│   │   ├── response/ (8 files)
│   │   └── menu/ (7 files)
│   ├── entity/
│   │   ├── CodeGroup.java
│   │   ├── CommonCode.java
│   │   ├── CodeTenantMapping.java
│   │   ├── CodeHistory.java
│   │   ├── CodeStatus.java (enum)
│   │   ├── CodeAction.java (enum)
│   │   └── menu/
│   │       ├── MenuItem.java
│   │       ├── MenuPermission.java
│   │       ├── MenuType.java (enum)
│   │       ├── PermissionType.java (enum)
│   │       └── TenantMenuConfig.java
│   └── event/
│       ├── CodeGroupCreatedEvent.java
│       ├── CommonCodeCreatedEvent.java
│       └── CommonCodeUpdatedEvent.java
├── repository/
│   ├── CodeGroupRepository.java
│   ├── CommonCodeRepository.java
│   ├── CodeTenantMappingRepository.java
│   ├── CodeHistoryRepository.java
│   └── menu/
│       ├── MenuItemRepository.java
│       ├── MenuPermissionRepository.java
│       └── TenantMenuConfigRepository.java
└── service/
    ├── impl/
    │   ├── CodeGroupServiceImpl.java
    │   ├── CommonCodeServiceImpl.java
    │   ├── TenantCodeServiceImpl.java
    │   ├── CodeHistoryServiceImpl.java
    │   ├── CodeSearchServiceImpl.java
    │   ├── CodeImpactAnalyzerImpl.java
    │   └── CodeImportExportServiceImpl.java
    └── menu/impl/
        ├── MenuServiceImpl.java
        └── MenuCacheServiceImpl.java
```

---

## 11. 기술적 참고사항

### 11.1 비동기 이력 기록
- `CodeHistoryServiceImpl`의 `record*()` 메서드들은 `@Async` + `@Transactional(propagation = REQUIRES_NEW)` 사용
- 주 트랜잭션 실패 시에도 이력이 기록될 수 있음 (의도적 설계)
- `SecurityContextHolder`에서 사용자 정보 추출 시 예외 발생하면 "System"으로 기록

### 11.2 RLS 적용 범위
- **RLS 적용:** code_group, common_code, code_tenant_mapping, code_history, tenant_menu_config
- **RLS 미적용:** menu_item, menu_permission (시스템 전역 데이터)
- RLS 헬퍼 함수: `get_current_tenant_safe()` — 테넌트 미설정 시 NULL 반환 (에러 대신)

### 11.3 Effective Value 패턴
- `CodeTenantMapping`의 `getEffective*()` 메서드: 커스텀 값이 있으면 커스텀, 없으면 원본 CommonCode 값 반환
- `TenantCodeResponse`에 `originalCodeName`, `customCodeName`, `effectiveCodeName` 3가지 모두 포함
- `customized` 플래그로 커스터마이징 여부 표시

### 11.4 캐시 무효화 흐름
```
코드 변경 → @CacheEvict(mdm:commonCode, mdm:codeGroup) → 다음 조회 시 DB에서 로드
메뉴 변경 → @CacheEvict(menu:tree, menu:tenant, menu:user) → 모든 사용자 메뉴 재계산
테넌트 설정 변경 → @CacheEvict(menu:tenant:{id}, menu:user) → 해당 테넌트 메뉴 재계산
```
