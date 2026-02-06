// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

// Common Entity Types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface TenantAwareEntity extends BaseEntity {
  tenantId: string;
}

// User Types
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

// Tenant Types
export interface Tenant {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  loginBackgroundUrl?: string;
}
