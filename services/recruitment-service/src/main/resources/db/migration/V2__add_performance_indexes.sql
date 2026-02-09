-- =============================================================================
-- V2: Performance optimization indexes for recruitment service
-- Addresses: JSONB skills search, application status lookups
-- =============================================================================

-- applicant: skills JSONB GIN 인덱스 (skills @> 연산자 최적화)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applicants_skills_gin
    ON hr_recruitment.applicant USING GIN (skills);

-- application: 상태별 조회 인덱스 (getSummary GROUP BY 최적화)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_application_status
    ON hr_recruitment.application (status);

-- interview: 상태별 조회 인덱스 (getSummary GROUP BY 최적화)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_status
    ON hr_recruitment.interview (status);
