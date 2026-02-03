import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  CodeGroup,
  CodeGroupListItem,
  CodeGroupSearchParams,
  CreateCodeGroupRequest,
  UpdateCodeGroupRequest,
  CommonCode,
  CommonCodeListItem,
  CommonCodeSearchParams,
  CreateCommonCodeRequest,
  UpdateCommonCodeRequest,
  CodeOption,
} from '@hr-platform/shared-types';

export const mdmService = {
  // Code Groups
  async getCodeGroups(params?: CodeGroupSearchParams): Promise<ApiResponse<PageResponse<CodeGroupListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CodeGroupListItem>>>('/mdm/code-groups', {
      params,
    });
    return response.data;
  },

  async getCodeGroup(id: string): Promise<ApiResponse<CodeGroup>> {
    const response = await apiClient.get<ApiResponse<CodeGroup>>(`/mdm/code-groups/${id}`);
    return response.data;
  },

  async createCodeGroup(data: CreateCodeGroupRequest): Promise<ApiResponse<CodeGroup>> {
    const response = await apiClient.post<ApiResponse<CodeGroup>>('/mdm/code-groups', data);
    return response.data;
  },

  async updateCodeGroup(id: string, data: UpdateCodeGroupRequest): Promise<ApiResponse<CodeGroup>> {
    const response = await apiClient.put<ApiResponse<CodeGroup>>(`/mdm/code-groups/${id}`, data);
    return response.data;
  },

  async deleteCodeGroup(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/mdm/code-groups/${id}`);
    return response.data;
  },

  // Common Codes
  async getCommonCodes(params?: CommonCodeSearchParams): Promise<ApiResponse<PageResponse<CommonCodeListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CommonCodeListItem>>>('/mdm/common-codes', {
      params,
    });
    return response.data;
  },

  async getCommonCode(id: string): Promise<ApiResponse<CommonCode>> {
    const response = await apiClient.get<ApiResponse<CommonCode>>(`/mdm/common-codes/${id}`);
    return response.data;
  },

  async createCommonCode(data: CreateCommonCodeRequest): Promise<ApiResponse<CommonCode>> {
    const response = await apiClient.post<ApiResponse<CommonCode>>('/mdm/common-codes', data);
    return response.data;
  },

  async updateCommonCode(id: string, data: UpdateCommonCodeRequest): Promise<ApiResponse<CommonCode>> {
    const response = await apiClient.put<ApiResponse<CommonCode>>(`/mdm/common-codes/${id}`, data);
    return response.data;
  },

  async deleteCommonCode(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/mdm/common-codes/${id}`);
    return response.data;
  },

  // Get codes by group (for dropdowns)
  async getCodesByGroup(groupCode: string): Promise<ApiResponse<CodeOption[]>> {
    const response = await apiClient.get<ApiResponse<CodeOption[]>>(`/mdm/codes/${groupCode}`);
    return response.data;
  },
};
