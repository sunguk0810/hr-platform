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
