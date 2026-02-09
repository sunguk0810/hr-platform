-- =============================================================================
-- V2__add_arbitrary_approval_rules.sql
-- Add Arbitrary Approval Rules, Conditional Routes, and related document support
-- Schema: hr_approval
-- =============================================================================

SET search_path TO hr_approval, public;

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 Arbitrary Approval Rule (전결 규칙)
-- -----------------------------------------------------------------------------
CREATE TABLE hr_approval.arbitrary_approval_rule (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    document_type       VARCHAR(50),
    condition_type      VARCHAR(20) NOT NULL,
    condition_operator  VARCHAR(10) NOT NULL,
    condition_value     VARCHAR(100) NOT NULL,
    skip_to_sequence    INTEGER,
    is_active           BOOLEAN DEFAULT true,
    description         VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100)
);

-- -----------------------------------------------------------------------------
-- 1.2 Conditional Route (조건 분기 결재선)
-- -----------------------------------------------------------------------------
CREATE TABLE hr_approval.conditional_route (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    template_id         UUID REFERENCES hr_approval.approval_template(id),
    condition_field     VARCHAR(50) NOT NULL,
    condition_operator  VARCHAR(10) NOT NULL,
    condition_value     VARCHAR(100) NOT NULL,
    target_template_id  UUID REFERENCES hr_approval.approval_template(id),
    priority            INTEGER DEFAULT 0,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100)
);


-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- arbitrary_approval_rule
CREATE INDEX idx_arbitrary_rule_tenant ON hr_approval.arbitrary_approval_rule (tenant_id);
CREATE INDEX idx_arbitrary_rule_document_type ON hr_approval.arbitrary_approval_rule (document_type);
CREATE INDEX idx_arbitrary_rule_tenant_type ON hr_approval.arbitrary_approval_rule (tenant_id, document_type);

-- conditional_route
CREATE INDEX idx_conditional_route_tenant ON hr_approval.conditional_route (tenant_id);
CREATE INDEX idx_conditional_route_template ON hr_approval.conditional_route (template_id);
CREATE INDEX idx_conditional_route_target_template ON hr_approval.conditional_route (target_template_id);
CREATE INDEX idx_conditional_route_tenant_template ON hr_approval.conditional_route (tenant_id, template_id);


-- =============================================================================
-- 3. ALTER EXISTING TABLE
-- =============================================================================

-- Add related document IDs to approval document
ALTER TABLE hr_approval.approval_document
    ADD COLUMN IF NOT EXISTS related_document_ids UUID[];


-- =============================================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================================

-- arbitrary_approval_rule
ALTER TABLE hr_approval.arbitrary_approval_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.arbitrary_approval_rule FORCE ROW LEVEL SECURITY;

CREATE POLICY arbitrary_approval_rule_tenant_isolation ON hr_approval.arbitrary_approval_rule
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe());

-- conditional_route
ALTER TABLE hr_approval.conditional_route ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.conditional_route FORCE ROW LEVEL SECURITY;

CREATE POLICY conditional_route_tenant_isolation ON hr_approval.conditional_route
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_approval.get_current_tenant_safe());


-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================

-- Create updated_at trigger function if not exists (may already exist from V1)
CREATE OR REPLACE FUNCTION hr_approval.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- arbitrary_approval_rule updated_at trigger
CREATE TRIGGER trg_arbitrary_approval_rule_updated_at
    BEFORE UPDATE ON hr_approval.arbitrary_approval_rule
    FOR EACH ROW
    EXECUTE FUNCTION hr_approval.set_updated_at();

-- conditional_route updated_at trigger
CREATE TRIGGER trg_conditional_route_updated_at
    BEFORE UPDATE ON hr_approval.conditional_route
    FOR EACH ROW
    EXECUTE FUNCTION hr_approval.set_updated_at();
