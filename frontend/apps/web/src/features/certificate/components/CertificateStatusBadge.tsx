import { StatusBadge, StatusType } from '@/components/common/StatusBadge';
import type { RequestStatus } from '@hr-platform/shared-types';

interface CertificateStatusBadgeProps {
  status: RequestStatus;
}

export function CertificateStatusBadge({ status }: CertificateStatusBadgeProps) {
  const statusMap: Record<RequestStatus, { type: StatusType; label: string }> = {
    PENDING: { type: 'pending', label: '승인대기' },
    APPROVED: { type: 'info', label: '승인' },
    REJECTED: { type: 'error', label: '반려' },
    ISSUED: { type: 'success', label: '발급완료' },
    CANCELLED: { type: 'default', label: '취소' },
    EXPIRED: { type: 'warning', label: '만료' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

interface CertificateValidityBadgeProps {
  isValid: boolean;
  isRevoked?: boolean;
  isExpired?: boolean;
}

export function CertificateValidityBadge({ isValid, isRevoked, isExpired }: CertificateValidityBadgeProps) {
  if (isRevoked) {
    return <StatusBadge status="error" label="폐기됨" />;
  }
  if (isExpired) {
    return <StatusBadge status="warning" label="만료" />;
  }
  if (isValid) {
    return <StatusBadge status="success" label="유효" />;
  }
  return <StatusBadge status="error" label="무효" />;
}
