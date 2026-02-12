import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type { AuditLog, AuditLogSearchParams } from '@hr-platform/shared-types';

export const auditService = {
  async getAuditLogs(params?: AuditLogSearchParams): Promise<ApiResponse<PageResponse<AuditLog>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<AuditLog>>>('/auth/audit-logs', {
      params,
    });
    return response.data;
  },

  async getAuditLogDetail(id: string): Promise<ApiResponse<AuditLog>> {
    const response = await apiClient.get<ApiResponse<AuditLog>>(`/auth/audit-logs/${id}`);
    return response.data;
  },

  async exportAuditLogs(params?: AuditLogSearchParams): Promise<Blob> {
    const response = await apiClient.get('/auth/audit-logs/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
