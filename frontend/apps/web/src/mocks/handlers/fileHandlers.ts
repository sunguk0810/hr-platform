import { http, HttpResponse, delay } from 'msw';
import { format, subDays } from 'date-fns';

// Types matching fileService.ts
export type FileCategory =
  | 'PROFILE'
  | 'DOCUMENT'
  | 'CERTIFICATE'
  | 'APPROVAL'
  | 'ANNOUNCEMENT'
  | 'RECRUITMENT'
  | 'OTHER';

export interface FileInfo {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const mockFiles: FileInfo[] = [
  {
    id: 'file-001',
    fileName: 'a1b2c3d4-인사규정.pdf',
    originalFileName: '2024년_인사규정.pdf',
    filePath: '/uploads/documents/a1b2c3d4-인사규정.pdf',
    fileSize: 2457600,
    mimeType: 'application/pdf',
    category: 'DOCUMENT',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-002',
    fileName: 'e5f6g7h8-프로필.jpg',
    originalFileName: '프로필사진_홍길동.jpg',
    filePath: '/uploads/profiles/e5f6g7h8-프로필.jpg',
    fileSize: 524288,
    mimeType: 'image/jpeg',
    category: 'PROFILE',
    uploadedBy: 'emp-001',
    uploadedByName: '홍길동',
    createdAt: format(subDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-003',
    fileName: 'i9j0k1l2-재직증명서.pdf',
    originalFileName: '재직증명서_홍길동.pdf',
    filePath: '/uploads/certificates/i9j0k1l2-재직증명서.pdf',
    fileSize: 153600,
    mimeType: 'application/pdf',
    category: 'CERTIFICATE',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-004',
    fileName: 'm3n4o5p6-결재첨부.xlsx',
    originalFileName: '결재첨부_경비청구.xlsx',
    filePath: '/uploads/approvals/m3n4o5p6-결재첨부.xlsx',
    fileSize: 102400,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'APPROVAL',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-005',
    fileName: 'q7r8s9t0-로고.png',
    originalFileName: '회사로고_투명배경.png',
    filePath: '/uploads/announcements/q7r8s9t0-로고.png',
    fileSize: 81920,
    mimeType: 'image/png',
    category: 'ANNOUNCEMENT',
    uploadedBy: 'emp-007',
    uploadedByName: '강하늘',
    createdAt: format(subDays(new Date(), 60), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 60), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-006',
    fileName: 'u1v2w3x4-이력서.pdf',
    originalFileName: '이력서_김지원.pdf',
    filePath: '/uploads/recruitment/u1v2w3x4-이력서.pdf',
    fileSize: 307200,
    mimeType: 'application/pdf',
    category: 'RECRUITMENT',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-007',
    fileName: 'y5z6a7b8-휴가계획서.pdf',
    originalFileName: '휴가계획서_2024.pdf',
    filePath: '/uploads/approvals/y5z6a7b8-휴가계획서.pdf',
    fileSize: 204800,
    mimeType: 'application/pdf',
    category: 'APPROVAL',
    uploadedBy: 'emp-002',
    uploadedByName: '김철수',
    createdAt: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-008',
    fileName: 'c9d0e1f2-자료.zip',
    originalFileName: '기타자료_백업.zip',
    filePath: '/uploads/other/c9d0e1f2-자료.zip',
    fileSize: 51200,
    mimeType: 'application/zip',
    category: 'OTHER',
    uploadedBy: 'emp-001',
    uploadedByName: '홍길동',
    createdAt: format(subDays(new Date(), 15), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 15), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-009',
    fileName: 'g3h4i5j6-공지.pdf',
    originalFileName: '2024년_신년사.pdf',
    filePath: '/uploads/announcements/g3h4i5j6-공지.pdf',
    fileSize: 122880,
    mimeType: 'application/pdf',
    category: 'ANNOUNCEMENT',
    uploadedBy: 'emp-005',
    uploadedByName: '최수진',
    createdAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-010',
    fileName: 'k7l8m9n0-조직도.png',
    originalFileName: '조직도_2024.png',
    filePath: '/uploads/documents/k7l8m9n0-조직도.png',
    fileSize: 614400,
    mimeType: 'image/png',
    category: 'DOCUMENT',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 20), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 20), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
];

export const fileHandlers = [
  // Get files list
  http.get('/api/v1/files', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const category = url.searchParams.get('category') as FileCategory | null;
    const fileName = url.searchParams.get('fileName') || '';

    let filtered = [...mockFiles];

    if (category) {
      filtered = filtered.filter((f) => f.category === category);
    }

    if (fileName) {
      const lower = fileName.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.originalFileName.toLowerCase().includes(lower) ||
          f.uploadedByName.toLowerCase().includes(lower)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

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

  // Get file metadata
  http.get('/api/v1/files/:id', async ({ params }) => {
    await delay(100);

    const { id } = params;
    const file = mockFiles.find((f) => f.id === id);

    if (!file) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'FILE_002', message: '파일을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: file,
      timestamp: new Date().toISOString(),
    });
  }),

  // Upload file
  http.post('/api/v1/files', async ({ request }) => {
    await delay(500);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as FileCategory) || 'DOCUMENT';

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

    const now = new Date().toISOString();
    const newFile: FileInfo = {
      id: `file-${Date.now()}`,
      fileName: `${Date.now()}-${file.name}`,
      originalFileName: file.name,
      filePath: `/uploads/${category.toLowerCase()}/${Date.now()}-${file.name}`,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      category,
      uploadedBy: 'emp-001',
      uploadedByName: '홍길동',
      createdAt: now,
      updatedAt: now,
    };

    mockFiles.unshift(newFile);

    return HttpResponse.json(
      {
        success: true,
        data: newFile,
        message: '파일이 업로드되었습니다.',
        timestamp: now,
      },
      { status: 201 }
    );
  }),

  // Delete file
  http.delete('/api/v1/files/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const index = mockFiles.findIndex((f) => f.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'FILE_002', message: '파일을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockFiles.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      message: '파일이 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Download file
  http.get('/api/v1/files/:id/download', async ({ params }) => {
    await delay(100);

    const { id } = params;
    const file = mockFiles.find((f) => f.id === id);

    if (!file) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'FILE_002', message: '파일을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return new HttpResponse(new Blob(['Mock file content'], { type: file.mimeType }), {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalFileName)}"`,
      },
    });
  }),

  // Preview file
  http.get('/api/v1/files/:id/preview', async ({ params }) => {
    await delay(100);

    const { id } = params;
    const file = mockFiles.find((f) => f.id === id);

    if (!file) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (file.mimeType.startsWith('image/')) {
      // Return placeholder image
      return new HttpResponse(new Blob([''], { type: file.mimeType }), {
        headers: { 'Content-Type': file.mimeType },
      });
    }

    return new HttpResponse(new Blob(['Mock PDF content'], { type: 'application/pdf' }), {
      headers: { 'Content-Type': 'application/pdf' },
    });
  }),
];
