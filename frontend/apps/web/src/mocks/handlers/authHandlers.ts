import { http, HttpResponse, delay } from 'msw';

const mockUser = {
  id: 'user-001',
  employeeId: 'emp-001',
  employeeNumber: 'EMP2024001',
  name: '홍길동',
  email: 'hong@example.com',
  departmentId: 'dept-001',
  departmentName: '개발팀',
  positionName: '팀장',
  gradeName: '부장',
  profileImageUrl: undefined,
  roles: ['ROLE_EMPLOYEE', 'ROLE_MANAGER'],
  permissions: [
    'employee:read',
    'employee:write',
    'attendance:read',
    'attendance:write',
    'approval:read',
    'approval:write',
  ],
};

const mockTenant = {
  id: 'tenant-001',
  code: 'DEMO',
  name: '데모 회사',
  nameEn: 'Demo Company',
  logoUrl: undefined,
  status: 'ACTIVE',
};

export const authHandlers = [
  // Login
  http.post('/api/v1/auth/login', async ({ request }) => {
    await delay(500);

    const body = await request.json() as { username?: string; password?: string };
    const { username, password } = body;

    if (username === 'demo' && password === 'demo1234') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUser,
          accessToken: 'mock-access-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
          tenant: mockTenant,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_001',
          message: '아이디 또는 비밀번호가 올바르지 않습니다.',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }),

  // Logout
  http.post('/api/v1/auth/logout', async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: null,
      message: '로그아웃되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Refresh token
  http.post('/api/v1/auth/refresh', async ({ request }) => {
    await delay(200);

    const body = await request.json() as { refreshToken?: string };
    const { refreshToken } = body;

    if (refreshToken && refreshToken.startsWith('mock-refresh-token-')) {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'mock-access-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
        },
        timestamp: new Date().toISOString(),
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_002',
          message: '세션이 만료되었습니다.',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    );
  }),

  // Get current user
  http.get('/api/v1/auth/me', async ({ request }) => {
    await delay(300);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer mock-access-token-')) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_003',
            message: '인증이 필요합니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: mockUser,
      timestamp: new Date().toISOString(),
    });
  }),
];
