import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { CertificateStatusBadge } from './CertificateStatusBadge';
import { FileText, XCircle } from 'lucide-react';
import type { CertificateRequest, CertificateType, RequestStatus } from '@hr-platform/shared-types';
import { REQUEST_STATUS_LABELS, CERTIFICATE_LANGUAGE_LABELS } from '@hr-platform/shared-types';

interface CertificateRequestListProps {
  requests: CertificateRequest[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCancelRequest: (request: CertificateRequest) => void;
  certificateTypes: CertificateType[];
  selectedStatus: RequestStatus | '';
  selectedTypeCode: string;
  onStatusChange: (status: RequestStatus | '') => void;
  onTypeCodeChange: (typeCode: string) => void;
  onRequestClick?: (request: CertificateRequest) => void;
}

export function CertificateRequestList({
  requests,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onCancelRequest,
  certificateTypes,
  selectedStatus,
  selectedTypeCode,
  onStatusChange,
  onTypeCodeChange,
  onRequestClick,
}: CertificateRequestListProps) {
  const { t } = useTranslation('certificate');

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: ko });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle>{t('requestList.title')}</CardTitle>
        <div className="flex gap-2">
          <select
            value={selectedTypeCode}
            onChange={(e) => onTypeCodeChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">{t('requestList.allTypes')}</option>
            {certificateTypes.map((type) => (
              <option key={type.code} value={type.code}>
                {type.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as RequestStatus | '')}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="">{t('requestList.allStatuses')}</option>
            {Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={5} />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('requestList.emptyTitle')}
            description={t('requestList.emptyDescription')}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('requestList.table.requestNumber')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('requestList.table.certificateType')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('requestList.table.language')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('requestList.table.copies')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('requestList.table.purpose')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('requestList.table.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('requestList.table.requestDate')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('requestList.table.action')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => onRequestClick?.(request)}
                    >
                      <td className="px-4 py-3 text-sm font-mono">
                        {request.requestNumber}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {request.certificateTypeName ?? request.certificateType?.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {CERTIFICATE_LANGUAGE_LABELS[request.language]}
                      </td>
                      <td className="px-4 py-3 text-sm">{request.copies}{t('copyUnit')}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[150px] truncate">
                        {request.purpose || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <CertificateStatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(request.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {request.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancelRequest(request);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t('requestList.cancel')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
