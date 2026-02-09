-- V3: Seed HR code groups and common codes
-- All system codes (is_system=true, tenant_id=NULL)
-- Applied to schema: tenant_common

-- =============================================================================
-- 1. GRADE (직급) - 10 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'GRADE', '직급', 'Grade', '직급 코드', true, false, 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'GRADE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'G1', '사원', 'Staff', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G2', '주임', 'Senior Staff', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G3', '대리', 'Assistant Manager', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G4', '과장', 'Manager', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G5', '차장', 'Deputy General Manager', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G6', '부장', 'General Manager', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G7', '이사', 'Director', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G8', '상무', 'Senior Director', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G9', '전무', 'Executive Vice President', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G10', '부사장', 'Vice President', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 2. POSITION (직책) - 10 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'POSITION', '직책', 'Position', '직책 코드', true, false, 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'POSITION' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'P1', '팀원', 'Team Member', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P2', '파트장', 'Part Leader', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P3', '팀장', 'Team Leader', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P4', '실장', 'Office Director', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P5', '부서장', 'Department Head', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P6', '본부장', 'Division Head', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P7', '센터장', 'Center Head', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P8', '부문장', 'Sector Head', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P9', '대표이사', 'CEO', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P10', '회장', 'Chairman', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 3. DEPT_TYPE (부서유형) - 6 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'DEPT_TYPE', '부서유형', 'Department Type', '부서 유형 코드', true, false, 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'DEPT_TYPE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'DEPT', '부서', 'Department', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TEAM', '팀', 'Team', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DIV', '본부', 'Division', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CENTER', '센터', 'Center', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BIZ', '사업부', 'Business Unit', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BRANCH', '지점', 'Branch', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 4. LEAVE_TYPE (휴가유형) - hierarchical, 2 levels
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'LEAVE_TYPE', '휴가유형', 'Leave Type', '휴가 유형 코드', true, true, 2, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'LEAVE_TYPE' AND tenant_id IS NULL;
    END IF;

    -- Level 1: Parent leave types
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'L01', '연차', 'Annual Leave', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L02', '병가', 'Sick Leave', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L03', '경조', 'Family Event Leave', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L04', '출산', 'Maternity Leave', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L05', '육아', 'Parental Leave', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L06', '가족돌봄', 'Family Care Leave', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L07', '공가', 'Official Leave', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L08', '특별', 'Special Leave', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L09', '보상', 'Compensatory Leave', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L10', '포상', 'Reward Leave', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L11', '리프레시', 'Refresh Leave', 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of L01 (연차)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'L01' AND tenant_id IS NULL),
         'L0101', '연차(전일)', 'Annual Leave (Full)', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'L01' AND tenant_id IS NULL),
         'L0102', '반차(오전)', 'Half Day (AM)', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'L01' AND tenant_id IS NULL),
         'L0103', '반차(오후)', 'Half Day (PM)', 2, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'L01' AND tenant_id IS NULL),
         'L0104', '시간차', 'Hourly Leave', 2, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 5. EMPLOYMENT_TYPE (고용형태) - 5 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'EMPLOYMENT_TYPE', '고용형태', 'Employment Type', '고용 형태 코드', true, false, 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'EMPLOYMENT_TYPE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'FT', '정규직', 'Full-time', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CT', '계약직', 'Contract', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PT', '파견직', 'Dispatched', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IS', '인턴', 'Intern', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AD', '자문/고문', 'Advisor', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 6. CONTRACT_TYPE (계약유형) - 4 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'CONTRACT_TYPE', '계약유형', 'Contract Type', '계약 유형 코드', true, false, 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'CONTRACT_TYPE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'INDEF', '무기계약', 'Indefinite', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'FIXED', '기간제', 'Fixed-term', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PART', '시간제', 'Part-time', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'FREELANCE', '프리랜서', 'Freelance', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 7. GENDER (성별) - 3 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'GENDER', '성별', 'Gender', '성별 코드', true, false, 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'GENDER' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'M', '남성', 'Male', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'F', '여성', 'Female', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'O', '기타', 'Other', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 8. MARITAL_STATUS (혼인상태) - 3 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'MARITAL_STATUS', '혼인상태', 'Marital Status', '혼인 상태 코드', true, false, 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'MARITAL_STATUS' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'S', '미혼', 'Single', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'M', '기혼', 'Married', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'D', '기타', 'Other', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 9. EDUCATION_LEVEL (학력) - 7 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'EDUCATION_LEVEL', '학력', 'Education Level', '학력 코드', true, false, 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'EDUCATION_LEVEL' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'MS', '중학교', 'Middle School', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'HS', '고등학교', 'High School', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CC', '전문대', 'Community College', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BS', '학사', 'Bachelor', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MS_D', '석사', 'Master', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PHD', '박사', 'Doctorate', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'OTHER', '기타', 'Other', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 10. BANK_CODE (은행코드) - 20 codes with extraValue1 as bank code number
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'BANK_CODE', '은행코드', 'Bank Code', '은행 코드', true, false, 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'BANK_CODE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, extra_value1, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'KB', 'KB국민', 'KB Kookmin', '004', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SHINHAN', '신한', 'Shinhan', '088', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'WOORI', '우리', 'Woori', '020', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'HANA', '하나', 'Hana', '081', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IBK', 'IBK기업', 'IBK Industrial', '003', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NH', 'NH농협', 'NH Nonghyup', '011', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SC', 'SC제일', 'SC First', '023', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CITI', '한국씨티', 'Citibank Korea', '027', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DAEGU', '대구', 'Daegu', '032', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'GWANGJU', '광주', 'Gwangju', '034', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'JEJU', '제주', 'Jeju', '035', 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'JEONBUK', '전북', 'Jeonbuk', '037', 1, 'ACTIVE', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'GYEONGNAM', '경남', 'Gyeongnam', '039', 1, 'ACTIVE', true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SAEMAUL', '새마을금고', 'Saemaul Geumgo', '045', 1, 'ACTIVE', true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SHINHYUP', '신협', 'Shinhyup', '048', 1, 'ACTIVE', true, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'POST', '우체국', 'Korea Post', '071', 1, 'ACTIVE', true, 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'KBANK', 'K뱅크', 'K Bank', '089', 1, 'ACTIVE', true, 17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'KAKAO', '카카오뱅크', 'Kakao Bank', '090', 1, 'ACTIVE', true, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TOSS', '토스뱅크', 'Toss Bank', '092', 1, 'ACTIVE', true, 19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'KDB', '산업', 'KDB Industrial', '002', 1, 'ACTIVE', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 11. APPROVAL_TYPE (결재유형) - 10 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'APPROVAL_TYPE', '결재유형', 'Approval Type', '결재 유형 코드', true, false, 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'APPROVAL_TYPE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'LEAVE', '휴가', 'Leave', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'OT', '초과근무', 'Overtime', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BT', '출장', 'Business Trip', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'EXP', '경비', 'Expense', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PURCHASE', '구매', 'Purchase', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DOC', '문서', 'Document', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'APPT', '발령', 'Appointment', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CONTRACT', '계약', 'Contract', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CERT', '증명서', 'Certificate', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'OTHER', '기타', 'Other', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 12. DOCUMENT_TYPE (문서유형) - hierarchical, 2 levels
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'DOCUMENT_TYPE', '문서유형', 'Document Type', '문서 유형 코드', true, true, 2, 'ACTIVE', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'DOCUMENT_TYPE' AND tenant_id IS NULL;
    END IF;

    -- Level 1: Parent document types
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'HR', '인사문서', 'HR Documents', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'FIN', '재무문서', 'Finance Documents', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ADMIN', '총무문서', 'Admin Documents', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'LEGAL', '법무문서', 'Legal Documents', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CERT', '증명문서', 'Certificate Documents', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of HR (인사문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'HR' AND tenant_id IS NULL),
         'HR01', '발령문서', 'Appointment Document', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'HR' AND tenant_id IS NULL),
         'HR02', '근로계약서', 'Employment Contract', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'HR' AND tenant_id IS NULL),
         'HR03', '인사평가', 'Performance Review', 2, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of FIN (재무문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'FIN' AND tenant_id IS NULL),
         'FIN01', '지출결의서', 'Expense Report', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'FIN' AND tenant_id IS NULL),
         'FIN02', '세금계산서', 'Tax Invoice', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'FIN' AND tenant_id IS NULL),
         'FIN03', '영수증', 'Receipt', 2, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of ADMIN (총무문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'ADMIN' AND tenant_id IS NULL),
         'ADMIN01', '시설요청', 'Facility Request', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'ADMIN' AND tenant_id IS NULL),
         'ADMIN02', '비품요청', 'Supply Request', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of LEGAL (법무문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'LEGAL' AND tenant_id IS NULL),
         'LEGAL01', '계약서', 'Contract', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'LEGAL' AND tenant_id IS NULL),
         'LEGAL02', '위임장', 'Power of Attorney', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of CERT (증명문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'CERT' AND tenant_id IS NULL),
         'CERT01', '재직증명서', 'Employment Certificate', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'CERT' AND tenant_id IS NULL),
         'CERT02', '경력증명서', 'Career Certificate', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'CERT' AND tenant_id IS NULL),
         'CERT03', '급여명세서', 'Payslip', 2, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'CERT' AND tenant_id IS NULL),
         'CERT04', '원천징수영수증', 'Withholding Tax Receipt', 2, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 13. COUNTRY_CODE (국가코드) - 30 codes
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'COUNTRY_CODE', '국가코드', 'Country Code', '국가 코드', true, false, 1, 'ACTIVE', true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'COUNTRY_CODE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'KR', '대한민국', 'South Korea', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'US', '미국', 'United States', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'JP', '일본', 'Japan', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CN', '중국', 'China', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'GB', '영국', 'United Kingdom', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DE', '독일', 'Germany', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'FR', '프랑스', 'France', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CA', '캐나다', 'Canada', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AU', '호주', 'Australia', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SG', '싱가포르', 'Singapore', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'HK', '홍콩', 'Hong Kong', 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TW', '대만', 'Taiwan', 1, 'ACTIVE', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'VN', '베트남', 'Vietnam', 1, 'ACTIVE', true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TH', '태국', 'Thailand', 1, 'ACTIVE', true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PH', '필리핀', 'Philippines', 1, 'ACTIVE', true, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MY', '말레이시아', 'Malaysia', 1, 'ACTIVE', true, 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ID', '인도네시아', 'Indonesia', 1, 'ACTIVE', true, 17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IN', '인도', 'India', 1, 'ACTIVE', true, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BR', '브라질', 'Brazil', 1, 'ACTIVE', true, 19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MX', '멕시코', 'Mexico', 1, 'ACTIVE', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NZ', '뉴질랜드', 'New Zealand', 1, 'ACTIVE', true, 21, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IT', '이탈리아', 'Italy', 1, 'ACTIVE', true, 22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ES', '스페인', 'Spain', 1, 'ACTIVE', true, 23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NL', '네덜란드', 'Netherlands', 1, 'ACTIVE', true, 24, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SE', '스웨덴', 'Sweden', 1, 'ACTIVE', true, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CH', '스위스', 'Switzerland', 1, 'ACTIVE', true, 26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AE', '아랍에미리트', 'United Arab Emirates', 1, 'ACTIVE', true, 27, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SA', '사우디아라비아', 'Saudi Arabia', 1, 'ACTIVE', true, 28, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'RU', '러시아', 'Russia', 1, 'ACTIVE', true, 29, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ZA', '남아프리카', 'South Africa', 1, 'ACTIVE', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- =============================================================================
-- 14. CURRENCY_CODE (통화코드) - 30 codes with extraValue1 as currency symbol
-- =============================================================================
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'CURRENCY_CODE', '통화코드', 'Currency Code', '통화 코드', true, false, 1, 'ACTIVE', true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'CURRENCY_CODE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, extra_value1, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'KRW', '원', 'Korean Won', '₩', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'USD', '달러', 'US Dollar', '$', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'JPY', '엔', 'Japanese Yen', '¥', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CNY', '위안', 'Chinese Yuan', '¥', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'EUR', '유로', 'Euro', '€', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'GBP', '파운드', 'British Pound', '£', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CAD', '캐나다달러', 'Canadian Dollar', 'C$', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AUD', '호주달러', 'Australian Dollar', 'A$', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SGD', '싱가포르달러', 'Singapore Dollar', 'S$', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'HKD', '홍콩달러', 'Hong Kong Dollar', 'HK$', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TWD', '대만달러', 'Taiwan Dollar', 'NT$', 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'VND', '베트남동', 'Vietnamese Dong', '₫', 1, 'ACTIVE', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'THB', '바트', 'Thai Baht', '฿', 1, 'ACTIVE', true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PHP', '필리핀페소', 'Philippine Peso', '₱', 1, 'ACTIVE', true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MYR', '링깃', 'Malaysian Ringgit', 'RM', 1, 'ACTIVE', true, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IDR', '루피아', 'Indonesian Rupiah', 'Rp', 1, 'ACTIVE', true, 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'INR', '루피', 'Indian Rupee', '₹', 1, 'ACTIVE', true, 17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BRL', '헤알', 'Brazilian Real', 'R$', 1, 'ACTIVE', true, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MXN', '멕시코페소', 'Mexican Peso', '$', 1, 'ACTIVE', true, 19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NZD', '뉴질랜드달러', 'New Zealand Dollar', 'NZ$', 1, 'ACTIVE', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CHF', '스위스프랑', 'Swiss Franc', 'CHF', 1, 'ACTIVE', true, 21, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SEK', '스웨덴크로나', 'Swedish Krona', 'kr', 1, 'ACTIVE', true, 22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AED', '디르함', 'UAE Dirham', 'AED', 1, 'ACTIVE', true, 23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SAR', '리얄', 'Saudi Riyal', 'SAR', 1, 'ACTIVE', true, 24, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'RUB', '루블', 'Russian Ruble', '₽', 1, 'ACTIVE', true, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ZAR', '랜드', 'South African Rand', 'R', 1, 'ACTIVE', true, 26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NOK', '노르웨이크로네', 'Norwegian Krone', 'kr', 1, 'ACTIVE', true, 27, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DKK', '덴마크크로네', 'Danish Krone', 'kr', 1, 'ACTIVE', true, 28, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PLN', '즈워티', 'Polish Zloty', 'zł', 1, 'ACTIVE', true, 29, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CZK', '코루나', 'Czech Koruna', 'Kč', 1, 'ACTIVE', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;
