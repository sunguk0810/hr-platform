-- ============================================================================
-- 18_recruitment_generator.sql
-- 채용 관련 데이터 생성 (채용공고, 지원자, 지원서, 면접, 오퍼)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 채용 공고 생성 (각 테넌트별 10-30개)
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
    v_dept RECORD;
    v_recruiter RECORD;
    v_count INT := 0;
    v_job_code VARCHAR(30);
    v_title VARCHAR(200);
    v_status VARCHAR(20);
    v_employment_type VARCHAR(20);
    v_positions TEXT[] := ARRAY[
        '소프트웨어 엔지니어', '프론트엔드 개발자', '백엔드 개발자', '데이터 엔지니어',
        'DevOps 엔지니어', 'AI/ML 엔지니어', '보안 엔지니어', 'QA 엔지니어',
        '제품 기획자', 'UI/UX 디자이너', '프로젝트 매니저', '기술 영업',
        '인사 담당자', '재무 담당자', '마케팅 매니저', '경영 지원',
        '연구원', '품질 관리자', '생산 관리자', '물류 담당자'
    ];
    v_position TEXT;
BEGIN
    RAISE NOTICE '채용 공고 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        -- 테넌트별 채용 담당자 조회
        SELECT e.id, e.name INTO v_recruiter
        FROM hr_core.employee e
        JOIN hr_core.department d ON e.department_id = d.id
        WHERE e.tenant_id = v_tenant.id
        AND d.code LIKE '%HR%'
        AND e.status = 'ACTIVE'
        ORDER BY e.job_title_code DESC
        LIMIT 1;

        -- 테넌트 규모에 따른 채용 공고 수
        FOR i IN 1..CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 30
            WHEN v_tenant.code IN ('HANSUNG_SDI', 'HANSUNG_LIFE') THEN 20
            WHEN v_tenant.code = 'HANSUNG_HD' THEN 5
            ELSE 15
        END LOOP
            -- 부서 랜덤 선택
            SELECT id, name INTO v_dept
            FROM hr_core.department
            WHERE tenant_id = v_tenant.id
            AND level >= 3
            ORDER BY RANDOM()
            LIMIT 1;

            v_position := v_positions[1 + FLOOR(RANDOM() * array_length(v_positions, 1))::INT];
            v_job_code := v_tenant.code || '-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(i::TEXT, 4, '0');

            -- 상태 결정
            v_status := CASE
                WHEN RANDOM() < 0.5 THEN 'OPEN'
                WHEN RANDOM() < 0.7 THEN 'CLOSED'
                WHEN RANDOM() < 0.9 THEN 'IN_PROGRESS'
                ELSE 'DRAFT'
            END;

            v_employment_type := CASE
                WHEN RANDOM() < 0.8 THEN 'FULL_TIME'
                WHEN RANDOM() < 0.95 THEN 'CONTRACT'
                ELSE 'INTERN'
            END;

            INSERT INTO hr_recruitment.job_postings (
                tenant_id, job_code, title, department_id, department_name,
                job_description, requirements, preferred_qualifications,
                employment_type, experience_min, experience_max,
                salary_min, salary_max, salary_negotiable,
                work_location, headcount, skills, benefits,
                status, open_date, close_date,
                recruiter_id, recruiter_name,
                application_count, view_count, is_featured, is_urgent,
                interview_process,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tenant.id,
                v_job_code,
                v_position || ' 채용',
                v_dept.id,
                v_dept.name,
                v_position || ' 포지션 채용입니다. ' || v_tenant.name || '와 함께 성장할 인재를 모집합니다.',
                E'- 관련 경력 3년 이상\n- 관련 분야 학사 학위 이상\n- 원활한 커뮤니케이션 능력',
                E'- 대기업 근무 경험\n- 관련 자격증 보유\n- 영어 커뮤니케이션 가능',
                v_employment_type,
                CASE WHEN v_employment_type = 'INTERN' THEN 0 ELSE 1 + FLOOR(RANDOM() * 5)::INT END,
                CASE WHEN v_employment_type = 'INTERN' THEN 0 ELSE 5 + FLOOR(RANDOM() * 10)::INT END,
                CASE WHEN v_employment_type = 'INTERN' THEN 2500000 ELSE 40000000 + FLOOR(RANDOM() * 40000000) END,
                CASE WHEN v_employment_type = 'INTERN' THEN 3000000 ELSE 80000000 + FLOOR(RANDOM() * 40000000) END,
                true,
                CASE
                    WHEN v_tenant.code IN ('HANSUNG_ELEC', 'HANSUNG_SDI') THEN '경기도 수원/용인'
                    WHEN v_tenant.code = 'HANSUNG_ENG' THEN '서울/현장'
                    WHEN v_tenant.code = 'HANSUNG_CHEM' THEN '울산/여수'
                    ELSE '서울'
                END,
                1 + FLOOR(RANDOM() * 5)::INT,
                '["Java", "Spring", "AWS", "Kubernetes", "Python"]'::jsonb,
                '["건강검진", "학자금지원", "경조금", "복지포인트", "자기개발비"]'::jsonb,
                v_status,
                CURRENT_DATE - ((FLOOR(RANDOM() * 60))::INT || ' days')::INTERVAL,
                CASE WHEN v_status IN ('OPEN', 'IN_PROGRESS') THEN CURRENT_DATE + ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL ELSE CURRENT_DATE - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL END,
                v_recruiter.id,
                v_recruiter.name,
                FLOOR(RANDOM() * 100)::INT,
                FLOOR(RANDOM() * 500)::INT,
                RANDOM() < 0.1,
                RANDOM() < 0.2,
                '[{"stage": "서류전형", "order": 1}, {"stage": "1차 면접", "order": 2}, {"stage": "2차 면접", "order": 3}, {"stage": "최종 합격", "order": 4}]'::jsonb,
                NOW() - ((FLOOR(RANDOM() * 90))::INT || ' days')::INTERVAL,
                NOW(), v_recruiter.id, v_recruiter.id
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '채용 공고 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 2. 지원자 생성 (각 테넌트별 100-500명)
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
    v_count INT := 0;
    v_surnames TEXT[] := ARRAY['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
    v_male_names TEXT[] := ARRAY['민준', '서준', '예준', '도윤', '시우', '주원', '하준', '지호', '준서', '현우'];
    v_female_names TEXT[] := ARRAY['서연', '서윤', '지우', '민서', '하윤', '하은', '지유', '채원', '지민', '수아'];
    v_surname TEXT;
    v_name TEXT;
    v_full_name VARCHAR(100);
    v_email VARCHAR(200);
    v_gender VARCHAR(10);
    v_sources TEXT[] := ARRAY['JOBKOREA', 'SARAMIN', 'LINKEDIN', 'WANTED', 'EMPLOYEE_REFERRAL', 'COMPANY_WEBSITE', 'CAMPUS_RECRUIT'];
BEGIN
    RAISE NOTICE '지원자 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        FOR i IN 1..CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 500
            WHEN v_tenant.code IN ('HANSUNG_SDI', 'HANSUNG_LIFE') THEN 300
            WHEN v_tenant.code = 'HANSUNG_HD' THEN 50
            ELSE 200
        END LOOP
            v_gender := CASE WHEN RANDOM() < 0.55 THEN 'MALE' ELSE 'FEMALE' END;
            v_surname := v_surnames[1 + FLOOR(RANDOM() * array_length(v_surnames, 1))::INT];

            IF v_gender = 'MALE' THEN
                v_name := v_male_names[1 + FLOOR(RANDOM() * array_length(v_male_names, 1))::INT];
            ELSE
                v_name := v_female_names[1 + FLOOR(RANDOM() * array_length(v_female_names, 1))::INT];
            END IF;

            v_full_name := v_surname || v_name;
            v_email := 'applicant' || v_count || '_' || FLOOR(RANDOM() * 1000)::INT || '@' ||
                       CASE FLOOR(RANDOM() * 5)::INT
                           WHEN 0 THEN 'gmail.com'
                           WHEN 1 THEN 'naver.com'
                           WHEN 2 THEN 'daum.net'
                           WHEN 3 THEN 'kakao.com'
                           ELSE 'hanmail.net'
                       END;

            INSERT INTO hr_recruitment.applicants (
                tenant_id, name, email, phone, birth_date, gender, address,
                education, experience, skills, certificates, languages,
                source, source_detail, notes,
                is_blacklisted,
                created_at, updated_at
            ) VALUES (
                v_tenant.id,
                v_full_name,
                v_email,
                '010-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0') || '-' || LPAD((1000 + FLOOR(RANDOM() * 9000))::TEXT, 4, '0'),
                make_date(1985 + FLOOR(RANDOM() * 15)::INT, 1 + FLOOR(RANDOM() * 12)::INT, 1 + FLOOR(RANDOM() * 28)::INT),
                v_gender,
                '서울특별시 ' || CASE FLOOR(RANDOM() * 5)::INT WHEN 0 THEN '강남구' WHEN 1 THEN '서초구' WHEN 2 THEN '송파구' WHEN 3 THEN '마포구' ELSE '영등포구' END,
                jsonb_build_array(jsonb_build_object('school', CASE FLOOR(RANDOM() * 5)::INT WHEN 0 THEN '서울대학교' WHEN 1 THEN '연세대학교' WHEN 2 THEN '고려대학교' WHEN 3 THEN '성균관대학교' ELSE '한양대학교' END, 'degree', '학사', 'major', '컴퓨터공학')),
                jsonb_build_array(jsonb_build_object('company', '이전회사', 'position', '개발자', 'years', FLOOR(RANDOM() * 10)::INT)),
                '["Java", "Python", "JavaScript", "SQL"]'::jsonb,
                '["정보처리기사", "AWS SAA"]'::jsonb,
                jsonb_build_array(jsonb_build_object('language', '영어', 'level', '중급')),
                v_sources[1 + FLOOR(RANDOM() * array_length(v_sources, 1))::INT],
                NULL,
                NULL,
                false,
                NOW() - ((FLOOR(RANDOM() * 180))::INT || ' days')::INTERVAL,
                NOW()
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '지원자 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 3. 지원서 생성 (지원자 - 채용공고 매칭)
-- ============================================================================
DO $$
DECLARE
    v_applicant RECORD;
    v_job RECORD;
    v_count INT := 0;
    v_app_number VARCHAR(50);
    v_status VARCHAR(30);
    v_stage VARCHAR(50);
BEGIN
    RAISE NOTICE '지원서 생성 중...';

    FOR v_applicant IN
        SELECT id, tenant_id, name
        FROM hr_recruitment.applicants
        WHERE NOT is_blacklisted
    LOOP
        -- 각 지원자당 1-3개의 지원서
        FOR v_job IN
            SELECT id, title
            FROM hr_recruitment.job_postings
            WHERE tenant_id = v_applicant.tenant_id
            AND status IN ('OPEN', 'CLOSED', 'IN_PROGRESS')
            ORDER BY RANDOM()
            LIMIT FLOOR(1 + RANDOM() * 3)::INT
        LOOP
            v_count := v_count + 1;
            v_app_number := 'APP-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(v_count::TEXT, 6, '0');

            v_status := CASE
                WHEN RANDOM() < 0.3 THEN 'SUBMITTED'
                WHEN RANDOM() < 0.5 THEN 'SCREENING'
                WHEN RANDOM() < 0.65 THEN 'INTERVIEW'
                WHEN RANDOM() < 0.75 THEN 'OFFER'
                WHEN RANDOM() < 0.85 THEN 'HIRED'
                WHEN RANDOM() < 0.95 THEN 'REJECTED'
                ELSE 'WITHDRAWN'
            END;

            v_stage := CASE v_status
                WHEN 'SUBMITTED' THEN 'DOCUMENT'
                WHEN 'SCREENING' THEN 'DOCUMENT'
                WHEN 'INTERVIEW' THEN CASE WHEN RANDOM() < 0.5 THEN 'FIRST_INTERVIEW' ELSE 'SECOND_INTERVIEW' END
                WHEN 'OFFER' THEN 'OFFER'
                WHEN 'HIRED' THEN 'HIRED'
                WHEN 'REJECTED' THEN 'REJECTED'
                ELSE 'WITHDRAWN'
            END;

            INSERT INTO hr_recruitment.applications (
                tenant_id, job_posting_id, applicant_id, application_number,
                status, cover_letter, expected_salary, available_date,
                current_stage, stage_order,
                screening_score, screening_notes,
                rejected_at, withdrawn_at, hired_at,
                created_at, updated_at
            ) VALUES (
                v_applicant.tenant_id,
                v_job.id,
                v_applicant.id,
                v_app_number,
                v_status,
                '귀사의 ' || v_job.title || ' 포지션에 지원합니다. 저의 경험과 역량이 귀사에 기여할 수 있을 것이라 확신합니다.',
                40000000 + FLOOR(RANDOM() * 80000000),
                '즉시 가능' || CASE WHEN RANDOM() < 0.3 THEN '' ELSE ' / 협의 가능' END,
                v_stage,
                CASE v_stage
                    WHEN 'DOCUMENT' THEN 0
                    WHEN 'FIRST_INTERVIEW' THEN 1
                    WHEN 'SECOND_INTERVIEW' THEN 2
                    WHEN 'OFFER' THEN 3
                    WHEN 'HIRED' THEN 4
                    ELSE 0
                END,
                CASE WHEN v_status NOT IN ('SUBMITTED') THEN 50 + FLOOR(RANDOM() * 50)::INT ELSE NULL END,
                CASE WHEN v_status NOT IN ('SUBMITTED') THEN '서류 검토 완료' ELSE NULL END,
                CASE WHEN v_status = 'REJECTED' THEN NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL ELSE NULL END,
                CASE WHEN v_status = 'WITHDRAWN' THEN NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL ELSE NULL END,
                CASE WHEN v_status = 'HIRED' THEN NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL ELSE NULL END,
                NOW() - ((FLOOR(RANDOM() * 90))::INT || ' days')::INTERVAL,
                NOW()
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE '지원서 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 4. 면접 생성
-- ============================================================================
DO $$
DECLARE
    v_app RECORD;
    v_count INT := 0;
    v_interview_types TEXT[] := ARRAY['PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL', 'EXECUTIVE'];
    v_interview_type TEXT;
    v_interviewer RECORD;
BEGIN
    RAISE NOTICE '면접 생성 중...';

    FOR v_app IN
        SELECT a.id, a.tenant_id, a.status, a.current_stage
        FROM hr_recruitment.applications a
        WHERE a.status IN ('INTERVIEW', 'OFFER', 'HIRED')
    LOOP
        -- 1-3라운드 면접
        FOR round IN 1..CASE
            WHEN v_app.status = 'INTERVIEW' THEN FLOOR(1 + RANDOM() * 2)::INT
            ELSE FLOOR(2 + RANDOM() * 2)::INT
        END LOOP
            v_interview_type := v_interview_types[LEAST(round, array_length(v_interview_types, 1))];

            -- 면접관 선택
            SELECT e.id, e.name INTO v_interviewer
            FROM hr_core.employee e
            WHERE e.tenant_id = v_app.tenant_id
            AND e.job_title_code >= 'G05'
            AND e.status = 'ACTIVE'
            ORDER BY RANDOM()
            LIMIT 1;

            INSERT INTO hr_recruitment.interviews (
                tenant_id, application_id, interview_type, round,
                status, scheduled_date, scheduled_time, duration_minutes,
                location, meeting_url, interviewers, notes,
                result, result_notes, overall_score,
                feedback_deadline,
                created_at, updated_at
            ) VALUES (
                v_app.tenant_id,
                v_app.id,
                v_interview_type,
                round,
                CASE
                    WHEN v_app.status IN ('OFFER', 'HIRED') THEN 'COMPLETED'
                    WHEN v_app.status = 'INTERVIEW' AND round = 1 THEN 'COMPLETED'
                    ELSE 'SCHEDULED'
                END,
                CURRENT_DATE - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL + ((round * 7) || ' days')::INTERVAL,
                ('10:00'::TIME + ((FLOOR(RANDOM() * 8))::INT || ' hours')::INTERVAL),
                CASE v_interview_type WHEN 'PHONE' THEN 30 WHEN 'VIDEO' THEN 45 ELSE 60 END,
                CASE v_interview_type
                    WHEN 'PHONE' THEN '전화 면접'
                    WHEN 'VIDEO' THEN 'Zoom 화상 면접'
                    ELSE '본사 회의실'
                END,
                CASE WHEN v_interview_type = 'VIDEO' THEN 'https://zoom.us/j/' || FLOOR(RANDOM() * 10000000000)::BIGINT ELSE NULL END,
                ('[{"id": "' || COALESCE(v_interviewer.id::TEXT, gen_random_uuid()::TEXT) || '", "name": "' || COALESCE(v_interviewer.name, '면접관') || '"}]')::jsonb,
                NULL,
                CASE WHEN v_app.status IN ('OFFER', 'HIRED') OR (v_app.status = 'INTERVIEW' AND round = 1)
                     THEN CASE WHEN RANDOM() < 0.8 THEN 'PASS' ELSE 'FAIL' END
                     ELSE NULL END,
                CASE WHEN v_app.status IN ('OFFER', 'HIRED') THEN '전반적으로 우수한 지원자입니다.' ELSE NULL END,
                CASE WHEN v_app.status IN ('OFFER', 'HIRED') THEN 70 + FLOOR(RANDOM() * 30)::INT ELSE NULL END,
                CURRENT_DATE + ((round * 7 + 3) || ' days')::INTERVAL,
                NOW() - ((FLOOR(RANDOM() * 60))::INT || ' days')::INTERVAL,
                NOW()
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '면접 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 5. 면접 평가 생성
-- ============================================================================
DO $$
DECLARE
    v_interview RECORD;
    v_count INT := 0;
    v_criteria TEXT[] := ARRAY['기술역량', '커뮤니케이션', '문제해결력', '팀워크', '성장가능성'];
    v_criterion TEXT;
    v_interviewer RECORD;
BEGIN
    RAISE NOTICE '면접 평가 생성 중...';

    FOR v_interview IN
        SELECT i.id, i.tenant_id, i.interviewers, i.status
        FROM hr_recruitment.interviews i
        WHERE i.status = 'COMPLETED'
    LOOP
        -- 각 평가 항목별 점수
        FOREACH v_criterion IN ARRAY v_criteria LOOP
            INSERT INTO hr_recruitment.interview_scores (
                tenant_id, interview_id,
                interviewer_id, interviewer_name,
                criterion, score, max_score, weight, comment,
                evaluated_at,
                created_at, updated_at
            ) VALUES (
                v_interview.tenant_id,
                v_interview.id,
                (v_interview.interviewers->0->>'id')::UUID,
                v_interview.interviewers->0->>'name',
                v_criterion,
                3 + FLOOR(RANDOM() * 3)::INT,  -- 3-5점
                5,
                1.0,
                v_criterion || ' 평가: 양호',
                NOW() - ((FLOOR(RANDOM() * 7))::INT || ' days')::INTERVAL,
                NOW(), NOW()
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '면접 평가 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 6. 채용 오퍼 생성
-- ============================================================================
DO $$
DECLARE
    v_app RECORD;
    v_count INT := 0;
    v_offer_number VARCHAR(50);
BEGIN
    RAISE NOTICE '채용 오퍼 생성 중...';

    FOR v_app IN
        SELECT a.id, a.tenant_id, a.job_posting_id,
               ap.name as applicant_name,
               jp.title as position_title, jp.department_id, jp.department_name
        FROM hr_recruitment.applications a
        JOIN hr_recruitment.applicants ap ON a.applicant_id = ap.id
        JOIN hr_recruitment.job_postings jp ON a.job_posting_id = jp.id
        WHERE a.status IN ('OFFER', 'HIRED')
    LOOP
        v_count := v_count + 1;
        v_offer_number := 'OFFER-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(v_count::TEXT, 5, '0');

        INSERT INTO hr_recruitment.offers (
            tenant_id, application_id, offer_number,
            status, position_title, department_id, department_name,
            grade_code, grade_name,
            base_salary, signing_bonus, benefits,
            start_date, employment_type, probation_months, work_location,
            expires_at, sent_at, responded_at,
            created_at, updated_at
        ) VALUES (
            v_app.tenant_id,
            v_app.id,
            v_offer_number,
            CASE WHEN RANDOM() < 0.7 THEN 'ACCEPTED' WHEN RANDOM() < 0.9 THEN 'PENDING' ELSE 'DECLINED' END,
            v_app.position_title,
            v_app.department_id,
            v_app.department_name,
            'G03',
            '대리',
            50000000 + FLOOR(RANDOM() * 50000000),
            CASE WHEN RANDOM() < 0.3 THEN 3000000 + FLOOR(RANDOM() * 7000000) ELSE NULL END,
            '["4대보험", "연차", "경조금", "건강검진"]'::jsonb,
            CURRENT_DATE + ((30 + FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL,
            'FULL_TIME',
            3,
            '본사',
            NOW() + INTERVAL '7 days',
            NOW() - ((FLOOR(RANDOM() * 14))::INT || ' days')::INTERVAL,
            CASE WHEN RANDOM() < 0.8 THEN NOW() - ((FLOOR(RANDOM() * 7))::INT || ' days')::INTERVAL ELSE NULL END,
            NOW() - ((FLOOR(RANDOM() * 30))::INT || ' days')::INTERVAL,
            NOW()
        );
    END LOOP;

    RAISE NOTICE '채용 오퍼 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_job_count INT;
    v_applicant_count INT;
    v_application_count INT;
    v_interview_count INT;
    v_score_count INT;
    v_offer_count INT;
BEGIN
    SELECT COUNT(*) INTO v_job_count FROM hr_recruitment.job_postings;
    SELECT COUNT(*) INTO v_applicant_count FROM hr_recruitment.applicants;
    SELECT COUNT(*) INTO v_application_count FROM hr_recruitment.applications;
    SELECT COUNT(*) INTO v_interview_count FROM hr_recruitment.interviews;
    SELECT COUNT(*) INTO v_score_count FROM hr_recruitment.interview_scores;
    SELECT COUNT(*) INTO v_offer_count FROM hr_recruitment.offers;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '채용 데이터 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '채용 공고   : %개', v_job_count;
    RAISE NOTICE '지원자      : %개', v_applicant_count;
    RAISE NOTICE '지원서      : %개', v_application_count;
    RAISE NOTICE '면접        : %개', v_interview_count;
    RAISE NOTICE '면접 평가   : %개', v_score_count;
    RAISE NOTICE '채용 오퍼   : %개', v_offer_count;
    RAISE NOTICE '========================================';
END $$;
