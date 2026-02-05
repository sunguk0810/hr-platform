-- ============================================================================
-- 09_employee_details_generator.sql
-- 직원 상세 정보 대량 생성 (가족, 학력, 경력, 자격증)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 직원 가족 정보 (employee_family)
-- 약 50%의 직원에게 가족 정보 추가
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_family_count INT;
    v_relation VARCHAR(20);
BEGIN
    RAISE NOTICE '직원 가족 정보 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, name, hire_date
        FROM hr_core.employee
        WHERE RANDOM() < 0.5  -- 50%
        ORDER BY tenant_id, id
    LOOP
        -- 1~4명의 가족 추가
        v_family_count := 1 + FLOOR(RANDOM() * 4)::INT;

        FOR i IN 1..v_family_count LOOP
            v_relation := CASE i
                WHEN 1 THEN 'SPOUSE'
                WHEN 2 THEN 'CHILD'
                WHEN 3 THEN CASE WHEN RANDOM() < 0.5 THEN 'CHILD' ELSE 'FATHER' END
                ELSE CASE WHEN RANDOM() < 0.5 THEN 'MOTHER' ELSE 'SIBLING' END
            END;

            INSERT INTO hr_core.employee_family (
                tenant_id, employee_id, relation_type, name, birth_date, phone, is_dependent
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_relation,
                CASE v_relation
                    WHEN 'SPOUSE' THEN '배우자'
                    WHEN 'CHILD' THEN '자녀' || i::TEXT
                    WHEN 'FATHER' THEN '부'
                    WHEN 'MOTHER' THEN '모'
                    ELSE '형제자매'
                END,
                CASE
                    WHEN v_relation = 'SPOUSE' THEN (v_emp.hire_date - INTERVAL '5 years' - (RANDOM() * 3650 || ' days')::INTERVAL)::DATE
                    WHEN v_relation = 'CHILD' THEN (v_emp.hire_date + (RANDOM() * 3650 || ' days')::INTERVAL)::DATE
                    WHEN v_relation IN ('FATHER', 'MOTHER') THEN (v_emp.hire_date - INTERVAL '25 years' - (RANDOM() * 7300 || ' days')::INTERVAL)::DATE
                    ELSE (v_emp.hire_date - INTERVAL '5 years' + (RANDOM() * 3650 || ' days')::INTERVAL)::DATE
                END,
                '010-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0') || '-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0'),
                v_relation IN ('SPOUSE', 'CHILD', 'FATHER', 'MOTHER')
            );
        END LOOP;

        v_count := v_count + v_family_count;

        IF v_count % 10000 = 0 THEN
            RAISE NOTICE '  가족 정보 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '가족 정보 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 2. 직원 학력 정보 (employee_education)
-- 모든 직원에게 최소 1개의 학력 정보 추가
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_edu_count INT;
    v_schools TEXT[] := ARRAY[
        '서울대학교', '연세대학교', '고려대학교', '성균관대학교', '한양대학교',
        '중앙대학교', '경희대학교', '서강대학교', '이화여자대학교', '숙명여자대학교',
        '한국외국어대학교', '건국대학교', '동국대학교', 'KAIST', 'POSTECH',
        '부산대학교', '경북대학교', '전남대학교', '충남대학교', '인하대학교',
        '아주대학교', '단국대학교', '홍익대학교', '국민대학교', '세종대학교'
    ];
    v_majors TEXT[] := ARRAY[
        '컴퓨터공학', '전자공학', '기계공학', '화학공학', '경영학',
        '경제학', '법학', '회계학', '산업공학', '신소재공학',
        '생명공학', '화학', '물리학', '수학', '통계학',
        '행정학', '심리학', '영어영문학', '국어국문학', '사회학'
    ];
    v_school TEXT;
    v_major TEXT;
    v_degree_type VARCHAR(20);
    v_grad_year INT;
BEGIN
    RAISE NOTICE '직원 학력 정보 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, job_title_code
        FROM hr_core.employee
        ORDER BY tenant_id, id
    LOOP
        -- 학력 수 (1~3개, 직급에 따라)
        v_edu_count := CASE
            WHEN v_emp.job_title_code >= 'G07' THEN 2 + FLOOR(RANDOM() * 2)::INT  -- 이사 이상: 2-3
            WHEN v_emp.job_title_code >= 'G05' THEN 1 + FLOOR(RANDOM() * 2)::INT  -- 차장 이상: 1-2
            ELSE 1
        END;

        v_grad_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - 1;

        FOR i IN REVERSE v_edu_count..1 LOOP
            v_school := v_schools[1 + FLOOR(RANDOM() * array_length(v_schools, 1))::INT];
            v_major := v_majors[1 + FLOOR(RANDOM() * array_length(v_majors, 1))::INT];

            v_degree_type := CASE i
                WHEN 1 THEN 'BACHELOR'
                WHEN 2 THEN CASE WHEN RANDOM() < 0.8 THEN 'MASTER' ELSE 'DOCTORATE' END
                ELSE 'DOCTORATE'
            END;

            INSERT INTO hr_core.employee_education (
                tenant_id, employee_id, school_name, degree_type, major,
                admission_date, graduation_date, graduation_status
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_school,
                v_degree_type,
                v_major,
                make_date(v_grad_year - 4, 3, 2),
                make_date(v_grad_year, 2, 28),
                'GRADUATED'
            );

            v_grad_year := v_grad_year - CASE v_degree_type WHEN 'BACHELOR' THEN 4 WHEN 'MASTER' THEN 2 ELSE 4 END;
            v_count := v_count + 1;
        END LOOP;

        IF v_count % 10000 = 0 THEN
            RAISE NOTICE '  학력 정보 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '학력 정보 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 3. 직원 경력 정보 (employee_career)
-- 경력직 직원에게 이전 경력 추가 (약 30%)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_career_count INT;
    v_companies TEXT[] := ARRAY[
        '삼성전자', 'SK하이닉스', 'LG전자', '현대자동차', '기아자동차',
        '포스코', '롯데그룹', '신세계', 'CJ그룹', 'KT',
        'SK텔레콤', 'LG유플러스', '네이버', '카카오', '쿠팡',
        '배달의민족', '토스', '당근마켓', '라인', 'NHN',
        'NC소프트', '넥슨', '스마일게이트', '크래프톤', '펄어비스'
    ];
    v_departments TEXT[] := ARRAY[
        '개발팀', '기획팀', '영업팀', '마케팅팀', '인사팀',
        '재무팀', '생산팀', '품질팀', '연구소', '디자인팀'
    ];
    v_positions TEXT[] := ARRAY[
        '사원', '주임', '대리', '과장', '차장', '부장'
    ];
    v_company TEXT;
    v_start_year INT;
    v_end_year INT;
BEGIN
    RAISE NOTICE '직원 경력 정보 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, job_title_code
        FROM hr_core.employee
        WHERE RANDOM() < 0.3  -- 30%
        AND job_title_code >= 'G03'  -- 대리 이상
        ORDER BY tenant_id, id
    LOOP
        -- 경력 수 (1~3개)
        v_career_count := 1 + FLOOR(RANDOM() * 3)::INT;
        v_end_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - 1;

        FOR i IN 1..v_career_count LOOP
            v_company := v_companies[1 + FLOOR(RANDOM() * array_length(v_companies, 1))::INT];
            v_start_year := v_end_year - (1 + FLOOR(RANDOM() * 5)::INT);

            INSERT INTO hr_core.employee_career (
                tenant_id, employee_id, company_name, department, position,
                start_date, end_date, job_description
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_company,
                v_departments[1 + FLOOR(RANDOM() * array_length(v_departments, 1))::INT],
                v_positions[LEAST(i, array_length(v_positions, 1))],
                make_date(v_start_year, 1 + FLOOR(RANDOM() * 12)::INT, 1),
                make_date(v_end_year, 1 + FLOOR(RANDOM() * 12)::INT, 28),
                '담당 업무 수행'
            );

            v_end_year := v_start_year - 1;
            v_count := v_count + 1;
        END LOOP;

        IF v_count % 5000 = 0 THEN
            RAISE NOTICE '  경력 정보 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '경력 정보 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 4. 직원 자격증 정보 (employee_certificate)
-- 약 40%의 직원에게 자격증 추가
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_cert_count INT;
    v_certificates TEXT[] := ARRAY[
        '정보처리기사', '정보보안기사', '네트워크관리사', '리눅스마스터',
        '데이터분석전문가', '빅데이터분석기사', 'AWS Solutions Architect',
        'PMP', 'CISSP', 'CISA', 'CPA', '세무사', '변호사', '변리사',
        'TOEIC 900+', 'TOEFL 100+', 'JLPT N1', 'HSK 6급',
        '위험물산업기사', '산업안전기사', '화학분석기사', '품질관리기사',
        '전기기사', '건축기사', '토목기사', '기계설계기사'
    ];
    v_issuers TEXT[] := ARRAY[
        '한국산업인력공단', '한국정보통신진흥협회', 'AWS', 'PMI',
        '(ISC)²', 'ISACA', '금융감독원', '대한변호사협회',
        'ETS', 'JLPT', '孔子学院'
    ];
    v_cert TEXT;
    v_issue_year INT;
BEGIN
    RAISE NOTICE '직원 자격증 정보 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date
        FROM hr_core.employee
        WHERE RANDOM() < 0.4  -- 40%
        ORDER BY tenant_id, id
    LOOP
        -- 자격증 수 (1~3개)
        v_cert_count := 1 + FLOOR(RANDOM() * 3)::INT;

        FOR i IN 1..v_cert_count LOOP
            v_cert := v_certificates[1 + FLOOR(RANDOM() * array_length(v_certificates, 1))::INT];
            v_issue_year := EXTRACT(YEAR FROM v_emp.hire_date)::INT - FLOOR(RANDOM() * 5)::INT;

            INSERT INTO hr_core.employee_certificate (
                tenant_id, employee_id, certificate_name, issuing_organization,
                issue_date, expiry_date, certificate_number
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_cert,
                v_issuers[1 + FLOOR(RANDOM() * array_length(v_issuers, 1))::INT],
                make_date(v_issue_year, 1 + FLOOR(RANDOM() * 12)::INT, 1 + FLOOR(RANDOM() * 28)::INT),
                CASE WHEN RANDOM() < 0.3 THEN make_date(v_issue_year + 3, 12, 31) ELSE NULL END,
                'CERT-' || v_issue_year || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 6, '0')
            );

            v_count := v_count + 1;
        END LOOP;

        IF v_count % 5000 = 0 THEN
            RAISE NOTICE '  자격증 정보 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '자격증 정보 생성 완료: %개', v_count;
END $$;

COMMIT;

-- ============================================================================
-- 검증
-- ============================================================================
DO $$
DECLARE
    v_family INT;
    v_education INT;
    v_career INT;
    v_certificate INT;
BEGIN
    SELECT COUNT(*) INTO v_family FROM hr_core.employee_family;
    SELECT COUNT(*) INTO v_education FROM hr_core.employee_education;
    SELECT COUNT(*) INTO v_career FROM hr_core.employee_career;
    SELECT COUNT(*) INTO v_certificate FROM hr_core.employee_certificate;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '직원 상세 정보 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '가족 정보   : %개', v_family;
    RAISE NOTICE '학력 정보   : %개', v_education;
    RAISE NOTICE '경력 정보   : %개', v_career;
    RAISE NOTICE '자격증 정보 : %개', v_certificate;
    RAISE NOTICE '========================================';
END $$;
