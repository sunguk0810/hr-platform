-- Enable Row Level Security on notification tables

ALTER TABLE hr_notification.notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_notification.notification_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification_template FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_notification.notification_preference ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification_preference FORCE ROW LEVEL SECURITY;
