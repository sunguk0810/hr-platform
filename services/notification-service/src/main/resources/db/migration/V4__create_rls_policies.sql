-- Create safe tenant getter function (if not exists)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
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
