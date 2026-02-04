import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  Committee,
  CommitteeListItem,
  CommitteeSearchParams,
  CreateCommitteeRequest,
  CommitteeMember,
  AddCommitteeMemberRequest,
} from '@hr-platform/shared-types';

export const committeeService = {
  async getCommittees(params?: CommitteeSearchParams): Promise<ApiResponse<PageResponse<CommitteeListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CommitteeListItem>>>('/committees', { params });
    return response.data;
  },

  async getCommittee(id: string): Promise<ApiResponse<Committee>> {
    const response = await apiClient.get<ApiResponse<Committee>>(`/committees/${id}`);
    return response.data;
  },

  async createCommittee(data: CreateCommitteeRequest): Promise<ApiResponse<Committee>> {
    const response = await apiClient.post<ApiResponse<Committee>>('/committees', data);
    return response.data;
  },

  async updateCommittee(id: string, data: Partial<CreateCommitteeRequest>): Promise<ApiResponse<Committee>> {
    const response = await apiClient.put<ApiResponse<Committee>>(`/committees/${id}`, data);
    return response.data;
  },

  async getMembers(committeeId: string): Promise<ApiResponse<CommitteeMember[]>> {
    const response = await apiClient.get<ApiResponse<CommitteeMember[]>>(`/committees/${committeeId}/members`);
    return response.data;
  },

  async addMember(committeeId: string, data: AddCommitteeMemberRequest): Promise<ApiResponse<CommitteeMember>> {
    const response = await apiClient.post<ApiResponse<CommitteeMember>>(`/committees/${committeeId}/members`, data);
    return response.data;
  },

  async removeMember(committeeId: string, memberId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(`/committees/${committeeId}/members/${memberId}`);
    return response.data;
  },
};
