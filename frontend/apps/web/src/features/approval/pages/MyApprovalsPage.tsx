import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { FileCheck, Plus, Search, Clock, CheckCircle, FileEdit, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { queryKeys } from '@/lib/queryClient';
import { useApprovalList } from '../hooks/useApprovals';
import type { ApprovalStatus, ApprovalType } from '@hr-platform/shared-types';

const STATUS_CONFIG_KEYS: Record<ApprovalStatus, { key: string; variant: 'default' | 'warning' | 'success' | 'error' }> = {
  DRAFT: { key: 'status.draft', variant: 'default' },
  PENDING: { key: 'status.pending', variant: 'warning' },
  IN_REVIEW: { key: 'status.inReview', variant: 'warning' },
  APPROVED: { key: 'status.approved', variant: 'success' },
  REJECTED: { key: 'status.rejected', variant: 'error' },
  RECALLED: { key: 'status.recalled', variant: 'warning' },
  CANCELLED: { key: 'status.cancelled', variant: 'default' },
};

const TYPE_LABEL_KEYS: Record<string, string> = {
  LEAVE_REQUEST: 'type.leaveRequest',
  EXPENSE: 'type.expense',
  OVERTIME: 'type.overtime',
  PERSONNEL: 'type.personnelAppointment',
  GENERAL: 'type.generalShort',
};

export default function MyApprovalsPage() {
  const { t } = useTranslation('approval');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<'pending' | 'requested' | 'completed' | 'draft' | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'all'>('all');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useApprovalList({
    page,
    size: 10,
    keyword: keyword || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    tab: tab === 'all' ? 'requested' : tab,
  });

  const approvals = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;
  const totalElements = data?.data?.page?.totalElements ?? 0;

  const handleRowClick = (id: string) => {
    navigate(`/approvals/${id}`);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{t('myApprovalsPage.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('myApprovalsPage.mobileDesc')}</p>
            </div>
            <Button size="sm" onClick={() => navigate('/approvals/new')}>
              <Plus className="mr-1 h-4 w-4" />
              {t('myApprovalsPage.writeButton')}
            </Button>
          </div>

          {/* Mobile Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setTab('pending'); setPage(0); }}
              className={`p-3 rounded-xl border text-left transition-colors ${tab === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' : 'bg-card'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('myApprovalsPage.summaryPending')}</span>
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-xl font-bold text-yellow-600 mt-1">
                {approvals.filter((a) => a.status === 'PENDING').length}
              </p>
            </button>
            <button
              onClick={() => { setTab('completed'); setPage(0); }}
              className={`p-3 rounded-xl border text-left transition-colors ${tab === 'completed' ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-card'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('myApprovalsPage.summaryCompleted')}</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-600 mt-1">
                {approvals.filter((a) => a.status === 'APPROVED').length}
              </p>
            </button>
          </div>

          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('myApprovalsPage.searchPlaceholder')}
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>

          {/* Mobile Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { value: 'all', key: 'myApprovalsPage.tabAll' },
              { value: 'pending', key: 'myApprovalsPage.tabPending' },
              { value: 'completed', key: 'myApprovalsPage.tabCompleted' },
              { value: 'draft', key: 'myApprovalsPage.tabDraft' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => { setTab(item.value as typeof tab); setPage(0); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tab === item.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {t(item.key)}
              </button>
            ))}
          </div>

          {/* Mobile List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : approvals.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title={t('myApprovalsPage.emptyTitle')}
              description={t('myApprovalsPage.emptyMobileDesc')}
              action={{
                label: t('myApprovalsPage.createButton'),
                onClick: () => navigate('/approvals/new'),
              }}
            />
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => {
                const statusConfig = STATUS_CONFIG_KEYS[approval.status];
                return (
                  <button
                    key={approval.id}
                    onClick={() => handleRowClick(approval.id)}
                    className="w-full bg-card rounded-xl border p-4 text-left transition-colors active:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{t(TYPE_LABEL_KEYS[approval.documentType])}</span>
                          <StatusBadge status={statusConfig.variant} label={t(statusConfig.key)} />
                        </div>
                        <p className="font-medium text-sm truncate">{approval.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{approval.documentNumber}</span>
                          <span>•</span>
                          <span>{format(new Date(approval.createdAt), 'M/d')}</span>
                        </div>
                        {approval.currentStepName && (
                          <p className="text-xs text-primary mt-1">{t('myApprovalsPage.currentStep', { name: approval.currentStepName })}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
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
        title={t('myApprovalsPage.title')}
        description={t('myApprovalsPage.description')}
        actions={
          <Button onClick={() => navigate('/approvals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('myApprovalsPage.createButton')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('all')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('myApprovalsPage.summaryAll')}</p>
                <p className="text-2xl font-bold">{totalElements}</p>
              </div>
              <FileCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('pending')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('myApprovalsPage.summaryPending')}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {approvals.filter((a) => a.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('completed')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('myApprovalsPage.summaryCompleted')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {approvals.filter((a) => a.status === 'APPROVED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('draft')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('myApprovalsPage.summaryDraft')}</p>
                <p className="text-2xl font-bold text-gray-600">
                  {approvals.filter((a) => a.status === 'DRAFT').length}
                </p>
              </div>
              <FileEdit className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('myApprovalsPage.searchDesktopPlaceholder')}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as ApprovalType | 'all');
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('myApprovalsPage.typeFilter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('myApprovalsPage.allTypes')}</SelectItem>
                <SelectItem value="LEAVE_REQUEST">{t('type.leaveRequest')}</SelectItem>
                <SelectItem value="EXPENSE">{t('type.expense')}</SelectItem>
                <SelectItem value="OVERTIME">{t('type.overtime')}</SelectItem>
                <SelectItem value="PERSONNEL">{t('type.personnelAppointment')}</SelectItem>
                <SelectItem value="GENERAL">{t('type.generalShort')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setPage(0); }}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">{t('myApprovalsPage.tabAll')}</TabsTrigger>
          <TabsTrigger value="pending">{t('myApprovalsPage.tabPending')}</TabsTrigger>
          <TabsTrigger value="completed">{t('myApprovalsPage.tabCompleted')}</TabsTrigger>
          <TabsTrigger value="draft">{t('myApprovalsPage.tabDraft')}</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : approvals.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title={t('myApprovalsPage.emptyTitle')}
                description={t('myApprovalsPage.emptyDesktopDesc')}
                action={{
                  label: t('myApprovalsPage.createButton'),
                  onClick: () => navigate('/approvals/new'),
                }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myApprovalsPage.tableDocNumber')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myApprovalsPage.tableType')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myApprovalsPage.tableTitle')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myApprovalsPage.tableStatus')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myApprovalsPage.tableCurrentApprover')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('myApprovalsPage.tableCreatedDate')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((approval) => {
                        const statusConfig = STATUS_CONFIG_KEYS[approval.status];
                        return (
                          <tr
                            key={approval.id}
                            onClick={() => handleRowClick(approval.id)}
                            className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                          >
                            <td className="px-4 py-3 font-mono text-sm">
                              {approval.documentNumber}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {t(TYPE_LABEL_KEYS[approval.documentType])}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{approval.title}</div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={statusConfig.variant}
                                label={t(statusConfig.key)}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {approval.currentStepName || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {format(new Date(approval.createdAt), 'yyyy.MM.dd')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="p-4 border-t">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </>
  );
}
