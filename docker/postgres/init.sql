-- Create schemas
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
GRANT ALL PRIVILEGES ON SCHEMA tenant_common TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_core TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_attendance TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_approval TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_audit TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_notification TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_file TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_recruitment TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_appointment TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_certificate TO hr_saas;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function for setting tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- Function for getting current tenant
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit log function for automatic timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Schema-scoped tenant-safe helper functions (prevents race conditions when
-- multiple services share a schema and start simultaneously)
CREATE OR REPLACE FUNCTION tenant_common.get_current_tenant_safe()
RETURNS UUID AS $$
DECLARE
    tenant_value TEXT;
BEGIN
    tenant_value := current_setting('app.current_tenant', true);
    IF tenant_value IS NULL OR tenant_value = '' THEN
        RETURN NULL;
    END IF;
    RETURN tenant_value::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION hr_core.get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
