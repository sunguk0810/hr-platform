import { TenantAwareEntity, PageRequest } from './common';

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'RETIRED';
export type Gender = 'MALE' | 'FEMALE';

export interface Employee extends TenantAwareEntity {
  employeeNumber: string;
  name: string;
  nameEn?: string;
  email: string;
  mobile?: string;
  birthDate?: string;
  gender?: Gender;
  hireDate: string;
  resignationDate?: string;
  employmentStatus: EmploymentStatus;
  departmentId: string;
  departmentName: string;
  positionId?: string;
  positionName?: string;
  gradeId?: string;
  gradeName?: string;
  managerId?: string;
  managerName?: string;
  profileImageUrl?: string;
}

export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  departmentName: string;
  positionName?: string;
  gradeName?: string;
  employmentStatus: EmploymentStatus;
  hireDate: string;
  profileImageUrl?: string;
}

export interface EmployeeSearchParams extends PageRequest {
  keyword?: string;
  departmentId?: string;
  employmentStatus?: EmploymentStatus;
  hireStartDate?: string;
  hireEndDate?: string;
}

export interface CreateEmployeeRequest {
  employeeNumber: string;
  name: string;
  nameEn?: string;
  email: string;
  mobile?: string;
  birthDate?: string;
  gender?: Gender;
  hireDate: string;
  departmentId: string;
  positionId?: string;
  gradeId?: string;
  managerId?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  nameEn?: string;
  email?: string;
  mobile?: string;
  birthDate?: string;
  gender?: Gender;
  departmentId?: string;
  positionId?: string;
  gradeId?: string;
  managerId?: string;
}
