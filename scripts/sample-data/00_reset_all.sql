-- ============================================================================
-- HR SaaS Platform - Reset All Tables
-- Run this BEFORE migrations if you need to start fresh
-- WARNING: This will DELETE ALL DATA!
-- ============================================================================

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Drop all tables in reverse dependency order
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in hr_* schemas
    FOR r IN (
        SELECT schemaname, tablename
        FROM pg_tables
        WHERE schemaname IN (
            'tenant_common', 'hr_core', 'hr_attendance', 'hr_approval',
            'hr_audit', 'hr_notification', 'hr_file', 'hr_recruitment',
            'hr_appointment', 'hr_certificate'
        )
        ORDER BY schemaname, tablename
    ) LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped table: %.%', r.schemaname, r.tablename;
    END LOOP;
END $$;

-- Drop schemas
DROP SCHEMA IF EXISTS tenant_common CASCADE;
DROP SCHEMA IF EXISTS hr_core CASCADE;
DROP SCHEMA IF EXISTS hr_attendance CASCADE;
DROP SCHEMA IF EXISTS hr_approval CASCADE;
DROP SCHEMA IF EXISTS hr_audit CASCADE;
DROP SCHEMA IF EXISTS hr_notification CASCADE;
DROP SCHEMA IF EXISTS hr_file CASCADE;
DROP SCHEMA IF EXISTS hr_recruitment CASCADE;
DROP SCHEMA IF EXISTS hr_appointment CASCADE;
DROP SCHEMA IF EXISTS hr_certificate CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Recreate schemas
CREATE SCHEMA IF NOT EXISTS tenant_common;
CREATE SCHEMA IF NOT EXISTS hr_core;
CREATE SCHEMA IF NOT EXISTS hr_attendance;
CREATE SCHEMA IF NOT EXISTS hr_approval;
CREATE SCHEMA IF NOT EXISTS hr_audit;
CREATE SCHEMA IF NOT EXISTS hr_notification;
CREATE SCHEMA IF NOT EXISTS hr_file;
CREATE SCHEMA IF NOT EXISTS hr_recruitment;
CREATE SCHEMA IF NOT EXISTS hr_appointment;
CREATE SCHEMA IF NOT EXISTS hr_certificate;

-- Grant privileges
DO $$
DECLARE
    schema_name TEXT;
BEGIN
    FOR schema_name IN SELECT unnest(ARRAY[
        'tenant_common', 'hr_core', 'hr_attendance', 'hr_approval',
        'hr_audit', 'hr_notification', 'hr_file', 'hr_recruitment',
        'hr_appointment', 'hr_certificate'
    ]) LOOP
        EXECUTE format('GRANT ALL PRIVILEGES ON SCHEMA %I TO hr_saas_admin', schema_name);
    END LOOP;
END $$;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenant context functions
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT 'Reset complete. Now run 00_migrations_combined.sql' as status;
