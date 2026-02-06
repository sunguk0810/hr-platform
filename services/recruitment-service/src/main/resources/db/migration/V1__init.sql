-- =============================================================================
-- Recruitment Service - V1 Initial Migration
-- Schema: hr_recruitment
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper function for RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hr_recruitment.get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- job_postings
CREATE TABLE hr_recruitment.job_postings (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID            NOT NULL,
    job_code              VARCHAR(30)     NOT NULL,
    title                 VARCHAR(200)    NOT NULL,
    department_id         UUID,
    department_name       VARCHAR(100),
    position_id           UUID,
    position_name         VARCHAR(100),
    job_description       TEXT,
    requirements          TEXT,
    preferred_qualifications TEXT,
    employment_type       VARCHAR(20)     DEFAULT 'FULL_TIME',
    experience_min        INTEGER,
    experience_max        INTEGER,
    salary_min            DECIMAL(15,2),
    salary_max            DECIMAL(15,2),
    salary_negotiable     BOOLEAN         DEFAULT TRUE,
    work_location         VARCHAR(200),
    headcount             INTEGER         DEFAULT 1,
    skills                JSONB,
    benefits              JSONB,
    status                VARCHAR(20)     DEFAULT 'DRAFT',
    open_date             DATE,
    close_date            DATE,
    recruiter_id          UUID,
    recruiter_name        VARCHAR(100),
    hiring_manager_id     UUID,
    hiring_manager_name   VARCHAR(100),
    application_count     INTEGER         DEFAULT 0,
    view_count            INTEGER         DEFAULT 0,
    is_featured           BOOLEAN         DEFAULT FALSE,
    is_urgent             BOOLEAN         DEFAULT FALSE,
    interview_process     JSONB,
    created_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100)
);

-- applicants
CREATE TABLE hr_recruitment.applicants (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID            NOT NULL,
    name              VARCHAR(100)    NOT NULL,
    email             VARCHAR(200)    NOT NULL,
    phone             VARCHAR(20),
    birth_date        DATE,
    gender            VARCHAR(10),
    address           VARCHAR(500),
    resume_file_id    UUID,
    portfolio_url     VARCHAR(500),
    linkedin_url      VARCHAR(500),
    github_url        VARCHAR(500),
    education         JSONB,
    experience        JSONB,
    skills            JSONB,
    certificates      JSONB,
    languages         JSONB,
    source            VARCHAR(50),
    source_detail     VARCHAR(200),
    notes             TEXT,
    is_blacklisted    BOOLEAN         DEFAULT FALSE,
    blacklist_reason  TEXT,
    created_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100)
);

-- applications
CREATE TABLE hr_recruitment.applications (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID            NOT NULL,
    job_posting_id        UUID            NOT NULL REFERENCES hr_recruitment.job_postings (id),
    applicant_id          UUID            NOT NULL REFERENCES hr_recruitment.applicants (id),
    application_number    VARCHAR(50)     NOT NULL,
    status                VARCHAR(30)     DEFAULT 'SUBMITTED',
    cover_letter          TEXT,
    answers               JSONB,
    expected_salary       BIGINT,
    available_date        VARCHAR(100),
    referrer_name         VARCHAR(100),
    referrer_employee_id  UUID,
    screening_score       INTEGER,
    screening_notes       TEXT,
    screened_by           UUID,
    screened_at           TIMESTAMPTZ,
    current_stage         VARCHAR(50)     DEFAULT 'DOCUMENT',
    stage_order           INTEGER         DEFAULT 0,
    rejection_reason      TEXT,
    rejected_at           TIMESTAMPTZ,
    withdrawn_at          TIMESTAMPTZ,
    hired_at              TIMESTAMPTZ,
    created_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100)
);

-- interviews
CREATE TABLE hr_recruitment.interviews (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID            NOT NULL,
    application_id    UUID            NOT NULL REFERENCES hr_recruitment.applications (id),
    interview_type    VARCHAR(30)     NOT NULL,
    round             INTEGER         DEFAULT 1,
    status            VARCHAR(20)     DEFAULT 'SCHEDULING',
    scheduled_date    DATE,
    scheduled_time    TIME,
    duration_minutes  INTEGER         DEFAULT 60,
    location          VARCHAR(200),
    meeting_url       VARCHAR(500),
    interviewers      JSONB,
    notes             TEXT,
    result            VARCHAR(20),
    result_notes      TEXT,
    overall_score     INTEGER,
    started_at        TIMESTAMPTZ,
    ended_at          TIMESTAMPTZ,
    feedback_deadline DATE,
    created_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100)
);

-- interview_scores
CREATE TABLE hr_recruitment.interview_scores (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID            NOT NULL,
    interview_id      UUID            NOT NULL REFERENCES hr_recruitment.interviews (id),
    interviewer_id    UUID            NOT NULL,
    interviewer_name  VARCHAR(100),
    criterion         VARCHAR(100)    NOT NULL,
    score             INTEGER         NOT NULL,
    max_score         INTEGER         DEFAULT 5,
    weight            DOUBLE PRECISION DEFAULT 1.0,
    comment           TEXT,
    evaluated_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100)
);

-- offers
CREATE TABLE hr_recruitment.offers (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID            NOT NULL,
    application_id        UUID            NOT NULL UNIQUE REFERENCES hr_recruitment.applications (id),
    offer_number          VARCHAR(50)     NOT NULL,
    status                VARCHAR(20)     DEFAULT 'DRAFT',
    position_title        VARCHAR(100)    NOT NULL,
    department_id         UUID,
    department_name       VARCHAR(100),
    grade_code            VARCHAR(30),
    grade_name            VARCHAR(50),
    base_salary           DECIMAL(15,2)   NOT NULL,
    signing_bonus         DECIMAL(15,2),
    benefits              JSONB,
    start_date            DATE            NOT NULL,
    employment_type       VARCHAR(20)     DEFAULT 'FULL_TIME',
    probation_months      INTEGER         DEFAULT 3,
    work_location         VARCHAR(200),
    report_to_id          UUID,
    report_to_name        VARCHAR(100),
    offer_letter_file_id  UUID,
    special_terms         TEXT,
    expires_at            TIMESTAMPTZ,
    sent_at               TIMESTAMPTZ,
    responded_at          TIMESTAMPTZ,
    decline_reason        TEXT,
    approved_by           UUID,
    approved_at           TIMESTAMPTZ,
    negotiation_notes     TEXT,
    created_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100)
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

-- job_postings
CREATE INDEX idx_job_postings_tenant_id         ON hr_recruitment.job_postings (tenant_id);
CREATE INDEX idx_job_postings_status             ON hr_recruitment.job_postings (tenant_id, status);
CREATE INDEX idx_job_postings_department_id      ON hr_recruitment.job_postings (tenant_id, department_id);
CREATE INDEX idx_job_postings_recruiter_id       ON hr_recruitment.job_postings (tenant_id, recruiter_id);
CREATE INDEX idx_job_postings_hiring_manager_id  ON hr_recruitment.job_postings (tenant_id, hiring_manager_id);
CREATE INDEX idx_job_postings_open_close_date    ON hr_recruitment.job_postings (tenant_id, open_date, close_date);
CREATE INDEX idx_job_postings_employment_type    ON hr_recruitment.job_postings (tenant_id, employment_type);
CREATE INDEX idx_job_postings_is_featured        ON hr_recruitment.job_postings (tenant_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_job_postings_is_urgent          ON hr_recruitment.job_postings (tenant_id, is_urgent) WHERE is_urgent = TRUE;
CREATE INDEX idx_job_postings_created_at         ON hr_recruitment.job_postings (tenant_id, created_at DESC);

-- applicants
CREATE INDEX idx_applicants_tenant_id            ON hr_recruitment.applicants (tenant_id);
CREATE INDEX idx_applicants_email                ON hr_recruitment.applicants (tenant_id, email);
CREATE INDEX idx_applicants_name                 ON hr_recruitment.applicants (tenant_id, name);
CREATE INDEX idx_applicants_source               ON hr_recruitment.applicants (tenant_id, source);
CREATE INDEX idx_applicants_is_blacklisted       ON hr_recruitment.applicants (tenant_id, is_blacklisted) WHERE is_blacklisted = TRUE;

-- applications
CREATE INDEX idx_applications_tenant_id          ON hr_recruitment.applications (tenant_id);
CREATE INDEX idx_applications_job_posting_id     ON hr_recruitment.applications (tenant_id, job_posting_id);
CREATE INDEX idx_applications_applicant_id       ON hr_recruitment.applications (tenant_id, applicant_id);
CREATE INDEX idx_applications_status             ON hr_recruitment.applications (tenant_id, status);
CREATE INDEX idx_applications_current_stage      ON hr_recruitment.applications (tenant_id, current_stage);
CREATE INDEX idx_applications_created_at         ON hr_recruitment.applications (tenant_id, created_at DESC);

-- interviews
CREATE INDEX idx_interviews_tenant_id            ON hr_recruitment.interviews (tenant_id);
CREATE INDEX idx_interviews_application_id       ON hr_recruitment.interviews (tenant_id, application_id);
CREATE INDEX idx_interviews_status               ON hr_recruitment.interviews (tenant_id, status);
CREATE INDEX idx_interviews_scheduled_date       ON hr_recruitment.interviews (tenant_id, scheduled_date);
CREATE INDEX idx_interviews_type                 ON hr_recruitment.interviews (tenant_id, interview_type);
CREATE INDEX idx_interviews_result               ON hr_recruitment.interviews (tenant_id, result);

-- interview_scores
CREATE INDEX idx_interview_scores_tenant_id      ON hr_recruitment.interview_scores (tenant_id);
CREATE INDEX idx_interview_scores_interview_id   ON hr_recruitment.interview_scores (tenant_id, interview_id);
CREATE INDEX idx_interview_scores_interviewer_id ON hr_recruitment.interview_scores (tenant_id, interviewer_id);

-- offers
CREATE INDEX idx_offers_tenant_id                ON hr_recruitment.offers (tenant_id);
CREATE INDEX idx_offers_application_id           ON hr_recruitment.offers (tenant_id, application_id);
CREATE INDEX idx_offers_status                   ON hr_recruitment.offers (tenant_id, status);
CREATE INDEX idx_offers_start_date               ON hr_recruitment.offers (tenant_id, start_date);
CREATE INDEX idx_offers_expires_at               ON hr_recruitment.offers (expires_at) WHERE status = 'SENT';
CREATE INDEX idx_offers_created_at               ON hr_recruitment.offers (tenant_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE hr_recruitment.job_postings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.job_postings     FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.applicants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.applicants       FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.applications     FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.interviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.interviews       FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.interview_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.interview_scores FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.offers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.offers           FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_job_postings ON hr_recruitment.job_postings
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_applicants ON hr_recruitment.applicants
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_applications ON hr_recruitment.applications
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_interviews ON hr_recruitment.interviews
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_interview_scores ON hr_recruitment.interview_scores
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_offers ON hr_recruitment.offers
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );
