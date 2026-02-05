-- V1: Create schema for tenant service
-- Schema tenant_common should already exist from docker/postgres/init.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_common') THEN
        CREATE SCHEMA tenant_common;
    END IF;
END
$$;

GRANT ALL PRIVILEGES ON SCHEMA tenant_common TO CURRENT_USER;
GRANT USAGE ON SCHEMA tenant_common TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant_common GRANT ALL ON TABLES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant_common GRANT ALL ON SEQUENCES TO CURRENT_USER;
