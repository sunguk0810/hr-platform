import { TenantAwareEntity } from './common';

export type DepartmentStatus = 'ACTIVE' | 'INACTIVE';

export interface Department extends TenantAwareEntity {
  code: string;
  name: string;
  nameEn?: string;
  parentId?: string;
  parentName?: string;
  level: number;
  sortOrder: number;
  managerId?: string;
  managerName?: string;
  status: DepartmentStatus;
  employeeCount: number;
}

export interface DepartmentTreeNode {
  id: string;
  code: string;
  name: string;
  level: number;
  sortOrder: number;
  employeeCount: number;
  children: DepartmentTreeNode[];
}

export interface Position extends TenantAwareEntity {
  code: string;
  name: string;
  nameEn?: string;
  sortOrder: number;
  description?: string;
}

export interface Grade extends TenantAwareEntity {
  code: string;
  name: string;
  nameEn?: string;
  level: number;
  sortOrder: number;
  description?: string;
}

export interface CreateDepartmentRequest {
  code: string;
  name: string;
  nameEn?: string;
  parentId?: string;
  sortOrder?: number;
  managerId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  nameEn?: string;
  parentId?: string;
  sortOrder?: number;
  managerId?: string;
  status?: DepartmentStatus;
}

// Grade CRUD types
export interface CreateGradeRequest {
  code: string;
  name: string;
  nameEn?: string;
  level: number;
  sortOrder?: number;
  description?: string;
}

export interface UpdateGradeRequest {
  name?: string;
  nameEn?: string;
  level?: number;
  sortOrder?: number;
  description?: string;
  isActive?: boolean;
}

// Position CRUD types
export interface CreatePositionRequest {
  code: string;
  name: string;
  nameEn?: string;
  sortOrder?: number;
  description?: string;
}

export interface UpdatePositionRequest {
  name?: string;
  nameEn?: string;
  sortOrder?: number;
  description?: string;
  isActive?: boolean;
}
