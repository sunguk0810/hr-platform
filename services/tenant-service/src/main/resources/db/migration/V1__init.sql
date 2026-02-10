-- Tenant Service: Consolidated Migration (V1)
-- Merged from: V30__init_tenant.sql, V36__add_tenant_termination_tracking.sql, V37__tenant_hierarchy_branding_settings.sql

SET search_path TO tenant_common, public;

-- Race-safe: tenant_common schema is shared with mdm-service, auth-service
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION tenant_common.get_current_tenant_safe()
    RETURNS UUID AS $func$
    DECLARE
        tenant_value TEXT;
    BEGIN
        tenant_value := current_setting('app.current_tenant', true);
        IF tenant_value IS NULL OR tenant_value = '' THEN
            RETURN NULL;
        END IF;
        RETURN tenant_value::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NULL;
    END;
    $func$ LANGUAGE plpgsql STABLE;
EXCEPTION
    WHEN unique_violation THEN NULL;
END;
$$;

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 tenant (includes V36 terminated_at/data_retention_until, V37 hierarchy/branding/settings columns)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.tenant (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                VARCHAR(50)  NOT NULL UNIQUE,
    name                VARCHAR(200) NOT NULL,
    name_en             VARCHAR(200),
    description         TEXT,
    logo_url            VARCHAR(500),
    business_number     VARCHAR(20),
    representative_name VARCHAR(100),
    address             VARCHAR(500),
    phone               VARCHAR(20),
    email               VARCHAR(100),
    status              VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    plan_type           VARCHAR(20)  NOT NULL DEFAULT 'STANDARD',
    contract_start_date DATE,
    contract_end_date   DATE,
    max_employees       INTEGER,
    terminated_at       TIMESTAMPTZ,
    data_retention_until TIMESTAMPTZ,
    parent_id           UUID REFERENCES tenant_common.tenant(id),
    level               INTEGER NOT NULL DEFAULT 0,
    admin_email         VARCHAR(100),
    admin_name          VARCHAR(100),
    branding_data       TEXT,
    settings_data       TEXT,
    hierarchy_data      TEXT,
    allowed_modules     TEXT,
    max_departments     INTEGER,
    created_at          TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_tenant_code              ON tenant_common.tenant(code);
CREATE INDEX IF NOT EXISTS idx_tenant_status            ON tenant_common.tenant(status);
CREATE INDEX IF NOT EXISTS idx_tenant_contract_end_date ON tenant_common.tenant(contract_end_date);
CREATE INDEX IF NOT EXISTS idx_tenant_terminated_at     ON tenant_common.tenant(terminated_at);
CREATE INDEX IF NOT EXISTS idx_tenant_parent_id         ON tenant_common.tenant(parent_id);
CREATE INDEX IF NOT EXISTS idx_tenant_level             ON tenant_common.tenant(level);

-- -----------------------------------------------------------------------------
-- 1.2 tenant_policy
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.tenant_policy (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID         NOT NULL,
    policy_type VARCHAR(30)  NOT NULL,
    policy_data TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),

    CONSTRAINT uk_tenant_policy_type   UNIQUE (tenant_id, policy_type),
    CONSTRAINT fk_tenant_policy_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenant_common.tenant(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_policy_tenant_id ON tenant_common.tenant_policy(tenant_id);

-- -----------------------------------------------------------------------------
-- 1.3 tenant_feature
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.tenant_feature (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    feature_code VARCHAR(50)  NOT NULL,
    is_enabled   BOOLEAN      NOT NULL DEFAULT false,
    config       TEXT,
    created_at   TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP,
    created_by   VARCHAR(100),
    updated_by   VARCHAR(100),

    CONSTRAINT uk_tenant_feature_code   UNIQUE (tenant_id, feature_code),
    CONSTRAINT fk_tenant_feature_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenant_common.tenant(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_feature_tenant_id ON tenant_common.tenant_feature(tenant_id);

-- -----------------------------------------------------------------------------
-- 1.4 policy_change_history (from V37)
-- -----------------------------------------------------------------------------
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

-- =============================================================================
-- 2. TRIGGERS (auto-update updated_at)
-- =============================================================================

CREATE OR REPLACE FUNCTION tenant_common.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_tenant_updated_at ON tenant_common.tenant;
CREATE TRIGGER tr_tenant_updated_at
    BEFORE UPDATE ON tenant_common.tenant
    FOR EACH ROW
    EXECUTE FUNCTION tenant_common.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_tenant_policy_updated_at ON tenant_common.tenant_policy;
CREATE TRIGGER tr_tenant_policy_updated_at
    BEFORE UPDATE ON tenant_common.tenant_policy
    FOR EACH ROW
    EXECUTE FUNCTION tenant_common.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_tenant_feature_updated_at ON tenant_common.tenant_feature;
CREATE TRIGGER tr_tenant_feature_updated_at
    BEFORE UPDATE ON tenant_common.tenant_feature
    FOR EACH ROW
    EXECUTE FUNCTION tenant_common.update_updated_at_column();

-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- NOTE: tenant table does NOT have RLS (managed by SUPER_ADMIN only).
--       Only tenant_policy and tenant_feature have RLS.
-- =============================================================================

ALTER TABLE tenant_common.tenant_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.tenant_policy FORCE ROW LEVEL SECURITY;

ALTER TABLE tenant_common.tenant_feature ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.tenant_feature FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. RLS POLICIES
-- =============================================================================

-- ---- tenant_policy ----

DROP POLICY IF EXISTS tenant_policy_isolation_select ON tenant_common.tenant_policy;
CREATE POLICY tenant_policy_isolation_select ON tenant_common.tenant_policy
    FOR SELECT
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

DROP POLICY IF EXISTS tenant_policy_isolation_insert ON tenant_common.tenant_policy;
CREATE POLICY tenant_policy_isolation_insert ON tenant_common.tenant_policy
    FOR INSERT
    WITH CHECK (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

DROP POLICY IF EXISTS tenant_policy_isolation_update ON tenant_common.tenant_policy;
CREATE POLICY tenant_policy_isolation_update ON tenant_common.tenant_policy
    FOR UPDATE
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    )
    WITH CHECK (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

DROP POLICY IF EXISTS tenant_policy_isolation_delete ON tenant_common.tenant_policy;
CREATE POLICY tenant_policy_isolation_delete ON tenant_common.tenant_policy
    FOR DELETE
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

-- ---- tenant_feature ----

DROP POLICY IF EXISTS tenant_feature_isolation_select ON tenant_common.tenant_feature;
CREATE POLICY tenant_feature_isolation_select ON tenant_common.tenant_feature
    FOR SELECT
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

DROP POLICY IF EXISTS tenant_feature_isolation_insert ON tenant_common.tenant_feature;
CREATE POLICY tenant_feature_isolation_insert ON tenant_common.tenant_feature
    FOR INSERT
    WITH CHECK (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

DROP POLICY IF EXISTS tenant_feature_isolation_update ON tenant_common.tenant_feature;
CREATE POLICY tenant_feature_isolation_update ON tenant_common.tenant_feature
    FOR UPDATE
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    )
    WITH CHECK (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

DROP POLICY IF EXISTS tenant_feature_isolation_delete ON tenant_common.tenant_feature;
CREATE POLICY tenant_feature_isolation_delete ON tenant_common.tenant_feature
    FOR DELETE
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

-- =============================================================================
-- 5. SEED DATA
-- =============================================================================

INSERT INTO tenant_common.tenant (
    id, code, name, name_en, description, logo_url, status, plan_type,
    terminated_at, data_retention_until,
    parent_id, level, admin_email, admin_name,
    branding_data, settings_data, hierarchy_data, allowed_modules, max_departments
)
VALUES (
    '00000000-0000-0000-0000-000000000001', 'DEFAULT', '기본 테넌트', NULL, NULL, NULL, 'ACTIVE', 'ENTERPRISE',
    NULL, NULL,
    NULL, 0, NULL, NULL,
    NULL, NULL, NULL, NULL, NULL
)
ON CONFLICT (code) DO NOTHING;
