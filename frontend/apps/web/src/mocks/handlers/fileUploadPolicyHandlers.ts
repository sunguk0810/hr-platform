import { http, HttpResponse, delay } from 'msw';

interface DefaultPolicy {
  maxFileSizeMB: number;
  maxTotalStorageGB: number;
  allowedExtensions: string[];
}

interface CategoryOverride {
  id: string;
  category: string;
  maxFileSizeMB: number | null;
  allowedExtensions: string[];
}

interface FileUploadPolicy {
  defaultPolicy: DefaultPolicy;
  categoryOverrides: CategoryOverride[];
}

// Mutable state
let currentPolicy: FileUploadPolicy = {
  defaultPolicy: {
    maxFileSizeMB: 10,
    maxTotalStorageGB: 5,
    allowedExtensions: [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.hwp',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
      '.zip', '.txt', '.csv',
    ],
  },
  categoryOverrides: [
    {
      id: 'co-1',
      category: '인사서류',
      maxFileSizeMB: 20,
      allowedExtensions: ['.pdf', '.doc', '.docx', '.hwp'],
    },
    {
      id: 'co-2',
      category: '증명서',
      maxFileSizeMB: 5,
      allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    },
    {
      id: 'co-3',
      category: '결재첨부',
      maxFileSizeMB: null,
      allowedExtensions: [],
    },
    {
      id: 'co-4',
      category: '프로필사진',
      maxFileSizeMB: 2,
      allowedExtensions: ['.jpg', '.jpeg', '.png'],
    },
    {
      id: 'co-5',
      category: '기타',
      maxFileSizeMB: null,
      allowedExtensions: [],
    },
  ],
};

export const fileUploadPolicyHandlers = [
  // Get file upload policy
  http.get('/api/v1/settings/file-upload-policy', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: currentPolicy,
      timestamp: new Date().toISOString(),
    });
  }),

  // Update file upload policy
  http.put('/api/v1/settings/file-upload-policy', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as FileUploadPolicy;

    if (!body.defaultPolicy || body.defaultPolicy.maxFileSizeMB < 1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_001',
            message: '최대 파일 크기는 1MB 이상이어야 합니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    if (body.defaultPolicy.maxTotalStorageGB < 1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_002',
            message: '최대 총 용량은 1GB 이상이어야 합니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    if (body.defaultPolicy.allowedExtensions.length === 0) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_003',
            message: '최소 하나 이상의 확장자를 허용해야 합니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    currentPolicy = {
      defaultPolicy: {
        maxFileSizeMB: body.defaultPolicy.maxFileSizeMB,
        maxTotalStorageGB: body.defaultPolicy.maxTotalStorageGB,
        allowedExtensions: body.defaultPolicy.allowedExtensions,
      },
      categoryOverrides: body.categoryOverrides,
    };

    return HttpResponse.json({
      success: true,
      data: currentPolicy,
      message: '파일 업로드 정책이 저장되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),
];
