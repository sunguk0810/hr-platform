-- ============================================================================
-- 10_recruitment.sql
-- 채용 샘플 데이터
-- ============================================================================
-- Tables:
--   job_posting (~25), applicant (~60), application (~80)
--   interview (~50), interview_score (~120), offer (~15)
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

RESET app.current_tenant;

BEGIN;

-- ============================================================================
-- PART 1: Job Postings (한성전자 중심)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_hr UUID := 'e0000002-0000-0000-0000-000000000002';  -- hr.admin
    v_dev_mgr UUID := 'e0000002-0000-0000-0000-000000000004';  -- dev.manager
BEGIN
    -- 한성전자 공고 10건
    INSERT INTO hr_recruitment.job_posting (id, tenant_id, job_code, title, department_id, department_name, position_id, position_name, job_description, requirements, employment_type, experience_min, experience_max, salary_min, salary_max, headcount, skills, status, open_date, close_date, recruiter_id, recruiter_name, hiring_manager_id, hiring_manager_name, application_count, view_count, is_featured, is_urgent, created_at, updated_at, created_by, updated_by)
    VALUES
    ('f0000002-0000-0000-0000-000000000001'::UUID, v_t, 'ELEC-REC-2025-001', '프론트엔드 개발자 (React/TypeScript)', 'd0000002-0000-0000-0000-000000000016', '개발1팀', NULL, '선임', '프론트엔드 웹 애플리케이션 개발 및 유지보수', 'React, TypeScript 경력 3년 이상', 'FULL_TIME', 3, 7, 50000000, 80000000, 2, '["React","TypeScript","Next.js"]'::JSONB, 'OPEN', CURRENT_DATE - 30, CURRENT_DATE + 30, v_hr, '김인사', v_dev_mgr, '정개발', 15, 342, true, false, NOW()-interval '30 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000002'::UUID, v_t, 'ELEC-REC-2025-002', '백엔드 개발자 (Java/Spring Boot)', 'd0000002-0000-0000-0000-000000000016', '개발1팀', NULL, '선임', 'Java 기반 마이크로서비스 개발', 'Java, Spring Boot 경력 5년 이상', 'FULL_TIME', 5, 10, 60000000, 100000000, 1, '["Java","Spring Boot","PostgreSQL"]'::JSONB, 'OPEN', CURRENT_DATE - 20, CURRENT_DATE + 40, v_hr, '김인사', v_dev_mgr, '정개발', 8, 256, true, true, NOW()-interval '20 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000003'::UUID, v_t, 'ELEC-REC-2025-003', 'DevOps 엔지니어', 'd0000002-0000-0000-0000-000000000020', '인프라팀', NULL, '책임', 'CI/CD 파이프라인 및 클라우드 인프라 관리', 'AWS, Kubernetes 경력 3년 이상', 'FULL_TIME', 3, 8, 55000000, 90000000, 1, '["AWS","Kubernetes","Terraform"]'::JSONB, 'OPEN', CURRENT_DATE - 15, CURRENT_DATE + 45, v_hr, '김인사', NULL, NULL, 5, 189, false, false, NOW()-interval '15 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000004'::UUID, v_t, 'ELEC-REC-2025-004', 'QA 엔지니어', 'd0000002-0000-0000-0000-000000000018', 'QA팀', NULL, '팀원', '소프트웨어 품질 관리 및 자동화 테스트', 'QA 경력 2년 이상', 'FULL_TIME', 2, 5, 40000000, 60000000, 2, '["Selenium","JUnit","Jira"]'::JSONB, 'OPEN', CURRENT_DATE - 10, CURRENT_DATE + 50, v_hr, '김인사', NULL, NULL, 3, 98, false, false, NOW()-interval '10 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000005'::UUID, v_t, 'ELEC-REC-2025-005', 'UI/UX 디자이너', 'd0000002-0000-0000-0000-000000000031', '디자인팀', NULL, '선임', 'HR SaaS 플랫폼 UI/UX 디자인', 'Figma, UI/UX 경력 3년 이상', 'FULL_TIME', 3, 7, 45000000, 75000000, 1, '["Figma","Adobe XD","Sketch"]'::JSONB, 'CLOSED', CURRENT_DATE - 60, CURRENT_DATE - 10, v_hr, '김인사', NULL, NULL, 20, 445, false, false, NOW()-interval '60 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000006'::UUID, v_t, 'ELEC-REC-2025-006', '인사 담당자 (신입/경력)', 'd0000002-0000-0000-0000-000000000007', '인사팀', NULL, '팀원', 'HR 업무 전반 지원', '인사/노무 관련 전공 또는 경력', 'FULL_TIME', 0, 3, 35000000, 50000000, 1, '["Excel","SAP HR"]'::JSONB, 'CLOSED', CURRENT_DATE - 90, CURRENT_DATE - 30, v_hr, '김인사', v_hr, '김인사', 35, 678, false, false, NOW()-interval '90 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000007'::UUID, v_t, 'ELEC-REC-2025-007', '데이터 분석가 (인턴)', 'd0000002-0000-0000-0000-000000000003', '경영기획실', NULL, '팀원', '데이터 분석 및 리포트 작성', '통계학/데이터사이언스 전공', 'INTERN', 0, 1, 24000000, 30000000, 2, '["Python","SQL","Tableau"]'::JSONB, 'DRAFT', NULL, NULL, v_hr, '김인사', NULL, NULL, 0, 0, false, false, NOW()-interval '2 days', NOW(), v_s, v_s),
    ('f0000002-0000-0000-0000-000000000008'::UUID, v_t, 'ELEC-REC-2025-008', '회계 담당자', 'd0000002-0000-0000-0000-000000000012', '회계팀', NULL, '선임', '결산, 세무 업무', '회계사/세무사 자격증 우대', 'FULL_TIME', 3, 7, 50000000, 70000000, 1, '["SAP","IFRS"]'::JSONB, 'OPEN', CURRENT_DATE - 5, CURRENT_DATE + 55, v_hr, '김인사', NULL, NULL, 2, 45, false, false, NOW()-interval '5 days', NOW(), v_s, v_s);

    -- 다른 테넌트 공고 (한성SDI 3건, 한성생명 2건, 한성IT 2건)
    INSERT INTO hr_recruitment.job_posting (tenant_id, job_code, title, department_id, department_name, employment_type, headcount, status, open_date, close_date, application_count, view_count, created_at, updated_at, created_by, updated_by)
    SELECT
        t.id,
        t_code || '-REC-2025-' || LPAD(s.n::TEXT, 3, '0'),
        (ARRAY['SW 엔지니어','생산기술자','품질관리자','영업담당자','경영지원'])[1 + (s.n % 5)],
        d.id, d.name,
        'FULL_TIME', 1 + (s.n % 2),
        (ARRAY['OPEN','OPEN','CLOSED'])[1 + (s.n % 3)],
        CURRENT_DATE - (s.n * 15), CURRENT_DATE + (s.n * 10),
        s.n * 3, s.n * 50,
        NOW() - (s.n * interval '15 days'), NOW(), 'system', 'system'
    FROM (
        SELECT 'a0000001-0000-0000-0000-000000000003'::UUID as tid, 'SDI' as t_code, generate_series(1,3) as n
        UNION ALL
        SELECT 'a0000001-0000-0000-0000-000000000008'::UUID, 'LIFE', generate_series(1,2)
        UNION ALL
        SELECT 'a0000001-0000-0000-0000-000000000007'::UUID, 'IT', generate_series(1,2)
    ) s
    JOIN tenant_common.tenant t ON t.id = s.tid
    JOIN hr_core.department d ON d.tenant_id = s.tid AND d.level >= 2
    ORDER BY s.tid, s.n
    LIMIT 7;

    RAISE NOTICE 'Created job postings';
END $$;

-- ============================================================================
-- PART 2: Applicants & Applications (한성전자 중심)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_app_id UUID;
    v_applicant_id UUID;
    v_surnames TEXT[] := ARRAY['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권'];
    v_given TEXT[] := ARRAY['지원','수현','태민','서영','민호','하진','재현','유진','동현','소연','현우','예린','성민','나윤','준혁'];
    v_sources TEXT[] := ARRAY['JOBKOREA','SARAMIN','WANTED','LINKEDIN','REFERRAL','DIRECT','CAMPUS'];
    i INT; v_name TEXT; v_email TEXT;
BEGIN
    -- 40 applicants for 한성전자
    FOR i IN 1..40 LOOP
        v_name := v_surnames[1 + ((i-1) % 15)] || v_given[1 + ((i-1) % 15)];
        v_email := 'applicant' || i || '@example.com';
        v_applicant_id := gen_random_uuid();

        INSERT INTO hr_recruitment.applicant (
            id, tenant_id, name, email, phone, birth_date, gender,
            source, source_detail, is_blacklisted, blacklist_reason,
            education, experience, skills,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_applicant_id, v_t, v_name, v_email,
            '010-' || LPAD((2000 + i)::TEXT, 4, '0') || '-' || LPAD((1000 + i)::TEXT, 4, '0'),
            '1990-01-01'::DATE + (i * 30 * interval '1 day')::interval,
            CASE WHEN i % 3 = 0 THEN 'FEMALE' ELSE 'MALE' END,
            v_sources[1 + ((i-1) % 7)],
            CASE WHEN v_sources[1 + ((i-1) % 7)] = 'REFERRAL' THEN '직원 추천' ELSE NULL END,
            (i = 38), -- One blacklisted
            CASE WHEN i = 38 THEN '면접 노쇼 2회' ELSE NULL END,
            json_build_object('degree', CASE WHEN i % 4 = 0 THEN '석사' ELSE '학사' END, 'university', '서울대학교')::JSONB,
            json_build_object('years', 1 + (i % 8), 'company', '이전 회사')::JSONB,
            json_build_array('Java', 'Spring', 'React')::JSONB,
            NOW() - ((40 - i) * interval '2 days'), NOW(), v_s, v_s
        );

        -- Create applications (not all applicants apply, link to postings 1-6)
        IF i <= 35 THEN
            v_app_id := gen_random_uuid();
            INSERT INTO hr_recruitment.application (
                id, tenant_id, job_posting_id, applicant_id,
                application_number, status, cover_letter,
                screening_score, current_stage, stage_order,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_app_id, v_t,
                ('f0000002-0000-0000-0000-' || LPAD((1 + ((i-1) % 6))::TEXT, 12, '0'))::UUID,
                v_applicant_id,
                'ELEC-APP-2025-' || LPAD(i::TEXT, 4, '0'),
                (ARRAY['SUBMITTED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN'])[1 + ((i-1) % 7)],
                '지원 동기: 한성전자의 기술력과 성장성에 매력을 느꼈습니다.',
                50 + (i * 2),
                (ARRAY['DOCUMENT','FIRST_INTERVIEW','SECOND_INTERVIEW','FINAL','OFFER'])[1 + ((i-1) % 5)],
                1 + ((i-1) % 5),
                NOW() - ((35 - i) * interval '2 days'), NOW(), v_s, v_s
            );

            -- Create interviews for applications in interview stage
            IF i % 7 IN (2, 3) THEN -- SCREENING or INTERVIEW status
                INSERT INTO hr_recruitment.interview (
                    id, tenant_id, application_id, interview_type, round,
                    status, scheduled_date, scheduled_time, duration_minutes,
                    location, interviewers, result, overall_score,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(), v_t, v_app_id,
                    CASE WHEN i % 2 = 0 THEN 'TECHNICAL' ELSE 'BEHAVIORAL' END,
                    1,
                    CASE WHEN i % 3 = 0 THEN 'COMPLETED' ELSE 'SCHEDULED' END,
                    CURRENT_DATE + (i % 14),
                    '14:00',
                    60,
                    '한성전자 본사 3층 면접실',
                    json_build_array(
                        json_build_object('id', 'e0000002-0000-0000-0000-000000000004', 'name', '정개발')
                    )::JSONB,
                    CASE WHEN i % 3 = 0 THEN 'PASS' ELSE NULL END,
                    CASE WHEN i % 3 = 0 THEN 80 + (i % 15) ELSE NULL END,
                    NOW() - ((35 - i) * interval '1 day'), NOW(), v_s, v_s
                );
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'Created 40 applicants, ~35 applications, interviews';
END $$;

-- ============================================================================
-- PART 3: Interview Scores (for completed interviews)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_dev_mgr UUID := 'e0000002-0000-0000-0000-000000000004';
    v_hr_adm UUID := 'e0000002-0000-0000-0000-000000000002';
    v_criteria TEXT[] := ARRAY['기술역량','커뮤니케이션','문제해결','팀워크','성장잠재력'];
    r RECORD;
    j INT;
BEGIN
    FOR r IN
        SELECT i.id as interview_id
        FROM hr_recruitment.interview i
        WHERE i.tenant_id = v_t AND i.status = 'COMPLETED'
    LOOP
        FOR j IN 1..5 LOOP
            INSERT INTO hr_recruitment.interview_score (
                tenant_id, interview_id, interviewer_id, interviewer_name,
                criterion, score, max_score, weight, comment,
                evaluated_at, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_t, r.interview_id, v_dev_mgr, '정개발',
                v_criteria[j], 3 + (j % 3), 5, 1.0,
                CASE WHEN j = 1 THEN '기술 면접 우수' WHEN j = 3 THEN '문제 해결 능력 양호' ELSE NULL END,
                NOW(), NOW(), NOW(), v_s, v_s
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Created interview scores';
END $$;

-- ============================================================================
-- PART 4: Offers (for hired applicants)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    r RECORD;
    v_seq INT := 0;
BEGIN
    FOR r IN
        SELECT a.id as app_id, ap.name as applicant_name
        FROM hr_recruitment.application a
        JOIN hr_recruitment.applicant ap ON a.applicant_id = ap.id
        WHERE a.tenant_id = v_t AND a.status IN ('OFFER', 'HIRED')
        LIMIT 8
    LOOP
        v_seq := v_seq + 1;
        INSERT INTO hr_recruitment.offer (
            tenant_id, application_id, offer_number, status,
            position_title, department_id, department_name,
            grade_code, grade_name, base_salary, signing_bonus,
            start_date, employment_type, probation_months,
            work_location, expires_at, sent_at,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_t, r.app_id,
            'ELEC-OFR-2025-' || LPAD(v_seq::TEXT, 4, '0'),
            CASE WHEN v_seq <= 4 THEN 'ACCEPTED' WHEN v_seq <= 6 THEN 'SENT' ELSE 'DRAFT' END,
            '선임 개발자', 'd0000002-0000-0000-0000-000000000016', '개발1팀',
            'G10', '대리', 55000000 + (v_seq * 5000000), 3000000,
            CURRENT_DATE + 30 + (v_seq * 7), 'FULL_TIME', 3,
            '서울특별시 강남구 한성전자 본사',
            NOW() + interval '14 days',
            CASE WHEN v_seq <= 6 THEN NOW() - (v_seq * interval '5 days') END,
            NOW() - (v_seq * interval '7 days'), NOW(), v_s, v_s
        );
    END LOOP;

    RAISE NOTICE 'Created offers: %', v_seq;
END $$;

COMMIT;

-- Verification
SELECT 'job_posting' as "table", COUNT(*)::TEXT as cnt FROM hr_recruitment.job_posting
UNION ALL SELECT 'applicant', COUNT(*)::TEXT FROM hr_recruitment.applicant
UNION ALL SELECT 'application', COUNT(*)::TEXT FROM hr_recruitment.application
UNION ALL SELECT 'interview', COUNT(*)::TEXT FROM hr_recruitment.interview
UNION ALL SELECT 'interview_score', COUNT(*)::TEXT FROM hr_recruitment.interview_score
UNION ALL SELECT 'offer', COUNT(*)::TEXT FROM hr_recruitment.offer;
