-- Recruitment Service: Consolidated Migration (V1)
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

-- job_posting
CREATE TABLE hr_recruitment.job_posting (
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

-- applicant
CREATE TABLE hr_recruitment.applicant (
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

-- application
CREATE TABLE hr_recruitment.application (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID            NOT NULL,
    job_posting_id        UUID            NOT NULL REFERENCES hr_recruitment.job_posting (id),
    applicant_id          UUID            NOT NULL REFERENCES hr_recruitment.applicant (id),
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

-- interview
CREATE TABLE hr_recruitment.interview (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID            NOT NULL,
    application_id    UUID            NOT NULL REFERENCES hr_recruitment.application (id),
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

-- interview_score
CREATE TABLE hr_recruitment.interview_score (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID            NOT NULL,
    interview_id      UUID            NOT NULL REFERENCES hr_recruitment.interview (id),
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

-- offer
CREATE TABLE hr_recruitment.offer (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID            NOT NULL,
    application_id        UUID            NOT NULL UNIQUE REFERENCES hr_recruitment.application (id),
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

-- job_posting
CREATE INDEX idx_job_posting_tenant_id         ON hr_recruitment.job_posting (tenant_id);
CREATE INDEX idx_job_posting_status             ON hr_recruitment.job_posting (tenant_id, status);
CREATE INDEX idx_job_posting_department_id      ON hr_recruitment.job_posting (tenant_id, department_id);
CREATE INDEX idx_job_posting_recruiter_id       ON hr_recruitment.job_posting (tenant_id, recruiter_id);
CREATE INDEX idx_job_posting_hiring_manager_id  ON hr_recruitment.job_posting (tenant_id, hiring_manager_id);
CREATE INDEX idx_job_posting_open_close_date    ON hr_recruitment.job_posting (tenant_id, open_date, close_date);
CREATE INDEX idx_job_posting_employment_type    ON hr_recruitment.job_posting (tenant_id, employment_type);
CREATE INDEX idx_job_posting_is_featured        ON hr_recruitment.job_posting (tenant_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_job_posting_is_urgent          ON hr_recruitment.job_posting (tenant_id, is_urgent) WHERE is_urgent = TRUE;
CREATE INDEX idx_job_posting_created_at         ON hr_recruitment.job_posting (tenant_id, created_at DESC);

-- applicant
CREATE INDEX idx_applicant_tenant_id            ON hr_recruitment.applicant (tenant_id);
CREATE INDEX idx_applicant_email                ON hr_recruitment.applicant (tenant_id, email);
CREATE INDEX idx_applicant_name                 ON hr_recruitment.applicant (tenant_id, name);
CREATE INDEX idx_applicant_source               ON hr_recruitment.applicant (tenant_id, source);
CREATE INDEX idx_applicant_is_blacklisted       ON hr_recruitment.applicant (tenant_id, is_blacklisted) WHERE is_blacklisted = TRUE;

-- application
CREATE INDEX idx_application_tenant_id          ON hr_recruitment.application (tenant_id);
CREATE INDEX idx_application_job_posting_id     ON hr_recruitment.application (tenant_id, job_posting_id);
CREATE INDEX idx_application_applicant_id       ON hr_recruitment.application (tenant_id, applicant_id);
CREATE INDEX idx_application_status             ON hr_recruitment.application (tenant_id, status);
CREATE INDEX idx_application_current_stage      ON hr_recruitment.application (tenant_id, current_stage);
CREATE INDEX idx_application_created_at         ON hr_recruitment.application (tenant_id, created_at DESC);

-- interview
CREATE INDEX idx_interview_tenant_id            ON hr_recruitment.interview (tenant_id);
CREATE INDEX idx_interview_application_id       ON hr_recruitment.interview (tenant_id, application_id);
CREATE INDEX idx_interview_status               ON hr_recruitment.interview (tenant_id, status);
CREATE INDEX idx_interview_scheduled_date       ON hr_recruitment.interview (tenant_id, scheduled_date);
CREATE INDEX idx_interview_type                 ON hr_recruitment.interview (tenant_id, interview_type);
CREATE INDEX idx_interview_result               ON hr_recruitment.interview (tenant_id, result);

-- interview_score
CREATE INDEX idx_interview_score_tenant_id      ON hr_recruitment.interview_score (tenant_id);
CREATE INDEX idx_interview_score_interview_id   ON hr_recruitment.interview_score (tenant_id, interview_id);
CREATE INDEX idx_interview_score_interviewer_id ON hr_recruitment.interview_score (tenant_id, interviewer_id);

-- offer
CREATE INDEX idx_offer_tenant_id                ON hr_recruitment.offer (tenant_id);
CREATE INDEX idx_offer_application_id           ON hr_recruitment.offer (tenant_id, application_id);
CREATE INDEX idx_offer_status                   ON hr_recruitment.offer (tenant_id, status);
CREATE INDEX idx_offer_start_date               ON hr_recruitment.offer (tenant_id, start_date);
CREATE INDEX idx_offer_expires_at               ON hr_recruitment.offer (expires_at) WHERE status = 'SENT';
CREATE INDEX idx_offer_created_at               ON hr_recruitment.offer (tenant_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE hr_recruitment.job_posting     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.job_posting     FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.applicant       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.applicant       FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.application     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.application     FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.interview       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.interview       FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.interview_score ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.interview_score FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_recruitment.offer           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_recruitment.offer           FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_job_posting ON hr_recruitment.job_posting
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_applicant ON hr_recruitment.applicant
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_application ON hr_recruitment.application
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_interview ON hr_recruitment.interview
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_interview_score ON hr_recruitment.interview_score
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_offer ON hr_recruitment.offer
    FOR ALL
    USING (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_recruitment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_recruitment.get_current_tenant_safe()
    );

-- ---------------------------------------------------------------------------
-- 6. Performance Indexes (JSONB GIN, status lookups)
-- ---------------------------------------------------------------------------

-- applicant: skills JSONB GIN index (skills @> operator optimization)
CREATE INDEX idx_applicant_skills_gin
    ON hr_recruitment.applicant USING GIN (skills);

-- application: status lookup index (getSummary GROUP BY optimization)
CREATE INDEX idx_application_status_only
    ON hr_recruitment.application (status);

-- interview: status lookup index (getSummary GROUP BY optimization)
CREATE INDEX idx_interview_status_only
    ON hr_recruitment.interview (status);
