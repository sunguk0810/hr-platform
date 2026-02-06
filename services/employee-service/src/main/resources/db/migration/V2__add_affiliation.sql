-- =============================================================================
-- V2__add_affiliation.sql
-- Add Employee Affiliation, Number Rule, and Change Request tables
-- Schema: hr_core
-- =============================================================================

SET search_path TO hr_core, public;

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 Employee Affiliation (겸직/주부소속)
-- -----------------------------------------------------------------------------
CREATE TABLE hr_core.employee_affiliation (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    employee_id       UUID NOT NULL REFERENCES hr_core.employee(id),
    department_id     UUID NOT NULL,
    department_name   VARCHAR(200),
    position_code     VARCHAR(50),
    position_name     VARCHAR(200),
    is_primary        BOOLEAN DEFAULT false,
    affiliation_type  VARCHAR(20) DEFAULT 'PRIMARY',
    start_date        DATE,
    end_date          DATE,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100)
);

-- -----------------------------------------------------------------------------
-- 1.2 Employee Number Rule (사번 규칙)
-- -----------------------------------------------------------------------------
CREATE TABLE hr_core.employee_number_rule (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL UNIQUE,
    prefix                  VARCHAR(10) DEFAULT '',
    include_year            BOOLEAN DEFAULT true,
    year_format             VARCHAR(4) DEFAULT 'YYYY',
    sequence_digits         INTEGER DEFAULT 4,
    sequence_reset_policy   VARCHAR(10) DEFAULT 'YEARLY',
    current_sequence        INTEGER DEFAULT 0,
    current_year            INTEGER,
    separator               VARCHAR(5) DEFAULT '-',
    allow_reuse             BOOLEAN DEFAULT false,
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100)
);

-- -----------------------------------------------------------------------------
-- 1.3 Employee Change Request (본인 정보 변경 요청)
-- -----------------------------------------------------------------------------
CREATE TABLE hr_core.employee_change_request (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    employee_id             UUID NOT NULL REFERENCES hr_core.employee(id),
    field_name              VARCHAR(50) NOT NULL,
    old_value               VARCHAR(500),
    new_value               VARCHAR(500) NOT NULL,
    status                  VARCHAR(20) DEFAULT 'PENDING',
    approval_document_id    UUID,
    reason                  VARCHAR(500),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100)
);


-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- employee_affiliation
CREATE INDEX idx_affiliation_tenant ON hr_core.employee_affiliation (tenant_id);
CREATE INDEX idx_affiliation_employee ON hr_core.employee_affiliation (employee_id);
CREATE INDEX idx_affiliation_department ON hr_core.employee_affiliation (department_id);
CREATE UNIQUE INDEX idx_affiliation_primary ON hr_core.employee_affiliation (tenant_id, employee_id)
    WHERE is_primary = true AND is_active = true;

-- employee_change_request
CREATE INDEX idx_change_request_tenant ON hr_core.employee_change_request (tenant_id);
CREATE INDEX idx_change_request_employee ON hr_core.employee_change_request (employee_id);
CREATE INDEX idx_change_request_status ON hr_core.employee_change_request (status);


-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

-- employee_affiliation
ALTER TABLE hr_core.employee_affiliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_affiliation FORCE ROW LEVEL SECURITY;

CREATE POLICY employee_affiliation_tenant_isolation ON hr_core.employee_affiliation
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- employee_number_rule
ALTER TABLE hr_core.employee_number_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_number_rule FORCE ROW LEVEL SECURITY;

CREATE POLICY employee_number_rule_tenant_isolation ON hr_core.employee_number_rule
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- employee_change_request
ALTER TABLE hr_core.employee_change_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_change_request FORCE ROW LEVEL SECURITY;

CREATE POLICY employee_change_request_tenant_isolation ON hr_core.employee_change_request
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());


-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

-- employee_affiliation updated_at trigger
CREATE TRIGGER trg_employee_affiliation_updated_at
    BEFORE UPDATE ON hr_core.employee_affiliation
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- employee_number_rule updated_at trigger
CREATE TRIGGER trg_employee_number_rule_updated_at
    BEFORE UPDATE ON hr_core.employee_number_rule
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- employee_change_request updated_at trigger
CREATE TRIGGER trg_employee_change_request_updated_at
    BEFORE UPDATE ON hr_core.employee_change_request
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();
