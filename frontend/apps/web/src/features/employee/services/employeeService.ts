import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type { Employee, EmployeeListItem, EmployeeSearchParams, CreateEmployeeRequest, UpdateEmployeeRequest } from '@hr-platform/shared-types';

export const employeeService = {
  async getEmployees(params?: EmployeeSearchParams): Promise<ApiResponse<PageResponse<EmployeeListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<EmployeeListItem>>>('/employees', {
      params,
    });
    return response.data;
  },

  async getEmployee(id: string): Promise<ApiResponse<Employee>> {
    const response = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
    return response.data;
  },

  async createEmployee(data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> {
    const response = await apiClient.post<ApiResponse<Employee>>('/employees', data);
    return response.data;
  },

  async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<ApiResponse<Employee>> {
    const response = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/employees/${id}`);
    return response.data;
  },

  async exportEmployees(params?: EmployeeSearchParams): Promise<Blob> {
    const response = await apiClient.get('/employees/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
