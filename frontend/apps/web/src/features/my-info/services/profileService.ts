import { apiClient, ApiResponse } from '@/lib/apiClient';

export interface UserProfile {
  id: string;
  employeeNumber: string;
  name: string;
  nameEn?: string;
  email: string;
  mobile?: string;
  birthDate?: string;
  hireDate: string;
  departmentId: string;
  departmentName: string;
  positionId?: string;
  positionName?: string;
  gradeId?: string;
  gradeName?: string;
  profileImageUrl?: string;
}

export interface UpdateProfileRequest {
  email?: string;
  mobile?: string;
  nameEn?: string;
}

export interface ProfilePhotoUploadResponse {
  url: string;
  filename: string;
}

export const profileService = {
  /**
   * 내 프로필 정보 조회
   */
  async getMyProfile(): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/profile/me');
    return response.data;
  },

  /**
   * 내 프로필 정보 수정
   */
  async updateMyProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    const response = await apiClient.put<ApiResponse<UserProfile>>('/profile/me', data);
    return response.data;
  },

  /**
   * 프로필 사진 업로드
   */
  async uploadProfilePhoto(file: File): Promise<ApiResponse<ProfilePhotoUploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<ProfilePhotoUploadResponse>>(
      '/profile/me/photo',
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
   * 프로필 사진 삭제
   */
  async deleteProfilePhoto(): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>('/profile/me/photo');
    return response.data;
  },
};

export default profileService;
