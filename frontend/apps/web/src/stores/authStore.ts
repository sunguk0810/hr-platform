import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * PRD-based role hierarchy.
 * Higher roles inherit all permissions of lower roles.
 *
 * SUPER_ADMIN > GROUP_ADMIN > TENANT_ADMIN > HR_MANAGER > DEPT_MANAGER > TEAM_LEADER > EMPLOYEE
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  GROUP_ADMIN: 'GROUP_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  DEPT_MANAGER: 'DEPT_MANAGER',
  TEAM_LEADER: 'TEAM_LEADER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role hierarchy levels (higher number = higher authority).
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.SUPER_ADMIN]: 7,
  [ROLES.GROUP_ADMIN]: 6,
  [ROLES.TENANT_ADMIN]: 5,
  [ROLES.HR_MANAGER]: 4,
  [ROLES.DEPT_MANAGER]: 3,
  [ROLES.TEAM_LEADER]: 2,
  [ROLES.EMPLOYEE]: 1,
};

export interface User {
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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setTenantId: (tenantId: string) => void;
  login: (user: User, accessToken: string, refreshToken: string, tenantId: string) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;

  // Helpers
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;

  // Role hierarchy helpers
  isAtLeast: (role: Role) => boolean;
  isSuperAdmin: () => boolean;
  isGroupAdmin: () => boolean;
  isTenantAdmin: () => boolean;
  isHrManager: () => boolean;
  isDeptManager: () => boolean;
  isTeamLeader: () => boolean;
  getHighestRole: () => Role | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setTenantId: (tenantId) => set({ tenantId }),

      login: (user, accessToken, refreshToken, tenantId) =>
        set({
          user,
          accessToken,
          refreshToken,
          tenantId,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      hasRole: (role) => {
        const { user } = get();
        return user?.roles?.includes(role) ?? false;
      },

      hasPermission: (permission) => {
        const { user } = get();
        const userPermissions = user?.permissions ?? [];

        // Wildcard check
        if (userPermissions.includes('*:*')) return true;

        // Direct match
        if (userPermissions.includes(permission)) return true;

        // Resource wildcard check (e.g., employee:* matches employee:read)
        const [resource] = permission.split(':');
        if (resource && userPermissions.includes(`${resource}:*`)) return true;

        // Broader scope check (e.g., employee:read matches employee:read:self)
        const parts = permission.split(':');
        if (parts.length === 3) {
          const broaderPerm = `${parts[0]}:${parts[1]}`;
          if (userPermissions.includes(broaderPerm)) return true;
        }

        return false;
      },

      hasAnyRole: (roles) => {
        const { user } = get();
        if (!user?.roles?.length) return false;
        // Check with role hierarchy: user's role at or above any required role
        return roles.some((requiredRole) => {
          const requiredLevel = ROLE_HIERARCHY[requiredRole as Role] ?? 0;
          return user.roles.some((userRole) => {
            const userLevel = ROLE_HIERARCHY[userRole as Role] ?? 0;
            return userLevel >= requiredLevel;
          });
        });
      },

      hasAnyPermission: (permissions) => {
        const { hasPermission } = get();
        return permissions.some((p) => hasPermission(p));
      },

      isAtLeast: (role) => {
        const { user } = get();
        if (!user?.roles?.length) return false;

        const requiredLevel = ROLE_HIERARCHY[role] ?? 0;
        return user.roles.some((r) => {
          const userLevel = ROLE_HIERARCHY[r as Role] ?? 0;
          return userLevel >= requiredLevel;
        });
      },

      isSuperAdmin: () => get().hasRole(ROLES.SUPER_ADMIN),

      isGroupAdmin: () => get().isAtLeast(ROLES.GROUP_ADMIN),

      isTenantAdmin: () => get().isAtLeast(ROLES.TENANT_ADMIN),

      isHrManager: () => get().isAtLeast(ROLES.HR_MANAGER),

      isDeptManager: () => get().isAtLeast(ROLES.DEPT_MANAGER),

      isTeamLeader: () => get().isAtLeast(ROLES.TEAM_LEADER),

      getHighestRole: () => {
        const { user } = get();
        if (!user?.roles?.length) return null;

        let highest: Role | null = null;
        let highestLevel = 0;

        for (const role of user.roles) {
          const level = ROLE_HIERARCHY[role as Role] ?? 0;
          if (level > highestLevel) {
            highestLevel = level;
            highest = role as Role;
          }
        }

        return highest;
      },
    }),
    {
      name: 'hr-platform-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tenantId: state.tenantId,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
