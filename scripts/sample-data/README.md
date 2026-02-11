# HR SaaS 플랫폼 샘플 데이터 (v2.0)

PRD 기반 27개 프론트엔드 화면에 최적화된 샘플 데이터입니다.

## 데이터 개요

| 항목 | 규모 |
|------|------|
| 총 직원 수 | 570명 |
| 테넌트 수 | 8개 계열사 |
| 부서 수 | ~120개 |
| 총 레코드 | ~46,000건 |
| 실행 시간 | ~3-5분 |

## 한성그룹 계열사 구성

| 코드 | 계열사명 | 업종 | 직원 수 | 비고 |
|------|----------|------|---------|------|
| HANSUNG_HD | 한성홀딩스 | 지주회사 | 30명 | |
| HANSUNG_ELEC | 한성전자 | 전자/반도체 | 200명 | **주요 데모 테넌트** |
| HANSUNG_SDI | 한성SDI | 배터리 | 80명 | |
| HANSUNG_ENG | 한성엔지니어링 | 건설/플랜트 | 50명 | |
| HANSUNG_BIO | 한성바이오 | 바이오/제약 | 40명 | SUSPENDED |
| HANSUNG_CHEM | 한성화학 | 화학 | 50명 | |
| HANSUNG_IT | 한성IT서비스 | IT/SI | 40명 | |
| HANSUNG_LIFE | 한성생명 | 보험/금융 | 80명 | |

## 실행 방법

### 안전 실행 (PowerShell - 권장, 검증+백업 포함) ⭐

**새로운 방법!** SQL 검증, 자동 백업, 단계별 실행을 지원하는 안전한 방법입니다.

```powershell
cd scripts/sample-data

# 1. 검증만 실행 (데이터 변경 없음)
.\validate-sql.ps1

# 2. Dry-run 테스트 (ROLLBACK으로 검증만)
.\execute-sample-data.ps1 -Mode dry-run

# 3. 실제 실행 (Phase별 commit, 권장)
.\execute-sample-data.ps1 -Mode phased

# 4. 전체 일괄 실행 (가장 빠름, all-or-nothing)
.\execute-sample-data.ps1 -Mode full-transaction

# 5. 백업 없이 빠른 실행
.\execute-sample-data.ps1 -Mode phased -SkipBackup
```

**장점:**
- ✓ 6가지 자동 검증 (문법, FK 무결성, RLS, Transaction 등)
- ✓ 실행 전 자동 백업 (`backups/pre_sample_data_*.sql`)
- ✓ Phase별 실행으로 실패 시 부분 롤백 가능
- ✓ 상세한 실행 로그 (`execution_*.log`)
- ✓ 실행 후 데이터 무결성 자동 검증

**Validation 항목:**
1. Infrastructure Checks (PostgreSQL 연결, Flyway 마이그레이션)
2. Syntax Validation (PostgreSQL 실제 파싱)
3. Foreign Key Validation (orphaned FK 탐지)
4. RLS Context Validation (tenant isolation 확인)
5. Transaction Boundary (BEGIN/COMMIT 일치)
6. Execution Order (13개 phase 순서 검증)

### 전체 실행 (psql)

```bash
cd scripts/sample-data
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 99_run_all.sql
```

### 전체 실행 (DataGrip/DBeaver)

```bash
# 단일 파일 버전 사용 (psql \i 명령어 미포함)
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 99_combined_all.sql
```

또는 DataGrip/DBeaver에서 `99_combined_all.sql`을 직접 열어 실행합니다.

### 개별 실행

```bash
cd scripts/sample-data

# 0. 기존 데이터 초기화
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 00_reset_sample_data.sql

# 1. 테넌트 (8개 계열사 + 정책 + 기능)
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 01_tenants.sql

# 2. MDM 코드 체계
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 02_mdm_codes.sql

# 3. 메뉴 & 권한
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 03_mdm_menus.sql

# 4. 조직 구조 (직급, 직책, 부서)
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 04_organization.sql

# 5. 직원 마스터 & 상세 (570명)
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 05_employees.sql

# 6. 인증 & 감사 (사용자 계정, 로그인이력, 감사로그)
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 06_auth.sql

# 7. 근태 & 휴가
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 07_attendance.sql

# 8. 전자결재
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 08_approvals.sql

# 9. 조직 부가 데이터 (공지, 위원회, 경조, 전출입, 사원증)
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 09_org_extras.sql

# 10. 채용 (공고, 지원자, 면접, 오퍼)
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 10_recruitment.sql

# 11. 발령 & 증명서
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 11_appointments_certificates.sql

# 12. 알림 & 파일
psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 12_notifications_files.sql
```

## 테스트 계정

### 시스템 관리자

| ID | 비밀번호 | 역할 |
|----|----------|------|
| `superadmin` | `Admin@2025!` | SUPER_ADMIN |

### 한성전자 (주력 테스트 계열사)

| ID | 비밀번호 | 역할 | 직급/직책 | 부서 |
|----|----------|------|-----------|------|
| `ceo.elec` | `Ceo@2025!` | TENANT_ADMIN | 사장/대표이사 | 경영지원본부 |
| `hr.admin.elec` | `HrAdmin@2025!` | HR_MANAGER | 부장/팀장 | 인사팀 |
| `hr.manager.elec` | `HrMgr@2025!` | HR_STAFF | 과장/책임 | 인사팀 |
| `dev.manager.elec` | `DevMgr@2025!` | DEPT_MANAGER | 차장/팀장 | 개발1팀 |
| `dev.senior.elec` | `DevSr@2025!` | EMPLOYEE | 대리/선임 | 개발1팀 |
| `dev.staff.elec` | `DevStaff@2025!` | EMPLOYEE | 사원/팀원 | 개발1팀 |

### 기타 계열사 (계열사당 3개 계정)

| 계열사 | CEO | HR관리자 | 일반사원 |
|--------|-----|----------|----------|
| 한성홀딩스 | `ceo.hd` | `hr.admin.hd` | `staff.hd` |
| 한성SDI | `ceo.sdi` | `hr.admin.sdi` | `staff.sdi` |
| 한성엔지니어링 | `ceo.eng` | `hr.admin.eng` | `staff.eng` |
| 한성바이오 | `ceo.bio` | `hr.admin.bio` | `staff.bio` |
| 한성화학 | `ceo.chem` | `hr.admin.chem` | `staff.chem` |
| 한성IT서비스 | `ceo.it` | `hr.admin.it` | `staff.it` |
| 한성생명 | `ceo.life` | `hr.admin.life` | `staff.life` |

**공통 비밀번호**: CEO `Ceo@2025!` / HR관리자 `HrAdmin@2025!` / 일반사원 `Staff@2025!`

## 계정별 화면 데이터 시나리오

### `dev.staff.elec` (일반 사원) 로그인 시

| 화면 | 보이는 데이터 |
|------|---------------|
| 대시보드 - 출퇴근 | 오늘 본인 출근 09:02 기록 |
| 대시보드 - 연차 | 연차 15일 중 12일 잔여 |
| 대시보드 - 결재대기 | 0건 (결재 권한 없음) |
| 대시보드 - 팀원 휴가 | 개발1팀 2명 휴가 중 |
| 대시보드 - 생일자 | 이번 달 생일 3~5명 |
| 내 정보 | 조사원, 사원, 개발1팀 |
| 내 휴가 | 3건 (APPROVED 1, PENDING 1, REJECTED 1) |
| 내 결재 | 2건 (휴가신청서, 구매신청서) |
| 증명서 | 재직증명서 1건 |
| 알림센터 | 5건 UNREAD + 10건 READ |

### `dev.manager.elec` (부서장) 로그인 시

| 화면 | 보이는 데이터 |
|------|---------------|
| 대시보드 - 결재대기 | 3건 PENDING (팀원 휴가 2, 초과근무 1) |
| 휴가 승인 | 팀원 PENDING 휴가 2건 |
| 내 면접 | 2건 면접 일정 (채용 면접관) |
| 내 결재 | 본인 기안 + 승인 요청 ~5건 |

### `hr.admin.elec` (HR 관리자) 로그인 시

| 화면 | 보이는 데이터 |
|------|---------------|
| 직원 목록 | 한성전자 전체 200명 |
| 52시간 모니터링 | WARNING/EXCEEDED 상태 직원 표시 |
| 채용 관리 | 한성전자 공고 전체 |
| 발령 관리 | 한성전자 발령안 전체 |

## 서비스별 생성 데이터

### tenant-service (Step 1)
- `tenant`: 8개 (한성그룹 계열사)
- `tenant_policy`: 40개 (테넌트당 5개 정책)
- `tenant_feature`: 160개 (테넌트당 20개 기능)

### mdm-service (Step 2-3)
- `code_group`: ~20개
- `common_code`: ~200개
- `code_tenant_mapping`: ~50개
- `menu_item`: ~70개
- `menu_permission`: ~200개
- `tenant_menu_config`: ~40개

### organization-service (Step 4, 9)
- `grade`: 88개 (테넌트당 11개 직급)
- `position`: 72개 (테넌트당 9개 직책)
- `department`: ~120개
- `announcement`: ~20개
- `committee`: 3개 + `committee_member`: ~9개
- `headcount_plan`: ~20개 + `headcount_request`: 4개
- `condolence_policy`: 48개 + `condolence_request`: 3개
- `organization_history`: 4개

### employee-service (Step 5, 9)
- `employee`: 570명
- `employee_family`: ~400건
- `employee_education`: ~570건
- `employee_career`: ~150건
- `employee_certificate`: ~200건
- `employee_affiliation`: ~600건
- `employee_history`: ~200건
- `employee_change_request`: ~20건
- `transfer_request`: 3건
- `employee_card`: 7건 + `card_issue_request`: 1건
- `privacy_access_log`: ~30건

### auth-service (Step 6)
- `users`: ~40명 (superadmin + 테넌트별 3~6명)
- `login_history`: ~500건
- `audit_log`: ~300건
- `password_history`: ~40건

### attendance-service (Step 7)
- `holiday`: ~300건 (2025-2026)
- `leave_type_config`: ~80개
- `leave_accrual_rule`: ~16개
- `leave_balance`: ~2,280건
- `attendance_record`: ~30,000건 (최근 3개월)
- `leave_request`: ~300건
- `overtime_request`: ~200건

### approval-service (Step 8)
- `approval_template`: 64개 (테넌트당 8개 양식)
- `approval_template_line`: ~192개
- `approval_document`: ~250건
- `approval_line`: ~400건
- `approval_history`: ~350건
- `delegation_rule`: 2건
- `arbitrary_approval_rule`: 4건

### recruitment-service (Step 10)
- `job_posting`: ~15개
- `applicant`: ~40명
- `application`: ~35건
- `interview`: ~10건
- `interview_score`: ~50건
- `offer`: ~8건

### appointment-service (Step 11)
- `appointment_draft`: ~10건
- `appointment_detail`: ~8건
- `appointment_schedule`: 1건
- `appointment_history`: ~10건

### certificate-service (Step 11)
- `certificate_template`: 64개 (테넌트당 8개)
- `certificate_type`: 80개 (테넌트당 10개)
- `certificate_request`: ~31건
- `certificate_issue`: ~16건
- `verification_log`: 3건

### notification-service (Step 12)
- `notification_template`: 128개 (테넌트당 16개)
- `notification_preference`: ~120건
- `notification`: ~200건 (30% UNREAD)

### file-service (Step 12)
- `file_metadata`: ~80건

## UUID 규칙

SQL에서 FK 참조를 쉽게 하기 위해 예측 가능한 UUID를 사용합니다:

```
테넌트:  a0000001-0000-0000-0000-00000000000{N}  (1=HD, 2=ELEC, 3=SDI, ...)
부서:    d{tenant}-0000-0000-0000-00000000{seq}
직원:    e{tenant}-0000-0000-0000-00000000{seq}
유저:    u{tenant}-0000-0000-0000-00000000{seq}
```

## 파일 목록

```
scripts/sample-data/
├── 00_reset_sample_data.sql           # 데이터 초기화
├── 01_tenants.sql                     # 테넌트 + 정책 + 기능
├── 02_mdm_codes.sql                   # 코드그룹, 공통코드, 매핑
├── 03_mdm_menus.sql                   # 메뉴, 권한, 테넌트 설정
├── 04_organization.sql                # 직급, 직책, 부서
├── 05_employees.sql                   # 직원 마스터 & 상세
├── 06_auth.sql                        # 인증, 감사로그
├── 07_attendance.sql                  # 근태, 휴가, 초과근무
├── 08_approvals.sql                   # 전자결재
├── 09_org_extras.sql                  # 공지, 위원회, 경조, 사원증
├── 10_recruitment.sql                 # 채용
├── 11_appointments_certificates.sql   # 발령, 증명서
├── 12_notifications_files.sql         # 알림, 파일
├── 99_run_all.sql                     # 전체 실행 (psql \i)
├── 99_combined_all.sql                # 전체 실행 (단일 파일)
└── README.md                          # 이 문서
```

## 데이터 검증

```sql
-- 테넌트별 직원 현황
SELECT t.name as 계열사,
       COUNT(e.id) as 직원수,
       (SELECT COUNT(*) FROM hr_core.department WHERE tenant_id = t.id) as 부서수
FROM tenant_common.tenant t
LEFT JOIN hr_core.employee e ON t.id = e.tenant_id
GROUP BY t.id, t.name
ORDER BY COUNT(e.id) DESC;

-- 테스트 계정별 데이터 확인
SELECT u.username,
  (SELECT COUNT(*) FROM hr_attendance.attendance_record ar WHERE ar.employee_id = u.employee_id) as 근태,
  (SELECT COUNT(*) FROM hr_attendance.leave_balance lb WHERE lb.employee_id = u.employee_id) as 휴가잔액,
  (SELECT COUNT(*) FROM hr_approval.approval_document ad WHERE ad.drafter_id = u.employee_id) as 내결재,
  (SELECT COUNT(*) FROM hr_notification.notification n WHERE n.user_id = u.id) as 알림
FROM tenant_common.users u
WHERE u.username IN ('dev.staff.elec','dev.manager.elec','hr.admin.elec','ceo.elec');
```

## 주의 사항

1. **순서 준수**: 스크립트는 FK 의존성 순서로 실행해야 합니다 (00→12)
2. **초기화 주의**: `00_reset_sample_data.sql`은 모든 데이터를 삭제합니다
3. **운영 환경 금지**: 개발/테스트 환경 전용입니다
4. **스키마 필수**: Flyway 마이그레이션으로 테이블이 먼저 생성되어 있어야 합니다
5. **멱등성**: `ON CONFLICT DO NOTHING` 패턴으로 재실행 가능합니다
6. **RLS**: 각 스크립트 시작 시 `RESET app.current_tenant`로 RLS를 우회합니다

## 변경 이력

- **v2.0** (2026-02-11): PRD 기반 전면 재생성, 570명 규모, 27개 화면 최적화, 테스트 시나리오 내장
- **v1.3**: auth-service 로그인이력 추가 (13개 서비스 완전 커버)
- **v1.2**: appointment-service, certificate-service 추가
- **v1.1**: notification, file, recruitment 추가
- **v1.0**: 초기 버전 (75,000명 규모)
