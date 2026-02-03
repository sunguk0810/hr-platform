import { TenantAwareEntity, PageRequest } from './common';

// Code Group Types
export interface CodeGroup extends TenantAwareEntity {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  isSystem: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface CodeGroupListItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  codeCount: number;
}

export interface CodeGroupSearchParams extends PageRequest {
  keyword?: string;
  isActive?: boolean;
}

export interface CreateCodeGroupRequest {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCodeGroupRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Common Code Types
export interface CommonCode extends TenantAwareEntity {
  groupId: string;
  groupCode: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  parentCode?: string;
  parentName?: string;
  attributes?: Record<string, string>;
}

export interface CommonCodeListItem {
  id: string;
  groupCode: string;
  code: string;
  name: string;
  nameEn?: string;
  sortOrder: number;
  isActive: boolean;
  parentCode?: string;
}

export interface CommonCodeSearchParams extends PageRequest {
  groupCode?: string;
  keyword?: string;
  isActive?: boolean;
  parentCode?: string;
}

export interface CreateCommonCodeRequest {
  groupId: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
  parentCode?: string;
  attributes?: Record<string, string>;
}

export interface UpdateCommonCodeRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
  parentCode?: string;
  attributes?: Record<string, string>;
}

// Tenant Code Mapping (for tenant-specific code values)
export interface TenantCodeMapping extends TenantAwareEntity {
  commonCodeId: string;
  groupCode: string;
  code: string;
  displayName?: string;
  sortOrder?: number;
  isActive: boolean;
}

// Helper types for dropdowns
export interface CodeOption {
  value: string;
  label: string;
  labelEn?: string;
}

// System Code Groups (predefined)
export const SYSTEM_CODE_GROUPS = {
  LEAVE_TYPE: 'LEAVE_TYPE',
  EMPLOYMENT_STATUS: 'EMPLOYMENT_STATUS',
  GENDER: 'GENDER',
  APPROVAL_TYPE: 'APPROVAL_TYPE',
  DEPARTMENT_STATUS: 'DEPARTMENT_STATUS',
  POSITION: 'POSITION',
  GRADE: 'GRADE',
} as const;

export type SystemCodeGroup = typeof SYSTEM_CODE_GROUPS[keyof typeof SYSTEM_CODE_GROUPS];
