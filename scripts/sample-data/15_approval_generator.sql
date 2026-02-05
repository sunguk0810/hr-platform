-- ============================================================================
-- 15_approval_generator.sql
-- 결재 문서 대량 생성 (~30,000건)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 문서번호 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_doc_number(
    p_tenant_code VARCHAR,
    p_doc_type VARCHAR,
    p_year INT,
    p_seq INT
) RETURNS VARCHAR AS $$
BEGIN
    RETURN p_tenant_code || '-' || p_doc_type || '-' || p_year || '-' || LPAD(p_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 결재 문서 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_approval_documents() RETURNS INT AS $$
DECLARE
    v_emp RECORD;
    v_dept RECORD;
    v_manager RECORD;
    v_doc_id UUID;
    v_doc_number VARCHAR(50);
    v_doc_type VARCHAR(20);
    v_status VARCHAR(20);
    v_title VARCHAR(200);
    v_content TEXT;
    v_count INT := 0;
    v_seq INT := 0;
    v_tenant_code VARCHAR(20);
    v_submitted_at TIMESTAMP;
    v_completed_at TIMESTAMP;
    v_doc_types TEXT[] := ARRAY['LEAVE', 'LEAVE', 'LEAVE', 'OVERTIME', 'OVERTIME', 'BUSINESS_TRIP', 'EXPENSE', 'REPORT', 'GENERAL'];
    v_statuses TEXT[] := ARRAY['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'IN_PROGRESS', 'REJECTED'];
BEGIN
    RAISE NOTICE '결재 문서 생성 중...';

    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        AND RANDOM() < 0.15  -- 15%의 직원이 결재 신청
        ORDER BY e.tenant_id, e.id
    LOOP
        -- 테넌트 코드 조회
        SELECT code INTO v_tenant_code
        FROM tenant_common.tenant
        WHERE id = v_emp.tenant_id;

        -- 부서 정보 조회
        SELECT id, name INTO v_dept
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        -- 직원당 1-5건의 결재 문서 생성
        FOR i IN 1..FLOOR(1 + RANDOM() * 5)::INT LOOP
            v_seq := v_seq + 1;
            v_doc_type := v_doc_types[1 + FLOOR(RANDOM() * array_length(v_doc_types, 1))::INT];
            v_status := v_statuses[1 + FLOOR(RANDOM() * array_length(v_statuses, 1))::INT];

            -- 문서번호 생성
            v_doc_number := generate_doc_number(v_tenant_code, v_doc_type, 2025, v_seq);

            -- 제목 생성
            v_title := CASE v_doc_type
                WHEN 'LEAVE' THEN '휴가 신청 - ' || v_emp.name
                WHEN 'OVERTIME' THEN '초과근무 신청 - ' || v_emp.name
                WHEN 'BUSINESS_TRIP' THEN '출장 신청 - ' || v_emp.name
                WHEN 'EXPENSE' THEN '경비 청구 - ' || v_emp.name
                WHEN 'REPORT' THEN '업무 보고 - ' || v_emp.name
                ELSE '결재 요청 - ' || v_emp.name
            END;

            -- 내용 생성
            v_content := '결재 내용입니다. 검토 부탁드립니다.';

            -- 날짜 생성
            v_submitted_at := NOW() - ((FLOOR(RANDOM() * 90))::INT || ' days')::INTERVAL;
            v_completed_at := CASE
                WHEN v_status IN ('APPROVED', 'REJECTED') THEN v_submitted_at + ((FLOOR(1 + RANDOM() * 3))::INT || ' days')::INTERVAL
                ELSE NULL
            END;

            -- 문서 생성
            INSERT INTO hr_approval.approval_document (
                id, tenant_id, document_number, title, content,
                document_type, status,
                drafter_id, drafter_name, drafter_department_id, drafter_department_name,
                submitted_at, completed_at,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_doc_number,
                v_title,
                v_content,
                v_doc_type,
                v_status,
                v_emp.id,
                v_emp.name,
                v_emp.department_id,
                v_dept.name,
                v_submitted_at,
                v_completed_at,
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            ) RETURNING id INTO v_doc_id;

            -- 결재선 생성 (팀장)
            SELECT e.id, e.name, e.job_title_code INTO v_manager
            FROM hr_core.employee e
            JOIN hr_core.department d ON e.department_id = d.id
            WHERE d.id = v_emp.department_id
            AND e.id != v_emp.id
            AND e.job_title_code >= 'G05'
            ORDER BY e.job_title_code DESC
            LIMIT 1;

            IF v_manager.id IS NOT NULL THEN
                INSERT INTO hr_approval.approval_line (
                    id, document_id, sequence, line_type,
                    approver_id, approver_name, approver_position, approver_department_name,
                    status, action_type, comment,
                    activated_at, completed_at
                ) VALUES (
                    gen_random_uuid(), v_doc_id, 1, 'SEQUENTIAL',
                    v_manager.id, v_manager.name, v_manager.job_title_code, v_dept.name,
                    CASE
                        WHEN v_status = 'APPROVED' THEN 'APPROVED'
                        WHEN v_status = 'REJECTED' THEN 'REJECTED'
                        WHEN v_status IN ('IN_PROGRESS', 'PENDING') THEN 'WAITING'
                        ELSE 'WAITING'
                    END,
                    CASE WHEN v_status = 'APPROVED' THEN 'APPROVE' WHEN v_status = 'REJECTED' THEN 'REJECT' ELSE NULL END,
                    CASE
                        WHEN v_status = 'APPROVED' THEN '승인합니다.'
                        WHEN v_status = 'REJECTED' THEN '반려합니다. 사유를 보완해 주세요.'
                        ELSE NULL
                    END,
                    v_submitted_at,
                    v_completed_at
                );

                -- 결재 이력 생성
                IF v_status IN ('APPROVED', 'REJECTED') THEN
                    INSERT INTO hr_approval.approval_history (
                        id, document_id, actor_id, actor_name,
                        action_type, from_status, to_status, comment
                    ) VALUES (
                        gen_random_uuid(),
                        v_doc_id, v_manager.id, v_manager.name,
                        CASE WHEN v_status = 'APPROVED' THEN 'APPROVE' ELSE 'REJECT' END,
                        'PENDING', v_status,
                        CASE WHEN v_status = 'APPROVED' THEN '승인합니다.' ELSE '반려합니다.' END
                    );
                END IF;
            END IF;

            v_count := v_count + 1;

            IF v_count % 5000 = 0 THEN
                RAISE NOTICE '  결재 문서 %개 생성...', v_count;
            END IF;
        END LOOP;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 결재 문서 생성 실행
-- ============================================================================
DO $$
DECLARE
    v_count INT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '결재 문서 대량 생성 시작';
    RAISE NOTICE '========================================';

    v_count := generate_approval_documents();

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '결재 문서 생성 완료: %개', v_count;
    RAISE NOTICE '========================================';
END $$;

-- 함수 정리
DROP FUNCTION IF EXISTS generate_approval_documents;
DROP FUNCTION IF EXISTS generate_doc_number;

COMMIT;

-- ============================================================================
-- 결재 대리 규칙 생성 (일부 임원)
-- ============================================================================
BEGIN;

DO $$
DECLARE
    v_delegator RECORD;
    v_delegate RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '결재 대리 규칙 생성 중...';

    -- 본부장급 이상 직원 중 일부에게 대리 규칙 설정
    FOR v_delegator IN
        SELECT e.id, e.tenant_id, e.name
        FROM hr_core.employee e
        WHERE e.job_title_code >= 'G07'
        AND e.status = 'ACTIVE'
        AND RANDOM() < 0.1  -- 10%
        LIMIT 100
    LOOP
        -- 같은 부서의 다른 관리자를 대리인으로
        SELECT e.id, e.name INTO v_delegate
        FROM hr_core.employee e
        WHERE e.tenant_id = v_delegator.tenant_id
        AND e.id != v_delegator.id
        AND e.job_title_code >= 'G05'
        AND e.status = 'ACTIVE'
        ORDER BY RANDOM()
        LIMIT 1;

        IF v_delegate.id IS NOT NULL THEN
            INSERT INTO hr_approval.delegation_rule (
                tenant_id, delegator_id, delegator_name,
                delegate_id, delegate_name,
                start_date, end_date,
                document_types, reason, is_active,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_delegator.tenant_id,
                v_delegator.id,
                v_delegator.name,
                v_delegate.id,
                v_delegate.name,
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '30 days',
                ARRAY['LEAVE', 'OVERTIME'],
                '출장 중 결재 대리',
                true,
                NOW(), NOW(), 'system', 'system'
            );

            v_count := v_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '결재 대리 규칙 생성 완료: %개', v_count;
END $$;

COMMIT;

-- ============================================================================
-- 검증
-- ============================================================================
DO $$
DECLARE
    v_doc_count INT;
    v_line_count INT;
    v_history_count INT;
    v_delegation_count INT;
    v_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_doc_count FROM hr_approval.approval_document;
    SELECT COUNT(*) INTO v_line_count FROM hr_approval.approval_line;
    SELECT COUNT(*) INTO v_history_count FROM hr_approval.approval_history;
    SELECT COUNT(*) INTO v_delegation_count FROM hr_approval.delegation_rule;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '결재 데이터 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '결재 문서   : %개', v_doc_count;
    RAISE NOTICE '결재선      : %개', v_line_count;
    RAISE NOTICE '결재 이력   : %개', v_history_count;
    RAISE NOTICE '대리 규칙   : %개', v_delegation_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '상태별 결재 문서:';

    FOR v_record IN
        SELECT status, COUNT(*) as cnt
        FROM hr_approval.approval_document
        GROUP BY status
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '  %-15s: %개', v_record.status, v_record.cnt;
    END LOOP;
END $$;
