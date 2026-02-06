# Module 04: Organization Service (조직 관리)

> 분석일: 2026-02-06
> 포트: 8083
> 패키지: `com.hrsaas.organization`
> DB 스키마: `hr_core`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 부서 CRUD | ✅ 완료 | 계층형 부서 생성/조회/수정/삭제, 트리 조회 |
| 직급 CRUD | ✅ 완료 | 직급 코드/이름/레벨 관리, 소프트 삭제 |
| 직책 CRUD | ✅ 완료 | 직책 코드/이름/레벨 관리, 소프트 삭제 |
| 공지사항 CRUD | ✅ 완료 | 생성/수정/삭제, 공개/비공개, 고정, 검색, 조회수, 첨부파일 |
| 위원회 관리 | ✅ 완료 | 위원회 CRUD, 위원 추가/제거, 상태 관리 (활성/비활성/해산) |
| 정원 계획 | ✅ 완료 | 연도별/부서별 정원 계획 CRUD, 승인, 요약 대시보드 |
| 정원 요청 | ✅ 완료 | 증원/감원/이동 요청 워크플로우 (DRAFT→PENDING→APPROVED/REJECTED) |
| 도메인 이벤트 | ✅ 완료 | DepartmentCreatedEvent, DepartmentUpdatedEvent |
| RLS (Row Level Security) | ✅ 완료 | 모든 테넌트 데이터 테이블에 적용 |
| 캐싱 | ✅ 완료 | Department, Grade, Position, Organization Tree |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| ORG-G01 | 부서 삭제 시 직원 검증 | HIGH | employee-service 연동하여 소속 직원 존재 시 삭제 차단 |
| ORG-G02 | 조직 변경 이력 테이블 | HIGH | organization_history 테이블 생성, 이벤트 리스너로 이력 기록 |
| ORG-G03 | 정원 요청 → 결재 서비스 연동 | HIGH | Approval Service와 Feign 연동, 이벤트 기반 상태 동기화 |
| ORG-G04 | 부서 계층 깊이 제한 | MEDIUM | 최대 10단계 깊이 검증 로직 추가 |
| ORG-G05 | 공지 대상 범위 지정 | MEDIUM | targetDepartments, targetGrades 필드 추가 |
| ORG-G06 | 부서 통합/분리 | MEDIUM | merge(A,B→C), split(A→A1,A2) 기능 + 직원 이동 + 이력 |
| ORG-G07 | 조직개편 영향도 분석 | MEDIUM | ReorgImpactAnalyzer 스텁 구현 완성 |
| ORG-G08 | Feign Client 구현 | HIGH | employee-service 연동용 Feign Client 없음 |
| ORG-G09 | 부서 코드 변경 불가 정책 | LOW | 코드 변경 시 이력 단절 방지 |
| ORG-G10 | 부서 관리자 검증 | MEDIUM | managerId가 실제 직원인지 employee-service에서 검증 |
| ORG-G11 | 직급/직책 사용 중 삭제 방지 | MEDIUM | 직원이 사용 중인 직급/직책 비활성화 차단 |
| ORG-G12 | 공지 읽음 확인 | LOW | 직원별 읽음/미읽음 추적 |
| ORG-G13 | 정원 이력 관리 | LOW | 연도별 정원 변동 추이 추적 |
| ORG-G14 | 조직도 API | MEDIUM | 조직도 전용 응답 (직원 수, 관리자 정보 포함) |

---

## 2. 정책 결정사항

### 2.1 부서 삭제 정책 ✅ 결정완료

> **결정: 소속 직원이 있으면 삭제 차단**

**규칙:**
1. 부서 삭제 요청 시 employee-service에 소속 직원 수 조회 (Feign Client)
2. 소속 직원 ≥ 1명이면 `ORG_010: "소속 직원이 존재하는 부서는 삭제할 수 없습니다."` 예외
3. 하위 부서가 존재하면 삭제 차단 (기존 로직 유지)
4. 삭제 가능 조건: 소속 직원 0명 AND 하위 부서 0개
5. 삭제 시 상태를 `DELETED`로 변경 (소프트 삭제)

**구현 방향:**
- `EmployeeClient` Feign 인터페이스: `GET /api/v1/employees/count?departmentId={id}`
- `DepartmentServiceImpl.delete()`에 검증 로직 추가
- CircuitBreaker: employee-service 장애 시 삭제 차단 (안전 기본값)

### 2.2 조직 변경 이력 관리 ✅ 결정완료

> **결정: 이벤트 기반 이력 테이블**

**이력 기록 대상:**
| 이벤트 | 설명 |
|--------|------|
| DEPARTMENT_CREATED | 부서 생성 |
| DEPARTMENT_UPDATED | 부서 정보 수정 (이름, 관리자 등) |
| DEPARTMENT_MOVED | 부서 상위 부서 변경 |
| DEPARTMENT_MERGED | 부서 통합 |
| DEPARTMENT_SPLIT | 부서 분리 |
| DEPARTMENT_ACTIVATED | 부서 활성화 |
| DEPARTMENT_DEACTIVATED | 부서 비활성화 |
| DEPARTMENT_DELETED | 부서 삭제 |

**구현 방향:**
1. `organization_history` 테이블 생성 (SQL 마이그레이션)
2. `OrganizationHistory` JPA 엔티티
3. `OrganizationHistoryService`: 이력 기록 + 조회
4. `@EventListener`로 도메인 이벤트 수신하여 이력 자동 기록
5. 기존 `DepartmentServiceImpl.getOrganizationHistory()` 스텁 → 실제 조회로 교체
6. 이전 값/이후 값(previousValue/newValue) JSON으로 저장

```sql
CREATE TABLE organization_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    department_id UUID,
    department_name VARCHAR(200),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    previous_value JSONB,
    new_value JSONB,
    actor_id UUID,
    actor_name VARCHAR(100),
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 정원 요청 → 결재 서비스 연동 ✅ 결정완료

> **결정: Approval Service와 연동**

**연동 흐름:**
```
1. 정원 요청 제출 (submit)
   └→ HeadcountService.submitRequest()
      └→ ApprovalClient.createApprovalRequest(type="HEADCOUNT", refId=requestId)
      └→ HeadcountRequest.status = PENDING

2. 결재 완료 이벤트 수신
   └→ @EventListener(ApprovalCompletedEvent)
      ├→ APPROVED: HeadcountRequest.approve() + HeadcountPlan.incrementApprovedCount()
      └→ REJECTED: HeadcountRequest.reject(reason)

3. 결재 취소
   └→ HeadcountService.cancelRequest()
      └→ ApprovalClient.cancelApproval(approvalId)
      └→ HeadcountRequest.status = DRAFT
```

**구현 방향:**
- `ApprovalClient` Feign 인터페이스: `POST /api/v1/approvals`, `DELETE /api/v1/approvals/{id}`
- `approval.completed` 이벤트 구독
- `HeadcountRequest.approvalId` 필드에 결재 ID 저장
- CircuitBreaker: approval-service 장애 시 submit 차단 (재시도 안내)

### 2.4 부서 계층 깊이 제한 ✅ 결정완료

> **결정: 최대 10단계**

**규칙:**
- 부서 생성/이동 시 `level ≤ 10` 검증
- 루트 부서(parent=null): level = 0
- 하위 부서: parent.level + 1
- 10단계 초과 시: `ORG_011: "부서 계층은 최대 10단계까지 허용됩니다."`
- 부서 이동 시 하위 전체 트리의 level 재계산 필요

**구현:**
```java
// DepartmentServiceImpl.create()
if (parent != null && parent.getLevel() >= 10) {
    throw new BusinessException("ORG_011", "부서 계층은 최대 10단계까지 허용됩니다.");
}

// DepartmentServiceImpl.update() - 부서 이동 시
if (newParent != null) {
    int newLevel = newParent.getLevel() + 1;
    int maxChildDepth = getMaxChildDepth(department);
    if (newLevel + maxChildDepth > 10) {
        throw new BusinessException("ORG_011", "이동 후 하위 부서 깊이가 10단계를 초과합니다.");
    }
}
```

### 2.5 공지사항 대상 범위 ✅ 결정완료

> **결정: 테넌트 전체 + 부서별 대상 지정**

**범위 유형:**
| 범위 | 설명 |
|------|------|
| ALL | 테넌트 전체 (기본값) |
| DEPARTMENTS | 특정 부서만 |
| GRADES | 특정 직급만 |
| DEPARTMENTS_AND_GRADES | 부서 + 직급 교차 |

**구현 방향:**
1. `announcement_target` 테이블 추가:
   ```sql
   CREATE TABLE announcement_target (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       announcement_id UUID NOT NULL REFERENCES announcement(id),
       target_type VARCHAR(20) NOT NULL,  -- DEPARTMENT, GRADE
       target_id UUID NOT NULL,
       target_name VARCHAR(200),
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. `Announcement` 엔티티에 `targetScope` 필드 추가 (ALL/TARGETED)
3. `AnnouncementTarget` 엔티티 + Repository
4. 조회 시: `targetScope=ALL`이면 전체 반환, `TARGETED`이면 현재 사용자의 부서/직급 매칭
5. `AnnouncementService.getPublished()` → 사용자 컨텍스트 기반 필터링

### 2.6 부서 통합/분리 ✅ 결정완료

> **결정: 통합 + 분리 모두 지원**

#### 통합 (Merge)
```
부서 A (직원 10명) + 부서 B (직원 5명) → 부서 C (직원 15명)
```
1. 새 부서 C 생성 (또는 기존 부서 지정)
2. A, B의 소속 직원을 C로 일괄 이동 (employee-service 연동)
3. A, B 상태를 `MERGED`로 변경
4. 이력 기록: 통합 사유, 원본 부서, 대상 부서, 이동 직원 수
5. 이벤트 발행: `DepartmentMergedEvent`

#### 분리 (Split)
```
부서 A (직원 15명) → 부서 A1 (직원 8명) + 부서 A2 (직원 7명)
```
1. 새 부서 A1, A2 생성
2. 원본 부서 A의 직원을 A1, A2로 지정 배치 (직원 목록 지정 필요)
3. 원본 부서 A: 상태 선택 가능 (유지/비활성화)
4. 이력 기록: 분리 사유, 원본 부서, 신규 부서 목록
5. 이벤트 발행: `DepartmentSplitEvent`

**API 설계:**
```
POST /api/v1/departments/merge
{
  "sourceDepartmentIds": ["uuid-A", "uuid-B"],
  "targetDepartmentId": "uuid-C" (nullable, null이면 신규 생성),
  "targetDepartmentName": "통합부서",
  "reason": "사유",
  "effectiveDate": "2026-03-01"
}

POST /api/v1/departments/split
{
  "sourceDepartmentId": "uuid-A",
  "newDepartments": [
    {"name": "A1팀", "code": "DEPT_A1", "employeeIds": ["emp1", "emp2"]},
    {"name": "A2팀", "code": "DEPT_A2", "employeeIds": ["emp3", "emp4"]}
  ],
  "keepSource": false,
  "reason": "사유",
  "effectiveDate": "2026-03-01"
}
```

---

## 3. 아키텍처 및 비즈니스 로직 사양

### 3.1 부서 계층 구조

```
Level 0: 본부/본사 (root, parent=null)
Level 1: ├── 경영본부
Level 2: │   ├── 인사팀
Level 3: │   │   ├── 채용파트
Level 4: │   │   │   └── ...
         │   ├── 총무팀
         │   └── 재무팀
         ├── 기술본부
         │   ├── 개발1팀
         │   ├── 개발2팀
         │   └── QA팀
         └── 영업본부
             ├── 국내영업팀
             └── 해외영업팀
... (최대 Level 10)
```

**부서 경로(path):** `/본부/경영본부/인사팀/채용파트`
- 부서 생성/이동 시 자동 계산
- `Department.updateHierarchy()` 메서드로 level + path 재설정

**부서 상태 전이:**
```
ACTIVE ──→ INACTIVE ──→ ACTIVE (재활성화)
  │
  ├──→ MERGED (통합 시)
  │
  └──→ DELETED (삭제 시)
```

### 3.2 직급/직책 체계

**직급 (Grade):**
- 기업의 계급 체계 (사원, 대리, 과장, 차장, 부장, 이사, 상무, 전무, 부사장, 사장)
- `level` 값으로 상하 관계 표현 (높을수록 상위)
- 테넌트별 독자 직급 체계 가능

**직책 (Position):**
- 조직 내 역할/보직 (팀장, 부장, 실장, 본부장, 대표이사)
- 직급과 독립적으로 관리
- 하나의 직급에 여러 직책 가능

**소프트 삭제 정책:**
- `delete()` → `isActive = false`로 변경 (물리 삭제 아님)
- 비활성 직급/직책은 신규 배정 불가, 기존 직원 데이터는 유지

### 3.3 공지사항 시스템

**공지 생명주기:**
```
생성 (isPublished=false)
  │
  ├──→ 즉시 공개 (isPublished=true on create)
  │
  └──→ 수동 공개 (publish())
        │
        └──→ 비공개 (unpublish())
              │
              └──→ 재공개 (publish())
```

**정렬 규칙:**
1. 고정(isPinned=true) 먼저
2. 공개일시(publishedAt) 내림차순
3. 생성일시(createdAt) 내림차순

**첨부파일:**
- `AnnouncementAttachment` OneToMany with orphanRemoval
- `fileId`로 file-service 연동
- 수정 시 `clearAttachments()` 후 재추가

### 3.4 위원회 관리

**위원회 유형:**
| 유형 | 설명 | 예시 |
|------|------|------|
| PERMANENT | 상설 위원회 | 인사위원회, 상벌위원회 |
| TEMPORARY | 한시 위원회 | TF, 프로젝트 위원회 |
| PROJECT | 프로젝트 위원회 | 시스템 구축 TF |

**위원 역할:**
| 역할 | 설명 |
|------|------|
| CHAIR | 위원장 |
| VICE_CHAIR | 부위원장 |
| SECRETARY | 간사 |
| MEMBER | 위원 |

**위원 생명주기:**
- `addMember()`: 중복 체크 후 추가 (동일 직원 중복 방지)
- `removeMember()`: `isActive=false` + `leaveDate` 설정 (소프트 삭제)
- `reactivate()`: 퇴임 위원 재임명

### 3.5 정원 관리

**정원 계획 (HeadcountPlan):**
- 연도별, 부서별 1건
- `plannedCount`: 계획 정원
- `currentCount`: 현재 인원 (employee-service 연동 예정)
- `approvedCount`: 승인된 증원 수
- `variance = plannedCount - currentCount`: 과부족
- `availableCount = plannedCount - currentCount + approvedCount`: 가용 정원

**정원 요청 (HeadcountRequest):**
```
DRAFT ──→ PENDING ──→ APPROVED
  │         │           │
  │         └──→ REJECTED
  │
  └──→ CANCELLED (취소)
```

| 상태 | 수정 가능 | 삭제 가능 | 설명 |
|------|-----------|-----------|------|
| DRAFT | ✅ | ✅ | 초안, 제출 전 |
| PENDING | ❌ | ❌ | 결재 중 |
| APPROVED | ❌ | ❌ | 승인됨 → Plan.approvedCount 증가 |
| REJECTED | ❌ | ❌ | 반려됨 |

**정원 요약 대시보드:**
```json
{
  "year": 2026,
  "totalPlannedCount": 500,
  "totalCurrentCount": 450,
  "totalApprovedCount": 20,
  "totalVariance": -50,
  "departments": [
    {
      "departmentName": "개발1팀",
      "plannedCount": 30,
      "currentCount": 25,
      "approvedCount": 3,
      "variance": -5,
      "availableCount": 8
    }
  ]
}
```

### 3.6 조직개편 영향도 분석 (ReorgImpactAnalyzer)

**현재:** 스텁 구현 (TODO)

**구현 예정 내용:**
- 입력: `ReorgPlan` (대상 부서 목록, 변경 내용)
- 분석 항목:
  - 영향받는 직원 수 (employee-service 조회)
  - 진행 중인 결재건 (approval-service 조회)
  - 정원 계획 영향
  - 하위 부서 영향
- 출력: `ImpactAnalysisResult` (영향도 요약, 위험 항목, 권장 사항)

---

## 4. API 엔드포인트 목록

### 4.1 부서 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/departments` | HR_ADMIN+ | 부서 생성 |
| GET | `/api/v1/departments/{id}` | 인증 | 부서 상세 조회 |
| GET | `/api/v1/departments` | 인증 | 부서 목록 (평면) |
| GET | `/api/v1/departments/tree` | 인증 | 부서 트리 (계층형) |
| PUT | `/api/v1/departments/{id}` | HR_ADMIN+ | 부서 수정 |
| DELETE | `/api/v1/departments/{id}` | HR_ADMIN+ | 부서 삭제 (소프트) |
| GET | `/api/v1/departments/history` | HR_ADMIN+ | 조직 전체 변경 이력 |
| GET | `/api/v1/departments/{id}/history` | HR_ADMIN+ | 특정 부서 변경 이력 |
| POST | `/api/v1/departments/{id}/reorg-impact` | HR_ADMIN+ | 조직개편 영향도 분석 |
| POST | `/api/v1/departments/merge` | TENANT_ADMIN+ | 부서 통합 (추가 예정) |
| POST | `/api/v1/departments/split` | TENANT_ADMIN+ | 부서 분리 (추가 예정) |

### 4.2 직급 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/grades` | HR_ADMIN+ | 직급 생성 |
| GET | `/api/v1/grades/{id}` | 인증 | 직급 상세 조회 |
| GET | `/api/v1/grades/code/{code}` | 인증 | 코드로 직급 조회 |
| GET | `/api/v1/grades` | 인증 | 직급 목록 (전체/활성만) |
| PUT | `/api/v1/grades/{id}` | HR_ADMIN+ | 직급 수정 |
| DELETE | `/api/v1/grades/{id}` | HR_ADMIN+ | 직급 비활성화 |

### 4.3 직책 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/positions` | HR_ADMIN+ | 직책 생성 |
| GET | `/api/v1/positions/{id}` | 인증 | 직책 상세 조회 |
| GET | `/api/v1/positions/code/{code}` | 인증 | 코드로 직책 조회 |
| GET | `/api/v1/positions` | 인증 | 직책 목록 |
| PUT | `/api/v1/positions/{id}` | HR_ADMIN+ | 직책 수정 |
| DELETE | `/api/v1/positions/{id}` | HR_ADMIN+ | 직책 비활성화 |

### 4.4 공지사항 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/announcements` | HR_ADMIN+ | 공지 생성 |
| GET | `/api/v1/announcements/{id}` | 인증 | 공지 상세 (조회수 +1) |
| GET | `/api/v1/announcements` | HR_ADMIN+ | 전체 공지 (페이징) |
| GET | `/api/v1/announcements/published` | 인증 | 공개 공지 (페이징) |
| GET | `/api/v1/announcements/pinned` | 인증 | 고정 공지 목록 |
| GET | `/api/v1/announcements/search` | 인증 | 공지 검색 (카테고리, 키워드) |
| PUT | `/api/v1/announcements/{id}` | HR_ADMIN+ | 공지 수정 |
| DELETE | `/api/v1/announcements/{id}` | HR_ADMIN+ | 공지 삭제 |
| POST | `/api/v1/announcements/{id}/publish` | HR_ADMIN+ | 공지 공개 |
| POST | `/api/v1/announcements/{id}/unpublish` | HR_ADMIN+ | 공지 비공개 |

### 4.5 위원회 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/committees` | HR_ADMIN+ | 위원회 생성 |
| GET | `/api/v1/committees/{id}` | 인증 | 위원회 상세 |
| GET | `/api/v1/committees` | 인증 | 위원회 목록 (상태/유형 필터) |
| PUT | `/api/v1/committees/{id}` | HR_ADMIN+ | 위원회 수정 |
| DELETE | `/api/v1/committees/{id}` | HR_ADMIN+ | 위원회 삭제 |
| POST | `/api/v1/committees/{id}/dissolve` | HR_ADMIN+ | 위원회 해산 |
| GET | `/api/v1/committees/{id}/members` | 인증 | 위원 목록 |
| POST | `/api/v1/committees/{id}/members` | HR_ADMIN+ | 위원 추가 |
| DELETE | `/api/v1/committees/{id}/members/{memberId}` | HR_ADMIN+ | 위원 제거 |

### 4.6 정원 관리 API

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/api/v1/headcounts/plans` | HR_ADMIN+ | 정원 계획 생성 |
| GET | `/api/v1/headcounts/plans/{id}` | HR_ADMIN+ | 정원 계획 상세 |
| GET | `/api/v1/headcounts/plans?year=` | HR_ADMIN+ | 연도별 정원 계획 목록 |
| PUT | `/api/v1/headcounts/plans/{id}` | HR_ADMIN+ | 정원 계획 수정 |
| DELETE | `/api/v1/headcounts/plans/{id}` | HR_ADMIN+ | 정원 계획 삭제 |
| POST | `/api/v1/headcounts/plans/{id}/approve` | TENANT_ADMIN+ | 정원 계획 승인 |
| POST | `/api/v1/headcounts/requests` | HR_ADMIN+ | 정원 요청 생성 |
| GET | `/api/v1/headcounts/requests/{id}` | HR_ADMIN+ | 정원 요청 상세 |
| GET | `/api/v1/headcounts/requests` | HR_ADMIN+ | 정원 요청 목록 (페이징) |
| PUT | `/api/v1/headcounts/requests/{id}` | HR_ADMIN+ | 정원 요청 수정 (DRAFT만) |
| DELETE | `/api/v1/headcounts/requests/{id}` | HR_ADMIN+ | 정원 요청 삭제 (DRAFT만) |
| POST | `/api/v1/headcounts/requests/{id}/submit` | HR_ADMIN+ | 정원 요청 제출 |
| POST | `/api/v1/headcounts/requests/{id}/cancel` | HR_ADMIN+ | 정원 요청 취소 |
| POST | `/api/v1/headcounts/requests/{id}/approve` | TENANT_ADMIN+ | 정원 요청 승인 |
| POST | `/api/v1/headcounts/requests/{id}/reject` | TENANT_ADMIN+ | 정원 요청 반려 |
| GET | `/api/v1/headcounts/summary?year=` | HR_ADMIN+ | 정원 요약 대시보드 |

---

## 5. 데이터 모델

### 5.1 엔티티 구조

```
Department (department)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── code: VARCHAR(50) — 부서 코드
├── name: VARCHAR(200) — 부서명
├── name_en: VARCHAR(200) — 영문 부서명
├── parent_id: UUID (self FK, nullable) — 상위 부서
├── level: INTEGER (default 0) — 계층 레벨 (0=루트, 최대 10)
├── path: VARCHAR(1000) — 경로 (예: /본부/경영본부/인사팀)
├── manager_id: UUID — 부서장 (employee ID)
├── status: VARCHAR(20) — ACTIVE/INACTIVE/MERGED/DELETED
├── sort_order: INTEGER (default 0)
├── created_at, updated_at, created_by, updated_by
└── UNIQUE(code, tenant_id)

Grade (grade)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── code: VARCHAR(50)
├── name: VARCHAR(100)
├── name_en: VARCHAR(100)
├── level: INTEGER — 서열 (높을수록 상위)
├── sort_order: INTEGER (default 0)
├── is_active: BOOLEAN (default true)
├── created_at, updated_at
└── UNIQUE(code, tenant_id)

Position (position)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── code: VARCHAR(50)
├── name: VARCHAR(100)
├── name_en: VARCHAR(100)
├── level: INTEGER
├── sort_order: INTEGER (default 0)
├── is_active: BOOLEAN (default true)
├── created_at, updated_at
└── UNIQUE(code, tenant_id)

Announcement (announcement)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── title: VARCHAR(500)
├── content: TEXT
├── category: VARCHAR(20) — NOTICE/EVENT/UPDATE/URGENT
├── author_id: UUID
├── author_name: VARCHAR(100)
├── author_department: VARCHAR(200)
├── is_pinned: BOOLEAN (default false)
├── view_count: INTEGER (default 0)
├── is_published: BOOLEAN (default false)
├── published_at: TIMESTAMPTZ
├── target_scope: VARCHAR(20) (추가 예정) — ALL/TARGETED
├── created_at, updated_at
└── attachments → AnnouncementAttachment (OneToMany)

AnnouncementAttachment (announcement_attachment)
├── id: UUID (PK)
├── announcement_id: UUID (FK)
├── file_id: UUID — file-service 참조
├── file_name: VARCHAR(255)
├── file_url: VARCHAR(1000)
├── file_size: BIGINT
├── content_type: VARCHAR(100)
└── created_at, updated_at

AnnouncementTarget (announcement_target) — 추가 예정 (ORG-G05)
├── id: UUID (PK)
├── announcement_id: UUID (FK)
├── target_type: VARCHAR(20) — DEPARTMENT/GRADE
├── target_id: UUID
├── target_name: VARCHAR(200)
└── created_at

Committee (committee)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── code: VARCHAR(50)
├── name: VARCHAR(200)
├── name_en: VARCHAR(200)
├── type: VARCHAR(20) — PERMANENT/TEMPORARY/PROJECT
├── purpose: TEXT
├── start_date: DATE
├── end_date: DATE
├── meeting_schedule: VARCHAR(500)
├── status: VARCHAR(20) — ACTIVE/INACTIVE/DISSOLVED
├── created_at, updated_at
├── UNIQUE(code, tenant_id)
└── members → CommitteeMember (OneToMany)

CommitteeMember (committee_member)
├── id: UUID (PK)
├── committee_id: UUID (FK)
├── employee_id: UUID
├── employee_name: VARCHAR(100)
├── department_name: VARCHAR(200)
├── position_name: VARCHAR(100)
├── role: VARCHAR(20) — CHAIR/VICE_CHAIR/SECRETARY/MEMBER
├── join_date: DATE
├── leave_date: DATE
├── is_active: BOOLEAN (default true)
└── created_at, updated_at

HeadcountPlan (headcount_plan)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── year: INTEGER
├── department_id: UUID
├── department_name: VARCHAR(200)
├── planned_count: INTEGER
├── current_count: INTEGER (default 0)
├── approved_count: INTEGER (default 0)
├── notes: TEXT
├── created_at, updated_at
└── UNIQUE(tenant_id, year, department_id)

HeadcountRequest (headcount_request)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── department_id: UUID
├── department_name: VARCHAR(200)
├── type: VARCHAR(20) — INCREASE/DECREASE/TRANSFER
├── request_count: INTEGER
├── grade_id: UUID
├── grade_name: VARCHAR(100)
├── position_id: UUID
├── position_name: VARCHAR(100)
├── reason: TEXT
├── effective_date: DATE
├── status: VARCHAR(20) — DRAFT/PENDING/APPROVED/REJECTED
├── approval_id: UUID — 결재 서비스 연동 ID
├── requester_id: UUID
├── requester_name: VARCHAR(100)
└── created_at, updated_at

OrganizationHistory (organization_history) — 추가 예정 (ORG-G02)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── event_type: VARCHAR(50)
├── department_id: UUID
├── department_name: VARCHAR(200)
├── title: VARCHAR(500)
├── description: TEXT
├── previous_value: JSONB
├── new_value: JSONB
├── actor_id: UUID
├── actor_name: VARCHAR(100)
├── event_date: TIMESTAMPTZ
├── metadata: JSONB
└── created_at
```

---

## 6. 설정값 목록

### 6.1 application.yml

```yaml
server:
  port: 8083

spring:
  application:
    name: organization-service
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/hr_saas
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        default_schema: hr_core
  flyway:
    schemas: hr_core
  data:
    redis:
      port: ${REDIS_PORT:6381}
  cloud:
    aws:
      sns/sqs: LocalStack 연동

jwt:
  access-token-expiry: 1800
  refresh-token-expiry: 604800
```

### 6.2 빌드 의존성

```groovy
dependencies {
    // Common 모듈 전체 (core, entity, response, database, tenant, security, privacy, cache, event)
    // Spring Boot (web, jpa, validation, security, redis)
    // Spring Cloud (openfeign, circuitbreaker-resilience4j)
    // PostgreSQL, Flyway
    // SpringDoc OpenAPI
    // TestContainers
}
```

### 6.3 에러 코드

| 코드 | 설명 |
|------|------|
| ORG_001 | 부서 코드 중복 |
| ORG_002 | 직급 코드 중복 |
| ORG_003 | 직책 코드 중복 |
| ORG_004 | 부서를 찾을 수 없음 |
| ORG_005 | 위원회 코드 중복 |
| ORG_006 | 이미 등록된 위원 |
| ORG_007 | 위원을 찾을 수 없음 |
| ORG_008 | 해당 연도/부서의 정원 계획 중복 |
| ORG_009 | 상태 전이 불가 (예: APPROVED → DRAFT) |
| ORG_010 | 소속 직원이 있어 삭제 불가 (추가 예정) |
| ORG_011 | 부서 계층 10단계 초과 (추가 예정) |

### 6.4 캐시 키

| 캐시 이름 | TTL | 무효화 조건 |
|-----------|-----|------------|
| `CacheNames.DEPARTMENT` | 1h | 부서 CUD |
| `CacheNames.ORGANIZATION_TREE` | 1h | 부서 CUD |
| `CacheNames.GRADE` | 1h | 직급 CUD |
| `CacheNames.POSITION` | 1h | 직책 CUD |

---

## 7. 갭 구현 사양

### ORG-G01: 부서 삭제 시 직원 검증 (HIGH)

**구현:**
1. `EmployeeClient` Feign 인터페이스:
   ```java
   @FeignClient(name = "employee-service")
   public interface EmployeeClient {
       @GetMapping("/api/v1/employees/count")
       ApiResponse<Long> countByDepartmentId(@RequestParam UUID departmentId);
   }
   ```
2. `DepartmentServiceImpl.delete()`:
   ```java
   Long employeeCount = employeeClient.countByDepartmentId(id).getData();
   if (employeeCount > 0) {
       throw new BusinessException("ORG_010",
           "소속 직원이 " + employeeCount + "명 있습니다. 직원을 다른 부서로 이동한 후 삭제해주세요.");
   }
   ```
3. `@CircuitBreaker(fallbackMethod = "deleteFailsafe")`: employee-service 장애 시 삭제 차단

### ORG-G02: 조직 변경 이력 테이블 (HIGH)

**구현:**
1. SQL 마이그레이션: `organization_history` 테이블 + RLS + 인덱스
2. `OrganizationHistory` JPA 엔티티
3. `OrganizationHistoryRepository`
4. `OrganizationHistoryService`:
   ```java
   @Async
   @TransactionalEventListener
   public void onDepartmentCreated(DepartmentCreatedEvent event) {
       save(history("DEPARTMENT_CREATED", event));
   }
   ```
5. `DepartmentServiceImpl.getOrganizationHistory()` → Repository 조회로 교체
6. 추가 이벤트 생성: `DepartmentMovedEvent`, `DepartmentMergedEvent`, `DepartmentSplitEvent`

### ORG-G03: 정원 요청 → 결재 서비스 연동 (HIGH)

**구현:**
1. `ApprovalClient` Feign 인터페이스:
   ```java
   @FeignClient(name = "approval-service")
   public interface ApprovalClient {
       @PostMapping("/api/v1/approvals")
       ApiResponse<ApprovalResponse> createApproval(@RequestBody CreateApprovalRequest request);

       @DeleteMapping("/api/v1/approvals/{id}")
       ApiResponse<Void> cancelApproval(@PathVariable UUID id);
   }
   ```
2. `HeadcountServiceImpl.submitRequest()`:
   - approval-service에 결재 요청 생성
   - 결재 유형: `HEADCOUNT_REQUEST`
   - 참조 ID: `headcountRequest.id`
3. 이벤트 리스너: `approval.completed` 토픽 구독
   - `APPROVED` → `HeadcountRequest.approve()` + Plan 업데이트
   - `REJECTED` → `HeadcountRequest.reject(reason)`
4. `HeadcountServiceImpl.cancelRequest()`: approval-service에 취소 요청

### ORG-G04: 부서 계층 깊이 제한 (MEDIUM)

**구현:**
- `DepartmentServiceImpl.create()` / `update()`에 level 검증 추가
- 부서 이동 시 하위 트리 전체 깊이 계산하여 10 초과 검증
- 하위 트리 level 재계산 메서드: `recalculateSubTreeLevels(department)`

### ORG-G05: 공지 대상 범위 지정 (MEDIUM)

**구현:**
1. SQL 마이그레이션: `announcement` 테이블에 `target_scope` 컬럼 + `announcement_target` 테이블
2. `AnnouncementTarget` 엔티티 + Repository
3. `CreateAnnouncementRequest`에 `targetScope`, `targetDepartmentIds`, `targetGradeIds` 필드 추가
4. `AnnouncementServiceImpl.getPublished()`:
   - `targetScope=ALL`: 전체 반환
   - `targetScope=TARGETED`: 현재 사용자의 departmentId/gradeId 매칭

### ORG-G06: 부서 통합/분리 (MEDIUM)

**구현:**
1. `DepartmentMergeRequest`, `DepartmentSplitRequest` DTO
2. `DepartmentService.merge()`, `DepartmentService.split()` 메서드
3. employee-service 연동: 직원 일괄 부서 이동
4. 이력 기록: 통합/분리 사유, 원본/대상 부서, 직원 수
5. 이벤트: `DepartmentMergedEvent`, `DepartmentSplitEvent`
6. 트랜잭션: 부서 상태 변경 + 직원 이동이 원자적으로 처리되어야 함
   - Saga 패턴 또는 이벤트 기반 보상 트랜잭션 적용

### ORG-G08: Feign Client 구현 (HIGH)

**필요한 클라이언트:**
| 클라이언트 | 대상 서비스 | 용도 |
|-----------|------------|------|
| EmployeeClient | employee-service | 부서별 직원 수 조회, 직원 부서 이동 |
| ApprovalClient | approval-service | 정원 요청 결재 연동 |

### ORG-G14: 조직도 API (MEDIUM)

**구현:**
- `GET /api/v1/departments/org-chart` → 부서 트리 + 부서별 직원 수 + 관리자 정보
- employee-service 연동하여 부서별 인원 수 집계
- 관리자 정보: managerId → employee-service에서 이름/직급/직책 조회
- 응답: `OrgChartResponse` (부서 + 관리자 + 인원수 + 하위 부서)

---

## 8. 테스트 시나리오

### 8.1 단위 테스트

#### DepartmentService
| 시나리오 | 검증 내용 |
|----------|-----------|
| create_withParent_setsLevelAndPath | 상위 부서 지정 시 level, path 자동 설정 |
| create_duplicateCode_throwsORG001 | 동일 테넌트 내 부서 코드 중복 시 예외 |
| create_exceedsMaxLevel_throwsORG011 | 11레벨 부서 생성 시 예외 |
| delete_withEmployees_throwsORG010 | 소속 직원 존재 시 삭제 차단 |
| delete_withChildren_throwsException | 하위 부서 존재 시 삭제 차단 |
| update_moveParent_recalculatesLevels | 상위 부서 변경 시 하위 트리 level 재계산 |
| getTree_returnsHierarchy | 루트부터 하위까지 트리 반환 |
| merge_twoTenDepartments_createsNew | 2개 부서 통합 후 신규 부서 생성 |
| split_oneDepartment_createsTwoDepartments | 1개 부서 분리 후 2개 부서 생성 |

#### AnnouncementService
| 시나리오 | 검증 내용 |
|----------|-----------|
| create_withPublish_setsPublishedAt | 즉시 공개 시 publishedAt 설정 |
| publish_setsIsPublishedTrue | 공개 처리 |
| search_byCategoryAndKeyword_returnsFiltered | 카테고리 + 키워드 복합 검색 |
| getPublished_targetedScope_filtersForUser | 대상 지정 공지 → 사용자 부서 매칭 필터링 |

#### HeadcountService
| 시나리오 | 검증 내용 |
|----------|-----------|
| createPlan_duplicateYearDept_throwsORG008 | 중복 정원 계획 방지 |
| submitRequest_sendsToApprovalService | 제출 시 결재 요청 생성 확인 |
| approveRequest_incrementsPlanApprovedCount | 승인 시 Plan.approvedCount 증가 |
| rejectRequest_changesStatusToRejected | 반려 시 상태 변경 |
| updateRequest_afterSubmit_throwsORG009 | 제출 후 수정 시도 시 예외 |
| getSummary_calculatesVarianceCorrectly | 정원 과부족 계산 정확성 |

#### CommitteeService
| 시나리오 | 검증 내용 |
|----------|-----------|
| addMember_duplicateEmployee_throwsORG006 | 중복 위원 추가 방지 |
| removeMember_setsInactiveAndLeaveDate | 위원 제거 시 소프트 삭제 |
| dissolve_changesStatusToDissolved | 해산 시 상태 변경 |

### 8.2 통합 테스트

| 시나리오 | 검증 내용 |
|----------|-----------|
| departmentTreeCRUD_fullLifecycle | 부서 생성→하위 추가→이동→삭제 전체 흐름 |
| headcountWorkflow_draftToApproved | 정원 요청 생성→제출→승인 전체 워크플로우 |
| tenantIsolation_departmentsNotShared | 테넌트 간 부서 데이터 격리 |
| organizationHistory_recordsAllChanges | 모든 부서 변경이 이력에 기록 |
| departmentMerge_movesEmployees | 통합 시 직원 자동 이동 확인 |

---

## 9. 의존성

### 9.1 이 모듈이 의존하는 모듈

| 모듈 | 용도 |
|------|------|
| common-core | BusinessException, NotFoundException |
| common-entity | BaseEntity, AuditableEntity, TenantAwareEntity |
| common-response | ApiResponse |
| common-database | RLS Interceptor, Flyway config |
| common-tenant | TenantContext, TenantFilter |
| common-security | SecurityContextHolder, PermissionChecker, JWT |
| common-privacy | 마스킹/암호화 (미사용 중) |
| common-cache | Redis 설정, CacheNames |
| common-event | DomainEvent, EventPublisher |

### 9.2 이 모듈에 의존하는 모듈

| 모듈 | 사용 기능 |
|------|-----------|
| employee-service | 부서 정보 조회, 직급/직책 조회 |
| attendance-service | 부서별 근태 집계 |
| approval-service | 조직 관련 결재 참조 |
| notification-service | 공지사항 알림 발송 |
| 프론트엔드 | 조직도, 부서 트리, 직급/직책 드롭다운, 공지사항 |

### 9.3 외부 서비스 연동 (Feign Client, 추가 예정)

| 클라이언트 | 대상 | API | 용도 |
|-----------|------|-----|------|
| EmployeeClient | employee-service | `GET /api/v1/employees/count?departmentId=` | 부서 삭제 검증 |
| EmployeeClient | employee-service | `POST /api/v1/employees/bulk-transfer` | 부서 통합/분리 시 직원 이동 |
| ApprovalClient | approval-service | `POST /api/v1/approvals` | 정원 요청 결재 생성 |
| ApprovalClient | approval-service | `DELETE /api/v1/approvals/{id}` | 정원 요청 결재 취소 |

### 9.4 이벤트 연동

**발행하는 이벤트:**
| 이벤트 | 토픽 | 페이로드 |
|--------|------|----------|
| DepartmentCreatedEvent | `EventTopics.DEPARTMENT_CREATED` | departmentId, code, name, parentId, level |
| DepartmentUpdatedEvent | `EventTopics.DEPARTMENT_UPDATED` | departmentId, code, name, parentId, level, status |
| DepartmentMergedEvent (추가 예정) | `hr-saas.organization.department-merged` | sourceIds, targetId, employeeCount |
| DepartmentSplitEvent (추가 예정) | `hr-saas.organization.department-split` | sourceId, newDepartmentIds |

**구독하는 이벤트:**
| 이벤트 | 토픽 | 처리 |
|--------|------|------|
| ApprovalCompletedEvent (추가 예정) | `hr-saas.approval.completed` | 정원 요청 승인/반려 상태 업데이트 |

---

## 10. 주요 코드 파일 위치

```
services/organization-service/src/main/java/com/hrsaas/organization/
├── config/
│   └── SecurityConfig.java
├── controller/
│   ├── DepartmentController.java
│   ├── GradeController.java
│   ├── PositionController.java
│   ├── AnnouncementController.java
│   ├── CommitteeController.java
│   └── HeadcountController.java
├── domain/
│   ├── dto/
│   │   ├── request/ (14 files)
│   │   └── response/ (10 files)
│   ├── entity/
│   │   ├── Department.java
│   │   ├── DepartmentStatus.java (enum)
│   │   ├── Grade.java
│   │   ├── Position.java
│   │   ├── Announcement.java
│   │   ├── AnnouncementAttachment.java
│   │   ├── AnnouncementCategory.java (enum)
│   │   ├── Committee.java
│   │   ├── CommitteeMember.java
│   │   ├── CommitteeType.java (enum)
│   │   ├── CommitteeStatus.java (enum)
│   │   ├── CommitteeMemberRole.java (enum)
│   │   ├── HeadcountPlan.java
│   │   ├── HeadcountRequest.java
│   │   ├── HeadcountRequestType.java (enum)
│   │   └── HeadcountRequestStatus.java (enum)
│   └── event/
│       ├── DepartmentCreatedEvent.java
│       └── DepartmentUpdatedEvent.java
├── repository/
│   ├── DepartmentRepository.java
│   ├── GradeRepository.java
│   ├── PositionRepository.java
│   ├── AnnouncementRepository.java
│   ├── AnnouncementAttachmentRepository.java
│   ├── CommitteeRepository.java
│   ├── CommitteeMemberRepository.java
│   ├── HeadcountPlanRepository.java
│   └── HeadcountRequestRepository.java
├── service/
│   ├── DepartmentService.java
│   ├── GradeService.java
│   ├── PositionService.java
│   ├── AnnouncementService.java
│   ├── CommitteeService.java
│   ├── HeadcountService.java
│   ├── ReorgImpactAnalyzer.java
│   └── impl/
│       ├── DepartmentServiceImpl.java
│       ├── GradeServiceImpl.java
│       ├── PositionServiceImpl.java
│       ├── AnnouncementServiceImpl.java
│       ├── CommitteeServiceImpl.java
│       └── HeadcountServiceImpl.java
└── client/ (추가 예정)
    ├── EmployeeClient.java
    └── ApprovalClient.java
```

---

## 11. 기술적 참고사항

### 11.1 DB 스키마 차이
- Organization Service: `hr_core` 스키마
- Auth Service: `tenant_common` 스키마
- MDM Service: `tenant_common` 스키마
- 동일 DB(`hr_saas`)의 서로 다른 스키마 사용

### 11.2 부서 Path 관리
- `Department.updateHierarchy()`: parent 변경 시 level + path 자동 재계산
- Path 형식: `/부서명1/부서명2/부서명3`
- 부서명 변경 시 하위 모든 부서의 path도 업데이트 필요 (현재 미구현)

### 11.3 Feign Client 부재
- organization-service에 `client/` 패키지가 없음
- employee-service, approval-service와의 연동이 필요하지만 Feign Client 미구현
- `build.gradle`에 OpenFeign + CircuitBreaker 의존성은 이미 포함됨

### 11.4 직급/직책 vs MDM 코드
- 현재 직급/직책은 organization-service 자체 엔티티로 관리
- MDM Service에도 GRADE, POSITION 코드 그룹이 시드 데이터로 계획됨
- 이중 관리 리스크 있음 → 결정 필요: organization-service 엔티티 유지 vs MDM 코드로 통합
- 현재 구현에서는 organization-service 엔티티로 유지 (직급/직책별 level, sortOrder 등 추가 속성 필요)
