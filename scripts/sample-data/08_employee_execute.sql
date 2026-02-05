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
