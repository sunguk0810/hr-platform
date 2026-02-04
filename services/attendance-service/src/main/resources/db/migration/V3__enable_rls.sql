-- Enable Row Level Security on attendance tables
ALTER TABLE hr_attendance.attendance_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.holiday ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.overtime_request ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners
ALTER TABLE hr_attendance.attendance_record FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_request FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_balance FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.holiday FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.overtime_request FORCE ROW LEVEL SECURITY;
