import axios from 'axios';
import { apiClient, ApiResponse } from '@/lib/apiClient';
import { isMockEnabled } from '@/lib/featureFlags';
import { User } from '@/stores/authStore';
import { Tenant } from '@/stores/tenantStore';
import {
  findMockUser,
  generateMockToken,
  getAvailableTenants,
  getDefaultTenant,
  MockUser,
} from './mockAuthData';

export interface LoginRequest {
  username: string;
  password: string;
  tenantCode?: string;
}

// 백엔드 TokenResponse 매핑
export interface BackendTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tenantId?: string;
  tenantCode?: string;
  tenantName?: string;
}

// 백엔드 UserResponse 매핑
export interface BackendUserResponse {
  id: string;
  employeeId: string;
  employeeNumber: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  positionName: string;
  gradeName: string;
  profileImageUrl?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tenant: Tenant;
  availableTenants: Tenant[];
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 백엔드 SessionResponse 대응
export interface Session {
  sessionId: string;
  deviceInfo: string;
  ipAddress: string;
  location: string;
  createdAt: string;
  lastAccessedAt: string;
  currentSession: boolean;
}

const isAuthMocked = isMockEnabled('auth');

// API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// JWT payload에서 tenantId 추출
function extractTenantFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.tenant_id || null;
  } catch {
    return null;
  }
}

// Mock 로그인 처리
async function mockLogin(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  // 시뮬레이션 딜레이 (실제 API 호출처럼 보이도록)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user = findMockUser(data.username, data.password);

  if (!user) {
    throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
  }

  // MockUser에서 password 제외한 User 객체 생성
  const { password: _, ...userData } = user as MockUser;

  // 역할에 따라 접근 가능한 테넌트 결정
  const availableTenants = getAvailableTenants(user.roles);
  const defaultTenant = getDefaultTenant(user.roles);

  const response: LoginResponse = {
    user: userData,
    accessToken: generateMockToken(user.id),
    refreshToken: generateMockToken(user.id + '-refresh'),
    tenant: defaultTenant,
    availableTenants: availableTenants,
  };

  return {
    success: true,
    data: response,
    message: '로그인 성공',
    timestamp: new Date().toISOString(),
  };
}

// Mock 로그아웃 처리
async function mockLogout(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));
}

// Mock 토큰 갱신
async function mockRefreshToken(_refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    success: true,
    data: {
      accessToken: generateMockToken('refreshed'),
      refreshToken: generateMockToken('refreshed-refresh'),
    },
    message: '토큰 갱신 성공',
    timestamp: new Date().toISOString(),
  };
}

// Mock 현재 사용자 조회
async function mockGetCurrentUser(): Promise<ApiResponse<User>> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  // 저장된 사용자 정보 반환 (실제로는 localStorage에서 가져옴)
  const storedAuth = localStorage.getItem('hr-platform-auth');
  if (storedAuth) {
    const { state } = JSON.parse(storedAuth);
    if (state?.user) {
      return {
        success: true,
        data: state.user,
        message: '사용자 정보 조회 성공',
        timestamp: new Date().toISOString(),
      };
    }
  }

  throw new Error('인증 정보가 없습니다.');
}

// Mock 비밀번호 변경
async function mockChangePassword(data: PasswordChangeRequest): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 간단한 검증 (실제로는 서버에서 처리)
  if (data.currentPassword.length < 4) {
    throw new Error('현재 비밀번호가 올바르지 않습니다.');
  }

  if (data.newPassword.length < 8) {
    throw new Error('새 비밀번호는 8자 이상이어야 합니다.');
  }

  return {
    success: true,
    data: null,
    message: '비밀번호가 변경되었습니다.',
    timestamp: new Date().toISOString(),
  };
}

// Mock 세션 목록 조회
async function mockGetSessions(): Promise<ApiResponse<Session[]>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const sessions: Session[] = [
    {
      sessionId: '1',
      deviceInfo: 'Chrome on Windows',
      ipAddress: '192.168.1.1',
      location: 'Seoul, South Korea',
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      currentSession: true,
    },
    {
      sessionId: '2',
      deviceInfo: 'Safari on iPhone',
      ipAddress: '192.168.1.2',
      location: 'Seoul, South Korea',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      lastAccessedAt: new Date(Date.now() - 3600000).toISOString(),
      currentSession: false,
    },
  ];

  return {
    success: true,
    data: sessions,
    message: '세션 목록 조회 성공',
    timestamp: new Date().toISOString(),
  };
}

// Mock 세션 로그아웃
async function mockLogoutSession(sessionId: string): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    success: true,
    data: null,
    message: `세션 ${sessionId}이 로그아웃되었습니다.`,
    timestamp: new Date().toISOString(),
  };
}

// Mock 모든 세션 로그아웃
async function mockLogoutAllSessions(): Promise<ApiResponse<null>> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    success: true,
    data: null,
    message: '모든 세션이 로그아웃되었습니다.',
    timestamp: new Date().toISOString(),
  };
}

// 실제 백엔드 로그인 처리
async function realLogin(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  // 1. 먼저 토큰 발급
  const tokenResponse = await axios.post<ApiResponse<BackendTokenResponse>>(
    `${API_BASE_URL}/auth/login`,
    {
      username: data.username,
      password: data.password,
    }
  );

  const tokens = tokenResponse.data.data;

  // 2. 토큰으로 사용자 정보 조회
  const userResponse = await axios.get<ApiResponse<BackendUserResponse>>(
    `${API_BASE_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    }
  );

  const backendUser = userResponse.data.data;

  // 3. User 객체로 변환
  const user: User = {
    id: backendUser.id,
    employeeId: backendUser.employeeId,
    employeeNumber: backendUser.employeeNumber || '',
    name: backendUser.name,
    email: backendUser.email,
    departmentId: backendUser.departmentId,
    departmentName: backendUser.departmentName || '',
    positionName: backendUser.positionName || '',
    gradeName: backendUser.gradeName || '',
    profileImageUrl: backendUser.profileImageUrl,
    roles: backendUser.roles || [],
    permissions: backendUser.permissions || [],
  };

  // 4. 백엔드 응답에서 테넌트 정보 추출 (JWT 폴백)
  const tenantId = tokens.tenantId || extractTenantFromToken(tokens.accessToken);
  const defaultTenant: Tenant = {
    id: tenantId || 'unknown',
    code: tokens.tenantCode || 'UNKNOWN',
    name: tokens.tenantName || '테넌트',
    status: 'ACTIVE',
  };

  return {
    success: true,
    data: {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tenant: defaultTenant,
      availableTenants: [defaultTenant],
    },
    message: '로그인 성공',
    timestamp: new Date().toISOString(),
  };
}

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    if (isAuthMocked) {
      return mockLogin(data);
    }
    return realLogin(data);
  },

  async logout(): Promise<void> {
    if (isAuthMocked) {
      return mockLogout();
    }
    await apiClient.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    if (isAuthMocked) {
      return mockRefreshToken(refreshToken);
    }
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>('/auth/token/refresh', {
      refreshToken,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    if (isAuthMocked) {
      return mockGetCurrentUser();
    }
    const response = await apiClient.get<ApiResponse<BackendUserResponse>>('/auth/me');
    const backendUser = response.data.data;

    // BackendUserResponse -> User 변환
    const user: User = {
      id: backendUser.id,
      employeeId: backendUser.employeeId,
      employeeNumber: backendUser.employeeNumber || '',
      name: backendUser.name,
      email: backendUser.email,
      departmentId: backendUser.departmentId,
      departmentName: backendUser.departmentName || '',
      positionName: backendUser.positionName || '',
      gradeName: backendUser.gradeName || '',
      profileImageUrl: backendUser.profileImageUrl,
      roles: backendUser.roles || [],
      permissions: backendUser.permissions || [],
    };

    return {
      success: true,
      data: user,
      message: response.data.message,
      timestamp: response.data.timestamp,
    };
  },

  async changePassword(data: PasswordChangeRequest): Promise<ApiResponse<null>> {
    if (isAuthMocked) {
      return mockChangePassword(data);
    }
    const response = await apiClient.post<ApiResponse<null>>('/auth/password/change', data);
    return response.data;
  },

  async getSessions(): Promise<ApiResponse<Session[]>> {
    if (isAuthMocked) {
      return mockGetSessions();
    }
    const response = await apiClient.get<ApiResponse<Session[]>>('/auth/sessions');
    return response.data;
  },

  async logoutSession(sessionId: string): Promise<ApiResponse<null>> {
    if (isAuthMocked) {
      return mockLogoutSession(sessionId);
    }
    const response = await apiClient.delete<ApiResponse<null>>(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  async logoutAllSessions(): Promise<ApiResponse<null>> {
    if (isAuthMocked) {
      return mockLogoutAllSessions();
    }
    const response = await apiClient.delete<ApiResponse<null>>('/auth/sessions');
    return response.data;
  },
};
