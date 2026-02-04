-- Create safe tenant getter function (if not exists)
CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy for attendance_record
DROP POLICY IF EXISTS attendance_record_tenant_isolation ON hr_attendance.attendance_record;
CREATE POLICY attendance_record_tenant_isolation ON hr_attendance.attendance_record
    FOR ALL
    USING (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for leave_request
DROP POLICY IF EXISTS leave_request_tenant_isolation ON hr_attendance.leave_request;
CREATE POLICY leave_request_tenant_isolation ON hr_attendance.leave_request
    FOR ALL
    USING (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for leave_balance
DROP POLICY IF EXISTS leave_balance_tenant_isolation ON hr_attendance.leave_balance;
CREATE POLICY leave_balance_tenant_isolation ON hr_attendance.leave_balance
    FOR ALL
    USING (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for holiday
DROP POLICY IF EXISTS holiday_tenant_isolation ON hr_attendance.holiday;
CREATE POLICY holiday_tenant_isolation ON hr_attendance.holiday
    FOR ALL
    USING (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );

-- RLS Policy for overtime_request
DROP POLICY IF EXISTS overtime_request_tenant_isolation ON hr_attendance.overtime_request;
CREATE POLICY overtime_request_tenant_isolation ON hr_attendance.overtime_request
    FOR ALL
    USING (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    )
    WITH CHECK (
        get_current_tenant_safe() IS NULL
        OR tenant_id = get_current_tenant_safe()
    );
