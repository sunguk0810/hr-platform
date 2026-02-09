import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('committee');
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
              <h1 className="text-xl font-bold">{t('title')}</h1>
              <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <RefreshCw className="h-3 w-3" />
                {t('sync.lastSync')}{lastSyncTime}
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/committee/new')}>
              <Plus className="mr-1 h-4 w-4" />
              {t('buttons.create')}
            </Button>
          </div>

          {/* 당연직 자동 변경 알림 배너 */}
          {showSyncBanner && pendingSyncCount > 0 && (
            <Alert variant="info" className="mb-0">
              <Info className="h-4 w-4" />
              <AlertTitle>{t('sync.autoChangeAlert')}</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{t('sync.autoChangeMessage', { count: pendingSyncCount })}</span>
                <Button variant="outline" size="sm" onClick={() => setShowSyncBanner(false)}>{t('sync.confirm')}</Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Mobile Tab Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { value: '', label: t('tabs.all') },
              { value: 'ACTIVE', label: t('tabs.active') },
              { value: 'INACTIVE', label: t('tabs.dormant') },
              { value: 'DISSOLVED', label: t('tabs.dissolved') },
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
              title={t('empty.title')}
              description={t('empty.description')}
              action={{ label: t('create'), onClick: () => navigate('/committee/new') }}
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
                            {t('memberCount.exOfficio', { count: committee.exOfficioCount })}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">{committee.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">{committee.code}</span>
                        <span>·</span>
                        <span>{t('memberCount.total', { count: committee.memberCount })}</span>
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
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={() => navigate('/committee/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('create')}
          </Button>
        }
      />

      <p className="text-xs text-muted-foreground flex items-center gap-1 -mt-4 mb-4">
        <RefreshCw className="h-3 w-3" />
        {t('sync.lastSync')}{lastSyncTime}
      </p>

      {showSyncBanner && pendingSyncCount > 0 && (
        <Alert variant="info" className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>{t('sync.autoChangeAlert')}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{t('sync.autoChangeMessage', { count: pendingSyncCount })}</span>
            <Button variant="outline" size="sm" onClick={() => setShowSyncBanner(false)}>{t('sync.confirm')}</Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5" aria-hidden="true" />
            {t('list')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={status || 'all'}
            onValueChange={(v) => { setStatus(v === 'all' ? '' : v as CommitteeStatus); setPage(0); }}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
              <TabsTrigger value="ACTIVE">{t('tabs.active')}</TabsTrigger>
              <TabsTrigger value="INACTIVE">{t('tabs.dormant')}</TabsTrigger>
              <TabsTrigger value="DISSOLVED">{t('tabs.dissolved')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4"><SkeletonTable rows={5} /></div>
            ) : committees.length === 0 ? (
              <EmptyState
                icon={Users2}
                title={t('empty.title')}
                description={t('empty.description')}
                action={{ label: t('create'), onClick: () => navigate('/committee/new') }}
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label={t('list')}>
                  <table className="w-full" role="grid" aria-label={t('list')}>
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.code')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.name')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.type')}</th>
                        <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{t('table.memberCount')}</th>
                        <th scope="col" className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">{t('table.exOfficio')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.startDate')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.status')}</th>
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
                          <td className="px-4 py-3 text-sm text-right">{t('memberCount.total', { count: committee.memberCount })}</td>
                          <td className="px-4 py-3 text-center">
                            {committee.exOfficioCount > 0 ? (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                {t('memberCount.exOfficio', { count: committee.exOfficioCount })}
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
