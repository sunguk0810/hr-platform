import { useState } from 'react';
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

const STATUS_LABELS = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '반려',
  ISSUED: '발급완료',
};

const ISSUE_TYPE_COLORS = {
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  REISSUE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  RENEWAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function CardIssueRequestListPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const { data, isLoading } = useCardIssueRequests({ page, size: 10 });
  const approveMutation = useApproveCardIssueRequest();

  const requests = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;

  const handleApproveClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!selectedRequestId) return;

    approveMutation.mutate(selectedRequestId, {
      onSuccess: () => {
        toast({
          title: '승인 완료',
          description: '사원증 발급 요청이 승인되었습니다.',
        });
        setApproveDialogOpen(false);
        setSelectedRequestId(null);
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: '승인 실패',
          description: '사원증 발급 요청 승인에 실패했습니다.',
        });
      },
    });
  };

  return (
    <>
      <PageHeader
        title="사원증 발급 요청 관리"
        description="사원증 발급 요청을 승인하고 관리합니다."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" aria-hidden="true" />
            발급 요청 목록
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="mt-4">
            {isLoading ? (
              <div className="p-4"><SkeletonTable rows={5} /></div>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title="발급 요청이 없습니다"
                description="현재 처리할 사원증 발급 요청이 없습니다."
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label="발급 요청 목록">
                  <table className="w-full" role="grid" aria-label="발급 요청">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">요청번호</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">직원</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">부서</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">발급유형</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">상태</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">요청일</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">액션</th>
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
                                승인
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
            <AlertDialogTitle>발급 요청 승인</AlertDialogTitle>
            <AlertDialogDescription>
              이 사원증 발급 요청을 승인하시겠습니까? 승인 후 사원증이 발급됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? '처리중...' : '승인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
