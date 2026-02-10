-- ============================================================================
-- 20_certificate_generator.sql
-- 증명서 서비스 샘플 데이터 생성
-- ============================================================================
-- 생성 규모:
--   - 증명서 템플릿: 테넌트당 8개 (총 64개)
--   - 증명서 유형: 테넌트당 10개 (총 80개)
--   - 증명서 신청: 테넌트당 ~200건 (총 ~1,600건)
--   - 발급된 증명서: ~1,200건
--   - 진위확인 로그: ~500건
-- ============================================================================

-- RLS 비활성화
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- 증명서 템플릿 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_template_id UUID;
    v_template_count INT := 0;
    v_templates TEXT[][] := ARRAY[
        ARRAY['재직증명서', 'EMPLOYMENT', '재직 사실을 증명하는 문서입니다.'],
        ARRAY['경력증명서', 'CAREER', '경력 사항을 증명하는 문서입니다.'],
        ARRAY['급여명세서', 'SALARY', '급여 내역을 증명하는 문서입니다.'],
        ARRAY['원천징수영수증', 'TAX', '원천징수 내역을 증명하는 문서입니다.'],
        ARRAY['퇴직증명서', 'RETIREMENT', '퇴직 사실을 증명하는 문서입니다.'],
        ARRAY['교육수료증', 'TRAINING', '교육 수료 사실을 증명하는 문서입니다.'],
        ARRAY['재직경력확인서', 'CAREER_CONFIRM', '재직 경력을 확인하는 문서입니다.'],
        ARRAY['휴직증명서', 'LEAVE_OF_ABSENCE', '휴직 사실을 증명하는 문서입니다.']
    ];
BEGIN
    RAISE NOTICE '증명서 템플릿 생성 중...';

    FOR v_tenant IN SELECT id, name FROM tenant_common.tenant LOOP
        FOR i IN 1..array_length(v_templates, 1) LOOP
            v_template_id := gen_random_uuid();

            INSERT INTO hr_certificate.certificate_templates (
                id, tenant_id, name, description, content_html, header_html, footer_html,
                css_styles, page_size, orientation, margin_top, margin_bottom, margin_left, margin_right,
                variables, include_company_seal, include_signature, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_template_id,
                v_tenant.id,
                v_templates[i][1],
                v_templates[i][3],
                '<div class="certificate">
                    <h1>' || v_templates[i][1] || '</h1>
                    <div class="content">
                        <p>성명: {{employee_name}}</p>
                        <p>사번: {{employee_number}}</p>
                        <p>부서: {{department_name}}</p>
                        <p>직급: {{grade_name}}</p>
                        <p>입사일: {{hire_date}}</p>
                        {{#if include_salary}}<p>급여: {{salary}}</p>{{/if}}
                    </div>
                    <p class="purpose">위 사실을 증명합니다.</p>
                    <p class="date">{{issue_date}}</p>
                    <div class="company">
                        <p>{{company_name}}</p>
                        <p>대표이사 {{ceo_name}}</p>
                    </div>
                </div>',
                '<div class="header"><img src="{{company_logo}}" alt="회사 로고" /></div>',
                '<div class="footer"><p>문서번호: {{document_number}} | 발급일: {{issue_date}}</p></div>',
                '.certificate { font-family: "Malgun Gothic", sans-serif; padding: 40px; }
                h1 { text-align: center; font-size: 24px; margin-bottom: 30px; }
                .content { margin: 20px 0; line-height: 1.8; }
                .purpose { text-align: center; margin: 30px 0; }
                .date { text-align: center; }
                .company { text-align: center; margin-top: 50px; }',
                'A4',
                'PORTRAIT',
                20, 20, 20, 20,
                '{"employee_name": "", "employee_number": "", "department_name": "", "grade_name": "", "hire_date": "", "salary": "", "issue_date": "", "company_name": "", "ceo_name": "", "document_number": ""}',
                TRUE,
                TRUE,
                TRUE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            v_template_count := v_template_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '증명서 템플릿 % 건 생성 완료', v_template_count;
END $$;

-- ============================================================================
-- 증명서 유형 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_template RECORD;
    v_type_count INT := 0;
    v_cert_types TEXT[][] := ARRAY[
        ARRAY['EMPLOYMENT_KO', '재직증명서', 'Certificate of Employment', 'FALSE', '90', '0'],
        ARRAY['EMPLOYMENT_EN', '재직증명서(영문)', 'Certificate of Employment (EN)', 'FALSE', '90', '0'],
        ARRAY['CAREER_KO', '경력증명서', 'Career Certificate', 'FALSE', '90', '0'],
        ARRAY['SALARY_CERT', '급여증명서', 'Salary Certificate', 'TRUE', '30', '0'],
        ARRAY['TAX_WITHHOLD', '원천징수영수증', 'Tax Withholding Receipt', 'FALSE', '365', '0'],
        ARRAY['RETIREMENT_CERT', '퇴직증명서', 'Retirement Certificate', 'FALSE', '180', '0'],
        ARRAY['TRAINING_CERT', '교육수료증', 'Training Certificate', 'FALSE', '365', '0'],
        ARRAY['CAREER_CONFIRM', '재직경력확인서', 'Career Confirmation', 'TRUE', '30', '0'],
        ARRAY['LEAVE_CERT', '휴직증명서', 'Leave of Absence Certificate', 'FALSE', '90', '0'],
        ARRAY['INCOME_CERT', '소득금액증명서', 'Income Certificate', 'TRUE', '30', '1000']
    ];
BEGIN
    RAISE NOTICE '증명서 유형 생성 중...';

    FOR v_tenant IN SELECT id, name FROM tenant_common.tenant LOOP
        FOR i IN 1..array_length(v_cert_types, 1) LOOP
            -- 매칭되는 템플릿 찾기
            SELECT id INTO v_template
            FROM hr_certificate.certificate_templates
            WHERE tenant_id = v_tenant.id
            ORDER BY RANDOM()
            LIMIT 1;

            INSERT INTO hr_certificate.certificate_types (
                tenant_id, code, name, name_en, description, template_id,
                requires_approval, auto_issue, valid_days, fee, max_copies_per_request,
                sort_order, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tenant.id,
                v_cert_types[i][1],
                v_cert_types[i][2],
                v_cert_types[i][3],
                v_cert_types[i][2] || ' 발급을 위한 증명서 유형입니다.',
                v_template.id,
                v_cert_types[i][4]::BOOLEAN,
                NOT v_cert_types[i][4]::BOOLEAN,
                v_cert_types[i][5]::INT,
                v_cert_types[i][6]::DECIMAL,
                5,
                i,
                TRUE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            v_type_count := v_type_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '증명서 유형 % 건 생성 완료', v_type_count;
END $$;

-- ============================================================================
-- 증명서 신청 및 발급 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_employee RECORD;
    v_cert_type RECORD;
    v_request_id UUID;
    v_issue_id UUID;
    v_request_number VARCHAR(50);
    v_issue_number VARCHAR(50);
    v_verification_code VARCHAR(20);
    v_request_count INT;
    v_status VARCHAR(20);
    v_statuses VARCHAR(20)[] := ARRAY['PENDING', 'APPROVED', 'ISSUED', 'REJECTED'];
    v_purposes VARCHAR(200)[] := ARRAY['금융기관 제출용', '관공서 제출용', '입찰서류 제출용', '비자 신청용', '학교 제출용', '병원 제출용', '기타'];
    v_targets VARCHAR(200)[] := ARRAY['국민은행', '하나은행', '신한은행', '주민센터', '법원', '출입국관리사무소', '대사관', '학교', '병원', '기타'];
    v_total_requests INT := 0;
    v_total_issues INT := 0;
BEGIN
    RAISE NOTICE '증명서 신청/발급 생성 중...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        -- 테넌트 규모에 따른 신청 수 결정
        v_request_count := CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 300
            WHEN v_tenant.code IN ('HANSUNG_LIFE', 'HANSUNG_SDI') THEN 200
            ELSE 150
        END;

        FOR i IN 1..v_request_count LOOP
            -- 랜덤 직원 선택
            SELECT e.id, e.name, e.employee_number
            INTO v_employee
            FROM hr_core.employee e
            WHERE e.tenant_id = v_tenant.id AND e.status = 'ACTIVE'
            ORDER BY RANDOM()
            LIMIT 1;

            -- 랜덤 증명서 유형 선택
            SELECT * INTO v_cert_type
            FROM hr_certificate.certificate_types
            WHERE tenant_id = v_tenant.id
            ORDER BY RANDOM()
            LIMIT 1;

            IF v_employee.id IS NOT NULL AND v_cert_type.id IS NOT NULL THEN
                v_request_id := gen_random_uuid();
                v_request_number := 'CRT-' || v_tenant.code || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(i::TEXT, 5, '0');

                -- 상태 결정 (과거 신청은 대부분 발급 완료)
                v_status := CASE
                    WHEN RANDOM() < 0.7 THEN 'ISSUED'
                    WHEN RANDOM() < 0.85 THEN 'APPROVED'
                    WHEN RANDOM() < 0.95 THEN 'PENDING'
                    ELSE 'REJECTED'
                END;

                INSERT INTO hr_certificate.certificate_requests (
                    id, tenant_id, certificate_type_id, employee_id, employee_name, employee_number,
                    request_number, purpose, submission_target, copies, language,
                    include_salary, status, issued_at,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    v_request_id,
                    v_tenant.id,
                    v_cert_type.id,
                    v_employee.id,
                    v_employee.name,
                    v_employee.employee_number,
                    v_request_number,
                    v_purposes[1 + FLOOR(RANDOM() * 7)::INT],
                    v_targets[1 + FLOOR(RANDOM() * 10)::INT],
                    1 + FLOOR(RANDOM() * 3)::INT,
                    CASE WHEN RANDOM() < 0.9 THEN 'KO' ELSE 'EN' END,
                    RANDOM() < 0.3,
                    v_status,
                    CASE WHEN v_status = 'ISSUED' THEN CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL END,
                    CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL,
                    CURRENT_TIMESTAMP,
                    'system',
                    'system'
                );

                v_total_requests := v_total_requests + 1;

                -- 발급된 경우 증명서 발급 레코드 생성
                IF v_status = 'ISSUED' THEN
                    v_issue_id := gen_random_uuid();
                    v_issue_number := 'ISS-' || v_tenant.code || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(v_total_issues::TEXT, 6, '0');
                    v_verification_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));

                    INSERT INTO hr_certificate.certificate_issues (
                        id, tenant_id, request_id, issue_number, verification_code,
                        content_snapshot, issued_by, issued_at,
                        download_count, verified_count, expires_at, is_revoked,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        v_issue_id,
                        v_tenant.id,
                        v_request_id,
                        v_issue_number,
                        v_verification_code,
                        jsonb_build_object(
                            'employee_name', v_employee.name,
                            'employee_number', v_employee.employee_number,
                            'certificate_type', v_cert_type.name,
                            'issue_date', CURRENT_DATE
                        ),
                        v_employee.id,
                        CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL,
                        FLOOR(RANDOM() * 5)::INT,
                        FLOOR(RANDOM() * 3)::INT,
                        CURRENT_DATE + v_cert_type.valid_days,
                        FALSE,
                        CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL,
                        CURRENT_TIMESTAMP,
                        'system',
                        'system'
                    );

                    v_total_issues := v_total_issues + 1;
                END IF;
            END IF;
        END LOOP;

        RAISE NOTICE '  테넌트 % 완료', v_tenant.name;
    END LOOP;

    RAISE NOTICE '증명서 신청 % 건, 발급 % 건 생성 완료', v_total_requests, v_total_issues;
END $$;

-- ============================================================================
-- 진위확인 로그 생성
-- ============================================================================

DO $$
DECLARE
    v_issue RECORD;
    v_log_count INT := 0;
    v_verifier_names VARCHAR(100)[] := ARRAY['김담당', '이과장', '박대리', '최주임', '정사원', '강부장', '조차장'];
    v_organizations VARCHAR(200)[] := ARRAY['국민은행 강남지점', '하나은행 본점', '신한은행 영등포지점', '서울시청', '강남구청', '법원', '출입국관리사무소', '주식회사 ABC', '대학교 행정실'];
BEGIN
    RAISE NOTICE '진위확인 로그 생성 중...';

    -- 발급된 증명서 중 일부에 대해 진위확인 로그 생성
    FOR v_issue IN
        SELECT id, verification_code, verified_count
        FROM hr_certificate.certificate_issues
        WHERE verified_count > 0
        LIMIT 500
    LOOP
        FOR i IN 1..v_issue.verified_count LOOP
            INSERT INTO hr_certificate.verification_logs (
                issue_id, verification_code, verified_at,
                verifier_ip, verifier_user_agent, verifier_name, verifier_organization,
                is_valid, failure_reason,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_issue.id,
                v_issue.verification_code,
                CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 60) || ' days')::INTERVAL,
                '192.168.' || FLOOR(RANDOM() * 255)::INT || '.' || FLOOR(RANDOM() * 255)::INT,
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                v_verifier_names[1 + FLOOR(RANDOM() * 7)::INT],
                v_organizations[1 + FLOOR(RANDOM() * 9)::INT],
                TRUE,
                NULL,
                CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 60) || ' days')::INTERVAL,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            v_log_count := v_log_count + 1;
        END LOOP;
    END LOOP;

    -- 실패한 진위확인도 일부 생성
    FOR i IN 1..50 LOOP
        INSERT INTO hr_certificate.verification_logs (
            issue_id, verification_code, verified_at,
            verifier_ip, verifier_user_agent, verifier_name, verifier_organization,
            is_valid, failure_reason,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            NULL,
            UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12)),
            CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 60) || ' days')::INTERVAL,
            '192.168.' || FLOOR(RANDOM() * 255)::INT || '.' || FLOOR(RANDOM() * 255)::INT,
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            v_verifier_names[1 + FLOOR(RANDOM() * 7)::INT],
            v_organizations[1 + FLOOR(RANDOM() * 9)::INT],
            FALSE,
            CASE FLOOR(RANDOM() * 3)::INT
                WHEN 0 THEN 'INVALID_CODE'
                WHEN 1 THEN 'EXPIRED'
                ELSE 'REVOKED'
            END,
            CURRENT_TIMESTAMP - (FLOOR(RANDOM() * 60) || ' days')::INTERVAL,
            CURRENT_TIMESTAMP,
            'system',
            'system'
        );

        v_log_count := v_log_count + 1;
    END LOOP;

    RAISE NOTICE '진위확인 로그 % 건 생성 완료', v_log_count;
END $$;

-- ============================================================================
-- 검증
-- ============================================================================

DO $$
DECLARE
    v_template_count INT;
    v_type_count INT;
    v_request_count INT;
    v_issue_count INT;
    v_log_count INT;
BEGIN
    SELECT COUNT(*) INTO v_template_count FROM hr_certificate.certificate_templates;
    SELECT COUNT(*) INTO v_type_count FROM hr_certificate.certificate_types;
    SELECT COUNT(*) INTO v_request_count FROM hr_certificate.certificate_requests;
    SELECT COUNT(*) INTO v_issue_count FROM hr_certificate.certificate_issues;
    SELECT COUNT(*) INTO v_log_count FROM hr_certificate.verification_logs;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '증명서 서비스 샘플 데이터 생성 완료';
    RAISE NOTICE '========================================';
    RAISE NOTICE '증명서 템플릿: % 건', v_template_count;
    RAISE NOTICE '증명서 유형: % 건', v_type_count;
    RAISE NOTICE '증명서 신청: % 건', v_request_count;
    RAISE NOTICE '발급된 증명서: % 건', v_issue_count;
    RAISE NOTICE '진위확인 로그: % 건', v_log_count;
    RAISE NOTICE '========================================';
END $$;
