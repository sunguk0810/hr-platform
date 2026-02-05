-- ============================================================================
-- 11_leave_balance_generator.sql
-- 휴가 잔액 대량 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 2025년, 2026년 휴가 잔액 생성
-- 근속연수에 따른 연차 계산 (기본 15일 + 근속 2년마다 1일, 최대 25일)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_years_of_service INT;
    v_annual_days DECIMAL(4,1);
    v_used_days DECIMAL(4,1);
    v_pending_days DECIMAL(4,1);
    v_carried_over DECIMAL(4,1);
BEGIN
    RAISE NOTICE '휴가 잔액 생성 중...';

    FOR v_emp IN
        SELECT id, tenant_id, hire_date, status
        FROM hr_core.employee
        WHERE status = 'ACTIVE'
        ORDER BY tenant_id, id
    LOOP
        -- 근속연수 계산
        v_years_of_service := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_emp.hire_date))::INT;

        -- 연차 계산 (기본 15일 + 2년마다 1일, 최대 25일)
        v_annual_days := LEAST(25, 15 + FLOOR(v_years_of_service / 2));

        -- 2025년 휴가 잔액
        v_used_days := FLOOR(RANDOM() * v_annual_days * 0.7);  -- 최대 70% 사용
        v_pending_days := CASE WHEN RANDOM() < 0.1 THEN FLOOR(RANDOM() * 3) ELSE 0 END;
        v_carried_over := CASE WHEN v_years_of_service >= 1 THEN LEAST(5, FLOOR(RANDOM() * 5)) ELSE 0 END;

        INSERT INTO hr_attendance.leave_balance (
            id, tenant_id, employee_id, year, leave_type,
            total_days, used_days, pending_days, carried_over_days,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_emp.id,
            2025,
            'ANNUAL',
            v_annual_days + v_carried_over,
            v_used_days,
            v_pending_days,
            v_carried_over,
            NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        -- 2025년 병가 잔액
        INSERT INTO hr_attendance.leave_balance (
            id, tenant_id, employee_id, year, leave_type,
            total_days, used_days, pending_days, carried_over_days,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_emp.id,
            2025,
            'SICK',
            10,  -- 연간 10일
            CASE WHEN RANDOM() < 0.3 THEN FLOOR(RANDOM() * 3) ELSE 0 END,
            0,
            0,
            NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        -- 2026년 휴가 잔액
        v_carried_over := LEAST(5, v_annual_days - v_used_days - v_pending_days);
        IF v_carried_over < 0 THEN v_carried_over := 0; END IF;

        INSERT INTO hr_attendance.leave_balance (
            id, tenant_id, employee_id, year, leave_type,
            total_days, used_days, pending_days, carried_over_days,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_emp.id,
            2026,
            'ANNUAL',
            v_annual_days + v_carried_over,
            FLOOR(RANDOM() * 3),  -- 2026년 초라 아직 적게 사용
            CASE WHEN RANDOM() < 0.05 THEN 1 ELSE 0 END,
            v_carried_over,
            NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        -- 2026년 병가 잔액
        INSERT INTO hr_attendance.leave_balance (
            id, tenant_id, employee_id, year, leave_type,
            total_days, used_days, pending_days, carried_over_days,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(),
            v_emp.tenant_id,
            v_emp.id,
            2026,
            'SICK',
            10,
            CASE WHEN RANDOM() < 0.1 THEN FLOOR(RANDOM() * 2) ELSE 0 END,
            0,
            0,
            NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
        );

        v_count := v_count + 4;

        IF v_count % 10000 = 0 THEN
            RAISE NOTICE '  휴가 잔액 %개 생성...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '휴가 잔액 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM hr_attendance.leave_balance;
    RAISE NOTICE '휴가 잔액 데이터 생성 완료: %개 (직원당 4개: 2025/2026 x 연차/병가)', v_count;
END $$;
