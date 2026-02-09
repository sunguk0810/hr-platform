-- V32: Tenant hierarchy, branding, and settings extensions
-- Adds parent/child hierarchy, branding, settings, and policy change history

-- tenant 테이블 확장
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tenant_common.tenant(id);
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS level SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS admin_email VARCHAR(100);
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS admin_name VARCHAR(100);
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS branding_data TEXT;
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS settings_data TEXT;
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS hierarchy_data TEXT;
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS allowed_modules TEXT;
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS max_departments INTEGER;

CREATE INDEX IF NOT EXISTS idx_tenant_parent_id ON tenant_common.tenant(parent_id);
CREATE INDEX IF NOT EXISTS idx_tenant_level ON tenant_common.tenant(level);

-- 정책 변경 이력 테이블
CREATE TABLE IF NOT EXISTS tenant_common.policy_change_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenant_common.tenant(id) ON DELETE CASCADE,
    policy_type     VARCHAR(30) NOT NULL,
    action          VARCHAR(20) NOT NULL,
    before_value    TEXT,
    after_value     TEXT NOT NULL,
    changed_by      VARCHAR(100),
    changed_by_name VARCHAR(200),
    changed_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reason          TEXT,
    source_id       UUID,
    source_name     VARCHAR(200)
);

CREATE INDEX IF NOT EXISTS idx_policy_history_tenant ON tenant_common.policy_change_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_history_type ON tenant_common.policy_change_history(tenant_id, policy_type);
