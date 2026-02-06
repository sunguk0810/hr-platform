import { User } from '@/stores/authStore';
import { Tenant } from '@/stores/tenantStore';

/**
 * Mock Users for Testing
 * 한성그룹 샘플 데이터 기준 테스트 계정
 * @see scripts/sample-data/README.md
 */

export interface MockUser extends User {
  password: string;
}

export interface MockTenant extends Tenant {
  code: string;
}

// 한성그룹 계열사 목록 (8개)
export const mockTenants: MockTenant[] = [
  {
    id: 'tenant-hansung-hd',
    code: 'HANSUNG_HD',
    name: '한성홀딩스',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-hansung-elec',
    code: 'HANSUNG_ELEC',
    name: '한성전자',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-hansung-sdi',
    code: 'HANSUNG_SDI',
    name: '한성SDI',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-hansung-eng',
    code: 'HANSUNG_ENG',
    name: '한성엔지니어링',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-hansung-bio',
    code: 'HANSUNG_BIO',
    name: '한성바이오',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-hansung-chem',
    code: 'HANSUNG_CHEM',
    name: '한성화학',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-hansung-it',
    code: 'HANSUNG_IT',
    name: '한성IT서비스',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-hansung-life',
    code: 'HANSUNG_LIFE',
    name: '한성생명',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
];

// 기본 테넌트: 한성전자 (주력 테스트 계열사)
export const mockTenant: MockTenant = mockTenants[1]; // HANSUNG_ELEC

// 역할에 따른 접근 가능 테넌트 반환
export function getAvailableTenants(roles: string[]): MockTenant[] {
  // 시스템 관리자 또는 그룹 HR 총괄은 모든 계열사 접근 가능
  if (roles.includes('SUPER_ADMIN') || roles.includes('GROUP_ADMIN')) {
    return mockTenants;
  }
  // 그 외는 한성전자만 접근 (테스트용)
  return [mockTenant];
}

// 역할에 따른 기본 테넌트 반환
export function getDefaultTenant(roles: string[]): MockTenant {
  // 시스템 관리자 또는 그룹 HR 총괄은 지주회사가 기본
  if (roles.includes('SUPER_ADMIN') || roles.includes('GROUP_ADMIN')) {
    return mockTenants[0]; // 한성홀딩스
  }
  // 그 외는 한성전자가 기본
  return mockTenant;
}

/**
 * 한성그룹 샘플 데이터 테스트 계정
 * 비밀번호: scripts/sample-data/README.md 참조
 *
 * 역할 정의:
 * - SUPER_ADMIN: 시스템 관리자 (전체 시스템 관리)
 * - GROUP_ADMIN: 그룹 HR 총괄 (계열사 전체 관리)
 * - TENANT_ADMIN: 테넌트 관리자 (단일 계열사 관리, CEO)
 * - HR_MANAGER: HR 관리자 (인사팀장/인사과장)
 * - DEPT_MANAGER: 부서장/팀장
 * - TEAM_LEADER: 팀장
 * - EMPLOYEE: 일반 직원
 */
export const mockUsers: MockUser[] = [
  // 시스템 관리자 (전체 시스템)
  {
    id: 'user-superadmin',
    employeeId: 'emp-superadmin',
    employeeNumber: 'SYS001',
    name: '시스템관리자',
    email: 'superadmin@hansung.com',
    password: 'Admin@2025!',
    departmentId: 'dept-sys',
    departmentName: '시스템운영팀',
    positionName: '팀장',
    gradeName: '1급',
    profileImageUrl: undefined,
    roles: ['SUPER_ADMIN'],
    permissions: [
      'tenant:read', 'tenant:write', 'tenant:delete', 'tenant:admin',
      'user:read', 'user:write', 'user:delete',
      'employee:read', 'employee:write', 'employee:delete', 'employee:read:sensitive',
      'organization:read', 'organization:write', 'organization:delete',
      'attendance:read', 'attendance:write', 'attendance:admin', 'attendance:approve',
      'leave:read', 'leave:write', 'leave:approve',
      'approval:read', 'approval:write', 'approval:admin', 'approval:approve',
      'mdm:read', 'mdm:write', 'mdm:delete',
      'audit:read',
      'settings:read', 'settings:write',
      'appointment:read', 'appointment:write',
      'recruitment:read', 'recruitment:write',
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },

  // ========== 한성전자 계정 ==========
  // CEO (테넌트 관리자)
  {
    id: 'user-ceo-elec',
    employeeId: 'emp-ceo-elec',
    employeeNumber: 'ELEC001',
    name: '김대표',
    email: 'ceo.elec@hansung.com',
    password: 'Ceo@2025!',
    departmentId: 'dept-exec-elec',
    departmentName: '경영진',
    positionName: '대표이사',
    gradeName: '사장',
    profileImageUrl: undefined,
    roles: ['TENANT_ADMIN'],
    permissions: [
      'tenant:read',
      'employee:read', 'employee:write', 'employee:read:sensitive',
      'organization:read', 'organization:write',
      'attendance:read', 'attendance:write', 'attendance:admin', 'attendance:approve',
      'leave:read', 'leave:write', 'leave:approve',
      'approval:read', 'approval:write', 'approval:admin', 'approval:approve',
      'mdm:read', 'mdm:write',
      'audit:read',
      'appointment:read', 'appointment:write',
      'recruitment:read', 'recruitment:write',
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },
  // HR 관리자 (인사팀장)
  {
    id: 'user-hr-admin-elec',
    employeeId: 'emp-hr-admin-elec',
    employeeNumber: 'ELEC002',
    name: '이인사',
    email: 'hr.admin.elec@hansung.com',
    password: 'HrAdmin@2025!',
    departmentId: 'dept-hr-elec',
    departmentName: '인사팀',
    positionName: '팀장',
    gradeName: '부장',
    profileImageUrl: undefined,
    roles: ['HR_MANAGER'],
    permissions: [
      'employee:read', 'employee:write', 'employee:read:sensitive',
      'organization:read', 'organization:write',
      'attendance:read', 'attendance:write', 'attendance:admin', 'attendance:approve',
      'leave:read', 'leave:write', 'leave:approve',
      'approval:read', 'approval:write', 'approval:admin',
      'mdm:read', 'mdm:write',
      'audit:read',
      'appointment:read', 'appointment:write',
      'recruitment:read', 'recruitment:write',
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },
  // HR 담당자 (인사 과장/책임)
  {
    id: 'user-hr-manager-elec',
    employeeId: 'emp-hr-manager-elec',
    employeeNumber: 'ELEC003',
    name: '박인사',
    email: 'hr.manager.elec@hansung.com',
    password: 'HrMgr@2025!',
    departmentId: 'dept-hr-elec',
    departmentName: '인사팀',
    positionName: '책임',
    gradeName: '과장',
    profileImageUrl: undefined,
    roles: ['HR_MANAGER'],
    permissions: [
      'employee:read', 'employee:write',
      'organization:read', 'organization:write',
      'attendance:read', 'attendance:write',
      'leave:read', 'leave:write', 'leave:approve',
      'approval:read', 'approval:write',
      'mdm:read',
      'appointment:read', 'appointment:write',
      'recruitment:read', 'recruitment:write',
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },
  // 부서장/팀장 (DRAM개발팀장)
  {
    id: 'user-dev-manager-elec',
    employeeId: 'emp-dev-manager-elec',
    employeeNumber: 'ELEC004',
    name: '최개발',
    email: 'dev.manager.elec@hansung.com',
    password: 'DevMgr@2025!',
    departmentId: 'dept-dram-elec',
    departmentName: 'DRAM개발팀',
    positionName: '팀장',
    gradeName: '차장',
    profileImageUrl: undefined,
    roles: ['DEPT_MANAGER'],
    permissions: [
      'employee:read',
      'organization:read',
      'attendance:read', 'attendance:write', 'attendance:approve',
      'leave:read', 'leave:approve',
      'approval:read', 'approval:write', 'approval:approve',
      'condolence:read', 'condolence:write',
      'employee-card:read',
    ],
  },
  // 선임/대리 (DRAM개발팀)
  {
    id: 'user-dev-senior-elec',
    employeeId: 'emp-dev-senior-elec',
    employeeNumber: 'ELEC005',
    name: '정개발',
    email: 'dev.senior.elec@hansung.com',
    password: 'DevSr@2025!',
    departmentId: 'dept-dram-elec',
    departmentName: 'DRAM개발팀',
    positionName: '선임',
    gradeName: '대리',
    profileImageUrl: undefined,
    roles: ['EMPLOYEE'],
    permissions: [
      'employee:read:self',
      'attendance:read:self', 'attendance:write:self',
      'leave:read:self', 'leave:write:self',
      'approval:read:self', 'approval:write:self',
      'condolence:read', 'condolence:write',
      'employee-card:read',
    ],
  },
  // 일반 직원/사원 (DRAM개발팀)
  {
    id: 'user-dev-staff-elec',
    employeeId: 'emp-dev-staff-elec',
    employeeNumber: 'ELEC006',
    name: '강개발',
    email: 'dev.staff.elec@hansung.com',
    password: 'DevStaff@2025!',
    departmentId: 'dept-dram-elec',
    departmentName: 'DRAM개발팀',
    positionName: '팀원',
    gradeName: '사원',
    profileImageUrl: undefined,
    roles: ['EMPLOYEE'],
    permissions: [
      'employee:read:self',
      'attendance:read:self', 'attendance:write:self',
      'leave:read:self', 'leave:write:self',
      'approval:read:self', 'approval:write:self',
      'condolence:read', 'condolence:write',
      'employee-card:read',
    ],
  },

  // ========== 기타 계열사 CEO 계정 ==========
  // 한성홀딩스 CEO
  {
    id: 'user-ceo-hd',
    employeeId: 'emp-ceo-hd',
    employeeNumber: 'HD001',
    name: '한성회장',
    email: 'ceo.hansung@hansung.com',
    password: 'Ceo@2025!',
    departmentId: 'dept-exec-hd',
    departmentName: '경영진',
    positionName: '회장',
    gradeName: '회장',
    profileImageUrl: undefined,
    roles: ['GROUP_ADMIN', 'TENANT_ADMIN'],
    permissions: [
      'tenant:read', 'tenant:write',
      'employee:read', 'employee:write', 'employee:read:sensitive',
      'organization:read', 'organization:write',
      'attendance:read', 'attendance:write', 'attendance:admin', 'attendance:approve',
      'leave:read', 'leave:write', 'leave:approve',
      'approval:read', 'approval:write', 'approval:admin', 'approval:approve',
      'mdm:read', 'mdm:write',
      'audit:read',
      'appointment:read', 'appointment:write',
      'recruitment:read', 'recruitment:write',
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },
  // 한성SDI CEO
  {
    id: 'user-ceo-sdi',
    employeeId: 'emp-ceo-sdi',
    employeeNumber: 'SDI001',
    name: '배대표',
    email: 'ceo.sdi@hansung.com',
    password: 'Ceo@2025!',
    departmentId: 'dept-exec-sdi',
    departmentName: '경영진',
    positionName: '대표이사',
    gradeName: '사장',
    profileImageUrl: undefined,
    roles: ['TENANT_ADMIN'],
    permissions: [
      'tenant:read',
      'employee:read', 'employee:write', 'employee:read:sensitive',
      'organization:read', 'organization:write',
      'attendance:read', 'attendance:write', 'attendance:admin', 'attendance:approve',
      'leave:read', 'leave:write', 'leave:approve',
      'approval:read', 'approval:write', 'approval:admin', 'approval:approve',
      'mdm:read', 'mdm:write',
      'audit:read',
      'appointment:read', 'appointment:write',
    ],
  },
];

// 테스트 계정 조회 (username은 email 앞부분 또는 employeeNumber)
export function findMockUser(username: string, password: string): MockUser | null {
  const user = mockUsers.find(
    (u) =>
      (u.email.split('@')[0].toLowerCase() === username.toLowerCase() ||
        u.employeeNumber.toLowerCase() === username.toLowerCase()) &&
      u.password === password
  );
  return user || null;
}

// 빠른 로그인용 계정 목록 (개발/테스트용)
export const quickLoginAccounts = [
  {
    label: '시스템 관리자',
    username: 'superadmin',
    password: 'Admin@2025!',
    description: '전체 시스템 관리',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'CEO (한성전자)',
    username: 'ceo.elec',
    password: 'Ceo@2025!',
    description: '테넌트 관리자',
    roles: ['TENANT_ADMIN'],
  },
  {
    label: 'HR 관리자',
    username: 'hr.admin.elec',
    password: 'HrAdmin@2025!',
    description: '인사팀장 (HR 전체 관리)',
    roles: ['HR_MANAGER'],
  },
  {
    label: 'HR 담당자',
    username: 'hr.manager.elec',
    password: 'HrMgr@2025!',
    description: '인사 과장/책임',
    roles: ['HR_MANAGER'],
  },
  {
    label: '부서장 (개발)',
    username: 'dev.manager.elec',
    password: 'DevMgr@2025!',
    description: 'DRAM개발팀장',
    roles: ['DEPT_MANAGER'],
  },
  {
    label: '선임 (개발)',
    username: 'dev.senior.elec',
    password: 'DevSr@2025!',
    description: '개발팀 대리',
    roles: ['EMPLOYEE'],
  },
  {
    label: '사원 (개발)',
    username: 'dev.staff.elec',
    password: 'DevStaff@2025!',
    description: '개발팀 신입사원',
    roles: ['EMPLOYEE'],
  },
];

// Mock JWT 토큰 생성 (실제로는 무의미하지만 형식은 갖춤)
export function generateMockToken(userId: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24, // 24시간
    })
  );
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}
