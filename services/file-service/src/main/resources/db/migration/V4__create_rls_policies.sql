CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

DROP POLICY IF EXISTS file_metadata_tenant_isolation ON hr_file.file_metadata;
CREATE POLICY file_metadata_tenant_isolation ON hr_file.file_metadata
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());
