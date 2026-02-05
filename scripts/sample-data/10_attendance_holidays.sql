-- ============================================================================
-- 10_attendance_holidays.sql
-- 2025-2026년 대한민국 공휴일 데이터
-- ============================================================================

BEGIN;

-- ============================================================================
-- 각 테넌트별 공휴일 생성
-- ============================================================================
DO $$
DECLARE
    v_tenant RECORD;
BEGIN
    FOR v_tenant IN SELECT id, code, name FROM tenant_common.tenant LOOP
        -- 2025년 공휴일
        INSERT INTO hr_attendance.holiday (tenant_id, holiday_date, name, name_en, holiday_type, is_paid, year, created_at, updated_at, created_by, updated_by)
        VALUES
            (v_tenant.id, '2025-01-01', '신정', 'New Year''s Day', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-01-28', '설날 연휴', 'Lunar New Year', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-01-29', '설날', 'Lunar New Year''s Day', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-01-30', '설날 연휴', 'Lunar New Year', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-03-01', '삼일절', 'Independence Movement Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-05-01', '근로자의 날', 'Labor Day', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-05-05', '어린이날', 'Children''s Day', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-05-06', '부처님오신날', 'Buddha''s Birthday', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-06-06', '현충일', 'Memorial Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-08-15', '광복절', 'Liberation Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-03', '개천절', 'National Foundation Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-05', '추석 연휴', 'Chuseok', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-06', '추석', 'Chuseok', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-07', '추석 연휴', 'Chuseok', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-08', '추석 대체휴일', 'Chuseok Substitute', 'SUBSTITUTE', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-10-09', '한글날', 'Hangul Day', 'NATIONAL', true, 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2025-12-25', '크리스마스', 'Christmas', 'PUBLIC', true, 2025, NOW(), NOW(), 'system', 'system');

        -- 2026년 공휴일
        INSERT INTO hr_attendance.holiday (tenant_id, holiday_date, name, name_en, holiday_type, is_paid, year, created_at, updated_at, created_by, updated_by)
        VALUES
            (v_tenant.id, '2026-01-01', '신정', 'New Year''s Day', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-02-16', '설날 연휴', 'Lunar New Year', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-02-17', '설날', 'Lunar New Year''s Day', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-02-18', '설날 연휴', 'Lunar New Year', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-03-01', '삼일절', 'Independence Movement Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-03-02', '삼일절 대체휴일', 'Independence Movement Day Substitute', 'SUBSTITUTE', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-05-01', '근로자의 날', 'Labor Day', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-05-05', '어린이날', 'Children''s Day', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-05-24', '부처님오신날', 'Buddha''s Birthday', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-05-25', '부처님오신날 대체휴일', 'Buddha''s Birthday Substitute', 'SUBSTITUTE', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-06-06', '현충일', 'Memorial Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-08-15', '광복절', 'Liberation Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-09-24', '추석 연휴', 'Chuseok', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-09-25', '추석', 'Chuseok', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-09-26', '추석 연휴', 'Chuseok', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-10-03', '개천절', 'National Foundation Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-10-09', '한글날', 'Hangul Day', 'NATIONAL', true, 2026, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-12-25', '크리스마스', 'Christmas', 'PUBLIC', true, 2026, NOW(), NOW(), 'system', 'system');

        -- 회사 창립기념일 (테넌트별로 다름)
        INSERT INTO hr_attendance.holiday (tenant_id, holiday_date, name, name_en, holiday_type, is_paid, description, year, created_at, updated_at, created_by, updated_by)
        VALUES
            (v_tenant.id, '2025-03-15', '창립기념일', 'Foundation Day', 'COMPANY', true, v_tenant.name || ' 창립기념일', 2025, NOW(), NOW(), 'system', 'system'),
            (v_tenant.id, '2026-03-15', '창립기념일', 'Foundation Day', 'COMPANY', true, v_tenant.name || ' 창립기념일', 2026, NOW(), NOW(), 'system', 'system');

    END LOOP;
END $$;

COMMIT;

-- 검증
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM hr_attendance.holiday;
    RAISE NOTICE '공휴일 데이터 생성 완료: %개 (8개 테넌트 x 약 37개 휴일)', v_count;
END $$;
