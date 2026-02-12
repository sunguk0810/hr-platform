CREATE TABLE hr_attendance.attendance_config (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    standard_start_time TIME WITHOUT TIME ZONE NOT NULL DEFAULT '09:00:00',
    standard_end_time TIME WITHOUT TIME ZONE NOT NULL DEFAULT '18:00:00',
    created_at TIMESTAMP WITHOUT TIME ZONE,
    updated_at TIMESTAMP WITHOUT TIME ZONE,
    created_by UUID,
    updated_by UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_attendance_config PRIMARY KEY (id),
    CONSTRAINT uk_attendance_config_tenant_id UNIQUE (tenant_id)
);
