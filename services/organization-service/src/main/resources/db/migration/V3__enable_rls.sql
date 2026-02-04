-- Enable Row Level Security on organization tables
ALTER TABLE hr_core.department ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.grade ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.position ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well
ALTER TABLE hr_core.department FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_core.grade FORCE ROW LEVEL SECURITY;
ALTER TABLE hr_core.position FORCE ROW LEVEL SECURITY;
