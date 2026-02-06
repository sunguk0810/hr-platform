import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users2, Plus, ChevronRight, Info, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCommittees } from '../hooks/useCommittee';
import type { CommitteeStatus } from '@hr-platform/shared-types';
import { COMMITTEE_TYPE_LABELS, COMMITTEE_STATUS_LABELS } from '@hr-platform/shared-types';

const STATUS_COLORS: Record<CommitteeStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  DISSOLVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function CommitteeListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<CommitteeStatus | ''>('');
  const [page, setPage] = useState(0);
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const pendingSyncCount = 2; // mock count
  const lastSyncTime = '2024-12-20 14:30';

  const { data, isLoading } = useCommittees({
    status: status || undefined,
    page,
    size: 10,
  });

  const committees = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['committees'] });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">위원회 관리</h1>
              <p className="text-sm text-muted-foreground">사내 위원회 현황</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <RefreshCw className="h-3 w-3" />
                마지막 동기화: {lastSyncTime}
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/committee/new')}>
              <Plus className="mr-1 h-4 w-4" />
              등록
            </Button>
          </div>

          {/* 당연직 자동 변경 알림 배너 */}
          {showSyncBanner && pendingSyncCount > 0 && (
            <Alert variant="info" className="mb-0">
              <Info className="h-4 w-4" />
              <AlertTitle>위원 자동 변경 알림</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>인사발령에 의한 위원 자동 변경이 {pendingSyncCount}건 대기 중입니다.</span>
                <Button variant="outline" size="sm" onClick={() => setShowSyncBanner(false)}>확인</Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Mobile Tab Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { value: '', label: '전체' },
              { value: 'ACTIVE', label: '활동중' },
              { value: 'INACTIVE', label: '휴면' },
              { value: 'DISSOLVED', label: '해산' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => { setStatus(item.value as CommitteeStatus | ''); setPage(0); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  status === item.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Committee List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : committees.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="위원회가 없습니다"
              description="새로운 위원회를 등록하세요."
              action={{ label: '위원회 등록', onClick: () => navigate('/committee/new') }}
            />
          ) : (
            <div className="space-y-3">
              {committees.map((committee) => (
                <button
                  key={committee.id}
                  onClick={() => navigate(`/committee/${committee.id}`)}
                  className="w-full bg-card rounded-xl border p-4 text-left transition-colors active:bg-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn(STATUS_COLORS[committee.status], 'text-xs')}>
                          {COMMITTEE_STATUS_LABELS[committee.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {COMMITTEE_TYPE_LABELS[committee.type]}
                        </span>
                        {committee.exOfficioCount > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            당연직 {committee.exOfficioCount}명
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">{committee.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">{committee.code}</span>
                        <span>·</span>
                        <span>{committee.memberCount}명</span>
                        <span>·</span>
                        <span>{committee.startDate}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </div>
          )}
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
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

      <p className="text-xs text-muted-foreground flex items-center gap-1 -mt-4 mb-4">
        <RefreshCw className="h-3 w-3" />
        마지막 동기화: {lastSyncTime}
      </p>

      {showSyncBanner && pendingSyncCount > 0 && (
        <Alert variant="info" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>위원 자동 변경 알림</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>인사발령에 의한 위원 자동 변경이 {pendingSyncCount}건 대기 중입니다.</span>
            <Button variant="outline" size="sm" onClick={() => setShowSyncBanner(false)}>확인</Button>
          </AlertDescription>
        </Alert>
      )}

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
                        <th scope="col" className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">당연직</th>
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
                          <td className="px-4 py-3 text-center">
                            {committee.exOfficioCount > 0 ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                당연직 {committee.exOfficioCount}명
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
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
