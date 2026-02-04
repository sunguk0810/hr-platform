import { http, HttpResponse, delay } from 'msw';
import { format, subDays } from 'date-fns';

// Types
export type FileType = 'PDF' | 'IMAGE' | 'DOCUMENT' | 'SPREADSHEET' | 'OTHER';

export interface FileMeta {
  id: string;
  originalName: string;
  storageName: string;
  mimeType: string;
  size: number;
  fileType: FileType;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  url?: string;
}

// Helper function
function getFileType(mimeType: string): FileType {
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCUMENT';
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType === 'text/csv') return 'SPREADSHEET';
  return 'OTHER';
}

// Mock data
const mockFiles: FileMeta[] = [
  {
    id: 'file-001',
    originalName: '2024년_인사규정.pdf',
    storageName: 'a1b2c3d4-인사규정.pdf',
    mimeType: 'application/pdf',
    size: 2457600, // 2.4MB
    fileType: 'PDF',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-002',
    originalName: '프로필사진_홍길동.jpg',
    storageName: 'e5f6g7h8-프로필.jpg',
    mimeType: 'image/jpeg',
    size: 524288, // 512KB
    fileType: 'IMAGE',
    uploadedBy: 'emp-001',
    uploadedByName: '홍길동',
    createdAt: format(subDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-003',
    originalName: '출장보고서_서울.docx',
    storageName: 'i9j0k1l2-출장보고서.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 153600, // 150KB
    fileType: 'DOCUMENT',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-004',
    originalName: '직원명단_2024.xlsx',
    storageName: 'm3n4o5p6-직원명단.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 102400, // 100KB
    fileType: 'SPREADSHEET',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-005',
    originalName: '로고_투명배경.png',
    storageName: 'q7r8s9t0-로고.png',
    mimeType: 'image/png',
    size: 81920, // 80KB
    fileType: 'IMAGE',
    uploadedBy: 'emp-007',
    uploadedByName: '강하늘',
    createdAt: format(subDays(new Date(), 60), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-006',
    originalName: '경비청구서_2024-01.pdf',
    storageName: 'u1v2w3x4-경비청구서.pdf',
    mimeType: 'application/pdf',
    size: 307200, // 300KB
    fileType: 'PDF',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-007',
    originalName: '휴가계획서.pdf',
    storageName: 'y5z6a7b8-휴가계획서.pdf',
    mimeType: 'application/pdf',
    size: 204800, // 200KB
    fileType: 'PDF',
    uploadedBy: 'emp-002',
    uploadedByName: '김철수',
    createdAt: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-008',
    originalName: '프로젝트_일정표.csv',
    storageName: 'c9d0e1f2-일정표.csv',
    mimeType: 'text/csv',
    size: 51200, // 50KB
    fileType: 'SPREADSHEET',
    uploadedBy: 'emp-001',
    uploadedByName: '홍길동',
    createdAt: format(subDays(new Date(), 15), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-009',
    originalName: '회의록_2024-02.docx',
    storageName: 'g3h4i5j6-회의록.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 122880, // 120KB
    fileType: 'DOCUMENT',
    uploadedBy: 'emp-005',
    uploadedByName: '최수진',
    createdAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'file-010',
    originalName: '조직도_2024.png',
    storageName: 'k7l8m9n0-조직도.png',
    mimeType: 'image/png',
    size: 614400, // 600KB
    fileType: 'IMAGE',
    uploadedBy: 'emp-003',
    uploadedByName: '이영희',
    createdAt: format(subDays(new Date(), 20), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
];

export const fileHandlers = [
  // Upload file
  http.post('/api/v1/files/upload', async ({ request }) => {
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

    const newFile: FileMeta = {
      id: `file-${Date.now()}`,
      originalName: file.name,
      storageName: `${Date.now()}-${file.name}`,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      fileType: getFileType(file.type),
      uploadedBy: 'emp-001',
      uploadedByName: '홍길동',
      createdAt: new Date().toISOString(),
    };

    mockFiles.unshift(newFile);

    return HttpResponse.json({
      success: true,
      data: newFile,
      message: '파일이 업로드되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Get file metadata
  http.get('/api/v1/files/:id', async ({ params }) => {
    await delay(100);

    const { id } = params;
    const file = mockFiles.find(f => f.id === id);

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

  // Get download URL
  http.get('/api/v1/files/:id/download-url', async ({ params }) => {
    await delay(100);

    const { id } = params;
    const file = mockFiles.find(f => f.id === id);

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

    // Generate mock signed URL
    const signedUrl = `https://storage.example.com/files/${file.storageName}?token=mock-token-${Date.now()}&expires=${Date.now() + 3600000}`;

    return HttpResponse.json({
      success: true,
      data: {
        url: signedUrl,
        expiresIn: 3600, // 1 hour
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete file
  http.delete('/api/v1/files/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const index = mockFiles.findIndex(f => f.id === id);

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

  // Get files list
  http.get('/api/v1/files', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const fileType = url.searchParams.get('fileType') as FileType | null;
    const keyword = url.searchParams.get('keyword') || '';

    let filtered = [...mockFiles];

    if (fileType) {
      filtered = filtered.filter(f => f.fileType === fileType);
    }

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(f =>
        f.originalName.toLowerCase().includes(lower) ||
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
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),
];
