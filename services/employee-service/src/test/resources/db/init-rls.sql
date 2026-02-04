-- Test initialization script for RLS testing

-- Create schema
CREATE SCHEMA IF NOT EXISTS hr_employee;

-- Create employees table
CREATE TABLE IF NOT EXISTS hr_employee.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_number VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    hire_date DATE NOT NULL,
    resign_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    department_id UUID,
    position_id UUID,
    grade_id UUID,
    manager_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS uk_employee_tenant_number ON hr_employee.employees(tenant_id, employee_number);

-- Create safe tenant getter function
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS
ALTER TABLE hr_employee.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_employee.employees FORCE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS employee_tenant_isolation ON hr_employee.employees;
CREATE POLICY employee_tenant_isolation ON hr_employee.employees
    FOR ALL
    USING (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );
