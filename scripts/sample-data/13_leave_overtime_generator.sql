-- ============================================================================
-- 13_leave_overtime_generator.sql
-- 휴가 신청 및 초과근무 신청 대량 생성
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 휴가 신청 생성 (최근 3개월 기준, 월 ~5,000건)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_dept RECORD;
    v_count INT := 0;
    v_leave_type VARCHAR(20);
    v_start_date DATE;
    v_end_date DATE;
    v_days_count DECIMAL(4,1);
    v_status VARCHAR(20);
    v_leave_types TEXT[] := ARRAY['ANNUAL', 'ANNUAL', 'ANNUAL', 'HALF_DAY_AM', 'HALF_DAY_PM', 'SICK', 'SPECIAL'];
    v_statuses TEXT[] := ARRAY['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'REJECTED'];
BEGIN
    RAISE NOTICE '휴가 신청 생성 중...';

    -- 각 직원의 약 20%가 휴가 신청 (평균 1-3건)
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        AND RANDOM() < 0.2  -- 20%
        ORDER BY e.tenant_id, e.id
    LOOP
        -- 부서 정보 조회
        SELECT id, name INTO v_dept
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        FOR i IN 1..FLOOR(1 + RANDOM() * 3)::INT LOOP
            -- 휴가 유형 선택
            v_leave_type := v_leave_types[1 + FLOOR(RANDOM() * array_length(v_leave_types, 1))::INT];

            -- 날짜 선택 (최근 3개월 내)
            v_start_date := CURRENT_DATE - (FLOOR(RANDOM() * 90)::INT || ' days')::INTERVAL;

            -- 휴가 일수
            IF v_leave_type IN ('HALF_DAY_AM', 'HALF_DAY_PM') THEN
                v_days_count := 0.5;
                v_end_date := v_start_date;
            ELSIF v_leave_type = 'SICK' THEN
                v_days_count := 1 + FLOOR(RANDOM() * 3);
                v_end_date := v_start_date + ((v_days_count - 1)::INT || ' days')::INTERVAL;
            ELSE
                v_days_count := 1 + FLOOR(RANDOM() * 5);
                v_end_date := v_start_date + ((v_days_count - 1)::INT || ' days')::INTERVAL;
            END IF;

            -- 상태 선택
            v_status := v_statuses[1 + FLOOR(RANDOM() * array_length(v_statuses, 1))::INT];

            -- 미래 날짜면 PENDING으로
            IF v_start_date > CURRENT_DATE THEN
                v_status := 'PENDING';
            END IF;

            INSERT INTO hr_attendance.leave_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                leave_type, start_date, end_date, days_count,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_emp.id,
                v_emp.name,
                v_emp.department_id,
                v_dept.name,
                v_leave_type,
                v_start_date,
                v_end_date,
                v_days_count,
                CASE v_leave_type
                    WHEN 'ANNUAL' THEN '개인 사유'
                    WHEN 'HALF_DAY_AM' THEN '개인 업무 (오전)'
                    WHEN 'HALF_DAY_PM' THEN '개인 업무 (오후)'
                    WHEN 'SICK' THEN '병원 방문'
                    WHEN 'SPECIAL' THEN '경조사'
                    ELSE '휴가 사유'
                END,
                v_status,
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;

            IF v_count % 5000 = 0 THEN
                RAISE NOTICE '  휴가 신청 %개 생성...', v_count;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '휴가 신청 생성 완료: %개', v_count;
END $$;

-- ============================================================================
-- 2. 초과근무 신청 생성 (최근 3개월, 월 ~3,000건)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_dept RECORD;
    v_count INT := 0;
    v_overtime_date DATE;
    v_start_time TIME;
    v_end_time TIME;
    v_status VARCHAR(20);
    v_statuses TEXT[] := ARRAY['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'REJECTED'];
BEGIN
    RAISE NOTICE '초과근무 신청 생성 중...';

    -- 각 직원의 약 15%가 초과근무 신청 (평균 2-4건)
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        AND RANDOM() < 0.15  -- 15%
        ORDER BY e.tenant_id, e.id
    LOOP
        -- 부서 정보 조회
        SELECT id, name INTO v_dept
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        FOR i IN 1..FLOOR(2 + RANDOM() * 3)::INT LOOP
            -- 날짜 선택 (최근 3개월 내, 평일만)
            v_overtime_date := CURRENT_DATE - (FLOOR(RANDOM() * 90)::INT || ' days')::INTERVAL;

            -- 주말이면 건너뛰기
            IF EXTRACT(DOW FROM v_overtime_date) IN (0, 6) THEN
                CONTINUE;
            END IF;

            -- 시간 설정
            v_start_time := '18:00'::TIME + ((FLOOR(RANDOM() * 2) * 30)::INT || ' minutes')::INTERVAL;
            v_end_time := v_start_time + ((1 + FLOOR(RANDOM() * 4))::INT || ' hours')::INTERVAL;

            -- 상태 선택
            v_status := v_statuses[1 + FLOOR(RANDOM() * array_length(v_statuses, 1))::INT];
            IF v_overtime_date > CURRENT_DATE THEN
                v_status := 'PENDING';
            END IF;

            INSERT INTO hr_attendance.overtime_request (
                tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                v_emp.tenant_id,
                v_emp.id,
                v_emp.name,
                v_emp.department_id,
                v_dept.name,
                v_overtime_date,
                v_start_time,
                v_end_time,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < CURRENT_DATE THEN v_start_time ELSE NULL END,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < CURRENT_DATE THEN v_end_time ELSE NULL END,
                EXTRACT(EPOCH FROM (v_end_time - v_start_time)) / 3600,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < CURRENT_DATE THEN EXTRACT(EPOCH FROM (v_end_time - v_start_time)) / 3600 ELSE NULL END,
                CASE
                    WHEN RANDOM() < 0.3 THEN '프로젝트 마감'
                    WHEN RANDOM() < 0.5 THEN '긴급 업무'
                    WHEN RANDOM() < 0.7 THEN '고객 대응'
                    ELSE '업무 처리'
                END,
                v_status,
                NOW(), NOW(), 'system', 'system'
            );

            v_count := v_count + 1;

            IF v_count % 5000 = 0 THEN
                RAISE NOTICE '  초과근무 신청 %개 생성...', v_count;
            END IF;
        END LOOP;
    END LOOP;

    RAISE NOTICE '초과근무 신청 생성 완료: %개', v_count;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_leave_count INT;
    v_overtime_count INT;
BEGIN
    SELECT COUNT(*) INTO v_leave_count FROM hr_attendance.leave_request;
    SELECT COUNT(*) INTO v_overtime_count FROM hr_attendance.overtime_request;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '휴가/초과근무 신청 생성 결과';
    RAISE NOTICE '========================================';
    RAISE NOTICE '휴가 신청     : %개', v_leave_count;
    RAISE NOTICE '초과근무 신청 : %개', v_overtime_count;
    RAISE NOTICE '========================================';
END $$;
