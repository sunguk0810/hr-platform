import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../authService';
import { apiClient } from '@/lib/apiClient';

// Mock apiClient
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock import.meta.env
const originalEnv = import.meta.env;

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to non-development mode for testing actual API calls
    vi.stubGlobal('import.meta', {
      env: {
        ...originalEnv,
        DEV: false,
        VITE_ENABLE_MOCK: 'false',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('login', () => {
    it('should call login API with credentials', async () => {
      const loginRequest = {
        username: 'admin',
        password: 'password123',
        tenantCode: 'TENANT01',
      };

      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: '1',
              employeeId: 'emp-1',
              employeeNumber: 'EMP001',
              name: '관리자',
              email: 'admin@company.com',
              departmentId: 'dept-1',
              departmentName: '경영지원팀',
              positionName: '팀장',
              gradeName: 'G4',
              roles: ['ADMIN'],
              permissions: ['*'],
            },
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-123',
            tenant: {
              id: 'tenant-1',
              code: 'TENANT01',
              name: '테스트 회사',
              status: 'ACTIVE',
            },
          },
          message: '로그인 성공',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authService.login(loginRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', loginRequest);
      expect(result.success).toBe(true);
      expect(result.data.user.name).toBe('관리자');
      expect(result.data.accessToken).toBe('access-token-123');
    });

    it('should throw error for invalid credentials', async () => {
      const loginRequest = {
        username: 'wrong',
        password: 'wrong',
      };

      const error = {
        response: {
          status: 401,
          data: {
            success: false,
            error: {
              code: 'AUTH_001',
              message: '아이디 또는 비밀번호가 올바르지 않습니다.',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.login(loginRequest)).rejects.toEqual(error);
    });
  });

  describe('logout', () => {
    it('should call logout API', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: null });

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
          message: '토큰 갱신 성공',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authService.refreshToken('old-refresh-token');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'old-refresh-token',
      });
      expect(result.data.accessToken).toBe('new-access-token');
    });

    it('should throw error for expired refresh token', async () => {
      const error = {
        response: {
          status: 401,
          data: {
            success: false,
            error: {
              code: 'AUTH_002',
              message: '리프레시 토큰이 만료되었습니다.',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.refreshToken('expired-token')).rejects.toEqual(error);
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user info', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: '1',
            employeeId: 'emp-1',
            employeeNumber: 'EMP001',
            name: '홍길동',
            email: 'hong@company.com',
            departmentId: 'dept-1',
            departmentName: '개발팀',
            positionName: '선임',
            gradeName: 'G3',
            roles: ['USER'],
            permissions: ['read:employee'],
          },
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await authService.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result.data.name).toBe('홍길동');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const changeRequest = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      const mockResponse = {
        data: {
          success: true,
          data: null,
          message: '비밀번호가 변경되었습니다.',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authService.changePassword(changeRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', changeRequest);
      expect(result.success).toBe(true);
    });

    it('should throw error for incorrect current password', async () => {
      const changeRequest = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
      };

      const error = {
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'AUTH_003',
              message: '현재 비밀번호가 올바르지 않습니다.',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.changePassword(changeRequest)).rejects.toEqual(error);
    });
  });

  describe('getSessions', () => {
    it('should fetch active sessions', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: '1',
              device: 'Chrome on Windows',
              location: 'Seoul, South Korea',
              lastActive: '2024-01-01T10:00:00Z',
              current: true,
            },
            {
              id: '2',
              device: 'Safari on iPhone',
              location: 'Seoul, South Korea',
              lastActive: '2024-01-01T09:00:00Z',
              current: false,
            },
          ],
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await authService.getSessions();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/sessions');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].current).toBe(true);
    });
  });

  describe('logoutSession', () => {
    it('should logout specific session', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
          message: '세션 2이 로그아웃되었습니다.',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authService.logoutSession('2');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/sessions/2/logout');
      expect(result.success).toBe(true);
    });
  });

  describe('logoutAllSessions', () => {
    it('should logout all sessions', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: null,
          message: '모든 세션이 로그아웃되었습니다.',
          timestamp: '2024-01-01T00:00:00Z',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authService.logoutAllSessions();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/sessions/logout-all');
      expect(result.success).toBe(true);
    });
  });
});
