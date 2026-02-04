-- Notification table
CREATE TABLE IF NOT EXISTS hr_notification.notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    recipient_email VARCHAR(255),
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    link_url VARCHAR(1000),
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_sent BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    send_error VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes for notification
CREATE INDEX IF NOT EXISTS idx_notification_tenant_id ON hr_notification.notification(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipient_id ON hr_notification.notification(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON hr_notification.notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON hr_notification.notification(created_at);

-- Notification Template table
CREATE TABLE IF NOT EXISTS hr_notification.notification_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(100) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    subject VARCHAR(500),
    body_template TEXT NOT NULL,
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    variables TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, code)
);

-- Indexes for notification_template
CREATE INDEX IF NOT EXISTS idx_notification_template_tenant_id ON hr_notification.notification_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_template_code ON hr_notification.notification_template(code);

-- Notification Preference table
CREATE TABLE IF NOT EXISTS hr_notification.notification_preference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, user_id, notification_type, channel)
);

-- Indexes for notification_preference
CREATE INDEX IF NOT EXISTS idx_notification_preference_tenant_id ON hr_notification.notification_preference(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_preference_user_id ON hr_notification.notification_preference(user_id);
