CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
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

DROP POLICY IF EXISTS verification_log_tenant_isolation ON hr_certificate.verification_log;
CREATE POLICY verification_log_tenant_isolation ON hr_certificate.verification_log
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());
