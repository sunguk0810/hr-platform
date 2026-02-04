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
  UpdateCodeStatusRequest,
  UpdateCodeStatusResponse,
  CheckDuplicateRequest,
  CheckDuplicateResponse,
  CodeImpactResult,
  CodeHistory,
  CodeHistorySearchParams,
  CodeSearchParams,
  CodeSearchResult,
  CodeTreeNode,
  MigrateCodeRequest,
  MigrationResult,
  MigrationPreview,
  TenantCodeSetting,
  TenantCodeSearchParams,
  UpdateTenantCodeRequest,
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

  // Update code status
  async updateCodeStatus(id: string, data: UpdateCodeStatusRequest): Promise<ApiResponse<UpdateCodeStatusResponse>> {
    const response = await apiClient.patch<ApiResponse<UpdateCodeStatusResponse>>(
      `/mdm/common-codes/${id}/status`,
      data
    );
    return response.data;
  },

  // Update code group status
  async updateCodeGroupStatus(id: string, data: UpdateCodeStatusRequest): Promise<ApiResponse<UpdateCodeStatusResponse>> {
    const response = await apiClient.patch<ApiResponse<UpdateCodeStatusResponse>>(
      `/mdm/code-groups/${id}/status`,
      data
    );
    return response.data;
  },

  // Check duplicate code
  async checkDuplicate(data: CheckDuplicateRequest): Promise<ApiResponse<CheckDuplicateResponse>> {
    const response = await apiClient.post<ApiResponse<CheckDuplicateResponse>>(
      '/mdm/common-codes/check-duplicate',
      data
    );
    return response.data;
  },

  // Get code impact analysis
  async getCodeImpact(id: string): Promise<ApiResponse<CodeImpactResult>> {
    const response = await apiClient.get<ApiResponse<CodeImpactResult>>(
      `/mdm/common-codes/${id}/impact`
    );
    return response.data;
  },

  // Get code history
  async getCodeHistory(id: string, params?: CodeHistorySearchParams): Promise<ApiResponse<PageResponse<CodeHistory>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CodeHistory>>>(
      `/mdm/common-codes/${id}/history`,
      { params }
    );
    return response.data;
  },

  // Search codes
  async searchCodes(params: CodeSearchParams): Promise<ApiResponse<CodeSearchResult[]>> {
    const response = await apiClient.get<ApiResponse<CodeSearchResult[]>>(
      '/mdm/common-codes/search',
      { params }
    );
    return response.data;
  },

  // Get code tree (hierarchical)
  async getCodeTree(groupCode: string): Promise<ApiResponse<CodeTreeNode[]>> {
    const response = await apiClient.get<ApiResponse<CodeTreeNode[]>>(
      `/mdm/code-groups/${groupCode}/tree`
    );
    return response.data;
  },

  // Migration preview
  async getMigrationPreview(sourceCodeId: string, targetCodeId: string): Promise<ApiResponse<MigrationPreview>> {
    const response = await apiClient.get<ApiResponse<MigrationPreview>>(
      '/mdm/common-codes/migration/preview',
      { params: { sourceCodeId, targetCodeId } }
    );
    return response.data;
  },

  // Migrate code
  async migrateCode(data: MigrateCodeRequest): Promise<ApiResponse<MigrationResult>> {
    const response = await apiClient.post<ApiResponse<MigrationResult>>(
      '/mdm/common-codes/migrate',
      data
    );
    return response.data;
  },

  // Get tenant codes
  async getTenantCodes(params?: TenantCodeSearchParams): Promise<ApiResponse<PageResponse<TenantCodeSetting>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<TenantCodeSetting>>>(
      '/mdm/tenant-codes',
      { params }
    );
    return response.data;
  },

  // Update tenant code
  async updateTenantCode(codeId: string, data: UpdateTenantCodeRequest): Promise<ApiResponse<TenantCodeSetting>> {
    const response = await apiClient.put<ApiResponse<TenantCodeSetting>>(
      `/mdm/tenant-codes/${codeId}`,
      data
    );
    return response.data;
  },

  // Reset tenant code to default
  async resetTenantCode(codeId: string): Promise<ApiResponse<TenantCodeSetting>> {
    const response = await apiClient.post<ApiResponse<TenantCodeSetting>>(
      `/mdm/tenant-codes/${codeId}/reset`
    );
    return response.data;
  },
};
