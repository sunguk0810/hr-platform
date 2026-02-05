import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  Employee,
  EmployeeListItem,
  EmployeeSearchParams,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ResignationRequest,
  ResignationCancelRequest,
  EmployeeTransferRequest,
  EmployeeTransferApprovalRequest,
  EmployeeTransfer,
  EmployeeTransferSearchParams,
  UnmaskRequest,
  UnmaskResponse,
  RecordCard,
  EmployeeHistory,
  EmployeeHistorySearchParams,
  ConcurrentPosition,
  ConcurrentPositionSearchParams,
  CreateConcurrentPositionRequest,
  UpdateConcurrentPositionRequest,
  EndConcurrentPositionRequest,
  PrivacyAccessRequest,
  PrivacyAccessLog,
  PrivacyAccessLogSearchParams,
  PrivacyAccessRequestSearchParams,
  CreatePrivacyAccessRequest,
  ApprovePrivacyAccessRequest,
} from '@hr-platform/shared-types';

export const employeeService = {
  // ===== 기본 CRUD =====

  async getEmployees(params?: EmployeeSearchParams): Promise<ApiResponse<PageResponse<EmployeeListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<EmployeeListItem>>>('/employees', {
      params,
    });
    return response.data;
  },

  async getEmployee(id: string): Promise<ApiResponse<Employee>> {
    const response = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
    return response.data;
  },

  async createEmployee(data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> {
    const response = await apiClient.post<ApiResponse<Employee>>('/employees', data);
    return response.data;
  },

  async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<ApiResponse<Employee>> {
    const response = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/employees/${id}`);
    return response.data;
  },

  async exportEmployees(params?: EmployeeSearchParams): Promise<Blob> {
    const response = await apiClient.get('/employees/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  async importEmployees(file: File): Promise<ApiResponse<{ success: number; failed: number; errors?: string[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<{ success: number; failed: number; errors?: string[] }>>(
      '/employees/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async bulkDelete(ids: string[]): Promise<ApiResponse<{ deleted: number }>> {
    const response = await apiClient.post<ApiResponse<{ deleted: number }>>('/employees/bulk-delete', { ids });
    return response.data;
  },

  async getImportTemplate(): Promise<Blob> {
    const response = await apiClient.get('/employees/import/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  // ===== 퇴직 처리 (SDD 4.3) =====

  async resignation(id: string, data: ResignationRequest): Promise<ApiResponse<Employee>> {
    // Backend expects resignDate as query parameter
    const response = await apiClient.post<ApiResponse<Employee>>(`/employees/${id}/resign`, null, {
      params: { resignDate: data.resignationDate }
    });
    return response.data;
  },

  async resignationCancel(id: string, data: ResignationCancelRequest): Promise<ApiResponse<Employee>> {
    // TODO: Backend needs to implement resignation cancel endpoint
    const response = await apiClient.post<ApiResponse<Employee>>(`/employees/${id}/resign/cancel`, data);
    return response.data;
  },

  // ===== 계열사 전출/전입 (SDD 4.4) =====
  // Backend uses /transfers/** (separate controller)

  async requestTransfer(id: string, data: EmployeeTransferRequest): Promise<ApiResponse<EmployeeTransfer>> {
    // Backend expects employeeId in request body, not in path
    const response = await apiClient.post<ApiResponse<EmployeeTransfer>>('/transfers', {
      ...data,
      employeeId: id,
    });
    return response.data;
  },

  async approveTransferSource(transferId: string, data?: EmployeeTransferApprovalRequest): Promise<ApiResponse<EmployeeTransfer>> {
    const response = await apiClient.post<ApiResponse<EmployeeTransfer>>(
      `/transfers/${transferId}/approve-source`,
      data
    );
    return response.data;
  },

  async approveTransferTarget(transferId: string, data?: EmployeeTransferApprovalRequest): Promise<ApiResponse<EmployeeTransfer>> {
    const response = await apiClient.post<ApiResponse<EmployeeTransfer>>(
      `/transfers/${transferId}/approve-target`,
      data
    );
    return response.data;
  },

  async getTransfers(params?: EmployeeTransferSearchParams): Promise<ApiResponse<PageResponse<EmployeeTransfer>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<EmployeeTransfer>>>('/transfers', {
      params,
    });
    return response.data;
  },

  async getTransfer(transferId: string): Promise<ApiResponse<EmployeeTransfer>> {
    const response = await apiClient.get<ApiResponse<EmployeeTransfer>>(`/transfers/${transferId}`);
    return response.data;
  },

  async cancelTransfer(transferId: string, reason: string): Promise<ApiResponse<EmployeeTransfer>> {
    const response = await apiClient.post<ApiResponse<EmployeeTransfer>>(`/transfers/${transferId}/cancel`, {
      reason,
    });
    return response.data;
  },

  async submitTransfer(transferId: string): Promise<ApiResponse<EmployeeTransfer>> {
    const response = await apiClient.post<ApiResponse<EmployeeTransfer>>(`/transfers/${transferId}/submit`);
    return response.data;
  },

  async rejectTransfer(transferId: string, reason: string): Promise<ApiResponse<EmployeeTransfer>> {
    const response = await apiClient.post<ApiResponse<EmployeeTransfer>>(`/transfers/${transferId}/reject`, {
      reason,
    });
    return response.data;
  },

  async completeTransfer(transferId: string): Promise<ApiResponse<EmployeeTransfer>> {
    const response = await apiClient.post<ApiResponse<EmployeeTransfer>>(`/transfers/${transferId}/complete`);
    return response.data;
  },

  // ===== 개인정보 마스킹 해제 (SDD 4.5) =====

  async unmask(id: string, data: UnmaskRequest): Promise<ApiResponse<UnmaskResponse>> {
    const response = await apiClient.post<ApiResponse<UnmaskResponse>>(`/employees/${id}/unmask`, data);
    return response.data;
  },

  // ===== 인사기록카드 (SDD 4.6) =====

  async getRecordCard(id: string): Promise<ApiResponse<RecordCard>> {
    const response = await apiClient.get<ApiResponse<RecordCard>>(`/employees/${id}/record-card`);
    return response.data;
  },

  async getRecordCardPdf(id: string): Promise<Blob> {
    const response = await apiClient.get(`/employees/${id}/record-card/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // ===== 변경 이력 (SDD 3.2.7) =====

  async getHistory(
    id: string,
    params?: EmployeeHistorySearchParams
  ): Promise<ApiResponse<PageResponse<EmployeeHistory>>> {
    // Backend returns paginated response
    const response = await apiClient.get<ApiResponse<PageResponse<EmployeeHistory>>>(`/employees/${id}/histories`, {
      params,
    });
    return response.data;
  },

  // ===== 겸직/보직 관리 (PRD FR-ORG-002) =====

  async getConcurrentPositions(
    employeeId: string,
    params?: ConcurrentPositionSearchParams
  ): Promise<ApiResponse<ConcurrentPosition[]>> {
    const response = await apiClient.get<ApiResponse<ConcurrentPosition[]>>(
      `/employees/${employeeId}/concurrent-positions`,
      { params }
    );
    return response.data;
  },

  async getConcurrentPosition(
    employeeId: string,
    positionId: string
  ): Promise<ApiResponse<ConcurrentPosition>> {
    const response = await apiClient.get<ApiResponse<ConcurrentPosition>>(
      `/employees/${employeeId}/concurrent-positions/${positionId}`
    );
    return response.data;
  },

  async createConcurrentPosition(
    data: CreateConcurrentPositionRequest
  ): Promise<ApiResponse<ConcurrentPosition>> {
    const response = await apiClient.post<ApiResponse<ConcurrentPosition>>(
      `/employees/${data.employeeId}/concurrent-positions`,
      data
    );
    return response.data;
  },

  async updateConcurrentPosition(
    employeeId: string,
    positionId: string,
    data: UpdateConcurrentPositionRequest
  ): Promise<ApiResponse<ConcurrentPosition>> {
    const response = await apiClient.put<ApiResponse<ConcurrentPosition>>(
      `/employees/${employeeId}/concurrent-positions/${positionId}`,
      data
    );
    return response.data;
  },

  async endConcurrentPosition(
    employeeId: string,
    positionId: string,
    data: EndConcurrentPositionRequest
  ): Promise<ApiResponse<ConcurrentPosition>> {
    const response = await apiClient.post<ApiResponse<ConcurrentPosition>>(
      `/employees/${employeeId}/concurrent-positions/${positionId}/end`,
      data
    );
    return response.data;
  },

  async deleteConcurrentPosition(
    employeeId: string,
    positionId: string
  ): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/employees/${employeeId}/concurrent-positions/${positionId}`
    );
    return response.data;
  },

  async setPrimaryPosition(
    employeeId: string,
    positionId: string
  ): Promise<ApiResponse<ConcurrentPosition>> {
    const response = await apiClient.post<ApiResponse<ConcurrentPosition>>(
      `/employees/${employeeId}/concurrent-positions/${positionId}/set-primary`
    );
    return response.data;
  },

  // ===== 개인정보 조회 승인/이력 (PRD FR-EMP-002) =====

  async getPrivacyAccessRequests(
    params?: PrivacyAccessRequestSearchParams
  ): Promise<ApiResponse<PageResponse<PrivacyAccessRequest>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PrivacyAccessRequest>>>(
      '/employees/privacy/requests',
      { params }
    );
    return response.data;
  },

  async getPrivacyAccessRequest(
    requestId: string
  ): Promise<ApiResponse<PrivacyAccessRequest>> {
    const response = await apiClient.get<ApiResponse<PrivacyAccessRequest>>(
      `/employees/privacy/requests/${requestId}`
    );
    return response.data;
  },

  async createPrivacyAccessRequest(
    data: CreatePrivacyAccessRequest
  ): Promise<ApiResponse<PrivacyAccessRequest>> {
    const response = await apiClient.post<ApiResponse<PrivacyAccessRequest>>(
      '/employees/privacy/requests',
      data
    );
    return response.data;
  },

  async approvePrivacyAccessRequest(
    requestId: string,
    data: ApprovePrivacyAccessRequest
  ): Promise<ApiResponse<PrivacyAccessRequest>> {
    const response = await apiClient.post<ApiResponse<PrivacyAccessRequest>>(
      `/employees/privacy/requests/${requestId}/approve`,
      data
    );
    return response.data;
  },

  async getPrivacyAccessLogs(
    params?: PrivacyAccessLogSearchParams
  ): Promise<ApiResponse<PageResponse<PrivacyAccessLog>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PrivacyAccessLog>>>(
      '/employees/privacy/logs',
      { params }
    );
    return response.data;
  },

  async getEmployeePrivacyAccessLogs(
    employeeId: string,
    params?: PrivacyAccessLogSearchParams
  ): Promise<ApiResponse<PageResponse<PrivacyAccessLog>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PrivacyAccessLog>>>(
      `/employees/${employeeId}/privacy/logs`,
      { params }
    );
    return response.data;
  },
};
