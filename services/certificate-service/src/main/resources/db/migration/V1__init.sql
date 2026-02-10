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

-- certificate_template
CREATE TABLE hr_certificate.certificate_template (
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

-- certificate_type
CREATE TABLE hr_certificate.certificate_type (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID            NOT NULL,
    code                    VARCHAR(30)     NOT NULL,
    name                    VARCHAR(100)    NOT NULL,
    name_en                 VARCHAR(100),
    description             TEXT,
    template_id             UUID            REFERENCES hr_certificate.certificate_template (id),
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
    CONSTRAINT uq_certificate_type_tenant_code UNIQUE (tenant_id, code)
);

-- certificate_request
CREATE TABLE hr_certificate.certificate_request (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID            NOT NULL,
    certificate_type_id   UUID            NOT NULL REFERENCES hr_certificate.certificate_type (id),
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
    CONSTRAINT uq_certificate_request_tenant_number UNIQUE (tenant_id, request_number)
);

-- certificate_issue
CREATE TABLE hr_certificate.certificate_issue (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID            NOT NULL,
    request_id        UUID            NOT NULL REFERENCES hr_certificate.certificate_request (id),
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
    CONSTRAINT uq_certificate_issue_tenant_number UNIQUE (tenant_id, issue_number)
);

-- verification_log (NO tenant_id - public verification)
CREATE TABLE hr_certificate.verification_log (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id              UUID            REFERENCES hr_certificate.certificate_issue (id),
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

-- certificate_template
CREATE INDEX idx_certificate_template_tenant_id   ON hr_certificate.certificate_template (tenant_id);
CREATE INDEX idx_certificate_template_is_active   ON hr_certificate.certificate_template (tenant_id, is_active);

-- certificate_type
CREATE INDEX idx_certificate_type_tenant_id       ON hr_certificate.certificate_type (tenant_id);
CREATE INDEX idx_certificate_type_template_id     ON hr_certificate.certificate_type (template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_certificate_type_is_active       ON hr_certificate.certificate_type (tenant_id, is_active);
CREATE INDEX idx_certificate_type_sort_order      ON hr_certificate.certificate_type (tenant_id, sort_order);

-- certificate_request
CREATE INDEX idx_certificate_request_tenant_id    ON hr_certificate.certificate_request (tenant_id);
CREATE INDEX idx_certificate_request_type_id      ON hr_certificate.certificate_request (tenant_id, certificate_type_id);
CREATE INDEX idx_certificate_request_employee_id  ON hr_certificate.certificate_request (tenant_id, employee_id);
CREATE INDEX idx_certificate_request_status       ON hr_certificate.certificate_request (tenant_id, status);
CREATE INDEX idx_certificate_request_approval_id  ON hr_certificate.certificate_request (approval_id) WHERE approval_id IS NOT NULL;
CREATE INDEX idx_certificate_request_created_at   ON hr_certificate.certificate_request (tenant_id, created_at DESC);

-- certificate_issue
CREATE INDEX idx_certificate_issue_tenant_id      ON hr_certificate.certificate_issue (tenant_id);
CREATE INDEX idx_certificate_issue_request_id     ON hr_certificate.certificate_issue (tenant_id, request_id);
CREATE INDEX idx_certificate_issue_issued_at      ON hr_certificate.certificate_issue (tenant_id, issued_at DESC);
CREATE INDEX idx_certificate_issue_expires_at     ON hr_certificate.certificate_issue (expires_at) WHERE is_revoked = FALSE;
CREATE INDEX idx_certificate_issue_is_revoked     ON hr_certificate.certificate_issue (tenant_id, is_revoked);

-- verification_log
CREATE INDEX idx_verification_log_issue_id        ON hr_certificate.verification_log (issue_id);
CREATE INDEX idx_verification_log_code            ON hr_certificate.verification_log (verification_code);
CREATE INDEX idx_verification_log_verified_at     ON hr_certificate.verification_log (verified_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS (NOT on verification_log - no tenant_id)
-- ---------------------------------------------------------------------------

ALTER TABLE hr_certificate.certificate_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_template FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.certificate_type     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_type     FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.certificate_request  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_request  FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.certificate_issue    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_issue    FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. RLS Policies (NOT on verification_log - no tenant_id)
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_certificate_template ON hr_certificate.certificate_template
    FOR ALL
    USING (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_certificate_type ON hr_certificate.certificate_type
    FOR ALL
    USING (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_certificate_request ON hr_certificate.certificate_request
    FOR ALL
    USING (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_certificate_issue ON hr_certificate.certificate_issue
    FOR ALL
    USING (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_certificate.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_certificate.get_current_tenant_safe()
    );
