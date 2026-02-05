-- ============================================================================
-- 12_attendance_generator.sql
-- 근태 기록 대량 생성 (최근 3개월, ~4,500,000 레코드)
-- ============================================================================

-- ============================================================================
-- 근태 기록 생성 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_attendance_records(
    p_start_date DATE,
    p_end_date DATE
) RETURNS INT AS $$
DECLARE
    v_emp RECORD;
    v_date DATE;
    v_count INT := 0;
    v_batch_count INT := 0;
    v_status VARCHAR(20);
    v_check_in TIME;
    v_check_out TIME;
    v_late_minutes INT;
    v_overtime_minutes INT;
    v_work_hours DECIMAL(4,2);
    v_is_holiday BOOLEAN;
    v_day_of_week INT;
    v_tenant_holidays DATE[];
BEGIN
    RAISE NOTICE '근태 기록 생성 시작 (% ~ %)', p_start_date, p_end_date;

    FOR v_emp IN
        SELECT e.id, e.tenant_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        -- 해당 테넌트의 휴일 목록 조회
        SELECT ARRAY_AGG(holiday_date) INTO v_tenant_holidays
        FROM hr_attendance.holiday
        WHERE tenant_id = v_emp.tenant_id
        AND holiday_date BETWEEN p_start_date AND p_end_date;

        v_date := p_start_date;
        WHILE v_date <= p_end_date LOOP
            v_day_of_week := EXTRACT(DOW FROM v_date)::INT;  -- 0=일, 6=토

            -- 주말 건너뛰기
            IF v_day_of_week IN (0, 6) THEN
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- 공휴일 체크
            v_is_holiday := v_date = ANY(v_tenant_holidays);
            IF v_is_holiday THEN
                INSERT INTO hr_attendance.attendance_record (
                    id, tenant_id, employee_id, work_date, status, note,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(),
                    v_emp.tenant_id,
                    v_emp.id,
                    v_date,
                    'HOLIDAY',
                    '공휴일',
                    NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
                );
                v_count := v_count + 1;
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- 근태 상태 결정 (확률 기반)
            v_status := CASE
                WHEN RANDOM() < 0.88 THEN 'NORMAL'     -- 88% 정상
                WHEN RANDOM() < 0.91 THEN 'LATE'       -- 3% 지각
                WHEN RANDOM() < 0.96 THEN 'REMOTE_WORK' -- 5% 재택
                WHEN RANDOM() < 0.99 THEN 'ON_LEAVE'   -- 3% 휴가
                ELSE 'BUSINESS_TRIP'                    -- 1% 출장
            END;

            -- 출퇴근 시간 생성
            v_late_minutes := 0;
            v_overtime_minutes := 0;

            CASE v_status
                WHEN 'NORMAL' THEN
                    v_check_in := '08:50'::TIME + ((RANDOM() * 20)::INT || ' minutes')::INTERVAL;
                    v_check_out := '18:00'::TIME + ((RANDOM() * 120)::INT || ' minutes')::INTERVAL;
                WHEN 'LATE' THEN
                    v_check_in := '09:00'::TIME + ((5 + RANDOM() * 60)::INT || ' minutes')::INTERVAL;
                    v_check_out := '18:00'::TIME + ((RANDOM() * 60)::INT || ' minutes')::INTERVAL;
                    v_late_minutes := EXTRACT(EPOCH FROM (v_check_in - '09:00'::TIME))::INT / 60;
                WHEN 'REMOTE_WORK' THEN
                    v_check_in := '08:55'::TIME + ((RANDOM() * 10)::INT || ' minutes')::INTERVAL;
                    v_check_out := '18:00'::TIME + ((RANDOM() * 60)::INT || ' minutes')::INTERVAL;
                WHEN 'ON_LEAVE' THEN
                    v_check_in := NULL;
                    v_check_out := NULL;
                WHEN 'BUSINESS_TRIP' THEN
                    v_check_in := NULL;
                    v_check_out := NULL;
            END CASE;

            -- 근무 시간 계산
            IF v_check_in IS NOT NULL AND v_check_out IS NOT NULL THEN
                v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::DECIMAL / 3600 - 1; -- 점심 1시간 제외
                v_overtime_minutes := GREATEST(0, (v_work_hours - 8) * 60)::INT;
            ELSE
                v_work_hours := 0;
            END IF;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(),
                v_emp.tenant_id,
                v_emp.id,
                v_date,
                CASE WHEN v_check_in IS NOT NULL THEN v_date + v_check_in ELSE NULL END,
                CASE WHEN v_check_out IS NOT NULL THEN v_date + v_check_out ELSE NULL END,
                v_status,
                v_late_minutes,
                v_overtime_minutes,
                v_work_hours,
                CASE WHEN v_status = 'REMOTE_WORK' THEN '재택' ELSE '본사' END,
                CASE WHEN v_status = 'REMOTE_WORK' THEN '재택' ELSE '본사' END,
                NOW(), NOW(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'
            );

            v_count := v_count + 1;
            v_batch_count := v_batch_count + 1;

            v_date := v_date + 1;
        END LOOP;

        -- 배치 로깅
        IF v_batch_count >= 50000 THEN
            RAISE NOTICE '  근태 기록 %개 생성...', v_count;
            v_batch_count := 0;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 근태 기록 실행 (최근 3개월)
-- 성능을 위해 월별로 나누어 실행
-- ============================================================================

DO $$
DECLARE
    v_total INT := 0;
    v_month_count INT;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '근태 기록 대량 생성 시작';
    RAISE NOTICE '========================================';

    -- 2025년 11월
    v_start_date := '2025-11-01';
    v_end_date := '2025-11-30';
    RAISE NOTICE '';
    RAISE NOTICE '2025년 11월 근태 기록 생성 중...';
    v_month_count := generate_attendance_records(v_start_date, v_end_date);
    v_total := v_total + v_month_count;
    RAISE NOTICE '2025년 11월 완료: %개', v_month_count;

    -- 2025년 12월
    v_start_date := '2025-12-01';
    v_end_date := '2025-12-31';
    RAISE NOTICE '';
    RAISE NOTICE '2025년 12월 근태 기록 생성 중...';
    v_month_count := generate_attendance_records(v_start_date, v_end_date);
    v_total := v_total + v_month_count;
    RAISE NOTICE '2025년 12월 완료: %개', v_month_count;

    -- 2026년 1월
    v_start_date := '2026-01-01';
    v_end_date := '2026-01-31';
    RAISE NOTICE '';
    RAISE NOTICE '2026년 1월 근태 기록 생성 중...';
    v_month_count := generate_attendance_records(v_start_date, v_end_date);
    v_total := v_total + v_month_count;
    RAISE NOTICE '2026년 1월 완료: %개', v_month_count;

    -- 2026년 2월 (현재까지)
    v_start_date := '2026-02-01';
    v_end_date := '2026-02-05';  -- 현재 날짜까지
    RAISE NOTICE '';
    RAISE NOTICE '2026년 2월 근태 기록 생성 중...';
    v_month_count := generate_attendance_records(v_start_date, v_end_date);
    v_total := v_total + v_month_count;
    RAISE NOTICE '2026년 2월 완료: %개', v_month_count;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '근태 기록 생성 완료: 총 %개', v_total;
    RAISE NOTICE '========================================';
END $$;

-- 함수 정리
DROP FUNCTION IF EXISTS generate_attendance_records;

-- 검증
DO $$
DECLARE
    v_count INT;
    v_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_count FROM hr_attendance.attendance_record;
    RAISE NOTICE '';
    RAISE NOTICE '근태 기록 총 개수: %', v_count;
    RAISE NOTICE '';
    RAISE NOTICE '월별 근태 기록 현황:';

    FOR v_record IN
        SELECT
            TO_CHAR(work_date, 'YYYY-MM') as month,
            COUNT(*) as cnt,
            COUNT(DISTINCT employee_id) as emp_cnt
        FROM hr_attendance.attendance_record
        GROUP BY TO_CHAR(work_date, 'YYYY-MM')
        ORDER BY month
    LOOP
        RAISE NOTICE '  %: %개 (직원 %명)', v_record.month, v_record.cnt, v_record.emp_cnt;
    END LOOP;
END $$;
