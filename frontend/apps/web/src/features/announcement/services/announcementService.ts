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
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
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
};
