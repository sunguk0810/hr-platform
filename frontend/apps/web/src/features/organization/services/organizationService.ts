import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  Department,
  DepartmentTreeNode,
  Position,
  Grade,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  CreateGradeRequest,
  UpdateGradeRequest,
  CreatePositionRequest,
  UpdatePositionRequest,
  PageRequest,
  DepartmentStatus,
} from '@hr-platform/shared-types';

export interface DepartmentSearchParams extends PageRequest {
  keyword?: string;
  status?: DepartmentStatus;
}

export type OrgHistoryEventType =
  | 'department_created'
  | 'department_deleted'
  | 'department_renamed'
  | 'department_moved'
  | 'employee_joined'
  | 'employee_left'
  | 'employee_transferred';

export interface OrgHistoryEvent {
  id: string;
  type: OrgHistoryEventType;
  date: string;
  title: string;
  description?: string;
  actor?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  departmentId?: string;
  departmentName?: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

export interface OrgHistorySearchParams extends PageRequest {
  departmentId?: string;
  eventType?: OrgHistoryEventType;
  startDate?: string;
  endDate?: string;
}

export const organizationService = {
  // Organization Tree
  async getOrganizationTree(): Promise<ApiResponse<DepartmentTreeNode[]>> {
    const response = await apiClient.get<ApiResponse<DepartmentTreeNode[]>>('/organizations/tree');
    return response.data;
  },

  // Departments
  async getDepartments(params?: DepartmentSearchParams): Promise<ApiResponse<PageResponse<Department>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<Department>>>('/organizations/departments', {
      params,
    });
    return response.data;
  },

  async getDepartment(id: string): Promise<ApiResponse<Department>> {
    const response = await apiClient.get<ApiResponse<Department>>(`/organizations/departments/${id}`);
    return response.data;
  },

  async createDepartment(data: CreateDepartmentRequest): Promise<ApiResponse<Department>> {
    const response = await apiClient.post<ApiResponse<Department>>('/organizations/departments', data);
    return response.data;
  },

  async updateDepartment(id: string, data: UpdateDepartmentRequest): Promise<ApiResponse<Department>> {
    const response = await apiClient.put<ApiResponse<Department>>(`/organizations/departments/${id}`, data);
    return response.data;
  },

  async deleteDepartment(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/organizations/departments/${id}`);
    return response.data;
  },

  // Positions
  async getPositions(): Promise<ApiResponse<Position[]>> {
    const response = await apiClient.get<ApiResponse<Position[]>>('/organizations/positions');
    return response.data;
  },

  async createPosition(data: CreatePositionRequest): Promise<ApiResponse<Position>> {
    const response = await apiClient.post<ApiResponse<Position>>('/organizations/positions', data);
    return response.data;
  },

  async updatePosition(id: string, data: UpdatePositionRequest): Promise<ApiResponse<Position>> {
    const response = await apiClient.put<ApiResponse<Position>>(`/organizations/positions/${id}`, data);
    return response.data;
  },

  async deletePosition(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/organizations/positions/${id}`);
    return response.data;
  },

  // Grades
  async getGrades(): Promise<ApiResponse<Grade[]>> {
    const response = await apiClient.get<ApiResponse<Grade[]>>('/organizations/grades');
    return response.data;
  },

  async createGrade(data: CreateGradeRequest): Promise<ApiResponse<Grade>> {
    const response = await apiClient.post<ApiResponse<Grade>>('/organizations/grades', data);
    return response.data;
  },

  async updateGrade(id: string, data: UpdateGradeRequest): Promise<ApiResponse<Grade>> {
    const response = await apiClient.put<ApiResponse<Grade>>(`/organizations/grades/${id}`, data);
    return response.data;
  },

  async deleteGrade(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/organizations/grades/${id}`);
    return response.data;
  },

  // Organization History
  async getOrganizationHistory(params?: OrgHistorySearchParams): Promise<ApiResponse<PageResponse<OrgHistoryEvent>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<OrgHistoryEvent>>>('/organizations/history', {
      params,
    });
    return response.data;
  },

  async getDepartmentHistory(departmentId: string, params?: OrgHistorySearchParams): Promise<ApiResponse<OrgHistoryEvent[]>> {
    const response = await apiClient.get<ApiResponse<OrgHistoryEvent[]>>(`/organizations/departments/${departmentId}/history`, {
      params,
    });
    return response.data;
  },
};
