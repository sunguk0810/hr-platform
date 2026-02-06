# Module 05: Employee Service (직원 관리)

> 분석일: 2026-02-06
> 포트: 8084
> 패키지: `com.hrsaas.employee`
> DB 스키마: `hr_core`

---

## 1. 현재 구현 상태 요약

### 1.1 완료된 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 직원 CRUD | ✅ 완료 | 생성/조회/수정/삭제, 사번 조회, 본인 조회(/me) |
| 직원 검색 | ✅ 완료 | 이름, 부서, 상태별 페이징 검색 |
| 직원 퇴사/복직 | ✅ 완료 | resign(), cancelResign() 상태 관리 |
| 인사이력 관리 | ✅ 완료 | 이력 CRUD (인사발령, 부서이동, 승진 등) |
| 가족정보 관리 | ✅ 완료 | 가족 CRUD (관계, 생년월일, 부양가족 여부) |
| 경력정보 관리 | ✅ 완료 | 경력 CRUD (회사명, 부서, 직책, 기간) |
| 학력정보 관리 | ✅ 완료 | 학력 CRUD (학교, 전공, 학위, 졸업상태) |
| 자격증 관리 | ✅ 완료 | 자격증 CRUD (자격증명, 발급기관, 번호) |
| 겸직/소속 관리 | ✅ 완료 | 주/부 소속, 겸직 관리, PRIMARY/SECONDARY/CONCURRENT |
| 사번 규칙 관리 | ✅ 완료 | 접두사, 연도포함, 시퀀스 자릿수, 리셋정책 설정 |
| 사번 자동 생성 | ✅ 완료 | 비관적 잠금(PESSIMISTIC_WRITE)으로 동시성 안전 |
| 본인정보 변경요청 | ✅ 완료 | 셀프서비스 변경 → 승인 워크플로우 |
| 경조비 정책 | ✅ 완료 | 경조 유형별 금액/휴가일수 정책 CRUD |
| 경조비 신청 | ✅ 완료 | 신청/승인/반려/지급완료/취소 워크플로우 |
| 전출/전입 요청 | ✅ 완료 | 계열사 간 전출입 전체 워크플로우 (양측 승인) |
| 인사기록카드 | ✅ 완료 | 종합 인사정보 조회 + PDF 생성 (PDFBox) |
| 일괄 처리 | ✅ 완료 | 일괄 등록 (validate-only 모드, 최대 1000건) |
| Feign Client | ✅ 완료 | tenant-service, organization-service 연동 + 폴백 |
| 도메인 이벤트 | ✅ 완료 | EmployeeCreatedEvent, EmployeeAffiliationChangedEvent |
| RLS | ✅ 완료 | 모든 테넌트 테이블에 적용, transfer_request는 다중 테넌트 조건 |
| 캐싱 | ✅ 완료 | Employee 조회 결과 Redis 캐싱 |
| 개인정보 마스킹 | ✅ 부분 | PrivacyContext 연동, unmask API 존재 |

### 1.2 미구현 / 갭

| 갭 ID | 기능 | 우선순위 | 설명 |
|--------|------|----------|------|
| EMP-G01 | 경조비 → 결재 서비스 연동 | HIGH | Approval Service와 Feign 연동 필요 |
| EMP-G02 | 전출 완료 시 자동 처리 | HIGH | 대상 테넌트에 직원 자동 생성 + 원본 퇴직 처리 |
| EMP-G03 | 물리 삭제 → 소프트 삭제 전환 | HIGH | delete() 메서드가 물리 삭제 수행 중, 소프트 삭제로 변경 |
| EMP-G04 | 마스킹 해제 감사 로그 | HIGH | unmask 시 권한 체크 + 사유 기록 + 감사 로그 저장 |
| EMP-G05 | Excel Import/Export | MEDIUM | exportToExcel, importFromExcel, getImportTemplate 모두 TODO |
| EMP-G06 | PDF 한글 폰트 | MEDIUM | PDFBox에 NanumGothic 등 한국어 TTF 폰트 임베딩 필요 |
| EMP-G07 | ddl-auto: update → validate | HIGH | 프로덕션 환경에서 ddl-auto: validate로 변경 필요 |
| EMP-G08 | 전출 완료 시 이벤트 발행 | MEDIUM | TransferCompletedEvent로 다른 서비스 알림 |
| EMP-G09 | 부서/직급/직책 검증 | MEDIUM | 직원 생성/수정 시 org-service에서 유효성 검증 |
| EMP-G10 | 본인정보 변경 → 결재 연동 | MEDIUM | ChangeRequest 승인 시 Approval Service 연동 |
| EMP-G11 | 주민번호 암호화 | HIGH | resident_number 필드 DB 암호화 (@Encrypted) 미적용 |
| EMP-G12 | 일괄 퇴사 처리 | LOW | bulkDelete → bulkResign으로 전환 (소프트 삭제 정책 적용) |
| EMP-G13 | 직원 수 API | MEDIUM | 부서별 직원 수 카운트 API (org-service 연동용) |
| EMP-G14 | 인사이력 자동 기록 | MEDIUM | 부서/직급/직책 변경 시 이력 자동 생성 |

---

## 2. 정책 결정사항

### 2.1 경조비 승인 정책 ✅ 결정완료

> **결정: Approval Service와 연동**

**연동 흐름:**
```
1. 경조비 신청 제출
   └→ CondolenceService.create()
      └→ ApprovalClient.createApprovalRequest(type="CONDOLENCE", refId=requestId)
      └→ CondolenceRequest.status = PENDING

2. 결재 완료 이벤트 수신
   └→ @EventListener(ApprovalCompletedEvent)
      ├→ APPROVED: CondolenceRequest.approve(approvalId)
      └→ REJECTED: CondolenceRequest.reject(reason)

3. 지급 처리
   └→ CondolenceService.markAsPaid(id, paidDate)
      └→ CondolenceRequest.status = PAID
```

**구현 방향:**
- `ApprovalClient` Feign 인터페이스: `POST /api/v1/approvals`
- 결재 유형: `CONDOLENCE_REQUEST`
- `approval.completed` 이벤트 구독
- CircuitBreaker: approval-service 장애 시 신청 차단 (재시도 안내)

### 2.2 전출 완료 처리 정책 ✅ 결정완료

> **결정: 대상 테넌트에 자동 생성 + 원본 RESIGNED 처리**

**전출 완료 프로세스:**
```
1. 양측 승인 완료 (status = APPROVED)
2. 관리자가 "완료" 처리 (complete)
3. 자동 처리:
   a. 대상 테넌트에 직원 레코드 생성
      - TenantContext 전환 → target tenant
      - 원본 직원 정보 복사 + 대상 부서/직급/직책 설정
      - 새 사번 생성 (대상 테넌트 규칙 적용)
   b. 원본 테넌트 직원 상태 변경
      - Employee.resign(transferDate)
      - 사유: "계열사 전출 - {대상 테넌트명}"
   c. 이력 기록 (양쪽)
   d. 이벤트 발행: TransferCompletedEvent
```

**주의사항:**
- 대상 테넌트 직원 생성 실패 시 전체 롤백
- Saga 패턴 적용 (분산 트랜잭션)
- 원본 직원의 소속/이력/가족 등 상세정보는 복사하지 않음 (대상 테넌트에서 별도 입력)

### 2.3 직원 삭제 정책 ✅ 결정완료

> **결정: 소프트 삭제만 허용**

**규칙:**
1. `delete()` 호출 시 물리 삭제 대신 `status = RESIGNED` 변경
2. `resignDate = LocalDate.now()` 설정
3. SUPER_ADMIN도 물리 삭제 불가
4. 데이터 보존 기간: 무기한 (법적 보존 의무)
5. `bulkDelete()` → `bulkResign()`으로 전환

**구현 변경:**
```java
// Before (현재 - 물리 삭제)
public void delete(UUID id) {
    Employee employee = findById(id);
    employeeRepository.delete(employee);
}

// After (변경 후 - 소프트 삭제)
public void delete(UUID id) {
    Employee employee = findById(id);
    employee.resign(LocalDate.now());
    employeeRepository.save(employee);
    log.info("Employee soft-deleted (resigned): id={}", id);
}
```

### 2.4 개인정보 마스킹 해제 정책 ✅ 결정완료

> **결정: 권한 + 사유 + 감사 로그**

**규칙:**
1. 마스킹 해제 요청 시 필수 값:
   - `field`: 해제 대상 필드 (phone, mobile, email, residentNumber)
   - `reason`: 열람 사유 (필수, 최소 10자)
2. 권한 체크:
   - `employee:unmask:*` 또는 `employee:unmask:{field}` 권한 필요
   - HR_MANAGER 이상만 주민번호 해제 가능
3. 감사 로그 기록:
   ```java
   AuditLog {
       actorId, actorName,
       employeeId, fieldName,
       reason, accessedAt, ipAddress
   }
   ```
4. 감사 로그 보존: 5년 (개인정보보호법 준수)
5. 주민번호 열람 시 추가 알림 (notification-service 연동)

**구현 방향:**
```java
public String unmask(UUID id, String field, String reason) {
    // 1. 권한 체크
    checkUnmaskPermission(field);

    // 2. 사유 검증
    if (reason == null || reason.length() < 10) {
        throw new ValidationException("EMP_030", "열람 사유는 10자 이상 입력해야 합니다.");
    }

    // 3. 감사 로그 기록
    auditLogService.logPrivacyAccess(id, field, reason);

    // 4. 마스킹 해제된 값 반환
    Employee employee = findById(id);
    return getFieldValue(employee, field);

    // 5. 주민번호인 경우 알림 발송
    if ("residentNumber".equals(field)) {
        notifyPrivacyAccess(id, field, reason);
    }
}
```

---

## 3. 아키텍처 및 비즈니스 로직 사양

### 3.1 직원 상태 전이

```
입사 → ACTIVE ──→ SUSPENDED (휴직)
         │            │
         │            └──→ ACTIVE (복직)
         │
         ├──→ ON_LEAVE (휴가중)
         │      │
         │      └──→ ACTIVE (복귀)
         │
         └──→ RESIGNED (퇴사/전출/소프트삭제)
```

| 상태 | 설명 | 조회 대상 |
|------|------|-----------|
| ACTIVE | 재직 중 | 기본 조회 대상 |
| SUSPENDED | 휴직 중 | 조회 가능 |
| ON_LEAVE | 휴가 중 | 조회 가능 |
| RESIGNED | 퇴사/전출 | 명시적 필터링 시에만 |

### 3.2 고용 유형

| 유형 | 설명 |
|------|------|
| REGULAR | 정규직 |
| CONTRACT | 계약직 |
| PART_TIME | 파트타임 |
| INTERN | 인턴 |

### 3.3 사번 자동 생성 규칙

**EmployeeNumberRule 설정:**
| 설정 | 기본값 | 설명 |
|------|--------|------|
| prefix | "" | 접두사 (예: "EMP", "HR") |
| includeYear | true | 연도 포함 여부 |
| yearFormat | "YYYY" | 연도 형식 (YY 또는 YYYY) |
| sequenceDigits | 4 | 시퀀스 자릿수 |
| separator | "-" | 구분자 |
| sequenceResetPolicy | "YEARLY" | YEARLY: 매년 리셋, NEVER: 계속 증가 |
| allowReuse | false | 퇴사자 사번 재사용 허용 여부 |

**생성 예시:**
```
prefix="EMP", yearFormat="YYYY", sequenceDigits=4, separator="-"
→ EMP-2026-0001, EMP-2026-0002, ...

prefix="", yearFormat="YY", sequenceDigits=5, separator=""
→ 2600001, 2600002, ...
```

**동시성 제어:**
- `EmployeeNumberRuleRepository.findActiveByTenantIdForUpdate()`
- `@Lock(LockModeType.PESSIMISTIC_WRITE)` 비관적 잠금
- 시퀀스 증가 + 사번 생성 + 저장이 하나의 트랜잭션

### 3.4 겸직/소속 관리

**소속 유형:**
| 유형 | 설명 |
|------|------|
| PRIMARY | 주 소속 (테넌트당 1개, 유니크 인덱스) |
| SECONDARY | 부 소속 |
| CONCURRENT | 겸직 |

**규칙:**
- 직원당 반드시 1개의 PRIMARY 소속 필요
- PRIMARY 활성 소속 유니크 인덱스: `(tenant_id, employee_id) WHERE is_primary = true AND is_active = true`
- 소속 해제 시 소프트 삭제 (isActive=false, endDate 설정)
- 소속 변경 시 `EmployeeAffiliationChangedEvent` 발행

### 3.5 전출/전입 워크플로우

```
DRAFT ──→ PENDING ──→ SOURCE_APPROVED ──→ APPROVED ──→ COMPLETED
  │         │            │                   │
  │         │            │                   └──→ CANCELLED (취소)
  │         │            └──→ REJECTED (거부)
  │         └──→ REJECTED (거부)
  │
  └──→ CANCELLED (취소)
```

| 상태 | 수정 | 삭제 | 설명 |
|------|------|------|------|
| DRAFT | ✅ | ✅ | 임시저장 |
| PENDING | ❌ | ❌ | 제출 (전출 테넌트 승인 대기) |
| SOURCE_APPROVED | ❌ | ❌ | 전출 승인 (전입 테넌트 승인 대기) |
| APPROVED | ❌ | ❌ | 최종 승인 (완료 처리 대기) |
| COMPLETED | ❌ | ❌ | 완료 (직원 이동 처리됨) |
| REJECTED | ❌ | ❌ | 거부 |
| CANCELLED | ❌ | ❌ | 취소 |

**RLS 특수 정책:**
- `transfer_request`는 `tenant_id` OR `source_tenant_id` OR `target_tenant_id` 조건
- 전출/전입 양쪽 테넌트 모두 조회 가능

### 3.6 경조비 시스템

**경조사 유형:**
| 분류 | 유형 | 설명 |
|------|------|------|
| 경사 | MARRIAGE | 결혼 |
| 경사 | CHILD_BIRTH | 출산 |
| 경사 | CHILD_FIRST_BIRTHDAY | 돌 |
| 조사 | DEATH_PARENT | 부모 사망 |
| 조사 | DEATH_SPOUSE | 배우자 사망 |
| 조사 | DEATH_CHILD | 자녀 사망 |
| 조사 | DEATH_GRANDPARENT | 조부모 사망 |
| 조사 | DEATH_SIBLING | 형제자매 사망 |
| 조사 | DEATH_IN_LAW | 시부모/장인장모 사망 |
| 기타 | HOSPITALIZATION | 입원 |
| 기타 | DISASTER | 재해 |
| 기타 | OTHER | 기타 |

**경조비 신청 생명주기:**
```
PENDING ──→ APPROVED ──→ PAID
  │            │
  │            └──→ (지급 대기)
  │
  ├──→ REJECTED
  │
  └──→ CANCELLED
```

**정책 기반 금액/휴가 자동 설정:**
- 신청 시 `policyId` 참조하여 금액/휴가일수 자동 적용
- 테넌트별 독립적 경조비 정책 관리

### 3.7 인사기록카드 (Record Card)

**포함 정보:**
- 기본정보 (이름, 사번, 부서, 직급, 입사일, 이메일, 연락처, 상태, 고용유형)
- 관리자 정보 (이름, 사번)
- 근속연수 자동 계산
- 인사이력 목록
- 가족정보 목록
- 경력사항 목록
- 학력사항 목록
- 자격증 목록

**PDF 생성:**
- Apache PDFBox 3.0.1 사용
- A4 사이즈, 멀티페이지 지원
- 자동 페이지 넘김 (섹션이 남은 공간 부족 시)
- TODO: 한국어 폰트 임베딩 필요 (NanumGothic TTF)

### 3.8 본인정보 변경요청

**워크플로우:**
```
직원이 변경 요청 → PENDING → 관리자 승인 → APPROVED → 직원 정보 반영
                     │
                     └→ 관리자 거부 → REJECTED
```

**변경 가능 필드:**
- phone, mobile, email, address 등 본인이 변경 가능한 개인정보
- 부서, 직급, 직책 등 인사정보는 관리자만 직접 변경

---

## 4. API 엔드포인트 목록

### 4.1 직원 기본 API (`/api/v1/employees`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/me` | 인증 | 본인 정보 조회 |
| GET | `/{id}` | 인증 | 직원 상세 조회 |
| GET | `/employee-number/{employeeNumber}` | 인증 | 사번으로 조회 |
| GET | (search) | HR_MANAGER+ | 직원 검색 (페이징) |
| POST | | HR_MANAGER+ | 직원 생성 |
| PUT | `/{id}` | HR_MANAGER+ | 직원 수정 |
| DELETE | `/{id}` | HR_MANAGER+ | 직원 삭제 (→ 소프트 삭제로 변경 예정) |
| POST | `/{id}/resign` | HR_MANAGER+ | 퇴사 처리 |
| POST | `/{id}/resign/cancel` | HR_MANAGER+ | 퇴사 취소 |
| POST | `/{id}/unmask` | HR_MANAGER+ | 마스킹 해제 |
| GET | `/export` | HR_MANAGER+ | Excel 내보내기 (TODO) |
| POST | `/import` | HR_MANAGER+ | Excel 가져오기 (TODO) |
| GET | `/import/template` | HR_MANAGER+ | 가져오기 템플릿 다운로드 (TODO) |
| POST | `/bulk-delete` | HR_MANAGER+ | 일괄 삭제 |

### 4.2 직원 상세정보 API (`/api/v1/employees/{employeeId}`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | `/careers` | HR_MANAGER+ | 경력 추가 |
| GET | `/careers` | 인증 | 경력 목록 |
| DELETE | `/careers/{careerId}` | HR_MANAGER+ | 경력 삭제 |
| POST | `/educations` | HR_MANAGER+ | 학력 추가 |
| GET | `/educations` | 인증 | 학력 목록 |
| DELETE | `/educations/{educationId}` | HR_MANAGER+ | 학력 삭제 |
| POST | `/certificates` | HR_MANAGER+ | 자격증 추가 |
| GET | `/certificates` | 인증 | 자격증 목록 |
| DELETE | `/certificates/{certificateId}` | HR_MANAGER+ | 자격증 삭제 |

### 4.3 인사이력 API (`/api/v1/employees/{employeeId}/histories`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | | 인증 | 인사이력 목록 |
| POST | | HR_MANAGER+ | 인사이력 추가 |

### 4.4 가족정보 API (`/api/v1/employees/{employeeId}/family`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | | 인증 | 가족 목록 |
| POST | | 인증 (본인) | 가족 추가 |
| PUT | `/{familyId}` | 인증 (본인) | 가족 수정 |
| DELETE | `/{familyId}` | 인증 (본인) | 가족 삭제 |

### 4.5 겸직/소속 API (`/api/v1/employees/{employeeId}/affiliations`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | | 인증 | 소속 목록 |
| POST | | HR_MANAGER+ | 소속 추가 |
| PUT | `/{affiliationId}` | HR_MANAGER+ | 소속 수정 |
| DELETE | `/{affiliationId}` | HR_MANAGER+ | 소속 해제 (비활성화) |

### 4.6 인사기록카드 API (`/api/v1/employees/{employeeId}/record-card`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | | HR_MANAGER+ | 인사기록카드 조회 (JSON) |
| GET | `/pdf` | HR_MANAGER+ | 인사기록카드 PDF 다운로드 |

### 4.7 일괄 처리 API (`/api/v1/employees/bulk`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | | HR_MANAGER+ | 일괄 등록 (최대 1000건) |
| POST | `/validate` | HR_MANAGER+ | 검증만 (실제 저장 안 함) |

### 4.8 사번 규칙 API (`/api/v1/employees/number-rules`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | | TENANT_ADMIN+ | 현재 사번 규칙 조회 |
| POST | | TENANT_ADMIN+ | 사번 규칙 생성/수정 |

### 4.9 본인정보 변경 API (`/api/v1/employees/me/change-requests`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | | 인증 (본인) | 변경 요청 목록 |
| POST | | 인증 (본인) | 변경 요청 생성 |
| POST | `/{id}/approve` | HR_MANAGER+ | 변경 요청 승인 |
| POST | `/{id}/reject` | HR_MANAGER+ | 변경 요청 거부 |

### 4.10 경조비 API (`/api/v1/condolences`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | | 인증 | 경조비 신청 |
| GET | `/{id}` | 인증 | 경조비 신청 상세 |
| GET | | HR_MANAGER+ | 전체 신청 목록 (페이징) |
| GET | `/my` | 인증 | 본인 신청 목록 |
| PUT | `/{id}` | 인증 | 신청 수정 (PENDING만) |
| DELETE | `/{id}` | 인증 | 신청 삭제 |
| POST | `/{id}/cancel` | 인증 | 신청 취소 |
| POST | `/{id}/approve` | HR_MANAGER+ | 승인 |
| POST | `/{id}/reject` | HR_MANAGER+ | 반려 |
| GET | `/policies` | 인증 | 경조비 정책 목록 |
| GET | `/policies/{id}` | 인증 | 경조비 정책 상세 |
| POST | `/policies` | HR_MANAGER+ | 정책 생성 |
| PUT | `/policies/{id}` | HR_MANAGER+ | 정책 수정 |
| DELETE | `/policies/{id}` | HR_MANAGER+ | 정책 삭제 |

### 4.11 전출/전입 API (`/api/v1/transfers`)

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| POST | | HR_MANAGER+ | 전출 요청 생성 |
| GET | `/{id}` | HR_MANAGER+ | 전출 요청 상세 |
| GET | | HR_MANAGER+ | 전출 요청 목록 (페이징) |
| GET | `/summary` | HR_MANAGER+ | 전출/전입 요약 (대기건수) |
| PUT | `/{id}` | HR_MANAGER+ | 요청 수정 (DRAFT만) |
| DELETE | `/{id}` | HR_MANAGER+ | 요청 삭제 (DRAFT만) |
| POST | `/{id}/submit` | HR_MANAGER+ | 제출 |
| POST | `/{id}/approve-source` | TENANT_ADMIN+ | 전출 승인 |
| POST | `/{id}/approve-target` | TENANT_ADMIN+ | 전입 승인 |
| POST | `/{id}/reject` | TENANT_ADMIN+ | 거부 |
| POST | `/{id}/complete` | TENANT_ADMIN+ | 완료 처리 |
| POST | `/{id}/cancel` | HR_MANAGER+ | 취소 |
| GET | `/available-tenants` | HR_MANAGER+ | 전입 가능 계열사 목록 |
| GET | `/tenants/{tenantId}/departments` | HR_MANAGER+ | 대상 테넌트 부서 목록 |
| GET | `/tenants/{tenantId}/positions` | HR_MANAGER+ | 대상 테넌트 직책 목록 |
| GET | `/tenants/{tenantId}/grades` | HR_MANAGER+ | 대상 테넌트 직급 목록 |

---

## 5. 데이터 모델

### 5.1 엔티티 구조

```
Employee (employee)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── employee_number: VARCHAR(50) — 사번
├── name: VARCHAR(100) — 이름
├── name_en: VARCHAR(100) — 영문 이름
├── email: VARCHAR(200) — 이메일
├── phone: VARCHAR(20) — 유선전화
├── mobile: VARCHAR(20) — 휴대전화
├── department_id: UUID — 소속 부서
├── position_code: VARCHAR(50) — 직책 코드
├── job_title_code: VARCHAR(50) — 직급 코드
├── hire_date: DATE — 입사일
├── resign_date: DATE — 퇴사일
├── status: VARCHAR(20) — ACTIVE/SUSPENDED/ON_LEAVE/RESIGNED
├── employment_type: VARCHAR(20) — REGULAR/CONTRACT/PART_TIME/INTERN
├── manager_id: UUID — 직속 상관
├── user_id: UUID — 인증 계정 연결
├── resident_number: VARCHAR(20) — 주민등록번호 (암호화 필요)
├── created_at, updated_at, created_by, updated_by
└── UNIQUE(tenant_id, employee_number)

EmployeeHistory (employee_history)
├── id: UUID (PK)
├── employee_id: UUID (FK → employee)
├── tenant_id: UUID (NOT NULL, RLS)
├── change_type: VARCHAR(50) — HIRE/TRANSFER/PROMOTION/GRADE_CHANGE/POSITION_CHANGE/RESIGN/RETURN/LEAVE
├── field_name: VARCHAR(100)
├── old_value: TEXT
├── new_value: TEXT
├── changed_at: TIMESTAMPTZ
├── changed_by: VARCHAR(100)
├── change_reason: VARCHAR(500)
├── from_department_id, to_department_id: UUID
├── from_department_name, to_department_name: VARCHAR(200)
├── from_grade_code, to_grade_code: VARCHAR(50)
├── from_grade_name, to_grade_name: VARCHAR(100)
├── from_position_code, to_position_code: VARCHAR(50)
├── from_position_name, to_position_name: VARCHAR(100)
├── effective_date: DATE — 발령일
├── order_number: VARCHAR(100) — 발령 번호
├── reason: VARCHAR(500)
├── remarks: VARCHAR(1000)
└── created_at, updated_at

EmployeeFamily (employee_family)
├── id: UUID (PK)
├── employee_id: UUID (FK → employee)
├── tenant_id: UUID (NOT NULL, RLS)
├── relation: VARCHAR(20) — SPOUSE/CHILD/PARENT/SIBLING/GRANDPARENT/OTHER
├── name: VARCHAR(100)
├── birth_date: DATE
├── phone: VARCHAR(30)
├── is_dependent: BOOLEAN — 부양가족 여부
├── occupation: VARCHAR(100)
├── is_cohabiting: BOOLEAN — 동거 여부
├── remarks: VARCHAR(500)
└── created_at, updated_at

EmployeeEducation (employee_education)
├── id: UUID (PK)
├── employee_id: UUID (FK → employee)
├── tenant_id: UUID (NOT NULL, RLS)
├── school_name: VARCHAR(200)
├── school_type: VARCHAR(30)
├── degree: VARCHAR(50)
├── major: VARCHAR(200)
├── start_date, end_date: DATE
├── graduation_status: VARCHAR(30)
├── is_verified: BOOLEAN — 학력 검증 여부
└── created_at, updated_at

EmployeeCareer (employee_career)
├── id: UUID (PK)
├── employee_id: UUID (FK → employee)
├── tenant_id: UUID (NOT NULL, RLS)
├── company_name: VARCHAR(200)
├── department: VARCHAR(200)
├── position: VARCHAR(100)
├── start_date, end_date: DATE
├── job_description: TEXT
├── resignation_reason: VARCHAR(500)
├── is_verified: BOOLEAN
└── created_at, updated_at

EmployeeCertificate (employee_certificate)
├── id: UUID (PK)
├── employee_id: UUID (FK → employee)
├── tenant_id: UUID (NOT NULL, RLS)
├── certificate_name: VARCHAR(200)
├── issuing_organization: VARCHAR(200)
├── issue_date, expiry_date: DATE
├── certificate_number: VARCHAR(100)
├── grade: VARCHAR(50)
├── is_verified: BOOLEAN
└── created_at, updated_at

EmployeeAffiliation (employee_affiliation)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── employee_id: UUID (FK → employee)
├── department_id: UUID
├── department_name: VARCHAR(200)
├── position_code: VARCHAR(50)
├── position_name: VARCHAR(200)
├── is_primary: BOOLEAN — 주 소속 여부
├── affiliation_type: VARCHAR(20) — PRIMARY/SECONDARY/CONCURRENT
├── start_date, end_date: DATE
├── is_active: BOOLEAN
├── created_at, updated_at
└── UNIQUE INDEX (tenant_id, employee_id) WHERE is_primary AND is_active

EmployeeNumberRule (employee_number_rule)
├── id: UUID (PK)
├── tenant_id: UUID (UNIQUE) — 테넌트당 1개
├── prefix: VARCHAR(10) — 접두사
├── include_year: BOOLEAN — 연도 포함
├── year_format: VARCHAR(4) — YY or YYYY
├── sequence_digits: INTEGER — 시퀀스 자릿수
├── sequence_reset_policy: VARCHAR(10) — YEARLY or NEVER
├── current_sequence: INTEGER — 현재 시퀀스
├── current_year: INTEGER — 현재 연도
├── separator: VARCHAR(5) — 구분자
├── allow_reuse: BOOLEAN — 사번 재사용 허용
├── is_active: BOOLEAN
└── created_at, updated_at

EmployeeChangeRequest (employee_change_request)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── employee_id: UUID (FK → employee)
├── field_name: VARCHAR(50)
├── old_value: VARCHAR(500)
├── new_value: VARCHAR(500)
├── status: VARCHAR(20) — PENDING/APPROVED/REJECTED
├── approval_document_id: UUID
├── reason: VARCHAR(500)
└── created_at, updated_at

CondolencePolicy (condolence_policy)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── event_type: VARCHAR(30) — CondolenceEventType enum
├── name: VARCHAR(100)
├── description: TEXT
├── amount: DECIMAL(15,2)
├── leave_days: INTEGER
├── is_active: BOOLEAN
├── sort_order: INTEGER
└── created_at, updated_at

CondolenceRequest (condolence_request)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS)
├── employee_id: UUID (FK nullable)
├── employee_name: VARCHAR(100)
├── department_name: VARCHAR(200)
├── policy_id: UUID (FK → condolence_policy)
├── event_type: VARCHAR(30)
├── event_date: DATE
├── description: TEXT
├── relation: VARCHAR(50) — 관계
├── related_person_name: VARCHAR(100)
├── amount: DECIMAL(15,2)
├── leave_days: INTEGER
├── status: VARCHAR(20) — PENDING/APPROVED/REJECTED/PAID/CANCELLED
├── approval_id: UUID — 결재 서비스 연동 ID
├── paid_date: DATE — 지급일
├── reject_reason: VARCHAR(500)
└── created_at, updated_at

TransferRequest (transfer_request)
├── id: UUID (PK)
├── tenant_id: UUID (NOT NULL, RLS 다중 조건)
├── employee_id, employee_name, employee_number
├── source_tenant_id, source_tenant_name
├── source_department_id, source_department_name
├── source_position_id, source_position_name
├── source_grade_id, source_grade_name
├── target_tenant_id, target_tenant_name
├── target_department_id, target_department_name
├── target_position_id, target_position_name
├── target_grade_id, target_grade_name
├── transfer_date: DATE
├── reason: TEXT
├── status: VARCHAR(20) — DRAFT/PENDING/SOURCE_APPROVED/APPROVED/COMPLETED/REJECTED/CANCELLED
├── source_approver_id, source_approver_name, source_approved_at
├── target_approver_id, target_approver_name, target_approved_at
├── reject_reason: TEXT
├── completed_at: TIMESTAMPTZ
└── created_at, updated_at
```

---

## 6. 설정값 목록

### 6.1 application.yml

```yaml
server:
  port: 8084

spring:
  application:
    name: employee-service
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/hr_saas
  jpa:
    hibernate:
      ddl-auto: update  # ⚠️ 프로덕션: validate로 변경 필요 (EMP-G07)
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

feign:
  client:
    tenant-service:
      url: ${TENANT_SERVICE_URL:http://localhost:8082}
    organization-service:
      url: ${ORGANIZATION_SERVICE_URL:http://localhost:8083}
```

### 6.2 빌드 의존성

```groovy
dependencies {
    // Common 모듈 전체 (core, entity, response, database, tenant, security, privacy, cache, event)
    // Spring Boot (web, jpa, validation, security, redis)
    // Spring Cloud (openfeign, circuitbreaker-resilience4j)
    // PostgreSQL, Flyway
    // Apache PDFBox 3.0.1 — PDF 생성
    // SpringDoc OpenAPI
    // TestContainers
}
```

### 6.3 에러 코드

| 코드 | 설명 |
|------|------|
| EMP_001 | 직원을 찾을 수 없음 |
| EMP_002 | 사번 중복 |
| EMP_003 | 이메일 중복 |
| EMP_004 | 퇴사 상태만 퇴사 취소 가능 |
| EMP_005 | 마스킹 해제 미지원 필드 |
| EMP_010 | PDF 생성 실패 |
| EMP_020 | 전출 요청 수정 불가 상태 |
| EMP_021 | 전출 요청 삭제 불가 상태 |
| EMP_022 | 전출 요청 제출 불가 상태 |
| EMP_023 | 전출 대기 상태만 승인 가능 |
| EMP_024 | 전출 승인 후에만 전입 승인 가능 |
| EMP_025 | 거부 불가 상태 |
| EMP_026 | 승인 상태만 완료 가능 |
| EMP_027 | 완료된 요청 취소 불가 |
| EMP_028 | 전출/전입 요청 조회 실패 |
| EMP_030 | 열람 사유 미입력 (추가 예정) |

### 6.4 캐시 키

| 캐시 이름 | TTL | 무효화 조건 |
|-----------|-----|------------|
| `CacheNames.EMPLOYEE` | 1h | 직원 CUD, 퇴사, 소속 변경 |

---

## 7. 갭 구현 사양

### EMP-G01: 경조비 → 결재 서비스 연동 (HIGH)

**구현:**
1. `ApprovalClient` Feign 인터페이스:
   ```java
   @FeignClient(name = "approval-service")
   public interface ApprovalClient {
       @PostMapping("/api/v1/approvals")
       ApiResponse<ApprovalResponse> createApproval(@RequestBody CreateApprovalRequest request);
   }
   ```
2. `CondolenceServiceImpl.create()`:
   - 경조비 신청 생성 후 approval-service에 결재 요청 생성
   - 결재 유형: `CONDOLENCE_REQUEST`
   - 참조 ID: `condolenceRequest.id`
3. `approval.completed` 이벤트 구독 → 승인/반려 상태 업데이트
4. CircuitBreaker: approval-service 장애 시 신청은 허용하되 결재 연동은 비동기 재시도

### EMP-G02: 전출 완료 시 자동 처리 (HIGH)

**구현:**
1. `TransferServiceImpl.complete()` 확장:
   ```java
   public TransferRequestResponse complete(UUID id) {
       // 1. 대상 테넌트에 직원 생성
       TenantContext.setCurrentTenant(request.getTargetTenantId());
       String newEmployeeNumber = employeeNumberGenerator.generate();
       Employee newEmployee = Employee.builder()
           .employeeNumber(newEmployeeNumber)
           .name(request.getEmployeeName())
           .departmentId(request.getTargetDepartmentId())
           .positionCode(request.getTargetPositionName())
           .jobTitleCode(request.getTargetGradeName())
           .hireDate(request.getTransferDate())
           .build();
       employeeRepository.save(newEmployee);

       // 2. 원본 직원 퇴사 처리
       TenantContext.setCurrentTenant(request.getSourceTenantId());
       Employee sourceEmployee = findById(request.getEmployeeId());
       sourceEmployee.resign(request.getTransferDate());
       employeeRepository.save(sourceEmployee);

       // 3. 이벤트 발행
       eventPublisher.publish(TransferCompletedEvent.of(request));
   }
   ```
2. Saga 패턴: 대상 생성 실패 시 원본 퇴사 롤백
3. 이력 기록: 양쪽 테넌트에 인사이력 추가

### EMP-G03: 물리 삭제 → 소프트 삭제 전환 (HIGH)

**구현:**
```java
// EmployeeServiceImpl.delete()
public void delete(UUID id) {
    Employee employee = findById(id);
    employee.resign(LocalDate.now());
    employeeRepository.save(employee);
    log.info("Employee soft-deleted: id={}", id);
}

// EmployeeServiceImpl.bulkDelete()
public int bulkDelete(List<UUID> ids) {
    int count = 0;
    for (UUID id : ids) {
        try {
            Employee employee = findById(id);
            employee.resign(LocalDate.now());
            employeeRepository.save(employee);
            count++;
        } catch (NotFoundException e) {
            log.warn("Employee not found for bulk resign: id={}", id);
        }
    }
    return count;
}
```

### EMP-G04: 마스킹 해제 감사 로그 (HIGH)

**구현:**
1. `PrivacyAccessLog` 엔티티 + 테이블:
   ```sql
   CREATE TABLE hr_core.privacy_access_log (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       tenant_id UUID NOT NULL,
       actor_id UUID NOT NULL,
       actor_name VARCHAR(100),
       employee_id UUID NOT NULL,
       field_name VARCHAR(50) NOT NULL,
       reason TEXT NOT NULL,
       accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       ip_address VARCHAR(45),
       user_agent VARCHAR(500)
   );
   ```
2. `EmployeeServiceImpl.unmask()`:
   - 권한 체크 추가 (`employee:unmask:{field}`)
   - 사유 최소 10자 검증
   - 감사 로그 비동기 저장 (`@Async`)
   - 주민번호 열람 시 notification-service 알림

### EMP-G05: Excel Import/Export (MEDIUM)

**구현:**
- Apache POI 라이브러리 추가
- `exportToExcel()`: 검색 조건에 맞는 직원 목록 Excel 생성
- `importFromExcel()`: Excel 파싱 → 검증 → 일괄 등록
- `getImportTemplate()`: 헤더 + 입력 가이드가 포함된 빈 Excel 파일

### EMP-G06: PDF 한글 폰트 (MEDIUM)

**구현:**
1. `src/main/resources/fonts/NanumGothic.ttf` 폰트 파일 추가
2. `RecordCardServiceImpl.generateRecordCardPdf()`:
   ```java
   InputStream fontStream = getClass().getResourceAsStream("/fonts/NanumGothic.ttf");
   PDType0Font koreanFont = PDType0Font.load(document, fontStream);
   // 이후 모든 텍스트에 koreanFont 사용
   ```

### EMP-G07: ddl-auto 변경 (HIGH)

**구현:**
- `application.yml`: `jpa.hibernate.ddl-auto: validate`
- 모든 스키마 변경은 Flyway 마이그레이션으로 관리
- 프로파일별 설정: dev=update, staging/prod=validate

### EMP-G11: 주민번호 암호화 (HIGH)

**구현:**
1. Employee 엔티티:
   ```java
   @Encrypted
   @Column(name = "resident_number", length = 200) // 암호화 시 길이 증가
   private String residentNumber;
   ```
2. `common-privacy` 모듈의 `@Encrypted` 어노테이션 + JPA AttributeConverter 적용
3. DB 마이그레이션: 기존 평문 데이터 암호화 변환 스크립트

### EMP-G13: 직원 수 카운트 API (MEDIUM)

**구현:**
```java
// EmployeeController
@GetMapping("/count")
public ResponseEntity<ApiResponse<Long>> countByDepartmentId(
        @RequestParam UUID departmentId) {
    long count = employeeService.countByDepartment(departmentId);
    return ResponseEntity.ok(ApiResponse.success(count));
}

// EmployeeRepository
long countByDepartmentIdAndStatus(UUID departmentId, EmployeeStatus status);
```
- organization-service의 부서 삭제 검증에서 호출

---

## 8. 테스트 시나리오

### 8.1 단위 테스트

#### EmployeeService
| 시나리오 | 검증 내용 |
|----------|-----------|
| create_validRequest_createsEmployee | 정상 생성 + 이벤트 발행 |
| create_duplicateEmployeeNumber_throwsEMP002 | 사번 중복 시 예외 |
| create_duplicateEmail_throwsEMP003 | 이메일 중복 시 예외 |
| resign_activeEmployee_changesStatus | 퇴사 처리 + resignDate 설정 |
| cancelResign_nonResigned_throwsEMP004 | 재직 중 직원 퇴사 취소 시 예외 |
| delete_softDelete_changesStatusToResigned | 삭제 시 소프트 삭제 (RESIGNED) |
| unmask_validField_returnsValue | 마스킹 해제 정상 동작 |
| unmask_invalidField_throwsEMP005 | 미지원 필드 마스킹 해제 시 예외 |
| unmask_shortReason_throwsValidation | 사유 10자 미만 시 예외 |

#### TransferService
| 시나리오 | 검증 내용 |
|----------|-----------|
| create_validRequest_draftStatus | 생성 시 DRAFT 상태 |
| submit_draftRequest_changesPending | 제출 시 PENDING 변경 |
| approveSource_pendingRequest_changesSourceApproved | 전출 승인 |
| approveTarget_sourceApproved_changesApproved | 전입 승인 |
| approveTarget_notSourceApproved_throwsEMP024 | 전출 미승인 상태에서 전입 승인 시 예외 |
| update_nonDraft_throwsEMP020 | DRAFT 아닌 상태 수정 시 예외 |
| delete_nonDraft_throwsEMP021 | DRAFT 아닌 상태 삭제 시 예외 |
| complete_approved_completesTransfer | 완료 처리 + 직원 이동 |
| cancel_completed_throwsEMP027 | 완료 후 취소 시 예외 |
| getAvailableTenants_excludesCurrent | 현재 테넌트 제외한 목록 |
| getAvailableTenants_serviceFail_returnsFallback | 서비스 장애 시 폴백 데이터 |

#### CondolenceService
| 시나리오 | 검증 내용 |
|----------|-----------|
| create_withPolicy_setsAmountAndLeaveDays | 정책 기반 금액/휴가 자동 설정 |
| approve_pendingRequest_changesApproved | 승인 처리 |
| reject_pendingRequest_changesRejected | 반려 + 사유 기록 |
| markAsPaid_approved_changesPaid | 지급 완료 처리 |
| update_nonPending_throwsValidation | PENDING 아닌 상태 수정 시 예외 |

#### EmployeeNumberGenerator
| 시나리오 | 검증 내용 |
|----------|-----------|
| generate_yearlyReset_resetsOnNewYear | 연도 변경 시 시퀀스 리셋 |
| generate_neverReset_continues | NEVER 정책 시 시퀀스 계속 증가 |
| generate_withPrefix_formatsCorrectly | 접두사+연도+시퀀스 올바른 포맷 |
| generate_concurrent_noConflict | 동시 호출 시 중복 없음 (비관적 잠금) |

#### RecordCardService
| 시나리오 | 검증 내용 |
|----------|-----------|
| getRecordCard_aggregatesAllInfo | 직원+이력+가족+경력+학력+자격증 포함 |
| getRecordCard_calculatesServiceYears | 근속연수 정확히 계산 |
| generatePdf_createsValidPdf | PDF 바이트 배열 반환 |

### 8.2 통합 테스트

| 시나리오 | 검증 내용 |
|----------|-----------|
| employeeCRUD_fullLifecycle | 생성→수정→퇴사→퇴사취소 전체 흐름 |
| transferWorkflow_draftToCompleted | 전출 생성→제출→전출승인→전입승인→완료 |
| condolenceWorkflow_requestToPaid | 경조비 신청→승인→지급 완료 |
| bulkCreate_maxItems_succeeds | 1000건 일괄 등록 성공 |
| bulkCreate_exceeds_fails | 1001건 일괄 등록 실패 |
| tenantIsolation_employeesNotShared | 테넌트 간 직원 데이터 격리 |
| transferRLS_bothTenantsCanView | 전출/전입 양측 테넌트 조회 가능 |
| affiliationPrimary_uniqueConstraint | 동일 테넌트 내 주 소속 1개 제약 |
| employeeNumberGeneration_concurrent | 동시 사번 생성 시 중복 없음 |

---

## 9. 의존성

### 9.1 이 모듈이 의존하는 모듈

| 모듈 | 용도 |
|------|------|
| common-core | BusinessException, NotFoundException, ValidationException, DuplicateException |
| common-entity | BaseEntity, AuditableEntity, TenantAwareEntity |
| common-response | ApiResponse, PageResponse |
| common-database | RLS Interceptor, Flyway config |
| common-tenant | TenantContext, TenantFilter |
| common-security | SecurityContextHolder, PermissionChecker, JWT |
| common-privacy | PrivacyContext, @Masked, @Encrypted |
| common-cache | Redis 설정, CacheNames |
| common-event | DomainEvent, EventPublisher |

### 9.2 이 모듈에 의존하는 모듈

| 모듈 | 사용 기능 |
|------|-----------|
| organization-service | 부서별 직원 수 조회 (ORG-G01), 직원 부서 이동 |
| attendance-service | 직원 정보 조회, 근태 대상 확인 |
| approval-service | 결재 대상 직원 정보 조회 |
| notification-service | 알림 대상 직원 조회 |
| 프론트엔드 | 직원 목록, 상세, 인사기록카드, 경조비, 전출입 |

### 9.3 외부 서비스 연동 (Feign Client)

| 클라이언트 | 대상 | API | 용도 |
|-----------|------|-----|------|
| TenantServiceClient | tenant-service | `GET /api/v1/tenants` | 전출 시 계열사 목록 조회 |
| OrganizationServiceClient | organization-service | `GET /api/v1/departments` | 대상 테넌트 부서 목록 |
| OrganizationServiceClient | organization-service | `GET /api/v1/positions` | 대상 테넌트 직책 목록 |
| OrganizationServiceClient | organization-service | `GET /api/v1/grades` | 대상 테넌트 직급 목록 |
| ApprovalClient (추가 예정) | approval-service | `POST /api/v1/approvals` | 경조비/변경요청 결재 생성 |

**폴백 전략:**
- 모든 Feign Client에 try-catch 폴백 구현
- 서비스 장애 시 하드코딩된 기본 데이터 반환
- CircuitBreaker 적용 예정 (`@CircuitBreaker`)

### 9.4 이벤트 연동

**발행하는 이벤트:**
| 이벤트 | 토픽 | 페이로드 |
|--------|------|----------|
| EmployeeCreatedEvent | `EventTopics.EMPLOYEE_CREATED` | employeeId, employeeNumber, name, tenantId |
| EmployeeAffiliationChangedEvent | `EventTopics.AFFILIATION_CHANGED` | employeeId, affiliationType, departmentId |
| TransferCompletedEvent (추가 예정) | `hr-saas.employee.transfer-completed` | transferRequestId, sourceEmployeeId, targetEmployeeId |

**구독하는 이벤트:**
| 이벤트 | 토픽 | 처리 |
|--------|------|------|
| ApprovalCompletedEvent (추가 예정) | `hr-saas.approval.completed` | 경조비/변경요청 승인/반려 업데이트 |

---

## 10. 주요 코드 파일 위치

```
services/employee-service/src/main/java/com/hrsaas/employee/
├── config/
│   └── SecurityConfig.java
├── client/
│   ├── TenantServiceClient.java (Feign)
│   ├── OrganizationServiceClient.java (Feign)
│   ├── FeignClientConfig.java (JWT 헤더 전파)
│   └── dto/
│       ├── TenantClientResponse.java
│       ├── DepartmentClientResponse.java
│       ├── PositionClientResponse.java
│       └── GradeClientResponse.java
├── controller/
│   ├── EmployeeController.java
│   ├── EmployeeDetailController.java
│   ├── EmployeeHistoryController.java
│   ├── EmployeeFamilyController.java
│   ├── EmployeeBulkController.java
│   ├── RecordCardController.java
│   ├── CondolenceController.java
│   ├── TransferController.java
│   ├── AffiliationController.java
│   ├── EmployeeNumberRuleController.java
│   └── EmployeeChangeRequestController.java
├── domain/
│   ├── dto/
│   │   ├── request/ (18 files)
│   │   └── response/ (16 files)
│   ├── entity/
│   │   ├── Employee.java
│   │   ├── EmployeeStatus.java (enum)
│   │   ├── EmploymentType.java (enum)
│   │   ├── EmployeeHistory.java
│   │   ├── HistoryChangeType.java (enum)
│   │   ├── EmployeeFamily.java
│   │   ├── FamilyRelationType.java (enum)
│   │   ├── EmployeeEducation.java
│   │   ├── EmployeeCareer.java
│   │   ├── EmployeeCertificate.java
│   │   ├── EmployeeAffiliation.java
│   │   ├── EmployeeNumberRule.java
│   │   ├── EmployeeChangeRequest.java
│   │   ├── CondolencePolicy.java
│   │   ├── CondolenceRequest.java
│   │   ├── CondolenceEventType.java (enum)
│   │   ├── CondolenceStatus.java (enum)
│   │   ├── TransferRequest.java
│   │   └── TransferStatus.java (enum)
│   └── event/
│       ├── EmployeeCreatedEvent.java
│       └── EmployeeAffiliationChangedEvent.java
├── repository/
│   ├── EmployeeRepository.java
│   ├── EmployeeHistoryRepository.java
│   ├── EmployeeFamilyRepository.java
│   ├── EmployeeCareerRepository.java
│   ├── EmployeeEducationRepository.java
│   ├── EmployeeCertificateRepository.java
│   ├── EmployeeAffiliationRepository.java
│   ├── EmployeeNumberRuleRepository.java
│   ├── EmployeeChangeRequestRepository.java
│   ├── CondolencePolicyRepository.java
│   ├── CondolenceRequestRepository.java
│   └── TransferRequestRepository.java
├── service/
│   ├── EmployeeService.java
│   ├── EmployeeDetailService.java
│   ├── EmployeeHistoryService.java
│   ├── EmployeeFamilyService.java
│   ├── EmployeeBulkService.java
│   ├── RecordCardService.java
│   ├── CondolenceService.java
│   ├── TransferService.java
│   ├── AffiliationService.java
│   ├── EmployeeNumberGenerator.java
│   ├── EmployeeChangeRequestService.java
│   └── impl/
│       ├── EmployeeServiceImpl.java
│       ├── EmployeeDetailServiceImpl.java
│       ├── EmployeeHistoryServiceImpl.java
│       ├── EmployeeFamilyServiceImpl.java
│       ├── EmployeeBulkServiceImpl.java
│       ├── RecordCardServiceImpl.java
│       ├── CondolenceServiceImpl.java
│       └── TransferServiceImpl.java
└── resources/
    ├── application.yml
    └── db/migration/
        ├── V1__init_employee.sql (9 테이블, 24 인덱스, RLS)
        └── V2__add_affiliation.sql (3 테이블: affiliation, number_rule, change_request)
```

---

## 11. 기술적 참고사항

### 11.1 DB 스키마 관리
- Employee Service: `hr_core` 스키마 (Organization Service와 동일 DB)
- `ddl-auto: update` → 프로덕션 전 `validate`로 변경 필수

### 11.2 RLS 특수 정책 (transfer_request)
- 일반 테이블: `tenant_id = current_tenant` 단일 조건
- `transfer_request`: `tenant_id OR source_tenant_id OR target_tenant_id` 다중 조건
- 전출/전입 양측 테넌트에서 모두 조회 가능

### 11.3 Feign Client 폴백
- `TransferServiceImpl`의 모든 Feign 호출에 try-catch 폴백 패턴 적용
- 하드코딩된 기본 데이터 반환 (개발/테스트 편의)
- 프로덕션: CircuitBreaker + Retry 패턴으로 전환 필요

### 11.4 물리 삭제 문제
- 현재 `EmployeeServiceImpl.delete()`가 `employeeRepository.delete(employee)` 호출
- `bulkDelete()`도 물리 삭제 수행
- employee_history, employee_family 등은 `ON DELETE CASCADE`로 연쇄 삭제
- 소프트 삭제 전환 시 연쇄 삭제 방지 필요

### 11.5 개인정보 보호
- `resident_number`: 현재 평문 저장, `@Encrypted` 적용 필요
- `PrivacyContext`: 조회 시 `setViewingEmployeeId()` 호출
- 마스킹 해제: `unmask()` API 제공, 감사 로그 미구현
- 개인정보보호법 준수: 감사 로그 5년 보존, 접근 사유 기록 필수

---

## 12. 사원증 관리 (Employee Card) — 추가 모듈

> 추가 분석일: 2026-02-06
> BE 귀속: Employee Service (서브모듈)
> BE 상태: **미구현** (FE만 존재)

### 12.1 현재 구현 상태

| 구분 | 상태 | 설명 |
|------|------|------|
| FE 목록 페이지 | ✅ 완료 | EmployeeCardListPage — 상태 탭 필터, 페이지네이션, 검색 |
| FE hooks/service | ✅ 완료 | 8개 hooks (5 Query + 3 Mutation), CRUD + 승인/분실/회수 |
| FE mock handlers | ✅ 완료 | 8개 API 엔드포인트 모킹, 5건 샘플 데이터 |
| shared-types | ✅ 완료 | EmployeeCard, CardIssueRequest, 상태/유형 enum, 한글 라벨 |
| BE 엔티티/API | ❌ 미구현 | 전체 백엔드 신규 개발 필요 |
| FE 상세 페이지 | ❌ 미구현 | 카드 상세 보기 페이지 없음 |
| FE 발급 신청 페이지 | ❌ 미구현 | 발급 요청 폼 페이지 없음 |
| FE 관리자 승인 페이지 | ❌ 미구현 | 발급 요청 승인/반려 UI 없음 |

### 12.2 정책 결정사항

#### 12.2.1 BE 서비스 귀속 ✅ 결정완료

> **결정: Employee Service 내 서브모듈로 구현**

- 패키지: `com.hrsaas.employee.card.*` (controller, service, repository, entity)
- DB 스키마: `hr_employee` (기존 Employee 스키마에 테이블 추가)
- 이유: 사원증은 직원의 부속 기능, 별도 서비스 분리 불필요

#### 12.2.2 발급 방식 ✅ 결정완료

> **결정: 입사 시 자동 발급, 분실/만료 재발급은 HR 단순 승인**

- **신규 발급 (NEW)**: 직원 등록(입사) 이벤트 수신 시 자동 생성
  - `employee.created` 이벤트 → 카드 자동 생성 (ACTIVE, 유효기간 3년)
  - 결재 불필요
- **재발급 (REISSUE)**: 분실 신고 후 재발급 요청 → HR 담당자 승인 후 발급
  - 기존 카드 회수(REVOKED) 처리 → 새 카드 발급
- **갱신 (RENEWAL)**: 만료 임박 시 갱신 → 자동 또는 HR 승인
  - 만료 30일 전 알림 → 갱신 요청 → 새 카드 발급
- Approval Service 미연동 (HR 담당자 직접 승인)

### 12.3 BE 구현 사양

#### 12.3.1 엔티티 설계

**EmployeeCard** (employee_cards 테이블)
```
id: UUID PK
tenant_id: UUID NOT NULL
card_number: VARCHAR(50) UNIQUE(tenant_id, card_number)
employee_id: UUID NOT NULL (FK → employees)
status: VARCHAR(20) — ACTIVE, EXPIRED, LOST, REVOKED, PENDING
issue_type: VARCHAR(20) — NEW, REISSUE, RENEWAL
issue_date: DATE
expiry_date: DATE
access_level: VARCHAR(20) DEFAULT 'LEVEL_1'
rfid_enabled: BOOLEAN DEFAULT false
rfid_tag: VARCHAR(100)
qr_code: VARCHAR(100)
photo_file_id: UUID (File Service 참조)
remarks: TEXT
revoked_at: TIMESTAMP
revoked_by: UUID
revoke_reason: TEXT
lost_at: TIMESTAMP
lost_location: VARCHAR(200)
lost_description: TEXT
created_at, updated_at, created_by, updated_by
```

**CardIssueRequest** (card_issue_requests 테이블)
```
id: UUID PK
tenant_id: UUID NOT NULL
request_number: VARCHAR(50) UNIQUE
employee_id: UUID NOT NULL
issue_type: VARCHAR(20) — NEW, REISSUE, RENEWAL
reason: TEXT
status: VARCHAR(20) — PENDING, APPROVED, REJECTED, ISSUED
approved_by: UUID
approved_at: TIMESTAMP
rejection_reason: TEXT
issued_card_id: UUID (발급된 카드 참조)
created_at, updated_at, created_by, updated_by
```

#### 12.3.2 API 엔드포인트

| Method | Path | 권한 | 설명 |
|--------|------|------|------|
| GET | `/api/v1/employee-cards` | HR_ADMIN+ | 전체 목록 (상태/부서 필터) |
| GET | `/api/v1/employee-cards/my` | 인증 | 내 사원증 |
| GET | `/api/v1/employee-cards/{id}` | 인증 | 상세 조회 |
| GET | `/api/v1/employee-cards/issue-requests` | HR_ADMIN+ | 발급 요청 목록 |
| POST | `/api/v1/employee-cards/issue-requests` | 인증 | 발급 요청 (재발급/갱신) |
| POST | `/api/v1/employee-cards/{id}/approve` | HR_ADMIN+ | 발급 승인 |
| POST | `/api/v1/employee-cards/{id}/revoke` | HR_ADMIN+ | 카드 회수 |
| POST | `/api/v1/employee-cards/report-lost` | 인증 | 분실 신고 |

#### 12.3.3 비즈니스 로직

**카드번호 채번**: `CARD-{YYYY}-{4자리 시퀀스}` (예: CARD-2026-0001)

**카드 상태 머신**:
```
PENDING → (승인) → ACTIVE
ACTIVE → (만료) → EXPIRED
ACTIVE → (분실신고) → LOST → (재발급) → ACTIVE (새 카드)
ACTIVE → (회수) → REVOKED
EXPIRED → (갱신) → ACTIVE (새 카드)
```

**입사 자동 발급 흐름**:
```
employee.created 이벤트 수신
  → CardIssueRequest 자동 생성 (type=NEW, status=ISSUED)
  → EmployeeCard 생성 (status=ACTIVE, expiryDate=입사일+3년)
  → 카드번호 자동 채번
```

#### 12.3.4 카드 속성

| 속성 | 설명 | 기본값 |
|------|------|--------|
| accessLevel | 출입 권한 레벨 | LEVEL_1 |
| rfidEnabled | RFID 기능 활성화 | false |
| qrCode | QR 코드값 | 자동 생성 |
| validityYears | 유효 기간 | 3년 |

### 12.4 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 입사 이벤트 수신 | 자동으로 ACTIVE 카드 생성, 유효기간 3년 |
| 2 | 분실 신고 | 카드 상태 LOST, lost_at/location 기록 |
| 3 | 재발급 요청 | PENDING 상태 요청 생성, HR 승인 대기 |
| 4 | 재발급 승인 | 기존 카드 REVOKED, 새 카드 ACTIVE 생성 |
| 5 | 만료 전 갱신 알림 | 만료 30일 전 직원에게 알림 |
| 6 | 카드 회수 | REVOKED 상태, 사유 기록 |
| 7 | 만료 카드 갱신 | EXPIRED 카드로부터 새 ACTIVE 카드 생성 |

### 12.5 의존성

| 연동 모듈 | 방식 | 내용 |
|-----------|------|------|
| Employee (자체) | 내부 | 직원 정보 참조 |
| 이벤트 수신 | SNS/SQS | employee.created → 자동 발급 |
| File Service | Feign | 사진 파일 관리 |
| Notification | 이벤트 | 만료 임박 알림, 발급 완료 알림 |

### 12.6 FE 추가 개발 필요

| 페이지 | 설명 |
|--------|------|
| EmployeeCardDetailPage | 카드 상세 + 분실신고/갱신 액션 |
| CardIssueRequestPage | 재발급/갱신 요청 폼 |
| CardIssueApprovalPage | HR 관리자 승인/반려 페이지 |
| 내 사원증 위젯 | 대시보드에 사원증 카드 미리보기 |
