import { useTranslation } from 'react-i18next';
import { StatusBadge, StatusType } from '@/components/common/StatusBadge';
import type { RequestStatus } from '@hr-platform/shared-types';

const certificateTypeMap: Record<string, StatusType> = {
  PENDING: 'pending',
  APPROVED: 'info',
  REJECTED: 'error',
  ISSUED: 'success',
  CANCELLED: 'default',
  EXPIRED: 'warning',
};

interface CertificateStatusBadgeProps {
  status: RequestStatus;
}

export function CertificateStatusBadge({ status }: CertificateStatusBadgeProps) {
  const { t } = useTranslation('status');
  return <StatusBadge status={certificateTypeMap[status] ?? 'default'} label={t(`certificate.${status}`, status)} />;
}

interface CertificateValidityBadgeProps {
  isValid: boolean;
  isRevoked?: boolean;
  isExpired?: boolean;
}

export function CertificateValidityBadge({ isValid, isRevoked, isExpired }: CertificateValidityBadgeProps) {
  const { t } = useTranslation('status');
  if (isRevoked) {
    return <StatusBadge status="error" label={t('certificateValidity.REVOKED')} />;
  }
  if (isExpired) {
    return <StatusBadge status="warning" label={t('certificateValidity.EXPIRED')} />;
  }
  if (isValid) {
    return <StatusBadge status="success" label={t('certificateValidity.VALID')} />;
  }
  return <StatusBadge status="error" label={t('certificateValidity.INVALID')} />;
}
