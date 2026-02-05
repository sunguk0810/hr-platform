-- ============================================================================
-- HR SaaS Platform - Combined Migrations for DataGrip
-- Run 00_reset_all.sql FIRST if you need to start fresh
-- Then run this file to create all tables
-- ============================================================================


-- ============================================================================
-- SERVICE: tenant-service
-- ============================================================================

-- V30__create_schema.sql
-- V1: Create schema for tenant service
-- Schema tenant_common should already exist from docker/postgres/init.sql

DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_common') THEN
            CREATE SCHEMA tenant_common;
        END IF;
    END
$$;

GRANT ALL PRIVILEGES ON SCHEMA tenant_common TO CURRENT_USER;
GRANT USAGE ON SCHEMA tenant_common TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant_common GRANT ALL ON TABLES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant_common GRANT ALL ON SEQUENCES TO CURRENT_USER;


-- V31__create_tenant_tables.sql
-- V2: Create tenant tables

-- Main tenant table (no tenant_id - this IS the tenant)
CREATE TABLE IF NOT EXISTS tenant_common.tenant
(
    id                  UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    code                VARCHAR(50)  NOT NULL UNIQUE,
    name                VARCHAR(200) NOT NULL,
    business_number     VARCHAR(20),
    representative_name VARCHAR(100),
    address             VARCHAR(500),
    phone               VARCHAR(20),
    email               VARCHAR(100),
    status              VARCHAR(20)  NOT NULL    DEFAULT 'ACTIVE',
    plan_type           VARCHAR(20)  NOT NULL    DEFAULT 'STANDARD',
    contract_start_date DATE,
    contract_end_date   DATE,
    max_employees       INTEGER,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by          UUID,
    updated_by          UUID
);

-- Tenant policy table (has tenant_id for RLS)
CREATE TABLE IF NOT EXISTS tenant_common.tenant_policy
(
    id          UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL,
    policy_type VARCHAR(30) NOT NULL,
    policy_data TEXT,
    is_active   BOOLEAN     NOT NULL     DEFAULT true,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by  UUID,
    updated_by  UUID,
    CONSTRAINT uk_tenant_policy_type UNIQUE (tenant_id, policy_type),
    CONSTRAINT fk_tenant_policy_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenant_common.tenant (id) ON DELETE CASCADE
);

-- Tenant feature table (has tenant_id for RLS)
CREATE TABLE IF NOT EXISTS tenant_common.tenant_feature
(
    id           UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id    UUID        NOT NULL,
    feature_code VARCHAR(50) NOT NULL,
    is_enabled   BOOLEAN     NOT NULL     DEFAULT false,
    config       TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by   UUID,
    updated_by   UUID,
    CONSTRAINT uk_tenant_feature_code UNIQUE (tenant_id, feature_code),
    CONSTRAINT fk_tenant_feature_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenant_common.tenant (id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_code ON tenant_common.tenant (code);
CREATE INDEX IF NOT EXISTS idx_tenant_status ON tenant_common.tenant (status);
CREATE INDEX IF NOT EXISTS idx_tenant_policy_tenant_id ON tenant_common.tenant_policy (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_tenant_id ON tenant_common.tenant_feature (tenant_id);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION tenant_common.update_updated_at_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_tenant_updated_at ON tenant_common.tenant;
CREATE TRIGGER tr_tenant_updated_at
    BEFORE UPDATE
    ON tenant_common.tenant
    FOR EACH ROW
EXECUTE FUNCTION tenant_common.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_tenant_policy_updated_at ON tenant_common.tenant_policy;
CREATE TRIGGER tr_tenant_policy_updated_at
    BEFORE UPDATE
    ON tenant_common.tenant_policy
    FOR EACH ROW
EXECUTE FUNCTION tenant_common.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_tenant_feature_updated_at ON tenant_common.tenant_feature;
CREATE TRIGGER tr_tenant_feature_updated_at
    BEFORE UPDATE
    ON tenant_common.tenant_feature
    FOR EACH ROW
EXECUTE FUNCTION tenant_common.update_updated_at_column();


-- V32__enable_rls.sql
-- V3: Enable Row Level Security on tenant-related tables
-- Note: tenant table does NOT have RLS (managed by SUPER_ADMIN only)
-- tenant_policy and tenant_feature have tenant_id and need RLS

-- Enable RLS on tenant_policy table
ALTER TABLE tenant_common.tenant_policy
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.tenant_policy
    FORCE ROW LEVEL SECURITY;

-- Enable RLS on tenant_feature table
ALTER TABLE tenant_common.tenant_feature
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.tenant_feature
    FORCE ROW LEVEL SECURITY;


-- V33__create_rls_policies.sql
-- V4: Create Row Level Security policies for tenant isolation

-- Helper function to safely get current tenant
CREATE OR REPLACE FUNCTION tenant_common.get_current_tenant_safe()
    RETURNS UUID AS
$$
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
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- Policies for tenant_common.tenant_policy table
-- ========================================

DROP POLICY IF EXISTS tenant_policy_isolation_select ON tenant_common.tenant_policy;
CREATE POLICY tenant_policy_isolation_select ON tenant_common.tenant_policy
    FOR SELECT
    USING (tenant_id = tenant_common.get_current_tenant_safe());

DROP POLICY IF EXISTS tenant_policy_isolation_insert ON tenant_common.tenant_policy;
CREATE POLICY tenant_policy_isolation_insert ON tenant_common.tenant_policy
    FOR INSERT
    WITH CHECK (tenant_id = tenant_common.get_current_tenant_safe());

DROP POLICY IF EXISTS tenant_policy_isolation_update ON tenant_common.tenant_policy;
CREATE POLICY tenant_policy_isolation_update ON tenant_common.tenant_policy
    FOR UPDATE
    USING (tenant_id = tenant_common.get_current_tenant_safe())
    WITH CHECK (tenant_id = tenant_common.get_current_tenant_safe());

DROP POLICY IF EXISTS tenant_policy_isolation_delete ON tenant_common.tenant_policy;
CREATE POLICY tenant_policy_isolation_delete ON tenant_common.tenant_policy
    FOR DELETE
    USING (tenant_id = tenant_common.get_current_tenant_safe());

-- ========================================
-- Policies for tenant_common.tenant_feature table
-- ========================================

DROP POLICY IF EXISTS tenant_feature_isolation_select ON tenant_common.tenant_feature;
CREATE POLICY tenant_feature_isolation_select ON tenant_common.tenant_feature
    FOR SELECT
    USING (tenant_id = tenant_common.get_current_tenant_safe());

DROP POLICY IF EXISTS tenant_feature_isolation_insert ON tenant_common.tenant_feature;
CREATE POLICY tenant_feature_isolation_insert ON tenant_common.tenant_feature
    FOR INSERT
    WITH CHECK (tenant_id = tenant_common.get_current_tenant_safe());

DROP POLICY IF EXISTS tenant_feature_isolation_update ON tenant_common.tenant_feature;
CREATE POLICY tenant_feature_isolation_update ON tenant_common.tenant_feature
    FOR UPDATE
    USING (tenant_id = tenant_common.get_current_tenant_safe())
    WITH CHECK (tenant_id = tenant_common.get_current_tenant_safe());

DROP POLICY IF EXISTS tenant_feature_isolation_delete ON tenant_common.tenant_feature;
CREATE POLICY tenant_feature_isolation_delete ON tenant_common.tenant_feature
    FOR DELETE
    USING (tenant_id = tenant_common.get_current_tenant_safe());

-- ========================================
-- Comments
-- ========================================
COMMENT ON POLICY tenant_policy_isolation_select ON tenant_common.tenant_policy IS
    'Ensures users can only SELECT policies belonging to their tenant';
COMMENT ON POLICY tenant_feature_isolation_select ON tenant_common.tenant_feature IS
    'Ensures users can only SELECT features belonging to their tenant';


-- V34__fix_audit_columns_type.sql
-- ============================================================================
-- V3__fix_audit_columns_type.sql
-- Fix created_by/updated_by columns from UUID to VARCHAR(100) for consistency
-- ============================================================================

-- tenant table
ALTER TABLE tenant_common.tenant
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- tenant_policy table
ALTER TABLE tenant_common.tenant_policy
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- tenant_feature table
ALTER TABLE tenant_common.tenant_feature
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);


-- ============================================================================
-- SERVICE: mdm-service
-- ============================================================================

-- V1__create_schema.sql
-- Create tenant_common schema for MDM service
CREATE SCHEMA IF NOT EXISTS tenant_common;

-- Grant permissions
GRANT USAGE ON SCHEMA tenant_common TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA tenant_common TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA tenant_common TO PUBLIC;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant_common GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA tenant_common GRANT ALL ON SEQUENCES TO PUBLIC;


-- V2__create_mdm_tables.sql
-- Code Group table
CREATE TABLE IF NOT EXISTS tenant_common.code_group
(
    id              UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id       UUID, -- null for system codes
    group_code      VARCHAR(50)              NOT NULL,
    group_name      VARCHAR(100)             NOT NULL,
    group_name_en   VARCHAR(100),
    description     VARCHAR(500),
    is_system       BOOLEAN                  NOT NULL DEFAULT FALSE,
    is_hierarchical BOOLEAN                  NOT NULL DEFAULT FALSE,
    max_level       INTEGER                           DEFAULT 1,
    status          VARCHAR(20)              NOT NULL DEFAULT 'ACTIVE',
    is_active       BOOLEAN                  NOT NULL DEFAULT TRUE,
    sort_order      INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- Unique constraint for code group (tenant_id can be null for system codes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_code_group_tenant_code
    ON tenant_common.code_group (tenant_id, group_code)
    WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_code_group_system_code
    ON tenant_common.code_group (group_code)
    WHERE tenant_id IS NULL;

-- Indexes for code_group
CREATE INDEX IF NOT EXISTS idx_code_group_tenant_id ON tenant_common.code_group (tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_group_status ON tenant_common.code_group (status);

-- Common Code table
CREATE TABLE IF NOT EXISTS tenant_common.common_code
(
    id             UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    code_group_id  UUID                     NOT NULL REFERENCES tenant_common.code_group (id) ON DELETE CASCADE,
    tenant_id      UUID, -- null for system codes
    parent_code_id UUID,
    level          INTEGER                  NOT NULL DEFAULT 1,
    code           VARCHAR(50)              NOT NULL,
    code_name      VARCHAR(100)             NOT NULL,
    code_name_en   VARCHAR(100),
    description    VARCHAR(500),
    extra_value1   VARCHAR(100),
    extra_value2   VARCHAR(100),
    extra_value3   VARCHAR(100),
    extra_json     TEXT,
    is_default     BOOLEAN                  NOT NULL DEFAULT FALSE,
    effective_from DATE,
    effective_to   DATE,
    status         VARCHAR(20)              NOT NULL DEFAULT 'ACTIVE',
    is_active      BOOLEAN                  NOT NULL DEFAULT TRUE,
    sort_order     INTEGER,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(100),
    updated_by     VARCHAR(100),
    FOREIGN KEY (parent_code_id) REFERENCES tenant_common.common_code (id) ON DELETE SET NULL
);

-- Indexes for common_code
CREATE INDEX IF NOT EXISTS idx_common_code_group_id ON tenant_common.common_code (code_group_id);
CREATE INDEX IF NOT EXISTS idx_common_code_tenant_id ON tenant_common.common_code (tenant_id);
CREATE INDEX IF NOT EXISTS idx_common_code_parent_id ON tenant_common.common_code (parent_code_id);
CREATE INDEX IF NOT EXISTS idx_common_code_status ON tenant_common.common_code (status);

-- Code Tenant Mapping table (for tenant-specific customization)
CREATE TABLE IF NOT EXISTS tenant_common.code_tenant_mapping
(
    id                  UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id           UUID                     NOT NULL,
    common_code_id      UUID                     NOT NULL REFERENCES tenant_common.common_code (id) ON DELETE CASCADE,
    custom_code_name    VARCHAR(100),
    custom_code_name_en VARCHAR(100),
    custom_description  VARCHAR(500),
    custom_extra_value1 VARCHAR(100),
    custom_extra_value2 VARCHAR(100),
    custom_extra_value3 VARCHAR(100),
    custom_extra_json   TEXT,
    custom_sort_order   INTEGER,
    is_hidden           BOOLEAN                  NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN                  NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),
    UNIQUE (tenant_id, common_code_id)
);

-- Indexes for code_tenant_mapping
CREATE INDEX IF NOT EXISTS idx_code_tenant_mapping_tenant_id ON tenant_common.code_tenant_mapping (tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_tenant_mapping_code_id ON tenant_common.code_tenant_mapping (common_code_id);

-- Code History table
CREATE TABLE IF NOT EXISTS tenant_common.code_history
(
    id            UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id     UUID,
    code_id       UUID                     NOT NULL,
    code_group_id UUID                     NOT NULL,
    group_code    VARCHAR(50)              NOT NULL,
    code          VARCHAR(50)              NOT NULL,
    action        VARCHAR(20)              NOT NULL,
    field_name    VARCHAR(100),
    old_value     TEXT,
    new_value     TEXT,
    change_reason VARCHAR(500),
    changed_by    VARCHAR(100),
    changed_by_id UUID,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    VARCHAR(100),
    updated_by    VARCHAR(100)
);

-- Indexes for code_history
CREATE INDEX IF NOT EXISTS idx_code_history_code_id ON tenant_common.code_history (code_id);
CREATE INDEX IF NOT EXISTS idx_code_history_tenant_id ON tenant_common.code_history (tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_history_action ON tenant_common.code_history (action);
CREATE INDEX IF NOT EXISTS idx_code_history_group_code ON tenant_common.code_history (group_code);


-- V3__enable_rls.sql
-- Enable Row Level Security on MDM tables
-- Note: MDM has special behavior where tenant_id=NULL means system codes visible to all tenants

-- code_group (tenant_id can be NULL for system codes)
ALTER TABLE tenant_common.code_group
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.code_group
    FORCE ROW LEVEL SECURITY;

-- common_code (tenant_id can be NULL for system codes)
ALTER TABLE tenant_common.common_code
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.common_code
    FORCE ROW LEVEL SECURITY;

-- code_tenant_mapping (tenant_id is always required)
ALTER TABLE tenant_common.code_tenant_mapping
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.code_tenant_mapping
    FORCE ROW LEVEL SECURITY;

-- code_history (tenant_id can be NULL for system code changes)
ALTER TABLE tenant_common.code_history
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.code_history
    FORCE ROW LEVEL SECURITY;


-- V4__create_rls_policies.sql
-- Create safe tenant getter function (if not exists)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
    RETURNS UUID AS
$$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy for code_group
-- System codes (tenant_id IS NULL) are visible to all, tenant codes are restricted
DROP POLICY IF EXISTS code_group_tenant_isolation ON tenant_common.code_group;
CREATE POLICY code_group_tenant_isolation ON tenant_common.code_group
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL -- Super admin sees all
        OR tenant_id IS NULL -- System codes visible to all
        OR tenant_id = get_current_tenant_safe() -- Tenant sees own codes
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL -- Super admin can create any
        OR tenant_id IS NULL -- System codes (admin only in practice)
        OR tenant_id = get_current_tenant_safe() -- Tenant can create own
    );

-- RLS Policy for common_code
-- System codes (tenant_id IS NULL) are visible to all, tenant codes are restricted
DROP POLICY IF EXISTS common_code_tenant_isolation ON tenant_common.common_code;
CREATE POLICY common_code_tenant_isolation ON tenant_common.common_code
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL -- Super admin sees all
        OR tenant_id IS NULL -- System codes visible to all
        OR tenant_id = get_current_tenant_safe() -- Tenant sees own codes
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL -- Super admin can create any
        OR tenant_id IS NULL -- System codes (admin only in practice)
        OR tenant_id = get_current_tenant_safe() -- Tenant can create own
    );

-- RLS Policy for code_tenant_mapping
-- Each tenant only sees their own customizations
DROP POLICY IF EXISTS code_tenant_mapping_tenant_isolation ON tenant_common.code_tenant_mapping;
CREATE POLICY code_tenant_mapping_tenant_isolation ON tenant_common.code_tenant_mapping
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for code_history
-- System code history (tenant_id IS NULL) is visible to all, tenant history is restricted
DROP POLICY IF EXISTS code_history_tenant_isolation ON tenant_common.code_history;
CREATE POLICY code_history_tenant_isolation ON tenant_common.code_history
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL -- Super admin sees all
        OR tenant_id IS NULL -- System code history visible to all
        OR tenant_id = get_current_tenant_safe() -- Tenant sees own history
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id IS NULL
        OR tenant_id = get_current_tenant_safe()
    );


-- V10__create_menu_tables.sql
-- ============================================
-- V10: Create Menu Management Tables
-- Dynamic menu system for multi-tenant HR SaaS
-- ============================================

-- Menu Item: Core menu definition table
CREATE TABLE IF NOT EXISTS tenant_common.menu_item
(
    id                UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    parent_id         UUID REFERENCES tenant_common.menu_item (id) ON DELETE CASCADE,
    code              VARCHAR(50)  NOT NULL UNIQUE,
    name              VARCHAR(100) NOT NULL,
    name_en           VARCHAR(100),
    path              VARCHAR(200),
    icon              VARCHAR(50),
    menu_type         VARCHAR(20)  NOT NULL DEFAULT 'INTERNAL',
    external_url      VARCHAR(500),
    level             INTEGER      NOT NULL DEFAULT 1,
    sort_order        INTEGER      NOT NULL DEFAULT 0,
    feature_code      VARCHAR(50),
    is_system         BOOLEAN      NOT NULL DEFAULT true,
    is_active         BOOLEAN      NOT NULL DEFAULT true,
    show_in_nav       BOOLEAN      NOT NULL DEFAULT true,
    show_in_mobile    BOOLEAN      NOT NULL DEFAULT false,
    mobile_sort_order INTEGER,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),

    CONSTRAINT chk_menu_type CHECK (menu_type IN ('INTERNAL', 'EXTERNAL', 'DIVIDER', 'HEADER'))
);

-- Create index for parent lookup
CREATE INDEX IF NOT EXISTS idx_menu_item_parent ON tenant_common.menu_item (parent_id);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_menu_item_sort ON tenant_common.menu_item (level, sort_order);

-- Create index for code lookup
CREATE INDEX IF NOT EXISTS idx_menu_item_code ON tenant_common.menu_item (code);

-- Menu Permission: Maps menus to required roles/permissions
CREATE TABLE IF NOT EXISTS tenant_common.menu_permission
(
    id               UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    menu_item_id     UUID        NOT NULL REFERENCES tenant_common.menu_item (id) ON DELETE CASCADE,
    permission_type  VARCHAR(20) NOT NULL,
    permission_value VARCHAR(50) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_permission_type CHECK (permission_type IN ('ROLE', 'PERMISSION')),
    CONSTRAINT uq_menu_permission UNIQUE (menu_item_id, permission_type, permission_value)
);

-- Create index for menu lookup
CREATE INDEX IF NOT EXISTS idx_menu_permission_menu ON tenant_common.menu_permission (menu_item_id);

-- Tenant Menu Config: Per-tenant menu customization
CREATE TABLE IF NOT EXISTS tenant_common.tenant_menu_config
(
    id                UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    tenant_id         UUID        NOT NULL,
    menu_item_id      UUID        NOT NULL REFERENCES tenant_common.menu_item (id) ON DELETE CASCADE,
    is_enabled        BOOLEAN     NOT NULL DEFAULT true,
    custom_name       VARCHAR(100),
    custom_sort_order INTEGER,
    show_in_mobile    BOOLEAN,
    mobile_sort_order INTEGER,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tenant_menu_config UNIQUE (tenant_id, menu_item_id)
);

-- Create index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_tenant_menu_config_tenant ON tenant_common.tenant_menu_config (tenant_id);

-- Create index for menu lookup
CREATE INDEX IF NOT EXISTS idx_tenant_menu_config_menu ON tenant_common.tenant_menu_config (menu_item_id);

-- Add comments for documentation
COMMENT ON TABLE tenant_common.menu_item IS 'Core menu item definitions';
COMMENT ON COLUMN tenant_common.menu_item.code IS 'Unique identifier for the menu (e.g., EMPLOYEES, ATTENDANCE)';
COMMENT ON COLUMN tenant_common.menu_item.path IS 'Frontend route path (e.g., /employees)';
COMMENT ON COLUMN tenant_common.menu_item.icon IS 'Lucide icon name (e.g., Users, Calendar)';
COMMENT ON COLUMN tenant_common.menu_item.menu_type IS 'INTERNAL (app route), EXTERNAL (link), DIVIDER, HEADER';
COMMENT ON COLUMN tenant_common.menu_item.feature_code IS 'Links to TenantFeature for feature flag control';
COMMENT ON COLUMN tenant_common.menu_item.is_system IS 'System menus cannot be deleted by tenants';
COMMENT ON COLUMN tenant_common.menu_item.show_in_mobile IS 'Whether to show in mobile bottom tab bar';

COMMENT ON TABLE tenant_common.menu_permission IS 'Required permissions for menu access';
COMMENT ON COLUMN tenant_common.menu_permission.permission_type IS 'ROLE (e.g., HR_MANAGER) or PERMISSION (e.g., employee:read)';

COMMENT ON TABLE tenant_common.tenant_menu_config IS 'Per-tenant menu customization';
COMMENT ON COLUMN tenant_common.tenant_menu_config.custom_name IS 'Override menu name for this tenant';


-- V12__add_menu_table_defaults.sql
-- ============================================
-- V12: Add default values to menu tables
-- Fix for tables created by JPA without defaults
-- ============================================

-- menu_item defaults
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN menu_type SET DEFAULT 'INTERNAL';
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN level SET DEFAULT 1;
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN sort_order SET DEFAULT 0;
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN is_system SET DEFAULT true;
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN show_in_nav SET DEFAULT true;
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN show_in_mobile SET DEFAULT false;
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tenant_common.menu_item
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- menu_permission defaults
ALTER TABLE tenant_common.menu_permission
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tenant_common.menu_permission
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- tenant_menu_config defaults (if needed)
ALTER TABLE tenant_common.tenant_menu_config
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tenant_common.tenant_menu_config
    ALTER COLUMN is_enabled SET DEFAULT true;
ALTER TABLE tenant_common.tenant_menu_config
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tenant_common.tenant_menu_config
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- SERVICE: organization-service
-- ============================================================================

-- V20__create_schema.sql
-- Create hr_core schema for organization service
CREATE SCHEMA IF NOT EXISTS hr_core;

-- Grant permissions
GRANT USAGE ON SCHEMA hr_core TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_core TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_core GRANT ALL PRIVILEGES ON TABLES TO PUBLIC;


-- V21__create_organization_tables.sql
-- Department table
CREATE TABLE IF NOT EXISTS hr_core.department
(
    id         UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    tenant_id  UUID         NOT NULL,
    code       VARCHAR(50)  NOT NULL,
    name       VARCHAR(200) NOT NULL,
    name_en    VARCHAR(200),
    parent_id  UUID REFERENCES hr_core.department (id),
    level      INTEGER      NOT NULL DEFAULT 1,
    path       VARCHAR(500),
    manager_id UUID,
    status     VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_department_tenant_code UNIQUE (tenant_id, code)
);

-- Grade table
CREATE TABLE IF NOT EXISTS hr_core.grade
(
    id         UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    tenant_id  UUID         NOT NULL,
    code       VARCHAR(50)  NOT NULL,
    name       VARCHAR(100) NOT NULL,
    name_en    VARCHAR(100),
    level      INTEGER      NOT NULL,
    sort_order INTEGER,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_grade_tenant_code UNIQUE (tenant_id, code)
);

-- Position table
CREATE TABLE IF NOT EXISTS hr_core.position
(
    id         UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    tenant_id  UUID         NOT NULL,
    code       VARCHAR(50)  NOT NULL,
    name       VARCHAR(100) NOT NULL,
    name_en    VARCHAR(100),
    level      INTEGER      NOT NULL,
    sort_order INTEGER,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_position_tenant_code UNIQUE (tenant_id, code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_department_tenant_id ON hr_core.department (tenant_id);
CREATE INDEX IF NOT EXISTS idx_department_parent_id ON hr_core.department (parent_id);
CREATE INDEX IF NOT EXISTS idx_department_status ON hr_core.department (status);
CREATE INDEX IF NOT EXISTS idx_grade_tenant_id ON hr_core.grade (tenant_id);
CREATE INDEX IF NOT EXISTS idx_grade_is_active ON hr_core.grade (is_active);
CREATE INDEX IF NOT EXISTS idx_position_tenant_id ON hr_core.position (tenant_id);
CREATE INDEX IF NOT EXISTS idx_position_is_active ON hr_core.position (is_active);


-- V22__enable_rls.sql
-- Enable Row Level Security on organization tables
ALTER TABLE hr_core.department
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.grade
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.position
    ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well
ALTER TABLE hr_core.department
    FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_core.grade
    FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_core.position
    FORCE ROW LEVEL SECURITY;


-- V23__create_rls_policies.sql
-- Create safe tenant getter function (if not exists)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
    RETURNS UUID AS
$$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy for department table
DROP POLICY IF EXISTS department_tenant_isolation ON hr_core.department;
CREATE POLICY department_tenant_isolation ON hr_core.department
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for grade table
DROP POLICY IF EXISTS grade_tenant_isolation ON hr_core.grade;
CREATE POLICY grade_tenant_isolation ON hr_core.grade
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for position table
DROP POLICY IF EXISTS position_tenant_isolation ON hr_core.position;
CREATE POLICY position_tenant_isolation ON hr_core.position
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );


-- V24__create_announcement_tables.sql
-- Announcement table
CREATE TABLE IF NOT EXISTS hr_core.announcement
(
    id                UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    tenant_id         UUID         NOT NULL,
    title             VARCHAR(500) NOT NULL,
    content           TEXT,
    category          VARCHAR(20)  NOT NULL DEFAULT 'NOTICE',
    author_id         UUID         NOT NULL,
    author_name       VARCHAR(100),
    author_department VARCHAR(200),
    is_pinned         BOOLEAN      NOT NULL DEFAULT FALSE,
    view_count        BIGINT       NOT NULL DEFAULT 0,
    is_published      BOOLEAN      NOT NULL DEFAULT FALSE,
    published_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100)
);

-- Announcement attachment table
CREATE TABLE IF NOT EXISTS hr_core.announcement_attachment
(
    id              UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    announcement_id UUID         NOT NULL REFERENCES hr_core.announcement (id) ON DELETE CASCADE,
    file_id         UUID         NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_url        VARCHAR(1000),
    file_size       BIGINT       NOT NULL,
    content_type    VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcement_tenant_id ON hr_core.announcement (tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcement_category ON hr_core.announcement (category);
CREATE INDEX IF NOT EXISTS idx_announcement_is_published ON hr_core.announcement (is_published);
CREATE INDEX IF NOT EXISTS idx_announcement_is_pinned ON hr_core.announcement (is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcement_published_at ON hr_core.announcement (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_created_at ON hr_core.announcement (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_attachment_announcement_id ON hr_core.announcement_attachment (announcement_id);

-- Enable RLS
ALTER TABLE hr_core.announcement
    ENABLE ROW LEVEL SECURITY;

-- RLS Policy for announcement
CREATE POLICY announcement_tenant_isolation ON hr_core.announcement
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Comments
COMMENT ON TABLE hr_core.announcement IS '공지사항';
COMMENT ON COLUMN hr_core.announcement.title IS '제목';
COMMENT ON COLUMN hr_core.announcement.content IS '내용';
COMMENT ON COLUMN hr_core.announcement.category IS '카테고리 (NOTICE, EVENT, UPDATE, URGENT)';
COMMENT ON COLUMN hr_core.announcement.author_id IS '작성자 ID';
COMMENT ON COLUMN hr_core.announcement.author_name IS '작성자 이름';
COMMENT ON COLUMN hr_core.announcement.author_department IS '작성자 부서';
COMMENT ON COLUMN hr_core.announcement.is_pinned IS '상단 고정 여부';
COMMENT ON COLUMN hr_core.announcement.view_count IS '조회수';
COMMENT ON COLUMN hr_core.announcement.is_published IS '발행 여부';
COMMENT ON COLUMN hr_core.announcement.published_at IS '발행 일시';

COMMENT ON TABLE hr_core.announcement_attachment IS '공지사항 첨부파일';
COMMENT ON COLUMN hr_core.announcement_attachment.file_id IS '파일 서비스 파일 ID';
COMMENT ON COLUMN hr_core.announcement_attachment.file_name IS '파일명';
COMMENT ON COLUMN hr_core.announcement_attachment.file_url IS '파일 URL';
COMMENT ON COLUMN hr_core.announcement_attachment.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN hr_core.announcement_attachment.content_type IS 'Content-Type';


-- V25__create_committee_tables.sql
-- Committee table
CREATE TABLE IF NOT EXISTS hr_core.committee
(
    id               UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    tenant_id        UUID         NOT NULL,
    code             VARCHAR(50)  NOT NULL,
    name             VARCHAR(200) NOT NULL,
    name_en          VARCHAR(200),
    type             VARCHAR(20)  NOT NULL DEFAULT 'PERMANENT',
    purpose          TEXT,
    start_date       DATE,
    end_date         DATE,
    meeting_schedule VARCHAR(500),
    status           VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100),
    CONSTRAINT uk_committee_tenant_code UNIQUE (tenant_id, code)
);

-- Committee member table
CREATE TABLE IF NOT EXISTS hr_core.committee_member
(
    id              UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    committee_id    UUID        NOT NULL REFERENCES hr_core.committee (id) ON DELETE CASCADE,
    employee_id     UUID        NOT NULL,
    employee_name   VARCHAR(100),
    department_name VARCHAR(200),
    position_name   VARCHAR(100),
    role            VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    join_date       DATE,
    leave_date      DATE,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_committee_tenant_id ON hr_core.committee (tenant_id);
CREATE INDEX IF NOT EXISTS idx_committee_status ON hr_core.committee (status);
CREATE INDEX IF NOT EXISTS idx_committee_type ON hr_core.committee (type);
CREATE INDEX IF NOT EXISTS idx_committee_member_committee_id ON hr_core.committee_member (committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_member_employee_id ON hr_core.committee_member (employee_id);
CREATE INDEX IF NOT EXISTS idx_committee_member_is_active ON hr_core.committee_member (is_active);

-- Enable RLS
ALTER TABLE hr_core.committee
    ENABLE ROW LEVEL SECURITY;

-- RLS Policy for committee
CREATE POLICY committee_tenant_isolation ON hr_core.committee
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Comments
COMMENT ON TABLE hr_core.committee IS '위원회';
COMMENT ON COLUMN hr_core.committee.code IS '위원회 코드';
COMMENT ON COLUMN hr_core.committee.name IS '위원회 명칭';
COMMENT ON COLUMN hr_core.committee.name_en IS '영문 명칭';
COMMENT ON COLUMN hr_core.committee.type IS '유형 (PERMANENT, TEMPORARY, PROJECT)';
COMMENT ON COLUMN hr_core.committee.purpose IS '설립 목적';
COMMENT ON COLUMN hr_core.committee.start_date IS '시작일';
COMMENT ON COLUMN hr_core.committee.end_date IS '종료일';
COMMENT ON COLUMN hr_core.committee.meeting_schedule IS '회의 일정';
COMMENT ON COLUMN hr_core.committee.status IS '상태 (ACTIVE, INACTIVE, DISSOLVED)';

COMMENT ON TABLE hr_core.committee_member IS '위원회 멤버';
COMMENT ON COLUMN hr_core.committee_member.employee_id IS '직원 ID';
COMMENT ON COLUMN hr_core.committee_member.employee_name IS '직원 이름';
COMMENT ON COLUMN hr_core.committee_member.department_name IS '소속 부서';
COMMENT ON COLUMN hr_core.committee_member.position_name IS '직위';
COMMENT ON COLUMN hr_core.committee_member.role IS '역할 (CHAIR, VICE_CHAIR, SECRETARY, MEMBER)';
COMMENT ON COLUMN hr_core.committee_member.join_date IS '가입일';
COMMENT ON COLUMN hr_core.committee_member.leave_date IS '탈퇴일';
COMMENT ON COLUMN hr_core.committee_member.is_active IS '활성 여부';


-- V26__create_headcount_tables.sql
-- Headcount plan table
CREATE TABLE IF NOT EXISTS hr_core.headcount_plan
(
    id              UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL,
    year            INTEGER     NOT NULL,
    department_id   UUID        NOT NULL,
    department_name VARCHAR(200),
    planned_count   INTEGER     NOT NULL DEFAULT 0,
    current_count   INTEGER     NOT NULL DEFAULT 0,
    approved_count  INTEGER     NOT NULL DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    CONSTRAINT uk_headcount_plan_tenant_year_dept UNIQUE (tenant_id, year, department_id)
);

-- Headcount request table
CREATE TABLE IF NOT EXISTS hr_core.headcount_request
(
    id              UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL,
    department_id   UUID        NOT NULL,
    department_name VARCHAR(200),
    type            VARCHAR(20) NOT NULL,
    request_count   INTEGER     NOT NULL,
    grade_id        UUID,
    grade_name      VARCHAR(100),
    position_id     UUID,
    position_name   VARCHAR(100),
    reason          TEXT,
    effective_date  DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_id     UUID,
    requester_id    UUID,
    requester_name  VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_headcount_plan_tenant_id ON hr_core.headcount_plan (tenant_id);
CREATE INDEX IF NOT EXISTS idx_headcount_plan_year ON hr_core.headcount_plan (year);
CREATE INDEX IF NOT EXISTS idx_headcount_plan_department_id ON hr_core.headcount_plan (department_id);
CREATE INDEX IF NOT EXISTS idx_headcount_request_tenant_id ON hr_core.headcount_request (tenant_id);
CREATE INDEX IF NOT EXISTS idx_headcount_request_department_id ON hr_core.headcount_request (department_id);
CREATE INDEX IF NOT EXISTS idx_headcount_request_status ON hr_core.headcount_request (status);
CREATE INDEX IF NOT EXISTS idx_headcount_request_type ON hr_core.headcount_request (type);
CREATE INDEX IF NOT EXISTS idx_headcount_request_requester_id ON hr_core.headcount_request (requester_id);

-- Enable RLS
ALTER TABLE hr_core.headcount_plan
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.headcount_request
    ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY headcount_plan_tenant_isolation ON hr_core.headcount_plan
    USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY headcount_request_tenant_isolation ON hr_core.headcount_request
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Comments
COMMENT ON TABLE hr_core.headcount_plan IS '정현원 계획';
COMMENT ON COLUMN hr_core.headcount_plan.year IS '연도';
COMMENT ON COLUMN hr_core.headcount_plan.department_id IS '부서 ID';
COMMENT ON COLUMN hr_core.headcount_plan.department_name IS '부서명';
COMMENT ON COLUMN hr_core.headcount_plan.planned_count IS '계획 인원';
COMMENT ON COLUMN hr_core.headcount_plan.current_count IS '현재 인원';
COMMENT ON COLUMN hr_core.headcount_plan.approved_count IS '승인된 변경 인원';
COMMENT ON COLUMN hr_core.headcount_plan.notes IS '비고';

COMMENT ON TABLE hr_core.headcount_request IS '정현원 변경 요청';
COMMENT ON COLUMN hr_core.headcount_request.department_id IS '대상 부서 ID';
COMMENT ON COLUMN hr_core.headcount_request.department_name IS '대상 부서명';
COMMENT ON COLUMN hr_core.headcount_request.type IS '요청 유형 (INCREASE, DECREASE, TRANSFER)';
COMMENT ON COLUMN hr_core.headcount_request.request_count IS '요청 인원 수';
COMMENT ON COLUMN hr_core.headcount_request.grade_id IS '직급 ID';
COMMENT ON COLUMN hr_core.headcount_request.grade_name IS '직급명';
COMMENT ON COLUMN hr_core.headcount_request.position_id IS '직위 ID';
COMMENT ON COLUMN hr_core.headcount_request.position_name IS '직위명';
COMMENT ON COLUMN hr_core.headcount_request.reason IS '요청 사유';
COMMENT ON COLUMN hr_core.headcount_request.effective_date IS '적용 예정일';
COMMENT ON COLUMN hr_core.headcount_request.status IS '상태 (DRAFT, PENDING, APPROVED, REJECTED)';
COMMENT ON COLUMN hr_core.headcount_request.approval_id IS '결재 문서 ID';
COMMENT ON COLUMN hr_core.headcount_request.requester_id IS '요청자 ID';
COMMENT ON COLUMN hr_core.headcount_request.requester_name IS '요청자 이름';


-- ============================================================================
-- SERVICE: employee-service
-- ============================================================================

-- V1__create_schema.sql
-- V1: Create schema for employee service
-- Schema hr_core should already exist from docker/postgres/init.sql
-- This migration ensures it exists and grants proper privileges

DO
$$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'hr_core') THEN
            CREATE SCHEMA hr_core;
        END IF;
    END
$$;

-- Ensure the application user has access
GRANT ALL PRIVILEGES ON SCHEMA hr_core TO CURRENT_USER;
GRANT USAGE ON SCHEMA hr_core TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_core GRANT ALL ON TABLES TO CURRENT_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_core GRANT ALL ON SEQUENCES TO CURRENT_USER;


-- V2__create_employee_tables.sql
-- V2: Create employee tables

-- Employee main table
CREATE TABLE IF NOT EXISTS hr_core.employee
(
    id              UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL,
    employee_number VARCHAR(50)  NOT NULL,
    name            VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100),
    email           VARCHAR(200) NOT NULL,
    phone           VARCHAR(20),
    mobile          VARCHAR(20),
    department_id   UUID,
    position_code   VARCHAR(50),
    job_title_code  VARCHAR(50),
    hire_date       DATE,
    resign_date     DATE,
    status          VARCHAR(20)  NOT NULL    DEFAULT 'ACTIVE',
    employment_type VARCHAR(20)              DEFAULT 'REGULAR',
    manager_id      UUID,
    user_id         UUID,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uk_employee_tenant_number UNIQUE (tenant_id, employee_number),
    CONSTRAINT uk_employee_tenant_email UNIQUE (tenant_id, email)
);

-- Employee history table for tracking changes
CREATE TABLE IF NOT EXISTS hr_core.employee_history
(
    id            UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL,
    employee_id   UUID        NOT NULL,
    change_type   VARCHAR(50) NOT NULL,
    field_name    VARCHAR(100),
    old_value     TEXT,
    new_value     TEXT,
    changed_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by    UUID,
    change_reason TEXT,
    CONSTRAINT fk_employee_history_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- Employee family table
CREATE TABLE IF NOT EXISTS hr_core.employee_family
(
    id            UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id     UUID         NOT NULL,
    employee_id   UUID         NOT NULL,
    relation_type VARCHAR(50)  NOT NULL,
    name          VARCHAR(100) NOT NULL,
    birth_date    DATE,
    phone         VARCHAR(20),
    is_dependent  BOOLEAN                  DEFAULT false,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_family_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- Employee education table
CREATE TABLE IF NOT EXISTS hr_core.employee_education
(
    id                UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id         UUID         NOT NULL,
    employee_id       UUID         NOT NULL,
    school_name       VARCHAR(200) NOT NULL,
    degree_type       VARCHAR(50),
    major             VARCHAR(100),
    admission_date    DATE,
    graduation_date   DATE,
    graduation_status VARCHAR(50),
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_education_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- Employee career table
CREATE TABLE IF NOT EXISTS hr_core.employee_career
(
    id              UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id       UUID         NOT NULL,
    employee_id     UUID         NOT NULL,
    company_name    VARCHAR(200) NOT NULL,
    department      VARCHAR(100),
    position        VARCHAR(100),
    start_date      DATE,
    end_date        DATE,
    job_description TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_career_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- Employee certificate table
CREATE TABLE IF NOT EXISTS hr_core.employee_certificate
(
    id                   UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id            UUID         NOT NULL,
    employee_id          UUID         NOT NULL,
    certificate_name     VARCHAR(200) NOT NULL,
    issuing_organization VARCHAR(200),
    issue_date           DATE,
    expiry_date          DATE,
    certificate_number   VARCHAR(100),
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_certificate_employee FOREIGN KEY (employee_id)
        REFERENCES hr_core.employee (id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_tenant_id ON hr_core.employee (tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_department_id ON hr_core.employee (department_id);
CREATE INDEX IF NOT EXISTS idx_employee_manager_id ON hr_core.employee (manager_id);
CREATE INDEX IF NOT EXISTS idx_employee_status ON hr_core.employee (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_name ON hr_core.employee (tenant_id, name);

CREATE INDEX IF NOT EXISTS idx_employee_history_employee_id ON hr_core.employee_history (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_tenant_id ON hr_core.employee_history (tenant_id);

CREATE INDEX IF NOT EXISTS idx_employee_family_employee_id ON hr_core.employee_family (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_education_employee_id ON hr_core.employee_education (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_career_employee_id ON hr_core.employee_career (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_certificate_employee_id ON hr_core.employee_certificate (employee_id);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION hr_core.update_updated_at_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_employee_updated_at ON hr_core.employee;
CREATE TRIGGER tr_employee_updated_at
    BEFORE UPDATE
    ON hr_core.employee
    FOR EACH ROW
EXECUTE FUNCTION hr_core.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_employee_family_updated_at ON hr_core.employee_family;
CREATE TRIGGER tr_employee_family_updated_at
    BEFORE UPDATE
    ON hr_core.employee_family
    FOR EACH ROW
EXECUTE FUNCTION hr_core.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_employee_education_updated_at ON hr_core.employee_education;
CREATE TRIGGER tr_employee_education_updated_at
    BEFORE UPDATE
    ON hr_core.employee_education
    FOR EACH ROW
EXECUTE FUNCTION hr_core.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_employee_career_updated_at ON hr_core.employee_career;
CREATE TRIGGER tr_employee_career_updated_at
    BEFORE UPDATE
    ON hr_core.employee_career
    FOR EACH ROW
EXECUTE FUNCTION hr_core.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_employee_certificate_updated_at ON hr_core.employee_certificate;
CREATE TRIGGER tr_employee_certificate_updated_at
    BEFORE UPDATE
    ON hr_core.employee_certificate
    FOR EACH ROW
EXECUTE FUNCTION hr_core.update_updated_at_column();


-- V3__enable_rls.sql
-- V3: Enable Row Level Security on all employee tables

-- Enable RLS on employee table
ALTER TABLE hr_core.employee
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee
    FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_history table
ALTER TABLE hr_core.employee_history
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_history
    FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_family table
ALTER TABLE hr_core.employee_family
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_family
    FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_education table
ALTER TABLE hr_core.employee_education
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_education
    FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_career table
ALTER TABLE hr_core.employee_career
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_career
    FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_certificate table
ALTER TABLE hr_core.employee_certificate
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_certificate
    FORCE ROW LEVEL SECURITY;


-- V4__create_rls_policies.sql
-- V4: Create Row Level Security policies for tenant isolation
-- These policies ensure that users can only access data belonging to their tenant

-- Helper function to safely get current tenant (handles NULL/empty cases)
CREATE OR REPLACE FUNCTION hr_core.get_current_tenant_safe()
    RETURNS UUID AS
$$
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
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- Policies for hr_core.employee table
-- ========================================

-- Policy for SELECT: Can only view employees in same tenant
DROP POLICY IF EXISTS employee_tenant_isolation_select ON hr_core.employee;
CREATE POLICY employee_tenant_isolation_select ON hr_core.employee
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- Policy for INSERT: Can only insert employees for own tenant
DROP POLICY IF EXISTS employee_tenant_isolation_insert ON hr_core.employee;
CREATE POLICY employee_tenant_isolation_insert ON hr_core.employee
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

-- Policy for UPDATE: Can only update employees in same tenant
DROP POLICY IF EXISTS employee_tenant_isolation_update ON hr_core.employee;
CREATE POLICY employee_tenant_isolation_update ON hr_core.employee
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

-- Policy for DELETE: Can only delete employees in same tenant
DROP POLICY IF EXISTS employee_tenant_isolation_delete ON hr_core.employee;
CREATE POLICY employee_tenant_isolation_delete ON hr_core.employee
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_history table
-- ========================================

DROP POLICY IF EXISTS employee_history_tenant_isolation_select ON hr_core.employee_history;
CREATE POLICY employee_history_tenant_isolation_select ON hr_core.employee_history
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_history_tenant_isolation_insert ON hr_core.employee_history;
CREATE POLICY employee_history_tenant_isolation_insert ON hr_core.employee_history
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_history_tenant_isolation_update ON hr_core.employee_history;
CREATE POLICY employee_history_tenant_isolation_update ON hr_core.employee_history
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_history_tenant_isolation_delete ON hr_core.employee_history;
CREATE POLICY employee_history_tenant_isolation_delete ON hr_core.employee_history
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_family table
-- ========================================

DROP POLICY IF EXISTS employee_family_tenant_isolation_select ON hr_core.employee_family;
CREATE POLICY employee_family_tenant_isolation_select ON hr_core.employee_family
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_family_tenant_isolation_insert ON hr_core.employee_family;
CREATE POLICY employee_family_tenant_isolation_insert ON hr_core.employee_family
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_family_tenant_isolation_update ON hr_core.employee_family;
CREATE POLICY employee_family_tenant_isolation_update ON hr_core.employee_family
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_family_tenant_isolation_delete ON hr_core.employee_family;
CREATE POLICY employee_family_tenant_isolation_delete ON hr_core.employee_family
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_education table
-- ========================================

DROP POLICY IF EXISTS employee_education_tenant_isolation_select ON hr_core.employee_education;
CREATE POLICY employee_education_tenant_isolation_select ON hr_core.employee_education
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_education_tenant_isolation_insert ON hr_core.employee_education;
CREATE POLICY employee_education_tenant_isolation_insert ON hr_core.employee_education
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_education_tenant_isolation_update ON hr_core.employee_education;
CREATE POLICY employee_education_tenant_isolation_update ON hr_core.employee_education
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_education_tenant_isolation_delete ON hr_core.employee_education;
CREATE POLICY employee_education_tenant_isolation_delete ON hr_core.employee_education
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_career table
-- ========================================

DROP POLICY IF EXISTS employee_career_tenant_isolation_select ON hr_core.employee_career;
CREATE POLICY employee_career_tenant_isolation_select ON hr_core.employee_career
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_career_tenant_isolation_insert ON hr_core.employee_career;
CREATE POLICY employee_career_tenant_isolation_insert ON hr_core.employee_career
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_career_tenant_isolation_update ON hr_core.employee_career;
CREATE POLICY employee_career_tenant_isolation_update ON hr_core.employee_career
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_career_tenant_isolation_delete ON hr_core.employee_career;
CREATE POLICY employee_career_tenant_isolation_delete ON hr_core.employee_career
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Policies for hr_core.employee_certificate table
-- ========================================

DROP POLICY IF EXISTS employee_certificate_tenant_isolation_select ON hr_core.employee_certificate;
CREATE POLICY employee_certificate_tenant_isolation_select ON hr_core.employee_certificate
    FOR SELECT
    USING (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_certificate_tenant_isolation_insert ON hr_core.employee_certificate;
CREATE POLICY employee_certificate_tenant_isolation_insert ON hr_core.employee_certificate
    FOR INSERT
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_certificate_tenant_isolation_update ON hr_core.employee_certificate;
CREATE POLICY employee_certificate_tenant_isolation_update ON hr_core.employee_certificate
    FOR UPDATE
    USING (tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (tenant_id = hr_core.get_current_tenant_safe());

DROP POLICY IF EXISTS employee_certificate_tenant_isolation_delete ON hr_core.employee_certificate;
CREATE POLICY employee_certificate_tenant_isolation_delete ON hr_core.employee_certificate
    FOR DELETE
    USING (tenant_id = hr_core.get_current_tenant_safe());

-- ========================================
-- Comments for documentation
-- ========================================
COMMENT ON POLICY employee_tenant_isolation_select ON hr_core.employee IS
    'Ensures users can only SELECT employee records belonging to their tenant';
COMMENT ON POLICY employee_tenant_isolation_insert ON hr_core.employee IS
    'Ensures users can only INSERT employee records for their tenant';
COMMENT ON POLICY employee_tenant_isolation_update ON hr_core.employee IS
    'Ensures users can only UPDATE employee records belonging to their tenant';
COMMENT ON POLICY employee_tenant_isolation_delete ON hr_core.employee IS
    'Ensures users can only DELETE employee records belonging to their tenant';


-- V5__create_condolence_tables.sql
-- Condolence policy table
CREATE TABLE IF NOT EXISTS hr_core.condolence_policy
(
    id          UUID PRIMARY KEY        DEFAULT gen_random_uuid(),
    tenant_id   UUID           NOT NULL,
    event_type  VARCHAR(30)    NOT NULL,
    name        VARCHAR(100)   NOT NULL,
    description VARCHAR(500),
    amount      DECIMAL(15, 2) NOT NULL DEFAULT 0,
    leave_days  INTEGER        NOT NULL DEFAULT 0,
    is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
    sort_order  INTEGER,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),
    CONSTRAINT uk_condolence_policy_tenant_event UNIQUE (tenant_id, event_type)
);

-- Condolence request table
CREATE TABLE IF NOT EXISTS hr_core.condolence_request
(
    id                  UUID PRIMARY KEY        DEFAULT gen_random_uuid(),
    tenant_id           UUID           NOT NULL,
    employee_id         UUID           NOT NULL,
    employee_name       VARCHAR(100),
    department_name     VARCHAR(200),
    policy_id           UUID REFERENCES hr_core.condolence_policy (id),
    event_type          VARCHAR(30)    NOT NULL,
    event_date          DATE           NOT NULL,
    description         TEXT,
    relation            VARCHAR(50),
    related_person_name VARCHAR(100),
    amount              DECIMAL(15, 2) NOT NULL DEFAULT 0,
    leave_days          INTEGER,
    status              VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    approval_id         UUID,
    paid_date           DATE,
    reject_reason       VARCHAR(500),
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_condolence_policy_tenant_id ON hr_core.condolence_policy (tenant_id);
CREATE INDEX IF NOT EXISTS idx_condolence_policy_event_type ON hr_core.condolence_policy (event_type);
CREATE INDEX IF NOT EXISTS idx_condolence_policy_is_active ON hr_core.condolence_policy (is_active);
CREATE INDEX IF NOT EXISTS idx_condolence_request_tenant_id ON hr_core.condolence_request (tenant_id);
CREATE INDEX IF NOT EXISTS idx_condolence_request_employee_id ON hr_core.condolence_request (employee_id);
CREATE INDEX IF NOT EXISTS idx_condolence_request_status ON hr_core.condolence_request (status);
CREATE INDEX IF NOT EXISTS idx_condolence_request_event_type ON hr_core.condolence_request (event_type);
CREATE INDEX IF NOT EXISTS idx_condolence_request_event_date ON hr_core.condolence_request (event_date);

-- Enable RLS
ALTER TABLE hr_core.condolence_policy
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.condolence_request
    ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY condolence_policy_tenant_isolation ON hr_core.condolence_policy
    USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY condolence_request_tenant_isolation ON hr_core.condolence_request
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Comments
COMMENT ON TABLE hr_core.condolence_policy IS '경조비 정책';
COMMENT ON COLUMN hr_core.condolence_policy.event_type IS '경조사 유형';
COMMENT ON COLUMN hr_core.condolence_policy.name IS '정책명';
COMMENT ON COLUMN hr_core.condolence_policy.description IS '설명';
COMMENT ON COLUMN hr_core.condolence_policy.amount IS '지급 금액';
COMMENT ON COLUMN hr_core.condolence_policy.leave_days IS '휴가 일수';
COMMENT ON COLUMN hr_core.condolence_policy.is_active IS '활성 여부';
COMMENT ON COLUMN hr_core.condolence_policy.sort_order IS '정렬 순서';

COMMENT ON TABLE hr_core.condolence_request IS '경조비 신청';
COMMENT ON COLUMN hr_core.condolence_request.employee_id IS '신청자 직원 ID';
COMMENT ON COLUMN hr_core.condolence_request.employee_name IS '신청자 이름';
COMMENT ON COLUMN hr_core.condolence_request.department_name IS '신청자 부서명';
COMMENT ON COLUMN hr_core.condolence_request.policy_id IS '적용 정책 ID';
COMMENT ON COLUMN hr_core.condolence_request.event_type IS '경조사 유형';
COMMENT ON COLUMN hr_core.condolence_request.event_date IS '경조사 일자';
COMMENT ON COLUMN hr_core.condolence_request.description IS '상세 설명';
COMMENT ON COLUMN hr_core.condolence_request.relation IS '관계';
COMMENT ON COLUMN hr_core.condolence_request.related_person_name IS '관계인 이름';
COMMENT ON COLUMN hr_core.condolence_request.amount IS '지급 금액';
COMMENT ON COLUMN hr_core.condolence_request.leave_days IS '휴가 일수';
COMMENT ON COLUMN hr_core.condolence_request.status IS '상태 (PENDING, APPROVED, REJECTED, PAID, CANCELLED)';
COMMENT ON COLUMN hr_core.condolence_request.approval_id IS '결재 문서 ID';
COMMENT ON COLUMN hr_core.condolence_request.paid_date IS '지급일';
COMMENT ON COLUMN hr_core.condolence_request.reject_reason IS '반려 사유';


-- V6__create_transfer_tables.sql
-- Transfer Request Table
CREATE TABLE IF NOT EXISTS hr_core.transfer_request
(
    id                     UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    tenant_id              UUID        NOT NULL,
    employee_id            UUID        NOT NULL,
    employee_name          VARCHAR(100),
    employee_number        VARCHAR(50),

    -- Source (전출)
    source_tenant_id       UUID        NOT NULL,
    source_tenant_name     VARCHAR(200),
    source_department_id   UUID,
    source_department_name VARCHAR(200),
    source_position_id     UUID,
    source_position_name   VARCHAR(100),
    source_grade_id        UUID,
    source_grade_name      VARCHAR(100),

    -- Target (전입)
    target_tenant_id       UUID        NOT NULL,
    target_tenant_name     VARCHAR(200),
    target_department_id   UUID,
    target_department_name VARCHAR(200),
    target_position_id     UUID,
    target_position_name   VARCHAR(100),
    target_grade_id        UUID,
    target_grade_name      VARCHAR(100),

    -- Transfer Info
    transfer_date          DATE        NOT NULL,
    reason                 TEXT,
    status                 VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

    -- Approval Info
    source_approver_id     UUID,
    source_approver_name   VARCHAR(100),
    source_approved_at     TIMESTAMP,
    target_approver_id     UUID,
    target_approver_name   VARCHAR(100),
    target_approved_at     TIMESTAMP,
    reject_reason          VARCHAR(500),
    completed_at           TIMESTAMP,

    -- Audit
    created_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by             UUID,
    updated_by             UUID,

    CONSTRAINT fk_transfer_request_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenant_common.tenant (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transfer_request_tenant_id ON hr_core.transfer_request (tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfer_request_employee_id ON hr_core.transfer_request (employee_id);
CREATE INDEX IF NOT EXISTS idx_transfer_request_source_tenant_id ON hr_core.transfer_request (source_tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfer_request_target_tenant_id ON hr_core.transfer_request (target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfer_request_status ON hr_core.transfer_request (status);
CREATE INDEX IF NOT EXISTS idx_transfer_request_transfer_date ON hr_core.transfer_request (transfer_date);

-- Enable RLS
ALTER TABLE hr_core.transfer_request
    ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow access if user's tenant is source, target, or owner tenant
CREATE POLICY transfer_request_tenant_isolation ON hr_core.transfer_request
    FOR ALL
    USING (
    tenant_id::text = current_setting('app.current_tenant', true) OR
    source_tenant_id::text = current_setting('app.current_tenant', true) OR
    target_tenant_id::text = current_setting('app.current_tenant', true)
    );

-- Comments
COMMENT ON TABLE hr_core.transfer_request IS '계열사 전출/전입 요청';
COMMENT ON COLUMN hr_core.transfer_request.status IS 'DRAFT, PENDING, SOURCE_APPROVED, TARGET_APPROVED, APPROVED, COMPLETED, REJECTED, CANCELLED';


-- V7__fix_audit_columns_type.sql
-- ============================================================================
-- V7__fix_audit_columns_type.sql
-- Fix created_by/updated_by columns from UUID to VARCHAR(100) for consistency
-- ============================================================================

-- employee table
ALTER TABLE hr_core.employee
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- transfer_request table (from V6)
ALTER TABLE hr_core.transfer_request
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);


-- V8__add_resident_number.sql
-- ============================================================================
-- V8__add_missing_columns.sql
-- Add missing columns to various tables
-- ============================================================================

-- Add resident_number to employee
ALTER TABLE hr_core.employee
    ADD COLUMN IF NOT EXISTS resident_number VARCHAR(20);

-- Add audit columns to employee_career
ALTER TABLE hr_core.employee_career
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_career
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Add audit columns to employee_certificate
ALTER TABLE hr_core.employee_certificate
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_certificate
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Add audit columns to employee_education
ALTER TABLE hr_core.employee_education
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_education
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Add audit columns to employee_family
ALTER TABLE hr_core.employee_family
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_family
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- Add audit columns to employee_history
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);


-- V9__add_missing_detail_columns.sql
-- ============================================================================
-- V9__add_missing_detail_columns.sql
-- Add missing columns to employee detail tables to match entity definitions
-- This migration syncs the database schema with the current JPA entities
-- ============================================================================

-- ============================================================================
-- employee_family table updates
-- ============================================================================
-- Rename relation_type to relation (entity uses 'relation')
DO
$$
    BEGIN
        IF EXISTS (SELECT 1
                   FROM information_schema.columns
                   WHERE table_schema = 'hr_core'
                     AND table_name = 'employee_family'
                     AND column_name = 'relation_type') THEN
            ALTER TABLE hr_core.employee_family
                RENAME COLUMN relation_type TO relation;
        END IF;
    END
$$;

-- Add relation column if not exists
ALTER TABLE hr_core.employee_family
    ADD COLUMN IF NOT EXISTS relation VARCHAR(20);

-- Add occupation column
ALTER TABLE hr_core.employee_family
    ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);

-- Add is_cohabiting column
ALTER TABLE hr_core.employee_family
    ADD COLUMN IF NOT EXISTS is_cohabiting BOOLEAN DEFAULT false;

-- Add remarks column
ALTER TABLE hr_core.employee_family
    ADD COLUMN IF NOT EXISTS remarks VARCHAR(500);

-- ============================================================================
-- employee_history table updates (completely different structure from V2)
-- ============================================================================
-- Add missing columns for the new structure
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS from_department_id UUID;
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS to_department_id UUID;
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS from_department_name VARCHAR(200);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS to_department_name VARCHAR(200);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS from_grade_code VARCHAR(50);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS to_grade_code VARCHAR(50);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS from_grade_name VARCHAR(100);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS to_grade_name VARCHAR(100);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS from_position_code VARCHAR(50);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS to_position_code VARCHAR(50);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS from_position_name VARCHAR(100);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS to_position_name VARCHAR(100);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS order_number VARCHAR(100);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS reason VARCHAR(500);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS remarks VARCHAR(1000);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hr_core.employee_history
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

-- ============================================================================
-- employee_education table updates
-- ============================================================================
-- Add school_type column
ALTER TABLE hr_core.employee_education
    ADD COLUMN IF NOT EXISTS school_type VARCHAR(30);

-- Rename degree_type to degree
DO
$$
    BEGIN
        IF EXISTS (SELECT 1
                   FROM information_schema.columns
                   WHERE table_schema = 'hr_core'
                     AND table_name = 'employee_education'
                     AND column_name = 'degree_type') THEN
            ALTER TABLE hr_core.employee_education
                RENAME COLUMN degree_type TO degree;
        END IF;
    END
$$;

-- Add degree column if not exists
ALTER TABLE hr_core.employee_education
    ADD COLUMN IF NOT EXISTS degree VARCHAR(50);

-- Rename admission_date to start_date
DO
$$
    BEGIN
        IF EXISTS (SELECT 1
                   FROM information_schema.columns
                   WHERE table_schema = 'hr_core'
                     AND table_name = 'employee_education'
                     AND column_name = 'admission_date') THEN
            ALTER TABLE hr_core.employee_education
                RENAME COLUMN admission_date TO start_date;
        END IF;
    END
$$;

-- Add start_date column if not exists
ALTER TABLE hr_core.employee_education
    ADD COLUMN IF NOT EXISTS start_date DATE;

-- Rename graduation_date to end_date
DO
$$
    BEGIN
        IF EXISTS (SELECT 1
                   FROM information_schema.columns
                   WHERE table_schema = 'hr_core'
                     AND table_name = 'employee_education'
                     AND column_name = 'graduation_date') THEN
            ALTER TABLE hr_core.employee_education
                RENAME COLUMN graduation_date TO end_date;
        END IF;
    END
$$;

-- Add end_date column if not exists
ALTER TABLE hr_core.employee_education
    ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add is_verified column
ALTER TABLE hr_core.employee_education
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- ============================================================================
-- employee_career table updates
-- ============================================================================
-- Add resignation_reason column
ALTER TABLE hr_core.employee_career
    ADD COLUMN IF NOT EXISTS resignation_reason VARCHAR(500);

-- Add is_verified column
ALTER TABLE hr_core.employee_career
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- ============================================================================
-- employee_certificate table updates
-- ============================================================================
-- Add grade column
ALTER TABLE hr_core.employee_certificate
    ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

-- Add is_verified column
ALTER TABLE hr_core.employee_certificate
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;


-- ============================================================================
-- SERVICE: attendance-service
-- ============================================================================

-- V1__create_schema.sql
-- Create hr_attendance schema
CREATE SCHEMA IF NOT EXISTS hr_attendance;

-- Grant permissions
GRANT USAGE ON SCHEMA hr_attendance TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_attendance TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_attendance GRANT ALL PRIVILEGES ON TABLES TO PUBLIC;


-- V2__create_attendance_tables.sql
-- Attendance Record table
CREATE TABLE IF NOT EXISTS hr_attendance.attendance_record
(
    id                  UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    tenant_id           UUID        NOT NULL,
    employee_id         UUID        NOT NULL,
    work_date           DATE        NOT NULL,
    check_in_time       TIME,
    check_out_time      TIME,
    status              VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    late_minutes        INTEGER              DEFAULT 0,
    early_leave_minutes INTEGER              DEFAULT 0,
    overtime_minutes    INTEGER              DEFAULT 0,
    work_hours          INTEGER              DEFAULT 0,
    check_in_location   VARCHAR(500),
    check_out_location  VARCHAR(500),
    note                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),
    CONSTRAINT uk_attendance_record UNIQUE (tenant_id, employee_id, work_date)
);

-- Leave Request table
CREATE TABLE IF NOT EXISTS hr_attendance.leave_request
(
    id                   UUID PRIMARY KEY       DEFAULT gen_random_uuid(),
    tenant_id            UUID          NOT NULL,
    employee_id          UUID          NOT NULL,
    employee_name        VARCHAR(100)  NOT NULL,
    department_id        UUID,
    department_name      VARCHAR(200),
    leave_type           VARCHAR(30)   NOT NULL,
    start_date           DATE          NOT NULL,
    end_date             DATE          NOT NULL,
    days_count           DECIMAL(3, 1) NOT NULL,
    reason               TEXT,
    status               VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    approval_document_id UUID,
    emergency_contact    VARCHAR(50),
    handover_to_id       UUID,
    handover_to_name     VARCHAR(100),
    handover_notes       TEXT,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by           VARCHAR(100),
    updated_by           VARCHAR(100)
);

-- Leave Balance table
CREATE TABLE IF NOT EXISTS hr_attendance.leave_balance
(
    id                UUID PRIMARY KEY       DEFAULT gen_random_uuid(),
    tenant_id         UUID          NOT NULL,
    employee_id       UUID          NOT NULL,
    year              INTEGER       NOT NULL,
    leave_type        VARCHAR(30)   NOT NULL,
    total_days        DECIMAL(5, 1) NOT NULL DEFAULT 0,
    used_days         DECIMAL(5, 1) NOT NULL DEFAULT 0,
    pending_days      DECIMAL(5, 1) NOT NULL DEFAULT 0,
    carried_over_days DECIMAL(5, 1) NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    CONSTRAINT uk_leave_balance UNIQUE (tenant_id, employee_id, year, leave_type)
);

-- Holiday table
CREATE TABLE IF NOT EXISTS hr_attendance.holiday
(
    id           UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    tenant_id    UUID         NOT NULL,
    holiday_date DATE         NOT NULL,
    name         VARCHAR(100) NOT NULL,
    name_en      VARCHAR(100),
    holiday_type VARCHAR(20)  NOT NULL,
    is_paid      BOOLEAN      NOT NULL DEFAULT TRUE,
    description  VARCHAR(500),
    year         INTEGER      NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by   VARCHAR(100),
    updated_by   VARCHAR(100),
    CONSTRAINT uk_holiday UNIQUE (tenant_id, holiday_date)
);

-- Overtime Request table
CREATE TABLE IF NOT EXISTS hr_attendance.overtime_request
(
    id                   UUID PRIMARY KEY      DEFAULT gen_random_uuid(),
    tenant_id            UUID         NOT NULL,
    employee_id          UUID         NOT NULL,
    employee_name        VARCHAR(100) NOT NULL,
    department_id        UUID,
    department_name      VARCHAR(200),
    overtime_date        DATE         NOT NULL,
    planned_start_time   TIME         NOT NULL,
    planned_end_time     TIME         NOT NULL,
    actual_start_time    TIME,
    actual_end_time      TIME,
    reason               TEXT,
    status               VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    approval_document_id UUID,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by           VARCHAR(100),
    updated_by           VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_record_tenant ON hr_attendance.attendance_record (tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_employee ON hr_attendance.attendance_record (employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_date ON hr_attendance.attendance_record (work_date);
CREATE INDEX IF NOT EXISTS idx_leave_request_tenant ON hr_attendance.leave_request (tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_employee ON hr_attendance.leave_request (employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_status ON hr_attendance.leave_request (status);
CREATE INDEX IF NOT EXISTS idx_leave_balance_tenant ON hr_attendance.leave_balance (tenant_id);
CREATE INDEX IF NOT EXISTS idx_holiday_tenant ON hr_attendance.holiday (tenant_id);
CREATE INDEX IF NOT EXISTS idx_holiday_year ON hr_attendance.holiday (year);
CREATE INDEX IF NOT EXISTS idx_overtime_request_tenant ON hr_attendance.overtime_request (tenant_id);


-- V3__enable_rls.sql
-- Enable Row Level Security on attendance tables
ALTER TABLE hr_attendance.attendance_record
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_request
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_balance
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.holiday
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.overtime_request
    ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners
ALTER TABLE hr_attendance.attendance_record
    FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_request
    FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_balance
    FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.holiday
    FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.overtime_request
    FORCE ROW LEVEL SECURITY;


-- V4__create_rls_policies.sql
-- Create safe tenant getter function (if not exists)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
    RETURNS UUID AS
$$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy for attendance_record
DROP POLICY IF EXISTS attendance_record_tenant_isolation ON hr_attendance.attendance_record;
CREATE POLICY attendance_record_tenant_isolation ON hr_attendance.attendance_record
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for leave_request
DROP POLICY IF EXISTS leave_request_tenant_isolation ON hr_attendance.leave_request;
CREATE POLICY leave_request_tenant_isolation ON hr_attendance.leave_request
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for leave_balance
DROP POLICY IF EXISTS leave_balance_tenant_isolation ON hr_attendance.leave_balance;
CREATE POLICY leave_balance_tenant_isolation ON hr_attendance.leave_balance
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for holiday
DROP POLICY IF EXISTS holiday_tenant_isolation ON hr_attendance.holiday;
CREATE POLICY holiday_tenant_isolation ON hr_attendance.holiday
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for overtime_request
DROP POLICY IF EXISTS overtime_request_tenant_isolation ON hr_attendance.overtime_request;
CREATE POLICY overtime_request_tenant_isolation ON hr_attendance.overtime_request
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );


-- V5__fix_overtime_request_columns.sql
-- ============================================================================
-- V5__fix_overtime_request_columns.sql
-- overtime_request 테이블 컬럼 수정
-- ============================================================================

-- 컬럼 이름 변경
ALTER TABLE hr_attendance.overtime_request
    RENAME COLUMN planned_start_time TO start_time;
ALTER TABLE hr_attendance.overtime_request
    RENAME COLUMN planned_end_time TO end_time;

-- 누락된 컬럼 추가
ALTER TABLE hr_attendance.overtime_request
    ADD COLUMN IF NOT EXISTS planned_hours DECIMAL(4, 2);
ALTER TABLE hr_attendance.overtime_request
    ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(4, 2);
ALTER TABLE hr_attendance.overtime_request
    ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);


-- ============================================================================
-- SERVICE: approval-service
-- ============================================================================

-- V1__create_schema.sql
-- Create hr_approval schema
CREATE SCHEMA IF NOT EXISTS hr_approval;

-- Grant permissions
GRANT USAGE ON SCHEMA hr_approval TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_approval TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA hr_approval TO PUBLIC;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_approval GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_approval GRANT ALL ON SEQUENCES TO PUBLIC;


-- V2__create_approval_tables.sql
-- Approval Document table
CREATE TABLE IF NOT EXISTS hr_approval.approval_document
(
    id                      UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id               UUID                     NOT NULL,
    document_number         VARCHAR(50)              NOT NULL UNIQUE,
    title                   VARCHAR(500)             NOT NULL,
    content                 TEXT,
    document_type           VARCHAR(50)              NOT NULL,
    status                  VARCHAR(20)              NOT NULL DEFAULT 'DRAFT',
    drafter_id              UUID                     NOT NULL,
    drafter_name            VARCHAR(100)             NOT NULL,
    drafter_department_id   UUID,
    drafter_department_name VARCHAR(200),
    submitted_at            TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,
    reference_type          VARCHAR(50),
    reference_id            UUID,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100)
);

-- Indexes for approval_document
CREATE INDEX IF NOT EXISTS idx_approval_document_tenant_id ON hr_approval.approval_document (tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_document_drafter_id ON hr_approval.approval_document (drafter_id);
CREATE INDEX IF NOT EXISTS idx_approval_document_status ON hr_approval.approval_document (status);
CREATE INDEX IF NOT EXISTS idx_approval_document_document_type ON hr_approval.approval_document (document_type);
CREATE INDEX IF NOT EXISTS idx_approval_document_submitted_at ON hr_approval.approval_document (submitted_at);

-- Approval Line table (child of document)
CREATE TABLE IF NOT EXISTS hr_approval.approval_line
(
    id                       UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    document_id              UUID                     NOT NULL REFERENCES hr_approval.approval_document (id) ON DELETE CASCADE,
    sequence                 INTEGER                  NOT NULL,
    line_type                VARCHAR(20)              NOT NULL DEFAULT 'SEQUENTIAL',
    approver_id              UUID                     NOT NULL,
    approver_name            VARCHAR(100)             NOT NULL,
    approver_position        VARCHAR(100),
    approver_department_name VARCHAR(200),
    delegate_id              UUID,
    delegate_name            VARCHAR(100),
    status                   VARCHAR(20)              NOT NULL DEFAULT 'WAITING',
    action_type              VARCHAR(20),
    comment                  TEXT,
    activated_at             TIMESTAMP WITH TIME ZONE,
    completed_at             TIMESTAMP WITH TIME ZONE,
    created_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by               VARCHAR(100),
    updated_by               VARCHAR(100)
);

-- Indexes for approval_line
CREATE INDEX IF NOT EXISTS idx_approval_line_document_id ON hr_approval.approval_line (document_id);
CREATE INDEX IF NOT EXISTS idx_approval_line_approver_id ON hr_approval.approval_line (approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_line_status ON hr_approval.approval_line (status);

-- Approval History table (child of document)
CREATE TABLE IF NOT EXISTS hr_approval.approval_history
(
    id          UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    document_id UUID                     NOT NULL REFERENCES hr_approval.approval_document (id) ON DELETE CASCADE,
    actor_id    UUID                     NOT NULL,
    actor_name  VARCHAR(100)             NOT NULL,
    action_type VARCHAR(20)              NOT NULL,
    from_status VARCHAR(20),
    to_status   VARCHAR(20),
    comment     TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100)
);

-- Indexes for approval_history
CREATE INDEX IF NOT EXISTS idx_approval_history_document_id ON hr_approval.approval_history (document_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_actor_id ON hr_approval.approval_history (actor_id);

-- Approval Template table
CREATE TABLE IF NOT EXISTS hr_approval.approval_template
(
    id            UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id     UUID                     NOT NULL,
    code          VARCHAR(50)              NOT NULL,
    name          VARCHAR(200)             NOT NULL,
    document_type VARCHAR(50)              NOT NULL,
    description   VARCHAR(500),
    is_active     BOOLEAN                  NOT NULL DEFAULT TRUE,
    sort_order    INTEGER,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    VARCHAR(100),
    updated_by    VARCHAR(100),
    UNIQUE (tenant_id, code)
);

-- Indexes for approval_template
CREATE INDEX IF NOT EXISTS idx_approval_template_tenant_id ON hr_approval.approval_template (tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_template_document_type ON hr_approval.approval_template (document_type);

-- Approval Template Line table (child of template)
CREATE TABLE IF NOT EXISTS hr_approval.approval_template_line
(
    id            UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    template_id   UUID                     NOT NULL REFERENCES hr_approval.approval_template (id) ON DELETE CASCADE,
    sequence      INTEGER                  NOT NULL,
    line_type     VARCHAR(20)              NOT NULL DEFAULT 'SEQUENTIAL',
    approver_type VARCHAR(30)              NOT NULL,
    approver_id   UUID,
    approver_name VARCHAR(100),
    position_code VARCHAR(50),
    department_id UUID,
    description   VARCHAR(200),
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    VARCHAR(100),
    updated_by    VARCHAR(100)
);

-- Indexes for approval_template_line
CREATE INDEX IF NOT EXISTS idx_approval_template_line_template_id ON hr_approval.approval_template_line (template_id);

-- Delegation Rule table
CREATE TABLE IF NOT EXISTS hr_approval.delegation_rule
(
    id             UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id      UUID                     NOT NULL,
    delegator_id   UUID                     NOT NULL,
    delegator_name VARCHAR(100)             NOT NULL,
    delegate_id    UUID                     NOT NULL,
    delegate_name  VARCHAR(100)             NOT NULL,
    start_date     DATE                     NOT NULL,
    end_date       DATE                     NOT NULL,
    document_types VARCHAR(500),
    reason         VARCHAR(500),
    is_active      BOOLEAN                  NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(100),
    updated_by     VARCHAR(100)
);

-- Indexes for delegation_rule
CREATE INDEX IF NOT EXISTS idx_delegation_rule_tenant_id ON hr_approval.delegation_rule (tenant_id);
CREATE INDEX IF NOT EXISTS idx_delegation_rule_delegator_id ON hr_approval.delegation_rule (delegator_id);
CREATE INDEX IF NOT EXISTS idx_delegation_rule_delegate_id ON hr_approval.delegation_rule (delegate_id);
CREATE INDEX IF NOT EXISTS idx_delegation_rule_dates ON hr_approval.delegation_rule (start_date, end_date);


-- V3__enable_rls.sql
-- Enable Row Level Security on tenant-aware tables

-- approval_document (has tenant_id)
ALTER TABLE hr_approval.approval_document
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.approval_document
    FORCE ROW LEVEL SECURITY;

-- approval_template (has tenant_id)
ALTER TABLE hr_approval.approval_template
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.approval_template
    FORCE ROW LEVEL SECURITY;

-- delegation_rule (has tenant_id)
ALTER TABLE hr_approval.delegation_rule
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.delegation_rule
    FORCE ROW LEVEL SECURITY;

-- Note: approval_line, approval_history, approval_template_line do not have tenant_id
-- They are child tables that inherit tenant isolation through their parent (document/template)


-- V4__create_rls_policies.sql
-- Create safe tenant getter function (if not exists)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
    RETURNS UUID AS
$$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy for approval_document
DROP POLICY IF EXISTS approval_document_tenant_isolation ON hr_approval.approval_document;
CREATE POLICY approval_document_tenant_isolation ON hr_approval.approval_document
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for approval_template
DROP POLICY IF EXISTS approval_template_tenant_isolation ON hr_approval.approval_template;
CREATE POLICY approval_template_tenant_isolation ON hr_approval.approval_template
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for delegation_rule
DROP POLICY IF EXISTS delegation_rule_tenant_isolation ON hr_approval.delegation_rule;
CREATE POLICY delegation_rule_tenant_isolation ON hr_approval.delegation_rule
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );


-- V5__fix_approval_history.sql
-- ============================================================================
-- V5__fix_approval_history.sql
-- approval_history 테이블에 step_order 컬럼 추가
-- ============================================================================

ALTER TABLE hr_approval.approval_history
    ADD COLUMN IF NOT EXISTS step_order INT DEFAULT 0;


-- ============================================================================
-- SERVICE: notification-service
-- ============================================================================

-- V1__create_schema.sql
-- Create hr_notification schema
CREATE SCHEMA IF NOT EXISTS hr_notification;

-- Grant permissions
GRANT USAGE ON SCHEMA hr_notification TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_notification TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA hr_notification TO PUBLIC;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_notification GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_notification GRANT ALL ON SEQUENCES TO PUBLIC;


-- V2__create_notification_tables.sql
-- Notification table
CREATE TABLE IF NOT EXISTS hr_notification.notification
(
    id                UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id         UUID                     NOT NULL,
    recipient_id      UUID                     NOT NULL,
    recipient_email   VARCHAR(255),
    notification_type VARCHAR(50)              NOT NULL,
    channel           VARCHAR(20)              NOT NULL,
    title             VARCHAR(500)             NOT NULL,
    content           TEXT                     NOT NULL,
    link_url          VARCHAR(1000),
    reference_type    VARCHAR(50),
    reference_id      UUID,
    is_read           BOOLEAN                  NOT NULL DEFAULT FALSE,
    read_at           TIMESTAMP WITH TIME ZONE,
    is_sent           BOOLEAN                  NOT NULL DEFAULT FALSE,
    sent_at           TIMESTAMP WITH TIME ZONE,
    send_error        VARCHAR(500),
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100)
);

-- Indexes for notification
CREATE INDEX IF NOT EXISTS idx_notification_tenant_id ON hr_notification.notification (tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipient_id ON hr_notification.notification (recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON hr_notification.notification (is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON hr_notification.notification (created_at);

-- Notification Template table
CREATE TABLE IF NOT EXISTS hr_notification.notification_template
(
    id                UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id         UUID                     NOT NULL,
    code              VARCHAR(100)             NOT NULL,
    notification_type VARCHAR(50)              NOT NULL,
    channel           VARCHAR(20)              NOT NULL,
    name              VARCHAR(200)             NOT NULL,
    subject           VARCHAR(500),
    body_template     TEXT                     NOT NULL,
    description       VARCHAR(500),
    is_active         BOOLEAN                  NOT NULL DEFAULT TRUE,
    variables         TEXT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    UNIQUE (tenant_id, code)
);

-- Indexes for notification_template
CREATE INDEX IF NOT EXISTS idx_notification_template_tenant_id ON hr_notification.notification_template (tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_template_code ON hr_notification.notification_template (code);

-- Notification Preference table
CREATE TABLE IF NOT EXISTS hr_notification.notification_preference
(
    id                UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id         UUID                     NOT NULL,
    user_id           UUID                     NOT NULL,
    notification_type VARCHAR(50)              NOT NULL,
    channel           VARCHAR(20)              NOT NULL,
    enabled           BOOLEAN                  NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    UNIQUE (tenant_id, user_id, notification_type, channel)
);

-- Indexes for notification_preference
CREATE INDEX IF NOT EXISTS idx_notification_preference_tenant_id ON hr_notification.notification_preference (tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_preference_user_id ON hr_notification.notification_preference (user_id);


-- V3__enable_rls.sql
-- Enable Row Level Security on notification tables

ALTER TABLE hr_notification.notification
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_notification.notification_template
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification_template
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_notification.notification_preference
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification_preference
    FORCE ROW LEVEL SECURITY;


-- V4__create_rls_policies.sql
-- Create safe tenant getter function (if not exists)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
    RETURNS UUID AS
$$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy for notification
DROP POLICY IF EXISTS notification_tenant_isolation ON hr_notification.notification;
CREATE POLICY notification_tenant_isolation ON hr_notification.notification
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for notification_template
DROP POLICY IF EXISTS notification_template_tenant_isolation ON hr_notification.notification_template;
CREATE POLICY notification_template_tenant_isolation ON hr_notification.notification_template
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for notification_preference
DROP POLICY IF EXISTS notification_preference_tenant_isolation ON hr_notification.notification_preference;
CREATE POLICY notification_preference_tenant_isolation ON hr_notification.notification_preference
    FOR ALL
    USING (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
    get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );


-- ============================================================================
-- SERVICE: file-service
-- ============================================================================

-- V1__create_schema.sql
-- Create hr_file schema
CREATE SCHEMA IF NOT EXISTS hr_file;

GRANT USAGE ON SCHEMA hr_file TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_file TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA hr_file TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_file GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_file GRANT ALL ON SEQUENCES TO PUBLIC;


-- V2__create_file_tables.sql
CREATE TABLE IF NOT EXISTS hr_file.file_metadata
(
    id             UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id      UUID                     NOT NULL,
    original_name  VARCHAR(500)             NOT NULL,
    stored_name    VARCHAR(500)             NOT NULL UNIQUE,
    content_type   VARCHAR(255)             NOT NULL,
    file_size      BIGINT                   NOT NULL,
    storage_path   VARCHAR(1000)            NOT NULL,
    bucket_name    VARCHAR(255),
    storage_type   VARCHAR(20)              NOT NULL DEFAULT 'S3',
    reference_type VARCHAR(50),
    reference_id   UUID,
    uploader_id    UUID                     NOT NULL,
    uploader_name  VARCHAR(100),
    is_public      BOOLEAN                  NOT NULL DEFAULT FALSE,
    download_count INTEGER                  NOT NULL DEFAULT 0,
    checksum       VARCHAR(128),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(100),
    updated_by     VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_file_metadata_tenant_id ON hr_file.file_metadata (tenant_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_reference ON hr_file.file_metadata (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploader_id ON hr_file.file_metadata (uploader_id);


-- V3__enable_rls.sql
ALTER TABLE hr_file.file_metadata
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_file.file_metadata
    FORCE ROW LEVEL SECURITY;


-- V4__create_rls_policies.sql
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
    RETURNS UUID AS
$$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

DROP POLICY IF EXISTS file_metadata_tenant_isolation ON hr_file.file_metadata;
CREATE POLICY file_metadata_tenant_isolation ON hr_file.file_metadata
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());


-- ============================================================================
-- SERVICE: recruitment-service
-- ============================================================================

-- V1__create_schema.sql
CREATE SCHEMA IF NOT EXISTS hr_recruitment;
GRANT USAGE ON SCHEMA hr_recruitment TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_recruitment TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA hr_recruitment TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_recruitment GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_recruitment GRANT ALL ON SEQUENCES TO PUBLIC;


-- V2__create_tables.sql
-- Job Posting (채용공고)
CREATE TABLE hr_recruitment.job_posting
(
    id                       UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id                UUID         NOT NULL,
    job_code                 VARCHAR(30)  NOT NULL,
    title                    VARCHAR(200) NOT NULL,
    department_id            UUID,
    department_name          VARCHAR(100),
    position_id              UUID,
    position_name            VARCHAR(100),
    job_description          TEXT,
    requirements             TEXT,
    preferred_qualifications TEXT,
    employment_type          VARCHAR(20)  NOT NULL    DEFAULT 'FULL_TIME',
    experience_min           INTEGER,
    experience_max           INTEGER,
    salary_min               DECIMAL(15, 2),
    salary_max               DECIMAL(15, 2),
    salary_negotiable        BOOLEAN                  DEFAULT TRUE,
    work_location            VARCHAR(200),
    headcount                INTEGER                  DEFAULT 1,
    skills                   JSONB,
    benefits                 JSONB,
    status                   VARCHAR(20)  NOT NULL    DEFAULT 'DRAFT',
    open_date                DATE,
    close_date               DATE,
    recruiter_id             UUID,
    recruiter_name           VARCHAR(100),
    hiring_manager_id        UUID,
    hiring_manager_name      VARCHAR(100),
    application_count        INTEGER                  DEFAULT 0,
    view_count               INTEGER                  DEFAULT 0,
    is_featured              BOOLEAN                  DEFAULT FALSE,
    is_urgent                BOOLEAN                  DEFAULT FALSE,
    interview_process        JSONB,
    created_at               TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by               UUID,
    updated_by               UUID
);

CREATE INDEX idx_job_posting_tenant ON hr_recruitment.job_posting (tenant_id);
CREATE INDEX idx_job_posting_status ON hr_recruitment.job_posting (status);
CREATE INDEX idx_job_posting_job_code ON hr_recruitment.job_posting (job_code);
CREATE INDEX idx_job_posting_department ON hr_recruitment.job_posting (department_id);

-- Applicant (지원자)
CREATE TABLE hr_recruitment.applicant
(
    id               UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id        UUID         NOT NULL,
    name             VARCHAR(100) NOT NULL,
    email            VARCHAR(200) NOT NULL,
    phone            VARCHAR(20),
    birth_date       DATE,
    gender           VARCHAR(10),
    address          VARCHAR(500),
    resume_file_id   UUID,
    portfolio_url    VARCHAR(500),
    linkedin_url     VARCHAR(500),
    github_url       VARCHAR(500),
    education        JSONB,
    experience       JSONB,
    skills           JSONB,
    certificates     JSONB,
    languages        JSONB,
    source           VARCHAR(50),
    source_detail    VARCHAR(200),
    notes            TEXT,
    is_blacklisted   BOOLEAN                  DEFAULT FALSE,
    blacklist_reason TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by       UUID,
    updated_by       UUID
);

CREATE INDEX idx_applicant_tenant ON hr_recruitment.applicant (tenant_id);
CREATE INDEX idx_applicant_email ON hr_recruitment.applicant (email);
CREATE INDEX idx_applicant_name ON hr_recruitment.applicant (name);

-- Application (지원서)
CREATE TABLE hr_recruitment.application
(
    id                   UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id            UUID        NOT NULL,
    job_posting_id       UUID        NOT NULL REFERENCES hr_recruitment.job_posting (id),
    applicant_id         UUID        NOT NULL REFERENCES hr_recruitment.applicant (id),
    application_number   VARCHAR(50) NOT NULL,
    status               VARCHAR(30) NOT NULL     DEFAULT 'SUBMITTED',
    cover_letter         TEXT,
    answers              JSONB,
    expected_salary      BIGINT,
    available_date       VARCHAR(100),
    referrer_name        VARCHAR(100),
    referrer_employee_id UUID,
    screening_score      INTEGER,
    screening_notes      TEXT,
    screened_by          UUID,
    screened_at          TIMESTAMP WITH TIME ZONE,
    current_stage        VARCHAR(50)              DEFAULT 'DOCUMENT',
    stage_order          INTEGER                  DEFAULT 0,
    rejection_reason     TEXT,
    rejected_at          TIMESTAMP WITH TIME ZONE,
    withdrawn_at         TIMESTAMP WITH TIME ZONE,
    hired_at             TIMESTAMP WITH TIME ZONE,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by           UUID,
    updated_by           UUID
);

CREATE INDEX idx_application_tenant ON hr_recruitment.application (tenant_id);
CREATE INDEX idx_application_job_posting ON hr_recruitment.application (job_posting_id);
CREATE INDEX idx_application_applicant ON hr_recruitment.application (applicant_id);
CREATE INDEX idx_application_status ON hr_recruitment.application (status);
CREATE INDEX idx_application_number ON hr_recruitment.application (application_number);

-- Interview (면접)
CREATE TABLE hr_recruitment.interview
(
    id                UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id         UUID        NOT NULL,
    application_id    UUID        NOT NULL REFERENCES hr_recruitment.application (id),
    interview_type    VARCHAR(30) NOT NULL,
    round             INTEGER     NOT NULL     DEFAULT 1,
    status            VARCHAR(20) NOT NULL     DEFAULT 'SCHEDULING',
    scheduled_date    DATE,
    scheduled_time    TIME,
    duration_minutes  INTEGER                  DEFAULT 60,
    location          VARCHAR(200),
    meeting_url       VARCHAR(500),
    interviewers      JSONB,
    notes             TEXT,
    result            VARCHAR(20),
    result_notes      TEXT,
    overall_score     INTEGER,
    started_at        TIMESTAMP WITH TIME ZONE,
    ended_at          TIMESTAMP WITH TIME ZONE,
    feedback_deadline DATE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by        UUID,
    updated_by        UUID
);

CREATE INDEX idx_interview_tenant ON hr_recruitment.interview (tenant_id);
CREATE INDEX idx_interview_application ON hr_recruitment.interview (application_id);
CREATE INDEX idx_interview_status ON hr_recruitment.interview (status);
CREATE INDEX idx_interview_scheduled ON hr_recruitment.interview (scheduled_date);

-- Interview Score (면접 평가)
CREATE TABLE hr_recruitment.interview_score
(
    id               UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id        UUID         NOT NULL,
    interview_id     UUID         NOT NULL REFERENCES hr_recruitment.interview (id),
    interviewer_id   UUID         NOT NULL,
    interviewer_name VARCHAR(100),
    criterion        VARCHAR(100) NOT NULL,
    score            INTEGER      NOT NULL,
    max_score        INTEGER                  DEFAULT 5,
    weight           DOUBLE PRECISION         DEFAULT 1.0,
    comment          TEXT,
    evaluated_at     TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by       UUID,
    updated_by       UUID
);

CREATE INDEX idx_interview_score_tenant ON hr_recruitment.interview_score (tenant_id);
CREATE INDEX idx_interview_score_interview ON hr_recruitment.interview_score (interview_id);
CREATE INDEX idx_interview_score_interviewer ON hr_recruitment.interview_score (interviewer_id);

-- Offer (채용 제안)
CREATE TABLE hr_recruitment.offer
(
    id                   UUID PRIMARY KEY         DEFAULT gen_random_uuid(),
    tenant_id            UUID           NOT NULL,
    application_id       UUID           NOT NULL REFERENCES hr_recruitment.application (id) UNIQUE,
    offer_number         VARCHAR(50)    NOT NULL,
    status               VARCHAR(20)    NOT NULL  DEFAULT 'DRAFT',
    position_title       VARCHAR(100)   NOT NULL,
    department_id        UUID,
    department_name      VARCHAR(100),
    grade_code           VARCHAR(30),
    grade_name           VARCHAR(50),
    base_salary          DECIMAL(15, 2) NOT NULL,
    signing_bonus        DECIMAL(15, 2),
    benefits             JSONB,
    start_date           DATE           NOT NULL,
    employment_type      VARCHAR(20)    NOT NULL  DEFAULT 'FULL_TIME',
    probation_months     INTEGER                  DEFAULT 3,
    work_location        VARCHAR(200),
    report_to_id         UUID,
    report_to_name       VARCHAR(100),
    offer_letter_file_id UUID,
    special_terms        TEXT,
    expires_at           TIMESTAMP WITH TIME ZONE,
    sent_at              TIMESTAMP WITH TIME ZONE,
    responded_at         TIMESTAMP WITH TIME ZONE,
    decline_reason       TEXT,
    approved_by          UUID,
    approved_at          TIMESTAMP WITH TIME ZONE,
    negotiation_notes    TEXT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by           UUID,
    updated_by           UUID
);

CREATE INDEX idx_offer_tenant ON hr_recruitment.offer (tenant_id);
CREATE INDEX idx_offer_application ON hr_recruitment.offer (application_id);
CREATE INDEX idx_offer_status ON hr_recruitment.offer (status);
CREATE INDEX idx_offer_number ON hr_recruitment.offer (offer_number);


-- V3__enable_rls.sql
ALTER TABLE hr_recruitment.job_posting
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.job_posting
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.applicant
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.applicant
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.application
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.application
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.interview
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.interview
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.interview_score
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.interview_score
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.offer
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.offer
    FORCE ROW LEVEL SECURITY;


-- V4__create_rls_policies.sql
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
    RETURNS UUID AS
$$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Job Posting RLS Policy
DROP POLICY IF EXISTS job_posting_tenant_isolation ON hr_recruitment.job_posting;
CREATE POLICY job_posting_tenant_isolation ON hr_recruitment.job_posting
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Applicant RLS Policy
DROP POLICY IF EXISTS applicant_tenant_isolation ON hr_recruitment.applicant;
CREATE POLICY applicant_tenant_isolation ON hr_recruitment.applicant
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Application RLS Policy
DROP POLICY IF EXISTS application_tenant_isolation ON hr_recruitment.application;
CREATE POLICY application_tenant_isolation ON hr_recruitment.application
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Interview RLS Policy
DROP POLICY IF EXISTS interview_tenant_isolation ON hr_recruitment.interview;
CREATE POLICY interview_tenant_isolation ON hr_recruitment.interview
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Interview Score RLS Policy
DROP POLICY IF EXISTS interview_score_tenant_isolation ON hr_recruitment.interview_score;
CREATE POLICY interview_score_tenant_isolation ON hr_recruitment.interview_score
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Offer RLS Policy
DROP POLICY IF EXISTS offer_tenant_isolation ON hr_recruitment.offer;
CREATE POLICY offer_tenant_isolation ON hr_recruitment.offer
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());


-- V5__fix_audit_columns_type.sql
-- ============================================================================
-- V3__fix_audit_columns_type.sql
-- Fix created_by/updated_by columns from UUID to VARCHAR(100) for consistency
-- ============================================================================

-- job_posting table
ALTER TABLE hr_recruitment.job_posting
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- applicant table
ALTER TABLE hr_recruitment.applicant
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- application table
ALTER TABLE hr_recruitment.application
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- interview table
ALTER TABLE hr_recruitment.interview
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- interview_score table
ALTER TABLE hr_recruitment.interview_score
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- offer table
ALTER TABLE hr_recruitment.offer
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);


-- ============================================================================
-- SERVICE: appointment-service
-- ============================================================================

-- V1__create_schema.sql
CREATE SCHEMA IF NOT EXISTS hr_appointment;
GRANT USAGE ON SCHEMA hr_appointment TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_appointment TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA hr_appointment TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_appointment GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_appointment GRANT ALL ON SEQUENCES TO PUBLIC;


-- V2__create_appointment_tables.sql
-- ============================================================================
-- V2__create_appointment_tables.sql
-- 발령 서비스 테이블 생성
-- ============================================================================

-- 발령안 테이블
CREATE TABLE IF NOT EXISTS hr_appointment.appointment_draft
(
    id             UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id      UUID                     NOT NULL,
    draft_number   VARCHAR(50)              NOT NULL,
    title          VARCHAR(200)             NOT NULL,
    effective_date DATE                     NOT NULL,
    description    TEXT,
    status         VARCHAR(20)              NOT NULL DEFAULT 'DRAFT',
    approval_id    UUID,
    approved_by    UUID,
    approved_at    TIMESTAMP WITH TIME ZONE,
    executed_at    TIMESTAMP WITH TIME ZONE,
    executed_by    UUID,
    cancelled_at   TIMESTAMP WITH TIME ZONE,
    cancelled_by   UUID,
    cancel_reason  TEXT,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(100),
    updated_by     VARCHAR(100),
    UNIQUE (tenant_id, draft_number)
);

CREATE INDEX IF NOT EXISTS idx_appointment_draft_tenant_id ON hr_appointment.appointment_draft (tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_draft_status ON hr_appointment.appointment_draft (status);
CREATE INDEX IF NOT EXISTS idx_appointment_draft_effective_date ON hr_appointment.appointment_draft (effective_date);

-- 발령 상세 테이블
CREATE TABLE IF NOT EXISTS hr_appointment.appointment_detail
(
    id                   UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id            UUID                     NOT NULL,
    draft_id             UUID                     NOT NULL REFERENCES hr_appointment.appointment_draft (id),
    employee_id          UUID                     NOT NULL,
    employee_name        VARCHAR(100),
    employee_number      VARCHAR(50),
    appointment_type     VARCHAR(30)              NOT NULL,
    from_department_id   UUID,
    from_department_name VARCHAR(100),
    to_department_id     UUID,
    to_department_name   VARCHAR(100),
    from_position_code   VARCHAR(50),
    from_position_name   VARCHAR(100),
    to_position_code     VARCHAR(50),
    to_position_name     VARCHAR(100),
    from_grade_code      VARCHAR(50),
    from_grade_name      VARCHAR(100),
    to_grade_code        VARCHAR(50),
    to_grade_name        VARCHAR(100),
    from_job_code        VARCHAR(50),
    from_job_name        VARCHAR(100),
    to_job_code          VARCHAR(50),
    to_job_name          VARCHAR(100),
    reason               TEXT,
    status               VARCHAR(20)              NOT NULL DEFAULT 'PENDING',
    executed_at          TIMESTAMP WITH TIME ZONE,
    error_message        TEXT,
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),
    updated_by           VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_appointment_detail_tenant_id ON hr_appointment.appointment_detail (tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_detail_draft_id ON hr_appointment.appointment_detail (draft_id);
CREATE INDEX IF NOT EXISTS idx_appointment_detail_employee_id ON hr_appointment.appointment_detail (employee_id);

-- 예약 발령 테이블
CREATE TABLE IF NOT EXISTS hr_appointment.appointment_schedule
(
    id             UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id      UUID                     NOT NULL,
    draft_id       UUID                     NOT NULL,
    scheduled_date DATE                     NOT NULL,
    scheduled_time TIME                              DEFAULT '00:00:00',
    status         VARCHAR(20)              NOT NULL DEFAULT 'SCHEDULED',
    executed_at    TIMESTAMP WITH TIME ZONE,
    error_message  TEXT,
    retry_count    INTEGER                           DEFAULT 0,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(100),
    updated_by     VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_appointment_schedule_tenant_id ON hr_appointment.appointment_schedule (tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_schedule_draft_id ON hr_appointment.appointment_schedule (draft_id);
CREATE INDEX IF NOT EXISTS idx_appointment_schedule_scheduled_date ON hr_appointment.appointment_schedule (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointment_schedule_status ON hr_appointment.appointment_schedule (status);

-- 발령 이력 테이블
CREATE TABLE IF NOT EXISTS hr_appointment.appointment_history
(
    id               UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id        UUID                     NOT NULL,
    detail_id        UUID,
    employee_id      UUID                     NOT NULL,
    employee_name    VARCHAR(100),
    employee_number  VARCHAR(50),
    appointment_type VARCHAR(30)              NOT NULL,
    effective_date   DATE                     NOT NULL,
    from_values      JSONB,
    to_values        JSONB,
    reason           TEXT,
    draft_number     VARCHAR(50),
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_appointment_history_tenant_id ON hr_appointment.appointment_history (tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_employee_id ON hr_appointment.appointment_history (employee_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_effective_date ON hr_appointment.appointment_history (effective_date);
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_type ON hr_appointment.appointment_history (appointment_type);


-- V3__enable_rls.sql
ALTER TABLE hr_appointment.appointment_draft
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_draft
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_appointment.appointment_detail
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_detail
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_appointment.appointment_history
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_history
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_appointment.appointment_schedule
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_schedule
    FORCE ROW LEVEL SECURITY;


-- V4__create_rls_policies.sql
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
    RETURNS UUID AS
$$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

DROP POLICY IF EXISTS appointment_draft_tenant_isolation ON hr_appointment.appointment_draft;
CREATE POLICY appointment_draft_tenant_isolation ON hr_appointment.appointment_draft
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

DROP POLICY IF EXISTS appointment_detail_tenant_isolation ON hr_appointment.appointment_detail;
CREATE POLICY appointment_detail_tenant_isolation ON hr_appointment.appointment_detail
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

DROP POLICY IF EXISTS appointment_history_tenant_isolation ON hr_appointment.appointment_history;
CREATE POLICY appointment_history_tenant_isolation ON hr_appointment.appointment_history
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

DROP POLICY IF EXISTS appointment_schedule_tenant_isolation ON hr_appointment.appointment_schedule;
CREATE POLICY appointment_schedule_tenant_isolation ON hr_appointment.appointment_schedule
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());


-- ============================================================================
-- SERVICE: certificate-service
-- ============================================================================

-- V1__create_schema.sql
CREATE SCHEMA IF NOT EXISTS hr_certificate;
GRANT USAGE ON SCHEMA hr_certificate TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA hr_certificate TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA hr_certificate TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_certificate GRANT ALL ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr_certificate GRANT ALL ON SEQUENCES TO PUBLIC;


-- V2__create_certificate_tables.sql
-- ============================================================================
-- V2__create_certificate_tables.sql
-- 증명서 서비스 테이블 생성
-- ============================================================================

-- 증명서 템플릿 테이블
CREATE TABLE IF NOT EXISTS hr_certificate.certificate_template
(
    id                   UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id            UUID                     NOT NULL,
    name                 VARCHAR(100)             NOT NULL,
    description          TEXT,
    content_html         TEXT                     NOT NULL,
    header_html          TEXT,
    footer_html          TEXT,
    css_styles           TEXT,
    page_size            VARCHAR(10)                       DEFAULT 'A4',
    orientation          VARCHAR(10)                       DEFAULT 'PORTRAIT',
    margin_top           INTEGER                           DEFAULT 20,
    margin_bottom        INTEGER                           DEFAULT 20,
    margin_left          INTEGER                           DEFAULT 20,
    margin_right         INTEGER                           DEFAULT 20,
    variables            JSONB,
    include_company_seal BOOLEAN                           DEFAULT TRUE,
    include_signature    BOOLEAN                           DEFAULT TRUE,
    seal_image_url       VARCHAR(500),
    signature_image_url  VARCHAR(500),
    sample_image_url     VARCHAR(500),
    is_active            BOOLEAN                           DEFAULT TRUE,
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),
    updated_by           VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_certificate_template_tenant_id ON hr_certificate.certificate_template (tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificate_template_is_active ON hr_certificate.certificate_template (is_active);

-- 증명서 유형 테이블
CREATE TABLE IF NOT EXISTS hr_certificate.certificate_type
(
    id                     UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id              UUID                     NOT NULL,
    code                   VARCHAR(30)              NOT NULL,
    name                   VARCHAR(100)             NOT NULL,
    name_en                VARCHAR(100),
    description            TEXT,
    template_id            UUID REFERENCES hr_certificate.certificate_template (id),
    requires_approval      BOOLEAN                           DEFAULT FALSE,
    approval_template_id   UUID,
    auto_issue             BOOLEAN                           DEFAULT TRUE,
    valid_days             INTEGER                           DEFAULT 90,
    fee                    DECIMAL(10, 2)                    DEFAULT 0,
    max_copies_per_request INTEGER                           DEFAULT 5,
    sort_order             INTEGER                           DEFAULT 0,
    is_active              BOOLEAN                           DEFAULT TRUE,
    created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by             VARCHAR(100),
    updated_by             VARCHAR(100),
    UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_certificate_type_tenant_id ON hr_certificate.certificate_type (tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificate_type_code ON hr_certificate.certificate_type (code);
CREATE INDEX IF NOT EXISTS idx_certificate_type_is_active ON hr_certificate.certificate_type (is_active);

-- 증명서 신청 테이블
CREATE TABLE IF NOT EXISTS hr_certificate.certificate_request
(
    id                  UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id           UUID                     NOT NULL,
    certificate_type_id UUID                     NOT NULL REFERENCES hr_certificate.certificate_type (id),
    employee_id         UUID                     NOT NULL,
    employee_name       VARCHAR(100),
    employee_number     VARCHAR(50),
    request_number      VARCHAR(50)              NOT NULL,
    purpose             VARCHAR(200),
    submission_target   VARCHAR(200),
    copies              INTEGER                           DEFAULT 1,
    language            VARCHAR(10)                       DEFAULT 'KO',
    include_salary      BOOLEAN                           DEFAULT FALSE,
    period_from         DATE,
    period_to           DATE,
    custom_fields       JSONB,
    remarks             TEXT,
    status              VARCHAR(20)              NOT NULL DEFAULT 'PENDING',
    approval_id         UUID,
    approved_by         UUID,
    approved_at         TIMESTAMP WITH TIME ZONE,
    rejection_reason    TEXT,
    issued_at           TIMESTAMP WITH TIME ZONE,
    issued_by           UUID,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),
    UNIQUE (tenant_id, request_number)
);

CREATE INDEX IF NOT EXISTS idx_certificate_request_tenant_id ON hr_certificate.certificate_request (tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificate_request_employee_id ON hr_certificate.certificate_request (employee_id);
CREATE INDEX IF NOT EXISTS idx_certificate_request_status ON hr_certificate.certificate_request (status);
CREATE INDEX IF NOT EXISTS idx_certificate_request_certificate_type_id ON hr_certificate.certificate_request (certificate_type_id);

-- 발급된 증명서 테이블
CREATE TABLE IF NOT EXISTS hr_certificate.certificate_issue
(
    id                UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    tenant_id         UUID                     NOT NULL,
    request_id        UUID                     NOT NULL REFERENCES hr_certificate.certificate_request (id),
    issue_number      VARCHAR(50)              NOT NULL,
    verification_code VARCHAR(20)              NOT NULL,
    file_id           UUID,
    content_snapshot  JSONB,
    issued_by         UUID                     NOT NULL,
    issued_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    downloaded_at     TIMESTAMP WITH TIME ZONE,
    download_count    INTEGER                           DEFAULT 0,
    verified_count    INTEGER                           DEFAULT 0,
    last_verified_at  TIMESTAMP WITH TIME ZONE,
    expires_at        DATE                     NOT NULL,
    is_revoked        BOOLEAN                           DEFAULT FALSE,
    revoked_at        TIMESTAMP WITH TIME ZONE,
    revoked_by        UUID,
    revoke_reason     TEXT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    UNIQUE (tenant_id, issue_number),
    UNIQUE (verification_code)
);

CREATE INDEX IF NOT EXISTS idx_certificate_issue_tenant_id ON hr_certificate.certificate_issue (tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificate_issue_request_id ON hr_certificate.certificate_issue (request_id);
CREATE INDEX IF NOT EXISTS idx_certificate_issue_verification_code ON hr_certificate.certificate_issue (verification_code);
CREATE INDEX IF NOT EXISTS idx_certificate_issue_expires_at ON hr_certificate.certificate_issue (expires_at);

-- 진위확인 로그 테이블 (tenant_id 없음)
CREATE TABLE IF NOT EXISTS hr_certificate.verification_log
(
    id                    UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    issue_id              UUID REFERENCES hr_certificate.certificate_issue (id),
    verification_code     VARCHAR(20)              NOT NULL,
    verified_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verifier_ip           VARCHAR(45),
    verifier_user_agent   TEXT,
    verifier_name         VARCHAR(100),
    verifier_organization VARCHAR(200),
    is_valid              BOOLEAN                  NOT NULL,
    failure_reason        VARCHAR(100),
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_verification_log_issue_id ON hr_certificate.verification_log (issue_id);
CREATE INDEX IF NOT EXISTS idx_verification_log_verification_code ON hr_certificate.verification_log (verification_code);
CREATE INDEX IF NOT EXISTS idx_verification_log_verified_at ON hr_certificate.verification_log (verified_at);


-- V3__enable_rls.sql
ALTER TABLE hr_certificate.certificate_type
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_type
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.certificate_template
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_template
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.certificate_request
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_request
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.certificate_issue
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.certificate_issue
    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_certificate.verification_log
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_certificate.verification_log
    FORCE ROW LEVEL SECURITY;


-- V4__create_rls_policies.sql
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
    RETURNS UUID AS
$$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

DROP POLICY IF EXISTS certificate_type_tenant_isolation ON hr_certificate.certificate_type;
CREATE POLICY certificate_type_tenant_isolation ON hr_certificate.certificate_type
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

DROP POLICY IF EXISTS certificate_template_tenant_isolation ON hr_certificate.certificate_template;
CREATE POLICY certificate_template_tenant_isolation ON hr_certificate.certificate_template
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

DROP POLICY IF EXISTS certificate_request_tenant_isolation ON hr_certificate.certificate_request;
CREATE POLICY certificate_request_tenant_isolation ON hr_certificate.certificate_request
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

DROP POLICY IF EXISTS certificate_issue_tenant_isolation ON hr_certificate.certificate_issue;
CREATE POLICY certificate_issue_tenant_isolation ON hr_certificate.certificate_issue
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- verification_log 테이블은 tenant_id 없음 (외부 검증용)


-- ============================================================================
-- SERVICE: auth-service
-- ============================================================================

-- V20__create_schema.sql
-- ============================================================================
-- V1__create_schema.sql
-- Auth 서비스 스키마 생성
-- ============================================================================
-- 참고: tenant_common 스키마는 tenant-service에서 이미 생성됨
-- 이 파일은 스키마가 없는 경우를 대비한 안전장치
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS tenant_common;


-- V21__create_auth_tables.sql
-- ============================================================================
-- V2__create_auth_tables.sql
-- Auth 서비스 테이블 생성
-- ============================================================================

-- 사용자 세션 테이블 (동시 로그인 관리)
CREATE TABLE IF NOT EXISTS tenant_common.user_sessions
(
    id               UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    user_id          VARCHAR(100)             NOT NULL,
    tenant_id        UUID                     NOT NULL,
    session_token    VARCHAR(500)             NOT NULL UNIQUE,
    refresh_token    VARCHAR(500),
    device_info      VARCHAR(500),
    ip_address       VARCHAR(45),
    user_agent       TEXT,
    location         VARCHAR(200),
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    expires_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active        BOOLEAN                           DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON tenant_common.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_id ON tenant_common.user_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON tenant_common.user_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON tenant_common.user_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON tenant_common.user_sessions (is_active);

-- 비밀번호 재설정 토큰 테이블
CREATE TABLE IF NOT EXISTS tenant_common.password_reset_tokens
(
    id         UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    user_id    VARCHAR(100)             NOT NULL,
    email      VARCHAR(255)             NOT NULL,
    token      VARCHAR(500)             NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at    TIMESTAMP WITH TIME ZONE,
    is_used    BOOLEAN                           DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON tenant_common.password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON tenant_common.password_reset_tokens (email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON tenant_common.password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON tenant_common.password_reset_tokens (expires_at);

-- 로그인 이력 테이블 (감사용)
CREATE TABLE IF NOT EXISTS tenant_common.login_history
(
    id             UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    user_id        VARCHAR(100)             NOT NULL,
    tenant_id      UUID,
    login_type     VARCHAR(20)              NOT NULL DEFAULT 'PASSWORD', -- PASSWORD, SSO, MFA
    status         VARCHAR(20)              NOT NULL,                    -- SUCCESS, FAILED, LOCKED
    ip_address     VARCHAR(45),
    user_agent     TEXT,
    location       VARCHAR(200),
    failure_reason VARCHAR(200),
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON tenant_common.login_history (user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_tenant_id ON tenant_common.login_history (tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON tenant_common.login_history (status);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON tenant_common.login_history (created_at);

-- 계정 잠금 테이블
CREATE TABLE IF NOT EXISTS tenant_common.account_locks
(
    id              UUID PRIMARY KEY                  DEFAULT gen_random_uuid(),
    user_id         VARCHAR(100)             NOT NULL UNIQUE,
    failed_attempts INT                               DEFAULT 0,
    last_failed_at  TIMESTAMP WITH TIME ZONE,
    locked_at       TIMESTAMP WITH TIME ZONE,
    lock_expires_at TIMESTAMP WITH TIME ZONE,
    is_locked       BOOLEAN                           DEFAULT FALSE,
    lock_reason     VARCHAR(200),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_locks_user_id ON tenant_common.account_locks (user_id);
CREATE INDEX IF NOT EXISTS idx_account_locks_is_locked ON tenant_common.account_locks (is_locked);

