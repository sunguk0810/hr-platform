-- ============================================================================
-- V8__add_missing_columns.sql
-- Add missing columns to various tables
-- ============================================================================

-- Add resident_number to employee
ALTER TABLE hr_core.employee ADD COLUMN IF NOT EXISTS resident_number VARCHAR(20);

-- Add audit columns to employee_career
ALTER TABLE hr_core.employee_career ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_career ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Add audit columns to employee_certificate
ALTER TABLE hr_core.employee_certificate ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_certificate ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Add audit columns to employee_education
ALTER TABLE hr_core.employee_education ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_education ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Add audit columns to employee_family
ALTER TABLE hr_core.employee_family ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_family ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Add audit columns to employee_history
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
