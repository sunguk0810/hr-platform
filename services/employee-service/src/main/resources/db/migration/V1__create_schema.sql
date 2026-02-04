-- V1: Create schema for employee service
-- Schema hr_core should already exist from docker/postgres/init.sql
-- This migration ensures it exists and grants proper privileges

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'hr_core') THEN
        CREATE SCHEMA hr_core;
    END IF;
END
$$;

-- Ensure the application user has access
GRANT ALL PRIVILEGES ON SCHEMA hr_core TO CURRENT_USER;
GRANT USAGE ON SCHEMA hr_core TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_core GRANT ALL ON TABLES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_core GRANT ALL ON SEQUENCES TO CURRENT_USER;
