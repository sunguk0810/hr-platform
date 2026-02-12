import { describe, it, expect } from 'vitest';
import {
  maskPhone,
  maskEmail,
  maskResidentNumber,
  maskAccountNumber,
  maskAddress,
  maskName,
  applyMask,
  shouldUnmask,
} from '../masking';

describe('masking utils', () => {
  describe('maskPhone', () => {
    it('should return empty string for empty input', () => {
      expect(maskPhone('')).toBe('');
    });

    it('should return original value if less than 10 digits', () => {
      expect(maskPhone('123')).toBe('123');
      expect(maskPhone('123-456')).toBe('123-456');
    });

    it('should mask valid phone number with dashes', () => {
      expect(maskPhone('010-1234-5678')).toBe('010-****-5678');
    });

    it('should mask valid phone number without dashes', () => {
      expect(maskPhone('01012345678')).toBe('010-****-5678');
    });

    it('should handle non-digit characters correctly', () => {
      expect(maskPhone('010.1234.5678')).toBe('010-****-5678');
    });
  });

  describe('maskEmail', () => {
    it('should return empty string for empty input', () => {
      expect(maskEmail('')).toBe('');
    });

    it('should return original value if no @ symbol', () => {
      expect(maskEmail('invalid-email')).toBe('invalid-email');
    });

    it('should return original value if @ is the first character', () => {
      expect(maskEmail('@example.com')).toBe('@example.com');
    });

    it('should mask standard email', () => {
      expect(maskEmail('hong@example.com')).toBe('h***@example.com');
    });

    it('should mask short local part email', () => {
      expect(maskEmail('a@example.com')).toBe('a***@example.com');
      expect(maskEmail('ab@example.com')).toBe('a***@example.com');
    });
  });

  describe('maskResidentNumber', () => {
    it('should return empty string for empty input', () => {
      expect(maskResidentNumber('')).toBe('');
    });

    it('should return original value if less than 7 digits', () => {
      expect(maskResidentNumber('123456')).toBe('123456');
    });

    it('should mask valid resident number with hyphen', () => {
      expect(maskResidentNumber('880101-1234567')).toBe('880101-1******');
    });

    it('should mask valid resident number without hyphen', () => {
      expect(maskResidentNumber('8801011234567')).toBe('880101-1******');
    });
  });

  describe('maskAccountNumber', () => {
    it('should return empty string for empty input', () => {
      expect(maskAccountNumber('')).toBe('');
    });

    it('should return original value if less than 4 digits', () => {
      expect(maskAccountNumber('123')).toBe('123');
    });

    it('should mask account number correctly', () => {
      // 16 digits: ****-****-****-3456
      expect(maskAccountNumber('1234-5678-9012-3456')).toBe('****-****-****-3456');
    });

    it('should handle account number without dashes', () => {
      // 16 digits: ****-****-****-3456
      expect(maskAccountNumber('1234567890123456')).toBe('****-****-****-3456');
    });

    it('should handle shorter account numbers', () => {
      // 10 digits: ****-****-90
      // 4 masked, 4 masked, 2 visible? No, logic is: last 4 visible, rest masked in groups of 4.
      // 1234567890 -> last 4 is 7890. Remaining is 123456 (length 6).
      // pos 0: groupSize min(4, 6-0) = 4. groups=['****']. pos=4.
      // pos 4: groupSize min(4, 6-4) = 2. groups=['****', '**']. pos=6.
      // groups push lastFour (7890).
      // result: ****-**-7890
      expect(maskAccountNumber('1234567890')).toBe('****-**-7890');
    });
  });

  describe('maskAddress', () => {
    it('should return empty string for empty input', () => {
      expect(maskAddress('')).toBe('');
    });

    it('should return original value if only one part', () => {
      expect(maskAddress('Seoul')).toBe('Seoul');
    });

    it('should mask address correctly', () => {
      expect(maskAddress('서울특별시 강남구 역삼동 123-45')).toBe('서울특별시 *** *** ***');
    });

    it('should handle two part address', () => {
        expect(maskAddress('Seoul Gangnam')).toBe('Seoul ***');
    });
  });

  describe('maskName', () => {
    it('should return empty string for empty input', () => {
      expect(maskName('')).toBe('');
    });

    it('should return trimmed value if length <= 1', () => {
      expect(maskName('A')).toBe('A');
      expect(maskName(' A ')).toBe('A');
    });

    it('should mask 2 character name', () => {
      expect(maskName('AB')).toBe('A*');
      expect(maskName('김수')).toBe('김*');
    });

    it('should mask 3 character name', () => {
      expect(maskName('ABC')).toBe('A*C');
      expect(maskName('홍길동')).toBe('홍*동');
    });

    it('should mask long names', () => {
      expect(maskName('ABCD')).toBe('A**D');
      expect(maskName('제갈공명')).toBe('제**명');
    });
  });

  describe('applyMask', () => {
    it('should apply phone mask', () => {
      expect(applyMask('phone', '010-1234-5678')).toBe('010-****-5678');
    });

    it('should apply email mask', () => {
      expect(applyMask('email', 'test@example.com')).toBe('t***@example.com');
    });

    it('should return original value for unknown type', () => {
        // @ts-ignore
      expect(applyMask('unknown', 'value')).toBe('value');
    });
  });

  describe('shouldUnmask', () => {
    it('should return true for UNMASK_ROLES', () => {
      expect(shouldUnmask('SUPER_ADMIN', 'dept1', 'dept2')).toBe(true);
      expect(shouldUnmask('GROUP_ADMIN', 'dept1', 'dept2')).toBe(true);
      expect(shouldUnmask('TENANT_ADMIN', 'dept1', 'dept2')).toBe(true);
      expect(shouldUnmask('HR_MANAGER', 'dept1', 'dept2')).toBe(true);
    });

    it('should return true for DEPT_MANAGER with matching department', () => {
      expect(shouldUnmask('DEPT_MANAGER', 'dept1', 'dept1')).toBe(true);
    });

    it('should return false for DEPT_MANAGER with different department', () => {
      expect(shouldUnmask('DEPT_MANAGER', 'dept1', 'dept2')).toBe(false);
    });

    it('should return false for other roles', () => {
      expect(shouldUnmask('USER', 'dept1', 'dept1')).toBe(false);
      expect(shouldUnmask('GUEST', 'dept1', 'dept1')).toBe(false);
    });
  });
});
