import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  HeadcountPlan,
  HeadcountPlanListItem,
  HeadcountPlanSearchParams,
  CreateHeadcountPlanRequest,
  UpdateHeadcountPlanRequest,
  HeadcountRequest,
  HeadcountRequestListItem,
  HeadcountRequestSearchParams,
  CreateHeadcountRequest,
  HeadcountSummary,
} from '@hr-platform/shared-types';

export const headcountService = {
  // 정현원 계획 목록 조회 - Backend returns List, not Page
  async getPlans(params?: HeadcountPlanSearchParams): Promise<ApiResponse<HeadcountPlanListItem[]>> {
    const response = await apiClient.get<ApiResponse<HeadcountPlanListItem[]>>('/headcounts/plans', {
      params,
    });
    return response.data;
  },

  // 정현원 계획 상세 조회
  async getPlan(id: string): Promise<ApiResponse<HeadcountPlan>> {
    const response = await apiClient.get<ApiResponse<HeadcountPlan>>(`/headcounts/plans/${id}`);
    return response.data;
  },

  // 정현원 계획 생성
  async createPlan(data: CreateHeadcountPlanRequest): Promise<ApiResponse<HeadcountPlan>> {
    const response = await apiClient.post<ApiResponse<HeadcountPlan>>('/headcounts/plans', data);
    return response.data;
  },

  // 정현원 계획 수정
  async updatePlan(id: string, data: UpdateHeadcountPlanRequest): Promise<ApiResponse<HeadcountPlan>> {
    const response = await apiClient.put<ApiResponse<HeadcountPlan>>(`/headcounts/plans/${id}`, data);
    return response.data;
  },

  // 정현원 계획 삭제
  async deletePlan(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/headcounts/plans/${id}`);
    return response.data;
  },

  // 정현원 요약 조회
  async getSummary(year: number): Promise<ApiResponse<HeadcountSummary>> {
    const response = await apiClient.get<ApiResponse<HeadcountSummary>>('/headcounts/summary', {
      params: { year },
    });
    return response.data;
  },

  // 정현원 변경 요청 목록 조회
  async getRequests(params?: HeadcountRequestSearchParams): Promise<ApiResponse<PageResponse<HeadcountRequestListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<HeadcountRequestListItem>>>('/headcounts/requests', {
      params,
    });
    return response.data;
  },

  // 정현원 변경 요청 상세 조회
  async getRequest(id: string): Promise<ApiResponse<HeadcountRequest>> {
    const response = await apiClient.get<ApiResponse<HeadcountRequest>>(`/headcounts/requests/${id}`);
    return response.data;
  },

  // 정현원 변경 요청 생성
  async createRequest(data: CreateHeadcountRequest): Promise<ApiResponse<HeadcountRequest>> {
    const response = await apiClient.post<ApiResponse<HeadcountRequest>>('/headcounts/requests', data);
    return response.data;
  },

  // 정현원 변경 요청 제출
  async submitRequest(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/headcounts/requests/${id}/submit`);
    return response.data;
  },

  // 정현원 변경 요청 취소
  async cancelRequest(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/headcounts/requests/${id}/cancel`);
    return response.data;
  },

  // 정현원 계획 승인
  async approvePlan(id: string): Promise<ApiResponse<HeadcountPlan>> {
    const response = await apiClient.post<ApiResponse<HeadcountPlan>>(`/headcounts/plans/${id}/approve`);
    return response.data;
  },

  // 정현원 변경 요청 승인
  async approveRequest(id: string): Promise<ApiResponse<HeadcountRequest>> {
    const response = await apiClient.post<ApiResponse<HeadcountRequest>>(`/headcounts/requests/${id}/approve`);
    return response.data;
  },

  // 정현원 변경 요청 반려
  async rejectRequest(id: string, reason: string): Promise<ApiResponse<HeadcountRequest>> {
    const response = await apiClient.post<ApiResponse<HeadcountRequest>>(`/headcounts/requests/${id}/reject`, { reason });
    return response.data;
  },
};
