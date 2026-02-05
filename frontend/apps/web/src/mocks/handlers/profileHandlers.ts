import { http, HttpResponse, delay } from 'msw';

// Mock user profile data
const mockProfile = {
  id: 'emp-001',
  employeeNumber: 'EMP2024001',
  name: '홍길동',
  nameEn: 'Gil-dong Hong',
  email: 'hong@company.com',
  mobile: '010-1234-5678',
  birthDate: '1990-05-15',
  hireDate: '2020-03-01',
  departmentId: 'dept-001',
  departmentName: '개발팀',
  positionId: 'pos-003',
  positionName: '팀장',
  gradeId: 'grade-002',
  gradeName: '과장',
  profileImageUrl: null as string | null,
};

export const profileHandlers = [
  // Get my profile
  http.get('/api/v1/profile/me', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: mockProfile,
      timestamp: new Date().toISOString(),
    });
  }),

  // Update my profile
  http.put('/api/v1/profile/me', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as Record<string, unknown>;

    // Update mock profile
    if (body.email) mockProfile.email = body.email as string;
    if (body.mobile) mockProfile.mobile = body.mobile as string;
    if (body.nameEn) mockProfile.nameEn = body.nameEn as string;

    return HttpResponse.json({
      success: true,
      data: mockProfile,
      message: '프로필이 수정되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Upload profile photo
  http.post('/api/v1/profile/me/photo', async ({ request }) => {
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

    const mockUrl = `https://storage.example.com/profiles/${mockProfile.id}/${Date.now()}.jpg`;
    mockProfile.profileImageUrl = mockUrl;

    return HttpResponse.json({
      success: true,
      data: {
        url: mockUrl,
        filename: file.name,
      },
      message: '프로필 사진이 업로드되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete profile photo
  http.delete('/api/v1/profile/me/photo', async () => {
    await delay(200);

    mockProfile.profileImageUrl = null;

    return HttpResponse.json({
      success: true,
      data: null,
      message: '프로필 사진이 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),
];
