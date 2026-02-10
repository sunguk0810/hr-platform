# HR SaaS 플랫폼 샘플 데이터

AWS 배포 및 데모를 위한 현실적인 한국 대기업 그룹 규모의 샘플 데이터입니다.

## 데이터 개요

| 항목 | 규모 |
|------|------|
| 총 직원 수 | ~75,000명 |
| 테넌트 수 | 8개 계열사 |
| 부서 수 | ~500개 |
| 근태 기록 | ~4,500,000건 (최근 3개월) |
| 결재 문서 | ~30,000건 |
| 알림 | ~300,000건 |
| 채용 공고 | ~150개 |
| 지원자 | ~2,500명 |

## 한성그룹 계열사 구성

| 코드 | 계열사명 | 업종 | 직원 수 |
|------|----------|------|---------|
| HANSUNG_HD | 한성홀딩스 | 지주회사 | 500명 |
| HANSUNG_ELEC | 한성전자 | 전자/반도체 | 25,000명 |
| HANSUNG_SDI | 한성SDI | 배터리 | 12,000명 |
| HANSUNG_ENG | 한성엔지니어링 | 건설/플랜트 | 8,000명 |
| HANSUNG_BIO | 한성바이오 | 바이오/제약 | 5,000명 |
| HANSUNG_CHEM | 한성화학 | 화학 | 7,000명 |
| HANSUNG_IT | 한성IT서비스 | IT/SI | 4,500명 |
| HANSUNG_LIFE | 한성생명 | 보험/금융 | 13,000명 |

## 실행 방법

### 전체 실행 (권장)

```bash
cd scripts/sample-data
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 99_run_all.sql
```

### 개별 실행

```bash
cd scripts/sample-data

# 0. 기존 데이터 초기화
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 00_reset_sample_data.sql

# 1-2. 테넌트 및 정책 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 01_tenant_seed.sql
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 02_tenant_policy_feature.sql

# 3-4. MDM 데이터 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 03_mdm_code_groups.sql
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 04_mdm_common_codes.sql

# 5-6. 조직 구조 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 05_organization_grades_positions.sql
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 06_organization_departments.sql

# 7-9. 직원 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 07_employee_generator.sql
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 08_employee_execute.sql
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 09_employee_details_generator.sql

# 10-13. 근태 데이터 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 10_attendance_holidays.sql
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 11_leave_balance_generator.sql
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 12_attendance_generator.sql
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 13_leave_overtime_generator.sql

# 14-15. 결재 데이터 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 14_approval_templates.sql
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 15_approval_generator.sql

# 16. 알림 데이터 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 16_notification_generator.sql

# 17. 파일 메타데이터 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 17_file_generator.sql

# 18. 채용 데이터 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 18_recruitment_generator.sql

# 19. 발령 데이터 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 19_appointment_generator.sql

# 20. 증명서 데이터 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 20_certificate_generator.sql

# 21. Auth 로그인 이력 생성
psql -h localhost -p 5433 -U hr_saas -d hr_saas -f 21_auth_login_history_generator.sql
```

## 예상 실행 시간

| 스크립트 | 설명 | 예상 시간 |
|----------|------|-----------|
| 01-06 | 기본 마스터 데이터 | 1분 |
| 07-08 | 직원 생성 (75,000명) | 5-10분 |
| 09 | 직원 상세 정보 | 5-10분 |
| 10-11 | 공휴일, 휴가 잔액 | 3-5분 |
| 12 | 근태 기록 (450만건) | 15-25분 |
| 13-15 | 휴가/결재 데이터 | 3-5분 |
| 16 | 알림 데이터 | 3-5분 |
| 17 | 파일 메타데이터 | 1-2분 |
| 18 | 채용 데이터 | 2-3분 |
| 19 | 발령 데이터 | 2-3분 |
| 20 | 증명서 데이터 | 1-2분 |
| 21 | Auth 로그인 이력 | 1분 |
| **총계** | | **45-70분** |

## 테스트 계정

### 시스템 관리자

| ID | 비밀번호 | 역할 |
|----|----------|------|
| `superadmin` | `Admin@2025!` | SUPER_ADMIN |

### 한성전자 (주력 테스트 계열사)

| ID | 비밀번호 | 역할 | 직급/직책 | 부서 |
|----|----------|------|-----------|------|
| `ceo.elec` | `Ceo@2025!` | TENANT_ADMIN | 사장/대표이사 | 경영진 |
| `hr.admin.elec` | `HrAdmin@2025!` | HR_MANAGER | 부장/팀장 | 인사팀 |
| `hr.manager.elec` | `HrMgr@2025!` | HR_MANAGER | 과장/책임 | 인사팀 |
| `dev.manager.elec` | `DevMgr@2025!` | DEPT_MANAGER | 차장/팀장 | DRAM개발팀 |
| `dev.senior.elec` | `DevSr@2025!` | EMPLOYEE | 대리/선임 | DRAM개발팀 |
| `dev.staff.elec` | `DevStaff@2025!` | EMPLOYEE | 사원/팀원 | DRAM개발팀 |

### 기타 계열사 (계열사별 대표 계정)

| 계열사 | CEO ID | HR관리자 ID |
|--------|--------|-------------|
| 한성홀딩스 | `ceo.hansung` | `hr.admin.hd` |
| 한성SDI | `ceo.sdi` | `hr.admin.sdi` |
| 한성엔지니어링 | `ceo.eng` | `hr.admin.eng` |
| 한성바이오 | `ceo.bio` | `hr.admin.bio` |
| 한성화학 | `ceo.chem` | `hr.admin.chem` |
| 한성IT서비스 | `ceo.it` | `hr.admin.it` |
| 한성생명 | `ceo.life` | `hr.admin.life` |

**공통 비밀번호**:
- CEO: `Ceo@2025!`
- HR관리자: `HrAdmin@2025!`
- HR담당자: `HrMgr@2025!`
- 부서장: `DevMgr@2025!` / `ProdMgr@2025!` / `PmMgr@2025!` 등
- 일반직원: `DevStaff@2025!` / `ProdStaff@2025!` 등

## 서비스별 생성 데이터

### tenant-service
- `tenant`: 8개 (한성그룹 계열사)
- `tenant_policy`: 40개 (테넌트당 5개 정책)
- `tenant_feature`: 160개 (테넌트당 20개 기능)

### mdm-service
- `code_group`: 20개 (시스템 공통코드 그룹)
- `common_code`: ~100개 (공통코드 상세)

### organization-service
- `grade`: 88개 (테넌트당 11개 직급)
- `position`: 72개 (테넌트당 9개 직책)
- `department`: ~500개 (대기업 조직 구조)

### employee-service
- `employee`: ~75,000명
- `employee_family`: ~75,000건
- `employee_education`: ~100,000건
- `employee_career`: ~22,000건
- `employee_certificate`: ~30,000건

### attendance-service
- `holiday`: ~296건 (2025-2026 공휴일)
- `leave_balance`: ~300,000건
- `attendance_record`: ~4,500,000건
- `leave_request`: ~15,000건
- `overtime_request`: ~10,000건

### approval-service
- `approval_template`: 64개 (테넌트당 8개 양식)
- `approval_document`: ~30,000건
- `approval_line`: ~30,000건
- `approval_history`: ~20,000건
- `delegation_rule`: ~100건

### notification-service
- `notification_template`: ~128개 (테넌트당 16개)
- `notification_preference`: ~240,000건
- `notification`: ~300,000건

### file-service
- `file_metadata`: ~25,000건

### recruitment-service
- `job_posting`: ~150개
- `applicant`: ~2,500명
- `application`: ~5,000건
- `interview`: ~3,000건
- `interview_score`: ~15,000건
- `offer`: ~500건

### appointment-service
- `appointment_draft`: ~400건 (발령안)
- `appointment_detail`: ~4,000건 (발령상세)
- `appointment_schedule`: ~100건 (예약발령)
- `appointment_history`: ~5,000건 (발령이력)

### certificate-service
- `certificate_template`: 64개 (테넌트당 8개)
- `certificate_type`: 80개 (테넌트당 10개)
- `certificate_request`: ~1,600건 (증명서 신청)
- `certificate_issue`: ~1,200건 (발급된 증명서)
- `verification_log`: ~500건 (진위확인 로그)

### auth-service
- `user_sessions`: 런타임 생성 (로그인 시)
- `password_reset_tokens`: 런타임 생성 (비밀번호 재설정 요청 시)
- `login_history`: ~10,000건 (최근 30일 로그인 이력)
- `account_locks`: 런타임 생성 (로그인 실패 시)

### gateway-service
- DB 테이블 없음 (API 라우팅 전용)

## 데이터 검증

```sql
-- 테넌트별 직원 현황
SELECT t.name as 계열사,
       COUNT(e.id) as 직원수,
       (SELECT COUNT(*) FROM hr_core.department WHERE tenant_id = t.id) as 부서수,
       (SELECT COUNT(*) FROM hr_attendance.attendance_record WHERE tenant_id = t.id) as 근태수
FROM tenant_common.tenant t
LEFT JOIN hr_core.employee e ON t.id = e.tenant_id
GROUP BY t.id, t.name
ORDER BY COUNT(e.id) DESC;

-- 직급별 직원 분포
SELECT job_title_code as 직급, COUNT(*) as 인원
FROM hr_core.employee
WHERE status = 'ACTIVE'
GROUP BY job_title_code
ORDER BY job_title_code;

-- 월별 근태 현황
SELECT TO_CHAR(work_date, 'YYYY-MM') as 월,
       COUNT(*) as 근태건수,
       COUNT(DISTINCT employee_id) as 직원수
FROM hr_attendance.attendance_record
GROUP BY TO_CHAR(work_date, 'YYYY-MM')
ORDER BY 월;

-- 채용 현황
SELECT jp.status, COUNT(*) as 공고수,
       SUM(jp.application_count) as 총지원수
FROM hr_recruitment.job_posting jp
GROUP BY jp.status;
```

## 주의 사항

1. **순서 준수**: 스크립트는 외래키 의존성 순서로 실행해야 합니다.
2. **초기화 주의**: `00_reset_sample_data.sql`은 모든 데이터를 삭제합니다.
3. **운영 환경 금지**: 이 스크립트는 개발/테스트 환경 전용입니다.
4. **Keycloak 연동**: 테스트 계정은 Keycloak에도 동일하게 생성해야 합니다.
5. **스키마 생성 필요**: 먼저 Flyway 마이그레이션으로 테이블이 생성되어 있어야 합니다.

## 파일 목록

```
scripts/sample-data/
├── 00_reset_sample_data.sql        # 샘플 데이터 초기화
├── 01_tenant_seed.sql              # 테넌트 8개 생성
├── 02_tenant_policy_feature.sql    # 테넌트별 정책/기능
├── 03_mdm_code_groups.sql          # 공통코드 그룹
├── 04_mdm_common_codes.sql         # 공통코드 상세
├── 05_organization_grades_positions.sql  # 직급/직책
├── 06_organization_departments.sql # 부서 구조 (~500개)
├── 07_employee_generator.sql       # 직원 생성 함수
├── 08_employee_execute.sql         # 직원 생성 실행
├── 09_employee_details_generator.sql # 직원 상세 정보
├── 10_attendance_holidays.sql      # 공휴일 2025-2026
├── 11_leave_balance_generator.sql  # 휴가 잔액
├── 12_attendance_generator.sql     # 근태 기록 대량 생성
├── 13_leave_overtime_generator.sql # 휴가/초과근무 신청
├── 14_approval_templates.sql       # 결재 양식
├── 15_approval_generator.sql       # 결재 문서 대량 생성
├── 16_notification_generator.sql   # 알림 템플릿/설정/알림
├── 17_file_generator.sql           # 파일 메타데이터
├── 18_recruitment_generator.sql    # 채용 (공고/지원자/면접/오퍼)
├── 19_appointment_generator.sql    # 발령 (발령안/상세/예약/이력)
├── 20_certificate_generator.sql    # 증명서 (템플릿/유형/신청/발급/진위확인)
├── 21_auth_login_history_generator.sql  # Auth (로그인이력)
├── 99_run_all.sql                  # 전체 실행 스크립트
└── README.md                       # 이 문서
```

## 변경 이력

- **v1.0**: 초기 버전 (tenant, mdm, organization, employee, attendance, approval)
- **v1.1**: notification-service, file-service, recruitment-service 추가
- **v1.2**: appointment-service, certificate-service 추가
- **v1.3**: auth-service 로그인이력 추가 (총 13개 마이크로서비스 완전 커버)
