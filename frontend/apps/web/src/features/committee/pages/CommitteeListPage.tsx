import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommittees } from '../hooks/useCommittee';
import type { CommitteeStatus, CommitteeType } from '@hr-platform/shared-types';
import { COMMITTEE_TYPE_LABELS, COMMITTEE_STATUS_LABELS } from '@hr-platform/shared-types';

const STATUS_COLORS: Record<CommitteeStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  DISSOLVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function CommitteeListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CommitteeStatus | ''>('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useCommittees({
    status: status || undefined,
    page,
    size: 10,
  });

  const committees = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <>
      <PageHeader
        title="위원회 관리"
        description="사내 위원회 현황을 관리합니다."
        actions={
          <Button onClick={() => navigate('/committee/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            위원회 등록
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" aria-hidden="true" />
            위원회 목록
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={status || 'all'}
            onValueChange={(v) => { setStatus(v === 'all' ? '' : v as CommitteeStatus); setPage(0); }}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="ACTIVE">활동중</TabsTrigger>
              <TabsTrigger value="INACTIVE">휴면</TabsTrigger>
              <TabsTrigger value="DISSOLVED">해산</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4"><SkeletonTable rows={5} /></div>
            ) : committees.length === 0 ? (
              <EmptyState
                icon={Users2}
                title="위원회가 없습니다"
                description="새로운 위원회를 등록하세요."
                action={{ label: '위원회 등록', onClick: () => navigate('/committee/new') }}
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label="위원회 목록">
                  <table className="w-full" role="grid" aria-label="위원회">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">코드</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">위원회명</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">유형</th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">위원 수</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">시작일</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {committees.map((committee) => (
                        <tr
                          key={committee.id}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => navigate(`/committee/${committee.id}`)}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/committee/${committee.id}`)}
                        >
                          <td className="px-4 py-3 font-mono text-sm">{committee.code}</td>
                          <td className="px-4 py-3 text-sm font-medium">{committee.name}</td>
                          <td className="px-4 py-3 text-sm">{COMMITTEE_TYPE_LABELS[committee.type]}</td>
                          <td className="px-4 py-3 text-sm text-right">{committee.memberCount}명</td>
                          <td className="px-4 py-3 text-sm">{committee.startDate}</td>
                          <td className="px-4 py-3">
                            <Badge className={cn(STATUS_COLORS[committee.status])} role="status">
                              {COMMITTEE_STATUS_LABELS[committee.status]}
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
