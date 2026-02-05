-- ============================================================================
-- 01_tenant_seed.sql
-- 한성그룹 8개 계열사 테넌트 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 한성그룹 계열사 테넌트 (8개)
-- ============================================================================

-- 1. 한성홀딩스 (지주회사) - 500명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000001',
    'HANSUNG_HD',
    '한성홀딩스',
    '101-86-00001',
    '김한성',
    '서울특별시 강남구 테헤란로 152 한성타워',
    '02-2000-0001',
    'contact@hansung-hd.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    1000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 2. 한성전자 (전자/반도체) - 25,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000002',
    'HANSUNG_ELEC',
    '한성전자',
    '124-81-00002',
    '이전자',
    '경기도 수원시 영통구 삼성로 129',
    '031-200-0001',
    'contact@hansung-elec.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    30000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 3. 한성SDI (배터리) - 12,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000003',
    'HANSUNG_SDI',
    '한성SDI',
    '284-81-00003',
    '박배터',
    '경기도 용인시 기흥구 공세로 150-20',
    '031-210-0001',
    'contact@hansung-sdi.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    15000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 4. 한성엔지니어링 (건설/플랜트) - 8,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000004',
    'HANSUNG_ENG',
    '한성엔지니어링',
    '104-81-00004',
    '정건설',
    '서울특별시 서초구 서초대로 74길 14',
    '02-2100-0001',
    'contact@hansung-eng.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    10000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 5. 한성바이오 (바이오/제약) - 5,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000005',
    'HANSUNG_BIO',
    '한성바이오',
    '220-87-00005',
    '최바이오',
    '인천광역시 연수구 송도과학로 32',
    '032-850-0001',
    'contact@hansung-bio.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    7000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 6. 한성화학 (화학) - 7,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000006',
    'HANSUNG_CHEM',
    '한성화학',
    '301-81-00006',
    '강화학',
    '울산광역시 남구 산업로 1015',
    '052-280-0001',
    'contact@hansung-chem.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    10000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 7. 한성IT서비스 (IT/SI) - 4,500명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000007',
    'HANSUNG_IT',
    '한성IT서비스',
    '214-87-00007',
    '윤아이티',
    '서울특별시 송파구 올림픽로 300',
    '02-6000-0001',
    'contact@hansung-it.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    6000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

-- 8. 한성생명 (보험/금융) - 13,000명
INSERT INTO tenant_common.tenant (
    id, code, name, business_number, representative_name,
    address, phone, email, status, plan_type,
    contract_start_date, contract_end_date, max_employees,
    created_at, updated_at, created_by, updated_by
) VALUES (
    'a0000001-0000-0000-0000-000000000008',
    'HANSUNG_LIFE',
    '한성생명',
    '202-81-00008',
    '송금융',
    '서울특별시 중구 세종대로 55',
    '02-3700-0001',
    'contact@hansung-life.co.kr',
    'ACTIVE',
    'ENTERPRISE',
    '2024-01-01',
    '2026-12-31',
    15000,
    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
);

COMMIT;

-- 검증
DO $$
DECLARE
    tenant_count INT;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenant_common.tenant;
    RAISE NOTICE '테넌트 생성 완료: % 개', tenant_count;
END $$;
