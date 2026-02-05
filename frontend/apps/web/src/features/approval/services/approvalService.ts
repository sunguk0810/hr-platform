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
  ApprovalHistory,
  ApprovalTemplate,
  RecallRequest,
  DelegateRequest,
  DirectApproveRequest,
  DelegationRule,
  DelegationRuleListItem,
  DelegationRuleSearchParams,
  CreateDelegationRuleRequest,
  UpdateDelegationRuleRequest,
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

  // SDD 4.4 회수
  async recall(id: string, data: RecallRequest): Promise<ApiResponse<Approval>> {
    const response = await apiClient.post<ApiResponse<Approval>>(`/approvals/${id}/recall`, data);
    return response.data;
  },

  // SDD 4.6 대결
  async delegate(id: string, stepId: string, data: DelegateRequest): Promise<ApiResponse<Approval>> {
    const response = await apiClient.post<ApiResponse<Approval>>(`/approvals/${id}/steps/${stepId}/delegate`, data);
    return response.data;
  },

  // SDD 4.7 전결
  async directApprove(id: string, data: DirectApproveRequest): Promise<ApiResponse<Approval>> {
    const response = await apiClient.post<ApiResponse<Approval>>(`/approvals/${id}/direct-approve`, data);
    return response.data;
  },

  // SDD 4.5 결재 이력 조회
  async getHistory(id: string): Promise<ApiResponse<ApprovalHistory[]>> {
    const response = await apiClient.get<ApiResponse<ApprovalHistory[]>>(`/approvals/${id}/history`);
    return response.data;
  },

  // SDD 3.3.4 결재 양식 목록 - Backend uses /approvals/templates
  async getTemplates(params?: { category?: string; isActive?: boolean }): Promise<ApiResponse<ApprovalTemplate[]>> {
    const response = await apiClient.get<ApiResponse<ApprovalTemplate[]>>('/approvals/templates', { params });
    return response.data;
  },

  // SDD 3.3.4 결재 양식 상세
  async getTemplate(id: string): Promise<ApiResponse<ApprovalTemplate>> {
    const response = await apiClient.get<ApiResponse<ApprovalTemplate>>(`/approvals/templates/${id}`);
    return response.data;
  },

  // SDD 3.3.4 결재 양식 생성
  async createTemplate(data: Partial<ApprovalTemplate>): Promise<ApiResponse<ApprovalTemplate>> {
    const response = await apiClient.post<ApiResponse<ApprovalTemplate>>('/approvals/templates', data);
    return response.data;
  },

  // SDD 3.3.4 결재 양식 수정
  async updateTemplate(id: string, data: Partial<ApprovalTemplate>): Promise<ApiResponse<ApprovalTemplate>> {
    const response = await apiClient.put<ApiResponse<ApprovalTemplate>>(`/approvals/templates/${id}`, data);
    return response.data;
  },

  // SDD 3.3.4 결재 양식 삭제
  async deleteTemplate(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/approvals/templates/${id}`);
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

  // ===== PRD FR-APR-003: 위임전결 규칙 =====
  // Backend uses /approvals/delegations for both delegations and delegation rules

  async getDelegationRules(params?: DelegationRuleSearchParams): Promise<ApiResponse<PageResponse<DelegationRuleListItem>>> {
    // Backend returns paginated response
    const response = await apiClient.get<ApiResponse<PageResponse<DelegationRuleListItem>>>('/approvals/delegations', {
      params,
    });
    return response.data;
  },

  async getDelegationRule(id: string): Promise<ApiResponse<DelegationRule>> {
    const response = await apiClient.get<ApiResponse<DelegationRule>>(`/approvals/delegations/${id}`);
    return response.data;
  },

  async createDelegationRule(data: CreateDelegationRuleRequest): Promise<ApiResponse<DelegationRule>> {
    const response = await apiClient.post<ApiResponse<DelegationRule>>('/approvals/delegations', data);
    return response.data;
  },

  async updateDelegationRule(id: string, data: UpdateDelegationRuleRequest): Promise<ApiResponse<DelegationRule>> {
    // TODO: Backend needs to implement PUT endpoint for delegation update
    const response = await apiClient.put<ApiResponse<DelegationRule>>(`/approvals/delegations/${id}`, data);
    return response.data;
  },

  async deleteDelegationRule(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/approvals/delegations/${id}`);
    return response.data;
  },

  async toggleDelegationRuleStatus(id: string): Promise<ApiResponse<DelegationRule>> {
    // TODO: Backend needs to implement toggle-status endpoint
    const response = await apiClient.post<ApiResponse<DelegationRule>>(`/approvals/delegations/${id}/toggle-status`);
    return response.data;
  },
};
