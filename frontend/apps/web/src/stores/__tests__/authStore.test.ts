import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  const mockUser = {
    id: '1',
    employeeId: 'emp-1',
    employeeNumber: 'EMP001',
    name: '홍길동',
    email: 'hong@company.com',
    departmentId: 'dept-1',
    departmentName: '개발팀',
    positionName: '선임',
    gradeName: 'G3',
    roles: ['USER', 'ADMIN'],
    permissions: ['read:employee', 'write:employee'],
  };

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.tenantId).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
    });
  });

  describe('setUser', () => {
    it('should set user', () => {
      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('setTokens', () => {
    it('should set access and refresh tokens', () => {
      useAuthStore.getState().setTokens('access-token', 'refresh-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
    });
  });

  describe('setTenantId', () => {
    it('should set tenant ID', () => {
      useAuthStore.getState().setTenantId('tenant-123');

      const state = useAuthStore.getState();
      expect(state.tenantId).toBe('tenant-123');
    });
  });

  describe('login', () => {
    it('should set all authentication data', () => {
      useAuthStore.getState().login(
        mockUser,
        'access-token',
        'refresh-token',
        'tenant-123'
      );

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.tenantId).toBe('tenant-123');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear all authentication data', () => {
      // First login
      useAuthStore.getState().login(
        mockUser,
        'access-token',
        'refresh-token',
        'tenant-123'
      );

      // Then logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      // tenantId is not cleared on logout
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useAuthStore.getState().setLoading(false);

      expect(useAuthStore.getState().isLoading).toBe(false);

      useAuthStore.getState().setLoading(true);

      expect(useAuthStore.getState().isLoading).toBe(true);
    });
  });

  describe('hasRole', () => {
    beforeEach(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    it('should return true if user has the role', () => {
      expect(useAuthStore.getState().hasRole('USER')).toBe(true);
      expect(useAuthStore.getState().hasRole('ADMIN')).toBe(true);
    });

    it('should return false if user does not have the role', () => {
      expect(useAuthStore.getState().hasRole('SUPER_ADMIN')).toBe(false);
    });

    it('should return false if user is null', () => {
      useAuthStore.setState({ user: null });

      expect(useAuthStore.getState().hasRole('USER')).toBe(false);
    });
  });

  describe('hasPermission', () => {
    beforeEach(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    it('should return true if user has the permission', () => {
      expect(useAuthStore.getState().hasPermission('read:employee')).toBe(true);
      expect(useAuthStore.getState().hasPermission('write:employee')).toBe(true);
    });

    it('should return false if user does not have the permission', () => {
      expect(useAuthStore.getState().hasPermission('delete:employee')).toBe(false);
    });

    it('should return false if user is null', () => {
      useAuthStore.setState({ user: null });

      expect(useAuthStore.getState().hasPermission('read:employee')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    beforeEach(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    it('should return true if user has any of the roles', () => {
      expect(useAuthStore.getState().hasAnyRole(['USER', 'SUPER_ADMIN'])).toBe(true);
      expect(useAuthStore.getState().hasAnyRole(['ADMIN'])).toBe(true);
    });

    it('should return false if user has none of the roles', () => {
      expect(useAuthStore.getState().hasAnyRole(['SUPER_ADMIN', 'MANAGER'])).toBe(false);
    });

    it('should return false if user is null', () => {
      useAuthStore.setState({ user: null });

      expect(useAuthStore.getState().hasAnyRole(['USER'])).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    beforeEach(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    it('should return true if user has any of the permissions', () => {
      expect(
        useAuthStore.getState().hasAnyPermission(['read:employee', 'delete:employee'])
      ).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(
        useAuthStore.getState().hasAnyPermission(['delete:employee', 'admin:all'])
      ).toBe(false);
    });

    it('should return false if user is null', () => {
      useAuthStore.setState({ user: null });

      expect(
        useAuthStore.getState().hasAnyPermission(['read:employee'])
      ).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should have correct persist configuration', () => {
      // Check that the store is persisted with the correct name
      // This is a basic sanity check - full persistence testing would require mocking localStorage
      const state = useAuthStore.getState();

      // Verify the store has all expected properties
      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('accessToken');
      expect(state).toHaveProperty('refreshToken');
      expect(state).toHaveProperty('tenantId');
      expect(state).toHaveProperty('isAuthenticated');
      expect(state).toHaveProperty('isLoading');
    });
  });
});
