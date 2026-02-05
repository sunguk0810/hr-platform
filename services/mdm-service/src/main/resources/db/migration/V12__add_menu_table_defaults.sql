-- ============================================
-- V12: Add default values to menu tables
-- Fix for tables created by JPA without defaults
-- ============================================

-- menu_item defaults
ALTER TABLE tenant_common.menu_item ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tenant_common.menu_item ALTER COLUMN menu_type SET DEFAULT 'INTERNAL';
ALTER TABLE tenant_common.menu_item ALTER COLUMN level SET DEFAULT 1;
ALTER TABLE tenant_common.menu_item ALTER COLUMN sort_order SET DEFAULT 0;
ALTER TABLE tenant_common.menu_item ALTER COLUMN is_system SET DEFAULT true;
ALTER TABLE tenant_common.menu_item ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE tenant_common.menu_item ALTER COLUMN show_in_nav SET DEFAULT true;
ALTER TABLE tenant_common.menu_item ALTER COLUMN show_in_mobile SET DEFAULT false;
ALTER TABLE tenant_common.menu_item ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tenant_common.menu_item ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- menu_permission defaults
ALTER TABLE tenant_common.menu_permission ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tenant_common.menu_permission ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- tenant_menu_config defaults (if needed)
ALTER TABLE tenant_common.tenant_menu_config ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tenant_common.tenant_menu_config ALTER COLUMN is_enabled SET DEFAULT true;
ALTER TABLE tenant_common.tenant_menu_config ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tenant_common.tenant_menu_config ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
