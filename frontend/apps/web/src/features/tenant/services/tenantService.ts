import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  TenantDetail,
  TenantListItem,
  TenantSearchParams,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantStatus,
} from '@hr-platform/shared-types';

export const tenantService = {
  async getTenants(params?: TenantSearchParams): Promise<ApiResponse<PageResponse<TenantListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<TenantListItem>>>('/tenants', {
      params,
    });
    return response.data;
  },

  async getTenant(id: string): Promise<ApiResponse<TenantDetail>> {
    const response = await apiClient.get<ApiResponse<TenantDetail>>(`/tenants/${id}`);
    return response.data;
  },

  async createTenant(data: CreateTenantRequest): Promise<ApiResponse<TenantDetail>> {
    const response = await apiClient.post<ApiResponse<TenantDetail>>('/tenants', data);
    return response.data;
  },

  async updateTenant(id: string, data: UpdateTenantRequest): Promise<ApiResponse<TenantDetail>> {
    const response = await apiClient.put<ApiResponse<TenantDetail>>(`/tenants/${id}`, data);
    return response.data;
  },

  async changeStatus(id: string, status: TenantStatus): Promise<ApiResponse<TenantDetail>> {
    const response = await apiClient.post<ApiResponse<TenantDetail>>(`/tenants/${id}/status`, { status });
    return response.data;
  },

  async deleteTenant(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/tenants/${id}`);
    return response.data;
  },
};
