import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  TenantDetail,
  TenantListItem,
  TenantSearchParams,
  CreateTenantRequest,
  UpdateTenantRequest,
  TenantStatus,
  TenantTreeNode,
  PolicyType,
  TenantFeature,
  FeatureCode,
  TenantBranding,
  InheritPoliciesRequest,
  ToggleFeatureRequest,
  LeavePolicy,
  AttendancePolicy,
  ApprovalPolicy,
  PasswordPolicy,
  SecurityPolicy,
  NotificationPolicy,
  OrganizationPolicy,
  PolicyChangeHistory,
  TenantHierarchy,
  UpdateHierarchyRequest,
} from '@hr-platform/shared-types';

// 정책 타입별 데이터 타입 매핑
export type PolicyDataMap = {
  LEAVE: LeavePolicy;
  ATTENDANCE: AttendancePolicy;
  APPROVAL: ApprovalPolicy;
  PASSWORD: PasswordPolicy;
  SECURITY: SecurityPolicy;
  NOTIFICATION: NotificationPolicy;
  ORGANIZATION: OrganizationPolicy;
};

export const tenantService = {
  async getTenants(params?: TenantSearchParams): Promise<ApiResponse<PageResponse<TenantListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<TenantListItem>>>('/tenants', {
      params,
    });
    return response.data;
  },

  async getTenant(id: string): Promise<ApiResponse<TenantDetail>> {
    const response = await apiClient.get<ApiResponse<TenantDetail>>(`/tenants/${id}`);
    return response.data;
  },

  async createTenant(data: CreateTenantRequest): Promise<ApiResponse<TenantDetail>> {
    const response = await apiClient.post<ApiResponse<TenantDetail>>('/tenants', data);
    return response.data;
  },

  async updateTenant(id: string, data: UpdateTenantRequest): Promise<ApiResponse<TenantDetail>> {
    const response = await apiClient.put<ApiResponse<TenantDetail>>(`/tenants/${id}`, data);
    return response.data;
  },

  async changeStatus(id: string, status: TenantStatus): Promise<ApiResponse<TenantDetail>> {
    const response = await apiClient.post<ApiResponse<TenantDetail>>(`/tenants/${id}/status`, { status });
    return response.data;
  },

  async deleteTenant(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/tenants/${id}`);
    return response.data;
  },

  // 트리 구조 조회
  async getTenantTree(): Promise<ApiResponse<TenantTreeNode[]>> {
    const response = await apiClient.get<ApiResponse<TenantTreeNode[]>>('/tenants/tree');
    return response.data;
  },

  // 계열사 목록 조회
  async getSubsidiaries(parentId: string): Promise<ApiResponse<TenantListItem[]>> {
    const response = await apiClient.get<ApiResponse<TenantListItem[]>>(`/tenants/${parentId}/subsidiaries`);
    return response.data;
  },

  // 정책 수정
  async updatePolicy<T extends PolicyType>(
    id: string,
    policyType: T,
    data: PolicyDataMap[T]
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/tenants/${id}/policies/${policyType.toLowerCase()}`, data);
    return response.data;
  },

  // 기능 목록 조회
  async getFeatures(id: string): Promise<ApiResponse<TenantFeature[]>> {
    const response = await apiClient.get<ApiResponse<TenantFeature[]>>(`/tenants/${id}/features`);
    return response.data;
  },

  // 기능 토글
  async toggleFeature(
    id: string,
    code: FeatureCode,
    data: ToggleFeatureRequest
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/tenants/${id}/features/${code}`, data);
    return response.data;
  },

  // 브랜딩 이미지 업로드
  async uploadBrandingImage(
    id: string,
    type: 'logo' | 'favicon' | 'background',
    file: File
  ): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      `/tenants/${id}/branding/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // 브랜딩 수정
  async updateBranding(id: string, data: TenantBranding): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/tenants/${id}/branding`, data);
    return response.data;
  },

  // 정책 상속 (그룹사 → 계열사)
  async inheritPolicies(parentId: string, data: InheritPoliciesRequest): Promise<ApiResponse<void>> {
    const response = await apiClient.post<ApiResponse<void>>(`/tenants/${parentId}/inherit-policies`, data);
    return response.data;
  },

  // 모듈 설정 수정
  async updateModules(id: string, modules: string[]): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(`/tenants/${id}/modules`, { modules });
    return response.data;
  },

  // 정책 변경 이력 조회
  async getPolicyHistory(
    id: string,
    policyType?: PolicyType
  ): Promise<ApiResponse<PolicyChangeHistory[]>> {
    const response = await apiClient.get<ApiResponse<PolicyChangeHistory[]>>(
      `/tenants/${id}/policy-history`,
      { params: policyType ? { policyType } : undefined }
    );
    return response.data;
  },

  // 조직 계층 조회
  async getHierarchy(id: string): Promise<ApiResponse<TenantHierarchy>> {
    const response = await apiClient.get<ApiResponse<TenantHierarchy>>(
      `/tenants/${id}/hierarchy`
    );
    return response.data;
  },

  // 조직 계층 수정
  async updateHierarchy(
    id: string,
    data: UpdateHierarchyRequest
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.put<ApiResponse<void>>(
      `/tenants/${id}/hierarchy`,
      data
    );
    return response.data;
  },
};
