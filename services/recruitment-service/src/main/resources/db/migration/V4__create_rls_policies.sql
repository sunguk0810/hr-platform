CREATE OR REPLACE FUNCTION get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Job Posting RLS Policy
DROP POLICY IF EXISTS job_posting_tenant_isolation ON hr_recruitment.job_posting;
CREATE POLICY job_posting_tenant_isolation ON hr_recruitment.job_posting
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Applicant RLS Policy
DROP POLICY IF EXISTS applicant_tenant_isolation ON hr_recruitment.applicant;
CREATE POLICY applicant_tenant_isolation ON hr_recruitment.applicant
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Application RLS Policy
DROP POLICY IF EXISTS application_tenant_isolation ON hr_recruitment.application;
CREATE POLICY application_tenant_isolation ON hr_recruitment.application
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Interview RLS Policy
DROP POLICY IF EXISTS interview_tenant_isolation ON hr_recruitment.interview;
CREATE POLICY interview_tenant_isolation ON hr_recruitment.interview
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Interview Score RLS Policy
DROP POLICY IF EXISTS interview_score_tenant_isolation ON hr_recruitment.interview_score;
CREATE POLICY interview_score_tenant_isolation ON hr_recruitment.interview_score
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());

-- Offer RLS Policy
DROP POLICY IF EXISTS offer_tenant_isolation ON hr_recruitment.offer;
CREATE POLICY offer_tenant_isolation ON hr_recruitment.offer
    FOR ALL
    USING (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe())
    WITH CHECK (get_current_tenant_safe() IS NULL OR tenant_id = get_current_tenant_safe());
