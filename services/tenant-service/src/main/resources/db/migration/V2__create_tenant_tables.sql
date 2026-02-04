-- V2: Create tenant tables

-- Main tenant table (no tenant_id - this IS the tenant)
CREATE TABLE IF NOT EXISTS tenant_common.tenant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    business_number VARCHAR(20),
    representative_name VARCHAR(100),
    address VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    plan_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    contract_start_date DATE,
    contract_end_date DATE,
    max_employees INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Tenant policy table (has tenant_id for RLS)
CREATE TABLE IF NOT EXISTS tenant_common.tenant_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    policy_type VARCHAR(30) NOT NULL,
    policy_data TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uk_tenant_policy_type UNIQUE (tenant_id, policy_type),
    CONSTRAINT fk_tenant_policy_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenant_common.tenant(id) ON DELETE CASCADE
);

-- Tenant feature table (has tenant_id for RLS)
CREATE TABLE IF NOT EXISTS tenant_common.tenant_feature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    feature_code VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    config TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT uk_tenant_feature_code UNIQUE (tenant_id, feature_code),
    CONSTRAINT fk_tenant_feature_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenant_common.tenant(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_code ON tenant_common.tenant(code);
CREATE INDEX IF NOT EXISTS idx_tenant_status ON tenant_common.tenant(status);
CREATE INDEX IF NOT EXISTS idx_tenant_policy_tenant_id ON tenant_common.tenant_policy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_tenant_id ON tenant_common.tenant_feature(tenant_id);

-- Trigger for auto-updating updated_at
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
