-- ============================================================================
-- 06_organization_departments.sql
-- 대기업 규모 부서 구조 생성 (~500개 부서)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 부서 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION create_department(
    p_tenant_id UUID,
    p_code VARCHAR,
    p_name VARCHAR,
    p_name_en VARCHAR,
    p_parent_code VARCHAR,
    p_level INT,
    p_sort_order INT
) RETURNS UUID AS $$
DECLARE
    v_parent_id UUID;
    v_path VARCHAR;
    v_dept_id UUID;
BEGIN
    -- 상위 부서 ID 조회
    IF p_parent_code IS NOT NULL THEN
        SELECT id, path INTO v_parent_id, v_path
        FROM hr_core.department
        WHERE tenant_id = p_tenant_id AND code = p_parent_code;

        v_path := COALESCE(v_path, '') || '/' || p_code;
    ELSE
        v_path := '/' || p_code;
    END IF;

    INSERT INTO hr_core.department (
        id, tenant_id, code, name, name_en, parent_id, level, path, status, sort_order,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), p_tenant_id, p_code, p_name, p_name_en, v_parent_id, p_level, v_path, 'ACTIVE', p_sort_order,
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) RETURNING id INTO v_dept_id;

    RETURN v_dept_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. 한성홀딩스 (HANSUNG_HD) - 15개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000001';
BEGIN
    -- Level 1: 최상위
    PERFORM create_department(v_tenant_id, 'HD_ROOT', '한성홀딩스', 'Hansung Holdings', NULL, 1, 1);

    -- Level 2: 본부
    PERFORM create_department(v_tenant_id, 'HD_MGMT', '경영기획본부', 'Management Planning', 'HD_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'HD_FIN', '재무본부', 'Finance', 'HD_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'HD_HR', '인사본부', 'Human Resources', 'HD_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'HD_LEGAL', '법무본부', 'Legal Affairs', 'HD_ROOT', 2, 4);

    -- Level 3: 팀
    PERFORM create_department(v_tenant_id, 'HD_STRATEGY', '전략기획팀', 'Strategy Planning', 'HD_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'HD_IR', 'IR팀', 'Investor Relations', 'HD_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'HD_ACCT', '회계팀', 'Accounting', 'HD_FIN', 3, 1);
    PERFORM create_department(v_tenant_id, 'HD_TREASURY', '자금팀', 'Treasury', 'HD_FIN', 3, 2);
    PERFORM create_department(v_tenant_id, 'HD_HR_TEAM', '인사팀', 'HR Team', 'HD_HR', 3, 1);
    PERFORM create_department(v_tenant_id, 'HD_EDU', '교육팀', 'Training', 'HD_HR', 3, 2);
    PERFORM create_department(v_tenant_id, 'HD_LEGAL_TEAM', '법무팀', 'Legal Team', 'HD_LEGAL', 3, 1);
    PERFORM create_department(v_tenant_id, 'HD_COMPLIANCE', '준법감시팀', 'Compliance', 'HD_LEGAL', 3, 2);
    PERFORM create_department(v_tenant_id, 'HD_AUDIT', '감사팀', 'Audit', 'HD_ROOT', 2, 5);
    PERFORM create_department(v_tenant_id, 'HD_SECR', '비서실', 'Secretariat', 'HD_ROOT', 2, 6);
END $$;

-- ============================================================================
-- 2. 한성전자 (HANSUNG_ELEC) - 80개 부서 (대규모)
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
BEGIN
    -- Level 1: 최상위
    PERFORM create_department(v_tenant_id, 'EL_ROOT', '한성전자', 'Hansung Electronics', NULL, 1, 1);

    -- Level 2: 사업부/본부
    PERFORM create_department(v_tenant_id, 'EL_MGMT', '경영지원본부', 'Management Support', 'EL_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'EL_DS', 'DS사업부', 'Device Solutions', 'EL_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'EL_DX', 'DX사업부', 'Digital Experience', 'EL_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'EL_NET', '네트워크사업부', 'Network Business', 'EL_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'EL_RND', '연구개발본부', 'R&D Center', 'EL_ROOT', 2, 5);
    PERFORM create_department(v_tenant_id, 'EL_GLOBAL', '글로벌영업본부', 'Global Sales', 'EL_ROOT', 2, 6);

    -- 경영지원본부 (EL_MGMT) 하위
    PERFORM create_department(v_tenant_id, 'EL_HR', '인사팀', 'HR Team', 'EL_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_GA', '총무팀', 'General Affairs', 'EL_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_FIN', '재무팀', 'Finance Team', 'EL_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_ACCT', '회계팀', 'Accounting Team', 'EL_MGMT', 3, 4);
    PERFORM create_department(v_tenant_id, 'EL_LEGAL', '법무팀', 'Legal Team', 'EL_MGMT', 3, 5);
    PERFORM create_department(v_tenant_id, 'EL_IT', 'IT인프라팀', 'IT Infrastructure', 'EL_MGMT', 3, 6);
    PERFORM create_department(v_tenant_id, 'EL_PR', '홍보팀', 'PR Team', 'EL_MGMT', 3, 7);
    PERFORM create_department(v_tenant_id, 'EL_PURCHASE', '구매팀', 'Procurement', 'EL_MGMT', 3, 8);

    -- DS사업부 (반도체) 하위 - 메모리
    PERFORM create_department(v_tenant_id, 'EL_MEMORY', '메모리사업부', 'Memory Division', 'EL_DS', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_DRAM', 'DRAM개발팀', 'DRAM Development', 'EL_MEMORY', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_NAND', 'NAND개발팀', 'NAND Development', 'EL_MEMORY', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_MEM_PROC', '메모리공정팀', 'Memory Process', 'EL_MEMORY', 4, 3);
    PERFORM create_department(v_tenant_id, 'EL_MEM_QA', '메모리품질팀', 'Memory QA', 'EL_MEMORY', 4, 4);
    PERFORM create_department(v_tenant_id, 'EL_MEM_PROD', '메모리생산팀', 'Memory Production', 'EL_MEMORY', 4, 5);

    -- DS사업부 - 시스템LSI
    PERFORM create_department(v_tenant_id, 'EL_LSI', '시스템LSI사업부', 'System LSI Division', 'EL_DS', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_AP', 'AP개발팀', 'AP Development', 'EL_LSI', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_MODEM', '모뎀개발팀', 'Modem Development', 'EL_LSI', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_SENSOR', '센서개발팀', 'Sensor Development', 'EL_LSI', 4, 3);
    PERFORM create_department(v_tenant_id, 'EL_LSI_PROC', 'LSI공정팀', 'LSI Process', 'EL_LSI', 4, 4);
    PERFORM create_department(v_tenant_id, 'EL_FOUNDRY', '파운드리팀', 'Foundry', 'EL_LSI', 4, 5);

    -- DS사업부 - 디스플레이
    PERFORM create_department(v_tenant_id, 'EL_DISP', '디스플레이사업부', 'Display Division', 'EL_DS', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_OLED', 'OLED개발팀', 'OLED Development', 'EL_DISP', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_LCD', 'LCD개발팀', 'LCD Development', 'EL_DISP', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_DISP_PROD', '디스플레이생산팀', 'Display Production', 'EL_DISP', 4, 3);

    -- DX사업부 (가전) 하위
    PERFORM create_department(v_tenant_id, 'EL_TV', 'TV사업부', 'TV Division', 'EL_DX', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_TV_DEV', 'TV개발팀', 'TV Development', 'EL_TV', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_TV_PROD', 'TV생산팀', 'TV Production', 'EL_TV', 4, 2);

    PERFORM create_department(v_tenant_id, 'EL_HA', '생활가전사업부', 'Home Appliance Division', 'EL_DX', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_REF', '냉장고개발팀', 'Refrigerator Dev', 'EL_HA', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_WASH', '세탁기개발팀', 'Washing Machine Dev', 'EL_HA', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_AC', '에어컨개발팀', 'Air Conditioner Dev', 'EL_HA', 4, 3);
    PERFORM create_department(v_tenant_id, 'EL_HA_PROD', '가전생산팀', 'HA Production', 'EL_HA', 4, 4);

    PERFORM create_department(v_tenant_id, 'EL_MOBILE', '모바일사업부', 'Mobile Division', 'EL_DX', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_PHONE', '스마트폰개발팀', 'Smartphone Dev', 'EL_MOBILE', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_TABLET', '태블릿개발팀', 'Tablet Dev', 'EL_MOBILE', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_WEAR', '웨어러블개발팀', 'Wearable Dev', 'EL_MOBILE', 4, 3);
    PERFORM create_department(v_tenant_id, 'EL_MOB_PROD', '모바일생산팀', 'Mobile Production', 'EL_MOBILE', 4, 4);

    -- 네트워크사업부 하위
    PERFORM create_department(v_tenant_id, 'EL_5G', '5G개발팀', '5G Development', 'EL_NET', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_INFRA', '통신인프라팀', 'Network Infrastructure', 'EL_NET', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_NET_SALES', '네트워크영업팀', 'Network Sales', 'EL_NET', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_NET_PROD', '네트워크생산팀', 'Network Production', 'EL_NET', 3, 4);

    -- 연구개발본부 하위
    PERFORM create_department(v_tenant_id, 'EL_AI', 'AI연구소', 'AI Research Lab', 'EL_RND', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_AI_VISION', '비전AI팀', 'Vision AI', 'EL_AI', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_AI_NLP', '자연어AI팀', 'NLP AI', 'EL_AI', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_AI_ROBOT', '로보틱스AI팀', 'Robotics AI', 'EL_AI', 4, 3);

    PERFORM create_department(v_tenant_id, 'EL_ADV', '선행기술연구소', 'Advanced Tech Lab', 'EL_RND', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_QUANTUM', '양자컴퓨팅팀', 'Quantum Computing', 'EL_ADV', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_NANO', '나노기술팀', 'Nanotechnology', 'EL_ADV', 4, 2);

    PERFORM create_department(v_tenant_id, 'EL_SW', 'SW개발센터', 'SW Development Center', 'EL_RND', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_TIZEN', '타이젠개발팀', 'Tizen Development', 'EL_SW', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_SMART', '스마트싱스개발팀', 'SmartThings Dev', 'EL_SW', 4, 2);
    PERFORM create_department(v_tenant_id, 'EL_CLOUD', '클라우드개발팀', 'Cloud Development', 'EL_SW', 4, 3);

    PERFORM create_department(v_tenant_id, 'EL_DESIGN', '디자인센터', 'Design Center', 'EL_RND', 3, 4);
    PERFORM create_department(v_tenant_id, 'EL_UX', 'UX디자인팀', 'UX Design', 'EL_DESIGN', 4, 1);
    PERFORM create_department(v_tenant_id, 'EL_ID', '제품디자인팀', 'Industrial Design', 'EL_DESIGN', 4, 2);

    -- 글로벌영업본부 하위
    PERFORM create_department(v_tenant_id, 'EL_KOREA', '한국영업팀', 'Korea Sales', 'EL_GLOBAL', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_NA', '북미영업팀', 'North America Sales', 'EL_GLOBAL', 3, 2);
    PERFORM create_department(v_tenant_id, 'EL_EU', '유럽영업팀', 'Europe Sales', 'EL_GLOBAL', 3, 3);
    PERFORM create_department(v_tenant_id, 'EL_CHINA', '중국영업팀', 'China Sales', 'EL_GLOBAL', 3, 4);
    PERFORM create_department(v_tenant_id, 'EL_SEA', '동남아영업팀', 'Southeast Asia Sales', 'EL_GLOBAL', 3, 5);
    PERFORM create_department(v_tenant_id, 'EL_B2B', 'B2B영업팀', 'B2B Sales', 'EL_GLOBAL', 3, 6);
    PERFORM create_department(v_tenant_id, 'EL_SERVICE', '고객서비스팀', 'Customer Service', 'EL_GLOBAL', 3, 7);
    PERFORM create_department(v_tenant_id, 'EL_MKT', '마케팅팀', 'Marketing', 'EL_GLOBAL', 3, 8);

    -- 추가 지원 부서
    PERFORM create_department(v_tenant_id, 'EL_QA', '품질경영센터', 'Quality Management', 'EL_ROOT', 2, 7);
    PERFORM create_department(v_tenant_id, 'EL_QA1', '품질기획팀', 'Quality Planning', 'EL_QA', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_QA2', '품질검증팀', 'Quality Verification', 'EL_QA', 3, 2);

    PERFORM create_department(v_tenant_id, 'EL_ESG', 'ESG경영센터', 'ESG Management', 'EL_ROOT', 2, 8);
    PERFORM create_department(v_tenant_id, 'EL_ENV', '환경안전팀', 'Environment Safety', 'EL_ESG', 3, 1);
    PERFORM create_department(v_tenant_id, 'EL_SOCIAL', '사회공헌팀', 'Social Contribution', 'EL_ESG', 3, 2);
END $$;

-- ============================================================================
-- 3. 한성SDI (HANSUNG_SDI) - 40개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000003';
BEGIN
    PERFORM create_department(v_tenant_id, 'SDI_ROOT', '한성SDI', 'Hansung SDI', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'SDI_MGMT', '경영지원본부', 'Management Support', 'SDI_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'SDI_BATT', '배터리사업본부', 'Battery Business', 'SDI_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'SDI_EV', 'EV배터리본부', 'EV Battery', 'SDI_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'SDI_ESS', 'ESS사업본부', 'ESS Business', 'SDI_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'SDI_RND', '연구개발본부', 'R&D', 'SDI_ROOT', 2, 5);
    PERFORM create_department(v_tenant_id, 'SDI_PROD', '생산본부', 'Production', 'SDI_ROOT', 2, 6);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'SDI_HR', '인사팀', 'HR Team', 'SDI_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_FIN', '재무팀', 'Finance Team', 'SDI_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_GA', '총무팀', 'General Affairs', 'SDI_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'SDI_PURCHASE', '구매팀', 'Procurement', 'SDI_MGMT', 3, 4);

    -- 배터리사업
    PERFORM create_department(v_tenant_id, 'SDI_CELL', '셀개발팀', 'Cell Development', 'SDI_BATT', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_PACK', '팩개발팀', 'Pack Development', 'SDI_BATT', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_MAT', '소재개발팀', 'Material Development', 'SDI_BATT', 3, 3);

    -- EV배터리
    PERFORM create_department(v_tenant_id, 'SDI_EV_DEV', 'EV개발팀', 'EV Development', 'SDI_EV', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_EV_SALES', 'EV영업팀', 'EV Sales', 'SDI_EV', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_EV_QA', 'EV품질팀', 'EV Quality', 'SDI_EV', 3, 3);

    -- ESS
    PERFORM create_department(v_tenant_id, 'SDI_ESS_DEV', 'ESS개발팀', 'ESS Development', 'SDI_ESS', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_ESS_SALES', 'ESS영업팀', 'ESS Sales', 'SDI_ESS', 3, 2);

    -- 연구개발
    PERFORM create_department(v_tenant_id, 'SDI_NEXT', '차세대기술팀', 'Next-Gen Tech', 'SDI_RND', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_SOLID', '전고체배터리팀', 'Solid State Battery', 'SDI_RND', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_RECYCLE', '재활용기술팀', 'Recycling Tech', 'SDI_RND', 3, 3);

    -- 생산
    PERFORM create_department(v_tenant_id, 'SDI_PROD1', '배터리생산1팀', 'Battery Production 1', 'SDI_PROD', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_PROD2', '배터리생산2팀', 'Battery Production 2', 'SDI_PROD', 3, 2);
    PERFORM create_department(v_tenant_id, 'SDI_PROD_QA', '생산품질팀', 'Production QA', 'SDI_PROD', 3, 3);
    PERFORM create_department(v_tenant_id, 'SDI_SAFETY', '안전환경팀', 'Safety & Environment', 'SDI_PROD', 3, 4);

    -- 영업
    PERFORM create_department(v_tenant_id, 'SDI_SALES', '글로벌영업본부', 'Global Sales', 'SDI_ROOT', 2, 7);
    PERFORM create_department(v_tenant_id, 'SDI_KOREA', '국내영업팀', 'Korea Sales', 'SDI_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'SDI_OVERSEAS', '해외영업팀', 'Overseas Sales', 'SDI_SALES', 3, 2);
END $$;

-- ============================================================================
-- 4. 한성엔지니어링 (HANSUNG_ENG) - 35개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000004';
BEGIN
    PERFORM create_department(v_tenant_id, 'ENG_ROOT', '한성엔지니어링', 'Hansung Engineering', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'ENG_MGMT', '경영지원본부', 'Management Support', 'ENG_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'ENG_BUILD', '건축사업본부', 'Building Construction', 'ENG_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'ENG_CIVIL', '토목사업본부', 'Civil Engineering', 'ENG_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'ENG_PLANT', '플랜트사업본부', 'Plant Business', 'ENG_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'ENG_DESIGN', '설계본부', 'Design Center', 'ENG_ROOT', 2, 5);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'ENG_HR', '인사팀', 'HR Team', 'ENG_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_FIN', '재무팀', 'Finance Team', 'ENG_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_GA', '총무팀', 'General Affairs', 'ENG_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'ENG_SAFETY', '안전관리팀', 'Safety Management', 'ENG_MGMT', 3, 4);

    -- 건축
    PERFORM create_department(v_tenant_id, 'ENG_RESI', '주거건축팀', 'Residential', 'ENG_BUILD', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_COMM', '상업건축팀', 'Commercial', 'ENG_BUILD', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_BUILD_PM', '건축PM팀', 'Building PM', 'ENG_BUILD', 3, 3);

    -- 토목
    PERFORM create_department(v_tenant_id, 'ENG_ROAD', '도로교량팀', 'Road & Bridge', 'ENG_CIVIL', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_TUNNEL', '터널지하팀', 'Tunnel & Underground', 'ENG_CIVIL', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_WATER', '상하수도팀', 'Water & Sewage', 'ENG_CIVIL', 3, 3);

    -- 플랜트
    PERFORM create_department(v_tenant_id, 'ENG_PETRO', '석유화학팀', 'Petrochemical', 'ENG_PLANT', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_POWER', '발전플랜트팀', 'Power Plant', 'ENG_PLANT', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_ENV', '환경플랜트팀', 'Environmental Plant', 'ENG_PLANT', 3, 3);
    PERFORM create_department(v_tenant_id, 'ENG_PLANT_PM', '프로젝트관리팀', 'Project Management', 'ENG_PLANT', 3, 4);

    -- 설계
    PERFORM create_department(v_tenant_id, 'ENG_ARCH', '건축설계팀', 'Architectural Design', 'ENG_DESIGN', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_STRUCT', '구조설계팀', 'Structural Design', 'ENG_DESIGN', 3, 2);
    PERFORM create_department(v_tenant_id, 'ENG_MEP', '설비설계팀', 'MEP Design', 'ENG_DESIGN', 3, 3);

    -- 해외
    PERFORM create_department(v_tenant_id, 'ENG_GLOBAL', '해외사업본부', 'Global Business', 'ENG_ROOT', 2, 6);
    PERFORM create_department(v_tenant_id, 'ENG_ME', '중동사업팀', 'Middle East', 'ENG_GLOBAL', 3, 1);
    PERFORM create_department(v_tenant_id, 'ENG_SEA', '동남아사업팀', 'Southeast Asia', 'ENG_GLOBAL', 3, 2);
END $$;

-- ============================================================================
-- 5. 한성바이오 (HANSUNG_BIO) - 30개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000005';
BEGIN
    PERFORM create_department(v_tenant_id, 'BIO_ROOT', '한성바이오', 'Hansung Bio', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'BIO_MGMT', '경영지원본부', 'Management Support', 'BIO_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'BIO_RND', '연구소', 'Research Center', 'BIO_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'BIO_PHARMA', '제약사업본부', 'Pharmaceutical', 'BIO_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'BIO_CELL', '세포치료제본부', 'Cell Therapy', 'BIO_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'BIO_PROD', '생산본부', 'Production', 'BIO_ROOT', 2, 5);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'BIO_HR', '인사팀', 'HR Team', 'BIO_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_FIN', '재무팀', 'Finance Team', 'BIO_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'BIO_LEGAL', '법무팀', 'Legal Team', 'BIO_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'BIO_RA', 'RA팀', 'Regulatory Affairs', 'BIO_MGMT', 3, 4);

    -- 연구소
    PERFORM create_department(v_tenant_id, 'BIO_DRUG', '신약개발팀', 'Drug Development', 'BIO_RND', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_PRECLIN', '비임상팀', 'Preclinical', 'BIO_RND', 3, 2);
    PERFORM create_department(v_tenant_id, 'BIO_CLIN', '임상팀', 'Clinical', 'BIO_RND', 3, 3);
    PERFORM create_department(v_tenant_id, 'BIO_BIO', '바이오분석팀', 'Bioanalysis', 'BIO_RND', 3, 4);

    -- 제약
    PERFORM create_department(v_tenant_id, 'BIO_FORM', '제형연구팀', 'Formulation', 'BIO_PHARMA', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_GENERIC', '제네릭개발팀', 'Generic Dev', 'BIO_PHARMA', 3, 2);
    PERFORM create_department(v_tenant_id, 'BIO_CMO', 'CMO사업팀', 'CMO Business', 'BIO_PHARMA', 3, 3);

    -- 세포치료
    PERFORM create_department(v_tenant_id, 'BIO_STEM', '줄기세포팀', 'Stem Cell', 'BIO_CELL', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_CAR', 'CAR-T개발팀', 'CAR-T Development', 'BIO_CELL', 3, 2);

    -- 생산
    PERFORM create_department(v_tenant_id, 'BIO_MFG', '제조팀', 'Manufacturing', 'BIO_PROD', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_QA', '품질보증팀', 'Quality Assurance', 'BIO_PROD', 3, 2);
    PERFORM create_department(v_tenant_id, 'BIO_QC', '품질관리팀', 'Quality Control', 'BIO_PROD', 3, 3);

    -- 영업
    PERFORM create_department(v_tenant_id, 'BIO_SALES', '영업본부', 'Sales', 'BIO_ROOT', 2, 6);
    PERFORM create_department(v_tenant_id, 'BIO_DOM', '국내영업팀', 'Domestic Sales', 'BIO_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'BIO_EXP', '수출팀', 'Export', 'BIO_SALES', 3, 2);
END $$;

-- ============================================================================
-- 6. 한성화학 (HANSUNG_CHEM) - 35개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000006';
BEGIN
    PERFORM create_department(v_tenant_id, 'CHEM_ROOT', '한성화학', 'Hansung Chemical', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'CHEM_MGMT', '경영지원본부', 'Management Support', 'CHEM_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_PETRO', '석유화학본부', 'Petrochemical', 'CHEM_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_ADV', '첨단소재본부', 'Advanced Materials', 'CHEM_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'CHEM_RND', '연구개발본부', 'R&D', 'CHEM_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'CHEM_PROD', '생산본부', 'Production', 'CHEM_ROOT', 2, 5);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'CHEM_HR', '인사팀', 'HR Team', 'CHEM_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_FIN', '재무팀', 'Finance Team', 'CHEM_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_GA', '총무팀', 'General Affairs', 'CHEM_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'CHEM_EHS', '환경안전팀', 'EHS Team', 'CHEM_MGMT', 3, 4);

    -- 석유화학
    PERFORM create_department(v_tenant_id, 'CHEM_OLEFIN', '올레핀팀', 'Olefins', 'CHEM_PETRO', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_AROM', '아로마틱스팀', 'Aromatics', 'CHEM_PETRO', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_POLY', '폴리머팀', 'Polymers', 'CHEM_PETRO', 3, 3);

    -- 첨단소재
    PERFORM create_department(v_tenant_id, 'CHEM_ELEC', '전자소재팀', 'Electronic Materials', 'CHEM_ADV', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_BATT', '배터리소재팀', 'Battery Materials', 'CHEM_ADV', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_COMP', '복합소재팀', 'Composite Materials', 'CHEM_ADV', 3, 3);

    -- 연구개발
    PERFORM create_department(v_tenant_id, 'CHEM_PROC', '공정연구팀', 'Process Research', 'CHEM_RND', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_APP', '응용연구팀', 'Application Research', 'CHEM_RND', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_GREEN', '친환경연구팀', 'Green Chemistry', 'CHEM_RND', 3, 3);

    -- 생산
    PERFORM create_department(v_tenant_id, 'CHEM_PLANT1', '울산공장', 'Ulsan Plant', 'CHEM_PROD', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_PLANT2', '여수공장', 'Yeosu Plant', 'CHEM_PROD', 3, 2);
    PERFORM create_department(v_tenant_id, 'CHEM_QA', '품질관리팀', 'Quality Management', 'CHEM_PROD', 3, 3);

    -- 영업
    PERFORM create_department(v_tenant_id, 'CHEM_SALES', '영업본부', 'Sales', 'CHEM_ROOT', 2, 6);
    PERFORM create_department(v_tenant_id, 'CHEM_DOM', '국내영업팀', 'Domestic Sales', 'CHEM_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'CHEM_EXP', '수출팀', 'Export', 'CHEM_SALES', 3, 2);
END $$;

-- ============================================================================
-- 7. 한성IT서비스 (HANSUNG_IT) - 30개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000007';
BEGIN
    PERFORM create_department(v_tenant_id, 'IT_ROOT', '한성IT서비스', 'Hansung IT Service', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'IT_MGMT', '경영지원본부', 'Management Support', 'IT_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'IT_DEV', '개발본부', 'Development', 'IT_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'IT_INFRA', '인프라본부', 'Infrastructure', 'IT_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'IT_CONS', '컨설팅본부', 'Consulting', 'IT_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'IT_SALES', '영업본부', 'Sales', 'IT_ROOT', 2, 5);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'IT_HR', '인사팀', 'HR Team', 'IT_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_FIN', '재무팀', 'Finance Team', 'IT_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'IT_GA', '총무팀', 'General Affairs', 'IT_MGMT', 3, 3);

    -- 개발
    PERFORM create_department(v_tenant_id, 'IT_SOL', '솔루션개발팀', 'Solution Development', 'IT_DEV', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_ERP', 'ERP개발팀', 'ERP Development', 'IT_DEV', 3, 2);
    PERFORM create_department(v_tenant_id, 'IT_WEB', '웹개발팀', 'Web Development', 'IT_DEV', 3, 3);
    PERFORM create_department(v_tenant_id, 'IT_MOBILE', '모바일개발팀', 'Mobile Development', 'IT_DEV', 3, 4);
    PERFORM create_department(v_tenant_id, 'IT_AI', 'AI개발팀', 'AI Development', 'IT_DEV', 3, 5);
    PERFORM create_department(v_tenant_id, 'IT_QA', 'QA팀', 'QA Team', 'IT_DEV', 3, 6);

    -- 인프라
    PERFORM create_department(v_tenant_id, 'IT_CLOUD', '클라우드팀', 'Cloud Team', 'IT_INFRA', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_NET', '네트워크팀', 'Network Team', 'IT_INFRA', 3, 2);
    PERFORM create_department(v_tenant_id, 'IT_SEC', '보안팀', 'Security Team', 'IT_INFRA', 3, 3);
    PERFORM create_department(v_tenant_id, 'IT_OPS', '운영팀', 'Operations Team', 'IT_INFRA', 3, 4);

    -- 컨설팅
    PERFORM create_department(v_tenant_id, 'IT_BIZ', '비즈니스컨설팅팀', 'Business Consulting', 'IT_CONS', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_DX', 'DX컨설팅팀', 'DX Consulting', 'IT_CONS', 3, 2);

    -- 영업
    PERFORM create_department(v_tenant_id, 'IT_SALES1', '영업1팀', 'Sales Team 1', 'IT_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'IT_SALES2', '영업2팀', 'Sales Team 2', 'IT_SALES', 3, 2);
    PERFORM create_department(v_tenant_id, 'IT_PM', 'PM팀', 'PM Team', 'IT_SALES', 3, 3);
END $$;

-- ============================================================================
-- 8. 한성생명 (HANSUNG_LIFE) - 45개 부서
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000008';
BEGIN
    PERFORM create_department(v_tenant_id, 'LIFE_ROOT', '한성생명', 'Hansung Life', NULL, 1, 1);

    -- 본부
    PERFORM create_department(v_tenant_id, 'LIFE_MGMT', '경영지원본부', 'Management Support', 'LIFE_ROOT', 2, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_SALES', '영업본부', 'Sales', 'LIFE_ROOT', 2, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_PROD', '상품본부', 'Product', 'LIFE_ROOT', 2, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_ACT', '계리본부', 'Actuarial', 'LIFE_ROOT', 2, 4);
    PERFORM create_department(v_tenant_id, 'LIFE_CLAIM', '보상본부', 'Claims', 'LIFE_ROOT', 2, 5);
    PERFORM create_department(v_tenant_id, 'LIFE_RISK', '리스크관리본부', 'Risk Management', 'LIFE_ROOT', 2, 6);
    PERFORM create_department(v_tenant_id, 'LIFE_IT', 'IT본부', 'IT', 'LIFE_ROOT', 2, 7);

    -- 경영지원
    PERFORM create_department(v_tenant_id, 'LIFE_HR', '인사팀', 'HR Team', 'LIFE_MGMT', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_FIN', '재무팀', 'Finance Team', 'LIFE_MGMT', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_GA', '총무팀', 'General Affairs', 'LIFE_MGMT', 3, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_LEGAL', '법무팀', 'Legal Team', 'LIFE_MGMT', 3, 4);
    PERFORM create_department(v_tenant_id, 'LIFE_COMP', '준법감시팀', 'Compliance', 'LIFE_MGMT', 3, 5);

    -- 영업
    PERFORM create_department(v_tenant_id, 'LIFE_CORP', '법인영업팀', 'Corporate Sales', 'LIFE_SALES', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_RETAIL', '개인영업팀', 'Retail Sales', 'LIFE_SALES', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_GA_CH', 'GA채널팀', 'GA Channel', 'LIFE_SALES', 3, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_BANK', '방카채널팀', 'Bancassurance', 'LIFE_SALES', 3, 4);
    PERFORM create_department(v_tenant_id, 'LIFE_TELE', '텔레마케팅팀', 'Telemarketing', 'LIFE_SALES', 3, 5);
    PERFORM create_department(v_tenant_id, 'LIFE_ONLINE', '온라인영업팀', 'Online Sales', 'LIFE_SALES', 3, 6);

    -- 상품
    PERFORM create_department(v_tenant_id, 'LIFE_LIFE', '생명보험팀', 'Life Insurance', 'LIFE_PROD', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_HEALTH', '건강보험팀', 'Health Insurance', 'LIFE_PROD', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_PENSION', '연금팀', 'Pension', 'LIFE_PROD', 3, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_VAR', '변액팀', 'Variable Insurance', 'LIFE_PROD', 3, 4);

    -- 계리
    PERFORM create_department(v_tenant_id, 'LIFE_PRICE', '가격계리팀', 'Pricing', 'LIFE_ACT', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_RES', '책임준비금팀', 'Reserves', 'LIFE_ACT', 3, 2);

    -- 보상
    PERFORM create_department(v_tenant_id, 'LIFE_UW', '언더라이팅팀', 'Underwriting', 'LIFE_CLAIM', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_CLAIM1', '보험금심사팀', 'Claims Review', 'LIFE_CLAIM', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_SIU', 'SIU팀', 'Special Investigation', 'LIFE_CLAIM', 3, 3);

    -- 리스크
    PERFORM create_department(v_tenant_id, 'LIFE_CREDIT', '신용리스크팀', 'Credit Risk', 'LIFE_RISK', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_MARKET', '시장리스크팀', 'Market Risk', 'LIFE_RISK', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_OPRISK', '운영리스크팀', 'Operational Risk', 'LIFE_RISK', 3, 3);

    -- IT
    PERFORM create_department(v_tenant_id, 'LIFE_DEV', '개발팀', 'Development', 'LIFE_IT', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_INFRA', '인프라팀', 'Infrastructure', 'LIFE_IT', 3, 2);
    PERFORM create_department(v_tenant_id, 'LIFE_SEC', '정보보안팀', 'Information Security', 'LIFE_IT', 3, 3);
    PERFORM create_department(v_tenant_id, 'LIFE_DATA', '데이터팀', 'Data Team', 'LIFE_IT', 3, 4);

    -- 고객센터
    PERFORM create_department(v_tenant_id, 'LIFE_CS', '고객서비스본부', 'Customer Service', 'LIFE_ROOT', 2, 8);
    PERFORM create_department(v_tenant_id, 'LIFE_CALL', '콜센터', 'Call Center', 'LIFE_CS', 3, 1);
    PERFORM create_department(v_tenant_id, 'LIFE_BRANCH', '지점운영팀', 'Branch Operations', 'LIFE_CS', 3, 2);
END $$;

-- 임시 함수 삭제
DROP FUNCTION IF EXISTS create_department;

COMMIT;

-- 검증
DO $$
DECLARE
    dept_count INT;
    tenant_name VARCHAR;
    tenant_dept_count INT;
BEGIN
    SELECT COUNT(*) INTO dept_count FROM hr_core.department;
    RAISE NOTICE '총 부서 수: % 개', dept_count;

    FOR tenant_name, tenant_dept_count IN
        SELECT t.name, COUNT(d.id)
        FROM tenant_common.tenant t
        LEFT JOIN hr_core.department d ON t.id = d.tenant_id
        GROUP BY t.name
        ORDER BY COUNT(d.id) DESC
    LOOP
        RAISE NOTICE '  - %: % 개', tenant_name, tenant_dept_count;
    END LOOP;
END $$;
