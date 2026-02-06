/**
 * Privacy masking utility functions.
 *
 * Provides data masking for various PII types to comply with
 * Korean privacy regulations (PIPA / 개인정보보호법).
 */

export type MaskingType =
  | 'phone'
  | 'email'
  | 'residentNumber'
  | 'accountNumber'
  | 'address'
  | 'name';

/**
 * Mask a phone number.
 * Input:  010-1234-5678  or  01012345678
 * Output: 010-****-5678
 */
export function maskPhone(value: string): string {
  if (!value) return '';
  // Remove non-digit characters to normalize
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length < 10) return value;

  // Format as XXX-****-XXXX
  const prefix = digits.slice(0, 3);
  const suffix = digits.slice(-4);
  return `${prefix}-****-${suffix}`;
}

/**
 * Mask an email address.
 * Input:  hong@example.com
 * Output: h***@example.com
 */
export function maskEmail(value: string): string {
  if (!value) return '';
  const atIndex = value.indexOf('@');
  if (atIndex <= 0) return value;

  const localPart = value.slice(0, atIndex);
  const domain = value.slice(atIndex);

  if (localPart.length <= 1) {
    return `${localPart}***${domain}`;
  }

  return `${localPart[0]}***${domain}`;
}

/**
 * Mask a Korean resident registration number.
 * Input:  880101-1234567
 * Output: 880101-1******
 */
export function maskResidentNumber(value: string): string {
  if (!value) return '';
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length < 7) return value;

  const front = digits.slice(0, 6);
  const genderDigit = digits[6];
  return `${front}-${genderDigit}******`;
}

/**
 * Mask a bank account number.
 * Input:  1234-5678-9012-3456
 * Output: ****-****-****-3456
 */
export function maskAccountNumber(value: string): string {
  if (!value) return '';
  // Remove non-digit characters
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length < 4) return value;

  const lastFour = digits.slice(-4);
  // Rebuild with masked groups
  const maskedLength = digits.length - 4;
  const groups: string[] = [];
  let pos = 0;

  // Create ****- groups for the masked portion
  while (pos < maskedLength) {
    const groupSize = Math.min(4, maskedLength - pos);
    groups.push('*'.repeat(groupSize));
    pos += groupSize;
  }
  groups.push(lastFour);

  return groups.join('-');
}

/**
 * Mask a Korean address.
 * Keeps the city/province (시/도) and masks the rest.
 * Input:  서울특별시 강남구 역삼동 123-45
 * Output: 서울특별시 *** ***
 */
export function maskAddress(value: string): string {
  if (!value) return '';
  const parts = value.split(' ');
  if (parts.length <= 1) return value;

  // Keep the first part (city/province) and mask the rest
  const city = parts[0];
  const maskedParts = parts.slice(1).map(() => '***');
  return `${city} ${maskedParts.join(' ')}`;
}

/**
 * Mask a Korean name.
 * Input:  홍길동 -> 홍*동
 * Input:  김수  -> 김*
 * Input:  제갈공명 -> 제***명
 */
export function maskName(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();

  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) {
    return `${trimmed[0]}*`;
  }

  // Keep first and last character, mask the middle
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  const middle = '*'.repeat(trimmed.length - 2);
  return `${first}${middle}${last}`;
}

/**
 * Map of masking type to masking function.
 */
const maskingFunctions: Record<MaskingType, (value: string) => string> = {
  phone: maskPhone,
  email: maskEmail,
  residentNumber: maskResidentNumber,
  accountNumber: maskAccountNumber,
  address: maskAddress,
  name: maskName,
};

/**
 * Apply masking based on type.
 */
export function applyMask(type: MaskingType, value: string): string {
  const fn = maskingFunctions[type];
  if (!fn) return value;
  return fn(value);
}

/**
 * Roles that are considered HR_MANAGER level or above for unmasking.
 */
const UNMASK_ROLES = ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'];

/**
 * Determine whether a user should be able to view unmasked (raw) data.
 *
 * - HR_MANAGER and above: always unmask
 * - DEPT_MANAGER: unmask only when viewing their own department
 * - Others: never unmask
 */
export function shouldUnmask(
  userRole: string,
  targetDepartmentId: string,
  userDepartmentId: string
): boolean {
  // HR_MANAGER and above can always unmask
  if (UNMASK_ROLES.includes(userRole)) {
    return true;
  }

  // DEPT_MANAGER can unmask only for their own department
  if (userRole === 'DEPT_MANAGER') {
    return targetDepartmentId === userDepartmentId;
  }

  // All other roles: never unmask
  return false;
}
