import { useQuery } from '@tanstack/react-query';
import { auditService } from '../services/auditService';
import type { AuditLogSearchParams } from '@hr-platform/shared-types';

export function useAuditLogs(params?: AuditLogSearchParams) {
  return useQuery({
    queryKey: ['audit', 'logs', params],
    queryFn: () => auditService.getAuditLogs(params),
    select: (response) => response.data,
  });
}

export function useAuditLogDetail(id: string) {
  return useQuery({
    queryKey: ['audit', 'logs', id],
    queryFn: () => auditService.getAuditLogDetail(id),
    select: (response) => response.data,
    enabled: !!id,
  });
}
