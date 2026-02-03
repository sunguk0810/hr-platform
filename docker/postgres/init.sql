-- Create database for Keycloak
CREATE DATABASE keycloak;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS tenant_common;
CREATE SCHEMA IF NOT EXISTS hr_core;
CREATE SCHEMA IF NOT EXISTS hr_attendance;
CREATE SCHEMA IF NOT EXISTS hr_approval;
CREATE SCHEMA IF NOT EXISTS hr_audit;

-- Grant privileges
GRANT ALL PRIVILEGES ON SCHEMA tenant_common TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_core TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_attendance TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_approval TO hr_saas;
GRANT ALL PRIVILEGES ON SCHEMA hr_audit TO hr_saas;

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
