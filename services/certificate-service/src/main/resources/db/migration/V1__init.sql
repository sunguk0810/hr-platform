-- =============================================================================
-- Certificate Service - V1 Initial Migration
-- Schema: hr_certificate
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper function for RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hr_certificate.get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- certificate_templates
CREATE TABLE hr_certificate.certificate_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID            NOT NULL,
    name                VARCHAR(100)    NOT NULL,
    description         TEXT,
    content_html        TEXT            NOT NULL,
    header_html         TEXT,
    footer_html         TEXT,
    css_styles          TEXT,
    page_size           VARCHAR(10)     DEFAULT 'A4',
    orientation         VARCHAR(10)     DEFAULT 'PORTRAIT',
    margin_top          INTEGER         DEFAULT 20,
    margin_bottom       INTEGER         DEFAULT 20,
    margin_left         INTEGER         DEFAULT 20,
    margin_right        INTEGER         DEFAULT 20,
    variables           JSONB,
    include_company_seal BOOLEAN        DEFAULT TRUE,
    include_signature   BOOLEAN         DEFAULT TRUE,
    seal_image_url      VARCHAR(500),
    signature_image_url VARCHAR(500),
    sample_image_url    VARCHAR(500),
    is_active           BOOLEAN         DEFAULT TRUE,
    created_at          TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100)
);

-- certificate_types
CREATE TABLE hr_certificate.certificate_types (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID            NOT NULL,
    code                    VARCHAR(30)     NOT NULL,
    name                    VARCHAR(100)    NOT NULL,
    name_en                 VARCHAR(100),
    description             TEXT,
    template_id             UUID            REFERENCES hr_certificate.certificate_templates (id),
    requires_approval       BOOLEAN         DEFAULT FALSE,
    approval_template_id    UUID,
    auto_issue              BOOLEAN         DEFAULT TRUE,
    valid_days              INTEGER         DEFAULT 90,
    fee                     DECIMAL(10,2)   DEFAULT 0,
    max_copies_per_request  INTEGER         DEFAULT 5,
    sort_order              INTEGER         DEFAULT 0,
    is_active               BOOLEAN         DEFAULT TRUE,
    created_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100),
    CONSTRAINT uq_certificate_types_tenant_code UNIQUE (tenant_id, code)
);

-- certificate_requests
CREATE TABLE hr_certificate.certificate_requests (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID            NOT NULL,
    certificate_type_id   UUID            NOT NULL REFERENCES hr_certificate.certificate_types (id),
    employee_id           UUID            NOT NULL,
    employee_name         VARCHAR(100),
    employee_number       VARCHAR(50),
    request_number        VARCHAR(50)     NOT NULL,
    purpose               VARCHAR(200),
    submission_target     VARCHAR(200),
    copies                INTEGER         DEFAULT 1,
    language              VARCHAR(10)     DEFAULT 'KO',
    include_salary        BOOLEAN         DEFAULT FALSE,
    period_from           DATE,
    period_to             DATE,
    custom_fields         JSONB,
    remarks               TEXT,
    status                VARCHAR(20)     DEFAULT 'PENDING',
    approval_id           UUID,
    approved_by           UUID,
    approved_at           TIMESTAMPTZ,
    rejection_reason      TEXT,
    issued_at             TIMESTAMPTZ,
    issued_by             UUID,
    created_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100),
    CONSTRAINT uq_certificate_requests_tenant_number UNIQUE (tenant_id, request_number)
);

-- certificate_issues
CREATE TABLE hr_certificate.certificate_issues (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID            NOT NULL,
    request_id        UUID            NOT NULL REFERENCES hr_certificate.certificate_requests (id),
    issue_number      VARCHAR(50)     NOT NULL,
    verification_code VARCHAR(20)     NOT NULL UNIQUE,
    file_id           UUID,
    content_snapshot  JSONB,
    issued_by         UUID            NOT NULL,
    issued_at         TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    downloaded_at     TIMESTAMPTZ,
    download_count    INTEGER         DEFAULT 0,
    verified_count    INTEGER         DEFAULT 0,
    last_verified_at  TIMESTAMPTZ,
    expires_at        DATE            NOT NULL,
    is_revoked        BOOLEAN         DEFAULT FALSE,
    revoked_at        TIMESTAMPTZ,
    revoked_by        UUID,
    revoke_reason     TEXT,
    created_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    CONSTRAINT uq_certificate_issues_tenant_number UNIQUE (tenant_id, issue_number)
);

-- verification_logs (NO tenant_id - public verification)
CREATE TABLE hr_certificate.verification_logs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id              UUID            REFERENCES hr_certificate.certificate_issues (id),
    verification_code     VARCHAR(20)     NOT NULL,
    verified_at           TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    verifier_ip           VARCHAR(45),
    verifier_user_agent   TEXT,
    verifier_name         VARCHAR(100),
    verifier_organization VARCHAR(200),
    is_valid              BOOLEAN         NOT NULL,
    failure_reason        VARCHAR(100),
    created_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100)
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

-- certificate_templates
CREATE INDEX idx_certificate_templates_tenant_id   ON hr_certificate.certificate_templates (tenant_id);
CREATE INDEX idx_certificate_templates_is_active   ON hr_certificate.certificate_templates (tenant_id, is_active);

-- certificate_types
CREATE INDEX idx_certificate_types_tenant_id       ON hr_certificate.certificate_types (tenant_id);
CREATE INDEX idx_certificate_types_template_id     ON hr_certificate.certificate_types (template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_certificate_types_is_active       ON hr_certificate.certificate_types (tenant_id, is_active);
CREATE INDEX idx_certificate_types_sort_order      ON hr_certificate.certificate_types (tenant_id, sort_order);

-- certificate_requests
CREATE INDEX idx_certificate_requests_tenant_id    ON hr_certificate.certificate_requests (tenant_id);
CREATE INDEX idx_certificate_requests_type_id      ON hr_certificate.certificate_requests (tenant_id, certificate_type_id);
CREATE INDEX idx_certificate_requests_employee_id  ON hr_certificate.certificate_requests (tenant_id, employee_id);
CREATE INDEX idx_certificate_requests_status       ON hr_certificate.certificate_requests (tenant_id, status);
CREATE INDEX idx_certificate_requests_approval_id  ON hr_certificate.certificate_requests (approval_id) WHERE approval_id IS NOT NULL;
CREATE INDEX idx_certificate_requests_created_at   ON hr_certificate.certificate_requests (tenant_id, created_at DESC);

-- certificate_issues
CREATE INDEX idx_certificate_issues_tenant_id      ON hr_certificate.certificate_issues (tenant_id);
CREATE INDEX idx_certificate_issues_request_id     ON hr_certificate.certificate_issues (tenant_id, request_id);
CREATE INDEX idx_certificate_issues_issued_at      ON hr_certificate.certificate_issues (tenant_id, issued_at DESC);
CREATE INDEX idx_certificate_issues_expires_at     ON hr_certificate.certificate_issues (expires_at) WHERE is_revoked = FALSE;
CREATE INDEX idx_certificate_issues_is_revoked     ON hr_certificate.certificate_issues (tenant_id, is_revoked);

-- verification_logs
CREATE INDEX idx_verification_logs_issue_id        ON hr_certificate.verification_logs (issue_id);
CREATE INDEX idx_verification_logs_code            ON hr_certificate.verification_logs (verification_code);
CREATE INDEX idx_verification_logs_verified_at     ON hr_certificate.verification_logs (verified_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS (NOT on verification_logs - no tenant_id)
-- ---------------------------------------------------------------------------

ALTER TABLE hr_certificate.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_templates FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.certificate_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_types     FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.certificate_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_requests  FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.certificate_issues    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_issues    FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. RLS Policies (NOT on verification_logs - no tenant_id)
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_certificate_templates ON hr_certificate.certificate_templates
    FOR ALL
    USING (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_certificate_types ON hr_certificate.certificate_types
    FOR ALL
    USING (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_certificate_requests ON hr_certificate.certificate_requests
    FOR ALL
    USING (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_certificate_issues ON hr_certificate.certificate_issues
    FOR ALL
    USING (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    );
