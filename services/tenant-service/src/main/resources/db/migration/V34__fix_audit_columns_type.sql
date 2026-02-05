-- ============================================================================
-- V3__fix_audit_columns_type.sql
-- Fix created_by/updated_by columns from UUID to VARCHAR(100) for consistency
-- ============================================================================

-- tenant table
ALTER TABLE tenant_common.tenant
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- tenant_policy table
ALTER TABLE tenant_common.tenant_policy
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- tenant_feature table
ALTER TABLE tenant_common.tenant_feature
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);
