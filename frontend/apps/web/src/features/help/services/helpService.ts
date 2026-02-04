import { apiClient, ApiResponse } from '@/lib/apiClient';

export type ContactCategory =
  | 'account'
  | 'attendance'
  | 'approval'
  | 'organization'
  | 'system'
  | 'suggestion'
  | 'other';

export interface ContactInquiry {
  id: string;
  category: ContactCategory;
  subject: string;
  message: string;
  attachments?: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  response?: string;
  respondedAt?: string;
}

export interface CreateContactInquiryRequest {
  category: ContactCategory;
  subject: string;
  message: string;
  attachments?: string[];
}

export interface UploadAttachmentResponse {
  id: string;
  filename: string;
  url: string;
  size: number;
}

export const helpService = {
  /**
   * 문의하기 제출
   */
  async submitInquiry(
    data: CreateContactInquiryRequest
  ): Promise<ApiResponse<ContactInquiry>> {
    const response = await apiClient.post<ApiResponse<ContactInquiry>>(
      '/help/inquiries',
      data
    );
    return response.data;
  },

  /**
   * 내 문의 목록 조회
   */
  async getMyInquiries(): Promise<ApiResponse<ContactInquiry[]>> {
    const response = await apiClient.get<ApiResponse<ContactInquiry[]>>(
      '/help/inquiries/me'
    );
    return response.data;
  },

  /**
   * 문의 상세 조회
   */
  async getInquiry(id: string): Promise<ApiResponse<ContactInquiry>> {
    const response = await apiClient.get<ApiResponse<ContactInquiry>>(
      `/help/inquiries/${id}`
    );
    return response.data;
  },

  /**
   * 첨부파일 업로드
   */
  async uploadAttachment(file: File): Promise<ApiResponse<UploadAttachmentResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<UploadAttachmentResponse>>(
      '/help/attachments',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * 첨부파일 삭제
   */
  async deleteAttachment(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/help/attachments/${id}`
    );
    return response.data;
  },
};

export default helpService;
