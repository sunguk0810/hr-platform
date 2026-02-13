import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, FileText, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { AppointmentDraftStatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAppointmentDrafts,
  useAppointmentSummary,
  useAppointmentSearchParams,
} from '../hooks/useAppointments';
import type { DraftStatus } from '@hr-platform/shared-types';

export default function AppointmentListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('appointment');
  const { params, searchState, setStatus, setKeyword, setPage, resetFilters } =
    useAppointmentSearchParams();
  const { data: draftsData, isLoading: isDraftsLoading } = useAppointmentDrafts(params);
  const { data: summaryData, isLoading: isSummaryLoading } = useAppointmentSummary();

  const drafts = draftsData?.data?.content ?? [];
  const totalPages = draftsData?.data?.page?.totalPages ?? 0;
  const summary = summaryData?.data;

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setStatus('');
    } else {
      setStatus(value as DraftStatus);
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/appointments/${id}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };

  const clearSearch = () => {
    setKeyword('');
  };

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={() => navigate('/appointments/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newAppointment')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4" role="region" aria-label={t('list.summaryAriaLabel')}>
        {isSummaryLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-16 mx-auto" aria-hidden="true" />
                  <div className="h-8 bg-muted animate-pulse rounded w-12 mx-auto" aria-hidden="true" />
                </div>
                <span className="sr-only">{t('loading')}</span>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground" id="draft-count-label">{t('stats.draft')}</p>
                  <p className="mt-1 text-3xl font-bold" aria-labelledby="draft-count-label">{summary?.draftCount ?? 0}<span className="sr-only">{t('stats.count')}</span></p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground" id="pending-count-label">{t('stats.pendingApproval')}</p>
                  <p className="mt-1 text-3xl font-bold text-orange-500" aria-labelledby="pending-count-label">
                    {summary?.pendingApprovalCount ?? 0}<span className="sr-only">{t('stats.count')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground" id="approved-count-label">{t('stats.approved')}</p>
                  <p className="mt-1 text-3xl font-bold text-blue-500" aria-labelledby="approved-count-label">
                    {summary?.approvedCount ?? 0}<span className="sr-only">{t('stats.count')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground" id="executed-count-label">{t('stats.executed')}</p>
                  <p className="mt-1 text-3xl font-bold text-green-500" aria-labelledby="executed-count-label">
                    {summary?.executedCount ?? 0}<span className="sr-only">{t('stats.count')}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Drafts List */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('list.title')}</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder={t('list.searchPlaceholder')}
                value={searchState.keyword}
                onChange={handleSearch}
                className="pl-9 pr-9"
                aria-label={t('list.searchAriaLabel')}
              />
              {searchState.keyword && (
                <p className="mt-1 text-xs text-amber-600">
                  제목/번호 키워드 검색은 서버 계약에서 미지원이며 상태 필터만 반영됩니다.
                </p>
              )}
              {searchState.keyword && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={t('list.clearSearch')}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={searchState.status || 'all'}
            onValueChange={handleTabChange}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
              <TabsTrigger value="DRAFT">{t('tabs.draft')}</TabsTrigger>
              <TabsTrigger value="PENDING_APPROVAL">{t('tabs.pendingApproval')}</TabsTrigger>
              <TabsTrigger value="APPROVED">{t('tabs.approved')}</TabsTrigger>
              <TabsTrigger value="EXECUTED">{t('tabs.executed')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isDraftsLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : drafts.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={
                  searchState.status || searchState.keyword
                    ? t('empty.noResults')
                    : t('empty.noAppointments')
                }
                description={
                  searchState.status || searchState.keyword
                    ? t('empty.noResultsDesc')
                    : t('empty.noAppointmentsDesc')
                }
                action={
                  searchState.status || searchState.keyword
                    ? { label: t('empty.resetFilter'), onClick: resetFilters }
                    : { label: t('newAppointment'), onClick: () => navigate('/appointments/new') }
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label={t('list.title')}>
                  <table className="w-full" role="grid" aria-label={t('list.tableAriaLabel')}>
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('table.appointmentNumber')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('table.subject')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('table.effectiveDate')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                          {t('table.targetCount')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('table.status')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('table.drafter')}
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('table.createdAt')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {drafts.map((draft) => (
                        <tr
                          key={draft.id}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={() => handleRowClick(draft.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRowClick(draft.id)}
                          tabIndex={0}
                          role="row"
                          aria-label={`${draft.draftNumber}: ${draft.title}`}
                        >
                          <td className="px-4 py-3 font-mono text-sm">
                            {draft.draftNumber}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {draft.title}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(draft.effectiveDate), 'yyyy-MM-dd', {
                              locale: ko,
                            })}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {t('table.targetCountLabel', { count: draft.detailCount })}
                          </td>
                          <td className="px-4 py-3">
                            <AppointmentDraftStatusBadge status={draft.status} />
                          </td>
                          <td className="px-4 py-3 text-sm">{draft.draftCreatedBy?.name ?? '-'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(draft.createdAt), 'M/d', { locale: ko })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={searchState.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
