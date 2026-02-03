import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  Approval,
  ApprovalListItem,
  ApprovalSearchParams,
  CreateApprovalRequest,
  ApproveRequest,
  RejectRequest,
  ApprovalDelegation,
  DelegationListItem,
  CreateDelegationRequest,
} from '@hr-platform/shared-types';

export interface ApprovalSummary {
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
}

export interface ApprovalListParams extends ApprovalSearchParams {
  tab?: 'pending' | 'requested' | 'completed' | 'draft';
}

export const approvalService = {
  async getApprovals(params?: ApprovalListParams): Promise<ApiResponse<PageResponse<ApprovalListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ApprovalListItem>>>('/approvals', {
      params,
    });
    return response.data;
  },

  async getApprovalSummary(): Promise<ApiResponse<ApprovalSummary>> {
    const response = await apiClient.get<ApiResponse<ApprovalSummary>>('/approvals/summary');
    return response.data;
  },

  async getApproval(id: string): Promise<ApiResponse<Approval>> {
    const response = await apiClient.get<ApiResponse<Approval>>(`/approvals/${id}`);
    return response.data;
  },

  async createApproval(data: CreateApprovalRequest): Promise<ApiResponse<Approval>> {
    const response = await apiClient.post<ApiResponse<Approval>>('/approvals', data);
    return response.data;
  },

  async approve(id: string, data?: ApproveRequest): Promise<ApiResponse<Approval>> {
    const response = await apiClient.post<ApiResponse<Approval>>(`/approvals/${id}/approve`, data);
    return response.data;
  },

  async reject(id: string, data: RejectRequest): Promise<ApiResponse<Approval>> {
    const response = await apiClient.post<ApiResponse<Approval>>(`/approvals/${id}/reject`, data);
    return response.data;
  },

  async cancel(id: string): Promise<ApiResponse<Approval>> {
    const response = await apiClient.post<ApiResponse<Approval>>(`/approvals/${id}/cancel`);
    return response.data;
  },

  // Delegation
  async getDelegations(): Promise<ApiResponse<DelegationListItem[]>> {
    const response = await apiClient.get<ApiResponse<DelegationListItem[]>>('/approvals/delegations');
    return response.data;
  },

  async createDelegation(data: CreateDelegationRequest): Promise<ApiResponse<ApprovalDelegation>> {
    const response = await apiClient.post<ApiResponse<ApprovalDelegation>>('/approvals/delegations', data);
    return response.data;
  },

  async cancelDelegation(id: string): Promise<ApiResponse<ApprovalDelegation>> {
    const response = await apiClient.post<ApiResponse<ApprovalDelegation>>(`/approvals/delegations/${id}/cancel`);
    return response.data;
  },

  // Employee search for delegation
  async searchEmployees(keyword: string): Promise<ApiResponse<Array<{ id: string; name: string; departmentName: string }>>> {
    const response = await apiClient.get<ApiResponse<Array<{ id: string; name: string; departmentName: string }>>>('/employees/search', {
      params: { keyword },
    });
    return response.data;
  },
};
