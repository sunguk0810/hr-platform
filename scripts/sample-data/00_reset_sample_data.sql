-- ============================================================================
-- 00_reset_sample_data.sql
-- 샘플 데이터 초기화 (기존 샘플 데이터 삭제)
-- ============================================================================
-- 주의: 이 스크립트는 모든 샘플 데이터를 삭제합니다.
-- 운영 환경에서는 절대 실행하지 마세요!
-- ============================================================================

-- RLS 비활성화 (데이터 삭제를 위해)
SET app.current_tenant = '00000000-0000-0000-0000-000000000000';

-- 모든 관련 스키마의 테이블을 동적으로 TRUNCATE (flyway 제외)
DO $$
DECLARE
    r RECORD;
    v_schemas TEXT[] := ARRAY[
        'hr_certificate', 'hr_appointment', 'hr_recruitment',
        'hr_approval', 'hr_attendance', 'hr_notification', 'hr_file',
        'hr_core', 'tenant_common'
    ];
    v_schema TEXT;
BEGIN
    -- 스키마별 역순으로 TRUNCATE (의존성 순서)
    FOREACH v_schema IN ARRAY v_schemas LOOP
        FOR r IN
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = v_schema
            AND tablename NOT LIKE 'flyway%'
            ORDER BY tablename
        LOOP
            BEGIN
                EXECUTE format('TRUNCATE TABLE %I.%I CASCADE', v_schema, r.tablename);
                RAISE NOTICE '  TRUNCATED: %.%', v_schema, r.tablename;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '  SKIP (error): %.% - %', v_schema, r.tablename, SQLERRM;
            END;
        END LOOP;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '샘플 데이터 초기화 완료!';
END $$;
