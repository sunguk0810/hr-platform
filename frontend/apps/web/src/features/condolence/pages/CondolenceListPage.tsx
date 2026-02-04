import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCondolenceRequests } from '../hooks/useCondolence';
import type { CondolenceRequestStatus, CondolenceType } from '@hr-platform/shared-types';
import { CONDOLENCE_TYPE_LABELS, CONDOLENCE_STATUS_LABELS } from '@hr-platform/shared-types';

const STATUS_COLORS: Record<CondolenceRequestStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function CondolenceListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CondolenceRequestStatus | ''>('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useCondolenceRequests({
    status: status || undefined,
    page,
    size: 10,
  });

  const requests = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <>
      <PageHeader
        title="경조비 관리"
        description="경조비 신청 및 지급 현황을 관리합니다."
        actions={
          <Button onClick={() => navigate('/condolence/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            경조비 신청
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" aria-hidden="true" />
            경조비 신청 목록
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={status || 'all'}
            onValueChange={(v) => { setStatus(v === 'all' ? '' : v as CondolenceRequestStatus); setPage(0); }}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="PENDING">대기중</TabsTrigger>
              <TabsTrigger value="APPROVED">승인</TabsTrigger>
              <TabsTrigger value="PAID">지급완료</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4"><SkeletonTable rows={5} /></div>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="경조비 신청이 없습니다"
                description="새로운 경조비를 신청하세요."
                action={{ label: '경조비 신청', onClick: () => navigate('/condolence/new') }}
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label="경조비 신청 목록">
                  <table className="w-full" role="grid" aria-label="경조비 신청">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">요청번호</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">직원</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">부서</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">유형</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">발생일</th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">금액</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr
                          key={req.id}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => navigate(`/condolence/${req.id}`)}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/condolence/${req.id}`)}
                        >
                          <td className="px-4 py-3 font-mono text-sm">{req.requestNumber}</td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium">{req.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{req.employeeNumber}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{req.departmentName}</td>
                          <td className="px-4 py-3 text-sm">{CONDOLENCE_TYPE_LABELS[req.type]}</td>
                          <td className="px-4 py-3 text-sm">{format(new Date(req.eventDate), 'yyyy-MM-dd', { locale: ko })}</td>
                          <td className="px-4 py-3 text-sm text-right">{req.amount.toLocaleString()}원</td>
                          <td className="px-4 py-3">
                            <Badge className={cn(STATUS_COLORS[req.status])} role="status">
                              {CONDOLENCE_STATUS_LABELS[req.status]}
                            </Badge>
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
    </>
  );
}
