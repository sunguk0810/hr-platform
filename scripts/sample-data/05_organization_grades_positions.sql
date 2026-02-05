-- ============================================================================
-- 05_organization_grades_positions.sql
-- 직급 및 직책 마스터 데이터 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 직급 (Grade) - 11단계 체계
-- 각 테넌트별로 생성
-- ============================================================================

DO $$
DECLARE
    t_record RECORD;
BEGIN
    FOR t_record IN SELECT id FROM tenant_common.tenant LOOP
        -- G01 사원 (Entry Level)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G01', '사원', 'Staff', 1, 1, true, NOW(), NOW(), 'system', 'system');

        -- G02 주임 (Junior)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G02', '주임', 'Junior', 2, 2, true, NOW(), NOW(), 'system', 'system');

        -- G03 대리 (Associate)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G03', '대리', 'Associate', 3, 3, true, NOW(), NOW(), 'system', 'system');

        -- G04 과장 (Manager)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G04', '과장', 'Manager', 4, 4, true, NOW(), NOW(), 'system', 'system');

        -- G05 차장 (Deputy General Manager)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G05', '차장', 'Deputy General Manager', 5, 5, true, NOW(), NOW(), 'system', 'system');

        -- G06 부장 (General Manager)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G06', '부장', 'General Manager', 6, 6, true, NOW(), NOW(), 'system', 'system');

        -- G07 이사 (Director)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G07', '이사', 'Director', 7, 7, true, NOW(), NOW(), 'system', 'system');

        -- G08 상무 (Senior Director)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G08', '상무', 'Senior Director', 8, 8, true, NOW(), NOW(), 'system', 'system');

        -- G09 전무 (Executive Vice President)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G09', '전무', 'Executive Vice President', 9, 9, true, NOW(), NOW(), 'system', 'system');

        -- G10 부사장 (Senior Executive Vice President)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G10', '부사장', 'Senior Executive VP', 10, 10, true, NOW(), NOW(), 'system', 'system');

        -- G11 사장 (President)
        INSERT INTO hr_core.grade (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'G11', '사장', 'President', 11, 11, true, NOW(), NOW(), 'system', 'system');
    END LOOP;
END $$;


-- ============================================================================
-- 직책 (Position) - 9단계 체계
-- 각 테넌트별로 생성
-- ============================================================================

DO $$
DECLARE
    t_record RECORD;
BEGIN
    FOR t_record IN SELECT id FROM tenant_common.tenant LOOP
        -- P01 팀원 (Team Member)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P01', '팀원', 'Team Member', 1, 1, true, NOW(), NOW(), 'system', 'system');

        -- P02 선임 (Senior Member)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P02', '선임', 'Senior', 2, 2, true, NOW(), NOW(), 'system', 'system');

        -- P03 책임 (Lead)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P03', '책임', 'Lead', 3, 3, true, NOW(), NOW(), 'system', 'system');

        -- P04 수석 (Principal)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P04', '수석', 'Principal', 4, 4, true, NOW(), NOW(), 'system', 'system');

        -- P05 파트장 (Part Leader)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P05', '파트장', 'Part Leader', 5, 5, true, NOW(), NOW(), 'system', 'system');

        -- P06 팀장 (Team Leader)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P06', '팀장', 'Team Leader', 6, 6, true, NOW(), NOW(), 'system', 'system');

        -- P07 실장 (Department Head)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P07', '실장', 'Department Head', 7, 7, true, NOW(), NOW(), 'system', 'system');

        -- P08 본부장 (Division Head)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P08', '본부장', 'Division Head', 8, 8, true, NOW(), NOW(), 'system', 'system');

        -- P09 대표이사 (CEO)
        INSERT INTO hr_core.position (tenant_id, code, name, name_en, level, sort_order, is_active, created_at, updated_at, created_by, updated_by)
        VALUES (t_record.id, 'P09', '대표이사', 'CEO', 9, 9, true, NOW(), NOW(), 'system', 'system');
    END LOOP;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    grade_count INT;
    position_count INT;
BEGIN
    SELECT COUNT(*) INTO grade_count FROM hr_core.grade;
    SELECT COUNT(*) INTO position_count FROM hr_core.position;
    RAISE NOTICE '직급 생성 완료: % 개 (8개 테넌트 x 11개 직급)', grade_count;
    RAISE NOTICE '직책 생성 완료: % 개 (8개 테넌트 x 9개 직책)', position_count;
END $$;
