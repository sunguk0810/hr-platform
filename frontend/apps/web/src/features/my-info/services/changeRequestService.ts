import { apiClient, ApiResponse } from '@/lib/apiClient';

export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ChangeRequestCategory =
  | 'ADDRESS'
  | 'EDUCATION'
  | 'CERTIFICATION'
  | 'FAMILY'
  | 'CAREER_HISTORY';

export interface MyInfoChangeRequest {
  id: string;
  category: ChangeRequestCategory;
  categoryLabel: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
  status: ChangeRequestStatus;
  requestDate: string;
  reviewDate?: string;
  reviewerName?: string;
  reviewerComment?: string;
}

export interface CreateChangeRequestPayload {
  category: ChangeRequestCategory;
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export const CATEGORY_OPTIONS: {
  value: ChangeRequestCategory;
  label: string;
}[] = [
  { value: 'ADDRESS', label: '주소' },
  { value: 'EDUCATION', label: '학력' },
  { value: 'CERTIFICATION', label: '자격증' },
  { value: 'FAMILY', label: '가족사항' },
  { value: 'CAREER_HISTORY', label: '경력사항' },
];

export const STATUS_CONFIG: Record<
  ChangeRequestStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: '대기중',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  APPROVED: {
    label: '승인',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  REJECTED: {
    label: '반려',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

export const changeRequestService = {
  /**
   * 내 정보 변경 요청 목록 조회
   */
  async getChangeRequests(
    status?: string
  ): Promise<ApiResponse<MyInfoChangeRequest[]>> {
    const params = status && status !== 'ALL' ? { status } : {};
    const response = await apiClient.get<ApiResponse<MyInfoChangeRequest[]>>(
      '/employees/me/change-requests',
      { params }
    );
    return response.data;
  },

  /**
   * 내 정보 변경 요청 생성
   */
  async createChangeRequest(
    data: CreateChangeRequestPayload
  ): Promise<ApiResponse<MyInfoChangeRequest>> {
    const response = await apiClient.post<ApiResponse<MyInfoChangeRequest>>(
      '/employees/me/change-requests',
      data
    );
    return response.data;
  },
};

export default changeRequestService;
