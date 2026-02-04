import { User } from '@/stores/authStore';
import { Tenant } from '@/stores/tenantStore';

/**
 * Mock Users for Testing
 * 테스트용 Mock 사용자 데이터
 */

export interface MockUser extends User {
  password: string;
}

export interface MockTenant extends Tenant {
  code: string;
}

// 멀티 테넌트 (계열사) 목록
export const mockTenants: MockTenant[] = [
  {
    id: 'tenant-001',
    code: 'HOLDINGS',
    name: 'HR그룹 지주회사',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-002',
    code: 'TECH',
    name: 'HR테크',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-003',
    code: 'CONSULTING',
    name: 'HR컨설팅',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-004',
    code: 'ACADEMY',
    name: 'HR아카데미',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
  {
    id: 'tenant-005',
    code: 'PARTNERS',
    name: 'HR파트너스',
    logoUrl: undefined,
    status: 'ACTIVE',
  },
];

// 기본 테넌트 (단일 테넌트 사용자용)
export const mockTenant: MockTenant = mockTenants[1]; // HR테크

// 역할에 따른 접근 가능 테넌트 반환
export function getAvailableTenants(roles: string[]): MockTenant[] {
  // 시스템 관리자 또는 그룹 HR 총괄은 모든 계열사 접근 가능
  if (roles.includes('SUPER_ADMIN') || roles.includes('GROUP_ADMIN')) {
    return mockTenants;
  }
  // 그 외는 단일 테넌트만 접근
  return [mockTenant];
}

// 역할에 따른 기본 테넌트 반환
export function getDefaultTenant(roles: string[]): MockTenant {
  // 시스템 관리자 또는 그룹 HR 총괄은 지주회사가 기본
  if (roles.includes('SUPER_ADMIN') || roles.includes('GROUP_ADMIN')) {
    return mockTenants[0]; // HR그룹 지주회사
  }
  // 그 외는 HR테크가 기본
  return mockTenant;
}

/**
 * PRD 4.1 기준 역할 정의 Mock 사용자
 * - SUPER_ADMIN: 시스템 관리자
 * - GROUP_ADMIN: 그룹 HR 총괄 (계열사 전체 관리)
 * - TENANT_ADMIN: 테넌트 관리자 (단일 계열사 관리)
 * - HR_ADMIN: HR 관리자
 * - HR_MANAGER: HR 담당자
 * - DEPT_MANAGER: 부서장
 * - TEAM_LEADER: 팀장
 * - EMPLOYEE: 일반 직원
 */
export const mockUsers: MockUser[] = [
  // 시스템 관리자
  {
    id: 'user-admin-001',
    employeeId: 'emp-admin-001',
    employeeNumber: 'SYS001',
    name: '시스템관리자',
    email: 'admin@demo.com',
    password: 'admin1234',
    departmentId: 'dept-001',
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
      // P2 기능 권한
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },
  // 그룹 HR 총괄
  {
    id: 'user-group-001',
    employeeId: 'emp-group-001',
    employeeNumber: 'GRP001',
    name: '최그룹',
    email: 'group@demo.com',
    password: 'group1234',
    departmentId: 'dept-001',
    departmentName: '그룹HR팀',
    positionName: '본부장',
    gradeName: '1급',
    profileImageUrl: undefined,
    roles: ['GROUP_ADMIN'],
    permissions: [
      'tenant:read', 'tenant:write',
      'employee:read', 'employee:write', 'employee:read:sensitive',
      'organization:read', 'organization:write',
      'attendance:read', 'attendance:write', 'attendance:admin', 'attendance:approve',
      'leave:read', 'leave:write', 'leave:approve',
      'approval:read', 'approval:write', 'approval:approve',
      'mdm:read', 'mdm:write',
      'audit:read',
      'appointment:read', 'appointment:write',
      // P2 기능 권한
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },
  // 테넌트 관리자
  {
    id: 'user-tenant-001',
    employeeId: 'emp-tenant-001',
    employeeNumber: 'TNT001',
    name: '정테넌트',
    email: 'tenant@demo.com',
    password: 'tenant1234',
    departmentId: 'dept-002',
    departmentName: '경영지원팀',
    positionName: '이사',
    gradeName: '임원',
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
      // P2 기능 권한
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },
  // HR 관리자
  {
    id: 'user-hradmin-001',
    employeeId: 'emp-hradmin-001',
    employeeNumber: 'HRA001',
    name: '강HR관리',
    email: 'hradmin@demo.com',
    password: 'hradmin1234',
    departmentId: 'dept-002',
    departmentName: '인사팀',
    positionName: '팀장',
    gradeName: '2급',
    profileImageUrl: undefined,
    roles: ['HR_ADMIN'],
    permissions: [
      'employee:read', 'employee:write', 'employee:read:sensitive',
      'organization:read', 'organization:write',
      'attendance:read', 'attendance:write', 'attendance:admin', 'attendance:approve',
      'leave:read', 'leave:write', 'leave:approve',
      'approval:read', 'approval:write', 'approval:admin',
      'mdm:read', 'mdm:write',
      'audit:read',
      'appointment:read', 'appointment:write',
      // P2 기능 권한
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },
  // HR 담당자
  {
    id: 'user-hr-001',
    employeeId: 'emp-hr-001',
    employeeNumber: 'HR001',
    name: '김인사',
    email: 'hr@demo.com',
    password: 'hr1234',
    departmentId: 'dept-002',
    departmentName: '인사팀',
    positionName: '과장',
    gradeName: '3급',
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
      // P2 기능 권한
      'transfer:read', 'transfer:write',
      'headcount:read', 'headcount:write',
      'condolence:read', 'condolence:write',
      'committee:read', 'committee:write',
      'employee-card:read', 'employee-card:write',
    ],
  },
  // 부서장
  {
    id: 'user-dept-001',
    employeeId: 'emp-dept-001',
    employeeNumber: 'DEPT001',
    name: '박부장',
    email: 'deptmgr@demo.com',
    password: 'deptmgr1234',
    departmentId: 'dept-003',
    departmentName: '개발팀',
    positionName: '부장',
    gradeName: '2급',
    profileImageUrl: undefined,
    roles: ['DEPT_MANAGER'],
    permissions: [
      'employee:read',
      'organization:read',
      'attendance:read', 'attendance:write', 'attendance:approve',
      'leave:read', 'leave:approve',
      'approval:read', 'approval:write', 'approval:approve',
      // P2 기능 권한 (일부)
      'condolence:read', 'condolence:write',
      'employee-card:read',
    ],
  },
  // 팀장
  {
    id: 'user-team-001',
    employeeId: 'emp-team-001',
    employeeNumber: 'TEAM001',
    name: '조팀장',
    email: 'teamlead@demo.com',
    password: 'teamlead1234',
    departmentId: 'dept-003',
    departmentName: '개발팀',
    positionName: '팀장',
    gradeName: '3급',
    profileImageUrl: undefined,
    roles: ['TEAM_LEADER'],
    permissions: [
      'employee:read',
      'organization:read',
      'attendance:read', 'attendance:write',
      'leave:read', 'leave:approve',
      'approval:read', 'approval:write', 'approval:approve',
      // P2 기능 권한 (일부)
      'condolence:read', 'condolence:write',
      'employee-card:read',
    ],
  },
  // 일반 직원
  {
    id: 'user-emp-001',
    employeeId: 'emp-emp-001',
    employeeNumber: 'EMP001',
    name: '이직원',
    email: 'employee@demo.com',
    password: 'employee1234',
    departmentId: 'dept-003',
    departmentName: '개발팀',
    positionName: '사원',
    gradeName: '5급',
    profileImageUrl: undefined,
    roles: ['EMPLOYEE'],
    permissions: [
      'employee:read:self',
      'attendance:read:self', 'attendance:write:self',
      'leave:read:self', 'leave:write:self',
      'approval:read:self', 'approval:write:self',
      // P2 기능 권한 (일부)
      'condolence:read', 'condolence:write',
      'employee-card:read',
    ],
  },
  // 기존 데모 계정 (하위 호환 - DEPT_MANAGER로 매핑)
  {
    id: 'user-demo-001',
    employeeId: 'emp-demo-001',
    employeeNumber: 'DEMO001',
    name: '데모사용자',
    email: 'demo@demo.com',
    password: 'demo1234',
    departmentId: 'dept-003',
    departmentName: '개발팀',
    positionName: '과장',
    gradeName: '4급',
    profileImageUrl: undefined,
    roles: ['DEPT_MANAGER', 'EMPLOYEE'],
    permissions: [
      'employee:read',
      'organization:read',
      'attendance:read', 'attendance:write', 'attendance:approve',
      'leave:read', 'leave:write', 'leave:approve',
      'approval:read', 'approval:write', 'approval:approve',
      // P2 기능 권한 (일부)
      'condolence:read', 'condolence:write',
      'employee-card:read',
    ],
  },
  // Legacy manager 계정 (하위 호환)
  {
    id: 'user-mgr-001',
    employeeId: 'emp-mgr-001',
    employeeNumber: 'MGR001',
    name: '홍매니저',
    email: 'manager@demo.com',
    password: 'manager1234',
    departmentId: 'dept-003',
    departmentName: '개발팀',
    positionName: '부장',
    gradeName: '2급',
    profileImageUrl: undefined,
    roles: ['DEPT_MANAGER'],
    permissions: [
      'employee:read',
      'organization:read',
      'attendance:read', 'attendance:write', 'attendance:approve',
      'leave:read', 'leave:approve',
      'approval:read', 'approval:write', 'approval:approve',
      // P2 기능 권한 (일부)
      'condolence:read', 'condolence:write',
      'employee-card:read',
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

// 빠른 로그인용 계정 목록 (비밀번호 표시용)
export const quickLoginAccounts = [
  {
    label: '시스템 관리자',
    username: 'admin',
    password: 'admin1234',
    description: '모든 권한 보유',
    roles: ['SUPER_ADMIN'],
  },
  {
    label: '그룹 HR 총괄',
    username: 'group',
    password: 'group1234',
    description: '계열사 전체 관리',
    roles: ['GROUP_ADMIN'],
  },
  {
    label: '테넌트 관리자',
    username: 'tenant',
    password: 'tenant1234',
    description: '단일 계열사 관리',
    roles: ['TENANT_ADMIN'],
  },
  {
    label: 'HR 관리자',
    username: 'hradmin',
    password: 'hradmin1234',
    description: 'HR 전체 관리',
    roles: ['HR_ADMIN'],
  },
  {
    label: 'HR 담당자',
    username: 'hr',
    password: 'hr1234',
    description: '인사/근태 담당',
    roles: ['HR_MANAGER'],
  },
  {
    label: '부서장',
    username: 'deptmgr',
    password: 'deptmgr1234',
    description: '부서 결재 권한',
    roles: ['DEPT_MANAGER'],
  },
  {
    label: '팀장',
    username: 'teamlead',
    password: 'teamlead1234',
    description: '팀 결재 권한',
    roles: ['TEAM_LEADER'],
  },
  {
    label: '일반 직원',
    username: 'employee',
    password: 'employee1234',
    description: '기본 직원 권한',
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
