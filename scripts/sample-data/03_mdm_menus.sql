-- ============================================================================
-- 03_mdm_menus.sql
-- 메뉴 트리, 권한, 테넌트 메뉴 설정 생성
-- React 라우트(frontend/apps/web/src/routes/config.ts)와 동기화
-- Lucide 아이콘 사용 (PascalCase)
-- ============================================================================

-- 이전 실패한 트랜잭션 정리 (DataGrip/pgAdmin 호환)
ROLLBACK;

BEGIN;

-- ============================================================================
-- 0. 기존 메뉴 데이터 삭제 (CASCADE로 자식 레코드도 함께 삭제)
-- ============================================================================

-- tenant_menu_config 먼저 삭제 (외래 키 제약)
DELETE FROM tenant_common.tenant_menu_config WHERE menu_item_id IN (
    SELECT id FROM tenant_common.menu_item WHERE is_system = true
);

-- menu_permission 삭제
DELETE FROM tenant_common.menu_permission WHERE menu_item_id IN (
    SELECT id FROM tenant_common.menu_item WHERE is_system = true
);

-- menu_item 삭제 (부모-자식 순서 고려 필요 없음, CASCADE 설정됨)
DELETE FROM tenant_common.menu_item WHERE is_system = true;

-- ============================================================================
-- 1. 시스템 메뉴 항목 (Level 1 - 루트 메뉴)
-- tenant_id = NULL, is_system = true, menu_type = 'INTERNAL'
-- ============================================================================

-- ============================================================================
-- 그룹 1: 메인 (MAIN)
-- ============================================================================

-- 1-1. 대시보드
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000001',
    NULL, NULL, 'DASHBOARD', '대시보드', 'Dashboard', '/dashboard', 'LayoutDashboard',
    'INTERNAL', 1, 1, 'MAIN',
    true, true, true, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 1-2. 내 정보
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000002',
    NULL, NULL, 'MY_INFO', '내 정보', 'My Info', '/my-info', 'User',
    'INTERNAL', 1, 2, 'MAIN',
    true, true, true, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 1-3. 공지사항
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000003',
    NULL, NULL, 'ANNOUNCEMENTS', '공지사항', 'Announcements', '/announcements', 'Megaphone',
    'INTERNAL', 1, 3, 'MAIN',
    true, true, true, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 1-4. 알림
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000004',
    NULL, NULL, 'NOTIFICATIONS', '알림', 'Notifications', '/notifications', 'Bell',
    'INTERNAL', 1, 4, 'MAIN',
    true, true, true, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 1-5. 조직도
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000005',
    NULL, NULL, 'ORG_CHART', '조직도', 'Org Chart', '/org-chart', 'Building2',
    'INTERNAL', 1, 5, 'MAIN',
    true, true, true, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- ============================================================================
-- 그룹 2: 인사관리 (HR)
-- ============================================================================

-- 2-1. 인사정보 (직원 목록)
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000010',
    NULL, NULL, 'EMPLOYEES', '인사정보', 'Employees', '/employees', 'Users',
    'INTERNAL', 1, 10, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-1-1. 직원 등록 (show_in_nav=false: 페이지는 있지만 메뉴에 표시 안함)
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000011',
    NULL, '00000001-0000-0000-0000-000000000010', 'EMPLOYEE_CREATE', '직원 등록', 'Create Employee', '/employees/new', 'UserPlus',
    'INTERNAL', 2, 1, 'HR',
    true, true, false, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-2. 조직관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000015',
    NULL, NULL, 'ORGANIZATION', '조직관리', 'Organization', NULL, 'Building2',
    'INTERNAL', 1, 15, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-2-1. 부서 목록
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000016',
    NULL, '00000001-0000-0000-0000-000000000015', 'DEPARTMENTS', '부서 목록', 'Departments', '/organization/departments', 'Building',
    'INTERNAL', 2, 1, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-2-2. 직급 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000017',
    NULL, '00000001-0000-0000-0000-000000000015', 'GRADES', '직급 관리', 'Grades', '/organization/grades', 'BarChart3',
    'INTERNAL', 2, 2, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-2-3. 직책 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000018',
    NULL, '00000001-0000-0000-0000-000000000015', 'POSITIONS', '직책 관리', 'Positions', '/organization/positions', 'Award',
    'INTERNAL', 2, 3, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-2-4. 변경 이력
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000019',
    NULL, '00000001-0000-0000-0000-000000000015', 'ORG_HISTORY', '변경 이력', 'History', '/organization/history', 'Clock',
    'INTERNAL', 2, 4, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-3. 발령관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000020',
    NULL, NULL, 'APPOINTMENTS', '발령관리', 'Appointments', '/appointments', 'UserCog',
    'INTERNAL', 1, 20, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-3-1. 발령안 작성
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000021',
    NULL, '00000001-0000-0000-0000-000000000020', 'APPOINTMENT_CREATE', '발령안 작성', 'New Appointment', '/appointments/new', 'Plus',
    'INTERNAL', 2, 1, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-4. 계열사 인사이동
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000025',
    NULL, NULL, 'TRANSFER', '계열사 인사이동', 'Transfer', '/transfer', 'ArrowLeftRight',
    'INTERNAL', 1, 25, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-4-1. 인사이동 요청
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000026',
    NULL, '00000001-0000-0000-0000-000000000025', 'TRANSFER_REQUEST', '인사이동 요청', 'New Transfer', '/transfer/new', 'Plus',
    'INTERNAL', 2, 1, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-5. 정현원 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000030',
    NULL, NULL, 'HEADCOUNT', '정현원 관리', 'Headcount', '/headcount', 'UsersRound',
    'INTERNAL', 1, 30, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-5-1. 변경 요청
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000031',
    NULL, '00000001-0000-0000-0000-000000000030', 'HEADCOUNT_REQUESTS', '변경 요청', 'Change Requests', '/headcount/requests', 'FileText',
    'INTERNAL', 2, 1, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-6. 채용관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000035',
    NULL, NULL, 'RECRUITMENT', '채용관리', 'Recruitment', '/recruitment', 'Briefcase',
    'INTERNAL', 1, 35, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-6-1. 공고 등록
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000036',
    NULL, '00000001-0000-0000-0000-000000000035', 'JOB_POSTING_CREATE', '공고 등록', 'New Job Posting', '/recruitment/jobs/new', 'Plus',
    'INTERNAL', 2, 1, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-6-2. 지원서 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000037',
    NULL, '00000001-0000-0000-0000-000000000035', 'APPLICATIONS', '지원서 관리', 'Applications', '/recruitment/applications', 'FileText',
    'INTERNAL', 2, 2, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-6-3. 면접 일정
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000038',
    NULL, '00000001-0000-0000-0000-000000000035', 'INTERVIEWS', '면접 일정', 'Interviews', '/recruitment/interviews', 'CalendarDays',
    'INTERNAL', 2, 3, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2-6-4. 내 면접
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000039',
    NULL, '00000001-0000-0000-0000-000000000035', 'MY_INTERVIEWS', '내 면접', 'My Interviews', '/recruitment/my-interviews', 'UserCircle',
    'INTERNAL', 2, 4, 'HR',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- ============================================================================
-- 그룹 3: 근무관리 (ATTENDANCE)
-- ============================================================================

-- 3-1. 근태/휴가
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000040',
    NULL, NULL, 'ATTENDANCE', '근태/휴가', 'Attendance', '/attendance', 'Calendar',
    'INTERNAL', 1, 40, 'ATTENDANCE',
    true, true, true, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3-1-1. 휴가 신청
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000041',
    NULL, '00000001-0000-0000-0000-000000000040', 'LEAVE_REQUEST', '휴가 신청', 'Leave Request', '/attendance/leave', 'Plus',
    'INTERNAL', 2, 1, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3-1-2. 내 휴가
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000042',
    NULL, '00000001-0000-0000-0000-000000000040', 'MY_LEAVE', '내 휴가', 'My Leave', '/attendance/my-leave', 'UserCircle',
    'INTERNAL', 2, 2, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3-1-3. 휴가 캘린더
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000043',
    NULL, '00000001-0000-0000-0000-000000000040', 'LEAVE_CALENDAR', '휴가 캘린더', 'Leave Calendar', '/attendance/leave/calendar', 'CalendarDays',
    'INTERNAL', 2, 3, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3-1-4. 휴가 승인
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000044',
    NULL, '00000001-0000-0000-0000-000000000040', 'LEAVE_APPROVAL', '휴가 승인', 'Leave Approval', '/attendance/leave/approval', 'Check',
    'INTERNAL', 2, 4, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3-1-5. 초과근무
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000045',
    NULL, '00000001-0000-0000-0000-000000000040', 'OVERTIME', '초과근무', 'Overtime', '/attendance/overtime', 'Clock',
    'INTERNAL', 2, 5, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3-1-6. 52시간 모니터링
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000046',
    NULL, '00000001-0000-0000-0000-000000000040', 'WORK_HOURS', '52시간 모니터링', 'Work Hour Monitor', '/attendance/work-hours', 'Activity',
    'INTERNAL', 2, 6, 'ATTENDANCE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- ============================================================================
-- 그룹 4: 전자결재 (APPROVAL)
-- ============================================================================

-- 4-1. 전자결재
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000050',
    NULL, NULL, 'APPROVALS', '전자결재', 'Approvals', '/approvals', 'FileCheck',
    'INTERNAL', 1, 50, 'APPROVAL',
    true, true, true, true,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 4-1-1. 결재 작성
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000051',
    NULL, '00000001-0000-0000-0000-000000000050', 'APPROVAL_CREATE', '결재 작성', 'New Approval', '/approvals/new', 'Plus',
    'INTERNAL', 2, 1, 'APPROVAL',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 4-1-2. 내 결재
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000052',
    NULL, '00000001-0000-0000-0000-000000000050', 'MY_APPROVALS', '내 결재', 'My Approvals', '/approvals/my', 'UserCircle',
    'INTERNAL', 2, 2, 'APPROVAL',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 4-1-3. 결재 위임
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000053',
    NULL, '00000001-0000-0000-0000-000000000050', 'DELEGATION', '결재 위임', 'Delegation', '/approvals/delegation', 'ArrowRightLeft',
    'INTERNAL', 2, 3, 'APPROVAL',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- ============================================================================
-- 그룹 5: 복리후생 (WELFARE)
-- ============================================================================

-- 5-1. 증명서
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000060',
    NULL, NULL, 'CERTIFICATES', '증명서', 'Certificates', '/certificates', 'FileText',
    'INTERNAL', 1, 60, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5-1-1. 증명서 신청
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000061',
    NULL, '00000001-0000-0000-0000-000000000060', 'CERTIFICATE_REQUEST', '증명서 신청', 'Request Certificate', '/certificates/request', 'Plus',
    'INTERNAL', 2, 1, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5-1-2. 발급 이력
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000062',
    NULL, '00000001-0000-0000-0000-000000000060', 'CERTIFICATE_ISSUED', '발급 이력', 'Issued Certificates', '/certificates/issued', 'Clock',
    'INTERNAL', 2, 2, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5-1-3. 진위확인
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000063',
    NULL, '00000001-0000-0000-0000-000000000060', 'CERTIFICATE_VERIFY', '진위확인', 'Verify Certificate', '/certificates/verify', 'Shield',
    'INTERNAL', 2, 3, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5-2. 경조비 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000065',
    NULL, NULL, 'CONDOLENCE', '경조비 관리', 'Condolence', '/condolence', 'Heart',
    'INTERNAL', 1, 65, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5-2-1. 경조금 지급 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000066',
    NULL, '00000001-0000-0000-0000-000000000065', 'CONDOLENCE_PAYMENTS', '경조금 지급 관리', 'Payments', '/condolence/payments', 'Banknote',
    'INTERNAL', 2, 1, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5-2-2. 경조비 정책 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000067',
    NULL, '00000001-0000-0000-0000-000000000065', 'CONDOLENCE_POLICIES', '경조비 정책 관리', 'Policies', '/condolence/policies', 'Settings',
    'INTERNAL', 2, 2, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5-3. 사원증 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000070',
    NULL, NULL, 'EMPLOYEE_CARD', '사원증 관리', 'Employee Card', '/employee-card', 'CreditCard',
    'INTERNAL', 1, 70, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5-3-1. 발급 요청 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000071',
    NULL, '00000001-0000-0000-0000-000000000070', 'CARD_REQUESTS', '발급 요청 관리', 'Issue Requests', '/employee-card/requests', 'Inbox',
    'INTERNAL', 2, 1, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5-4. 위원회 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000075',
    NULL, NULL, 'COMMITTEE', '위원회 관리', 'Committee', '/committee', 'Users2',
    'INTERNAL', 1, 75, 'WELFARE',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- ============================================================================
-- 그룹 6: 시스템 관리 (SYSTEM)
-- ============================================================================

-- 6-1. 설정
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000080',
    NULL, NULL, 'SETTINGS', '설정', 'Settings', '/settings', 'Settings',
    'INTERNAL', 1, 80, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-1-1. 결재 양식 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000081',
    NULL, '00000001-0000-0000-0000-000000000080', 'APPROVAL_TEMPLATES', '결재 양식 관리', 'Approval Templates', '/settings/approval-templates', 'FileText',
    'INTERNAL', 2, 1, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-1-2. 개인정보 열람 이력
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000082',
    NULL, '00000001-0000-0000-0000-000000000080', 'PRIVACY_ACCESS', '개인정보 열람 이력', 'Privacy Access Log', '/settings/privacy-access', 'Eye',
    'INTERNAL', 2, 2, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-1-3. 위임전결 규칙
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000083',
    NULL, '00000001-0000-0000-0000-000000000080', 'DELEGATION_RULES', '위임전결 규칙', 'Delegation Rules', '/settings/delegation-rules', 'GitCompare',
    'INTERNAL', 2, 3, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-1-4. 테넌트 메뉴 설정
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000084',
    NULL, '00000001-0000-0000-0000-000000000080', 'TENANT_MENUS', '테넌트 메뉴 설정', 'Tenant Menus', '/settings/tenant-menus', 'Menu',
    'INTERNAL', 2, 4, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-1-5. 사번 규칙 설정
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000085',
    NULL, '00000001-0000-0000-0000-000000000080', 'EMPLOYEE_NUMBER_RULE', '사번 규칙 설정', 'Employee Number Rule', '/settings/employee-number-rule', 'Hash',
    'INTERNAL', 2, 5, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-1-6. 연차 규칙 설정
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000086',
    NULL, '00000001-0000-0000-0000-000000000080', 'LEAVE_POLICY', '연차 규칙 설정', 'Leave Policy', '/settings/leave-policy', 'Calendar',
    'INTERNAL', 2, 6, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-1-7. 파일 업로드 정책
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000087',
    NULL, '00000001-0000-0000-0000-000000000080', 'FILE_UPLOAD_POLICY', '파일 업로드 정책', 'File Upload Policy', '/settings/file-upload-policy', 'Upload',
    'INTERNAL', 2, 7, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-2. 기준정보 관리 (MDM)
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000090',
    NULL, NULL, 'MDM', '기준정보 관리', 'MDM', NULL, 'Database',
    'INTERNAL', 1, 90, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-2-1. 코드그룹 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000091',
    NULL, '00000001-0000-0000-0000-000000000090', 'CODE_GROUPS', '코드그룹 관리', 'Code Groups', '/mdm/code-groups', 'Folder',
    'INTERNAL', 2, 1, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-2-2. 공통코드 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000092',
    NULL, '00000001-0000-0000-0000-000000000090', 'COMMON_CODES', '공통코드 관리', 'Common Codes', '/mdm/common-codes', 'Tag',
    'INTERNAL', 2, 2, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-2-3. 테넌트 코드 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000093',
    NULL, '00000001-0000-0000-0000-000000000090', 'TENANT_CODES', '테넌트 코드 관리', 'Tenant Codes', '/mdm/tenant-codes', 'Building',
    'INTERNAL', 2, 3, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6-3. 파일 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000095',
    NULL, NULL, 'FILES', '파일 관리', 'Files', '/files', 'FolderOpen',
    'INTERNAL', 1, 95, 'SYSTEM',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- ============================================================================
-- 그룹 7: 운영관리 (ADMIN) - SUPER_ADMIN 전용
-- ============================================================================

-- 7-1. 메뉴 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000100',
    NULL, NULL, 'ADMIN_MENUS', '메뉴 관리', 'Menu Management', '/admin/menus', 'Menu',
    'INTERNAL', 1, 100, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 7-2. 테넌트 관리
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000101',
    NULL, NULL, 'ADMIN_TENANTS', '테넌트 관리', 'Tenant Management', '/admin/tenants', 'Building',
    'INTERNAL', 1, 101, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 7-3. 감사 로그
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000102',
    NULL, NULL, 'AUDIT', '감사 로그', 'Audit Log', '/audit', 'Shield',
    'INTERNAL', 1, 102, 'ADMIN',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- ============================================================================
-- 그룹 8: 지원 (SUPPORT)
-- ============================================================================

-- 8-1. 도움말
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000110',
    NULL, NULL, 'HELP', '도움말', 'Help', '/help', 'HelpCircle',
    'INTERNAL', 1, 110, 'SUPPORT',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 8-1-1. 사용자 가이드
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000111',
    NULL, '00000001-0000-0000-0000-000000000110', 'HELP_GUIDE', '사용자 가이드', 'User Guide', '/help/guide', 'FileText',
    'INTERNAL', 2, 1, 'SUPPORT',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 8-1-2. 자주 묻는 질문
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000112',
    NULL, '00000001-0000-0000-0000-000000000110', 'HELP_FAQ', '자주 묻는 질문', 'FAQ', '/help/faq', 'MessageCircle',
    'INTERNAL', 2, 2, 'SUPPORT',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 8-1-3. 문의하기
INSERT INTO tenant_common.menu_item (
    id, tenant_id, parent_id, code, name, name_en, path, icon,
    menu_type, level, sort_order, group_name,
    is_system, is_active, show_in_nav, show_in_mobile,
    created_at, updated_at, created_by, updated_by
) VALUES (
    '00000001-0000-0000-0000-000000000113',
    NULL, '00000001-0000-0000-0000-000000000110', 'HELP_CONTACT', '문의하기', 'Contact', '/help/contact', 'Mail',
    'INTERNAL', 2, 3, 'SUPPORT',
    true, true, true, false,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- ============================================================================
-- 2. 메뉴 권한 매핑 (menu_permission)
-- ============================================================================

-- SUPER_ADMIN: 모든 메뉴 접근 가능 (*)
-- 메인 그룹은 모든 사용자 접근 가능
-- 나머지는 역할별로 권한 설정

-- 메인 그룹 (모든 사용자)
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'EMPLOYEE'
FROM tenant_common.menu_item
WHERE group_name = 'MAIN';

-- SUPER_ADMIN 전용
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'SUPER_ADMIN'
FROM tenant_common.menu_item
WHERE group_name = 'ADMIN';

-- HR 그룹 (HR_MANAGER, GROUP_ADMIN, TENANT_ADMIN, SUPER_ADMIN)
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'HR_MANAGER'
FROM tenant_common.menu_item
WHERE group_name = 'HR';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'GROUP_ADMIN'
FROM tenant_common.menu_item
WHERE group_name = 'HR';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN'
FROM tenant_common.menu_item
WHERE group_name = 'HR';

-- 근태/결재/복리후생 (모든 사용자)
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'EMPLOYEE'
FROM tenant_common.menu_item
WHERE group_name IN ('ATTENDANCE', 'APPROVAL', 'WELFARE');

-- 시스템 관리 (SYSTEM) - 관리자만
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'HR_MANAGER'
FROM tenant_common.menu_item
WHERE group_name = 'SYSTEM';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN'
FROM tenant_common.menu_item
WHERE group_name = 'SYSTEM';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'SUPER_ADMIN'
FROM tenant_common.menu_item
WHERE group_name = 'SYSTEM';

-- 도움말 (모든 사용자)
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'EMPLOYEE'
FROM tenant_common.menu_item
WHERE group_name = 'SUPPORT';

-- ============================================================================
-- 3. 테넌트 메뉴 설정 (tenant_menu_config)
-- 한성그룹의 모든 메뉴 활성화
-- ============================================================================

INSERT INTO tenant_common.tenant_menu_config (
    tenant_id, menu_item_id, is_enabled, custom_name, custom_sort_order,
    show_in_mobile, mobile_sort_order,
    created_at, updated_at)
SELECT
    'a0000001-0000-0000-0000-000000000001'::UUID,
    id,
    true,
    NULL,
    NULL,
    show_in_mobile,
    mobile_sort_order,
    NOW(),
    NOW()
FROM tenant_common.menu_item
WHERE is_system = true;

COMMIT;
