-- ============================================================================
-- 05_employees.sql
-- 570 employees across 8 tenants (DETERMINISTIC generator)
-- ============================================================================
-- This file creates:
--   - employee_number_rule  (8 entries, one per tenant)
--   - employee              (6 test accounts + ~564 generated = ~570 total)
--   - employee_affiliation  (1 per employee)
--   - employee_education    (1 per employee)
--   - employee_family       (~60% of employees)
--   - employee_career       (~30% of employees)
--   - employee_certificate  (~35% of employees)
--   - employee_history      (test accounts + ~10%)
--   - employee_change_request (5 for 한성전자)
--   - privacy_access_log    (30 for 한성전자)
--
-- UUID Convention:
--   Employee IDs:  e000000{N}-0000-0000-0000-{SSSS zero-padded to 12}
--   Tenant IDs:    a0000001-0000-0000-0000-00000000000{N}
--   Departments:   looked up by code (gen_random_uuid was used in Step 6)
--
-- Depends on: 01_tenants.sql, 05_organization_grades_positions.sql,
--             06_organization_departments.sql
-- ============================================================================

-- ============================================================================
-- PART 1: Employee Number Rules (8 entries, one per tenant)
-- ============================================================================
BEGIN;

INSERT INTO hr_core.employee_number_rule (
    id, tenant_id, prefix, include_year, year_format, sequence_digits,
    sequence_reset_policy, current_sequence, current_year, separator,
    allow_reuse, is_active, created_at, updated_at, created_by, updated_by
) VALUES
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000001', 'H',  true, 'YYYY', 4, 'YEARLY', 30,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000002', 'E',  true, 'YYYY', 4, 'YEARLY', 200, 2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000003', 'S',  true, 'YYYY', 4, 'YEARLY', 80,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000004', 'EN', true, 'YYYY', 4, 'YEARLY', 50,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000005', 'B',  true, 'YYYY', 4, 'YEARLY', 40,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000006', 'C',  true, 'YYYY', 4, 'YEARLY', 50,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000007', 'IT', true, 'YYYY', 4, 'YEARLY', 40,  2026, '-', false, true, NOW(), NOW(), 'system', 'system'),
    (gen_random_uuid(), 'a0000001-0000-0000-0000-000000000008', 'L',  true, 'YYYY', 4, 'YEARLY', 80,  2026, '-', false, true, NOW(), NOW(), 'system', 'system')
ON CONFLICT (tenant_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- PART 2: Test Accounts (6 explicit INSERTs for 한성전자)
-- ============================================================================
BEGIN;

DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_dept_mgmt UUID;     -- 경영지원본부
    v_dept_hr UUID;        -- 인사팀
    v_dept_dev1 UUID;      -- 개발1팀
BEGIN
    -- Look up department IDs by code (must match 04_organization.sql codes)
    SELECT id INTO v_dept_mgmt FROM hr_core.department WHERE tenant_id = v_tenant_id AND code = 'MGMT_HQ';
    SELECT id INTO v_dept_hr   FROM hr_core.department WHERE tenant_id = v_tenant_id AND code = 'HR_TEAM';
    SELECT id INTO v_dept_dev1 FROM hr_core.department WHERE tenant_id = v_tenant_id AND code = 'DEV1';

    -- Employee 1: CEO (이전자)
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000001', v_tenant_id,
        'E-2024-0001', '이전자', 'Jeonja Lee', 'ceo@hansung-elec.co.kr', '010-1000-0001',
        v_dept_mgmt, 'P01', 'G03',
        '2010-03-02', 'ACTIVE', 'FULL_TIME', NULL, NULL,
        NULL, '1968-03-15',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 2: HR Admin (김인사)
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000002', v_tenant_id,
        'E-2024-0002', '김인사', 'Insa Kim', 'hr.admin@hansung-elec.co.kr', '010-1000-0002',
        v_dept_hr, 'P06', 'G07',
        '2012-09-01', 'ACTIVE', 'FULL_TIME', NULL, NULL,
        NULL, '1975-07-22',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 3: HR Manager (박인사)
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000003', v_tenant_id,
        'E-2024-0003', '박인사', 'Insa Park', 'hr.manager@hansung-elec.co.kr', '010-1000-0003',
        v_dept_hr, 'P07', 'G09',
        '2016-03-02', 'ACTIVE', 'FULL_TIME',
        'e0000002-0000-0000-0000-000000000002', NULL,
        NULL, '1983-11-08',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 4: Dev Manager (정개발)
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000004', v_tenant_id,
        'E-2024-0004', '정개발', 'Gaebal Jung', 'dev.manager@hansung-elec.co.kr', '010-1000-0004',
        v_dept_dev1, 'P06', 'G08',
        '2014-01-02', 'ACTIVE', 'FULL_TIME', NULL, NULL,
        NULL, '1980-09-30',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 5: Dev Senior (강선임) -- February birthday!
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000005', v_tenant_id,
        'E-2024-0005', '강선임', 'Seonim Kang', 'dev.senior@hansung-elec.co.kr', '010-1000-0005',
        v_dept_dev1, 'P08', 'G10',
        '2019-07-01', 'ACTIVE', 'FULL_TIME',
        'e0000002-0000-0000-0000-000000000004', NULL,
        NULL, '1990-02-14',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Employee 6: Dev Staff (조사원) -- February birthday!
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email, mobile,
        department_id, position_code, job_title_code,
        hire_date, status, employment_type, manager_id, user_id,
        resident_number, birth_date,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        'e0000002-0000-0000-0000-000000000006', v_tenant_id,
        'E-2024-0006', '조사원', 'Sawon Cho', 'dev.staff@hansung-elec.co.kr', '010-1000-0006',
        v_dept_dev1, 'P09', 'G11',
        '2023-03-02', 'ACTIVE', 'FULL_TIME',
        'e0000002-0000-0000-0000-000000000004', NULL,
        NULL, '1995-02-20',
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

    -- Create affiliations for all 6 test accounts
    INSERT INTO hr_core.employee_affiliation (id, tenant_id, employee_id, department_id, department_name, position_code, position_name, is_primary, affiliation_type, start_date, is_active, created_at, updated_at, created_by, updated_by)
    VALUES
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000001', v_dept_mgmt, '경영지원본부', 'P01', '대표이사', true, 'PRIMARY', '2010-03-02', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000002', v_dept_hr,   '인사팀',       'P06', '팀장',     true, 'PRIMARY', '2012-09-01', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000003', v_dept_hr,   '인사팀',       'P07', '책임',     true, 'PRIMARY', '2016-03-02', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000004', v_dept_dev1, '개발1팀',      'P06', '팀장',     true, 'PRIMARY', '2014-01-02', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000005', v_dept_dev1, '개발1팀',      'P08', '선임',     true, 'PRIMARY', '2019-07-01', true, NOW(), NOW(), 'system', 'system'),
        (gen_random_uuid(), v_tenant_id, 'e0000002-0000-0000-0000-000000000006', v_dept_dev1, '개발1팀',      'P09', '팀원',     true, 'PRIMARY', '2023-03-02', true, NOW(), NOW(), 'system', 'system')
    ON CONFLICT ON CONSTRAINT idx_affiliation_primary DO NOTHING;

    RAISE NOTICE 'Test accounts created: 6 employees for 한성전자';
END $$;

COMMIT;

-- ============================================================================
-- PART 3: Bulk Employee Generation (DETERMINISTIC PL/pgSQL)
-- ============================================================================
-- Generates ~564 additional employees (570 total - 6 test accounts)
-- Distribution: HD=30, ELEC=200, SDI=80, ENG=50, BIO=40, CHEM=50, IT=40, LIFE=80
-- ============================================================================

DO $$
DECLARE
    -- -------------------------------------------------------------------------
    -- Fixed name arrays (Korean surnames and given names)
    -- -------------------------------------------------------------------------
    v_surnames TEXT[] := ARRAY[
        '김','이','박','최','정','강','조','윤','장','임',
        '한','오','서','신','권','황','안','송','류','전',
        '홍','고','문','양','손','배','백','허','유','남',
        '심','노','하','곽','성','차','주','우','구','민',
        '진','지','채','원','천','방','공','현','탁','마'];

    v_given_names TEXT[] := ARRAY[
        '민준','서준','예준','도윤','시우','주원','하준','지호','지우','준서',
        '건우','현우','도현','수호','유준','정우','승현','준혁','진우','지훈',
        '서연','서윤','지우','하은','하윤','민서','지유','윤서','채원','수아',
        '지민','지아','서현','예은','하린','수빈','소율','다은','예린','나윤',
        '성민','재현','태현','동현','준영','민재','현준','세준','영호','기현',
        '상현','재영','태준','동민','현석','준호','승우','정민','우진','태영',
        '은서','수현','미소','하영','채영','시은','예나','소연','유나','지영',
        '혜진','미영','수정','은지','보라','연주','세라','지은','현정','은영',
        '성훈','재민','태윤','동건','준성','민수','현진','세현','영준','기범',
        '상우','재호','태민','동욱','현기','준수','승민','정현','우석','태웅',
        '은비','수민','미나','하진','채린','시연','예지','소현','유진','지수',
        '혜원','미진','수연','은하','보경','연서','세은','지현','현아','은수',
        '성진','재원','태경','동혁','준범','민혁','현수','세영','영진','기태',
        '상민','재혁','태훈','동준','현우','준기','승호','정환','우현','태식',
        '은채','수진','미래','하늘','채은','시현','예원','소미','유림','지원',
        '혜수','미선','수경','은별','보미','연지','세미','지혜','현주','은정'];

    v_surname_en TEXT[] := ARRAY[
        'Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim',
        'Han','Oh','Seo','Shin','Kwon','Hwang','Ahn','Song','Ryu','Jeon',
        'Hong','Ko','Moon','Yang','Son','Bae','Baek','Heo','Yoo','Nam',
        'Shim','Noh','Ha','Kwak','Sung','Cha','Joo','Woo','Koo','Min',
        'Jin','Ji','Chae','Won','Cheon','Bang','Kong','Hyun','Tak','Ma'];

    v_given_en TEXT[] := ARRAY[
        'Minjun','Seojun','Yejun','Doyun','Siwoo','Juwon','Hajun','Jiho','Jiwoo','Junseo',
        'Gunwoo','Hyunwoo','Dohyun','Suho','Yujun','Jungwoo','Seunghyun','Junhyuk','Jinwoo','Jihoon',
        'Seoyeon','Seoyun','Jiwoo2','Haeun','Hayun','Minseo','Jiyu','Yunseo','Chaewon','Sua',
        'Jimin','Jia','Seohyun','Yeeun','Harin','Subin','Soyul','Daeun','Yerin','Nayun',
        'Sungmin','Jaehyun','Taehyun','Donghyun','Junyoung','Minjae','Hyunjun','Sejun','Youngho','Kihyun',
        'Sanghyun','Jaeyoung','Taejun','Dongmin','Hyunsuk','Junho','Seungwoo','Jungmin','Woojin','Taeyoung',
        'Eunseo','Suhyun','Miso','Hayoung','Chaeyoung','Sieun','Yena','Soyeon','Yuna','Jiyoung',
        'Hyejin','Miyoung','Sujeong','Eunji','Bora','Yeonju','Sera','Jieun','Hyunjeong','Eunyoung',
        'Sunghoon','Jaemin','Taeyun','Donggun','Junsung','Minsoo','Hyunjin','Sehyun','Youngjun','Kibum',
        'Sangwoo','Jaeho','Taemin','Dongwook','Hyungi','Junsoo','Seungmin','Junghyun','Woosuk','Taewoong',
        'Eunbi','Sumin','Mina','Hajin','Chaerin','Siyeon','Yeji','Sohyun','Yujin','Jisoo',
        'Hyewon','Mijin','Sooyeon','Eunha','Bokyung','Yeonseo','Seeun','Jihyun','Hyuna','Eunsoo',
        'Sungjin','Jaewon','Taekyung','Donghyuk','Junbum','Minhyuk','Hyunsoo','Seyoung','Youngjin','Kitae',
        'Sangmin','Jaehyuk','Taehoon','Dongjun','Hyunwoo2','Junki','Seungho','Junghwan','Woohyun','Taesik',
        'Eunchae','Sujin','Mirae','Haneul','Chaeeun','Sihyun','Yewon','Somi','Yurim','Jiwon',
        'Hyesoo','Misun','Sukyung','Eunbyul','Bomi','Yeonji','Semi','Jihye','Hyunju','Eunjeong'];

    v_tenant_id UUID;
    v_emp_id UUID;
    v_dept_ids UUID[];
    v_dept_names TEXT[];
    v_surname TEXT;
    v_given TEXT;
    v_name TEXT;
    v_name_en_val TEXT;
    v_email TEXT;
    v_grade TEXT;
    v_position TEXT;
    v_dept_id UUID;
    v_dept_name TEXT;
    v_dept_idx INT;
    v_hire_year INT;
    v_hire_month INT;
    v_birth_year INT;
    v_birth_month INT;
    v_birth_day INT;
    v_status TEXT;
    v_emp_type TEXT;
    v_name_idx INT;
    v_s_idx INT;
    v_g_idx INT;
    v_total_created INT := 0;
    i INT;

    -- Tenant iteration variables
    v_tnums   INT[]  := ARRAY[1, 2, 3, 4, 5, 6, 7, 8];
    v_prefixes TEXT[] := ARRAY['H', 'E', 'S', 'EN', 'B', 'C', 'IT', 'L'];
    v_counts   INT[]  := ARRAY[30, 200, 80, 50, 40, 50, 40, 80];
    v_starts   INT[]  := ARRAY[1, 7, 1, 1, 1, 1, 1, 1];  -- tenant 2 starts at 7 (6 test accounts)
    v_domains  TEXT[] := ARRAY[
        'hansung-hd.co.kr',
        'hansung-elec.co.kr',
        'hansung-sdi.co.kr',
        'hansung-eng.co.kr',
        'hansung-bio.co.kr',
        'hansung-chem.co.kr',
        'hansung-it.co.kr',
        'hansung-life.co.kr'
    ];

    v_tnum INT;
    v_prefix TEXT;
    v_emp_count INT;
    v_start_seq INT;
    v_domain TEXT;
    v_t_idx INT;

    v_position_name TEXT;
BEGIN
    FOR v_t_idx IN 1..8 LOOP
        v_tnum      := v_tnums[v_t_idx];
        v_prefix    := v_prefixes[v_t_idx];
        v_emp_count := v_counts[v_t_idx];
        v_start_seq := v_starts[v_t_idx];
        v_domain    := v_domains[v_t_idx];
        v_tenant_id := ('a0000001-0000-0000-0000-00000000000' || v_tnum::TEXT)::UUID;

        -- Get leaf department IDs for this tenant (teams where employees belong)
        -- Leaf = departments that are NOT a parent of any other department
        SELECT array_agg(d.id ORDER BY d.sort_order, d.code),
               array_agg(d.name ORDER BY d.sort_order, d.code)
        INTO v_dept_ids, v_dept_names
        FROM hr_core.department d
        WHERE d.tenant_id = v_tenant_id
          AND d.status = 'ACTIVE'
          AND d.id NOT IN (
              SELECT DISTINCT parent_id
              FROM hr_core.department
              WHERE parent_id IS NOT NULL AND tenant_id = v_tenant_id
          );

        -- Fallback: if no leaf departments, use all non-root departments
        IF v_dept_ids IS NULL OR array_length(v_dept_ids, 1) IS NULL THEN
            SELECT array_agg(d.id ORDER BY d.sort_order, d.code),
                   array_agg(d.name ORDER BY d.sort_order, d.code)
            INTO v_dept_ids, v_dept_names
            FROM hr_core.department d
            WHERE d.tenant_id = v_tenant_id AND d.status = 'ACTIVE' AND d.level > 1;
        END IF;

        -- Skip tenant if still no departments
        IF v_dept_ids IS NULL OR array_length(v_dept_ids, 1) IS NULL THEN
            RAISE NOTICE 'Tenant % (%) : no departments found, skipping', v_tnum, v_prefix;
            CONTINUE;
        END IF;

        FOR i IN v_start_seq..v_emp_count LOOP
            -- Deterministic name from arrays
            v_name_idx := ((v_tnum - 1) * 200 + i);
            v_s_idx := 1 + (v_name_idx % array_length(v_surnames, 1));
            v_g_idx := 1 + ((v_name_idx / array_length(v_surnames, 1)) % array_length(v_given_names, 1));
            v_surname := v_surnames[v_s_idx];
            v_given := v_given_names[v_g_idx];
            v_name := v_surname || v_given;
            v_name_en_val := v_given_en[v_g_idx] || ' ' || v_surname_en[v_s_idx];

            -- Deterministic department assignment (round-robin across leaf teams)
            v_dept_idx := 1 + ((i - 1) % array_length(v_dept_ids, 1));
            v_dept_id := v_dept_ids[v_dept_idx];
            v_dept_name := v_dept_names[v_dept_idx];

            -- Grade: pyramid distribution (G01=lowest/most, G11=highest/fewest)
            -- G11: top 1%, G09-G10: 3%, G07-G08: 8%, G05-G06: 12%, G03-G04: 20%, G01-G02: 56%
            IF i <= GREATEST(1, (v_emp_count * 0.01)::INT) THEN
                v_grade := 'G11';    -- 사장
            ELSIF i <= GREATEST(2, (v_emp_count * 0.02)::INT) THEN
                v_grade := 'G09';    -- 전무
            ELSIF i <= GREATEST(3, (v_emp_count * 0.04)::INT) THEN
                v_grade := 'G08';    -- 상무
            ELSIF i <= GREATEST(4, (v_emp_count * 0.08)::INT) THEN
                v_grade := 'G07';    -- 이사
            ELSIF i <= GREATEST(5, (v_emp_count * 0.12)::INT) THEN
                v_grade := 'G06';    -- 부장
            ELSIF i <= GREATEST(6, (v_emp_count * 0.20)::INT) THEN
                v_grade := 'G05';    -- 차장
            ELSIF i <= GREATEST(8, (v_emp_count * 0.32)::INT) THEN
                v_grade := 'G04';    -- 과장
            ELSIF i <= GREATEST(10, (v_emp_count * 0.48)::INT) THEN
                v_grade := 'G03';    -- 대리
            ELSIF i <= GREATEST(12, (v_emp_count * 0.68)::INT) THEN
                v_grade := 'G02';    -- 주임
            ELSE
                v_grade := 'G01';    -- 사원
            END IF;

            -- Position mapped from grade
            CASE v_grade
                WHEN 'G11' THEN v_position := 'P09'; v_position_name := '대표이사';
                WHEN 'G10' THEN v_position := 'P08'; v_position_name := '본부장';
                WHEN 'G09' THEN v_position := 'P08'; v_position_name := '본부장';
                WHEN 'G08' THEN v_position := 'P07'; v_position_name := '실장';
                WHEN 'G07' THEN v_position := 'P07'; v_position_name := '실장';
                WHEN 'G06' THEN v_position := 'P06'; v_position_name := '팀장';
                WHEN 'G05' THEN v_position := 'P05'; v_position_name := '파트장';
                WHEN 'G04' THEN v_position := 'P04'; v_position_name := '수석';
                WHEN 'G03' THEN v_position := 'P03'; v_position_name := '책임';
                WHEN 'G02' THEN v_position := 'P02'; v_position_name := '선임';
                WHEN 'G01' THEN v_position := 'P01'; v_position_name := '팀원';
                ELSE v_position := 'P01'; v_position_name := '팀원';
            END CASE;

            -- Hire date: executives earlier, junior staff later
            CASE v_grade
                WHEN 'G11','G10','G09' THEN v_hire_year := 2005 + (i % 5);
                WHEN 'G08','G07'       THEN v_hire_year := 2010 + (i % 5);
                WHEN 'G06'             THEN v_hire_year := 2012 + (i % 6);
                WHEN 'G05'             THEN v_hire_year := 2015 + (i % 4);
                WHEN 'G04'             THEN v_hire_year := 2017 + (i % 4);
                WHEN 'G03'             THEN v_hire_year := 2019 + (i % 3);
                WHEN 'G02'             THEN v_hire_year := 2021 + (i % 3);
                WHEN 'G01'             THEN v_hire_year := 2023 + (i % 2);
                ELSE                        v_hire_year := 2022;
            END CASE;
            v_hire_month := 1 + ((i * 3) % 12);

            -- Birth year: based on grade
            CASE v_grade
                WHEN 'G11','G10','G09' THEN v_birth_year := 1960 + (i % 10);
                WHEN 'G08','G07'       THEN v_birth_year := 1968 + (i % 8);
                WHEN 'G06'             THEN v_birth_year := 1972 + (i % 8);
                WHEN 'G05'             THEN v_birth_year := 1978 + (i % 7);
                WHEN 'G04'             THEN v_birth_year := 1982 + (i % 6);
                WHEN 'G03'             THEN v_birth_year := 1986 + (i % 5);
                WHEN 'G02'             THEN v_birth_year := 1990 + (i % 4);
                WHEN 'G01'             THEN v_birth_year := 1995 + (i % 3);
                ELSE                        v_birth_year := 1990;
            END CASE;
            v_birth_month := 1 + (i % 12);
            v_birth_day := 1 + (i % 28);

            -- Status: 90% ACTIVE, 5% ON_LEAVE, 5% RESIGNED
            IF i % 20 = 0 THEN
                v_status := 'ON_LEAVE';
            ELSIF i % 20 = 19 THEN
                v_status := 'RESIGNED';
            ELSE
                v_status := 'ACTIVE';
            END IF;

            -- Employment type
            IF i % 15 = 0 THEN
                v_emp_type := 'CONTRACT';
            ELSIF i % 25 = 0 THEN
                v_emp_type := 'INTERN';
            ELSE
                v_emp_type := 'FULL_TIME';
            END IF;

            -- Generate deterministic UUID:  e000000{tnum}-0000-0000-0000-{i padded to 12}
            v_emp_id := ('e000000' || v_tnum || '-0000-0000-0000-' || LPAD(i::TEXT, 12, '0'))::UUID;

            -- Email: deterministic, unique per tenant
            v_email := LOWER(v_surname_en[v_s_idx]) || '.' || LOWER(REPLACE(v_given_en[v_g_idx], ' ', '')) || '.' || i || '@' || v_domain;

            INSERT INTO hr_core.employee (
                id, tenant_id, employee_number, name, name_en, email, mobile,
                department_id, position_code, job_title_code,
                hire_date, resign_date, status, employment_type,
                birth_date,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_emp_id, v_tenant_id,
                v_prefix || '-' || v_hire_year::TEXT || '-' || LPAD(i::TEXT, 4, '0'),
                v_name,
                v_name_en_val,
                v_email,
                '010-' || LPAD((1000 + v_tnum * 100 + (i / 10))::TEXT, 4, '0') || '-' || LPAD(i::TEXT, 4, '0'),
                v_dept_id, v_position, v_grade,
                make_date(v_hire_year, v_hire_month, LEAST(28, 1 + (i % 28))),
                CASE WHEN v_status = 'RESIGNED' THEN make_date(2025, 1 + (i % 12), 15) ELSE NULL END,
                v_status, v_emp_type,
                make_date(v_birth_year, v_birth_month, v_birth_day),
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            ) ON CONFLICT (tenant_id, employee_number) DO NOTHING;

            -- Create PRIMARY affiliation for each employee
            INSERT INTO hr_core.employee_affiliation (
                id, tenant_id, employee_id, department_id, department_name,
                position_code, position_name, is_primary, affiliation_type,
                start_date, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_dept_id, v_dept_name,
                v_position, v_position_name,
                true, 'PRIMARY',
                make_date(v_hire_year, v_hire_month, LEAST(28, 1 + (i % 28))),
                v_status != 'RESIGNED',
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            ) ON CONFLICT DO NOTHING;

            v_total_created := v_total_created + 1;
        END LOOP;

        RAISE NOTICE 'Tenant % (%) : % employees created (seq %-%), % leaf departments',
            v_tnum, v_prefix, (v_emp_count - v_start_seq + 1), v_start_seq, v_emp_count,
            array_length(v_dept_ids, 1);
    END LOOP;

    RAISE NOTICE 'Total bulk employees created: %', v_total_created;
END $$;


-- ============================================================================
-- February Birthday Overrides (for 한성전자 dashboard birthday widget)
-- ============================================================================
UPDATE hr_core.employee SET birth_date = '1985-02-05' WHERE id = 'e0000002-0000-0000-0000-000000000010'::UUID;
UPDATE hr_core.employee SET birth_date = '1990-02-10' WHERE id = 'e0000002-0000-0000-0000-000000000020'::UUID;
UPDATE hr_core.employee SET birth_date = '1988-02-15' WHERE id = 'e0000002-0000-0000-0000-000000000030'::UUID;
UPDATE hr_core.employee SET birth_date = '1992-02-18' WHERE id = 'e0000002-0000-0000-0000-000000000040'::UUID;
UPDATE hr_core.employee SET birth_date = '1995-02-22' WHERE id = 'e0000002-0000-0000-0000-000000000050'::UUID;
UPDATE hr_core.employee SET birth_date = '1987-02-08' WHERE id = 'e0000002-0000-0000-0000-000000000060'::UUID;
UPDATE hr_core.employee SET birth_date = '1991-02-27' WHERE id = 'e0000002-0000-0000-0000-000000000070'::UUID;


-- ============================================================================
-- Manager ID Assignment
-- ============================================================================
-- For each leaf department, assign the highest-grade employee as manager of lower ones
DO $$
DECLARE
    v_dept RECORD;
    v_manager_id UUID;
BEGIN
    FOR v_dept IN
        SELECT DISTINCT d.id, d.tenant_id
        FROM hr_core.department d
        JOIN hr_core.employee e ON e.department_id = d.id AND e.tenant_id = d.tenant_id
        WHERE e.status = 'ACTIVE'
    LOOP
        -- Find highest-grade active employee in this department
        SELECT e.id INTO v_manager_id
        FROM hr_core.employee e
        WHERE e.department_id = v_dept.id
          AND e.tenant_id = v_dept.tenant_id
          AND e.status = 'ACTIVE'
        ORDER BY e.job_title_code DESC, e.hire_date ASC
        LIMIT 1;

        IF v_manager_id IS NOT NULL THEN
            -- Set manager_id for all other employees in this department
            UPDATE hr_core.employee
            SET manager_id = v_manager_id
            WHERE department_id = v_dept.id
              AND tenant_id = v_dept.tenant_id
              AND id != v_manager_id
              AND manager_id IS NULL;
        END IF;
    END LOOP;

    RAISE NOTICE 'Manager IDs assigned for all departments';
END $$;


-- ============================================================================
-- PART 4: Employee Details
-- ============================================================================

-- ============================================================================
-- 4.1 Employee Education (for all employees)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_schools TEXT[] := ARRAY[
        '서울대학교','연세대학교','고려대학교','KAIST','포항공대',
        '성균관대학교','한양대학교','중앙대학교','경희대학교','이화여자대학교',
        '숙명여자대학교','서강대학교','부산대학교','경북대학교','전남대학교'];
    v_majors TEXT[] := ARRAY[
        '컴퓨터공학','전자공학','기계공학','화학공학','경영학',
        '경제학','산업공학','신소재공학','생명공학','화학',
        '물리학','수학','통계학','법학','회계학',
        '행정학','심리학','영어영문학','국어국문학','사회학'];
    v_school_types TEXT[] := ARRAY['UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY',
        'UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY',
        'UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY','UNIVERSITY'];
    v_degree TEXT;
    v_school_idx INT;
    v_major_idx INT;
    v_grad_year INT;
    v_seq INT := 0;
BEGIN
    RAISE NOTICE 'Generating employee education records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, job_title_code
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;
        v_grad_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT;

        -- Degree based on grade (job_title_code)
        -- G06+(부장 이상): MASTER or DOCTORATE, G03-G05: BACHELOR, G01-G02: BACHELOR or ASSOCIATE
        IF v_emp.job_title_code >= 'G06' THEN
            IF v_seq % 3 = 0 THEN v_degree := 'DOCTORATE';
            ELSE v_degree := 'MASTER';
            END IF;
        ELSIF v_emp.job_title_code >= 'G03' THEN
            v_degree := 'BACHELOR';
        ELSE
            IF v_seq % 5 = 0 THEN v_degree := 'ASSOCIATE';
            ELSE v_degree := 'BACHELOR';
            END IF;
        END IF;

        -- Deterministic school and major selection
        v_school_idx := 1 + (v_seq % array_length(v_schools, 1));
        v_major_idx := 1 + ((v_seq * 7) % array_length(v_majors, 1));

        INSERT INTO hr_core.employee_education (
            id, employee_id, tenant_id, school_name, school_type, degree, major,
            start_date, end_date, graduation_status, is_verified,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), v_emp.id, v_emp.tenant_id,
            v_schools[v_school_idx],
            'UNIVERSITY',
            v_degree,
            v_majors[v_major_idx],
            make_date(v_grad_year - CASE v_degree WHEN 'DOCTORATE' THEN 9 WHEN 'MASTER' THEN 6 WHEN 'BACHELOR' THEN 4 ELSE 2 END, 3, 2),
            make_date(v_grad_year, 2, 28),
            'GRADUATED',
            CASE WHEN v_seq % 4 = 0 THEN true ELSE false END,
            NOW(), NOW(), 'system', 'system'
        );

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Employee education records created: %', v_count;
END $$;


-- ============================================================================
-- 4.2 Employee Family (for ~60% of employees, 1-3 members each)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_family_count INT;
    v_relation TEXT;
    v_fam_name TEXT;
    v_seq INT := 0;
    v_surnames TEXT[] := ARRAY['김','이','박','최','정','강','조','윤','장','임'];
    v_given_m TEXT[] := ARRAY['민준','서준','도윤','시우','지호'];
    v_given_f TEXT[] := ARRAY['서연','하은','민서','지유','채원'];
BEGIN
    RAISE NOTICE 'Generating employee family records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, birth_date
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~60% of employees get family records
        IF v_seq % 5 IN (0, 1) THEN
            CONTINUE;  -- skip ~40%
        END IF;

        -- Number of family members: 1-3
        v_family_count := 1 + (v_seq % 3);

        FOR f IN 1..v_family_count LOOP
            CASE f
                WHEN 1 THEN
                    v_relation := 'SPOUSE';
                    v_fam_name := v_surnames[1 + (v_seq % array_length(v_surnames, 1))] ||
                                  v_given_f[1 + (v_seq % array_length(v_given_f, 1))];
                WHEN 2 THEN
                    IF v_seq % 2 = 0 THEN
                        v_relation := 'SON';
                        v_fam_name := v_surnames[1 + (v_seq % array_length(v_surnames, 1))] ||
                                      v_given_m[1 + ((v_seq + f) % array_length(v_given_m, 1))];
                    ELSE
                        v_relation := 'DAUGHTER';
                        v_fam_name := v_surnames[1 + (v_seq % array_length(v_surnames, 1))] ||
                                      v_given_f[1 + ((v_seq + f) % array_length(v_given_f, 1))];
                    END IF;
                WHEN 3 THEN
                    IF v_seq % 2 = 0 THEN
                        v_relation := 'FATHER';
                        v_fam_name := v_surnames[1 + (v_seq % array_length(v_surnames, 1))] || '부';
                    ELSE
                        v_relation := 'MOTHER';
                        v_fam_name := v_surnames[1 + ((v_seq + 3) % array_length(v_surnames, 1))] || '모';
                    END IF;
                ELSE
                    v_relation := 'SPOUSE';
                    v_fam_name := '가족';
            END CASE;

            INSERT INTO hr_core.employee_family (
                id, employee_id, tenant_id, relation, name, birth_date, phone,
                is_dependent, occupation, is_cohabiting, remarks,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                v_relation,
                v_fam_name,
                CASE v_relation
                    WHEN 'SPOUSE' THEN
                        COALESCE(v_emp.birth_date, make_date(1985,1,1)) + ((v_seq % 5) - 2) * INTERVAL '1 year'
                    WHEN 'SON' THEN
                        COALESCE(v_emp.hire_date, make_date(2015,1,1)) + (v_seq % 3) * INTERVAL '1 year'
                    WHEN 'DAUGHTER' THEN
                        COALESCE(v_emp.hire_date, make_date(2015,1,1)) + ((v_seq % 3) + 1) * INTERVAL '1 year'
                    WHEN 'FATHER' THEN
                        COALESCE(v_emp.birth_date, make_date(1985,1,1)) - INTERVAL '28 years' - (v_seq % 5) * INTERVAL '1 year'
                    WHEN 'MOTHER' THEN
                        COALESCE(v_emp.birth_date, make_date(1985,1,1)) - INTERVAL '25 years' - (v_seq % 5) * INTERVAL '1 year'
                    ELSE make_date(1990, 1, 1)
                END,
                '010-' || LPAD((2000 + v_seq + f)::TEXT, 4, '0') || '-' || LPAD((v_seq * 3 + f)::TEXT, 4, '0'),
                v_relation IN ('SPOUSE', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER'),
                CASE v_relation
                    WHEN 'SPOUSE' THEN CASE WHEN v_seq % 3 = 0 THEN '회사원' WHEN v_seq % 3 = 1 THEN '교사' ELSE '자영업' END
                    WHEN 'SON' THEN CASE WHEN v_seq % 2 = 0 THEN '학생' ELSE NULL END
                    WHEN 'DAUGHTER' THEN CASE WHEN v_seq % 2 = 0 THEN '학생' ELSE NULL END
                    WHEN 'FATHER' THEN '은퇴'
                    WHEN 'MOTHER' THEN '주부'
                    ELSE NULL
                END,
                v_relation NOT IN ('FATHER', 'MOTHER') OR (v_seq % 3 = 0),
                NULL,
                NOW(), NOW(), 'system', 'system'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Employee family records created: %', v_count;
END $$;


-- ============================================================================
-- 4.3 Employee Career (for ~30% of employees, 1-2 previous jobs)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_career_count INT;
    v_seq INT := 0;
    v_companies TEXT[] := ARRAY[
        '삼성전자','LG전자','SK하이닉스','현대자동차','네이버',
        '카카오','쿠팡','배달의민족','토스','라인'];
    v_departments TEXT[] := ARRAY[
        '개발팀','기획팀','영업팀','마케팅팀','인사팀',
        '재무팀','생산팀','품질팀','연구소','디자인팀'];
    v_positions TEXT[] := ARRAY['사원','주임','대리','과장','차장','부장'];
    v_start_year INT;
    v_end_year INT;
    v_comp_idx INT;
    v_dept_idx INT;
    v_pos_idx INT;
BEGIN
    RAISE NOTICE 'Generating employee career records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, job_title_code
        FROM hr_core.employee
        WHERE job_title_code >= 'G03'  -- 대리 이상만 경력 있을 가능성
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~30% of eligible employees
        IF v_seq % 10 NOT IN (0, 1, 2) THEN
            CONTINUE;
        END IF;

        v_career_count := 1 + (v_seq % 2);  -- 1 or 2 previous jobs
        v_end_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - 1;

        FOR c IN 1..v_career_count LOOP
            v_start_year := v_end_year - 1 - (v_seq % 4);
            v_comp_idx := 1 + ((v_seq + c) % array_length(v_companies, 1));
            v_dept_idx := 1 + ((v_seq * 3 + c) % array_length(v_departments, 1));
            v_pos_idx := LEAST(c, array_length(v_positions, 1));

            INSERT INTO hr_core.employee_career (
                id, employee_id, tenant_id, company_name, department, position,
                start_date, end_date, job_description, resignation_reason, is_verified,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                v_companies[v_comp_idx],
                v_departments[v_dept_idx],
                v_positions[v_pos_idx],
                make_date(v_start_year, 3, 2),
                make_date(v_end_year, LEAST(12, 1 + (v_seq % 12)), 28),
                v_departments[v_dept_idx] || ' 업무 수행',
                CASE WHEN v_seq % 3 = 0 THEN '이직' WHEN v_seq % 3 = 1 THEN '경력개발' ELSE '처우 개선' END,
                CASE WHEN v_seq % 3 = 0 THEN true ELSE false END,
                NOW(), NOW(), 'system', 'system'
            );

            v_end_year := v_start_year - 1;
            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Employee career records created: %', v_count;
END $$;


-- ============================================================================
-- 4.4 Employee Certificate/License (for ~35% of employees, 1-2 certs)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_cert_count INT;
    v_seq INT := 0;
    v_certs TEXT[] := ARRAY[
        '정보처리기사','SQLD','AWS Solutions Architect','PMP','TOEIC 900+',
        '한국사능력검정시험 1급','공인회계사','세무사','노무사','OPIC IH'];
    v_issuers TEXT[] := ARRAY[
        '한국산업인력공단','한국데이터산업진흥원','Amazon Web Services','PMI','ETS',
        '국사편찬위원회','금융감독원','국세청','고용노동부','ACTFL'];
    v_cert_idx INT;
    v_issue_year INT;
BEGIN
    RAISE NOTICE 'Generating employee certificate records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~35% of employees
        IF v_seq % 20 NOT IN (0, 1, 2, 3, 4, 5, 6) THEN
            CONTINUE;
        END IF;

        v_cert_count := 1 + (v_seq % 2);  -- 1 or 2 certs

        FOR c IN 1..v_cert_count LOOP
            v_cert_idx := 1 + ((v_seq + c * 3) % array_length(v_certs, 1));
            v_issue_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - (v_seq % 4);

            INSERT INTO hr_core.employee_certificate (
                id, employee_id, tenant_id,
                certificate_name, issuing_organization,
                issue_date, expiry_date, certificate_number,
                grade, is_verified,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                v_certs[v_cert_idx],
                v_issuers[v_cert_idx],
                make_date(GREATEST(2000, v_issue_year), 1 + (v_seq % 12), 1 + (v_seq % 28)),
                CASE WHEN v_cert_idx IN (3, 4) THEN  -- AWS, PMP expire
                    make_date(GREATEST(2000, v_issue_year) + 3, 12, 31)
                ELSE NULL END,
                'CERT-' || GREATEST(2000, v_issue_year) || '-' || LPAD(v_seq::TEXT, 6, '0'),
                CASE WHEN v_cert_idx = 5 THEN '900점' -- TOEIC
                     WHEN v_cert_idx = 6 THEN '1급'   -- 한국사
                     WHEN v_cert_idx = 10 THEN 'IH'   -- OPIC
                     ELSE NULL END,
                CASE WHEN v_seq % 3 = 0 THEN true ELSE false END,
                NOW(), NOW(), 'system', 'system'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Employee certificate records created: %', v_count;
END $$;


-- ============================================================================
-- 4.5 Employee History (for test accounts + ~10% of employees)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_seq INT := 0;
    v_change_types TEXT[] := ARRAY['HIRE','PROMOTION','TRANSFER','POSITION_CHANGE'];
    v_history_count INT;
    v_hire_year INT;
    v_change_year INT;
BEGIN
    RAISE NOTICE 'Generating employee history records...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, name, job_title_code, position_code, department_id
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        v_seq := v_seq + 1;
        v_hire_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT;

        -- Test accounts (first 6 for tenant 2) always get history; others ~10%
        IF v_emp.id IN (
            'e0000002-0000-0000-0000-000000000001',
            'e0000002-0000-0000-0000-000000000002',
            'e0000002-0000-0000-0000-000000000003',
            'e0000002-0000-0000-0000-000000000004',
            'e0000002-0000-0000-0000-000000000005',
            'e0000002-0000-0000-0000-000000000006'
        ) THEN
            v_history_count := 3 + (v_seq % 3);  -- 3-5 records for test accounts
        ELSIF v_seq % 10 = 0 THEN
            v_history_count := 2 + (v_seq % 2);  -- 2-3 records for ~10% of employees
        ELSE
            CONTINUE;
        END IF;

        -- Always start with HIRE
        INSERT INTO hr_core.employee_history (
            id, employee_id, tenant_id,
            change_type, field_name, old_value, new_value,
            changed_at, changed_by, change_reason,
            effective_date,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), v_emp.id, v_emp.tenant_id,
            'HIRE', 'status', NULL, 'ACTIVE',
            v_emp.hire_date + TIME '09:00:00', '00000000-0000-0000-0000-000000000000',
            '신규입사',
            v_emp.hire_date,
            NOW(), NOW(), 'system', 'system'
        );
        v_count := v_count + 1;

        -- Additional history records
        FOR h IN 2..v_history_count LOOP
            v_change_year := v_hire_year + h;
            IF v_change_year > 2025 THEN
                v_change_year := 2025;
            END IF;

            CASE (h % 3)
                WHEN 0 THEN  -- PROMOTION
                    INSERT INTO hr_core.employee_history (
                        id, employee_id, tenant_id,
                        change_type, field_name, old_value, new_value,
                        changed_at, changed_by, change_reason,
                        effective_date,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                        'PROMOTION', 'job_title_code',
                        'G' || LPAD(GREATEST(1, SUBSTR(v_emp.job_title_code, 2)::INT - h)::TEXT, 2, '0'),
                        v_emp.job_title_code,
                        make_date(v_change_year, 1, 2) + TIME '09:00:00',
                        '00000000-0000-0000-0000-000000000000',
                        '정기 승진',
                        make_date(v_change_year, 1, 1),
                        NOW(), NOW(), 'system', 'system'
                    );
                WHEN 1 THEN  -- TRANSFER
                    INSERT INTO hr_core.employee_history (
                        id, employee_id, tenant_id,
                        change_type, field_name, old_value, new_value,
                        changed_at, changed_by, change_reason,
                        effective_date,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                        'TRANSFER', 'department_id',
                        NULL, v_emp.department_id::TEXT,
                        make_date(v_change_year, 7, 1) + TIME '09:00:00',
                        '00000000-0000-0000-0000-000000000000',
                        '조직개편에 따른 부서 이동',
                        make_date(v_change_year, 7, 1),
                        NOW(), NOW(), 'system', 'system'
                    );
                WHEN 2 THEN  -- POSITION_CHANGE
                    INSERT INTO hr_core.employee_history (
                        id, employee_id, tenant_id,
                        change_type, field_name, old_value, new_value,
                        changed_at, changed_by, change_reason,
                        effective_date,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        gen_random_uuid(), v_emp.id, v_emp.tenant_id,
                        'POSITION_CHANGE', 'position_code',
                        'P' || LPAD(GREATEST(1, SUBSTR(v_emp.position_code, 2)::INT - 1)::TEXT, 2, '0'),
                        v_emp.position_code,
                        make_date(v_change_year, 4, 1) + TIME '09:00:00',
                        '00000000-0000-0000-0000-000000000000',
                        '직책 변경',
                        make_date(v_change_year, 4, 1),
                        NOW(), NOW(), 'system', 'system'
                    );
                ELSE NULL;
            END CASE;

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Employee history records created: %', v_count;
END $$;


-- ============================================================================
-- 4.6 Employee Change Request (5 for 한성전자 test accounts)
-- ============================================================================
BEGIN;

INSERT INTO hr_core.employee_change_request (
    id, tenant_id, employee_id, field_name, old_value, new_value,
    status, reason,
    created_at, updated_at, created_by, updated_by
) VALUES
    -- PENDING: 조사원 wants to update mobile
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000006',
     'mobile', '010-1000-0006', '010-9876-5432',
     'PENDING', '휴대폰 번호 변경',
     NOW(), NOW(), 'e0000002-0000-0000-0000-000000000006', 'e0000002-0000-0000-0000-000000000006'),
    -- PENDING: 강선임 wants to update email
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000005',
     'email', 'dev.senior@hansung-elec.co.kr', 'kang.seonim@hansung-elec.co.kr',
     'PENDING', '이메일 주소 변경 요청',
     NOW(), NOW(), 'e0000002-0000-0000-0000-000000000005', 'e0000002-0000-0000-0000-000000000005'),
    -- APPROVED: 정개발 updated mobile
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000004',
     'mobile', '010-1000-0004', '010-1111-2222',
     'APPROVED', '번호 변경 완료',
     NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days',
     'e0000002-0000-0000-0000-000000000004', 'e0000002-0000-0000-0000-000000000002'),
    -- APPROVED: 박인사 updated email
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000003',
     'email', 'hr.staff@hansung-elec.co.kr', 'hr.manager@hansung-elec.co.kr',
     'APPROVED', '직무 변경에 따른 이메일 변경',
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days',
     'e0000002-0000-0000-0000-000000000003', 'e0000002-0000-0000-0000-000000000002'),
    -- REJECTED: 조사원 address change rejected
    (gen_random_uuid(),
     'a0000001-0000-0000-0000-000000000002',
     'e0000002-0000-0000-0000-000000000006',
     'mobile', '010-1000-0006', '010-0000-0000',
     'REJECTED', '잘못된 번호 형식',
     NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days',
     'e0000002-0000-0000-0000-000000000006', 'e0000002-0000-0000-0000-000000000002');

COMMIT;


-- ============================================================================
-- 4.7 Privacy Access Log (30 records for 한성전자)
-- ============================================================================
BEGIN;

DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_hr_admin_id UUID := 'e0000002-0000-0000-0000-000000000002'; -- 김인사
    v_hr_manager_id UUID := 'e0000002-0000-0000-0000-000000000003'; -- 박인사
    v_target_ids UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000004',
        'e0000002-0000-0000-0000-000000000005',
        'e0000002-0000-0000-0000-000000000006',
        'e0000002-0000-0000-0000-000000000010',
        'e0000002-0000-0000-0000-000000000020',
        'e0000002-0000-0000-0000-000000000030',
        'e0000002-0000-0000-0000-000000000040',
        'e0000002-0000-0000-0000-000000000050',
        'e0000002-0000-0000-0000-000000000060',
        'e0000002-0000-0000-0000-000000000070'
    ];
    v_fields TEXT[] := ARRAY['resident_number', 'mobile', 'address'];
    v_reasons TEXT[] := ARRAY[
        '인사서류 확인',
        '증명서 발급을 위한 조회',
        '연말정산 처리',
        '급여 계산 확인',
        '인사발령 업무 처리'
    ];
    v_ips TEXT[] := ARRAY['192.168.1.10', '192.168.1.11', '10.0.0.50', '10.0.0.51', '172.16.0.100'];
    v_actor_id UUID;
    v_target_id UUID;
BEGIN
    FOR i IN 1..30 LOOP
        -- Alternate between HR admin and HR manager as actors
        IF i % 2 = 0 THEN
            v_actor_id := v_hr_admin_id;
        ELSE
            v_actor_id := v_hr_manager_id;
        END IF;

        v_target_id := v_target_ids[1 + ((i - 1) % array_length(v_target_ids, 1))];

        INSERT INTO hr_core.privacy_access_log (
            id, tenant_id, actor_id, actor_name, employee_id,
            field_name, reason, accessed_at, ip_address, created_at
        ) VALUES (
            gen_random_uuid(),
            v_tenant_id,
            v_actor_id,
            CASE WHEN v_actor_id = v_hr_admin_id THEN '김인사' ELSE '박인사' END,
            v_target_id,
            v_fields[1 + ((i - 1) % array_length(v_fields, 1))],
            v_reasons[1 + ((i - 1) % array_length(v_reasons, 1))],
            NOW() - ((i * 2) || ' hours')::INTERVAL,
            v_ips[1 + ((i - 1) % array_length(v_ips, 1))],
            NOW() - ((i * 2) || ' hours')::INTERVAL
        );
    END LOOP;

    RAISE NOTICE 'Privacy access log records created: 30';
END $$;

COMMIT;


-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
    v_record RECORD;
    v_total INT := 0;
    v_number_rules INT;
    v_affiliations INT;
    v_education INT;
    v_family INT;
    v_career INT;
    v_certificates INT;
    v_history INT;
    v_change_req INT;
    v_privacy_log INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '05_employees.sql Verification';
    RAISE NOTICE '========================================';

    -- Employee counts per tenant
    FOR v_record IN
        SELECT t.name AS tenant_name, COUNT(e.id) AS emp_count
        FROM tenant_common.tenant t
        LEFT JOIN hr_core.employee e ON t.id = e.tenant_id
        WHERE t.code LIKE 'HANSUNG_%'
        GROUP BY t.name, t.id
        ORDER BY emp_count DESC
    LOOP
        RAISE NOTICE '  %-20s: % employees', v_record.tenant_name, v_record.emp_count;
        v_total := v_total + v_record.emp_count;
    END LOOP;

    RAISE NOTICE '  ----------------------------------------';
    RAISE NOTICE '  Total employees     : %', v_total;
    RAISE NOTICE '';

    -- Detail table counts
    SELECT COUNT(*) INTO v_number_rules  FROM hr_core.employee_number_rule;
    SELECT COUNT(*) INTO v_affiliations  FROM hr_core.employee_affiliation;
    SELECT COUNT(*) INTO v_education     FROM hr_core.employee_education;
    SELECT COUNT(*) INTO v_family        FROM hr_core.employee_family;
    SELECT COUNT(*) INTO v_career        FROM hr_core.employee_career;
    SELECT COUNT(*) INTO v_certificates  FROM hr_core.employee_certificate;
    SELECT COUNT(*) INTO v_history       FROM hr_core.employee_history;
    SELECT COUNT(*) INTO v_change_req    FROM hr_core.employee_change_request;
    SELECT COUNT(*) INTO v_privacy_log   FROM hr_core.privacy_access_log;

    RAISE NOTICE '  Number rules        : % (expected: 8)', v_number_rules;
    RAISE NOTICE '  Affiliations        : % (expected: ~570)', v_affiliations;
    RAISE NOTICE '  Education records   : % (expected: ~570)', v_education;
    RAISE NOTICE '  Family records      : % (expected: ~600-1000)', v_family;
    RAISE NOTICE '  Career records      : % (expected: ~70-150)', v_career;
    RAISE NOTICE '  Certificate records : % (expected: ~150-300)', v_certificates;
    RAISE NOTICE '  History records     : % (expected: ~100-200)', v_history;
    RAISE NOTICE '  Change requests     : % (expected: 5)', v_change_req;
    RAISE NOTICE '  Privacy access logs : % (expected: 30)', v_privacy_log;
    RAISE NOTICE '========================================';

    -- Verify test accounts
    RAISE NOTICE '';
    RAISE NOTICE '  Test Account Verification (한성전자):';
    FOR v_record IN
        SELECT employee_number, name, email, position_code, job_title_code, status
        FROM hr_core.employee
        WHERE id IN (
            'e0000002-0000-0000-0000-000000000001',
            'e0000002-0000-0000-0000-000000000002',
            'e0000002-0000-0000-0000-000000000003',
            'e0000002-0000-0000-0000-000000000004',
            'e0000002-0000-0000-0000-000000000005',
            'e0000002-0000-0000-0000-000000000006'
        )
        ORDER BY employee_number
    LOOP
        RAISE NOTICE '    % | % | % | %/%', v_record.employee_number, v_record.name, v_record.email, v_record.position_code, v_record.job_title_code;
    END LOOP;

    -- Verify February birthdays
    RAISE NOTICE '';
    RAISE NOTICE '  February Birthday Employees (한성전자):';
    FOR v_record IN
        SELECT employee_number, name, birth_date
        FROM hr_core.employee
        WHERE tenant_id = 'a0000001-0000-0000-0000-000000000002'
          AND EXTRACT(MONTH FROM birth_date) = 2
        ORDER BY birth_date
    LOOP
        RAISE NOTICE '    % | % | %', v_record.employee_number, v_record.name, v_record.birth_date;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '05_employees.sql completed successfully!';
    RAISE NOTICE '========================================';
END $$;
