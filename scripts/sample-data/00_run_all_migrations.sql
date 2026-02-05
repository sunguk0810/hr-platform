-- ============================================================================
-- 00_run_all_migrations.sql
-- 모든 서비스의 마이그레이션을 순서대로 실행
-- ============================================================================
-- 사용법:
--   psql -h localhost -p 5433 -U hr_saas -d hr_saas -f scripts/sample-data/00_run_all_migrations.sql
-- ============================================================================

\echo '============================================'
\echo '모든 서비스 마이그레이션 실행'
\echo '============================================'

-- ============================================================================
-- 1. 스키마 생성 (V1)
-- ============================================================================
\echo ''
\echo '[1/4] 스키마 생성...'

-- tenant-service
\ir ../../../services/tenant-service/src/main/resources/db/migration/V1__create_schema.sql

-- employee-service
\ir ../../../services/employee-service/src/main/resources/db/migration/V1__create_schema.sql

-- organization-service
\ir ../../../services/organization-service/src/main/resources/db/migration/V1__create_schema.sql

-- attendance-service
\ir ../../../services/attendance-service/src/main/resources/db/migration/V1__create_schema.sql

-- approval-service
\ir ../../../services/approval-service/src/main/resources/db/migration/V1__create_schema.sql

-- mdm-service
\ir ../../../services/mdm-service/src/main/resources/db/migration/V1__create_schema.sql

-- notification-service
\ir ../../../services/notification-service/src/main/resources/db/migration/V1__create_schema.sql

-- file-service
\ir ../../../services/file-service/src/main/resources/db/migration/V1__create_schema.sql

-- recruitment-service
\ir ../../../services/recruitment-service/src/main/resources/db/migration/V1__create_schema.sql

-- appointment-service
\ir ../../../services/appointment-service/src/main/resources/db/migration/V1__create_schema.sql

-- certificate-service
\ir ../../../services/certificate-service/src/main/resources/db/migration/V1__create_schema.sql

-- auth-service
\ir ../../../services/auth-service/src/main/resources/db/migration/V1__create_schema.sql

\echo 'V1 스키마 생성 완료'

-- ============================================================================
-- 2. 테이블 생성 (V2)
-- ============================================================================
\echo ''
\echo '[2/4] 테이블 생성...'

-- tenant-service (먼저 실행 - 다른 서비스에서 참조)
\ir ../../../services/tenant-service/src/main/resources/db/migration/V2__create_tenant_tables.sql

-- mdm-service
\ir ../../../services/mdm-service/src/main/resources/db/migration/V2__create_mdm_tables.sql

-- organization-service
\ir ../../../services/organization-service/src/main/resources/db/migration/V2__create_organization_tables.sql

-- employee-service
\ir ../../../services/employee-service/src/main/resources/db/migration/V2__create_employee_tables.sql

-- attendance-service
\ir ../../../services/attendance-service/src/main/resources/db/migration/V2__create_attendance_tables.sql

-- approval-service
\ir ../../../services/approval-service/src/main/resources/db/migration/V2__create_approval_tables.sql

-- notification-service
\ir ../../../services/notification-service/src/main/resources/db/migration/V2__create_notification_tables.sql

-- file-service
\ir ../../../services/file-service/src/main/resources/db/migration/V2__create_file_tables.sql

-- recruitment-service
\ir ../../../services/recruitment-service/src/main/resources/db/migration/V2__create_tables.sql

-- appointment-service
\ir ../../../services/appointment-service/src/main/resources/db/migration/V2__create_appointment_tables.sql

-- certificate-service
\ir ../../../services/certificate-service/src/main/resources/db/migration/V2__create_certificate_tables.sql

-- auth-service
\ir ../../../services/auth-service/src/main/resources/db/migration/V2__create_auth_tables.sql

\echo 'V2 테이블 생성 완료'

-- ============================================================================
-- 3. 추가 테이블 생성 (V5, V6, V7, V10)
-- ============================================================================
\echo ''
\echo '[3/4] 추가 테이블 생성...'

-- organization-service 추가 테이블
\ir ../../../services/organization-service/src/main/resources/db/migration/V5__create_announcement_tables.sql
\ir ../../../services/organization-service/src/main/resources/db/migration/V6__create_committee_tables.sql
\ir ../../../services/organization-service/src/main/resources/db/migration/V7__create_headcount_tables.sql

-- employee-service 추가 테이블
\ir ../../../services/employee-service/src/main/resources/db/migration/V5__create_condolence_tables.sql
\ir ../../../services/employee-service/src/main/resources/db/migration/V6__create_transfer_tables.sql

-- mdm-service 메뉴 테이블
\ir ../../../services/mdm-service/src/main/resources/db/migration/V10__create_menu_tables.sql
\ir ../../../services/mdm-service/src/main/resources/db/migration/V11__seed_menu_data.sql

\echo '추가 테이블 생성 완료'

-- ============================================================================
-- 4. 검증
-- ============================================================================
\echo ''
\echo '[4/4] 테이블 검증...'

SELECT schemaname, COUNT(*) as table_count
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'public')
GROUP BY schemaname
ORDER BY schemaname;

\echo ''
\echo '============================================'
\echo '마이그레이션 완료!'
\echo '============================================'
