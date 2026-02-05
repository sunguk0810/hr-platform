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
