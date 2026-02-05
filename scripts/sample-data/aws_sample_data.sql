-- ============================================================================
-- HR SaaS Platform - AWS Environment Sample Data
-- Matches Keycloak realm-export.json users
-- Run this AFTER migrations are applied
-- ============================================================================

-- Set tenant context function (if not exists)
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. TENANT DATA (tenant_common schema)
-- ============================================================================

-- Tenant
INSERT INTO tenant_common.tenants (id, code, name, status, created_at, updated_at, created_by, updated_by)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DEMO_CORP', '데모 주식회사', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Tenant Policy
INSERT INTO tenant_common.tenant_policies (id, tenant_id, policy_type, policy_data, status, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'WORKING_HOURS', '{"start": "09:00", "end": "18:00", "breakTime": 60}', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'LEAVE_POLICY', '{"annualLeave": 15, "sickLeave": 10}', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Tenant Feature
INSERT INTO tenant_common.tenant_features (id, tenant_id, feature_code, enabled, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'APPROVAL', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ATTENDANCE', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'RECRUITMENT', true, NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Set tenant context for RLS
SELECT set_tenant_context('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- ============================================================================
-- 2. ORGANIZATION DATA (hr_core schema)
-- ============================================================================

-- Grades (직급)
INSERT INTO hr_core.grades (id, tenant_id, code, name, level, status, created_at, updated_at, created_by, updated_by)
VALUES
    ('33333333-3333-3333-3333-333333333001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CEO', '대표이사', 1, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DIRECTOR', '이사', 2, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MANAGER', '부장', 3, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SENIOR', '과장', 4, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'STAFF', '대리', 5, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('33333333-3333-3333-3333-333333333006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ASSOCIATE', '사원', 6, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Positions (직책)
INSERT INTO hr_core.positions (id, tenant_id, code, name, level, status, created_at, updated_at, created_by, updated_by)
VALUES
    ('44444444-4444-4444-4444-444444444001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CEO', '대표이사', 1, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DEPT_HEAD', '본부장', 2, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TEAM_LEAD', '팀장', 3, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('44444444-4444-4444-4444-444444444004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MEMBER', '팀원', 4, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Departments (부서) - Matches Keycloak department_ids
INSERT INTO hr_core.departments (id, tenant_id, code, name, parent_id, status, created_at, updated_at, created_by, updated_by)
VALUES
    ('22222222-2222-2222-2222-222222222001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MGMT', '경영지원본부', NULL, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'HR', '인사팀', '22222222-2222-2222-2222-222222222001', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'DEV', '개발팀', NULL, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    ('22222222-2222-2222-2222-222222222004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SALES', '영업팀', NULL, 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. EMPLOYEE DATA (hr_core schema) - Matches Keycloak users
-- ============================================================================

INSERT INTO hr_core.employees (
    id, tenant_id, employee_number, name, email, phone,
    department_id, position_id, grade_id,
    hire_date, status, employment_type,
    created_at, updated_at, created_by, updated_by
) VALUES
    -- CEO (ceo user)
    ('11111111-1111-1111-1111-111111111001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP001', '김영수', 'ceo@demo-corp.com', '010-1111-0001',
     '22222222-2222-2222-2222-222222222001', '44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333001',
     '2010-01-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

    -- HR Director (hr.director user)
    ('11111111-1111-1111-1111-111111111002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP002', '박민정', 'hr.director@demo-corp.com', '010-1111-0002',
     '22222222-2222-2222-2222-222222222002', '44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333002',
     '2015-03-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

    -- HR Manager (hr.manager user)
    ('11111111-1111-1111-1111-111111111003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP003', '이수진', 'hr.manager@demo-corp.com', '010-1111-0003',
     '22222222-2222-2222-2222-222222222002', '44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333003',
     '2018-05-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

    -- Dev Director (dev.director user)
    ('11111111-1111-1111-1111-111111111004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP004', '최지훈', 'dev.director@demo-corp.com', '010-1111-0004',
     '22222222-2222-2222-2222-222222222003', '44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333002',
     '2016-02-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

    -- Dev Manager (dev.manager user)
    ('11111111-1111-1111-1111-111111111005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP005', '강현우', 'dev.manager@demo-corp.com', '010-1111-0005',
     '22222222-2222-2222-2222-222222222003', '44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333003',
     '2019-01-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

    -- Dev Senior (dev.senior user)
    ('11111111-1111-1111-1111-111111111006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP006', '윤정호', 'dev.senior@demo-corp.com', '010-1111-0006',
     '22222222-2222-2222-2222-222222222003', '44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333004',
     '2020-03-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

    -- Dev Staff 1 (dev.staff1 user)
    ('11111111-1111-1111-1111-111111111007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP007', '장서연', 'dev.staff1@demo-corp.com', '010-1111-0007',
     '22222222-2222-2222-2222-222222222003', '44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333005',
     '2022-01-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

    -- Dev Staff 2 (dev.staff2 user)
    ('11111111-1111-1111-1111-111111111008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP008', '임민준', 'dev.staff2@demo-corp.com', '010-1111-0008',
     '22222222-2222-2222-2222-222222222003', '44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333006',
     '2023-03-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

    -- Sales Director (sales.director user)
    ('11111111-1111-1111-1111-111111111009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP009', '한하늘', 'sales.director@demo-corp.com', '010-1111-0009',
     '22222222-2222-2222-2222-222222222004', '44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333002',
     '2017-06-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),

    -- Sales Staff (sales.staff user)
    ('11111111-1111-1111-1111-111111111010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP010', '오유진', 'sales.staff@demo-corp.com', '010-1111-0010',
     '22222222-2222-2222-2222-222222222004', '44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333005',
     '2021-09-01', 'ACTIVE', 'REGULAR',
     NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. ATTENDANCE DATA (hr_attendance schema)
-- ============================================================================

-- Leave Balance for 2026
INSERT INTO hr_attendance.leave_balances (
    id, tenant_id, employee_id, year, leave_type, total_days, used_days, pending_days, carried_over_days,
    created_at, updated_at, created_by, updated_by
)
SELECT
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    e.id,
    2026,
    'ANNUAL',
    15.0,
    2.0,
    0.0,
    3.0,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
FROM hr_core.employees e
WHERE e.tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ON CONFLICT DO NOTHING;

-- Holiday 2026
INSERT INTO hr_attendance.holidays (id, tenant_id, name, date, year, holiday_type, created_at, updated_at, created_by, updated_by)
VALUES
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '신정', '2026-01-01', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '설날', '2026-02-17', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '설날연휴', '2026-02-18', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '설날연휴', '2026-02-19', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '삼일절', '2026-03-01', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '어린이날', '2026-05-05', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '현충일', '2026-06-06', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '광복절', '2026-08-15', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '추석', '2026-10-03', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '추석연휴', '2026-10-04', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '추석연휴', '2026-10-05', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '개천절', '2026-10-03', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '한글날', '2026-10-09', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '크리스마스', '2026-12-25', 2026, 'NATIONAL', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Sample Attendance Records (today)
INSERT INTO hr_attendance.attendance_records (
    id, tenant_id, employee_id, work_date, check_in_time, check_out_time, work_hours, status,
    created_at, updated_at, created_by, updated_by
)
SELECT
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    e.id,
    CURRENT_DATE,
    '09:00:00'::TIME,
    NULL,
    0,
    'NORMAL',
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
FROM hr_core.employees e
WHERE e.tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. APPROVAL DATA (hr_approval schema)
-- ============================================================================

-- Approval Templates
INSERT INTO hr_approval.approval_templates (
    id, tenant_id, name, document_type, status,
    created_at, updated_at, created_by, updated_by
) VALUES
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '연차휴가 신청서', 'LEAVE_REQUEST', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '출장 신청서', 'BUSINESS_TRIP', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '지출 결의서', 'EXPENSE', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '초과근무 신청서', 'OVERTIME', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. NOTIFICATION DATA (hr_notification schema)
-- ============================================================================

-- Notification Templates
INSERT INTO hr_notification.notification_templates (
    id, tenant_id, name, title_template, body_template, notification_type, channel, status,
    created_at, updated_at, created_by, updated_by
) VALUES
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '결재 요청 알림', '새로운 결재 요청', '{{drafter_name}}님이 {{document_type}} 결재를 요청했습니다.', 'APPROVAL_REQUEST', 'IN_APP', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '결재 완료 알림', '결재가 완료되었습니다', '{{document_type}} 결재가 {{result}}되었습니다.', 'APPROVAL_COMPLETE', 'IN_APP', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
    (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '공지사항 알림', '새로운 공지사항', '{{title}}', 'ANNOUNCEMENT', 'IN_APP', 'ACTIVE', NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETE
-- ============================================================================

SELECT 'AWS Sample data inserted successfully!' as status;
SELECT 'Tenant: DEMO_CORP (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)' as info;
SELECT 'Employees: 10' as count;
SELECT 'Departments: 4' as count;
