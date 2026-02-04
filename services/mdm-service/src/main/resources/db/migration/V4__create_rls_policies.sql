-- Create safe tenant getter function (if not exists)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy for code_group
-- System codes (tenant_id IS NULL) are visible to all, tenant codes are restricted
DROP POLICY IF EXISTS code_group_tenant_isolation ON tenant_common.code_group;
CREATE POLICY code_group_tenant_isolation ON tenant_common.code_group
    FOR ALL
    USING (
        get_current_tenant_safe() IS NULL  -- Super admin sees all
        OR tenant_id IS NULL               -- System codes visible to all
        OR tenant_id = get_current_tenant_safe()  -- Tenant sees own codes
    )
    WITH CHECK (
        get_current_tenant_safe() IS NULL  -- Super admin can create any
        OR tenant_id IS NULL               -- System codes (admin only in practice)
        OR tenant_id = get_current_tenant_safe()  -- Tenant can create own
    );

-- RLS Policy for common_code
-- System codes (tenant_id IS NULL) are visible to all, tenant codes are restricted
DROP POLICY IF EXISTS common_code_tenant_isolation ON tenant_common.common_code;
CREATE POLICY common_code_tenant_isolation ON tenant_common.common_code
    FOR ALL
    USING (
        get_current_tenant_safe() IS NULL  -- Super admin sees all
        OR tenant_id IS NULL               -- System codes visible to all
        OR tenant_id = get_current_tenant_safe()  -- Tenant sees own codes
    )
    WITH CHECK (
        get_current_tenant_safe() IS NULL  -- Super admin can create any
        OR tenant_id IS NULL               -- System codes (admin only in practice)
        OR tenant_id = get_current_tenant_safe()  -- Tenant can create own
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
        get_current_tenant_safe() IS NULL  -- Super admin sees all
        OR tenant_id IS NULL               -- System code history visible to all
        OR tenant_id = get_current_tenant_safe()  -- Tenant sees own history
    )
    WITH CHECK (
        get_current_tenant_safe() IS NULL
        OR tenant_id IS NULL
        OR tenant_id = get_current_tenant_safe()
    );
