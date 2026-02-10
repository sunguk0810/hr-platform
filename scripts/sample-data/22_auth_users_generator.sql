-- ============================================================================
-- 22_auth_users_generator.sql
-- Auth 서비스 사용자 계정 생성 (tenant_common.users)
-- ============================================================================
-- 생성 규모:
--   - 시스템 관리자: 1명 (superadmin)
--   - 테스트 계정: 30명 (각 계열사별 CEO, HR관리자, 부서장, 직원)
-- 의존성:
--   - pgcrypto 확장 (BCrypt 해시 생성)
--   - 08_employee_execute.sql (직원 레코드 선행 생성 필요)
-- ============================================================================

-- pgcrypto 확장 활성화 (BCrypt 해시 생성용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- RLS 비활성화
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- 1. 시스템 관리자 (superadmin)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Auth 사용자 계정 생성 시작...';
    RAISE NOTICE '========================================';
END $$;

-- superadmin (시스템 전체 관리자, 특정 테넌트에 속하지 않음)
INSERT INTO tenant_common.users (
    id, tenant_id, employee_id, username, email,
    password_hash, roles, permissions, status,
    password_changed_at, created_at, updated_at, created_by, updated_by
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'superadmin',
    'superadmin@hrsaas.com',
    crypt('Admin@2025!', gen_salt('bf', 12)),
    ARRAY['SUPER_ADMIN'],
    ARRAY['*'],
    'ACTIVE',
    NOW(), NOW(), NOW(), 'SYSTEM', 'SYSTEM'
) ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING;

-- ============================================================================
-- 2. 테스트 계정 일괄 생성 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION create_auth_user(
    p_tenant_id UUID,
    p_username VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR,
    p_roles TEXT[],
    p_employee_number VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_employee_id UUID;
BEGIN
    -- 직원 레코드에서 employee_id 조회
    IF p_employee_number IS NOT NULL THEN
        SELECT id INTO v_employee_id
        FROM hr_core.employee
        WHERE tenant_id = p_tenant_id
          AND employee_number = p_employee_number;
    END IF;

    INSERT INTO tenant_common.users (
        id, tenant_id, employee_id, username, email,
        password_hash, roles, permissions, status,
        password_changed_at, created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(),
        p_tenant_id,
        v_employee_id,
        p_username,
        p_email,
        crypt(p_password, gen_salt('bf', 12)),
        p_roles,
        ARRAY[]::TEXT[],
        'ACTIVE',
        NOW(), NOW(), NOW(), 'SYSTEM', 'SYSTEM'
    )
    ON CONFLICT ON CONSTRAINT uq_users_tenant_username DO NOTHING
    RETURNING id INTO v_user_id;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. 한성홀딩스 테스트 계정
-- ============================================================================

SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000001',
    'ceo.hansung', 'ceo.hansung@hansung-hd.co.kr',
    'Ceo@2025!', ARRAY['TENANT_ADMIN'], 'HHD2000001'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000001',
    'hr.admin.hd', 'hr.admin.hd@hansung-hd.co.kr',
    'HrAdmin@2025!', ARRAY['HR_MANAGER'], 'HHD2000002'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000001',
    'hr.manager.hd', 'hr.manager.hd@hansung-hd.co.kr',
    'HrMgr@2025!', ARRAY['HR_MANAGER'], 'HHD2000003'
);

-- ============================================================================
-- 4. 한성전자 테스트 계정 (주력 테스트 계열사)
-- ============================================================================

SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000002',
    'ceo.elec', 'ceo.elec@hansung-elec.co.kr',
    'Ceo@2025!', ARRAY['TENANT_ADMIN'], 'HEL2000001'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000002',
    'hr.admin.elec', 'hr.admin.elec@hansung-elec.co.kr',
    'HrAdmin@2025!', ARRAY['HR_MANAGER'], 'HEL2000002'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000002',
    'hr.manager.elec', 'hr.manager.elec@hansung-elec.co.kr',
    'HrMgr@2025!', ARRAY['HR_MANAGER'], 'HEL2000003'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000002',
    'dev.manager.elec', 'dev.manager.elec@hansung-elec.co.kr',
    'DevMgr@2025!', ARRAY['DEPT_MANAGER'], 'HEL2000004'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000002',
    'dev.senior.elec', 'dev.senior.elec@hansung-elec.co.kr',
    'DevSr@2025!', ARRAY['EMPLOYEE'], 'HEL2000005'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000002',
    'dev.staff.elec', 'dev.staff.elec@hansung-elec.co.kr',
    'DevStaff@2025!', ARRAY['EMPLOYEE'], 'HEL2000006'
);

-- ============================================================================
-- 5. 한성SDI 테스트 계정
-- ============================================================================

SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000003',
    'ceo.sdi', 'ceo.sdi@hansung-sdi.co.kr',
    'Ceo@2025!', ARRAY['TENANT_ADMIN'], 'HSI2000001'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000003',
    'hr.admin.sdi', 'hr.admin.sdi@hansung-sdi.co.kr',
    'HrAdmin@2025!', ARRAY['HR_MANAGER'], 'HSI2000002'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000003',
    'prod.manager.sdi', 'prod.manager.sdi@hansung-sdi.co.kr',
    'ProdMgr@2025!', ARRAY['DEPT_MANAGER'], 'HSI2000003'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000003',
    'prod.staff.sdi', 'prod.staff.sdi@hansung-sdi.co.kr',
    'ProdStaff@2025!', ARRAY['EMPLOYEE'], 'HSI2000004'
);

-- ============================================================================
-- 6. 한성엔지니어링 테스트 계정
-- ============================================================================

SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000004',
    'ceo.eng', 'ceo.eng@hansung-eng.co.kr',
    'Ceo@2025!', ARRAY['TENANT_ADMIN'], 'HEN2000001'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000004',
    'hr.admin.eng', 'hr.admin.eng@hansung-eng.co.kr',
    'HrAdmin@2025!', ARRAY['HR_MANAGER'], 'HEN2000002'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000004',
    'pm.manager.eng', 'pm.manager.eng@hansung-eng.co.kr',
    'PmMgr@2025!', ARRAY['DEPT_MANAGER'], 'HEN2000003'
);

-- ============================================================================
-- 7. 한성바이오 테스트 계정
-- ============================================================================

SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000005',
    'ceo.bio', 'ceo.bio@hansung-bio.co.kr',
    'Ceo@2025!', ARRAY['TENANT_ADMIN'], 'HBI2000001'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000005',
    'hr.admin.bio', 'hr.admin.bio@hansung-bio.co.kr',
    'HrAdmin@2025!', ARRAY['HR_MANAGER'], 'HBI2000002'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000005',
    'rnd.manager.bio', 'rnd.manager.bio@hansung-bio.co.kr',
    'RndMgr@2025!', ARRAY['DEPT_MANAGER'], 'HBI2000003'
);

-- ============================================================================
-- 8. 한성화학 테스트 계정
-- ============================================================================

SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000006',
    'ceo.chem', 'ceo.chem@hansung-chem.co.kr',
    'Ceo@2025!', ARRAY['TENANT_ADMIN'], 'HCH2000001'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000006',
    'hr.admin.chem', 'hr.admin.chem@hansung-chem.co.kr',
    'HrAdmin@2025!', ARRAY['HR_MANAGER'], 'HCH2000002'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000006',
    'qa.manager.chem', 'qa.manager.chem@hansung-chem.co.kr',
    'QaMgr@2025!', ARRAY['DEPT_MANAGER'], 'HCH2000003'
);

-- ============================================================================
-- 9. 한성IT서비스 테스트 계정
-- ============================================================================

SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000007',
    'ceo.it', 'ceo.it@hansung-it.co.kr',
    'Ceo@2025!', ARRAY['TENANT_ADMIN'], 'HIT2000001'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000007',
    'hr.admin.it', 'hr.admin.it@hansung-it.co.kr',
    'HrAdmin@2025!', ARRAY['HR_MANAGER'], 'HIT2000002'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000007',
    'dev.manager.it', 'dev.manager.it@hansung-it.co.kr',
    'DevMgr@2025!', ARRAY['DEPT_MANAGER'], 'HIT2000003'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000007',
    'dev.staff.it', 'dev.staff.it@hansung-it.co.kr',
    'DevStaff@2025!', ARRAY['EMPLOYEE'], 'HIT2000004'
);

-- ============================================================================
-- 10. 한성생명 테스트 계정
-- ============================================================================

SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000008',
    'ceo.life', 'ceo.life@hansung-life.co.kr',
    'Ceo@2025!', ARRAY['TENANT_ADMIN'], 'HLF2000001'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000008',
    'hr.admin.life', 'hr.admin.life@hansung-life.co.kr',
    'HrAdmin@2025!', ARRAY['HR_MANAGER'], 'HLF2000002'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000008',
    'sales.manager.life', 'sales.manager.life@hansung-life.co.kr',
    'SalesMgr@2025!', ARRAY['DEPT_MANAGER'], 'HLF2000003'
);
SELECT create_auth_user(
    'a0000001-0000-0000-0000-000000000008',
    'sales.staff.life', 'sales.staff.life@hansung-life.co.kr',
    'SalesStaff@2025!', ARRAY['EMPLOYEE'], 'HLF2000004'
);

-- ============================================================================
-- 11. 함수 정리
-- ============================================================================

DROP FUNCTION IF EXISTS create_auth_user;

-- ============================================================================
-- 12. 검증
-- ============================================================================

DO $$
DECLARE
    v_total INT;
    v_tenant_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_total FROM tenant_common.users;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Auth 사용자 계정 생성 완료';
    RAISE NOTICE '========================================';
    RAISE NOTICE '총 사용자 수: % 명', v_total;
    RAISE NOTICE '';

    FOR v_tenant_record IN
        SELECT
            COALESCE(t.name, 'System') as tenant_name,
            COUNT(u.id) as user_count
        FROM tenant_common.users u
        LEFT JOIN tenant_common.tenant t ON u.tenant_id = t.id
        GROUP BY t.name
        ORDER BY user_count DESC
    LOOP
        RAISE NOTICE '  %-20s: %s명', v_tenant_record.tenant_name, v_tenant_record.user_count;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '테스트 로그인 정보:';
    RAISE NOTICE '  superadmin / Admin@2025! (시스템 관리자)';
    RAISE NOTICE '  ceo.elec / Ceo@2025! (한성전자 CEO)';
    RAISE NOTICE '  hr.admin.elec / HrAdmin@2025! (한성전자 HR관리자)';
    RAISE NOTICE '  dev.manager.elec / DevMgr@2025! (한성전자 부서장)';
    RAISE NOTICE '  dev.staff.elec / DevStaff@2025! (한성전자 직원)';
    RAISE NOTICE '========================================';
END $$;
