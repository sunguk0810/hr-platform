CREATE TABLE IF NOT EXISTS hr_file.file_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    original_name VARCHAR(500) NOT NULL,
    stored_name VARCHAR(500) NOT NULL UNIQUE,
    content_type VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    bucket_name VARCHAR(255),
    storage_type VARCHAR(20) NOT NULL DEFAULT 'S3',
    reference_type VARCHAR(50),
    reference_id UUID,
    uploader_id UUID NOT NULL,
    uploader_name VARCHAR(100),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    download_count INTEGER NOT NULL DEFAULT 0,
    checksum VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_file_metadata_tenant_id ON hr_file.file_metadata(tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_reference ON hr_file.file_metadata(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploader_id ON hr_file.file_metadata(uploader_id);
