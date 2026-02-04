import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  EmployeeCard,
  EmployeeCardListItem,
  EmployeeCardSearchParams,
  CardIssueRequest,
  CardIssueRequestListItem,
  CreateCardIssueRequest,
  ReportLostCardRequest,
} from '@hr-platform/shared-types';

export const employeeCardService = {
  async getCards(params?: EmployeeCardSearchParams): Promise<ApiResponse<PageResponse<EmployeeCardListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<EmployeeCardListItem>>>('/employee-cards', { params });
    return response.data;
  },

  async getCard(id: string): Promise<ApiResponse<EmployeeCard>> {
    const response = await apiClient.get<ApiResponse<EmployeeCard>>(`/employee-cards/${id}`);
    return response.data;
  },

  async getMyCard(): Promise<ApiResponse<EmployeeCard>> {
    const response = await apiClient.get<ApiResponse<EmployeeCard>>('/employee-cards/my');
    return response.data;
  },

  async getIssueRequests(params?: { page?: number; size?: number }): Promise<ApiResponse<PageResponse<CardIssueRequestListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<CardIssueRequestListItem>>>('/employee-cards/issue-requests', { params });
    return response.data;
  },

  async createIssueRequest(data: CreateCardIssueRequest): Promise<ApiResponse<CardIssueRequest>> {
    const response = await apiClient.post<ApiResponse<CardIssueRequest>>('/employee-cards/issue-requests', data);
    return response.data;
  },

  async approveIssueRequest(id: string): Promise<ApiResponse<CardIssueRequest>> {
    const response = await apiClient.post<ApiResponse<CardIssueRequest>>(`/employee-cards/issue-requests/${id}/approve`);
    return response.data;
  },

  async reportLost(data: ReportLostCardRequest): Promise<ApiResponse<EmployeeCard>> {
    const response = await apiClient.post<ApiResponse<EmployeeCard>>('/employee-cards/report-lost', data);
    return response.data;
  },

  async revokeCard(id: string): Promise<ApiResponse<EmployeeCard>> {
    const response = await apiClient.post<ApiResponse<EmployeeCard>>(`/employee-cards/${id}/revoke`);
    return response.data;
  },
};
