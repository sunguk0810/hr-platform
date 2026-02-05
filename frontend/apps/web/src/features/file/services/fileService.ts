import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';

export interface FileInfo {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: FileCategory;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
}

export type FileCategory =
  | 'PROFILE'
  | 'DOCUMENT'
  | 'CERTIFICATE'
  | 'APPROVAL'
  | 'ANNOUNCEMENT'
  | 'RECRUITMENT'
  | 'OTHER';

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  PROFILE: '프로필 사진',
  DOCUMENT: '문서',
  CERTIFICATE: '증명서',
  APPROVAL: '결재 첨부',
  ANNOUNCEMENT: '공지사항',
  RECRUITMENT: '채용 자료',
  OTHER: '기타',
};

export interface FileSearchParams {
  category?: FileCategory;
  fileName?: string;
  uploadedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface UploadFileRequest {
  file: File;
  category: FileCategory;
  description?: string;
}

export const fileService = {
  async getFiles(params?: FileSearchParams): Promise<ApiResponse<PageResponse<FileInfo>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<FileInfo>>>('/files', { params });
    return response.data;
  },

  async getFileById(id: string): Promise<ApiResponse<FileInfo>> {
    const response = await apiClient.get<ApiResponse<FileInfo>>(`/files/${id}`);
    return response.data;
  },

  async uploadFile({ file, category, description }: UploadFileRequest): Promise<ApiResponse<FileInfo>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post<ApiResponse<FileInfo>>('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteFile(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/files/${id}`);
    return response.data;
  },

  async downloadFile(id: string): Promise<Blob> {
    const response = await apiClient.get(`/files/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getPreviewUrl(id: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    return `${baseUrl}/files/${id}/preview`;
  },

  getCategories(): FileCategory[] {
    return ['PROFILE', 'DOCUMENT', 'CERTIFICATE', 'APPROVAL', 'ANNOUNCEMENT', 'RECRUITMENT', 'OTHER'];
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  },

  isPdfFile(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  },
};
