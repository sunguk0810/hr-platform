-- Enable Row Level Security on tenant-aware tables

-- approval_document (has tenant_id)
ALTER TABLE hr_approval.approval_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.approval_document FORCE ROW LEVEL SECURITY;

-- approval_template (has tenant_id)
ALTER TABLE hr_approval.approval_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.approval_template FORCE ROW LEVEL SECURITY;

-- delegation_rule (has tenant_id)
ALTER TABLE hr_approval.delegation_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_approval.delegation_rule FORCE ROW LEVEL SECURITY;

-- Note: approval_line, approval_history, approval_template_line do not have tenant_id
-- They are child tables that inherit tenant isolation through their parent (document/template)
