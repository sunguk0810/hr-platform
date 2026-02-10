-- ============================================================================
-- 07_employee_generator.sql
-- 직원 대량 생성을 위한 함수 및 데이터 정의
-- ============================================================================

-- ============================================================================
-- 한국 이름 데이터 테이블 (임시)
-- ============================================================================

-- 성씨 테이블 (통계 기반 분포)
CREATE TEMP TABLE IF NOT EXISTS korean_surnames (
    surname VARCHAR(2),
    surname_en VARCHAR(10),
    frequency INT  -- 인구 비율 (만분율)
);

INSERT INTO korean_surnames VALUES
    ('김', 'Kim', 2150), ('이', 'Lee', 1470), ('박', 'Park', 840), ('최', 'Choi', 470),
    ('정', 'Jung', 440), ('강', 'Kang', 250), ('조', 'Cho', 210), ('윤', 'Yoon', 200),
    ('장', 'Jang', 190), ('임', 'Lim', 170), ('한', 'Han', 150), ('오', 'Oh', 140),
    ('서', 'Seo', 130), ('신', 'Shin', 120), ('권', 'Kwon', 110), ('황', 'Hwang', 100),
    ('안', 'Ahn', 95), ('송', 'Song', 90), ('류', 'Ryu', 85), ('전', 'Jeon', 80),
    ('홍', 'Hong', 75), ('고', 'Ko', 70), ('문', 'Moon', 68), ('양', 'Yang', 66),
    ('손', 'Son', 65), ('배', 'Bae', 60), ('조', 'Jo', 58), ('백', 'Baek', 55),
    ('허', 'Heo', 52), ('유', 'Yoo', 50), ('남', 'Nam', 48), ('심', 'Shim', 45),
    ('노', 'Noh', 42), ('하', 'Ha', 40), ('곽', 'Kwak', 38), ('성', 'Sung', 35),
    ('차', 'Cha', 33), ('주', 'Joo', 30), ('우', 'Woo', 28), ('구', 'Koo', 26),
    ('민', 'Min', 24), ('진', 'Jin', 22), ('지', 'Ji', 20), ('엄', 'Eom', 18),
    ('채', 'Chae', 16), ('원', 'Won', 14), ('방', 'Bang', 12), ('천', 'Cheon', 10),
    ('공', 'Kong', 8), ('여', 'Yeo', 6);

-- 남자 이름 테이블
CREATE TEMP TABLE IF NOT EXISTS korean_male_names (
    name VARCHAR(4),
    name_en VARCHAR(15)
);

INSERT INTO korean_male_names VALUES
    ('민준', 'Minjun'), ('서준', 'Seojun'), ('예준', 'Yejun'), ('도윤', 'Doyun'),
    ('시우', 'Siwoo'), ('주원', 'Juwon'), ('하준', 'Hajun'), ('지호', 'Jiho'),
    ('준서', 'Junseo'), ('준우', 'Junwoo'), ('현우', 'Hyunwoo'), ('도현', 'Dohyun'),
    ('지훈', 'Jihoon'), ('건우', 'Gunwoo'), ('우진', 'Woojin'), ('민재', 'Minjae'),
    ('현준', 'Hyunjun'), ('선우', 'Sunwoo'), ('서진', 'Seojin'), ('연우', 'Yeonwoo'),
    ('유준', 'Yujun'), ('정우', 'Jungwoo'), ('승현', 'Seunghyun'), ('준혁', 'Junhyuk'),
    ('민성', 'Minsung'), ('지원', 'Jiwon'), ('재원', 'Jaewon'), ('승민', 'Seungmin'),
    ('성민', 'Sungmin'), ('재민', 'Jaemin'), ('동현', 'Donghyun'), ('은우', 'Eunwoo'),
    ('태현', 'Taehyun'), ('재현', 'Jaehyun'), ('지안', 'Jian'), ('시현', 'Sihyun'),
    ('승우', 'Seungwoo'), ('윤우', 'Yunwoo'), ('지성', 'Jisung'), ('한결', 'Hangyul'),
    ('민규', 'Mingyu'), ('성준', 'Sungjun'), ('재윤', 'Jaeyun'), ('준영', 'Junyoung'),
    ('지환', 'Jihwan'), ('태민', 'Taemin'), ('성현', 'Sunghyun'), ('우성', 'Woosung'),
    ('영민', 'Youngmin'), ('정민', 'Jungmin'), ('대호', 'Daeho'), ('광수', 'Kwangsu'),
    ('상현', 'Sanghyun'), ('용준', 'Yongjun'), ('철수', 'Chulsoo'), ('영호', 'Youngho'),
    ('성호', 'Sungho'), ('재호', 'Jaeho'), ('민호', 'Minho'), ('준호', 'Junho'),
    ('정호', 'Jungho'), ('동욱', 'Dongwook'), ('상민', 'Sangmin'), ('형준', 'Hyungjun'),
    ('기현', 'Kihyun'), ('진우', 'Jinwoo'), ('태영', 'Taeyoung'), ('수호', 'Suho'),
    ('건', 'Gun'), ('민', 'Min'), ('훈', 'Hoon'), ('혁', 'Hyuk'),
    ('찬', 'Chan'), ('빈', 'Bin'), ('진', 'Jin'), ('호', 'Ho'),
    ('성재', 'Sungjae'), ('현석', 'Hyunsuk'), ('지웅', 'Jiwoong'), ('도훈', 'Dohoon'),
    ('우현', 'Woohyun'), ('기범', 'Kibum'), ('주혁', 'Juhyuk'), ('세준', 'Sejun'),
    ('영준', 'Youngjun'), ('원준', 'Wonjun'), ('시훈', 'Sihoon'), ('재훈', 'Jaehoon'),
    ('현진', 'Hyunjin'), ('태준', 'Taejun'), ('종현', 'Jonghyun'), ('우빈', 'Woobin'),
    ('세훈', 'Sehun'), ('동훈', 'Donghoon'), ('상호', 'Sangho'), ('창민', 'Changmin'),
    ('동민', 'Dongmin'), ('기훈', 'Kihoon'), ('정훈', 'Junghoon'), ('승호', 'Seungho');

-- 여자 이름 테이블
CREATE TEMP TABLE IF NOT EXISTS korean_female_names (
    name VARCHAR(4),
    name_en VARCHAR(15)
);

INSERT INTO korean_female_names VALUES
    ('서연', 'Seoyeon'), ('서윤', 'Seoyun'), ('지우', 'Jiwoo'), ('서현', 'Seohyun'),
    ('민서', 'Minseo'), ('하윤', 'Hayun'), ('하은', 'Haeun'), ('지유', 'Jiyu'),
    ('채원', 'Chaewon'), ('지민', 'Jimin'), ('수아', 'Sua'), ('지아', 'Jia'),
    ('지윤', 'Jiyun'), ('다은', 'Daeun'), ('은서', 'Eunseo'), ('예은', 'Yeeun'),
    ('수빈', 'Subin'), ('소율', 'Soyul'), ('예린', 'Yerin'), ('아린', 'Arin'),
    ('하린', 'Harin'), ('유진', 'Yujin'), ('소민', 'Somin'), ('예나', 'Yena'),
    ('지현', 'Jihyun'), ('수민', 'Sumin'), ('채은', 'Chaeeun'), ('윤아', 'Yoona'),
    ('나윤', 'Nayun'), ('민지', 'Minji'), ('소연', 'Soyeon'), ('유나', 'Yuna'),
    ('은지', 'Eunji'), ('현지', 'Hyunji'), ('민정', 'Minjeong'), ('수연', 'Sooyeon'),
    ('지영', 'Jiyoung'), ('혜진', 'Hyejin'), ('예지', 'Yeji'), ('미영', 'Miyoung'),
    ('정은', 'Jungeun'), ('혜원', 'Hyewon'), ('다인', 'Dain'), ('시은', 'Sieun'),
    ('하영', 'Hayoung'), ('세은', 'Seeun'), ('민아', 'Mina'), ('예원', 'Yewon'),
    ('주하', 'Juha'), ('시연', 'Siyeon'), ('윤서', 'Yunseo'), ('소영', 'Soyoung'),
    ('정아', 'Junga'), ('은비', 'Eunbi'), ('세아', 'Sea'), ('다연', 'Dayeon'),
    ('시아', 'Sia'), ('연지', 'Yeonji'), ('수현', 'Suhyun'), ('지은', 'Jieun'),
    ('은영', 'Eunyoung'), ('미진', 'Mijin'), ('선영', 'Sunyoung'), ('현정', 'Hyunjeong'),
    ('영희', 'Younghee'), ('순자', 'Sunja'), ('정숙', 'Jungsook'), ('영자', 'Youngja'),
    ('옥순', 'Oksoon'), ('미숙', 'Misook'), ('경희', 'Kyunghee'), ('정희', 'Junghee'),
    ('성희', 'Sunghee'), ('영순', 'Youngsoon'), ('은주', 'Eunju'), ('미란', 'Miran'),
    ('혜정', 'Hyejeong'), ('보라', 'Bora'), ('유정', 'Yujeong'), ('세영', 'Seyoung'),
    ('진아', 'Jina'), ('하나', 'Hana'), ('서영', 'Seoyoung'), ('성은', 'Sungeun'),
    ('수정', 'Sujeong'), ('혜림', 'Hyerim'), ('연서', 'Yeonseo'), ('정윤', 'Jungyun'),
    ('은채', 'Eunchae'), ('채린', 'Chaerin'), ('아영', 'Ayoung'), ('나영', 'Nayoung'),
    ('희진', 'Heejin'), ('지혜', 'Jihye'), ('은하', 'Eunha'), ('다희', 'Dahee');

-- ============================================================================
-- 테넌트별 직원 수 설정 테이블
-- ============================================================================
CREATE TEMP TABLE IF NOT EXISTS tenant_employee_config (
    tenant_code VARCHAR(20),
    target_count INT,
    emp_code_prefix VARCHAR(3),
    email_domain VARCHAR(50)
);

INSERT INTO tenant_employee_config VALUES
    ('HANSUNG_HD', 500, 'HHD', 'hansung-hd.co.kr'),
    ('HANSUNG_ELEC', 25000, 'HEL', 'hansung-elec.co.kr'),
    ('HANSUNG_SDI', 12000, 'HSI', 'hansung-sdi.co.kr'),
    ('HANSUNG_ENG', 8000, 'HEN', 'hansung-eng.co.kr'),
    ('HANSUNG_BIO', 5000, 'HBI', 'hansung-bio.co.kr'),
    ('HANSUNG_CHEM', 7000, 'HCH', 'hansung-chem.co.kr'),
    ('HANSUNG_IT', 4500, 'HIT', 'hansung-it.co.kr'),
    ('HANSUNG_LIFE', 13000, 'HLF', 'hansung-life.co.kr');

-- ============================================================================
-- 직원 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_employees(
    p_tenant_id UUID,
    p_tenant_code VARCHAR,
    p_emp_prefix VARCHAR,
    p_email_domain VARCHAR,
    p_target_count INT
) RETURNS INT AS $$
DECLARE
    v_count INT := 0;
    v_surname VARCHAR(2);
    v_surname_en VARCHAR(10);
    v_name VARCHAR(4);
    v_name_en VARCHAR(15);
    v_full_name VARCHAR(10);
    v_full_name_en VARCHAR(30);
    v_gender VARCHAR(10);
    v_employee_number VARCHAR(20);
    v_email VARCHAR(100);
    v_hire_year INT;
    v_hire_date DATE;
    v_grade_code VARCHAR(5);
    v_position_code VARCHAR(5);
    v_department_id UUID;
    v_dept_record RECORD;
    v_name_counter INT := 100;  -- 100부터 시작 (테스트 계정 번호 충돌 방지)
    v_employment_type VARCHAR(20);
    v_batch_size INT := 1000;
    v_batch_count INT := 0;
BEGIN
    -- 부서 목록 조회 (루트 제외)
    FOR v_dept_record IN
        SELECT id, level
        FROM hr_core.department
        WHERE tenant_id = p_tenant_id
        AND level >= 3  -- 팀 레벨 이상
        ORDER BY RANDOM()
    LOOP
        -- 부서당 직원 수 결정 (레벨에 따라)
        FOR i IN 1..LEAST(50, GREATEST(5, 100 - v_dept_record.level * 20)) LOOP
            EXIT WHEN v_count >= p_target_count;

            -- 성별 랜덤 (남:여 = 6:4)
            v_gender := CASE WHEN RANDOM() < 0.6 THEN 'MALE' ELSE 'FEMALE' END;

            -- 성씨 랜덤 선택 (가중치 적용)
            SELECT surname, surname_en INTO v_surname, v_surname_en
            FROM korean_surnames
            ORDER BY RANDOM() * frequency DESC
            LIMIT 1;

            -- 이름 랜덤 선택
            IF v_gender = 'MALE' THEN
                SELECT name, name_en INTO v_name, v_name_en
                FROM korean_male_names
                ORDER BY RANDOM()
                LIMIT 1;
            ELSE
                SELECT name, name_en INTO v_name, v_name_en
                FROM korean_female_names
                ORDER BY RANDOM()
                LIMIT 1;
            END IF;

            v_full_name := v_surname || v_name;
            v_full_name_en := v_name_en || ' ' || v_surname_en;

            -- 입사년도 분포 (근속연수 기반)
            v_hire_year := CASE
                WHEN RANDOM() < 0.20 THEN 2024 + FLOOR(RANDOM() * 2)::INT  -- 0-2년: 20%
                WHEN RANDOM() < 0.45 THEN 2021 + FLOOR(RANDOM() * 3)::INT  -- 2-5년: 25%
                WHEN RANDOM() < 0.70 THEN 2016 + FLOOR(RANDOM() * 5)::INT  -- 5-10년: 25%
                WHEN RANDOM() < 0.90 THEN 2006 + FLOOR(RANDOM() * 10)::INT -- 10-20년: 20%
                ELSE 1995 + FLOOR(RANDOM() * 11)::INT                       -- 20년+: 10%
            END;

            v_hire_date := make_date(v_hire_year, 1 + FLOOR(RANDOM() * 12)::INT, 1 + FLOOR(RANDOM() * 28)::INT);

            -- 사원번호 생성: {PREFIX}{년도2자리}{순번5자리}
            v_employee_number := p_emp_prefix || RIGHT(v_hire_year::TEXT, 2) || LPAD(v_name_counter::TEXT, 5, '0');
            v_name_counter := v_name_counter + 1;

            -- 이메일 생성
            v_email := LOWER(v_name_en) || '.' || LOWER(v_surname_en) || LPAD(v_count::TEXT, 3, '0') || '@' || p_email_domain;

            -- 직급 분포 (근속연수 기반)
            v_grade_code := CASE
                WHEN v_hire_year >= 2024 THEN 'G01'  -- 사원
                WHEN v_hire_year >= 2022 THEN CASE WHEN RANDOM() < 0.7 THEN 'G01' ELSE 'G02' END
                WHEN v_hire_year >= 2019 THEN CASE WHEN RANDOM() < 0.5 THEN 'G02' ELSE 'G03' END
                WHEN v_hire_year >= 2015 THEN CASE WHEN RANDOM() < 0.6 THEN 'G03' ELSE 'G04' END
                WHEN v_hire_year >= 2010 THEN CASE WHEN RANDOM() < 0.5 THEN 'G04' ELSE 'G05' END
                WHEN v_hire_year >= 2005 THEN CASE WHEN RANDOM() < 0.6 THEN 'G05' ELSE 'G06' END
                WHEN v_hire_year >= 2000 THEN CASE WHEN RANDOM() < 0.7 THEN 'G06' WHEN RANDOM() < 0.9 THEN 'G07' ELSE 'G08' END
                ELSE CASE WHEN RANDOM() < 0.5 THEN 'G07' WHEN RANDOM() < 0.8 THEN 'G08' WHEN RANDOM() < 0.95 THEN 'G09' ELSE 'G10' END
            END;

            -- 직책 (직급에 따라)
            v_position_code := CASE
                WHEN v_grade_code = 'G01' THEN 'P01'
                WHEN v_grade_code = 'G02' THEN CASE WHEN RANDOM() < 0.8 THEN 'P01' ELSE 'P02' END
                WHEN v_grade_code = 'G03' THEN CASE WHEN RANDOM() < 0.7 THEN 'P02' ELSE 'P03' END
                WHEN v_grade_code = 'G04' THEN CASE WHEN RANDOM() < 0.6 THEN 'P03' ELSE 'P04' END
                WHEN v_grade_code = 'G05' THEN CASE WHEN RANDOM() < 0.5 THEN 'P04' WHEN RANDOM() < 0.8 THEN 'P05' ELSE 'P06' END
                WHEN v_grade_code = 'G06' THEN CASE WHEN RANDOM() < 0.7 THEN 'P06' ELSE 'P07' END
                WHEN v_grade_code IN ('G07', 'G08') THEN CASE WHEN RANDOM() < 0.6 THEN 'P07' ELSE 'P08' END
                WHEN v_grade_code IN ('G09', 'G10') THEN 'P08'
                WHEN v_grade_code = 'G11' THEN 'P09'
                ELSE 'P01'
            END;

            -- 고용유형
            v_employment_type := CASE
                WHEN RANDOM() < 0.88 THEN 'REGULAR'
                WHEN RANDOM() < 0.95 THEN 'CONTRACT'
                ELSE 'INTERN'
            END;

            -- 직원 삽입
            INSERT INTO hr_core.employee (
                id, tenant_id, employee_number, name, name_en, email,
                phone, mobile, department_id, position_code, job_title_code,
                hire_date, status, employment_type,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                p_tenant_id,
                v_employee_number,
                v_full_name,
                v_full_name_en,
                v_email,
                '02-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0') || '-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0'),
                '010-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0') || '-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0'),
                v_dept_record.id,
                v_position_code,
                v_grade_code,
                v_hire_date,
                'ACTIVE',
                v_employment_type,
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;
            v_batch_count := v_batch_count + 1;

            -- 배치 로깅
            IF v_batch_count >= v_batch_size THEN
                RAISE NOTICE '[%] Generated % employees...', p_tenant_code, v_count;
                v_batch_count := 0;
            END IF;
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 테스트 계정 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION create_test_account(
    p_tenant_id UUID,
    p_username VARCHAR,
    p_name VARCHAR,
    p_name_en VARCHAR,
    p_emp_number VARCHAR,
    p_email VARCHAR,
    p_department_code VARCHAR,
    p_grade_code VARCHAR,
    p_position_code VARCHAR,
    p_role VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_dept_id UUID;
    v_emp_id UUID;
BEGIN
    -- 부서 조회
    SELECT id INTO v_dept_id
    FROM hr_core.department
    WHERE tenant_id = p_tenant_id AND code = p_department_code;

    -- 직원 생성
    INSERT INTO hr_core.employee (
        id, tenant_id, employee_number, name, name_en, email,
        phone, mobile, department_id, position_code, job_title_code,
        hire_date, status, employment_type, user_id,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(),
        p_tenant_id,
        p_emp_number,
        p_name,
        p_name_en,
        p_email,
        '02-2000-0001',
        '010-1234-5678',
        v_dept_id,
        p_position_code,
        p_grade_code,
        '2020-01-02',
        'ACTIVE',
        'REGULAR',
        gen_random_uuid(), -- Keycloak에서 연동될 user_id
        NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
    ) RETURNING id INTO v_emp_id;

    RETURN v_emp_id;
END;
$$ LANGUAGE plpgsql;

-- 함수 생성 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '직원 생성 함수 준비 완료!';
    RAISE NOTICE '  - generate_employees(): 테넌트별 직원 대량 생성';
    RAISE NOTICE '  - create_test_account(): 테스트 계정 생성';
END $$;
