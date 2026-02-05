import { http, HttpResponse, delay } from 'msw';

type ContactCategory =
  | 'account'
  | 'attendance'
  | 'approval'
  | 'organization'
  | 'system'
  | 'suggestion'
  | 'other';

interface ContactInquiry {
  id: string;
  category: ContactCategory;
  subject: string;
  message: string;
  attachments?: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  response?: string;
  respondedAt?: string;
}

// Mock inquiries data
const mockInquiries: ContactInquiry[] = [
  {
    id: 'inq-001',
    category: 'attendance',
    subject: '출퇴근 시간 수정 요청',
    message: '어제 출근 시간이 잘못 기록되었습니다. 확인 부탁드립니다.',
    status: 'RESOLVED',
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-02-11T14:00:00Z',
    response: '확인 후 수정 완료하였습니다.',
    respondedAt: '2024-02-11T14:00:00Z',
  },
  {
    id: 'inq-002',
    category: 'system',
    subject: '비밀번호 변경 오류',
    message: '비밀번호 변경 시 오류가 발생합니다.',
    status: 'IN_PROGRESS',
    createdAt: '2024-02-15T11:30:00Z',
    updatedAt: '2024-02-15T15:00:00Z',
  },
];

// Mock attachments
const mockAttachments: Map<string, { id: string; filename: string; url: string; size: number }> = new Map();

let inquiryIdCounter = 3;
let attachmentIdCounter = 1;

export const helpHandlers = [
  // Submit inquiry
  http.post('/api/v1/help/inquiries', async ({ request }) => {
    await delay(400);

    const body = (await request.json()) as {
      category: ContactCategory;
      subject: string;
      message: string;
      attachments?: string[];
    };

    const newInquiry: ContactInquiry = {
      id: `inq-${String(inquiryIdCounter++).padStart(3, '0')}`,
      category: body.category,
      subject: body.subject,
      message: body.message,
      attachments: body.attachments,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockInquiries.unshift(newInquiry);

    return HttpResponse.json({
      success: true,
      data: newInquiry,
      message: '문의가 접수되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Get my inquiries
  http.get('/api/v1/help/inquiries/me', async () => {
    await delay(300);

    return HttpResponse.json({
      success: true,
      data: mockInquiries,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get inquiry detail
  http.get('/api/v1/help/inquiries/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const inquiry = mockInquiries.find((i) => i.id === id);

    if (!inquiry) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'INQ_001', message: '문의를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: inquiry,
      timestamp: new Date().toISOString(),
    });
  }),

  // Upload attachment
  http.post('/api/v1/help/attachments', async ({ request }) => {
    await delay(500);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'FILE_001', message: '파일이 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const attachment = {
      id: `att-${String(attachmentIdCounter++).padStart(3, '0')}`,
      filename: file.name,
      url: `https://storage.example.com/help/attachments/${Date.now()}-${file.name}`,
      size: file.size,
    };

    mockAttachments.set(attachment.id, attachment);

    return HttpResponse.json({
      success: true,
      data: attachment,
      message: '파일이 업로드되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete attachment
  http.delete('/api/v1/help/attachments/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;

    if (!mockAttachments.has(id as string)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'FILE_002', message: '파일을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockAttachments.delete(id as string);

    return HttpResponse.json({
      success: true,
      data: null,
      message: '파일이 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),
];
