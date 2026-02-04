import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  CertificateType,
  CertificateRequest,
  CertificateIssue,
  VerificationResult,
  CreateCertificateRequestRequest,
  CertificateRequestSearchParams,
  CertificateIssueSearchParams,
} from '@hr-platform/shared-types';

export const certificateService = {
  // ===== 증명서 유형 =====

  async getCertificateTypes(): Promise<ApiResponse<CertificateType[]>> {
    const response = await apiClient.get<ApiResponse<CertificateType[]>>('/certificates/types');
    return response.data;
  },

  async getCertificateType(code: string): Promise<ApiResponse<CertificateType>> {
    const response = await apiClient.get<ApiResponse<CertificateType>>(`/certificates/types/${code}`);
    return response.data;
  },

  // ===== 증명서 신청 =====

  async createRequest(data: CreateCertificateRequestRequest): Promise<ApiResponse<CertificateRequest>> {
    const response = await apiClient.post<ApiResponse<CertificateRequest>>('/certificates/requests', data);
    return response.data;
  },

  async getMyRequests(params?: CertificateRequestSearchParams): Promise<ApiResponse<PageResponse<CertificateRequest>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CertificateRequest>>>('/certificates/requests/my', {
      params,
    });
    return response.data;
  },

  async getRequest(id: string): Promise<ApiResponse<CertificateRequest>> {
    const response = await apiClient.get<ApiResponse<CertificateRequest>>(`/certificates/requests/${id}`);
    return response.data;
  },

  async cancelRequest(id: string, reason?: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/certificates/requests/${id}/cancel`, { reason });
    return response.data;
  },

  // ===== 발급 이력 =====

  async getMyIssues(params?: CertificateIssueSearchParams): Promise<ApiResponse<PageResponse<CertificateIssue>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CertificateIssue>>>('/certificates/issues/my', {
      params,
    });
    return response.data;
  },

  async downloadCertificate(issueNumber: string): Promise<Blob> {
    const response = await apiClient.get(`/certificates/issues/${issueNumber}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ===== 진위확인 =====

  async verifyCertificate(verificationCode: string): Promise<ApiResponse<VerificationResult>> {
    const response = await apiClient.get<ApiResponse<VerificationResult>>(
      `/certificates/verify/${verificationCode}`
    );
    return response.data;
  },
};
