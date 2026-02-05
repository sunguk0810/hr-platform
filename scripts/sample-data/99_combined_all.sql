-- ============================================================================
-- HR SaaS Platform - Combined Sample Data Script for DataGrip
-- Expected time: 40-60 minutes for full dataset (~75,000 employees)
-- ============================================================================


-- ============================================================================
-- FILE: 00_reset_sample_data.sql
-- ============================================================================

-- ============================================================================
-- 00_reset_sample_data.sql
-- 샘플 데이터 초기화 (기존 샘플 데이터 삭제)
-- ============================================================================
-- 주의: 이 스크립트는 모든 샘플 데이터를 삭제합니다.
-- 운영 환경에서는 절대 실행하지 마세요!
-- ============================================================================

-- RLS 비활성화 (데이터 삭제를 위해)
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- 트랜잭션 시작
BEGIN;

-- ============================================================================
-- 역순으로 데이터 삭제 (외래키 의존성 순서)
-- ============================================================================

-- 0-0. Auth 서비스 관련
TRUNCATE TABLE tenant_common.login_history CASCADE;
TRUNCATE TABLE tenant_common.account_locks CASCADE;
TRUNCATE TABLE tenant_common.password_reset_tokens CASCADE;
TRUNCATE TABLE tenant_common.user_sessions CASCADE;

-- 0-1. 증명서 관련
TRUNCATE TABLE hr_certificate.verification_log CASCADE;
TRUNCATE TABLE hr_certificate.certificate_issue CASCADE;
TRUNCATE TABLE hr_certificate.certificate_request CASCADE;
TRUNCATE TABLE hr_certificate.certificate_type CASCADE;
TRUNCATE TABLE hr_certificate.certificate_template CASCADE;

-- 0-2. 발령 관련
TRUNCATE TABLE hr_appointment.appointment_history CASCADE;
TRUNCATE TABLE hr_appointment.appointment_schedule CASCADE;
TRUNCATE TABLE hr_appointment.appointment_detail CASCADE;
TRUNCATE TABLE hr_appointment.appointment_draft CASCADE;

-- 1. 채용 관련
TRUNCATE TABLE hr_recruitment.offer CASCADE;
TRUNCATE TABLE hr_recruitment.interview_score CASCADE;
TRUNCATE TABLE hr_recruitment.interview CASCADE;
TRUNCATE TABLE hr_recruitment.application CASCADE;
TRUNCATE TABLE hr_recruitment.applicant CASCADE;
TRUNCATE TABLE hr_recruitment.job_posting CASCADE;

-- 2. 결재 관련
TRUNCATE TABLE hr_approval.approval_history CASCADE;
TRUNCATE TABLE hr_approval.approval_line CASCADE;
TRUNCATE TABLE hr_approval.approval_document CASCADE;
TRUNCATE TABLE hr_approval.delegation_rule CASCADE;
TRUNCATE TABLE hr_approval.approval_template_line CASCADE;
TRUNCATE TABLE hr_approval.approval_template CASCADE;

-- 2. 근태 관련
TRUNCATE TABLE hr_attendance.overtime_request CASCADE;
TRUNCATE TABLE hr_attendance.leave_request CASCADE;
TRUNCATE TABLE hr_attendance.attendance_record CASCADE;
TRUNCATE TABLE hr_attendance.leave_balance CASCADE;
TRUNCATE TABLE hr_attendance.holiday CASCADE;

-- 3. 알림 관련
TRUNCATE TABLE hr_notification.notification CASCADE;
TRUNCATE TABLE hr_notification.notification_preference CASCADE;
TRUNCATE TABLE hr_notification.notification_template CASCADE;

-- 4. 파일 관련
TRUNCATE TABLE hr_file.file_metadata CASCADE;

-- 5. 직원 관련
TRUNCATE TABLE hr_core.employee_certificate CASCADE;
TRUNCATE TABLE hr_core.employee_career CASCADE;
TRUNCATE TABLE hr_core.employee_education CASCADE;
TRUNCATE TABLE hr_core.employee_family CASCADE;
TRUNCATE TABLE hr_core.employee_history CASCADE;
TRUNCATE TABLE hr_core.employee CASCADE;

-- 6. 조직 관련
TRUNCATE TABLE hr_core.department CASCADE;
TRUNCATE TABLE hr_core.grade CASCADE;
TRUNCATE TABLE hr_core.position CASCADE;

-- 7. MDM 관련
TRUNCATE TABLE tenant_common.code_history CASCADE;
TRUNCATE TABLE tenant_common.code_tenant_mapping CASCADE;
TRUNCATE TABLE tenant_common.common_code CASCADE;
TRUNCATE TABLE tenant_common.code_group CASCADE;
TRUNCATE TABLE tenant_common.tenant_menu_config CASCADE;
TRUNCATE TABLE tenant_common.menu_permission CASCADE;
TRUNCATE TABLE tenant_common.menu_item CASCADE;

-- 8. 테넌트 관련
TRUNCATE TABLE tenant_common.tenant_feature CASCADE;
TRUNCATE TABLE tenant_common.tenant_policy CASCADE;
TRUNCATE TABLE tenant_common.tenant CASCADE;

COMMIT;

-- 시퀀스 리셋 (필요시)
-- SELECT setval('some_sequence', 1, false);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '샘플 데이터 초기화 완료!';
END $$;

-- ============================================================================
-- FILE: 01_tenant_seed.sql
-- ============================================================================

-- ============================================================================
-- 01_tenant_seed.sql
-- 한성그룹 8개 계열사 테넌트 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 한성그룹 계열사 테넌트 (8개)
-- ============================================================================

-- 1. 한성홀딩스 (지주회사) - 500명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000001',
    'HANSUNG_HD',
    '한성홀딩스',
    '101-86-00001',
    '김한성',
    '서울특별시 강남구 테헤란로 152 한성타워',
    '02-2000-0001',
    'contact@hansung-hd.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    1000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2. 한성전자 (전자/반도체) - 25,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000002',
    'HANSUNG_ELEC',
    '한성전자',
    '124-81-00002',
    '이전자',
    '경기도 수원시 영통구 삼성로 129',
    '031-200-0001',
    'contact@hansung-elec.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    30000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3. 한성SDI (배터리) - 12,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000003',
    'HANSUNG_SDI',
    '한성SDI',
    '284-81-00003',
    '박배터',
    '경기도 용인시 기흥구 공세로 150-20',
    '031-210-0001',
    'contact@hansung-sdi.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    15000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 4. 한성엔지니어링 (건설/플랜트) - 8,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000004',
    'HANSUNG_ENG',
    '한성엔지니어링',
    '104-81-00004',
    '정건설',
    '서울특별시 서초구 서초대로 74길 14',
    '02-2100-0001',
    'contact@hansung-eng.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    10000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5. 한성바이오 (바이오/제약) - 5,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000005',
    'HANSUNG_BIO',
    '한성바이오',
    '220-87-00005',
    '최바이오',
    '인천광역시 연수구 송도과학로 32',
    '032-850-0001',
    'contact@hansung-bio.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    7000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6. 한성화학 (화학) - 7,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000006',
    'HANSUNG_CHEM',
    '한성화학',
    '301-81-00006',
    '강화학',
    '울산광역시 남구 산업로 1015',
    '052-280-0001',
    'contact@hansung-chem.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    10000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 7. 한성IT서비스 (IT/SI) - 4,500명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000007',
    'HANSUNG_IT',
    '한성IT서비스',
    '214-87-00007',
    '윤아이티',
    '서울특별시 송파구 올림픽로 300',
    '02-6000-0001',
    'contact@hansung-it.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    6000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 8. 한성생명 (보험/금융) - 13,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000008',
    'HANSUNG_LIFE',
    '한성생명',
    '202-81-00008',
    '송금융',
    '서울특별시 중구 세종대로 55',
    '02-3700-0001',
    'contact@hansung-life.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    15000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

COMMIT;

-- 검증
DO $$
DECLARE
    tenant_count INT;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenant_common.tenant;
    RAISE NOTICE '테넌트 생성 완료: % 개', tenant_count;
END $$;

-- ============================================================================
-- FILE: 02_tenant_policy_feature.sql
-- ============================================================================

-- ============================================================================
-- 02_tenant_policy_feature.sql
-- 테넌트별 정책 및 기능 설정
-- ============================================================================

BEGIN;

-- ============================================================================
-- 테넌트 정책 (tenant_policy)
-- ============================================================================

-- 각 테넌트별 근무 정책
INSERT INTO tenant_common.tenant_policy (tenant_id, policy_type, policy_data, is_active, created_at, updated_at)
SELECT
    t.id,
    'WORK_SCHEDULE',
    jsonb_build_object(
        'workStartTime', '09:00',
        'workEndTime', '18:00',
        'lunchStartTime', '12:00',
        'lunchEndTime', '13:00',
        'workHoursPerDay', 8,
        'workDaysPerWeek', 5,
        'flexibleWorkEnabled', true,
        'remoteWorkEnabled', true,
        'coreTimeStart', '10:00',
        'coreTimeEnd', '16:00'
    ),
    true,
    NOW(), NOW()
FROM tenant_common.tenant t;

-- 각 테넌트별 휴가 정책
INSERT INTO tenant_common.tenant_policy (tenant_id, policy_type, policy_data, is_active, created_at, updated_at)
SELECT
    t.id,
    'LEAVE_POLICY',
    jsonb_build_object(
        'annualLeaveBase', 15,
        'annualLeaveIncrement', 1,
        'annualLeaveMax', 25,
        'sickLeavePerYear', 10,
        'maternityLeaveDays', 90,
        'paternityLeaveDays', 10,
        'carryOverEnabled', true,
        'carryOverMaxDays', 5,
        'carryOverExpireMonths', 3,
        'halfDayEnabled', true,
        'quarterDayEnabled', false
    ),
    true,
    NOW(), NOW()
FROM tenant_common.tenant t;

-- 각 테넌트별 결재 정책
INSERT INTO tenant_common.tenant_policy (tenant_id, policy_type, policy_data, is_active, created_at, updated_at)
SELECT
    t.id,
    'APPROVAL_POLICY',
    jsonb_build_object(
        'autoApproveLeaveUnder', 1,
        'escalationDays', 3,
        'reminderEnabled', true,
        'reminderIntervalHours', 24,
        'maxApprovalLines', 5,
        'parallelApprovalEnabled', true,
        'delegationEnabled', true,
        'bulkApprovalEnabled', true
    ),
    true,
    NOW(), NOW()
FROM tenant_common.tenant t;

-- 각 테넌트별 보안 정책
INSERT INTO tenant_common.tenant_policy (tenant_id, policy_type, policy_data, is_active, created_at, updated_at)
SELECT
    t.id,
    'SECURITY_POLICY',
    jsonb_build_object(
        'passwordMinLength', 10,
        'passwordRequireUppercase', true,
        'passwordRequireLowercase', true,
        'passwordRequireNumber', true,
        'passwordRequireSpecial', true,
        'passwordExpiryDays', 90,
        'passwordHistoryCount', 5,
        'sessionTimeoutMinutes', 30,
        'mfaRequired', false,
        'ipWhitelistEnabled', false
    ),
    true,
    NOW(), NOW()
FROM tenant_common.tenant t;

-- 각 테넌트별 알림 정책
INSERT INTO tenant_common.tenant_policy (tenant_id, policy_type, policy_data, is_active, created_at, updated_at)
SELECT
    t.id,
    'NOTIFICATION_POLICY',
    jsonb_build_object(
        'emailEnabled', true,
        'smsEnabled', true,
        'pushEnabled', true,
        'kakaoEnabled', false,
        'quietHoursStart', '22:00',
        'quietHoursEnd', '07:00',
        'digestEnabled', true,
        'digestTime', '09:00'
    ),
    true,
    NOW(), NOW()
FROM tenant_common.tenant t;

-- ============================================================================
-- 테넌트 기능 (tenant_feature)
-- ============================================================================

-- 공통 기능 목록
DO $$
DECLARE
    t_record RECORD;
    features TEXT[] := ARRAY[
        'EMPLOYEE_MANAGEMENT',
        'ORGANIZATION_MANAGEMENT',
        'ATTENDANCE_MANAGEMENT',
        'LEAVE_MANAGEMENT',
        'OVERTIME_MANAGEMENT',
        'APPROVAL_WORKFLOW',
        'NOTIFICATION_CENTER',
        'FILE_MANAGEMENT',
        'DASHBOARD',
        'REPORTS',
        'MOBILE_APP',
        'API_ACCESS',
        'SSO_INTEGRATION',
        'AUDIT_LOG',
        'DATA_EXPORT',
        'MULTI_LANGUAGE',
        'ANNOUNCEMENT',
        'CALENDAR',
        'DIRECTORY',
        'DELEGATION'
    ];
    feature TEXT;
BEGIN
    FOR t_record IN SELECT id FROM tenant_common.tenant LOOP
        FOREACH feature IN ARRAY features LOOP
            INSERT INTO tenant_common.tenant_feature (
                tenant_id, feature_code, is_enabled, config, created_at, updated_at
            ) VALUES (
                t_record.id,
                feature,
                true,
                '{}'::jsonb,
                NOW(), NOW()
            );
        END LOOP;
    END LOOP;
END $$;

-- 특정 테넌트 고급 기능 비활성화 (소규모 계열사)
UPDATE tenant_common.tenant_feature
SET is_enabled = false
WHERE tenant_id IN (
    SELECT id FROM tenant_common.tenant WHERE code = 'HANSUNG_HD'
)
AND feature_code IN ('MULTI_LANGUAGE', 'API_ACCESS');

COMMIT;

-- 검증
DO $$
DECLARE
    policy_count INT;
    feature_count INT;
BEGIN
    SELECT COUNT(*) INTO policy_count FROM tenant_common.tenant_policy;
    SELECT COUNT(*) INTO feature_count FROM tenant_common.tenant_feature;
    RAISE NOTICE '테넌트 정책 생성: % 개', policy_count;
    RAISE NOTICE '테넌트 기능 설정: % 개', feature_count;
END $$;

-- ============================================================================
-- FILE: 03_mdm_code_groups.sql
-- ============================================================================

-- ============================================================================
-- 03_mdm_code_groups.sql
-- 공통코드 그룹 생성 (시스템 코드)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 시스템 공통코드 그룹 (is_system = true, tenant_id = null)
-- ============================================================================

-- 1. 고용 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000001',
    NULL,
    'EMPLOYMENT_TYPE',
    '고용유형',
    'Employment Type',
    '정규직, 계약직 등 고용 형태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2. 직원 상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000002',
    NULL,
    'EMPLOYEE_STATUS',
    '직원상태',
    'Employee Status',
    '재직, 휴직, 퇴직 등 직원 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3. 부서 상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000003',
    NULL,
    'DEPARTMENT_STATUS',
    '부서상태',
    'Department Status',
    '활성, 비활성 등 부서 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 4. 휴가 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000004',
    NULL,
    'LEAVE_TYPE',
    '휴가유형',
    'Leave Type',
    '연차, 병가, 경조사 등 휴가 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5. 근태 상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000005',
    NULL,
    'ATTENDANCE_STATUS',
    '근태상태',
    'Attendance Status',
    '정상, 지각, 결근 등 근태 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6. 결재 문서 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000006',
    NULL,
    'APPROVAL_DOC_TYPE',
    '결재문서유형',
    'Approval Document Type',
    '휴가신청, 경비청구 등 결재 문서 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 7. 결재 상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000007',
    NULL,
    'APPROVAL_STATUS',
    '결재상태',
    'Approval Status',
    '대기, 진행중, 승인, 반려 등 결재 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 8. 가족 관계
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000008',
    NULL,
    'RELATION_TYPE',
    '가족관계',
    'Family Relation Type',
    '배우자, 자녀, 부모 등 가족 관계 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 9. 학력 구분
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000009',
    NULL,
    'DEGREE_TYPE',
    '학위유형',
    'Degree Type',
    '고졸, 학사, 석사, 박사 등 학위 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 10. 알림 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000010',
    NULL,
    'NOTIFICATION_TYPE',
    '알림유형',
    'Notification Type',
    '결재, 일정, 공지 등 알림 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 11. 공휴일 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000011',
    NULL,
    'HOLIDAY_TYPE',
    '휴일유형',
    'Holiday Type',
    '국경일, 공휴일, 창립기념일 등 휴일 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 12. 성별
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000012',
    NULL,
    'GENDER',
    '성별',
    'Gender',
    '남성, 여성 등 성별 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 13. 병역 구분
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000013',
    NULL,
    'MILITARY_STATUS',
    '병역구분',
    'Military Status',
    '군필, 미필, 면제 등 병역 상태 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 14. 업종 분류
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000014',
    NULL,
    'INDUSTRY_TYPE',
    '업종분류',
    'Industry Type',
    '제조업, IT, 금융 등 업종 분류',
    true, true, 2, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 15. 초과근무 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000015',
    NULL,
    'OVERTIME_TYPE',
    '초과근무유형',
    'Overtime Type',
    '연장근무, 휴일근무, 야간근무 등 초과근무 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 16. 경조사 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000016',
    NULL,
    'CONDOLENCE_TYPE',
    '경조사유형',
    'Condolence Type',
    '결혼, 출산, 부고 등 경조사 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 17. 출장 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000017',
    NULL,
    'BUSINESS_TRIP_TYPE',
    '출장유형',
    'Business Trip Type',
    '국내출장, 해외출장 등 출장 유형 분류',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 18. 은행 코드
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000018',
    NULL,
    'BANK_CODE',
    '은행코드',
    'Bank Code',
    '급여이체 등에 사용되는 은행 코드',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 19. 지역 코드
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000019',
    NULL,
    'REGION_CODE',
    '지역코드',
    'Region Code',
    '시도/시군구 등 지역 코드',
    true, true, 2, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 20. 근무지 유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000020',
    NULL,
    'WORK_LOCATION_TYPE',
    '근무지유형',
    'Work Location Type',
    '사무실, 재택, 현장 등 근무 장소 유형',
    true, false, 1, 'ACTIVE', true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

COMMIT;

-- 검증
DO $$
DECLARE
    group_count INT;
BEGIN
    SELECT COUNT(*) INTO group_count FROM tenant_common.code_group;
    RAISE NOTICE '코드그룹 생성 완료: % 개', group_count;
END $$;

-- ============================================================================
-- FILE: 04_mdm_common_codes.sql
-- ============================================================================

-- ============================================================================
-- 04_mdm_common_codes.sql
-- 공통코드 상세 데이터
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 고용유형 (EMPLOYMENT_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'REGULAR', '정규직', 'Regular', '기간의 정함이 없는 정규 고용', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'CONTRACT', '계약직', 'Contract', '기간의 정함이 있는 계약 고용', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'PART_TIME', '파트타임', 'Part-time', '단시간 근로자', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'INTERN', '인턴', 'Intern', '인턴십 고용', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'DISPATCH', '파견직', 'Dispatch', '파견 근로자', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000001', NULL, 'ADVISOR', '고문/자문', 'Advisor', '고문 또는 자문 계약', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 2. 직원상태 (EMPLOYEE_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'ACTIVE', '재직', 'Active', '현재 재직중', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'ON_LEAVE', '휴직', 'On Leave', '휴직 중', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'SUSPENDED', '정직', 'Suspended', '정직 처분', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'RESIGNED', '퇴직', 'Resigned', '퇴직 (자발적)', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'TERMINATED', '해고', 'Terminated', '퇴직 (비자발적)', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000002', NULL, 'RETIRED', '정년퇴직', 'Retired', '정년 퇴직', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 3. 부서상태 (DEPARTMENT_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000003', NULL, 'ACTIVE', '활성', 'Active', '정상 운영중인 부서', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000003', NULL, 'INACTIVE', '비활성', 'Inactive', '비활성화된 부서', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000003', NULL, 'MERGED', '통합', 'Merged', '다른 부서로 통합됨', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000003', NULL, 'DISSOLVED', '해체', 'Dissolved', '해체된 부서', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 4. 휴가유형 (LEAVE_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, extra_value1, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'ANNUAL', '연차', 'Annual Leave', '연간 기본 휴가', 'DEDUCT', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'HALF_DAY', '반차', 'Half Day', '반일 휴가', 'DEDUCT', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'SICK', '병가', 'Sick Leave', '질병으로 인한 휴가', 'SEPARATE', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'MATERNITY', '출산휴가', 'Maternity Leave', '출산 전후 휴가', 'SPECIAL', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'PATERNITY', '배우자출산휴가', 'Paternity Leave', '배우자 출산 휴가', 'SPECIAL', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'PARENTAL', '육아휴직', 'Parental Leave', '육아를 위한 휴직', 'SPECIAL', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'MARRIAGE', '결혼휴가', 'Marriage Leave', '본인 결혼 휴가', 'SPECIAL', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'BEREAVEMENT', '경조휴가', 'Bereavement Leave', '가족 상 경조사 휴가', 'SPECIAL', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'OFFICIAL', '공가', 'Official Leave', '공무 수행을 위한 휴가', 'SPECIAL', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'SPECIAL', '특별휴가', 'Special Leave', '회사 부여 특별 휴가', 'SPECIAL', 10, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'UNPAID', '무급휴가', 'Unpaid Leave', '무급 휴가', 'UNPAID', 11, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000004', NULL, 'REFRESH', '리프레시휴가', 'Refresh Leave', '장기근속 리프레시 휴가', 'SPECIAL', 12, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 5. 근태상태 (ATTENDANCE_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'NORMAL', '정상', 'Normal', '정상 출퇴근', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'LATE', '지각', 'Late', '출근 시간 지각', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'EARLY_LEAVE', '조퇴', 'Early Leave', '퇴근 시간 조퇴', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'ABSENT', '결근', 'Absent', '무단 결근', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'ON_LEAVE', '휴가', 'On Leave', '휴가 사용', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'BUSINESS_TRIP', '출장', 'Business Trip', '출장 중', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'REMOTE_WORK', '재택근무', 'Remote Work', '재택/원격 근무', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'TRAINING', '교육', 'Training', '교육/연수', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000005', NULL, 'HOLIDAY', '휴일', 'Holiday', '공휴일/주말', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 6. 결재문서유형 (APPROVAL_DOC_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'LEAVE', '휴가신청', 'Leave Request', '휴가 신청 결재', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'OVERTIME', '초과근무신청', 'Overtime Request', '초과근무 신청 결재', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'BUSINESS_TRIP', '출장신청', 'Business Trip Request', '출장 신청 결재', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'EXPENSE', '경비청구', 'Expense Claim', '경비 청구 결재', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'PURCHASE', '구매요청', 'Purchase Request', '물품 구매 요청 결재', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'REPORT', '업무보고', 'Work Report', '업무 보고 결재', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'GENERAL', '일반결재', 'General Approval', '일반 결재 문서', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'HR_CHANGE', '인사변경', 'HR Change', '인사 관련 변경 결재', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000006', NULL, 'TRANSFER', '인사이동', 'Transfer', '부서/직책 이동 결재', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 7. 결재상태 (APPROVAL_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'DRAFT', '임시저장', 'Draft', '작성 중 임시 저장', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'PENDING', '결재대기', 'Pending', '상신 후 결재 대기', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'IN_PROGRESS', '결재중', 'In Progress', '결재 진행 중', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'APPROVED', '승인', 'Approved', '최종 승인 완료', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'REJECTED', '반려', 'Rejected', '결재 반려', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'CANCELLED', '취소', 'Cancelled', '신청자 취소', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000007', NULL, 'RETURNED', '회수', 'Returned', '결재 회수', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 8. 가족관계 (RELATION_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'SPOUSE', '배우자', 'Spouse', '배우자', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'CHILD', '자녀', 'Child', '자녀', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'FATHER', '부', 'Father', '부친', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'MOTHER', '모', 'Mother', '모친', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'SIBLING', '형제자매', 'Sibling', '형제 또는 자매', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'GRANDPARENT', '조부모', 'Grandparent', '조부모', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'GRANDCHILD', '손자녀', 'Grandchild', '손자녀', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000008', NULL, 'IN_LAW', '인척', 'In-law', '배우자 가족', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 9. 학위유형 (DEGREE_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'HIGH_SCHOOL', '고졸', 'High School', '고등학교 졸업', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'ASSOCIATE', '전문학사', 'Associate', '전문대학 졸업', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'BACHELOR', '학사', 'Bachelor', '4년제 대학 졸업', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'MASTER', '석사', 'Master', '석사 학위 취득', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'DOCTORATE', '박사', 'Doctorate', '박사 학위 취득', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000009', NULL, 'OTHER', '기타', 'Other', '기타 학력', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 10. 알림유형 (NOTIFICATION_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'APPROVAL', '결재알림', 'Approval', '결재 요청/완료 알림', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'LEAVE', '휴가알림', 'Leave', '휴가 관련 알림', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'ATTENDANCE', '근태알림', 'Attendance', '근태 관련 알림', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'ANNOUNCEMENT', '공지사항', 'Announcement', '공지사항 알림', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'SCHEDULE', '일정알림', 'Schedule', '일정 관련 알림', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'SYSTEM', '시스템알림', 'System', '시스템 공지 알림', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'BIRTHDAY', '생일알림', 'Birthday', '직원 생일 알림', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000010', NULL, 'ANNIVERSARY', '기념일알림', 'Anniversary', '입사 기념일 등 알림', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 11. 휴일유형 (HOLIDAY_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'NATIONAL', '국경일', 'National Holiday', '법정 국경일', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'PUBLIC', '공휴일', 'Public Holiday', '법정 공휴일', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'COMPANY', '창립기념일', 'Company Anniversary', '회사 창립 기념일', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'SPECIAL', '특별휴일', 'Special Holiday', '회사 지정 특별 휴일', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000011', NULL, 'SUBSTITUTE', '대체휴일', 'Substitute Holiday', '대체 공휴일', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 12. 성별 (GENDER)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000012', NULL, 'MALE', '남성', 'Male', '남성', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000012', NULL, 'FEMALE', '여성', 'Female', '여성', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 13. 병역구분 (MILITARY_STATUS)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'COMPLETED', '군필', 'Completed', '병역 이행 완료', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'NOT_COMPLETED', '미필', 'Not Completed', '병역 미이행', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'EXEMPTED', '면제', 'Exempted', '병역 면제', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'SERVING', '복무중', 'Serving', '현재 복무 중', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000013', NULL, 'NA', '해당없음', 'N/A', '해당 없음 (여성 등)', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 15. 초과근무유형 (OVERTIME_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000015', NULL, 'EXTENDED', '연장근무', 'Extended Work', '평일 야간 연장 근무', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000015', NULL, 'HOLIDAY', '휴일근무', 'Holiday Work', '휴일 근무', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000015', NULL, 'NIGHT', '야간근무', 'Night Work', '22시 이후 야간 근무', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000015', NULL, 'WEEKEND', '주말근무', 'Weekend Work', '주말 근무', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 16. 경조사유형 (CONDOLENCE_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, extra_value1, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'WEDDING_SELF', '본인결혼', 'Own Wedding', '본인 결혼', '5', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'WEDDING_CHILD', '자녀결혼', 'Child Wedding', '자녀 결혼', '1', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'BIRTH', '출산', 'Childbirth', '배우자 출산', '10', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_PARENT', '부모상', 'Parent Death', '부모 사망', '5', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_SPOUSE', '배우자상', 'Spouse Death', '배우자 사망', '5', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_CHILD', '자녀상', 'Child Death', '자녀 사망', '5', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_GRANDPARENT', '조부모상', 'Grandparent Death', '조부모 사망', '3', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_SIBLING', '형제자매상', 'Sibling Death', '형제자매 사망', '3', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000016', NULL, 'DEATH_IN_LAW', '배우자부모상', 'In-law Death', '배우자 부모 사망', '5', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 17. 출장유형 (BUSINESS_TRIP_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000017', NULL, 'DOMESTIC', '국내출장', 'Domestic', '국내 출장', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000017', NULL, 'OVERSEAS', '해외출장', 'Overseas', '해외 출장', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000017', NULL, 'LOCAL', '근거리출장', 'Local', '당일 근거리 출장', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000017', NULL, 'TRAINING', '교육출장', 'Training', '교육/연수 목적 출장', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 18. 은행코드 (BANK_CODE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '004', 'KB국민은행', 'KB Kookmin Bank', 'KB국민은행', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '088', '신한은행', 'Shinhan Bank', '신한은행', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '020', '우리은행', 'Woori Bank', '우리은행', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '081', '하나은행', 'Hana Bank', '하나은행', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '003', 'IBK기업은행', 'IBK Industrial Bank', 'IBK기업은행', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '011', 'NH농협은행', 'NH Nonghyup Bank', 'NH농협은행', 6, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '023', 'SC제일은행', 'SC First Bank', 'SC제일은행', 7, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '027', '씨티은행', 'Citibank', '한국씨티은행', 8, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '039', '경남은행', 'Kyongnam Bank', '경남은행', 9, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '034', '광주은행', 'Kwangju Bank', '광주은행', 10, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '031', '대구은행', 'Daegu Bank', '대구은행', 11, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '032', '부산은행', 'Busan Bank', '부산은행', 12, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '090', '카카오뱅크', 'Kakao Bank', '카카오뱅크', 13, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '092', '토스뱅크', 'Toss Bank', '토스뱅크', 14, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000018', NULL, '089', '케이뱅크', 'K Bank', '케이뱅크', 15, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- ============================================================================
-- 20. 근무지유형 (WORK_LOCATION_TYPE)
-- ============================================================================
INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, description, sort_order, status, is_active, is_default, level, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'OFFICE', '사무실', 'Office', '회사 사무실 근무', 1, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'HOME', '재택', 'Home', '재택 근무', 2, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'FIELD', '현장', 'Field', '현장 근무', 3, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'SATELLITE', '거점오피스', 'Satellite Office', '위성 오피스 근무', 4, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'c0000001-0000-0000-0000-000000000020', NULL, 'CUSTOMER', '고객사', 'Customer Site', '고객사 상주 근무', 5, 'ACTIVE', true, false, 1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

COMMIT;

-- 검증
DO $$
DECLARE
    code_count INT;
BEGIN
    SELECT COUNT(*) INTO code_count FROM tenant_common.common_code;
    RAISE NOTICE '공통코드 생성 완료: % 개', code_count;
END $$;

-- ============================================================================
-- FILE: 05_organization_grades_positions.sql
-- ============================================================================

-- ============================================================================
-- 05_organization_grades_positions.sql
-- 직급 및 직책 마스터 데이터 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 직급 (Grade) - 11단계 체계
-- 각 테넌트별로 생성
-- ============================================================================

DO $$
DECLARE
    t_record RECORD;
BEGIN
    FOR t_record IN SELECT id FROM tenant_common.tenant LOOP
        -- G01 사원 (Entry Level)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G01', '사원', 'Staff', 1, 1, true, NOW(), NOW(), 'system', 'system');

        -- G02 주임 (Junior)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G02', '주임', 'Junior', 2, 2, true, NOW(), NOW(), 'system', 'system');

        -- G03 대리 (Associate)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G03', '대리', 'Associate', 3, 3, true, NOW(), NOW(), 'system', 'system');

        -- G04 과장 (Manager)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G04', '과장', 'Manager', 4, 4, true, NOW(), NOW(), 'system', 'system');

        -- G05 차장 (Deputy General Manager)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G05', '차장', 'Deputy General Manager', 5, 5, true, NOW(), NOW(), 'system', 'system');

        -- G06 부장 (General Manager)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G06', '부장', 'General Manager', 6, 6, true, NOW(), NOW(), 'system', 'system');

        -- G07 이사 (Director)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G07', '이사', 'Director', 7, 7, true, NOW(), NOW(), 'system', 'system');

        -- G08 상무 (Senior Director)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G08', '상무', 'Senior Director', 8, 8, true, NOW(), NOW(), 'system', 'system');

        -- G09 전무 (Executive Vice President)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G09', '전무', 'Executive Vice President', 9, 9, true, NOW(), NOW(), 'system', 'system');

        -- G10 부사장 (Senior Executive Vice President)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G10', '부사장', 'Senior Executive VP', 10, 10, true, NOW(), NOW(), 'system', 'system');

        -- G11 사장 (President)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G11', '사장', 'President', 11, 11, true, NOW(), NOW(), 'system', 'system');
    END LOOP;
END $$;


-- ============================================================================
-- 직책 (Position) - 9단계 체계
-- 각 테넌트별로 생성
-- ============================================================================

DO $$
DECLARE
    t_record RECORD;
BEGIN
    FOR t_record IN SELECT id FROM tenant_common.tenant LOOP
        -- P01 팀원 (Team Member)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P01', '팀원', 'Team Member', 1, 1, true, NOW(), NOW(), 'system', 'system');

        -- P02 선임 (Senior Member)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P02', '선임', 'Senior', 2, 2, true, NOW(), NOW(), 'system', 'system');

        -- P03 책임 (Lead)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P03', '책임', 'Lead', 3, 3, true, NOW(), NOW(), 'system', 'system');

        -- P04 수석 (Principal)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P04', '수석', 'Principal', 4, 4, true, NOW(), NOW(), 'system', 'system');

        -- P05 파트장 (Part Leader)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P05', '파트장', 'Part Leader', 5, 5, true, NOW(), NOW(), 'system', 'system');

        -- P06 팀장 (Team Leader)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P06', '팀장', 'Team Leader', 6, 6, true, NOW(), NOW(), 'system', 'system');

        -- P07 실장 (Department Head)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P07', '실장', 'Department Head', 7, 7, true, NOW(), NOW(), 'system', 'system');

        -- P08 본부장 (Division Head)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P08', '본부장', 'Division Head', 8, 8, true, NOW(), NOW(), 'system', 'system');

        -- P09 대표이사 (CEO)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P09', '대표이사', 'CEO', 9, 9, true, NOW(), NOW(), 'system', 'system');
    END LOOP;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    grade_count INT;
    position_count INT;
BEGIN
    SELECT COUNT(*) INTO grade_count FROM hr_core.grade;
    SELECT COUNT(*) INTO position_count FROM hr_core.position;
    RAISE NOTICE '직급 생성 완료: % 개 (8개 테넌트 x 11개 직급)', grade_count;
    RAISE NOTICE '직책 생성 완료: % 개 (8개 테넌트 x 9개 직책)', position_count;
END $$;

-- ============================================================================
-- FILE: 06_organization_departments.sql
-- ============================================================================

-- ============================================================================
-- 06_organization_departments.sql
-- 대기업 규모 부서 구조 생성 (~500개 부서)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 부서 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION create_department(
    p_tenant_id UUID,
    p_code VARCHAR,
    p_name VARCHAR,
    p_name_en VARCHAR,
    p_parent_code VARCHAR,
    p_level INT,
    p_sort_order INT
) RETURNS UUID AS $$
DECLARE
    v_parent_id UUID;
    v_path VARCHAR;
    v_dept_id UUID;
BEGIN
    -- 상위 부서 ID 조회
    IF p_parent_code IS NOT NULL THEN
        SELECT id, path INTO v_parent_id, v_path
        FROM hr_core.department
        WHERE tenant_id = p_tenant_id AND code = p_parent_code;

        v_path := COALESCE(v_path, '') || '/' || p_code;
    ELSE
        v_path := '/' || p_code;
    END IF;

    INSERT INTO hr_core.department (
        id, tenant_id, code, name, name_en, parent_id, level, path, status, sort_order,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), p_tenant_id, p_code, p_name, p_name_en, v_parent_id, p_level, v_path, 'ACTIVE', p_sort_order,
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) RETURNING id INTO v_dept_id;

    RETURN v_dept_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. 한성홀딩스 (HANSUNG_HD) - 15개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000001';
BEGIN
    -- Level 1: 최상위
    PERFORM create_department(v_tenant_id, 'HD_ROOT', '한성홀딩스', 'Hansung Holdings', NULL, 1, 1);

    -- Level 2: 본부
    PERFORM create_department(v_tenant_id, 'HD_MGMT', '경영기획본부', 'Management Planning', 'HD_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'HD_FIN', '재무본부', 'Finance', 'HD_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'HD_HR', '인사본부', 'Human Resources', 'HD_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'HD_LEGAL', '법무본부', 'Legal Affairs', 'HD_ROOT', 2, 4);

    -- Level 3: 팀
    PERFORM create_department(v_tenant_id, 'HD_STRATEGY', '전략기획팀', 'Strategy Planning', 'HD_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'HD_IR', 'IR팀', 'Investor Relations', 'HD_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'HD_ACCT', '회계팀', 'Accounting', 'HD_FIN', 3, 1);
    PERFORM create_department(v_tenant_id, 'HD_TREASURY', '자금팀', 'Treasury', 'HD_FIN', 3, 2);
    PERFORM create_department(v_tenant_id, 'HD_HR_TEAM', '인사팀', 'HR Team', 'HD_HR', 3, 1);
    PERFORM create_department(v_tenant_id, 'HD_EDU', '교육팀', 'Training', 'HD_HR', 3, 2);
    PERFORM create_department(v_tenant_id, 'HD_LEGAL_TEAM', '법무팀', 'Legal Team', 'HD_LEGAL', 3, 1);
    PERFORM create_department(v_tenant_id, 'HD_COMPLIANCE', '준법감시팀', 'Compliance', 'HD_LEGAL', 3, 2);
    PERFORM create_department(v_tenant_id, 'HD_AUDIT', '감사팀', 'Audit', 'HD_ROOT', 2, 5);
    PERFORM create_department(v_tenant_id, 'HD_SECR', '비서실', 'Secretariat', 'HD_ROOT', 2, 6);
END $$;

-- ============================================================================
-- 2. 한성전자 (HANSUNG_ELEC) - 80개 부서 (대규모)
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
BEGIN
    -- Level 1: 최상위
    PERFORM create_department(v_tenant_id, 'EL_ROOT', '한성전자', 'Hansung Electronics', NULL, 1, 1);

    -- Level 2: 사업부/본부
    PERFORM create_department(v_tenant_id, 'EL_MGMT', '경영지원본부', 'Management Support', 'EL_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'EL_DS', 'DS사업부', 'Device Solutions', 'EL_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'EL_DX', 'DX사업부', 'Digital Experience', 'EL_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'EL_NET', '네트워크사업부', 'Network Business', 'EL_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'EL_RND', '연구개발본부', 'R&D Center', 'EL_ROOT', 2, 5);
    PERFORM create_department(v_tenant_id, 'EL_GLOBAL', '글로벌영업본부', 'Global Sales', 'EL_ROOT', 2, 6);

    -- 경영지원본부 (EL_MGMT) 하위
    PERFORM create_department(v_tenant_id, 'EL_HR', '인사팀', 'HR Team', 'EL_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_GA', '총무팀', 'General Affairs', 'EL_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_FIN', '재무팀', 'Finance Team', 'EL_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_ACCT', '회계팀', 'Accounting Team', 'EL_MGMT', 3, 4);
    PERFORM create_department(v_tenant_id, 'EL_LEGAL', '법무팀', 'Legal Team', 'EL_MGMT', 3, 5);
    PERFORM create_department(v_tenant_id, 'EL_IT', 'IT인프라팀', 'IT Infrastructure', 'EL_MGMT', 3, 6);
    PERFORM create_department(v_tenant_id, 'EL_PR', '홍보팀', 'PR Team', 'EL_MGMT', 3, 7);
    PERFORM create_department(v_tenant_id, 'EL_PURCHASE', '구매팀', 'Procurement', 'EL_MGMT', 3, 8);

    -- DS사업부 (반도체) 하위 - 메모리
    PERFORM create_department(v_tenant_id, 'EL_MEMORY', '메모리사업부', 'Memory Division', 'EL_DS', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_DRAM', 'DRAM개발팀', 'DRAM Development', 'EL_MEMORY', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_NAND', 'NAND개발팀', 'NAND Development', 'EL_MEMORY', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_MEM_PROC', '메모리공정팀', 'Memory Process', 'EL_MEMORY', 4, 3);
    PERFORM create_department(v_tenant_id, 'EL_MEM_QA', '메모리품질팀', 'Memory QA', 'EL_MEMORY', 4, 4);
    PERFORM create_department(v_tenant_id, 'EL_MEM_PROD', '메모리생산팀', 'Memory Production', 'EL_MEMORY', 4, 5);

    -- DS사업부 - 시스템LSI
    PERFORM create_department(v_tenant_id, 'EL_LSI', '시스템LSI사업부', 'System LSI Division', 'EL_DS', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_AP', 'AP개발팀', 'AP Development', 'EL_LSI', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_MODEM', '모뎀개발팀', 'Modem Development', 'EL_LSI', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_SENSOR', '센서개발팀', 'Sensor Development', 'EL_LSI', 4, 3);
    PERFORM create_department(v_tenant_id, 'EL_LSI_PROC', 'LSI공정팀', 'LSI Process', 'EL_LSI', 4, 4);
    PERFORM create_department(v_tenant_id, 'EL_FOUNDRY', '파운드리팀', 'Foundry', 'EL_LSI', 4, 5);

    -- DS사업부 - 디스플레이
    PERFORM create_department(v_tenant_id, 'EL_DISP', '디스플레이사업부', 'Display Division', 'EL_DS', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_OLED', 'OLED개발팀', 'OLED Development', 'EL_DISP', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_LCD', 'LCD개발팀', 'LCD Development', 'EL_DISP', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_DISP_PROD', '디스플레이생산팀', 'Display Production', 'EL_DISP', 4, 3);

    -- DX사업부 (가전) 하위
    PERFORM create_department(v_tenant_id, 'EL_TV', 'TV사업부', 'TV Division', 'EL_DX', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_TV_DEV', 'TV개발팀', 'TV Development', 'EL_TV', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_TV_PROD', 'TV생산팀', 'TV Production', 'EL_TV', 4, 2);

    PERFORM create_department(v_tenant_id, 'EL_HA', '생활가전사업부', 'Home Appliance Division', 'EL_DX', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_REF', '냉장고개발팀', 'Refrigerator Dev', 'EL_HA', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_WASH', '세탁기개발팀', 'Washing Machine Dev', 'EL_HA', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_AC', '에어컨개발팀', 'Air Conditioner Dev', 'EL_HA', 4, 3);
    PERFORM create_department(v_tenant_id, 'EL_HA_PROD', '가전생산팀', 'HA Production', 'EL_HA', 4, 4);

    PERFORM create_department(v_tenant_id, 'EL_MOBILE', '모바일사업부', 'Mobile Division', 'EL_DX', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_PHONE', '스마트폰개발팀', 'Smartphone Dev', 'EL_MOBILE', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_TABLET', '태블릿개발팀', 'Tablet Dev', 'EL_MOBILE', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_WEAR', '웨어러블개발팀', 'Wearable Dev', 'EL_MOBILE', 4, 3);
    PERFORM create_department(v_tenant_id, 'EL_MOB_PROD', '모바일생산팀', 'Mobile Production', 'EL_MOBILE', 4, 4);

    -- 네트워크사업부 하위
    PERFORM create_department(v_tenant_id, 'EL_5G', '5G개발팀', '5G Development', 'EL_NET', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_INFRA', '통신인프라팀', 'Network Infrastructure', 'EL_NET', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_NET_SALES', '네트워크영업팀', 'Network Sales', 'EL_NET', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_NET_PROD', '네트워크생산팀', 'Network Production', 'EL_NET', 3, 4);

    -- 연구개발본부 하위
    PERFORM create_department(v_tenant_id, 'EL_AI', 'AI연구소', 'AI Research Lab', 'EL_RND', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_AI_VISION', '비전AI팀', 'Vision AI', 'EL_AI', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_AI_NLP', '자연어AI팀', 'NLP AI', 'EL_AI', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_AI_ROBOT', '로보틱스AI팀', 'Robotics AI', 'EL_AI', 4, 3);

    PERFORM create_department(v_tenant_id, 'EL_ADV', '선행기술연구소', 'Advanced Tech Lab', 'EL_RND', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_QUANTUM', '양자컴퓨팅팀', 'Quantum Computing', 'EL_ADV', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_NANO', '나노기술팀', 'Nanotechnology', 'EL_ADV', 4, 2);

    PERFORM create_department(v_tenant_id, 'EL_SW', 'SW개발센터', 'SW Development Center', 'EL_RND', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_TIZEN', '타이젠개발팀', 'Tizen Development', 'EL_SW', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_SMART', '스마트싱스개발팀', 'SmartThings Dev', 'EL_SW', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_CLOUD', '클라우드개발팀', 'Cloud Development', 'EL_SW', 4, 3);

    PERFORM create_department(v_tenant_id, 'EL_DESIGN', '디자인센터', 'Design Center', 'EL_RND', 3, 4);
    PERFORM create_department(v_tenant_id, 'EL_UX', 'UX디자인팀', 'UX Design', 'EL_DESIGN', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_ID', '제품디자인팀', 'Industrial Design', 'EL_DESIGN', 4, 2);

    -- 글로벌영업본부 하위
    PERFORM create_department(v_tenant_id, 'EL_KOREA', '한국영업팀', 'Korea Sales', 'EL_GLOBAL', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_NA', '북미영업팀', 'North America Sales', 'EL_GLOBAL', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_EU', '유럽영업팀', 'Europe Sales', 'EL_GLOBAL', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_CHINA', '중국영업팀', 'China Sales', 'EL_GLOBAL', 3, 4);
    PERFORM create_department(v_tenant_id, 'EL_SEA', '동남아영업팀', 'Southeast Asia Sales', 'EL_GLOBAL', 3, 5);
    PERFORM create_department(v_tenant_id, 'EL_B2B', 'B2B영업팀', 'B2B Sales', 'EL_GLOBAL', 3, 6);
    PERFORM create_department(v_tenant_id, 'EL_SERVICE', '고객서비스팀', 'Customer Service', 'EL_GLOBAL', 3, 7);
    PERFORM create_department(v_tenant_id, 'EL_MKT', '마케팅팀', 'Marketing', 'EL_GLOBAL', 3, 8);

    -- 추가 지원 부서
    PERFORM create_department(v_tenant_id, 'EL_QA', '품질경영센터', 'Quality Management', 'EL_ROOT', 2, 7);
    PERFORM create_department(v_tenant_id, 'EL_QA1', '품질기획팀', 'Quality Planning', 'EL_QA', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_QA2', '품질검증팀', 'Quality Verification', 'EL_QA', 3, 2);

    PERFORM create_department(v_tenant_id, 'EL_ESG', 'ESG경영센터', 'ESG Management', 'EL_ROOT', 2, 8);
    PERFORM create_department(v_tenant_id, 'EL_ENV', '환경안전팀', 'Environment Safety', 'EL_ESG', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_SOCIAL', '사회공헌팀', 'Social Contribution', 'EL_ESG', 3, 2);
END $$;

-- ============================================================================
-- 3. 한성SDI (HANSUNG_SDI) - 40개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000003';
BEGIN
    PERFORM create_department(v_tenant_id, 'SDI_ROOT', '한성SDI', 'Hansung SDI', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'SDI_MGMT', '경영지원본부', 'Management Support', 'SDI_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'SDI_BATT', '배터리사업본부', 'Battery Business', 'SDI_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'SDI_EV', 'EV배터리본부', 'EV Battery', 'SDI_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'SDI_ESS', 'ESS사업본부', 'ESS Business', 'SDI_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'SDI_RND', '연구개발본부', 'R&D', 'SDI_ROOT', 2, 5);
    PERFORM create_department(v_tenant_id, 'SDI_PROD', '생산본부', 'Production', 'SDI_ROOT', 2, 6);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'SDI_HR', '인사팀', 'HR Team', 'SDI_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_FIN', '재무팀', 'Finance Team', 'SDI_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_GA', '총무팀', 'General Affairs', 'SDI_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'SDI_PURCHASE', '구매팀', 'Procurement', 'SDI_MGMT', 3, 4);

    -- 배터리사업
    PERFORM create_department(v_tenant_id, 'SDI_CELL', '셀개발팀', 'Cell Development', 'SDI_BATT', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_PACK', '팩개발팀', 'Pack Development', 'SDI_BATT', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_MAT', '소재개발팀', 'Material Development', 'SDI_BATT', 3, 3);

    -- EV배터리
    PERFORM create_department(v_tenant_id, 'SDI_EV_DEV', 'EV개발팀', 'EV Development', 'SDI_EV', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_EV_SALES', 'EV영업팀', 'EV Sales', 'SDI_EV', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_EV_QA', 'EV품질팀', 'EV Quality', 'SDI_EV', 3, 3);

    -- ESS
    PERFORM create_department(v_tenant_id, 'SDI_ESS_DEV', 'ESS개발팀', 'ESS Development', 'SDI_ESS', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_ESS_SALES', 'ESS영업팀', 'ESS Sales', 'SDI_ESS', 3, 2);

    -- 연구개발
    PERFORM create_department(v_tenant_id, 'SDI_NEXT', '차세대기술팀', 'Next-Gen Tech', 'SDI_RND', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_SOLID', '전고체배터리팀', 'Solid State Battery', 'SDI_RND', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_RECYCLE', '재활용기술팀', 'Recycling Tech', 'SDI_RND', 3, 3);

    -- 생산
    PERFORM create_department(v_tenant_id, 'SDI_PROD1', '배터리생산1팀', 'Battery Production 1', 'SDI_PROD', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_PROD2', '배터리생산2팀', 'Battery Production 2', 'SDI_PROD', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_PROD_QA', '생산품질팀', 'Production QA', 'SDI_PROD', 3, 3);
    PERFORM create_department(v_tenant_id, 'SDI_SAFETY', '안전환경팀', 'Safety & Environment', 'SDI_PROD', 3, 4);

    -- 영업
    PERFORM create_department(v_tenant_id, 'SDI_SALES', '글로벌영업본부', 'Global Sales', 'SDI_ROOT', 2, 7);
    PERFORM create_department(v_tenant_id, 'SDI_KOREA', '국내영업팀', 'Korea Sales', 'SDI_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_OVERSEAS', '해외영업팀', 'Overseas Sales', 'SDI_SALES', 3, 2);
END $$;

-- ============================================================================
-- 4. 한성엔지니어링 (HANSUNG_ENG) - 35개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000004';
BEGIN
    PERFORM create_department(v_tenant_id, 'ENG_ROOT', '한성엔지니어링', 'Hansung Engineering', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'ENG_MGMT', '경영지원본부', 'Management Support', 'ENG_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'ENG_BUILD', '건축사업본부', 'Building Construction', 'ENG_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'ENG_CIVIL', '토목사업본부', 'Civil Engineering', 'ENG_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'ENG_PLANT', '플랜트사업본부', 'Plant Business', 'ENG_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'ENG_DESIGN', '설계본부', 'Design Center', 'ENG_ROOT', 2, 5);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'ENG_HR', '인사팀', 'HR Team', 'ENG_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_FIN', '재무팀', 'Finance Team', 'ENG_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_GA', '총무팀', 'General Affairs', 'ENG_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'ENG_SAFETY', '안전관리팀', 'Safety Management', 'ENG_MGMT', 3, 4);

    -- 건축
    PERFORM create_department(v_tenant_id, 'ENG_RESI', '주거건축팀', 'Residential', 'ENG_BUILD', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_COMM', '상업건축팀', 'Commercial', 'ENG_BUILD', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_BUILD_PM', '건축PM팀', 'Building PM', 'ENG_BUILD', 3, 3);

    -- 토목
    PERFORM create_department(v_tenant_id, 'ENG_ROAD', '도로교량팀', 'Road & Bridge', 'ENG_CIVIL', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_TUNNEL', '터널지하팀', 'Tunnel & Underground', 'ENG_CIVIL', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_WATER', '상하수도팀', 'Water & Sewage', 'ENG_CIVIL', 3, 3);

    -- 플랜트
    PERFORM create_department(v_tenant_id, 'ENG_PETRO', '석유화학팀', 'Petrochemical', 'ENG_PLANT', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_POWER', '발전플랜트팀', 'Power Plant', 'ENG_PLANT', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_ENV', '환경플랜트팀', 'Environmental Plant', 'ENG_PLANT', 3, 3);
    PERFORM create_department(v_tenant_id, 'ENG_PLANT_PM', '프로젝트관리팀', 'Project Management', 'ENG_PLANT', 3, 4);

    -- 설계
    PERFORM create_department(v_tenant_id, 'ENG_ARCH', '건축설계팀', 'Architectural Design', 'ENG_DESIGN', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_STRUCT', '구조설계팀', 'Structural Design', 'ENG_DESIGN', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_MEP', '설비설계팀', 'MEP Design', 'ENG_DESIGN', 3, 3);

    -- 해외
    PERFORM create_department(v_tenant_id, 'ENG_GLOBAL', '해외사업본부', 'Global Business', 'ENG_ROOT', 2, 6);
    PERFORM create_department(v_tenant_id, 'ENG_ME', '중동사업팀', 'Middle East', 'ENG_GLOBAL', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_SEA', '동남아사업팀', 'Southeast Asia', 'ENG_GLOBAL', 3, 2);
END $$;

-- ============================================================================
-- 5. 한성바이오 (HANSUNG_BIO) - 30개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000005';
BEGIN
    PERFORM create_department(v_tenant_id, 'BIO_ROOT', '한성바이오', 'Hansung Bio', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'BIO_MGMT', '경영지원본부', 'Management Support', 'BIO_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'BIO_RND', '연구소', 'Research Center', 'BIO_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'BIO_PHARMA', '제약사업본부', 'Pharmaceutical', 'BIO_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'BIO_CELL', '세포치료제본부', 'Cell Therapy', 'BIO_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'BIO_PROD', '생산본부', 'Production', 'BIO_ROOT', 2, 5);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'BIO_HR', '인사팀', 'HR Team', 'BIO_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_FIN', '재무팀', 'Finance Team', 'BIO_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'BIO_LEGAL', '법무팀', 'Legal Team', 'BIO_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'BIO_RA', 'RA팀', 'Regulatory Affairs', 'BIO_MGMT', 3, 4);

    -- 연구소
    PERFORM create_department(v_tenant_id, 'BIO_DRUG', '신약개발팀', 'Drug Development', 'BIO_RND', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_PRECLIN', '비임상팀', 'Preclinical', 'BIO_RND', 3, 2);
    PERFORM create_department(v_tenant_id, 'BIO_CLIN', '임상팀', 'Clinical', 'BIO_RND', 3, 3);
    PERFORM create_department(v_tenant_id, 'BIO_BIO', '바이오분석팀', 'Bioanalysis', 'BIO_RND', 3, 4);

    -- 제약
    PERFORM create_department(v_tenant_id, 'BIO_FORM', '제형연구팀', 'Formulation', 'BIO_PHARMA', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_GENERIC', '제네릭개발팀', 'Generic Dev', 'BIO_PHARMA', 3, 2);
    PERFORM create_department(v_tenant_id, 'BIO_CMO', 'CMO사업팀', 'CMO Business', 'BIO_PHARMA', 3, 3);

    -- 세포치료
    PERFORM create_department(v_tenant_id, 'BIO_STEM', '줄기세포팀', 'Stem Cell', 'BIO_CELL', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_CAR', 'CAR-T개발팀', 'CAR-T Development', 'BIO_CELL', 3, 2);

    -- 생산
    PERFORM create_department(v_tenant_id, 'BIO_MFG', '제조팀', 'Manufacturing', 'BIO_PROD', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_QA', '품질보증팀', 'Quality Assurance', 'BIO_PROD', 3, 2);
    PERFORM create_department(v_tenant_id, 'BIO_QC', '품질관리팀', 'Quality Control', 'BIO_PROD', 3, 3);

    -- 영업
    PERFORM create_department(v_tenant_id, 'BIO_SALES', '영업본부', 'Sales', 'BIO_ROOT', 2, 6);
    PERFORM create_department(v_tenant_id, 'BIO_DOM', '국내영업팀', 'Domestic Sales', 'BIO_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_EXP', '수출팀', 'Export', 'BIO_SALES', 3, 2);
END $$;

-- ============================================================================
-- 6. 한성화학 (HANSUNG_CHEM) - 35개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000006';
BEGIN
    PERFORM create_department(v_tenant_id, 'CHEM_ROOT', '한성화학', 'Hansung Chemical', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'CHEM_MGMT', '경영지원본부', 'Management Support', 'CHEM_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_PETRO', '석유화학본부', 'Petrochemical', 'CHEM_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_ADV', '첨단소재본부', 'Advanced Materials', 'CHEM_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'CHEM_RND', '연구개발본부', 'R&D', 'CHEM_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'CHEM_PROD', '생산본부', 'Production', 'CHEM_ROOT', 2, 5);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'CHEM_HR', '인사팀', 'HR Team', 'CHEM_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_FIN', '재무팀', 'Finance Team', 'CHEM_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_GA', '총무팀', 'General Affairs', 'CHEM_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'CHEM_EHS', '환경안전팀', 'EHS Team', 'CHEM_MGMT', 3, 4);

    -- 석유화학
    PERFORM create_department(v_tenant_id, 'CHEM_OLEFIN', '올레핀팀', 'Olefins', 'CHEM_PETRO', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_AROM', '아로마틱스팀', 'Aromatics', 'CHEM_PETRO', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_POLY', '폴리머팀', 'Polymers', 'CHEM_PETRO', 3, 3);

    -- 첨단소재
    PERFORM create_department(v_tenant_id, 'CHEM_ELEC', '전자소재팀', 'Electronic Materials', 'CHEM_ADV', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_BATT', '배터리소재팀', 'Battery Materials', 'CHEM_ADV', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_COMP', '복합소재팀', 'Composite Materials', 'CHEM_ADV', 3, 3);

    -- 연구개발
    PERFORM create_department(v_tenant_id, 'CHEM_PROC', '공정연구팀', 'Process Research', 'CHEM_RND', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_APP', '응용연구팀', 'Application Research', 'CHEM_RND', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_GREEN', '친환경연구팀', 'Green Chemistry', 'CHEM_RND', 3, 3);

    -- 생산
    PERFORM create_department(v_tenant_id, 'CHEM_PLANT1', '울산공장', 'Ulsan Plant', 'CHEM_PROD', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_PLANT2', '여수공장', 'Yeosu Plant', 'CHEM_PROD', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_QA', '품질관리팀', 'Quality Management', 'CHEM_PROD', 3, 3);

    -- 영업
    PERFORM create_department(v_tenant_id, 'CHEM_SALES', '영업본부', 'Sales', 'CHEM_ROOT', 2, 6);
    PERFORM create_department(v_tenant_id, 'CHEM_DOM', '국내영업팀', 'Domestic Sales', 'CHEM_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_EXP', '수출팀', 'Export', 'CHEM_SALES', 3, 2);
END $$;

-- ============================================================================
-- 7. 한성IT서비스 (HANSUNG_IT) - 30개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000007';
BEGIN
    PERFORM create_department(v_tenant_id, 'IT_ROOT', '한성IT서비스', 'Hansung IT Service', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'IT_MGMT', '경영지원본부', 'Management Support', 'IT_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'IT_DEV', '개발본부', 'Development', 'IT_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'IT_INFRA', '인프라본부', 'Infrastructure', 'IT_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'IT_CONS', '컨설팅본부', 'Consulting', 'IT_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'IT_SALES', '영업본부', 'Sales', 'IT_ROOT', 2, 5);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'IT_HR', '인사팀', 'HR Team', 'IT_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_FIN', '재무팀', 'Finance Team', 'IT_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'IT_GA', '총무팀', 'General Affairs', 'IT_MGMT', 3, 3);

    -- 개발
    PERFORM create_department(v_tenant_id, 'IT_SOL', '솔루션개발팀', 'Solution Development', 'IT_DEV', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_ERP', 'ERP개발팀', 'ERP Development', 'IT_DEV', 3, 2);
    PERFORM create_department(v_tenant_id, 'IT_WEB', '웹개발팀', 'Web Development', 'IT_DEV', 3, 3);
    PERFORM create_department(v_tenant_id, 'IT_MOBILE', '모바일개발팀', 'Mobile Development', 'IT_DEV', 3, 4);
    PERFORM create_department(v_tenant_id, 'IT_AI', 'AI개발팀', 'AI Development', 'IT_DEV', 3, 5);
    PERFORM create_department(v_tenant_id, 'IT_QA', 'QA팀', 'QA Team', 'IT_DEV', 3, 6);

    -- 인프라
    PERFORM create_department(v_tenant_id, 'IT_CLOUD', '클라우드팀', 'Cloud Team', 'IT_INFRA', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_NET', '네트워크팀', 'Network Team', 'IT_INFRA', 3, 2);
    PERFORM create_department(v_tenant_id, 'IT_SEC', '보안팀', 'Security Team', 'IT_INFRA', 3, 3);
    PERFORM create_department(v_tenant_id, 'IT_OPS', '운영팀', 'Operations Team', 'IT_INFRA', 3, 4);

    -- 컨설팅
    PERFORM create_department(v_tenant_id, 'IT_BIZ', '비즈니스컨설팅팀', 'Business Consulting', 'IT_CONS', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_DX', 'DX컨설팅팀', 'DX Consulting', 'IT_CONS', 3, 2);

    -- 영업
    PERFORM create_department(v_tenant_id, 'IT_SALES1', '영업1팀', 'Sales Team 1', 'IT_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_SALES2', '영업2팀', 'Sales Team 2', 'IT_SALES', 3, 2);
    PERFORM create_department(v_tenant_id, 'IT_PM', 'PM팀', 'PM Team', 'IT_SALES', 3, 3);
END $$;

-- ============================================================================
-- 8. 한성생명 (HANSUNG_LIFE) - 45개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000008';
BEGIN
    PERFORM create_department(v_tenant_id, 'LIFE_ROOT', '한성생명', 'Hansung Life', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'LIFE_MGMT', '경영지원본부', 'Management Support', 'LIFE_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_SALES', '영업본부', 'Sales', 'LIFE_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_PROD', '상품본부', 'Product', 'LIFE_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_ACT', '계리본부', 'Actuarial', 'LIFE_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'LIFE_CLAIM', '보상본부', 'Claims', 'LIFE_ROOT', 2, 5);
    PERFORM create_department(v_tenant_id, 'LIFE_RISK', '리스크관리본부', 'Risk Management', 'LIFE_ROOT', 2, 6);
    PERFORM create_department(v_tenant_id, 'LIFE_IT', 'IT본부', 'IT', 'LIFE_ROOT', 2, 7);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'LIFE_HR', '인사팀', 'HR Team', 'LIFE_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_FIN', '재무팀', 'Finance Team', 'LIFE_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_GA', '총무팀', 'General Affairs', 'LIFE_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_LEGAL', '법무팀', 'Legal Team', 'LIFE_MGMT', 3, 4);
    PERFORM create_department(v_tenant_id, 'LIFE_COMP', '준법감시팀', 'Compliance', 'LIFE_MGMT', 3, 5);

    -- 영업
    PERFORM create_department(v_tenant_id, 'LIFE_CORP', '법인영업팀', 'Corporate Sales', 'LIFE_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_RETAIL', '개인영업팀', 'Retail Sales', 'LIFE_SALES', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_GA_CH', 'GA채널팀', 'GA Channel', 'LIFE_SALES', 3, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_BANK', '방카채널팀', 'Bancassurance', 'LIFE_SALES', 3, 4);
    PERFORM create_department(v_tenant_id, 'LIFE_TELE', '텔레마케팅팀', 'Telemarketing', 'LIFE_SALES', 3, 5);
    PERFORM create_department(v_tenant_id, 'LIFE_ONLINE', '온라인영업팀', 'Online Sales', 'LIFE_SALES', 3, 6);

    -- 상품
    PERFORM create_department(v_tenant_id, 'LIFE_LIFE', '생명보험팀', 'Life Insurance', 'LIFE_PROD', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_HEALTH', '건강보험팀', 'Health Insurance', 'LIFE_PROD', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_PENSION', '연금팀', 'Pension', 'LIFE_PROD', 3, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_VAR', '변액팀', 'Variable Insurance', 'LIFE_PROD', 3, 4);

    -- 계리
    PERFORM create_department(v_tenant_id, 'LIFE_PRICE', '가격계리팀', 'Pricing', 'LIFE_ACT', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_RES', '책임준비금팀', 'Reserves', 'LIFE_ACT', 3, 2);

    -- 보상
    PERFORM create_department(v_tenant_id, 'LIFE_UW', '언더라이팅팀', 'Underwriting', 'LIFE_CLAIM', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_CLAIM1', '보험금심사팀', 'Claims Review', 'LIFE_CLAIM', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_SIU', 'SIU팀', 'Special Investigation', 'LIFE_CLAIM', 3, 3);

    -- 리스크
    PERFORM create_department(v_tenant_id, 'LIFE_CREDIT', '신용리스크팀', 'Credit Risk', 'LIFE_RISK', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_MARKET', '시장리스크팀', 'Market Risk', 'LIFE_RISK', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_OPRISK', '운영리스크팀', 'Operational Risk', 'LIFE_RISK', 3, 3);

    -- IT
    PERFORM create_department(v_tenant_id, 'LIFE_DEV', '개발팀', 'Development', 'LIFE_IT', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_INFRA', '인프라팀', 'Infrastructure', 'LIFE_IT', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_SEC', '정보보안팀', 'Information Security', 'LIFE_IT', 3, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_DATA', '데이터팀', 'Data Team', 'LIFE_IT', 3, 4);

    -- 고객센터
    PERFORM create_department(v_tenant_id, 'LIFE_CS', '고객서비스본부', 'Customer Service', 'LIFE_ROOT', 2, 8);
    PERFORM create_department(v_tenant_id, 'LIFE_CALL', '콜센터', 'Call Center', 'LIFE_CS', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_BRANCH', '지점운영팀', 'Branch Operations', 'LIFE_CS', 3, 2);
END $$;

-- 임시 함수 삭제
DROP FUNCTION IF EXISTS create_department;

COMMIT;

-- 검증
DO $$
DECLARE
    dept_count INT;
    tenant_name VARCHAR;
    tenant_dept_count INT;
BEGIN
    SELECT COUNT(*) INTO dept_count FROM hr_core.department;
    RAISE NOTICE '총 부서 수: % 개', dept_count;

    FOR tenant_name, tenant_dept_count IN
        SELECT t.name, COUNT(d.id)
        FROM tenant_common.tenant t
        LEFT JOIN hr_core.department d ON t.id = d.tenant_id
        GROUP BY t.name
        ORDER BY COUNT(d.id) DESC
    LOOP
        RAISE NOTICE '  - %: % 개', tenant_name, tenant_dept_count;
    END LOOP;
END $$;

-- ============================================================================
-- FILE: 07_employee_generator.sql
-- ============================================================================

-- ============================================================================
-- 07_employee_generator.sql
-- 직원 대량 생성을 위한 함수 및 데이터 정의
-- ============================================================================

-- ============================================================================
-- 한국 이름 데이터 테이블 (임시)
-- ============================================================================

-- 성씨 테이블 (통계 기반 분포)
CREATE TEMP TABLE IF NOT EXISTS korean_surnames (
    surname VARCHAR(2),
    surname_en VARCHAR(10),
    frequency INT  -- 인구 비율 (만분율)
);

INSERT INTO korean_surnames VALUES
    ('김', 'Kim', 2150), ('이', 'Lee', 1470), ('박', 'Park', 840), ('최', 'Choi', 470),
    ('정', 'Jung', 440), ('강', 'Kang', 250), ('조', 'Cho', 210), ('윤', 'Yoon', 200),
    ('장', 'Jang', 190), ('임', 'Lim', 170), ('한', 'Han', 150), ('오', 'Oh', 140),
    ('서', 'Seo', 130), ('신', 'Shin', 120), ('권', 'Kwon', 110), ('황', 'Hwang', 100),
    ('안', 'Ahn', 95), ('송', 'Song', 90), ('류', 'Ryu', 85), ('전', 'Jeon', 80),
    ('홍', 'Hong', 75), ('고', 'Ko', 70), ('문', 'Moon', 68), ('양', 'Yang', 66),
    ('손', 'Son', 65), ('배', 'Bae', 60), ('조', 'Jo', 58), ('백', 'Baek', 55),
    ('허', 'Heo', 52), ('유', 'Yoo', 50), ('남', 'Nam', 48), ('심', 'Shim', 45),
    ('노', 'Noh', 42), ('하', 'Ha', 40), ('곽', 'Kwak', 38), ('성', 'Sung', 35),
    ('차', 'Cha', 33), ('주', 'Joo', 30), ('우', 'Woo', 28), ('구', 'Koo', 26),
    ('민', 'Min', 24), ('진', 'Jin', 22), ('지', 'Ji', 20), ('엄', 'Eom', 18),
    ('채', 'Chae', 16), ('원', 'Won', 14), ('방', 'Bang', 12), ('천', 'Cheon', 10),
    ('공', 'Kong', 8), ('여', 'Yeo', 6);

-- 남자 이름 테이블
CREATE TEMP TABLE IF NOT EXISTS korean_male_names (
    name VARCHAR(4),
    name_en VARCHAR(15)
);

INSERT INTO korean_male_names VALUES
    ('민준', 'Minjun'), ('서준', 'Seojun'), ('예준', 'Yejun'), ('도윤', 'Doyun'),
    ('시우', 'Siwoo'), ('주원', 'Juwon'), ('하준', 'Hajun'), ('지호', 'Jiho'),
    ('준서', 'Junseo'), ('준우', 'Junwoo'), ('현우', 'Hyunwoo'), ('도현', 'Dohyun'),
    ('지훈', 'Jihoon'), ('건우', 'Gunwoo'), ('우진', 'Woojin'), ('민재', 'Minjae'),
    ('현준', 'Hyunjun'), ('선우', 'Sunwoo'), ('서진', 'Seojin'), ('연우', 'Yeonwoo'),
    ('유준', 'Yujun'), ('정우', 'Jungwoo'), ('승현', 'Seunghyun'), ('준혁', 'Junhyuk'),
    ('민성', 'Minsung'), ('지원', 'Jiwon'), ('재원', 'Jaewon'), ('승민', 'Seungmin'),
    ('성민', 'Sungmin'), ('재민', 'Jaemin'), ('동현', 'Donghyun'), ('은우', 'Eunwoo'),
    ('태현', 'Taehyun'), ('재현', 'Jaehyun'), ('지안', 'Jian'), ('시현', 'Sihyun'),
    ('승우', 'Seungwoo'), ('윤우', 'Yunwoo'), ('지성', 'Jisung'), ('한결', 'Hangyul'),
    ('민규', 'Mingyu'), ('성준', 'Sungjun'), ('재윤', 'Jaeyun'), ('준영', 'Junyoung'),
    ('지환', 'Jihwan'), ('태민', 'Taemin'), ('성현', 'Sunghyun'), ('우성', 'Woosung'),
    ('영민', 'Youngmin'), ('정민', 'Jungmin'), ('대호', 'Daeho'), ('광수', 'Kwangsu'),
    ('상현', 'Sanghyun'), ('용준', 'Yongjun'), ('철수', 'Chulsoo'), ('영호', 'Youngho'),
    ('성호', 'Sungho'), ('재호', 'Jaeho'), ('민호', 'Minho'), ('준호', 'Junho'),
    ('정호', 'Jungho'), ('동욱', 'Dongwook'), ('상민', 'Sangmin'), ('형준', 'Hyungjun'),
    ('기현', 'Kihyun'), ('진우', 'Jinwoo'), ('태영', 'Taeyoung'), ('수호', 'Suho'),
    ('건', 'Gun'), ('민', 'Min'), ('훈', 'Hoon'), ('혁', 'Hyuk'),
    ('찬', 'Chan'), ('빈', 'Bin'), ('진', 'Jin'), ('호', 'Ho'),
    ('성재', 'Sungjae'), ('현석', 'Hyunsuk'), ('지웅', 'Jiwoong'), ('도훈', 'Dohoon'),
    ('우현', 'Woohyun'), ('기범', 'Kibum'), ('주혁', 'Juhyuk'), ('세준', 'Sejun'),
    ('영준', 'Youngjun'), ('원준', 'Wonjun'), ('시훈', 'Sihoon'), ('재훈', 'Jaehoon'),
    ('현진', 'Hyunjin'), ('태준', 'Taejun'), ('종현', 'Jonghyun'), ('우빈', 'Woobin'),
    ('세훈', 'Sehun'), ('동훈', 'Donghoon'), ('상호', 'Sangho'), ('창민', 'Changmin'),
    ('동민', 'Dongmin'), ('기훈', 'Kihoon'), ('정훈', 'Junghoon'), ('승호', 'Seungho');

-- 여자 이름 테이블
CREATE TEMP TABLE IF NOT EXISTS korean_female_names (
    name VARCHAR(4),
    name_en VARCHAR(15)
);

INSERT INTO korean_female_names VALUES
    ('서연', 'Seoyeon'), ('서윤', 'Seoyun'), ('지우', 'Jiwoo'), ('서현', 'Seohyun'),
    ('민서', 'Minseo'), ('하윤', 'Hayun'), ('하은', 'Haeun'), ('지유', 'Jiyu'),
    ('채원', 'Chaewon'), ('지민', 'Jimin'), ('수아', 'Sua'), ('지아', 'Jia'),
    ('지윤', 'Jiyun'), ('다은', 'Daeun'), ('은서', 'Eunseo'), ('예은', 'Yeeun'),
    ('수빈', 'Subin'), ('소율', 'Soyul'), ('예린', 'Yerin'), ('아린', 'Arin'),
    ('하린', 'Harin'), ('유진', 'Yujin'), ('소민', 'Somin'), ('예나', 'Yena'),
    ('지현', 'Jihyun'), ('수민', 'Sumin'), ('채은', 'Chaeeun'), ('윤아', 'Yoona'),
    ('나윤', 'Nayun'), ('민지', 'Minji'), ('소연', 'Soyeon'), ('유나', 'Yuna'),
    ('은지', 'Eunji'), ('현지', 'Hyunji'), ('민정', 'Minjeong'), ('수연', 'Sooyeon'),
    ('지영', 'Jiyoung'), ('혜진', 'Hyejin'), ('예지', 'Yeji'), ('미영', 'Miyoung'),
    ('정은', 'Jungeun'), ('혜원', 'Hyewon'), ('다인', 'Dain'), ('시은', 'Sieun'),
    ('하영', 'Hayoung'), ('세은', 'Seeun'), ('민아', 'Mina'), ('예원', 'Yewon'),
    ('주하', 'Juha'), ('시연', 'Siyeon'), ('윤서', 'Yunseo'), ('소영', 'Soyoung'),
    ('정아', 'Junga'), ('은비', 'Eunbi'), ('세아', 'Sea'), ('다연', 'Dayeon'),
    ('시아', 'Sia'), ('연지', 'Yeonji'), ('수현', 'Suhyun'), ('지은', 'Jieun'),
    ('은영', 'Eunyoung'), ('미진', 'Mijin'), ('선영', 'Sunyoung'), ('현정', 'Hyunjeong'),
    ('영희', 'Younghee'), ('순자', 'Sunja'), ('정숙', 'Jungsook'), ('영자', 'Youngja'),
    ('옥순', 'Oksoon'), ('미숙', 'Misook'), ('경희', 'Kyunghee'), ('정희', 'Junghee'),
    ('성희', 'Sunghee'), ('영순', 'Youngsoon'), ('은주', 'Eunju'), ('미란', 'Miran'),
    ('혜정', 'Hyejeong'), ('보라', 'Bora'), ('유정', 'Yujeong'), ('세영', 'Seyoung'),
    ('진아', 'Jina'), ('하나', 'Hana'), ('서영', 'Seoyoung'), ('성은', 'Sungeun'),
    ('수정', 'Sujeong'), ('혜림', 'Hyerim'), ('연서', 'Yeonseo'), ('정윤', 'Jungyun'),
    ('은채', 'Eunchae'), ('채린', 'Chaerin'), ('아영', 'Ayoung'), ('나영', 'Nayoung'),
    ('희진', 'Heejin'), ('지혜', 'Jihye'), ('은하', 'Eunha'), ('다희', 'Dahee');

-- ============================================================================
-- 테넌트별 직원 수 설정 테이블
-- ============================================================================
CREATE TEMP TABLE IF NOT EXISTS tenant_employee_config (
    tenant_code VARCHAR(20),
    target_count INT,
    emp_code_prefix VARCHAR(3),
    email_domain VARCHAR(50)
);

INSERT INTO tenant_employee_config VALUES
    ('HANSUNG_HD', 500, 'HHD', 'hansung-hd.co.kr'),
    ('HANSUNG_ELEC', 25000, 'HEL', 'hansung-elec.co.kr'),
    ('HANSUNG_SDI', 12000, 'HSI', 'hansung-sdi.co.kr'),
    ('HANSUNG_ENG', 8000, 'HEN', 'hansung-eng.co.kr'),
    ('HANSUNG_BIO', 5000, 'HBI', 'hansung-bio.co.kr'),
    ('HANSUNG_CHEM', 7000, 'HCH', 'hansung-chem.co.kr'),
    ('HANSUNG_IT', 4500, 'HIT', 'hansung-it.co.kr'),
    ('HANSUNG_LIFE', 13000, 'HLF', 'hansung-life.co.kr');

-- ============================================================================
-- 직원 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_employees(
    p_tenant_id UUID,
    p_tenant_code VARCHAR,
    p_emp_prefix VARCHAR,
    p_email_domain VARCHAR,
    p_target_count INT
) RETURNS INT AS $$
DECLARE
    v_count INT := 0;
    v_surname VARCHAR(2);
    v_surname_en VARCHAR(10);
    v_name VARCHAR(4);
    v_name_en VARCHAR(15);
    v_full_name VARCHAR(10);
    v_full_name_en VARCHAR(30);
    v_gender VARCHAR(10);
    v_employee_number VARCHAR(20);
    v_email VARCHAR(100);
    v_hire_year INT;
    v_hire_date DATE;
    v_grade_code VARCHAR(5);
    v_position_code VARCHAR(5);
    v_department_id UUID;
    v_dept_record RECORD;
    v_name_counter INT := 1;
    v_employment_type VARCHAR(20);
    v_batch_size INT := 1000;
    v_batch_count INT := 0;
BEGIN
    -- 부서 목록 조회 (루트 제외)
    FOR v_dept_record IN
        SELECT id, level
        FROM hr_core.department
        WHERE tenant_id = p_tenant_id
        AND level >= 3  -- 팀 레벨 이상
        ORDER BY RANDOM()
    LOOP
        -- 부서당 직원 수 결정 (레벨에 따라)
        FOR i IN 1..LEAST(50, GREATEST(5, 100 - v_dept_record.level * 20)) LOOP
            EXIT WHEN v_count >= p_target_count;

            -- 성별 랜덤 (남:여 = 6:4)
            v_gender := CASE WHEN RANDOM() < 0.6 THEN 'MALE' ELSE 'FEMALE' END;

            -- 성씨 랜덤 선택 (가중치 적용)
            SELECT surname, surname_en INTO v_surname, v_surname_en
            FROM korean_surnames
            ORDER BY RANDOM() * frequency DESC
            LIMIT 1;

            -- 이름 랜덤 선택
            IF v_gender = 'MALE' THEN
                SELECT name, name_en INTO v_name, v_name_en
                FROM korean_male_names
                ORDER BY RANDOM()
                LIMIT 1;
            ELSE
                SELECT name, name_en INTO v_name, v_name_en
                FROM korean_female_names
                ORDER BY RANDOM()
                LIMIT 1;
            END IF;

            v_full_name := v_surname || v_name;
            v_full_name_en := v_name_en || ' ' || v_surname_en;

            -- 입사년도 분포 (근속연수 기반)
            v_hire_year := CASE
                WHEN RANDOM() < 0.20 THEN 2024 + FLOOR(RANDOM() * 2)::INT  -- 0-2년: 20%
                WHEN RANDOM() < 0.45 THEN 2021 + FLOOR(RANDOM() * 3)::INT  -- 2-5년: 25%
                WHEN RANDOM() < 0.70 THEN 2016 + FLOOR(RANDOM() * 5)::INT  -- 5-10년: 25%
                WHEN RANDOM() < 0.90 THEN 2006 + FLOOR(RANDOM() * 10)::INT -- 10-20년: 20%
                ELSE 1995 + FLOOR(RANDOM() * 11)::INT                       -- 20년+: 10%
            END;

            v_hire_date := make_date(v_hire_year, 1 + FLOOR(RANDOM() * 12)::INT, 1 + FLOOR(RANDOM() * 28)::INT);

            -- 사원번호 생성: {PREFIX}{년도2자리}{순번5자리}
            v_employee_number := p_emp_prefix || RIGHT(v_hire_year::TEXT, 2) || LPAD(v_name_counter::TEXT, 5, '0');
            v_name_counter := v_name_counter + 1;

            -- 이메일 생성
            v_email := LOWER(v_name_en) || '.' || LOWER(v_surname_en) || LPAD(v_count::TEXT, 3, '0') || '@' || p_email_domain;

            -- 직급 분포 (근속연수 기반)
            v_grade_code := CASE
                WHEN v_hire_year >= 2024 THEN 'G01'  -- 사원
                WHEN v_hire_year >= 2022 THEN CASE WHEN RANDOM() < 0.7 THEN 'G01' ELSE 'G02' END
                WHEN v_hire_year >= 2019 THEN CASE WHEN RANDOM() < 0.5 THEN 'G02' ELSE 'G03' END
                WHEN v_hire_year >= 2015 THEN CASE WHEN RANDOM() < 0.6 THEN 'G03' ELSE 'G04' END
                WHEN v_hire_year >= 2010 THEN CASE WHEN RANDOM() < 0.5 THEN 'G04' ELSE 'G05' END
                WHEN v_hire_year >= 2005 THEN CASE WHEN RANDOM() < 0.6 THEN 'G05' ELSE 'G06' END
                WHEN v_hire_year >= 2000 THEN CASE WHEN RANDOM() < 0.7 THEN 'G06' WHEN RANDOM() < 0.9 THEN 'G07' ELSE 'G08' END
                ELSE CASE WHEN RANDOM() < 0.5 THEN 'G07' WHEN RANDOM() < 0.8 THEN 'G08' WHEN RANDOM() < 0.95 THEN 'G09' ELSE 'G10' END
            END;

            -- 직책 (직급에 따라)
            v_position_code := CASE
                WHEN v_grade_code = 'G01' THEN 'P01'
                WHEN v_grade_code = 'G02' THEN CASE WHEN RANDOM() < 0.8 THEN 'P01' ELSE 'P02' END
                WHEN v_grade_code = 'G03' THEN CASE WHEN RANDOM() < 0.7 THEN 'P02' ELSE 'P03' END
                WHEN v_grade_code = 'G04' THEN CASE WHEN RANDOM() < 0.6 THEN 'P03' ELSE 'P04' END
                WHEN v_grade_code = 'G05' THEN CASE WHEN RANDOM() < 0.5 THEN 'P04' WHEN RANDOM() < 0.8 THEN 'P05' ELSE 'P06' END
                WHEN v_grade_code = 'G06' THEN CASE WHEN RANDOM() < 0.7 THEN 'P06' ELSE 'P07' END
                WHEN v_grade_code IN ('G07', 'G08') THEN CASE WHEN RANDOM() < 0.6 THEN 'P07' ELSE 'P08' END
                WHEN v_grade_code IN ('G09', 'G10') THEN 'P08'
                WHEN v_grade_code = 'G11' THEN 'P09'
                ELSE 'P01'
            END;

            -- 고용유형
            v_employment_type := CASE
                WHEN RANDOM() < 0.88 THEN 'REGULAR'
                WHEN RANDOM() < 0.95 THEN 'CONTRACT'
                ELSE 'INTERN'
            END;

            -- 직원 삽입
            INSERT INTO hr_core.employee (
                id, tenant_id, employee_number, name, name_en, email,
                phone, mobile, department_id, position_code, job_title_code,
                hire_date, status, employment_type,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                p_tenant_id,
                v_employee_number,
                v_full_name,
                v_full_name_en,
                v_email,
                '02-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0') || '-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0'),
                '010-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0') || '-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0'),
                v_dept_record.id,
                v_position_code,
                v_grade_code,
                v_hire_date,
                'ACTIVE',
                v_employment_type,
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;
            v_batch_count := v_batch_count + 1;

            -- 배치 로깅
            IF v_batch_count >= v_batch_size THEN
                RAISE NOTICE '[%] Generated % employees...', p_tenant_code, v_count;
                v_batch_count := 0;
            END IF;
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 테스트 계정 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION create_test_account(
    p_tenant_id UUID,
    p_username VARCHAR,
    p_name VARCHAR,
    p_name_en VARCHAR,
    p_emp_number VARCHAR,
    p_email VARCHAR,
    p_department_code VARCHAR,
    p_grade_code VARCHAR,
    p_position_code VARCHAR,
    p_role VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_dept_id UUID;
    v_emp_id UUID;
BEGIN
    -- 부서 조회
    SELECT id INTO v_dept_id
    FROM hr_core.department
    WHERE tenant_id = p_tenant_id AND code = p_department_code;

    -- 직원 생성
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email,
        phone, mobile, department_id, position_code, job_title_code,
        hire_date, status, employment_type, user_id,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(),
        p_tenant_id,
        p_emp_number,
        p_name,
        p_name_en,
        p_email,
        '02-2000-0001',
        '010-1234-5678',
        v_dept_id,
        p_position_code,
        p_grade_code,
        '2020-01-02',
        'ACTIVE',
        'REGULAR',
        gen_random_uuid(), -- Keycloak에서 연동될 user_id
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) RETURNING id INTO v_emp_id;

    RETURN v_emp_id;
END;
$$ LANGUAGE plpgsql;

-- 함수 생성 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '직원 생성 함수 준비 완료!';
    RAISE NOTICE '  - generate_employees(): 테넌트별 직원 대량 생성';
    RAISE NOTICE '  - create_test_account(): 테스트 계정 생성';
END $$;

-- ============================================================================
-- FILE: 08_employee_execute.sql
-- ============================================================================

-- ============================================================================
-- 08_employee_execute.sql
-- 직원 생성 실행 (75,000명)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 테스트 계정 먼저 생성 (각 계열사별)
-- ============================================================================

-- 시스템 관리자는 별도 (Keycloak에서 관리)

-- -----------------------------------------------------------------------------
-- 한성홀딩스 테스트 계정
-- -----------------------------------------------------------------------------
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000001',
    'ceo.hansung', '김한성', 'Hansung Kim', 'HHD2000001',
    'ceo.hansung@hansung-hd.co.kr', 'HD_ROOT', 'G11', 'P09', 'TENANT_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000001',
    'hr.admin.hd', '박인사', 'Insa Park', 'HHD2000002',
    'hr.admin.hd@hansung-hd.co.kr', 'HD_HR_TEAM', 'G06', 'P06', 'HR_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000001',
    'hr.manager.hd', '이관리', 'Gwanri Lee', 'HHD2000003',
    'hr.manager.hd@hansung-hd.co.kr', 'HD_HR_TEAM', 'G05', 'P07', 'HR_MANAGER'
);

-- -----------------------------------------------------------------------------
-- 한성전자 테스트 계정
-- -----------------------------------------------------------------------------
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000002',
    'ceo.elec', '이전자', 'Jeonja Lee', 'HEL2000001',
    'ceo.elec@hansung-elec.co.kr', 'EL_ROOT', 'G11', 'P09', 'TENANT_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000002',
    'hr.admin.elec', '김인사', 'Insa Kim', 'HEL2000002',
    'hr.admin.elec@hansung-elec.co.kr', 'EL_HR', 'G06', 'P06', 'HR_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000002',
    'hr.manager.elec', '박담당', 'Damdang Park', 'HEL2000003',
    'hr.manager.elec@hansung-elec.co.kr', 'EL_HR', 'G04', 'P03', 'HR_MANAGER'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000002',
    'dev.manager.elec', '최개발', 'Gaebal Choi', 'HEL2000004',
    'dev.manager.elec@hansung-elec.co.kr', 'EL_DRAM', 'G05', 'P06', 'MANAGER'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000002',
    'dev.senior.elec', '정선임', 'Seonim Jung', 'HEL2000005',
    'dev.senior.elec@hansung-elec.co.kr', 'EL_DRAM', 'G03', 'P02', 'EMPLOYEE'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000002',
    'dev.staff.elec', '강사원', 'Sawon Kang', 'HEL2000006',
    'dev.staff.elec@hansung-elec.co.kr', 'EL_DRAM', 'G01', 'P01', 'EMPLOYEE'
);

-- -----------------------------------------------------------------------------
-- 한성SDI 테스트 계정
-- -----------------------------------------------------------------------------
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000003',
    'ceo.sdi', '박배터', 'Batter Park', 'HSI2000001',
    'ceo.sdi@hansung-sdi.co.kr', 'SDI_ROOT', 'G11', 'P09', 'TENANT_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000003',
    'hr.admin.sdi', '이인사', 'Insa Lee', 'HSI2000002',
    'hr.admin.sdi@hansung-sdi.co.kr', 'SDI_HR', 'G06', 'P06', 'HR_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000003',
    'prod.manager.sdi', '김생산', 'Sangsan Kim', 'HSI2000003',
    'prod.manager.sdi@hansung-sdi.co.kr', 'SDI_PROD1', 'G05', 'P06', 'MANAGER'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000003',
    'prod.staff.sdi', '최담당', 'Damdang Choi', 'HSI2000004',
    'prod.staff.sdi@hansung-sdi.co.kr', 'SDI_PROD1', 'G03', 'P03', 'EMPLOYEE'
);

-- -----------------------------------------------------------------------------
-- 한성엔지니어링 테스트 계정
-- -----------------------------------------------------------------------------
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000004',
    'ceo.eng', '정건설', 'Gunsul Jung', 'HEN2000001',
    'ceo.eng@hansung-eng.co.kr', 'ENG_ROOT', 'G11', 'P09', 'TENANT_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000004',
    'hr.admin.eng', '박인사', 'Insa Park', 'HEN2000002',
    'hr.admin.eng@hansung-eng.co.kr', 'ENG_HR', 'G06', 'P06', 'HR_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000004',
    'pm.manager.eng', '김프로', 'Pro Kim', 'HEN2000003',
    'pm.manager.eng@hansung-eng.co.kr', 'ENG_PLANT_PM', 'G05', 'P06', 'MANAGER'
);

-- -----------------------------------------------------------------------------
-- 한성바이오 테스트 계정
-- -----------------------------------------------------------------------------
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000005',
    'ceo.bio', '최바이오', 'Bio Choi', 'HBI2000001',
    'ceo.bio@hansung-bio.co.kr', 'BIO_ROOT', 'G11', 'P09', 'TENANT_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000005',
    'hr.admin.bio', '이인사', 'Insa Lee', 'HBI2000002',
    'hr.admin.bio@hansung-bio.co.kr', 'BIO_HR', 'G06', 'P06', 'HR_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000005',
    'rnd.manager.bio', '박연구', 'Yeongu Park', 'HBI2000003',
    'rnd.manager.bio@hansung-bio.co.kr', 'BIO_DRUG', 'G05', 'P06', 'MANAGER'
);

-- -----------------------------------------------------------------------------
-- 한성화학 테스트 계정
-- -----------------------------------------------------------------------------
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000006',
    'ceo.chem', '강화학', 'Hwahak Kang', 'HCH2000001',
    'ceo.chem@hansung-chem.co.kr', 'CHEM_ROOT', 'G11', 'P09', 'TENANT_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000006',
    'hr.admin.chem', '김인사', 'Insa Kim', 'HCH2000002',
    'hr.admin.chem@hansung-chem.co.kr', 'CHEM_HR', 'G06', 'P06', 'HR_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000006',
    'qa.manager.chem', '이품질', 'Pumjil Lee', 'HCH2000003',
    'qa.manager.chem@hansung-chem.co.kr', 'CHEM_QA', 'G05', 'P06', 'MANAGER'
);

-- -----------------------------------------------------------------------------
-- 한성IT서비스 테스트 계정
-- -----------------------------------------------------------------------------
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000007',
    'ceo.it', '윤아이티', 'IT Yoon', 'HIT2000001',
    'ceo.it@hansung-it.co.kr', 'IT_ROOT', 'G11', 'P09', 'TENANT_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000007',
    'hr.admin.it', '박인사', 'Insa Park', 'HIT2000002',
    'hr.admin.it@hansung-it.co.kr', 'IT_HR', 'G06', 'P06', 'HR_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000007',
    'dev.manager.it', '최개발', 'Gaebal Choi', 'HIT2000003',
    'dev.manager.it@hansung-it.co.kr', 'IT_SOL', 'G05', 'P06', 'MANAGER'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000007',
    'dev.staff.it', '정개발자', 'Gaebalja Jung', 'HIT2000004',
    'dev.staff.it@hansung-it.co.kr', 'IT_SOL', 'G03', 'P02', 'EMPLOYEE'
);

-- -----------------------------------------------------------------------------
-- 한성생명 테스트 계정
-- -----------------------------------------------------------------------------
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000008',
    'ceo.life', '송금융', 'Kumyung Song', 'HLF2000001',
    'ceo.life@hansung-life.co.kr', 'LIFE_ROOT', 'G11', 'P09', 'TENANT_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000008',
    'hr.admin.life', '이인사', 'Insa Lee', 'HLF2000002',
    'hr.admin.life@hansung-life.co.kr', 'LIFE_HR', 'G06', 'P06', 'HR_ADMIN'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000008',
    'sales.manager.life', '김영업', 'Youngup Kim', 'HLF2000003',
    'sales.manager.life@hansung-life.co.kr', 'LIFE_CORP', 'G05', 'P06', 'MANAGER'
);
SELECT create_test_account(
    'a0000001-0000-0000-0000-000000000008',
    'sales.staff.life', '박담당', 'Damdang Park', 'HLF2000004',
    'sales.staff.life@hansung-life.co.kr', 'LIFE_CORP', 'G04', 'P03', 'EMPLOYEE'
);

COMMIT;

-- ============================================================================
-- 2. 일반 직원 대량 생성
-- ============================================================================

-- 각 테넌트별로 직원 생성 (총 ~75,000명)
DO $$
DECLARE
    v_tenant_record RECORD;
    v_config RECORD;
    v_generated INT;
    v_total INT := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '직원 대량 생성 시작...';
    RAISE NOTICE '========================================';

    FOR v_tenant_record IN
        SELECT t.id, t.code, t.name
        FROM tenant_common.tenant t
        ORDER BY t.code
    LOOP
        -- 설정 조회
        SELECT * INTO v_config
        FROM tenant_employee_config
        WHERE tenant_code = v_tenant_record.code;

        IF v_config IS NULL THEN
            CONTINUE;
        END IF;

        RAISE NOTICE '';
        RAISE NOTICE '[%] % 직원 생성 시작 (목표: %명)...',
            v_tenant_record.code, v_tenant_record.name, v_config.target_count;

        -- 직원 생성 (테스트 계정 제외한 수)
        v_generated := generate_employees(
            v_tenant_record.id,
            v_tenant_record.code,
            v_config.emp_code_prefix,
            v_config.email_domain,
            v_config.target_count - 10  -- 테스트 계정 제외
        );

        v_total := v_total + v_generated;
        RAISE NOTICE '[%] 완료: %명 생성', v_tenant_record.code, v_generated;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '총 직원 생성 완료: %명', v_total;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- 3. 부서장(manager_id) 업데이트
-- ============================================================================
DO $$
DECLARE
    v_dept RECORD;
    v_manager_id UUID;
BEGIN
    RAISE NOTICE '부서장 정보 업데이트 중...';

    FOR v_dept IN
        SELECT d.id, d.tenant_id, d.level
        FROM hr_core.department d
        WHERE d.level >= 3  -- 팀 레벨 이상
    LOOP
        -- 해당 부서의 가장 높은 직급 직원을 부서장으로 지정
        SELECT e.id INTO v_manager_id
        FROM hr_core.employee e
        WHERE e.department_id = v_dept.id
        AND e.status = 'ACTIVE'
        ORDER BY e.job_title_code DESC, e.hire_date ASC
        LIMIT 1;

        IF v_manager_id IS NOT NULL THEN
            UPDATE hr_core.department
            SET manager_id = v_manager_id
            WHERE id = v_dept.id;
        END IF;
    END LOOP;

    RAISE NOTICE '부서장 정보 업데이트 완료!';
END $$;

-- ============================================================================
-- 검증
-- ============================================================================
DO $$
DECLARE
    v_record RECORD;
    v_total INT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '직원 생성 결과 검증';
    RAISE NOTICE '========================================';

    FOR v_record IN
        SELECT t.name as tenant_name, COUNT(e.id) as emp_count
        FROM tenant_common.tenant t
        LEFT JOIN hr_core.employee e ON t.id = e.tenant_id
        GROUP BY t.name
        ORDER BY emp_count DESC
    LOOP
        RAISE NOTICE '%-20s: %6s명', v_record.tenant_name, v_record.emp_count;
        v_total := v_total + v_record.emp_count;
    END LOOP;

    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '총 직원 수        : %6s명', v_total;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FILE: 09_employee_details_generator.sql
-- ============================================================================

-- ============================================================================
-- 09_employee_details_generator.sql
-- 직원 상세 정보 대량 생성 (가족, 학력, 경력, 자격증)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 직원 가족 정보 (employee_family)
-- 약 50%의 직원에게 가족 정보 추가
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_family_count INT;
    v_relation VARCHAR(20);
BEGIN
    RAISE NOTICE '직원 가족 정보 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, name, hire_date
        FROM hr_core.employee
        WHERE RANDOM() < 0.5  -- 50%
        ORDER BY tenant_id, id
    LOOP
        -- 1~4명의 가족 추가
        v_family_count := 1 + FLOOR(RANDOM() * 4)::INT;

        FOR i IN 1..v_family_count LOOP
            v_relation := CASE i
                WHEN 1 THEN 'SPOUSE'
                WHEN 2 THEN 'CHILD'
                WHEN 3 THEN CASE WHEN RANDOM() < 0.5 THEN 'CHILD' ELSE 'FATHER' END
                ELSE CASE WHEN RANDOM() < 0.5 THEN 'MOTHER' ELSE 'SIBLING' END
            END;

            INSERT INTO hr_core.employee_family (
                tenant_id, employee_id, relation_type, name, birth_date, phone, is_dependent
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_relation,
                CASE v_relation
                    WHEN 'SPOUSE' THEN '배우자'
                    WHEN 'CHILD' THEN '자녀' || i::TEXT
                    WHEN 'FATHER' THEN '부'
                    WHEN 'MOTHER' THEN '모'
                    ELSE '형제자매'
                END,
                CASE
                    WHEN v_relation = 'SPOUSE' THEN (v_emp.hire_date - INTERVAL '5 years' - (RANDOM() * 3650 || ' days')::INTERVAL)::DATE
                    WHEN v_relation = 'CHILD' THEN (v_emp.hire_date + (RANDOM() * 3650 || ' days')::INTERVAL)::DATE
                    WHEN v_relation IN ('FATHER', 'MOTHER') THEN (v_emp.hire_date - INTERVAL '25 years' - (RANDOM() * 7300 || ' days')::INTERVAL)::DATE
                    ELSE (v_emp.hire_date - INTERVAL '5 years' + (RANDOM() * 3650 || ' days')::INTERVAL)::DATE
                END,
                '010-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0') || '-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0'),
                v_relation IN ('SPOUSE', 'CHILD', 'FATHER', 'MOTHER')
            );
        END LOOP;

        v_count := v_count + v_family_count;

        IF v_count % 10000 = 0 THEN
            RAISE NOTICE '  가족 정보 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '가족 정보 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 2. 직원 학력 정보 (employee_education)
-- 모든 직원에게 최소 1개의 학력 정보 추가
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_edu_count INT;
    v_schools TEXT[] := ARRAY[
        '서울대학교', '연세대학교', '고려대학교', '성균관대학교', '한양대학교',
        '중앙대학교', '경희대학교', '서강대학교', '이화여자대학교', '숙명여자대학교',
        '한국외국어대학교', '건국대학교', '동국대학교', 'KAIST', 'POSTECH',
        '부산대학교', '경북대학교', '전남대학교', '충남대학교', '인하대학교',
        '아주대학교', '단국대학교', '홍익대학교', '국민대학교', '세종대학교'
    ];
    v_majors TEXT[] := ARRAY[
        '컴퓨터공학', '전자공학', '기계공학', '화학공학', '경영학',
        '경제학', '법학', '회계학', '산업공학', '신소재공학',
        '생명공학', '화학', '물리학', '수학', '통계학',
        '행정학', '심리학', '영어영문학', '국어국문학', '사회학'
    ];
    v_school TEXT;
    v_major TEXT;
    v_degree_type VARCHAR(20);
    v_grad_year INT;
BEGIN
    RAISE NOTICE '직원 학력 정보 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, job_title_code
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        -- 학력 수 (1~3개, 직급에 따라)
        v_edu_count := CASE
            WHEN v_emp.job_title_code >= 'G07' THEN 2 + FLOOR(RANDOM() * 2)::INT  -- 이사 이상: 2-3
            WHEN v_emp.job_title_code >= 'G05' THEN 1 + FLOOR(RANDOM() * 2)::INT  -- 차장 이상: 1-2
            ELSE 1
        END;

        v_grad_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - 1;

        FOR i IN REVERSE v_edu_count..1 LOOP
            v_school := v_schools[1 + FLOOR(RANDOM() * array_length(v_schools, 1))::INT];
            v_major := v_majors[1 + FLOOR(RANDOM() * array_length(v_majors, 1))::INT];

            v_degree_type := CASE i
                WHEN 1 THEN 'BACHELOR'
                WHEN 2 THEN CASE WHEN RANDOM() < 0.8 THEN 'MASTER' ELSE 'DOCTORATE' END
                ELSE 'DOCTORATE'
            END;

            INSERT INTO hr_core.employee_education (
                tenant_id, employee_id, school_name, degree_type, major,
                admission_date, graduation_date, graduation_status
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_school,
                v_degree_type,
                v_major,
                make_date(v_grad_year - 4, 3, 2),
                make_date(v_grad_year, 2, 28),
                'GRADUATED'
            );

            v_grad_year := v_grad_year - CASE v_degree_type WHEN 'BACHELOR' THEN 4 WHEN 'MASTER' THEN 2 ELSE 4 END;
            v_count := v_count + 1;
        END LOOP;

        IF v_count % 10000 = 0 THEN
            RAISE NOTICE '  학력 정보 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '학력 정보 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 3. 직원 경력 정보 (employee_career)
-- 경력직 직원에게 이전 경력 추가 (약 30%)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_career_count INT;
    v_companies TEXT[] := ARRAY[
        '삼성전자', 'SK하이닉스', 'LG전자', '현대자동차', '기아자동차',
        '포스코', '롯데그룹', '신세계', 'CJ그룹', 'KT',
        'SK텔레콤', 'LG유플러스', '네이버', '카카오', '쿠팡',
        '배달의민족', '토스', '당근마켓', '라인', 'NHN',
        'NC소프트', '넥슨', '스마일게이트', '크래프톤', '펄어비스'
    ];
    v_departments TEXT[] := ARRAY[
        '개발팀', '기획팀', '영업팀', '마케팅팀', '인사팀',
        '재무팀', '생산팀', '품질팀', '연구소', '디자인팀'
    ];
    v_positions TEXT[] := ARRAY[
        '사원', '주임', '대리', '과장', '차장', '부장'
    ];
    v_company TEXT;
    v_start_year INT;
    v_end_year INT;
BEGIN
    RAISE NOTICE '직원 경력 정보 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, job_title_code
        FROM hr_core.employee
        WHERE RANDOM() < 0.3  -- 30%
        AND job_title_code >= 'G03'  -- 대리 이상
        ORDER BY tenant_id, id
    LOOP
        -- 경력 수 (1~3개)
        v_career_count := 1 + FLOOR(RANDOM() * 3)::INT;
        v_end_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - 1;

        FOR i IN 1..v_career_count LOOP
            v_company := v_companies[1 + FLOOR(RANDOM() * array_length(v_companies, 1))::INT];
            v_start_year := v_end_year - (1 + FLOOR(RANDOM() * 5)::INT);

            INSERT INTO hr_core.employee_career (
                tenant_id, employee_id, company_name, department, position,
                start_date, end_date, job_description
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_company,
                v_departments[1 + FLOOR(RANDOM() * array_length(v_departments, 1))::INT],
                v_positions[LEAST(i, array_length(v_positions, 1))],
                make_date(v_start_year, 1 + FLOOR(RANDOM() * 12)::INT, 1),
                make_date(v_end_year, 1 + FLOOR(RANDOM() * 12)::INT, 28),
                '담당 업무 수행'
            );

            v_end_year := v_start_year - 1;
            v_count := v_count + 1;
        END LOOP;

        IF v_count % 5000 = 0 THEN
            RAISE NOTICE '  경력 정보 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '경력 정보 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 4. 직원 자격증 정보 (employee_certificate)
-- 약 40%의 직원에게 자격증 추가
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_cert_count INT;
    v_certificates TEXT[] := ARRAY[
        '정보처리기사', '정보보안기사', '네트워크관리사', '리눅스마스터',
        '데이터분석전문가', '빅데이터분석기사', 'AWS Solutions Architect',
        'PMP', 'CISSP', 'CISA', 'CPA', '세무사', '변호사', '변리사',
        'TOEIC 900+', 'TOEFL 100+', 'JLPT N1', 'HSK 6급',
        '위험물산업기사', '산업안전기사', '화학분석기사', '품질관리기사',
        '전기기사', '건축기사', '토목기사', '기계설계기사'
    ];
    v_issuers TEXT[] := ARRAY[
        '한국산업인력공단', '한국정보통신진흥협회', 'AWS', 'PMI',
        '(ISC)²', 'ISACA', '금융감독원', '대한변호사협회',
        'ETS', 'JLPT', '孔子学院'
    ];
    v_cert TEXT;
    v_issue_year INT;
BEGIN
    RAISE NOTICE '직원 자격증 정보 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date
        FROM hr_core.employee
        WHERE RANDOM() < 0.4  -- 40%
        ORDER BY tenant_id, id
    LOOP
        -- 자격증 수 (1~3개)
        v_cert_count := 1 + FLOOR(RANDOM() * 3)::INT;

        FOR i IN 1..v_cert_count LOOP
            v_cert := v_certificates[1 + FLOOR(RANDOM() * array_length(v_certificates, 1))::INT];
            v_issue_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - FLOOR(RANDOM() * 5)::INT;

            INSERT INTO hr_core.employee_certificate (
                tenant_id, employee_id, certificate_name, issuing_organization,
                issue_date, expiry_date, certificate_number
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_cert,
                v_issuers[1 + FLOOR(RANDOM() * array_length(v_issuers, 1))::INT],
                make_date(v_issue_year, 1 + FLOOR(RANDOM() * 12)::INT, 1 + FLOOR(RANDOM() * 28)::INT),
                CASE WHEN RANDOM() < 0.3 THEN make_date(v_issue_year + 3, 12, 31) ELSE NULL END,
                'CERT-' || v_issue_year || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 6, '0')
            );

            v_count := v_count + 1;
        END LOOP;

        IF v_count % 5000 = 0 THEN
            RAISE NOTICE '  자격증 정보 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '자격증 정보 생성 완료: %개', v_count;
END $$;

COMMIT;

-- ============================================================================
-- 검증
-- ============================================================================
DO $$
DECLARE
    v_family INT;
    v_education INT;
    v_career INT;
    v_certificate INT;
BEGIN
    SELECT COUNT(*) INTO v_family FROM hr_core.employee_family;
    SELECT COUNT(*) INTO v_education FROM hr_core.employee_education;
    SELECT COUNT(*) INTO v_career FROM hr_core.employee_career;
    SELECT COUNT(*) INTO v_certificate FROM hr_core.employee_certificate;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '직원 상세 정보 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '가족 정보   : %개', v_family;
    RAISE NOTICE '학력 정보   : %개', v_education;
    RAISE NOTICE '경력 정보   : %개', v_career;
    RAISE NOTICE '자격증 정보 : %개', v_certificate;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FILE: 10_attendance_holidays.sql
-- ============================================================================

-- ============================================================================
-- 10_attendance_holidays.sql
-- 2025-2026년 대한민국 공휴일 데이터
-- ============================================================================

BEGIN;

-- ============================================================================
-- 각 테넌트별 공휴일 생성
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
BEGIN
    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        -- 2025년 공휴일
        INSERT INTO hr_attendance.holiday (tenant_id, holiday_date, name, name_en, holiday_type, is_paid, year, created_at, updated_at, created_by, updated_by)
        VALUES
            (v_tenant.id, '2025-01-01', '신정', 'New Year''s Day', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-01-28', '설날 연휴', 'Lunar New Year', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-01-29', '설날', 'Lunar New Year''s Day', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-01-30', '설날 연휴', 'Lunar New Year', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-03-01', '삼일절', 'Independence Movement Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-05-01', '근로자의 날', 'Labor Day', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-05-05', '어린이날', 'Children''s Day', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-05-06', '부처님오신날', 'Buddha''s Birthday', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-06-06', '현충일', 'Memorial Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-08-15', '광복절', 'Liberation Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-03', '개천절', 'National Foundation Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-05', '추석 연휴', 'Chuseok', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-06', '추석', 'Chuseok', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-07', '추석 연휴', 'Chuseok', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-08', '추석 대체휴일', 'Chuseok Substitute', 'SUBSTITUTE', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-09', '한글날', 'Hangul Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-12-25', '크리스마스', 'Christmas', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system');

        -- 2026년 공휴일
        INSERT INTO hr_attendance.holiday (tenant_id, holiday_date, name, name_en, holiday_type, is_paid, year, created_at, updated_at, created_by, updated_by)
        VALUES
            (v_tenant.id, '2026-01-01', '신정', 'New Year''s Day', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-02-16', '설날 연휴', 'Lunar New Year', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-02-17', '설날', 'Lunar New Year''s Day', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-02-18', '설날 연휴', 'Lunar New Year', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-03-01', '삼일절', 'Independence Movement Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-03-02', '삼일절 대체휴일', 'Independence Movement Day Substitute', 'SUBSTITUTE', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-05-01', '근로자의 날', 'Labor Day', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-05-05', '어린이날', 'Children''s Day', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-05-24', '부처님오신날', 'Buddha''s Birthday', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-05-25', '부처님오신날 대체휴일', 'Buddha''s Birthday Substitute', 'SUBSTITUTE', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-06-06', '현충일', 'Memorial Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-08-15', '광복절', 'Liberation Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-09-24', '추석 연휴', 'Chuseok', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-09-25', '추석', 'Chuseok', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-09-26', '추석 연휴', 'Chuseok', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-10-03', '개천절', 'National Foundation Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-10-09', '한글날', 'Hangul Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-12-25', '크리스마스', 'Christmas', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system');

        -- 회사 창립기념일 (테넌트별로 다름)
        INSERT INTO hr_attendance.holiday (tenant_id, holiday_date, name, name_en, holiday_type, is_paid, description, year, created_at, updated_at, created_by, updated_by)
        VALUES
            (v_tenant.id, '2025-03-15', '창립기념일', 'Foundation Day', 'COMPANY', true, v_tenant.name || ' 창립기념일', 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-03-15', '창립기념일', 'Foundation Day', 'COMPANY', true, v_tenant.name || ' 창립기념일', 2026, NOW(), NOW(), 'system', 'system');

    END LOOP;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM hr_attendance.holiday;
    RAISE NOTICE '공휴일 데이터 생성 완료: %개 (8개 테넌트 x 약 37개 휴일)', v_count;
END $$;

-- ============================================================================
-- FILE: 11_leave_balance_generator.sql
-- ============================================================================

-- ============================================================================
-- 11_leave_balance_generator.sql
-- 휴가 잔액 대량 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 2025년, 2026년 휴가 잔액 생성
-- 근속연수에 따른 연차 계산 (기본 15일 + 근속 2년마다 1일, 최대 25일)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_years_of_service INT;
    v_annual_days DECIMAL(4,1);
    v_used_days DECIMAL(4,1);
    v_pending_days DECIMAL(4,1);
    v_carried_over DECIMAL(4,1);
BEGIN
    RAISE NOTICE '휴가 잔액 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, status
        FROM hr_core.employee
        WHERE status = 'ACTIVE'
        ORDER BY tenant_id, id
    LOOP
        -- 근속연수 계산
        v_years_of_service := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_emp.hire_date))::INT;

        -- 연차 계산 (기본 15일 + 2년마다 1일, 최대 25일)
        v_annual_days := LEAST(25, 15 + FLOOR(v_years_of_service / 2));

        -- 2025년 휴가 잔액
        v_used_days := FLOOR(RANDOM() * v_annual_days * 0.7);  -- 최대 70% 사용
        v_pending_days := CASE WHEN RANDOM() < 0.1 THEN FLOOR(RANDOM() * 3) ELSE 0 END;
        v_carried_over := CASE WHEN v_years_of_service >= 1 THEN LEAST(5, FLOOR(RANDOM() * 5)) ELSE 0 END;

        INSERT INTO hr_attendance.leave_balance (
            id, tenant_id, employee_id, year, leave_type,
            total_days, used_days, pending_days, carried_over_days,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_emp.id,
            2025,
            'ANNUAL',
            v_annual_days + v_carried_over,
            v_used_days,
            v_pending_days,
            v_carried_over,
            NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        -- 2025년 병가 잔액
        INSERT INTO hr_attendance.leave_balance (
            id, tenant_id, employee_id, year, leave_type,
            total_days, used_days, pending_days, carried_over_days,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_emp.id,
            2025,
            'SICK',
            10,  -- 연간 10일
            CASE WHEN RANDOM() < 0.3 THEN FLOOR(RANDOM() * 3) ELSE 0 END,
            0,
            0,
            NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        -- 2026년 휴가 잔액
        v_carried_over := LEAST(5, v_annual_days - v_used_days - v_pending_days);
        IF v_carried_over < 0 THEN v_carried_over := 0; END IF;

        INSERT INTO hr_attendance.leave_balance (
            id, tenant_id, employee_id, year, leave_type,
            total_days, used_days, pending_days, carried_over_days,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_emp.id,
            2026,
            'ANNUAL',
            v_annual_days + v_carried_over,
            FLOOR(RANDOM() * 3),  -- 2026년 초라 아직 적게 사용
            CASE WHEN RANDOM() < 0.05 THEN 1 ELSE 0 END,
            v_carried_over,
            NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        -- 2026년 병가 잔액
        INSERT INTO hr_attendance.leave_balance (
            id, tenant_id, employee_id, year, leave_type,
            total_days, used_days, pending_days, carried_over_days,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_emp.id,
            2026,
            'SICK',
            10,
            CASE WHEN RANDOM() < 0.1 THEN FLOOR(RANDOM() * 2) ELSE 0 END,
            0,
            0,
            NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        v_count := v_count + 4;

        IF v_count % 10000 = 0 THEN
            RAISE NOTICE '  휴가 잔액 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '휴가 잔액 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM hr_attendance.leave_balance;
    RAISE NOTICE '휴가 잔액 데이터 생성 완료: %개 (직원당 4개: 2025/2026 x 연차/병가)', v_count;
END $$;

-- ============================================================================
-- FILE: 12_attendance_generator.sql
-- ============================================================================

-- ============================================================================
-- 12_attendance_generator.sql
-- 근태 기록 대량 생성 (최근 3개월, ~4,500,000 레코드)
-- ============================================================================

-- ============================================================================
-- 근태 기록 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_attendance_records(
    p_start_date DATE,
    p_end_date DATE
) RETURNS INT AS $$
DECLARE
    v_emp RECORD;
    v_date DATE;
    v_count INT := 0;
    v_batch_count INT := 0;
    v_status VARCHAR(20);
    v_check_in TIME;
    v_check_out TIME;
    v_late_minutes INT;
    v_overtime_minutes INT;
    v_work_hours DECIMAL(4,2);
    v_is_holiday BOOLEAN;
    v_day_of_week INT;
    v_tenant_holidays DATE[];
BEGIN
    RAISE NOTICE '근태 기록 생성 시작 (% ~ %)', p_start_date, p_end_date;

    FOR v_emp IN
        SELECT e.id, e.tenant_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        -- 해당 테넌트의 휴일 목록 조회
        SELECT ARRAY_AGG(holiday_date) INTO v_tenant_holidays
        FROM hr_attendance.holiday
        WHERE tenant_id = v_emp.tenant_id
        AND holiday_date BETWEEN p_start_date AND p_end_date;

        v_date := p_start_date;
        WHILE v_date <= p_end_date LOOP
            v_day_of_week := EXTRACT(DOW FROM v_date)::INT;  -- 0=일, 6=토

            -- 주말 건너뛰기
            IF v_day_of_week IN (0, 6) THEN
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- 공휴일 체크
            v_is_holiday := v_date = ANY(v_tenant_holidays);
            IF v_is_holiday THEN
                INSERT INTO hr_attendance.attendance_record (
                    id, tenant_id, employee_id, work_date, status, note,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(),
                    v_emp.tenant_id,
                    v_emp.id,
                    v_date,
                    'HOLIDAY',
                    '공휴일',
                    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
                );
                v_count := v_count + 1;
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- 근태 상태 결정 (확률 기반)
            v_status := CASE
                WHEN RANDOM() < 0.88 THEN 'NORMAL'     -- 88% 정상
                WHEN RANDOM() < 0.91 THEN 'LATE'       -- 3% 지각
                WHEN RANDOM() < 0.96 THEN 'REMOTE_WORK' -- 5% 재택
                WHEN RANDOM() < 0.99 THEN 'ON_LEAVE'   -- 3% 휴가
                ELSE 'BUSINESS_TRIP'                    -- 1% 출장
            END;

            -- 출퇴근 시간 생성
            v_late_minutes := 0;
            v_overtime_minutes := 0;

            CASE v_status
                WHEN 'NORMAL' THEN
                    v_check_in := '08:50'::TIME + ((RANDOM() * 20)::INT || ' minutes')::INTERVAL;
                    v_check_out := '18:00'::TIME + ((RANDOM() * 120)::INT || ' minutes')::INTERVAL;
                WHEN 'LATE' THEN
                    v_check_in := '09:00'::TIME + ((5 + RANDOM() * 60)::INT || ' minutes')::INTERVAL;
                    v_check_out := '18:00'::TIME + ((RANDOM() * 60)::INT || ' minutes')::INTERVAL;
                    v_late_minutes := EXTRACT(EPOCH FROM (v_check_in - '09:00'::TIME))::INT / 60;
                WHEN 'REMOTE_WORK' THEN
                    v_check_in := '08:55'::TIME + ((RANDOM() * 10)::INT || ' minutes')::INTERVAL;
                    v_check_out := '18:00'::TIME + ((RANDOM() * 60)::INT || ' minutes')::INTERVAL;
                WHEN 'ON_LEAVE' THEN
                    v_check_in := NULL;
                    v_check_out := NULL;
                WHEN 'BUSINESS_TRIP' THEN
                    v_check_in := NULL;
                    v_check_out := NULL;
            END CASE;

            -- 근무 시간 계산
            IF v_check_in IS NOT NULL AND v_check_out IS NOT NULL THEN
                v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::DECIMAL / 3600 - 1; -- 점심 1시간 제외
                v_overtime_minutes := GREATEST(0, (v_work_hours - 8) * 60)::INT;
            ELSE
                v_work_hours := 0;
            END IF;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_emp.id,
                v_date,
                CASE WHEN v_check_in IS NOT NULL THEN v_date + v_check_in ELSE NULL END,
                CASE WHEN v_check_out IS NOT NULL THEN v_date + v_check_out ELSE NULL END,
                v_status,
                v_late_minutes,
                v_overtime_minutes,
                v_work_hours,
                CASE WHEN v_status = 'REMOTE_WORK' THEN '재택' ELSE '본사' END,
                CASE WHEN v_status = 'REMOTE_WORK' THEN '재택' ELSE '본사' END,
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;
            v_batch_count := v_batch_count + 1;

            v_date := v_date + 1;
        END LOOP;

        -- 배치 로깅
        IF v_batch_count >= 50000 THEN
            RAISE NOTICE '  근태 기록 %개 생성...', v_count;
            v_batch_count := 0;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 근태 기록 실행 (최근 3개월)
-- 성능을 위해 월별로 나누어 실행
-- ============================================================================

DO $$
DECLARE
    v_total INT := 0;
    v_month_count INT;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '근태 기록 대량 생성 시작';
    RAISE NOTICE '========================================';

    -- 2025년 11월
    v_start_date := '2025-11-01';
    v_end_date := '2025-11-30';
    RAISE NOTICE '';
    RAISE NOTICE '2025년 11월 근태 기록 생성 중...';
    v_month_count := generate_attendance_records(v_start_date, v_end_date);
    v_total := v_total + v_month_count;
    RAISE NOTICE '2025년 11월 완료: %개', v_month_count;

    -- 2025년 12월
    v_start_date := '2025-12-01';
    v_end_date := '2025-12-31';
    RAISE NOTICE '';
    RAISE NOTICE '2025년 12월 근태 기록 생성 중...';
    v_month_count := generate_attendance_records(v_start_date, v_end_date);
    v_total := v_total + v_month_count;
    RAISE NOTICE '2025년 12월 완료: %개', v_month_count;

    -- 2026년 1월
    v_start_date := '2026-01-01';
    v_end_date := '2026-01-31';
    RAISE NOTICE '';
    RAISE NOTICE '2026년 1월 근태 기록 생성 중...';
    v_month_count := generate_attendance_records(v_start_date, v_end_date);
    v_total := v_total + v_month_count;
    RAISE NOTICE '2026년 1월 완료: %개', v_month_count;

    -- 2026년 2월 (현재까지)
    v_start_date := '2026-02-01';
    v_end_date := '2026-02-05';  -- 현재 날짜까지
    RAISE NOTICE '';
    RAISE NOTICE '2026년 2월 근태 기록 생성 중...';
    v_month_count := generate_attendance_records(v_start_date, v_end_date);
    v_total := v_total + v_month_count;
    RAISE NOTICE '2026년 2월 완료: %개', v_month_count;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '근태 기록 생성 완료: 총 %개', v_total;
    RAISE NOTICE '========================================';
END $$;

-- 함수 정리
DROP FUNCTION IF EXISTS generate_attendance_records;

-- 검증
DO $$
DECLARE
    v_count INT;
    v_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_count FROM hr_attendance.attendance_record;
    RAISE NOTICE '';
    RAISE NOTICE '근태 기록 총 개수: %', v_count;
    RAISE NOTICE '';
    RAISE NOTICE '월별 근태 기록 현황:';

    FOR v_record IN
        SELECT
            TO_CHAR(work_date, 'YYYY-MM') as month,
            COUNT(*) as cnt,
            COUNT(DISTINCT employee_id) as emp_cnt
        FROM hr_attendance.attendance_record
        GROUP BY TO_CHAR(work_date, 'YYYY-MM')
        ORDER BY month
    LOOP
        RAISE NOTICE '  %: %개 (직원 %명)', v_record.month, v_record.cnt, v_record.emp_cnt;
    END LOOP;
END $$;

-- ============================================================================
-- FILE: 13_leave_overtime_generator.sql
-- ============================================================================

-- ============================================================================
-- 13_leave_overtime_generator.sql
-- 휴가 신청 및 초과근무 신청 대량 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 휴가 신청 생성 (최근 3개월 기준, 월 ~5,000건)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_dept RECORD;
    v_count INT := 0;
    v_leave_type VARCHAR(20);
    v_start_date DATE;
    v_end_date DATE;
    v_days_count DECIMAL(4,1);
    v_status VARCHAR(20);
    v_leave_types TEXT[] := ARRAY['ANNUAL', 'ANNUAL', 'ANNUAL', 'HALF_DAY_AM', 'HALF_DAY_PM', 'SICK', 'SPECIAL'];
    v_statuses TEXT[] := ARRAY['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'REJECTED'];
BEGIN
    RAISE NOTICE '휴가 신청 생성 중...';

    -- 각 직원의 약 20%가 휴가 신청 (평균 1-3건)
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        AND RANDOM() < 0.2  -- 20%
        ORDER BY e.tenant_id, e.id
    LOOP
        -- 부서 정보 조회
        SELECT id, name INTO v_dept
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        FOR i IN 1..FLOOR(1 + RANDOM() * 3)::INT LOOP
            -- 휴가 유형 선택
            v_leave_type := v_leave_types[1 + FLOOR(RANDOM() * array_length(v_leave_types, 1))::INT];

            -- 날짜 선택 (최근 3개월 내)
            v_start_date := CURRENT_DATE - (FLOOR(RANDOM() * 90)::INT || ' days')::INTERVAL;

            -- 휴가 일수
            IF v_leave_type IN ('HALF_DAY_AM', 'HALF_DAY_PM') THEN
                v_days_count := 0.5;
                v_end_date := v_start_date;
            ELSIF v_leave_type = 'SICK' THEN
                v_days_count := 1 + FLOOR(RANDOM() * 3);
                v_end_date := v_start_date + ((v_days_count - 1)::INT || ' days')::INTERVAL;
            ELSE
                v_days_count := 1 + FLOOR(RANDOM() * 5);
                v_end_date := v_start_date + ((v_days_count - 1)::INT || ' days')::INTERVAL;
            END IF;

            -- 상태 선택
            v_status := v_statuses[1 + FLOOR(RANDOM() * array_length(v_statuses, 1))::INT];

            -- 미래 날짜면 PENDING으로
            IF v_start_date > CURRENT_DATE THEN
                v_status := 'PENDING';
            END IF;

            INSERT INTO hr_attendance.leave_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                leave_type, start_date, end_date, days_count,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_emp.id,
                v_emp.name,
                v_emp.department_id,
                v_dept.name,
                v_leave_type,
                v_start_date,
                v_end_date,
                v_days_count,
                CASE v_leave_type
                    WHEN 'ANNUAL' THEN '개인 사유'
                    WHEN 'HALF_DAY_AM' THEN '개인 업무 (오전)'
                    WHEN 'HALF_DAY_PM' THEN '개인 업무 (오후)'
                    WHEN 'SICK' THEN '병원 방문'
                    WHEN 'SPECIAL' THEN '경조사'
                    ELSE '휴가 사유'
                END,
                v_status,
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;

            IF v_count % 5000 = 0 THEN
                RAISE NOTICE '  휴가 신청 %개 생성...', v_count;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '휴가 신청 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 2. 초과근무 신청 생성 (최근 3개월, 월 ~3,000건)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_dept RECORD;
    v_count INT := 0;
    v_overtime_date DATE;
    v_start_time TIME;
    v_end_time TIME;
    v_status VARCHAR(20);
    v_statuses TEXT[] := ARRAY['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'REJECTED'];
BEGIN
    RAISE NOTICE '초과근무 신청 생성 중...';

    -- 각 직원의 약 15%가 초과근무 신청 (평균 2-4건)
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        AND RANDOM() < 0.15  -- 15%
        ORDER BY e.tenant_id, e.id
    LOOP
        -- 부서 정보 조회
        SELECT id, name INTO v_dept
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        FOR i IN 1..FLOOR(2 + RANDOM() * 3)::INT LOOP
            -- 날짜 선택 (최근 3개월 내, 평일만)
            v_overtime_date := CURRENT_DATE - (FLOOR(RANDOM() * 90)::INT || ' days')::INTERVAL;

            -- 주말이면 건너뛰기
            IF EXTRACT(DOW FROM v_overtime_date) IN (0, 6) THEN
                CONTINUE;
            END IF;

            -- 시간 설정
            v_start_time := '18:00'::TIME + ((FLOOR(RANDOM() * 2) * 30)::INT || ' minutes')::INTERVAL;
            v_end_time := v_start_time + ((1 + FLOOR(RANDOM() * 4))::INT || ' hours')::INTERVAL;

            -- 상태 선택
            v_status := v_statuses[1 + FLOOR(RANDOM() * array_length(v_statuses, 1))::INT];
            IF v_overtime_date > CURRENT_DATE THEN
                v_status := 'PENDING';
            END IF;

            INSERT INTO hr_attendance.overtime_request (
                tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, planned_start_time, planned_end_time,
                actual_start_time, actual_end_time,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_emp.name,
                v_emp.department_id,
                v_dept.name,
                v_overtime_date,
                v_overtime_date + v_start_time,
                v_overtime_date + v_end_time,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < CURRENT_DATE THEN v_overtime_date + v_start_time ELSE NULL END,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < CURRENT_DATE THEN v_overtime_date + v_end_time ELSE NULL END,
                CASE
                    WHEN RANDOM() < 0.3 THEN '프로젝트 마감'
                    WHEN RANDOM() < 0.5 THEN '긴급 업무'
                    WHEN RANDOM() < 0.7 THEN '고객 대응'
                    ELSE '업무 처리'
                END,
                v_status,
                NOW(), NOW(), 'system', 'system'
            );

            v_count := v_count + 1;

            IF v_count % 5000 = 0 THEN
                RAISE NOTICE '  초과근무 신청 %개 생성...', v_count;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '초과근무 신청 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_leave_count INT;
    v_overtime_count INT;
BEGIN
    SELECT COUNT(*) INTO v_leave_count FROM hr_attendance.leave_request;
    SELECT COUNT(*) INTO v_overtime_count FROM hr_attendance.overtime_request;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '휴가/초과근무 신청 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '휴가 신청     : %개', v_leave_count;
    RAISE NOTICE '초과근무 신청 : %개', v_overtime_count;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FILE: 14_approval_templates.sql
-- ============================================================================

-- ============================================================================
-- 14_approval_templates.sql
-- 결재 양식 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 각 테넌트별 결재 양식 생성
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
    v_template_id UUID;
BEGIN
    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP

        -- 1. 휴가 신청 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'LEAVE_REQUEST',
            '휴가 신청',
            'LEAVE',
            '연차, 병가 등 휴가 신청을 위한 결재 양식',
            true, 1,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 휴가 신청 결재선 (팀장 → 본부장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW());

        -- 2. 초과근무 신청 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'OVERTIME_REQUEST',
            '초과근무 신청',
            'OVERTIME',
            '연장근무, 휴일근무 신청을 위한 결재 양식',
            true, 2,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 초과근무 결재선 (팀장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW());

        -- 3. 출장 신청 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'BUSINESS_TRIP_REQUEST',
            '출장 신청',
            'BUSINESS_TRIP',
            '국내/해외 출장 신청을 위한 결재 양식',
            true, 3,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 출장 신청 결재선 (팀장 → 본부장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW());

        -- 4. 경비 청구 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'EXPENSE_CLAIM',
            '경비 청구',
            'EXPENSE',
            '업무 관련 경비 청구를 위한 결재 양식',
            true, 4,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 경비 청구 결재선 (팀장 → 재무팀)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'DEPARTMENT', NULL, '재무팀', NOW(), NOW());

        -- 5. 인사 이동 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'TRANSFER_REQUEST',
            '인사 이동',
            'TRANSFER',
            '부서/직책 이동 신청을 위한 결재 양식',
            true, 5,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 인사 이동 결재선 (팀장 → 본부장 → 인사팀)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW()),
            (v_template_id, 3, 'SEQUENTIAL', 'DEPARTMENT', NULL, '인사팀', NOW(), NOW());

        -- 6. 업무 보고 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'WORK_REPORT',
            '업무 보고',
            'REPORT',
            '정기/수시 업무 보고를 위한 결재 양식',
            true, 6,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 업무 보고 결재선 (팀장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW());

        -- 7. 구매 요청 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'PURCHASE_REQUEST',
            '구매 요청',
            'PURCHASE',
            '물품/서비스 구매 요청을 위한 결재 양식',
            true, 7,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 구매 요청 결재선 (팀장 → 본부장 → 구매팀)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW()),
            (v_template_id, 3, 'SEQUENTIAL', 'DEPARTMENT', NULL, '구매팀', NOW(), NOW());

        -- 8. 일반 결재 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'GENERAL_APPROVAL',
            '일반 결재',
            'GENERAL',
            '기타 업무 결재를 위한 일반 양식',
            true, 8,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 일반 결재선 (팀장 → 본부장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW());

    END LOOP;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_template_count INT;
    v_line_count INT;
BEGIN
    SELECT COUNT(*) INTO v_template_count FROM hr_approval.approval_template;
    SELECT COUNT(*) INTO v_line_count FROM hr_approval.approval_template_line;

    RAISE NOTICE '결재 양식 생성 완료: %개 (8개 테넌트 x 8개 양식)', v_template_count;
    RAISE NOTICE '결재선 생성 완료: %개', v_line_count;
END $$;

-- ============================================================================
-- FILE: 15_approval_generator.sql
-- ============================================================================

-- ============================================================================
-- 15_approval_generator.sql
-- 결재 문서 대량 생성 (~30,000건)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 문서번호 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_doc_number(
    p_tenant_code VARCHAR,
    p_doc_type VARCHAR,
    p_year INT,
    p_seq INT
) RETURNS VARCHAR AS $$
BEGIN
    RETURN p_tenant_code || '-' || p_doc_type || '-' || p_year || '-' || LPAD(p_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 결재 문서 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_approval_documents() RETURNS INT AS $$
DECLARE
    v_emp RECORD;
    v_dept RECORD;
    v_manager RECORD;
    v_doc_id UUID;
    v_doc_number VARCHAR(50);
    v_doc_type VARCHAR(20);
    v_status VARCHAR(20);
    v_title VARCHAR(200);
    v_content TEXT;
    v_count INT := 0;
    v_seq INT := 0;
    v_tenant_code VARCHAR(20);
    v_submitted_at TIMESTAMP;
    v_completed_at TIMESTAMP;
    v_doc_types TEXT[] := ARRAY['LEAVE', 'LEAVE', 'LEAVE', 'OVERTIME', 'OVERTIME', 'BUSINESS_TRIP', 'EXPENSE', 'REPORT', 'GENERAL'];
    v_statuses TEXT[] := ARRAY['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'IN_PROGRESS', 'REJECTED'];
BEGIN
    RAISE NOTICE '결재 문서 생성 중...';

    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        AND RANDOM() < 0.15  -- 15%의 직원이 결재 신청
        ORDER BY e.tenant_id, e.id
    LOOP
        -- 테넌트 코드 조회
        SELECT code INTO v_tenant_code
        FROM tenant_common.tenant
        WHERE id = v_emp.tenant_id;

        -- 부서 정보 조회
        SELECT id, name INTO v_dept
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        -- 직원당 1-5건의 결재 문서 생성
        FOR i IN 1..FLOOR(1 + RANDOM() * 5)::INT LOOP
            v_seq := v_seq + 1;
            v_doc_type := v_doc_types[1 + FLOOR(RANDOM() * array_length(v_doc_types, 1))::INT];
            v_status := v_statuses[1 + FLOOR(RANDOM() * array_length(v_statuses, 1))::INT];

            -- 문서번호 생성
            v_doc_number := generate_doc_number(v_tenant_code, v_doc_type, 2025, v_seq);

            -- 제목 생성
            v_title := CASE v_doc_type
                WHEN 'LEAVE' THEN '휴가 신청 - ' || v_emp.name
                WHEN 'OVERTIME' THEN '초과근무 신청 - ' || v_emp.name
                WHEN 'BUSINESS_TRIP' THEN '출장 신청 - ' || v_emp.name
                WHEN 'EXPENSE' THEN '경비 청구 - ' || v_emp.name
                WHEN 'REPORT' THEN '업무 보고 - ' || v_emp.name
                ELSE '결재 요청 - ' || v_emp.name
            END;

            -- 내용 생성
            v_content := '결재 내용입니다. 검토 부탁드립니다.';

            -- 날짜 생성
            v_submitted_at := NOW() - ((FLOOR(RANDOM() * 90))::INT || ' days')::INTERVAL;
            v_completed_at := CASE
                WHEN v_status IN ('APPROVED', 'REJECTED') THEN v_submitted_at + ((FLOOR(1 + RANDOM() * 3))::INT || ' days')::INTERVAL
                ELSE NULL
            END;

            -- 문서 생성
            INSERT INTO hr_approval.approval_document (
                id, tenant_id, document_number, title, content,
                document_type, status,
                drafter_id, drafter_name, drafter_department_id, drafter_department_name,
                submitted_at, completed_at,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_doc_number,
                v_title,
                v_content,
                v_doc_type,
                v_status,
                v_emp.id,
                v_emp.name,
                v_emp.department_id,
                v_dept.name,
                v_submitted_at,
                v_completed_at,
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            ) RETURNING id INTO v_doc_id;

            -- 결재선 생성 (팀장)
            SELECT e.id, e.name, e.job_title_code INTO v_manager
            FROM hr_core.employee e
            JOIN hr_core.department d ON e.department_id = d.id
            WHERE d.id = v_emp.department_id
            AND e.id != v_emp.id
            AND e.job_title_code >= 'G05'
            ORDER BY e.job_title_code DESC
            LIMIT 1;

            IF v_manager.id IS NOT NULL THEN
                INSERT INTO hr_approval.approval_line (
                    id, document_id, sequence, line_type,
                    approver_id, approver_name, approver_position, approver_department_name,
                    status, action_type, comment,
                    activated_at, completed_at
                ) VALUES (
                    gen_random_uuid(), v_doc_id, 1, 'SEQUENTIAL',
                    v_manager.id, v_manager.name, v_manager.job_title_code, v_dept.name,
                    CASE
                        WHEN v_status = 'APPROVED' THEN 'APPROVED'
                        WHEN v_status = 'REJECTED' THEN 'REJECTED'
                        WHEN v_status IN ('IN_PROGRESS', 'PENDING') THEN 'WAITING'
                        ELSE 'WAITING'
                    END,
                    CASE WHEN v_status = 'APPROVED' THEN 'APPROVE' WHEN v_status = 'REJECTED' THEN 'REJECT' ELSE NULL END,
                    CASE
                        WHEN v_status = 'APPROVED' THEN '승인합니다.'
                        WHEN v_status = 'REJECTED' THEN '반려합니다. 사유를 보완해 주세요.'
                        ELSE NULL
                    END,
                    v_submitted_at,
                    v_completed_at
                );

                -- 결재 이력 생성
                IF v_status IN ('APPROVED', 'REJECTED') THEN
                    INSERT INTO hr_approval.approval_history (
                        id, document_id, actor_id, actor_name,
                        action_type, from_status, to_status, comment
                    ) VALUES (
                        gen_random_uuid(),
                        v_doc_id, v_manager.id, v_manager.name,
                        CASE WHEN v_status = 'APPROVED' THEN 'APPROVE' ELSE 'REJECT' END,
                        'PENDING', v_status,
                        CASE WHEN v_status = 'APPROVED' THEN '승인합니다.' ELSE '반려합니다.' END
                    );
                END IF;
            END IF;

            v_count := v_count + 1;

            IF v_count % 5000 = 0 THEN
                RAISE NOTICE '  결재 문서 %개 생성...', v_count;
            END IF;
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 결재 문서 생성 실행
-- ============================================================================
DO $$
DECLARE
    v_count INT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '결재 문서 대량 생성 시작';
    RAISE NOTICE '========================================';

    v_count := generate_approval_documents();

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '결재 문서 생성 완료: %개', v_count;
    RAISE NOTICE '========================================';
END $$;

-- 함수 정리
DROP FUNCTION IF EXISTS generate_approval_documents;
DROP FUNCTION IF EXISTS generate_doc_number;

COMMIT;

-- ============================================================================
-- 결재 대리 규칙 생성 (일부 임원)
-- ============================================================================
BEGIN;

DO $$
DECLARE
    v_delegator RECORD;
    v_delegate RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '결재 대리 규칙 생성 중...';

    -- 본부장급 이상 직원 중 일부에게 대리 규칙 설정
    FOR v_delegator IN
        SELECT e.id, e.tenant_id, e.name
        FROM hr_core.employee e
        WHERE e.job_title_code >= 'G07'
        AND e.status = 'ACTIVE'
        AND RANDOM() < 0.1  -- 10%
        LIMIT 100
    LOOP
        -- 같은 부서의 다른 관리자를 대리인으로
        SELECT e.id, e.name INTO v_delegate
        FROM hr_core.employee e
        WHERE e.tenant_id = v_delegator.tenant_id
        AND e.id != v_delegator.id
        AND e.job_title_code >= 'G05'
        AND e.status = 'ACTIVE'
        ORDER BY RANDOM()
        LIMIT 1;

        IF v_delegate.id IS NOT NULL THEN
            INSERT INTO hr_approval.delegation_rule (
                tenant_id, delegator_id, delegator_name,
                delegate_id, delegate_name,
                start_date, end_date,
                document_types, reason, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_delegator.tenant_id,
                v_delegator.id,
                v_delegator.name,
                v_delegate.id,
                v_delegate.name,
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '30 days',
                ARRAY['LEAVE', 'OVERTIME'],
                '출장 중 결재 대리',
                true,
                NOW(), NOW(), 'system', 'system'
            );

            v_count := v_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '결재 대리 규칙 생성 완료: %개', v_count;
END $$;

COMMIT;

-- ============================================================================
-- 검증
-- ============================================================================
DO $$
DECLARE
    v_doc_count INT;
    v_line_count INT;
    v_history_count INT;
    v_delegation_count INT;
    v_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_doc_count FROM hr_approval.approval_document;
    SELECT COUNT(*) INTO v_line_count FROM hr_approval.approval_line;
    SELECT COUNT(*) INTO v_history_count FROM hr_approval.approval_history;
    SELECT COUNT(*) INTO v_delegation_count FROM hr_approval.delegation_rule;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '결재 데이터 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '결재 문서   : %개', v_doc_count;
    RAISE NOTICE '결재선      : %개', v_line_count;
    RAISE NOTICE '결재 이력   : %개', v_history_count;
    RAISE NOTICE '대리 규칙   : %개', v_delegation_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '상태별 결재 문서:';

    FOR v_record IN
        SELECT status, COUNT(*) as cnt
        FROM hr_approval.approval_document
        GROUP BY status
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '  %-15s: %개', v_record.status, v_record.cnt;
    END LOOP;
END $$;

-- ============================================================================
-- FILE: 16_notification_generator.sql
-- ============================================================================

-- ============================================================================
-- 16_notification_generator.sql
-- 알림 관련 데이터 생성 (템플릿, 설정, 알림)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 알림 템플릿 생성 (각 테넌트별)
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
BEGIN
    RAISE NOTICE '알림 템플릿 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP

        -- 결재 관련 알림 템플릿
        INSERT INTO hr_notification.notification_template (
            tenant_id, code, notification_type, channel, name, subject, body_template, description, is_active, variables,
            created_at, updated_at, created_by, updated_by
        ) VALUES
        -- 결재 요청
        (v_tenant.id, 'APPROVAL_REQUEST', 'APPROVAL', 'EMAIL', '결재 요청 알림',
         '[결재요청] {{document_title}}',
         '안녕하세요, {{recipient_name}}님.\n\n새로운 결재 요청이 도착했습니다.\n\n- 문서명: {{document_title}}\n- 기안자: {{drafter_name}}\n- 기안일: {{submitted_at}}\n\n결재 시스템에서 확인해 주세요.',
         '결재 요청 시 결재자에게 발송되는 이메일', true, '["recipient_name", "document_title", "drafter_name", "submitted_at"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'APPROVAL_REQUEST_PUSH', 'APPROVAL', 'PUSH', '결재 요청 푸시',
         NULL, '{{drafter_name}}님이 결재를 요청했습니다: {{document_title}}',
         '결재 요청 시 푸시 알림', true, '["drafter_name", "document_title"]',
         NOW(), NOW(), 'system', 'system'),

        -- 결재 승인
        (v_tenant.id, 'APPROVAL_APPROVED', 'APPROVAL', 'EMAIL', '결재 승인 알림',
         '[결재완료] {{document_title}} 승인되었습니다',
         '안녕하세요, {{recipient_name}}님.\n\n요청하신 결재가 승인되었습니다.\n\n- 문서명: {{document_title}}\n- 결재자: {{approver_name}}\n- 승인일: {{completed_at}}\n\n감사합니다.',
         '결재 승인 시 기안자에게 발송되는 이메일', true, '["recipient_name", "document_title", "approver_name", "completed_at"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'APPROVAL_APPROVED_PUSH', 'APPROVAL', 'PUSH', '결재 승인 푸시',
         NULL, '결재가 승인되었습니다: {{document_title}}',
         '결재 승인 시 푸시 알림', true, '["document_title"]',
         NOW(), NOW(), 'system', 'system'),

        -- 결재 반려
        (v_tenant.id, 'APPROVAL_REJECTED', 'APPROVAL', 'EMAIL', '결재 반려 알림',
         '[결재반려] {{document_title}} 반려되었습니다',
         '안녕하세요, {{recipient_name}}님.\n\n요청하신 결재가 반려되었습니다.\n\n- 문서명: {{document_title}}\n- 결재자: {{approver_name}}\n- 반려사유: {{reject_reason}}\n\n내용을 확인하시고 필요시 재상신해 주세요.',
         '결재 반려 시 기안자에게 발송되는 이메일', true, '["recipient_name", "document_title", "approver_name", "reject_reason"]',
         NOW(), NOW(), 'system', 'system'),

        -- 휴가 관련 알림
        (v_tenant.id, 'LEAVE_APPROVED', 'LEAVE', 'EMAIL', '휴가 승인 알림',
         '[휴가승인] {{leave_type}} 휴가가 승인되었습니다',
         '안녕하세요, {{recipient_name}}님.\n\n신청하신 휴가가 승인되었습니다.\n\n- 휴가유형: {{leave_type}}\n- 휴가기간: {{start_date}} ~ {{end_date}}\n- 일수: {{days_count}}일\n\n즐거운 휴가 보내세요!',
         '휴가 승인 시 발송되는 이메일', true, '["recipient_name", "leave_type", "start_date", "end_date", "days_count"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'LEAVE_APPROVED_PUSH', 'LEAVE', 'PUSH', '휴가 승인 푸시',
         NULL, '휴가가 승인되었습니다: {{start_date}} ~ {{end_date}}',
         '휴가 승인 푸시 알림', true, '["start_date", "end_date"]',
         NOW(), NOW(), 'system', 'system'),

        -- 근태 관련 알림
        (v_tenant.id, 'ATTENDANCE_LATE', 'ATTENDANCE', 'PUSH', '지각 알림',
         NULL, '오늘 {{late_minutes}}분 지각으로 처리되었습니다.',
         '지각 시 푸시 알림', true, '["late_minutes"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'ATTENDANCE_MISSING', 'ATTENDANCE', 'EMAIL', '출퇴근 미기록 알림',
         '[근태] 출퇴근 기록 확인 요청',
         '안녕하세요, {{recipient_name}}님.\n\n{{work_date}} 출퇴근 기록이 누락되어 있습니다.\n근태 시스템에서 확인해 주세요.',
         '출퇴근 미기록 시 이메일 알림', true, '["recipient_name", "work_date"]',
         NOW(), NOW(), 'system', 'system'),

        -- 공지사항 알림
        (v_tenant.id, 'ANNOUNCEMENT_NEW', 'ANNOUNCEMENT', 'EMAIL', '공지사항 알림',
         '[공지] {{announcement_title}}',
         '안녕하세요, {{recipient_name}}님.\n\n새로운 공지사항이 등록되었습니다.\n\n제목: {{announcement_title}}\n\n자세한 내용은 사내 포털에서 확인해 주세요.',
         '새 공지사항 등록 시 이메일 알림', true, '["recipient_name", "announcement_title"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'ANNOUNCEMENT_NEW_PUSH', 'ANNOUNCEMENT', 'PUSH', '공지사항 푸시',
         NULL, '새 공지: {{announcement_title}}',
         '새 공지사항 푸시 알림', true, '["announcement_title"]',
         NOW(), NOW(), 'system', 'system'),

        -- 생일/기념일 알림
        (v_tenant.id, 'BIRTHDAY_TODAY', 'BIRTHDAY', 'EMAIL', '생일 축하 알림',
         '🎂 생일을 축하합니다!',
         '{{recipient_name}}님, 생일을 진심으로 축하드립니다!\n\n행복하고 건강한 한 해 되시길 바랍니다.\n\n- ' || v_tenant.name || ' 임직원 일동',
         '생일 축하 이메일', true, '["recipient_name"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'ANNIVERSARY_REMINDER', 'ANNIVERSARY', 'PUSH', '입사 기념일 알림',
         NULL, '오늘은 {{employee_name}}님의 입사 {{years}}주년입니다!',
         '입사 기념일 푸시 알림', true, '["employee_name", "years"]',
         NOW(), NOW(), 'system', 'system'),

        -- 시스템 알림
        (v_tenant.id, 'SYSTEM_MAINTENANCE', 'SYSTEM', 'EMAIL', '시스템 점검 안내',
         '[안내] 시스템 점검 예정',
         '안녕하세요.\n\n시스템 점검이 예정되어 있습니다.\n\n- 점검일시: {{maintenance_date}}\n- 점검시간: {{maintenance_time}}\n- 예상소요: {{duration}}\n\n점검 시간 동안 서비스 이용이 제한될 수 있습니다.\n양해 부탁드립니다.',
         '시스템 점검 안내 이메일', true, '["maintenance_date", "maintenance_time", "duration"]',
         NOW(), NOW(), 'system', 'system'),

        -- 채용 관련 알림
        (v_tenant.id, 'RECRUITMENT_INTERVIEW_SCHEDULED', 'RECRUITMENT', 'EMAIL', '면접 일정 알림',
         '[면접안내] {{position_title}} 면접 일정',
         '안녕하세요, {{applicant_name}}님.\n\n지원해 주신 {{position_title}} 포지션의 면접 일정을 안내드립니다.\n\n- 일시: {{interview_date}} {{interview_time}}\n- 장소: {{interview_location}}\n- 면접유형: {{interview_type}}\n\n문의사항이 있으시면 연락 부탁드립니다.\n\n감사합니다.',
         '면접 일정 안내 이메일', true, '["applicant_name", "position_title", "interview_date", "interview_time", "interview_location", "interview_type"]',
         NOW(), NOW(), 'system', 'system'),

        (v_tenant.id, 'RECRUITMENT_OFFER_SENT', 'RECRUITMENT', 'EMAIL', '채용 제안 알림',
         '[채용제안] {{company_name}} 입사 제안드립니다',
         '안녕하세요, {{applicant_name}}님.\n\n{{company_name}}에서 {{position_title}} 포지션으로 입사를 제안드립니다.\n\n상세 내용은 첨부된 오퍼레터를 확인해 주세요.\n\n답변 기한: {{expires_at}}\n\n감사합니다.',
         '채용 제안 이메일', true, '["applicant_name", "company_name", "position_title", "expires_at"]',
         NOW(), NOW(), 'system', 'system');

    END LOOP;

    RAISE NOTICE '알림 템플릿 생성 완료';
END $$;

-- ============================================================================
-- 2. 직원 알림 설정 생성 (일부 직원)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_types TEXT[] := ARRAY['APPROVAL_REQUESTED', 'APPROVAL_APPROVED', 'LEAVE_REQUESTED', 'LEAVE_APPROVED', 'ANNOUNCEMENT', 'SYSTEM'];
    v_channels TEXT[] := ARRAY['EMAIL', 'WEB_PUSH'];
    v_type TEXT;
    v_channel TEXT;
BEGIN
    RAISE NOTICE '직원 알림 설정 생성 중...';

    -- 약 30%의 직원에게 알림 설정 생성
    FOR v_emp IN
        SELECT id, tenant_id, user_id
        FROM hr_core.employee
        WHERE status = 'ACTIVE'
        AND user_id IS NOT NULL
        AND RANDOM() < 0.3
        ORDER BY tenant_id, id
        LIMIT 20000
    LOOP
        FOREACH v_type IN ARRAY v_types LOOP
            FOREACH v_channel IN ARRAY v_channels LOOP
                INSERT INTO hr_notification.notification_preference (
                    id, tenant_id, user_id, notification_type, channel, enabled,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(),
                    v_emp.tenant_id,
                    v_emp.user_id,
                    v_type,
                    v_channel,
                    -- 일부는 비활성화
                    CASE
                        WHEN v_type = 'SYSTEM' AND v_channel = 'WEB_PUSH' THEN RANDOM() < 0.5
                        WHEN v_type = 'ANNOUNCEMENT' AND v_channel = 'EMAIL' THEN RANDOM() < 0.8
                        ELSE true
                    END,
                    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
                );

                v_count := v_count + 1;
            END LOOP;
        END LOOP;

        IF v_count % 10000 = 0 THEN
            RAISE NOTICE '  알림 설정 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '알림 설정 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 3. 알림 데이터 생성 (최근 1개월)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_notification_type VARCHAR(50);
    v_title VARCHAR(500);
    v_content TEXT;
    v_created_at TIMESTAMP;
    v_is_read BOOLEAN;
BEGIN
    RAISE NOTICE '알림 데이터 생성 중...';

    -- 각 직원당 5-15개의 알림 생성
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.email
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        AND RANDOM() < 0.4  -- 40%의 직원
        ORDER BY e.tenant_id, e.id
    LOOP
        FOR i IN 1..FLOOR(5 + RANDOM() * 11)::INT LOOP
            -- 허용된 notification_type만 사용
            v_notification_type := CASE FLOOR(RANDOM() * 6)::INT
                WHEN 0 THEN 'APPROVAL_REQUESTED'
                WHEN 1 THEN 'APPROVAL_APPROVED'
                WHEN 2 THEN 'LEAVE_APPROVED'
                WHEN 3 THEN 'ANNOUNCEMENT'
                WHEN 4 THEN 'SYSTEM'
                ELSE 'EMPLOYEE_JOINED'
            END;

            v_title := CASE v_notification_type
                WHEN 'APPROVAL_REQUESTED' THEN '새로운 결재 요청이 도착했습니다'
                WHEN 'APPROVAL_APPROVED' THEN '결재가 승인되었습니다'
                WHEN 'APPROVAL_REJECTED' THEN '결재가 반려되었습니다'
                WHEN 'LEAVE_APPROVED' THEN '휴가 신청이 승인되었습니다'
                WHEN 'ANNOUNCEMENT' THEN '새로운 공지사항이 등록되었습니다'
                WHEN 'SYSTEM' THEN '시스템 점검 안내'
                ELSE '새로운 직원이 입사했습니다'
            END;

            v_content := v_title || ' 상세 내용입니다.';
            v_created_at := NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL - ((FLOOR(RANDOM() * 24))::INT || ' hours')::INTERVAL;
            v_is_read := RANDOM() < 0.7;  -- 70% 읽음

            INSERT INTO hr_notification.notification (
                id, tenant_id, recipient_id, recipient_email,
                notification_type, channel, title, content,
                link_url, is_read, read_at, is_sent, sent_at,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_emp.id,
                v_emp.email,
                v_notification_type,
                CASE WHEN RANDOM() < 0.6 THEN 'EMAIL' ELSE 'WEB_PUSH' END,
                v_title,
                v_content,
                CASE v_notification_type
                    WHEN 'APPROVAL_REQUESTED' THEN '/approval/inbox'
                    WHEN 'APPROVAL_APPROVED' THEN '/approval/inbox'
                    WHEN 'LEAVE_APPROVED' THEN '/attendance/leave'
                    WHEN 'ANNOUNCEMENT' THEN '/announcement'
                    ELSE NULL
                END,
                v_is_read,
                CASE WHEN v_is_read THEN v_created_at + INTERVAL '1 hour' ELSE NULL END,
                true,
                v_created_at,
                v_created_at, NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;

            IF v_count % 50000 = 0 THEN
                RAISE NOTICE '  알림 %개 생성...', v_count;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '알림 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_template_count INT;
    v_preference_count INT;
    v_notification_count INT;
BEGIN
    SELECT COUNT(*) INTO v_template_count FROM hr_notification.notification_template;
    SELECT COUNT(*) INTO v_preference_count FROM hr_notification.notification_preference;
    SELECT COUNT(*) INTO v_notification_count FROM hr_notification.notification;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '알림 데이터 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '알림 템플릿 : %개', v_template_count;
    RAISE NOTICE '알림 설정   : %개', v_preference_count;
    RAISE NOTICE '알림        : %개', v_notification_count;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FILE: 17_file_generator.sql
-- ============================================================================

-- ============================================================================
-- 17_file_generator.sql
-- 파일 메타데이터 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 파일 메타데이터 생성
-- 결재문서 첨부파일, 직원 사진, 프로필 등
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_approval RECORD;
    v_count INT := 0;
    v_content_types TEXT[] := ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png'];
    v_extensions TEXT[] := ARRAY['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png'];
    v_file_idx INT;
    v_content_type TEXT;
    v_extension TEXT;
    v_stored_name VARCHAR(500);
    v_original_name VARCHAR(500);
BEGIN
    RAISE NOTICE '파일 메타데이터 생성 중...';

    -- 1. 직원 프로필 사진 (약 20%의 직원)
    RAISE NOTICE '  직원 프로필 사진 생성...';
    FOR v_emp IN
        SELECT id, tenant_id, name, employee_number
        FROM hr_core.employee
        WHERE status = 'ACTIVE'
        AND RANDOM() < 0.2
        ORDER BY tenant_id, id
    LOOP
        v_stored_name := 'profiles/' || v_emp.tenant_id || '/' || v_emp.id || '.jpg';
        v_original_name := v_emp.name || '_프로필.jpg';

        INSERT INTO hr_file.file_metadata (
            id, tenant_id, original_name, stored_name, content_type, file_size,
            storage_path, bucket_name, storage_type,
            reference_type, reference_id, uploader_id, uploader_name,
            is_public, download_count, checksum,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_original_name,
            v_stored_name,
            'image/jpeg',
            (50000 + FLOOR(RANDOM() * 450000))::BIGINT,  -- 50KB ~ 500KB
            'hr-saas-files/profiles',
            'hr-saas-files',
            'S3',
            'EMPLOYEE_PROFILE',
            v_emp.id,
            v_emp.id,
            v_emp.name,
            false,
            0,
            md5(v_stored_name),
            NOW() - ((FLOOR(RANDOM() * 365))::INT || ' days')::INTERVAL,
            NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE '    프로필 사진: %개', v_count;

    -- 2. 결재 문서 첨부파일 (약 30%의 결재문서)
    RAISE NOTICE '  결재 첨부파일 생성...';
    FOR v_approval IN
        SELECT ad.id, ad.tenant_id, ad.document_number, ad.drafter_id, ad.drafter_name
        FROM hr_approval.approval_document ad
        WHERE RANDOM() < 0.3
        ORDER BY ad.tenant_id, ad.id
    LOOP
        -- 1-3개의 첨부파일
        FOR i IN 1..FLOOR(1 + RANDOM() * 3)::INT LOOP
            v_file_idx := 1 + FLOOR(RANDOM() * 6)::INT;
            v_content_type := v_content_types[v_file_idx];
            v_extension := v_extensions[v_file_idx];
            v_stored_name := 'approval/' || v_approval.tenant_id || '/' || v_approval.id || '_' || i || '.' || v_extension;
            v_original_name := CASE v_extension
                WHEN 'pdf' THEN '첨부문서_' || i || '.pdf'
                WHEN 'docx' THEN '보고서_' || i || '.docx'
                WHEN 'xlsx' THEN '데이터_' || i || '.xlsx'
                WHEN 'pptx' THEN '발표자료_' || i || '.pptx'
                WHEN 'jpg' THEN '증빙사진_' || i || '.jpg'
                ELSE '첨부파일_' || i || '.' || v_extension
            END;

            INSERT INTO hr_file.file_metadata (
                id, tenant_id, original_name, stored_name, content_type, file_size,
                storage_path, bucket_name, storage_type,
                reference_type, reference_id, uploader_id, uploader_name,
                is_public, download_count, checksum,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_approval.tenant_id,
                v_original_name,
                v_stored_name,
                v_content_type,
                CASE v_extension
                    WHEN 'jpg' THEN (100000 + FLOOR(RANDOM() * 4900000))::BIGINT  -- 100KB ~ 5MB
                    WHEN 'png' THEN (200000 + FLOOR(RANDOM() * 4800000))::BIGINT
                    WHEN 'pdf' THEN (50000 + FLOOR(RANDOM() * 9950000))::BIGINT   -- 50KB ~ 10MB
                    WHEN 'pptx' THEN (500000 + FLOOR(RANDOM() * 19500000))::BIGINT -- 500KB ~ 20MB
                    ELSE (20000 + FLOOR(RANDOM() * 980000))::BIGINT  -- 20KB ~ 1MB
                END,
                'hr-saas-files/approval',
                'hr-saas-files',
                'S3',
                'APPROVAL_ATTACHMENT',
                v_approval.id,
                v_approval.drafter_id,
                v_approval.drafter_name,
                false,
                FLOOR(RANDOM() * 5)::INT,
                md5(v_stored_name),
                NOW() - ((FLOOR(RANDOM() * 90))::INT || ' days')::INTERVAL,
                NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    -- 3. 공지사항 첨부파일 (가상)
    RAISE NOTICE '  공지사항 첨부파일 생성...';
    FOR v_emp IN
        SELECT DISTINCT t.id as tenant_id,
               (SELECT id FROM hr_core.employee WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1) as uploader_id,
               (SELECT name FROM hr_core.employee WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1) as uploader_name
        FROM tenant_common.tenant t
    LOOP
        FOR i IN 1..10 LOOP  -- 테넌트당 10개의 공지사항 첨부파일
            v_stored_name := 'announcement/' || v_emp.tenant_id || '/notice_' || i || '.pdf';
            v_original_name := '공지사항_' || i || '.pdf';

            INSERT INTO hr_file.file_metadata (
                id, tenant_id, original_name, stored_name, content_type, file_size,
                storage_path, bucket_name, storage_type,
                reference_type, reference_id, uploader_id, uploader_name,
                is_public, download_count, checksum,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_original_name,
                v_stored_name,
                'application/pdf',
                (100000 + FLOOR(RANDOM() * 4900000))::BIGINT,
                'hr-saas-files/announcement',
                'hr-saas-files',
                'S3',
                'ANNOUNCEMENT',
                gen_random_uuid(),
                v_emp.uploader_id,
                v_emp.uploader_name,
                true,  -- 공지사항은 공개
                (10 + FLOOR(RANDOM() * 200))::INT,
                md5(v_stored_name),
                NOW() - ((FLOOR(RANDOM() * 180))::INT || ' days')::INTERVAL,
                NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '파일 메타데이터 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_count INT;
    v_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_count FROM hr_file.file_metadata;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '파일 메타데이터 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '총 파일 수: %개', v_count;
    RAISE NOTICE '';
    RAISE NOTICE '참조 유형별:';

    FOR v_record IN
        SELECT reference_type, COUNT(*) as cnt
        FROM hr_file.file_metadata
        GROUP BY reference_type
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '  %-25s: %개', v_record.reference_type, v_record.cnt;
    END LOOP;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FILE: 18_recruitment_generator.sql
-- ============================================================================

-- ============================================================================
-- 18_recruitment_generator.sql
-- 채용 관련 데이터 생성 (채용공고, 지원자, 지원서, 면접, 오퍼)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 채용 공고 생성 (각 테넌트별 10-30개)
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
    v_dept RECORD;
    v_recruiter RECORD;
    v_count INT := 0;
    v_job_code VARCHAR(30);
    v_title VARCHAR(200);
    v_status VARCHAR(20);
    v_employment_type VARCHAR(20);
    v_positions TEXT[] := ARRAY[
        '소프트웨어 엔지니어', '프론트엔드 개발자', '백엔드 개발자', '데이터 엔지니어',
        'DevOps 엔지니어', 'AI/ML 엔지니어', '보안 엔지니어', 'QA 엔지니어',
        '제품 기획자', 'UI/UX 디자이너', '프로젝트 매니저', '기술 영업',
        '인사 담당자', '재무 담당자', '마케팅 매니저', '경영 지원',
        '연구원', '품질 관리자', '생산 관리자', '물류 담당자'
    ];
    v_position TEXT;
BEGIN
    RAISE NOTICE '채용 공고 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        -- 테넌트별 채용 담당자 조회
        SELECT e.id, e.name INTO v_recruiter
        FROM hr_core.employee e
        JOIN hr_core.department d ON e.department_id = d.id
        WHERE e.tenant_id = v_tenant.id
        AND d.code LIKE '%HR%'
        AND e.status = 'ACTIVE'
        ORDER BY e.job_title_code DESC
        LIMIT 1;

        -- 테넌트 규모에 따른 채용 공고 수
        FOR i IN 1..CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 30
            WHEN v_tenant.code IN ('HANSUNG_SDI', 'HANSUNG_LIFE') THEN 20
            WHEN v_tenant.code = 'HANSUNG_HD' THEN 5
            ELSE 15
        END LOOP
            -- 부서 랜덤 선택
            SELECT id, name INTO v_dept
            FROM hr_core.department
            WHERE tenant_id = v_tenant.id
            AND level >= 3
            ORDER BY RANDOM()
            LIMIT 1;

            v_position := v_positions[1 + FLOOR(RANDOM() * array_length(v_positions, 1))::INT];
            v_job_code := v_tenant.code || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(i::TEXT, 4, '0');

            -- 상태 결정
            v_status := CASE
                WHEN RANDOM() < 0.5 THEN 'OPEN'
                WHEN RANDOM() < 0.7 THEN 'CLOSED'
                WHEN RANDOM() < 0.9 THEN 'IN_PROGRESS'
                ELSE 'DRAFT'
            END;

            v_employment_type := CASE
                WHEN RANDOM() < 0.8 THEN 'FULL_TIME'
                WHEN RANDOM() < 0.95 THEN 'CONTRACT'
                ELSE 'INTERN'
            END;

            INSERT INTO hr_recruitment.job_posting (
                tenant_id, job_code, title, department_id, department_name,
                job_description, requirements, preferred_qualifications,
                employment_type, experience_min, experience_max,
                salary_min, salary_max, salary_negotiable,
                work_location, headcount, skills, benefits,
                status, open_date, close_date,
                recruiter_id, recruiter_name,
                application_count, view_count, is_featured, is_urgent,
                interview_process,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tenant.id,
                v_job_code,
                v_position || ' 채용',
                v_dept.id,
                v_dept.name,
                v_position || ' 포지션 채용입니다. ' || v_tenant.name || '와 함께 성장할 인재를 모집합니다.',
                E'- 관련 경력 3년 이상\n- 관련 분야 학사 학위 이상\n- 원활한 커뮤니케이션 능력',
                E'- 대기업 근무 경험\n- 관련 자격증 보유\n- 영어 커뮤니케이션 가능',
                v_employment_type,
                CASE WHEN v_employment_type = 'INTERN' THEN 0 ELSE 1 + FLOOR(RANDOM() * 5)::INT END,
                CASE WHEN v_employment_type = 'INTERN' THEN 0 ELSE 5 + FLOOR(RANDOM() * 10)::INT END,
                CASE WHEN v_employment_type = 'INTERN' THEN 2500000 ELSE 40000000 + FLOOR(RANDOM() * 40000000) END,
                CASE WHEN v_employment_type = 'INTERN' THEN 3000000 ELSE 80000000 + FLOOR(RANDOM() * 40000000) END,
                true,
                CASE
                    WHEN v_tenant.code IN ('HANSUNG_ELEC', 'HANSUNG_SDI') THEN '경기도 수원/용인'
                    WHEN v_tenant.code = 'HANSUNG_ENG' THEN '서울/현장'
                    WHEN v_tenant.code = 'HANSUNG_CHEM' THEN '울산/여수'
                    ELSE '서울'
                END,
                1 + FLOOR(RANDOM() * 5)::INT,
                '["Java", "Spring", "AWS", "Kubernetes", "Python"]'::jsonb,
                '["건강검진", "학자금지원", "경조금", "복지포인트", "자기개발비"]'::jsonb,
                v_status,
                CURRENT_DATE - ((FLOOR(RANDOM() * 60))::INT || ' days')::INTERVAL,
                CASE WHEN v_status IN ('OPEN', 'IN_PROGRESS') THEN CURRENT_DATE + ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL ELSE CURRENT_DATE - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL END,
                v_recruiter.id,
                v_recruiter.name,
                FLOOR(RANDOM() * 100)::INT,
                FLOOR(RANDOM() * 500)::INT,
                RANDOM() < 0.1,
                RANDOM() < 0.2,
                '[{"stage": "서류전형", "order": 1}, {"stage": "1차 면접", "order": 2}, {"stage": "2차 면접", "order": 3}, {"stage": "최종 합격", "order": 4}]'::jsonb,
                NOW() - ((FLOOR(RANDOM() * 90))::INT || ' days')::INTERVAL,
                NOW(), v_recruiter.id, v_recruiter.id
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '채용 공고 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 2. 지원자 생성 (각 테넌트별 100-500명)
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
    v_count INT := 0;
    v_surnames TEXT[] := ARRAY['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
    v_male_names TEXT[] := ARRAY['민준', '서준', '예준', '도윤', '시우', '주원', '하준', '지호', '준서', '현우'];
    v_female_names TEXT[] := ARRAY['서연', '서윤', '지우', '민서', '하윤', '하은', '지유', '채원', '지민', '수아'];
    v_surname TEXT;
    v_name TEXT;
    v_full_name VARCHAR(100);
    v_email VARCHAR(200);
    v_gender VARCHAR(10);
    v_sources TEXT[] := ARRAY['JOBKOREA', 'SARAMIN', 'LINKEDIN', 'WANTED', 'EMPLOYEE_REFERRAL', 'COMPANY_WEBSITE', 'CAMPUS_RECRUIT'];
BEGIN
    RAISE NOTICE '지원자 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        FOR i IN 1..CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 500
            WHEN v_tenant.code IN ('HANSUNG_SDI', 'HANSUNG_LIFE') THEN 300
            WHEN v_tenant.code = 'HANSUNG_HD' THEN 50
            ELSE 200
        END LOOP
            v_gender := CASE WHEN RANDOM() < 0.55 THEN 'MALE' ELSE 'FEMALE' END;
            v_surname := v_surnames[1 + FLOOR(RANDOM() * array_length(v_surnames, 1))::INT];

            IF v_gender = 'MALE' THEN
                v_name := v_male_names[1 + FLOOR(RANDOM() * array_length(v_male_names, 1))::INT];
            ELSE
                v_name := v_female_names[1 + FLOOR(RANDOM() * array_length(v_female_names, 1))::INT];
            END IF;

            v_full_name := v_surname || v_name;
            v_email := 'applicant' || v_count || '_' || FLOOR(RANDOM() * 1000)::INT || '@' ||
                       CASE FLOOR(RANDOM() * 5)::INT
                           WHEN 0 THEN 'gmail.com'
                           WHEN 1 THEN 'naver.com'
                           WHEN 2 THEN 'daum.net'
                           WHEN 3 THEN 'kakao.com'
                           ELSE 'hanmail.net'
                       END;

            INSERT INTO hr_recruitment.applicant (
                tenant_id, name, email, phone, birth_date, gender, address,
                education, experience, skills, certificates, languages,
                source, source_detail, notes,
                is_blacklisted,
                created_at, updated_at
            ) VALUES (
                v_tenant.id,
                v_full_name,
                v_email,
                '010-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0') || '-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0'),
                make_date(1985 + FLOOR(RANDOM() * 15)::INT, 1 + FLOOR(RANDOM() * 12)::INT, 1 + FLOOR(RANDOM() * 28)::INT),
                v_gender,
                '서울특별시 ' || CASE FLOOR(RANDOM() * 5)::INT WHEN 0 THEN '강남구' WHEN 1 THEN '서초구' WHEN 2 THEN '송파구' WHEN 3 THEN '마포구' ELSE '영등포구' END,
                jsonb_build_array(jsonb_build_object('school', CASE FLOOR(RANDOM() * 5)::INT WHEN 0 THEN '서울대학교' WHEN 1 THEN '연세대학교' WHEN 2 THEN '고려대학교' WHEN 3 THEN '성균관대학교' ELSE '한양대학교' END, 'degree', '학사', 'major', '컴퓨터공학')),
                jsonb_build_array(jsonb_build_object('company', '이전회사', 'position', '개발자', 'years', FLOOR(RANDOM() * 10)::INT)),
                '["Java", "Python", "JavaScript", "SQL"]'::jsonb,
                '["정보처리기사", "AWS SAA"]'::jsonb,
                jsonb_build_array(jsonb_build_object('language', '영어', 'level', '중급')),
                v_sources[1 + FLOOR(RANDOM() * array_length(v_sources, 1))::INT],
                NULL,
                NULL,
                false,
                NOW() - ((FLOOR(RANDOM() * 180))::INT || ' days')::INTERVAL,
                NOW()
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '지원자 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 3. 지원서 생성 (지원자 - 채용공고 매칭)
-- ============================================================================
DO $$
DECLARE
    v_applicant RECORD;
    v_job RECORD;
    v_count INT := 0;
    v_app_number VARCHAR(50);
    v_status VARCHAR(30);
    v_stage VARCHAR(50);
BEGIN
    RAISE NOTICE '지원서 생성 중...';

    FOR v_applicant IN
        SELECT id, tenant_id, name
        FROM hr_recruitment.applicant
        WHERE NOT is_blacklisted
    LOOP
        -- 각 지원자당 1-3개의 지원서
        FOR v_job IN
            SELECT id, title
            FROM hr_recruitment.job_posting
            WHERE tenant_id = v_applicant.tenant_id
            AND status IN ('OPEN', 'CLOSED', 'IN_PROGRESS')
            ORDER BY RANDOM()
            LIMIT FLOOR(1 + RANDOM() * 3)::INT
        LOOP
            v_count := v_count + 1;
            v_app_number := 'APP-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(v_count::TEXT, 6, '0');

            v_status := CASE
                WHEN RANDOM() < 0.3 THEN 'SUBMITTED'
                WHEN RANDOM() < 0.5 THEN 'SCREENING'
                WHEN RANDOM() < 0.65 THEN 'INTERVIEW'
                WHEN RANDOM() < 0.75 THEN 'OFFER'
                WHEN RANDOM() < 0.85 THEN 'HIRED'
                WHEN RANDOM() < 0.95 THEN 'REJECTED'
                ELSE 'WITHDRAWN'
            END;

            v_stage := CASE v_status
                WHEN 'SUBMITTED' THEN 'DOCUMENT'
                WHEN 'SCREENING' THEN 'DOCUMENT'
                WHEN 'INTERVIEW' THEN CASE WHEN RANDOM() < 0.5 THEN 'FIRST_INTERVIEW' ELSE 'SECOND_INTERVIEW' END
                WHEN 'OFFER' THEN 'OFFER'
                WHEN 'HIRED' THEN 'HIRED'
                WHEN 'REJECTED' THEN 'REJECTED'
                ELSE 'WITHDRAWN'
            END;

            INSERT INTO hr_recruitment.application (
                tenant_id, job_posting_id, applicant_id, application_number,
                status, cover_letter, expected_salary, available_date,
                current_stage, stage_order,
                screening_score, screening_notes,
                rejected_at, withdrawn_at, hired_at,
                created_at, updated_at
            ) VALUES (
                v_applicant.tenant_id,
                v_job.id,
                v_applicant.id,
                v_app_number,
                v_status,
                '귀사의 ' || v_job.title || ' 포지션에 지원합니다. 저의 경험과 역량이 귀사에 기여할 수 있을 것이라 확신합니다.',
                40000000 + FLOOR(RANDOM() * 80000000),
                '즉시 가능' || CASE WHEN RANDOM() < 0.3 THEN '' ELSE ' / 협의 가능' END,
                v_stage,
                CASE v_stage
                    WHEN 'DOCUMENT' THEN 0
                    WHEN 'FIRST_INTERVIEW' THEN 1
                    WHEN 'SECOND_INTERVIEW' THEN 2
                    WHEN 'OFFER' THEN 3
                    WHEN 'HIRED' THEN 4
                    ELSE 0
                END,
                CASE WHEN v_status NOT IN ('SUBMITTED') THEN 50 + FLOOR(RANDOM() * 50)::INT ELSE NULL END,
                CASE WHEN v_status NOT IN ('SUBMITTED') THEN '서류 검토 완료' ELSE NULL END,
                CASE WHEN v_status = 'REJECTED' THEN NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL ELSE NULL END,
                CASE WHEN v_status = 'WITHDRAWN' THEN NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL ELSE NULL END,
                CASE WHEN v_status = 'HIRED' THEN NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL ELSE NULL END,
                NOW() - ((FLOOR(RANDOM() * 90))::INT || ' days')::INTERVAL,
                NOW()
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE '지원서 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 4. 면접 생성
-- ============================================================================
DO $$
DECLARE
    v_app RECORD;
    v_count INT := 0;
    v_interview_types TEXT[] := ARRAY['PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL', 'EXECUTIVE'];
    v_interview_type TEXT;
    v_interviewer RECORD;
BEGIN
    RAISE NOTICE '면접 생성 중...';

    FOR v_app IN
        SELECT a.id, a.tenant_id, a.status, a.current_stage
        FROM hr_recruitment.application a
        WHERE a.status IN ('INTERVIEW', 'OFFER', 'HIRED')
    LOOP
        -- 1-3라운드 면접
        FOR round IN 1..CASE
            WHEN v_app.status = 'INTERVIEW' THEN FLOOR(1 + RANDOM() * 2)::INT
            ELSE FLOOR(2 + RANDOM() * 2)::INT
        END LOOP
            v_interview_type := v_interview_types[LEAST(round, array_length(v_interview_types, 1))];

            -- 면접관 선택
            SELECT e.id, e.name INTO v_interviewer
            FROM hr_core.employee e
            WHERE e.tenant_id = v_app.tenant_id
            AND e.job_title_code >= 'G05'
            AND e.status = 'ACTIVE'
            ORDER BY RANDOM()
            LIMIT 1;

            INSERT INTO hr_recruitment.interview (
                tenant_id, application_id, interview_type, round,
                status, scheduled_date, scheduled_time, duration_minutes,
                location, meeting_url, interviewers, notes,
                result, result_notes, overall_score,
                feedback_deadline,
                created_at, updated_at
            ) VALUES (
                v_app.tenant_id,
                v_app.id,
                v_interview_type,
                round,
                CASE
                    WHEN v_app.status IN ('OFFER', 'HIRED') THEN 'COMPLETED'
                    WHEN v_app.status = 'INTERVIEW' AND round = 1 THEN 'COMPLETED'
                    ELSE 'SCHEDULED'
                END,
                CURRENT_DATE - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL + ((round * 7) || ' days')::INTERVAL,
                ('10:00'::TIME + ((FLOOR(RANDOM() * 8))::INT || ' hours')::INTERVAL),
                CASE v_interview_type WHEN 'PHONE' THEN 30 WHEN 'VIDEO' THEN 45 ELSE 60 END,
                CASE v_interview_type
                    WHEN 'PHONE' THEN '전화 면접'
                    WHEN 'VIDEO' THEN 'Zoom 화상 면접'
                    ELSE '본사 회의실'
                END,
                CASE WHEN v_interview_type = 'VIDEO' THEN 'https://zoom.us/j/' || FLOOR(RANDOM() * 10000000000)::BIGINT ELSE NULL END,
                ('[{"id": "' || COALESCE(v_interviewer.id::TEXT, gen_random_uuid()::TEXT) || '", "name": "' || COALESCE(v_interviewer.name, '면접관') || '"}]')::jsonb,
                NULL,
                CASE WHEN v_app.status IN ('OFFER', 'HIRED') OR (v_app.status = 'INTERVIEW' AND round = 1)
                     THEN CASE WHEN RANDOM() < 0.8 THEN 'PASS' ELSE 'FAIL' END
                     ELSE NULL END,
                CASE WHEN v_app.status IN ('OFFER', 'HIRED') THEN '전반적으로 우수한 지원자입니다.' ELSE NULL END,
                CASE WHEN v_app.status IN ('OFFER', 'HIRED') THEN 70 + FLOOR(RANDOM() * 30)::INT ELSE NULL END,
                CURRENT_DATE + ((round * 7 + 3) || ' days')::INTERVAL,
                NOW() - ((FLOOR(RANDOM() * 60))::INT || ' days')::INTERVAL,
                NOW()
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '면접 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 5. 면접 평가 생성
-- ============================================================================
DO $$
DECLARE
    v_interview RECORD;
    v_count INT := 0;
    v_criteria TEXT[] := ARRAY['기술역량', '커뮤니케이션', '문제해결력', '팀워크', '성장가능성'];
    v_criterion TEXT;
    v_interviewer RECORD;
BEGIN
    RAISE NOTICE '면접 평가 생성 중...';

    FOR v_interview IN
        SELECT i.id, i.tenant_id, i.interviewers, i.status
        FROM hr_recruitment.interview i
        WHERE i.status = 'COMPLETED'
    LOOP
        -- 각 평가 항목별 점수
        FOREACH v_criterion IN ARRAY v_criteria LOOP
            INSERT INTO hr_recruitment.interview_score (
                tenant_id, interview_id,
                interviewer_id, interviewer_name,
                criterion, score, max_score, weight, comment,
                evaluated_at,
                created_at, updated_at
            ) VALUES (
                v_interview.tenant_id,
                v_interview.id,
                (v_interview.interviewers->0->>'id')::UUID,
                v_interview.interviewers->0->>'name',
                v_criterion,
                3 + FLOOR(RANDOM() * 3)::INT,  -- 3-5점
                5,
                1.0,
                v_criterion || ' 평가: 양호',
                NOW() - ((FLOOR(RANDOM() * 7))::INT || ' days')::INTERVAL,
                NOW(), NOW()
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '면접 평가 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 6. 채용 오퍼 생성
-- ============================================================================
DO $$
DECLARE
    v_app RECORD;
    v_count INT := 0;
    v_offer_number VARCHAR(50);
BEGIN
    RAISE NOTICE '채용 오퍼 생성 중...';

    FOR v_app IN
        SELECT a.id, a.tenant_id, a.job_posting_id,
               ap.name as applicant_name,
               jp.title as position_title, jp.department_id, jp.department_name
        FROM hr_recruitment.application a
        JOIN hr_recruitment.applicant ap ON a.applicant_id = ap.id
        JOIN hr_recruitment.job_posting jp ON a.job_posting_id = jp.id
        WHERE a.status IN ('OFFER', 'HIRED')
    LOOP
        v_count := v_count + 1;
        v_offer_number := 'OFFER-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(v_count::TEXT, 5, '0');

        INSERT INTO hr_recruitment.offer (
            tenant_id, application_id, offer_number,
            status, position_title, department_id, department_name,
            grade_code, grade_name,
            base_salary, signing_bonus, benefits,
            start_date, employment_type, probation_months, work_location,
            expires_at, sent_at, responded_at,
            created_at, updated_at
        ) VALUES (
            v_app.tenant_id,
            v_app.id,
            v_offer_number,
            CASE WHEN RANDOM() < 0.7 THEN 'ACCEPTED' WHEN RANDOM() < 0.9 THEN 'PENDING' ELSE 'DECLINED' END,
            v_app.position_title,
            v_app.department_id,
            v_app.department_name,
            'G03',
            '대리',
            50000000 + FLOOR(RANDOM() * 50000000),
            CASE WHEN RANDOM() < 0.3 THEN 3000000 + FLOOR(RANDOM() * 7000000) ELSE NULL END,
            '["4대보험", "연차", "경조금", "건강검진"]'::jsonb,
            CURRENT_DATE + ((30 + FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL,
            'FULL_TIME',
            3,
            '본사',
            NOW() + INTERVAL '7 days',
            NOW() - ((FLOOR(RANDOM() * 14))::INT || ' days')::INTERVAL,
            CASE WHEN RANDOM() < 0.8 THEN NOW() - ((FLOOR(RANDOM() * 7))::INT || ' days')::INTERVAL ELSE NULL END,
            NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL,
            NOW()
        );
    END LOOP;

    RAISE NOTICE '채용 오퍼 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_job_count INT;
    v_applicant_count INT;
    v_application_count INT;
    v_interview_count INT;
    v_score_count INT;
    v_offer_count INT;
BEGIN
    SELECT COUNT(*) INTO v_job_count FROM hr_recruitment.job_posting;
    SELECT COUNT(*) INTO v_applicant_count FROM hr_recruitment.applicant;
    SELECT COUNT(*) INTO v_application_count FROM hr_recruitment.application;
    SELECT COUNT(*) INTO v_interview_count FROM hr_recruitment.interview;
    SELECT COUNT(*) INTO v_score_count FROM hr_recruitment.interview_score;
    SELECT COUNT(*) INTO v_offer_count FROM hr_recruitment.offer;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '채용 데이터 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '채용 공고   : %개', v_job_count;
    RAISE NOTICE '지원자      : %개', v_applicant_count;
    RAISE NOTICE '지원서      : %개', v_application_count;
    RAISE NOTICE '면접        : %개', v_interview_count;
    RAISE NOTICE '면접 평가   : %개', v_score_count;
    RAISE NOTICE '채용 오퍼   : %개', v_offer_count;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FILE: 19_appointment_generator.sql
-- ============================================================================

-- ============================================================================
-- 19_appointment_generator.sql
-- 발령 서비스 샘플 데이터 생성
-- ============================================================================
-- 생성 규모:
--   - 발령안(draft): 테넌트당 ~50건 (총 ~400건)
--   - 발령상세(detail): 발령안당 평균 10건 (총 ~4,000건)
--   - 예약발령(schedule): ~100건
--   - 발령이력(history): ~5,000건
-- ============================================================================

-- RLS 비활성화
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- 발령안 및 발령상세 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_employee RECORD;
    v_draft_id UUID;
    v_draft_number VARCHAR(50);
    v_draft_count INT;
    v_detail_count INT;
    v_effective_date DATE;
    v_status VARCHAR(20);
    v_statuses VARCHAR(20)[] := ARRAY['DRAFT', 'PENDING', 'APPROVED', 'EXECUTED', 'CANCELLED'];
    v_appointment_types VARCHAR(30)[] := ARRAY['TRANSFER', 'PROMOTION', 'DEMOTION', 'POSITION_CHANGE', 'DEPARTMENT_CHANGE', 'CONCURRENT_POSITION', 'LEAVE_OF_ABSENCE', 'RETURN_FROM_LEAVE', 'RETIREMENT'];
    v_appointment_type VARCHAR(30);
    v_from_dept RECORD;
    v_to_dept RECORD;
    v_batch_size INT := 100;
    v_total_drafts INT := 0;
    v_total_details INT := 0;
BEGIN
    RAISE NOTICE '발령 데이터 생성 시작...';

    -- 테넌트별 처리
    FOR v_tenant IN
        SELECT id, code, name FROM tenant_common.tenant ORDER BY name
    LOOP
        RAISE NOTICE '  테넌트: % 발령 데이터 생성 중...', v_tenant.name;

        -- 테넌트 규모에 따른 발령안 수 결정
        v_draft_count := CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 80
            WHEN v_tenant.code IN ('HANSUNG_LIFE', 'HANSUNG_SDI') THEN 60
            WHEN v_tenant.code IN ('HANSUNG_ENG', 'HANSUNG_CHEM') THEN 50
            ELSE 40
        END;

        -- 발령안 생성
        FOR i IN 1..v_draft_count LOOP
            v_draft_id := gen_random_uuid();
            v_draft_number := 'APT-' || v_tenant.code || '-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(i::TEXT, 5, '0');
            v_effective_date := CURRENT_DATE - (FLOOR(RANDOM() * 180)::INT) + (FLOOR(RANDOM() * 60)::INT - 30);
            v_status := v_statuses[1 + FLOOR(RANDOM() * 5)::INT];

            -- 과거 발령은 대부분 EXECUTED
            IF v_effective_date < CURRENT_DATE - 30 THEN
                v_status := CASE WHEN RANDOM() < 0.9 THEN 'EXECUTED' ELSE 'CANCELLED' END;
            ELSIF v_effective_date < CURRENT_DATE THEN
                v_status := CASE
                    WHEN RANDOM() < 0.7 THEN 'EXECUTED'
                    WHEN RANDOM() < 0.9 THEN 'APPROVED'
                    ELSE 'CANCELLED'
                END;
            ELSE
                v_status := CASE
                    WHEN RANDOM() < 0.3 THEN 'DRAFT'
                    WHEN RANDOM() < 0.7 THEN 'PENDING'
                    ELSE 'APPROVED'
                END;
            END IF;

            INSERT INTO hr_appointment.appointment_draft (
                id, tenant_id, draft_number, title, effective_date, description, status,
                approved_at, executed_at, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_draft_id,
                v_tenant.id,
                v_draft_number,
                TO_CHAR(v_effective_date, 'YYYY년 MM월') || ' 정기 인사발령',
                v_effective_date,
                TO_CHAR(v_effective_date, 'YYYY년 MM월 DD일') || ' 시행 인사발령 건',
                v_status,
                CASE WHEN v_status IN ('APPROVED', 'EXECUTED') THEN v_effective_date - 7 END,
                CASE WHEN v_status = 'EXECUTED' THEN v_effective_date END,
                v_effective_date - FLOOR(RANDOM() * 30)::INT,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            -- 발령상세 생성 (발령안당 5~20건)
            v_detail_count := 5 + FLOOR(RANDOM() * 16)::INT;

            FOR j IN 1..v_detail_count LOOP
                -- 랜덤 직원 선택
                SELECT e.id, e.name, e.employee_number, e.department_id
                INTO v_employee
                FROM hr_core.employee e
                WHERE e.tenant_id = v_tenant.id AND e.status = 'ACTIVE'
                ORDER BY RANDOM()
                LIMIT 1;

                IF v_employee.id IS NOT NULL THEN
                    v_appointment_type := v_appointment_types[1 + FLOOR(RANDOM() * 9)::INT];

                    -- 현재 부서
                    SELECT id, name INTO v_from_dept
                    FROM hr_core.department
                    WHERE id = v_employee.department_id;

                    -- 이동할 부서 (부서 이동 유형인 경우)
                    IF v_appointment_type IN ('TRANSFER', 'DEPARTMENT_CHANGE') THEN
                        SELECT id, name INTO v_to_dept
                        FROM hr_core.department
                        WHERE tenant_id = v_tenant.id AND id != COALESCE(v_from_dept.id, '00000000-0000-0000-0000-000000000000')
                        ORDER BY RANDOM()
                        LIMIT 1;
                    ELSE
                        v_to_dept := v_from_dept;
                    END IF;

                    INSERT INTO hr_appointment.appointment_detail (
                        tenant_id, draft_id, employee_id, employee_name, employee_number,
                        appointment_type, from_department_id, from_department_name,
                        to_department_id, to_department_name,
                        from_position_code, from_position_name, to_position_code, to_position_name,
                        reason, status, executed_at,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        v_tenant.id,
                        v_draft_id,
                        v_employee.id,
                        v_employee.name,
                        v_employee.employee_number,
                        v_appointment_type,
                        v_from_dept.id,
                        v_from_dept.name,
                        v_to_dept.id,
                        v_to_dept.name,
                        'P0' || (1 + FLOOR(RANDOM() * 6))::INT,
                        CASE (1 + FLOOR(RANDOM() * 6))::INT
                            WHEN 1 THEN '팀원' WHEN 2 THEN '선임' WHEN 3 THEN '책임'
                            WHEN 4 THEN '수석' WHEN 5 THEN '파트장' ELSE '팀장'
                        END,
                        'P0' || (1 + FLOOR(RANDOM() * 6))::INT,
                        CASE (1 + FLOOR(RANDOM() * 6))::INT
                            WHEN 1 THEN '팀원' WHEN 2 THEN '선임' WHEN 3 THEN '책임'
                            WHEN 4 THEN '수석' WHEN 5 THEN '파트장' ELSE '팀장'
                        END,
                        CASE v_appointment_type
                            WHEN 'TRANSFER' THEN '조직개편에 따른 전보'
                            WHEN 'PROMOTION' THEN '정기 승진'
                            WHEN 'DEMOTION' THEN '징계에 따른 강등'
                            WHEN 'POSITION_CHANGE' THEN '직책 변경'
                            WHEN 'DEPARTMENT_CHANGE' THEN '부서 변경'
                            WHEN 'CONCURRENT_POSITION' THEN '겸직 발령'
                            WHEN 'LEAVE_OF_ABSENCE' THEN '휴직 처리'
                            WHEN 'RETURN_FROM_LEAVE' THEN '휴직 복귀'
                            ELSE '정년 퇴직'
                        END,
                        CASE WHEN v_status = 'EXECUTED' THEN 'EXECUTED' ELSE 'PENDING' END,
                        CASE WHEN v_status = 'EXECUTED' THEN v_effective_date END,
                        v_effective_date - FLOOR(RANDOM() * 30)::INT,
                        CURRENT_TIMESTAMP,
                        'system',
                        'system'
                    );

                    v_total_details := v_total_details + 1;
                END IF;
            END LOOP;

            v_total_drafts := v_total_drafts + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '발령안 % 건, 발령상세 % 건 생성 완료', v_total_drafts, v_total_details;
END $$;

-- ============================================================================
-- 예약 발령 생성 (미래 발령)
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_draft RECORD;
    v_schedule_count INT := 0;
BEGIN
    RAISE NOTICE '예약 발령 생성 중...';

    FOR v_tenant IN SELECT id, name FROM tenant_common.tenant LOOP
        -- APPROVED 상태의 미래 발령안에 대해 예약 발령 생성
        FOR v_draft IN
            SELECT id, effective_date
            FROM hr_appointment.appointment_draft
            WHERE tenant_id = v_tenant.id
              AND status = 'APPROVED'
              AND effective_date > CURRENT_DATE
            LIMIT 20
        LOOP
            INSERT INTO hr_appointment.appointment_schedule (
                tenant_id, draft_id, scheduled_date, scheduled_time, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tenant.id,
                v_draft.id,
                v_draft.effective_date,
                '00:00:00',
                'SCHEDULED',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            v_schedule_count := v_schedule_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '예약 발령 % 건 생성 완료', v_schedule_count;
END $$;

-- ============================================================================
-- 발령 이력 생성 (과거 실행된 발령)
-- ============================================================================

DO $$
DECLARE
    v_detail RECORD;
    v_history_count INT := 0;
BEGIN
    RAISE NOTICE '발령 이력 생성 중...';

    -- 실행 완료된 발령 상세를 이력으로 복사
    FOR v_detail IN
        SELECT d.*, dr.effective_date, dr.draft_number
        FROM hr_appointment.appointment_detail d
        JOIN hr_appointment.appointment_draft dr ON d.draft_id = dr.id
        WHERE d.status = 'EXECUTED'
        LIMIT 5000
    LOOP
        INSERT INTO hr_appointment.appointment_history (
            tenant_id, detail_id, employee_id, employee_name, employee_number,
            appointment_type, effective_date, from_values, to_values, reason, draft_number,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_detail.tenant_id,
            v_detail.id,
            v_detail.employee_id,
            v_detail.employee_name,
            v_detail.employee_number,
            v_detail.appointment_type,
            v_detail.effective_date,
            jsonb_build_object(
                'department_id', v_detail.from_department_id,
                'department_name', v_detail.from_department_name,
                'position_code', v_detail.from_position_code,
                'position_name', v_detail.from_position_name
            ),
            jsonb_build_object(
                'department_id', v_detail.to_department_id,
                'department_name', v_detail.to_department_name,
                'position_code', v_detail.to_position_code,
                'position_name', v_detail.to_position_name
            ),
            v_detail.reason,
            v_detail.draft_number,
            v_detail.executed_at,
            CURRENT_TIMESTAMP,
            'system',
            'system'
        );

        v_history_count := v_history_count + 1;
    END LOOP;

    RAISE NOTICE '발령 이력 % 건 생성 완료', v_history_count;
END $$;

-- ============================================================================
-- 검증
-- ============================================================================

DO $$
DECLARE
    v_draft_count INT;
    v_detail_count INT;
    v_schedule_count INT;
    v_history_count INT;
BEGIN
    SELECT COUNT(*) INTO v_draft_count FROM hr_appointment.appointment_draft;
    SELECT COUNT(*) INTO v_detail_count FROM hr_appointment.appointment_detail;
    SELECT COUNT(*) INTO v_schedule_count FROM hr_appointment.appointment_schedule;
    SELECT COUNT(*) INTO v_history_count FROM hr_appointment.appointment_history;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '발령 서비스 샘플 데이터 생성 완료';
    RAISE NOTICE '========================================';
    RAISE NOTICE '발령안: % 건', v_draft_count;
    RAISE NOTICE '발령상세: % 건', v_detail_count;
    RAISE NOTICE '예약발령: % 건', v_schedule_count;
    RAISE NOTICE '발령이력: % 건', v_history_count;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FILE: 20_certificate_generator.sql
-- ============================================================================

-- ============================================================================
-- 20_certificate_generator.sql
-- 증명서 서비스 샘플 데이터 생성
-- ============================================================================
-- 생성 규모:
--   - 증명서 템플릿: 테넌트당 8개 (총 64개)
--   - 증명서 유형: 테넌트당 10개 (총 80개)
--   - 증명서 신청: 테넌트당 ~200건 (총 ~1,600건)
--   - 발급된 증명서: ~1,200건
--   - 진위확인 로그: ~500건
-- ============================================================================

-- RLS 비활성화
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- 증명서 템플릿 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_template_id UUID;
    v_template_count INT := 0;
    v_templates TEXT[][] := ARRAY[
        ARRAY['재직증명서', 'EMPLOYMENT', '재직 사실을 증명하는 문서입니다.'],
        ARRAY['경력증명서', 'CAREER', '경력 사항을 증명하는 문서입니다.'],
        ARRAY['급여명세서', 'SALARY', '급여 내역을 증명하는 문서입니다.'],
        ARRAY['원천징수영수증', 'TAX', '원천징수 내역을 증명하는 문서입니다.'],
        ARRAY['퇴직증명서', 'RETIREMENT', '퇴직 사실을 증명하는 문서입니다.'],
        ARRAY['교육수료증', 'TRAINING', '교육 수료 사실을 증명하는 문서입니다.'],
        ARRAY['재직경력확인서', 'CAREER_CONFIRM', '재직 경력을 확인하는 문서입니다.'],
        ARRAY['휴직증명서', 'LEAVE_OF_ABSENCE', '휴직 사실을 증명하는 문서입니다.']
    ];
BEGIN
    RAISE NOTICE '증명서 템플릿 생성 중...';

    FOR v_tenant IN SELECT id, name FROM tenant_common.tenant LOOP
        FOR i IN 1..array_length(v_templates, 1) LOOP
            v_template_id := gen_random_uuid();

            INSERT INTO hr_certificate.certificate_template (
                id, tenant_id, name, description, content_html, header_html, footer_html,
                css_styles, page_size, orientation, margin_top, margin_bottom, margin_left, margin_right,
                variables, include_company_seal, include_signature, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_template_id,
                v_tenant.id,
                v_templates[i][1],
                v_templates[i][3],
                '<div class="certificate">
                    <h1>' || v_templates[i][1] || '</h1>
                    <div class="content">
                        <p>성명: {{employee_name}}</p>
                        <p>사번: {{employee_number}}</p>
                        <p>부서: {{department_name}}</p>
                        <p>직급: {{grade_name}}</p>
                        <p>입사일: {{hire_date}}</p>
                        {{#if include_salary}}<p>급여: {{salary}}</p>{{/if}}
                    </div>
                    <p class="purpose">위 사실을 증명합니다.</p>
                    <p class="date">{{issue_date}}</p>
                    <div class="company">
                        <p>{{company_name}}</p>
                        <p>대표이사 {{ceo_name}}</p>
                    </div>
                </div>',
                '<div class="header"><img src="{{company_logo}}" alt="회사 로고" /></div>',
                '<div class="footer"><p>문서번호: {{document_number}} | 발급일: {{issue_date}}</p></div>',
                '.certificate { font-family: "Malgun Gothic", sans-serif; padding: 40px; }
                h1 { text-align: center; font-size: 24px; margin-bottom: 30px; }
                .content { margin: 20px 0; line-height: 1.8; }
                .purpose { text-align: center; margin: 30px 0; }
                .date { text-align: center; }
                .company { text-align: center; margin-top: 50px; }',
                'A4',
                'PORTRAIT',
                20, 20, 20, 20,
                '{"employee_name": "", "employee_number": "", "department_name": "", "grade_name": "", "hire_date": "", "salary": "", "issue_date": "", "company_name": "", "ceo_name": "", "document_number": ""}',
                TRUE,
                TRUE,
                TRUE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            v_template_count := v_template_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '증명서 템플릿 % 건 생성 완료', v_template_count;
END $$;

-- ============================================================================
-- 증명서 유형 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_template RECORD;
    v_type_count INT := 0;
    v_cert_types TEXT[][] := ARRAY[
        ARRAY['EMPLOYMENT_KO', '재직증명서', 'Certificate of Employment', 'FALSE', '90', '0'],
        ARRAY['EMPLOYMENT_EN', '재직증명서(영문)', 'Certificate of Employment (EN)', 'FALSE', '90', '0'],
        ARRAY['CAREER_KO', '경력증명서', 'Career Certificate', 'FALSE', '90', '0'],
        ARRAY['SALARY_CERT', '급여증명서', 'Salary Certificate', 'TRUE', '30', '0'],
        ARRAY['TAX_WITHHOLD', '원천징수영수증', 'Tax Withholding Receipt', 'FALSE', '365', '0'],
        ARRAY['RETIREMENT_CERT', '퇴직증명서', 'Retirement Certificate', 'FALSE', '180', '0'],
        ARRAY['TRAINING_CERT', '교육수료증', 'Training Certificate', 'FALSE', '365', '0'],
        ARRAY['CAREER_CONFIRM', '재직경력확인서', 'Career Confirmation', 'TRUE', '30', '0'],
        ARRAY['LEAVE_CERT', '휴직증명서', 'Leave of Absence Certificate', 'FALSE', '90', '0'],
        ARRAY['INCOME_CERT', '소득금액증명서', 'Income Certificate', 'TRUE', '30', '1000']
    ];
BEGIN
    RAISE NOTICE '증명서 유형 생성 중...';

    FOR v_tenant IN SELECT id, name FROM tenant_common.tenant LOOP
        FOR i IN 1..array_length(v_cert_types, 1) LOOP
            -- 매칭되는 템플릿 찾기
            SELECT id INTO v_template
            FROM hr_certificate.certificate_template
            WHERE tenant_id = v_tenant.id
            ORDER BY RANDOM()
            LIMIT 1;

            INSERT INTO hr_certificate.certificate_type (
                tenant_id, code, name, name_en, description, template_id,
                requires_approval, auto_issue, valid_days, fee, max_copies_per_request,
                sort_order, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tenant.id,
                v_cert_types[i][1],
                v_cert_types[i][2],
                v_cert_types[i][3],
                v_cert_types[i][2] || ' 발급을 위한 증명서 유형입니다.',
                v_template.id,
                v_cert_types[i][4]::BOOLEAN,
                NOT v_cert_types[i][4]::BOOLEAN,
                v_cert_types[i][5]::INT,
                v_cert_types[i][6]::DECIMAL,
                5,
                i,
                TRUE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            v_type_count := v_type_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '증명서 유형 % 건 생성 완료', v_type_count;
END $$;

-- ============================================================================
-- 증명서 신청 및 발급 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_employee RECORD;
    v_cert_type RECORD;
    v_request_id UUID;
    v_issue_id UUID;
    v_request_number VARCHAR(50);
    v_issue_number VARCHAR(50);
    v_verification_code VARCHAR(20);
    v_request_count INT;
    v_status VARCHAR(20);
    v_statuses VARCHAR(20)[] := ARRAY['PENDING', 'APPROVED', 'ISSUED', 'REJECTED'];
    v_purposes VARCHAR(200)[] := ARRAY['금융기관 제출용', '관공서 제출용', '입찰서류 제출용', '비자 신청용', '학교 제출용', '병원 제출용', '기타'];
    v_targets VARCHAR(200)[] := ARRAY['국민은행', '하나은행', '신한은행', '주민센터', '법원', '출입국관리사무소', '대사관', '학교', '병원', '기타'];
    v_total_requests INT := 0;
    v_total_issues INT := 0;
BEGIN
    RAISE NOTICE '증명서 신청/발급 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        -- 테넌트 규모에 따른 신청 수 결정
        v_request_count := CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 300
            WHEN v_tenant.code IN ('HANSUNG_LIFE', 'HANSUNG_SDI') THEN 200
            ELSE 150
        END;

        FOR i IN 1..v_request_count LOOP
            -- 랜덤 직원 선택
            SELECT e.id, e.name, e.employee_number
            INTO v_employee
            FROM hr_core.employee e
            WHERE e.tenant_id = v_tenant.id AND e.status = 'ACTIVE'
            ORDER BY RANDOM()
            LIMIT 1;

            -- 랜덤 증명서 유형 선택
            SELECT * INTO v_cert_type
            FROM hr_certificate.certificate_type
            WHERE tenant_id = v_tenant.id
            ORDER BY RANDOM()
            LIMIT 1;

            IF v_employee.id IS NOT NULL AND v_cert_type.id IS NOT NULL THEN
                v_request_id := gen_random_uuid();
                v_request_number := 'CRT-' || v_tenant.code || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(i::TEXT, 5, '0');

                -- 상태 결정 (과거 신청은 대부분 발급 완료)
                v_status := CASE
                    WHEN RANDOM() < 0.7 THEN 'ISSUED'
                    WHEN RANDOM() < 0.85 THEN 'APPROVED'
                    WHEN RANDOM() < 0.95 THEN 'PENDING'
                    ELSE 'REJECTED'
                END;

                INSERT INTO hr_certificate.certificate_request (
                    id, tenant_id, certificate_type_id, employee_id, employee_name, employee_number,
                    request_number, purpose, submission_target, copies, language,
                    include_salary, status, issued_at,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    v_request_id,
                    v_tenant.id,
                    v_cert_type.id,
                    v_employee.id,
                    v_employee.name,
                    v_employee.employee_number,
                    v_request_number,
                    v_purposes[1 + FLOOR(RANDOM() * 7)::INT],
                    v_targets[1 + FLOOR(RANDOM() * 10)::INT],
                    1 + FLOOR(RANDOM() * 3)::INT,
                    CASE WHEN RANDOM() < 0.9 THEN 'KO' ELSE 'EN' END,
                    RANDOM() < 0.3,
                    v_status,
                    CASE WHEN v_status = 'ISSUED' THEN CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL END,
                    CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL,
                    CURRENT_TIMESTAMP,
                    'system',
                    'system'
                );

                v_total_requests := v_total_requests + 1;

                -- 발급된 경우 증명서 발급 레코드 생성
                IF v_status = 'ISSUED' THEN
                    v_issue_id := gen_random_uuid();
                    v_issue_number := 'ISS-' || v_tenant.code || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(v_total_issues::TEXT, 6, '0');
                    v_verification_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));

                    INSERT INTO hr_certificate.certificate_issue (
                        id, tenant_id, request_id, issue_number, verification_code,
                        content_snapshot, issued_by, issued_at,
                        download_count, verified_count, expires_at, is_revoked,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        v_issue_id,
                        v_tenant.id,
                        v_request_id,
                        v_issue_number,
                        v_verification_code,
                        jsonb_build_object(
                            'employee_name', v_employee.name,
                            'employee_number', v_employee.employee_number,
                            'certificate_type', v_cert_type.name,
                            'issue_date', CURRENT_DATE
                        ),
                        v_employee.id,
                        CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL,
                        FLOOR(RANDOM() * 5)::INT,
                        FLOOR(RANDOM() * 3)::INT,
                        CURRENT_DATE + v_cert_type.valid_days,
                        FALSE,
                        CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL,
                        CURRENT_TIMESTAMP,
                        'system',
                        'system'
                    );

                    v_total_issues := v_total_issues + 1;
                END IF;
            END IF;
        END LOOP;

        RAISE NOTICE '  테넌트 % 완료', v_tenant.name;
    END LOOP;

    RAISE NOTICE '증명서 신청 % 건, 발급 % 건 생성 완료', v_total_requests, v_total_issues;
END $$;

-- ============================================================================
-- 진위확인 로그 생성
-- ============================================================================

DO $$
DECLARE
    v_issue RECORD;
    v_log_count INT := 0;
    v_verifier_names VARCHAR(100)[] := ARRAY['김담당', '이과장', '박대리', '최주임', '정사원', '강부장', '조차장'];
    v_organizations VARCHAR(200)[] := ARRAY['국민은행 강남지점', '하나은행 본점', '신한은행 영등포지점', '서울시청', '강남구청', '법원', '출입국관리사무소', '주식회사 ABC', '대학교 행정실'];
BEGIN
    RAISE NOTICE '진위확인 로그 생성 중...';

    -- 발급된 증명서 중 일부에 대해 진위확인 로그 생성
    FOR v_issue IN
        SELECT id, verification_code, verified_count
        FROM hr_certificate.certificate_issue
        WHERE verified_count > 0
        LIMIT 500
    LOOP
        FOR i IN 1..v_issue.verified_count LOOP
            INSERT INTO hr_certificate.verification_log (
                issue_id, verification_code, verified_at,
                verifier_ip, verifier_user_agent, verifier_name, verifier_organization,
                is_valid, failure_reason,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_issue.id,
                v_issue.verification_code,
                CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 60) || ' days')::INTERVAL,
                '192.168.' || FLOOR(RANDOM() * 255)::INT || '.' || FLOOR(RANDOM() * 255)::INT,
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                v_verifier_names[1 + FLOOR(RANDOM() * 7)::INT],
                v_organizations[1 + FLOOR(RANDOM() * 9)::INT],
                TRUE,
                NULL,
                CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 60) || ' days')::INTERVAL,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            v_log_count := v_log_count + 1;
        END LOOP;
    END LOOP;

    -- 실패한 진위확인도 일부 생성
    FOR i IN 1..50 LOOP
        INSERT INTO hr_certificate.verification_log (
            issue_id, verification_code, verified_at,
            verifier_ip, verifier_user_agent, verifier_name, verifier_organization,
            is_valid, failure_reason,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            NULL,
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12)),
            CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 60) || ' days')::INTERVAL,
            '192.168.' || FLOOR(RANDOM() * 255)::INT || '.' || FLOOR(RANDOM() * 255)::INT,
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            v_verifier_names[1 + FLOOR(RANDOM() * 7)::INT],
            v_organizations[1 + FLOOR(RANDOM() * 9)::INT],
            FALSE,
            CASE FLOOR(RANDOM() * 3)::INT
                WHEN 0 THEN 'INVALID_CODE'
                WHEN 1 THEN 'EXPIRED'
                ELSE 'REVOKED'
            END,
            CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 60) || ' days')::INTERVAL,
            CURRENT_TIMESTAMP,
            'system',
            'system'
        );

        v_log_count := v_log_count + 1;
    END LOOP;

    RAISE NOTICE '진위확인 로그 % 건 생성 완료', v_log_count;
END $$;

-- ============================================================================
-- 검증
-- ============================================================================

DO $$
DECLARE
    v_template_count INT;
    v_type_count INT;
    v_request_count INT;
    v_issue_count INT;
    v_log_count INT;
BEGIN
    SELECT COUNT(*) INTO v_template_count FROM hr_certificate.certificate_template;
    SELECT COUNT(*) INTO v_type_count FROM hr_certificate.certificate_type;
    SELECT COUNT(*) INTO v_request_count FROM hr_certificate.certificate_request;
    SELECT COUNT(*) INTO v_issue_count FROM hr_certificate.certificate_issue;
    SELECT COUNT(*) INTO v_log_count FROM hr_certificate.verification_log;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '증명서 서비스 샘플 데이터 생성 완료';
    RAISE NOTICE '========================================';
    RAISE NOTICE '증명서 템플릿: % 건', v_template_count;
    RAISE NOTICE '증명서 유형: % 건', v_type_count;
    RAISE NOTICE '증명서 신청: % 건', v_request_count;
    RAISE NOTICE '발급된 증명서: % 건', v_issue_count;
    RAISE NOTICE '진위확인 로그: % 건', v_log_count;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FILE: 21_auth_login_history_generator.sql
-- ============================================================================

-- ============================================================================
-- 21_auth_login_history_generator.sql
-- Auth 서비스 로그인 이력 샘플 데이터 생성
-- ============================================================================
-- 생성 규모:
--   - 로그인 이력: ~10,000건 (최근 30일)
--   - 계정 잠금: 일부 실패 계정 (테스트용)
--   - 세션/토큰: 런타임 데이터로 생성하지 않음
-- ============================================================================

-- RLS 비활성화
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- 로그인 이력 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_employee RECORD;
    v_history_count INT := 0;
    v_login_types VARCHAR(20)[] := ARRAY['PASSWORD', 'SSO', 'MFA'];
    v_statuses VARCHAR(20)[] := ARRAY['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'FAILED']; -- 80% 성공
    v_failure_reasons VARCHAR(200)[] := ARRAY['잘못된 비밀번호', '계정 잠금', '유효하지 않은 MFA 코드', '세션 만료', '접근 권한 없음'];
    v_login_type VARCHAR(20);
    v_status VARCHAR(20);
    v_login_time TIMESTAMP WITH TIME ZONE;
    v_ip_prefix VARCHAR(20);
    v_employees_per_tenant INT;
BEGIN
    RAISE NOTICE '로그인 이력 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        -- 테넌트별 IP 대역 설정
        v_ip_prefix := CASE v_tenant.code
            WHEN 'HANSUNG_HD' THEN '10.1.'
            WHEN 'HANSUNG_ELEC' THEN '10.2.'
            WHEN 'HANSUNG_SDI' THEN '10.3.'
            WHEN 'HANSUNG_ENG' THEN '10.4.'
            WHEN 'HANSUNG_BIO' THEN '10.5.'
            WHEN 'HANSUNG_CHEM' THEN '10.6.'
            WHEN 'HANSUNG_IT' THEN '10.7.'
            WHEN 'HANSUNG_LIFE' THEN '10.8.'
            ELSE '192.168.'
        END;

        -- 테넌트 규모에 따른 로그인 이력 수
        v_employees_per_tenant := CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 3000
            WHEN v_tenant.code IN ('HANSUNG_LIFE', 'HANSUNG_SDI') THEN 1500
            ELSE 1000
        END;

        -- 랜덤 직원들의 로그인 이력 생성
        FOR v_employee IN
            SELECT e.id, e.employee_number, e.email
            FROM hr_core.employee e
            WHERE e.tenant_id = v_tenant.id AND e.status = 'ACTIVE'
            ORDER BY RANDOM()
            LIMIT v_employees_per_tenant / 10  -- 직원의 10%만 선택
        LOOP
            -- 각 직원당 3~15회 로그인
            FOR i IN 1..(3 + FLOOR(RANDOM() * 13)::INT) LOOP
                v_login_type := v_login_types[1 + FLOOR(RANDOM() * 3)::INT];
                v_status := v_statuses[1 + FLOOR(RANDOM() * 5)::INT];
                v_login_time := CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
                              - (FLOOR(RANDOM() * 24) || ' hours')::INTERVAL
                              - (FLOOR(RANDOM() * 60) || ' minutes')::INTERVAL;

                INSERT INTO tenant_common.login_history (
                    user_id, tenant_id, login_type, status,
                    ip_address, user_agent, location, failure_reason, created_at
                ) VALUES (
                    v_employee.employee_number,
                    v_tenant.id,
                    v_login_type,
                    v_status,
                    v_ip_prefix || FLOOR(RANDOM() * 255)::INT || '.' || FLOOR(RANDOM() * 255)::INT,
                    CASE FLOOR(RANDOM() * 4)::INT
                        WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0'
                        WHEN 1 THEN 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Safari/605.1.15'
                        WHEN 2 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Mobile/15E148'
                        ELSE 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0'
                    END,
                    CASE FLOOR(RANDOM() * 5)::INT
                        WHEN 0 THEN '서울 강남구'
                        WHEN 1 THEN '서울 서초구'
                        WHEN 2 THEN '경기 수원시'
                        WHEN 3 THEN '경기 성남시'
                        ELSE '서울 영등포구'
                    END,
                    CASE WHEN v_status = 'FAILED' THEN v_failure_reasons[1 + FLOOR(RANDOM() * 5)::INT] ELSE NULL END,
                    v_login_time
                );

                v_history_count := v_history_count + 1;
            END LOOP;
        END LOOP;

        RAISE NOTICE '  테넌트 % 완료', v_tenant.name;
    END LOOP;

    RAISE NOTICE '로그인 이력 % 건 생성 완료', v_history_count;
END $$;

-- ============================================================================
-- 테스트 계정 로그인 이력 생성 (최근 활동 기록)
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_test_accounts TEXT[][] := ARRAY[
        ARRAY['superadmin', 'SYSTEM'],
        ARRAY['ceo.elec', 'HANSUNG_ELEC'],
        ARRAY['hr.admin.elec', 'HANSUNG_ELEC'],
        ARRAY['hr.manager.elec', 'HANSUNG_ELEC'],
        ARRAY['dev.manager.elec', 'HANSUNG_ELEC'],
        ARRAY['dev.staff.elec', 'HANSUNG_ELEC']
    ];
BEGIN
    RAISE NOTICE '테스트 계정 로그인 이력 생성 중...';

    FOR i IN 1..array_length(v_test_accounts, 1) LOOP
        -- 테넌트 ID 조회
        IF v_test_accounts[i][2] = 'SYSTEM' THEN
            v_tenant_id := NULL;
        ELSE
            SELECT id INTO v_tenant_id FROM tenant_common.tenant WHERE code = v_test_accounts[i][2];
        END IF;

        -- 최근 7일간 매일 로그인 기록
        FOR j IN 0..6 LOOP
            INSERT INTO tenant_common.login_history (
                user_id, tenant_id, login_type, status,
                ip_address, user_agent, location, created_at
            ) VALUES (
                v_test_accounts[i][1],
                v_tenant_id,
                CASE WHEN RANDOM() < 0.7 THEN 'PASSWORD' ELSE 'SSO' END,
                'SUCCESS',
                '10.0.0.' || (100 + i),
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
                '서울 강남구',
                CURRENT_TIMESTAMP - (j || ' days')::INTERVAL - (8 + FLOOR(RANDOM() * 2) || ' hours')::INTERVAL
            );

            -- 퇴근 전 재로그인
            IF RANDOM() < 0.5 THEN
                INSERT INTO tenant_common.login_history (
                    user_id, tenant_id, login_type, status,
                    ip_address, user_agent, location, created_at
                ) VALUES (
                    v_test_accounts[i][1],
                    v_tenant_id,
                    'PASSWORD',
                    'SUCCESS',
                    '10.0.0.' || (100 + i),
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0',
                    '서울 강남구',
                    CURRENT_TIMESTAMP - (j || ' days')::INTERVAL - (14 + FLOOR(RANDOM() * 4) || ' hours')::INTERVAL
                );
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '테스트 계정 로그인 이력 생성 완료';
END $$;

-- ============================================================================
-- 검증
-- ============================================================================

DO $$
DECLARE
    v_session_count INT;
    v_token_count INT;
    v_history_count INT;
    v_lock_count INT;
BEGIN
    SELECT COUNT(*) INTO v_session_count FROM tenant_common.user_sessions;
    SELECT COUNT(*) INTO v_token_count FROM tenant_common.password_reset_tokens;
    SELECT COUNT(*) INTO v_history_count FROM tenant_common.login_history;
    SELECT COUNT(*) INTO v_lock_count FROM tenant_common.account_locks;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Auth 서비스 샘플 데이터 생성 완료';
    RAISE NOTICE '========================================';
    RAISE NOTICE '사용자 세션: % 건 (런타임 생성)', v_session_count;
    RAISE NOTICE '비밀번호 재설정 토큰: % 건 (런타임 생성)', v_token_count;
    RAISE NOTICE '로그인 이력: % 건', v_history_count;
    RAISE NOTICE '계정 잠금: % 건', v_lock_count;
    RAISE NOTICE '========================================';
END $$;

ROLLBACK;