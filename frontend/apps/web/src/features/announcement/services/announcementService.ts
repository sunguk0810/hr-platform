import { apiClient } from '@/lib/apiClient';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'NOTICE' | 'EVENT' | 'UPDATE' | 'URGENT';
  isPinned: boolean;
  viewCount: number;
  authorId: string;
  authorName: string;
  authorDepartment: string;
  createdAt: string;
  updatedAt: string;
  attachments?: {
    id: string;
    fileName: string;
    fileSize: number;
    fileUrl: string;
  }[];
}

export interface AnnouncementListItem {
  id: string;
  title: string;
  category: 'NOTICE' | 'EVENT' | 'UPDATE' | 'URGENT';
  isPinned: boolean;
  viewCount: number;
  authorName: string;
  createdAt: string;
  hasAttachment: boolean;
}

export interface AnnouncementListParams {
  page?: number;
  size?: number;
  category?: string;
  keyword?: string;
}

export interface AnnouncementListResponse {
  content: AnnouncementListItem[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  category: 'NOTICE' | 'EVENT' | 'UPDATE' | 'URGENT';
  isPinned?: boolean;
  attachmentIds?: string[];
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  category?: 'NOTICE' | 'EVENT' | 'UPDATE' | 'URGENT';
  isPinned?: boolean;
  attachmentIds?: string[];
}

export const announcementService = {
  getList: async (params: AnnouncementListParams = {}) => {
    const response = await apiClient.get<{ data: AnnouncementListResponse }>(
      '/announcements',
      { params }
    );
    return response.data;
  },

  getDetail: async (id: string) => {
    const response = await apiClient.get<{ data: Announcement }>(
      `/announcements/${id}`
    );
    return response.data;
  },

  create: async (data: CreateAnnouncementRequest) => {
    const response = await apiClient.post<{ data: Announcement }>(
      '/announcements',
      data
    );
    return response.data;
  },

  update: async (id: string, data: UpdateAnnouncementRequest) => {
    const response = await apiClient.put<{ data: Announcement }>(
      `/announcements/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<{ data: void }>(
      `/announcements/${id}`
    );
    return response.data;
  },
};
