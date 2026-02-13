import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  AppointmentDraft,
  AppointmentDraftListItem,
  AppointmentDetail,
  AppointmentSearchParams,
  AppointmentSummary,
  CreateAppointmentDraftRequest,
  UpdateAppointmentDraftRequest,
  CreateAppointmentDetailRequest,
  CancelAppointmentDraftRequest,
} from '@hr-platform/shared-types';

export const appointmentService = {
  // ============================================
  // 발령안 CRUD
  // ============================================

  /**
   * 발령안 목록 조회
   */
  async getDrafts(params?: AppointmentSearchParams): Promise<ApiResponse<PageResponse<AppointmentDraftListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AppointmentDraftListItem>>>('/appointments/drafts', {
      params,
    });
    return response.data;
  },

  /**
   * 발령안 상세 조회
   */
  async getDraft(id: string): Promise<ApiResponse<AppointmentDraft>> {
    const response = await apiClient.get<ApiResponse<AppointmentDraft>>(`/appointments/drafts/${id}`);
    return response.data;
  },

  /**
   * 발령안 생성
   */
  async createDraft(data: CreateAppointmentDraftRequest): Promise<ApiResponse<AppointmentDraft>> {
    const response = await apiClient.post<ApiResponse<AppointmentDraft>>('/appointments/drafts', data);
    return response.data;
  },

  /**
   * 발령안 수정
   */
  async updateDraft(id: string, data: UpdateAppointmentDraftRequest): Promise<ApiResponse<AppointmentDraft>> {
    const response = await apiClient.put<ApiResponse<AppointmentDraft>>(`/appointments/drafts/${id}`, data);
    return response.data;
  },

  /**
   * 발령안 삭제
   */
  async deleteDraft(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/appointments/drafts/${id}`);
    return response.data;
  },

  // ============================================
  // 발령 상세 관리
  // ============================================

  /**
   * 발령 상세 추가 (대상 직원 추가)
   */
  async addDetail(draftId: string, data: CreateAppointmentDetailRequest): Promise<ApiResponse<AppointmentDetail>> {
    const response = await apiClient.post<ApiResponse<AppointmentDetail>>(
      `/appointments/drafts/${draftId}/details`,
      data
    );
    return response.data;
  },

  /**
   * 발령 상세 삭제 (대상 직원 삭제)
   */
  async removeDetail(draftId: string, detailId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/appointments/drafts/${draftId}/details/${detailId}`
    );
    return response.data;
  },

  // ============================================
  // 워크플로우
  // ============================================

  /**
   * 결재 요청 (상신)
   */
  async submitForApproval(draftId: string): Promise<ApiResponse<AppointmentDraft>> {
    const response = await apiClient.post<ApiResponse<AppointmentDraft>>(
      `/appointments/drafts/${draftId}/submit`
    );
    return response.data;
  },

  /**
   * 발령 시행
   */
  async executeDraft(draftId: string): Promise<ApiResponse<AppointmentDraft>> {
    const response = await apiClient.post<ApiResponse<AppointmentDraft>>(
      `/appointments/drafts/${draftId}/execute`
    );
    return response.data;
  },

  /**
   * 발령 취소
   */
  async cancelDraft(draftId: string, data: CancelAppointmentDraftRequest): Promise<ApiResponse<AppointmentDraft>> {
    const response = await apiClient.post<ApiResponse<AppointmentDraft>>(
      `/appointments/drafts/${draftId}/cancel`,
      data
    );
    return response.data;
  },

  // ============================================
  // 통계 및 요약
  // ============================================

  /**
   * 상태별 요약 조회
   */
  async getSummary(): Promise<ApiResponse<AppointmentSummary>> {
    const response = await apiClient.get<ApiResponse<AppointmentSummary>>('/appointments/drafts/summary');
    return response.data;
  },
};
