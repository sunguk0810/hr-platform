-- ============================================
-- V11: Seed Initial Menu Data
-- Based on PRD menu structure and permissions
-- ============================================

-- Helper function to insert menus with permissions
DO $$
DECLARE
    v_dashboard_id UUID;
    v_my_info_id UUID;
    v_employees_id UUID;
    v_organization_id UUID;
    v_appointments_id UUID;
    v_attendance_id UUID;
    v_approvals_id UUID;
    v_certificates_id UUID;
    v_recruitment_id UUID;
    v_transfer_id UUID;
    v_headcount_id UUID;
    v_condolence_id UUID;
    v_committee_id UUID;
    v_employee_card_id UUID;
    v_notifications_id UUID;
    v_settings_id UUID;
    v_mdm_id UUID;
    v_audit_id UUID;
    v_tenants_id UUID;
    v_help_id UUID;
    v_announcements_id UUID;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN

-- ============================================
-- Level 1: Top-level Menus
-- ============================================

-- Dashboard (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'DASHBOARD', '대시보드', 'Dashboard', '/dashboard', 'LayoutDashboard', 1, 10, true, true, 1, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_dashboard_id;

-- My Info (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'MY_INFO', '내 정보', 'My Info', '/my-info', 'User', 1, 20, true, false, null, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_my_info_id;

-- Employees (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'EMPLOYEES', '인사정보', 'HR Information', '/employees', 'Users', 1, 30, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_employees_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES (v_employees_id, 'PERMISSION', 'employee:read');

-- Organization (accessible by all for view)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'ORGANIZATION', '조직관리', 'Organization', '/organization', 'Building2', 1, 40, true, true, 2, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_organization_id;

-- Appointments (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'APPOINTMENTS', '발령관리', 'Appointments', '/appointments', 'UserCog', 1, 50, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_appointments_id;

-- Attendance (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'ATTENDANCE', '근태/휴가', 'Attendance', '/attendance', 'Calendar', 1, 60, true, true, 3, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_attendance_id;

-- Approvals (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'APPROVALS', '전자결재', 'Approvals', '/approvals', 'FileCheck', 1, 70, true, true, 4, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_approvals_id;

-- Certificates (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'CERTIFICATES', '증명서', 'Certificates', '/certificates', 'FileText', 1, 80, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_certificates_id;

-- Recruitment (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'RECRUITMENT', '채용관리', 'Recruitment', '/recruitment', 'Briefcase', 1, 90, true, false, 'RECRUITMENT', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_recruitment_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_recruitment_id, 'PERMISSION', 'recruitment:read'),
    (v_recruitment_id, 'ROLE', 'HR_MANAGER');

-- Transfer (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'TRANSFER', '계열사 인사이동', 'Inter-company Transfer', '/transfer', 'ArrowLeftRight', 1, 100, true, false, 'INTER_COMPANY_TRANSFER', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_transfer_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_transfer_id, 'PERMISSION', 'transfer:read'),
    (v_transfer_id, 'ROLE', 'HR_MANAGER');

-- Headcount (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'HEADCOUNT', '정현원 관리', 'Headcount', '/headcount', 'UsersRound', 1, 110, true, false, 'HEADCOUNT_MANAGEMENT', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_headcount_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_headcount_id, 'PERMISSION', 'headcount:read'),
    (v_headcount_id, 'ROLE', 'HR_MANAGER');

-- Condolence
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'CONDOLENCE', '경조비 관리', 'Condolence', '/condolence', 'Heart', 1, 120, true, false, 'CONDOLENCE_MANAGEMENT', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_condolence_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES (v_condolence_id, 'PERMISSION', 'condolence:read');

-- Committee (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'COMMITTEE', '위원회 관리', 'Committee', '/committee', 'Users2', 1, 130, true, false, 'COMMITTEE_MANAGEMENT', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_committee_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_committee_id, 'PERMISSION', 'committee:read'),
    (v_committee_id, 'ROLE', 'HR_MANAGER');

-- Employee Card
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'EMPLOYEE_CARD', '사원증 관리', 'Employee Card', '/employee-card', 'CreditCard', 1, 140, true, false, 'EMPLOYEE_CARD', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_employee_card_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES (v_employee_card_id, 'PERMISSION', 'employee-card:read');

-- Notifications (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'NOTIFICATIONS', '알림', 'Notifications', '/notifications', 'Bell', 1, 150, true, true, 5, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_notifications_id;

-- Settings (accessible by all, children have restrictions)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'SETTINGS', '설정', 'Settings', '/settings', 'Settings', 1, 160, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_settings_id;

-- MDM (admin permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'MDM', '기준정보 관리', 'Master Data', '/mdm', 'Database', 1, 170, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_mdm_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_mdm_id, 'PERMISSION', 'mdm:read'),
    (v_mdm_id, 'ROLE', 'TENANT_ADMIN');

-- Audit (admin permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'AUDIT', '감사 로그', 'Audit Log', '/audit', 'Shield', 1, 180, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_audit_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_audit_id, 'PERMISSION', 'audit:read'),
    (v_audit_id, 'ROLE', 'TENANT_ADMIN');

-- Tenants (super admin only)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'TENANTS', '테넌트 관리', 'Tenant Management', '/admin/tenants', 'Building', 1, 190, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_tenants_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_tenants_id, 'PERMISSION', 'tenant:admin'),
    (v_tenants_id, 'ROLE', 'SUPER_ADMIN');

-- Help (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'HELP', '도움말', 'Help', '/help', 'HelpCircle', 1, 200, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_help_id;

-- Announcements (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'ANNOUNCEMENTS', '공지사항', 'Announcements', '/announcements', 'Megaphone', 1, 210, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_announcements_id;

-- ============================================
-- Level 2: Child Menus
-- ============================================

-- Organization children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_organization_id, 'ORG_DEPARTMENTS', '부서 목록', 'Departments', '/organization/departments', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_organization_id, 'ORG_GRADES', '직급 관리', 'Grades', '/organization/grades', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_organization_id, 'ORG_POSITIONS', '직책 관리', 'Positions', '/organization/positions', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_organization_id, 'ORG_HISTORY', '변경 이력', 'History', '/organization/history', 2, 40, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Add permission for grade/position management
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'organization:write' FROM tenant_common.menu_item WHERE code = 'ORG_GRADES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'organization:write' FROM tenant_common.menu_item WHERE code = 'ORG_POSITIONS';

-- Appointment children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_appointments_id, 'APPOINTMENT_NEW', '발령안 작성', 'New Appointment', '/appointments/new', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'appointment:write' FROM tenant_common.menu_item WHERE code = 'APPOINTMENT_NEW';

-- Attendance children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_attendance_id, 'LEAVE_REQUEST', '휴가 신청', 'Leave Request', '/attendance/leave', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'MY_LEAVE', '내 휴가', 'My Leave', '/attendance/my-leave', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'LEAVE_CALENDAR', '휴가 캘린더', 'Leave Calendar', '/attendance/leave/calendar', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'LEAVE_APPROVAL', '휴가 승인', 'Leave Approval', '/attendance/leave/approval', 2, 40, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'OVERTIME', '초과근무', 'Overtime', '/attendance/overtime', 2, 50, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'WORK_HOURS', '52시간 모니터링', 'Work Hours', '/attendance/work-hours', 2, 60, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Add permissions for leave approval and work hours
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'attendance:approve' FROM tenant_common.menu_item WHERE code = 'LEAVE_APPROVAL';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TEAM_LEADER' FROM tenant_common.menu_item WHERE code = 'LEAVE_APPROVAL';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'attendance:read' FROM tenant_common.menu_item WHERE code = 'WORK_HOURS';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TEAM_LEADER' FROM tenant_common.menu_item WHERE code = 'WORK_HOURS';

-- Approval children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_approvals_id, 'APPROVAL_NEW', '결재 작성', 'New Approval', '/approvals/new', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_approvals_id, 'MY_APPROVALS', '내 결재', 'My Approvals', '/approvals/my', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_approvals_id, 'DELEGATION', '결재 위임', 'Delegation', '/approvals/delegation', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Certificate children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_certificates_id, 'CERT_REQUEST', '증명서 신청', 'Request Certificate', '/certificates/request', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_certificates_id, 'CERT_ISSUED', '발급 이력', 'Issue History', '/certificates/issued', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_certificates_id, 'CERT_VERIFY', '진위확인', 'Verify', '/certificates/verify', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Recruitment children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_recruitment_id, 'JOB_POSTING_NEW', '공고 등록', 'New Posting', '/recruitment/jobs/new', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_recruitment_id, 'APPLICATIONS', '지원서 관리', 'Applications', '/recruitment/applications', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_recruitment_id, 'INTERVIEWS', '면접 일정', 'Interviews', '/recruitment/interviews', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_recruitment_id, 'MY_INTERVIEWS', '내 면접', 'My Interviews', '/recruitment/my-interviews', 2, 40, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'recruitment:write' FROM tenant_common.menu_item WHERE code = 'JOB_POSTING_NEW';

-- Transfer children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_transfer_id, 'TRANSFER_NEW', '인사이동 요청', 'New Transfer', '/transfer/new', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'transfer:write' FROM tenant_common.menu_item WHERE code = 'TRANSFER_NEW';

-- Headcount children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_headcount_id, 'HEADCOUNT_REQUESTS', '변경 요청', 'Requests', '/headcount/requests', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Settings children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_settings_id, 'APPROVAL_TEMPLATES', '결재 양식 관리', 'Approval Templates', '/settings/approval-templates', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_settings_id, 'PRIVACY_ACCESS', '개인정보 열람 이력', 'Privacy Access Log', '/settings/privacy-access', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_settings_id, 'DELEGATION_RULES', '위임전결 규칙', 'Delegation Rules', '/settings/delegation-rules', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'approval:admin' FROM tenant_common.menu_item WHERE code = 'APPROVAL_TEMPLATES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN' FROM tenant_common.menu_item WHERE code = 'APPROVAL_TEMPLATES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'employee:read:sensitive' FROM tenant_common.menu_item WHERE code = 'PRIVACY_ACCESS';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN' FROM tenant_common.menu_item WHERE code = 'PRIVACY_ACCESS';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'approval:admin' FROM tenant_common.menu_item WHERE code = 'DELEGATION_RULES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN' FROM tenant_common.menu_item WHERE code = 'DELEGATION_RULES';

-- MDM children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_mdm_id, 'MDM_CODE_GROUPS', '코드그룹 관리', 'Code Groups', '/mdm/code-groups', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_mdm_id, 'MDM_COMMON_CODES', '공통코드 관리', 'Common Codes', '/mdm/common-codes', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_mdm_id, 'MDM_TENANT_CODES', '테넌트 코드 관리', 'Tenant Codes', '/mdm/tenant-codes', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'mdm:write' FROM tenant_common.menu_item WHERE code = 'MDM_TENANT_CODES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN' FROM tenant_common.menu_item WHERE code = 'MDM_TENANT_CODES';

-- Help children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_help_id, 'HELP_GUIDE', '사용자 가이드', 'User Guide', '/help/guide', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_help_id, 'HELP_FAQ', '자주 묻는 질문', 'FAQ', '/help/faq', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_help_id, 'HELP_CONTACT', '문의하기', 'Contact', '/help/contact', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

END $$;

-- Output results
SELECT
    mi.code,
    mi.name,
    mi.path,
    mi.level,
    mi.sort_order,
    COALESCE(p.code, '') as parent,
    ARRAY_AGG(DISTINCT mp.permission_value) FILTER (WHERE mp.permission_value IS NOT NULL) as permissions
FROM tenant_common.menu_item mi
LEFT JOIN tenant_common.menu_item p ON mi.parent_id = p.id
LEFT JOIN tenant_common.menu_permission mp ON mi.id = mp.menu_item_id
GROUP BY mi.code, mi.name, mi.path, mi.level, mi.sort_order, p.code
ORDER BY mi.level, mi.sort_order;
