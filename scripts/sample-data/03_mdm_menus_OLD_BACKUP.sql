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
