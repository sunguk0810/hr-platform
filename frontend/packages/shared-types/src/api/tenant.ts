import { BaseEntity, PageRequest, TenantBranding } from './common';

export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export interface TenantDetail extends BaseEntity {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  logoUrl?: string;
  status: TenantStatus;
  branding: TenantBranding;
  policies: TenantPolicies;
  settings: TenantSettings;
  employeeCount: number;
  departmentCount: number;
  adminEmail?: string;
  adminName?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

export interface TenantListItem {
  id: string;
  code: string;
  name: string;
  status: TenantStatus;
  employeeCount: number;
  adminEmail?: string;
  createdAt: string;
}

export interface TenantPolicies {
  maxEmployees: number;
  maxDepartments: number;
  allowedModules: string[];
  leavePolicy: LeavePolicy;
  attendancePolicy: AttendancePolicy;
  approvalPolicy: ApprovalPolicy;
}

export interface LeavePolicy {
  annualLeaveBaseDays: number;
  annualLeaveIncrement: number;
  maxAnnualLeave: number;
  sickLeaveDays: number;
  specialLeaveDays: number;
  carryOverEnabled: boolean;
  carryOverMaxDays: number;
  carryOverExpiryMonths: number;
}

export interface AttendancePolicy {
  workStartTime: string;
  workEndTime: string;
  lateGraceMinutes: number;
  earlyLeaveGraceMinutes: number;
  requiredWorkHours: number;
  overtimeEnabled: boolean;
  flexibleTimeEnabled: boolean;
}

export interface ApprovalPolicy {
  maxApprovalSteps: number;
  autoApprovalEnabled: boolean;
  autoApprovalDays: number;
  parallelApprovalEnabled: boolean;
}

export interface TenantSettings {
  locale: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  fiscalYearStartMonth: number;
}

export interface TenantSearchParams extends PageRequest {
  keyword?: string;
  status?: TenantStatus;
}

export interface CreateTenantRequest {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  adminEmail: string;
  adminName: string;
  policies?: Partial<TenantPolicies>;
}

export interface UpdateTenantRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  logoUrl?: string;
  status?: TenantStatus;
  branding?: Partial<TenantBranding>;
  policies?: Partial<TenantPolicies>;
  settings?: Partial<TenantSettings>;
}

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '정지',
  PENDING: '대기',
};

export const TENANT_MODULES = [
  { code: 'EMPLOYEE', name: '직원 관리' },
  { code: 'ORGANIZATION', name: '조직 관리' },
  { code: 'ATTENDANCE', name: '근태 관리' },
  { code: 'LEAVE', name: '휴가 관리' },
  { code: 'APPROVAL', name: '전자결재' },
  { code: 'MDM', name: '기준정보' },
  { code: 'NOTIFICATION', name: '알림' },
] as const;

export type TenantModule = typeof TENANT_MODULES[number]['code'];
