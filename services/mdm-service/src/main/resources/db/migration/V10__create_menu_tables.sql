-- ============================================
-- V10: Create Menu Management Tables
-- Dynamic menu system for multi-tenant HR SaaS
-- ============================================

-- Menu Item: Core menu definition table
CREATE TABLE IF NOT EXISTS tenant_common.menu_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES tenant_common.menu_item(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    path VARCHAR(200),
    icon VARCHAR(50),
    menu_type VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',
    external_url VARCHAR(500),
    level INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    feature_code VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    show_in_nav BOOLEAN NOT NULL DEFAULT true,
    show_in_mobile BOOLEAN NOT NULL DEFAULT false,
    mobile_sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),

    CONSTRAINT chk_menu_type CHECK (menu_type IN ('INTERNAL', 'EXTERNAL', 'DIVIDER', 'HEADER'))
);

-- Create index for parent lookup
CREATE INDEX IF NOT EXISTS idx_menu_item_parent ON tenant_common.menu_item(parent_id);

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_menu_item_sort ON tenant_common.menu_item(level, sort_order);

-- Create index for code lookup
CREATE INDEX IF NOT EXISTS idx_menu_item_code ON tenant_common.menu_item(code);

-- Menu Permission: Maps menus to required roles/permissions
CREATE TABLE IF NOT EXISTS tenant_common.menu_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES tenant_common.menu_item(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) NOT NULL,
    permission_value VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_permission_type CHECK (permission_type IN ('ROLE', 'PERMISSION')),
    CONSTRAINT uq_menu_permission UNIQUE(menu_item_id, permission_type, permission_value)
);

-- Create index for menu lookup
CREATE INDEX IF NOT EXISTS idx_menu_permission_menu ON tenant_common.menu_permission(menu_item_id);

-- Tenant Menu Config: Per-tenant menu customization
CREATE TABLE IF NOT EXISTS tenant_common.tenant_menu_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    menu_item_id UUID NOT NULL REFERENCES tenant_common.menu_item(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    custom_name VARCHAR(100),
    custom_sort_order INTEGER,
    show_in_mobile BOOLEAN,
    mobile_sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tenant_menu_config UNIQUE(tenant_id, menu_item_id)
);

-- Create index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_tenant_menu_config_tenant ON tenant_common.tenant_menu_config(tenant_id);

-- Create index for menu lookup
CREATE INDEX IF NOT EXISTS idx_tenant_menu_config_menu ON tenant_common.tenant_menu_config(menu_item_id);

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
