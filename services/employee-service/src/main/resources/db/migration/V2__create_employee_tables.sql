-- V2: Create employee tables

-- Employee main table
CREATE TABLE IF NOT EXISTS hr_core.employee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_number VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    department_id UUID,
    position_code VARCHAR(50),
    job_title_code VARCHAR(50),
    hire_date DATE,
    resign_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    employment_type VARCHAR(20) DEFAULT 'REGULAR',
    manager_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uk_employee_tenant_number UNIQUE (tenant_id, employee_number),
    CONSTRAINT uk_employee_tenant_email UNIQUE (tenant_id, email)
);

-- Employee history table for tracking changes
CREATE TABLE IF NOT EXISTS hr_core.employee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID,
    change_reason TEXT,
    CONSTRAINT fk_employee_history_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee(id) ON DELETE CASCADE
);

-- Employee family table
CREATE TABLE IF NOT EXISTS hr_core.employee_family (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    relation_type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    phone VARCHAR(20),
    is_dependent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_family_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee(id) ON DELETE CASCADE
);

-- Employee education table
CREATE TABLE IF NOT EXISTS hr_core.employee_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    school_name VARCHAR(200) NOT NULL,
    degree_type VARCHAR(50),
    major VARCHAR(100),
    admission_date DATE,
    graduation_date DATE,
    graduation_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_education_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee(id) ON DELETE CASCADE
);

-- Employee career table
CREATE TABLE IF NOT EXISTS hr_core.employee_career (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    start_date DATE,
    end_date DATE,
    job_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_career_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee(id) ON DELETE CASCADE
);

-- Employee certificate table
CREATE TABLE IF NOT EXISTS hr_core.employee_certificate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    certificate_name VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    issue_date DATE,
    expiry_date DATE,
    certificate_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_certificate_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_tenant_id ON hr_core.employee(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_department_id ON hr_core.employee(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_manager_id ON hr_core.employee(manager_id);
CREATE INDEX IF NOT EXISTS idx_employee_status ON hr_core.employee(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_name ON hr_core.employee(tenant_id, name);

CREATE INDEX IF NOT EXISTS idx_employee_history_employee_id ON hr_core.employee_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_tenant_id ON hr_core.employee_history(tenant_id);

CREATE INDEX IF NOT EXISTS idx_employee_family_employee_id ON hr_core.employee_family(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_education_employee_id ON hr_core.employee_education(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_career_employee_id ON hr_core.employee_career(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_certificate_employee_id ON hr_core.employee_certificate(employee_id);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION hr_core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_employee_updated_at ON hr_core.employee;
CREATE TRIGGER tr_employee_updated_at
    BEFORE UPDATE ON hr_core.employee
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_employee_family_updated_at ON hr_core.employee_family;
CREATE TRIGGER tr_employee_family_updated_at
    BEFORE UPDATE ON hr_core.employee_family
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_employee_education_updated_at ON hr_core.employee_education;
CREATE TRIGGER tr_employee_education_updated_at
    BEFORE UPDATE ON hr_core.employee_education
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_employee_career_updated_at ON hr_core.employee_career;
CREATE TRIGGER tr_employee_career_updated_at
    BEFORE UPDATE ON hr_core.employee_career
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_employee_certificate_updated_at ON hr_core.employee_certificate;
CREATE TRIGGER tr_employee_certificate_updated_at
    BEFORE UPDATE ON hr_core.employee_certificate
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.update_updated_at_column();
