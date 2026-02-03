# SDD: Certificate Service (증명서 서비스)

## 1. 서비스 개요

### 1.1 목적
Certificate Service는 각종 인사 증명서(재직증명서, 경력증명서, 급여명세서 등)의 신청, 발급, 관리를 담당하는 서비스입니다.

### 1.2 책임 범위
- 증명서 유형 관리
- 증명서 신청 및 발급
- 증명서 템플릿 관리
- PDF 증명서 생성
- 발급 이력 관리
- 증명서 진위 확인
- 유효기간 관리

### 1.3 Phase
**Phase 2**

---

## 2. 아키텍처

### 2.1 서비스 구조
```
┌─────────────────────────────────────────────────────────────┐
│                   Certificate Service                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Certificate │  │   Template  │  │       PDF           │ │
│  │   Manager   │  │   Engine    │  │    Generator        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │Verification │  │   History   │  │     Approval        │ │
│  │   Handler   │  │   Manager   │  │    Connector        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐    ┌──────────┐
        │PostgreSQL│   │  AWS S3  │    │  Kafka   │
        │  (RLS)   │   │  (PDFs)  │    │ (Events) │
        └──────────┘   └──────────┘    └──────────┘
```

### 2.2 의존 서비스
| 서비스 | 통신 방식 | 용도 |
|--------|----------|------|
| Employee Service | REST (OpenFeign) | 사원 정보 조회 |
| Organization Service | REST (OpenFeign) | 부서/직급 정보 조회 |
| Approval Service | Kafka Event | 증명서 발급 승인 (필요시) |
| File Service | REST (OpenFeign) | PDF 파일 저장 |

---

## 3. 데이터 모델

### 3.1 ERD
```
┌─────────────────────────┐       ┌─────────────────────────┐
│   certificate_type      │       │  certificate_request    │
├─────────────────────────┤       ├─────────────────────────┤
│ id (PK, UUID)           │──────<│ id (PK, UUID)           │
│ tenant_id               │       │ certificate_type_id(FK) │
│ code                    │       │ tenant_id               │
│ name                    │       │ employee_id             │
│ description             │       │ request_number          │
│ template_id             │       │ purpose                 │
│ requires_approval       │       │ submission_target       │
│ auto_issue              │       │ copies                  │
│ valid_days              │       │ language                │
│ fee                     │       │ include_salary          │
│ max_copies_per_request  │       │ period_from             │
│ sort_order              │       │ period_to               │
│ status                  │       │ custom_fields           │
│ created_at              │       │ status                  │
└─────────────────────────┘       │ approval_id             │
                                  │ issued_at               │
┌─────────────────────────┐       │ file_id                 │
│  certificate_template   │       │ verification_code       │
├─────────────────────────┤       │ expires_at              │
│ id (PK, UUID)           │       │ created_at              │
│ tenant_id               │       └─────────────────────────┘
│ name                    │
│ content_html            │       ┌─────────────────────────┐
│ header_html             │       │   certificate_issue     │
│ footer_html             │       ├─────────────────────────┤
│ css_styles              │       │ id (PK, UUID)           │
│ page_size               │       │ request_id (FK)         │
│ orientation             │       │ issue_number            │
│ variables               │       │ verification_code       │
│ sample_image_url        │       │ file_id                 │
│ status                  │       │ issued_by               │
│ created_at              │       │ issued_at               │
└─────────────────────────┘       │ downloaded_at           │
                                  │ verified_count          │
┌─────────────────────────┐       │ expires_at              │
│  verification_log       │       │ is_revoked              │
├─────────────────────────┤       │ created_at              │
│ id (PK, UUID)           │       └─────────────────────────┘
│ issue_id (FK)           │
│ verification_code       │
│ verified_at             │
│ verifier_ip             │
│ verifier_info           │
│ is_valid                │
│ created_at              │
└─────────────────────────┘
```

### 3.2 테이블 DDL

#### certificate_type (증명서 유형)
```sql
CREATE TABLE certificate_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    template_id UUID,
    requires_approval BOOLEAN DEFAULT false,
    approval_template_id UUID,
    auto_issue BOOLEAN DEFAULT true,
    valid_days INTEGER DEFAULT 90,
    fee DECIMAL(10, 0) DEFAULT 0,
    max_copies_per_request INTEGER DEFAULT 5,
    allowed_purposes TEXT[],
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_certificate_type UNIQUE (tenant_id, code)
);

-- 기본 증명서 유형
-- EMPLOYMENT: 재직증명서
-- CAREER: 경력증명서
-- SALARY: 급여명세서
-- INCOME: 원천징수영수증
-- SERVICE_PERIOD: 경력기간증명서
-- EMPLOYMENT_CONFIRM: 재직확인서
```

#### certificate_template (증명서 템플릿)
```sql
CREATE TABLE certificate_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    content_html TEXT NOT NULL,
    header_html TEXT,
    footer_html TEXT,
    css_styles TEXT,
    page_size VARCHAR(10) DEFAULT 'A4'
        CHECK (page_size IN ('A4', 'LETTER', 'LEGAL')),
    orientation VARCHAR(10) DEFAULT 'PORTRAIT'
        CHECK (orientation IN ('PORTRAIT', 'LANDSCAPE')),
    margin_top INTEGER DEFAULT 20,
    margin_bottom INTEGER DEFAULT 20,
    margin_left INTEGER DEFAULT 20,
    margin_right INTEGER DEFAULT 20,
    variables JSONB DEFAULT '[]',
    include_company_seal BOOLEAN DEFAULT true,
    include_signature BOOLEAN DEFAULT true,
    seal_image_url VARCHAR(500),
    signature_image_url VARCHAR(500),
    sample_image_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 템플릿 변수 예시
-- [
--   {"name": "employeeName", "label": "성명", "type": "text"},
--   {"name": "employeeNumber", "label": "사번", "type": "text"},
--   {"name": "department", "label": "부서", "type": "text"},
--   {"name": "position", "label": "직책", "type": "text"},
--   {"name": "hireDate", "label": "입사일", "type": "date"},
--   {"name": "purpose", "label": "용도", "type": "text"}
-- ]
```

#### certificate_request (증명서 신청)
```sql
CREATE TABLE certificate_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    certificate_type_id UUID NOT NULL REFERENCES certificate_type(id),
    employee_id UUID NOT NULL,
    request_number VARCHAR(50) NOT NULL,
    purpose VARCHAR(200),
    submission_target VARCHAR(200),
    copies INTEGER NOT NULL DEFAULT 1,
    language VARCHAR(10) DEFAULT 'KO'
        CHECK (language IN ('KO', 'EN', 'BOTH')),
    include_salary BOOLEAN DEFAULT false,
    period_from DATE,
    period_to DATE,
    custom_fields JSONB,
    remarks TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ISSUED', 
                         'CANCELLED', 'EXPIRED')),
    approval_id UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    issued_at TIMESTAMP WITH TIME ZONE,
    issued_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_certificate_request UNIQUE (tenant_id, request_number)
);

-- 인덱스
CREATE INDEX idx_cert_request_employee ON certificate_request(employee_id);
CREATE INDEX idx_cert_request_status ON certificate_request(status);
CREATE INDEX idx_cert_request_type ON certificate_request(certificate_type_id);

-- RLS 정책
ALTER TABLE certificate_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY certificate_request_isolation ON certificate_request
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

#### certificate_issue (발급 증명서)
```sql
CREATE TABLE certificate_issue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_id UUID NOT NULL REFERENCES certificate_request(id),
    issue_number VARCHAR(50) NOT NULL,
    verification_code VARCHAR(20) NOT NULL,
    file_id UUID NOT NULL,
    content_snapshot JSONB NOT NULL,
    issued_by UUID NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    verified_count INTEGER DEFAULT 0,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    expires_at DATE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    revoke_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_certificate_issue UNIQUE (tenant_id, issue_number),
    CONSTRAINT uk_verification_code UNIQUE (verification_code)
);

-- 인덱스
CREATE INDEX idx_cert_issue_verification ON certificate_issue(verification_code);
CREATE INDEX idx_cert_issue_expires ON certificate_issue(expires_at);
```

#### verification_log (진위확인 로그)
```sql
CREATE TABLE verification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES certificate_issue(id),
    verification_code VARCHAR(20) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verifier_ip INET,
    verifier_user_agent TEXT,
    verifier_name VARCHAR(100),
    verifier_organization VARCHAR(200),
    is_valid BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_log_issue ON verification_log(issue_id);
CREATE INDEX idx_verification_log_code ON verification_log(verification_code);
```

---

## 4. API 명세

### 4.1 증명서 유형 API

#### 증명서 유형 목록 조회
```
GET /api/v1/certificates/types
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "EMPLOYMENT",
      "name": "재직증명서",
      "nameEn": "Certificate of Employment",
      "requiresApproval": false,
      "autoIssue": true,
      "validDays": 90,
      "fee": 0,
      "maxCopiesPerRequest": 5
    },
    {
      "id": "uuid",
      "code": "CAREER",
      "name": "경력증명서",
      "requiresApproval": true,
      "autoIssue": false,
      "validDays": 90
    }
  ]
}
```

### 4.2 증명서 신청 API

#### 증명서 신청
```
POST /api/v1/certificates/requests
```
**Request:**
```json
{
  "certificateTypeCode": "EMPLOYMENT",
  "purpose": "은행 대출",
  "submissionTarget": "○○은행",
  "copies": 2,
  "language": "KO",
  "includeSalary": false
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "requestNumber": "CERT-2024-00001",
    "certificateType": {
      "code": "EMPLOYMENT",
      "name": "재직증명서"
    },
    "status": "ISSUED",
    "copies": 2,
    "issues": [
      {
        "issueNumber": "CERT-2024-00001-01",
        "verificationCode": "ABC123XYZ",
        "downloadUrl": "https://...",
        "expiresAt": "2024-04-15"
      },
      {
        "issueNumber": "CERT-2024-00001-02",
        "verificationCode": "DEF456UVW",
        "downloadUrl": "https://...",
        "expiresAt": "2024-04-15"
      }
    ],
    "issuedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 증명서 신청 목록 조회 (본인)
```
GET /api/v1/certificates/requests/my
```
**Query Parameters:** status, typeCode, page, size

#### 증명서 신청 목록 조회 (관리자)
```
GET /api/v1/certificates/requests
```
**Query Parameters:** employeeId, status, typeCode, page, size

#### 증명서 신청 상세 조회
```
GET /api/v1/certificates/requests/{requestId}
```

#### 증명서 신청 취소
```
POST /api/v1/certificates/requests/{requestId}/cancel
```

### 4.3 발급 API

#### 증명서 다운로드
```
GET /api/v1/certificates/issues/{issueNumber}/download
```
**Response:** PDF 파일 (application/pdf)

#### 증명서 재발급
```
POST /api/v1/certificates/requests/{requestId}/reissue
```

#### 증명서 무효화
```
POST /api/v1/certificates/issues/{issueNumber}/revoke
```
**Request:**
```json
{
  "reason": "정보 오류로 인한 무효화"
}
```

### 4.4 진위확인 API (외부 공개)

#### 증명서 진위확인
```
GET /api/v1/certificates/verify/{verificationCode}
```
**Response (유효):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "certificateType": "재직증명서",
    "employeeName": "홍*동",
    "companyName": "주식회사 HR SaaS",
    "issuedAt": "2024-01-15",
    "expiresAt": "2024-04-15",
    "issueNumber": "CERT-2024-00001-01"
  }
}
```
**Response (무효):**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "reason": "EXPIRED",
    "message": "유효기간이 만료된 증명서입니다."
  }
}
```

### 4.5 템플릿 API (관리자)

#### 템플릿 목록 조회
```
GET /api/v1/certificates/templates
```

#### 템플릿 생성
```
POST /api/v1/certificates/templates
```
**Request:**
```json
{
  "name": "재직증명서 (국문)",
  "contentHtml": "<html>...</html>",
  "cssStyles": "...",
  "variables": [
    {"name": "employeeName", "label": "성명", "type": "text"},
    {"name": "hireDate", "label": "입사일", "type": "date"}
  ],
  "includeCompanySeal": true,
  "includeSignature": true
}
```

#### 템플릿 미리보기
```
POST /api/v1/certificates/templates/{templateId}/preview
```
**Request:**
```json
{
  "employeeId": "uuid"
}
```
**Response:** PDF 파일

---

## 5. 비즈니스 로직

### 5.1 증명서 발급 처리

```java
@Service
@RequiredArgsConstructor
@Transactional
public class CertificateIssueService {
    
    private final CertificateRequestRepository requestRepository;
    private final CertificateIssueRepository issueRepository;
    private final CertificateTemplateRepository templateRepository;
    private final EmployeeServiceClient employeeServiceClient;
    private final PdfGeneratorService pdfGeneratorService;
    private final FileServiceClient fileServiceClient;
    
    public CertificateIssueResult issueCertificate(UUID requestId) {
        CertificateRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new NotFoundException("신청을 찾을 수 없습니다."));
        
        // 1. 상태 검증
        if (request.getStatus() != RequestStatus.APPROVED && 
            request.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("발급 가능한 상태가 아닙니다.");
        }
        
        // 2. 사원 정보 조회
        EmployeeDto employee = employeeServiceClient.getEmployee(request.getEmployeeId());
        
        // 3. 템플릿 조회
        CertificateTemplate template = templateRepository
            .findById(request.getCertificateType().getTemplateId())
            .orElseThrow(() -> new NotFoundException("템플릿을 찾을 수 없습니다."));
        
        // 4. 템플릿 데이터 구성
        Map<String, Object> templateData = buildTemplateData(request, employee);
        
        List<CertificateIssue> issues = new ArrayList<>();
        
        // 5. 부수만큼 발급
        for (int i = 0; i < request.getCopies(); i++) {
            CertificateIssue issue = createIssue(request, template, templateData, i + 1);
            issues.add(issue);
        }
        
        // 6. 신청 상태 갱신
        request.setStatus(RequestStatus.ISSUED);
        request.setIssuedAt(LocalDateTime.now());
        request.setIssuedBy(SecurityContextHolder.getCurrentUserId());
        requestRepository.save(request);
        
        return CertificateIssueResult.builder()
            .requestId(requestId)
            .issues(issues.stream().map(CertificateIssueDto::from).collect(Collectors.toList()))
            .build();
    }
    
    private CertificateIssue createIssue(CertificateRequest request, 
                                          CertificateTemplate template,
                                          Map<String, Object> templateData,
                                          int copyNumber) {
        // 1. 발급번호 생성
        String issueNumber = generateIssueNumber(request.getRequestNumber(), copyNumber);
        
        // 2. 검증코드 생성
        String verificationCode = generateVerificationCode();
        
        // 3. 만료일 계산
        LocalDate expiresAt = LocalDate.now()
            .plusDays(request.getCertificateType().getValidDays());
        
        // 4. 템플릿 데이터에 발급 정보 추가
        templateData.put("issueNumber", issueNumber);
        templateData.put("verificationCode", verificationCode);
        templateData.put("issuedDate", LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy년 MM월 dd일")));
        templateData.put("expiresAt", expiresAt.format(DateTimeFormatter.ofPattern("yyyy년 MM월 dd일")));
        
        // 5. PDF 생성
        byte[] pdfBytes = pdfGeneratorService.generatePdf(template, templateData);
        
        // 6. 파일 저장
        UUID fileId = fileServiceClient.uploadFile(
            pdfBytes,
            issueNumber + ".pdf",
            "application/pdf",
            "CERTIFICATE"
        );
        
        // 7. 발급 정보 저장
        CertificateIssue issue = CertificateIssue.builder()
            .tenantId(request.getTenantId())
            .requestId(request.getId())
            .issueNumber(issueNumber)
            .verificationCode(verificationCode)
            .fileId(fileId)
            .contentSnapshot(templateData)
            .issuedBy(SecurityContextHolder.getCurrentUserId())
            .issuedAt(LocalDateTime.now())
            .expiresAt(expiresAt)
            .build();
        
        return issueRepository.save(issue);
    }
    
    private Map<String, Object> buildTemplateData(CertificateRequest request, EmployeeDto employee) {
        Map<String, Object> data = new HashMap<>();
        
        // 사원 기본 정보
        data.put("employeeName", employee.getName());
        data.put("employeeNameEn", employee.getNameEn());
        data.put("employeeNumber", employee.getEmployeeNumber());
        data.put("birthDate", formatDate(employee.getBirthDate()));
        data.put("residentNumber", maskResidentNumber(employee.getResidentNumber()));
        
        // 소속 정보
        data.put("departmentName", employee.getDepartmentName());
        data.put("positionName", employee.getPositionName());
        data.put("gradeName", employee.getGradeName());
        data.put("jobName", employee.getJobName());
        
        // 근무 정보
        data.put("hireDate", formatDate(employee.getHireDate()));
        data.put("employmentType", employee.getEmploymentTypeName());
        
        // 급여 정보 (포함 시)
        if (request.getIncludeSalary()) {
            data.put("salary", formatCurrency(employee.getSalary()));
        }
        
        // 용도
        data.put("purpose", request.getPurpose());
        data.put("submissionTarget", request.getSubmissionTarget());
        
        // 회사 정보
        data.put("companyName", getCompanyName(request.getTenantId()));
        data.put("companyAddress", getCompanyAddress(request.getTenantId()));
        data.put("ceoName", getCeoName(request.getTenantId()));
        
        return data;
    }
    
    private String generateVerificationCode() {
        // 영문 대문자 + 숫자 조합 12자리
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder code = new StringBuilder();
        SecureRandom random = new SecureRandom();
        
        for (int i = 0; i < 12; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return code.toString();
    }
}
```

### 5.2 PDF 생성

```java
@Service
@RequiredArgsConstructor
public class PdfGeneratorService {
    
    private final TemplateEngine thymeleafEngine;
    
    public byte[] generatePdf(CertificateTemplate template, Map<String, Object> data) {
        // 1. HTML 렌더링
        Context context = new Context();
        context.setVariables(data);
        
        String html = buildFullHtml(template, context);
        
        // 2. PDF 변환 (Flying Saucer + iText)
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            
            // 한글 폰트 설정
            renderer.getFontResolver().addFont(
                "/fonts/NanumGothic.ttf",
                BaseFont.IDENTITY_H,
                BaseFont.EMBEDDED
            );
            
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(baos);
            
            return baos.toByteArray();
            
        } catch (Exception e) {
            throw new PdfGenerationException("PDF 생성에 실패했습니다.", e);
        }
    }
    
    private String buildFullHtml(CertificateTemplate template, Context context) {
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html><html><head>");
        html.append("<meta charset=\"UTF-8\"/>");
        html.append("<style>").append(template.getCssStyles()).append("</style>");
        html.append("</head><body>");
        
        // 헤더
        if (template.getHeaderHtml() != null) {
            html.append(thymeleafEngine.process(template.getHeaderHtml(), context));
        }
        
        // 본문
        html.append(thymeleafEngine.process(template.getContentHtml(), context));
        
        // 푸터
        if (template.getFooterHtml() != null) {
            html.append(thymeleafEngine.process(template.getFooterHtml(), context));
        }
        
        html.append("</body></html>");
        
        return html.toString();
    }
}
```

### 5.3 진위확인 처리

```java
@Service
@RequiredArgsConstructor
public class CertificateVerificationService {
    
    private final CertificateIssueRepository issueRepository;
    private final VerificationLogRepository logRepository;
    
    public VerificationResult verify(String verificationCode, VerificationRequest request) {
        CertificateIssue issue = issueRepository.findByVerificationCode(verificationCode)
            .orElse(null);
        
        VerificationResult result;
        
        if (issue == null) {
            result = VerificationResult.invalid("NOT_FOUND", "존재하지 않는 증명서입니다.");
        } else if (issue.getIsRevoked()) {
            result = VerificationResult.invalid("REVOKED", "무효화된 증명서입니다.");
        } else if (issue.getExpiresAt().isBefore(LocalDate.now())) {
            result = VerificationResult.invalid("EXPIRED", "유효기간이 만료된 증명서입니다.");
        } else {
            result = VerificationResult.valid(
                issue.getCertificateType().getName(),
                maskName(issue.getEmployeeName()),
                issue.getCompanyName(),
                issue.getIssuedAt().toLocalDate(),
                issue.getExpiresAt(),
                issue.getIssueNumber()
            );
            
            // 검증 횟수 증가
            issue.setVerifiedCount(issue.getVerifiedCount() + 1);
            issue.setLastVerifiedAt(LocalDateTime.now());
            issueRepository.save(issue);
        }
        
        // 검증 로그 저장
        VerificationLog log = VerificationLog.builder()
            .issueId(issue != null ? issue.getId() : null)
            .verificationCode(verificationCode)
            .verifierIp(request.getIpAddress())
            .verifierUserAgent(request.getUserAgent())
            .verifierName(request.getVerifierName())
            .verifierOrganization(request.getVerifierOrganization())
            .isValid(result.isValid())
            .failureReason(result.getReason())
            .build();
        
        logRepository.save(log);
        
        return result;
    }
    
    private String maskName(String name) {
        if (name == null || name.length() < 2) {
            return name;
        }
        // 홍길동 -> 홍*동
        char[] chars = name.toCharArray();
        for (int i = 1; i < chars.length - 1; i++) {
            chars[i] = '*';
        }
        return new String(chars);
    }
}
```

---

## 6. 이벤트

### 6.1 발행 이벤트

| 이벤트 | 토픽 | 설명 |
|--------|------|------|
| CertificateIssuedEvent | hr-saas.certificate.issued | 증명서 발급 |
| CertificateRevokedEvent | hr-saas.certificate.revoked | 증명서 무효화 |

### 6.2 구독 이벤트

| 이벤트 | 토픽 | 처리 내용 |
|--------|------|----------|
| ApprovalCompletedEvent | hr-saas.approval.completed | 증명서 발급 승인 결과 |

---

## 7. 배포 설정

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: certificate-service
  namespace: hr-saas
spec:
  replicas: 2
  selector:
    matchLabels:
      app: certificate-service
  template:
    spec:
      containers:
        - name: certificate-service
          image: hr-saas/certificate-service:latest
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
```

---

## 8. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0.0 | 2024-01-15 | - | 최초 작성 |