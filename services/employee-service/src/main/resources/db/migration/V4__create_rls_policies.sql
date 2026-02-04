-- V4: Create Row Level Security policies for tenant isolation
-- These policies ensure that users can only access data belonging to their tenant

-- Helper function to safely get current tenant (handles NULL/empty cases)
CREATE OR REPLACE FUNCTION hr_core.get_current_tenant_safe()
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

-- ========================================
-- Policies for hr_core.employee table
-- ========================================

-- Policy for SELECT: Can only view employees in same tenant
DROP POLICY IF EXISTS employee_tenant_isolation_select ON hr_core.employee;
CREATE POLICY employee_tenant_isolation_select ON hr_core.employee
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- Policy for INSERT: Can only insert employees for own tenant
DROP POLICY IF EXISTS employee_tenant_isolation_insert ON hr_core.employee;
CREATE POLICY employee_tenant_isolation_insert ON hr_core.employee
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

-- Policy for UPDATE: Can only update employees in same tenant
DROP POLICY IF EXISTS employee_tenant_isolation_update ON hr_core.employee;
CREATE POLICY employee_tenant_isolation_update ON hr_core.employee
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

-- Policy for DELETE: Can only delete employees in same tenant
DROP POLICY IF EXISTS employee_tenant_isolation_delete ON hr_core.employee;
CREATE POLICY employee_tenant_isolation_delete ON hr_core.employee
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_history table
-- ========================================

DROP POLICY IF EXISTS employee_history_tenant_isolation_select ON hr_core.employee_history;
CREATE POLICY employee_history_tenant_isolation_select ON hr_core.employee_history
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_history_tenant_isolation_insert ON hr_core.employee_history;
CREATE POLICY employee_history_tenant_isolation_insert ON hr_core.employee_history
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_history_tenant_isolation_update ON hr_core.employee_history;
CREATE POLICY employee_history_tenant_isolation_update ON hr_core.employee_history
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_history_tenant_isolation_delete ON hr_core.employee_history;
CREATE POLICY employee_history_tenant_isolation_delete ON hr_core.employee_history
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_family table
-- ========================================

DROP POLICY IF EXISTS employee_family_tenant_isolation_select ON hr_core.employee_family;
CREATE POLICY employee_family_tenant_isolation_select ON hr_core.employee_family
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_family_tenant_isolation_insert ON hr_core.employee_family;
CREATE POLICY employee_family_tenant_isolation_insert ON hr_core.employee_family
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_family_tenant_isolation_update ON hr_core.employee_family;
CREATE POLICY employee_family_tenant_isolation_update ON hr_core.employee_family
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_family_tenant_isolation_delete ON hr_core.employee_family;
CREATE POLICY employee_family_tenant_isolation_delete ON hr_core.employee_family
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_education table
-- ========================================

DROP POLICY IF EXISTS employee_education_tenant_isolation_select ON hr_core.employee_education;
CREATE POLICY employee_education_tenant_isolation_select ON hr_core.employee_education
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_education_tenant_isolation_insert ON hr_core.employee_education;
CREATE POLICY employee_education_tenant_isolation_insert ON hr_core.employee_education
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_education_tenant_isolation_update ON hr_core.employee_education;
CREATE POLICY employee_education_tenant_isolation_update ON hr_core.employee_education
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_education_tenant_isolation_delete ON hr_core.employee_education;
CREATE POLICY employee_education_tenant_isolation_delete ON hr_core.employee_education
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_career table
-- ========================================

DROP POLICY IF EXISTS employee_career_tenant_isolation_select ON hr_core.employee_career;
CREATE POLICY employee_career_tenant_isolation_select ON hr_core.employee_career
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_career_tenant_isolation_insert ON hr_core.employee_career;
CREATE POLICY employee_career_tenant_isolation_insert ON hr_core.employee_career
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_career_tenant_isolation_update ON hr_core.employee_career;
CREATE POLICY employee_career_tenant_isolation_update ON hr_core.employee_career
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_career_tenant_isolation_delete ON hr_core.employee_career;
CREATE POLICY employee_career_tenant_isolation_delete ON hr_core.employee_career
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_certificate table
-- ========================================

DROP POLICY IF EXISTS employee_certificate_tenant_isolation_select ON hr_core.employee_certificate;
CREATE POLICY employee_certificate_tenant_isolation_select ON hr_core.employee_certificate
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_certificate_tenant_isolation_insert ON hr_core.employee_certificate;
CREATE POLICY employee_certificate_tenant_isolation_insert ON hr_core.employee_certificate
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_certificate_tenant_isolation_update ON hr_core.employee_certificate;
CREATE POLICY employee_certificate_tenant_isolation_update ON hr_core.employee_certificate
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_certificate_tenant_isolation_delete ON hr_core.employee_certificate;
CREATE POLICY employee_certificate_tenant_isolation_delete ON hr_core.employee_certificate
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Comments for documentation
-- ========================================
COMMENT ON POLICY employee_tenant_isolation_select ON hr_core.employee IS
    'Ensures users can only SELECT employee records belonging to their tenant';
COMMENT ON POLICY employee_tenant_isolation_insert ON hr_core.employee IS
    'Ensures users can only INSERT employee records for their tenant';
COMMENT ON POLICY employee_tenant_isolation_update ON hr_core.employee IS
    'Ensures users can only UPDATE employee records belonging to their tenant';
COMMENT ON POLICY employee_tenant_isolation_delete ON hr_core.employee IS
    'Ensures users can only DELETE employee records belonging to their tenant';
