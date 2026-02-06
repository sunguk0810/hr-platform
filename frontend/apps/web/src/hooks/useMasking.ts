import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { applyMask, shouldUnmask, type MaskingType } from '@/utils/masking';

/**
 * Hook that provides privacy masking utilities based on the current user's
 * role and department.
 *
 * Usage:
 * ```tsx
 * const { maskValue, canUnmask } = useMasking();
 *
 * // Returns masked value unless user has permission to view raw data
 * const phone = maskValue('phone', employee.phone, employee.departmentId);
 *
 * // Check if user can see unmasked data for a specific department
 * if (canUnmask(employee.departmentId)) { ... }
 * ```
 */
export function useMasking() {
  const { user } = useAuthStore();

  const highestRole = useMemo(() => {
    if (!user?.roles?.length) return 'EMPLOYEE';

    const roleHierarchy: Record<string, number> = {
      SUPER_ADMIN: 7,
      GROUP_ADMIN: 6,
      TENANT_ADMIN: 5,
      HR_MANAGER: 4,
      DEPT_MANAGER: 3,
      TEAM_LEADER: 2,
      EMPLOYEE: 1,
    };

    let highest = 'EMPLOYEE';
    let highestLevel = 0;

    for (const role of user.roles) {
      const level = roleHierarchy[role] ?? 0;
      if (level > highestLevel) {
        highestLevel = level;
        highest = role;
      }
    }

    return highest;
  }, [user?.roles]);

  const userDepartmentId = user?.departmentId ?? '';

  /**
   * Check whether the current user can view unmasked data
   * for a target department.
   */
  const canUnmask = useCallback(
    (targetDepartmentId: string): boolean => {
      return shouldUnmask(highestRole, targetDepartmentId, userDepartmentId);
    },
    [highestRole, userDepartmentId]
  );

  /**
   * Apply masking to a value unless the current user has permission
   * to view raw data for the given target department.
   *
   * @param type - The type of data to mask (phone, email, etc.)
   * @param value - The raw value
   * @param targetDepartmentId - Department of the data subject
   * @returns Masked or unmasked value depending on user permissions
   */
  const maskValue = useCallback(
    (type: MaskingType, value: string, targetDepartmentId: string): string => {
      if (!value) return '';

      if (shouldUnmask(highestRole, targetDepartmentId, userDepartmentId)) {
        return value;
      }

      return applyMask(type, value);
    },
    [highestRole, userDepartmentId]
  );

  return { maskValue, canUnmask };
}
