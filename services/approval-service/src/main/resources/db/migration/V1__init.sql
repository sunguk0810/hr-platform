-- ============================================================
-- Approval Service - Initial Schema Migration
-- Schema: hr_approval (created by init.sql)
-- ============================================================

SET search_path TO hr_approval, public;

-- ============================================================
-- Function: get_current_tenant_safe()
-- Returns the current tenant from session variable, or NULL
-- ============================================================
CREATE OR REPLACE FUNCTION hr_approval.get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Table 1: approval_document
-- ============================================================
CREATE TABLE hr_approval.approval_document (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID        NOT NULL,
    document_number             VARCHAR(50) NOT NULL UNIQUE,
    title                       VARCHAR(500) NOT NULL,
    content                     TEXT,
    document_type               VARCHAR(50) NOT NULL,
    status                      VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    drafter_id                  UUID        NOT NULL,
    drafter_name                VARCHAR(100),
    drafter_department_id       UUID,
    drafter_department_name     VARCHAR(200),
    submitted_at                TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ,
    reference_type              VARCHAR(50),
    reference_id                UUID,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  VARCHAR(100),
    updated_by                  VARCHAR(100)
);

-- Indexes for approval_document
CREATE INDEX idx_approval_document_tenant_id ON hr_approval.approval_document (tenant_id);
CREATE INDEX idx_approval_document_document_type ON hr_approval.approval_document (document_type);
CREATE INDEX idx_approval_document_status ON hr_approval.approval_document (status);
CREATE INDEX idx_approval_document_drafter_id ON hr_approval.approval_document (drafter_id);
CREATE INDEX idx_approval_document_submitted_at ON hr_approval.approval_document (submitted_at);
CREATE INDEX idx_approval_document_reference ON hr_approval.approval_document (reference_type, reference_id);
CREATE INDEX idx_approval_document_tenant_status ON hr_approval.approval_document (tenant_id, status);
CREATE INDEX idx_approval_document_tenant_drafter ON hr_approval.approval_document (tenant_id, drafter_id);

-- ============================================================
-- Table 2: approval_line
-- ============================================================
CREATE TABLE hr_approval.approval_line (
    id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id                 UUID        NOT NULL REFERENCES hr_approval.approval_document (id) ON DELETE CASCADE,
    sequence                    INTEGER     NOT NULL,
    line_type                   VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL',
    approver_id                 UUID        NOT NULL,
    approver_name               VARCHAR(100),
    approver_position           VARCHAR(100),
    approver_department_name    VARCHAR(200),
    delegate_id                 UUID,
    delegate_name               VARCHAR(100),
    status                      VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    action_type                 VARCHAR(20),
    comment                     TEXT,
    activated_at                TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                  VARCHAR(100),
    updated_by                  VARCHAR(100)
);

-- Indexes for approval_line
CREATE INDEX idx_approval_line_document_id ON hr_approval.approval_line (document_id);
CREATE INDEX idx_approval_line_approver_id ON hr_approval.approval_line (approver_id);
CREATE INDEX idx_approval_line_delegate_id ON hr_approval.approval_line (delegate_id);
CREATE INDEX idx_approval_line_status ON hr_approval.approval_line (status);
CREATE INDEX idx_approval_line_document_sequence ON hr_approval.approval_line (document_id, sequence);

-- ============================================================
-- Table 3: approval_history
-- ============================================================
CREATE TABLE hr_approval.approval_history (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID        NOT NULL REFERENCES hr_approval.approval_document (id) ON DELETE CASCADE,
    actor_id        UUID        NOT NULL,
    actor_name      VARCHAR(100),
    action_type     VARCHAR(20) NOT NULL,
    from_status     VARCHAR(20),
    to_status       VARCHAR(20),
    comment         TEXT,
    ip_address      VARCHAR(45),
    step_order      INTEGER     NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- Indexes for approval_history
CREATE INDEX idx_approval_history_document_id ON hr_approval.approval_history (document_id);
CREATE INDEX idx_approval_history_actor_id ON hr_approval.approval_history (actor_id);
CREATE INDEX idx_approval_history_action_type ON hr_approval.approval_history (action_type);
CREATE INDEX idx_approval_history_document_step ON hr_approval.approval_history (document_id, step_order);

-- ============================================================
-- Table 4: approval_template
-- ============================================================
CREATE TABLE hr_approval.approval_template (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL,
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    document_type   VARCHAR(50) NOT NULL,
    description     VARCHAR(500),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    sort_order      INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),

    CONSTRAINT uq_approval_template_tenant_code
        UNIQUE (tenant_id, code)
);

-- Indexes for approval_template
CREATE INDEX idx_approval_template_tenant_id ON hr_approval.approval_template (tenant_id);
CREATE INDEX idx_approval_template_document_type ON hr_approval.approval_template (document_type);
CREATE INDEX idx_approval_template_is_active ON hr_approval.approval_template (is_active);
CREATE INDEX idx_approval_template_tenant_type ON hr_approval.approval_template (tenant_id, document_type);

-- ============================================================
-- Table 5: approval_template_line
-- ============================================================
CREATE TABLE hr_approval.approval_template_line (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID        NOT NULL REFERENCES hr_approval.approval_template (id) ON DELETE CASCADE,
    sequence        INTEGER     NOT NULL,
    line_type       VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL',
    approver_type   VARCHAR(30) NOT NULL,
    approver_id     UUID,
    approver_name   VARCHAR(100),
    position_code   VARCHAR(50),
    department_id   UUID,
    description     VARCHAR(200),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- Indexes for approval_template_line
CREATE INDEX idx_approval_template_line_template_id ON hr_approval.approval_template_line (template_id);
CREATE INDEX idx_approval_template_line_template_seq ON hr_approval.approval_template_line (template_id, sequence);
CREATE INDEX idx_approval_template_line_approver_type ON hr_approval.approval_template_line (approver_type);

-- ============================================================
-- Table 6: delegation_rule
-- ============================================================
CREATE TABLE hr_approval.delegation_rule (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL,
    delegator_id    UUID        NOT NULL,
    delegator_name  VARCHAR(100),
    delegate_id     UUID        NOT NULL,
    delegate_name   VARCHAR(100),
    start_date      DATE        NOT NULL,
    end_date        DATE        NOT NULL,
    document_types  VARCHAR(500),
    reason          VARCHAR(500),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- Indexes for delegation_rule
CREATE INDEX idx_delegation_rule_tenant_id ON hr_approval.delegation_rule (tenant_id);
CREATE INDEX idx_delegation_rule_delegator_id ON hr_approval.delegation_rule (delegator_id);
CREATE INDEX idx_delegation_rule_delegate_id ON hr_approval.delegation_rule (delegate_id);
CREATE INDEX idx_delegation_rule_is_active ON hr_approval.delegation_rule (is_active);
CREATE INDEX idx_delegation_rule_date_range ON hr_approval.delegation_rule (start_date, end_date);
CREATE INDEX idx_delegation_rule_tenant_delegator ON hr_approval.delegation_rule (tenant_id, delegator_id);

-- ============================================================
-- Row Level Security (RLS)
-- Enable on tenant-owned tables: approval_document, approval_template, delegation_rule
-- Child tables (approval_line, approval_history, approval_template_line)
-- inherit isolation through their parent FK relationship.
-- ============================================================

-- approval_document
ALTER TABLE hr_approval.approval_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.approval_document FORCE ROW LEVEL SECURITY;

CREATE POLICY approval_document_tenant_isolation ON hr_approval.approval_document
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe());

-- approval_template
ALTER TABLE hr_approval.approval_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.approval_template FORCE ROW LEVEL SECURITY;

CREATE POLICY approval_template_tenant_isolation ON hr_approval.approval_template
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe());

-- delegation_rule
ALTER TABLE hr_approval.delegation_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.delegation_rule FORCE ROW LEVEL SECURITY;

CREATE POLICY delegation_rule_tenant_isolation ON hr_approval.delegation_rule
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe());
