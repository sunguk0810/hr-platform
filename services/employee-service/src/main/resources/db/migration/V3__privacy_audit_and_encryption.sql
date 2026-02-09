-- V3: Privacy audit log and resident number encryption support

-- Widen resident_number column for encrypted data
ALTER TABLE hr_core.employee ALTER COLUMN resident_number TYPE VARCHAR(500);

-- Privacy access log table
CREATE TABLE IF NOT EXISTS hr_core.privacy_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    actor_id UUID NOT NULL,
    actor_name VARCHAR(100),
    employee_id UUID NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_privacy_access_log_employee
    ON hr_core.privacy_access_log(employee_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_privacy_access_log_actor
    ON hr_core.privacy_access_log(actor_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_privacy_access_log_accessed_at
    ON hr_core.privacy_access_log(accessed_at);

-- RLS
ALTER TABLE hr_core.privacy_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY privacy_access_log_tenant_isolation ON hr_core.privacy_access_log
    USING (tenant_id::text = current_setting('app.current_tenant', true));
