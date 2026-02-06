-- =============================================================================
-- File Service - V1 Initial Migration
-- Schema: hr_file
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper function for RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hr_file.get_current_tenant_safe()
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

-- file_metadata
CREATE TABLE hr_file.file_metadata (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL,
    original_name   VARCHAR(500)    NOT NULL,
    stored_name     VARCHAR(500)    NOT NULL UNIQUE,
    content_type    VARCHAR(255)    NOT NULL,
    file_size       BIGINT          NOT NULL,
    storage_path    VARCHAR(1000)   NOT NULL,
    bucket_name     VARCHAR(255),
    storage_type    VARCHAR(20)     DEFAULT 'S3',
    reference_type  VARCHAR(50),
    reference_id    UUID,
    uploader_id     UUID            NOT NULL,
    uploader_name   VARCHAR(100),
    is_public       BOOLEAN         DEFAULT FALSE,
    download_count  INTEGER         DEFAULT 0,
    checksum        VARCHAR(128),
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_file_metadata_tenant_id      ON hr_file.file_metadata (tenant_id);
CREATE INDEX idx_file_metadata_uploader_id    ON hr_file.file_metadata (tenant_id, uploader_id);
CREATE INDEX idx_file_metadata_reference      ON hr_file.file_metadata (tenant_id, reference_type, reference_id);
CREATE INDEX idx_file_metadata_content_type   ON hr_file.file_metadata (tenant_id, content_type);
CREATE INDEX idx_file_metadata_storage_type   ON hr_file.file_metadata (tenant_id, storage_type);
CREATE INDEX idx_file_metadata_created_at     ON hr_file.file_metadata (tenant_id, created_at DESC);
CREATE INDEX idx_file_metadata_is_public      ON hr_file.file_metadata (is_public) WHERE is_public = TRUE;

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE hr_file.file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_file.file_metadata FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_file_metadata ON hr_file.file_metadata
    FOR ALL
    USING (
        hr_file.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_file.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_file.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_file.get_current_tenant_safe()
    );
