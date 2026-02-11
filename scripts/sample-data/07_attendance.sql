-- ============================================================================
-- 07_attendance.sql
-- Step 7 of 12: Attendance/Leave sample data (holidays, leave balances,
--   attendance records, leave requests, overtime requests)
-- ============================================================================
-- 생성 규모:
--   - 공휴일:       ~296 (37 per tenant x 8 tenants)
--   - 휴가 잔액:    ~1,100+ (active employees x 2 types)
--   - 근태 기록:    ~30,000+ (active employees x ~60 work days)
--   - 휴가 신청:    ~300
--   - 초과근무 신청: ~200
--
-- UUID Convention:
--   Employee IDs:  e000000{N}-0000-0000-0000-{SSSS zero-padded to 12}
--   Tenant IDs:    a0000001-0000-0000-0000-00000000000{N}
--   Department IDs: looked up from hr_core.department
--
-- Depends on: 01_tenants.sql, 04_organization.sql, 05_employees.sql
-- ============================================================================

-- RLS bypass
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '07_attendance.sql - Attendance sample data generation start';
    RAISE NOTICE '========================================';
END $$;


-- ############################################################################
-- PART 1: HOLIDAYS (2025-2026 Korean public holidays + company holidays)
-- ~37 per tenant x 8 tenants = ~296 rows
-- ############################################################################

BEGIN;

DO $$
DECLARE
    v_tenant RECORD;
    v_count INT := 0;
BEGIN
    RAISE NOTICE '[1/5] Generating holidays...';

    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant ORDER BY id LOOP

        -- ====================================================================
        -- 2025 Korean Public / National Holidays
        -- ====================================================================
        INSERT INTO hr_attendance.holiday (
            id, tenant_id, holiday_date, name, name_en, holiday_type, is_paid, year,
            created_at, updated_at, created_by, updated_by
        ) VALUES
            -- 신정
            (gen_random_uuid(), v_tenant.id, '2025-01-01', '신정', 'New Year''s Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 설날 연휴 (1/28~1/30)
            (gen_random_uuid(), v_tenant.id, '2025-01-28', '설날 연휴', 'Lunar New Year Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-01-29', '설날', 'Lunar New Year''s Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-01-30', '설날 연휴', 'Lunar New Year Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 삼일절
            (gen_random_uuid(), v_tenant.id, '2025-03-01', '삼일절', 'Independence Movement Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 근로자의 날
            (gen_random_uuid(), v_tenant.id, '2025-05-01', '근로자의 날', 'Labor Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 어린이날
            (gen_random_uuid(), v_tenant.id, '2025-05-05', '어린이날', 'Children''s Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 부처님오신날
            (gen_random_uuid(), v_tenant.id, '2025-05-06', '부처님오신날', 'Buddha''s Birthday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 현충일
            (gen_random_uuid(), v_tenant.id, '2025-06-06', '현충일', 'Memorial Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 광복절
            (gen_random_uuid(), v_tenant.id, '2025-08-15', '광복절', 'Liberation Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 개천절
            (gen_random_uuid(), v_tenant.id, '2025-10-03', '개천절', 'National Foundation Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 추석 연휴 (10/5~10/7 + 대체휴일 10/8)
            (gen_random_uuid(), v_tenant.id, '2025-10-05', '추석 연휴', 'Chuseok Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-10-06', '추석', 'Chuseok', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-10-07', '추석 연휴', 'Chuseok Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2025-10-08', '추석 대체휴일', 'Chuseok Substitute Holiday', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 한글날
            (gen_random_uuid(), v_tenant.id, '2025-10-09', '한글날', 'Hangul Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            -- 크리스마스
            (gen_random_uuid(), v_tenant.id, '2025-12-25', '크리스마스', 'Christmas Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system')
        ON CONFLICT (tenant_id, holiday_date) DO NOTHING;

        -- ====================================================================
        -- 2026 Korean Public / National Holidays
        -- ====================================================================
        INSERT INTO hr_attendance.holiday (
            id, tenant_id, holiday_date, name, name_en, holiday_type, is_paid, year,
            created_at, updated_at, created_by, updated_by
        ) VALUES
            -- 신정
            (gen_random_uuid(), v_tenant.id, '2026-01-01', '신정', 'New Year''s Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 설날 연휴 (2/16~2/18)
            (gen_random_uuid(), v_tenant.id, '2026-02-16', '설날 연휴', 'Lunar New Year Holiday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-02-17', '설날', 'Lunar New Year''s Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-02-18', '설날 연휴', 'Lunar New Year Holiday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 삼일절 + 대체휴일
            (gen_random_uuid(), v_tenant.id, '2026-03-01', '삼일절', 'Independence Movement Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-03-02', '삼일절 대체휴일', 'Independence Movement Day Substitute', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 근로자의 날
            (gen_random_uuid(), v_tenant.id, '2026-05-01', '근로자의 날', 'Labor Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 어린이날
            (gen_random_uuid(), v_tenant.id, '2026-05-05', '어린이날', 'Children''s Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 부처님오신날 + 대체휴일
            (gen_random_uuid(), v_tenant.id, '2026-05-24', '부처님오신날', 'Buddha''s Birthday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-05-25', '부처님오신날 대체휴일', 'Buddha''s Birthday Substitute', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 현충일
            (gen_random_uuid(), v_tenant.id, '2026-06-06', '현충일', 'Memorial Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 광복절
            (gen_random_uuid(), v_tenant.id, '2026-08-15', '광복절', 'Liberation Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 추석 연휴 (9/24~9/26)
            (gen_random_uuid(), v_tenant.id, '2026-09-24', '추석 연휴', 'Chuseok Holiday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-09-25', '추석', 'Chuseok', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-09-26', '추석 연휴', 'Chuseok Holiday', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 개천절
            (gen_random_uuid(), v_tenant.id, '2026-10-03', '개천절', 'National Foundation Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 한글날
            (gen_random_uuid(), v_tenant.id, '2026-10-09', '한글날', 'Hangul Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            -- 크리스마스
            (gen_random_uuid(), v_tenant.id, '2026-12-25', '크리스마스', 'Christmas Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system')
        ON CONFLICT (tenant_id, holiday_date) DO NOTHING;

        -- ====================================================================
        -- Company Holidays (창립기념일) - different date per tenant
        -- ====================================================================
        INSERT INTO hr_attendance.holiday (
            id, tenant_id, holiday_date, name, name_en, holiday_type, is_paid, description, year,
            created_at, updated_at, created_by, updated_by
        ) VALUES
            (gen_random_uuid(), v_tenant.id, '2025-03-15', '창립기념일', 'Foundation Day', 'COMPANY', true,
             v_tenant.name || ' 창립기념일', 2025, NOW(), NOW(), 'system', 'system'),
            (gen_random_uuid(), v_tenant.id, '2026-03-15', '창립기념일', 'Foundation Day', 'COMPANY', true,
             v_tenant.name || ' 창립기념일', 2026, NOW(), NOW(), 'system', 'system')
        ON CONFLICT (tenant_id, holiday_date) DO NOTHING;

        v_count := v_count + 37;  -- 17 (2025) + 18 (2026) + 2 (company) = 37

    END LOOP;

    RAISE NOTICE '  Holidays created: % (expected ~296)', v_count;
END $$;

COMMIT;


-- ############################################################################
-- PART 2: LEAVE BALANCES (year 2026, per active employee)
-- ANNUAL + SICK for each active employee
-- Test account overrides for deterministic test data
-- ############################################################################

BEGIN;

DO $$
DECLARE
    v_emp RECORD;
    v_count INT := 0;
    v_years_of_service INT;
    v_annual_total DECIMAL(5,1);
    v_annual_used DECIMAL(5,1);
    v_annual_pending DECIMAL(5,1);
    v_carried_over DECIMAL(5,1);
    v_sick_used DECIMAL(5,1);
    v_seq INT := 0;
BEGIN
    RAISE NOTICE '[2/5] Generating leave balances for 2026...';

    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.hire_date
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        v_seq := v_seq + 1;

        -- Compute years of service as of 2026-02-11
        v_years_of_service := EXTRACT(YEAR FROM AGE('2026-02-11'::DATE, v_emp.hire_date))::INT;

        -- Annual leave total: 1yr->15, 3yr->17, 5yr->20, 10yr->25
        IF v_years_of_service < 1 THEN
            v_annual_total := 11.0;  -- prorated first year
        ELSIF v_years_of_service < 3 THEN
            v_annual_total := 15.0;
        ELSIF v_years_of_service < 5 THEN
            v_annual_total := 17.0;
        ELSIF v_years_of_service < 10 THEN
            v_annual_total := 20.0;
        ELSE
            v_annual_total := 25.0;
        END IF;

        -- Deterministic used/pending based on sequence
        v_annual_used := (v_seq % 6)::DECIMAL(5,1);      -- 0 to 5
        v_annual_pending := CASE WHEN v_seq % 7 = 0 THEN 1.0 ELSE 0.0 END;
        v_carried_over := CASE WHEN v_years_of_service >= 2 THEN LEAST(5.0, (v_seq % 4)::DECIMAL(5,1)) ELSE 0.0 END;

        -- Sick leave used: 0 or 1 deterministic
        v_sick_used := CASE WHEN v_seq % 5 = 0 THEN 1.0 ELSE 0.0 END;

        -- Insert ANNUAL leave balance
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
            v_annual_total + v_carried_over,
            v_annual_used,
            v_annual_pending,
            v_carried_over,
            NOW(), NOW(), 'system', 'system'
        ) ON CONFLICT (tenant_id, employee_id, year, leave_type) DO NOTHING;

        -- Insert SICK leave balance
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
            3.0,
            v_sick_used,
            0.0,
            0.0,
            NOW(), NOW(), 'system', 'system'
        ) ON CONFLICT (tenant_id, employee_id, year, leave_type) DO NOTHING;

        v_count := v_count + 2;
    END LOOP;

    RAISE NOTICE '  Leave balances created: % (expected ~1100+)', v_count;
END $$;

-- ============================================================================
-- Test account leave balance overrides (한성전자)
-- ============================================================================
-- dev.staff.elec: ANNUAL total=15, used=3, pending=1, carried_over=0
UPDATE hr_attendance.leave_balance
SET total_days = 15.0, used_days = 3.0, pending_days = 1.0, carried_over_days = 0.0
WHERE employee_id = 'e0000002-0000-0000-0000-000000000006'
  AND year = 2026 AND leave_type = 'ANNUAL';

-- dev.manager.elec: ANNUAL total=20, used=5, pending=0, carried_over=2
UPDATE hr_attendance.leave_balance
SET total_days = 20.0, used_days = 5.0, pending_days = 0.0, carried_over_days = 2.0
WHERE employee_id = 'e0000002-0000-0000-0000-000000000004'
  AND year = 2026 AND leave_type = 'ANNUAL';

-- hr.admin.elec: ANNUAL total=25, used=7, pending=2, carried_over=3
UPDATE hr_attendance.leave_balance
SET total_days = 25.0, used_days = 7.0, pending_days = 2.0, carried_over_days = 3.0
WHERE employee_id = 'e0000002-0000-0000-0000-000000000002'
  AND year = 2026 AND leave_type = 'ANNUAL';

COMMIT;


-- ############################################################################
-- PART 3: ATTENDANCE RECORDS (~30,000 records)
-- Last 3 months: 2025-11-11 to 2026-02-11
-- Includes: normal work days, anomalies (~8%), today check-in only
-- Plus 52-hour monitoring records for 8 designated 한성전자 employees
-- ############################################################################

BEGIN;

-- ============================================================================
-- 3.1 Main attendance record generator
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_date DATE;
    v_count INT := 0;
    v_status VARCHAR(20);
    v_check_in TIME;
    v_check_out TIME;
    v_late_minutes INT;
    v_early_leave_minutes INT;
    v_overtime_minutes INT;
    v_work_hours INT;
    v_day_of_week INT;
    v_is_holiday BOOLEAN;
    v_tenant_holidays DATE[];
    v_today DATE := '2026-02-11';
    v_start_date DATE := '2025-11-11';
    v_anomaly_seed INT;
    v_minute_offset INT;
BEGIN
    RAISE NOTICE '[3/5] Generating attendance records (2025-11-11 ~ 2026-02-11)...';

    FOR v_emp IN
        SELECT e.id, e.tenant_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        -- Cache holidays for this tenant
        SELECT COALESCE(ARRAY_AGG(holiday_date), ARRAY[]::DATE[])
        INTO v_tenant_holidays
        FROM hr_attendance.holiday
        WHERE tenant_id = v_emp.tenant_id
          AND holiday_date BETWEEN v_start_date AND v_today;

        v_date := v_start_date;

        WHILE v_date <= v_today LOOP
            v_day_of_week := EXTRACT(DOW FROM v_date)::INT;  -- 0=Sun, 6=Sat

            -- Skip weekends
            IF v_day_of_week IN (0, 6) THEN
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- Skip holidays
            v_is_holiday := v_date = ANY(v_tenant_holidays);
            IF v_is_holiday THEN
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- Deterministic anomaly seed based on employee and date
            v_anomaly_seed := (EXTRACT(DOY FROM v_date)::INT * 13 + v_count) % 100;

            -- Default values
            v_late_minutes := 0;
            v_early_leave_minutes := 0;
            v_overtime_minutes := 0;
            v_work_hours := 0;

            -- ================================================================
            -- TODAY: check-in only, no check-out
            -- ================================================================
            IF v_date = v_today THEN
                -- Morning check-in: 08:30 ~ 09:10
                v_minute_offset := (v_count * 7 + 3) % 40;  -- 0-39 minutes offset
                v_check_in := '08:30'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                v_check_out := NULL;

                IF v_check_in > '09:00'::TIME THEN
                    v_status := 'LATE';
                    v_late_minutes := EXTRACT(EPOCH FROM (v_check_in - '09:00'::TIME))::INT / 60;
                ELSE
                    v_status := 'NORMAL';
                END IF;

                INSERT INTO hr_attendance.attendance_record (
                    id, tenant_id, employee_id, work_date,
                    check_in_time, check_out_time,
                    status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                    check_in_location,
                    created_at, updated_at, created_by, updated_by
                ) VALUES (
                    gen_random_uuid(), v_emp.tenant_id, v_emp.id, v_date,
                    v_check_in, NULL,
                    v_status, v_late_minutes, 0, 0, 0,
                    '본사',
                    NOW(), NOW(), 'system', 'system'
                ) ON CONFLICT (tenant_id, employee_id, work_date) DO NOTHING;

                v_count := v_count + 1;
                v_date := v_date + 1;
                CONTINUE;
            END IF;

            -- ================================================================
            -- PAST DAYS: full check-in/check-out with ~8% anomaly rate
            -- ================================================================
            IF v_anomaly_seed < 3 THEN
                -- ~3%: ABSENT (no check-in, no check-out)
                v_status := 'ABSENT';
                v_check_in := NULL;
                v_check_out := NULL;
                v_work_hours := 0;

            ELSIF v_anomaly_seed < 6 THEN
                -- ~3%: LATE (check-in after 09:10)
                v_minute_offset := 10 + (v_count * 3) % 50;  -- 10-59 min late
                v_check_in := '09:00'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                v_check_out := '18:00'::TIME + (((v_count * 5) % 60) || ' minutes')::INTERVAL;
                v_status := 'LATE';
                v_late_minutes := v_minute_offset;
                v_work_hours := GREATEST(0, EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60);  -- minus 60 min lunch
                v_overtime_minutes := GREATEST(0, v_work_hours - 480);  -- over 8h = 480min
                v_work_hours := v_work_hours;  -- keep in minutes

            ELSIF v_anomaly_seed < 7 THEN
                -- ~1%: EARLY_LEAVE (check-out before 17:30)
                v_minute_offset := (v_count * 7) % 20;
                v_check_in := '08:30'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                v_minute_offset := 30 + (v_count * 11) % 90;  -- leave 30-120 min early
                v_check_out := '17:30'::TIME - (v_minute_offset || ' minutes')::INTERVAL;
                v_status := 'EARLY_LEAVE';
                v_early_leave_minutes := v_minute_offset;
                v_work_hours := GREATEST(0, EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60);
                v_overtime_minutes := 0;

            ELSIF v_anomaly_seed < 8 THEN
                -- ~1%: HALF_DAY (morning or afternoon)
                IF (v_count % 2) = 0 THEN
                    -- Morning half-day
                    v_check_in := '08:30'::TIME + (((v_count * 3) % 15) || ' minutes')::INTERVAL;
                    v_check_out := '13:00'::TIME;
                ELSE
                    -- Afternoon half-day
                    v_check_in := '13:00'::TIME;
                    v_check_out := '18:00'::TIME;
                END IF;
                v_status := 'HALF_DAY';
                v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60;
                v_overtime_minutes := 0;

            ELSE
                -- ~92%: NORMAL
                v_minute_offset := (v_count * 7 + 3) % 40;  -- 0-39 min for check-in (08:30~09:09)
                v_check_in := '08:30'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                -- Check-out: 17:30 ~ 19:00 range
                v_minute_offset := (v_count * 11 + 5) % 90;  -- 0-89 min for check-out (17:30~19:00)
                v_check_out := '17:30'::TIME + (v_minute_offset || ' minutes')::INTERVAL;
                v_status := 'NORMAL';
                v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;  -- minus lunch
                v_overtime_minutes := CASE WHEN v_check_out > '18:00'::TIME
                    THEN EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60
                    ELSE 0
                END;
            END IF;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                note,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.tenant_id, v_emp.id, v_date,
                v_check_in, v_check_out,
                v_status,
                v_late_minutes,
                v_early_leave_minutes,
                v_overtime_minutes,
                v_work_hours,
                CASE WHEN v_status = 'ABSENT' THEN NULL ELSE '본사' END,
                CASE WHEN v_status = 'ABSENT' THEN NULL
                     WHEN v_check_out IS NULL THEN NULL
                     ELSE '본사' END,
                CASE v_status
                    WHEN 'ABSENT' THEN '무단결근'
                    WHEN 'LATE' THEN '지각 (' || v_late_minutes || '분)'
                    WHEN 'EARLY_LEAVE' THEN '조퇴 (' || v_early_leave_minutes || '분 일찍)'
                    WHEN 'HALF_DAY' THEN '반차'
                    ELSE NULL
                END,
                NOW(), NOW(), 'system', 'system'
            ) ON CONFLICT (tenant_id, employee_id, work_date) DO NOTHING;

            v_count := v_count + 1;
            v_date := v_date + 1;
        END LOOP;

        IF v_count % 5000 = 0 THEN
            RAISE NOTICE '  Attendance records: % created...', v_count;
        END IF;
    END LOOP;

    RAISE NOTICE '  Attendance records created: % (expected ~30,000)', v_count;
END $$;

-- ============================================================================
-- 3.2  52-hour monitoring: WARNING employees (5) and EXCEEDED employees (3)
--      Override attendance for 8 specific 한성전자 employees in the current week
--      (2026-02-09 Mon ~ 2026-02-11 Wed = current week so far, plus previous week)
--
--      We use employees from various departments in 한성전자 (tenant 2).
--      Employee IDs chosen from the bulk-generated pool:
--
--      WARNING (45-51h/week) - 5 employees:
--        e0000002-0000-0000-0000-000000000010
--        e0000002-0000-0000-0000-000000000020
--        e0000002-0000-0000-0000-000000000030
--        e0000002-0000-0000-0000-000000000040
--        e0000002-0000-0000-0000-000000000050
--
--      EXCEEDED (52-55h/week) - 3 employees:
--        e0000002-0000-0000-0000-000000000060
--        e0000002-0000-0000-0000-000000000070
--        e0000002-0000-0000-0000-000000000080
-- ============================================================================

DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_emp_id UUID;
    v_date DATE;
    v_check_in TIME;
    v_check_out TIME;
    v_overtime_minutes INT;
    v_work_hours INT;
    v_count INT := 0;

    -- WARNING employees (5): extra 2-3 days/week overtime, 45-51h weekly
    v_warning_emps UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000010'::UUID,
        'e0000002-0000-0000-0000-000000000020'::UUID,
        'e0000002-0000-0000-0000-000000000030'::UUID,
        'e0000002-0000-0000-0000-000000000040'::UUID,
        'e0000002-0000-0000-0000-000000000050'::UUID
    ];

    -- EXCEEDED employees (3): overtime every day, 52-55h weekly
    v_exceeded_emps UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000060'::UUID,
        'e0000002-0000-0000-0000-000000000070'::UUID,
        'e0000002-0000-0000-0000-000000000080'::UUID
    ];

    -- Previous week (Mon-Fri) and current week (Mon-Wed) dates
    v_prev_week_dates DATE[] := ARRAY[
        '2026-02-02'::DATE, '2026-02-03'::DATE, '2026-02-04'::DATE,
        '2026-02-05'::DATE, '2026-02-06'::DATE
    ];
    v_curr_week_dates DATE[] := ARRAY[
        '2026-02-09'::DATE, '2026-02-10'::DATE
    ];
    -- Today 2026-02-11 is handled separately (check-in only)

    v_emp_idx INT;
    v_day_idx INT;
BEGIN
    RAISE NOTICE '  Generating 52h monitoring data for 8 한성전자 employees...';

    -- ====================================================================
    -- WARNING employees: 2-3 days/week with overtime (check-out 20:00~21:00)
    -- Rest of days normal (check-out 18:00~18:30)
    -- Weekly total: ~45-51 hours
    -- ====================================================================
    FOR v_emp_idx IN 1..5 LOOP
        v_emp_id := v_warning_emps[v_emp_idx];

        -- Previous week (Mon-Fri)
        FOR v_day_idx IN 1..5 LOOP
            v_date := v_prev_week_dates[v_day_idx];
            v_check_in := '08:30'::TIME + ((v_emp_idx * 3) || ' minutes')::INTERVAL;

            IF v_day_idx <= 2 + (v_emp_idx % 2) THEN
                -- Overtime days: check-out 20:00~21:00
                v_check_out := '20:00'::TIME + ((v_emp_idx * 10 + v_day_idx * 5) % 60 || ' minutes')::INTERVAL;
            ELSE
                -- Normal days: check-out 18:00~18:30
                v_check_out := '18:00'::TIME + ((v_emp_idx * 5 + v_day_idx * 3) % 30 || ' minutes')::INTERVAL;
            END IF;

            v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;
            v_overtime_minutes := GREATEST(0, EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60);

            -- Delete existing record if any, then insert
            DELETE FROM hr_attendance.attendance_record
            WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = v_date;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_date,
                v_check_in, v_check_out,
                'NORMAL', 0, 0, v_overtime_minutes, v_work_hours,
                '본사', '본사',
                NOW(), NOW(), 'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Current week (Mon-Tue): overtime days
        FOR v_day_idx IN 1..2 LOOP
            v_date := v_curr_week_dates[v_day_idx];
            v_check_in := '08:30'::TIME + ((v_emp_idx * 3) || ' minutes')::INTERVAL;
            v_check_out := '20:00'::TIME + ((v_emp_idx * 8 + v_day_idx * 7) % 60 || ' minutes')::INTERVAL;
            v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;
            v_overtime_minutes := GREATEST(0, EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60);

            DELETE FROM hr_attendance.attendance_record
            WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = v_date;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_date,
                v_check_in, v_check_out,
                'NORMAL', 0, 0, v_overtime_minutes, v_work_hours,
                '본사', '본사',
                NOW(), NOW(), 'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Today (check-in only, no check-out)
        DELETE FROM hr_attendance.attendance_record
        WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = '2026-02-11';

        INSERT INTO hr_attendance.attendance_record (
            id, tenant_id, employee_id, work_date,
            check_in_time, check_out_time,
            status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
            check_in_location,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), v_tenant_id, v_emp_id, '2026-02-11',
            '08:30'::TIME + ((v_emp_idx * 3) || ' minutes')::INTERVAL, NULL,
            'NORMAL', 0, 0, 0, 0,
            '본사',
            NOW(), NOW(), 'system', 'system'
        );
        v_count := v_count + 1;
    END LOOP;

    -- ====================================================================
    -- EXCEEDED employees: overtime every day (check-out 21:00~22:00)
    -- Weekly total: 52-55 hours
    -- ====================================================================
    FOR v_emp_idx IN 1..3 LOOP
        v_emp_id := v_exceeded_emps[v_emp_idx];

        -- Previous week (Mon-Fri): heavy overtime every day
        FOR v_day_idx IN 1..5 LOOP
            v_date := v_prev_week_dates[v_day_idx];
            v_check_in := '08:30'::TIME + ((v_emp_idx * 2) || ' minutes')::INTERVAL;
            v_check_out := '21:00'::TIME + ((v_emp_idx * 12 + v_day_idx * 8) % 60 || ' minutes')::INTERVAL;
            v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;
            v_overtime_minutes := EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60;

            DELETE FROM hr_attendance.attendance_record
            WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = v_date;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                note,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_date,
                v_check_in, v_check_out,
                'NORMAL', 0, 0, v_overtime_minutes, v_work_hours,
                '본사', '본사',
                '52시간 초과 주의',
                NOW(), NOW(), 'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Current week (Mon-Tue): heavy overtime
        FOR v_day_idx IN 1..2 LOOP
            v_date := v_curr_week_dates[v_day_idx];
            v_check_in := '08:30'::TIME + ((v_emp_idx * 2) || ' minutes')::INTERVAL;
            v_check_out := '21:30'::TIME + ((v_emp_idx * 10 + v_day_idx * 6) % 30 || ' minutes')::INTERVAL;
            v_work_hours := EXTRACT(EPOCH FROM (v_check_out - v_check_in))::INT / 60 - 60;
            v_overtime_minutes := EXTRACT(EPOCH FROM (v_check_out - '18:00'::TIME))::INT / 60;

            DELETE FROM hr_attendance.attendance_record
            WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = v_date;

            INSERT INTO hr_attendance.attendance_record (
                id, tenant_id, employee_id, work_date,
                check_in_time, check_out_time,
                status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
                check_in_location, check_out_location,
                note,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_date,
                v_check_in, v_check_out,
                'NORMAL', 0, 0, v_overtime_minutes, v_work_hours,
                '본사', '본사',
                '52시간 초과 주의',
                NOW(), NOW(), 'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Today (check-in only)
        DELETE FROM hr_attendance.attendance_record
        WHERE tenant_id = v_tenant_id AND employee_id = v_emp_id AND work_date = '2026-02-11';

        INSERT INTO hr_attendance.attendance_record (
            id, tenant_id, employee_id, work_date,
            check_in_time, check_out_time,
            status, late_minutes, early_leave_minutes, overtime_minutes, work_hours,
            check_in_location,
            note,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), v_tenant_id, v_emp_id, '2026-02-11',
            '08:30'::TIME + ((v_emp_idx * 2) || ' minutes')::INTERVAL, NULL,
            'NORMAL', 0, 0, 0, 0,
            '본사',
            '52시간 초과 주의',
            NOW(), NOW(), 'system', 'system'
        );
        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE '  52h monitoring override records: %', v_count;
END $$;

COMMIT;


-- ############################################################################
-- PART 4: LEAVE REQUESTS (~300)
-- Mix of statuses: APPROVED (60%), PENDING (20%), REJECTED (10%), DRAFT (10%)
-- Types: ANNUAL (70%), SICK (15%), FAMILY_EVENT (10%), REFRESH (5%)
-- Date range: past 3 months to next 2 weeks
-- ############################################################################

BEGIN;

-- ============================================================================
-- 4.1 Test account leave requests (한성전자)
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_dept_dram UUID;
    v_dept_dram_name TEXT;
    v_dept_hr UUID;
    v_dept_hr_name TEXT;
BEGIN
    RAISE NOTICE '[4/5] Generating leave requests...';

    -- Look up department IDs
    SELECT id, name INTO v_dept_dram, v_dept_dram_name
    FROM hr_core.department
    WHERE tenant_id = v_tenant_id AND code = 'DEV1';

    SELECT id, name INTO v_dept_hr, v_dept_hr_name
    FROM hr_core.department
    WHERE tenant_id = v_tenant_id AND code = 'HR_TEAM';

    -- ====================================================================
    -- dev.staff.elec: 3 requests
    -- ====================================================================
    -- 1) APPROVED past annual leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000006', '조사원',
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-01-15', '2026-01-16', 2.0,
        '개인 사유로 인한 연차 사용', 'APPROVED',
        '2026-01-10'::TIMESTAMPTZ, '2026-01-11'::TIMESTAMPTZ, 'system', 'system'
    );

    -- 2) PENDING future annual leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000006', '조사원',
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-20', '2026-02-20', 1.0,
        '병원 예약으로 인한 연차 신청', 'PENDING',
        NOW(), NOW(), 'system', 'system'
    );

    -- 3) REJECTED sick leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000006', '조사원',
        v_dept_dram, v_dept_dram_name,
        'SICK', '2025-12-22', '2025-12-24', 3.0,
        '감기 증상으로 인한 병가 신청', 'REJECTED',
        '2025-12-20'::TIMESTAMPTZ, '2025-12-21'::TIMESTAMPTZ, 'system', 'system'
    );

    -- ====================================================================
    -- dev.manager.elec: 2 requests
    -- ====================================================================
    -- 1) APPROVED annual leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000004', '정개발',
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-01-06', '2026-01-08', 3.0,
        '가족 여행', 'APPROVED',
        '2025-12-28'::TIMESTAMPTZ, '2025-12-29'::TIMESTAMPTZ, 'system', 'system'
    );

    -- 2) PENDING annual leave
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000004', '정개발',
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-25', '2026-02-25', 1.0,
        '개인 사유', 'PENDING',
        NOW(), NOW(), 'system', 'system'
    );

    -- ====================================================================
    -- hr.admin.elec: 2 requests
    -- ====================================================================
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000002', '김인사',
        v_dept_hr, v_dept_hr_name,
        'ANNUAL', '2025-12-29', '2025-12-30', 2.0,
        '연말 연차 소진', 'APPROVED',
        '2025-12-20'::TIMESTAMPTZ, '2025-12-22'::TIMESTAMPTZ, 'system', 'system'
    );

    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000002', '김인사',
        v_dept_hr, v_dept_hr_name,
        'FAMILY_EVENT', '2026-02-23', '2026-02-24', 2.0,
        '경조사 (결혼)', 'PENDING',
        NOW(), NOW(), 'system', 'system'
    );

    -- ====================================================================
    -- 개발1팀 (DRAM) members: overlapping APPROVED leaves with today
    -- For dashboard "팀원 휴가 현황"
    -- ====================================================================
    -- Employee 10: on leave today + tomorrow
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000010',
        (SELECT name FROM hr_core.employee WHERE id = 'e0000002-0000-0000-0000-000000000010'),
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-10', '2026-02-12', 3.0,
        '개인 사유', 'APPROVED',
        '2026-02-05'::TIMESTAMPTZ, '2026-02-06'::TIMESTAMPTZ, 'system', 'system'
    );

    -- Employee 20: on leave today only
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000020',
        (SELECT name FROM hr_core.employee WHERE id = 'e0000002-0000-0000-0000-000000000020'),
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-11', '2026-02-11', 1.0,
        '병원 방문', 'APPROVED',
        '2026-02-07'::TIMESTAMPTZ, '2026-02-08'::TIMESTAMPTZ, 'system', 'system'
    );

    -- Employee 30: on leave this week
    INSERT INTO hr_attendance.leave_request (
        id, tenant_id, employee_id, employee_name, department_id, department_name,
        leave_type, start_date, end_date, days_count, reason, status,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        gen_random_uuid(), v_tenant_id,
        'e0000002-0000-0000-0000-000000000030',
        (SELECT name FROM hr_core.employee WHERE id = 'e0000002-0000-0000-0000-000000000030'),
        v_dept_dram, v_dept_dram_name,
        'ANNUAL', '2026-02-09', '2026-02-13', 5.0,
        '해외여행', 'APPROVED',
        '2026-02-01'::TIMESTAMPTZ, '2026-02-02'::TIMESTAMPTZ, 'system', 'system'
    );

    RAISE NOTICE '  Test account leave requests: 10 created';
END $$;

-- ============================================================================
-- 4.2 Bulk leave request generator (~290 more for all tenants)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_dept_name TEXT;
    v_count INT := 0;
    v_leave_type VARCHAR(30);
    v_start_date DATE;
    v_end_date DATE;
    v_days_count DECIMAL(3,1);
    v_status VARCHAR(20);
    v_reason TEXT;
    v_seq INT := 0;
    v_type_seed INT;
    v_status_seed INT;
    v_date_offset INT;
BEGIN
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~5% of employees generate leave requests in this bulk pass
        -- (test account requests already created above)
        IF v_seq % 20 != 0 THEN
            CONTINUE;
        END IF;

        -- Skip test account employees (already handled)
        IF v_emp.id IN (
            'e0000002-0000-0000-0000-000000000001',
            'e0000002-0000-0000-0000-000000000002',
            'e0000002-0000-0000-0000-000000000003',
            'e0000002-0000-0000-0000-000000000004',
            'e0000002-0000-0000-0000-000000000005',
            'e0000002-0000-0000-0000-000000000006'
        ) THEN
            CONTINUE;
        END IF;

        -- Look up department name
        SELECT name INTO v_dept_name
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        -- Generate 1-3 leave requests per selected employee
        FOR req_num IN 1..LEAST(3, 1 + (v_seq % 3)) LOOP

            -- Leave type: ANNUAL(70%), SICK(15%), FAMILY_EVENT(10%), REFRESH(5%)
            v_type_seed := (v_seq * 7 + req_num * 13) % 100;
            IF v_type_seed < 70 THEN
                v_leave_type := 'ANNUAL';
                v_reason := CASE (v_seq + req_num) % 5
                    WHEN 0 THEN '개인 사유'
                    WHEN 1 THEN '가족 행사'
                    WHEN 2 THEN '여행'
                    WHEN 3 THEN '이사'
                    ELSE '병원 방문'
                END;
            ELSIF v_type_seed < 85 THEN
                v_leave_type := 'SICK';
                v_reason := CASE (v_seq + req_num) % 3
                    WHEN 0 THEN '감기 증상'
                    WHEN 1 THEN '병원 검진'
                    ELSE '몸살'
                END;
            ELSIF v_type_seed < 95 THEN
                v_leave_type := 'FAMILY_EVENT';
                v_reason := CASE (v_seq + req_num) % 3
                    WHEN 0 THEN '결혼식 참석'
                    WHEN 1 THEN '장례식'
                    ELSE '돌잔치'
                END;
            ELSE
                v_leave_type := 'REFRESH';
                v_reason := '리프레시 휴가';
            END IF;

            -- Date: past 3 months to 2 weeks in the future
            v_date_offset := (v_seq * 3 + req_num * 17) % 105 - 14;  -- -14 to +90 days from today
            v_start_date := '2026-02-11'::DATE - (v_date_offset || ' days')::INTERVAL;

            -- Days count
            IF v_leave_type = 'SICK' THEN
                v_days_count := (1 + (v_seq % 3))::DECIMAL(3,1);
            ELSIF v_leave_type = 'FAMILY_EVENT' THEN
                v_days_count := (1 + (v_seq % 2))::DECIMAL(3,1);
            ELSIF v_leave_type = 'REFRESH' THEN
                v_days_count := 5.0;
            ELSE
                v_days_count := (1 + (v_seq + req_num) % 5)::DECIMAL(3,1);
            END IF;
            v_end_date := v_start_date + ((v_days_count - 1)::INT || ' days')::INTERVAL;

            -- Status: APPROVED(60%), PENDING(20%), REJECTED(10%), DRAFT(10%)
            v_status_seed := (v_seq * 11 + req_num * 19) % 100;
            IF v_start_date > '2026-02-11'::DATE THEN
                -- Future requests: mostly PENDING or DRAFT
                IF v_status_seed < 60 THEN v_status := 'PENDING';
                ELSIF v_status_seed < 80 THEN v_status := 'DRAFT';
                ELSIF v_status_seed < 90 THEN v_status := 'APPROVED';
                ELSE v_status := 'REJECTED';
                END IF;
            ELSE
                -- Past requests
                IF v_status_seed < 60 THEN v_status := 'APPROVED';
                ELSIF v_status_seed < 80 THEN v_status := 'PENDING';
                ELSIF v_status_seed < 90 THEN v_status := 'REJECTED';
                ELSE v_status := 'DRAFT';
                END IF;
            END IF;

            INSERT INTO hr_attendance.leave_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                leave_type, start_date, end_date, days_count,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.tenant_id, v_emp.id, v_emp.name,
                v_emp.department_id, v_dept_name,
                v_leave_type, v_start_date, v_end_date, v_days_count,
                v_reason, v_status,
                LEAST(v_start_date - INTERVAL '3 days', NOW()),
                LEAST(v_start_date - INTERVAL '1 day', NOW()),
                'system', 'system'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '  Bulk leave requests created: %', v_count;
END $$;

COMMIT;


-- ############################################################################
-- PART 5: OVERTIME REQUESTS (~200)
-- Status: APPROVED (50%), PENDING (30%), REJECTED (20%)
-- Date range: past 3 months
-- Includes matching overtime requests for 52h monitoring employees
-- ############################################################################

BEGIN;

-- ============================================================================
-- 5.1 Overtime requests for 52-hour monitoring employees
-- ============================================================================
DO $$
DECLARE
    v_tenant_id UUID := 'a0000001-0000-0000-0000-000000000002';
    v_emp_id UUID;
    v_emp_name TEXT;
    v_dept_id UUID;
    v_dept_name TEXT;
    v_date DATE;
    v_count INT := 0;

    v_warning_emps UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000010'::UUID,
        'e0000002-0000-0000-0000-000000000020'::UUID,
        'e0000002-0000-0000-0000-000000000030'::UUID,
        'e0000002-0000-0000-0000-000000000040'::UUID,
        'e0000002-0000-0000-0000-000000000050'::UUID
    ];
    v_exceeded_emps UUID[] := ARRAY[
        'e0000002-0000-0000-0000-000000000060'::UUID,
        'e0000002-0000-0000-0000-000000000070'::UUID,
        'e0000002-0000-0000-0000-000000000080'::UUID
    ];

    v_prev_week_dates DATE[] := ARRAY[
        '2026-02-02'::DATE, '2026-02-03'::DATE, '2026-02-04'::DATE,
        '2026-02-05'::DATE, '2026-02-06'::DATE
    ];
    v_curr_week_dates DATE[] := ARRAY[
        '2026-02-09'::DATE, '2026-02-10'::DATE, '2026-02-11'::DATE
    ];

    v_emp_idx INT;
    v_day_idx INT;
    v_start_time TIME;
    v_end_time TIME;
    v_planned_hours DECIMAL(4,2);
BEGIN
    RAISE NOTICE '[5/5] Generating overtime requests...';
    RAISE NOTICE '  Generating 52h monitoring overtime requests...';

    -- WARNING employees: overtime requests for 2-3 days per week
    FOR v_emp_idx IN 1..5 LOOP
        v_emp_id := v_warning_emps[v_emp_idx];
        SELECT name, department_id INTO v_emp_name, v_dept_id
        FROM hr_core.employee WHERE id = v_emp_id;
        SELECT name INTO v_dept_name FROM hr_core.department WHERE id = v_dept_id;

        -- Previous week: overtime on first 2-3 days
        FOR v_day_idx IN 1..(2 + (v_emp_idx % 2)) LOOP
            v_date := v_prev_week_dates[v_day_idx];
            v_start_time := '18:00'::TIME + ((v_emp_idx * 5) % 30 || ' minutes')::INTERVAL;
            v_end_time := '20:00'::TIME + ((v_emp_idx * 10 + v_day_idx * 5) % 60 || ' minutes')::INTERVAL;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_emp_name,
                v_dept_id, v_dept_name,
                v_date, v_start_time, v_end_time,
                v_start_time, v_end_time,
                v_planned_hours, v_planned_hours,
                '프로젝트 마감 임박', 'APPROVED',
                (v_date - INTERVAL '1 day')::TIMESTAMPTZ,
                v_date::TIMESTAMPTZ,
                'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Current week: overtime requests (APPROVED for past days, PENDING for today)
        FOR v_day_idx IN 1..3 LOOP
            v_date := v_curr_week_dates[v_day_idx];
            v_start_time := '18:00'::TIME + ((v_emp_idx * 5) % 30 || ' minutes')::INTERVAL;
            v_end_time := '20:00'::TIME + ((v_emp_idx * 8 + v_day_idx * 7) % 60 || ' minutes')::INTERVAL;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_emp_name,
                v_dept_id, v_dept_name,
                v_date, v_start_time, v_end_time,
                CASE WHEN v_date < '2026-02-11' THEN v_start_time ELSE NULL END,
                CASE WHEN v_date < '2026-02-11' THEN v_end_time ELSE NULL END,
                v_planned_hours,
                CASE WHEN v_date < '2026-02-11' THEN v_planned_hours ELSE NULL END,
                '프로젝트 마감 임박',
                CASE WHEN v_date < '2026-02-11' THEN 'APPROVED' ELSE 'PENDING' END,
                (v_date - INTERVAL '1 day')::TIMESTAMPTZ,
                CASE WHEN v_date < '2026-02-11' THEN v_date::TIMESTAMPTZ ELSE NOW() END,
                'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    -- EXCEEDED employees: overtime requests every day
    FOR v_emp_idx IN 1..3 LOOP
        v_emp_id := v_exceeded_emps[v_emp_idx];
        SELECT name, department_id INTO v_emp_name, v_dept_id
        FROM hr_core.employee WHERE id = v_emp_id;
        SELECT name INTO v_dept_name FROM hr_core.department WHERE id = v_dept_id;

        -- Previous week: all 5 days
        FOR v_day_idx IN 1..5 LOOP
            v_date := v_prev_week_dates[v_day_idx];
            v_start_time := '18:00'::TIME + ((v_emp_idx * 3) % 20 || ' minutes')::INTERVAL;
            v_end_time := '21:00'::TIME + ((v_emp_idx * 12 + v_day_idx * 8) % 60 || ' minutes')::INTERVAL;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_emp_name,
                v_dept_id, v_dept_name,
                v_date, v_start_time, v_end_time,
                v_start_time, v_end_time,
                v_planned_hours, v_planned_hours,
                '긴급 장애 대응', 'APPROVED',
                (v_date - INTERVAL '1 day')::TIMESTAMPTZ,
                v_date::TIMESTAMPTZ,
                'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;

        -- Current week: Mon-Wed
        FOR v_day_idx IN 1..3 LOOP
            v_date := v_curr_week_dates[v_day_idx];
            v_start_time := '18:00'::TIME + ((v_emp_idx * 3) % 20 || ' minutes')::INTERVAL;
            v_end_time := '21:30'::TIME + ((v_emp_idx * 10 + v_day_idx * 6) % 30 || ' minutes')::INTERVAL;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_tenant_id, v_emp_id, v_emp_name,
                v_dept_id, v_dept_name,
                v_date, v_start_time, v_end_time,
                CASE WHEN v_date < '2026-02-11' THEN v_start_time ELSE NULL END,
                CASE WHEN v_date < '2026-02-11' THEN v_end_time ELSE NULL END,
                v_planned_hours,
                CASE WHEN v_date < '2026-02-11' THEN v_planned_hours ELSE NULL END,
                '긴급 장애 대응',
                CASE WHEN v_date < '2026-02-11' THEN 'APPROVED' ELSE 'PENDING' END,
                (v_date - INTERVAL '1 day')::TIMESTAMPTZ,
                CASE WHEN v_date < '2026-02-11' THEN v_date::TIMESTAMPTZ ELSE NOW() END,
                'system', 'system'
            );
            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '  52h monitoring overtime requests: %', v_count;
END $$;

-- ============================================================================
-- 5.2 Bulk overtime request generator (~140 more across all tenants)
-- ============================================================================
DO $$
DECLARE
    v_emp RECORD;
    v_dept_name TEXT;
    v_count INT := 0;
    v_overtime_date DATE;
    v_start_time TIME;
    v_end_time TIME;
    v_planned_hours DECIMAL(4,2);
    v_status VARCHAR(20);
    v_reason TEXT;
    v_seq INT := 0;
    v_status_seed INT;
    v_day_of_week INT;
BEGIN
    FOR v_emp IN
        SELECT e.id, e.tenant_id, e.name, e.department_id
        FROM hr_core.employee e
        WHERE e.status = 'ACTIVE'
        ORDER BY e.tenant_id, e.id
    LOOP
        v_seq := v_seq + 1;

        -- Only ~3% of employees get overtime requests in this bulk pass
        IF v_seq % 33 != 0 THEN
            CONTINUE;
        END IF;

        -- Skip 52h monitoring employees (already handled)
        IF v_emp.id IN (
            'e0000002-0000-0000-0000-000000000010',
            'e0000002-0000-0000-0000-000000000020',
            'e0000002-0000-0000-0000-000000000030',
            'e0000002-0000-0000-0000-000000000040',
            'e0000002-0000-0000-0000-000000000050',
            'e0000002-0000-0000-0000-000000000060',
            'e0000002-0000-0000-0000-000000000070',
            'e0000002-0000-0000-0000-000000000080'
        ) THEN
            CONTINUE;
        END IF;

        -- Department name
        SELECT name INTO v_dept_name
        FROM hr_core.department
        WHERE id = v_emp.department_id;

        -- Generate 1-3 overtime requests
        FOR req_num IN 1..LEAST(3, 1 + (v_seq % 3)) LOOP
            -- Date within past 3 months (weekdays only)
            v_overtime_date := '2026-02-11'::DATE - ((v_seq * 3 + req_num * 11) % 90 || ' days')::INTERVAL;
            v_day_of_week := EXTRACT(DOW FROM v_overtime_date)::INT;
            IF v_day_of_week IN (0, 6) THEN
                v_overtime_date := v_overtime_date + CASE WHEN v_day_of_week = 0 THEN 1 ELSE 2 END;
            END IF;

            -- Time: start 18:00-19:00, end 20:00-22:00
            v_start_time := '18:00'::TIME + (((v_seq + req_num) * 5) % 60 || ' minutes')::INTERVAL;
            v_end_time := '20:00'::TIME + (((v_seq + req_num) * 11) % 120 || ' minutes')::INTERVAL;
            IF v_end_time <= v_start_time THEN
                v_end_time := v_start_time + INTERVAL '2 hours';
            END IF;
            v_planned_hours := EXTRACT(EPOCH FROM (v_end_time - v_start_time))::DECIMAL / 3600;

            -- Status: APPROVED(50%), PENDING(30%), REJECTED(20%)
            v_status_seed := (v_seq * 7 + req_num * 13) % 100;
            IF v_status_seed < 50 THEN v_status := 'APPROVED';
            ELSIF v_status_seed < 80 THEN v_status := 'PENDING';
            ELSE v_status := 'REJECTED';
            END IF;

            -- Reason
            v_reason := CASE (v_seq + req_num) % 5
                WHEN 0 THEN '프로젝트 마감'
                WHEN 1 THEN '긴급 업무 처리'
                WHEN 2 THEN '고객 대응'
                WHEN 3 THEN '시스템 배포'
                ELSE '보고서 작성'
            END;

            INSERT INTO hr_attendance.overtime_request (
                id, tenant_id, employee_id, employee_name,
                department_id, department_name,
                overtime_date, start_time, end_time,
                actual_start_time, actual_end_time,
                planned_hours, actual_hours,
                reason, status,
                created_at, updated_at, created_by, updated_by
            ) VALUES (
                gen_random_uuid(), v_emp.tenant_id, v_emp.id, v_emp.name,
                v_emp.department_id, v_dept_name,
                v_overtime_date, v_start_time, v_end_time,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < '2026-02-11' THEN v_start_time ELSE NULL END,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < '2026-02-11' THEN v_end_time ELSE NULL END,
                v_planned_hours,
                CASE WHEN v_status = 'APPROVED' AND v_overtime_date < '2026-02-11' THEN v_planned_hours ELSE NULL END,
                v_reason,
                v_status,
                LEAST(v_overtime_date::TIMESTAMPTZ - INTERVAL '1 day', NOW()),
                LEAST(v_overtime_date::TIMESTAMPTZ, NOW()),
                'system', 'system'
            );

            v_count := v_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE '  Bulk overtime requests created: %', v_count;
END $$;

COMMIT;


-- ############################################################################
-- VERIFICATION
-- ############################################################################

DO $$
DECLARE
    v_holidays INT;
    v_leave_balances INT;
    v_attendance_records INT;
    v_leave_requests INT;
    v_overtime_requests INT;
    v_record RECORD;
BEGIN
    SELECT COUNT(*) INTO v_holidays FROM hr_attendance.holiday;
    SELECT COUNT(*) INTO v_leave_balances FROM hr_attendance.leave_balance;
    SELECT COUNT(*) INTO v_attendance_records FROM hr_attendance.attendance_record;
    SELECT COUNT(*) INTO v_leave_requests FROM hr_attendance.leave_request;
    SELECT COUNT(*) INTO v_overtime_requests FROM hr_attendance.overtime_request;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '07_attendance.sql Verification';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  Holidays:           % (expected ~296)', v_holidays;
    RAISE NOTICE '  Leave balances:     % (expected ~1,100+)', v_leave_balances;
    RAISE NOTICE '  Attendance records: % (expected ~30,000)', v_attendance_records;
    RAISE NOTICE '  Leave requests:     % (expected ~300)', v_leave_requests;
    RAISE NOTICE '  Overtime requests:  % (expected ~200)', v_overtime_requests;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- Attendance breakdown by status
    RAISE NOTICE '  Attendance by status:';
    FOR v_record IN
        SELECT status, COUNT(*) AS cnt
        FROM hr_attendance.attendance_record
        GROUP BY status
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '    %-15s: %', v_record.status, v_record.cnt;
    END LOOP;

    RAISE NOTICE '';

    -- Monthly attendance breakdown
    RAISE NOTICE '  Attendance by month:';
    FOR v_record IN
        SELECT TO_CHAR(work_date, 'YYYY-MM') AS month,
               COUNT(*) AS cnt,
               COUNT(DISTINCT employee_id) AS emp_cnt
        FROM hr_attendance.attendance_record
        GROUP BY TO_CHAR(work_date, 'YYYY-MM')
        ORDER BY month
    LOOP
        RAISE NOTICE '    %: % records (% employees)', v_record.month, v_record.cnt, v_record.emp_cnt;
    END LOOP;

    RAISE NOTICE '';

    -- Leave request breakdown by status
    RAISE NOTICE '  Leave requests by status:';
    FOR v_record IN
        SELECT status, COUNT(*) AS cnt
        FROM hr_attendance.leave_request
        GROUP BY status
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '    %-10s: %', v_record.status, v_record.cnt;
    END LOOP;

    RAISE NOTICE '';

    -- Overtime request breakdown by status
    RAISE NOTICE '  Overtime requests by status:';
    FOR v_record IN
        SELECT status, COUNT(*) AS cnt
        FROM hr_attendance.overtime_request
        GROUP BY status
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '    %-10s: %', v_record.status, v_record.cnt;
    END LOOP;

    RAISE NOTICE '';

    -- Test account leave balance verification
    RAISE NOTICE '  Test account leave balances (한성전자, 2026 ANNUAL):';
    FOR v_record IN
        SELECT e.name,
               lb.total_days,
               lb.used_days,
               lb.pending_days,
               (lb.total_days - lb.used_days - lb.pending_days)::DECIMAL(5,1) AS remaining
        FROM hr_attendance.leave_balance lb
        JOIN hr_core.employee e ON lb.employee_id = e.id
        WHERE lb.employee_id IN (
            'e0000002-0000-0000-0000-000000000002',
            'e0000002-0000-0000-0000-000000000004',
            'e0000002-0000-0000-0000-000000000006'
        )
        AND lb.year = 2026
        AND lb.leave_type = 'ANNUAL'
        ORDER BY e.name
    LOOP
        RAISE NOTICE '    %: total=%, used=%, pending=%, remaining=%',
            v_record.name, v_record.total_days, v_record.used_days,
            v_record.pending_days, v_record.remaining;
    END LOOP;

    RAISE NOTICE '';

    -- 52h monitoring verification
    RAISE NOTICE '  52h monitoring - weekly work hours (2026-02-02 ~ 2026-02-06):';
    FOR v_record IN
        SELECT e.name,
               SUM(ar.work_hours) AS total_minutes,
               ROUND(SUM(ar.work_hours)::DECIMAL / 60, 1) AS total_hours
        FROM hr_attendance.attendance_record ar
        JOIN hr_core.employee e ON ar.employee_id = e.id
        WHERE ar.employee_id IN (
            'e0000002-0000-0000-0000-000000000010',
            'e0000002-0000-0000-0000-000000000020',
            'e0000002-0000-0000-0000-000000000030',
            'e0000002-0000-0000-0000-000000000040',
            'e0000002-0000-0000-0000-000000000050',
            'e0000002-0000-0000-0000-000000000060',
            'e0000002-0000-0000-0000-000000000070',
            'e0000002-0000-0000-0000-000000000080'
        )
        AND ar.work_date BETWEEN '2026-02-02' AND '2026-02-06'
        GROUP BY e.name, ar.employee_id
        ORDER BY total_minutes DESC
    LOOP
        RAISE NOTICE '    %: % min (%.1f hours)', v_record.name, v_record.total_minutes, v_record.total_hours;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '07_attendance.sql completed successfully!';
    RAISE NOTICE '========================================';
END $$;
