-- ============================================================================
-- 14_approval_templates.sql
-- 결재 양식 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 각 테넌트별 결재 양식 생성
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
    v_template_id UUID;
BEGIN
    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP

        -- 1. 휴가 신청 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'LEAVE_REQUEST',
            '휴가 신청',
            'LEAVE',
            '연차, 병가 등 휴가 신청을 위한 결재 양식',
            true, 1,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 휴가 신청 결재선 (팀장 → 본부장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW());

        -- 2. 초과근무 신청 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'OVERTIME_REQUEST',
            '초과근무 신청',
            'OVERTIME',
            '연장근무, 휴일근무 신청을 위한 결재 양식',
            true, 2,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 초과근무 결재선 (팀장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW());

        -- 3. 출장 신청 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'BUSINESS_TRIP_REQUEST',
            '출장 신청',
            'BUSINESS_TRIP',
            '국내/해외 출장 신청을 위한 결재 양식',
            true, 3,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 출장 신청 결재선 (팀장 → 본부장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW());

        -- 4. 경비 청구 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'EXPENSE_CLAIM',
            '경비 청구',
            'EXPENSE',
            '업무 관련 경비 청구를 위한 결재 양식',
            true, 4,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 경비 청구 결재선 (팀장 → 재무팀)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'DEPARTMENT', NULL, '재무팀', NOW(), NOW());

        -- 5. 인사 이동 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'TRANSFER_REQUEST',
            '인사 이동',
            'TRANSFER',
            '부서/직책 이동 신청을 위한 결재 양식',
            true, 5,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 인사 이동 결재선 (팀장 → 본부장 → 인사팀)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW()),
            (v_template_id, 3, 'SEQUENTIAL', 'DEPARTMENT', NULL, '인사팀', NOW(), NOW());

        -- 6. 업무 보고 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'WORK_REPORT',
            '업무 보고',
            'REPORT',
            '정기/수시 업무 보고를 위한 결재 양식',
            true, 6,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 업무 보고 결재선 (팀장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW());

        -- 7. 구매 요청 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'PURCHASE_REQUEST',
            '구매 요청',
            'PURCHASE',
            '물품/서비스 구매 요청을 위한 결재 양식',
            true, 7,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 구매 요청 결재선 (팀장 → 본부장 → 구매팀)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW()),
            (v_template_id, 3, 'SEQUENTIAL', 'DEPARTMENT', NULL, '구매팀', NOW(), NOW());

        -- 8. 일반 결재 양식
        INSERT INTO hr_approval.approval_template (
            id, tenant_id, code, name, document_type, description, is_active, sort_order,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_tenant.id,
            'GENERAL_APPROVAL',
            '일반 결재',
            'GENERAL',
            '기타 업무 결재를 위한 일반 양식',
            true, 8,
            NOW(), NOW(), 'system', 'system'
        ) RETURNING id INTO v_template_id;

        -- 일반 결재선 (팀장 → 본부장)
        INSERT INTO hr_approval.approval_template_line (template_id, sequence, line_type, approver_type, position_code, description, created_at, updated_at)
        VALUES
            (v_template_id, 1, 'SEQUENTIAL', 'POSITION', 'P06', '팀장', NOW(), NOW()),
            (v_template_id, 2, 'SEQUENTIAL', 'POSITION', 'P08', '본부장', NOW(), NOW());

    END LOOP;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_template_count INT;
    v_line_count INT;
BEGIN
    SELECT COUNT(*) INTO v_template_count FROM hr_approval.approval_template;
    SELECT COUNT(*) INTO v_line_count FROM hr_approval.approval_template_line;

    RAISE NOTICE '결재 양식 생성 완료: %개 (8개 테넌트 x 8개 양식)', v_template_count;
    RAISE NOTICE '결재선 생성 완료: %개', v_line_count;
END $$;
