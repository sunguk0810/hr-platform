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
  // 정현원 계획 목록 조회
  async getPlans(params?: HeadcountPlanSearchParams): Promise<ApiResponse<PageResponse<HeadcountPlanListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<HeadcountPlanListItem>>>('/headcount/plans', {
      params,
    });
    return response.data;
  },

  // 정현원 계획 상세 조회
  async getPlan(id: string): Promise<ApiResponse<HeadcountPlan>> {
    const response = await apiClient.get<ApiResponse<HeadcountPlan>>(`/headcount/plans/${id}`);
    return response.data;
  },

  // 정현원 계획 생성
  async createPlan(data: CreateHeadcountPlanRequest): Promise<ApiResponse<HeadcountPlan>> {
    const response = await apiClient.post<ApiResponse<HeadcountPlan>>('/headcount/plans', data);
    return response.data;
  },

  // 정현원 계획 수정
  async updatePlan(id: string, data: UpdateHeadcountPlanRequest): Promise<ApiResponse<HeadcountPlan>> {
    const response = await apiClient.put<ApiResponse<HeadcountPlan>>(`/headcount/plans/${id}`, data);
    return response.data;
  },

  // 정현원 계획 삭제
  async deletePlan(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/headcount/plans/${id}`);
    return response.data;
  },

  // 정현원 계획 승인
  async approvePlan(id: string): Promise<ApiResponse<HeadcountPlan>> {
    const response = await apiClient.post<ApiResponse<HeadcountPlan>>(`/headcount/plans/${id}/approve`);
    return response.data;
  },

  // 정현원 요약 조회
  async getSummary(year: number): Promise<ApiResponse<HeadcountSummary>> {
    const response = await apiClient.get<ApiResponse<HeadcountSummary>>('/headcount/summary', {
      params: { year },
    });
    return response.data;
  },

  // 정현원 변경 요청 목록 조회
  async getRequests(params?: HeadcountRequestSearchParams): Promise<ApiResponse<PageResponse<HeadcountRequestListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<HeadcountRequestListItem>>>('/headcount/requests', {
      params,
    });
    return response.data;
  },

  // 정현원 변경 요청 상세 조회
  async getRequest(id: string): Promise<ApiResponse<HeadcountRequest>> {
    const response = await apiClient.get<ApiResponse<HeadcountRequest>>(`/headcount/requests/${id}`);
    return response.data;
  },

  // 정현원 변경 요청 생성
  async createRequest(data: CreateHeadcountRequest): Promise<ApiResponse<HeadcountRequest>> {
    const response = await apiClient.post<ApiResponse<HeadcountRequest>>('/headcount/requests', data);
    return response.data;
  },

  // 정현원 변경 요청 승인
  async approveRequest(id: string): Promise<ApiResponse<HeadcountRequest>> {
    const response = await apiClient.post<ApiResponse<HeadcountRequest>>(`/headcount/requests/${id}/approve`);
    return response.data;
  },

  // 정현원 변경 요청 반려
  async rejectRequest(id: string, reason: string): Promise<ApiResponse<HeadcountRequest>> {
    const response = await apiClient.post<ApiResponse<HeadcountRequest>>(`/headcount/requests/${id}/reject`, { reason });
    return response.data;
  },

  // 정현원 변경 요청 취소
  async cancelRequest(id: string): Promise<ApiResponse<HeadcountRequest>> {
    const response = await apiClient.post<ApiResponse<HeadcountRequest>>(`/headcount/requests/${id}/cancel`);
    return response.data;
  },
};
