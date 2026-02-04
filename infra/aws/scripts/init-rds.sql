-- ============================================
-- HR SaaS Platform - RDS PostgreSQL Initialization
-- Run this script after RDS is created
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Create Schemas
-- ============================================
CREATE SCHEMA IF NOT EXISTS hr_auth;
CREATE SCHEMA IF NOT EXISTS hr_tenant;
CREATE SCHEMA IF NOT EXISTS hr_organization;
CREATE SCHEMA IF NOT EXISTS hr_employee;
CREATE SCHEMA IF NOT EXISTS hr_attendance;
CREATE SCHEMA IF NOT EXISTS hr_approval;
CREATE SCHEMA IF NOT EXISTS hr_mdm;
CREATE SCHEMA IF NOT EXISTS hr_notification;
CREATE SCHEMA IF NOT EXISTS hr_file;
CREATE SCHEMA IF NOT EXISTS hr_core;

-- ============================================
-- Row Level Security Functions
-- ============================================

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_uuid::TEXT, false);
END;
$$ LANGUAGE plpgsql;

-- Function to get current tenant (with safe fallback)
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Safe version that returns NULL instead of error
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
DECLARE
    tenant_id TEXT;
BEGIN
    tenant_id := current_setting('app.current_tenant', true);
    IF tenant_id IS NULL OR tenant_id = '' THEN
        RETURN NULL;
    END IF;
    RETURN tenant_id::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Audit Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Grant Schema Permissions
-- (Run these after creating the application user)
-- ============================================

-- Note: Replace 'hr_saas_app' with actual application user
-- These grants will be executed by Flyway migrations

-- GRANT USAGE ON SCHEMA hr_auth TO hr_saas_app;
-- GRANT USAGE ON SCHEMA hr_tenant TO hr_saas_app;
-- GRANT USAGE ON SCHEMA hr_organization TO hr_saas_app;
-- GRANT USAGE ON SCHEMA hr_employee TO hr_saas_app;
-- GRANT USAGE ON SCHEMA hr_attendance TO hr_saas_app;
-- GRANT USAGE ON SCHEMA hr_approval TO hr_saas_app;
-- GRANT USAGE ON SCHEMA hr_mdm TO hr_saas_app;
-- GRANT USAGE ON SCHEMA hr_notification TO hr_saas_app;
-- GRANT USAGE ON SCHEMA hr_file TO hr_saas_app;
-- GRANT USAGE ON SCHEMA hr_core TO hr_saas_app;

-- Grant table privileges (will apply to future tables)
-- ALTER DEFAULT PRIVILEGES IN SCHEMA hr_auth GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hr_saas_app;
-- (Repeat for all schemas)

-- ============================================
-- Verify Installation
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'HR SaaS PostgreSQL initialization completed successfully';
    RAISE NOTICE 'Extensions: uuid-ossp, pgcrypto';
    RAISE NOTICE 'Schemas: hr_auth, hr_tenant, hr_organization, hr_employee, hr_attendance, hr_approval, hr_mdm, hr_notification, hr_file, hr_core';
    RAISE NOTICE 'Functions: set_tenant_context, get_current_tenant, get_current_tenant_safe, update_updated_at_column';
END $$;
