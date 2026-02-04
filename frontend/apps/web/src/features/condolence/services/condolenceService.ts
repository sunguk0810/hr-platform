import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  CondolenceRequest,
  CondolenceRequestListItem,
  CondolenceSearchParams,
  CreateCondolenceRequest,
  CondolencePolicy,
} from '@hr-platform/shared-types';

export const condolenceService = {
  async getRequests(params?: CondolenceSearchParams): Promise<ApiResponse<PageResponse<CondolenceRequestListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CondolenceRequestListItem>>>('/condolences', { params });
    return response.data;
  },

  async getRequest(id: string): Promise<ApiResponse<CondolenceRequest>> {
    const response = await apiClient.get<ApiResponse<CondolenceRequest>>(`/condolences/${id}`);
    return response.data;
  },

  async createRequest(data: CreateCondolenceRequest): Promise<ApiResponse<CondolenceRequest>> {
    const response = await apiClient.post<ApiResponse<CondolenceRequest>>('/condolences', data);
    return response.data;
  },

  async approveRequest(id: string): Promise<ApiResponse<CondolenceRequest>> {
    const response = await apiClient.post<ApiResponse<CondolenceRequest>>(`/condolences/${id}/approve`);
    return response.data;
  },

  async rejectRequest(id: string, reason: string): Promise<ApiResponse<CondolenceRequest>> {
    const response = await apiClient.post<ApiResponse<CondolenceRequest>>(`/condolences/${id}/reject`, { reason });
    return response.data;
  },

  async getPolicies(): Promise<ApiResponse<CondolencePolicy[]>> {
    const response = await apiClient.get<ApiResponse<CondolencePolicy[]>>('/condolences/policies');
    return response.data;
  },
};
