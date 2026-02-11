-- ============================================================================
-- 08_approvals.sql
-- 전자결재 샘플 데이터
-- ============================================================================
-- Tables:
--   approval_template (64), approval_template_line (~192)
--   approval_document (~250), approval_line (~400), approval_history (~350)
--   delegation_rule (2), arbitrary_approval_rule (4)
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

RESET app.current_tenant;

BEGIN;

-- ============================================================================
-- PART 1: Approval Templates (8 types × 8 tenants = 64)
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
    v_template_codes TEXT[] := ARRAY['LEAVE','OVERTIME','BUSINESS_TRIP','PURCHASE','EXPENSE','HR_CHANGE','APPOINTMENT','GENERAL'];
    v_template_names TEXT[] := ARRAY['휴가신청서','초과근무신청서','출장신청서','구매신청서','경비정산서','인사변경신청서','발령신청서','일반업무기안서'];
    v_approver_types TEXT[] := ARRAY['DIRECT_MANAGER','DEPARTMENT_HEAD','HR_MANAGER'];
    v_line_descs TEXT[] := ARRAY['직속 상관 승인','부서장/본부장 승인','인사팀장 최종 승인'];
    v_template_id UUID;
    i INT; j INT; k INT;
BEGIN
    FOR i IN 1..array_length(v_tenant_ids, 1) LOOP
        FOR j IN 1..array_length(v_template_codes, 1) LOOP
            v_template_id := ('b' || LPAD(i::TEXT, 7, '0') || '-0000-0000-0000-' || LPAD(j::TEXT, 12, '0'))::UUID;

            INSERT INTO hr_approval.approval_template (
                id, tenant_id, code, name, document_type, description,
                is_active, sort_order, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_template_id, v_tenant_ids[i], v_template_codes[j], v_template_names[j],
                v_template_codes[j], v_template_names[j] || ' 결재 템플릿',
                true, j, NOW(), NOW(), 'system', 'system'
            ) ON CONFLICT (tenant_id, code) DO NOTHING;

            FOR k IN 1..3 LOOP
                INSERT INTO hr_approval.approval_template_line (
                    id, template_id, sequence, line_type, approver_type,
                    description, created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(), v_template_id, k, 'SEQUENTIAL', v_approver_types[k],
                    v_line_descs[k], NOW(), NOW(), 'system', 'system'
                );
            END LOOP;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created 64 approval templates with 192 template lines';
END $$;

-- ============================================================================
-- PART 2: Test Account Approval Documents (한성전자)
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
    v_s TEXT := '00000000-0000-0000-0000-000000000000';
    v_n TIMESTAMPTZ := NOW();
    -- Employee UUIDs
    v_ceo    UUID := 'e0000002-0000-0000-0000-000000000001';
    v_hr_adm UUID := 'e0000002-0000-0000-0000-000000000002';
    v_hr_mgr UUID := 'e0000002-0000-0000-0000-000000000003';
    v_dev_mgr UUID := 'e0000002-0000-0000-0000-000000000004';
    v_dev_sr UUID := 'e0000002-0000-0000-0000-000000000005';
    v_dev_st UUID := 'e0000002-0000-0000-0000-000000000006';
    -- Department UUIDs
    v_dept_dev1 UUID := 'd0000002-0000-0000-0000-000000000016';
    v_dept_hr   UUID := 'd0000002-0000-0000-0000-000000000007';
    v_dept_mgmt UUID := 'd0000002-0000-0000-0000-000000000002';
    v_doc UUID;
BEGIN
    -- ---- Doc 1: dev.staff 휴가신청 (APPROVED) ----
    v_doc := 'c0000002-0000-0000-0000-000000000001'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, completed_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0001', '연차 휴가 신청 (2025.01.20~21)', '개인 사유로 연차 2일 사용합니다.', 'LEAVE', 'APPROVED', v_dev_st, '조사원', v_dept_dev1, '개발1팀', v_n - interval '30 days', v_n - interval '28 days', v_n - interval '30 days', v_n - interval '28 days', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, action_type, comment, activated_at, completed_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'APPROVED', 'APPROVE', '승인합니다.', v_n-interval '30 days', v_n-interval '29 days', v_n-interval '30 days', v_n-interval '29 days', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'APPROVED', 'APPROVE', NULL, v_n-interval '29 days', v_n-interval '28 days', v_n-interval '30 days', v_n-interval '28 days', v_s, v_s);
    INSERT INTO hr_approval.approval_history (document_id, actor_id, actor_name, action_type, from_status, to_status, step_order, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, v_dev_st, '조사원', 'SUBMIT', 'DRAFT', 'IN_PROGRESS', 0, v_n-interval '30 days', v_n-interval '30 days', v_s, v_s),
    (v_doc, v_dev_mgr, '정개발', 'APPROVE', 'IN_PROGRESS', 'IN_PROGRESS', 1, v_n-interval '29 days', v_n-interval '29 days', v_s, v_s),
    (v_doc, v_hr_adm, '김인사', 'APPROVE', 'IN_PROGRESS', 'APPROVED', 2, v_n-interval '28 days', v_n-interval '28 days', v_s, v_s);

    -- ---- Doc 2: dev.staff 출장신청 (IN_PROGRESS → dev.manager 결재대기) ----
    v_doc := 'c0000002-0000-0000-0000-000000000002'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0002', '부산 출장 신청 (2025.02.15~16)', '부산 고객사 미팅을 위한 출장입니다.', 'BUSINESS_TRIP', 'IN_PROGRESS', v_dev_st, '조사원', v_dept_dev1, '개발1팀', v_n-interval '3 days', v_n-interval '3 days', v_n-interval '3 days', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'ACTIVE', v_n-interval '3 days', v_n-interval '3 days', v_n-interval '3 days', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'WAITING', NULL, v_n-interval '3 days', v_n-interval '3 days', v_s, v_s);
    INSERT INTO hr_approval.approval_history (document_id, actor_id, actor_name, action_type, from_status, to_status, step_order, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, v_dev_st, '조사원', 'SUBMIT', 'DRAFT', 'IN_PROGRESS', 0, v_n-interval '3 days', v_n-interval '3 days', v_s, v_s);

    -- ---- Doc 3: dev.senior 휴가신청 (IN_PROGRESS → dev.manager 결재대기) ----
    v_doc := 'c0000002-0000-0000-0000-000000000003'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0003', '연차 신청 (2025.02.20)', '개인 사유 연차 1일', 'LEAVE', 'IN_PROGRESS', v_dev_sr, '강선임', v_dept_dev1, '개발1팀', v_n-interval '1 day', v_n-interval '1 day', v_n-interval '1 day', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'ACTIVE', v_n-interval '1 day', v_n-interval '1 day', v_n-interval '1 day', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'WAITING', NULL, v_n-interval '1 day', v_n-interval '1 day', v_s, v_s);

    -- ---- Doc 4: dev.senior 초과근무 (IN_PROGRESS → dev.manager 결재대기) ----
    v_doc := 'c0000002-0000-0000-0000-000000000004'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0004', '초과근무 신청 (2025.02.12 19:00~22:00)', '프로젝트 마감으로 초과근무 신청합니다.', 'OVERTIME', 'IN_PROGRESS', v_dev_sr, '강선임', v_dept_dev1, '개발1팀', v_n-interval '2 hours', v_n-interval '2 hours', v_n-interval '2 hours', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'ACTIVE', v_n-interval '2 hours', v_n-interval '2 hours', v_n-interval '2 hours', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'WAITING', NULL, v_n-interval '2 hours', v_n-interval '2 hours', v_s, v_s);

    -- ---- Doc 5: dev.staff 구매신청 (IN_PROGRESS → dev.manager 결재대기) ----
    v_doc := 'c0000002-0000-0000-0000-000000000005'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0005', '모니터 구매 신청 (Dell U2723QE 2대)', '개발팀 신규 모니터 구매 요청입니다.', 'PURCHASE', 'IN_PROGRESS', v_dev_st, '조사원', v_dept_dev1, '개발1팀', v_n-interval '5 hours', v_n-interval '5 hours', v_n-interval '5 hours', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'ACTIVE', v_n-interval '5 hours', v_n-interval '5 hours', v_n-interval '5 hours', v_s, v_s),
    (v_doc, 2, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'WAITING', NULL, v_n-interval '5 hours', v_n-interval '5 hours', v_s, v_s);

    -- ---- Doc 6: hr.admin 발령안 (APPROVED) ----
    v_doc := 'c0000002-0000-0000-0000-000000000006'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, completed_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0006', '2025년 1분기 정기인사 발령안', '2025년 1분기 정기 인사이동 및 승진 발령안입니다.', 'APPOINTMENT', 'APPROVED', v_hr_adm, '김인사', v_dept_hr, '인사팀', v_n-interval '45 days', v_n-interval '40 days', v_n-interval '45 days', v_n-interval '40 days', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, action_type, completed_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_ceo, '이전자', '대표이사', '경영지원본부', 'APPROVED', 'APPROVE', v_n-interval '40 days', v_n-interval '45 days', v_n-interval '40 days', v_s, v_s);

    -- ---- Doc 7: dev.senior 경비정산 (REJECTED) ----
    v_doc := 'c0000002-0000-0000-0000-000000000007'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, completed_at, return_count, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0007', '경비 정산 (2024.12 팀 회식)', '12월 팀 회식 경비 정산 요청입니다.', 'EXPENSE', 'REJECTED', v_dev_sr, '강선임', v_dept_dev1, '개발1팀', v_n-interval '20 days', v_n-interval '18 days', 1, v_n-interval '20 days', v_n-interval '18 days', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, action_type, comment, completed_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_dev_mgr, '정개발', '팀장', '개발1팀', 'REJECTED', 'REJECT', '영수증이 누락되었습니다.', v_n-interval '18 days', v_n-interval '20 days', v_n-interval '18 days', v_s, v_s);

    -- ---- Doc 8: dev.manager DRAFT (작성중) ----
    v_doc := 'c0000002-0000-0000-0000-000000000008'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0008', '개발장비 구매 신청 (작성중)', '팀 개발 서버 교체를 위한 장비 구매 신청입니다.', 'PURCHASE', 'DRAFT', v_dev_mgr, '정개발', v_dept_dev1, '개발1팀', v_n-interval '1 day', v_n-interval '1 day', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;

    -- ---- Doc 9: hr.manager 인사변경 → hr.admin 결재대기 ----
    v_doc := 'c0000002-0000-0000-0000-000000000009'::UUID;
    INSERT INTO hr_approval.approval_document (id, tenant_id, document_number, title, content, document_type, status, drafter_id, drafter_name, drafter_department_id, drafter_department_name, submitted_at, created_at, updated_at, created_by, updated_by)
    VALUES (v_doc, v_t, 'ELEC-APR-2025-0009', '직원 연락처 변경 요청', '직원 개인 연락처 변경 건입니다.', 'HR_CHANGE', 'IN_PROGRESS', v_hr_mgr, '박인사', v_dept_hr, '인사팀', v_n-interval '4 hours', v_n-interval '4 hours', v_n-interval '4 hours', v_s, v_s)
    ON CONFLICT (document_number) DO NOTHING;
    INSERT INTO hr_approval.approval_line (document_id, sequence, line_type, approver_id, approver_name, approver_position, approver_department_name, status, activated_at, created_at, updated_at, created_by, updated_by) VALUES
    (v_doc, 1, 'SEQUENTIAL', v_hr_adm, '김인사', '팀장', '인사팀', 'ACTIVE', v_n-interval '4 hours', v_n-interval '4 hours', v_n-interval '4 hours', v_s, v_s);

    RAISE NOTICE 'Created 9 specific approval documents for test accounts';
END $$;

-- ============================================================================
-- PART 3: Bulk Approval Document Generator (all tenants)
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
    v_prefixes TEXT[] := ARRAY['HD','ELEC','SDI','ENG','BIO','CHEM','IT','LIFE'];
    v_counts INT[] := ARRAY[15, 30, 25, 15, 10, 15, 10, 25];
    v_doc_types TEXT[] := ARRAY['LEAVE','OVERTIME','BUSINESS_TRIP','PURCHASE','EXPENSE','HR_CHANGE','APPOINTMENT','GENERAL'];
    v_statuses TEXT[] := ARRAY['APPROVED','APPROVED','APPROVED','IN_PROGRESS','IN_PROGRESS','REJECTED','DRAFT','CANCELLED'];
    v_tid UUID; v_doc_id UUID; v_emp_id UUID; v_emp_name TEXT; v_dept_id UUID; v_dept_name TEXT;
    v_approver_id UUID; v_approver_name TEXT; v_doc_type TEXT; v_status TEXT;
    v_doc_num TEXT; v_base TIMESTAMPTZ := NOW();
    i INT; j INT; v_offset INT;
BEGIN
    FOR i IN 1..8 LOOP
        v_tid := v_tenant_ids[i];
        v_offset := CASE WHEN i = 2 THEN 9 ELSE 0 END;

        FOR j IN 1..v_counts[i] LOOP
            v_doc_type := v_doc_types[1 + ((j-1) % 8)];
            v_status := v_statuses[1 + ((j-1) % 8)];
            v_doc_num := v_prefixes[i] || '-APR-2025-' || LPAD((j + v_offset)::TEXT, 4, '0');

            SELECT id, name, department_id INTO v_emp_id, v_emp_name, v_dept_id
            FROM hr_core.employee WHERE tenant_id = v_tid
            ORDER BY id OFFSET ((j-1) % 20) LIMIT 1;

            IF v_emp_id IS NULL THEN CONTINUE; END IF;
            SELECT name INTO v_dept_name FROM hr_core.department WHERE id = v_dept_id;

            v_doc_id := gen_random_uuid();
            INSERT INTO hr_approval.approval_document (
                id, tenant_id, document_number, title, content, document_type, status,
                drafter_id, drafter_name, drafter_department_id, drafter_department_name,
                submitted_at, completed_at, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_doc_id, v_tid, v_doc_num,
                v_doc_type || ' 신청 (' || v_doc_num || ')', v_doc_type || ' 관련 문서입니다.',
                v_doc_type, v_status, v_emp_id, v_emp_name, v_dept_id, v_dept_name,
                CASE WHEN v_status != 'DRAFT' THEN v_base - (j * interval '1 day') END,
                CASE WHEN v_status IN ('APPROVED','REJECTED','CANCELLED') THEN v_base - ((j-1) * interval '1 day') END,
                v_base - (j * interval '1 day'), v_base - (j * interval '1 day'), 'system', 'system'
            ) ON CONFLICT (document_number) DO NOTHING;

            IF v_status != 'DRAFT' THEN
                SELECT id, name INTO v_approver_id, v_approver_name
                FROM hr_core.employee WHERE tenant_id = v_tid AND position_code IN ('P06','P05')
                ORDER BY id LIMIT 1;

                IF v_approver_id IS NOT NULL THEN
                    INSERT INTO hr_approval.approval_line (
                        document_id, sequence, line_type, approver_id, approver_name,
                        status, action_type, completed_at, created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        v_doc_id, 1, 'SEQUENTIAL', v_approver_id, v_approver_name,
                        CASE WHEN v_status = 'APPROVED' THEN 'APPROVED'
                             WHEN v_status = 'REJECTED' THEN 'REJECTED'
                             WHEN v_status = 'IN_PROGRESS' THEN 'ACTIVE'
                             ELSE 'CANCELLED' END,
                        CASE WHEN v_status IN ('APPROVED') THEN 'APPROVE'
                             WHEN v_status = 'REJECTED' THEN 'REJECT' END,
                        CASE WHEN v_status IN ('APPROVED','REJECTED','CANCELLED') THEN v_base - ((j-1) * interval '1 day') END,
                        v_base - (j * interval '1 day'), v_base - (j * interval '1 day'), 'system', 'system'
                    );

                    INSERT INTO hr_approval.approval_history (
                        document_id, actor_id, actor_name, action_type,
                        from_status, to_status, step_order, created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        v_doc_id, v_emp_id, v_emp_name, 'SUBMIT',
                        'DRAFT', 'IN_PROGRESS', 0,
                        v_base - (j * interval '1 day'), v_base - (j * interval '1 day'), 'system', 'system'
                    );

                    IF v_status IN ('APPROVED','REJECTED') THEN
                        INSERT INTO hr_approval.approval_history (
                            document_id, actor_id, actor_name, action_type,
                            from_status, to_status, step_order, created_at, updated_at, created_by, updated_by
                        ) VALUES (
                            v_doc_id, v_approver_id, v_approver_name,
                            CASE WHEN v_status = 'APPROVED' THEN 'APPROVE' ELSE 'REJECT' END,
                            'IN_PROGRESS', v_status, 1,
                            v_base - ((j-1) * interval '1 day'), v_base - ((j-1) * interval '1 day'), 'system', 'system'
                        );
                    END IF;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Created bulk approval documents for all tenants';
END $$;

-- ============================================================================
-- PART 4: Delegation Rules & Arbitrary Approval Rules
-- ============================================================================

DO $$
DECLARE
    v_t UUID := 'a0000001-0000-0000-0000-000000000002';
BEGIN
    -- Active: 정개발 → 강선임
    INSERT INTO hr_approval.delegation_rule (tenant_id, delegator_id, delegator_name, delegate_id, delegate_name, start_date, end_date, document_types, reason, is_active, created_at, updated_at, created_by, updated_by)
    VALUES (v_t, 'e0000002-0000-0000-0000-000000000004', '정개발', 'e0000002-0000-0000-0000-000000000005', '강선임', CURRENT_DATE, CURRENT_DATE + 30, 'LEAVE,OVERTIME', '출장 기간 결재 위임', true, NOW(), NOW(), 'system', 'system');

    -- Expired: 김인사 → 박인사
    INSERT INTO hr_approval.delegation_rule (tenant_id, delegator_id, delegator_name, delegate_id, delegate_name, start_date, end_date, document_types, reason, is_active, created_at, updated_at, created_by, updated_by)
    VALUES (v_t, 'e0000002-0000-0000-0000-000000000002', '김인사', 'e0000002-0000-0000-0000-000000000003', '박인사', CURRENT_DATE - 60, CURRENT_DATE - 30, 'LEAVE,OVERTIME,HR_CHANGE,APPOINTMENT', '해외출장 기간 위임', false, NOW(), NOW(), 'system', 'system');

    -- Arbitrary approval rules
    INSERT INTO hr_approval.arbitrary_approval_rule (tenant_id, document_type, condition_type, condition_operator, condition_value, skip_to_sequence, is_active, description, created_at, updated_at, created_by, updated_by) VALUES
    (v_t, 'LEAVE', 'GRADE_LEVEL', 'LTE', '7', 99, true, '부장 이상 연차 1일 전결', NOW(), NOW(), 'system', 'system'),
    (v_t, 'PURCHASE', 'AMOUNT', 'LTE', '100000', 1, true, '10만원 이하 구매 팀장 전결', NOW(), NOW(), 'system', 'system'),
    ('a0000001-0000-0000-0000-000000000001', 'LEAVE', 'GRADE_LEVEL', 'LTE', '7', 99, true, '부장 이상 연차 1일 전결', NOW(), NOW(), 'system', 'system'),
    ('a0000001-0000-0000-0000-000000000001', 'PURCHASE', 'AMOUNT', 'LTE', '100000', 1, true, '10만원 이하 구매 팀장 전결', NOW(), NOW(), 'system', 'system');

    RAISE NOTICE 'Created delegation rules and arbitrary approval rules';
END $$;

COMMIT;

-- Verification
SELECT 'approval_template' as "table", COUNT(*)::TEXT as cnt FROM hr_approval.approval_template
UNION ALL SELECT 'approval_template_line', COUNT(*)::TEXT FROM hr_approval.approval_template_line
UNION ALL SELECT 'approval_document', COUNT(*)::TEXT FROM hr_approval.approval_document
UNION ALL SELECT 'approval_line', COUNT(*)::TEXT FROM hr_approval.approval_line
UNION ALL SELECT 'approval_history', COUNT(*)::TEXT FROM hr_approval.approval_history
UNION ALL SELECT 'delegation_rule', COUNT(*)::TEXT FROM hr_approval.delegation_rule
UNION ALL SELECT 'arbitrary_approval_rule', COUNT(*)::TEXT FROM hr_approval.arbitrary_approval_rule;
