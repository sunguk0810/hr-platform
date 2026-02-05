-- ============================================================================
-- V9__add_missing_detail_columns.sql
-- Add missing columns to employee detail tables to match entity definitions
-- This migration syncs the database schema with the current JPA entities
-- ============================================================================

-- ============================================================================
-- employee_family table updates
-- ============================================================================
-- Rename relation_type to relation (entity uses 'relation')
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'hr_core'
               AND table_name = 'employee_family'
               AND column_name = 'relation_type') THEN
        ALTER TABLE hr_core.employee_family RENAME COLUMN relation_type TO relation;
    END IF;
END $$;

-- Add relation column if not exists
ALTER TABLE hr_core.employee_family ADD COLUMN IF NOT EXISTS relation VARCHAR(20);

-- Add occupation column
ALTER TABLE hr_core.employee_family ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);

-- Add is_cohabiting column
ALTER TABLE hr_core.employee_family ADD COLUMN IF NOT EXISTS is_cohabiting BOOLEAN DEFAULT false;

-- Add remarks column
ALTER TABLE hr_core.employee_family ADD COLUMN IF NOT EXISTS remarks VARCHAR(500);

-- ============================================================================
-- employee_history table updates (completely different structure from V2)
-- ============================================================================
-- Add missing columns for the new structure
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS from_department_id UUID;
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS to_department_id UUID;
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS from_department_name VARCHAR(200);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS to_department_name VARCHAR(200);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS from_grade_code VARCHAR(50);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS to_grade_code VARCHAR(50);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS from_grade_name VARCHAR(100);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS to_grade_name VARCHAR(100);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS from_position_code VARCHAR(50);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS to_position_code VARCHAR(50);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS from_position_name VARCHAR(100);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS to_position_name VARCHAR(100);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS remarks VARCHAR(1000);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_history ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- ============================================================================
-- employee_education table updates
-- ============================================================================
-- Add school_type column
ALTER TABLE hr_core.employee_education ADD COLUMN IF NOT EXISTS school_type VARCHAR(30);

-- Rename degree_type to degree
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'hr_core'
               AND table_name = 'employee_education'
               AND column_name = 'degree_type') THEN
        ALTER TABLE hr_core.employee_education RENAME COLUMN degree_type TO degree;
    END IF;
END $$;

-- Add degree column if not exists
ALTER TABLE hr_core.employee_education ADD COLUMN IF NOT EXISTS degree VARCHAR(50);

-- Rename admission_date to start_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'hr_core'
               AND table_name = 'employee_education'
               AND column_name = 'admission_date') THEN
        ALTER TABLE hr_core.employee_education RENAME COLUMN admission_date TO start_date;
    END IF;
END $$;

-- Add start_date column if not exists
ALTER TABLE hr_core.employee_education ADD COLUMN IF NOT EXISTS start_date DATE;

-- Rename graduation_date to end_date
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'hr_core'
               AND table_name = 'employee_education'
               AND column_name = 'graduation_date') THEN
        ALTER TABLE hr_core.employee_education RENAME COLUMN graduation_date TO end_date;
    END IF;
END $$;

-- Add end_date column if not exists
ALTER TABLE hr_core.employee_education ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add is_verified column
ALTER TABLE hr_core.employee_education ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- ============================================================================
-- employee_career table updates
-- ============================================================================
-- Add resignation_reason column
ALTER TABLE hr_core.employee_career ADD COLUMN IF NOT EXISTS resignation_reason VARCHAR(500);

-- Add is_verified column
ALTER TABLE hr_core.employee_career ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- ============================================================================
-- employee_certificate table updates
-- ============================================================================
-- Add grade column
ALTER TABLE hr_core.employee_certificate ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

-- Add is_verified column
ALTER TABLE hr_core.employee_certificate ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
