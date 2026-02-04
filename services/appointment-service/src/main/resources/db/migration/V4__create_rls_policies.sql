CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
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
