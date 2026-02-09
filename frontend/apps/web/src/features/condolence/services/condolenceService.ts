import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  CondolenceRequest,
  CondolenceRequestListItem,
  CondolenceSearchParams,
  CreateCondolenceRequest,
  CondolencePolicy,
} from '@hr-platform/shared-types';

export interface CondolencePayment {
  id: string;
  condolenceRequestId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH';
  accountNumber?: string;
  bankName?: string;
  processedBy: string;
  processedByName: string;
  createdAt: string;
}

export interface CondolencePaymentSearchParams {
  status?: 'PENDING' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export interface ProcessPaymentRequest {
  paymentMethod: 'BANK_TRANSFER' | 'CASH';
  accountNumber?: string;
  bankName?: string;
}

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

  async updateRequest(id: string, data: Partial<CreateCondolenceRequest>): Promise<ApiResponse<CondolenceRequest>> {
    const response = await apiClient.put<ApiResponse<CondolenceRequest>>(`/condolences/${id}`, data);
    return response.data;
  },

  async deleteRequest(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/condolences/${id}`);
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

  async cancelRequest(id: string): Promise<ApiResponse<CondolenceRequest>> {
    const response = await apiClient.post<ApiResponse<CondolenceRequest>>(`/condolences/${id}/cancel`);
    return response.data;
  },

  async getPolicies(): Promise<ApiResponse<CondolencePolicy[]>> {
    const response = await apiClient.get<ApiResponse<CondolencePolicy[]>>('/condolences/policies');
    return response.data;
  },

  // Payment related endpoints
  async getPaymentPendingList(params?: CondolencePaymentSearchParams): Promise<ApiResponse<PageResponse<CondolenceRequestListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CondolenceRequestListItem>>>('/condolences/payments/pending', { params });
    return response.data;
  },

  async processPayment(id: string, data: ProcessPaymentRequest): Promise<ApiResponse<CondolenceRequest>> {
    const response = await apiClient.post<ApiResponse<CondolenceRequest>>(`/condolences/${id}/pay`, data);
    return response.data;
  },

  async bulkProcessPayment(ids: string[], data: ProcessPaymentRequest): Promise<ApiResponse<{ processed: number }>> {
    const response = await apiClient.post<ApiResponse<{ processed: number }>>('/condolences/payments/bulk', {
      condolenceIds: ids,
      ...data,
    });
    return response.data;
  },

  async getPaymentHistory(params?: CondolencePaymentSearchParams): Promise<ApiResponse<PageResponse<CondolencePayment>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CondolencePayment>>>('/condolences/payments/history', { params });
    return response.data;
  },

  async createPolicy(data: Omit<CondolencePolicy, 'id'>): Promise<ApiResponse<CondolencePolicy>> {
    const response = await apiClient.post<ApiResponse<CondolencePolicy>>('/condolences/policies', data);
    return response.data;
  },

  async updatePolicy(id: string, data: Partial<CondolencePolicy>): Promise<ApiResponse<CondolencePolicy>> {
    const response = await apiClient.put<ApiResponse<CondolencePolicy>>(`/condolences/policies/${id}`, data);
    return response.data;
  },

  async deletePolicy(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/condolences/policies/${id}`);
    return response.data;
  },
};
