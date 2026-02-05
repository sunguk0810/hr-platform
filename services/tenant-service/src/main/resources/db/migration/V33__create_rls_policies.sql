-- V4: Create Row Level Security policies for tenant isolation

-- Helper function to safely get current tenant
CREATE OR REPLACE FUNCTION tenant_common.get_current_tenant_safe()
RETURNS UUID AS $$
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
