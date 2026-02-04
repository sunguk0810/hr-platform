-- V3: Enable Row Level Security on all employee tables

-- Enable RLS on employee table
ALTER TABLE hr_core.employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_history table
ALTER TABLE hr_core.employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_history FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_family table
ALTER TABLE hr_core.employee_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_family FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_education table
ALTER TABLE hr_core.employee_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_education FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_career table
ALTER TABLE hr_core.employee_career ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_career FORCE ROW LEVEL SECURITY;

-- Enable RLS on employee_certificate table
ALTER TABLE hr_core.employee_certificate ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.employee_certificate FORCE ROW LEVEL SECURITY;
