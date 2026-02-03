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
};
