-- ============================================================================
-- V7__fix_audit_columns_type.sql
-- Fix created_by/updated_by columns from UUID to VARCHAR(100) for consistency
-- ============================================================================

-- employee table
ALTER TABLE hr_core.employee
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- transfer_request table (from V6)
ALTER TABLE hr_core.transfer_request
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);
