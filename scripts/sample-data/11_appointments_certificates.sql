-- ============================================================================
-- 11_appointments_certificates.sql
-- 발령 & 증명서 샘플 데이터
-- ============================================================================
-- Tables (appointment):
--   appointment_draft (~20), appointment_detail (~60)
--   appointment_schedule (~5), appointment_history (~80)
-- Tables (certificate):
--   certificate_template (8 per tenant = 64), certificate_type (10 per tenant = 80)
--   certificate_request (~60), certificate_issue (~40), verification_log (~20)
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

RESET app.current_tenant;

BEGIN;

-- ============================================================================
-- PART 1: Appointment Drafts (발령안)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_hr UUID := 'e0000002-0000-0000-0000-000000000002';
    v_ceo UUID := 'e0000002-0000-0000-0000-000000000001';
    v_draft_id UUID;
BEGIN
    -- Draft 1: 2025-Q1 정기인사 (EXECUTED)
    v_draft_id := 'a0000002-0000-0000-0000-000000000001'::UUID;
    INSERT INTO hr_appointment.appointment_draft (id, tenant_id, draft_number, title, effective_date, description, status, approval_id, approved_by, approved_at, executed_at, executed_by, created_at, updated_at, created_by, updated_by)
    VALUES (v_draft_id, v_t, 'ELEC-APT-2025-001', '2025년 1분기 정기인사 발령', '2025-01-02', '2025년 1분기 정기 인사이동 및 승진 발령', 'EXECUTED', 'c0000002-0000-0000-0000-000000000006', v_ceo, NOW()-interval '45 days', NOW()-interval '40 days', v_hr, NOW()-interval '50 days', NOW()-interval '40 days', v_s, v_s)
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    -- Details for Draft 1 (3 transfers)
    INSERT INTO hr_appointment.appointment_detail (tenant_id, draft_id, employee_id, employee_name, employee_number, appointment_type, from_department_id, to_department_id, from_department_name, to_department_name, from_position_code, to_position_code, from_position_name, to_position_name, from_grade_code, to_grade_code, from_grade_name, to_grade_name, reason, status, executed_at, created_at, updated_at, created_by, updated_by)
    VALUES
    (v_t, v_draft_id, 'e0000002-0000-0000-0000-000000000005', '강선임', 'E-2024-0005', 'PROMOTION', 'd0000002-0000-0000-0000-000000000016', 'd0000002-0000-0000-0000-000000000016', '개발1팀', '개발1팀', 'P09', 'P08', '팀원', '선임', 'G11', 'G10', '사원', '대리', '우수 성과', 'EXECUTED', NOW()-interval '40 days', NOW()-interval '50 days', NOW()-interval '40 days', v_s, v_s),
    (v_t, v_draft_id, gen_random_uuid(), '임정우', 'E-2024-0015', 'TRANSFER', 'd0000002-0000-0000-0000-000000000017', 'd0000002-0000-0000-0000-000000000016', '개발2팀', '개발1팀', 'P08', 'P08', '선임', '선임', 'G10', 'G10', '대리', '대리', '조직 개편', 'EXECUTED', NOW()-interval '40 days', NOW()-interval '50 days', NOW()-interval '40 days', v_s, v_s),
    (v_t, v_draft_id, gen_random_uuid(), '한서연', 'E-2024-0020', 'TRANSFER', 'd0000002-0000-0000-0000-000000000022', 'd0000002-0000-0000-0000-000000000023', '국내영업팀', '해외영업팀', 'P08', 'P08', '선임', '선임', 'G10', 'G10', '대리', '대리', '해외 사업 확장', 'EXECUTED', NOW()-interval '40 days', NOW()-interval '50 days', NOW()-interval '40 days', v_s, v_s);

    -- Draft 2: 승진 발령 (APPROVED, not yet executed)
    v_draft_id := 'a0000002-0000-0000-0000-000000000002'::UUID;
    INSERT INTO hr_appointment.appointment_draft (id, tenant_id, draft_number, title, effective_date, description, status, approved_by, approved_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_draft_id, v_t, 'ELEC-APT-2025-002', '2025년 상반기 승진 발령', '2025-03-01', '2025년 상반기 승진 대상자 발령', 'APPROVED', v_ceo, NOW()-interval '5 days', NOW()-interval '10 days', NOW()-interval '5 days', v_s, v_s)
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    INSERT INTO hr_appointment.appointment_detail (tenant_id, draft_id, employee_id, employee_name, employee_number, appointment_type, from_grade_code, to_grade_code, from_grade_name, to_grade_name, from_position_code, to_position_code, from_position_name, to_position_name, reason, status, created_at, updated_at, created_by, updated_by)
    VALUES
    (v_t, v_draft_id, gen_random_uuid(), '최도윤', 'E-2024-0030', 'PROMOTION', 'G10', 'G09', '대리', '과장', 'P08', 'P07', '선임', '책임', '우수 업무 성과', 'PENDING', NOW()-interval '10 days', NOW(), v_s, v_s),
    (v_t, v_draft_id, gen_random_uuid(), '윤하은', 'E-2024-0035', 'PROMOTION', 'G11', 'G10', '사원', '대리', 'P09', 'P08', '팀원', '선임', '3년 이상 재직', 'PENDING', NOW()-interval '10 days', NOW(), v_s, v_s);

    -- Schedule for Draft 2
    INSERT INTO hr_appointment.appointment_schedule (tenant_id, draft_id, scheduled_date, scheduled_time, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_t, v_draft_id, '2025-03-01', '00:00:00', 'SCHEDULED', NOW()-interval '5 days', NOW(), v_s, v_s);

    -- Draft 3: DRAFT status (작성중)
    v_draft_id := 'a0000002-0000-0000-0000-000000000003'::UUID;
    INSERT INTO hr_appointment.appointment_draft (id, tenant_id, draft_number, title, effective_date, description, status, created_at, updated_at, created_by, updated_by)
    VALUES (v_draft_id, v_t, 'ELEC-APT-2025-003', '2025년 조직개편 발령(안)', '2025-04-01', '2025년 상반기 조직 개편 발령안', 'DRAFT', NOW()-interval '2 days', NOW(), v_s, v_s)
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    INSERT INTO hr_appointment.appointment_detail (tenant_id, draft_id, employee_id, employee_name, employee_number, appointment_type, from_department_id, to_department_id, from_department_name, to_department_name, reason, status, created_at, updated_at, created_by, updated_by)
    VALUES
    (v_t, v_draft_id, gen_random_uuid(), '서시우', 'E-2024-0040', 'TRANSFER', 'd0000002-0000-0000-0000-000000000026', 'd0000002-0000-0000-0000-000000000027', '생산1팀', '생산2팀', '조직 개편', 'PENDING', NOW()-interval '2 days', NOW(), v_s, v_s);

    -- Draft 4: CANCELLED
    v_draft_id := 'a0000002-0000-0000-0000-000000000004'::UUID;
    INSERT INTO hr_appointment.appointment_draft (id, tenant_id, draft_number, title, effective_date, description, status, cancelled_at, cancelled_by, cancel_reason, created_at, updated_at, created_by, updated_by)
    VALUES (v_draft_id, v_t, 'ELEC-APT-2025-004', '긴급 인사이동 (취소)', '2025-01-15', '긴급 인사이동', 'CANCELLED', NOW()-interval '30 days', v_hr, '대상자 퇴사로 취소', NOW()-interval '35 days', NOW()-interval '30 days', v_s, v_s)
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    -- Drafts for other tenants (2 per tenant)
    INSERT INTO hr_appointment.appointment_draft (tenant_id, draft_number, title, effective_date, description, status, created_at, updated_at, created_by, updated_by)
    SELECT
        t.id,
        CASE WHEN s.n = 1 THEN t_code || '-APT-2025-001' ELSE t_code || '-APT-2025-002' END,
        CASE WHEN s.n = 1 THEN '2025년 정기인사 발령' ELSE '2025년 승진 발령' END,
        CASE WHEN s.n = 1 THEN '2025-01-02'::DATE ELSE '2025-03-01'::DATE END,
        CASE WHEN s.n = 1 THEN '정기 인사이동' ELSE '승진 발령' END,
        CASE WHEN s.n = 1 THEN 'EXECUTED' ELSE 'APPROVED' END,
        NOW() - (s.n * interval '20 days'), NOW(), 'system', 'system'
    FROM (
        SELECT 'a0000001-0000-0000-0000-000000000001'::UUID as tid, 'HD' as t_code, generate_series(1,2) as n
        UNION ALL SELECT 'a0000001-0000-0000-0000-000000000003'::UUID, 'SDI', generate_series(1,2)
        UNION ALL SELECT 'a0000001-0000-0000-0000-000000000008'::UUID, 'LIFE', generate_series(1,2)
    ) s
    JOIN tenant_common.tenant t ON t.id = s.tid
    ON CONFLICT (tenant_id, draft_number) DO NOTHING;

    RAISE NOTICE 'Created appointment drafts and details';
END $$;

-- ============================================================================
-- PART 2: Appointment History (executed appointments)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    r RECORD;
BEGIN
    FOR r IN
        SELECT ad.tenant_id, ad.id as detail_id, ad.employee_id, ad.employee_name,
               ad.employee_number, ad.appointment_type, d.effective_date,
               json_build_object('department', ad.from_department_name, 'position', ad.from_position_name, 'grade', ad.from_grade_name)::JSONB as from_vals,
               json_build_object('department', ad.to_department_name, 'position', ad.to_position_name, 'grade', ad.to_grade_name)::JSONB as to_vals,
               ad.reason, d.draft_number
        FROM hr_appointment.appointment_detail ad
        JOIN hr_appointment.appointment_draft d ON d.id = ad.draft_id
        WHERE d.status = 'EXECUTED'
    LOOP
        INSERT INTO hr_appointment.appointment_history (
            tenant_id, detail_id, employee_id, employee_name, employee_number,
            appointment_type, effective_date, from_values, to_values, reason, draft_number,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            r.tenant_id, r.detail_id, r.employee_id, r.employee_name, r.employee_number,
            r.appointment_type, r.effective_date, r.from_vals, r.to_vals, r.reason, r.draft_number,
            NOW(), NOW(), v_s, v_s
        );
    END LOOP;

    RAISE NOTICE 'Created appointment history records';
END $$;

-- ============================================================================
-- PART 3: Certificate Templates (8 per tenant = 64)
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_names TEXT[] := ARRAY['재직증명서','경력증명서','퇴직증명서','급여증명서','원천징수영수증','재학증명서','건강진단서','가족관계증명서'];
    v_tid UUID;
    v_tpl_id UUID;
    i INT; j INT;
BEGIN
    FOR i IN 1..8 LOOP
        v_tid := v_tenant_ids[i];
        FOR j IN 1..8 LOOP
            v_tpl_id := ('c0' || LPAD(i::TEXT, 6, '0') || '-0000-0000-0000-' || LPAD(j::TEXT, 12, '0'))::UUID;
            INSERT INTO hr_certificate.certificate_template (
                id, tenant_id, name, description, content_html,
                header_html, footer_html, css_styles,
                page_size, orientation, margin_top, margin_bottom, margin_left, margin_right,
                include_company_seal, include_signature, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tpl_id, v_tid, v_names[j] || ' 템플릿', v_names[j] || ' PDF 생성 템플릿',
                '<html><body><h1>' || v_names[j] || '</h1><p>{{employee_name}} ({{employee_number}})</p><p>위 사실을 증명합니다.</p><p class="date">{{issue_date}}</p><p class="company">{{company_name}} 대표이사</p></body></html>',
                '<header><img src="{{logo_url}}" /><h2>{{company_name}}</h2></header>',
                '<footer><p>발급번호: {{issue_number}} | 검증코드: {{verification_code}}</p></footer>',
                'body { font-family: "Noto Sans KR"; } h1 { text-align: center; } .date { text-align: right; } .company { text-align: center; }',
                'A4', 'PORTRAIT', 25, 25, 20, 20,
                true, true, true,
                NOW(), NOW(), 'system', 'system'
            );
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created 64 certificate templates';
END $$;

-- ============================================================================
-- PART 4: Certificate Types (10 per tenant = 80)
-- ============================================================================

DO $$
DECLARE
    v_tenant_ids UUID[] := ARRAY[
        'a0000001-0000-0000-0000-000000000001'::UUID,
        'a0000001-0000-0000-0000-000000000002'::UUID,
        'a0000001-0000-0000-0000-000000000003'::UUID,
        'a0000001-0000-0000-0000-000000000004'::UUID,
        'a0000001-0000-0000-0000-000000000005'::UUID,
        'a0000001-0000-0000-0000-000000000006'::UUID,
        'a0000001-0000-0000-0000-000000000007'::UUID,
        'a0000001-0000-0000-0000-000000000008'::UUID
    ];
    v_codes TEXT[] := ARRAY['EMPLOYMENT','CAREER','RETIREMENT','SALARY','TAX_WITHHOLDING','ENROLLMENT','HEALTH','FAMILY','EXPERIENCE','LANGUAGE'];
    v_names TEXT[] := ARRAY['재직증명서','경력증명서','퇴직증명서','급여증명서','원천징수영수증','재학증명서','건강진단서','가족관계증명서','경험증명서','어학증명서'];
    v_names_en TEXT[] := ARRAY['Employment Certificate','Career Certificate','Retirement Certificate','Salary Certificate','Tax Withholding Receipt','Enrollment Certificate','Health Certificate','Family Certificate','Experience Certificate','Language Certificate'];
    v_requires_approval BOOLEAN[] := ARRAY[false, false, true, true, true, false, false, false, false, false];
    v_auto_issue BOOLEAN[] := ARRAY[true, true, false, false, false, true, true, true, true, true];
    v_valid_days INT[] := ARRAY[90, 90, 90, 30, 365, 90, 90, 90, 90, 90];
    v_fees DECIMAL[] := ARRAY[0, 0, 0, 1000, 0, 0, 0, 0, 0, 0];
    v_tid UUID; v_tpl_id UUID;
    i INT; j INT;
BEGIN
    FOR i IN 1..8 LOOP
        v_tid := v_tenant_ids[i];
        FOR j IN 1..10 LOOP
            -- Link template (use first 8, cycle for 9-10)
            v_tpl_id := ('c0' || LPAD(i::TEXT, 6, '0') || '-0000-0000-0000-' || LPAD((1 + ((j-1) % 8))::TEXT, 12, '0'))::UUID;
            INSERT INTO hr_certificate.certificate_type (
                tenant_id, code, name, name_en, description,
                template_id, requires_approval, auto_issue,
                valid_days, fee, max_copies_per_request, sort_order, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tid, v_codes[j], v_names[j], v_names_en[j],
                v_names[j] || ' 발급',
                v_tpl_id, v_requires_approval[j], v_auto_issue[j],
                v_valid_days[j], v_fees[j], 5, j, true,
                NOW(), NOW(), 'system', 'system'
            ) ON CONFLICT (tenant_id, code) DO NOTHING;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created 80 certificate types';
END $$;

-- ============================================================================
-- PART 5: Certificate Requests & Issues (한성전자 중심)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := 'system';
    v_type_id UUID;
    v_req_id UUID;
    v_issue_id UUID;
    v_dev_staff UUID := 'e0000002-0000-0000-0000-000000000006';
    v_hr_adm UUID := 'e0000002-0000-0000-0000-000000000002';
    r RECORD;
    i INT := 0;
BEGIN
    -- dev.staff 재직증명서 (ISSUED)
    SELECT id INTO v_type_id FROM hr_certificate.certificate_type WHERE tenant_id = v_t AND code = 'EMPLOYMENT';
    v_req_id := gen_random_uuid();
    INSERT INTO hr_certificate.certificate_request (
        id, tenant_id, certificate_type_id, employee_id, employee_name, employee_number,
        request_number, purpose, submission_target, copies, language,
        status, issued_at, issued_by,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        v_req_id, v_t, v_type_id, v_dev_staff, '조사원', 'E-2024-0006',
        'ELEC-CERT-2025-0001', '은행 대출용', '국민은행', 1, 'KO',
        'ISSUED', NOW()-interval '15 days', v_hr_adm,
        NOW()-interval '16 days', NOW()-interval '15 days', v_s, v_s
    ) ON CONFLICT (tenant_id, request_number) DO NOTHING;

    v_issue_id := gen_random_uuid();
    INSERT INTO hr_certificate.certificate_issue (
        id, tenant_id, request_id, issue_number, verification_code,
        issued_by, issued_at, download_count, verified_count, expires_at,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        v_issue_id, v_t, v_req_id, 'ELEC-ISS-2025-0001', 'VRF-A1B2C3D4',
        v_hr_adm, NOW()-interval '15 days', 1, 0, CURRENT_DATE + 75,
        NOW()-interval '15 days', NOW(), v_s, v_s
    ) ON CONFLICT (tenant_id, issue_number) DO NOTHING;

    -- Verification log (success)
    INSERT INTO hr_certificate.verification_log (
        issue_id, verification_code, verifier_ip, verifier_name, verifier_organization,
        is_valid, created_at, updated_at, created_by, updated_by
    ) VALUES (
        v_issue_id, 'VRF-A1B2C3D4', '203.0.113.10', '국민은행 담당자', '국민은행',
        true, NOW()-interval '10 days', NOW(), v_s, v_s
    );

    -- Bulk requests for 한성전자 employees
    FOR r IN
        SELECT e.id, e.name, e.employee_number,
               ct.id as type_id
        FROM hr_core.employee e
        CROSS JOIN hr_certificate.certificate_type ct
        WHERE e.tenant_id = v_t
          AND ct.tenant_id = v_t
          AND ct.code IN ('EMPLOYMENT', 'CAREER', 'SALARY')
          AND e.id != v_dev_staff
        ORDER BY e.id
        LIMIT 30
    LOOP
        i := i + 1;
        v_req_id := gen_random_uuid();
        INSERT INTO hr_certificate.certificate_request (
            id, tenant_id, certificate_type_id, employee_id, employee_name, employee_number,
            request_number, purpose, copies, language, status,
            issued_at, issued_by,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_req_id, v_t, r.type_id, r.id, r.name, r.employee_number,
            'ELEC-CERT-2025-' || LPAD((i + 1)::TEXT, 4, '0'),
            (ARRAY['은행 제출','관공서 제출','개인 보관','이직용'])[1 + (i % 4)],
            1, 'KO',
            (ARRAY['ISSUED','ISSUED','PENDING','REJECTED'])[1 + (i % 4)],
            CASE WHEN i % 4 < 2 THEN NOW() - (i * interval '3 days') END,
            CASE WHEN i % 4 < 2 THEN v_hr_adm END,
            NOW() - ((i + 1) * interval '3 days'), NOW(), v_s, v_s
        ) ON CONFLICT (tenant_id, request_number) DO NOTHING;

        -- Issue for ISSUED requests
        IF i % 4 < 2 THEN
            INSERT INTO hr_certificate.certificate_issue (
                tenant_id, request_id, issue_number, verification_code,
                issued_by, issued_at, download_count, expires_at,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_t, v_req_id,
                'ELEC-ISS-2025-' || LPAD((i + 1)::TEXT, 4, '0'),
                'VRF-' || UPPER(SUBSTRING(md5(i::TEXT) FROM 1 FOR 8)),
                v_hr_adm, NOW() - (i * interval '3 days'),
                CASE WHEN i % 2 = 0 THEN 1 ELSE 0 END,
                CURRENT_DATE + 90,
                NOW() - (i * interval '3 days'), NOW(), v_s, v_s
            ) ON CONFLICT (tenant_id, issue_number) DO NOTHING;
        END IF;
    END LOOP;

    -- Failed verification log
    INSERT INTO hr_certificate.verification_log (
        issue_id, verification_code, verifier_ip, verifier_name, verifier_organization,
        is_valid, failure_reason, created_at, updated_at, created_by, updated_by
    ) VALUES (
        NULL, 'VRF-INVALID99', '198.51.100.5', '사칭자', '불명',
        false, 'INVALID_CODE', NOW()-interval '5 days', NOW(), v_s, v_s
    ),
    (
        NULL, 'VRF-EXPIRED01', '198.51.100.10', '확인 담당자', '삼성화재',
        false, 'EXPIRED', NOW()-interval '3 days', NOW(), v_s, v_s
    );

    RAISE NOTICE 'Created certificate requests, issues, and verification logs';
END $$;

COMMIT;

-- Verification
SELECT 'appointment_draft' as "table", COUNT(*)::TEXT as cnt FROM hr_appointment.appointment_draft
UNION ALL SELECT 'appointment_detail', COUNT(*)::TEXT FROM hr_appointment.appointment_detail
UNION ALL SELECT 'appointment_schedule', COUNT(*)::TEXT FROM hr_appointment.appointment_schedule
UNION ALL SELECT 'appointment_history', COUNT(*)::TEXT FROM hr_appointment.appointment_history
UNION ALL SELECT 'certificate_template', COUNT(*)::TEXT FROM hr_certificate.certificate_template
UNION ALL SELECT 'certificate_type', COUNT(*)::TEXT FROM hr_certificate.certificate_type
UNION ALL SELECT 'certificate_request', COUNT(*)::TEXT FROM hr_certificate.certificate_request
UNION ALL SELECT 'certificate_issue', COUNT(*)::TEXT FROM hr_certificate.certificate_issue
UNION ALL SELECT 'verification_log', COUNT(*)::TEXT FROM hr_certificate.verification_log;
