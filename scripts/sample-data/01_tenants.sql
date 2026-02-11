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
