-- 관리자 근태 수정 감사 로그 테이블
CREATE TABLE hr_attendance.attendance_modification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    attendance_record_id UUID NOT NULL REFERENCES hr_attendance.attendance_record(id),
    modified_by UUID NOT NULL,
    modified_by_name VARCHAR(100),
    field_name VARCHAR(50) NOT NULL,
    old_value VARCHAR(200),
    new_value VARCHAR(200),
    remarks VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE hr_attendance.attendance_modification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendance_modification_log_tenant_isolation
    ON hr_attendance.attendance_modification_log
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Indexes
CREATE INDEX idx_modification_log_tenant_id ON hr_attendance.attendance_modification_log(tenant_id);
CREATE INDEX idx_modification_log_record_id ON hr_attendance.attendance_modification_log(attendance_record_id);
CREATE INDEX idx_modification_log_modified_by ON hr_attendance.attendance_modification_log(modified_by);
CREATE INDEX idx_modification_log_created_at ON hr_attendance.attendance_modification_log(created_at);
