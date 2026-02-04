-- Department table
CREATE TABLE IF NOT EXISTS hr_core.department (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    parent_id UUID REFERENCES hr_core.department(id),
    level INTEGER NOT NULL DEFAULT 1,
    path VARCHAR(500),
    manager_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_department_tenant_code UNIQUE (tenant_id, code)
);

-- Grade table
CREATE TABLE IF NOT EXISTS hr_core.grade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    level INTEGER NOT NULL,
    sort_order INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_grade_tenant_code UNIQUE (tenant_id, code)
);

-- Position table
CREATE TABLE IF NOT EXISTS hr_core.position (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    level INTEGER NOT NULL,
    sort_order INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_position_tenant_code UNIQUE (tenant_id, code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_department_tenant_id ON hr_core.department(tenant_id);
CREATE INDEX IF NOT EXISTS idx_department_parent_id ON hr_core.department(parent_id);
CREATE INDEX IF NOT EXISTS idx_department_status ON hr_core.department(status);
CREATE INDEX IF NOT EXISTS idx_grade_tenant_id ON hr_core.grade(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grade_is_active ON hr_core.grade(is_active);
CREATE INDEX IF NOT EXISTS idx_position_tenant_id ON hr_core.position(tenant_id);
CREATE INDEX IF NOT EXISTS idx_position_is_active ON hr_core.position(is_active);
