import { http, HttpResponse, delay } from 'msw';
import { format, subDays } from 'date-fns';
import { FileCategory, FileInfo } from '@hr-platform/shared-types';

// Mock data
type MockFile = Omit<FileInfo, 'tenantId'> & { id: string; createdAt: string; updatedAt: string };
const mockFiles: MockFile[] = [
  {
    id: 'file-001',
    originalName: '2024년_인사규정.pdf',
    contentType: 'application/pdf',
    fileSize: 2457600,
    downloadUrl: '/api/v1/files/file-001/download',
    category: 'DOCUMENT',
    uploaderId: 'emp-003',
    uploaderName: '이영희',
    createdAt: format(subDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-002',
    originalName: '프로필사진_홍길동.jpg',
    contentType: 'image/jpeg',
    fileSize: 524288,
    downloadUrl: '/api/v1/files/file-002/download',
    category: 'PROFILE',
    uploaderId: 'emp-001',
    uploaderName: '홍길동',
    createdAt: format(subDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-003',
    originalName: '재직증명서_홍길동.pdf',
    contentType: 'application/pdf',
    fileSize: 153600,
    downloadUrl: '/api/v1/files/file-003/download',
    category: 'ATTACHMENT',
    uploaderId: 'emp-003',
    uploaderName: '이영희',
    createdAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-004',
    originalName: '결재첨부_경비청구.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 102400,
    downloadUrl: '/api/v1/files/file-004/download',
    category: 'ATTACHMENT',
    uploaderId: 'emp-003',
    uploaderName: '이영희',
    createdAt: format(subDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-005',
    originalName: '회사로고_투명배경.png',
    contentType: 'image/png',
    fileSize: 81920,
    downloadUrl: '/api/v1/files/file-005/download',
    category: 'DOCUMENT',
    uploaderId: 'emp-007',
    uploaderName: '강하늘',
    createdAt: format(subDays(new Date(), 60), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 60), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-006',
    originalName: '이력서_김지원.pdf',
    contentType: 'application/pdf',
    fileSize: 307200,
    downloadUrl: '/api/v1/files/file-006/download',
    category: 'DOCUMENT',
    uploaderId: 'emp-003',
    uploaderName: '이영희',
    createdAt: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-007',
    originalName: '휴가계획서_2024.pdf',
    contentType: 'application/pdf',
    fileSize: 204800,
    downloadUrl: '/api/v1/files/file-007/download',
    category: 'ATTACHMENT',
    uploaderId: 'emp-002',
    uploaderName: '김철수',
    createdAt: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-008',
    originalName: '기타자료_백업.zip',
    contentType: 'application/zip',
    fileSize: 51200,
    downloadUrl: '/api/v1/files/file-008/download',
    category: 'ATTACHMENT',
    uploaderId: 'emp-001',
    uploaderName: '홍길동',
    createdAt: format(subDays(new Date(), 15), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 15), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-009',
    originalName: '2024년_신년사.pdf',
    contentType: 'application/pdf',
    fileSize: 122880,
    downloadUrl: '/api/v1/files/file-009/download',
    category: 'DOCUMENT',
    uploaderId: 'emp-005',
    uploaderName: '최수진',
    createdAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-010',
    originalName: '조직도_2024.png',
    contentType: 'image/png',
    fileSize: 614400,
    downloadUrl: '/api/v1/files/file-010/download',
    category: 'DOCUMENT',
    uploaderId: 'emp-003',
    uploaderName: '이영희',
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
    const originalName = url.searchParams.get('originalName') || '';

    let filtered = [...mockFiles];

    if (category) {
      filtered = filtered.filter((f) => f.category === category);
    }

    if (originalName) {
      const lower = originalName.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.originalName.toLowerCase().includes(lower) ||
          (f.uploaderName && f.uploaderName.toLowerCase().includes(lower))
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
    const newFileId = `file-${Date.now()}`;
    const newFile = {
      id: newFileId,
      originalName: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
      downloadUrl: `/api/v1/files/${newFileId}/download`,
      category,
      uploaderId: 'emp-001',
      uploaderName: '홍길동',
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

    return new HttpResponse(new Blob(['Mock file content'], { type: file.contentType }), {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      },
    });
  }),
];
