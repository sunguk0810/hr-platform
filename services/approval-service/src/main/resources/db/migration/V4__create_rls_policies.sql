-- Create safe tenant getter function (if not exists)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
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
