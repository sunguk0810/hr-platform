-- =============================================================================
-- V1__init_employee.sql
-- Consolidated migration (V1-V9) for Employee Service
-- Schema: hr_core (created by init.sql)
-- =============================================================================

SET search_path TO hr_core, public;

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 employee
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.employee (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    employee_number   VARCHAR(50) NOT NULL,
    name              VARCHAR(100) NOT NULL,
    email             VARCHAR(255),
    phone             VARCHAR(30),
    mobile            VARCHAR(30),
    department_id     UUID,
    position_code     VARCHAR(50),
    job_title_code    VARCHAR(50),
    hire_date         DATE,
    resign_date       DATE,
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    employment_type   VARCHAR(30),
    manager_id        UUID,
    user_id           UUID,
    resident_number   VARCHAR(20),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),

    CONSTRAINT uq_employee_tenant_number UNIQUE (tenant_id, employee_number)
);

-- -----------------------------------------------------------------------------
-- 1.2 employee_history
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.employee_history (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id          UUID NOT NULL,
    tenant_id            UUID NOT NULL,
    change_type          VARCHAR(50),
    field_name           VARCHAR(100),
    old_value            TEXT,
    new_value            TEXT,
    changed_at           TIMESTAMPTZ,
    changed_by           VARCHAR(100),
    change_reason        VARCHAR(500),
    from_department_id   UUID,
    to_department_id     UUID,
    from_department_name VARCHAR(200),
    to_department_name   VARCHAR(200),
    from_grade_code      VARCHAR(50),
    to_grade_code        VARCHAR(50),
    from_grade_name      VARCHAR(100),
    to_grade_name        VARCHAR(100),
    from_position_code   VARCHAR(50),
    to_position_code     VARCHAR(50),
    from_position_name   VARCHAR(100),
    to_position_name     VARCHAR(100),
    effective_date       DATE,
    order_number         VARCHAR(100),
    reason               VARCHAR(500),
    remarks              VARCHAR(1000),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by           VARCHAR(100),
    updated_by           VARCHAR(100),

    CONSTRAINT fk_employee_history_employee
        FOREIGN KEY (employee_id) REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 1.3 employee_family
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.employee_family (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL,
    tenant_id       UUID NOT NULL,
    relation        VARCHAR(20),
    name            VARCHAR(100),
    birth_date      DATE,
    phone           VARCHAR(30),
    is_dependent    BOOLEAN DEFAULT false,
    occupation      VARCHAR(100),
    is_cohabiting   BOOLEAN DEFAULT false,
    remarks         VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),

    CONSTRAINT fk_employee_family_employee
        FOREIGN KEY (employee_id) REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 1.4 employee_education
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.employee_education (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID NOT NULL,
    tenant_id           UUID NOT NULL,
    school_name         VARCHAR(200),
    school_type         VARCHAR(30),
    degree              VARCHAR(50),
    major               VARCHAR(200),
    start_date          DATE,
    end_date            DATE,
    graduation_status   VARCHAR(30),
    is_verified         BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),

    CONSTRAINT fk_employee_education_employee
        FOREIGN KEY (employee_id) REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 1.5 employee_career
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.employee_career (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id         UUID NOT NULL,
    tenant_id           UUID NOT NULL,
    company_name        VARCHAR(200),
    department          VARCHAR(200),
    position            VARCHAR(100),
    start_date          DATE,
    end_date            DATE,
    job_description     TEXT,
    resignation_reason  VARCHAR(500),
    is_verified         BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),

    CONSTRAINT fk_employee_career_employee
        FOREIGN KEY (employee_id) REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 1.6 employee_certificate
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.employee_certificate (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id           UUID NOT NULL,
    tenant_id             UUID NOT NULL,
    certificate_name      VARCHAR(200),
    issuing_organization  VARCHAR(200),
    issue_date            DATE,
    expiry_date           DATE,
    certificate_number    VARCHAR(100),
    grade                 VARCHAR(50),
    is_verified           BOOLEAN DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100),

    CONSTRAINT fk_employee_certificate_employee
        FOREIGN KEY (employee_id) REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 1.7 condolence_policy
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.condolence_policy (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    event_type    VARCHAR(30) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    description   TEXT,
    amount        DECIMAL(15, 2),
    leave_days    INTEGER,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    sort_order    INTEGER,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(100),
    updated_by    VARCHAR(100)
);

-- -----------------------------------------------------------------------------
-- 1.8 condolence_request
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.condolence_request (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    employee_id         UUID,
    employee_name       VARCHAR(100),
    department_name     VARCHAR(200),
    policy_id           UUID,
    event_type          VARCHAR(30),
    event_date          DATE,
    description         TEXT,
    relation            VARCHAR(20),
    related_person_name VARCHAR(100),
    amount              DECIMAL(15, 2),
    leave_days          INTEGER,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approval_id         UUID,
    paid_date           DATE,
    reject_reason       VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),

    CONSTRAINT fk_condolence_request_policy
        FOREIGN KEY (policy_id) REFERENCES hr_core.condolence_policy (id)
);

-- -----------------------------------------------------------------------------
-- 1.9 transfer_request
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.transfer_request (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    employee_id             UUID,
    employee_name           VARCHAR(100),
    employee_number         VARCHAR(50),
    source_tenant_id        UUID,
    source_tenant_name      VARCHAR(200),
    source_department_id    UUID,
    source_department_name  VARCHAR(200),
    source_position_id      UUID,
    source_position_name    VARCHAR(100),
    source_grade_id         UUID,
    source_grade_name       VARCHAR(100),
    target_tenant_id        UUID,
    target_tenant_name      VARCHAR(200),
    target_department_id    UUID,
    target_department_name  VARCHAR(200),
    target_position_id      UUID,
    target_position_name    VARCHAR(100),
    target_grade_id         UUID,
    target_grade_name       VARCHAR(100),
    transfer_date           DATE,
    reason                  TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    source_approver_id      UUID,
    source_approver_name    VARCHAR(100),
    source_approved_at      TIMESTAMPTZ,
    target_approver_id      UUID,
    target_approver_name    VARCHAR(100),
    target_approved_at      TIMESTAMPTZ,
    reject_reason           TEXT,
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100)
);


-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- employee
CREATE INDEX idx_employee_tenant_id ON hr_core.employee (tenant_id);
CREATE INDEX idx_employee_status ON hr_core.employee (status);
CREATE INDEX idx_employee_department_id ON hr_core.employee (department_id);
CREATE INDEX idx_employee_manager_id ON hr_core.employee (manager_id);
CREATE INDEX idx_employee_user_id ON hr_core.employee (user_id);
CREATE INDEX idx_employee_hire_date ON hr_core.employee (hire_date);
CREATE INDEX idx_employee_name ON hr_core.employee (name);

-- employee_history
CREATE INDEX idx_employee_history_tenant_id ON hr_core.employee_history (tenant_id);
CREATE INDEX idx_employee_history_employee_id ON hr_core.employee_history (employee_id);
CREATE INDEX idx_employee_history_change_type ON hr_core.employee_history (change_type);
CREATE INDEX idx_employee_history_effective_date ON hr_core.employee_history (effective_date);

-- employee_family
CREATE INDEX idx_employee_family_tenant_id ON hr_core.employee_family (tenant_id);
CREATE INDEX idx_employee_family_employee_id ON hr_core.employee_family (employee_id);

-- employee_education
CREATE INDEX idx_employee_education_tenant_id ON hr_core.employee_education (tenant_id);
CREATE INDEX idx_employee_education_employee_id ON hr_core.employee_education (employee_id);

-- employee_career
CREATE INDEX idx_employee_career_tenant_id ON hr_core.employee_career (tenant_id);
CREATE INDEX idx_employee_career_employee_id ON hr_core.employee_career (employee_id);

-- employee_certificate
CREATE INDEX idx_employee_certificate_tenant_id ON hr_core.employee_certificate (tenant_id);
CREATE INDEX idx_employee_certificate_employee_id ON hr_core.employee_certificate (employee_id);

-- condolence_policy
CREATE INDEX idx_condolence_policy_tenant_id ON hr_core.condolence_policy (tenant_id);
CREATE INDEX idx_condolence_policy_event_type ON hr_core.condolence_policy (event_type);
CREATE INDEX idx_condolence_policy_is_active ON hr_core.condolence_policy (is_active);

-- condolence_request
CREATE INDEX idx_condolence_request_tenant_id ON hr_core.condolence_request (tenant_id);
CREATE INDEX idx_condolence_request_employee_id ON hr_core.condolence_request (employee_id);
CREATE INDEX idx_condolence_request_status ON hr_core.condolence_request (status);
CREATE INDEX idx_condolence_request_policy_id ON hr_core.condolence_request (policy_id);
CREATE INDEX idx_condolence_request_event_date ON hr_core.condolence_request (event_date);

-- transfer_request
CREATE INDEX idx_transfer_request_tenant_id ON hr_core.transfer_request (tenant_id);
CREATE INDEX idx_transfer_request_employee_id ON hr_core.transfer_request (employee_id);
CREATE INDEX idx_transfer_request_status ON hr_core.transfer_request (status);
CREATE INDEX idx_transfer_request_source_tenant_id ON hr_core.transfer_request (source_tenant_id);
CREATE INDEX idx_transfer_request_target_tenant_id ON hr_core.transfer_request (target_tenant_id);
CREATE INDEX idx_transfer_request_transfer_date ON hr_core.transfer_request (transfer_date);


-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

-- Enable and force RLS on all tables
ALTER TABLE hr_core.employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_history FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.employee_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_family FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.employee_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_education FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.employee_career ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_career FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.employee_certificate ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_certificate FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.condolence_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.condolence_policy FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.condolence_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.condolence_request FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.transfer_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.transfer_request FORCE ROW LEVEL SECURITY;


-- =============================================================================
-- 4. TENANT-SAFE FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION hr_core.get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;


-- =============================================================================
-- 5. RLS POLICIES
-- =============================================================================

-- employee
CREATE POLICY employee_tenant_isolation ON hr_core.employee
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- employee_history
CREATE POLICY employee_history_tenant_isolation ON hr_core.employee_history
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- employee_family
CREATE POLICY employee_family_tenant_isolation ON hr_core.employee_family
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- employee_education
CREATE POLICY employee_education_tenant_isolation ON hr_core.employee_education
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- employee_career
CREATE POLICY employee_career_tenant_isolation ON hr_core.employee_career
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- employee_certificate
CREATE POLICY employee_certificate_tenant_isolation ON hr_core.employee_certificate
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- condolence_policy
CREATE POLICY condolence_policy_tenant_isolation ON hr_core.condolence_policy
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- condolence_request
CREATE POLICY condolence_request_tenant_isolation ON hr_core.condolence_request
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- transfer_request (special: allows access if tenant_id OR source_tenant_id OR target_tenant_id matches)
CREATE POLICY transfer_request_tenant_isolation ON hr_core.transfer_request
    FOR ALL
    USING (
        hr_core.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_core.get_current_tenant_safe()
        OR source_tenant_id = hr_core.get_current_tenant_safe()
        OR target_tenant_id = hr_core.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_core.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_core.get_current_tenant_safe()
        OR source_tenant_id = hr_core.get_current_tenant_safe()
        OR target_tenant_id = hr_core.get_current_tenant_safe()
    );


-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION hr_core.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- employee updated_at trigger
CREATE TRIGGER trg_employee_updated_at
    BEFORE UPDATE ON hr_core.employee
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();
