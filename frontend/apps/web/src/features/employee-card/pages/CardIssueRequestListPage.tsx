import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { useCardIssueRequests, useApproveCardIssueRequest } from '../hooks/useEmployeeCard';
import { CARD_ISSUE_TYPE_LABELS } from '@hr-platform/shared-types';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ISSUED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const ISSUE_TYPE_COLORS = {
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  REISSUE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  RENEWAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function CardIssueRequestListPage() {
  const { t } = useTranslation('employeeCard');
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const { data, isLoading } = useCardIssueRequests({ page, size: 10 });
  const approveMutation = useApproveCardIssueRequest();

  const requests = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;

  const STATUS_LABELS = {
    PENDING: t('statuses.pending'),
    APPROVED: t('statuses.approved'),
    REJECTED: t('statuses.rejected'),
    ISSUED: t('statuses.issued'),
  };

  const handleApproveClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedRequestId) return;

    approveMutation.mutate(selectedRequestId, {
      onSuccess: () => {
        toast({
          title: t('approveToast.success'),
          description: t('approveToast.successDesc'),
        });
        setApproveDialogOpen(false);
        setSelectedRequestId(null);
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: t('approveToast.failed'),
          description: t('approveToast.failedDesc'),
        });
      },
    });
  };

  return (
    <>
      <PageHeader
        title={t('issueRequestList.title')}
        description={t('issueRequestList.description')}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" aria-hidden="true" />
            {t('issueRequestList.list')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="mt-4">
            {isLoading ? (
              <div className="p-4"><SkeletonTable rows={5} /></div>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title={t('issueRequestEmpty.title')}
                description={t('issueRequestEmpty.description')}
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label={t('issueRequestList.list')}>
                  <table className="w-full" role="grid" aria-label={t('issueRequestList.list')}>
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('issueRequestTable.requestNumber')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('issueRequestTable.employee')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('issueRequestTable.department')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('issueRequestTable.issueType')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('issueRequestTable.status')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('issueRequestTable.requestDate')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('issueRequestTable.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-mono text-sm">{request.requestNumber}</td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium">{request.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{request.employeeNumber}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{request.departmentName}</td>
                          <td className="px-4 py-3">
                            <Badge className={cn(ISSUE_TYPE_COLORS[request.issueType])}>
                              {CARD_ISSUE_TYPE_LABELS[request.issueType]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn(STATUS_COLORS[request.status])} role="status">
                              {STATUS_LABELS[request.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">{request.createdAt}</td>
                          <td className="px-4 py-3">
                            {request.status === 'PENDING' && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveClick(request.id)}
                              >
                                {t('approveDialog.confirm')}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('approveDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('approveDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('approveDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? t('approveDialog.processing') : t('approveDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
