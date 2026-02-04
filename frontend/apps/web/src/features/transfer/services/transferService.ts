import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  TransferRequest,
  TransferRequestListItem,
  TransferSearchParams,
  CreateTransferRequest,
  UpdateTransferRequest,
  ApproveTransferRequest,
  RejectTransferRequest,
  TransferSummary,
  HandoverItem,
} from '@hr-platform/shared-types';

export const transferService = {
  // 전출/전입 목록 조회
  async getTransfers(params?: TransferSearchParams): Promise<ApiResponse<PageResponse<TransferRequestListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<TransferRequestListItem>>>('/transfers', {
      params,
    });
    return response.data;
  },

  // 전출/전입 상세 조회
  async getTransfer(id: string): Promise<ApiResponse<TransferRequest>> {
    const response = await apiClient.get<ApiResponse<TransferRequest>>(`/transfers/${id}`);
    return response.data;
  },

  // 전출/전입 요약 조회
  async getSummary(): Promise<ApiResponse<TransferSummary>> {
    const response = await apiClient.get<ApiResponse<TransferSummary>>('/transfers/summary');
    return response.data;
  },

  // 전출/전입 요청 생성
  async createTransfer(data: CreateTransferRequest): Promise<ApiResponse<TransferRequest>> {
    const response = await apiClient.post<ApiResponse<TransferRequest>>('/transfers', data);
    return response.data;
  },

  // 전출/전입 요청 수정
  async updateTransfer(id: string, data: UpdateTransferRequest): Promise<ApiResponse<TransferRequest>> {
    const response = await apiClient.put<ApiResponse<TransferRequest>>(`/transfers/${id}`, data);
    return response.data;
  },

  // 전출/전입 요청 제출 (상신)
  async submitTransfer(id: string): Promise<ApiResponse<TransferRequest>> {
    const response = await apiClient.post<ApiResponse<TransferRequest>>(`/transfers/${id}/submit`);
    return response.data;
  },

  // 전출 승인 (전출 테넌트)
  async approveSource(id: string, data?: ApproveTransferRequest): Promise<ApiResponse<TransferRequest>> {
    const response = await apiClient.post<ApiResponse<TransferRequest>>(`/transfers/${id}/approve-source`, data);
    return response.data;
  },

  // 전입 승인 (전입 테넌트)
  async approveTarget(id: string, data?: ApproveTransferRequest): Promise<ApiResponse<TransferRequest>> {
    const response = await apiClient.post<ApiResponse<TransferRequest>>(`/transfers/${id}/approve-target`, data);
    return response.data;
  },

  // 거부
  async rejectTransfer(id: string, data: RejectTransferRequest): Promise<ApiResponse<TransferRequest>> {
    const response = await apiClient.post<ApiResponse<TransferRequest>>(`/transfers/${id}/reject`, data);
    return response.data;
  },

  // 완료 처리
  async completeTransfer(id: string): Promise<ApiResponse<TransferRequest>> {
    const response = await apiClient.post<ApiResponse<TransferRequest>>(`/transfers/${id}/complete`);
    return response.data;
  },

  // 취소
  async cancelTransfer(id: string, reason: string): Promise<ApiResponse<TransferRequest>> {
    const response = await apiClient.post<ApiResponse<TransferRequest>>(`/transfers/${id}/cancel`, { reason });
    return response.data;
  },

  // 삭제 (임시저장 상태만)
  async deleteTransfer(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/transfers/${id}`);
    return response.data;
  },

  // 인수인계 항목 조회
  async getHandoverItems(transferId: string): Promise<ApiResponse<HandoverItem[]>> {
    const response = await apiClient.get<ApiResponse<HandoverItem[]>>(`/transfers/${transferId}/handover-items`);
    return response.data;
  },

  // 인수인계 항목 완료 처리
  async completeHandoverItem(transferId: string, itemId: string): Promise<ApiResponse<HandoverItem>> {
    const response = await apiClient.post<ApiResponse<HandoverItem>>(`/transfers/${transferId}/handover-items/${itemId}/complete`);
    return response.data;
  },

  // 대상 테넌트 목록 조회 (전입 가능한 계열사)
  async getAvailableTenants(): Promise<ApiResponse<Array<{ id: string; name: string; code: string }>>> {
    const response = await apiClient.get<ApiResponse<Array<{ id: string; name: string; code: string }>>>('/transfers/available-tenants');
    return response.data;
  },

  // 대상 테넌트의 부서 목록 조회
  async getTenantDepartments(tenantId: string): Promise<ApiResponse<Array<{ id: string; name: string; code: string }>>> {
    const response = await apiClient.get<ApiResponse<Array<{ id: string; name: string; code: string }>>>(`/transfers/tenants/${tenantId}/departments`);
    return response.data;
  },

  // 대상 테넌트의 직책/직급 목록 조회
  async getTenantPositions(tenantId: string): Promise<ApiResponse<Array<{ id: string; name: string }>>> {
    const response = await apiClient.get<ApiResponse<Array<{ id: string; name: string }>>>(`/transfers/tenants/${tenantId}/positions`);
    return response.data;
  },

  async getTenantGrades(tenantId: string): Promise<ApiResponse<Array<{ id: string; name: string }>>> {
    const response = await apiClient.get<ApiResponse<Array<{ id: string; name: string }>>>(`/transfers/tenants/${tenantId}/grades`);
    return response.data;
  },
};
