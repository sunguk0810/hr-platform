-- MDM Service: Consolidated Migration (V1)
-- Merged from: V1__init_mdm.sql, V2__add_indexes_and_schema_updates.sql, V3__seed_hr_codes.sql

SET search_path TO tenant_common, public;

-- Race-safe: tenant_common schema is shared with tenant-service, auth-service
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
-- 1.1 code_group
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.code_group (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID,
    group_code      VARCHAR(50)  NOT NULL,
    group_name      VARCHAR(100) NOT NULL,
    group_name_en   VARCHAR(100),
    description     VARCHAR(500),
    is_system       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_hierarchical BOOLEAN      NOT NULL DEFAULT FALSE,
    max_level       INTEGER      DEFAULT 1,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order      INTEGER,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- Partial unique indexes: tenant codes vs system codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_code_group_tenant_code
    ON tenant_common.code_group(tenant_id, group_code)
    WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_code_group_system_code
    ON tenant_common.code_group(group_code)
    WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_code_group_tenant_id ON tenant_common.code_group(tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_group_status    ON tenant_common.code_group(status);

-- -----------------------------------------------------------------------------
-- 1.2 common_code (includes V2 deprecation columns: replacement_code_id, deprecated_at, deprecation_grace_period_days)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.common_code (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_group_id               UUID         NOT NULL REFERENCES tenant_common.code_group(id) ON DELETE CASCADE,
    tenant_id                   UUID,
    parent_code_id              UUID,
    level                       INTEGER      NOT NULL DEFAULT 1,
    code                        VARCHAR(50)  NOT NULL,
    code_name                   VARCHAR(100) NOT NULL,
    code_name_en                VARCHAR(100),
    description                 VARCHAR(500),
    extra_value1                VARCHAR(100),
    extra_value2                VARCHAR(100),
    extra_value3                VARCHAR(100),
    extra_json                  TEXT,
    is_default                  BOOLEAN      NOT NULL DEFAULT FALSE,
    effective_from              DATE,
    effective_to                DATE,
    status                      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    is_active                   BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order                  INTEGER,
    replacement_code_id         UUID,
    deprecated_at               TIMESTAMPTZ,
    deprecation_grace_period_days INTEGER    DEFAULT 90,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                  VARCHAR(100),
    updated_by                  VARCHAR(100),

    FOREIGN KEY (parent_code_id) REFERENCES tenant_common.common_code(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_common_code_group_id  ON tenant_common.common_code(code_group_id);
CREATE INDEX IF NOT EXISTS idx_common_code_tenant_id ON tenant_common.common_code(tenant_id);
CREATE INDEX IF NOT EXISTS idx_common_code_parent_id ON tenant_common.common_code(parent_code_id);
CREATE INDEX IF NOT EXISTS idx_common_code_status    ON tenant_common.common_code(status);
CREATE INDEX IF NOT EXISTS idx_common_code_effective ON tenant_common.common_code(effective_from, effective_to);

-- -----------------------------------------------------------------------------
-- 1.3 code_tenant_mapping
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.code_tenant_mapping (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID         NOT NULL,
    common_code_id      UUID         NOT NULL REFERENCES tenant_common.common_code(id) ON DELETE CASCADE,
    custom_code_name    VARCHAR(100),
    custom_code_name_en VARCHAR(100),
    custom_description  VARCHAR(500),
    custom_extra_value1 VARCHAR(100),
    custom_extra_value2 VARCHAR(100),
    custom_extra_value3 VARCHAR(100),
    custom_extra_json   TEXT,
    custom_sort_order   INTEGER,
    is_hidden           BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),

    UNIQUE(tenant_id, common_code_id)
);

CREATE INDEX IF NOT EXISTS idx_code_tenant_mapping_tenant_id ON tenant_common.code_tenant_mapping(tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_tenant_mapping_code_id   ON tenant_common.code_tenant_mapping(common_code_id);

-- -----------------------------------------------------------------------------
-- 1.4 code_history
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.code_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID,
    code_id         UUID         NOT NULL,
    code_group_id   UUID         NOT NULL,
    group_code      VARCHAR(50)  NOT NULL,
    code            VARCHAR(50)  NOT NULL,
    action          VARCHAR(20)  NOT NULL,
    field_name      VARCHAR(100),
    old_value       TEXT,
    new_value       TEXT,
    change_reason   VARCHAR(500),
    changed_by      VARCHAR(100),
    changed_by_id   UUID,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_code_history_code_id    ON tenant_common.code_history(code_id);
CREATE INDEX IF NOT EXISTS idx_code_history_tenant_id  ON tenant_common.code_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_code_history_action     ON tenant_common.code_history(action);
CREATE INDEX IF NOT EXISTS idx_code_history_group_code ON tenant_common.code_history(group_code);
CREATE INDEX IF NOT EXISTS idx_code_history_code_created   ON tenant_common.code_history(code_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_history_tenant_created ON tenant_common.code_history(tenant_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 1.5 menu_item (includes V2 tenant_id column)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.menu_item (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID,
    parent_id         UUID REFERENCES tenant_common.menu_item(id) ON DELETE CASCADE,
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
    group_name        VARCHAR(50),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),

    CONSTRAINT chk_menu_type CHECK (menu_type IN ('INTERNAL', 'EXTERNAL', 'DIVIDER', 'HEADER'))
);

CREATE INDEX IF NOT EXISTS idx_menu_item_parent ON tenant_common.menu_item(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_sort   ON tenant_common.menu_item(level, sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_item_code   ON tenant_common.menu_item(code);
CREATE INDEX IF NOT EXISTS idx_menu_item_tenant ON tenant_common.menu_item(tenant_id);

-- -----------------------------------------------------------------------------
-- 1.6 menu_permission
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.menu_permission (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id     UUID        NOT NULL REFERENCES tenant_common.menu_item(id) ON DELETE CASCADE,
    permission_type  VARCHAR(20) NOT NULL,
    permission_value VARCHAR(50) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_permission_type CHECK (permission_type IN ('ROLE', 'PERMISSION')),
    CONSTRAINT uq_menu_permission  UNIQUE(menu_item_id, permission_type, permission_value)
);

CREATE INDEX IF NOT EXISTS idx_menu_permission_menu ON tenant_common.menu_permission(menu_item_id);

-- -----------------------------------------------------------------------------
-- 1.7 tenant_menu_config
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.tenant_menu_config (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID        NOT NULL,
    menu_item_id      UUID        NOT NULL REFERENCES tenant_common.menu_item(id) ON DELETE CASCADE,
    is_enabled        BOOLEAN     NOT NULL DEFAULT true,
    custom_name       VARCHAR(100),
    custom_sort_order INTEGER,
    show_in_mobile    BOOLEAN,
    mobile_sort_order INTEGER,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tenant_menu_config UNIQUE(tenant_id, menu_item_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_menu_config_tenant ON tenant_common.tenant_menu_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_menu_config_menu   ON tenant_common.tenant_menu_config(menu_item_id);

-- -----------------------------------------------------------------------------
-- 1.8 code_usage_mapping (from V2)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.code_usage_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_code VARCHAR(50) NOT NULL,
    resource_type VARCHAR(20) NOT NULL,
    resource_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    estimated_impact VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_code_usage_group_resource UNIQUE (group_code, resource_type, resource_name)
);

CREATE INDEX IF NOT EXISTS idx_code_usage_mapping_group ON tenant_common.code_usage_mapping(group_code);

-- Menu navigation composite indexes
CREATE INDEX IF NOT EXISTS idx_menu_item_active_nav
    ON tenant_common.menu_item(is_active, level, sort_order) WHERE show_in_nav = true;
CREATE INDEX IF NOT EXISTS idx_tenant_menu_config_tenant_enabled
    ON tenant_common.tenant_menu_config(tenant_id, is_enabled);

-- CommonCode composite index
CREATE INDEX IF NOT EXISTS idx_common_code_group_tenant_active
    ON tenant_common.common_code(code_group_id, tenant_id, is_active);

-- =============================================================================
-- 2. TABLE COMMENTS
-- =============================================================================

COMMENT ON TABLE  tenant_common.menu_item                  IS 'Core menu item definitions';
COMMENT ON COLUMN tenant_common.menu_item.code             IS 'Unique identifier for the menu (e.g., EMPLOYEES, ATTENDANCE)';
COMMENT ON COLUMN tenant_common.menu_item.path             IS 'Frontend route path (e.g., /employees)';
COMMENT ON COLUMN tenant_common.menu_item.icon             IS 'Lucide icon name (e.g., Users, Calendar)';
COMMENT ON COLUMN tenant_common.menu_item.menu_type        IS 'INTERNAL (app route), EXTERNAL (link), DIVIDER, HEADER';
COMMENT ON COLUMN tenant_common.menu_item.feature_code     IS 'Links to TenantFeature for feature flag control';
COMMENT ON COLUMN tenant_common.menu_item.is_system        IS 'System menus cannot be deleted by tenants';
COMMENT ON COLUMN tenant_common.menu_item.show_in_mobile   IS 'Whether to show in mobile bottom tab bar';

COMMENT ON TABLE  tenant_common.menu_permission                IS 'Required permissions for menu access';
COMMENT ON COLUMN tenant_common.menu_permission.permission_type IS 'ROLE (e.g., HR_MANAGER) or PERMISSION (e.g., employee:read)';

COMMENT ON TABLE  tenant_common.tenant_menu_config             IS 'Per-tenant menu customization';
COMMENT ON COLUMN tenant_common.tenant_menu_config.custom_name IS 'Override menu name for this tenant';

-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

-- code_group (tenant_id can be NULL for system codes)
ALTER TABLE tenant_common.code_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.code_group FORCE ROW LEVEL SECURITY;

-- common_code (tenant_id can be NULL for system codes)
ALTER TABLE tenant_common.common_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.common_code FORCE ROW LEVEL SECURITY;

-- code_tenant_mapping (tenant_id is always required)
ALTER TABLE tenant_common.code_tenant_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.code_tenant_mapping FORCE ROW LEVEL SECURITY;

-- code_history (tenant_id can be NULL for system code changes)
ALTER TABLE tenant_common.code_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.code_history FORCE ROW LEVEL SECURITY;

-- tenant_menu_config (per-tenant overrides)
ALTER TABLE tenant_common.tenant_menu_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.tenant_menu_config FORCE ROW LEVEL SECURITY;

-- NOTE: menu_item and menu_permission do NOT have RLS - they are system-wide.

-- =============================================================================
-- 4. RLS POLICIES
-- =============================================================================

-- ---- code_group ----
DROP POLICY IF EXISTS code_group_tenant_isolation ON tenant_common.code_group;
CREATE POLICY code_group_tenant_isolation ON tenant_common.code_group
    FOR ALL
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    )
    WITH CHECK (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

-- ---- common_code ----
DROP POLICY IF EXISTS common_code_tenant_isolation ON tenant_common.common_code;
CREATE POLICY common_code_tenant_isolation ON tenant_common.common_code
    FOR ALL
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    )
    WITH CHECK (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

-- ---- code_tenant_mapping ----
DROP POLICY IF EXISTS code_tenant_mapping_tenant_isolation ON tenant_common.code_tenant_mapping;
CREATE POLICY code_tenant_mapping_tenant_isolation ON tenant_common.code_tenant_mapping
    FOR ALL
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    )
    WITH CHECK (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

-- ---- code_history ----
DROP POLICY IF EXISTS code_history_tenant_isolation ON tenant_common.code_history;
CREATE POLICY code_history_tenant_isolation ON tenant_common.code_history
    FOR ALL
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    )
    WITH CHECK (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

-- ---- tenant_menu_config ----
DROP POLICY IF EXISTS tenant_menu_config_tenant_isolation ON tenant_common.tenant_menu_config;
CREATE POLICY tenant_menu_config_tenant_isolation ON tenant_common.tenant_menu_config
    FOR ALL
    USING (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    )
    WITH CHECK (
        tenant_common.get_current_tenant_safe() IS NULL
        OR tenant_id = tenant_common.get_current_tenant_safe()
    );

-- =============================================================================
-- 5. SEED DATA: Menu Items and Permissions
-- =============================================================================

DO $$
DECLARE
    v_dashboard_id UUID;
    v_my_info_id UUID;
    v_employees_id UUID;
    v_organization_id UUID;
    v_appointments_id UUID;
    v_attendance_id UUID;
    v_approvals_id UUID;
    v_certificates_id UUID;
    v_recruitment_id UUID;
    v_transfer_id UUID;
    v_headcount_id UUID;
    v_condolence_id UUID;
    v_committee_id UUID;
    v_employee_card_id UUID;
    v_notifications_id UUID;
    v_settings_id UUID;
    v_mdm_id UUID;
    v_audit_id UUID;
    v_tenants_id UUID;
    v_help_id UUID;
    v_announcements_id UUID;
    v_org_chart_id UUID;
    v_file_mgmt_id UUID;
    v_admin_menus_id UUID;
    v_now TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN

-- ============================================
-- Level 1: Top-level Menus
-- ============================================

-- Dashboard (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'DASHBOARD', '대시보드', 'Dashboard', '/dashboard', 'LayoutDashboard', 1, 10, true, true, 1, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_dashboard_id;

-- My Info (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'MY_INFO', '내 정보', 'My Info', '/my-info', 'User', 1, 20, true, false, null, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_my_info_id;

-- Employees (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'EMPLOYEES', '인사정보', 'HR Information', '/employees', 'Users', 1, 30, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_employees_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES (v_employees_id, 'PERMISSION', 'employee:read');

-- Organization (accessible by all for view)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'ORGANIZATION', '조직관리', 'Organization', '/organization', 'Building2', 1, 40, true, true, 2, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_organization_id;

-- Appointments (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'APPOINTMENTS', '발령관리', 'Appointments', '/appointments', 'UserCog', 1, 50, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_appointments_id;

-- Attendance (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'ATTENDANCE', '근태/휴가', 'Attendance', '/attendance', 'Calendar', 1, 60, true, true, 3, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_attendance_id;

-- Approvals (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'APPROVALS', '전자결재', 'Approvals', '/approvals', 'FileCheck', 1, 70, true, true, 4, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_approvals_id;

-- Certificates (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'CERTIFICATES', '증명서', 'Certificates', '/certificates', 'FileText', 1, 80, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_certificates_id;

-- Recruitment (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'RECRUITMENT', '채용관리', 'Recruitment', '/recruitment', 'Briefcase', 1, 90, true, false, 'RECRUITMENT', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_recruitment_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_recruitment_id, 'PERMISSION', 'recruitment:read'),
    (v_recruitment_id, 'ROLE', 'HR_MANAGER');

-- Transfer (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'TRANSFER', '계열사 인사이동', 'Inter-company Transfer', '/transfer', 'ArrowLeftRight', 1, 100, true, false, 'INTER_COMPANY_TRANSFER', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_transfer_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_transfer_id, 'PERMISSION', 'transfer:read'),
    (v_transfer_id, 'ROLE', 'HR_MANAGER');

-- Headcount (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'HEADCOUNT', '정현원 관리', 'Headcount', '/headcount', 'UsersRound', 1, 110, true, false, 'HEADCOUNT_MANAGEMENT', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_headcount_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_headcount_id, 'PERMISSION', 'headcount:read'),
    (v_headcount_id, 'ROLE', 'HR_MANAGER');

-- Condolence
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'CONDOLENCE', '경조비 관리', 'Condolence', '/condolence', 'Heart', 1, 120, true, false, 'CONDOLENCE_MANAGEMENT', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_condolence_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES (v_condolence_id, 'PERMISSION', 'condolence:read');

-- Committee (HR permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'COMMITTEE', '위원회 관리', 'Committee', '/committee', 'Users2', 1, 130, true, false, 'COMMITTEE_MANAGEMENT', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_committee_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_committee_id, 'PERMISSION', 'committee:read'),
    (v_committee_id, 'ROLE', 'HR_MANAGER');

-- Employee Card
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, feature_code, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'EMPLOYEE_CARD', '사원증 관리', 'Employee Card', '/employee-card', 'CreditCard', 1, 140, true, false, 'EMPLOYEE_CARD', 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_employee_card_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES (v_employee_card_id, 'PERMISSION', 'employee-card:read');

-- Notifications (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, mobile_sort_order, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'NOTIFICATIONS', '알림', 'Notifications', '/notifications', 'Bell', 1, 150, true, true, 5, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_notifications_id;

-- Settings (accessible by all, children have restrictions)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'SETTINGS', '설정', 'Settings', '/settings', 'Settings', 1, 160, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_settings_id;

-- MDM (admin permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'MDM', '기준정보 관리', 'Master Data', '/mdm', 'Database', 1, 170, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_mdm_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_mdm_id, 'PERMISSION', 'mdm:read'),
    (v_mdm_id, 'ROLE', 'TENANT_ADMIN');

-- Audit (admin permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'AUDIT', '감사 로그', 'Audit Log', '/audit', 'Shield', 1, 180, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_audit_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_audit_id, 'PERMISSION', 'audit:read'),
    (v_audit_id, 'ROLE', 'TENANT_ADMIN');

-- Tenants (super admin only)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'TENANTS', '테넌트 관리', 'Tenant Management', '/admin/tenants', 'Building', 1, 190, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_tenants_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_tenants_id, 'PERMISSION', 'tenant:admin'),
    (v_tenants_id, 'ROLE', 'SUPER_ADMIN');

-- Help (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'HELP', '도움말', 'Help', '/help', 'HelpCircle', 1, 200, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_help_id;

-- Announcements (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'ANNOUNCEMENTS', '공지사항', 'Announcements', '/announcements', 'Megaphone', 1, 210, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_announcements_id;

-- Org Chart (accessible by all)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'ORG_CHART', '조직도', 'Org Chart', '/org-chart', 'Building2', 1, 220, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_org_chart_id;

-- File Management (admin permission required)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'FILE_MGMT', '파일 관리', 'File Management', '/files', 'FolderOpen', 1, 230, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_file_mgmt_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_file_mgmt_id, 'PERMISSION', 'file:read'),
    (v_file_mgmt_id, 'ROLE', 'HR_MANAGER');

-- Menu Management (super admin only)
INSERT INTO tenant_common.menu_item (id, code, name, name_en, path, icon, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES (gen_random_uuid(), 'ADMIN_MENUS', '메뉴 관리', 'Menu Management', '/admin/menus', 'Menu', 1, 240, true, false, 'INTERNAL', true, true, v_now, v_now)
RETURNING id INTO v_admin_menus_id;

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
VALUES
    (v_admin_menus_id, 'PERMISSION', 'tenant:admin'),
    (v_admin_menus_id, 'ROLE', 'SUPER_ADMIN');

-- ============================================
-- Level 2: Child Menus
-- ============================================

-- Organization children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_organization_id, 'ORG_DEPARTMENTS', '부서 목록', 'Departments', '/organization/departments', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_organization_id, 'ORG_GRADES', '직급 관리', 'Grades', '/organization/grades', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_organization_id, 'ORG_POSITIONS', '직책 관리', 'Positions', '/organization/positions', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_organization_id, 'ORG_HISTORY', '변경 이력', 'History', '/organization/history', 2, 40, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Add permission for grade/position management
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'organization:write' FROM tenant_common.menu_item WHERE code = 'ORG_GRADES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'organization:write' FROM tenant_common.menu_item WHERE code = 'ORG_POSITIONS';

-- Appointment children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_appointments_id, 'APPOINTMENT_NEW', '발령안 작성', 'New Appointment', '/appointments/new', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'appointment:write' FROM tenant_common.menu_item WHERE code = 'APPOINTMENT_NEW';

-- Attendance children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_attendance_id, 'LEAVE_REQUEST', '휴가 신청', 'Leave Request', '/attendance/leave', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'MY_LEAVE', '내 휴가', 'My Leave', '/attendance/my-leave', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'LEAVE_CALENDAR', '휴가 캘린더', 'Leave Calendar', '/attendance/leave/calendar', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'LEAVE_APPROVAL', '휴가 승인', 'Leave Approval', '/attendance/leave/approval', 2, 40, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'OVERTIME', '초과근무', 'Overtime', '/attendance/overtime', 2, 50, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_attendance_id, 'WORK_HOURS', '52시간 모니터링', 'Work Hours', '/attendance/work-hours', 2, 60, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Add permissions for leave approval and work hours
INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'attendance:approve' FROM tenant_common.menu_item WHERE code = 'LEAVE_APPROVAL';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TEAM_LEADER' FROM tenant_common.menu_item WHERE code = 'LEAVE_APPROVAL';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'attendance:read' FROM tenant_common.menu_item WHERE code = 'WORK_HOURS';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TEAM_LEADER' FROM tenant_common.menu_item WHERE code = 'WORK_HOURS';

-- Approval children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_approvals_id, 'APPROVAL_NEW', '결재 작성', 'New Approval', '/approvals/new', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_approvals_id, 'MY_APPROVALS', '내 결재', 'My Approvals', '/approvals/my', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_approvals_id, 'DELEGATION', '결재 위임', 'Delegation', '/approvals/delegation', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Certificate children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_certificates_id, 'CERT_REQUEST', '증명서 신청', 'Request Certificate', '/certificates/request', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_certificates_id, 'CERT_ISSUED', '발급 이력', 'Issue History', '/certificates/issued', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_certificates_id, 'CERT_VERIFY', '진위확인', 'Verify', '/certificates/verify', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Recruitment children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_recruitment_id, 'JOB_POSTING_NEW', '공고 등록', 'New Posting', '/recruitment/jobs/new', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_recruitment_id, 'APPLICATIONS', '지원서 관리', 'Applications', '/recruitment/applications', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_recruitment_id, 'INTERVIEWS', '면접 일정', 'Interviews', '/recruitment/interviews', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_recruitment_id, 'MY_INTERVIEWS', '내 면접', 'My Interviews', '/recruitment/my-interviews', 2, 40, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'recruitment:write' FROM tenant_common.menu_item WHERE code = 'JOB_POSTING_NEW';

-- Transfer children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_transfer_id, 'TRANSFER_NEW', '인사이동 요청', 'New Transfer', '/transfer/new', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'transfer:write' FROM tenant_common.menu_item WHERE code = 'TRANSFER_NEW';

-- Headcount children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_headcount_id, 'HEADCOUNT_REQUESTS', '변경 요청', 'Requests', '/headcount/requests', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now);

-- Settings children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_settings_id, 'APPROVAL_TEMPLATES', '결재 양식 관리', 'Approval Templates', '/settings/approval-templates', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_settings_id, 'PRIVACY_ACCESS', '개인정보 열람 이력', 'Privacy Access Log', '/settings/privacy-access', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_settings_id, 'DELEGATION_RULES', '위임전결 규칙', 'Delegation Rules', '/settings/delegation-rules', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'approval:admin' FROM tenant_common.menu_item WHERE code = 'APPROVAL_TEMPLATES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN' FROM tenant_common.menu_item WHERE code = 'APPROVAL_TEMPLATES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'employee:read:sensitive' FROM tenant_common.menu_item WHERE code = 'PRIVACY_ACCESS';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN' FROM tenant_common.menu_item WHERE code = 'PRIVACY_ACCESS';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'approval:admin' FROM tenant_common.menu_item WHERE code = 'DELEGATION_RULES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN' FROM tenant_common.menu_item WHERE code = 'DELEGATION_RULES';

-- MDM children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_mdm_id, 'MDM_CODE_GROUPS', '코드그룹 관리', 'Code Groups', '/mdm/code-groups', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_mdm_id, 'MDM_COMMON_CODES', '공통코드 관리', 'Common Codes', '/mdm/common-codes', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_mdm_id, 'MDM_TENANT_CODES', '테넌트 코드 관리', 'Tenant Codes', '/mdm/tenant-codes', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'PERMISSION', 'mdm:write' FROM tenant_common.menu_item WHERE code = 'MDM_TENANT_CODES';

INSERT INTO tenant_common.menu_permission (menu_item_id, permission_type, permission_value)
SELECT id, 'ROLE', 'TENANT_ADMIN' FROM tenant_common.menu_item WHERE code = 'MDM_TENANT_CODES';

-- Help children
INSERT INTO tenant_common.menu_item (id, parent_id, code, name, name_en, path, level, sort_order, show_in_nav, show_in_mobile, menu_type, is_active, is_system, created_at, updated_at)
VALUES
    (gen_random_uuid(), v_help_id, 'HELP_GUIDE', '사용자 가이드', 'User Guide', '/help/guide', 2, 10, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_help_id, 'HELP_FAQ', '자주 묻는 질문', 'FAQ', '/help/faq', 2, 20, true, false, 'INTERNAL', true, true, v_now, v_now),
    (gen_random_uuid(), v_help_id, 'HELP_CONTACT', '문의하기', 'Contact', '/help/contact', 2, 30, true, false, 'INTERNAL', true, true, v_now, v_now);

-- ============================================
-- group_name assignments for sidebar grouping
-- ============================================
UPDATE tenant_common.menu_item SET group_name = '메인' WHERE code IN ('DASHBOARD', 'MY_INFO', 'ANNOUNCEMENTS', 'NOTIFICATIONS', 'ORG_CHART');
UPDATE tenant_common.menu_item SET group_name = '인사관리' WHERE code IN ('EMPLOYEES', 'ORGANIZATION', 'APPOINTMENTS', 'TRANSFER', 'HEADCOUNT', 'RECRUITMENT');
UPDATE tenant_common.menu_item SET group_name = '근무관리' WHERE code IN ('ATTENDANCE');
UPDATE tenant_common.menu_item SET group_name = '전자결재' WHERE code IN ('APPROVALS');
UPDATE tenant_common.menu_item SET group_name = '복리후생' WHERE code IN ('CERTIFICATES', 'CONDOLENCE', 'EMPLOYEE_CARD', 'COMMITTEE');
UPDATE tenant_common.menu_item SET group_name = '시스템 관리' WHERE code IN ('SETTINGS', 'MDM', 'FILE_MGMT');
UPDATE tenant_common.menu_item SET group_name = '운영관리' WHERE code IN ('ADMIN_MENUS', 'TENANTS', 'AUDIT');
UPDATE tenant_common.menu_item SET group_name = '지원' WHERE code IN ('HELP');

END $$;

-- =============================================================================
-- 6. DEFAULTS (V12 compatibility)
-- =============================================================================

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

-- tenant_menu_config defaults
ALTER TABLE tenant_common.tenant_menu_config ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tenant_common.tenant_menu_config ALTER COLUMN is_enabled SET DEFAULT true;
ALTER TABLE tenant_common.tenant_menu_config ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tenant_common.tenant_menu_config ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- =============================================================================
-- 7. SEED DATA: code_usage_mapping (from V2)
-- =============================================================================

INSERT INTO tenant_common.code_usage_mapping (group_code, resource_type, resource_name, description, estimated_impact)
VALUES
    ('LEAVE_TYPE', 'TABLE', 'leave_request', '휴가 신청 테이블', 'HIGH'),
    ('LEAVE_TYPE', 'TABLE', 'leave_balance', '휴가 잔여 테이블', 'HIGH'),
    ('LEAVE_TYPE', 'SERVICE', 'attendance-service', '근태 관리 서비스', 'HIGH'),
    ('GRADE', 'TABLE', 'employee', '직원 테이블', 'HIGH'),
    ('GRADE', 'TABLE', 'employee_history', '인사이력 테이블', 'MEDIUM'),
    ('GRADE', 'SERVICE', 'employee-service', '직원 관리 서비스', 'HIGH'),
    ('POSITION', 'TABLE', 'employee', '직원 테이블', 'HIGH'),
    ('POSITION', 'TABLE', 'approval_line', '결재선 테이블', 'MEDIUM'),
    ('POSITION', 'SERVICE', 'approval-service', '결재 서비스', 'HIGH'),
    ('DEPT_TYPE', 'TABLE', 'department', '부서 테이블', 'HIGH'),
    ('DEPT_TYPE', 'SERVICE', 'organization-service', '조직 관리 서비스', 'HIGH')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 8. SEED DATA: HR Code Groups and Common Codes (from V3)
-- =============================================================================

-- 8.1 GRADE (직급) - 10 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'GRADE', '직급', 'Grade', '직급 코드', true, false, 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'GRADE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'G1', '사원', 'Staff', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G2', '주임', 'Senior Staff', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G3', '대리', 'Assistant Manager', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G4', '과장', 'Manager', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G5', '차장', 'Deputy General Manager', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G6', '부장', 'General Manager', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G7', '이사', 'Director', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G8', '상무', 'Senior Director', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G9', '전무', 'Executive Vice President', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'G10', '부사장', 'Vice President', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.2 POSITION (직책) - 10 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'POSITION', '직책', 'Position', '직책 코드', true, false, 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'POSITION' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'P1', '팀원', 'Team Member', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P2', '파트장', 'Part Leader', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P3', '팀장', 'Team Leader', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P4', '실장', 'Office Director', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P5', '부서장', 'Department Head', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P6', '본부장', 'Division Head', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P7', '센터장', 'Center Head', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P8', '부문장', 'Sector Head', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P9', '대표이사', 'CEO', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'P10', '회장', 'Chairman', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.3 DEPT_TYPE (부서유형) - 6 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'DEPT_TYPE', '부서유형', 'Department Type', '부서 유형 코드', true, false, 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'DEPT_TYPE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'DEPT', '부서', 'Department', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TEAM', '팀', 'Team', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DIV', '본부', 'Division', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CENTER', '센터', 'Center', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BIZ', '사업부', 'Business Unit', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BRANCH', '지점', 'Branch', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.4 LEAVE_TYPE (휴가유형) - hierarchical, 2 levels
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'LEAVE_TYPE', '휴가유형', 'Leave Type', '휴가 유형 코드', true, true, 2, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'LEAVE_TYPE' AND tenant_id IS NULL;
    END IF;

    -- Level 1: Parent leave types
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'L01', '연차', 'Annual Leave', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L02', '병가', 'Sick Leave', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L03', '경조', 'Family Event Leave', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L04', '출산', 'Maternity Leave', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L05', '육아', 'Parental Leave', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L06', '가족돌봄', 'Family Care Leave', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L07', '공가', 'Official Leave', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L08', '특별', 'Special Leave', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L09', '보상', 'Compensatory Leave', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L10', '포상', 'Reward Leave', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'L11', '리프레시', 'Refresh Leave', 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of L01 (연차)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'L01' AND tenant_id IS NULL),
         'L0101', '연차(전일)', 'Annual Leave (Full)', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'L01' AND tenant_id IS NULL),
         'L0102', '반차(오전)', 'Half Day (AM)', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'L01' AND tenant_id IS NULL),
         'L0103', '반차(오후)', 'Half Day (PM)', 2, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'L01' AND tenant_id IS NULL),
         'L0104', '시간차', 'Hourly Leave', 2, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.5 EMPLOYMENT_TYPE (고용형태) - 5 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'EMPLOYMENT_TYPE', '고용형태', 'Employment Type', '고용 형태 코드', true, false, 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'EMPLOYMENT_TYPE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'FT', '정규직', 'Full-time', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CT', '계약직', 'Contract', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PT', '파견직', 'Dispatched', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IS', '인턴', 'Intern', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AD', '자문/고문', 'Advisor', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.6 CONTRACT_TYPE (계약유형) - 4 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'CONTRACT_TYPE', '계약유형', 'Contract Type', '계약 유형 코드', true, false, 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'CONTRACT_TYPE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'INDEF', '무기계약', 'Indefinite', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'FIXED', '기간제', 'Fixed-term', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PART', '시간제', 'Part-time', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'FREELANCE', '프리랜서', 'Freelance', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.7 GENDER (성별) - 3 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'GENDER', '성별', 'Gender', '성별 코드', true, false, 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'GENDER' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'M', '남성', 'Male', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'F', '여성', 'Female', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'O', '기타', 'Other', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.8 MARITAL_STATUS (혼인상태) - 3 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'MARITAL_STATUS', '혼인상태', 'Marital Status', '혼인 상태 코드', true, false, 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'MARITAL_STATUS' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'S', '미혼', 'Single', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'M', '기혼', 'Married', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'D', '기타', 'Other', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.9 EDUCATION_LEVEL (학력) - 7 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'EDUCATION_LEVEL', '학력', 'Education Level', '학력 코드', true, false, 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'EDUCATION_LEVEL' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'MS', '중학교', 'Middle School', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'HS', '고등학교', 'High School', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CC', '전문대', 'Community College', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BS', '학사', 'Bachelor', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MS_D', '석사', 'Master', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PHD', '박사', 'Doctorate', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'OTHER', '기타', 'Other', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.10 BANK_CODE (은행코드) - 20 codes with extraValue1 as bank code number
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'BANK_CODE', '은행코드', 'Bank Code', '은행 코드', true, false, 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'BANK_CODE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, extra_value1, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'KB', 'KB국민', 'KB Kookmin', '004', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SHINHAN', '신한', 'Shinhan', '088', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'WOORI', '우리', 'Woori', '020', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'HANA', '하나', 'Hana', '081', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IBK', 'IBK기업', 'IBK Industrial', '003', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NH', 'NH농협', 'NH Nonghyup', '011', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SC', 'SC제일', 'SC First', '023', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CITI', '한국씨티', 'Citibank Korea', '027', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DAEGU', '대구', 'Daegu', '032', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'GWANGJU', '광주', 'Gwangju', '034', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'JEJU', '제주', 'Jeju', '035', 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'JEONBUK', '전북', 'Jeonbuk', '037', 1, 'ACTIVE', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'GYEONGNAM', '경남', 'Gyeongnam', '039', 1, 'ACTIVE', true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SAEMAUL', '새마을금고', 'Saemaul Geumgo', '045', 1, 'ACTIVE', true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SHINHYUP', '신협', 'Shinhyup', '048', 1, 'ACTIVE', true, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'POST', '우체국', 'Korea Post', '071', 1, 'ACTIVE', true, 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'KBANK', 'K뱅크', 'K Bank', '089', 1, 'ACTIVE', true, 17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'KAKAO', '카카오뱅크', 'Kakao Bank', '090', 1, 'ACTIVE', true, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TOSS', '토스뱅크', 'Toss Bank', '092', 1, 'ACTIVE', true, 19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'KDB', '산업', 'KDB Industrial', '002', 1, 'ACTIVE', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.11 APPROVAL_TYPE (결재유형) - 10 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'APPROVAL_TYPE', '결재유형', 'Approval Type', '결재 유형 코드', true, false, 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'APPROVAL_TYPE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'LEAVE', '휴가', 'Leave', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'OT', '초과근무', 'Overtime', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BT', '출장', 'Business Trip', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'EXP', '경비', 'Expense', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PURCHASE', '구매', 'Purchase', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DOC', '문서', 'Document', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'APPT', '발령', 'Appointment', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CONTRACT', '계약', 'Contract', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CERT', '증명서', 'Certificate', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'OTHER', '기타', 'Other', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.12 DOCUMENT_TYPE (문서유형) - hierarchical, 2 levels
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'DOCUMENT_TYPE', '문서유형', 'Document Type', '문서 유형 코드', true, true, 2, 'ACTIVE', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'DOCUMENT_TYPE' AND tenant_id IS NULL;
    END IF;

    -- Level 1: Parent document types
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'HR', '인사문서', 'HR Documents', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'FIN', '재무문서', 'Finance Documents', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ADMIN', '총무문서', 'Admin Documents', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'LEGAL', '법무문서', 'Legal Documents', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CERT', '증명문서', 'Certificate Documents', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of HR (인사문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'HR' AND tenant_id IS NULL),
         'HR01', '발령문서', 'Appointment Document', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'HR' AND tenant_id IS NULL),
         'HR02', '근로계약서', 'Employment Contract', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'HR' AND tenant_id IS NULL),
         'HR03', '인사평가', 'Performance Review', 2, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of FIN (재무문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'FIN' AND tenant_id IS NULL),
         'FIN01', '지출결의서', 'Expense Report', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'FIN' AND tenant_id IS NULL),
         'FIN02', '세금계산서', 'Tax Invoice', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'FIN' AND tenant_id IS NULL),
         'FIN03', '영수증', 'Receipt', 2, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of ADMIN (총무문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'ADMIN' AND tenant_id IS NULL),
         'ADMIN01', '시설요청', 'Facility Request', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'ADMIN' AND tenant_id IS NULL),
         'ADMIN02', '비품요청', 'Supply Request', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of LEGAL (법무문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'LEGAL' AND tenant_id IS NULL),
         'LEGAL01', '계약서', 'Contract', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'LEGAL' AND tenant_id IS NULL),
         'LEGAL02', '위임장', 'Power of Attorney', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Level 2: Children of CERT (증명문서)
    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, parent_code_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'CERT' AND tenant_id IS NULL),
         'CERT01', '재직증명서', 'Employment Certificate', 2, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'CERT' AND tenant_id IS NULL),
         'CERT02', '경력증명서', 'Career Certificate', 2, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'CERT' AND tenant_id IS NULL),
         'CERT03', '급여명세서', 'Payslip', 2, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL,
         (SELECT id FROM tenant_common.common_code WHERE code_group_id = v_group_id AND code = 'CERT' AND tenant_id IS NULL),
         'CERT04', '원천징수영수증', 'Withholding Tax Receipt', 2, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.13 COUNTRY_CODE (국가코드) - 30 codes
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'COUNTRY_CODE', '국가코드', 'Country Code', '국가 코드', true, false, 1, 'ACTIVE', true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'COUNTRY_CODE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'KR', '대한민국', 'South Korea', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'US', '미국', 'United States', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'JP', '일본', 'Japan', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CN', '중국', 'China', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'GB', '영국', 'United Kingdom', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DE', '독일', 'Germany', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'FR', '프랑스', 'France', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CA', '캐나다', 'Canada', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AU', '호주', 'Australia', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SG', '싱가포르', 'Singapore', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'HK', '홍콩', 'Hong Kong', 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TW', '대만', 'Taiwan', 1, 'ACTIVE', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'VN', '베트남', 'Vietnam', 1, 'ACTIVE', true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TH', '태국', 'Thailand', 1, 'ACTIVE', true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PH', '필리핀', 'Philippines', 1, 'ACTIVE', true, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MY', '말레이시아', 'Malaysia', 1, 'ACTIVE', true, 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ID', '인도네시아', 'Indonesia', 1, 'ACTIVE', true, 17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IN', '인도', 'India', 1, 'ACTIVE', true, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BR', '브라질', 'Brazil', 1, 'ACTIVE', true, 19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MX', '멕시코', 'Mexico', 1, 'ACTIVE', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NZ', '뉴질랜드', 'New Zealand', 1, 'ACTIVE', true, 21, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IT', '이탈리아', 'Italy', 1, 'ACTIVE', true, 22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ES', '스페인', 'Spain', 1, 'ACTIVE', true, 23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NL', '네덜란드', 'Netherlands', 1, 'ACTIVE', true, 24, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SE', '스웨덴', 'Sweden', 1, 'ACTIVE', true, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CH', '스위스', 'Switzerland', 1, 'ACTIVE', true, 26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AE', '아랍에미리트', 'United Arab Emirates', 1, 'ACTIVE', true, 27, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SA', '사우디아라비아', 'Saudi Arabia', 1, 'ACTIVE', true, 28, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'RU', '러시아', 'Russia', 1, 'ACTIVE', true, 29, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ZA', '남아프리카', 'South Africa', 1, 'ACTIVE', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;

-- 8.14 CURRENCY_CODE (통화코드) - 30 codes with extraValue1 as currency symbol
DO $$
DECLARE
    v_group_id UUID;
BEGIN
    INSERT INTO tenant_common.code_group (id, tenant_id, group_code, group_name, group_name_en, description, is_system, is_hierarchical, max_level, status, is_active, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), NULL, 'CURRENCY_CODE', '통화코드', 'Currency Code', '통화 코드', true, false, 1, 'ACTIVE', true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_group_id;

    IF v_group_id IS NULL THEN
        SELECT id INTO v_group_id FROM tenant_common.code_group WHERE group_code = 'CURRENCY_CODE' AND tenant_id IS NULL;
    END IF;

    INSERT INTO tenant_common.common_code (id, code_group_id, tenant_id, code, code_name, code_name_en, extra_value1, level, status, is_active, sort_order, created_at, updated_at)
    VALUES
        (gen_random_uuid(), v_group_id, NULL, 'KRW', '원', 'Korean Won', '₩', 1, 'ACTIVE', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'USD', '달러', 'US Dollar', '$', 1, 'ACTIVE', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'JPY', '엔', 'Japanese Yen', '¥', 1, 'ACTIVE', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CNY', '위안', 'Chinese Yuan', '¥', 1, 'ACTIVE', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'EUR', '유로', 'Euro', '€', 1, 'ACTIVE', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'GBP', '파운드', 'British Pound', '£', 1, 'ACTIVE', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CAD', '캐나다달러', 'Canadian Dollar', 'C$', 1, 'ACTIVE', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AUD', '호주달러', 'Australian Dollar', 'A$', 1, 'ACTIVE', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SGD', '싱가포르달러', 'Singapore Dollar', 'S$', 1, 'ACTIVE', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'HKD', '홍콩달러', 'Hong Kong Dollar', 'HK$', 1, 'ACTIVE', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'TWD', '대만달러', 'Taiwan Dollar', 'NT$', 1, 'ACTIVE', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'VND', '베트남동', 'Vietnamese Dong', '₫', 1, 'ACTIVE', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'THB', '바트', 'Thai Baht', '฿', 1, 'ACTIVE', true, 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PHP', '필리핀페소', 'Philippine Peso', '₱', 1, 'ACTIVE', true, 14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MYR', '링깃', 'Malaysian Ringgit', 'RM', 1, 'ACTIVE', true, 15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'IDR', '루피아', 'Indonesian Rupiah', 'Rp', 1, 'ACTIVE', true, 16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'INR', '루피', 'Indian Rupee', '₹', 1, 'ACTIVE', true, 17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'BRL', '헤알', 'Brazilian Real', 'R$', 1, 'ACTIVE', true, 18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'MXN', '멕시코페소', 'Mexican Peso', '$', 1, 'ACTIVE', true, 19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NZD', '뉴질랜드달러', 'New Zealand Dollar', 'NZ$', 1, 'ACTIVE', true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CHF', '스위스프랑', 'Swiss Franc', 'CHF', 1, 'ACTIVE', true, 21, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SEK', '스웨덴크로나', 'Swedish Krona', 'kr', 1, 'ACTIVE', true, 22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'AED', '디르함', 'UAE Dirham', 'AED', 1, 'ACTIVE', true, 23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'SAR', '리얄', 'Saudi Riyal', 'SAR', 1, 'ACTIVE', true, 24, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'RUB', '루블', 'Russian Ruble', '₽', 1, 'ACTIVE', true, 25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'ZAR', '랜드', 'South African Rand', 'R', 1, 'ACTIVE', true, 26, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'NOK', '노르웨이크로네', 'Norwegian Krone', 'kr', 1, 'ACTIVE', true, 27, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'DKK', '덴마크크로네', 'Danish Krone', 'kr', 1, 'ACTIVE', true, 28, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'PLN', '즈워티', 'Polish Zloty', 'zł', 1, 'ACTIVE', true, 29, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), v_group_id, NULL, 'CZK', '코루나', 'Czech Koruna', 'Kč', 1, 'ACTIVE', true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
END $$;
