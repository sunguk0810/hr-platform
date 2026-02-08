import { http, HttpResponse, delay } from 'msw';
import type {
  CertificateType,
  CertificateRequest,
  CertificateIssue,
  VerificationResult,
  RequestStatus,
  CertificateLanguage,
} from '@hr-platform/shared-types';

// Mock Certificate Types
const mockCertificateTypes: CertificateType[] = [
  {
    id: 'type-001',
    tenantId: 'tenant-001',
    code: 'EMPLOYMENT',
    name: '재직증명서',
    nameEn: 'Certificate of Employment',
    description: '현재 재직 중임을 증명하는 서류입니다.',
    requiresApproval: false,
    autoIssue: true,
    validDays: 90,
    fee: 0,
    maxCopiesPerRequest: 5,
    status: 'ACTIVE',
    sortOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'type-002',
    tenantId: 'tenant-001',
    code: 'CAREER',
    name: '경력증명서',
    nameEn: 'Certificate of Career',
    description: '재직 기간 및 경력을 증명하는 서류입니다.',
    requiresApproval: true,
    autoIssue: false,
    validDays: 90,
    fee: 0,
    maxCopiesPerRequest: 5,
    status: 'ACTIVE',
    sortOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'type-003',
    tenantId: 'tenant-001',
    code: 'SALARY',
    name: '급여명세서',
    nameEn: 'Salary Statement',
    description: '급여 지급 내역을 증명하는 서류입니다.',
    requiresApproval: true,
    autoIssue: false,
    validDays: 30,
    fee: 1000,
    maxCopiesPerRequest: 3,
    status: 'ACTIVE',
    sortOrder: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'type-004',
    tenantId: 'tenant-001',
    code: 'RETIREMENT',
    name: '퇴직증명서',
    nameEn: 'Certificate of Resignation',
    description: '퇴직 사실을 증명하는 서류입니다. 퇴직자만 신청 가능합니다.',
    requiresApproval: true,
    autoIssue: false,
    validDays: 90,
    fee: 0,
    maxCopiesPerRequest: 5,
    status: 'ACTIVE',
    sortOrder: 4,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'type-005',
    tenantId: 'tenant-001',
    code: 'INCOME',
    name: '소득금액증명',
    nameEn: 'Certificate of Income',
    description: '연간 소득 금액을 증명하는 서류입니다.',
    requiresApproval: true,
    autoIssue: false,
    validDays: 30,
    fee: 2000,
    maxCopiesPerRequest: 3,
    status: 'ACTIVE',
    sortOrder: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock Certificate Requests
const mockRequests: CertificateRequest[] = [
  {
    id: 'req-001',
    tenantId: 'tenant-001',
    requestNumber: 'CERT-2024-0001',
    certificateTypeId: mockCertificateTypes[0].id,
    certificateTypeName: mockCertificateTypes[0].name,
    certificateType: mockCertificateTypes[0],
    employeeId: 'emp-001',
    employeeName: '홍길동',
    employeeNumber: 'EMP2024001',
    purpose: '은행 대출',
    submissionTarget: '국민은행',
    copies: 2,
    language: 'KO',
    includeSalary: false,
    status: 'ISSUED',
    approvedAt: '2024-03-01T09:00:00Z',
    issuedAt: '2024-03-01T09:01:00Z',
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-03-01T09:01:00Z',
  },
  {
    id: 'req-002',
    tenantId: 'tenant-001',
    requestNumber: 'CERT-2024-0002',
    certificateTypeId: mockCertificateTypes[1].id,
    certificateTypeName: mockCertificateTypes[1].name,
    certificateType: mockCertificateTypes[1],
    employeeId: 'emp-001',
    employeeName: '홍길동',
    employeeNumber: 'EMP2024001',
    purpose: '이직 준비',
    submissionTarget: '타사',
    copies: 1,
    language: 'KO',
    includeSalary: false,
    status: 'PENDING',
    createdAt: '2024-03-10T14:00:00Z',
    updatedAt: '2024-03-10T14:00:00Z',
  },
  {
    id: 'req-003',
    tenantId: 'tenant-001',
    requestNumber: 'CERT-2024-0003',
    certificateTypeId: mockCertificateTypes[0].id,
    certificateTypeName: mockCertificateTypes[0].name,
    certificateType: mockCertificateTypes[0],
    employeeId: 'emp-001',
    employeeName: '홍길동',
    employeeNumber: 'EMP2024001',
    purpose: '비자 신청',
    submissionTarget: '대사관',
    copies: 1,
    language: 'EN',
    includeSalary: true,
    status: 'APPROVED',
    approvedAt: '2024-03-15T11:00:00Z',
    approvedBy: 'admin-001',
    approverName: '인사팀장',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T11:00:00Z',
  },
  {
    id: 'req-004',
    tenantId: 'tenant-001',
    requestNumber: 'CERT-2024-0004',
    certificateTypeId: mockCertificateTypes[2].id,
    certificateTypeName: mockCertificateTypes[2].name,
    certificateType: mockCertificateTypes[2],
    employeeId: 'emp-001',
    employeeName: '홍길동',
    employeeNumber: 'EMP2024001',
    purpose: '금융기관 제출',
    copies: 1,
    language: 'KO',
    includeSalary: false,
    status: 'REJECTED',
    rejectedAt: '2024-02-21T10:00:00Z',
    rejectedBy: 'admin-001',
    rejectionReason: '급여명세서는 재무팀 별도 신청 필요',
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-02-21T10:00:00Z',
  },
];

// Mock Certificate Issues
const mockIssues: CertificateIssue[] = [
  {
    id: 'issue-001',
    tenantId: 'tenant-001',
    requestId: 'req-001',
    issueNumber: 'ISS-2024-0001',
    verificationCode: 'CERT-A1B2-C3D4',
    fileId: 'file-001',
    fileName: '재직증명서_홍길동_20240301.pdf',
    fileSize: 125000,
    issuedAt: '2024-03-01T09:01:00Z',
    expiresAt: '2024-05-30T23:59:59Z',
    revoked: false,
    downloadCount: 2,
    downloadedAt: '2024-03-05T10:00:00Z',
    certificateTypeName: '재직증명서',
    employeeName: '홍길동',
    employeeNumber: 'EMP2024001',
    createdAt: '2024-03-01T09:01:00Z',
    updatedAt: '2024-03-05T10:00:00Z',
  },
  {
    id: 'issue-002',
    tenantId: 'tenant-001',
    requestId: 'req-001',
    issueNumber: 'ISS-2024-0002',
    verificationCode: 'CERT-E5F6-G7H8',
    fileId: 'file-002',
    fileName: '재직증명서_홍길동_20240301_2.pdf',
    fileSize: 125000,
    issuedAt: '2024-03-01T09:01:00Z',
    expiresAt: '2024-05-30T23:59:59Z',
    revoked: false,
    downloadCount: 1,
    downloadedAt: '2024-03-02T14:00:00Z',
    certificateTypeName: '재직증명서',
    employeeName: '홍길동',
    employeeNumber: 'EMP2024001',
    createdAt: '2024-03-01T09:01:00Z',
    updatedAt: '2024-03-02T14:00:00Z',
  },
  {
    id: 'issue-003',
    tenantId: 'tenant-001',
    requestId: 'req-old',
    issueNumber: 'ISS-2023-0100',
    verificationCode: 'CERT-I9J0-K1L2',
    fileId: 'file-003',
    fileName: '재직증명서_홍길동_20231115.pdf',
    fileSize: 120000,
    issuedAt: '2023-11-15T09:00:00Z',
    expiresAt: '2024-02-13T23:59:59Z',
    revoked: false,
    downloadCount: 3,
    downloadedAt: '2024-01-10T09:00:00Z',
    certificateTypeName: '재직증명서',
    employeeName: '홍길동',
    employeeNumber: 'EMP2024001',
    createdAt: '2023-11-15T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
  },
];

// Verification codes mapping
const verificationCodes: Record<string, VerificationResult> = {
  'CERT-A1B2-C3D4': {
    isValid: true,
    certificateType: 'EMPLOYMENT',
    certificateTypeName: '재직증명서',
    employeeName: '홍길동',
    companyName: 'HR SaaS 주식회사',
    issuedAt: '2024-03-01T09:01:00Z',
    expiresAt: '2024-05-30T23:59:59Z',
    issueNumber: 'ISS-2024-0001',
    message: '본 증명서는 정상적으로 발급된 유효한 증명서입니다.',
  },
  'CERT-E5F6-G7H8': {
    isValid: true,
    certificateType: 'EMPLOYMENT',
    certificateTypeName: '재직증명서',
    employeeName: '홍길동',
    companyName: 'HR SaaS 주식회사',
    issuedAt: '2024-03-01T09:01:00Z',
    expiresAt: '2024-05-30T23:59:59Z',
    issueNumber: 'ISS-2024-0002',
    message: '본 증명서는 정상적으로 발급된 유효한 증명서입니다.',
  },
  'CERT-I9J0-K1L2': {
    isValid: true,
    certificateType: 'EMPLOYMENT',
    certificateTypeName: '재직증명서',
    employeeName: '홍길동',
    companyName: 'HR SaaS 주식회사',
    issuedAt: '2023-11-15T09:00:00Z',
    expiresAt: '2024-02-13T23:59:59Z',
    issueNumber: 'ISS-2023-0100',
    isExpired: true,
    message: '본 증명서는 유효기간이 만료되었습니다.',
  },
};

let requestIdCounter = 5;
let issueIdCounter = 4;

export const certificateHandlers = [
  // Get certificate types
  http.get('/api/v1/certificates/types', async () => {
    await delay(300);

    return HttpResponse.json({
      success: true,
      data: mockCertificateTypes.filter(t => t.status === 'ACTIVE'),
      timestamp: new Date().toISOString(),
    });
  }),

  // Get single certificate type
  http.get('/api/v1/certificates/types/:code', async ({ params }) => {
    await delay(200);

    const { code } = params;
    const type = mockCertificateTypes.find(t => t.code === code);

    if (!type) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CERT_TYPE_001',
            message: '증명서 유형을 찾을 수 없습니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: type,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create certificate request
  http.post('/api/v1/certificates/requests', async ({ request }) => {
    await delay(400);

    const body = await request.json() as Record<string, unknown>;
    const certificateType = mockCertificateTypes.find(
      t => t.id === body.certificateTypeId
    );

    if (!certificateType) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CERT_TYPE_001',
            message: '증명서 유형을 찾을 수 없습니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const newRequest: CertificateRequest = {
      id: `req-${String(requestIdCounter++).padStart(3, '0')}`,
      tenantId: 'tenant-001',
      requestNumber: `CERT-2024-${String(mockRequests.length + 1).padStart(4, '0')}`,
      certificateTypeId: certificateType.id,
      certificateTypeName: certificateType.name,
      certificateType,
      employeeId: 'emp-001',
      employeeName: '홍길동',
      employeeNumber: 'EMP2024001',
      purpose: body.purpose as string | undefined,
      submissionTarget: body.submissionTarget as string | undefined,
      copies: body.copies as number,
      language: body.language as CertificateLanguage,
      includeSalary: body.includeSalary as boolean,
      status: certificateType.autoIssue ? 'ISSUED' : 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-issue if configured
    if (certificateType.autoIssue) {
      newRequest.approvedAt = new Date().toISOString();
      newRequest.issuedAt = new Date().toISOString();

      // Create issues for each copy
      for (let i = 0; i < newRequest.copies; i++) {
        const issueNumber = `ISS-2024-${String(issueIdCounter++).padStart(4, '0')}`;
        const verificationCode = `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + certificateType.validDays);

        const newIssue: CertificateIssue = {
          id: `issue-${String(issueIdCounter).padStart(3, '0')}`,
          tenantId: 'tenant-001',
          requestId: newRequest.id,
          issueNumber,
          verificationCode,
          fileId: `file-${Date.now()}-${i}`,
          fileName: `${certificateType.name}_홍길동_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`,
          fileSize: 125000,
          issuedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          revoked: false,
          downloadCount: 0,
          certificateTypeName: certificateType.name,
          employeeName: '홍길동',
          employeeNumber: 'EMP2024001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        mockIssues.unshift(newIssue);

        // Add to verification codes
        verificationCodes[verificationCode] = {
          isValid: true,
          certificateType: certificateType.code,
          certificateTypeName: certificateType.name,
          employeeName: '홍길동',
          companyName: 'HR SaaS 주식회사',
          issuedAt: newIssue.issuedAt,
          expiresAt: newIssue.expiresAt,
          issueNumber: newIssue.issueNumber,
          message: '본 증명서는 정상적으로 발급된 유효한 증명서입니다.',
        };
      }
    }

    mockRequests.unshift(newRequest);

    return HttpResponse.json({
      success: true,
      data: newRequest,
      message: certificateType.autoIssue
        ? '증명서가 즉시 발급되었습니다.'
        : '증명서 신청이 접수되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Get my requests
  http.get('/api/v1/certificates/requests/my', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const status = url.searchParams.get('status') as RequestStatus | null;
    const typeCode = url.searchParams.get('typeCode');

    let filtered = [...mockRequests];

    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }

    if (typeCode) {
      filtered = filtered.filter(r => r.certificateTypeId === typeCode || r.certificateType?.code === typeCode);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page: {
          number: page,
          size,
          totalElements,
          totalPages,
          first: page === 0,
          last: page >= totalPages - 1,
          hasNext: page < totalPages - 1,
          hasPrevious: page > 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get single request
  http.get('/api/v1/certificates/requests/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const certRequest = mockRequests.find(r => r.id === id);

    if (!certRequest) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CERT_REQ_001',
            message: '신청을 찾을 수 없습니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: certRequest,
      timestamp: new Date().toISOString(),
    });
  }),

  // Cancel request
  http.post('/api/v1/certificates/requests/:id/cancel', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockRequests.findIndex(r => r.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CERT_REQ_001',
            message: '신청을 찾을 수 없습니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (mockRequests[index].status !== 'PENDING') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CERT_REQ_002',
            message: '승인대기 상태의 신청만 취소할 수 있습니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    mockRequests[index] = {
      ...mockRequests[index],
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      message: '신청이 취소되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get my issues
  http.get('/api/v1/certificates/issues/my', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const typeCode = url.searchParams.get('typeCode');
    const includeExpired = url.searchParams.get('includeExpired') === 'true';

    let filtered = [...mockIssues];

    if (typeCode) {
      const type = mockCertificateTypes.find(t => t.code === typeCode);
      if (type) {
        filtered = filtered.filter(i => i.certificateTypeName === type.name);
      }
    }

    if (!includeExpired) {
      const now = new Date();
      filtered = filtered.filter(i => new Date(i.expiresAt) >= now);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page: {
          number: page,
          size,
          totalElements,
          totalPages,
          first: page === 0,
          last: page >= totalPages - 1,
          hasNext: page < totalPages - 1,
          hasPrevious: page > 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Download certificate
  http.get('/api/v1/certificates/issues/:issueNumber/download', async ({ params }) => {
    await delay(500);

    const { issueNumber } = params;
    const issue = mockIssues.find(i => i.issueNumber === issueNumber);

    if (!issue) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CERT_ISSUE_001',
            message: '발급 내역을 찾을 수 없습니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    if (issue.revoked) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CERT_ISSUE_002',
            message: '폐기된 증명서는 다운로드할 수 없습니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Update download count
    issue.downloadCount++;
    issue.downloadedAt = new Date().toISOString();

    // Return mock PDF content
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(${issue.certificateTypeName} - ${issue.employeeName}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
307
%%EOF`;

    return new HttpResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${issue.fileName}"`,
      },
    });
  }),

  // Verify certificate
  http.get('/api/v1/certificates/verify/:verificationCode', async ({ params }) => {
    await delay(600);

    const { verificationCode } = params;
    const result = verificationCodes[verificationCode as string];

    if (!result) {
      return HttpResponse.json({
        success: true,
        data: {
          isValid: false,
          message: '등록되지 않은 인증코드입니다.',
          reason: '인증코드를 다시 확인해주세요.',
        } as VerificationResult,
        timestamp: new Date().toISOString(),
      });
    }

    // Check if expired
    if (result.expiresAt && new Date(result.expiresAt) < new Date()) {
      return HttpResponse.json({
        success: true,
        data: {
          ...result,
          isValid: true,
          isExpired: true,
          message: '본 증명서는 유효기간이 만료되었습니다.',
        } as VerificationResult,
        timestamp: new Date().toISOString(),
      });
    }

    return HttpResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  }),
];
