-- PRD 기반 샘플 데이터 v2.0 - 통합 파일
-- 생성일: 2026-02-11 11:33
-- 실행: psql -h localhost -p 15432 -U hr_saas -d hr_saas -f 99_combined_all.sql


-- ================================================
-- [1/13] 00_reset_sample_data_safe.sql
-- ================================================
-- ============================================================================
-- 00_reset_sample_data_safe.sql
-- 안전한 샘플 데이터 초기화 (데드락 방지)
-- ============================================================================
-- 개선 사항:
-- 1. CASCADE 대신 의존성 역순으로 개별 DELETE
-- 2. TRUNCATE 대신 DELETE 사용 (더 느리지만 안전)
-- 3. 락 타임아웃 설정
-- 4. 실제 스키마 테이블에 맞춤 (blacklist 테이블 제외 등)
-- ============================================================================

-- 락 대기 타임아웃 설정 (30초)
SET lock_timeout = '30s';
SET statement_timeout = '5min';

-- RLS 비활성화 (슈퍼유저 권한으로 데이터 삭제)
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- Method: DELETE FROM (안전하고 데드락 방지)
-- ============================================================================
DO $$
DECLARE
    v_count INT;
BEGIN
    RAISE NOTICE '샘플 데이터 삭제 시작...';
    -- 의존성 역순으로 DELETE (CASCADE 없이)

    -- 1. Notification & File (최상위 의존)
    DELETE FROM hr_notification.notification;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  Deleted % rows from notification', v_count;

    DELETE FROM hr_file.file_metadata;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  Deleted % rows from file_metadata', v_count;

    -- 2. Certificate & Appointment
    DELETE FROM hr_certificate.verification_log;
    DELETE FROM hr_certificate.certificate_issue;
    DELETE FROM hr_certificate.certificate_request;
    DELETE FROM hr_certificate.certificate_type;
    DELETE FROM hr_certificate.certificate_template;
    RAISE NOTICE '  Deleted certificate data';

    DELETE FROM hr_appointment.appointment_history;
    DELETE FROM hr_appointment.appointment_schedule;
    DELETE FROM hr_appointment.appointment_detail;
    DELETE FROM hr_appointment.appointment_draft;
    RAISE NOTICE '  Deleted appointment data';

    -- 3. Recruitment (blacklist 테이블 없음)
    DELETE FROM hr_recruitment.offer;
    DELETE FROM hr_recruitment.interview_score;
    DELETE FROM hr_recruitment.interview;
    DELETE FROM hr_recruitment.application;
    DELETE FROM hr_recruitment.applicant;
    DELETE FROM hr_recruitment.job_posting;
    RAISE NOTICE '  Deleted recruitment data';

    -- 4. Approval
    DELETE FROM hr_approval.delegation_rule;
    DELETE FROM hr_approval.arbitrary_approval_rule;
    DELETE FROM hr_approval.conditional_route;
    DELETE FROM hr_approval.approval_history;
    DELETE FROM hr_approval.approval_line;
    DELETE FROM hr_approval.approval_document;
    DELETE FROM hr_approval.approval_template_line;
    DELETE FROM hr_approval.approval_template;
    RAISE NOTICE '  Deleted approval data';

    -- 5. Attendance
    DELETE FROM hr_attendance.overtime_request;
    DELETE FROM hr_attendance.leave_request;
    DELETE FROM hr_attendance.attendance_modification_log;
    DELETE FROM hr_attendance.attendance_record;
    DELETE FROM hr_attendance.leave_balance;
    DELETE FROM hr_attendance.leave_accrual_rule;
    DELETE FROM hr_attendance.leave_type_config;
    DELETE FROM hr_attendance.holiday;
    RAISE NOTICE '  Deleted attendance data';

    -- 6. Organization extras
    DELETE FROM hr_core.employee_card;
    DELETE FROM hr_core.card_issue_request;
    DELETE FROM hr_core.transfer_request;
    DELETE FROM hr_core.organization_history;
    DELETE FROM hr_core.condolence_request;
    DELETE FROM hr_core.condolence_policy;
    DELETE FROM hr_core.headcount_history;
    DELETE FROM hr_core.headcount_request;
    DELETE FROM hr_core.headcount_plan;
    DELETE FROM hr_core.committee_member;
    DELETE FROM hr_core.committee;
    DELETE FROM hr_core.announcement_read;
    DELETE FROM hr_core.announcement_target;
    DELETE FROM hr_core.announcement_attachment;
    DELETE FROM hr_core.announcement;
    RAISE NOTICE '  Deleted organization extras';

    -- 7. Auth
    DELETE FROM tenant_common.audit_log;
    DELETE FROM tenant_common.password_history;
    DELETE FROM tenant_common.login_history;
    DELETE FROM tenant_common.user_sessions;
    DELETE FROM tenant_common.password_reset_tokens;
    DELETE FROM tenant_common.mfa_recovery_codes;
    DELETE FROM tenant_common.user_mfa;
    DELETE FROM tenant_common.users;
    RAISE NOTICE '  Deleted auth data';

    -- 8. Employee (FK 많음)
    DELETE FROM hr_core.privacy_access_log;
    DELETE FROM hr_core.employee_change_request;
    DELETE FROM hr_core.employee_history;
    DELETE FROM hr_core.employee_affiliation;
    DELETE FROM hr_core.employee_certificate;
    DELETE FROM hr_core.employee_career;
    DELETE FROM hr_core.employee_education;
    DELETE FROM hr_core.employee_family;
    DELETE FROM hr_core.employee_number_rule;
    DELETE FROM hr_core.employee;
    RAISE NOTICE '  Deleted employee data';

    -- 9. Organization
    DELETE FROM hr_core.department;
    DELETE FROM hr_core.position;
    DELETE FROM hr_core.grade;
    RAISE NOTICE '  Deleted organization data';

    -- 10. MDM
    DELETE FROM tenant_common.tenant_menu_config;
    DELETE FROM tenant_common.menu_permission;
    DELETE FROM tenant_common.menu_item;
    DELETE FROM tenant_common.code_usage_mapping;
    DELETE FROM tenant_common.code_tenant_mapping;
    DELETE FROM tenant_common.code_history;
    DELETE FROM tenant_common.common_code;
    DELETE FROM tenant_common.code_group;
    RAISE NOTICE '  Deleted MDM data';

    -- 11. Tenant (최하위)
    DELETE FROM tenant_common.policy_change_history;
    DELETE FROM tenant_common.tenant_feature;
    DELETE FROM tenant_common.tenant_policy;
    DELETE FROM tenant_common.tenant WHERE id <> '00000000-0000-0000-0000-000000000000';
    RAISE NOTICE '  Deleted tenant data';

    RAISE NOTICE '';
    RAISE NOTICE '샘플 데이터 삭제 완료!';
END $$;

RESET lock_timeout;
RESET statement_timeout;


-- ================================================
-- [2/13] 01_tenants.sql
-- ================================================
-- ============================================================================
-- 01_tenants.sql
-- 한성그룹 8개 계열사 테넌트 + 정책(5종) + 기능(20종) 생성
-- ============================================================================
-- UUID Convention: a0000001-0000-0000-0000-00000000000{N} (N=1..8)
-- 총 8 tenants, 40 policies (5 per tenant), 160 features (20 per tenant)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 한성그룹 계열사 테넌트 (8개)
-- ============================================================================

-- 1. 한성홀딩스 (지주회사)
INSERT INTO tenant_common.tenant (
    id, code, name, name_en, description, logo_url,
    business_number, representative_name, address, phone, email,
    status, plan_type, contract_start_date, contract_end_date,
    max_employees, max_departments,
    parent_id, level, admin_email, admin_name,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000001',
    'HANSUNG_HD',
    '한성홀딩스',
    'Hansung Holdings',
    '한성그룹 지주회사로서 계열사 경영 총괄 및 전략 수립',
    NULL,
    '101-86-00001',
    '김한성',
    '서울특별시 강남구 테헤란로 152 한성타워',
    '02-2000-0001',
    'contact@hansung-hd.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    100,
    20,
    NULL,
    0,
    'contact@hansung-hd.co.kr',
    '김한성',
    NOW(), NOW(),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 2. 한성전자 (전자/반도체)
INSERT INTO tenant_common.tenant (
    id, code, name, name_en, description, logo_url,
    business_number, representative_name, address, phone, email,
    status, plan_type, contract_start_date, contract_end_date,
    max_employees, max_departments,
    parent_id, level, admin_email, admin_name,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000002',
    'HANSUNG_ELEC',
    '한성전자',
    'Hansung Electronics',
    '전자제품 및 반도체 제조 전문 계열사',
    NULL,
    '124-81-00002',
    '이전자',
    '경기도 수원시 영통구 삼성로 129',
    '031-200-0001',
    'contact@hansung-elec.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    500,
    50,
    'a0000001-0000-0000-0000-000000000001',
    1,
    'contact@hansung-elec.co.kr',
    '이전자',
    NOW(), NOW(),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 3. 한성SDI (배터리/에너지)
INSERT INTO tenant_common.tenant (
    id, code, name, name_en, description, logo_url,
    business_number, representative_name, address, phone, email,
    status, plan_type, contract_start_date, contract_end_date,
    max_employees, max_departments,
    parent_id, level, admin_email, admin_name,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000003',
    'HANSUNG_SDI',
    '한성SDI',
    'Hansung SDI',
    '2차 전지 및 에너지 솔루션 전문 계열사',
    NULL,
    '284-81-00003',
    '박배터',
    '경기도 용인시 기흥구 공세로 150-20',
    '031-210-0001',
    'contact@hansung-sdi.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    200,
    30,
    'a0000001-0000-0000-0000-000000000001',
    1,
    'contact@hansung-sdi.co.kr',
    '박배터',
    NOW(), NOW(),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 4. 한성엔지니어링 (건설/플랜트)
INSERT INTO tenant_common.tenant (
    id, code, name, name_en, description, logo_url,
    business_number, representative_name, address, phone, email,
    status, plan_type, contract_start_date, contract_end_date,
    max_employees, max_departments,
    parent_id, level, admin_email, admin_name,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000004',
    'HANSUNG_ENG',
    '한성엔지니어링',
    'Hansung Engineering',
    '건설 및 플랜트 엔지니어링 전문 계열사',
    NULL,
    '104-81-00004',
    '정건설',
    '서울특별시 서초구 서초대로 74길 14',
    '02-2100-0001',
    'contact@hansung-eng.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    150,
    25,
    'a0000001-0000-0000-0000-000000000001',
    1,
    'contact@hansung-eng.co.kr',
    '정건설',
    NOW(), NOW(),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 5. 한성바이오 (바이오/제약)
INSERT INTO tenant_common.tenant (
    id, code, name, name_en, description, logo_url,
    business_number, representative_name, address, phone, email,
    status, plan_type, contract_start_date, contract_end_date,
    max_employees, max_departments,
    parent_id, level, admin_email, admin_name,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000005',
    'HANSUNG_BIO',
    '한성바이오',
    'Hansung Bio',
    '바이오 의약품 연구개발 및 제조 전문 계열사',
    NULL,
    '220-87-00005',
    '최바이오',
    '인천광역시 연수구 송도과학로 32',
    '032-850-0001',
    'contact@hansung-bio.co.kr',
    'SUSPENDED',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    100,
    20,
    'a0000001-0000-0000-0000-000000000001',
    1,
    'contact@hansung-bio.co.kr',
    '최바이오',
    NOW(), NOW(),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 6. 한성화학 (화학/소재)
INSERT INTO tenant_common.tenant (
    id, code, name, name_en, description, logo_url,
    business_number, representative_name, address, phone, email,
    status, plan_type, contract_start_date, contract_end_date,
    max_employees, max_departments,
    parent_id, level, admin_email, admin_name,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000006',
    'HANSUNG_CHEM',
    '한성화학',
    'Hansung Chemical',
    '정밀화학 및 첨단소재 제조 전문 계열사',
    NULL,
    '301-81-00006',
    '강화학',
    '울산광역시 남구 산업로 1015',
    '052-280-0001',
    'contact@hansung-chem.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    150,
    25,
    'a0000001-0000-0000-0000-000000000001',
    1,
    'contact@hansung-chem.co.kr',
    '강화학',
    NOW(), NOW(),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 7. 한성IT서비스 (IT/SI)
INSERT INTO tenant_common.tenant (
    id, code, name, name_en, description, logo_url,
    business_number, representative_name, address, phone, email,
    status, plan_type, contract_start_date, contract_end_date,
    max_employees, max_departments,
    parent_id, level, admin_email, admin_name,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000007',
    'HANSUNG_IT',
    '한성IT서비스',
    'Hansung IT Services',
    '그룹 IT 인프라 운영 및 시스템 통합 전문 계열사',
    NULL,
    '214-87-00007',
    '윤아이티',
    '서울특별시 송파구 올림픽로 300',
    '02-6000-0001',
    'contact@hansung-it.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    100,
    20,
    'a0000001-0000-0000-0000-000000000001',
    1,
    'contact@hansung-it.co.kr',
    '윤아이티',
    NOW(), NOW(),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 8. 한성생명 (보험/금융)
INSERT INTO tenant_common.tenant (
    id, code, name, name_en, description, logo_url,
    business_number, representative_name, address, phone, email,
    status, plan_type, contract_start_date, contract_end_date,
    max_employees, max_departments,
    parent_id, level, admin_email, admin_name,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000008',
    'HANSUNG_LIFE',
    '한성생명',
    'Hansung Life Insurance',
    '생명보험 및 금융서비스 전문 계열사',
    NULL,
    '202-81-00008',
    '송금융',
    '서울특별시 중구 세종대로 55',
    '02-3700-0001',
    'contact@hansung-life.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    200,
    30,
    'a0000001-0000-0000-0000-000000000001',
    1,
    'contact@hansung-life.co.kr',
    '송금융',
    NOW(), NOW(),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. 테넌트 정책 (5종 x 8개 = 40개)
-- ============================================================================

-- 2.1 근무 정책 (WORK_SCHEDULE)
DO $$
DECLARE
    t_record RECORD;
BEGIN
    FOR t_record IN
        SELECT id FROM tenant_common.tenant
        WHERE code IN ('HANSUNG_HD','HANSUNG_ELEC','HANSUNG_SDI','HANSUNG_ENG',
                       'HANSUNG_BIO','HANSUNG_CHEM','HANSUNG_IT','HANSUNG_LIFE')
    LOOP
        INSERT INTO tenant_common.tenant_policy (
            tenant_id, policy_type, policy_data, is_active,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            t_record.id,
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
            )::text,
            true,
            NOW(), NOW(),
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000000'
        ) ON CONFLICT (tenant_id, policy_type) DO NOTHING;
    END LOOP;
END $$;

-- 2.2 휴가 정책 (LEAVE_POLICY)
DO $$
DECLARE
    t_record RECORD;
BEGIN
    FOR t_record IN
        SELECT id FROM tenant_common.tenant
        WHERE code IN ('HANSUNG_HD','HANSUNG_ELEC','HANSUNG_SDI','HANSUNG_ENG',
                       'HANSUNG_BIO','HANSUNG_CHEM','HANSUNG_IT','HANSUNG_LIFE')
    LOOP
        INSERT INTO tenant_common.tenant_policy (
            tenant_id, policy_type, policy_data, is_active,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            t_record.id,
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
            )::text,
            true,
            NOW(), NOW(),
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000000'
        ) ON CONFLICT (tenant_id, policy_type) DO NOTHING;
    END LOOP;
END $$;

-- 2.3 결재 정책 (APPROVAL_POLICY)
DO $$
DECLARE
    t_record RECORD;
BEGIN
    FOR t_record IN
        SELECT id FROM tenant_common.tenant
        WHERE code IN ('HANSUNG_HD','HANSUNG_ELEC','HANSUNG_SDI','HANSUNG_ENG',
                       'HANSUNG_BIO','HANSUNG_CHEM','HANSUNG_IT','HANSUNG_LIFE')
    LOOP
        INSERT INTO tenant_common.tenant_policy (
            tenant_id, policy_type, policy_data, is_active,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            t_record.id,
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
            )::text,
            true,
            NOW(), NOW(),
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000000'
        ) ON CONFLICT (tenant_id, policy_type) DO NOTHING;
    END LOOP;
END $$;

-- 2.4 보안 정책 (SECURITY_POLICY)
DO $$
DECLARE
    t_record RECORD;
BEGIN
    FOR t_record IN
        SELECT id FROM tenant_common.tenant
        WHERE code IN ('HANSUNG_HD','HANSUNG_ELEC','HANSUNG_SDI','HANSUNG_ENG',
                       'HANSUNG_BIO','HANSUNG_CHEM','HANSUNG_IT','HANSUNG_LIFE')
    LOOP
        INSERT INTO tenant_common.tenant_policy (
            tenant_id, policy_type, policy_data, is_active,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            t_record.id,
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
            )::text,
            true,
            NOW(), NOW(),
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000000'
        ) ON CONFLICT (tenant_id, policy_type) DO NOTHING;
    END LOOP;
END $$;

-- 2.5 알림 정책 (NOTIFICATION_POLICY)
DO $$
DECLARE
    t_record RECORD;
BEGIN
    FOR t_record IN
        SELECT id FROM tenant_common.tenant
        WHERE code IN ('HANSUNG_HD','HANSUNG_ELEC','HANSUNG_SDI','HANSUNG_ENG',
                       'HANSUNG_BIO','HANSUNG_CHEM','HANSUNG_IT','HANSUNG_LIFE')
    LOOP
        INSERT INTO tenant_common.tenant_policy (
            tenant_id, policy_type, policy_data, is_active,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            t_record.id,
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
            )::text,
            true,
            NOW(), NOW(),
            '00000000-0000-0000-0000-000000000000',
            '00000000-0000-0000-0000-000000000000'
        ) ON CONFLICT (tenant_id, policy_type) DO NOTHING;
    END LOOP;
END $$;

-- ============================================================================
-- 3. 테넌트 기능 (20종 x 8개 = 160개)
-- ============================================================================

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
    is_hd BOOLEAN;
    enabled BOOLEAN;
BEGIN
    FOR t_record IN
        SELECT id, code FROM tenant_common.tenant
        WHERE code IN ('HANSUNG_HD','HANSUNG_ELEC','HANSUNG_SDI','HANSUNG_ENG',
                       'HANSUNG_BIO','HANSUNG_CHEM','HANSUNG_IT','HANSUNG_LIFE')
    LOOP
        is_hd := (t_record.code = 'HANSUNG_HD');
        FOREACH feature IN ARRAY features LOOP
            -- HD tenant: MULTI_LANGUAGE and API_ACCESS disabled
            IF is_hd AND feature IN ('MULTI_LANGUAGE', 'API_ACCESS') THEN
                enabled := false;
            ELSE
                enabled := true;
            END IF;

            INSERT INTO tenant_common.tenant_feature (
                tenant_id, feature_code, is_enabled, config,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                t_record.id,
                feature,
                enabled,
                '{}',
                NOW(), NOW(),
                '00000000-0000-0000-0000-000000000000',
                '00000000-0000-0000-0000-000000000000'
            ) ON CONFLICT (tenant_id, feature_code) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- 4. 검증
-- ============================================================================
DO $$
DECLARE
    tenant_count INT;
    policy_count INT;
    feature_count INT;
    feature_disabled_count INT;
BEGIN
    SELECT COUNT(*) INTO tenant_count
    FROM tenant_common.tenant
    WHERE code LIKE 'HANSUNG_%';

    SELECT COUNT(*) INTO policy_count
    FROM tenant_common.tenant_policy tp
    JOIN tenant_common.tenant t ON t.id = tp.tenant_id
    WHERE t.code LIKE 'HANSUNG_%';

    SELECT COUNT(*) INTO feature_count
    FROM tenant_common.tenant_feature tf
    JOIN tenant_common.tenant t ON t.id = tf.tenant_id
    WHERE t.code LIKE 'HANSUNG_%';

    SELECT COUNT(*) INTO feature_disabled_count
    FROM tenant_common.tenant_feature tf
    JOIN tenant_common.tenant t ON t.id = tf.tenant_id
    WHERE t.code LIKE 'HANSUNG_%' AND tf.is_enabled = false;

    RAISE NOTICE '========================================';
    RAISE NOTICE '01_tenants.sql 실행 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '테넌트 생성: % 개 (기대: 8)', tenant_count;
    RAISE NOTICE '정책 생성:   % 개 (기대: 40)', policy_count;
    RAISE NOTICE '기능 설정:   % 개 (기대: 160)', feature_count;
    RAISE NOTICE '비활성 기능: % 개 (기대: 2 - HD의 MULTI_LANGUAGE, API_ACCESS)', feature_disabled_count;
    RAISE NOTICE '========================================';
END $$;


-- ================================================
-- [3/13] 02_mdm_codes.sql
-- ================================================
-- ============================================================================
-- 02_mdm_codes.sql
-- MDM 공통코드 그룹 및 공통코드 통합 생성 (시스템 코드)
-- 코드그룹 20개 + 공통코드 ~128개 + 테넌트 매핑 3건
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: 시스템 공통코드 그룹 (is_system = true, tenant_id = NULL)
-- ============================================================================

-- 1. 고용유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000001', NULL,
    'EMPLOYMENT_TYPE', '고용유형', 'Employment Type',
    '정규직, 계약직 등 고용 형태 분류',
    true, false, 1, 'ACTIVE', true, 1,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 2. 직원상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000002', NULL,
    'EMPLOYEE_STATUS', '직원상태', 'Employee Status',
    '재직, 휴직, 퇴직 등 직원 상태 분류',
    true, false, 1, 'ACTIVE', true, 2,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 3. 부서상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000003', NULL,
    'DEPARTMENT_STATUS', '부서상태', 'Department Status',
    '활성, 비활성 등 부서 상태 분류',
    true, false, 1, 'ACTIVE', true, 3,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 4. 휴가유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000004', NULL,
    'LEAVE_TYPE', '휴가유형', 'Leave Type',
    '연차, 병가, 경조사 등 휴가 유형 분류',
    true, false, 1, 'ACTIVE', true, 4,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 5. 근태상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000005', NULL,
    'ATTENDANCE_STATUS', '근태상태', 'Attendance Status',
    '정상, 지각, 결근 등 근태 상태 분류',
    true, false, 1, 'ACTIVE', true, 5,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 6. 결재문서유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000006', NULL,
    'APPROVAL_DOC_TYPE', '결재문서유형', 'Approval Document Type',
    '휴가신청, 경비청구 등 결재 문서 유형 분류',
    true, false, 1, 'ACTIVE', true, 6,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 7. 결재상태
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000007', NULL,
    'APPROVAL_STATUS', '결재상태', 'Approval Status',
    '대기, 진행중, 승인, 반려 등 결재 상태 분류',
    true, false, 1, 'ACTIVE', true, 7,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 8. 가족관계
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000008', NULL,
    'RELATION_TYPE', '가족관계', 'Family Relation Type',
    '배우자, 자녀, 부모 등 가족 관계 분류',
    true, false, 1, 'ACTIVE', true, 8,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 9. 학위유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000009', NULL,
    'DEGREE_TYPE', '학위유형', 'Degree Type',
    '고졸, 학사, 석사, 박사 등 학위 분류',
    true, false, 1, 'ACTIVE', true, 9,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 10. 알림유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000010', NULL,
    'NOTIFICATION_TYPE', '알림유형', 'Notification Type',
    '결재, 일정, 공지 등 알림 유형 분류',
    true, false, 1, 'ACTIVE', true, 10,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 11. 휴일유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000011', NULL,
    'HOLIDAY_TYPE', '휴일유형', 'Holiday Type',
    '국경일, 공휴일, 창립기념일 등 휴일 유형 분류',
    true, false, 1, 'ACTIVE', true, 11,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 12. 성별
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000012', NULL,
    'GENDER', '성별', 'Gender',
    '남성, 여성 등 성별 분류',
    true, false, 1, 'ACTIVE', true, 12,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 13. 병역구분
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000013', NULL,
    'MILITARY_STATUS', '병역구분', 'Military Status',
    '군필, 미필, 면제 등 병역 상태 분류',
    true, false, 1, 'ACTIVE', true, 13,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 14. 업종분류 (계층형)
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000014', NULL,
    'INDUSTRY_TYPE', '업종분류', 'Industry Type',
    '제조업, IT, 금융 등 업종 분류',
    true, true, 2, 'ACTIVE', true, 14,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 15. 초과근무유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000015', NULL,
    'OVERTIME_TYPE', '초과근무유형', 'Overtime Type',
    '연장근무, 휴일근무, 야간근무 등 초과근무 분류',
    true, false, 1, 'ACTIVE', true, 15,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 16. 경조사유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000016', NULL,
    'CONDOLENCE_TYPE', '경조사유형', 'Condolence Type',
    '결혼, 출산, 부고 등 경조사 유형 분류',
    true, false, 1, 'ACTIVE', true, 16,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 17. 출장유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000017', NULL,
    'BUSINESS_TRIP_TYPE', '출장유형', 'Business Trip Type',
    '국내출장, 해외출장 등 출장 유형 분류',
    true, false, 1, 'ACTIVE', true, 17,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 18. 은행코드
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000018', NULL,
    'BANK_CODE', '은행코드', 'Bank Code',
    '급여이체 등에 사용되는 은행 코드',
    true, false, 1, 'ACTIVE', true, 18,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 19. 지역코드 (계층형)
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000019', NULL,
    'REGION_CODE', '지역코드', 'Region Code',
    '시도/시군구 등 지역 코드',
    true, true, 2, 'ACTIVE', true, 19,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 20. 근무지유형
INSERT INTO tenant_common.code_group (
    id, tenant_id, group_code, group_name, group_name_en,
    description, is_system, is_hierarchical, max_level, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'c0000001-0000-0000-0000-000000000020', NULL,
    'WORK_LOCATION_TYPE', '근무지유형', 'Work Location Type',
    '사무실, 재택, 현장 등 근무 장소 유형',
    true, false, 1, 'ACTIVE', true, 20,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;


-- ============================================================================
-- PART 2: 공통코드 상세 데이터
-- ============================================================================

-- ============================================================================
-- 1. 고용유형 (EMPLOYMENT_TYPE) - 5건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'FULL_TIME', '정규직', 'Full-time', '기간의 정함이 없는 정규 고용',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'CONTRACT', '계약직', 'Contract', '기간의 정함이 있는 계약 고용',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'INTERN', '인턴', 'Intern', '인턴십 고용',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'DISPATCH', '파견직', 'Dispatch', '파견 근로자',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000001', NULL, NULL, 1,
     'ADVISOR', '촉탁직', 'Advisor', '촉탁 계약 고용',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. 직원상태 (EMPLOYEE_STATUS) - 5건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'ACTIVE', '재직', 'Active', '현재 재직중',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'ON_LEAVE', '휴직', 'On Leave', '휴직 중',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'RESIGNED', '퇴직', 'Resigned', '퇴직 (자발적/비자발적)',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000009', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'SUSPENDED', '정직', 'Suspended', '정직 처분',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000010', 'c0000001-0000-0000-0000-000000000002', NULL, NULL, 1,
     'STANDBY', '대기', 'Standby', '대기 발령',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. 부서상태 (DEPARTMENT_STATUS) - 3건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000011', 'c0000001-0000-0000-0000-000000000003', NULL, NULL, 1,
     'ACTIVE', '활성', 'Active', '정상 운영중인 부서',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000012', 'c0000001-0000-0000-0000-000000000003', NULL, NULL, 1,
     'INACTIVE', '비활성', 'Inactive', '비활성화된 부서',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000013', 'c0000001-0000-0000-0000-000000000003', NULL, NULL, 1,
     'ABOLISHED', '폐지', 'Abolished', '폐지된 부서',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. 휴가유형 (LEAVE_TYPE) - 11건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000014', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'ANNUAL', '연차', 'Annual Leave', '연간 기본 휴가',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000015', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'HALF_DAY_AM', '오전반차', 'Half Day AM', '오전 반일 휴가',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000016', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'HALF_DAY_PM', '오후반차', 'Half Day PM', '오후 반일 휴가',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000017', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'SICK', '병가', 'Sick Leave', '질병으로 인한 휴가',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000018', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'CONDOLENCE', '경조사', 'Condolence Leave', '경조사 휴가',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000019', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'MATERNITY', '출산', 'Maternity Leave', '출산 전후 휴가',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000020', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'PATERNITY', '배우자출산', 'Paternity Leave', '배우자 출산 휴가',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000021', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'SPECIAL', '특별', 'Special Leave', '회사 부여 특별 휴가',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000022', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'REFRESH', '리프레시', 'Refresh Leave', '장기근속 리프레시 휴가',
     false, 'ACTIVE', true, 9,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000023', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'COMPENSATION', '보상', 'Compensation Leave', '보상 휴가 (초과근무 대체)',
     false, 'ACTIVE', true, 10,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000024', 'c0000001-0000-0000-0000-000000000004', NULL, NULL, 1,
     'UNPAID', '무급', 'Unpaid Leave', '무급 휴가',
     false, 'ACTIVE', true, 11,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. 근태상태 (ATTENDANCE_STATUS) - 6건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000025', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'NORMAL', '정상', 'Normal', '정상 출퇴근',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000026', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'LATE', '지각', 'Late', '출근 시간 지각',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000027', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'EARLY_LEAVE', '조퇴', 'Early Leave', '퇴근 시간 조퇴',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000028', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'ABSENT', '결근', 'Absent', '무단 결근',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000029', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'BUSINESS_TRIP', '출장', 'Business Trip', '출장 중',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000030', 'c0000001-0000-0000-0000-000000000005', NULL, NULL, 1,
     'REMOTE', '재택', 'Remote Work', '재택/원격 근무',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. 결재문서유형 (APPROVAL_DOC_TYPE) - 8건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000031', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'LEAVE_REQUEST', '휴가신청서', 'Leave Request', '휴가 신청 결재',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000032', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'OVERTIME_REQUEST', '초과근무신청서', 'Overtime Request', '초과근무 신청 결재',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000033', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'BUSINESS_TRIP', '출장신청서', 'Business Trip Request', '출장 신청 결재',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000034', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'EXPENSE_CLAIM', '경비청구서', 'Expense Claim', '경비 청구 결재',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000035', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'PURCHASE_REQUEST', '구매요청서', 'Purchase Request', '물품 구매 요청 결재',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000036', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'PERSONNEL_CHANGE', '인사변경요청서', 'Personnel Change', '인사 관련 변경 결재',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000037', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'CONDOLENCE_REQUEST', '경조금신청서', 'Condolence Request', '경조금 신청 결재',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000038', 'c0000001-0000-0000-0000-000000000006', NULL, NULL, 1,
     'GENERAL_APPROVAL', '일반품의서', 'General Approval', '일반 결재 문서',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. 결재상태 (APPROVAL_STATUS) - 7건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000039', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'DRAFT', '임시저장', 'Draft', '작성 중 임시 저장',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000040', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'PENDING', '대기', 'Pending', '상신 후 결재 대기',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000041', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'IN_PROGRESS', '진행중', 'In Progress', '결재 진행 중',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000042', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'APPROVED', '승인', 'Approved', '최종 승인 완료',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000043', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'REJECTED', '반려', 'Rejected', '결재 반려',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000044', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'RETURNED', '회수', 'Returned', '결재 회수',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000045', 'c0000001-0000-0000-0000-000000000007', NULL, NULL, 1,
     'CANCELLED', '취소', 'Cancelled', '신청자 취소',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. 가족관계 (RELATION_TYPE) - 8건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000046', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'SPOUSE', '배우자', 'Spouse', '배우자',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000047', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'FATHER', '부', 'Father', '부친',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000048', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'MOTHER', '모', 'Mother', '모친',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000049', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'SON', '아들', 'Son', '아들',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000050', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'DAUGHTER', '딸', 'Daughter', '딸',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000051', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'BROTHER', '형제', 'Brother', '형제',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000052', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'SISTER', '자매', 'Sister', '자매',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000053', 'c0000001-0000-0000-0000-000000000008', NULL, NULL, 1,
     'OTHER_FAMILY', '기타가족', 'Other Family', '기타 가족 관계',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. 학위유형 (DEGREE_TYPE) - 6건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000054', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'HIGH_SCHOOL', '고졸', 'High School', '고등학교 졸업',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000055', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'ASSOCIATE', '전문학사', 'Associate', '전문대학 졸업',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000056', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'BACHELOR', '학사', 'Bachelor', '4년제 대학 졸업',
     true, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000057', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'MASTER', '석사', 'Master', '석사 학위 취득',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000058', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'DOCTORATE', '박사', 'Doctorate', '박사 학위 취득',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000059', 'c0000001-0000-0000-0000-000000000009', NULL, NULL, 1,
     'OTHER', '기타', 'Other', '기타 학력',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. 알림유형 (NOTIFICATION_TYPE) - 8건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000060', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'APPROVAL', '결재', 'Approval', '결재 요청/완료 알림',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000061', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'SCHEDULE', '일정', 'Schedule', '일정 관련 알림',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000062', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'ANNOUNCEMENT', '공지', 'Announcement', '공지사항 알림',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000063', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'ATTENDANCE', '근태', 'Attendance', '근태 관련 알림',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000064', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'LEAVE', '휴가', 'Leave', '휴가 관련 알림',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000065', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'HR', '인사', 'HR', '인사 관련 알림',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000066', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'SYSTEM', '시스템', 'System', '시스템 공지 알림',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000067', 'c0000001-0000-0000-0000-000000000010', NULL, NULL, 1,
     'GENERAL', '일반', 'General', '일반 알림',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. 휴일유형 (HOLIDAY_TYPE) - 4건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000068', 'c0000001-0000-0000-0000-000000000011', NULL, NULL, 1,
     'NATIONAL', '국경일', 'National Holiday', '법정 국경일',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000069', 'c0000001-0000-0000-0000-000000000011', NULL, NULL, 1,
     'PUBLIC', '공휴일', 'Public Holiday', '법정 공휴일',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000070', 'c0000001-0000-0000-0000-000000000011', NULL, NULL, 1,
     'ALTERNATIVE', '대체공휴일', 'Alternative Holiday', '대체 공휴일',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000071', 'c0000001-0000-0000-0000-000000000011', NULL, NULL, 1,
     'COMPANY', '창립기념일', 'Company Anniversary', '회사 창립 기념일',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. 성별 (GENDER) - 3건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000072', 'c0000001-0000-0000-0000-000000000012', NULL, NULL, 1,
     'MALE', '남성', 'Male', '남성',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000073', 'c0000001-0000-0000-0000-000000000012', NULL, NULL, 1,
     'FEMALE', '여성', 'Female', '여성',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000074', 'c0000001-0000-0000-0000-000000000012', NULL, NULL, 1,
     'OTHER', '기타', 'Other', '기타',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. 병역구분 (MILITARY_STATUS) - 5건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000075', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'COMPLETED', '군필', 'Completed', '병역 이행 완료',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000076', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'NOT_SERVED', '미필', 'Not Served', '병역 미이행',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000077', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'EXEMPTED', '면제', 'Exempted', '병역 면제',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000078', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'NOT_APPLICABLE', '해당없음', 'Not Applicable', '해당 없음 (여성 등)',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000079', 'c0000001-0000-0000-0000-000000000013', NULL, NULL, 1,
     'IN_SERVICE', '복무중', 'In Service', '현재 복무 중',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. 업종분류 (INDUSTRY_TYPE) - 8건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000080', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'MANUFACTURING', '제조업', 'Manufacturing', '제조업',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000081', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'IT', 'IT/통신', 'IT/Telecom', 'IT 및 통신 산업',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000082', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'FINANCE', '금융/보험', 'Finance/Insurance', '금융 및 보험 산업',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000083', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'CONSTRUCTION', '건설', 'Construction', '건설업',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000084', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'BIO', '바이오/제약', 'Bio/Pharma', '바이오 및 제약 산업',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000085', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'CHEMICAL', '화학/소재', 'Chemical/Materials', '화학 및 소재 산업',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000086', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'ENERGY', '에너지', 'Energy', '에너지 산업',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000087', 'c0000001-0000-0000-0000-000000000014', NULL, NULL, 1,
     'SERVICE', '서비스업', 'Service', '서비스업',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 15. 초과근무유형 (OVERTIME_TYPE) - 3건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000088', 'c0000001-0000-0000-0000-000000000015', NULL, NULL, 1,
     'EXTENDED', '연장근무', 'Extended Work', '평일 야간 연장 근무',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000089', 'c0000001-0000-0000-0000-000000000015', NULL, NULL, 1,
     'HOLIDAY', '휴일근무', 'Holiday Work', '휴일 근무',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000090', 'c0000001-0000-0000-0000-000000000015', NULL, NULL, 1,
     'NIGHT', '야간근무', 'Night Work', '22시 이후 야간 근무',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 16. 경조사유형 (CONDOLENCE_TYPE) - 6건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000091', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'MARRIAGE', '본인결혼', 'Own Wedding', '본인 결혼',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000092', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'CHILD_MARRIAGE', '자녀결혼', 'Child Wedding', '자녀 결혼',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000093', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'CHILDBIRTH', '출산', 'Childbirth', '배우자 출산',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000094', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'PARENT_DEATH', '부모상', 'Parent Death', '부모 사망',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000095', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'GRANDPARENT_DEATH', '조부모상', 'Grandparent Death', '조부모 사망',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000096', 'c0000001-0000-0000-0000-000000000016', NULL, NULL, 1,
     'SIBLING_DEATH', '형제자매상', 'Sibling Death', '형제자매 사망',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 17. 출장유형 (BUSINESS_TRIP_TYPE) - 3건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000097', 'c0000001-0000-0000-0000-000000000017', NULL, NULL, 1,
     'DOMESTIC', '국내출장', 'Domestic', '국내 출장',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000098', 'c0000001-0000-0000-0000-000000000017', NULL, NULL, 1,
     'DOMESTIC_LONG', '국내장기출장', 'Domestic Long-term', '국내 장기 출장',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000099', 'c0000001-0000-0000-0000-000000000017', NULL, NULL, 1,
     'OVERSEAS', '해외출장', 'Overseas', '해외 출장',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 18. 은행코드 (BANK_CODE) - 15건
-- extra_value1: 은행 기관코드
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description, extra_value1,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000100', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'KB', '국민은행', 'KB Kookmin Bank', 'KB국민은행', '004',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000101', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'SHINHAN', '신한은행', 'Shinhan Bank', '신한은행', '088',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000102', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'WOORI', '우리은행', 'Woori Bank', '우리은행', '020',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000103', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'HANA', '하나은행', 'Hana Bank', '하나은행', '081',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000104', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'NH', '농협은행', 'NH Nonghyup Bank', 'NH농협은행', '011',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000105', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'IBK', '기업은행', 'IBK Industrial Bank', 'IBK기업은행', '003',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000106', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'SC', 'SC제일은행', 'SC First Bank', 'SC제일은행', '023',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000107', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'CITI', '한국씨티은행', 'Citibank Korea', '한국씨티은행', '027',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000108', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'KBANK', '케이뱅크', 'K Bank', '케이뱅크', '089',
     false, 'ACTIVE', true, 9,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000109', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'KAKAO', '카카오뱅크', 'Kakao Bank', '카카오뱅크', '090',
     false, 'ACTIVE', true, 10,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000110', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'TOSS', '토스뱅크', 'Toss Bank', '토스뱅크', '092',
     false, 'ACTIVE', true, 11,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000111', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'DAEGU', '대구은행', 'Daegu Bank', '대구은행', '031',
     false, 'ACTIVE', true, 12,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000112', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'BUSAN', '부산은행', 'Busan Bank', '부산은행', '032',
     false, 'ACTIVE', true, 13,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000113', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'KWANGJU', '광주은행', 'Kwangju Bank', '광주은행', '034',
     false, 'ACTIVE', true, 14,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000114', 'c0000001-0000-0000-0000-000000000018', NULL, NULL, 1,
     'JEONBUK', '전북은행', 'Jeonbuk Bank', '전북은행', '037',
     false, 'ACTIVE', true, 15,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 19. 지역코드 (REGION_CODE) - 17건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000115', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'SEOUL', '서울', 'Seoul', '서울특별시',
     false, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000116', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'BUSAN', '부산', 'Busan', '부산광역시',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000117', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'DAEGU', '대구', 'Daegu', '대구광역시',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000118', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'INCHEON', '인천', 'Incheon', '인천광역시',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000119', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GWANGJU', '광주', 'Gwangju', '광주광역시',
     false, 'ACTIVE', true, 5,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000120', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'DAEJEON', '대전', 'Daejeon', '대전광역시',
     false, 'ACTIVE', true, 6,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000121', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'ULSAN', '울산', 'Ulsan', '울산광역시',
     false, 'ACTIVE', true, 7,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000122', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'SEJONG', '세종', 'Sejong', '세종특별자치시',
     false, 'ACTIVE', true, 8,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000123', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GYEONGGI', '경기', 'Gyeonggi', '경기도',
     false, 'ACTIVE', true, 9,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000124', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GANGWON', '강원', 'Gangwon', '강원특별자치도',
     false, 'ACTIVE', true, 10,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000125', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'CHUNGBUK', '충북', 'Chungbuk', '충청북도',
     false, 'ACTIVE', true, 11,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000126', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'CHUNGNAM', '충남', 'Chungnam', '충청남도',
     false, 'ACTIVE', true, 12,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000127', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'JEONBUK', '전북', 'Jeonbuk', '전북특별자치도',
     false, 'ACTIVE', true, 13,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000128', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'JEONNAM', '전남', 'Jeonnam', '전라남도',
     false, 'ACTIVE', true, 14,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000129', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GYEONGBUK', '경북', 'Gyeongbuk', '경상북도',
     false, 'ACTIVE', true, 15,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000130', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'GYEONGNAM', '경남', 'Gyeongnam', '경상남도',
     false, 'ACTIVE', true, 16,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000131', 'c0000001-0000-0000-0000-000000000019', NULL, NULL, 1,
     'JEJU', '제주', 'Jeju', '제주특별자치도',
     false, 'ACTIVE', true, 17,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 20. 근무지유형 (WORK_LOCATION_TYPE) - 4건
-- ============================================================================
INSERT INTO tenant_common.common_code (
    id, code_group_id, tenant_id, parent_code_id, level,
    code, code_name, code_name_en, description,
    is_default, status, is_active, sort_order,
    created_at, updated_at, created_by, updated_by
) VALUES
    ('cc000001-0000-0000-0000-000000000132', 'c0000001-0000-0000-0000-000000000020', NULL, NULL, 1,
     'OFFICE', '사무실', 'Office', '회사 사무실 근무',
     true, 'ACTIVE', true, 1,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000133', 'c0000001-0000-0000-0000-000000000020', NULL, NULL, 1,
     'REMOTE', '재택', 'Remote', '재택 근무',
     false, 'ACTIVE', true, 2,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000134', 'c0000001-0000-0000-0000-000000000020', NULL, NULL, 1,
     'FIELD', '현장', 'Field', '현장 근무',
     false, 'ACTIVE', true, 3,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('cc000001-0000-0000-0000-000000000135', 'c0000001-0000-0000-0000-000000000020', NULL, NULL, 1,
     'OTHER', '기타', 'Other', '기타 근무지',
     false, 'ACTIVE', true, 4,
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- PART 3: 테넌트별 코드 매핑 (한성전자: a0000001-0000-0000-0000-000000000002)
-- ============================================================================

-- 1. EMPLOYMENT_TYPE > FULL_TIME 커스텀 이름
INSERT INTO tenant_common.code_tenant_mapping (
    id, tenant_id, common_code_id,
    custom_code_name, custom_code_name_en, custom_description,
    is_hidden, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000002',
    'cc000001-0000-0000-0000-000000000001',
    '정규직(무기계약)', 'Full-time (Permanent)', '무기계약 정규직',
    false, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 2. LEAVE_TYPE > REFRESH 커스텀 이름
INSERT INTO tenant_common.code_tenant_mapping (
    id, tenant_id, common_code_id,
    custom_code_name, custom_code_name_en, custom_description,
    is_hidden, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000002',
    'cc000001-0000-0000-0000-000000000022',
    '리프레시 휴가(5년차)', 'Refresh Leave (5yr)', '5년차 이상 리프레시 휴가',
    false, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 3. OVERTIME_TYPE > EXTENDED 커스텀 이름
INSERT INTO tenant_common.code_tenant_mapping (
    id, tenant_id, common_code_id,
    custom_code_name, custom_code_name_en, custom_description,
    is_hidden, is_active,
    created_at, updated_at, created_by, updated_by
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000002',
    'cc000001-0000-0000-0000-000000000088',
    '시간외 근무', 'After-hours Work', '시간외 근무 (연장근무)',
    false, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- 검증
-- ============================================================================
DO $$
DECLARE
    v_group_count INT;
    v_code_count INT;
    v_mapping_count INT;
BEGIN
    SELECT COUNT(*) INTO v_group_count FROM tenant_common.code_group;
    SELECT COUNT(*) INTO v_code_count FROM tenant_common.common_code;
    SELECT COUNT(*) INTO v_mapping_count FROM tenant_common.code_tenant_mapping;
    RAISE NOTICE '코드그룹 총 건수: %', v_group_count;
    RAISE NOTICE '공통코드 총 건수: %', v_code_count;
    RAISE NOTICE '테넌트매핑 총 건수: %', v_mapping_count;
END $$;


-- ================================================
-- [4/13] 03_mdm_menus.sql
-- ================================================
-- ============================================================================
-- 03_mdm_menus.sql
-- 메뉴 트리, 권한, 테넌트 메뉴 설정 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 시스템 메뉴 항목 (Level 1 - 루트 메뉴)
-- tenant_id = NULL, is_system = true, menu_type = 'INTERNAL'
-- ============================================================================

-- 1-1. 대시보드
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000001',
    NULL, NULL, 'DASHBOARD', '대시보드', 'Dashboard', '/dashboard', 'dashboard',
    'INTERNAL', 1, 1, 'MAIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-2. 내 정보
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000002',
    NULL, NULL, 'MY_INFO', '내 정보', 'My Info', '/my-info', 'person',
    'INTERNAL', 1, 2, 'MAIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-3. 알림센터
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000003',
    NULL, NULL, 'NOTIFICATION_CENTER', '알림센터', 'Notifications', '/notifications', 'notifications',
    'INTERNAL', 1, 3, 'MAIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-4. 인사관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000010',
    NULL, NULL, 'HR_MANAGEMENT', '인사관리', 'HR Management', NULL, 'people',
    'INTERNAL', 1, 10, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-5. 조직관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000015',
    NULL, NULL, 'ORG_MANAGEMENT', '조직관리', 'Org Management', NULL, 'account_tree',
    'INTERNAL', 1, 15, 'ORGANIZATION',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-6. 근태관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000020',
    NULL, NULL, 'ATTENDANCE_MGMT', '근태관리', 'Attendance', NULL, 'schedule',
    'INTERNAL', 1, 20, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-7. 전자결재
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000025',
    NULL, NULL, 'APPROVAL', '전자결재', 'Approval', NULL, 'assignment',
    'INTERNAL', 1, 25, 'APPROVAL',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-8. 발령관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000030',
    NULL, NULL, 'APPOINTMENT_MGMT', '발령관리', 'Appointment', NULL, 'swap_horiz',
    'INTERNAL', 1, 30, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-9. 채용관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000035',
    NULL, NULL, 'RECRUITMENT', '채용관리', 'Recruitment', NULL, 'work',
    'INTERNAL', 1, 35, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-10. 증명서
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000040',
    NULL, NULL, 'CERTIFICATE', '증명서', 'Certificate', '/certificate', 'description',
    'INTERNAL', 1, 40, 'SERVICE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-11. 공지사항
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000041',
    NULL, NULL, 'ANNOUNCEMENT', '공지사항', 'Announcements', '/announcement', 'campaign',
    'INTERNAL', 1, 41, 'SERVICE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-12. 경조비 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000042',
    NULL, NULL, 'CONDOLENCE', '경조비 관리', 'Condolence', '/condolence', 'favorite',
    'INTERNAL', 1, 42, 'SERVICE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-13. 위원회 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000047',
    NULL, NULL, 'COMMITTEE', '위원회 관리', 'Committee', '/committee', 'groups',
    'INTERNAL', 1, 43, 'SERVICE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-14. 사원증 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000044',
    NULL, NULL, 'EMPLOYEE_CARD', '사원증 관리', 'Employee Card', '/employee-card', 'badge',
    'INTERNAL', 1, 44, 'SERVICE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-15. 정원관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000045',
    NULL, NULL, 'HEADCOUNT', '정원관리', 'Headcount', '/headcount', 'analytics',
    'INTERNAL', 1, 45, 'ORGANIZATION',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-16. 계열사 인사이동
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000046',
    NULL, NULL, 'TRANSFER', '계열사 인사이동', 'Transfer', '/transfer', 'transfer_within_a_station',
    'INTERNAL', 1, 46, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-17. 설정
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000050',
    NULL, NULL, 'SETTINGS', '설정', 'Settings', NULL, 'settings',
    'INTERNAL', 1, 50, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-18. 기준정보관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000055',
    NULL, NULL, 'MDM', '기준정보관리', 'MDM', NULL, 'tune',
    'INTERNAL', 1, 55, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-19. 메뉴 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000060',
    NULL, NULL, 'MENU_MANAGEMENT', '메뉴 관리', 'Menu Mgmt', '/admin/menus', 'menu',
    'INTERNAL', 1, 60, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-20. 테넌트 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000061',
    NULL, NULL, 'TENANT_MANAGEMENT', '테넌트 관리', 'Tenant Mgmt', '/admin/tenants', 'domain',
    'INTERNAL', 1, 61, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-21. 감사 로그
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000062',
    NULL, NULL, 'AUDIT_LOG', '감사 로그', 'Audit Log', '/admin/audit-log', 'security',
    'INTERNAL', 1, 62, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 1-22. 파일 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000063',
    NULL, NULL, 'FILE_MANAGEMENT', '파일 관리', 'File Mgmt', '/admin/files', 'folder',
    'INTERNAL', 1, 63, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. 시스템 메뉴 항목 (Level 2 - 하위 메뉴)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2-1. 인사관리 (HR_MANAGEMENT) 하위
-- ----------------------------------------------------------------------------

-- 직원 목록
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000011',
    NULL, '00000001-0000-0000-0000-000000000010', 'EMPLOYEE_LIST', '직원 목록', 'Employee List', '/hr/employees', NULL,
    'INTERNAL', 2, 1, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 직원 상세 (show_in_nav=false: 상세 페이지이므로 사이드바에 표시하지 않음)
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000012',
    NULL, '00000001-0000-0000-0000-000000000010', 'EMPLOYEE_DETAIL', '직원 상세', 'Employee Detail', '/hr/employees/:id', NULL,
    'INTERNAL', 2, 2, 'HR',
    true, true, false, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 인사기록카드
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000013',
    NULL, '00000001-0000-0000-0000-000000000010', 'EMPLOYEE_RECORD', '인사기록카드', 'Employee Record', '/hr/employee-record', NULL,
    'INTERNAL', 2, 3, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 조직도
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000014',
    NULL, '00000001-0000-0000-0000-000000000010', 'ORG_CHART', '조직도', 'Org Chart', '/hr/org-chart', NULL,
    'INTERNAL', 2, 4, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2-2. 조직관리 (ORG_MANAGEMENT) 하위
-- ----------------------------------------------------------------------------

-- 부서 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000016',
    NULL, '00000001-0000-0000-0000-000000000015', 'DEPT_MANAGEMENT', '부서 관리', 'Department Mgmt', '/org/departments', NULL,
    'INTERNAL', 2, 1, 'ORGANIZATION',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 직급 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000017',
    NULL, '00000001-0000-0000-0000-000000000015', 'GRADE_MANAGEMENT', '직급 관리', 'Grade Mgmt', '/org/grades', NULL,
    'INTERNAL', 2, 2, 'ORGANIZATION',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 직책 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000018',
    NULL, '00000001-0000-0000-0000-000000000015', 'POSITION_MANAGEMENT', '직책 관리', 'Position Mgmt', '/org/positions', NULL,
    'INTERNAL', 2, 3, 'ORGANIZATION',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 조직 변경이력
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000019',
    NULL, '00000001-0000-0000-0000-000000000015', 'ORG_HISTORY', '조직 변경이력', 'Org History', '/org/history', NULL,
    'INTERNAL', 2, 4, 'ORGANIZATION',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2-3. 근태관리 (ATTENDANCE_MGMT) 하위
-- ----------------------------------------------------------------------------

-- 출퇴근 현황
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000021',
    NULL, '00000001-0000-0000-0000-000000000020', 'ATTENDANCE_STATUS', '출퇴근 현황', 'Attendance Status', '/attendance/status', NULL,
    'INTERNAL', 2, 1, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 휴가 신청
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000022',
    NULL, '00000001-0000-0000-0000-000000000020', 'LEAVE_REQUEST', '휴가 신청', 'Leave Request', '/attendance/leave/request', NULL,
    'INTERNAL', 2, 2, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 내 휴가
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000023',
    NULL, '00000001-0000-0000-0000-000000000020', 'MY_LEAVE', '내 휴가', 'My Leave', '/attendance/leave/my', NULL,
    'INTERNAL', 2, 3, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 휴가 승인
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000024',
    NULL, '00000001-0000-0000-0000-000000000020', 'LEAVE_APPROVAL', '휴가 승인', 'Leave Approval', '/attendance/leave/approval', NULL,
    'INTERNAL', 2, 4, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 휴가 캘린더 (NOTE: id uses 028, code is LEAVE_CALENDAR)
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000028',
    NULL, '00000001-0000-0000-0000-000000000020', 'LEAVE_CALENDAR', '휴가 캘린더', 'Leave Calendar', '/attendance/leave/calendar', NULL,
    'INTERNAL', 2, 5, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 초과근무
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000026',
    NULL, '00000001-0000-0000-0000-000000000020', 'OVERTIME', '초과근무', 'Overtime', '/attendance/overtime', NULL,
    'INTERNAL', 2, 6, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 52시간 모니터링
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000027',
    NULL, '00000001-0000-0000-0000-000000000020', 'WORK_HOUR_MONITOR', '52시간 모니터링', 'Work Hour Monitor', '/attendance/work-hours', NULL,
    'INTERNAL', 2, 7, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2-4. 전자결재 (APPROVAL) 하위
-- ----------------------------------------------------------------------------

-- 결재 작성
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000029',
    NULL, '00000001-0000-0000-0000-000000000025', 'APPROVAL_CREATE', '결재 작성', 'Approval Create', '/approval/create', NULL,
    'INTERNAL', 2, 1, 'APPROVAL',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 내 결재 (NOTE: id uses 033, code is MY_APPROVAL)
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000033',
    NULL, '00000001-0000-0000-0000-000000000025', 'MY_APPROVAL', '내 결재', 'My Approval', '/approval/my', NULL,
    'INTERNAL', 2, 2, 'APPROVAL',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 결재 위임
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000031',
    NULL, '00000001-0000-0000-0000-000000000025', 'APPROVAL_DELEGATION', '결재 위임', 'Approval Delegation', '/approval/delegation', NULL,
    'INTERNAL', 2, 3, 'APPROVAL',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2-5. 발령관리 (APPOINTMENT_MGMT) 하위
-- ----------------------------------------------------------------------------

-- 발령 목록
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000034',
    NULL, '00000001-0000-0000-0000-000000000030', 'APPOINTMENT_LIST', '발령 목록', 'Appointment List', '/appointment/list', NULL,
    'INTERNAL', 2, 1, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 발령 이력 (NOTE: id uses 036, code is APPOINTMENT_HISTORY_VIEW)
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000036',
    NULL, '00000001-0000-0000-0000-000000000030', 'APPOINTMENT_HISTORY_VIEW', '발령 이력', 'Appointment History', '/appointment/history', NULL,
    'INTERNAL', 2, 2, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2-6. 채용관리 (RECRUITMENT) 하위
-- ----------------------------------------------------------------------------

-- 채용공고 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000037',
    NULL, '00000001-0000-0000-0000-000000000035', 'JOB_POSTING', '채용공고 관리', 'Job Posting', '/recruitment/postings', NULL,
    'INTERNAL', 2, 1, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 지원자 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000038',
    NULL, '00000001-0000-0000-0000-000000000035', 'APPLICANT_MGMT', '지원자 관리', 'Applicant Mgmt', '/recruitment/applicants', NULL,
    'INTERNAL', 2, 2, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 면접 일정
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000039',
    NULL, '00000001-0000-0000-0000-000000000035', 'INTERVIEW_SCHEDULE', '면접 일정', 'Interview Schedule', '/recruitment/interviews', NULL,
    'INTERNAL', 2, 3, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 내 면접 (NOTE: id uses 043, code is MY_INTERVIEW)
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000043',
    NULL, '00000001-0000-0000-0000-000000000035', 'MY_INTERVIEW', '내 면접', 'My Interview', '/recruitment/my-interviews', NULL,
    'INTERNAL', 2, 4, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2-7. 설정 (SETTINGS) 하위
-- ----------------------------------------------------------------------------

-- 결재 양식 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000051',
    NULL, '00000001-0000-0000-0000-000000000050', 'APPROVAL_TEMPLATE', '결재 양식 관리', 'Approval Template', '/settings/approval-templates', NULL,
    'INTERNAL', 2, 1, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 위임전결 규칙
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000052',
    NULL, '00000001-0000-0000-0000-000000000050', 'DELEGATION_RULE', '위임전결 규칙', 'Delegation Rule', '/settings/delegation-rules', NULL,
    'INTERNAL', 2, 2, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 개인정보 열람이력
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000053',
    NULL, '00000001-0000-0000-0000-000000000050', 'PRIVACY_LOG', '개인정보 열람이력', 'Privacy Log', '/settings/privacy-log', NULL,
    'INTERNAL', 2, 3, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2-8. 기준정보관리 (MDM) 하위
-- ----------------------------------------------------------------------------

-- 코드그룹 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000056',
    NULL, '00000001-0000-0000-0000-000000000055', 'CODE_GROUP', '코드그룹 관리', 'Code Group', '/mdm/code-groups', NULL,
    'INTERNAL', 2, 1, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 공통코드 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000057',
    NULL, '00000001-0000-0000-0000-000000000055', 'COMMON_CODE', '공통코드 관리', 'Common Code', '/mdm/common-codes', NULL,
    'INTERNAL', 2, 2, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- 테넌트 코드 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000058',
    NULL, '00000001-0000-0000-0000-000000000055', 'TENANT_CODE', '테넌트 코드 관리', 'Tenant Code', '/mdm/tenant-codes', NULL,
    'INTERNAL', 2, 3, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. 메뉴 권한 (menu_permission) - ROLE 타입
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3-1. MAIN 그룹 (DASHBOARD, MY_INFO, NOTIFICATION_CENTER)
-- 모든 역할 접근 가능
-- ----------------------------------------------------------------------------

-- DASHBOARD 권한
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000001', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- MY_INFO 권한
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000002', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- NOTIFICATION_CENTER 권한
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000003', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000003', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000003', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000003', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000003', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000003', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-2. HR_MANAGEMENT 및 하위 메뉴 (SUPER_ADMIN, TENANT_ADMIN, HR_MANAGER, HR_STAFF, DEPT_MANAGER)
-- ----------------------------------------------------------------------------

-- HR_MANAGEMENT (부모)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000010', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000010', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000010', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000010', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000010', 'ROLE', 'DEPT_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- EMPLOYEE_LIST
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000011', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000011', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000011', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000011', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000011', 'ROLE', 'DEPT_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- EMPLOYEE_DETAIL
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000012', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000012', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000012', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000012', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000012', 'ROLE', 'DEPT_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- EMPLOYEE_RECORD
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000013', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000013', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000013', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000013', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000013', 'ROLE', 'DEPT_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ORG_CHART
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000014', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000014', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000014', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000014', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000014', 'ROLE', 'DEPT_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-3. ORG_MANAGEMENT 및 하위 메뉴 (SUPER_ADMIN, TENANT_ADMIN, HR_MANAGER)
-- ----------------------------------------------------------------------------

-- ORG_MANAGEMENT (부모)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000015', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000015', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000015', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- DEPT_MANAGEMENT
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000016', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000016', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000016', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- GRADE_MANAGEMENT
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000017', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000017', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000017', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- POSITION_MANAGEMENT
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000018', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000018', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000018', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ORG_HISTORY
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000019', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000019', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000019', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-4. ATTENDANCE_MGMT 하위 메뉴 (역할별 차등 접근)
-- ----------------------------------------------------------------------------

-- ATTENDANCE_STATUS (모든 역할)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000021', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000021', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000021', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000021', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000021', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000021', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- LEAVE_REQUEST (모든 역할)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000022', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000022', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000022', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000022', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000022', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000022', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- MY_LEAVE (모든 역할)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000023', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000023', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000023', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000023', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000023', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000023', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- LEAVE_APPROVAL (관리자만)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000024', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000024', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000024', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000024', 'ROLE', 'DEPT_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- LEAVE_CALENDAR (모든 역할)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000028', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000028', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000028', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000028', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000028', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000028', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- OVERTIME (모든 역할)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000026', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000026', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000026', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000026', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000026', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000026', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- WORK_HOUR_MONITOR (관리자만)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000027', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000027', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000027', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ATTENDANCE_MGMT (부모 - 근태관리 하위에 접근 가능한 모든 역할)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000020', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000020', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000020', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000020', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000020', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000020', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-5. APPROVAL 및 하위 메뉴 (모든 역할)
-- ----------------------------------------------------------------------------

-- APPROVAL (부모)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000025', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000025', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000025', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000025', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000025', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000025', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- APPROVAL_CREATE
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000029', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000029', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000029', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000029', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000029', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000029', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- MY_APPROVAL
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000033', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000033', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000033', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000033', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000033', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000033', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- APPROVAL_DELEGATION
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000031', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000031', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000031', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000031', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000031', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000031', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-6. APPOINTMENT_MGMT 및 하위 메뉴 (SUPER_ADMIN, TENANT_ADMIN, HR_MANAGER)
-- ----------------------------------------------------------------------------

-- APPOINTMENT_MGMT (부모)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000030', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000030', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000030', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- APPOINTMENT_LIST
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000034', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000034', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000034', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- APPOINTMENT_HISTORY_VIEW
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000036', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000036', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000036', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-7. RECRUITMENT 및 하위 메뉴 (SUPER_ADMIN, TENANT_ADMIN, HR_MANAGER)
-- MY_INTERVIEW는 DEPT_MANAGER도 접근 가능
-- ----------------------------------------------------------------------------

-- RECRUITMENT (부모)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000035', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000035', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000035', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- JOB_POSTING
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000037', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000037', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000037', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- APPLICANT_MGMT
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000038', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000038', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000038', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- INTERVIEW_SCHEDULE
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000039', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000039', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000039', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- MY_INTERVIEW (DEPT_MANAGER도 접근 가능)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000043', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000043', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000043', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000043', 'ROLE', 'DEPT_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-8. SERVICE 그룹 (CERTIFICATE, ANNOUNCEMENT, CONDOLENCE, COMMITTEE, EMPLOYEE_CARD)
-- ----------------------------------------------------------------------------

-- CERTIFICATE (모든 역할)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000040', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000040', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000040', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000040', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000040', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000040', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- ANNOUNCEMENT (모든 역할)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000041', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000041', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000041', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000041', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000041', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000041', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- CONDOLENCE (모든 역할)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000042', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000042', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000042', 'ROLE', 'HR_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000042', 'ROLE', 'HR_STAFF', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000042', 'ROLE', 'DEPT_MANAGER', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000042', 'ROLE', 'EMPLOYEE', NOW())
ON CONFLICT DO NOTHING;

-- COMMITTEE (관리자만)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000047', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000047', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000047', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- EMPLOYEE_CARD (관리자만)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000044', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000044', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000044', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-9. ORGANIZATION 그룹 추가 (HEADCOUNT)
-- ----------------------------------------------------------------------------

-- HEADCOUNT (관리자만)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000045', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000045', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000045', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-10. HR 그룹 추가 (TRANSFER)
-- ----------------------------------------------------------------------------

-- TRANSFER (관리자만)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000046', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000046', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000046', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-11. SETTINGS 및 하위 메뉴 (SUPER_ADMIN, TENANT_ADMIN)
-- ----------------------------------------------------------------------------

-- SETTINGS (부모)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000050', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000050', 'ROLE', 'TENANT_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- APPROVAL_TEMPLATE
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000051', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000051', 'ROLE', 'TENANT_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- DELEGATION_RULE
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000052', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000052', 'ROLE', 'TENANT_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- PRIVACY_LOG
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000053', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000053', 'ROLE', 'TENANT_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-12. MDM 및 하위 메뉴 (SUPER_ADMIN만)
-- ----------------------------------------------------------------------------

-- MDM (부모)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000055', 'ROLE', 'SUPER_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- CODE_GROUP
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000056', 'ROLE', 'SUPER_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- COMMON_CODE
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000057', 'ROLE', 'SUPER_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- TENANT_CODE
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000058', 'ROLE', 'SUPER_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-13. ADMIN 그룹 개별 메뉴 (MENU_MANAGEMENT, TENANT_MANAGEMENT, AUDIT_LOG, FILE_MANAGEMENT)
-- ----------------------------------------------------------------------------

-- MENU_MANAGEMENT (SUPER_ADMIN만)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000060', 'ROLE', 'SUPER_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- TENANT_MANAGEMENT (SUPER_ADMIN, TENANT_ADMIN)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000061', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000061', 'ROLE', 'TENANT_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- AUDIT_LOG (SUPER_ADMIN, TENANT_ADMIN)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000062', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000062', 'ROLE', 'TENANT_ADMIN', NOW())
ON CONFLICT DO NOTHING;

-- FILE_MANAGEMENT (SUPER_ADMIN, TENANT_ADMIN, HR_MANAGER)
INSERT INTO tenant_common.menu_permission (id, menu_item_id, permission_type, permission_value, created_at)
VALUES
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000063', 'ROLE', 'SUPER_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000063', 'ROLE', 'TENANT_ADMIN', NOW()),
    (gen_random_uuid(), '00000001-0000-0000-0000-000000000063', 'ROLE', 'HR_MANAGER', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. 테넌트 메뉴 설정 (tenant_menu_config)
-- 한성바이오 (SUSPENDED 테넌트) - 발령관리/채용관리 비활성화
-- ============================================================================

-- 한성바이오: APPOINTMENT_MGMT 비활성화
INSERT INTO tenant_common.tenant_menu_config (
    id, tenant_id, menu_item_id, is_enabled, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000005',
    '00000001-0000-0000-0000-000000000030',
    false,
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- 한성바이오: APPOINTMENT_LIST 비활성화
INSERT INTO tenant_common.tenant_menu_config (
    id, tenant_id, menu_item_id, is_enabled, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000005',
    '00000001-0000-0000-0000-000000000034',
    false,
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- 한성바이오: APPOINTMENT_HISTORY_VIEW 비활성화
INSERT INTO tenant_common.tenant_menu_config (
    id, tenant_id, menu_item_id, is_enabled, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000005',
    '00000001-0000-0000-0000-000000000036',
    false,
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- 한성바이오: RECRUITMENT 비활성화
INSERT INTO tenant_common.tenant_menu_config (
    id, tenant_id, menu_item_id, is_enabled, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000005',
    '00000001-0000-0000-0000-000000000035',
    false,
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- 한성바이오: JOB_POSTING 비활성화
INSERT INTO tenant_common.tenant_menu_config (
    id, tenant_id, menu_item_id, is_enabled, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000005',
    '00000001-0000-0000-0000-000000000037',
    false,
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- 한성바이오: APPLICANT_MGMT 비활성화
INSERT INTO tenant_common.tenant_menu_config (
    id, tenant_id, menu_item_id, is_enabled, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000005',
    '00000001-0000-0000-0000-000000000038',
    false,
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- 한성바이오: INTERVIEW_SCHEDULE 비활성화
INSERT INTO tenant_common.tenant_menu_config (
    id, tenant_id, menu_item_id, is_enabled, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000005',
    '00000001-0000-0000-0000-000000000039',
    false,
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- 한성바이오: MY_INTERVIEW 비활성화
INSERT INTO tenant_common.tenant_menu_config (
    id, tenant_id, menu_item_id, is_enabled, created_at, updated_at
) VALUES (
    gen_random_uuid(),
    'a0000001-0000-0000-0000-000000000005',
    '00000001-0000-0000-0000-000000000043',
    false,
    NOW(), NOW()
) ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- 검증
-- ============================================================================
DO $$
DECLARE
    menu_count INT;
    permission_count INT;
    config_count INT;
BEGIN
    SELECT COUNT(*) INTO menu_count FROM tenant_common.menu_item;
    SELECT COUNT(*) INTO permission_count FROM tenant_common.menu_permission;
    SELECT COUNT(*) INTO config_count FROM tenant_common.tenant_menu_config;
    RAISE NOTICE '메뉴 항목 생성 완료: % 개', menu_count;
    RAISE NOTICE '메뉴 권한 생성 완료: % 개', permission_count;
    RAISE NOTICE '테넌트 메뉴 설정 완료: % 개', config_count;
END $$;


-- ================================================
-- [5/13] 04_organization.sql
-- ================================================
-- ============================================================================
-- 04_organization.sql
-- 직급(Grade), 직책(Position), 부서(Department) 마스터 데이터 생성
-- 8개 테넌트 x 11개 직급 + 9개 직책 + 부서 구조
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 직급 (Grade) - 11단계 체계, 8개 테넌트 = 88건
-- UUID format: g000000{N}-0000-0000-0000-0000000000{LL}
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID, -- 1: HD
        'a0000001-0000-0000-0000-000000000002'::UUID, -- 2: ELEC
        'a0000001-0000-0000-0000-000000000003'::UUID, -- 3: SDI
        'a0000001-0000-0000-0000-000000000004'::UUID, -- 4: ENG
        'a0000001-0000-0000-0000-000000000005'::UUID, -- 5: BIO
        'a0000001-0000-0000-0000-000000000006'::UUID, -- 6: CHEM
        'a0000001-0000-0000-0000-000000000007'::UUID, -- 7: IT
        'a0000001-0000-0000-0000-000000000008'::UUID  -- 8: LIFE
    ];
    v_grade_codes TEXT[]    := ARRAY['G01','G02','G03','G04','G05','G06','G07','G08','G09','G10','G11'];
    v_grade_names TEXT[]    := ARRAY['회장','부회장','사장','부사장','전무','상무','부장','차장','과장','대리','사원'];
    v_grade_names_en TEXT[] := ARRAY['Chairman','Vice Chairman','President','EVP','Senior VP','VP','Director','Deputy Director','Manager','Assistant Manager','Staff'];
    v_sys_user TEXT := '00000000-0000-0000-0000-000000000000';
    i INT;
    j INT;
    v_uuid UUID;
BEGIN
    FOR i IN 1..array_length(v_tenant_ids, 1) LOOP
        FOR j IN 1..array_length(v_grade_codes, 1) LOOP
            -- UUID: 1000000{i}-0000-0000-0000-0000000000{jj} (grade prefix: 1)
            v_uuid := ('1000000' || i || '-0000-0000-0000-00000000' || LPAD(j::TEXT, 4, '0'))::UUID;

            INSERT INTO hr_core.grade (id, tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
            VALUES (v_uuid, v_tenant_ids[i], v_grade_codes[j], v_grade_names[j], v_grade_names_en[j], j, j, true, NOW(), NOW(), v_sys_user, v_sys_user)
            ON CONFLICT (tenant_id, code) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 2. 직책 (Position) - 9단계 체계, 8개 테넌트 = 72건
-- UUID format: p000000{N}-0000-0000-0000-0000000000{LL}
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_pos_codes TEXT[]    := ARRAY['P01','P02','P03','P04','P05','P06','P07','P08','P09'];
    v_pos_names TEXT[]    := ARRAY['대표이사','본부장','실장','팀장','파트장','책임','선임','주임','팀원'];
    v_pos_names_en TEXT[] := ARRAY['CEO','Division Head','Department Head','Team Leader','Part Leader','Senior','Lead','Junior Lead','Member'];
    v_sys_user TEXT := '00000000-0000-0000-0000-000000000000';
    i INT;
    j INT;
    v_uuid UUID;
BEGIN
    FOR i IN 1..array_length(v_tenant_ids, 1) LOOP
        FOR j IN 1..array_length(v_pos_codes, 1) LOOP
            -- UUID: 2000000{i}-0000-0000-0000-0000000000{jj} (position prefix: 2)
            v_uuid := ('2000000' || i || '-0000-0000-0000-00000000' || LPAD(j::TEXT, 4, '0'))::UUID;

            INSERT INTO hr_core.position (id, tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
            VALUES (v_uuid, v_tenant_ids[i], v_pos_codes[j], v_pos_names[j], v_pos_names_en[j], j, j, true, NOW(), NOW(), v_sys_user, v_sys_user)
            ON CONFLICT (tenant_id, code) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 3. 부서 (Department)
-- UUID format: d000000{N}-0000-0000-0000-000000000{SEQ}
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3-1. 한성홀딩스 (tenant 1) - 8개 부서
-- ----------------------------------------------------------------------------

INSERT INTO hr_core.department (id, tenant_id, code, name, name_en, parent_id, level, path, manager_id, status, sort_order, created_at, updated_at, created_by, updated_by)
VALUES
('30000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'HD_ROOT',          '한성홀딩스',     NULL, NULL,                                                  0, '/한성홀딩스',                         NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'HD_STRATEGY',       '전략기획본부',   NULL, '30000001-0000-0000-0000-000000000001',                 1, '/한성홀딩스/전략기획본부',             NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'HD_STRATEGY_TEAM',  '전략기획팀',     NULL, '30000001-0000-0000-0000-000000000002',                 2, '/한성홀딩스/전략기획본부/전략기획팀',   NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'HD_HR',             '인사지원본부',   NULL, '30000001-0000-0000-0000-000000000001',                 1, '/한성홀딩스/인사지원본부',             NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001', 'HD_HR_TEAM',        '인사팀',         NULL, '30000001-0000-0000-0000-000000000004',                 2, '/한성홀딩스/인사지원본부/인사팀',       NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'HD_FINANCE',        '재무본부',       NULL, '30000001-0000-0000-0000-000000000001',                 1, '/한성홀딩스/재무본부',                 NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000001', 'HD_FINANCE_TEAM',   '재무팀',         NULL, '30000001-0000-0000-0000-000000000006',                 2, '/한성홀딩스/재무본부/재무팀',           NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000001', 'HD_LEGAL',          '법무팀',         NULL, '30000001-0000-0000-0000-000000000001',                 1, '/한성홀딩스/법무팀',                   NULL, 'ACTIVE', 4,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-2. 한성전자 (tenant 2) - 33개 부서 (메인 데모 테넌트)
-- 주요 부서: DEV1(SEQ=016) = 개발1팀, HR_TEAM(SEQ=007) = 인사팀
-- ----------------------------------------------------------------------------

INSERT INTO hr_core.department (id, tenant_id, code, name, name_en, parent_id, level, path, manager_id, status, sort_order, created_at, updated_at, created_by, updated_by)
VALUES
-- Root
('30000002-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000002', 'ELEC_ROOT',      '한성전자',       NULL, NULL,                                                  0, '/한성전자',                                               NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- 경영지원본부 hierarchy
('30000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'MGMT_HQ',        '경영지원본부',   NULL, '30000002-0000-0000-0000-000000000001',                 1, '/한성전자/경영지원본부',                                   NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000002', 'BIZ_PLAN',       '경영기획실',     NULL, '30000002-0000-0000-0000-000000000002',                 2, '/한성전자/경영지원본부/경영기획실',                         NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'STRATEGY',       '전략기획팀',     NULL, '30000002-0000-0000-0000-000000000003',                 3, '/한성전자/경영지원본부/경영기획실/전략기획팀',               NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'BUDGET',         '예산관리팀',     NULL, '30000002-0000-0000-0000-000000000003',                 3, '/한성전자/경영지원본부/경영기획실/예산관리팀',               NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'HR_DIV',         '인사실',         NULL, '30000002-0000-0000-0000-000000000002',                 2, '/한성전자/경영지원본부/인사실',                             NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000002', 'HR_TEAM',        '인사팀',         NULL, '30000002-0000-0000-0000-000000000006',                 3, '/한성전자/경영지원본부/인사실/인사팀',                       NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000002', 'TRAINING',       '교육팀',         NULL, '30000002-0000-0000-0000-000000000006',                 3, '/한성전자/경영지원본부/인사실/교육팀',                       NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000002', 'LABOR',          '노무팀',         NULL, '30000002-0000-0000-0000-000000000006',                 3, '/한성전자/경영지원본부/인사실/노무팀',                       NULL, 'ACTIVE',   3, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000002', 'FINANCE_DIV',    '재무실',         NULL, '30000002-0000-0000-0000-000000000002',                 2, '/한성전자/경영지원본부/재무실',                             NULL, 'ACTIVE',   3, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000002', 'FINANCE',        '재무팀',         NULL, '30000002-0000-0000-0000-000000000010',                 3, '/한성전자/경영지원본부/재무실/재무팀',                       NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000002', 'ACCOUNTING',     '회계팀',         NULL, '30000002-0000-0000-0000-000000000010',                 3, '/한성전자/경영지원본부/재무실/회계팀',                       NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000002', 'LEGAL',          '법무팀',         NULL, '30000002-0000-0000-0000-000000000002',                 2, '/한성전자/경영지원본부/법무팀',                             NULL, 'ACTIVE',   4, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- 기술본부 hierarchy
('30000002-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000002', 'TECH_HQ',        '기술본부',       NULL, '30000002-0000-0000-0000-000000000001',                 1, '/한성전자/기술본부',                                       NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000002', 'RND_DIV',        '연구개발실',     NULL, '30000002-0000-0000-0000-000000000014',                 2, '/한성전자/기술본부/연구개발실',                             NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000016', 'a0000001-0000-0000-0000-000000000002', 'DEV1',           '개발1팀',        NULL, '30000002-0000-0000-0000-000000000015',                 3, '/한성전자/기술본부/연구개발실/개발1팀',                     NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000017', 'a0000001-0000-0000-0000-000000000002', 'DEV2',           '개발2팀',        NULL, '30000002-0000-0000-0000-000000000015',                 3, '/한성전자/기술본부/연구개발실/개발2팀',                     NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000018', 'a0000001-0000-0000-0000-000000000002', 'QA',             'QA팀',           NULL, '30000002-0000-0000-0000-000000000015',                 3, '/한성전자/기술본부/연구개발실/QA팀',                       NULL, 'ACTIVE',   3, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000019', 'a0000001-0000-0000-0000-000000000002', 'TECH_PLAN',      '기술기획팀',     NULL, '30000002-0000-0000-0000-000000000014',                 2, '/한성전자/기술본부/기술기획팀',                             NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000020', 'a0000001-0000-0000-0000-000000000002', 'INFRA',          '인프라팀',       NULL, '30000002-0000-0000-0000-000000000014',                 2, '/한성전자/기술본부/인프라팀',                               NULL, 'ACTIVE',   3, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- 영업본부 hierarchy
('30000002-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000002', 'SALES_HQ',       '영업본부',       NULL, '30000002-0000-0000-0000-000000000001',                 1, '/한성전자/영업본부',                                       NULL, 'ACTIVE',   3, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000022', 'a0000001-0000-0000-0000-000000000002', 'DOMESTIC_SALES', '국내영업팀',     NULL, '30000002-0000-0000-0000-000000000021',                 2, '/한성전자/영업본부/국내영업팀',                             NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000023', 'a0000001-0000-0000-0000-000000000002', 'OVERSEAS_SALES', '해외영업팀',     NULL, '30000002-0000-0000-0000-000000000021',                 2, '/한성전자/영업본부/해외영업팀',                             NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000024', 'a0000001-0000-0000-0000-000000000002', 'SALES_SUPPORT',  '영업지원팀',     NULL, '30000002-0000-0000-0000-000000000021',                 2, '/한성전자/영업본부/영업지원팀',                             NULL, 'ACTIVE',   3, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- 생산본부 hierarchy
('30000002-0000-0000-0000-000000000025', 'a0000001-0000-0000-0000-000000000002', 'PROD_HQ',        '생산본부',       NULL, '30000002-0000-0000-0000-000000000001',                 1, '/한성전자/생산본부',                                       NULL, 'ACTIVE',   4, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000026', 'a0000001-0000-0000-0000-000000000002', 'PROD1',          '생산1팀',        NULL, '30000002-0000-0000-0000-000000000025',                 2, '/한성전자/생산본부/생산1팀',                               NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000027', 'a0000001-0000-0000-0000-000000000002', 'PROD2',          '생산2팀',        NULL, '30000002-0000-0000-0000-000000000025',                 2, '/한성전자/생산본부/생산2팀',                               NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000028', 'a0000001-0000-0000-0000-000000000002', 'QC',             '품질관리팀',     NULL, '30000002-0000-0000-0000-000000000025',                 2, '/한성전자/생산본부/품질관리팀',                             NULL, 'ACTIVE',   3, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- 마케팅본부 hierarchy
('30000002-0000-0000-0000-000000000029', 'a0000001-0000-0000-0000-000000000002', 'MARKETING_HQ',   '마케팅본부',     NULL, '30000002-0000-0000-0000-000000000001',                 1, '/한성전자/마케팅본부',                                     NULL, 'ACTIVE',   5, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000030', 'a0000001-0000-0000-0000-000000000002', 'MARKETING',      '마케팅팀',       NULL, '30000002-0000-0000-0000-000000000029',                 2, '/한성전자/마케팅본부/마케팅팀',                             NULL, 'ACTIVE',   1, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000031', 'a0000001-0000-0000-0000-000000000002', 'DESIGN',         '디자인팀',       NULL, '30000002-0000-0000-0000-000000000029',                 2, '/한성전자/마케팅본부/디자인팀',                             NULL, 'ACTIVE',   2, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000002-0000-0000-0000-000000000032', 'a0000001-0000-0000-0000-000000000002', 'PR',             '홍보팀',         NULL, '30000002-0000-0000-0000-000000000029',                 2, '/한성전자/마케팅본부/홍보팀',                               NULL, 'ACTIVE',   3, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

-- 구조조정부 (INACTIVE)
('30000002-0000-0000-0000-000000000033', 'a0000001-0000-0000-0000-000000000002', 'OLD_DEPT',       '구조조정부',     NULL, '30000002-0000-0000-0000-000000000001',                 1, '/한성전자/구조조정부',                                     NULL, 'INACTIVE', 99, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-3. 한성SDI (tenant 3) - 15개 부서
-- ----------------------------------------------------------------------------

INSERT INTO hr_core.department (id, tenant_id, code, name, name_en, parent_id, level, path, manager_id, status, sort_order, created_at, updated_at, created_by, updated_by)
VALUES
('30000003-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000003', 'SDI_ROOT',        '한성SDI',       NULL, NULL,                                                  0, '/한성SDI',                                   NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'SDI_MGMT',        '경영지원본부',   NULL, '30000003-0000-0000-0000-000000000001',                 1, '/한성SDI/경영지원본부',                       NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'SDI_HR',          '인사팀',         NULL, '30000003-0000-0000-0000-000000000002',                 2, '/한성SDI/경영지원본부/인사팀',                 NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000003', 'SDI_FINANCE',     '재무팀',         NULL, '30000003-0000-0000-0000-000000000002',                 2, '/한성SDI/경영지원본부/재무팀',                 NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003', 'SDI_ADMIN',       '총무팀',         NULL, '30000003-0000-0000-0000-000000000002',                 2, '/한성SDI/경영지원본부/총무팀',                 NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'SDI_RND',         '연구개발본부',   NULL, '30000003-0000-0000-0000-000000000001',                 1, '/한성SDI/연구개발본부',                       NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000003', 'SDI_BATTERY_DEV', '배터리개발팀',   NULL, '30000003-0000-0000-0000-000000000006',                 2, '/한성SDI/연구개발본부/배터리개발팀',           NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000003', 'SDI_MATERIAL',    '소재연구팀',     NULL, '30000003-0000-0000-0000-000000000006',                 2, '/한성SDI/연구개발본부/소재연구팀',             NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000003', 'SDI_TEST',        '시험평가팀',     NULL, '30000003-0000-0000-0000-000000000006',                 2, '/한성SDI/연구개발본부/시험평가팀',             NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000003', 'SDI_PROD',        '생산본부',       NULL, '30000003-0000-0000-0000-000000000001',                 1, '/한성SDI/생산본부',                           NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000003', 'SDI_PROD1',       '생산1팀',        NULL, '30000003-0000-0000-0000-000000000010',                 2, '/한성SDI/생산본부/생산1팀',                   NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000003', 'SDI_PROD2',       '생산2팀',        NULL, '30000003-0000-0000-0000-000000000010',                 2, '/한성SDI/생산본부/생산2팀',                   NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000003', 'SDI_QC',          '품질관리팀',     NULL, '30000003-0000-0000-0000-000000000010',                 2, '/한성SDI/생산본부/품질관리팀',                 NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000003', 'SDI_SALES',       '영업본부',       NULL, '30000003-0000-0000-0000-000000000001',                 1, '/한성SDI/영업본부',                           NULL, 'ACTIVE', 4,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000003-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000003', 'SDI_SALES_TEAM',  '영업팀',         NULL, '30000003-0000-0000-0000-000000000014',                 2, '/한성SDI/영업본부/영업팀',                     NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-4. 한성엔지니어링 (tenant 4) - 10개 부서
-- ----------------------------------------------------------------------------

INSERT INTO hr_core.department (id, tenant_id, code, name, name_en, parent_id, level, path, manager_id, status, sort_order, created_at, updated_at, created_by, updated_by)
VALUES
('30000004-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004', 'ENG_ROOT',        '한성엔지니어링', NULL, NULL,                                                  0, '/한성엔지니어링',                             NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000004-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'ENG_MGMT',        '경영지원팀',     NULL, '30000004-0000-0000-0000-000000000001',                 1, '/한성엔지니어링/경영지원팀',                   NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000004-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'ENG_HR',          '인사팀',         NULL, '30000004-0000-0000-0000-000000000002',                 2, '/한성엔지니어링/경영지원팀/인사팀',             NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000004-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'ENG_CIVIL',       '토목사업본부',   NULL, '30000004-0000-0000-0000-000000000001',                 1, '/한성엔지니어링/토목사업본부',                 NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000004-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000004', 'ENG_CIVIL_TEAM',  '토목설계팀',     NULL, '30000004-0000-0000-0000-000000000004',                 2, '/한성엔지니어링/토목사업본부/토목설계팀',       NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000004-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000004', 'ENG_PLANT',       '플랜트사업본부', NULL, '30000004-0000-0000-0000-000000000001',                 1, '/한성엔지니어링/플랜트사업본부',               NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000004-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 'ENG_PLANT_TEAM',  '플랜트설계팀',   NULL, '30000004-0000-0000-0000-000000000006',                 2, '/한성엔지니어링/플랜트사업본부/플랜트설계팀',   NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000004-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000004', 'ENG_SAFETY',      '안전관리팀',     NULL, '30000004-0000-0000-0000-000000000001',                 1, '/한성엔지니어링/안전관리팀',                   NULL, 'ACTIVE', 4,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000004-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', 'ENG_QC',          '품질관리팀',     NULL, '30000004-0000-0000-0000-000000000001',                 1, '/한성엔지니어링/품질관리팀',                   NULL, 'ACTIVE', 5,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000004-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000004', 'ENG_FIELD',       '현장관리팀',     NULL, '30000004-0000-0000-0000-000000000001',                 1, '/한성엔지니어링/현장관리팀',                   NULL, 'ACTIVE', 6,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-5. 한성바이오 (tenant 5) - 10개 부서
-- ----------------------------------------------------------------------------

INSERT INTO hr_core.department (id, tenant_id, code, name, name_en, parent_id, level, path, manager_id, status, sort_order, created_at, updated_at, created_by, updated_by)
VALUES
('30000005-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000005', 'BIO_ROOT',        '한성바이오',     NULL, NULL,                                                  0, '/한성바이오',                                 NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000005-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000005', 'BIO_MGMT',        '경영지원팀',     NULL, '30000005-0000-0000-0000-000000000001',                 1, '/한성바이오/경영지원팀',                       NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000005-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000005', 'BIO_HR',          '인사팀',         NULL, '30000005-0000-0000-0000-000000000002',                 2, '/한성바이오/경영지원팀/인사팀',                 NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000005-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000005', 'BIO_RND',         '연구개발본부',   NULL, '30000005-0000-0000-0000-000000000001',                 1, '/한성바이오/연구개발본부',                     NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000005-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'BIO_DRUG',        '의약품연구팀',   NULL, '30000005-0000-0000-0000-000000000004',                 2, '/한성바이오/연구개발본부/의약품연구팀',         NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000005-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000005', 'BIO_CLINICAL',    '임상시험팀',     NULL, '30000005-0000-0000-0000-000000000004',                 2, '/한성바이오/연구개발본부/임상시험팀',           NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000005-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000005', 'BIO_PROD',        '생산팀',         NULL, '30000005-0000-0000-0000-000000000001',                 1, '/한성바이오/생산팀',                           NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000005-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000005', 'BIO_QC',          '품질관리팀',     NULL, '30000005-0000-0000-0000-000000000001',                 1, '/한성바이오/품질관리팀',                       NULL, 'ACTIVE', 4,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000005-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000005', 'BIO_RA',          '인허가팀',       NULL, '30000005-0000-0000-0000-000000000001',                 1, '/한성바이오/인허가팀',                         NULL, 'ACTIVE', 5,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000005-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000005', 'BIO_SALES',       '영업팀',         NULL, '30000005-0000-0000-0000-000000000001',                 1, '/한성바이오/영업팀',                           NULL, 'ACTIVE', 6,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-6. 한성화학 (tenant 6) - 10개 부서
-- ----------------------------------------------------------------------------

INSERT INTO hr_core.department (id, tenant_id, code, name, name_en, parent_id, level, path, manager_id, status, sort_order, created_at, updated_at, created_by, updated_by)
VALUES
('30000006-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000006', 'CHEM_ROOT',       '한성화학',       NULL, NULL,                                                  0, '/한성화학',                                   NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000006-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006', 'CHEM_MGMT',       '경영지원팀',     NULL, '30000006-0000-0000-0000-000000000001',                 1, '/한성화학/경영지원팀',                         NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000006-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000006', 'CHEM_HR',         '인사팀',         NULL, '30000006-0000-0000-0000-000000000002',                 2, '/한성화학/경영지원팀/인사팀',                   NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000006-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000006', 'CHEM_RND',        '연구개발본부',   NULL, '30000006-0000-0000-0000-000000000001',                 1, '/한성화학/연구개발본부',                       NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000006-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000006', 'CHEM_MATERIAL',   '소재연구팀',     NULL, '30000006-0000-0000-0000-000000000004',                 2, '/한성화학/연구개발본부/소재연구팀',             NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000006-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000006', 'CHEM_PROCESS',    '공정개발팀',     NULL, '30000006-0000-0000-0000-000000000004',                 2, '/한성화학/연구개발본부/공정개발팀',             NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000006-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000006', 'CHEM_PROD',       '생산본부',       NULL, '30000006-0000-0000-0000-000000000001',                 1, '/한성화학/생산본부',                           NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000006-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000006', 'CHEM_PROD_TEAM',  '생산팀',         NULL, '30000006-0000-0000-0000-000000000007',                 2, '/한성화학/생산본부/생산팀',                     NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000006-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000006', 'CHEM_SAFETY',     '환경안전팀',     NULL, '30000006-0000-0000-0000-000000000001',                 1, '/한성화학/환경안전팀',                         NULL, 'ACTIVE', 4,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000006-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000006', 'CHEM_SALES',      '영업팀',         NULL, '30000006-0000-0000-0000-000000000001',                 1, '/한성화학/영업팀',                             NULL, 'ACTIVE', 5,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-7. 한성IT서비스 (tenant 7) - 10개 부서
-- ----------------------------------------------------------------------------

INSERT INTO hr_core.department (id, tenant_id, code, name, name_en, parent_id, level, path, manager_id, status, sort_order, created_at, updated_at, created_by, updated_by)
VALUES
('30000007-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000007', 'IT_ROOT',         '한성IT서비스',   NULL, NULL,                                                  0, '/한성IT서비스',                               NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000007-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007', 'IT_MGMT',         '경영지원팀',     NULL, '30000007-0000-0000-0000-000000000001',                 1, '/한성IT서비스/경영지원팀',                     NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000007-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000007', 'IT_HR',           '인사팀',         NULL, '30000007-0000-0000-0000-000000000002',                 2, '/한성IT서비스/경영지원팀/인사팀',               NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000007-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000007', 'IT_DEV',          '개발본부',       NULL, '30000007-0000-0000-0000-000000000001',                 1, '/한성IT서비스/개발본부',                       NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000007-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000007', 'IT_DEV1',         'SI개발팀',       NULL, '30000007-0000-0000-0000-000000000004',                 2, '/한성IT서비스/개발본부/SI개발팀',               NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000007-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000007', 'IT_DEV2',         'SM운영팀',       NULL, '30000007-0000-0000-0000-000000000004',                 2, '/한성IT서비스/개발본부/SM운영팀',               NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000007-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000007', 'IT_CLOUD',        '클라우드팀',     NULL, '30000007-0000-0000-0000-000000000004',                 2, '/한성IT서비스/개발본부/클라우드팀',             NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000007-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000007', 'IT_INFRA',        '인프라본부',     NULL, '30000007-0000-0000-0000-000000000001',                 1, '/한성IT서비스/인프라본부',                     NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000007-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000007', 'IT_NETWORK',      '네트워크팀',     NULL, '30000007-0000-0000-0000-000000000008',                 2, '/한성IT서비스/인프라본부/네트워크팀',           NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000007-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000007', 'IT_SECURITY',     '보안팀',         NULL, '30000007-0000-0000-0000-000000000008',                 2, '/한성IT서비스/인프라본부/보안팀',               NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3-8. 한성생명 (tenant 8) - 15개 부서
-- ----------------------------------------------------------------------------

INSERT INTO hr_core.department (id, tenant_id, code, name, name_en, parent_id, level, path, manager_id, status, sort_order, created_at, updated_at, created_by, updated_by)
VALUES
('30000008-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000008', 'LIFE_ROOT',          '한성생명',       NULL, NULL,                                                  0, '/한성생명',                                   NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000008', 'LIFE_MGMT',          '경영지원본부',   NULL, '30000008-0000-0000-0000-000000000001',                 1, '/한성생명/경영지원본부',                       NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000008', 'LIFE_HR',            '인사팀',         NULL, '30000008-0000-0000-0000-000000000002',                 2, '/한성생명/경영지원본부/인사팀',                 NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000008', 'LIFE_FINANCE',       '재무팀',         NULL, '30000008-0000-0000-0000-000000000002',                 2, '/한성생명/경영지원본부/재무팀',                 NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000008', 'LIFE_ADMIN',         '총무팀',         NULL, '30000008-0000-0000-0000-000000000002',                 2, '/한성생명/경영지원본부/총무팀',                 NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000008', 'LIFE_SALES',         '영업본부',       NULL, '30000008-0000-0000-0000-000000000001',                 1, '/한성생명/영업본부',                           NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000008', 'LIFE_SALES1',        '법인영업팀',     NULL, '30000008-0000-0000-0000-000000000006',                 2, '/한성생명/영업본부/법인영업팀',                 NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000008', 'LIFE_SALES2',        '개인영업팀',     NULL, '30000008-0000-0000-0000-000000000006',                 2, '/한성생명/영업본부/개인영업팀',                 NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000008', 'LIFE_CLAIM',         '보상본부',       NULL, '30000008-0000-0000-0000-000000000001',                 1, '/한성생명/보상본부',                           NULL, 'ACTIVE', 3,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000008', 'LIFE_CLAIM_TEAM',    '보상심사팀',     NULL, '30000008-0000-0000-0000-000000000009',                 2, '/한성생명/보상본부/보상심사팀',                 NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000008', 'LIFE_CS',            '고객서비스팀',   NULL, '30000008-0000-0000-0000-000000000009',                 2, '/한성생명/보상본부/고객서비스팀',               NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000008', 'LIFE_ACTUARY',       '보험계리본부',   NULL, '30000008-0000-0000-0000-000000000001',                 1, '/한성생명/보험계리본부',                       NULL, 'ACTIVE', 4,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000008', 'LIFE_ACTUARY_TEAM',  '계리팀',         NULL, '30000008-0000-0000-0000-000000000012',                 2, '/한성생명/보험계리본부/계리팀',                 NULL, 'ACTIVE', 1,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000008', 'LIFE_RISK',          '리스크관리팀',   NULL, '30000008-0000-0000-0000-000000000012',                 2, '/한성생명/보험계리본부/리스크관리팀',           NULL, 'ACTIVE', 2,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('30000008-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000008', 'LIFE_IT',            'IT팀',           NULL, '30000008-0000-0000-0000-000000000001',                 1, '/한성생명/IT팀',                               NULL, 'ACTIVE', 5,  NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (tenant_id, code) DO NOTHING;

COMMIT;

-- ============================================================================
-- 검증: 테넌트별 직급/직책/부서 건수 출력
-- ============================================================================

DO $$
DECLARE
    v_grade_count INT;
    v_position_count INT;
    v_dept_count INT;
    v_tenant_name VARCHAR;
    v_tenant_dept_count INT;
BEGIN
    SELECT COUNT(*) INTO v_grade_count FROM hr_core.grade;
    SELECT COUNT(*) INTO v_position_count FROM hr_core.position;
    SELECT COUNT(*) INTO v_dept_count FROM hr_core.department;

    RAISE NOTICE '============================================';
    RAISE NOTICE '직급 생성 완료: % 건 (8 tenants x 11 grades)', v_grade_count;
    RAISE NOTICE '직책 생성 완료: % 건 (8 tenants x 9 positions)', v_position_count;
    RAISE NOTICE '부서 생성 완료: % 건', v_dept_count;
    RAISE NOTICE '--------------------------------------------';

    FOR v_tenant_name, v_tenant_dept_count IN
        SELECT t.name, COUNT(d.id)
        FROM tenant_common.tenant t
        LEFT JOIN hr_core.department d ON t.id = d.tenant_id
        GROUP BY t.name, t.id
        ORDER BY t.id
    LOOP
        RAISE NOTICE '  [%] 부서: % 건', v_tenant_name, v_tenant_dept_count;
    END LOOP;
    RAISE NOTICE '============================================';
END $$;


-- ================================================
-- [6/13] 05_employees.sql
-- ================================================
-- ============================================================================
-- 05_employees.sql
-- 570 employees across 8 tenants (DETERMINISTIC generator)
-- ============================================================================
-- This file creates:
--   - employee_number_rule  (8 entries, one per tenant)
--   - employee              (6 test accounts + ~564 generated = ~570 total)
--   - employee_affiliation  (1 per employee)
--   - employee_education    (1 per employee)
--   - employee_family       (~60% of employees)
--   - employee_career       (~30% of employees)
--   - employee_certificate  (~35% of employees)
--   - employee_history      (test accounts + ~10%)
--   - employee_change_request (5 for 한성전자)
--   - privacy_access_log    (30 for 한성전자)
--
-- UUID Convention:
--   Employee IDs:  e000000{N}-0000-0000-0000-{SSSS zero-padded to 12}
--   Tenant IDs:    a0000001-0000-0000-0000-00000000000{N}
--   Departments:   looked up by code (gen_random_uuid was used in Step 6)
--
-- Depends on: 01_tenants.sql, 05_organization_grades_positions.sql,
--             06_organization_departments.sql
-- ============================================================================

-- ============================================================================
-- PART 1: Employee Number Rules (8 entries, one per tenant)
-- ============================================================================
BEGIN;

INSERT INTO hr_core.employee_number_rule (
    id, tenant_id, prefix, include_year, year_format, sequence_digits,
    sequence_reset_policy, current_sequence, current_year, separator,
    allow_reuse, is_active, created_at, updated_at, created_by, updated_by
) VALUES
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000001', 'H',  true, 'YYYY', 4, 'YEARLY', 30,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000002', 'E',  true, 'YYYY', 4, 'YEARLY', 200, 2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000003', 'S',  true, 'YYYY', 4, 'YEARLY', 80,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000004', 'EN', true, 'YYYY', 4, 'YEARLY', 50,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000005', 'B',  true, 'YYYY', 4, 'YEARLY', 40,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000006', 'C',  true, 'YYYY', 4, 'YEARLY', 50,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000007', 'IT', true, 'YYYY', 4, 'YEARLY', 40,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000008', 'L',  true, 'YYYY', 4, 'YEARLY', 80,  2026, '-', false, true, NOW(), NOW(), 'system', 'system')
ON CONFLICT (tenant_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- PART 2: Test Accounts (6 explicit INSERTs for 한성전자)
-- ============================================================================
BEGIN;

DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_dept_mgmt UUID;     -- 경영지원본부
    v_dept_hr UUID;        -- 인사팀
    v_dept_dev1 UUID;      -- 개발1팀
BEGIN
    -- Look up department IDs by code (must match 04_organization.sql codes)
    SELECT id INTO v_dept_mgmt FROM hr_core.department WHERE tenant_id = v_tenant_id AND code = 'MGMT_HQ';
    SELECT id INTO v_dept_hr   FROM hr_core.department WHERE tenant_id = v_tenant_id AND code = 'HR_TEAM';
    SELECT id INTO v_dept_dev1 FROM hr_core.department WHERE tenant_id = v_tenant_id AND code = 'DEV1';

    -- Employee 1: CEO (이전자)
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000001', v_tenant_id,
        'E-2024-0001', '이전자', 'Jeonja Lee', 'ceo@hansung-elec.co.kr', '010-1000-0001',
        v_dept_mgmt, 'P01', 'G03',
        '2010-03-02', 'ACTIVE', 'FULL_TIME', NULL, NULL,
        NULL, '1968-03-15',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 2: HR Admin (김인사)
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000002', v_tenant_id,
        'E-2024-0002', '김인사', 'Insa Kim', 'hr.admin@hansung-elec.co.kr', '010-1000-0002',
        v_dept_hr, 'P06', 'G07',
        '2012-09-01', 'ACTIVE', 'FULL_TIME', NULL, NULL,
        NULL, '1975-07-22',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 3: HR Manager (박인사)
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000003', v_tenant_id,
        'E-2024-0003', '박인사', 'Insa Park', 'hr.manager@hansung-elec.co.kr', '010-1000-0003',
        v_dept_hr, 'P07', 'G09',
        '2016-03-02', 'ACTIVE', 'FULL_TIME',
        'e0000002-0000-0000-0000-000000000002', NULL,
        NULL, '1983-11-08',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 4: Dev Manager (정개발)
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000004', v_tenant_id,
        'E-2024-0004', '정개발', 'Gaebal Jung', 'dev.manager@hansung-elec.co.kr', '010-1000-0004',
        v_dept_dev1, 'P06', 'G08',
        '2014-01-02', 'ACTIVE', 'FULL_TIME', NULL, NULL,
        NULL, '1980-09-30',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 5: Dev Senior (강선임) -- February birthday!
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000005', v_tenant_id,
        'E-2024-0005', '강선임', 'Seonim Kang', 'dev.senior@hansung-elec.co.kr', '010-1000-0005',
        v_dept_dev1, 'P08', 'G10',
        '2019-07-01', 'ACTIVE', 'FULL_TIME',
        'e0000002-0000-0000-0000-000000000004', NULL,
        NULL, '1990-02-14',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 6: Dev Staff (조사원) -- February birthday!
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000006', v_tenant_id,
        'E-2024-0006', '조사원', 'Sawon Cho', 'dev.staff@hansung-elec.co.kr', '010-1000-0006',
        v_dept_dev1, 'P09', 'G11',
        '2023-03-02', 'ACTIVE', 'FULL_TIME',
        'e0000002-0000-0000-0000-000000000004', NULL,
        NULL, '1995-02-20',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Create affiliations for all 6 test accounts
    INSERT INTO hr_core.employee_affiliation (id, tenant_id, employee_id, department_id, department_name, position_code, position_name, is_primary, affiliation_type, start_date, is_active, created_at, updated_at, created_by, updated_by)
    VALUES
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000001', v_dept_mgmt, '경영지원본부', 'P01', '대표이사', true, 'PRIMARY', '2010-03-02', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000002', v_dept_hr,   '인사팀',       'P06', '팀장',     true, 'PRIMARY', '2012-09-01', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000003', v_dept_hr,   '인사팀',       'P07', '책임',     true, 'PRIMARY', '2016-03-02', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000004', v_dept_dev1, '개발1팀',      'P06', '팀장',     true, 'PRIMARY', '2014-01-02', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000005', v_dept_dev1, '개발1팀',      'P08', '선임',     true, 'PRIMARY', '2019-07-01', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000006', v_dept_dev1, '개발1팀',      'P09', '팀원',     true, 'PRIMARY', '2023-03-02', true, NOW(), NOW(), 'system', 'system')
    ON CONFLICT (tenant_id, employee_id) WHERE (is_primary = true AND is_active = true) DO NOTHING;

    RAISE NOTICE 'Test accounts created: 6 employees for 한성전자';
END $$;

COMMIT;

-- ============================================================================
-- PART 3: Bulk Employee Generation (DETERMINISTIC PL/pgSQL)
-- ============================================================================
-- Generates ~564 additional employees (570 total - 6 test accounts)
-- Distribution: HD=30, ELEC=200, SDI=80, ENG=50, BIO=40, CHEM=50, IT=40, LIFE=80
-- ============================================================================

DO $$
DECLARE
    -- -------------------------------------------------------------------------
    -- Fixed name arrays (Korean surnames and given names)
    -- -------------------------------------------------------------------------
    v_surnames TEXT[] := ARRAY[
        '김','이','박','최','정','강','조','윤','장','임',
        '한','오','서','신','권','황','안','송','류','전',
        '홍','고','문','양','손','배','백','허','유','남',
        '심','노','하','곽','성','차','주','우','구','민',
        '진','지','채','원','천','방','공','현','탁','마'];

    v_given_names TEXT[] := ARRAY[
        '민준','서준','예준','도윤','시우','주원','하준','지호','지우','준서',
        '건우','현우','도현','수호','유준','정우','승현','준혁','진우','지훈',
        '서연','서윤','지우','하은','하윤','민서','지유','윤서','채원','수아',
        '지민','지아','서현','예은','하린','수빈','소율','다은','예린','나윤',
        '성민','재현','태현','동현','준영','민재','현준','세준','영호','기현',
        '상현','재영','태준','동민','현석','준호','승우','정민','우진','태영',
        '은서','수현','미소','하영','채영','시은','예나','소연','유나','지영',
        '혜진','미영','수정','은지','보라','연주','세라','지은','현정','은영',
        '성훈','재민','태윤','동건','준성','민수','현진','세현','영준','기범',
        '상우','재호','태민','동욱','현기','준수','승민','정현','우석','태웅',
        '은비','수민','미나','하진','채린','시연','예지','소현','유진','지수',
        '혜원','미진','수연','은하','보경','연서','세은','지현','현아','은수',
        '성진','재원','태경','동혁','준범','민혁','현수','세영','영진','기태',
        '상민','재혁','태훈','동준','현우','준기','승호','정환','우현','태식',
        '은채','수진','미래','하늘','채은','시현','예원','소미','유림','지원',
        '혜수','미선','수경','은별','보미','연지','세미','지혜','현주','은정'];

    v_surname_en TEXT[] := ARRAY[
        'Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim',
        'Han','Oh','Seo','Shin','Kwon','Hwang','Ahn','Song','Ryu','Jeon',
        'Hong','Ko','Moon','Yang','Son','Bae','Baek','Heo','Yoo','Nam',
        'Shim','Noh','Ha','Kwak','Sung','Cha','Joo','Woo','Koo','Min',
        'Jin','Ji','Chae','Won','Cheon','Bang','Kong','Hyun','Tak','Ma'];

    v_given_en TEXT[] := ARRAY[
        'Minjun','Seojun','Yejun','Doyun','Siwoo','Juwon','Hajun','Jiho','Jiwoo','Junseo',
        'Gunwoo','Hyunwoo','Dohyun','Suho','Yujun','Jungwoo','Seunghyun','Junhyuk','Jinwoo','Jihoon',
        'Seoyeon','Seoyun','Jiwoo2','Haeun','Hayun','Minseo','Jiyu','Yunseo','Chaewon','Sua',
        'Jimin','Jia','Seohyun','Yeeun','Harin','Subin','Soyul','Daeun','Yerin','Nayun',
        'Sungmin','Jaehyun','Taehyun','Donghyun','Junyoung','Minjae','Hyunjun','Sejun','Youngho','Kihyun',
        'Sanghyun','Jaeyoung','Taejun','Dongmin','Hyunsuk','Junho','Seungwoo','Jungmin','Woojin','Taeyoung',
        'Eunseo','Suhyun','Miso','Hayoung','Chaeyoung','Sieun','Yena','Soyeon','Yuna','Jiyoung',
        'Hyejin','Miyoung','Sujeong','Eunji','Bora','Yeonju','Sera','Jieun','Hyunjeong','Eunyoung',
        'Sunghoon','Jaemin','Taeyun','Donggun','Junsung','Minsoo','Hyunjin','Sehyun','Youngjun','Kibum',
        'Sangwoo','Jaeho','Taemin','Dongwook','Hyungi','Junsoo','Seungmin','Junghyun','Woosuk','Taewoong',
        'Eunbi','Sumin','Mina','Hajin','Chaerin','Siyeon','Yeji','Sohyun','Yujin','Jisoo',
        'Hyewon','Mijin','Sooyeon','Eunha','Bokyung','Yeonseo','Seeun','Jihyun','Hyuna','Eunsoo',
        'Sungjin','Jaewon','Taekyung','Donghyuk','Junbum','Minhyuk','Hyunsoo','Seyoung','Youngjin','Kitae',
        'Sangmin','Jaehyuk','Taehoon','Dongjun','Hyunwoo2','Junki','Seungho','Junghwan','Woohyun','Taesik',
        'Eunchae','Sujin','Mirae','Haneul','Chaeeun','Sihyun','Yewon','Somi','Yurim','Jiwon',
        'Hyesoo','Misun','Sukyung','Eunbyul','Bomi','Yeonji','Semi','Jihye','Hyunju','Eunjeong'];

    v_tenant_id UUID;
    v_emp_id UUID;
    v_dept_ids UUID[];
    v_dept_names TEXT[];
    v_surname TEXT;
    v_given TEXT;
    v_name TEXT;
    v_name_en_val TEXT;
    v_email TEXT;
    v_grade TEXT;
    v_position TEXT;
    v_dept_id UUID;
    v_dept_name TEXT;
    v_dept_idx INT;
    v_hire_year INT;
    v_hire_month INT;
    v_birth_year INT;
    v_birth_month INT;
    v_birth_day INT;
    v_status TEXT;
    v_emp_type TEXT;
    v_name_idx INT;
    v_s_idx INT;
    v_g_idx INT;
    v_total_created INT := 0;
    i INT;

    -- Tenant iteration variables
    v_tnums   INT[]  := ARRAY[1, 2, 3, 4, 5, 6, 7, 8];
    v_prefixes TEXT[] := ARRAY['H', 'E', 'S', 'EN', 'B', 'C', 'IT', 'L'];
    v_counts   INT[]  := ARRAY[30, 200, 80, 50, 40, 50, 40, 80];
    v_starts   INT[]  := ARRAY[1, 7, 1, 1, 1, 1, 1, 1];  -- tenant 2 starts at 7 (6 test accounts)
    v_domains  TEXT[] := ARRAY[
        'hansung-hd.co.kr',
        'hansung-elec.co.kr',
        'hansung-sdi.co.kr',
        'hansung-eng.co.kr',
        'hansung-bio.co.kr',
        'hansung-chem.co.kr',
        'hansung-it.co.kr',
        'hansung-life.co.kr'
    ];

    v_tnum INT;
    v_prefix TEXT;
    v_emp_count INT;
    v_start_seq INT;
    v_domain TEXT;
    v_t_idx INT;

    v_position_name TEXT;
BEGIN
    FOR v_t_idx IN 1..8 LOOP
        v_tnum      := v_tnums[v_t_idx];
        v_prefix    := v_prefixes[v_t_idx];
        v_emp_count := v_counts[v_t_idx];
        v_start_seq := v_starts[v_t_idx];
        v_domain    := v_domains[v_t_idx];
        v_tenant_id := ('a0000001-0000-0000-0000-00000000000' || v_tnum::TEXT)::UUID;

        -- Get leaf department IDs for this tenant (teams where employees belong)
        -- Leaf = departments that are NOT a parent of any other department
        SELECT array_agg(d.id ORDER BY d.sort_order, d.code),
               array_agg(d.name ORDER BY d.sort_order, d.code)
        INTO v_dept_ids, v_dept_names
        FROM hr_core.department d
        WHERE d.tenant_id = v_tenant_id
          AND d.status = 'ACTIVE'
          AND d.id NOT IN (
              SELECT DISTINCT parent_id
              FROM hr_core.department
              WHERE parent_id IS NOT NULL AND tenant_id = v_tenant_id
          );

        -- Fallback: if no leaf departments, use all non-root departments
        IF v_dept_ids IS NULL OR array_length(v_dept_ids, 1) IS NULL THEN
            SELECT array_agg(d.id ORDER BY d.sort_order, d.code),
                   array_agg(d.name ORDER BY d.sort_order, d.code)
            INTO v_dept_ids, v_dept_names
            FROM hr_core.department d
            WHERE d.tenant_id = v_tenant_id AND d.status = 'ACTIVE' AND d.level > 1;
        END IF;

        -- Skip tenant if still no departments
        IF v_dept_ids IS NULL OR array_length(v_dept_ids, 1) IS NULL THEN
            RAISE NOTICE 'Tenant % (%) : no departments found, skipping', v_tnum, v_prefix;
            CONTINUE;
        END IF;

        FOR i IN v_start_seq..v_emp_count LOOP
            -- Deterministic name from arrays
            v_name_idx := ((v_tnum - 1) * 200 + i);
            v_s_idx := 1 + (v_name_idx % array_length(v_surnames, 1));
            v_g_idx := 1 + ((v_name_idx / array_length(v_surnames, 1)) % array_length(v_given_names, 1));
            v_surname := v_surnames[v_s_idx];
            v_given := v_given_names[v_g_idx];
            v_name := v_surname || v_given;
            v_name_en_val := v_given_en[v_g_idx] || ' ' || v_surname_en[v_s_idx];

            -- Deterministic department assignment (round-robin across leaf teams)
            v_dept_idx := 1 + ((i - 1) % array_length(v_dept_ids, 1));
            v_dept_id := v_dept_ids[v_dept_idx];
            v_dept_name := v_dept_names[v_dept_idx];

            -- Grade: pyramid distribution (G01=lowest/most, G11=highest/fewest)
            -- G11: top 1%, G09-G10: 3%, G07-G08: 8%, G05-G06: 12%, G03-G04: 20%, G01-G02: 56%
            IF i <= GREATEST(1, (v_emp_count * 0.01)::INT) THEN
                v_grade := 'G11';    -- 사장
            ELSIF i <= GREATEST(2, (v_emp_count * 0.02)::INT) THEN
                v_grade := 'G09';    -- 전무
            ELSIF i <= GREATEST(3, (v_emp_count * 0.04)::INT) THEN
                v_grade := 'G08';    -- 상무
            ELSIF i <= GREATEST(4, (v_emp_count * 0.08)::INT) THEN
                v_grade := 'G07';    -- 이사
            ELSIF i <= GREATEST(5, (v_emp_count * 0.12)::INT) THEN
                v_grade := 'G06';    -- 부장
            ELSIF i <= GREATEST(6, (v_emp_count * 0.20)::INT) THEN
                v_grade := 'G05';    -- 차장
            ELSIF i <= GREATEST(8, (v_emp_count * 0.32)::INT) THEN
                v_grade := 'G04';    -- 과장
            ELSIF i <= GREATEST(10, (v_emp_count * 0.48)::INT) THEN
                v_grade := 'G03';    -- 대리
            ELSIF i <= GREATEST(12, (v_emp_count * 0.68)::INT) THEN
                v_grade := 'G02';    -- 주임
            ELSE
                v_grade := 'G01';    -- 사원
            END IF;

            -- Position mapped from grade
            CASE v_grade
                WHEN 'G11' THEN v_position := 'P09'; v_position_name := '대표이사';
                WHEN 'G10' THEN v_position := 'P08'; v_position_name := '본부장';
                WHEN 'G09' THEN v_position := 'P08'; v_position_name := '본부장';
                WHEN 'G08' THEN v_position := 'P07'; v_position_name := '실장';
                WHEN 'G07' THEN v_position := 'P07'; v_position_name := '실장';
                WHEN 'G06' THEN v_position := 'P06'; v_position_name := '팀장';
                WHEN 'G05' THEN v_position := 'P05'; v_position_name := '파트장';
                WHEN 'G04' THEN v_position := 'P04'; v_position_name := '수석';
                WHEN 'G03' THEN v_position := 'P03'; v_position_name := '책임';
                WHEN 'G02' THEN v_position := 'P02'; v_position_name := '선임';
                WHEN 'G01' THEN v_position := 'P01'; v_position_name := '팀원';
                ELSE v_position := 'P01'; v_position_name := '팀원';
            END CASE;

            -- Hire date: executives earlier, junior staff later
            CASE v_grade
                WHEN 'G11','G10','G09' THEN v_hire_year := 2005 + (i % 5);
                WHEN 'G08','G07'       THEN v_hire_year := 2010 + (i % 5);
                WHEN 'G06'             THEN v_hire_year := 2012 + (i % 6);
                WHEN 'G05'             THEN v_hire_year := 2015 + (i % 4);
                WHEN 'G04'             THEN v_hire_year := 2017 + (i % 4);
                WHEN 'G03'             THEN v_hire_year := 2019 + (i % 3);
                WHEN 'G02'             THEN v_hire_year := 2021 + (i % 3);
                WHEN 'G01'             THEN v_hire_year := 2023 + (i % 2);
                ELSE                        v_hire_year := 2022;
            END CASE;
            v_hire_month := 1 + ((i * 3) % 12);

            -- Birth year: based on grade
            CASE v_grade
                WHEN 'G11','G10','G09' THEN v_birth_year := 1960 + (i % 10);
                WHEN 'G08','G07'       THEN v_birth_year := 1968 + (i % 8);
                WHEN 'G06'             THEN v_birth_year := 1972 + (i % 8);
                WHEN 'G05'             THEN v_birth_year := 1978 + (i % 7);
                WHEN 'G04'             THEN v_birth_year := 1982 + (i % 6);
                WHEN 'G03'             THEN v_birth_year := 1986 + (i % 5);
                WHEN 'G02'             THEN v_birth_year := 1990 + (i % 4);
                WHEN 'G01'             THEN v_birth_year := 1995 + (i % 3);
                ELSE                        v_birth_year := 1990;
            END CASE;
            v_birth_month := 1 + (i % 12);
            v_birth_day := 1 + (i % 28);

            -- Status: 90% ACTIVE, 5% ON_LEAVE, 5% RESIGNED
            IF i % 20 = 0 THEN
                v_status := 'ON_LEAVE';
            ELSIF i % 20 = 19 THEN
                v_status := 'RESIGNED';
            ELSE
                v_status := 'ACTIVE';
            END IF;

            -- Employment type
            IF i % 15 = 0 THEN
                v_emp_type := 'CONTRACT';
            ELSIF i % 25 = 0 THEN
                v_emp_type := 'INTERN';
            ELSE
                v_emp_type := 'FULL_TIME';
            END IF;

            -- Generate deterministic UUID:  e000000{tnum}-0000-0000-0000-{i padded to 12}
            v_emp_id := ('e000000' || v_tnum || '-0000-0000-0000-' || LPAD(i::TEXT, 12, '0'))::UUID;

            -- Email: deterministic, unique per tenant
            v_email := LOWER(v_surname_en[v_s_idx]) || '.' || LOWER(REPLACE(v_given_en[v_g_idx], ' ', '')) || '.' || i || '@' || v_domain;

            INSERT INTO hr_core.employee (
                id, tenant_id, employee_number, name, name_en, email, mobile,
                department_id, position_code, job_title_code,
                hire_date, resign_date, status, employment_type,
                birth_date,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_emp_id, v_tenant_id,
                v_prefix || '-' || v_hire_year::TEXT || '-' || LPAD(i::TEXT, 4, '0'),
                v_name,
                v_name_en_val,
                v_email,
                '010-' || LPAD((1000 + v_tnum * 100 + (i / 10))::TEXT, 4, '0') || '-' || LPAD(i::TEXT, 4, '0'),
                v_dept_id, v_position, v_grade,
                make_date(v_hire_year, v_hire_month, LEAST(28, 1 + (i % 28))),
                CASE WHEN v_status = 'RESIGNED' THEN make_date(2025, 1 + (i % 12), 15) ELSE NULL END,
                v_status, v_emp_type,
                make_date(v_birth_year, v_birth_month, v_birth_day),
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

            -- Create PRIMARY affiliation for each employee
            INSERT INTO hr_core.employee_affiliation (
                id, tenant_id, employee_id, department_id, department_name,
                position_code, position_name, is_primary, affiliation_type,
                start_date, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_dept_id, v_dept_name,
                v_position, v_position_name,
                true, 'PRIMARY',
                make_date(v_hire_year, v_hire_month, LEAST(28, 1 + (i % 28))),
                v_status != 'RESIGNED',
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            ) ON CONFLICT DO NOTHING;

            v_total_created := v_total_created + 1;
        END LOOP;

        RAISE NOTICE 'Tenant % (%) : % employees created (seq %-%), % leaf departments',
            v_tnum, v_prefix, (v_emp_count - v_start_seq + 1), v_start_seq, v_emp_count,
            array_length(v_dept_ids, 1);
    END LOOP;

    RAISE NOTICE 'Total bulk employees created: %', v_total_created;
END $$;


-- ============================================================================
-- February Birthday Overrides (for 한성전자 dashboard birthday widget)
-- ============================================================================
UPDATE hr_core.employee SET birth_date = '1985-02-05' WHERE id = 'e0000002-0000-0000-0000-000000000010'::UUID;
UPDATE hr_core.employee SET birth_date = '1990-02-10' WHERE id = 'e0000002-0000-0000-0000-000000000020'::UUID;
UPDATE hr_core.employee SET birth_date = '1988-02-15' WHERE id = 'e0000002-0000-0000-0000-000000000030'::UUID;
UPDATE hr_core.employee SET birth_date = '1992-02-18' WHERE id = 'e0000002-0000-0000-0000-000000000040'::UUID;
UPDATE hr_core.employee SET birth_date = '1995-02-22' WHERE id = 'e0000002-0000-0000-0000-000000000050'::UUID;
UPDATE hr_core.employee SET birth_date = '1987-02-08' WHERE id = 'e0000002-0000-0000-0000-000000000060'::UUID;
UPDATE hr_core.employee SET birth_date = '1991-02-27' WHERE id = 'e0000002-0000-0000-0000-000000000070'::UUID;


-- ============================================================================
-- Manager ID Assignment
-- ============================================================================
-- For each leaf department, assign the highest-grade employee as manager of lower ones
DO $$
DECLARE
    v_dept RECORD;
    v_manager_id UUID;
BEGIN
    FOR v_dept IN
        SELECT DISTINCT d.id, d.tenant_id
        FROM hr_core.department d
        JOIN hr_core.employee e ON e.department_id = d.id AND e.tenant_id = d.tenant_id
        WHERE e.status = 'ACTIVE'
    LOOP
        -- Find highest-grade active employee in this department
        SELECT e.id INTO v_manager_id
        FROM hr_core.employee e
        WHERE e.department_id = v_dept.id
          AND e.tenant_id = v_dept.tenant_id
          AND e.status = 'ACTIVE'
        ORDER BY e.job_title_code DESC, e.hire_date ASC
        LIMIT 1;

        IF v_manager_id IS NOT NULL THEN
            -- Set manager_id for all other employees in this department
            UPDATE hr_core.employee
            SET manager_id = v_manager_id
            WHERE department_id = v_dept.id
              AND tenant_id = v_dept.tenant_id
              AND id != v_manager_id
              AND manager_id IS NULL;
        END IF;
    END LOOP;

    RAISE NOTICE 'Manager IDs assigned for all departments';
END $$;


-- ============================================================================
-- PART 4: Employee Details
-- ============================================================================

-- ============================================================================
-- 4.1 Employee Education (for all employees)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_schools TEXT[] := ARRAY[
        '서울대학교','연세대학교','고려대학교','KAIST','포항공대',
        '성균관대학교','한양대학교','중앙대학교','경희대학교','이화여자대학교',
        '숙명여자대학교','서강대학교','부산대학교','경북대학교','전남대학교'];
    v_majors TEXT[] := ARRAY[
        '컴퓨터공학','전자공학','기계공학','화학공학','경영학',
        '경제학','산업공학','신소재공학','생명공학','화학',
        '물리학','수학','통계학','법학','회계학',
        '행정학','심리학','영어영문학','국어국문학','사회학'];
    v_school_types TEXT[] := ARRAY['UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY',
        'UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY',
        'UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY'];
    v_degree TEXT;
    v_school_idx INT;
    v_major_idx INT;
    v_grad_year INT;
    v_seq INT := 0;
BEGIN
    RAISE NOTICE 'Generating employee education records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, job_title_code
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;
        v_grad_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT;

        -- Degree based on grade (job_title_code)
        -- G06+(부장 이상): MASTER or DOCTORATE, G03-G05: BACHELOR, G01-G02: BACHELOR or ASSOCIATE
        IF v_emp.job_title_code >= 'G06' THEN
            IF v_seq % 3 = 0 THEN v_degree := 'DOCTORATE';
            ELSE v_degree := 'MASTER';
            END IF;
        ELSIF v_emp.job_title_code >= 'G03' THEN
            v_degree := 'BACHELOR';
        ELSE
            IF v_seq % 5 = 0 THEN v_degree := 'ASSOCIATE';
            ELSE v_degree := 'BACHELOR';
            END IF;
        END IF;

        -- Deterministic school and major selection
        v_school_idx := 1 + (v_seq % array_length(v_schools, 1));
        v_major_idx := 1 + ((v_seq * 7) % array_length(v_majors, 1));

        INSERT INTO hr_core.employee_education (
            id, employee_id, tenant_id, school_name, school_type, degree, major,
            start_date, end_date, graduation_status, is_verified,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), v_emp.id, v_emp.tenant_id,
            v_schools[v_school_idx],
            'UNIVERSITY',
            v_degree,
            v_majors[v_major_idx],
            make_date(v_grad_year - CASE v_degree WHEN 'DOCTORATE' THEN 9 WHEN 'MASTER' THEN 6 WHEN 'BACHELOR' THEN 4 ELSE 2 END, 3, 2),
            make_date(v_grad_year, 2, 28),
            'GRADUATED',
            CASE WHEN v_seq % 4 = 0 THEN true ELSE false END,
            NOW(), NOW(), 'system', 'system'
        );

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Employee education records created: %', v_count;
END $$;


-- ============================================================================
-- 4.2 Employee Family (for ~60% of employees, 1-3 members each)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_family_count INT;
    v_relation TEXT;
    v_fam_name TEXT;
    v_seq INT := 0;
    v_surnames TEXT[] := ARRAY['김','이','박','최','정','강','조','윤','장','임'];
    v_given_m TEXT[] := ARRAY['민준','서준','도윤','시우','지호'];
    v_given_f TEXT[] := ARRAY['서연','하은','민서','지유','채원'];
BEGIN
    RAISE NOTICE 'Generating employee family records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, birth_date
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~60% of employees get family records
        IF v_seq % 5 IN (0, 1) THEN
            CONTINUE;  -- skip ~40%
        END IF;

        -- Number of family members: 1-3
        v_family_count := 1 + (v_seq % 3);

        FOR f IN 1..v_family_count LOOP
            CASE f
                WHEN 1 THEN
                    v_relation := 'SPOUSE';
                    v_fam_name := v_surnames[1 + (v_seq % array_length(v_surnames, 1))] ||
                                  v_given_f[1 + (v_seq % array_length(v_given_f, 1))];
                WHEN 2 THEN
                    IF v_seq % 2 = 0 THEN
                        v_relation := 'SON';
                        v_fam_name := v_surnames[1 + (v_seq % array_length(v_surnames, 1))] ||
                                      v_given_m[1 + ((v_seq + f) % array_length(v_given_m, 1))];
                    ELSE
                        v_relation := 'DAUGHTER';
                        v_fam_name := v_surnames[1 + (v_seq % array_length(v_surnames, 1))] ||
                                      v_given_f[1 + ((v_seq + f) % array_length(v_given_f, 1))];
                    END IF;
                WHEN 3 THEN
                    IF v_seq % 2 = 0 THEN
                        v_relation := 'FATHER';
                        v_fam_name := v_surnames[1 + (v_seq % array_length(v_surnames, 1))] || '부';
                    ELSE
                        v_relation := 'MOTHER';
                        v_fam_name := v_surnames[1 + ((v_seq + 3) % array_length(v_surnames, 1))] || '모';
                    END IF;
                ELSE
                    v_relation := 'SPOUSE';
                    v_fam_name := '가족';
            END CASE;

            INSERT INTO hr_core.employee_family (
                id, employee_id, tenant_id, relation, name, birth_date, phone,
                is_dependent, occupation, is_cohabiting, remarks,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                v_relation,
                v_fam_name,
                CASE v_relation
                    WHEN 'SPOUSE' THEN
                        COALESCE(v_emp.birth_date, make_date(1985,1,1)) + ((v_seq % 5) - 2) * INTERVAL '1 year'
                    WHEN 'SON' THEN
                        COALESCE(v_emp.hire_date, make_date(2015,1,1)) + (v_seq % 3) * INTERVAL '1 year'
                    WHEN 'DAUGHTER' THEN
                        COALESCE(v_emp.hire_date, make_date(2015,1,1)) + ((v_seq % 3) + 1) * INTERVAL '1 year'
                    WHEN 'FATHER' THEN
                        COALESCE(v_emp.birth_date, make_date(1985,1,1)) - INTERVAL '28 years' - (v_seq % 5) * INTERVAL '1 year'
                    WHEN 'MOTHER' THEN
                        COALESCE(v_emp.birth_date, make_date(1985,1,1)) - INTERVAL '25 years' - (v_seq % 5) * INTERVAL '1 year'
                    ELSE make_date(1990, 1, 1)
                END,
                '010-' || LPAD((2000 + v_seq + f)::TEXT, 4, '0') || '-' || LPAD((v_seq * 3 + f)::TEXT, 4, '0'),
                v_relation IN ('SPOUSE', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER'),
                CASE v_relation
                    WHEN 'SPOUSE' THEN CASE WHEN v_seq % 3 = 0 THEN '회사원' WHEN v_seq % 3 = 1 THEN '교사' ELSE '자영업' END
                    WHEN 'SON' THEN CASE WHEN v_seq % 2 = 0 THEN '학생' ELSE NULL END
                    WHEN 'DAUGHTER' THEN CASE WHEN v_seq % 2 = 0 THEN '학생' ELSE NULL END
                    WHEN 'FATHER' THEN '은퇴'
                    WHEN 'MOTHER' THEN '주부'
                    ELSE NULL
                END,
                v_relation NOT IN ('FATHER', 'MOTHER') OR (v_seq % 3 = 0),
                NULL,
                NOW(), NOW(), 'system', 'system'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Employee family records created: %', v_count;
END $$;


-- ============================================================================
-- 4.3 Employee Career (for ~30% of employees, 1-2 previous jobs)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_career_count INT;
    v_seq INT := 0;
    v_companies TEXT[] := ARRAY[
        '삼성전자','LG전자','SK하이닉스','현대자동차','네이버',
        '카카오','쿠팡','배달의민족','토스','라인'];
    v_departments TEXT[] := ARRAY[
        '개발팀','기획팀','영업팀','마케팅팀','인사팀',
        '재무팀','생산팀','품질팀','연구소','디자인팀'];
    v_positions TEXT[] := ARRAY['사원','주임','대리','과장','차장','부장'];
    v_start_year INT;
    v_end_year INT;
    v_comp_idx INT;
    v_dept_idx INT;
    v_pos_idx INT;
BEGIN
    RAISE NOTICE 'Generating employee career records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, job_title_code
        FROM hr_core.employee
        WHERE job_title_code >= 'G03'  -- 대리 이상만 경력 있을 가능성
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~30% of eligible employees
        IF v_seq % 10 NOT IN (0, 1, 2) THEN
            CONTINUE;
        END IF;

        v_career_count := 1 + (v_seq % 2);  -- 1 or 2 previous jobs
        v_end_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - 1;

        FOR c IN 1..v_career_count LOOP
            v_start_year := v_end_year - 1 - (v_seq % 4);
            v_comp_idx := 1 + ((v_seq + c) % array_length(v_companies, 1));
            v_dept_idx := 1 + ((v_seq * 3 + c) % array_length(v_departments, 1));
            v_pos_idx := LEAST(c, array_length(v_positions, 1));

            INSERT INTO hr_core.employee_career (
                id, employee_id, tenant_id, company_name, department, position,
                start_date, end_date, job_description, resignation_reason, is_verified,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                v_companies[v_comp_idx],
                v_departments[v_dept_idx],
                v_positions[v_pos_idx],
                make_date(v_start_year, 3, 2),
                make_date(v_end_year, LEAST(12, 1 + (v_seq % 12)), 28),
                v_departments[v_dept_idx] || ' 업무 수행',
                CASE WHEN v_seq % 3 = 0 THEN '이직' WHEN v_seq % 3 = 1 THEN '경력개발' ELSE '처우 개선' END,
                CASE WHEN v_seq % 3 = 0 THEN true ELSE false END,
                NOW(), NOW(), 'system', 'system'
            );

            v_end_year := v_start_year - 1;
            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Employee career records created: %', v_count;
END $$;


-- ============================================================================
-- 4.4 Employee Certificate/License (for ~35% of employees, 1-2 certs)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_cert_count INT;
    v_seq INT := 0;
    v_certs TEXT[] := ARRAY[
        '정보처리기사','SQLD','AWS Solutions Architect','PMP','TOEIC 900+',
        '한국사능력검정시험 1급','공인회계사','세무사','노무사','OPIC IH'];
    v_issuers TEXT[] := ARRAY[
        '한국산업인력공단','한국데이터산업진흥원','Amazon Web Services','PMI','ETS',
        '국사편찬위원회','금융감독원','국세청','고용노동부','ACTFL'];
    v_cert_idx INT;
    v_issue_year INT;
BEGIN
    RAISE NOTICE 'Generating employee certificate records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~35% of employees
        IF v_seq % 20 NOT IN (0, 1, 2, 3, 4, 5, 6) THEN
            CONTINUE;
        END IF;

        v_cert_count := 1 + (v_seq % 2);  -- 1 or 2 certs

        FOR c IN 1..v_cert_count LOOP
            v_cert_idx := 1 + ((v_seq + c * 3) % array_length(v_certs, 1));
            v_issue_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - (v_seq % 4);

            INSERT INTO hr_core.employee_certificate (
                id, employee_id, tenant_id,
                certificate_name, issuing_organization,
                issue_date, expiry_date, certificate_number,
                grade, is_verified,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                v_certs[v_cert_idx],
                v_issuers[v_cert_idx],
                make_date(GREATEST(2000, v_issue_year), 1 + (v_seq % 12), 1 + (v_seq % 28)),
                CASE WHEN v_cert_idx IN (3, 4) THEN  -- AWS, PMP expire
                    make_date(GREATEST(2000, v_issue_year) + 3, 12, 31)
                ELSE NULL END,
                'CERT-' || GREATEST(2000, v_issue_year) || '-' || LPAD(v_seq::TEXT, 6, '0'),
                CASE WHEN v_cert_idx = 5 THEN '900점' -- TOEIC
                     WHEN v_cert_idx = 6 THEN '1급'   -- 한국사
                     WHEN v_cert_idx = 10 THEN 'IH'   -- OPIC
                     ELSE NULL END,
                CASE WHEN v_seq % 3 = 0 THEN true ELSE false END,
                NOW(), NOW(), 'system', 'system'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Employee certificate records created: %', v_count;
END $$;


-- ============================================================================
-- 4.5 Employee History (for test accounts + ~10% of employees)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_seq INT := 0;
    v_change_types TEXT[] := ARRAY['HIRE','PROMOTION','TRANSFER','POSITION_CHANGE'];
    v_history_count INT;
    v_hire_year INT;
    v_change_year INT;
BEGIN
    RAISE NOTICE 'Generating employee history records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, name, job_title_code, position_code, department_id
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;
        v_hire_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT;

        -- Test accounts (first 6 for tenant 2) always get history; others ~10%
        IF v_emp.id IN (
            'e0000002-0000-0000-0000-000000000001',
            'e0000002-0000-0000-0000-000000000002',
            'e0000002-0000-0000-0000-000000000003',
            'e0000002-0000-0000-0000-000000000004',
            'e0000002-0000-0000-0000-000000000005',
            'e0000002-0000-0000-0000-000000000006'
        ) THEN
            v_history_count := 3 + (v_seq % 3);  -- 3-5 records for test accounts
        ELSIF v_seq % 10 = 0 THEN
            v_history_count := 2 + (v_seq % 2);  -- 2-3 records for ~10% of employees
        ELSE
            CONTINUE;
        END IF;

        -- Always start with HIRE
        INSERT INTO hr_core.employee_history (
            id, employee_id, tenant_id,
            change_type, field_name, old_value, new_value,
            changed_at, changed_by, change_reason,
            effective_date,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), v_emp.id, v_emp.tenant_id,
            'HIRE', 'status', NULL, 'ACTIVE',
            v_emp.hire_date + TIME '09:00:00', '00000000-0000-0000-0000-000000000000',
            '신규입사',
            v_emp.hire_date,
            NOW(), NOW(), 'system', 'system'
        );
        v_count := v_count + 1;

        -- Additional history records
        FOR h IN 2..v_history_count LOOP
            v_change_year := v_hire_year + h;
            IF v_change_year > 2025 THEN
                v_change_year := 2025;
            END IF;

            CASE (h % 3)
                WHEN 0 THEN  -- PROMOTION
                    INSERT INTO hr_core.employee_history (
                        id, employee_id, tenant_id,
                        change_type, field_name, old_value, new_value,
                        changed_at, changed_by, change_reason,
                        effective_date,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                        'PROMOTION', 'job_title_code',
                        'G' || LPAD(GREATEST(1, SUBSTR(v_emp.job_title_code, 2)::INT - h)::TEXT, 2, '0'),
                        v_emp.job_title_code,
                        make_date(v_change_year, 1, 2) + TIME '09:00:00',
                        '00000000-0000-0000-0000-000000000000',
                        '정기 승진',
                        make_date(v_change_year, 1, 1),
                        NOW(), NOW(), 'system', 'system'
                    );
                WHEN 1 THEN  -- TRANSFER
                    INSERT INTO hr_core.employee_history (
                        id, employee_id, tenant_id,
                        change_type, field_name, old_value, new_value,
                        changed_at, changed_by, change_reason,
                        effective_date,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                        'TRANSFER', 'department_id',
                        NULL, v_emp.department_id::TEXT,
                        make_date(v_change_year, 7, 1) + TIME '09:00:00',
                        '00000000-0000-0000-0000-000000000000',
                        '조직개편에 따른 부서 이동',
                        make_date(v_change_year, 7, 1),
                        NOW(), NOW(), 'system', 'system'
                    );
                WHEN 2 THEN  -- POSITION_CHANGE
                    INSERT INTO hr_core.employee_history (
                        id, employee_id, tenant_id,
                        change_type, field_name, old_value, new_value,
                        changed_at, changed_by, change_reason,
                        effective_date,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                        'POSITION_CHANGE', 'position_code',
                        'P' || LPAD(GREATEST(1, SUBSTR(v_emp.position_code, 2)::INT - 1)::TEXT, 2, '0'),
                        v_emp.position_code,
                        make_date(v_change_year, 4, 1) + TIME '09:00:00',
                        '00000000-0000-0000-0000-000000000000',
                        '직책 변경',
                        make_date(v_change_year, 4, 1),
                        NOW(), NOW(), 'system', 'system'
                    );
                ELSE NULL;
            END CASE;

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Employee history records created: %', v_count;
END $$;


-- ============================================================================
-- 4.6 Employee Change Request (5 for 한성전자 test accounts)
-- ============================================================================
BEGIN;

INSERT INTO hr_core.employee_change_request (
    id, tenant_id, employee_id, field_name, old_value, new_value,
    status, reason,
    created_at, updated_at, created_by, updated_by
) VALUES
    -- PENDING: 조사원 wants to update mobile
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000006',
     'mobile', '010-1000-0006', '010-9876-5432',
     'PENDING', '휴대폰 번호 변경',
     NOW(), NOW(), 'e0000002-0000-0000-0000-000000000006', 'e0000002-0000-0000-0000-000000000006'),
    -- PENDING: 강선임 wants to update email
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000005',
     'email', 'dev.senior@hansung-elec.co.kr', 'kang.seonim@hansung-elec.co.kr',
     'PENDING', '이메일 주소 변경 요청',
     NOW(), NOW(), 'e0000002-0000-0000-0000-000000000005', 'e0000002-0000-0000-0000-000000000005'),
    -- APPROVED: 정개발 updated mobile
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000004',
     'mobile', '010-1000-0004', '010-1111-2222',
     'APPROVED', '번호 변경 완료',
     NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days',
     'e0000002-0000-0000-0000-000000000004', 'e0000002-0000-0000-0000-000000000002'),
    -- APPROVED: 박인사 updated email
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000003',
     'email', 'hr.staff@hansung-elec.co.kr', 'hr.manager@hansung-elec.co.kr',
     'APPROVED', '직무 변경에 따른 이메일 변경',
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days',
     'e0000002-0000-0000-0000-000000000003', 'e0000002-0000-0000-0000-000000000002'),
    -- REJECTED: 조사원 address change rejected
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000006',
     'mobile', '010-1000-0006', '010-0000-0000',
     'REJECTED', '잘못된 번호 형식',
     NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days',
     'e0000002-0000-0000-0000-000000000006', 'e0000002-0000-0000-0000-000000000002');

COMMIT;


-- ============================================================================
-- 4.7 Privacy Access Log (30 records for 한성전자)
-- ============================================================================
BEGIN;

DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_hr_admin_id UUID := 'e0000002-0000-0000-0000-000000000002'; -- 김인사
    v_hr_manager_id UUID := 'e0000002-0000-0000-0000-000000000003'; -- 박인사
    v_target_ids UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000004',
        'e0000002-0000-0000-0000-000000000005',
        'e0000002-0000-0000-0000-000000000006',
        'e0000002-0000-0000-0000-000000000010',
        'e0000002-0000-0000-0000-000000000020',
        'e0000002-0000-0000-0000-000000000030',
        'e0000002-0000-0000-0000-000000000040',
        'e0000002-0000-0000-0000-000000000050',
        'e0000002-0000-0000-0000-000000000060',
        'e0000002-0000-0000-0000-000000000070'
    ];
    v_fields TEXT[] := ARRAY['resident_number', 'mobile', 'address'];
    v_reasons TEXT[] := ARRAY[
        '인사서류 확인',
        '증명서 발급을 위한 조회',
        '연말정산 처리',
        '급여 계산 확인',
        '인사발령 업무 처리'
    ];
    v_ips TEXT[] := ARRAY['192.168.1.10', '192.168.1.11', '10.0.0.50', '10.0.0.51', '172.16.0.100'];
    v_actor_id UUID;
    v_target_id UUID;
BEGIN
    FOR i IN 1..30 LOOP
        -- Alternate between HR admin and HR manager as actors
        IF i % 2 = 0 THEN
            v_actor_id := v_hr_admin_id;
        ELSE
            v_actor_id := v_hr_manager_id;
        END IF;

        v_target_id := v_target_ids[1 + ((i - 1) % array_length(v_target_ids, 1))];

        INSERT INTO hr_core.privacy_access_log (
            id, tenant_id, actor_id, actor_name, employee_id,
            field_name, reason, accessed_at, ip_address, created_at
        ) VALUES (
            gen_random_uuid(),
            v_tenant_id,
            v_actor_id,
            CASE WHEN v_actor_id = v_hr_admin_id THEN '김인사' ELSE '박인사' END,
            v_target_id,
            v_fields[1 + ((i - 1) % array_length(v_fields, 1))],
            v_reasons[1 + ((i - 1) % array_length(v_reasons, 1))],
            NOW() - ((i * 2) || ' hours')::INTERVAL,
            v_ips[1 + ((i - 1) % array_length(v_ips, 1))],
            NOW() - ((i * 2) || ' hours')::INTERVAL
        );
    END LOOP;

    RAISE NOTICE 'Privacy access log records created: 30';
END $$;

COMMIT;


-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
    v_record RECORD;
    v_total INT := 0;
    v_number_rules INT;
    v_affiliations INT;
    v_education INT;
    v_family INT;
    v_career INT;
    v_certificates INT;
    v_history INT;
    v_change_req INT;
    v_privacy_log INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '05_employees.sql Verification';
    RAISE NOTICE '========================================';

    -- Employee counts per tenant
    FOR v_record IN
        SELECT t.name AS tenant_name, COUNT(e.id) AS emp_count
        FROM tenant_common.tenant t
        LEFT JOIN hr_core.employee e ON t.id = e.tenant_id
        WHERE t.code LIKE 'HANSUNG_%'
        GROUP BY t.name, t.id
        ORDER BY emp_count DESC
    LOOP
        RAISE NOTICE '  %-20s: % employees', v_record.tenant_name, v_record.emp_count;
        v_total := v_total + v_record.emp_count;
    END LOOP;

    RAISE NOTICE '  ----------------------------------------';
    RAISE NOTICE '  Total employees     : %', v_total;
    RAISE NOTICE '';

    -- Detail table counts
    SELECT COUNT(*) INTO v_number_rules  FROM hr_core.employee_number_rule;
    SELECT COUNT(*) INTO v_affiliations  FROM hr_core.employee_affiliation;
    SELECT COUNT(*) INTO v_education     FROM hr_core.employee_education;
    SELECT COUNT(*) INTO v_family        FROM hr_core.employee_family;
    SELECT COUNT(*) INTO v_career        FROM hr_core.employee_career;
    SELECT COUNT(*) INTO v_certificates  FROM hr_core.employee_certificate;
    SELECT COUNT(*) INTO v_history       FROM hr_core.employee_history;
    SELECT COUNT(*) INTO v_change_req    FROM hr_core.employee_change_request;
    SELECT COUNT(*) INTO v_privacy_log   FROM hr_core.privacy_access_log;

    RAISE NOTICE '  Number rules        : % (expected: 8)', v_number_rules;
    RAISE NOTICE '  Affiliations        : % (expected: ~570)', v_affiliations;
    RAISE NOTICE '  Education records   : % (expected: ~570)', v_education;
    RAISE NOTICE '  Family records      : % (expected: ~600-1000)', v_family;
    RAISE NOTICE '  Career records      : % (expected: ~70-150)', v_career;
    RAISE NOTICE '  Certificate records : % (expected: ~150-300)', v_certificates;
    RAISE NOTICE '  History records     : % (expected: ~100-200)', v_history;
    RAISE NOTICE '  Change requests     : % (expected: 5)', v_change_req;
    RAISE NOTICE '  Privacy access logs : % (expected: 30)', v_privacy_log;
    RAISE NOTICE '========================================';

    -- Verify test accounts
    RAISE NOTICE '';
    RAISE NOTICE '  Test Account Verification (한성전자):';
    FOR v_record IN
        SELECT employee_number, name, email, position_code, job_title_code, status
        FROM hr_core.employee
        WHERE id IN (
            'e0000002-0000-0000-0000-000000000001',
            'e0000002-0000-0000-0000-000000000002',
            'e0000002-0000-0000-0000-000000000003',
            'e0000002-0000-0000-0000-000000000004',
            'e0000002-0000-0000-0000-000000000005',
            'e0000002-0000-0000-0000-000000000006'
        )
        ORDER BY employee_number
    LOOP
        RAISE NOTICE '    % | % | % | %/%', v_record.employee_number, v_record.name, v_record.email, v_record.position_code, v_record.job_title_code;
    END LOOP;

    -- Verify February birthdays
    RAISE NOTICE '';
    RAISE NOTICE '  February Birthday Employees (한성전자):';
    FOR v_record IN
        SELECT employee_number, name, birth_date
        FROM hr_core.employee
        WHERE tenant_id = 'a0000001-0000-0000-0000-000000000002'
          AND EXTRACT(MONTH FROM birth_date) = 2
        ORDER BY birth_date
    LOOP
        RAISE NOTICE '    % | % | %', v_record.employee_number, v_record.name, v_record.birth_date;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '05_employees.sql completed successfully!';
    RAISE NOTICE '========================================';
END $$;


-- ================================================
-- [7/13] 06_auth.sql
-- ================================================
-- ============================================================================
-- 06_auth.sql
-- Auth 서비스 샘플 데이터: 사용자 계정, 감사 로그, 로그인 이력, 비밀번호 이력
-- ============================================================================
-- 생성 규모:
--   - 사용자 계정: ~31명 (superadmin 1 + 한성전자 6 + 기타 7개 테넌트 x 3)
--   - 비밀번호 이력: ~31건 (사용자당 1건)
--   - 감사 로그: ~300건 (최근 3개월)
--   - 로그인 이력: ~500건 (최근 3개월)
-- UUID Convention:
--   - User IDs:     u000000{N}-0000-0000-0000-00000000{SSSS}
--   - Employee IDs:  e000000{N}-0000-0000-0000-00000000{SSSS}
--   - Tenant IDs:    a0000001-0000-0000-0000-00000000000{N}
-- 의존성:
--   - pgcrypto 확장 (BCrypt 해시 생성)
--   - 05_employee (직원 레코드 선행 생성 필요)
-- ============================================================================

-- RLS 비활성화
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '06_auth.sql - Auth 샘플 데이터 생성 시작';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- PART 1: User Accounts (~31 accounts)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1.1 System Admin (superadmin) - assigned to HANSUNG_HD (holding company)
-- ============================================================================
-- superadmin is assigned to tenant 1 (HANSUNG_HD) but has SUPER_ADMIN role
-- which grants system-wide access across all tenants. No employee_id.

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'a0000001-0000-0000-0000-000000000001', -- HANSUNG_HD
    NULL, -- not an employee
    'superadmin', 'admin@hansung-group.co.kr',
    crypt('Admin@2025!', gen_salt('bf', 4)),
    ARRAY['SUPER_ADMIN'], ARRAY['*'],
    'ACTIVE',
    0, NOW() - interval '2 hours', NOW() - interval '30 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- ============================================================================
-- 1.2 한성전자 (Tenant 2) - 6 Main Test Accounts
-- ============================================================================

-- CEO
INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000002-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000002',
    'e0000002-0000-0000-0000-000000000001',
    'ceo.elec', 'ceo.elec@hansung-elec.co.kr',
    crypt('Ceo@2025!', gen_salt('bf', 4)),
    ARRAY['TENANT_ADMIN'], ARRAY['*'],
    'ACTIVE',
    0, NOW() - interval '1 day 3 hours', NOW() - interval '45 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- HR 관리자
INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000002-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000002',
    'e0000002-0000-0000-0000-000000000002',
    'hr.admin.elec', 'hr.admin.elec@hansung-elec.co.kr',
    crypt('HrAdmin@2025!', gen_salt('bf', 4)),
    ARRAY['HR_MANAGER'],
    ARRAY['employee:*','attendance:*','approval:*','organization:*','recruitment:*','appointment:*','certificate:*'],
    'ACTIVE',
    0, NOW() - interval '4 hours', NOW() - interval '35 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- HR 담당자
INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000002-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000002',
    'e0000002-0000-0000-0000-000000000003',
    'hr.manager.elec', 'hr.manager.elec@hansung-elec.co.kr',
    crypt('HrMgr@2025!', gen_salt('bf', 4)),
    ARRAY['HR_STAFF'],
    ARRAY['employee:read','employee:write','attendance:read','attendance:write','approval:read'],
    'ACTIVE',
    0, NOW() - interval '2 days 6 hours', NOW() - interval '40 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- 개발부서장
INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000002-0000-0000-0000-000000000004',
    'a0000001-0000-0000-0000-000000000002',
    'e0000002-0000-0000-0000-000000000004',
    'dev.manager.elec', 'dev.manager.elec@hansung-elec.co.kr',
    crypt('DevMgr@2025!', gen_salt('bf', 4)),
    ARRAY['DEPT_MANAGER'],
    ARRAY['employee:read','attendance:read','attendance:write','approval:read','approval:write'],
    'ACTIVE',
    0, NOW() - interval '5 hours', NOW() - interval '50 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- 선임 개발자
INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000002-0000-0000-0000-000000000005',
    'a0000001-0000-0000-0000-000000000002',
    'e0000002-0000-0000-0000-000000000005',
    'dev.senior.elec', 'dev.senior.elec@hansung-elec.co.kr',
    crypt('DevSenior@2025!', gen_salt('bf', 4)),
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '3 days 2 hours', NOW() - interval '55 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- 일반 사원
INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000002-0000-0000-0000-000000000006',
    'a0000001-0000-0000-0000-000000000002',
    'e0000002-0000-0000-0000-000000000006',
    'dev.staff.elec', 'dev.staff.elec@hansung-elec.co.kr',
    crypt('DevStaff@2025!', gen_salt('bf', 4)),
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '6 days 1 hour', NOW() - interval '60 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- ============================================================================
-- 1.3 한성홀딩스 (Tenant 1) - 3 accounts
-- ============================================================================

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000001',
    'ceo.hd', 'ceo.hd@hansung-hd.co.kr',
    crypt('Ceo@2025!', gen_salt('bf', 4)),
    ARRAY['TENANT_ADMIN'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '1 day 5 hours', NOW() - interval '32 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000002',
    'hr.admin.hd', 'hr.admin.hd@hansung-hd.co.kr',
    crypt('HrAdmin@2025!', gen_salt('bf', 4)),
    ARRAY['HR_MANAGER'],
    ARRAY['employee:*','attendance:*','approval:*','organization:*','recruitment:*','appointment:*','certificate:*'],
    'ACTIVE',
    0, NOW() - interval '3 hours', NOW() - interval '38 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000001',
    'e0000001-0000-0000-0000-000000000003',
    'staff.hd', 'staff.hd@hansung-hd.co.kr',
    crypt('Staff@2025!', gen_salt('bf', 4)),
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '2 days 4 hours', NOW() - interval '42 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- ============================================================================
-- 1.4 한성SDI (Tenant 3) - 3 accounts
-- ============================================================================

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000003-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000003',
    'e0000003-0000-0000-0000-000000000001',
    'ceo.sdi', 'ceo.sdi@hansung-sdi.co.kr',
    crypt('Ceo@2025!', gen_salt('bf', 4)),
    ARRAY['TENANT_ADMIN'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '2 days 7 hours', NOW() - interval '33 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000003-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000003',
    'e0000003-0000-0000-0000-000000000002',
    'hr.admin.sdi', 'hr.admin.sdi@hansung-sdi.co.kr',
    crypt('HrAdmin@2025!', gen_salt('bf', 4)),
    ARRAY['HR_MANAGER'],
    ARRAY['employee:*','attendance:*','approval:*','organization:*','recruitment:*','appointment:*','certificate:*'],
    'ACTIVE',
    0, NOW() - interval '6 hours', NOW() - interval '36 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000003-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000003',
    'e0000003-0000-0000-0000-000000000003',
    'staff.sdi', 'staff.sdi@hansung-sdi.co.kr',
    crypt('Staff@2025!', gen_salt('bf', 4)),
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '4 days 1 hour', NOW() - interval '44 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- ============================================================================
-- 1.5 한성엔지니어링 (Tenant 4) - 3 accounts
-- ============================================================================

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000004-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000004',
    'e0000004-0000-0000-0000-000000000001',
    'ceo.eng', 'ceo.eng@hansung-eng.co.kr',
    crypt('Ceo@2025!', gen_salt('bf', 4)),
    ARRAY['TENANT_ADMIN'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '3 days 2 hours', NOW() - interval '31 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000004-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000004',
    'e0000004-0000-0000-0000-000000000002',
    'hr.admin.eng', 'hr.admin.eng@hansung-eng.co.kr',
    crypt('HrAdmin@2025!', gen_salt('bf', 4)),
    ARRAY['HR_MANAGER'],
    ARRAY['employee:*','attendance:*','approval:*','organization:*','recruitment:*','appointment:*','certificate:*'],
    'ACTIVE',
    0, NOW() - interval '7 hours', NOW() - interval '39 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000004-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000004',
    'e0000004-0000-0000-0000-000000000003',
    'staff.eng', 'staff.eng@hansung-eng.co.kr',
    crypt('Staff@2025!', gen_salt('bf', 4)),
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '5 days 3 hours', NOW() - interval '47 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- ============================================================================
-- 1.6 한성바이오 (Tenant 5, SUSPENDED) - 3 accounts (INACTIVE)
-- ============================================================================

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000005-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000005',
    'e0000005-0000-0000-0000-000000000001',
    'ceo.bio', 'ceo.bio@hansung-bio.co.kr',
    crypt('Ceo@2025!', gen_salt('bf', 4)),
    ARRAY['TENANT_ADMIN'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'INACTIVE',
    0, NOW() - interval '30 days', NOW() - interval '60 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000005-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000005',
    'e0000005-0000-0000-0000-000000000002',
    'hr.admin.bio', 'hr.admin.bio@hansung-bio.co.kr',
    crypt('HrAdmin@2025!', gen_salt('bf', 4)),
    ARRAY['HR_MANAGER'],
    ARRAY['employee:*','attendance:*','approval:*','organization:*','recruitment:*','appointment:*','certificate:*'],
    'INACTIVE',
    0, NOW() - interval '28 days', NOW() - interval '58 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000005-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000005',
    'e0000005-0000-0000-0000-000000000003',
    'staff.bio', 'staff.bio@hansung-bio.co.kr',
    crypt('Staff@2025!', gen_salt('bf', 4)),
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'INACTIVE',
    0, NOW() - interval '32 days', NOW() - interval '62 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- ============================================================================
-- 1.7 한성화학 (Tenant 6) - 3 accounts
-- ============================================================================

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000006-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000006',
    'e0000006-0000-0000-0000-000000000001',
    'ceo.chem', 'ceo.chem@hansung-chem.co.kr',
    crypt('Ceo@2025!', gen_salt('bf', 4)),
    ARRAY['TENANT_ADMIN'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '1 day 8 hours', NOW() - interval '34 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000006-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000006',
    'e0000006-0000-0000-0000-000000000002',
    'hr.admin.chem', 'hr.admin.chem@hansung-chem.co.kr',
    crypt('HrAdmin@2025!', gen_salt('bf', 4)),
    ARRAY['HR_MANAGER'],
    ARRAY['employee:*','attendance:*','approval:*','organization:*','recruitment:*','appointment:*','certificate:*'],
    'ACTIVE',
    0, NOW() - interval '5 hours', NOW() - interval '37 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000006-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000006',
    'e0000006-0000-0000-0000-000000000003',
    'staff.chem', 'staff.chem@hansung-chem.co.kr',
    crypt('Staff@2025!', gen_salt('bf', 4)),
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '6 days 2 hours', NOW() - interval '49 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- ============================================================================
-- 1.8 한성IT서비스 (Tenant 7) - 3 accounts
-- ============================================================================

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000007-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000007',
    'e0000007-0000-0000-0000-000000000001',
    'ceo.it', 'ceo.it@hansung-it.co.kr',
    crypt('Ceo@2025!', gen_salt('bf', 4)),
    ARRAY['TENANT_ADMIN'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '4 days 6 hours', NOW() - interval '36 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000007-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000007',
    'e0000007-0000-0000-0000-000000000002',
    'hr.admin.it', 'hr.admin.it@hansung-it.co.kr',
    crypt('HrAdmin@2025!', gen_salt('bf', 4)),
    ARRAY['HR_MANAGER'],
    ARRAY['employee:*','attendance:*','approval:*','organization:*','recruitment:*','appointment:*','certificate:*'],
    'ACTIVE',
    0, NOW() - interval '8 hours', NOW() - interval '41 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000007-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000007',
    'e0000007-0000-0000-0000-000000000003',
    'staff.it', 'staff.it@hansung-it.co.kr',
    crypt('Staff@2025!', gen_salt('bf', 4)),
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '2 days 9 hours', NOW() - interval '43 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- ============================================================================
-- 1.9 한성생명 (Tenant 8) - 3 accounts
-- ============================================================================

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000008-0000-0000-0000-000000000001',
    'a0000001-0000-0000-0000-000000000008',
    'e0000008-0000-0000-0000-000000000001',
    'ceo.life', 'ceo.life@hansung-life.co.kr',
    crypt('Ceo@2025!', gen_salt('bf', 4)),
    ARRAY['TENANT_ADMIN'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '5 days 4 hours', NOW() - interval '35 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000008-0000-0000-0000-000000000002',
    'a0000001-0000-0000-0000-000000000008',
    'e0000008-0000-0000-0000-000000000002',
    'hr.admin.life', 'hr.admin.life@hansung-life.co.kr',
    crypt('HrAdmin@2025!', gen_salt('bf', 4)),
    ARRAY['HR_MANAGER'],
    ARRAY['employee:*','attendance:*','approval:*','organization:*','recruitment:*','appointment:*','certificate:*'],
    'ACTIVE',
    0, NOW() - interval '9 hours', NOW() - interval '40 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    failed_login_attempts, last_login_at, password_changed_at,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000008-0000-0000-0000-000000000003',
    'a0000001-0000-0000-0000-000000000008',
    'e0000008-0000-0000-0000-000000000003',
    'staff.life', 'staff.life@hansung-life.co.kr',
    crypt('Staff@2025!', gen_salt('bf', 4)),
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self','attendance:read:self','approval:read:self','approval:write:self'],
    'ACTIVE',
    0, NOW() - interval '3 days 7 hours', NOW() - interval '51 days',
    NOW(), NOW(), 'system', 'system'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

COMMIT;

-- ============================================================================
-- PART 2: Update Employee user_id References
-- ============================================================================

DO $$
DECLARE
    v_updated INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Employee user_id 연결 중...';
    RAISE NOTICE '========================================';

    UPDATE hr_core.employee e
    SET user_id = u.id
    FROM tenant_common.users u
    WHERE u.employee_id = e.id
      AND u.employee_id IS NOT NULL;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RAISE NOTICE '  연결된 직원 수: %', v_updated;
END $$;

-- ============================================================================
-- PART 3: Password History (~31 entries, 1 per user)
-- ============================================================================

DO $$
DECLARE
    v_user RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '비밀번호 이력 생성 중...';
    RAISE NOTICE '========================================';

    FOR v_user IN
        SELECT id, password_hash, created_at
        FROM tenant_common.users
        WHERE id IN (
            '00000000-0000-0000-0000-000000000001',
            '00000001-0000-0000-0000-000000000001',
            '00000001-0000-0000-0000-000000000002',
            '00000001-0000-0000-0000-000000000003',
            '00000002-0000-0000-0000-000000000001',
            '00000002-0000-0000-0000-000000000002',
            '00000002-0000-0000-0000-000000000003',
            '00000002-0000-0000-0000-000000000004',
            '00000002-0000-0000-0000-000000000005',
            '00000002-0000-0000-0000-000000000006',
            '00000003-0000-0000-0000-000000000001',
            '00000003-0000-0000-0000-000000000002',
            '00000003-0000-0000-0000-000000000003',
            '00000004-0000-0000-0000-000000000001',
            '00000004-0000-0000-0000-000000000002',
            '00000004-0000-0000-0000-000000000003',
            '00000005-0000-0000-0000-000000000001',
            '00000005-0000-0000-0000-000000000002',
            '00000005-0000-0000-0000-000000000003',
            '00000006-0000-0000-0000-000000000001',
            '00000006-0000-0000-0000-000000000002',
            '00000006-0000-0000-0000-000000000003',
            '00000007-0000-0000-0000-000000000001',
            '00000007-0000-0000-0000-000000000002',
            '00000007-0000-0000-0000-000000000003',
            '00000008-0000-0000-0000-000000000001',
            '00000008-0000-0000-0000-000000000002',
            '00000008-0000-0000-0000-000000000003'
        )
    LOOP
        INSERT INTO tenant_common.password_history (user_id, password_hash, created_at)
        VALUES (v_user.id, v_user.password_hash, v_user.created_at)
        ON CONFLICT DO NOTHING;

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE '  비밀번호 이력 생성: %건', v_count;
END $$;

-- ============================================================================
-- PART 4: Audit Log (~300 entries, last 3 months)
-- ============================================================================

DO $$
DECLARE
    -- Active tenant IDs (exclude BIO=tenant5 which is SUSPENDED)
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,  -- HD
        'a0000001-0000-0000-0000-000000000002'::UUID,  -- ELEC
        'a0000001-0000-0000-0000-000000000003'::UUID,  -- SDI
        'a0000001-0000-0000-0000-000000000004'::UUID,  -- ENG
        'a0000001-0000-0000-0000-000000000006'::UUID,  -- CHEM
        'a0000001-0000-0000-0000-000000000007'::UUID,  -- IT
        'a0000001-0000-0000-0000-000000000008'::UUID   -- LIFE
    ];

    -- User info arrays aligned with tenant_ids (CEO usernames per tenant)
    v_actor_usernames TEXT[][] := ARRAY[
        ARRAY['ceo.hd',       'hr.admin.hd',   'staff.hd'],
        ARRAY['ceo.elec',     'hr.admin.elec', 'dev.staff.elec'],
        ARRAY['ceo.sdi',      'hr.admin.sdi',  'staff.sdi'],
        ARRAY['ceo.eng',      'hr.admin.eng',  'staff.eng'],
        ARRAY['ceo.chem',     'hr.admin.chem', 'staff.chem'],
        ARRAY['ceo.it',       'hr.admin.it',   'staff.it'],
        ARRAY['ceo.life',     'hr.admin.life', 'staff.life']
    ];

    v_actor_names TEXT[][] := ARRAY[
        ARRAY['김한성', '박인사', '일반직원'],
        ARRAY['이전자', '김인사', '강사원'],
        ARRAY['박배터', '이인사', '일반직원'],
        ARRAY['정건설', '박인사', '일반직원'],
        ARRAY['강화학', '김인사', '일반직원'],
        ARRAY['윤아이티', '박인사', '일반직원'],
        ARRAY['송금융', '이인사', '일반직원']
    ];

    -- Action types and distribution
    v_actions TEXT[] := ARRAY['LOGIN', 'EMPLOYEE_VIEW', 'APPROVAL_ACTION', 'SETTINGS_CHANGE', 'DATA_EXPORT'];
    v_resource_types TEXT[] := ARRAY['USER', 'EMPLOYEE', 'APPROVAL_DOCUMENT', 'SETTINGS', 'DATA_EXPORT'];
    v_descriptions TEXT[] := ARRAY[
        '사용자 로그인 성공',
        '직원 상세 정보 조회',
        '결재 문서 승인 처리',
        '시스템 설정 변경',
        '직원 목록 데이터 내보내기'
    ];

    v_tenant_idx INT;
    v_actor_idx INT;
    v_action_idx INT;
    v_status_val VARCHAR(20);
    v_error_msg TEXT;
    v_created_ts TIMESTAMPTZ;
    v_count INT := 0;
    i INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '감사 로그 생성 중 (~300건)...';
    RAISE NOTICE '========================================';

    FOR i IN 1..300 LOOP
        -- Deterministic tenant selection (modulo)
        v_tenant_idx := 1 + (i % 7);

        -- Deterministic actor selection: modulo 3
        v_actor_idx := 1 + (i % 3);

        -- Action distribution: LOGIN(50%), EMPLOYEE_VIEW(20%), APPROVAL(15%), SETTINGS(10%), EXPORT(5%)
        IF i % 20 = 0 THEN
            v_action_idx := 5;    -- DATA_EXPORT (5%)
        ELSIF i % 10 < 2 THEN
            v_action_idx := 4;    -- SETTINGS_CHANGE (10%)
        ELSIF i % 10 < 5 THEN
            v_action_idx := 3;    -- APPROVAL_ACTION (15%)
        ELSIF i % 10 < 7 THEN
            v_action_idx := 2;    -- EMPLOYEE_VIEW (20%)
        ELSE
            v_action_idx := 1;    -- LOGIN (50%)
        END IF;

        -- Status: 95% SUCCESS, 5% FAILURE
        IF i % 20 = 0 THEN
            v_status_val := 'FAILURE';
            v_error_msg := CASE (i % 3)
                WHEN 0 THEN '권한 부족'
                WHEN 1 THEN '세션 만료'
                ELSE '잘못된 요청'
            END;
        ELSE
            v_status_val := 'SUCCESS';
            v_error_msg := NULL;
        END IF;

        -- Distribute across 3 months (2025-11-11 to 2026-02-11)
        v_created_ts := '2025-11-11'::TIMESTAMPTZ
            + ((i * 92 * 24 * 60 / 300) || ' minutes')::INTERVAL
            + ((i * 7 % 60) || ' minutes')::INTERVAL;

        INSERT INTO tenant_common.audit_log (
            tenant_id, actor_id, actor_name, action,
            resource_type, resource_id, description,
            ip_address, user_agent, status, error_message, created_at
        ) VALUES (
            v_tenant_ids[v_tenant_idx],
            v_actor_usernames[v_tenant_idx][v_actor_idx],
            v_actor_names[v_tenant_idx][v_actor_idx],
            v_actions[v_action_idx],
            v_resource_types[v_action_idx],
            gen_random_uuid()::TEXT,
            v_descriptions[v_action_idx],
            '192.168.1.' || (1 + i % 254),
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            v_status_val,
            v_error_msg,
            v_created_ts
        );

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE '  감사 로그 생성 완료: %건', v_count;
END $$;

-- ============================================================================
-- PART 5: Login History (~500 entries, last 3 months)
-- ============================================================================

DO $$
DECLARE
    -- All user accounts for login history
    v_user_info RECORD;
    v_users TEXT[] := ARRAY[
        'superadmin',
        'ceo.elec', 'hr.admin.elec', 'hr.manager.elec', 'dev.manager.elec', 'dev.senior.elec', 'dev.staff.elec',
        'ceo.hd', 'hr.admin.hd', 'staff.hd',
        'ceo.sdi', 'hr.admin.sdi', 'staff.sdi',
        'ceo.eng', 'hr.admin.eng', 'staff.eng',
        'ceo.bio', 'hr.admin.bio', 'staff.bio',
        'ceo.chem', 'hr.admin.chem', 'staff.chem',
        'ceo.it', 'hr.admin.it', 'staff.it',
        'ceo.life', 'hr.admin.life', 'staff.life'
    ];

    v_tenant_map UUID[] := ARRAY[
        NULL,                                               -- superadmin
        'a0000001-0000-0000-0000-000000000002'::UUID,       -- elec
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000001'::UUID,       -- hd
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,       -- sdi
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,       -- eng
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,       -- bio
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,       -- chem
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,       -- it
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID,       -- life
        'a0000001-0000-0000-0000-000000000008'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];

    v_locations TEXT[] := ARRAY['서울', '수원', '용인', '인천', '울산'];
    v_failure_reasons TEXT[] := ARRAY['INVALID_PASSWORD', 'ACCOUNT_LOCKED', 'SESSION_EXPIRED'];

    v_user_idx INT;
    v_status_val VARCHAR(20);
    v_failure_reason VARCHAR(200);
    v_location VARCHAR(200);
    v_created_ts TIMESTAMPTZ;
    v_count INT := 0;
    i INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '로그인 이력 생성 중 (~500건)...';
    RAISE NOTICE '========================================';

    FOR i IN 1..500 LOOP
        -- Deterministic user selection
        -- Heavily weight toward frequently used accounts (elec accounts = indices 2-7)
        IF i % 5 < 3 THEN
            -- 60% of entries go to 한성전자 accounts (index 2-7)
            v_user_idx := 2 + (i % 6);
        ELSIF i % 5 = 3 THEN
            -- 20% go to superadmin
            v_user_idx := 1;
        ELSE
            -- 20% distributed among other tenants (index 8-28)
            v_user_idx := 8 + (i % 21);
        END IF;

        -- Status: 90% SUCCESS, 10% FAILED
        IF i % 10 = 0 THEN
            v_status_val := 'FAILED';
            v_failure_reason := v_failure_reasons[1 + (i % 3)];
        ELSE
            v_status_val := 'SUCCESS';
            v_failure_reason := NULL;
        END IF;

        -- Location (deterministic)
        v_location := v_locations[1 + (i % 5)];

        -- Distribute across 3 months (2025-11-11 to 2026-02-11)
        v_created_ts := '2025-11-11'::TIMESTAMPTZ
            + ((i * 92 * 24 * 60 / 500) || ' minutes')::INTERVAL
            + ((i * 13 % 60) || ' minutes')::INTERVAL;

        INSERT INTO tenant_common.login_history (
            user_id, tenant_id, login_type, status,
            ip_address, user_agent, location, failure_reason, created_at
        ) VALUES (
            v_users[v_user_idx],
            v_tenant_map[v_user_idx],
            'PASSWORD',
            v_status_val,
            '192.168.1.' || (1 + i % 254),
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            v_location,
            v_failure_reason,
            v_created_ts
        );

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE '  로그인 이력 생성 완료: %건', v_count;
END $$;

-- ============================================================================
-- PART 6: Verification
-- ============================================================================

DO $$
DECLARE
    v_user_count INT;
    v_password_history_count INT;
    v_audit_log_count INT;
    v_login_history_count INT;
    v_tenant_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_user_count
    FROM tenant_common.users
    WHERE id::TEXT LIKE '00000000%';

    SELECT COUNT(*) INTO v_password_history_count
    FROM tenant_common.password_history;

    SELECT COUNT(*) INTO v_audit_log_count
    FROM tenant_common.audit_log;

    SELECT COUNT(*) INTO v_login_history_count
    FROM tenant_common.login_history;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '06_auth.sql 실행 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '사용자 계정:     % 건', v_user_count;
    RAISE NOTICE '비밀번호 이력:   % 건', v_password_history_count;
    RAISE NOTICE '감사 로그:       % 건', v_audit_log_count;
    RAISE NOTICE '로그인 이력:     % 건', v_login_history_count;
    RAISE NOTICE '';

    RAISE NOTICE '-- 테넌트별 사용자 현황 --';
    FOR v_tenant_record IN
        SELECT
            COALESCE(t.name, '시스템(NULL)') AS tenant_name,
            COUNT(u.id) AS user_count
        FROM tenant_common.users u
        LEFT JOIN tenant_common.tenant t ON u.tenant_id = t.id
        WHERE u.id::TEXT LIKE '00000000%'
        GROUP BY t.name
        ORDER BY user_count DESC
    LOOP
        RAISE NOTICE '  %-20s: %명', v_tenant_record.tenant_name, v_tenant_record.user_count;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '-- 테스트 계정 --';
    RAISE NOTICE '  superadmin          / Admin@2025!     (시스템관리자)';
    RAISE NOTICE '  ceo.elec            / Ceo@2025!       (한성전자 CEO)';
    RAISE NOTICE '  hr.admin.elec       / HrAdmin@2025!   (한성전자 HR관리자)';
    RAISE NOTICE '  hr.manager.elec     / HrMgr@2025!     (한성전자 HR담당자)';
    RAISE NOTICE '  dev.manager.elec    / DevMgr@2025!    (한성전자 부서장)';
    RAISE NOTICE '  dev.senior.elec     / DevSenior@2025! (한성전자 선임)';
    RAISE NOTICE '  dev.staff.elec      / DevStaff@2025!  (한성전자 사원)';
    RAISE NOTICE '========================================';
END $$;


-- ================================================
-- [8/13] 07_attendance.sql
-- ================================================
-- ============================================================================
-- 07_attendance.sql
-- Step 7 of 12: Attendance/Leave sample data (holidays, leave balances,
--   attendance records, leave requests, overtime requests)
-- ============================================================================
-- 생성 규모:
--   - 공휴일:       ~296 (37 per tenant x 8 tenants)
--   - 휴가 잔액:    ~1,100+ (active employees x 2 types)
--   - 근태 기록:    ~30,000+ (active employees x ~60 work days)
--   - 휴가 신청:    ~300
--   - 초과근무 신청: ~200
--
-- UUID Convention:
--   Employee IDs:  e000000{N}-0000-0000-0000-{SSSS zero-padded to 12}
--   Tenant IDs:    a0000001-0000-0000-0000-00000000000{N}
--   Department IDs: looked up from hr_core.department
--
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

-- RLS bypass
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '07_attendance.sql - Attendance sample data generation start';
    RAISE NOTICE '========================================';
END $$;


-- ############################################################################
-- PART 1: HOLIDAYS (2025-2026 Korean public holidays + company holidays)
-- ~37 per tenant x 8 tenants = ~296 rows
-- ############################################################################

BEGIN;

DO $$
DECLARE
    v_tenant RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '[1/5] Generating holidays...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant ORDER BY id LOOP

        -- ====================================================================
        -- 2025 Korean Public / National Holidays
        -- ====================================================================
        INSERT INTO hr_attendance.holiday (
            id, tenant_id, holiday_date, name, name_en, holiday_type, is_paid, year,
            created_at, updated_at, created_by, updated_by
        ) VALUES
            -- 신정
            (gen_random_uuid(), v_tenant.id, '2025-01-01', '신정', 'New Year''s Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 설날 연휴 (1/28~1/30)
            (gen_random_uuid(), v_tenant.id, '2025-01-28', '설날 연휴', 'Lunar New Year Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-01-29', '설날', 'Lunar New Year''s Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-01-30', '설날 연휴', 'Lunar New Year Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 삼일절
            (gen_random_uuid(), v_tenant.id, '2025-03-01', '삼일절', 'Independence Movement Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 근로자의 날
            (gen_random_uuid(), v_tenant.id, '2025-05-01', '근로자의 날', 'Labor Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 어린이날
            (gen_random_uuid(), v_tenant.id, '2025-05-05', '어린이날', 'Children''s Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 부처님오신날
            (gen_random_uuid(), v_tenant.id, '2025-05-06', '부처님오신날', 'Buddha''s Birthday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 현충일
            (gen_random_uuid(), v_tenant.id, '2025-06-06', '현충일', 'Memorial Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 광복절
            (gen_random_uuid(), v_tenant.id, '2025-08-15', '광복절', 'Liberation Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 개천절
            (gen_random_uuid(), v_tenant.id, '2025-10-03', '개천절', 'National Foundation Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 추석 연휴 (10/5~10/7 + 대체휴일 10/8)
            (gen_random_uuid(), v_tenant.id, '2025-10-05', '추석 연휴', 'Chuseok Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-10-06', '추석', 'Chuseok', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-10-07', '추석 연휴', 'Chuseok Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-10-08', '추석 대체휴일', 'Chuseok Substitute Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 한글날
            (gen_random_uuid(), v_tenant.id, '2025-10-09', '한글날', 'Hangul Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 크리스마스
            (gen_random_uuid(), v_tenant.id, '2025-12-25', '크리스마스', 'Christmas Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system')
        ON CONFLICT (tenant_id, holiday_date) DO NOTHING;

        -- ====================================================================
        -- 2026 Korean Public / National Holidays
        -- ====================================================================
        INSERT INTO hr_attendance.holiday (
            id, tenant_id, holiday_date, name, name_en, holiday_type, is_paid, year,
            created_at, updated_at, created_by, updated_by
        ) VALUES
            -- 신정
            (gen_random_uuid(), v_tenant.id, '2026-01-01', '신정', 'New Year''s Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 설날 연휴 (2/16~2/18)
            (gen_random_uuid(), v_tenant.id, '2026-02-16', '설날 연휴', 'Lunar New Year Holiday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-02-17', '설날', 'Lunar New Year''s Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-02-18', '설날 연휴', 'Lunar New Year Holiday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 삼일절 + 대체휴일
            (gen_random_uuid(), v_tenant.id, '2026-03-01', '삼일절', 'Independence Movement Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-03-02', '삼일절 대체휴일', 'Independence Movement Day Substitute', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 근로자의 날
            (gen_random_uuid(), v_tenant.id, '2026-05-01', '근로자의 날', 'Labor Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 어린이날
            (gen_random_uuid(), v_tenant.id, '2026-05-05', '어린이날', 'Children''s Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 부처님오신날 + 대체휴일
            (gen_random_uuid(), v_tenant.id, '2026-05-24', '부처님오신날', 'Buddha''s Birthday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-05-25', '부처님오신날 대체휴일', 'Buddha''s Birthday Substitute', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 현충일
            (gen_random_uuid(), v_tenant.id, '2026-06-06', '현충일', 'Memorial Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 광복절
            (gen_random_uuid(), v_tenant.id, '2026-08-15', '광복절', 'Liberation Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 추석 연휴 (9/24~9/26)
            (gen_random_uuid(), v_tenant.id, '2026-09-24', '추석 연휴', 'Chuseok Holiday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-09-25', '추석', 'Chuseok', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-09-26', '추석 연휴', 'Chuseok Holiday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 개천절
            (gen_random_uuid(), v_tenant.id, '2026-10-03', '개천절', 'National Foundation Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 한글날
            (gen_random_uuid(), v_tenant.id, '2026-10-09', '한글날', 'Hangul Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 크리스마스
            (gen_random_uuid(), v_tenant.id, '2026-12-25', '크리스마스', 'Christmas Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system')
        ON CONFLICT (tenant_id, holiday_date) DO NOTHING;

        -- ====================================================================
        -- Company Holidays (창립기념일) - different date per tenant
        -- ====================================================================
        INSERT INTO hr_attendance.holiday (
            id, tenant_id, holiday_date, name, name_en, holiday_type, is_paid, description, year,
            created_at, updated_at, created_by, updated_by
        ) VALUES
            (gen_random_uuid(), v_tenant.id, '2025-03-15', '창립기념일', 'Foundation Day', 'COMPANY', true,
             v_tenant.name || ' 창립기념일', 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-03-15', '창립기념일', 'Foundation Day', 'COMPANY', true,
             v_tenant.name || ' 창립기념일', 2026, NOW(), NOW(), 'system', 'system')
        ON CONFLICT (tenant_id, holiday_date) DO NOTHING;

        v_count := v_count + 37;  -- 17 (2025) + 18 (2026) + 2 (company) = 37

    END LOOP;

    RAISE NOTICE '  Holidays created: % (expected ~296)', v_count;
END $$;

COMMIT;


-- ############################################################################
-- PART 2: LEAVE BALANCES (year 2026, per active employee)
-- ANNUAL + SICK for each active employee
-- Test account overrides for deterministic test data
-- ############################################################################

BEGIN;

DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_years_of_service INT;
    v_annual_total DECIMAL(5,1);
    v_annual_used DECIMAL(5,1);
    v_annual_pending DECIMAL(5,1);
    v_carried_over DECIMAL(5,1);
    v_sick_used DECIMAL(5,1);
    v_seq INT := 0;
BEGIN
    RAISE NOTICE '[2/5] Generating leave balances for 2026...';

    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.hire_date
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        v_seq := v_seq + 1;

        -- Compute years of service as of 2026-02-11
        v_years_of_service := EXTRACT(YEAR FROM AGE('2026-02-11'::DATE, v_emp.hire_date))::INT;

        -- Annual leave total: 1yr->15, 3yr->17, 5yr->20, 10yr->25
        IF v_years_of_service < 1 THEN
            v_annual_total := 11.0;  -- prorated first year
        ELSIF v_years_of_service < 3 THEN
            v_annual_total := 15.0;
        ELSIF v_years_of_service < 5 THEN
            v_annual_total := 17.0;
        ELSIF v_years_of_service < 10 THEN
            v_annual_total := 20.0;
        ELSE
            v_annual_total := 25.0;
        END IF;

        -- Deterministic used/pending based on sequence
        v_annual_used := (v_seq % 6)::DECIMAL(5,1);      -- 0 to 5
        v_annual_pending := CASE WHEN v_seq % 7 = 0 THEN 1.0 ELSE 0.0 END;
        v_carried_over := CASE WHEN v_years_of_service >= 2 THEN LEAST(5.0, (v_seq % 4)::DECIMAL(5,1)) ELSE 0.0 END;

        -- Sick leave used: 0 or 1 deterministic
        v_sick_used := CASE WHEN v_seq % 5 = 0 THEN 1.0 ELSE 0.0 END;

        -- Insert ANNUAL leave balance
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
            v_annual_total + v_carried_over,
            v_annual_used,
            v_annual_pending,
            v_carried_over,
            NOW(), NOW(), 'system', 'system'
        ) ON CONFLICT (tenant_id, employee_id, year, leave_type) DO NOTHING;

        -- Insert SICK leave balance
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
            3.0,
            v_sick_used,
            0.0,
            0.0,
            NOW(), NOW(), 'system', 'system'
        ) ON CONFLICT (tenant_id, employee_id, year, leave_type) DO NOTHING;

        v_count := v_count + 2;
    END LOOP;

    RAISE NOTICE '  Leave balances created: % (expected ~1100+)', v_count;
END $$;

-- ============================================================================
-- Test account leave balance overrides (한성전자)
-- ============================================================================
-- dev.staff.elec: ANNUAL total=15, used=3, pending=1, carried_over=0
UPDATE hr_attendance.leave_balance
SET total_days = 15.0, used_days = 3.0, pending_days = 1.0, carried_over_days = 0.0
WHERE employee_id = 'e0000002-0000-0000-0000-000000000006'
  AND year = 2026 AND leave_type = 'ANNUAL';

-- dev.manager.elec: ANNUAL total=20, used=5, pending=0, carried_over=2
UPDATE hr_attendance.leave_balance
SET total_days = 20.0, used_days = 5.0, pending_days = 0.0, carried_over_days = 2.0
WHERE employee_id = 'e0000002-0000-0000-0000-000000000004'
  AND year = 2026 AND leave_type = 'ANNUAL';

-- hr.admin.elec: ANNUAL total=25, used=7, pending=2, carried_over=3
UPDATE hr_attendance.leave_balance
SET total_days = 25.0, used_days = 7.0, pending_days = 2.0, carried_over_days = 3.0
WHERE employee_id = 'e0000002-0000-0000-0000-000000000002'
  AND year = 2026 AND leave_type = 'ANNUAL';

COMMIT;


-- ############################################################################
-- PART 3: ATTENDANCE RECORDS (~30,000 records)
-- Last 3 months: 2025-11-11 to 2026-02-11
-- Includes: normal work days, anomalies (~8%), today check-in only
-- Plus 52-hour monitoring records for 8 designated 한성전자 employees
-- ############################################################################

BEGIN;

-- ============================================================================
-- 3.1 Main attendance record generator
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_date DATE;
    v_count INT := 0;
    v_status VARCHAR(20);
    v_check_in TIME;
    v_check_out TIME;
    v_late_minutes INT;
    v_early_leave_minutes INT;
    v_overtime_minutes INT;
    v_work_hours INT;
    v_day_of_week INT;
    v_is_holiday BOOLEAN;
    v_tenant_holidays DATE[];
    v_today DATE := '2026-02-11';
    v_start_date DATE := '2025-11-11';
    v_anomaly_seed INT;
    v_minute_offset INT;
BEGIN
    RAISE NOTICE '[3/5] Generating attendance records (2025-11-11 ~ 2026-02-11)...';

    FOR v_emp IN
        SELECT e.id, e.tenant_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        -- Cache holidays for this tenant
        SELECT COALESCE(ARRAY_AGG(holiday_date), ARRAY[]::DATE[])
        INTO v_tenant_holidays
        FROM hr_attendance.holiday
        WHERE tenant_id = v_emp.tenant_id
          AND holiday_date BETWEEN v_start_date AND v_today;

        v_date := v_start_date;

        WHILE v_date <= v_today LOOP
            v_day_of_week := EXTRACT(DOW FROM v_date)::INT;  -- 0=Sun, 6=Sat

            -- Skip weekends
            IF v_day_of_week IN (0, 6) THEN
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- Skip holidays
            v_is_holiday := v_date = ANY(v_tenant_holidays);
            IF v_is_holiday THEN
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- Deterministic anomaly seed based on employee and date
            v_anomaly_seed := (EXTRACT(DOY FROM v_date)::INT * 13 + v_count) % 100;

            -- Default values
            v_late_minutes := 0;
            v_early_leave_minutes := 0;
            v_overtime_minutes := 0;
            v_work_hours := 0;

            -- ================================================================
            -- TODAY: check-in only, no check-out
            -- ================================================================
            IF v_date = v_today THEN
                -- Morning check-in: 08:30 ~ 09:10
                v_minute_offset := (v_count * 7 + 3) % 40;  -- 0-39 minutes offset
                v_check_in := '08:30'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                v_check_out := NULL;

                IF v_check_in > '09:00'::TIME THEN
                    v_status := 'LATE';
                    v_late_minutes := EXTRACT(EPOCH FROM (v_check_in - '09:00'::TIME))::INT / 60;
                ELSE
                    v_status := 'NORMAL';
                END IF;

                INSERT INTO hr_attendance.attendance_record (
                    id, tenant_id, employee_id, work_date,
                    check_in_time, check_out_time,
                    status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                    check_in_location,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(), v_emp.tenant_id, v_emp.id, v_date,
                    v_check_in, NULL,
                    v_status, v_late_minutes, 0, 0, 0,
                    '본사',
                    NOW(), NOW(), 'system', 'system'
                ) ON CONFLICT (tenant_id, employee_id, work_date) DO NOTHING;

                v_count := v_count + 1;
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- ================================================================
            -- PAST DAYS: full check-in/check-out with ~8% anomaly rate
            -- ================================================================
            IF v_anomaly_seed < 3 THEN
                -- ~3%: ABSENT (no check-in, no check-out)
                v_status := 'ABSENT';
                v_check_in := NULL;
                v_check_out := NULL;
                v_work_hours := 0;

            ELSIF v_anomaly_seed < 6 THEN
                -- ~3%: LATE (check-in after 09:10)
                v_minute_offset := 10 + (v_count * 3) % 50;  -- 10-59 min late
                v_check_in := '09:00'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                v_check_out := '18:00'::TIME + (((v_count * 5) % 60) || ' minutes')::INTERVAL;
                v_status := 'LATE';
                v_late_minutes := v_minute_offset;
                v_work_hours := GREATEST(0, EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60);  -- minus 60 min lunch
                v_overtime_minutes := GREATEST(0, v_work_hours - 480);  -- over 8h = 480min
                v_work_hours := v_work_hours;  -- keep in minutes

            ELSIF v_anomaly_seed < 7 THEN
                -- ~1%: EARLY_LEAVE (check-out before 17:30)
                v_minute_offset := (v_count * 7) % 20;
                v_check_in := '08:30'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                v_minute_offset := 30 + (v_count * 11) % 90;  -- leave 30-120 min early
                v_check_out := '17:30'::TIME - (v_minute_offset || ' minutes')::INTERVAL;
                v_status := 'EARLY_LEAVE';
                v_early_leave_minutes := v_minute_offset;
                v_work_hours := GREATEST(0, EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60);
                v_overtime_minutes := 0;

            ELSIF v_anomaly_seed < 8 THEN
                -- ~1%: HALF_DAY (morning or afternoon)
                IF (v_count % 2) = 0 THEN
                    -- Morning half-day
                    v_check_in := '08:30'::TIME + (((v_count * 3) % 15) || ' minutes')::INTERVAL;
                    v_check_out := '13:00'::TIME;
                ELSE
                    -- Afternoon half-day
                    v_check_in := '13:00'::TIME;
                    v_check_out := '18:00'::TIME;
                END IF;
                v_status := 'HALF_DAY';
                v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60;
                v_overtime_minutes := 0;

            ELSE
                -- ~92%: NORMAL
                v_minute_offset := (v_count * 7 + 3) % 40;  -- 0-39 min for check-in (08:30~09:09)
                v_check_in := '08:30'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                -- Check-out: 17:30 ~ 19:00 range
                v_minute_offset := (v_count * 11 + 5) % 90;  -- 0-89 min for check-out (17:30~19:00)
                v_check_out := '17:30'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                v_status := 'NORMAL';
                v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;  -- minus lunch
                v_overtime_minutes := CASE WHEN v_check_out > '18:00'::TIME
                    THEN EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60
                    ELSE 0
                END;
            END IF;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                note,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.tenant_id, v_emp.id, v_date,
                v_check_in, v_check_out,
                v_status,
                v_late_minutes,
                v_early_leave_minutes,
                v_overtime_minutes,
                v_work_hours,
                CASE WHEN v_status = 'ABSENT' THEN NULL ELSE '본사' END,
                CASE WHEN v_status = 'ABSENT' THEN NULL
                     WHEN v_check_out IS NULL THEN NULL
                     ELSE '본사' END,
                CASE v_status
                    WHEN 'ABSENT' THEN '무단결근'
                    WHEN 'LATE' THEN '지각 (' || v_late_minutes || '분)'
                    WHEN 'EARLY_LEAVE' THEN '조퇴 (' || v_early_leave_minutes || '분 일찍)'
                    WHEN 'HALF_DAY' THEN '반차'
                    ELSE NULL
                END,
                NOW(), NOW(), 'system', 'system'
            ) ON CONFLICT (tenant_id, employee_id, work_date) DO NOTHING;

            v_count := v_count + 1;
            v_date := v_date + 1;
        END LOOP;

        IF v_count % 5000 = 0 THEN
            RAISE NOTICE '  Attendance records: % created...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '  Attendance records created: % (expected ~30,000)', v_count;
END $$;

-- ============================================================================
-- 3.2  52-hour monitoring: WARNING employees (5) and EXCEEDED employees (3)
--      Override attendance for 8 specific 한성전자 employees in the current week
--      (2026-02-09 Mon ~ 2026-02-11 Wed = current week so far, plus previous week)
--
--      We use employees from various departments in 한성전자 (tenant 2).
--      Employee IDs chosen from the bulk-generated pool:
--
--      WARNING (45-51h/week) - 5 employees:
--        e0000002-0000-0000-0000-000000000010
--        e0000002-0000-0000-0000-000000000020
--        e0000002-0000-0000-0000-000000000030
--        e0000002-0000-0000-0000-000000000040
--        e0000002-0000-0000-0000-000000000050
--
--      EXCEEDED (52-55h/week) - 3 employees:
--        e0000002-0000-0000-0000-000000000060
--        e0000002-0000-0000-0000-000000000070
--        e0000002-0000-0000-0000-000000000080
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_emp_id UUID;
    v_date DATE;
    v_check_in TIME;
    v_check_out TIME;
    v_overtime_minutes INT;
    v_work_hours INT;
    v_count INT := 0;

    -- WARNING employees (5): extra 2-3 days/week overtime, 45-51h weekly
    v_warning_emps UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000010'::UUID,
        'e0000002-0000-0000-0000-000000000020'::UUID,
        'e0000002-0000-0000-0000-000000000030'::UUID,
        'e0000002-0000-0000-0000-000000000040'::UUID,
        'e0000002-0000-0000-0000-000000000050'::UUID
    ];

    -- EXCEEDED employees (3): overtime every day, 52-55h weekly
    v_exceeded_emps UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000060'::UUID,
        'e0000002-0000-0000-0000-000000000070'::UUID,
        'e0000002-0000-0000-0000-000000000080'::UUID
    ];

    -- Previous week (Mon-Fri) and current week (Mon-Wed) dates
    v_prev_week_dates DATE[] := ARRAY[
        '2026-02-02'::DATE, '2026-02-03'::DATE, '2026-02-04'::DATE,
        '2026-02-05'::DATE, '2026-02-06'::DATE
    ];
    v_curr_week_dates DATE[] := ARRAY[
        '2026-02-09'::DATE, '2026-02-10'::DATE
    ];
    -- Today 2026-02-11 is handled separately (check-in only)

    v_emp_idx INT;
    v_day_idx INT;
BEGIN
    RAISE NOTICE '  Generating 52h monitoring data for 8 한성전자 employees...';

    -- ====================================================================
    -- WARNING employees: 2-3 days/week with overtime (check-out 20:00~21:00)
    -- Rest of days normal (check-out 18:00~18:30)
    -- Weekly total: ~45-51 hours
    -- ====================================================================
    FOR v_emp_idx IN 1..5 LOOP
        v_emp_id := v_warning_emps[v_emp_idx];

        -- Previous week (Mon-Fri)
        FOR v_day_idx IN 1..5 LOOP
            v_date := v_prev_week_dates[v_day_idx];
            v_check_in := '08:30'::TIME + ((v_emp_idx * 3) || ' minutes')::INTERVAL;

            IF v_day_idx <= 2 + (v_emp_idx % 2) THEN
                -- Overtime days: check-out 20:00~21:00
                v_check_out := '20:00'::TIME + ((v_emp_idx * 10 + v_day_idx * 5) % 60 || ' minutes')::INTERVAL;
            ELSE
                -- Normal days: check-out 18:00~18:30
                v_check_out := '18:00'::TIME + ((v_emp_idx * 5 + v_day_idx * 3) % 30 || ' minutes')::INTERVAL;
            END IF;

            v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;
            v_overtime_minutes := GREATEST(0, EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60);

            -- Delete existing record if any, then insert
            DELETE FROM hr_attendance.attendance_record
            WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = v_date;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_date,
                v_check_in, v_check_out,
                'NORMAL', 0, 0, v_overtime_minutes, v_work_hours,
                '본사', '본사',
                NOW(), NOW(), 'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Current week (Mon-Tue): overtime days
        FOR v_day_idx IN 1..2 LOOP
            v_date := v_curr_week_dates[v_day_idx];
            v_check_in := '08:30'::TIME + ((v_emp_idx * 3) || ' minutes')::INTERVAL;
            v_check_out := '20:00'::TIME + ((v_emp_idx * 8 + v_day_idx * 7) % 60 || ' minutes')::INTERVAL;
            v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;
            v_overtime_minutes := GREATEST(0, EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60);

            DELETE FROM hr_attendance.attendance_record
            WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = v_date;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_date,
                v_check_in, v_check_out,
                'NORMAL', 0, 0, v_overtime_minutes, v_work_hours,
                '본사', '본사',
                NOW(), NOW(), 'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Today (check-in only, no check-out)
        DELETE FROM hr_attendance.attendance_record
        WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = '2026-02-11';

        INSERT INTO hr_attendance.attendance_record (
            id, tenant_id, employee_id, work_date,
            check_in_time, check_out_time,
            status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
            check_in_location,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), v_tenant_id, v_emp_id, '2026-02-11',
            '08:30'::TIME + ((v_emp_idx * 3) || ' minutes')::INTERVAL, NULL,
            'NORMAL', 0, 0, 0, 0,
            '본사',
            NOW(), NOW(), 'system', 'system'
        );
        v_count := v_count + 1;
    END LOOP;

    -- ====================================================================
    -- EXCEEDED employees: overtime every day (check-out 21:00~22:00)
    -- Weekly total: 52-55 hours
    -- ====================================================================
    FOR v_emp_idx IN 1..3 LOOP
        v_emp_id := v_exceeded_emps[v_emp_idx];

        -- Previous week (Mon-Fri): heavy overtime every day
        FOR v_day_idx IN 1..5 LOOP
            v_date := v_prev_week_dates[v_day_idx];
            v_check_in := '08:30'::TIME + ((v_emp_idx * 2) || ' minutes')::INTERVAL;
            v_check_out := '21:00'::TIME + ((v_emp_idx * 12 + v_day_idx * 8) % 60 || ' minutes')::INTERVAL;
            v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;
            v_overtime_minutes := EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60;

            DELETE FROM hr_attendance.attendance_record
            WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = v_date;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                note,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_date,
                v_check_in, v_check_out,
                'NORMAL', 0, 0, v_overtime_minutes, v_work_hours,
                '본사', '본사',
                '52시간 초과 주의',
                NOW(), NOW(), 'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Current week (Mon-Tue): heavy overtime
        FOR v_day_idx IN 1..2 LOOP
            v_date := v_curr_week_dates[v_day_idx];
            v_check_in := '08:30'::TIME + ((v_emp_idx * 2) || ' minutes')::INTERVAL;
            v_check_out := '21:30'::TIME + ((v_emp_idx * 10 + v_day_idx * 6) % 30 || ' minutes')::INTERVAL;
            v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;
            v_overtime_minutes := EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60;

            DELETE FROM hr_attendance.attendance_record
            WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = v_date;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                note,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_date,
                v_check_in, v_check_out,
                'NORMAL', 0, 0, v_overtime_minutes, v_work_hours,
                '본사', '본사',
                '52시간 초과 주의',
                NOW(), NOW(), 'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Today (check-in only)
        DELETE FROM hr_attendance.attendance_record
        WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = '2026-02-11';

        INSERT INTO hr_attendance.attendance_record (
            id, tenant_id, employee_id, work_date,
            check_in_time, check_out_time,
            status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
            check_in_location,
            note,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), v_tenant_id, v_emp_id, '2026-02-11',
            '08:30'::TIME + ((v_emp_idx * 2) || ' minutes')::INTERVAL, NULL,
            'NORMAL', 0, 0, 0, 0,
            '본사',
            '52시간 초과 주의',
            NOW(), NOW(), 'system', 'system'
        );
        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE '  52h monitoring override records: %', v_count;
END $$;

COMMIT;


-- ############################################################################
-- PART 4: LEAVE REQUESTS (~300)
-- Mix of statuses: APPROVED (60%), PENDING (20%), REJECTED (10%), DRAFT (10%)
-- Types: ANNUAL (70%), SICK (15%), FAMILY_EVENT (10%), REFRESH (5%)
-- Date range: past 3 months to next 2 weeks
-- ############################################################################

BEGIN;

-- ============================================================================
-- 4.1 Test account leave requests (한성전자)
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_dept_dram UUID;
    v_dept_dram_name TEXT;
    v_dept_hr UUID;
    v_dept_hr_name TEXT;
BEGIN
    RAISE NOTICE '[4/5] Generating leave requests...';

    -- Look up department IDs
    SELECT id, name INTO v_dept_dram, v_dept_dram_name
    FROM hr_core.department
    WHERE tenant_id = v_tenant_id AND code = 'DEV1';

    SELECT id, name INTO v_dept_hr, v_dept_hr_name
    FROM hr_core.department
    WHERE tenant_id = v_tenant_id AND code = 'HR_TEAM';

    -- ====================================================================
    -- dev.staff.elec: 3 requests
    -- ====================================================================
    -- 1) APPROVED past annual leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000006', '조사원',
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-01-15', '2026-01-16', 2.0,
        '개인 사유로 인한 연차 사용', 'APPROVED',
        '2026-01-10'::TIMESTAMPTZ, '2026-01-11'::TIMESTAMPTZ, 'system', 'system'
    );

    -- 2) PENDING future annual leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000006', '조사원',
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-20', '2026-02-20', 1.0,
        '병원 예약으로 인한 연차 신청', 'PENDING',
        NOW(), NOW(), 'system', 'system'
    );

    -- 3) REJECTED sick leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000006', '조사원',
        v_dept_dram, v_dept_dram_name,
        'SICK', '2025-12-22', '2025-12-24', 3.0,
        '감기 증상으로 인한 병가 신청', 'REJECTED',
        '2025-12-20'::TIMESTAMPTZ, '2025-12-21'::TIMESTAMPTZ, 'system', 'system'
    );

    -- ====================================================================
    -- dev.manager.elec: 2 requests
    -- ====================================================================
    -- 1) APPROVED annual leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000004', '정개발',
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-01-06', '2026-01-08', 3.0,
        '가족 여행', 'APPROVED',
        '2025-12-28'::TIMESTAMPTZ, '2025-12-29'::TIMESTAMPTZ, 'system', 'system'
    );

    -- 2) PENDING annual leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000004', '정개발',
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-25', '2026-02-25', 1.0,
        '개인 사유', 'PENDING',
        NOW(), NOW(), 'system', 'system'
    );

    -- ====================================================================
    -- hr.admin.elec: 2 requests
    -- ====================================================================
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000002', '김인사',
        v_dept_hr, v_dept_hr_name,
        'ANNUAL', '2025-12-29', '2025-12-30', 2.0,
        '연말 연차 소진', 'APPROVED',
        '2025-12-20'::TIMESTAMPTZ, '2025-12-22'::TIMESTAMPTZ, 'system', 'system'
    );

    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000002', '김인사',
        v_dept_hr, v_dept_hr_name,
        'FAMILY_EVENT', '2026-02-23', '2026-02-24', 2.0,
        '경조사 (결혼)', 'PENDING',
        NOW(), NOW(), 'system', 'system'
    );

    -- ====================================================================
    -- 개발1팀 (DRAM) members: overlapping APPROVED leaves with today
    -- For dashboard "팀원 휴가 현황"
    -- ====================================================================
    -- Employee 10: on leave today + tomorrow
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000010',
        (SELECT name FROM hr_core.employee WHERE id = 'e0000002-0000-0000-0000-000000000010'),
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-10', '2026-02-12', 3.0,
        '개인 사유', 'APPROVED',
        '2026-02-05'::TIMESTAMPTZ, '2026-02-06'::TIMESTAMPTZ, 'system', 'system'
    );

    -- Employee 20: on leave today only
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000020',
        (SELECT name FROM hr_core.employee WHERE id = 'e0000002-0000-0000-0000-000000000020'),
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-11', '2026-02-11', 1.0,
        '병원 방문', 'APPROVED',
        '2026-02-07'::TIMESTAMPTZ, '2026-02-08'::TIMESTAMPTZ, 'system', 'system'
    );

    -- Employee 30: on leave this week
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000030',
        (SELECT name FROM hr_core.employee WHERE id = 'e0000002-0000-0000-0000-000000000030'),
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-09', '2026-02-13', 5.0,
        '해외여행', 'APPROVED',
        '2026-02-01'::TIMESTAMPTZ, '2026-02-02'::TIMESTAMPTZ, 'system', 'system'
    );

    RAISE NOTICE '  Test account leave requests: 10 created';
END $$;

-- ============================================================================
-- 4.2 Bulk leave request generator (~290 more for all tenants)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_dept_name TEXT;
    v_count INT := 0;
    v_leave_type VARCHAR(30);
    v_start_date DATE;
    v_end_date DATE;
    v_days_count DECIMAL(3,1);
    v_status VARCHAR(20);
    v_reason TEXT;
    v_seq INT := 0;
    v_type_seed INT;
    v_status_seed INT;
    v_date_offset INT;
BEGIN
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~5% of employees generate leave requests in this bulk pass
        -- (test account requests already created above)
        IF v_seq % 20 != 0 THEN
            CONTINUE;
        END IF;

        -- Skip test account employees (already handled)
        IF v_emp.id IN (
            'e0000002-0000-0000-0000-000000000001',
            'e0000002-0000-0000-0000-000000000002',
            'e0000002-0000-0000-0000-000000000003',
            'e0000002-0000-0000-0000-000000000004',
            'e0000002-0000-0000-0000-000000000005',
            'e0000002-0000-0000-0000-000000000006'
        ) THEN
            CONTINUE;
        END IF;

        -- Look up department name
        SELECT name INTO v_dept_name
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        -- Generate 1-3 leave requests per selected employee
        FOR req_num IN 1..LEAST(3, 1 + (v_seq % 3)) LOOP

            -- Leave type: ANNUAL(70%), SICK(15%), FAMILY_EVENT(10%), REFRESH(5%)
            v_type_seed := (v_seq * 7 + req_num * 13) % 100;
            IF v_type_seed < 70 THEN
                v_leave_type := 'ANNUAL';
                v_reason := CASE (v_seq + req_num) % 5
                    WHEN 0 THEN '개인 사유'
                    WHEN 1 THEN '가족 행사'
                    WHEN 2 THEN '여행'
                    WHEN 3 THEN '이사'
                    ELSE '병원 방문'
                END;
            ELSIF v_type_seed < 85 THEN
                v_leave_type := 'SICK';
                v_reason := CASE (v_seq + req_num) % 3
                    WHEN 0 THEN '감기 증상'
                    WHEN 1 THEN '병원 검진'
                    ELSE '몸살'
                END;
            ELSIF v_type_seed < 95 THEN
                v_leave_type := 'FAMILY_EVENT';
                v_reason := CASE (v_seq + req_num) % 3
                    WHEN 0 THEN '결혼식 참석'
                    WHEN 1 THEN '장례식'
                    ELSE '돌잔치'
                END;
            ELSE
                v_leave_type := 'REFRESH';
                v_reason := '리프레시 휴가';
            END IF;

            -- Date: past 3 months to 2 weeks in the future
            v_date_offset := (v_seq * 3 + req_num * 17) % 105 - 14;  -- -14 to +90 days from today
            v_start_date := '2026-02-11'::DATE - (v_date_offset || ' days')::INTERVAL;

            -- Days count
            IF v_leave_type = 'SICK' THEN
                v_days_count := (1 + (v_seq % 3))::DECIMAL(3,1);
            ELSIF v_leave_type = 'FAMILY_EVENT' THEN
                v_days_count := (1 + (v_seq % 2))::DECIMAL(3,1);
            ELSIF v_leave_type = 'REFRESH' THEN
                v_days_count := 5.0;
            ELSE
                v_days_count := (1 + (v_seq + req_num) % 5)::DECIMAL(3,1);
            END IF;
            v_end_date := v_start_date + ((v_days_count - 1)::INT || ' days')::INTERVAL;

            -- Status: APPROVED(60%), PENDING(20%), REJECTED(10%), DRAFT(10%)
            v_status_seed := (v_seq * 11 + req_num * 19) % 100;
            IF v_start_date > '2026-02-11'::DATE THEN
                -- Future requests: mostly PENDING or DRAFT
                IF v_status_seed < 60 THEN v_status := 'PENDING';
                ELSIF v_status_seed < 80 THEN v_status := 'DRAFT';
                ELSIF v_status_seed < 90 THEN v_status := 'APPROVED';
                ELSE v_status := 'REJECTED';
                END IF;
            ELSE
                -- Past requests
                IF v_status_seed < 60 THEN v_status := 'APPROVED';
                ELSIF v_status_seed < 80 THEN v_status := 'PENDING';
                ELSIF v_status_seed < 90 THEN v_status := 'REJECTED';
                ELSE v_status := 'DRAFT';
                END IF;
            END IF;

            INSERT INTO hr_attendance.leave_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                leave_type, start_date, end_date, days_count,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.tenant_id, v_emp.id, v_emp.name,
                v_emp.department_id, v_dept_name,
                v_leave_type, v_start_date, v_end_date, v_days_count,
                v_reason, v_status,
                LEAST(v_start_date - INTERVAL '3 days', NOW()),
                LEAST(v_start_date - INTERVAL '1 day', NOW()),
                'system', 'system'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '  Bulk leave requests created: %', v_count;
END $$;

COMMIT;


-- ############################################################################
-- PART 5: OVERTIME REQUESTS (~200)
-- Status: APPROVED (50%), PENDING (30%), REJECTED (20%)
-- Date range: past 3 months
-- Includes matching overtime requests for 52h monitoring employees
-- ############################################################################

BEGIN;

-- ============================================================================
-- 5.1 Overtime requests for 52-hour monitoring employees
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_emp_id UUID;
    v_emp_name TEXT;
    v_dept_id UUID;
    v_dept_name TEXT;
    v_date DATE;
    v_count INT := 0;

    v_warning_emps UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000010'::UUID,
        'e0000002-0000-0000-0000-000000000020'::UUID,
        'e0000002-0000-0000-0000-000000000030'::UUID,
        'e0000002-0000-0000-0000-000000000040'::UUID,
        'e0000002-0000-0000-0000-000000000050'::UUID
    ];
    v_exceeded_emps UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000060'::UUID,
        'e0000002-0000-0000-0000-000000000070'::UUID,
        'e0000002-0000-0000-0000-000000000080'::UUID
    ];

    v_prev_week_dates DATE[] := ARRAY[
        '2026-02-02'::DATE, '2026-02-03'::DATE, '2026-02-04'::DATE,
        '2026-02-05'::DATE, '2026-02-06'::DATE
    ];
    v_curr_week_dates DATE[] := ARRAY[
        '2026-02-09'::DATE, '2026-02-10'::DATE, '2026-02-11'::DATE
    ];

    v_emp_idx INT;
    v_day_idx INT;
    v_start_time TIME;
    v_end_time TIME;
    v_planned_hours DECIMAL(4,2);
BEGIN
    RAISE NOTICE '[5/5] Generating overtime requests...';
    RAISE NOTICE '  Generating 52h monitoring overtime requests...';

    -- WARNING employees: overtime requests for 2-3 days per week
    FOR v_emp_idx IN 1..5 LOOP
        v_emp_id := v_warning_emps[v_emp_idx];
        SELECT name, department_id INTO v_emp_name, v_dept_id
        FROM hr_core.employee WHERE id = v_emp_id;
        SELECT name INTO v_dept_name FROM hr_core.department WHERE id = v_dept_id;

        -- Previous week: overtime on first 2-3 days
        FOR v_day_idx IN 1..(2 + (v_emp_idx % 2)) LOOP
            v_date := v_prev_week_dates[v_day_idx];
            v_start_time := '18:00'::TIME + ((v_emp_idx * 5) % 30 || ' minutes')::INTERVAL;
            v_end_time := '20:00'::TIME + ((v_emp_idx * 10 + v_day_idx * 5) % 60 || ' minutes')::INTERVAL;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_emp_name,
                v_dept_id, v_dept_name,
                v_date, v_start_time, v_end_time,
                v_start_time, v_end_time,
                v_planned_hours, v_planned_hours,
                '프로젝트 마감 임박', 'APPROVED',
                (v_date - INTERVAL '1 day')::TIMESTAMPTZ,
                v_date::TIMESTAMPTZ,
                'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Current week: overtime requests (APPROVED for past days, PENDING for today)
        FOR v_day_idx IN 1..3 LOOP
            v_date := v_curr_week_dates[v_day_idx];
            v_start_time := '18:00'::TIME + ((v_emp_idx * 5) % 30 || ' minutes')::INTERVAL;
            v_end_time := '20:00'::TIME + ((v_emp_idx * 8 + v_day_idx * 7) % 60 || ' minutes')::INTERVAL;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_emp_name,
                v_dept_id, v_dept_name,
                v_date, v_start_time, v_end_time,
                CASE WHEN v_date < '2026-02-11' THEN v_start_time ELSE NULL END,
                CASE WHEN v_date < '2026-02-11' THEN v_end_time ELSE NULL END,
                v_planned_hours,
                CASE WHEN v_date < '2026-02-11' THEN v_planned_hours ELSE NULL END,
                '프로젝트 마감 임박',
                CASE WHEN v_date < '2026-02-11' THEN 'APPROVED' ELSE 'PENDING' END,
                (v_date - INTERVAL '1 day')::TIMESTAMPTZ,
                CASE WHEN v_date < '2026-02-11' THEN v_date::TIMESTAMPTZ ELSE NOW() END,
                'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    -- EXCEEDED employees: overtime requests every day
    FOR v_emp_idx IN 1..3 LOOP
        v_emp_id := v_exceeded_emps[v_emp_idx];
        SELECT name, department_id INTO v_emp_name, v_dept_id
        FROM hr_core.employee WHERE id = v_emp_id;
        SELECT name INTO v_dept_name FROM hr_core.department WHERE id = v_dept_id;

        -- Previous week: all 5 days
        FOR v_day_idx IN 1..5 LOOP
            v_date := v_prev_week_dates[v_day_idx];
            v_start_time := '18:00'::TIME + ((v_emp_idx * 3) % 20 || ' minutes')::INTERVAL;
            v_end_time := '21:00'::TIME + ((v_emp_idx * 12 + v_day_idx * 8) % 60 || ' minutes')::INTERVAL;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_emp_name,
                v_dept_id, v_dept_name,
                v_date, v_start_time, v_end_time,
                v_start_time, v_end_time,
                v_planned_hours, v_planned_hours,
                '긴급 장애 대응', 'APPROVED',
                (v_date - INTERVAL '1 day')::TIMESTAMPTZ,
                v_date::TIMESTAMPTZ,
                'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Current week: Mon-Wed
        FOR v_day_idx IN 1..3 LOOP
            v_date := v_curr_week_dates[v_day_idx];
            v_start_time := '18:00'::TIME + ((v_emp_idx * 3) % 20 || ' minutes')::INTERVAL;
            v_end_time := '21:30'::TIME + ((v_emp_idx * 10 + v_day_idx * 6) % 30 || ' minutes')::INTERVAL;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_emp_name,
                v_dept_id, v_dept_name,
                v_date, v_start_time, v_end_time,
                CASE WHEN v_date < '2026-02-11' THEN v_start_time ELSE NULL END,
                CASE WHEN v_date < '2026-02-11' THEN v_end_time ELSE NULL END,
                v_planned_hours,
                CASE WHEN v_date < '2026-02-11' THEN v_planned_hours ELSE NULL END,
                '긴급 장애 대응',
                CASE WHEN v_date < '2026-02-11' THEN 'APPROVED' ELSE 'PENDING' END,
                (v_date - INTERVAL '1 day')::TIMESTAMPTZ,
                CASE WHEN v_date < '2026-02-11' THEN v_date::TIMESTAMPTZ ELSE NOW() END,
                'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '  52h monitoring overtime requests: %', v_count;
END $$;

-- ============================================================================
-- 5.2 Bulk overtime request generator (~140 more across all tenants)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_dept_name TEXT;
    v_count INT := 0;
    v_overtime_date DATE;
    v_start_time TIME;
    v_end_time TIME;
    v_planned_hours DECIMAL(4,2);
    v_status VARCHAR(20);
    v_reason TEXT;
    v_seq INT := 0;
    v_status_seed INT;
    v_day_of_week INT;
BEGIN
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~3% of employees get overtime requests in this bulk pass
        IF v_seq % 33 != 0 THEN
            CONTINUE;
        END IF;

        -- Skip 52h monitoring employees (already handled)
        IF v_emp.id IN (
            'e0000002-0000-0000-0000-000000000010',
            'e0000002-0000-0000-0000-000000000020',
            'e0000002-0000-0000-0000-000000000030',
            'e0000002-0000-0000-0000-000000000040',
            'e0000002-0000-0000-0000-000000000050',
            'e0000002-0000-0000-0000-000000000060',
            'e0000002-0000-0000-0000-000000000070',
            'e0000002-0000-0000-0000-000000000080'
        ) THEN
            CONTINUE;
        END IF;

        -- Department name
        SELECT name INTO v_dept_name
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        -- Generate 1-3 overtime requests
        FOR req_num IN 1..LEAST(3, 1 + (v_seq % 3)) LOOP
            -- Date within past 3 months (weekdays only)
            v_overtime_date := '2026-02-11'::DATE - ((v_seq * 3 + req_num * 11) % 90 || ' days')::INTERVAL;
            v_day_of_week := EXTRACT(DOW FROM v_overtime_date)::INT;
            IF v_day_of_week IN (0, 6) THEN
                v_overtime_date := v_overtime_date + CASE WHEN v_day_of_week = 0 THEN 1 ELSE 2 END;
            END IF;

            -- Time: start 18:00-19:00, end 20:00-22:00
            v_start_time := '18:00'::TIME + (((v_seq + req_num) * 5) % 60 || ' minutes')::INTERVAL;
            v_end_time := '20:00'::TIME + (((v_seq + req_num) * 11) % 120 || ' minutes')::INTERVAL;
            IF v_end_time <= v_start_time THEN
                v_end_time := v_start_time + INTERVAL '2 hours';
            END IF;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            -- Status: APPROVED(50%), PENDING(30%), REJECTED(20%)
            v_status_seed := (v_seq * 7 + req_num * 13) % 100;
            IF v_status_seed < 50 THEN v_status := 'APPROVED';
            ELSIF v_status_seed < 80 THEN v_status := 'PENDING';
            ELSE v_status := 'REJECTED';
            END IF;

            -- Reason
            v_reason := CASE (v_seq + req_num) % 5
                WHEN 0 THEN '프로젝트 마감'
                WHEN 1 THEN '긴급 업무 처리'
                WHEN 2 THEN '고객 대응'
                WHEN 3 THEN '시스템 배포'
                ELSE '보고서 작성'
            END;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.tenant_id, v_emp.id, v_emp.name,
                v_emp.department_id, v_dept_name,
                v_overtime_date, v_start_time, v_end_time,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < '2026-02-11' THEN v_start_time ELSE NULL END,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < '2026-02-11' THEN v_end_time ELSE NULL END,
                v_planned_hours,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < '2026-02-11' THEN v_planned_hours ELSE NULL END,
                v_reason,
                v_status,
                LEAST(v_overtime_date::TIMESTAMPTZ - INTERVAL '1 day', NOW()),
                LEAST(v_overtime_date::TIMESTAMPTZ, NOW()),
                'system', 'system'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '  Bulk overtime requests created: %', v_count;
END $$;

COMMIT;


-- ############################################################################
-- VERIFICATION
-- ############################################################################

DO $$
DECLARE
    v_holidays INT;
    v_leave_balances INT;
    v_attendance_records INT;
    v_leave_requests INT;
    v_overtime_requests INT;
    v_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_holidays FROM hr_attendance.holiday;
    SELECT COUNT(*) INTO v_leave_balances FROM hr_attendance.leave_balance;
    SELECT COUNT(*) INTO v_attendance_records FROM hr_attendance.attendance_record;
    SELECT COUNT(*) INTO v_leave_requests FROM hr_attendance.leave_request;
    SELECT COUNT(*) INTO v_overtime_requests FROM hr_attendance.overtime_request;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '07_attendance.sql Verification';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  Holidays:           % (expected ~296)', v_holidays;
    RAISE NOTICE '  Leave balances:     % (expected ~1,100+)', v_leave_balances;
    RAISE NOTICE '  Attendance records: % (expected ~30,000)', v_attendance_records;
    RAISE NOTICE '  Leave requests:     % (expected ~300)', v_leave_requests;
    RAISE NOTICE '  Overtime requests:  % (expected ~200)', v_overtime_requests;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Attendance breakdown by status
    RAISE NOTICE '  Attendance by status:';
    FOR v_record IN
        SELECT status, COUNT(*) AS cnt
        FROM hr_attendance.attendance_record
        GROUP BY status
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '    %-15s: %', v_record.status, v_record.cnt;
    END LOOP;

    RAISE NOTICE '';

    -- Monthly attendance breakdown
    RAISE NOTICE '  Attendance by month:';
    FOR v_record IN
        SELECT TO_CHAR(work_date, 'YYYY-MM') AS month,
               COUNT(*) AS cnt,
               COUNT(DISTINCT employee_id) AS emp_cnt
        FROM hr_attendance.attendance_record
        GROUP BY TO_CHAR(work_date, 'YYYY-MM')
        ORDER BY month
    LOOP
        RAISE NOTICE '    %: % records (% employees)', v_record.month, v_record.cnt, v_record.emp_cnt;
    END LOOP;

    RAISE NOTICE '';

    -- Leave request breakdown by status
    RAISE NOTICE '  Leave requests by status:';
    FOR v_record IN
        SELECT status, COUNT(*) AS cnt
        FROM hr_attendance.leave_request
        GROUP BY status
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '    %-10s: %', v_record.status, v_record.cnt;
    END LOOP;

    RAISE NOTICE '';

    -- Overtime request breakdown by status
    RAISE NOTICE '  Overtime requests by status:';
    FOR v_record IN
        SELECT status, COUNT(*) AS cnt
        FROM hr_attendance.overtime_request
        GROUP BY status
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '    %-10s: %', v_record.status, v_record.cnt;
    END LOOP;

    RAISE NOTICE '';

    -- Test account leave balance verification
    RAISE NOTICE '  Test account leave balances (한성전자, 2026 ANNUAL):';
    FOR v_record IN
        SELECT e.name,
               lb.total_days,
               lb.used_days,
               lb.pending_days,
               (lb.total_days - lb.used_days - lb.pending_days)::DECIMAL(5,1) AS remaining
        FROM hr_attendance.leave_balance lb
        JOIN hr_core.employee e ON lb.employee_id = e.id
        WHERE lb.employee_id IN (
            'e0000002-0000-0000-0000-000000000002',
            'e0000002-0000-0000-0000-000000000004',
            'e0000002-0000-0000-0000-000000000006'
        )
        AND lb.year = 2026
        AND lb.leave_type = 'ANNUAL'
        ORDER BY e.name
    LOOP
        RAISE NOTICE '    %: total=%, used=%, pending=%, remaining=%',
            v_record.name, v_record.total_days, v_record.used_days,
            v_record.pending_days, v_record.remaining;
    END LOOP;

    RAISE NOTICE '';

    -- 52h monitoring verification
    RAISE NOTICE '  52h monitoring - weekly work hours (2026-02-02 ~ 2026-02-06):';
    FOR v_record IN
        SELECT e.name,
               SUM(ar.work_hours) AS total_minutes,
               ROUND(SUM(ar.work_hours)::DECIMAL / 60, 1) AS total_hours
        FROM hr_attendance.attendance_record ar
        JOIN hr_core.employee e ON ar.employee_id = e.id
        WHERE ar.employee_id IN (
            'e0000002-0000-0000-0000-000000000010',
            'e0000002-0000-0000-0000-000000000020',
            'e0000002-0000-0000-0000-000000000030',
            'e0000002-0000-0000-0000-000000000040',
            'e0000002-0000-0000-0000-000000000050',
            'e0000002-0000-0000-0000-000000000060',
            'e0000002-0000-0000-0000-000000000070',
            'e0000002-0000-0000-0000-000000000080'
        )
        AND ar.work_date BETWEEN '2026-02-02' AND '2026-02-06'
        GROUP BY e.name, ar.employee_id
        ORDER BY total_minutes DESC
    LOOP
        RAISE NOTICE '    %: % min (%.1f hours)', v_record.name, v_record.total_minutes, v_record.total_hours;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '07_attendance.sql completed successfully!';
    RAISE NOTICE '========================================';
END $$;


-- ================================================
-- [9/13] 08_approvals.sql
-- ================================================
-- ============================================================================
-- 08_approvals.sql
-- 전자결재 샘플 데이터
-- ============================================================================
-- Tables:
--   approval_template (64), approval_template_line (~192)
--   approval_document (~250), approval_line (~400), approval_history (~350)
--   delegation_rule (2), arbitrary_approval_rule (4)
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

BEGIN;

-- ============================================================================
-- PART 1: Approval Templates (8 types × 8 tenants = 64)
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_template_codes TEXT[] := ARRAY['LEAVE','OVERTIME','BUSINESS_TRIP','PURCHASE','EXPENSE','HR_CHANGE','APPOINTMENT','GENERAL'];
    v_template_names TEXT[] := ARRAY['휴가신청서','초과근무신청서','출장신청서','구매신청서','경비정산서','인사변경신청서','발령신청서','일반업무기안서'];
    v_approver_types TEXT[] := ARRAY['DIRECT_MANAGER','DEPARTMENT_HEAD','HR_MANAGER'];
    v_line_descs TEXT[] := ARRAY['직속 상관 승인','부서장/본부장 승인','인사팀장 최종 승인'];
    v_template_id UUID;
    i INT; j INT; k INT;
BEGIN
    FOR i IN 1..array_length(v_tenant_ids, 1) LOOP
        FOR j IN 1..array_length(v_template_codes, 1) LOOP
            v_template_id := ('b' || LPAD(i::TEXT, 7, '0') || '-0000-0000-0000-' || LPAD(j::TEXT, 12, '0'))::UUID;

            INSERT INTO hr_approval.approval_template (
                id, tenant_id, code, name, document_type, description,
                is_active, sort_order, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_template_id, v_tenant_ids[i], v_template_codes[j], v_template_names[j],
                v_template_codes[j], v_template_names[j] || ' 결재 템플릿',
                true, j, NOW(), NOW(), 'system', 'system'
            ) ON CONFLICT (tenant_id, code) DO NOTHING;

            FOR k IN 1..3 LOOP
                INSERT INTO hr_approval.approval_template_line (
                    id, template_id, sequence, line_type, approver_type,
                    description, created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(), v_template_id, k, 'SEQUENTIAL', v_approver_types[k],
                    v_line_descs[k], NOW(), NOW(), 'system', 'system'
                );
            END LOOP;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created 64 approval templates with 192 template lines';
END $$;

-- ============================================================================
-- PART 2: Test Account Approval Documents (한성전자)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := '00000000-0000-0000-0000-000000000000';
    v_n TIMESTAMPTZ := NOW();
    -- Employee UUIDs
    v_ceo    UUID := 'e0000002-0000-0000-0000-000000000001';
    v_hr_adm UUID := 'e0000002-0000-0000-0000-000000000002';
    v_hr_mgr UUID := 'e0000002-0000-0000-0000-000000000003';
    v_dev_mgr UUID := 'e0000002-0000-0000-0000-000000000004';
    v_dev_sr UUID := 'e0000002-0000-0000-0000-000000000005';
    v_dev_st UUID := 'e0000002-0000-0000-0000-000000000006';
    -- Department UUIDs
    v_dept_dev1 UUID := 'd0000002-0000-0000-0000-000000000016';
    v_dept_hr   UUID := 'd0000002-0000-0000-0000-000000000007';
    v_dept_mgmt UUID := 'd0000002-0000-0000-0000-000000000002';
    v_doc UUID;
BEGIN
    -- ---- Doc 1: dev.staff 휴가신청 (APPROVED) ----
    v_doc := 'c0000002-0000-0000-0000-000000000001'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, completed_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0001', '연차 휴가 신청 (2025.01.20~21)', '개인 사유로 연차 2일 사용합니다.', 'LEAVE', 'APPROVED', v_dev_st, '조사원', v_dept_dev1, '개발1팀', v_n - interval '30 days', v_n - interval '28 days', v_n - interval '30 days', v_n - interval '28 days', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, action_type, comment, activated_at, completed_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'APPROVED', 'APPROVE', '승인합니다.', v_n-interval '30 days', v_n-interval '29 days', v_n-interval '30 days', v_n-interval '29 days', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'APPROVED', 'APPROVE', NULL, v_n-interval '29 days', v_n-interval '28 days', v_n-interval '30 days', v_n-interval '28 days', v_s, v_s);
    INSERT INTO hr_approval.approval_history (document_id, actor_id, actor_name, action_type, from_status, to_status, step_order, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, v_dev_st, '조사원', 'SUBMIT', 'DRAFT', 'IN_PROGRESS', 0, v_n-interval '30 days', v_n-interval '30 days', v_s, v_s),
    (v_doc, v_dev_mgr, '정개발', 'APPROVE', 'IN_PROGRESS', 'IN_PROGRESS', 1, v_n-interval '29 days', v_n-interval '29 days', v_s, v_s),
    (v_doc, v_hr_adm, '김인사', 'APPROVE', 'IN_PROGRESS', 'APPROVED', 2, v_n-interval '28 days', v_n-interval '28 days', v_s, v_s);

    -- ---- Doc 2: dev.staff 출장신청 (IN_PROGRESS → dev.manager 결재대기) ----
    v_doc := 'c0000002-0000-0000-0000-000000000002'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0002', '부산 출장 신청 (2025.02.15~16)', '부산 고객사 미팅을 위한 출장입니다.', 'BUSINESS_TRIP', 'IN_PROGRESS', v_dev_st, '조사원', v_dept_dev1, '개발1팀', v_n-interval '3 days', v_n-interval '3 days', v_n-interval '3 days', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'ACTIVE', v_n-interval '3 days', v_n-interval '3 days', v_n-interval '3 days', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'WAITING', NULL, v_n-interval '3 days', v_n-interval '3 days', v_s, v_s);
    INSERT INTO hr_approval.approval_history (document_id, actor_id, actor_name, action_type, from_status, to_status, step_order, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, v_dev_st, '조사원', 'SUBMIT', 'DRAFT', 'IN_PROGRESS', 0, v_n-interval '3 days', v_n-interval '3 days', v_s, v_s);

    -- ---- Doc 3: dev.senior 휴가신청 (IN_PROGRESS → dev.manager 결재대기) ----
    v_doc := 'c0000002-0000-0000-0000-000000000003'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0003', '연차 신청 (2025.02.20)', '개인 사유 연차 1일', 'LEAVE', 'IN_PROGRESS', v_dev_sr, '강선임', v_dept_dev1, '개발1팀', v_n-interval '1 day', v_n-interval '1 day', v_n-interval '1 day', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'ACTIVE', v_n-interval '1 day', v_n-interval '1 day', v_n-interval '1 day', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'WAITING', NULL, v_n-interval '1 day', v_n-interval '1 day', v_s, v_s);

    -- ---- Doc 4: dev.senior 초과근무 (IN_PROGRESS → dev.manager 결재대기) ----
    v_doc := 'c0000002-0000-0000-0000-000000000004'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0004', '초과근무 신청 (2025.02.12 19:00~22:00)', '프로젝트 마감으로 초과근무 신청합니다.', 'OVERTIME', 'IN_PROGRESS', v_dev_sr, '강선임', v_dept_dev1, '개발1팀', v_n-interval '2 hours', v_n-interval '2 hours', v_n-interval '2 hours', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'ACTIVE', v_n-interval '2 hours', v_n-interval '2 hours', v_n-interval '2 hours', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'WAITING', NULL, v_n-interval '2 hours', v_n-interval '2 hours', v_s, v_s);

    -- ---- Doc 5: dev.staff 구매신청 (IN_PROGRESS → dev.manager 결재대기) ----
    v_doc := 'c0000002-0000-0000-0000-000000000005'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0005', '모니터 구매 신청 (Dell U2723QE 2대)', '개발팀 신규 모니터 구매 요청입니다.', 'PURCHASE', 'IN_PROGRESS', v_dev_st, '조사원', v_dept_dev1, '개발1팀', v_n-interval '5 hours', v_n-interval '5 hours', v_n-interval '5 hours', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'ACTIVE', v_n-interval '5 hours', v_n-interval '5 hours', v_n-interval '5 hours', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'WAITING', NULL, v_n-interval '5 hours', v_n-interval '5 hours', v_s, v_s);

    -- ---- Doc 6: hr.admin 발령안 (APPROVED) ----
    v_doc := 'c0000002-0000-0000-0000-000000000006'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, completed_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0006', '2025년 1분기 정기인사 발령안', '2025년 1분기 정기 인사이동 및 승진 발령안입니다.', 'APPOINTMENT', 'APPROVED', v_hr_adm, '김인사', v_dept_hr, '인사팀', v_n-interval '45 days', v_n-interval '40 days', v_n-interval '45 days', v_n-interval '40 days', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, action_type, completed_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_ceo, '이전자', '대표이사', '경영지원본부', 'APPROVED', 'APPROVE', v_n-interval '40 days', v_n-interval '45 days', v_n-interval '40 days', v_s, v_s);

    -- ---- Doc 7: dev.senior 경비정산 (REJECTED) ----
    v_doc := 'c0000002-0000-0000-0000-000000000007'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, completed_at, return_count, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0007', '경비 정산 (2024.12 팀 회식)', '12월 팀 회식 경비 정산 요청입니다.', 'EXPENSE', 'REJECTED', v_dev_sr, '강선임', v_dept_dev1, '개발1팀', v_n-interval '20 days', v_n-interval '18 days', 1, v_n-interval '20 days', v_n-interval '18 days', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, action_type, comment, completed_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'REJECTED', 'REJECT', '영수증이 누락되었습니다.', v_n-interval '18 days', v_n-interval '20 days', v_n-interval '18 days', v_s, v_s);

    -- ---- Doc 8: dev.manager DRAFT (작성중) ----
    v_doc := 'c0000002-0000-0000-0000-000000000008'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0008', '개발장비 구매 신청 (작성중)', '팀 개발 서버 교체를 위한 장비 구매 신청입니다.', 'PURCHASE', 'DRAFT', v_dev_mgr, '정개발', v_dept_dev1, '개발1팀', v_n-interval '1 day', v_n-interval '1 day', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;

    -- ---- Doc 9: hr.manager 인사변경 → hr.admin 결재대기 ----
    v_doc := 'c0000002-0000-0000-0000-000000000009'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0009', '직원 연락처 변경 요청', '직원 개인 연락처 변경 건입니다.', 'HR_CHANGE', 'IN_PROGRESS', v_hr_mgr, '박인사', v_dept_hr, '인사팀', v_n-interval '4 hours', v_n-interval '4 hours', v_n-interval '4 hours', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'ACTIVE', v_n-interval '4 hours', v_n-interval '4 hours', v_n-interval '4 hours', v_s, v_s);

    RAISE NOTICE 'Created 9 specific approval documents for test accounts';
END $$;

-- ============================================================================
-- PART 3: Bulk Approval Document Generator (all tenants)
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_prefixes TEXT[] := ARRAY['HD','ELEC','SDI','ENG','BIO','CHEM','IT','LIFE'];
    v_counts INT[] := ARRAY[15, 30, 25, 15, 10, 15, 10, 25];
    v_doc_types TEXT[] := ARRAY['LEAVE','OVERTIME','BUSINESS_TRIP','PURCHASE','EXPENSE','HR_CHANGE','APPOINTMENT','GENERAL'];
    v_statuses TEXT[] := ARRAY['APPROVED','APPROVED','APPROVED','IN_PROGRESS','IN_PROGRESS','REJECTED','DRAFT','CANCELLED'];
    v_tid UUID; v_doc_id UUID; v_emp_id UUID; v_emp_name TEXT; v_dept_id UUID; v_dept_name TEXT;
    v_approver_id UUID; v_approver_name TEXT; v_doc_type TEXT; v_status TEXT;
    v_doc_num TEXT; v_base TIMESTAMPTZ := NOW();
    i INT; j INT; v_offset INT;
BEGIN
    FOR i IN 1..8 LOOP
        v_tid := v_tenant_ids[i];
        v_offset := CASE WHEN i = 2 THEN 9 ELSE 0 END;

        FOR j IN 1..v_counts[i] LOOP
            v_doc_type := v_doc_types[1 + ((j-1) % 8)];
            v_status := v_statuses[1 + ((j-1) % 8)];
            v_doc_num := v_prefixes[i] || '-APR-2025-' || LPAD((j + v_offset)::TEXT, 4, '0');

            SELECT id, name, department_id INTO v_emp_id, v_emp_name, v_dept_id
            FROM hr_core.employee WHERE tenant_id = v_tid
            ORDER BY id OFFSET ((j-1) % 20) LIMIT 1;

            IF v_emp_id IS NULL THEN CONTINUE; END IF;
            SELECT name INTO v_dept_name FROM hr_core.department WHERE id = v_dept_id;

            v_doc_id := gen_random_uuid();
            INSERT INTO hr_approval.approval_document (
                id, tenant_id, document_number, title, content, document_type, status,
                drafter_id, drafter_name, drafter_department_id, drafter_department_name,
                submitted_at, completed_at, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_doc_id, v_tid, v_doc_num,
                v_doc_type || ' 신청 (' || v_doc_num || ')', v_doc_type || ' 관련 문서입니다.',
                v_doc_type, v_status, v_emp_id, v_emp_name, v_dept_id, v_dept_name,
                CASE WHEN v_status != 'DRAFT' THEN v_base - (j * interval '1 day') END,
                CASE WHEN v_status IN ('APPROVED','REJECTED','CANCELLED') THEN v_base - ((j-1) * interval '1 day') END,
                v_base - (j * interval '1 day'), v_base - (j * interval '1 day'), 'system', 'system'
            ) ON CONFLICT (document_number) DO NOTHING;

            IF v_status != 'DRAFT' THEN
                SELECT id, name INTO v_approver_id, v_approver_name
                FROM hr_core.employee WHERE tenant_id = v_tid AND position_code IN ('P06','P05')
                ORDER BY id LIMIT 1;

                IF v_approver_id IS NOT NULL THEN
                    INSERT INTO hr_approval.approval_line (
                        document_id, sequence, line_type, approver_id, approver_name,
                        status, action_type, completed_at, created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        v_doc_id, 1, 'SEQUENTIAL', v_approver_id, v_approver_name,
                        CASE WHEN v_status = 'APPROVED' THEN 'APPROVED'
                             WHEN v_status = 'REJECTED' THEN 'REJECTED'
                             WHEN v_status = 'IN_PROGRESS' THEN 'ACTIVE'
                             ELSE 'CANCELLED' END,
                        CASE WHEN v_status IN ('APPROVED') THEN 'APPROVE'
                             WHEN v_status = 'REJECTED' THEN 'REJECT' END,
                        CASE WHEN v_status IN ('APPROVED','REJECTED','CANCELLED') THEN v_base - ((j-1) * interval '1 day') END,
                        v_base - (j * interval '1 day'), v_base - (j * interval '1 day'), 'system', 'system'
                    );

                    INSERT INTO hr_approval.approval_history (
                        document_id, actor_id, actor_name, action_type,
                        from_status, to_status, step_order, created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        v_doc_id, v_emp_id, v_emp_name, 'SUBMIT',
                        'DRAFT', 'IN_PROGRESS', 0,
                        v_base - (j * interval '1 day'), v_base - (j * interval '1 day'), 'system', 'system'
                    );

                    IF v_status IN ('APPROVED','REJECTED') THEN
                        INSERT INTO hr_approval.approval_history (
                            document_id, actor_id, actor_name, action_type,
                            from_status, to_status, step_order, created_at, updated_at, created_by, updated_by
                        ) VALUES (
                            v_doc_id, v_approver_id, v_approver_name,
                            CASE WHEN v_status = 'APPROVED' THEN 'APPROVE' ELSE 'REJECT' END,
                            'IN_PROGRESS', v_status, 1,
                            v_base - ((j-1) * interval '1 day'), v_base - ((j-1) * interval '1 day'), 'system', 'system'
                        );
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created bulk approval documents for all tenants';
END $$;

-- ============================================================================
-- PART 4: Delegation Rules & Arbitrary Approval Rules
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
BEGIN
    -- Active: 정개발 → 강선임
    INSERT INTO hr_approval.delegation_rule (tenant_id, delegator_id, delegator_name, delegate_id, delegate_name, start_date, end_date, document_types, reason, is_active, created_at, updated_at, created_by, updated_by)
    VALUES (v_t, 'e0000002-0000-0000-0000-000000000004', '정개발', 'e0000002-0000-0000-0000-000000000005', '강선임', CURRENT_DATE, CURRENT_DATE + 30, 'LEAVE,OVERTIME', '출장 기간 결재 위임', true, NOW(), NOW(), 'system', 'system');

    -- Expired: 김인사 → 박인사
    INSERT INTO hr_approval.delegation_rule (tenant_id, delegator_id, delegator_name, delegate_id, delegate_name, start_date, end_date, document_types, reason, is_active, created_at, updated_at, created_by, updated_by)
    VALUES (v_t, 'e0000002-0000-0000-0000-000000000002', '김인사', 'e0000002-0000-0000-0000-000000000003', '박인사', CURRENT_DATE - 60, CURRENT_DATE - 30, 'LEAVE,OVERTIME,HR_CHANGE,APPOINTMENT', '해외출장 기간 위임', false, NOW(), NOW(), 'system', 'system');

    -- Arbitrary approval rules
    INSERT INTO hr_approval.arbitrary_approval_rule (tenant_id, document_type, condition_type, condition_operator, condition_value, skip_to_sequence, is_active, description, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, 'LEAVE', 'GRADE_LEVEL', 'LTE', '7', 99, true, '부장 이상 연차 1일 전결', NOW(), NOW(), 'system', 'system'),
    (v_t, 'PURCHASE', 'AMOUNT', 'LTE', '100000', 1, true, '10만원 이하 구매 팀장 전결', NOW(), NOW(), 'system', 'system'),
    ('a0000001-0000-0000-0000-000000000001', 'LEAVE', 'GRADE_LEVEL', 'LTE', '7', 99, true, '부장 이상 연차 1일 전결', NOW(), NOW(), 'system', 'system'),
    ('a0000001-0000-0000-0000-000000000001', 'PURCHASE', 'AMOUNT', 'LTE', '100000', 1, true, '10만원 이하 구매 팀장 전결', NOW(), NOW(), 'system', 'system');

    RAISE NOTICE 'Created delegation rules and arbitrary approval rules';
END $$;

COMMIT;

-- Verification
SELECT 'approval_template' as "table", COUNT(*)::TEXT as cnt FROM hr_approval.approval_template
UNION ALL SELECT 'approval_template_line', COUNT(*)::TEXT FROM hr_approval.approval_template_line
UNION ALL SELECT 'approval_document', COUNT(*)::TEXT FROM hr_approval.approval_document
UNION ALL SELECT 'approval_line', COUNT(*)::TEXT FROM hr_approval.approval_line
UNION ALL SELECT 'approval_history', COUNT(*)::TEXT FROM hr_approval.approval_history
UNION ALL SELECT 'delegation_rule', COUNT(*)::TEXT FROM hr_approval.delegation_rule
UNION ALL SELECT 'arbitrary_approval_rule', COUNT(*)::TEXT FROM hr_approval.arbitrary_approval_rule;


-- ================================================
-- [10/13] 09_org_extras.sql
-- ================================================
-- ============================================================================
-- 09_org_extras.sql
-- 조직 부가 데이터 (공지, 위원회, 정원, 경조, 전출입, 사원증)
-- ============================================================================
-- Tables:
--   announcement (~20), announcement_attachment (~5), announcement_target (~10)
--   announcement_read (~20), committee (~10), committee_member (~30)
--   headcount_plan (~30), headcount_request (~10)
--   condolence_policy (48), condolence_request (~30)
--   transfer_request (~10), employee_card (~30), card_issue_request (~10)
--   organization_history (~20)
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

BEGIN;

-- ============================================================================
-- PART 1: Announcements (공지사항)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_hr UUID;
    v_ceo UUID;
    v_ann_id UUID;
BEGIN
    -- Get actual employee IDs
    SELECT id INTO v_hr FROM hr_core.employee WHERE employee_number = 'E-2024-0002' AND tenant_id = v_t;
    SELECT id INTO v_ceo FROM hr_core.employee WHERE employee_number = 'E-2024-0001' AND tenant_id = v_t;

    -- Pinned: 설 연휴 안내 (dashboard visible)
    v_ann_id := gen_random_uuid();
    INSERT INTO hr_core.announcement (id, tenant_id, title, content, category, author_id, author_name, author_department, is_pinned, view_count, is_published, published_at, target_scope, created_at, updated_at, created_by, updated_by) VALUES
    (v_ann_id, v_t, '2025년 설 연휴 근무 안내', '설 연휴 기간(1/28~30) 근무 안내입니다. 필수 근무자 외 전 직원 휴무입니다.', 'NOTICE', v_hr, '김인사', '인사팀', true, 245, true, NOW()-interval '15 days', 'ALL', NOW()-interval '15 days', NOW(), v_s, v_s);
    INSERT INTO hr_core.announcement_target (announcement_id, target_type, target_id, target_name, created_at) VALUES
    (v_ann_id, 'ALL', v_t, '전체', NOW()-interval '15 days');

    -- Pinned: 신년 인사
    INSERT INTO hr_core.announcement (tenant_id, title, content, category, author_id, author_name, author_department, is_pinned, view_count, is_published, published_at, target_scope, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, '2025년 신년 인사', '한성전자 임직원 여러분, 새해 복 많이 받으세요. 올해도 함께 성장하는 한성전자가 되겠습니다.', 'NOTICE', v_ceo, '이전자', '경영지원본부', true, 198, true, NOW()-interval '42 days', 'ALL', NOW()-interval '42 days', NOW(), v_s, v_s);

    -- Regular notices
    INSERT INTO hr_core.announcement (tenant_id, title, content, category, author_id, author_name, author_department, is_pinned, view_count, is_published, published_at, target_scope, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, '2025년 건강검진 일정 안내', '2025년 건강검진이 3월부터 시작됩니다. 지정 병원 및 예약 방법을 확인해주세요.', 'HR', v_hr, '김인사', '인사팀', false, 156, true, NOW()-interval '20 days', 'ALL', NOW()-interval '20 days', NOW(), v_s, v_s),
    (v_t, '사내 동호회 모집 안내', '2025년 신규 동호회 및 기존 동호회 회원 모집 안내입니다.', 'EVENT', v_hr, '김인사', '인사팀', false, 89, true, NOW()-interval '25 days', 'ALL', NOW()-interval '25 days', NOW(), v_s, v_s),
    (v_t, '2025년 복리후생 변경 안내', '올해 변경되는 복리후생 제도를 안내드립니다. 자녀 학비 지원 확대 등.', 'HR', v_hr, '김인사', '인사팀', false, 201, true, NOW()-interval '35 days', 'ALL', NOW()-interval '35 days', NOW(), v_s, v_s),
    (v_t, '주차장 이용 안내', '지하 주차장 공사로 인해 2월 한 달간 지상 주차장을 이용해주세요.', 'GENERAL', v_hr, '김인사', '인사팀', false, 134, true, NOW()-interval '10 days', 'ALL', NOW()-interval '10 days', NOW(), v_s, v_s),
    (v_t, '정보보안 교육 안내', '연간 필수 정보보안 교육이 2/15~28 기간에 실시됩니다.', 'TRAINING', v_hr, '김인사', '인사팀', false, 78, true, NOW()-interval '8 days', 'ALL', NOW()-interval '8 days', NOW(), v_s, v_s),
    (v_t, '1분기 경영실적 보고', '2025년 1분기 경영 실적을 공유드립니다. 매출 전년 대비 12% 증가.', 'BUSINESS', v_ceo, '이전자', '경영지원본부', false, 67, true, NOW()-interval '3 days', 'ALL', NOW()-interval '3 days', NOW(), v_s, v_s),
    (v_t, '시스템 점검 안내 (2/15)', '2/15(토) 02:00~06:00 HR 시스템 정기 점검이 예정되어 있습니다.', 'SYSTEM', NULL, 'System', '전산팀', false, 45, true, NOW()-interval '5 days', 'ALL', NOW()-interval '5 days', NOW(), v_s, v_s),
    (v_t, '직원 추천 채용 보상금 안내 (Draft)', '직원 추천 채용 성공 시 보상금 지급 안내입니다.', 'HR', v_hr, '김인사', '인사팀', false, 0, false, NULL, 'ALL', NOW()-interval '1 day', NOW(), v_s, v_s);

    -- Read records for test accounts
    INSERT INTO hr_core.announcement_read (announcement_id, employee_id, read_at)
    SELECT a.id, e.id, NOW() - (random() * interval '10 days')
    FROM hr_core.announcement a
    CROSS JOIN (SELECT id FROM hr_core.employee WHERE id IN (
        'e0000002-0000-0000-0000-000000000004',
        'e0000002-0000-0000-0000-000000000005',
        'e0000002-0000-0000-0000-000000000006'
    )) e
    WHERE a.tenant_id = v_t AND a.is_published = true
    LIMIT 20
    ON CONFLICT (announcement_id, employee_id) DO NOTHING;

    -- Other tenants: 2 announcements each
    INSERT INTO hr_core.announcement (tenant_id, title, content, category, author_id, author_name, author_department, is_pinned, view_count, is_published, published_at, target_scope, created_at, updated_at, created_by, updated_by)
    SELECT
        t.id,
        CASE WHEN s.n = 1 THEN '2025년 신년 인사' ELSE '복리후생 안내' END,
        CASE WHEN s.n = 1 THEN '새해 복 많이 받으세요.' ELSE '복리후생 변경 안내입니다.' END,
        CASE WHEN s.n = 1 THEN 'NOTICE' ELSE 'HR' END,
        NULL, 'HR관리자', '인사팀',
        CASE WHEN s.n = 1 THEN true ELSE false END, s.n * 50, true, NOW() - (s.n * interval '20 days'), 'ALL',
        NOW() - (s.n * interval '20 days'), NOW(), 'system', 'system'
    FROM (
        SELECT tid, n
        FROM unnest(ARRAY[
            'a0000001-0000-0000-0000-000000000001'::UUID,
            'a0000001-0000-0000-0000-000000000003'::UUID,
            'a0000001-0000-0000-0000-000000000004'::UUID,
            'a0000001-0000-0000-0000-000000000005'::UUID,
            'a0000001-0000-0000-0000-000000000006'::UUID,
            'a0000001-0000-0000-0000-000000000007'::UUID,
            'a0000001-0000-0000-0000-000000000008'::UUID
        ]) AS tid_table(tid)  -- 테이블 별칭(tid_table), 컬럼 별칭(tid)
        CROSS JOIN generate_series(1,2) AS n_series(n)  -- 테이블 별칭(n_series), 컬럼 별칭(n)
    ) s
    JOIN tenant_common.tenant t ON t.id = s.tid;

    RAISE NOTICE 'Created announcements';
END $$;

-- ============================================================================
-- PART 2: Committees (위원회)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_comm_id UUID;
BEGIN
    -- 산업안전보건위원회
    v_comm_id := gen_random_uuid();
    INSERT INTO hr_core.committee (id, tenant_id, code, name, name_en, type, purpose, start_date, meeting_schedule, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_comm_id, v_t, 'SAFETY', '산업안전보건위원회', 'Safety Committee', 'STATUTORY', '근로자 안전 및 보건 관련 심의/의결', '2025-01-01', '분기별 1회', 'ACTIVE', NOW(), NOW(), v_s, v_s)
    ON CONFLICT (tenant_id, code) DO NOTHING;
    INSERT INTO hr_core.committee_member (committee_id, employee_id, employee_name, department_name, position_name, role, join_date, is_active, created_at, updated_at, created_by, updated_by) VALUES
    (v_comm_id, 'e0000002-0000-0000-0000-000000000001', '이전자', '경영지원본부', '대표이사', 'CHAIR', '2025-01-01', true, NOW(), NOW(), v_s, v_s),
    (v_comm_id, 'e0000002-0000-0000-0000-000000000002', '김인사', '인사팀', '팀장', 'SECRETARY', '2025-01-01', true, NOW(), NOW(), v_s, v_s),
    (v_comm_id, 'e0000002-0000-0000-0000-000000000004', '정개발', '개발1팀', '팀장', 'MEMBER', '2025-01-01', true, NOW(), NOW(), v_s, v_s);

    -- 인사위원회
    v_comm_id := gen_random_uuid();
    INSERT INTO hr_core.committee (id, tenant_id, code, name, name_en, type, purpose, start_date, meeting_schedule, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_comm_id, v_t, 'HR_COMMITTEE', '인사위원회', 'HR Committee', 'INTERNAL', '인사 관련 주요 사항 심의', '2025-01-01', '월 1회', 'ACTIVE', NOW(), NOW(), v_s, v_s)
    ON CONFLICT (tenant_id, code) DO NOTHING;
    INSERT INTO hr_core.committee_member (committee_id, employee_id, employee_name, department_name, position_name, role, join_date, is_active, created_at, updated_at, created_by, updated_by) VALUES
    (v_comm_id, 'e0000002-0000-0000-0000-000000000001', '이전자', '경영지원본부', '대표이사', 'CHAIR', '2025-01-01', true, NOW(), NOW(), v_s, v_s),
    (v_comm_id, 'e0000002-0000-0000-0000-000000000002', '김인사', '인사팀', '팀장', 'MEMBER', '2025-01-01', true, NOW(), NOW(), v_s, v_s),
    (v_comm_id, 'e0000002-0000-0000-0000-000000000003', '박인사', '인사팀', '책임', 'SECRETARY', '2025-01-01', true, NOW(), NOW(), v_s, v_s);

    -- 징계위원회 (INACTIVE)
    v_comm_id := gen_random_uuid();
    INSERT INTO hr_core.committee (id, tenant_id, code, name, type, purpose, start_date, end_date, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_comm_id, v_t, 'DISCIPLINE', '징계위원회', 'INTERNAL', '징계 사안 심의', '2024-01-01', '2024-12-31', 'INACTIVE', NOW(), NOW(), v_s, v_s)
    ON CONFLICT (tenant_id, code) DO NOTHING;

    RAISE NOTICE 'Created committees';
END $$;

-- ============================================================================
-- PART 3: Headcount Plans & Requests (정원관리)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    r RECORD;
BEGIN
    -- Headcount plans for 한성전자 leaf departments
    FOR r IN
        SELECT d.id, d.name
        FROM hr_core.department d
        WHERE d.tenant_id = v_t AND d.level >= 2 AND d.status = 'ACTIVE'
        ORDER BY d.id
        LIMIT 20
    LOOP
        INSERT INTO hr_core.headcount_plan (
            tenant_id, year, department_id, department_name,
            planned_count, current_count, approved_count,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_t, 2025, r.id, r.name,
            5 + (random() * 15)::INT,
            (SELECT COUNT(*) FROM hr_core.employee WHERE department_id = r.id AND tenant_id = v_t AND status = 'ACTIVE'),
            4 + (random() * 12)::INT,
            NOW(), NOW(), v_s, v_s
        ) ON CONFLICT (tenant_id, year, department_id) DO NOTHING;
    END LOOP;

    -- Headcount requests
    INSERT INTO hr_core.headcount_request (tenant_id, department_id, department_name, type, request_count, reason, effective_date, status, requester_id, requester_name, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, 'd0000002-0000-0000-0000-000000000016', '개발1팀', 'INCREASE', 2, '프로젝트 확장에 따른 인원 충원', '2025-03-01', 'APPROVED', 'e0000002-0000-0000-0000-000000000004', '정개발', NOW()-interval '20 days', NOW(), v_s, v_s),
    (v_t, 'd0000002-0000-0000-0000-000000000017', '개발2팀', 'INCREASE', 1, '신규 프로젝트 투입', '2025-04-01', 'PENDING', 'e0000002-0000-0000-0000-000000000002', '김인사', NOW()-interval '5 days', NOW(), v_s, v_s),
    (v_t, 'd0000002-0000-0000-0000-000000000022', '국내영업팀', 'DECREASE', 1, '업무 자동화에 따른 감축', '2025-06-01', 'DRAFT', 'e0000002-0000-0000-0000-000000000002', '김인사', NOW()-interval '2 days', NOW(), v_s, v_s),
    (v_t, 'd0000002-0000-0000-0000-000000000018', 'QA팀', 'INCREASE', 2, 'QA 자동화 인력 충원', '2025-03-01', 'REJECTED', 'e0000002-0000-0000-0000-000000000002', '김인사', NOW()-interval '30 days', NOW(), v_s, v_s);

    RAISE NOTICE 'Created headcount plans and requests';
END $$;

-- ============================================================================
-- PART 4: Condolence Policies & Requests (경조사)
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_event_types TEXT[] := ARRAY['MARRIAGE','CHILD_MARRIAGE','PARENT_DEATH','SPOUSE_DEATH','CHILD_BIRTH','FIRST_BIRTHDAY'];
    v_names TEXT[] := ARRAY['본인 결혼','자녀 결혼','부모 상','배우자 상','출산','첫돌'];
    v_amounts DECIMAL[] := ARRAY[500000, 300000, 500000, 500000, 200000, 100000];
    v_leave_days INT[] := ARRAY[5, 1, 5, 5, 3, 0];
    v_tid UUID;
    v_policy_id UUID;
    i INT; j INT;
BEGIN
    -- Policies for all tenants (6 types × 8 = 48)
    FOR i IN 1..8 LOOP
        v_tid := v_tenant_ids[i];
        FOR j IN 1..6 LOOP
            INSERT INTO hr_core.condolence_policy (
                tenant_id, event_type, name, description, amount, leave_days,
                is_active, sort_order, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tid, v_event_types[j], v_names[j],
                v_names[j] || ' 경조금 및 휴가 지급',
                v_amounts[j], v_leave_days[j],
                true, j, NOW(), NOW(), 'system', 'system'
            );
        END LOOP;
    END LOOP;

    -- Requests for 한성전자
    v_tid := 'a0000001-0000-0000-0000-000000000002';

    SELECT id INTO v_policy_id FROM hr_core.condolence_policy WHERE tenant_id = v_tid AND event_type = 'MARRIAGE' LIMIT 1;
    INSERT INTO hr_core.condolence_request (tenant_id, employee_id, employee_name, department_name, policy_id, event_type, event_date, description, relation, related_person_name, amount, leave_days, status, paid_date, created_at, updated_at, created_by, updated_by) VALUES
    (v_tid, 'e0000002-0000-0000-0000-000000000005', '강선임', '개발1팀', v_policy_id, 'MARRIAGE', '2025-05-10', '본인 결혼식', 'SELF', '강선임', 500000, 5, 'APPROVED', NULL, NOW()-interval '5 days', NOW(), 'system', 'system');

    SELECT id INTO v_policy_id FROM hr_core.condolence_policy WHERE tenant_id = v_tid AND event_type = 'PARENT_DEATH' LIMIT 1;
    INSERT INTO hr_core.condolence_request (tenant_id, employee_id, employee_name, department_name, policy_id, event_type, event_date, description, relation, related_person_name, amount, leave_days, status, paid_date, created_at, updated_at, created_by, updated_by) VALUES
    (v_tid, gen_random_uuid(), '임정우', '개발2팀', v_policy_id, 'PARENT_DEATH', '2025-01-20', '부친상', 'FATHER', '임OO', 500000, 5, 'PAID', '2025-01-22', NOW()-interval '25 days', NOW(), 'system', 'system');

    SELECT id INTO v_policy_id FROM hr_core.condolence_policy WHERE tenant_id = v_tid AND event_type = 'CHILD_BIRTH' LIMIT 1;
    INSERT INTO hr_core.condolence_request (tenant_id, employee_id, employee_name, department_name, policy_id, event_type, event_date, description, relation, related_person_name, amount, leave_days, status, created_at, updated_at, created_by, updated_by) VALUES
    (v_tid, gen_random_uuid(), '한서연', '해외영업팀', v_policy_id, 'CHILD_BIRTH', '2025-02-05', '둘째 출산', 'CHILD', '한OO', 200000, 3, 'PENDING', NOW()-interval '6 days', NOW(), 'system', 'system');

    RAISE NOTICE 'Created condolence policies and requests';
END $$;

-- ============================================================================
-- PART 5: Transfer Requests (계열사 전출입)
-- ============================================================================

DO $$
DECLARE
    v_s TEXT := 'system';
BEGIN
    INSERT INTO hr_core.transfer_request (
        tenant_id, employee_name, employee_number,
        source_tenant_id, source_tenant_name, source_department_name, source_position_name, source_grade_name,
        target_tenant_id, target_tenant_name, target_department_name, target_position_name, target_grade_name,
        transfer_date, reason, status,
        source_approver_name, source_approved_at, target_approver_name, target_approved_at,
        completed_at, created_at, updated_at, created_by, updated_by
    ) VALUES
    -- Completed: 한성전자 → 한성SDI
    ('a0000001-0000-0000-0000-000000000002', '김이동', 'E-2024-0050',
     'a0000001-0000-0000-0000-000000000002', '한성전자', '개발2팀', '선임', '대리',
     'a0000001-0000-0000-0000-000000000003', '한성SDI', '배터리개발팀', '선임', '대리',
     '2025-01-15', '배터리 기술 지원', 'COMPLETED',
     '김인사', NOW()-interval '45 days', 'SDI HR', NOW()-interval '40 days',
     NOW()-interval '35 days', NOW()-interval '50 days', NOW(), v_s, v_s),
    -- Pending: 한성SDI → 한성전자
    ('a0000001-0000-0000-0000-000000000003', '박이직', 'S-2024-0030',
     'a0000001-0000-0000-0000-000000000003', '한성SDI', '품질관리팀', '팀원', '사원',
     'a0000001-0000-0000-0000-000000000002', '한성전자', 'QA팀', '팀원', '사원',
     '2025-03-01', 'QA 역량 활용', 'PENDING',
     'SDI HR', NOW()-interval '10 days', NULL, NULL,
     NULL, NOW()-interval '15 days', NOW(), v_s, v_s),
    -- Draft: 한성홀딩스 → 한성생명
    ('a0000001-0000-0000-0000-000000000001', '최전근', 'H-2024-0010',
     'a0000001-0000-0000-0000-000000000001', '한성홀딩스', '전략기획팀', '책임', '과장',
     'a0000001-0000-0000-0000-000000000008', '한성생명', '경영기획팀', '책임', '과장',
     '2025-04-01', '계열사 경영 지원', 'DRAFT',
     NULL, NULL, NULL, NULL,
     NULL, NOW()-interval '5 days', NOW(), v_s, v_s);

    RAISE NOTICE 'Created transfer requests';
END $$;

-- ============================================================================
-- PART 6: Employee Cards (사원증)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
BEGIN
    -- Cards for test accounts
    INSERT INTO hr_core.employee_card (tenant_id, card_number, employee_id, status, issue_type, issue_date, expiry_date, access_level, rfid_enabled, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, 'ELEC-CARD-0001', 'e0000002-0000-0000-0000-000000000001', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_3', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0002', 'e0000002-0000-0000-0000-000000000002', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_2', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0003', 'e0000002-0000-0000-0000-000000000003', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_2', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0004', 'e0000002-0000-0000-0000-000000000004', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_2', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0005', 'e0000002-0000-0000-0000-000000000005', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_1', true, NOW(), NOW(), v_s, v_s),
    (v_t, 'ELEC-CARD-0006', 'e0000002-0000-0000-0000-000000000006', 'ACTIVE', 'NEW', '2024-01-02', '2029-01-02', 'LEVEL_1', true, NOW(), NOW(), v_s, v_s);

    -- A lost card and reissue request
    INSERT INTO hr_core.employee_card (tenant_id, card_number, employee_id, status, issue_type, issue_date, expiry_date, access_level, lost_at, lost_location, lost_description, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, 'ELEC-CARD-0050', gen_random_uuid(), 'LOST', 'NEW', '2024-03-01', '2029-03-01', 'LEVEL_1', NOW()-interval '10 days', '사내 식당', '식당에서 분실', NOW()-interval '300 days', NOW()-interval '10 days', v_s, v_s);

    INSERT INTO hr_core.card_issue_request (tenant_id, request_number, employee_id, issue_type, reason, status, created_at, updated_at, created_by, updated_by)
    SELECT v_t, 'ELEC-CIR-2025-0001',
           ec.employee_id, 'REISSUE', '사원증 분실 재발급 요청', 'PENDING',
           NOW()-interval '9 days', NOW(), v_s, v_s
    FROM hr_core.employee_card ec
    WHERE ec.tenant_id = v_t AND ec.status = 'LOST'
    LIMIT 1;

    RAISE NOTICE 'Created employee cards and issue requests';
END $$;

-- ============================================================================
-- PART 7: Organization History
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_hr UUID := 'e0000002-0000-0000-0000-000000000002';
BEGIN
    INSERT INTO hr_core.organization_history (tenant_id, event_type, department_id, department_name, title, description, previous_value, new_value, actor_id, actor_name, event_date, created_at) VALUES
    (v_t, 'DEPARTMENT_CREATED', 'd0000002-0000-0000-0000-000000000033', '구조조정부', '구조조정부 신설', '구조조정 업무를 위한 임시 부서 신설', NULL, '{"name":"구조조정부","status":"ACTIVE"}'::JSONB, v_hr, '김인사', NOW()-interval '180 days', NOW()-interval '180 days'),
    (v_t, 'DEPARTMENT_DEACTIVATED', 'd0000002-0000-0000-0000-000000000033', '구조조정부', '구조조정부 비활성화', '구조조정 완료에 따른 부서 비활성화', '{"status":"ACTIVE"}'::JSONB, '{"status":"INACTIVE"}'::JSONB, v_hr, '김인사', NOW()-interval '60 days', NOW()-interval '60 days'),
    (v_t, 'MANAGER_CHANGED', 'd0000002-0000-0000-0000-000000000016', '개발1팀', '개발1팀 팀장 변경', '개발1팀 팀장 정개발 부임', '{"manager":"이전팀장"}'::JSONB, '{"manager":"정개발"}'::JSONB, v_hr, '김인사', NOW()-interval '365 days', NOW()-interval '365 days'),
    (v_t, 'DEPARTMENT_RENAMED', 'd0000002-0000-0000-0000-000000000031', '디자인팀', '디자인팀 명칭 변경', 'UX디자인팀에서 디자인팀으로 변경', '{"name":"UX디자인팀"}'::JSONB, '{"name":"디자인팀"}'::JSONB, v_hr, '김인사', NOW()-interval '200 days', NOW()-interval '200 days');

    RAISE NOTICE 'Created organization history';
END $$;

COMMIT;

-- Verification
SELECT 'announcement' as "table", COUNT(*)::TEXT as cnt FROM hr_core.announcement
UNION ALL SELECT 'announcement_target', COUNT(*)::TEXT FROM hr_core.announcement_target
UNION ALL SELECT 'announcement_read', COUNT(*)::TEXT FROM hr_core.announcement_read
UNION ALL SELECT 'committee', COUNT(*)::TEXT FROM hr_core.committee
UNION ALL SELECT 'committee_member', COUNT(*)::TEXT FROM hr_core.committee_member
UNION ALL SELECT 'headcount_plan', COUNT(*)::TEXT FROM hr_core.headcount_plan
UNION ALL SELECT 'headcount_request', COUNT(*)::TEXT FROM hr_core.headcount_request
UNION ALL SELECT 'condolence_policy', COUNT(*)::TEXT FROM hr_core.condolence_policy
UNION ALL SELECT 'condolence_request', COUNT(*)::TEXT FROM hr_core.condolence_request
UNION ALL SELECT 'transfer_request', COUNT(*)::TEXT FROM hr_core.transfer_request
UNION ALL SELECT 'employee_card', COUNT(*)::TEXT FROM hr_core.employee_card
UNION ALL SELECT 'card_issue_request', COUNT(*)::TEXT FROM hr_core.card_issue_request
UNION ALL SELECT 'organization_history', COUNT(*)::TEXT FROM hr_core.organization_history;


-- ================================================
-- [11/13] 10_recruitment.sql
-- ================================================
-- ============================================================================
-- 10_recruitment.sql
-- 채용 샘플 데이터
-- ============================================================================
-- Tables:
--   job_posting (~25), applicant (~60), application (~80)
--   interview (~50), interview_score (~120), offer (~15)
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

BEGIN;

-- ============================================================================
-- PART 1: Job Postings (한성전자 중심)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_hr UUID := 'e0000002-0000-0000-0000-000000000002';  -- hr.admin
    v_dev_mgr UUID := 'e0000002-0000-0000-0000-000000000004';  -- dev.manager
BEGIN
    -- 한성전자 공고 10건
    INSERT INTO hr_recruitment.job_posting (id, tenant_id, job_code, title, department_id, department_name, position_id, position_name, job_description, requirements, employment_type, experience_min, experience_max, salary_min, salary_max, headcount, skills, status, open_date, close_date, recruiter_id, recruiter_name, hiring_manager_id, hiring_manager_name, application_count, view_count, is_featured, is_urgent, created_at, updated_at, created_by, updated_by)
    VALUES
    ('f0000002-0000-0000-0000-000000000001'::UUID, v_t, 'ELEC-REC-2025-001', '프론트엔드 개발자 (React/TypeScript)', 'd0000002-0000-0000-0000-000000000016', '개발1팀', NULL, '선임', '프론트엔드 웹 애플리케이션 개발 및 유지보수', 'React, TypeScript 경력 3년 이상', 'FULL_TIME', 3, 7, 50000000, 80000000, 2, '["React","TypeScript","Next.js"]'::JSONB, 'OPEN', CURRENT_DATE - 30, CURRENT_DATE + 30, v_hr, '김인사', v_dev_mgr, '정개발', 15, 342, true, false, NOW()-interval '30 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000002'::UUID, v_t, 'ELEC-REC-2025-002', '백엔드 개발자 (Java/Spring Boot)', 'd0000002-0000-0000-0000-000000000016', '개발1팀', NULL, '선임', 'Java 기반 마이크로서비스 개발', 'Java, Spring Boot 경력 5년 이상', 'FULL_TIME', 5, 10, 60000000, 100000000, 1, '["Java","Spring Boot","PostgreSQL"]'::JSONB, 'OPEN', CURRENT_DATE - 20, CURRENT_DATE + 40, v_hr, '김인사', v_dev_mgr, '정개발', 8, 256, true, true, NOW()-interval '20 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000003'::UUID, v_t, 'ELEC-REC-2025-003', 'DevOps 엔지니어', 'd0000002-0000-0000-0000-000000000020', '인프라팀', NULL, '책임', 'CI/CD 파이프라인 및 클라우드 인프라 관리', 'AWS, Kubernetes 경력 3년 이상', 'FULL_TIME', 3, 8, 55000000, 90000000, 1, '["AWS","Kubernetes","Terraform"]'::JSONB, 'OPEN', CURRENT_DATE - 15, CURRENT_DATE + 45, v_hr, '김인사', NULL, NULL, 5, 189, false, false, NOW()-interval '15 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000004'::UUID, v_t, 'ELEC-REC-2025-004', 'QA 엔지니어', 'd0000002-0000-0000-0000-000000000018', 'QA팀', NULL, '팀원', '소프트웨어 품질 관리 및 자동화 테스트', 'QA 경력 2년 이상', 'FULL_TIME', 2, 5, 40000000, 60000000, 2, '["Selenium","JUnit","Jira"]'::JSONB, 'OPEN', CURRENT_DATE - 10, CURRENT_DATE + 50, v_hr, '김인사', NULL, NULL, 3, 98, false, false, NOW()-interval '10 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000005'::UUID, v_t, 'ELEC-REC-2025-005', 'UI/UX 디자이너', 'd0000002-0000-0000-0000-000000000031', '디자인팀', NULL, '선임', 'HR SaaS 플랫폼 UI/UX 디자인', 'Figma, UI/UX 경력 3년 이상', 'FULL_TIME', 3, 7, 45000000, 75000000, 1, '["Figma","Adobe XD","Sketch"]'::JSONB, 'CLOSED', CURRENT_DATE - 60, CURRENT_DATE - 10, v_hr, '김인사', NULL, NULL, 20, 445, false, false, NOW()-interval '60 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000006'::UUID, v_t, 'ELEC-REC-2025-006', '인사 담당자 (신입/경력)', 'd0000002-0000-0000-0000-000000000007', '인사팀', NULL, '팀원', 'HR 업무 전반 지원', '인사/노무 관련 전공 또는 경력', 'FULL_TIME', 0, 3, 35000000, 50000000, 1, '["Excel","SAP HR"]'::JSONB, 'CLOSED', CURRENT_DATE - 90, CURRENT_DATE - 30, v_hr, '김인사', v_hr, '김인사', 35, 678, false, false, NOW()-interval '90 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000007'::UUID, v_t, 'ELEC-REC-2025-007', '데이터 분석가 (인턴)', 'd0000002-0000-0000-0000-000000000003', '경영기획실', NULL, '팀원', '데이터 분석 및 리포트 작성', '통계학/데이터사이언스 전공', 'INTERN', 0, 1, 24000000, 30000000, 2, '["Python","SQL","Tableau"]'::JSONB, 'DRAFT', NULL, NULL, v_hr, '김인사', NULL, NULL, 0, 0, false, false, NOW()-interval '2 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000008'::UUID, v_t, 'ELEC-REC-2025-008', '회계 담당자', 'd0000002-0000-0000-0000-000000000012', '회계팀', NULL, '선임', '결산, 세무 업무', '회계사/세무사 자격증 우대', 'FULL_TIME', 3, 7, 50000000, 70000000, 1, '["SAP","IFRS"]'::JSONB, 'OPEN', CURRENT_DATE - 5, CURRENT_DATE + 55, v_hr, '김인사', NULL, NULL, 2, 45, false, false, NOW()-interval '5 days', NOW(), v_s, v_s);

    -- 다른 테넌트 공고 (한성SDI 3건, 한성생명 2건, 한성IT 2건)
    INSERT INTO hr_recruitment.job_posting (tenant_id, job_code, title, department_id, department_name, employment_type, headcount, status, open_date, close_date, application_count, view_count, created_at, updated_at, created_by, updated_by)
    SELECT
        t.id,
        t_code || '-REC-2025-' || LPAD(s.n::TEXT, 3, '0'),
        (ARRAY['SW 엔지니어','생산기술자','품질관리자','영업담당자','경영지원'])[1 + (s.n % 5)],
        d.id, d.name,
        'FULL_TIME', 1 + (s.n % 2),
        (ARRAY['OPEN','OPEN','CLOSED'])[1 + (s.n % 3)],
        CURRENT_DATE - (s.n * 15), CURRENT_DATE + (s.n * 10),
        s.n * 3, s.n * 50,
        NOW() - (s.n * interval '15 days'), NOW(), 'system', 'system'
    FROM (
        SELECT 'a0000001-0000-0000-0000-000000000003'::UUID as tid, 'SDI' as t_code, generate_series(1,3) as n
        UNION ALL
        SELECT 'a0000001-0000-0000-0000-000000000008'::UUID, 'LIFE', generate_series(1,2)
        UNION ALL
        SELECT 'a0000001-0000-0000-0000-000000000007'::UUID, 'IT', generate_series(1,2)
    ) s
    JOIN tenant_common.tenant t ON t.id = s.tid
    JOIN hr_core.department d ON d.tenant_id = s.tid AND d.level >= 2
    ORDER BY s.tid, s.n
    LIMIT 7;

    RAISE NOTICE 'Created job postings';
END $$;

-- ============================================================================
-- PART 2: Applicants & Applications (한성전자 중심)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_app_id UUID;
    v_applicant_id UUID;
    v_surnames TEXT[] := ARRAY['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권'];
    v_given TEXT[] := ARRAY['지원','수현','태민','서영','민호','하진','재현','유진','동현','소연','현우','예린','성민','나윤','준혁'];
    v_sources TEXT[] := ARRAY['JOBKOREA','SARAMIN','WANTED','LINKEDIN','REFERRAL','DIRECT','CAMPUS'];
    i INT; v_name TEXT; v_email TEXT;
BEGIN
    -- 40 applicants for 한성전자
    FOR i IN 1..40 LOOP
        v_name := v_surnames[1 + ((i-1) % 15)] || v_given[1 + ((i-1) % 15)];
        v_email := 'applicant' || i || '@example.com';
        v_applicant_id := gen_random_uuid();

        INSERT INTO hr_recruitment.applicant (
            id, tenant_id, name, email, phone, birth_date, gender,
            source, source_detail, is_blacklisted, blacklist_reason,
            education, experience, skills,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_applicant_id, v_t, v_name, v_email,
            '010-' || LPAD((2000 + i)::TEXT, 4, '0') || '-' || LPAD((1000 + i)::TEXT, 4, '0'),
            '1990-01-01'::DATE + (i * 30 * interval '1 day')::interval,
            CASE WHEN i % 3 = 0 THEN 'FEMALE' ELSE 'MALE' END,
            v_sources[1 + ((i-1) % 7)],
            CASE WHEN v_sources[1 + ((i-1) % 7)] = 'REFERRAL' THEN '직원 추천' ELSE NULL END,
            (i = 38), -- One blacklisted
            CASE WHEN i = 38 THEN '면접 노쇼 2회' ELSE NULL END,
            json_build_object('degree', CASE WHEN i % 4 = 0 THEN '석사' ELSE '학사' END, 'university', '서울대학교')::JSONB,
            json_build_object('years', 1 + (i % 8), 'company', '이전 회사')::JSONB,
            json_build_array('Java', 'Spring', 'React')::JSONB,
            NOW() - ((40 - i) * interval '2 days'), NOW(), v_s, v_s
        );

        -- Create applications (not all applicants apply, link to postings 1-6)
        IF i <= 35 THEN
            v_app_id := gen_random_uuid();
            INSERT INTO hr_recruitment.application (
                id, tenant_id, job_posting_id, applicant_id,
                application_number, status, cover_letter,
                screening_score, current_stage, stage_order,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_app_id, v_t,
                ('f0000002-0000-0000-0000-' || LPAD((1 + ((i-1) % 6))::TEXT, 12, '0'))::UUID,
                v_applicant_id,
                'ELEC-APP-2025-' || LPAD(i::TEXT, 4, '0'),
                (ARRAY['SUBMITTED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN'])[1 + ((i-1) % 7)],
                '지원 동기: 한성전자의 기술력과 성장성에 매력을 느꼈습니다.',
                50 + (i * 2),
                (ARRAY['DOCUMENT','FIRST_INTERVIEW','SECOND_INTERVIEW','FINAL','OFFER'])[1 + ((i-1) % 5)],
                1 + ((i-1) % 5),
                NOW() - ((35 - i) * interval '2 days'), NOW(), v_s, v_s
            );

            -- Create interviews for applications in interview stage
            IF i % 7 IN (2, 3) THEN -- SCREENING or INTERVIEW status
                INSERT INTO hr_recruitment.interview (
                    id, tenant_id, application_id, interview_type, round,
                    status, scheduled_date, scheduled_time, duration_minutes,
                    location, interviewers, result, overall_score,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(), v_t, v_app_id,
                    CASE WHEN i % 2 = 0 THEN 'TECHNICAL' ELSE 'BEHAVIORAL' END,
                    1,
                    CASE WHEN i % 3 = 0 THEN 'COMPLETED' ELSE 'SCHEDULED' END,
                    CURRENT_DATE + (i % 14),
                    '14:00',
                    60,
                    '한성전자 본사 3층 면접실',
                    json_build_array(
                        json_build_object('id', 'e0000002-0000-0000-0000-000000000004', 'name', '정개발')
                    )::JSONB,
                    CASE WHEN i % 3 = 0 THEN 'PASS' ELSE NULL END,
                    CASE WHEN i % 3 = 0 THEN 80 + (i % 15) ELSE NULL END,
                    NOW() - ((35 - i) * interval '1 day'), NOW(), v_s, v_s
                );
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'Created 40 applicants, ~35 applications, interviews';
END $$;

-- ============================================================================
-- PART 3: Interview Scores (for completed interviews)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_dev_mgr UUID := 'e0000002-0000-0000-0000-000000000004';
    v_hr_adm UUID := 'e0000002-0000-0000-0000-000000000002';
    v_criteria TEXT[] := ARRAY['기술역량','커뮤니케이션','문제해결','팀워크','성장잠재력'];
    r RECORD;
    j INT;
BEGIN
    FOR r IN
        SELECT i.id as interview_id
        FROM hr_recruitment.interview i
        WHERE i.tenant_id = v_t AND i.status = 'COMPLETED'
    LOOP
        FOR j IN 1..5 LOOP
            INSERT INTO hr_recruitment.interview_score (
                tenant_id, interview_id, interviewer_id, interviewer_name,
                criterion, score, max_score, weight, comment,
                evaluated_at, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_t, r.interview_id, v_dev_mgr, '정개발',
                v_criteria[j], 3 + (j % 3), 5, 1.0,
                CASE WHEN j = 1 THEN '기술 면접 우수' WHEN j = 3 THEN '문제 해결 능력 양호' ELSE NULL END,
                NOW(), NOW(), NOW(), v_s, v_s
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Created interview scores';
END $$;

-- ============================================================================
-- PART 4: Offers (for hired applicants)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    r RECORD;
    v_seq INT := 0;
BEGIN
    FOR r IN
        SELECT a.id as app_id, ap.name as applicant_name
        FROM hr_recruitment.application a
        JOIN hr_recruitment.applicant ap ON a.applicant_id = ap.id
        WHERE a.tenant_id = v_t AND a.status IN ('OFFER', 'HIRED')
        LIMIT 8
    LOOP
        v_seq := v_seq + 1;
        INSERT INTO hr_recruitment.offer (
            tenant_id, application_id, offer_number, status,
            position_title, department_id, department_name,
            grade_code, grade_name, base_salary, signing_bonus,
            start_date, employment_type, probation_months,
            work_location, expires_at, sent_at,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_t, r.app_id,
            'ELEC-OFR-2025-' || LPAD(v_seq::TEXT, 4, '0'),
            CASE WHEN v_seq <= 4 THEN 'ACCEPTED' WHEN v_seq <= 6 THEN 'SENT' ELSE 'DRAFT' END,
            '선임 개발자', 'd0000002-0000-0000-0000-000000000016', '개발1팀',
            'G10', '대리', 55000000 + (v_seq * 5000000), 3000000,
            CURRENT_DATE + 30 + (v_seq * 7), 'FULL_TIME', 3,
            '서울특별시 강남구 한성전자 본사',
            NOW() + interval '14 days',
            CASE WHEN v_seq <= 6 THEN NOW() - (v_seq * interval '5 days') END,
            NOW() - (v_seq * interval '7 days'), NOW(), v_s, v_s
        );
    END LOOP;

    RAISE NOTICE 'Created offers: %', v_seq;
END $$;

COMMIT;

-- Verification
SELECT 'job_posting' as "table", COUNT(*)::TEXT as cnt FROM hr_recruitment.job_posting
UNION ALL SELECT 'applicant', COUNT(*)::TEXT FROM hr_recruitment.applicant
UNION ALL SELECT 'application', COUNT(*)::TEXT FROM hr_recruitment.application
UNION ALL SELECT 'interview', COUNT(*)::TEXT FROM hr_recruitment.interview
UNION ALL SELECT 'interview_score', COUNT(*)::TEXT FROM hr_recruitment.interview_score
UNION ALL SELECT 'offer', COUNT(*)::TEXT FROM hr_recruitment.offer;


-- ================================================
-- [12/13] 11_appointments_certificates.sql
-- ================================================
-- ============================================================================
-- 11_appointments_certificates.sql
-- 발령 & 증명서 샘플 데이터
-- ============================================================================
-- Tables (appointment):
--   appointment_draft (~20), appointment_detail (~60)
--   appointment_schedule (~5), appointment_history (~80)
-- Tables (certificate):
--   certificate_template (8 per tenant = 64), certificate_type (10 per tenant = 80)
--   certificate_request (~60), certificate_issue (~40), verification_log (~20)
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

BEGIN;

-- ============================================================================
-- PART 1: Appointment Drafts (발령안)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_hr UUID := 'e0000002-0000-0000-0000-000000000002';
    v_ceo UUID := 'e0000002-0000-0000-0000-000000000001';
    v_draft_id UUID;
BEGIN
    -- Draft 1: 2025-Q1 정기인사 (EXECUTED)
    v_draft_id := 'a0000002-0000-0000-0000-000000000001'::UUID;
    INSERT INTO hr_appointment.appointment_draft (id, tenant_id, draft_number, title, effective_date, description, status, approval_id, approved_by, approved_at, executed_at, executed_by, created_at, updated_at, created_by, updated_by)
    VALUES (v_draft_id, v_t, 'ELEC-APT-2025-001', '2025년 1분기 정기인사 발령', '2025-01-02', '2025년 1분기 정기 인사이동 및 승진 발령', 'EXECUTED', 'c0000002-0000-0000-0000-000000000006', v_ceo, NOW()-interval '45 days', NOW()-interval '40 days', v_hr, NOW()-interval '50 days', NOW()-interval '40 days', v_s, v_s)
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    -- Details for Draft 1 (3 transfers)
    INSERT INTO hr_appointment.appointment_detail (tenant_id, draft_id, employee_id, employee_name, employee_number, appointment_type, from_department_id, to_department_id, from_department_name, to_department_name, from_position_code, to_position_code, from_position_name, to_position_name, from_grade_code, to_grade_code, from_grade_name, to_grade_name, reason, status, executed_at, created_at, updated_at, created_by, updated_by)
    VALUES
    (v_t, v_draft_id, 'e0000002-0000-0000-0000-000000000005', '강선임', 'E-2024-0005', 'PROMOTION', 'd0000002-0000-0000-0000-000000000016', 'd0000002-0000-0000-0000-000000000016', '개발1팀', '개발1팀', 'P09', 'P08', '팀원', '선임', 'G11', 'G10', '사원', '대리', '우수 성과', 'EXECUTED', NOW()-interval '40 days', NOW()-interval '50 days', NOW()-interval '40 days', v_s, v_s),
    (v_t, v_draft_id, gen_random_uuid(), '임정우', 'E-2024-0015', 'TRANSFER', 'd0000002-0000-0000-0000-000000000017', 'd0000002-0000-0000-0000-000000000016', '개발2팀', '개발1팀', 'P08', 'P08', '선임', '선임', 'G10', 'G10', '대리', '대리', '조직 개편', 'EXECUTED', NOW()-interval '40 days', NOW()-interval '50 days', NOW()-interval '40 days', v_s, v_s),
    (v_t, v_draft_id, gen_random_uuid(), '한서연', 'E-2024-0020', 'TRANSFER', 'd0000002-0000-0000-0000-000000000022', 'd0000002-0000-0000-0000-000000000023', '국내영업팀', '해외영업팀', 'P08', 'P08', '선임', '선임', 'G10', 'G10', '대리', '대리', '해외 사업 확장', 'EXECUTED', NOW()-interval '40 days', NOW()-interval '50 days', NOW()-interval '40 days', v_s, v_s);

    -- Draft 2: 승진 발령 (APPROVED, not yet executed)
    v_draft_id := 'a0000002-0000-0000-0000-000000000002'::UUID;
    INSERT INTO hr_appointment.appointment_draft (id, tenant_id, draft_number, title, effective_date, description, status, approved_by, approved_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_draft_id, v_t, 'ELEC-APT-2025-002', '2025년 상반기 승진 발령', '2025-03-01', '2025년 상반기 승진 대상자 발령', 'APPROVED', v_ceo, NOW()-interval '5 days', NOW()-interval '10 days', NOW()-interval '5 days', v_s, v_s)
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    INSERT INTO hr_appointment.appointment_detail (tenant_id, draft_id, employee_id, employee_name, employee_number, appointment_type, from_grade_code, to_grade_code, from_grade_name, to_grade_name, from_position_code, to_position_code, from_position_name, to_position_name, reason, status, created_at, updated_at, created_by, updated_by)
    VALUES
    (v_t, v_draft_id, gen_random_uuid(), '최도윤', 'E-2024-0030', 'PROMOTION', 'G10', 'G09', '대리', '과장', 'P08', 'P07', '선임', '책임', '우수 업무 성과', 'PENDING', NOW()-interval '10 days', NOW(), v_s, v_s),
    (v_t, v_draft_id, gen_random_uuid(), '윤하은', 'E-2024-0035', 'PROMOTION', 'G11', 'G10', '사원', '대리', 'P09', 'P08', '팀원', '선임', '3년 이상 재직', 'PENDING', NOW()-interval '10 days', NOW(), v_s, v_s);

    -- Schedule for Draft 2
    INSERT INTO hr_appointment.appointment_schedule (tenant_id, draft_id, scheduled_date, scheduled_time, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_t, v_draft_id, '2025-03-01', '00:00:00', 'SCHEDULED', NOW()-interval '5 days', NOW(), v_s, v_s);

    -- Draft 3: DRAFT status (작성중)
    v_draft_id := 'a0000002-0000-0000-0000-000000000003'::UUID;
    INSERT INTO hr_appointment.appointment_draft (id, tenant_id, draft_number, title, effective_date, description, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_draft_id, v_t, 'ELEC-APT-2025-003', '2025년 조직개편 발령(안)', '2025-04-01', '2025년 상반기 조직 개편 발령안', 'DRAFT', NOW()-interval '2 days', NOW(), v_s, v_s)
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    INSERT INTO hr_appointment.appointment_detail (tenant_id, draft_id, employee_id, employee_name, employee_number, appointment_type, from_department_id, to_department_id, from_department_name, to_department_name, reason, status, created_at, updated_at, created_by, updated_by)
    VALUES
    (v_t, v_draft_id, gen_random_uuid(), '서시우', 'E-2024-0040', 'TRANSFER', 'd0000002-0000-0000-0000-000000000026', 'd0000002-0000-0000-0000-000000000027', '생산1팀', '생산2팀', '조직 개편', 'PENDING', NOW()-interval '2 days', NOW(), v_s, v_s);

    -- Draft 4: CANCELLED
    v_draft_id := 'a0000002-0000-0000-0000-000000000004'::UUID;
    INSERT INTO hr_appointment.appointment_draft (id, tenant_id, draft_number, title, effective_date, description, status, cancelled_at, cancelled_by, cancel_reason, created_at, updated_at, created_by, updated_by)
    VALUES (v_draft_id, v_t, 'ELEC-APT-2025-004', '긴급 인사이동 (취소)', '2025-01-15', '긴급 인사이동', 'CANCELLED', NOW()-interval '30 days', v_hr, '대상자 퇴사로 취소', NOW()-interval '35 days', NOW()-interval '30 days', v_s, v_s)
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    -- Drafts for other tenants (2 per tenant)
    INSERT INTO hr_appointment.appointment_draft (tenant_id, draft_number, title, effective_date, description, status, created_at, updated_at, created_by, updated_by)
    SELECT
        t.id,
        CASE WHEN s.n = 1 THEN t_code || '-APT-2025-001' ELSE t_code || '-APT-2025-002' END,
        CASE WHEN s.n = 1 THEN '2025년 정기인사 발령' ELSE '2025년 승진 발령' END,
        CASE WHEN s.n = 1 THEN '2025-01-02'::DATE ELSE '2025-03-01'::DATE END,
        CASE WHEN s.n = 1 THEN '정기 인사이동' ELSE '승진 발령' END,
        CASE WHEN s.n = 1 THEN 'EXECUTED' ELSE 'APPROVED' END,
        NOW() - (s.n * interval '20 days'), NOW(), 'system', 'system'
    FROM (
        SELECT 'a0000001-0000-0000-0000-000000000001'::UUID as tid, 'HD' as t_code, generate_series(1,2) as n
        UNION ALL SELECT 'a0000001-0000-0000-0000-000000000003'::UUID, 'SDI', generate_series(1,2)
        UNION ALL SELECT 'a0000001-0000-0000-0000-000000000008'::UUID, 'LIFE', generate_series(1,2)
    ) s
    JOIN tenant_common.tenant t ON t.id = s.tid
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    RAISE NOTICE 'Created appointment drafts and details';
END $$;

-- ============================================================================
-- PART 2: Appointment History (executed appointments)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    r RECORD;
BEGIN
    FOR r IN
        SELECT ad.tenant_id, ad.id as detail_id, ad.employee_id, ad.employee_name,
               ad.employee_number, ad.appointment_type, d.effective_date,
               json_build_object('department', ad.from_department_name, 'position', ad.from_position_name, 'grade', ad.from_grade_name)::JSONB as from_vals,
               json_build_object('department', ad.to_department_name, 'position', ad.to_position_name, 'grade', ad.to_grade_name)::JSONB as to_vals,
               ad.reason, d.draft_number
        FROM hr_appointment.appointment_detail ad
        JOIN hr_appointment.appointment_draft d ON d.id = ad.draft_id
        WHERE d.status = 'EXECUTED'
    LOOP
        INSERT INTO hr_appointment.appointment_history (
            tenant_id, detail_id, employee_id, employee_name, employee_number,
            appointment_type, effective_date, from_values, to_values, reason, draft_number,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            r.tenant_id, r.detail_id, r.employee_id, r.employee_name, r.employee_number,
            r.appointment_type, r.effective_date, r.from_vals, r.to_vals, r.reason, r.draft_number,
            NOW(), NOW(), v_s, v_s
        );
    END LOOP;

    RAISE NOTICE 'Created appointment history records';
END $$;

-- ============================================================================
-- PART 3: Certificate Templates (8 per tenant = 64)
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_names TEXT[] := ARRAY['재직증명서','경력증명서','퇴직증명서','급여증명서','원천징수영수증','재학증명서','건강진단서','가족관계증명서'];
    v_tid UUID;
    v_tpl_id UUID;
    i INT; j INT;
BEGIN
    FOR i IN 1..8 LOOP
        v_tid := v_tenant_ids[i];
        FOR j IN 1..8 LOOP
            v_tpl_id := ('c0' || LPAD(i::TEXT, 6, '0') || '-0000-0000-0000-' || LPAD(j::TEXT, 12, '0'))::UUID;
            INSERT INTO hr_certificate.certificate_template (
                id, tenant_id, name, description, content_html,
                header_html, footer_html, css_styles,
                page_size, orientation, margin_top, margin_bottom, margin_left, margin_right,
                include_company_seal, include_signature, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tpl_id, v_tid, v_names[j] || ' 템플릿', v_names[j] || ' PDF 생성 템플릿',
                '<html><body><h1>' || v_names[j] || '</h1><p>{{employee_name}} ({{employee_number}})</p><p>위 사실을 증명합니다.</p><p class="date">{{issue_date}}</p><p class="company">{{company_name}} 대표이사</p></body></html>',
                '<header><img src="{{logo_url}}" /><h2>{{company_name}}</h2></header>',
                '<footer><p>발급번호: {{issue_number}} | 검증코드: {{verification_code}}</p></footer>',
                'body { font-family: "Noto Sans KR"; } h1 { text-align: center; } .date { text-align: right; } .company { text-align: center; }',
                'A4', 'PORTRAIT', 25, 25, 20, 20,
                true, true, true,
                NOW(), NOW(), 'system', 'system'
            );
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created 64 certificate templates';
END $$;

-- ============================================================================
-- PART 4: Certificate Types (10 per tenant = 80)
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_codes TEXT[] := ARRAY['EMPLOYMENT','CAREER','RETIREMENT','SALARY','TAX_WITHHOLDING','ENROLLMENT','HEALTH','FAMILY','EXPERIENCE','LANGUAGE'];
    v_names TEXT[] := ARRAY['재직증명서','경력증명서','퇴직증명서','급여증명서','원천징수영수증','재학증명서','건강진단서','가족관계증명서','경험증명서','어학증명서'];
    v_names_en TEXT[] := ARRAY['Employment Certificate','Career Certificate','Retirement Certificate','Salary Certificate','Tax Withholding Receipt','Enrollment Certificate','Health Certificate','Family Certificate','Experience Certificate','Language Certificate'];
    v_requires_approval BOOLEAN[] := ARRAY[false, false, true, true, true, false, false, false, false, false];
    v_auto_issue BOOLEAN[] := ARRAY[true, true, false, false, false, true, true, true, true, true];
    v_valid_days INT[] := ARRAY[90, 90, 90, 30, 365, 90, 90, 90, 90, 90];
    v_fees DECIMAL[] := ARRAY[0, 0, 0, 1000, 0, 0, 0, 0, 0, 0];
    v_tid UUID; v_tpl_id UUID;
    i INT; j INT;
BEGIN
    FOR i IN 1..8 LOOP
        v_tid := v_tenant_ids[i];
        FOR j IN 1..10 LOOP
            -- Link template (use first 8, cycle for 9-10)
            v_tpl_id := ('c0' || LPAD(i::TEXT, 6, '0') || '-0000-0000-0000-' || LPAD((1 + ((j-1) % 8))::TEXT, 12, '0'))::UUID;
            INSERT INTO hr_certificate.certificate_type (
                tenant_id, code, name, name_en, description,
                template_id, requires_approval, auto_issue,
                valid_days, fee, max_copies_per_request, sort_order, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tid, v_codes[j], v_names[j], v_names_en[j],
                v_names[j] || ' 발급',
                v_tpl_id, v_requires_approval[j], v_auto_issue[j],
                v_valid_days[j], v_fees[j], 5, j, true,
                NOW(), NOW(), 'system', 'system'
            ) ON CONFLICT (tenant_id, code) DO NOTHING;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created 80 certificate types';
END $$;

-- ============================================================================
-- PART 5: Certificate Requests & Issues (한성전자 중심)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_type_id UUID;
    v_req_id UUID;
    v_issue_id UUID;
    v_dev_staff UUID := 'e0000002-0000-0000-0000-000000000006';
    v_hr_adm UUID := 'e0000002-0000-0000-0000-000000000002';
    r RECORD;
    i INT := 0;
BEGIN
    -- dev.staff 재직증명서 (ISSUED)
    SELECT id INTO v_type_id FROM hr_certificate.certificate_type WHERE tenant_id = v_t AND code = 'EMPLOYMENT';
    v_req_id := gen_random_uuid();
    INSERT INTO hr_certificate.certificate_request (
        id, tenant_id, certificate_type_id, employee_id, employee_name, employee_number,
        request_number, purpose, submission_target, copies, language,
        status, issued_at, issued_by,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        v_req_id, v_t, v_type_id, v_dev_staff, '조사원', 'E-2024-0006',
        'ELEC-CERT-2025-0001', '은행 대출용', '국민은행', 1, 'KO',
        'ISSUED', NOW()-interval '15 days', v_hr_adm,
        NOW()-interval '16 days', NOW()-interval '15 days', v_s, v_s
    ) ON CONFLICT (tenant_id, request_number) DO NOTHING;

    v_issue_id := gen_random_uuid();
    INSERT INTO hr_certificate.certificate_issue (
        id, tenant_id, request_id, issue_number, verification_code,
        issued_by, issued_at, download_count, verified_count, expires_at,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        v_issue_id, v_t, v_req_id, 'ELEC-ISS-2025-0001', 'VRF-A1B2C3D4',
        v_hr_adm, NOW()-interval '15 days', 1, 0, CURRENT_DATE + 75,
        NOW()-interval '15 days', NOW(), v_s, v_s
    ) ON CONFLICT (tenant_id, issue_number) DO NOTHING;

    -- Verification log (success)
    INSERT INTO hr_certificate.verification_log (
        issue_id, verification_code, verifier_ip, verifier_name, verifier_organization,
        is_valid, created_at, updated_at, created_by, updated_by
    ) VALUES (
        v_issue_id, 'VRF-A1B2C3D4', '203.0.113.10', '국민은행 담당자', '국민은행',
        true, NOW()-interval '10 days', NOW(), v_s, v_s
    );

    -- Bulk requests for 한성전자 employees
    FOR r IN
        SELECT e.id, e.name, e.employee_number,
               ct.id as type_id
        FROM hr_core.employee e
        CROSS JOIN hr_certificate.certificate_type ct
        WHERE e.tenant_id = v_t
          AND ct.tenant_id = v_t
          AND ct.code IN ('EMPLOYMENT', 'CAREER', 'SALARY')
          AND e.id != v_dev_staff
        ORDER BY e.id
        LIMIT 30
    LOOP
        i := i + 1;
        v_req_id := gen_random_uuid();
        INSERT INTO hr_certificate.certificate_request (
            id, tenant_id, certificate_type_id, employee_id, employee_name, employee_number,
            request_number, purpose, copies, language, status,
            issued_at, issued_by,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_req_id, v_t, r.type_id, r.id, r.name, r.employee_number,
            'ELEC-CERT-2025-' || LPAD((i + 1)::TEXT, 4, '0'),
            (ARRAY['은행 제출','관공서 제출','개인 보관','이직용'])[1 + (i % 4)],
            1, 'KO',
            (ARRAY['ISSUED','ISSUED','PENDING','REJECTED'])[1 + (i % 4)],
            CASE WHEN i % 4 < 2 THEN NOW() - (i * interval '3 days') END,
            CASE WHEN i % 4 < 2 THEN v_hr_adm END,
            NOW() - ((i + 1) * interval '3 days'), NOW(), v_s, v_s
        ) ON CONFLICT (tenant_id, request_number) DO NOTHING;

        -- Issue for ISSUED requests
        IF i % 4 < 2 THEN
            INSERT INTO hr_certificate.certificate_issue (
                tenant_id, request_id, issue_number, verification_code,
                issued_by, issued_at, download_count, expires_at,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_t, v_req_id,
                'ELEC-ISS-2025-' || LPAD((i + 1)::TEXT, 4, '0'),
                'VRF-' || UPPER(SUBSTRING(md5(i::TEXT) FROM 1 FOR 8)),
                v_hr_adm, NOW() - (i * interval '3 days'),
                CASE WHEN i % 2 = 0 THEN 1 ELSE 0 END,
                CURRENT_DATE + 90,
                NOW() - (i * interval '3 days'), NOW(), v_s, v_s
            ) ON CONFLICT (tenant_id, issue_number) DO NOTHING;
        END IF;
    END LOOP;

    -- Failed verification log
    INSERT INTO hr_certificate.verification_log (
        issue_id, verification_code, verifier_ip, verifier_name, verifier_organization,
        is_valid, failure_reason, created_at, updated_at, created_by, updated_by
    ) VALUES (
        NULL, 'VRF-INVALID99', '198.51.100.5', '사칭자', '불명',
        false, 'INVALID_CODE', NOW()-interval '5 days', NOW(), v_s, v_s
    ),
    (
        NULL, 'VRF-EXPIRED01', '198.51.100.10', '확인 담당자', '삼성화재',
        false, 'EXPIRED', NOW()-interval '3 days', NOW(), v_s, v_s
    );

    RAISE NOTICE 'Created certificate requests, issues, and verification logs';
END $$;

COMMIT;

-- Verification
SELECT 'appointment_draft' as "table", COUNT(*)::TEXT as cnt FROM hr_appointment.appointment_draft
UNION ALL SELECT 'appointment_detail', COUNT(*)::TEXT FROM hr_appointment.appointment_detail
UNION ALL SELECT 'appointment_schedule', COUNT(*)::TEXT FROM hr_appointment.appointment_schedule
UNION ALL SELECT 'appointment_history', COUNT(*)::TEXT FROM hr_appointment.appointment_history
UNION ALL SELECT 'certificate_template', COUNT(*)::TEXT FROM hr_certificate.certificate_template
UNION ALL SELECT 'certificate_type', COUNT(*)::TEXT FROM hr_certificate.certificate_type
UNION ALL SELECT 'certificate_request', COUNT(*)::TEXT FROM hr_certificate.certificate_request
UNION ALL SELECT 'certificate_issue', COUNT(*)::TEXT FROM hr_certificate.certificate_issue
UNION ALL SELECT 'verification_log', COUNT(*)::TEXT FROM hr_certificate.verification_log;


-- ================================================
-- [13/13] 12_notifications_files.sql
-- ================================================
-- ============================================================================
-- 12_notifications_files.sql
-- 알림 & 파일 메타데이터 샘플 데이터
-- ============================================================================
-- Tables:
--   notification_template (~128), notification_preference (~192)
--   notification (~150), file_metadata (~80)
-- Depends on: 01_tenants.sql, 05_employees.sql, 06_auth.sql
-- ============================================================================

SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

BEGIN;

-- ============================================================================
-- PART 1: Notification Templates (16 types × 8 tenants = 128)
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_codes TEXT[] := ARRAY[
        'APPROVAL_REQUESTED','APPROVAL_COMPLETED','APPROVAL_REJECTED',
        'LEAVE_APPROVED','LEAVE_REJECTED',
        'ATTENDANCE_ANOMALY','OVERTIME_WARNING',
        'APPOINTMENT_NOTICE','CERTIFICATE_ISSUED',
        'ANNOUNCEMENT_NEW','BIRTHDAY_NOTICE',
        'PASSWORD_EXPIRY','ACCOUNT_LOCKED',
        'RECRUITMENT_INTERVIEW','OFFER_SENT',
        'SYSTEM_MAINTENANCE'
    ];
    v_types TEXT[] := ARRAY[
        'APPROVAL','APPROVAL','APPROVAL',
        'LEAVE','LEAVE',
        'ATTENDANCE','ATTENDANCE',
        'APPOINTMENT','CERTIFICATE',
        'ANNOUNCEMENT','HR',
        'SECURITY','SECURITY',
        'RECRUITMENT','RECRUITMENT',
        'SYSTEM'
    ];
    v_names TEXT[] := ARRAY[
        '결재 요청 알림','결재 완료 알림','결재 반려 알림',
        '휴가 승인 알림','휴가 반려 알림',
        '출퇴근 이상 알림','초과근무 경고',
        '발령 통보','증명서 발급 완료',
        '새 공지사항','생일 축하',
        '비밀번호 만료 예정','계정 잠금 알림',
        '면접 일정 알림','채용 오퍼 발송',
        '시스템 점검 안내'
    ];
    v_bodies TEXT[] := ARRAY[
        '{{drafter_name}}님이 {{document_title}} 결재를 요청했습니다.',
        '{{document_title}} 결재가 완료되었습니다.',
        '{{document_title}} 결재가 반려되었습니다. 사유: {{reason}}',
        '{{employee_name}}님의 휴가 신청이 승인되었습니다. ({{start_date}} ~ {{end_date}})',
        '{{employee_name}}님의 휴가 신청이 반려되었습니다. 사유: {{reason}}',
        '{{employee_name}}님의 {{date}} 출퇴근 기록에 이상이 감지되었습니다.',
        '{{employee_name}}님의 주간 근무시간이 {{hours}}시간입니다. 52시간 한도에 주의하세요.',
        '{{employee_name}}님에 대한 {{type}} 발령이 {{effective_date}}부 시행됩니다.',
        '요청하신 {{certificate_type}} 증명서가 발급되었습니다.',
        '새 공지사항이 등록되었습니다: {{title}}',
        '오늘은 {{employee_name}}님의 생일입니다. 축하해주세요!',
        '비밀번호 만료까지 {{days}}일 남았습니다. 변경해주세요.',
        '{{username}} 계정이 로그인 실패 {{count}}회로 잠금되었습니다.',
        '{{applicant_name}}님과의 면접이 {{date}} {{time}}에 예정되어 있습니다.',
        '{{applicant_name}}님에게 채용 오퍼가 발송되었습니다.',
        '{{date}} {{start_time}}~{{end_time}} 시스템 점검이 예정되어 있습니다.'
    ];
    i INT; j INT;
BEGIN
    FOR i IN 1..8 LOOP
        FOR j IN 1..16 LOOP
            INSERT INTO hr_notification.notification_template (
                id, tenant_id, code, notification_type, channel, name,
                subject, body_template, description, is_active, variables,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_ids[i],
                v_codes[j], v_types[j], 'IN_APP', v_names[j],
                v_names[j], v_bodies[j], v_names[j] || ' 템플릿',
                true, NULL,
                NOW(), NOW(), 'system', 'system'
            ) ON CONFLICT (tenant_id, code) DO NOTHING;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created 128 notification templates';
END $$;

-- ============================================================================
-- PART 2: Notification Preferences (test accounts)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_users UUID[] := ARRAY[
        '00000002-0000-0000-0000-000000000001'::UUID,
        '00000002-0000-0000-0000-000000000002'::UUID,
        '00000002-0000-0000-0000-000000000003'::UUID,
        '00000002-0000-0000-0000-000000000004'::UUID,
        '00000002-0000-0000-0000-000000000005'::UUID,
        '00000002-0000-0000-0000-000000000006'::UUID
    ];
    v_types TEXT[] := ARRAY['APPROVAL','LEAVE','ATTENDANCE','APPOINTMENT','CERTIFICATE','ANNOUNCEMENT','HR','SECURITY','RECRUITMENT','SYSTEM'];
    v_channels TEXT[] := ARRAY['IN_APP','EMAIL'];
    i INT; j INT; k INT;
BEGIN
    FOR i IN 1..6 LOOP
        FOR j IN 1..10 LOOP
            FOR k IN 1..2 LOOP
                INSERT INTO hr_notification.notification_preference (
                    tenant_id, user_id, notification_type, channel, enabled,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    v_t, v_users[i], v_types[j], v_channels[k],
                    CASE WHEN k = 1 THEN true ELSE (j <= 4) END,
                    NOW(), NOW(), 'system', 'system'
                ) ON CONFLICT (tenant_id, user_id, notification_type, channel) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created notification preferences for 6 test accounts';
END $$;

-- ============================================================================
-- PART 3: Notifications for Test Accounts
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_n TIMESTAMPTZ := NOW();
    -- user_ids for recipients
    v_staff UUID := '00000002-0000-0000-0000-000000000006';
    v_mgr   UUID := '00000002-0000-0000-0000-000000000004';
    v_hr    UUID := '00000002-0000-0000-0000-000000000002';
    v_ceo   UUID := '00000002-0000-0000-0000-000000000001';

BEGIN
    -- dev.staff.elec: 5 UNREAD + 10 READ = 15 notifications
    -- UNREAD
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, link_url, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_staff, 'APPROVAL', 'IN_APP', '결재 완료 알림', '연차 휴가 신청 결재가 완료되었습니다.', '/approvals/c0000002-0000-0000-0000-000000000001', false, true, v_n - interval '1 hour', v_n - interval '1 hour', v_n - interval '1 hour', v_s, v_s),
    (v_t, v_staff, 'ANNOUNCEMENT', 'IN_APP', '새 공지사항', '2025년 설 연휴 근무 안내가 등록되었습니다.', '/announcements', false, true, v_n - interval '3 hours', v_n - interval '3 hours', v_n - interval '3 hours', v_s, v_s),
    (v_t, v_staff, 'HR', 'IN_APP', '생일 축하', '오늘은 강선임님의 생일입니다. 축하해주세요!', '/employees', false, true, v_n - interval '6 hours', v_n - interval '6 hours', v_n - interval '6 hours', v_s, v_s),
    (v_t, v_staff, 'ATTENDANCE', 'IN_APP', '출퇴근 이상 알림', '어제 퇴근 기록이 누락되었습니다.', '/attendance', false, true, v_n - interval '1 day', v_n - interval '1 day', v_n - interval '1 day', v_s, v_s),
    (v_t, v_staff, 'SECURITY', 'IN_APP', '비밀번호 만료 예정', '비밀번호 만료까지 7일 남았습니다. 변경해주세요.', '/settings/password', false, true, v_n - interval '2 days', v_n - interval '2 days', v_n - interval '2 days', v_s, v_s);

    -- READ
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, is_read, read_at, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_staff, 'APPROVAL', 'IN_APP', '결재 요청 접수', '출장 신청서가 접수되었습니다.', true, v_n - interval '3 days', true, v_n - interval '4 days', v_n - interval '4 days', v_n - interval '3 days', v_s, v_s),
    (v_t, v_staff, 'LEAVE', 'IN_APP', '휴가 승인', '1/20~21 연차가 승인되었습니다.', true, v_n - interval '28 days', true, v_n - interval '29 days', v_n - interval '29 days', v_n - interval '28 days', v_s, v_s),
    (v_t, v_staff, 'ANNOUNCEMENT', 'IN_APP', '공지사항', '2025년 신년 인사 메시지', true, v_n - interval '40 days', true, v_n - interval '41 days', v_n - interval '41 days', v_n - interval '40 days', v_s, v_s),
    (v_t, v_staff, 'SYSTEM', 'IN_APP', '시스템 점검', '1/15 02:00~06:00 정기 점검', true, v_n - interval '27 days', true, v_n - interval '28 days', v_n - interval '28 days', v_n - interval '27 days', v_s, v_s),
    (v_t, v_staff, 'CERTIFICATE', 'IN_APP', '증명서 발급', '재직증명서가 발급되었습니다.', true, v_n - interval '15 days', true, v_n - interval '16 days', v_n - interval '16 days', v_n - interval '15 days', v_s, v_s),
    (v_t, v_staff, 'ATTENDANCE', 'IN_APP', '근태 확인', '1월 근태 마감 확인 요청', true, v_n - interval '10 days', true, v_n - interval '11 days', v_n - interval '11 days', v_n - interval '10 days', v_s, v_s),
    (v_t, v_staff, 'HR', 'IN_APP', '인사 안내', '2025년 건강검진 일정 안내', true, v_n - interval '20 days', true, v_n - interval '21 days', v_n - interval '21 days', v_n - interval '20 days', v_s, v_s),
    (v_t, v_staff, 'APPROVAL', 'IN_APP', '구매 신청 접수', '모니터 구매 신청이 접수되었습니다.', true, v_n - interval '5 hours', true, v_n - interval '5 hours', v_n - interval '5 hours', v_n - interval '4 hours', v_s, v_s),
    (v_t, v_staff, 'ANNOUNCEMENT', 'IN_APP', '공지사항', '2025년 복리후생 안내', true, v_n - interval '35 days', true, v_n - interval '36 days', v_n - interval '36 days', v_n - interval '35 days', v_s, v_s),
    (v_t, v_staff, 'SECURITY', 'IN_APP', '로그인 안내', '새 기기에서 로그인 감지', true, v_n - interval '7 days', true, v_n - interval '7 days', v_n - interval '7 days', v_n - interval '7 days', v_s, v_s);

    -- dev.manager.elec: 3 UNREAD (결재 요청)
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, link_url, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_mgr, 'APPROVAL', 'IN_APP', '결재 요청', '강선임님이 연차 신청 결재를 요청했습니다.', '/approvals/c0000002-0000-0000-0000-000000000003', false, true, v_n - interval '1 day', v_n - interval '1 day', v_n - interval '1 day', v_s, v_s),
    (v_t, v_mgr, 'APPROVAL', 'IN_APP', '결재 요청', '강선임님이 초과근무 결재를 요청했습니다.', '/approvals/c0000002-0000-0000-0000-000000000004', false, true, v_n - interval '2 hours', v_n - interval '2 hours', v_n - interval '2 hours', v_s, v_s),
    (v_t, v_mgr, 'APPROVAL', 'IN_APP', '결재 요청', '조사원님이 구매신청 결재를 요청했습니다.', '/approvals/c0000002-0000-0000-0000-000000000005', false, true, v_n - interval '5 hours', v_n - interval '5 hours', v_n - interval '5 hours', v_s, v_s);

    -- hr.admin.elec: 2 UNREAD
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, link_url, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_hr, 'APPROVAL', 'IN_APP', '결재 요청', '박인사님이 인사변경 결재를 요청했습니다.', '/approvals/c0000002-0000-0000-0000-000000000009', false, true, v_n - interval '4 hours', v_n - interval '4 hours', v_n - interval '4 hours', v_s, v_s),
    (v_t, v_hr, 'RECRUITMENT', 'IN_APP', '면접 일정 알림', '내일 14:00 프론트엔드 개발자 1차 면접이 예정되어 있습니다.', '/recruitment/interviews', false, true, v_n - interval '6 hours', v_n - interval '6 hours', v_n - interval '6 hours', v_s, v_s);

    -- ceo.elec: 1 UNREAD
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, v_ceo, 'ANNOUNCEMENT', 'IN_APP', '2025년 1분기 경영 실적 보고서', '경영기획실에서 1분기 실적 보고서를 게시했습니다.', false, true, v_n - interval '2 hours', v_n - interval '2 hours', v_n - interval '2 hours', v_s, v_s);

    -- Bulk notifications for other tenants
    INSERT INTO hr_notification.notification (tenant_id, recipient_id, notification_type, channel, title, content, is_read, is_sent, sent_at, created_at, updated_at, created_by, updated_by)
    SELECT
        e.tenant_id,
        COALESCE(u.id, gen_random_uuid()),
        (ARRAY['APPROVAL','LEAVE','ATTENDANCE','ANNOUNCEMENT','SYSTEM'])[1 + (ROW_NUMBER() OVER() % 5)::INT],
        'IN_APP',
        '알림 ' || ROW_NUMBER() OVER(),
        '샘플 알림 내용입니다.',
        (ROW_NUMBER() OVER() % 3 != 0),
        true,
        NOW() - ((ROW_NUMBER() OVER() % 30) * interval '1 day'),
        NOW() - ((ROW_NUMBER() OVER() % 30) * interval '1 day'),
        NOW() - ((ROW_NUMBER() OVER() % 30) * interval '1 day'),
        'system', 'system'
    FROM hr_core.employee e
    LEFT JOIN tenant_common.users u ON u.employee_id = e.id
    WHERE e.tenant_id != 'a0000001-0000-0000-0000-000000000002'
      AND u.id IS NOT NULL
    LIMIT 80;

    RAISE NOTICE 'Created notifications for all test accounts';
END $$;

-- ============================================================================
-- PART 4: File Metadata
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_ref_types TEXT[] := ARRAY['PROFILE_PHOTO','APPROVAL_ATTACHMENT','ANNOUNCEMENT_ATTACHMENT','CERTIFICATE_PDF','RESUME','EMPLOYEE_DOCUMENT'];
    v_content_types TEXT[] := ARRAY['image/jpeg','application/pdf','application/pdf','application/pdf','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    v_names TEXT[] := ARRAY['profile.jpg','approval_doc.pdf','notice_attachment.pdf','certificate.pdf','resume.pdf','employment_contract.docx'];
    v_sizes BIGINT[] := ARRAY[245760, 1048576, 524288, 204800, 2097152, 153600];
    i INT; j INT;
    v_emp_id UUID;
    v_emp_name TEXT;
BEGIN
    -- Test account files
    FOR i IN 1..6 LOOP
        v_emp_id := ('e0000002-0000-0000-0000-' || LPAD(i::TEXT, 12, '0'))::UUID;
        SELECT name INTO v_emp_name FROM hr_core.employee WHERE id = v_emp_id;

        IF v_emp_name IS NULL THEN
            CONTINUE; -- Skip if employee not found
        END IF;

        FOR j IN 1..array_length(v_ref_types, 1) LOOP
            IF j > 3 AND i > 3 THEN CONTINUE; END IF; -- Not everyone has all file types

            INSERT INTO hr_file.file_metadata (
                tenant_id, original_name, stored_name, content_type, file_size,
                storage_path, bucket_name, storage_type, reference_type, reference_id,
                uploader_id, uploader_name, is_public, download_count, checksum,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_t,
                COALESCE(v_emp_name, 'unknown') || '_' || v_names[j],
                'elec/' || v_emp_id || '/' || gen_random_uuid() || '_' || v_names[j],
                v_content_types[j],
                v_sizes[j] + (i * 1024),
                'hr-platform-files/elec/' || v_ref_types[j] || '/' || v_emp_id,
                'hr-platform-files', 'S3',
                v_ref_types[j], v_emp_id,
                v_emp_id, v_emp_name,
                (j = 1), -- Only profile photos are public
                (CASE WHEN j <= 2 THEN i ELSE 0 END),
                md5(v_emp_id::TEXT || j::TEXT),
                NOW() - ((i * 10 + j) * interval '1 day'),
                NOW() - ((i * 10 + j) * interval '1 day'),
                v_s, v_s
            );
        END LOOP;
    END LOOP;

    -- Bulk files for other tenants
    INSERT INTO hr_file.file_metadata (
        tenant_id, original_name, stored_name, content_type, file_size,
        storage_path, bucket_name, storage_type, reference_type,
        uploader_id, uploader_name, created_at, updated_at, created_by, updated_by
    )
    SELECT
        e.tenant_id,
        e.name || '_profile.jpg',
        e.tenant_id || '/' || e.id || '/' || gen_random_uuid() || '.jpg',
        'image/jpeg',
        200000 + (ROW_NUMBER() OVER() * 1024),
        'hr-platform-files/' || e.tenant_id || '/PROFILE_PHOTO/' || e.id,
        'hr-platform-files', 'S3', 'PROFILE_PHOTO',
        e.id, e.name,
        NOW() - ((ROW_NUMBER() OVER() % 90) * interval '1 day'),
        NOW() - ((ROW_NUMBER() OVER() % 90) * interval '1 day'),
        'system', 'system'
    FROM hr_core.employee e
    WHERE e.tenant_id != 'a0000001-0000-0000-0000-000000000002'
    ORDER BY e.id
    LIMIT 50;

    RAISE NOTICE 'Created file metadata';
END $$;

COMMIT;

-- Verification
SELECT 'notification_template' as "table", COUNT(*)::TEXT as cnt FROM hr_notification.notification_template
UNION ALL SELECT 'notification_preference', COUNT(*)::TEXT FROM hr_notification.notification_preference
UNION ALL SELECT 'notification', COUNT(*)::TEXT FROM hr_notification.notification
UNION ALL SELECT 'file_metadata', COUNT(*)::TEXT FROM hr_file.file_metadata;
