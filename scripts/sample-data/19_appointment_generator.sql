-- ============================================================================
-- 19_appointment_generator.sql
-- 발령 서비스 샘플 데이터 생성
-- ============================================================================
-- 생성 규모:
--   - 발령안(draft): 테넌트당 ~50건 (총 ~400건)
--   - 발령상세(detail): 발령안당 평균 10건 (총 ~4,000건)
--   - 예약발령(schedule): ~100건
--   - 발령이력(history): ~5,000건
-- ============================================================================

-- RLS 비활성화
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- ============================================================================
-- 발령안 및 발령상세 생성
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_employee RECORD;
    v_draft_id UUID;
    v_draft_number VARCHAR(50);
    v_draft_count INT;
    v_detail_count INT;
    v_effective_date DATE;
    v_status VARCHAR(20);
    v_statuses VARCHAR(20)[] := ARRAY['DRAFT', 'PENDING', 'APPROVED', 'EXECUTED', 'CANCELLED'];
    v_appointment_types VARCHAR(30)[] := ARRAY['TRANSFER', 'PROMOTION', 'DEMOTION', 'POSITION_CHANGE', 'DEPARTMENT_CHANGE', 'CONCURRENT_POSITION', 'LEAVE_OF_ABSENCE', 'RETURN_FROM_LEAVE', 'RETIREMENT'];
    v_appointment_type VARCHAR(30);
    v_from_dept RECORD;
    v_to_dept RECORD;
    v_batch_size INT := 100;
    v_total_drafts INT := 0;
    v_total_details INT := 0;
BEGIN
    RAISE NOTICE '발령 데이터 생성 시작...';

    -- 테넌트별 처리
    FOR v_tenant IN
        SELECT id, code, name FROM tenant_common.tenant ORDER BY name
    LOOP
        RAISE NOTICE '  테넌트: % 발령 데이터 생성 중...', v_tenant.name;

        -- 테넌트 규모에 따른 발령안 수 결정
        v_draft_count := CASE
            WHEN v_tenant.code = 'HANSUNG_ELEC' THEN 80
            WHEN v_tenant.code IN ('HANSUNG_LIFE', 'HANSUNG_SDI') THEN 60
            WHEN v_tenant.code IN ('HANSUNG_ENG', 'HANSUNG_CHEM') THEN 50
            ELSE 40
        END;

        -- 발령안 생성
        FOR i IN 1..v_draft_count LOOP
            v_draft_id := gen_random_uuid();
            v_draft_number := 'APT-' || v_tenant.code || '-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(i::TEXT, 5, '0');
            v_effective_date := CURRENT_DATE - (FLOOR(RANDOM() * 180)::INT) + (FLOOR(RANDOM() * 60)::INT - 30);
            v_status := v_statuses[1 + FLOOR(RANDOM() * 5)::INT];

            -- 과거 발령은 대부분 EXECUTED
            IF v_effective_date < CURRENT_DATE - 30 THEN
                v_status := CASE WHEN RANDOM() < 0.9 THEN 'EXECUTED' ELSE 'CANCELLED' END;
            ELSIF v_effective_date < CURRENT_DATE THEN
                v_status := CASE
                    WHEN RANDOM() < 0.7 THEN 'EXECUTED'
                    WHEN RANDOM() < 0.9 THEN 'APPROVED'
                    ELSE 'CANCELLED'
                END;
            ELSE
                v_status := CASE
                    WHEN RANDOM() < 0.3 THEN 'DRAFT'
                    WHEN RANDOM() < 0.7 THEN 'PENDING'
                    ELSE 'APPROVED'
                END;
            END IF;

            INSERT INTO hr_appointment.appointment_drafts (
                id, tenant_id, draft_number, title, effective_date, description, status,
                approved_at, executed_at, created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_draft_id,
                v_tenant.id,
                v_draft_number,
                TO_CHAR(v_effective_date, 'YYYY년 MM월') || ' 정기 인사발령',
                v_effective_date,
                TO_CHAR(v_effective_date, 'YYYY년 MM월 DD일') || ' 시행 인사발령 건',
                v_status,
                CASE WHEN v_status IN ('APPROVED', 'EXECUTED') THEN v_effective_date - 7 END,
                CASE WHEN v_status = 'EXECUTED' THEN v_effective_date END,
                v_effective_date - FLOOR(RANDOM() * 30)::INT,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            -- 발령상세 생성 (발령안당 5~20건)
            v_detail_count := 5 + FLOOR(RANDOM() * 16)::INT;

            FOR j IN 1..v_detail_count LOOP
                -- 랜덤 직원 선택
                SELECT e.id, e.name, e.employee_number, e.department_id
                INTO v_employee
                FROM hr_core.employee e
                WHERE e.tenant_id = v_tenant.id AND e.status = 'ACTIVE'
                ORDER BY RANDOM()
                LIMIT 1;

                IF v_employee.id IS NOT NULL THEN
                    v_appointment_type := v_appointment_types[1 + FLOOR(RANDOM() * 9)::INT];

                    -- 현재 부서
                    SELECT id, name INTO v_from_dept
                    FROM hr_core.department
                    WHERE id = v_employee.department_id;

                    -- 이동할 부서 (부서 이동 유형인 경우)
                    IF v_appointment_type IN ('TRANSFER', 'DEPARTMENT_CHANGE') THEN
                        SELECT id, name INTO v_to_dept
                        FROM hr_core.department
                        WHERE tenant_id = v_tenant.id AND id != COALESCE(v_from_dept.id, '00000000-0000-0000-0000-000000000000')
                        ORDER BY RANDOM()
                        LIMIT 1;
                    ELSE
                        v_to_dept := v_from_dept;
                    END IF;

                    INSERT INTO hr_appointment.appointment_details (
                        tenant_id, draft_id, employee_id, employee_name, employee_number,
                        appointment_type, from_department_id, from_department_name,
                        to_department_id, to_department_name,
                        from_position_code, from_position_name, to_position_code, to_position_name,
                        reason, status, executed_at,
                        created_at, updated_at, created_by, updated_by
                    ) VALUES (
                        v_tenant.id,
                        v_draft_id,
                        v_employee.id,
                        v_employee.name,
                        v_employee.employee_number,
                        v_appointment_type,
                        v_from_dept.id,
                        v_from_dept.name,
                        v_to_dept.id,
                        v_to_dept.name,
                        'P0' || (1 + FLOOR(RANDOM() * 6))::INT,
                        CASE (1 + FLOOR(RANDOM() * 6))::INT
                            WHEN 1 THEN '팀원' WHEN 2 THEN '선임' WHEN 3 THEN '책임'
                            WHEN 4 THEN '수석' WHEN 5 THEN '파트장' ELSE '팀장'
                        END,
                        'P0' || (1 + FLOOR(RANDOM() * 6))::INT,
                        CASE (1 + FLOOR(RANDOM() * 6))::INT
                            WHEN 1 THEN '팀원' WHEN 2 THEN '선임' WHEN 3 THEN '책임'
                            WHEN 4 THEN '수석' WHEN 5 THEN '파트장' ELSE '팀장'
                        END,
                        CASE v_appointment_type
                            WHEN 'TRANSFER' THEN '조직개편에 따른 전보'
                            WHEN 'PROMOTION' THEN '정기 승진'
                            WHEN 'DEMOTION' THEN '징계에 따른 강등'
                            WHEN 'POSITION_CHANGE' THEN '직책 변경'
                            WHEN 'DEPARTMENT_CHANGE' THEN '부서 변경'
                            WHEN 'CONCURRENT_POSITION' THEN '겸직 발령'
                            WHEN 'LEAVE_OF_ABSENCE' THEN '휴직 처리'
                            WHEN 'RETURN_FROM_LEAVE' THEN '휴직 복귀'
                            ELSE '정년 퇴직'
                        END,
                        CASE WHEN v_status = 'EXECUTED' THEN 'EXECUTED' ELSE 'PENDING' END,
                        CASE WHEN v_status = 'EXECUTED' THEN v_effective_date END,
                        v_effective_date - FLOOR(RANDOM() * 30)::INT,
                        CURRENT_TIMESTAMP,
                        'system',
                        'system'
                    );

                    v_total_details := v_total_details + 1;
                END IF;
            END LOOP;

            v_total_drafts := v_total_drafts + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '발령안 % 건, 발령상세 % 건 생성 완료', v_total_drafts, v_total_details;
END $$;

-- ============================================================================
-- 예약 발령 생성 (미래 발령)
-- ============================================================================

DO $$
DECLARE
    v_tenant RECORD;
    v_draft RECORD;
    v_schedule_count INT := 0;
BEGIN
    RAISE NOTICE '예약 발령 생성 중...';

    FOR v_tenant IN SELECT id, name FROM tenant_common.tenant LOOP
        -- APPROVED 상태의 미래 발령안에 대해 예약 발령 생성
        FOR v_draft IN
            SELECT id, effective_date
            FROM hr_appointment.appointment_drafts
            WHERE tenant_id = v_tenant.id
              AND status = 'APPROVED'
              AND effective_date > CURRENT_DATE
            LIMIT 20
        LOOP
            INSERT INTO hr_appointment.appointment_schedules (
                tenant_id, draft_id, scheduled_date, scheduled_time, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_tenant.id,
                v_draft.id,
                v_draft.effective_date,
                '00:00:00',
                'SCHEDULED',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                'system',
                'system'
            );

            v_schedule_count := v_schedule_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '예약 발령 % 건 생성 완료', v_schedule_count;
END $$;

-- ============================================================================
-- 발령 이력 생성 (과거 실행된 발령)
-- ============================================================================

DO $$
DECLARE
    v_detail RECORD;
    v_history_count INT := 0;
BEGIN
    RAISE NOTICE '발령 이력 생성 중...';

    -- 실행 완료된 발령 상세를 이력으로 복사
    FOR v_detail IN
        SELECT d.*, dr.effective_date, dr.draft_number
        FROM hr_appointment.appointment_details d
        JOIN hr_appointment.appointment_drafts dr ON d.draft_id = dr.id
        WHERE d.status = 'EXECUTED'
        LIMIT 5000
    LOOP
        INSERT INTO hr_appointment.appointment_histories (
            tenant_id, detail_id, employee_id, employee_name, employee_number,
            appointment_type, effective_date, from_values, to_values, reason, draft_number,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            v_detail.tenant_id,
            v_detail.id,
            v_detail.employee_id,
            v_detail.employee_name,
            v_detail.employee_number,
            v_detail.appointment_type,
            v_detail.effective_date,
            jsonb_build_object(
                'department_id', v_detail.from_department_id,
                'department_name', v_detail.from_department_name,
                'position_code', v_detail.from_position_code,
                'position_name', v_detail.from_position_name
            ),
            jsonb_build_object(
                'department_id', v_detail.to_department_id,
                'department_name', v_detail.to_department_name,
                'position_code', v_detail.to_position_code,
                'position_name', v_detail.to_position_name
            ),
            v_detail.reason,
            v_detail.draft_number,
            v_detail.executed_at,
            CURRENT_TIMESTAMP,
            'system',
            'system'
        );

        v_history_count := v_history_count + 1;
    END LOOP;

    RAISE NOTICE '발령 이력 % 건 생성 완료', v_history_count;
END $$;

-- ============================================================================
-- 검증
-- ============================================================================

DO $$
DECLARE
    v_draft_count INT;
    v_detail_count INT;
    v_schedule_count INT;
    v_history_count INT;
BEGIN
    SELECT COUNT(*) INTO v_draft_count FROM hr_appointment.appointment_drafts;
    SELECT COUNT(*) INTO v_detail_count FROM hr_appointment.appointment_details;
    SELECT COUNT(*) INTO v_schedule_count FROM hr_appointment.appointment_schedules;
    SELECT COUNT(*) INTO v_history_count FROM hr_appointment.appointment_histories;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '발령 서비스 샘플 데이터 생성 완료';
    RAISE NOTICE '========================================';
    RAISE NOTICE '발령안: % 건', v_draft_count;
    RAISE NOTICE '발령상세: % 건', v_detail_count;
    RAISE NOTICE '예약발령: % 건', v_schedule_count;
    RAISE NOTICE '발령이력: % 건', v_history_count;
    RAISE NOTICE '========================================';
END $$;
