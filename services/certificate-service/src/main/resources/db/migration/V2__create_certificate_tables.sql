-- ============================================================================
-- V2__create_certificate_tables.sql
-- 증명서 서비스 테이블 생성
-- ============================================================================

-- 증명서 템플릿 테이블
CREATE TABLE IF NOT EXISTS hr_certificate.certificate_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    content_html TEXT NOT NULL,
    header_html TEXT,
    footer_html TEXT,
    css_styles TEXT,
    page_size VARCHAR(10) DEFAULT 'A4',
    orientation VARCHAR(10) DEFAULT 'PORTRAIT',
    margin_top INTEGER DEFAULT 20,
    margin_bottom INTEGER DEFAULT 20,
    margin_left INTEGER DEFAULT 20,
    margin_right INTEGER DEFAULT 20,
    variables JSONB,
    include_company_seal BOOLEAN DEFAULT TRUE,
    include_signature BOOLEAN DEFAULT TRUE,
    seal_image_url VARCHAR(500),
    signature_image_url VARCHAR(500),
    sample_image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_certificate_template_tenant_id ON hr_certificate.certificate_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificate_template_is_active ON hr_certificate.certificate_template(is_active);

-- 증명서 유형 테이블
CREATE TABLE IF NOT EXISTS hr_certificate.certificate_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    template_id UUID REFERENCES hr_certificate.certificate_template(id),
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_template_id UUID,
    auto_issue BOOLEAN DEFAULT TRUE,
    valid_days INTEGER DEFAULT 90,
    fee DECIMAL(10,2) DEFAULT 0,
    max_copies_per_request INTEGER DEFAULT 5,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_certificate_type_tenant_id ON hr_certificate.certificate_type(tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificate_type_code ON hr_certificate.certificate_type(code);
CREATE INDEX IF NOT EXISTS idx_certificate_type_is_active ON hr_certificate.certificate_type(is_active);

-- 증명서 신청 테이블
CREATE TABLE IF NOT EXISTS hr_certificate.certificate_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    certificate_type_id UUID NOT NULL REFERENCES hr_certificate.certificate_type(id),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(100),
    employee_number VARCHAR(50),
    request_number VARCHAR(50) NOT NULL,
    purpose VARCHAR(200),
    submission_target VARCHAR(200),
    copies INTEGER DEFAULT 1,
    language VARCHAR(10) DEFAULT 'KO',
    include_salary BOOLEAN DEFAULT FALSE,
    period_from DATE,
    period_to DATE,
    custom_fields JSONB,
    remarks TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approval_id UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    issued_at TIMESTAMP WITH TIME ZONE,
    issued_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, request_number)
);

CREATE INDEX IF NOT EXISTS idx_certificate_request_tenant_id ON hr_certificate.certificate_request(tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificate_request_employee_id ON hr_certificate.certificate_request(employee_id);
CREATE INDEX IF NOT EXISTS idx_certificate_request_status ON hr_certificate.certificate_request(status);
CREATE INDEX IF NOT EXISTS idx_certificate_request_certificate_type_id ON hr_certificate.certificate_request(certificate_type_id);

-- 발급된 증명서 테이블
CREATE TABLE IF NOT EXISTS hr_certificate.certificate_issue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_id UUID NOT NULL REFERENCES hr_certificate.certificate_request(id),
    issue_number VARCHAR(50) NOT NULL,
    verification_code VARCHAR(20) NOT NULL,
    file_id UUID,
    content_snapshot JSONB,
    issued_by UUID NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    verified_count INTEGER DEFAULT 0,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    expires_at DATE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    revoke_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, issue_number),
    UNIQUE(verification_code)
);

CREATE INDEX IF NOT EXISTS idx_certificate_issue_tenant_id ON hr_certificate.certificate_issue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_certificate_issue_request_id ON hr_certificate.certificate_issue(request_id);
CREATE INDEX IF NOT EXISTS idx_certificate_issue_verification_code ON hr_certificate.certificate_issue(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificate_issue_expires_at ON hr_certificate.certificate_issue(expires_at);

-- 진위확인 로그 테이블 (tenant_id 없음)
CREATE TABLE IF NOT EXISTS hr_certificate.verification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES hr_certificate.certificate_issue(id),
    verification_code VARCHAR(20) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verifier_ip VARCHAR(45),
    verifier_user_agent TEXT,
    verifier_name VARCHAR(100),
    verifier_organization VARCHAR(200),
    is_valid BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_verification_log_issue_id ON hr_certificate.verification_log(issue_id);
CREATE INDEX IF NOT EXISTS idx_verification_log_verification_code ON hr_certificate.verification_log(verification_code);
CREATE INDEX IF NOT EXISTS idx_verification_log_verified_at ON hr_certificate.verification_log(verified_at);
