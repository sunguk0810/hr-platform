-- Job Posting (채용공고)
CREATE TABLE hr_recruitment.job_posting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    job_code VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    department_id UUID,
    department_name VARCHAR(100),
    position_id UUID,
    position_name VARCHAR(100),
    job_description TEXT,
    requirements TEXT,
    preferred_qualifications TEXT,
    employment_type VARCHAR(20) NOT NULL DEFAULT 'FULL_TIME',
    experience_min INTEGER,
    experience_max INTEGER,
    salary_min DECIMAL(15,2),
    salary_max DECIMAL(15,2),
    salary_negotiable BOOLEAN DEFAULT TRUE,
    work_location VARCHAR(200),
    headcount INTEGER DEFAULT 1,
    skills JSONB,
    benefits JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    open_date DATE,
    close_date DATE,
    recruiter_id UUID,
    recruiter_name VARCHAR(100),
    hiring_manager_id UUID,
    hiring_manager_name VARCHAR(100),
    application_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    interview_process JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_job_posting_tenant ON hr_recruitment.job_posting(tenant_id);
CREATE INDEX idx_job_posting_status ON hr_recruitment.job_posting(status);
CREATE INDEX idx_job_posting_job_code ON hr_recruitment.job_posting(job_code);
CREATE INDEX idx_job_posting_department ON hr_recruitment.job_posting(department_id);

-- Applicant (지원자)
CREATE TABLE hr_recruitment.applicant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    address VARCHAR(500),
    resume_file_id UUID,
    portfolio_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    education JSONB,
    experience JSONB,
    skills JSONB,
    certificates JSONB,
    languages JSONB,
    source VARCHAR(50),
    source_detail VARCHAR(200),
    notes TEXT,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_applicant_tenant ON hr_recruitment.applicant(tenant_id);
CREATE INDEX idx_applicant_email ON hr_recruitment.applicant(email);
CREATE INDEX idx_applicant_name ON hr_recruitment.applicant(name);

-- Application (지원서)
CREATE TABLE hr_recruitment.application (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    job_posting_id UUID NOT NULL REFERENCES hr_recruitment.job_posting(id),
    applicant_id UUID NOT NULL REFERENCES hr_recruitment.applicant(id),
    application_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    cover_letter TEXT,
    answers JSONB,
    expected_salary BIGINT,
    available_date VARCHAR(100),
    referrer_name VARCHAR(100),
    referrer_employee_id UUID,
    screening_score INTEGER,
    screening_notes TEXT,
    screened_by UUID,
    screened_at TIMESTAMP WITH TIME ZONE,
    current_stage VARCHAR(50) DEFAULT 'DOCUMENT',
    stage_order INTEGER DEFAULT 0,
    rejection_reason TEXT,
    rejected_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    hired_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_application_tenant ON hr_recruitment.application(tenant_id);
CREATE INDEX idx_application_job_posting ON hr_recruitment.application(job_posting_id);
CREATE INDEX idx_application_applicant ON hr_recruitment.application(applicant_id);
CREATE INDEX idx_application_status ON hr_recruitment.application(status);
CREATE INDEX idx_application_number ON hr_recruitment.application(application_number);

-- Interview (면접)
CREATE TABLE hr_recruitment.interview (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID NOT NULL REFERENCES hr_recruitment.application(id),
    interview_type VARCHAR(30) NOT NULL,
    round INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULING',
    scheduled_date DATE,
    scheduled_time TIME,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(200),
    meeting_url VARCHAR(500),
    interviewers JSONB,
    notes TEXT,
    result VARCHAR(20),
    result_notes TEXT,
    overall_score INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    feedback_deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_interview_tenant ON hr_recruitment.interview(tenant_id);
CREATE INDEX idx_interview_application ON hr_recruitment.interview(application_id);
CREATE INDEX idx_interview_status ON hr_recruitment.interview(status);
CREATE INDEX idx_interview_scheduled ON hr_recruitment.interview(scheduled_date);

-- Interview Score (면접 평가)
CREATE TABLE hr_recruitment.interview_score (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    interview_id UUID NOT NULL REFERENCES hr_recruitment.interview(id),
    interviewer_id UUID NOT NULL,
    interviewer_name VARCHAR(100),
    criterion VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER DEFAULT 5,
    weight DOUBLE PRECISION DEFAULT 1.0,
    comment TEXT,
    evaluated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_interview_score_tenant ON hr_recruitment.interview_score(tenant_id);
CREATE INDEX idx_interview_score_interview ON hr_recruitment.interview_score(interview_id);
CREATE INDEX idx_interview_score_interviewer ON hr_recruitment.interview_score(interviewer_id);

-- Offer (채용 제안)
CREATE TABLE hr_recruitment.offer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    application_id UUID NOT NULL REFERENCES hr_recruitment.application(id) UNIQUE,
    offer_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    position_title VARCHAR(100) NOT NULL,
    department_id UUID,
    department_name VARCHAR(100),
    grade_code VARCHAR(30),
    grade_name VARCHAR(50),
    base_salary DECIMAL(15,2) NOT NULL,
    signing_bonus DECIMAL(15,2),
    benefits JSONB,
    start_date DATE NOT NULL,
    employment_type VARCHAR(20) NOT NULL DEFAULT 'FULL_TIME',
    probation_months INTEGER DEFAULT 3,
    work_location VARCHAR(200),
    report_to_id UUID,
    report_to_name VARCHAR(100),
    offer_letter_file_id UUID,
    special_terms TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    decline_reason TEXT,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    negotiation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_offer_tenant ON hr_recruitment.offer(tenant_id);
CREATE INDEX idx_offer_application ON hr_recruitment.offer(application_id);
CREATE INDEX idx_offer_status ON hr_recruitment.offer(status);
CREATE INDEX idx_offer_number ON hr_recruitment.offer(offer_number);
