-- Code Group table
CREATE TABLE IF NOT EXISTS tenant_common.code_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- null for system codes
    group_code VARCHAR(50) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    group_name_en VARCHAR(100),
    description VARCHAR(500),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_hierarchical BOOLEAN NOT NULL DEFAULT FALSE,
    max_level INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Unique constraint for code group (tenant_id can be null for system codes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_code_group_tenant_code
    ON tenant_common.code_group(tenant_id, group_code)
    WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_code_group_system_code
    ON tenant_common.code_group(group_code)
    WHERE tenant_id IS NULL;

-- Indexes for code_group
CREATE INDEX IF NOT EXISTS idx_code_group_tenant_id ON tenant_common.code_group(tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_group_status ON tenant_common.code_group(status);

-- Common Code table
CREATE TABLE IF NOT EXISTS tenant_common.common_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_group_id UUID NOT NULL REFERENCES tenant_common.code_group(id) ON DELETE CASCADE,
    tenant_id UUID, -- null for system codes
    parent_code_id UUID,
    level INTEGER NOT NULL DEFAULT 1,
    code VARCHAR(50) NOT NULL,
    code_name VARCHAR(100) NOT NULL,
    code_name_en VARCHAR(100),
    description VARCHAR(500),
    extra_value1 VARCHAR(100),
    extra_value2 VARCHAR(100),
    extra_value3 VARCHAR(100),
    extra_json TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    effective_from DATE,
    effective_to DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    FOREIGN KEY (parent_code_id) REFERENCES tenant_common.common_code(id) ON DELETE SET NULL
);

-- Indexes for common_code
CREATE INDEX IF NOT EXISTS idx_common_code_group_id ON tenant_common.common_code(code_group_id);
CREATE INDEX IF NOT EXISTS idx_common_code_tenant_id ON tenant_common.common_code(tenant_id);
CREATE INDEX IF NOT EXISTS idx_common_code_parent_id ON tenant_common.common_code(parent_code_id);
CREATE INDEX IF NOT EXISTS idx_common_code_status ON tenant_common.common_code(status);

-- Code Tenant Mapping table (for tenant-specific customization)
CREATE TABLE IF NOT EXISTS tenant_common.code_tenant_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    common_code_id UUID NOT NULL REFERENCES tenant_common.common_code(id) ON DELETE CASCADE,
    custom_code_name VARCHAR(100),
    custom_code_name_en VARCHAR(100),
    custom_description VARCHAR(500),
    custom_extra_value1 VARCHAR(100),
    custom_extra_value2 VARCHAR(100),
    custom_extra_value3 VARCHAR(100),
    custom_extra_json TEXT,
    custom_sort_order INTEGER,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, common_code_id)
);

-- Indexes for code_tenant_mapping
CREATE INDEX IF NOT EXISTS idx_code_tenant_mapping_tenant_id ON tenant_common.code_tenant_mapping(tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_tenant_mapping_code_id ON tenant_common.code_tenant_mapping(common_code_id);

-- Code History table
CREATE TABLE IF NOT EXISTS tenant_common.code_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    code_id UUID NOT NULL,
    code_group_id UUID NOT NULL,
    group_code VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    change_reason VARCHAR(500),
    changed_by VARCHAR(100),
    changed_by_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes for code_history
CREATE INDEX IF NOT EXISTS idx_code_history_code_id ON tenant_common.code_history(code_id);
CREATE INDEX IF NOT EXISTS idx_code_history_tenant_id ON tenant_common.code_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_history_action ON tenant_common.code_history(action);
CREATE INDEX IF NOT EXISTS idx_code_history_group_code ON tenant_common.code_history(group_code);
