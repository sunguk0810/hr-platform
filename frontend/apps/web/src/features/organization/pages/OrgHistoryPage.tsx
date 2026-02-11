import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { DatePicker } from '@/components/common/DatePicker';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Filter,
  History,
  ArrowRight,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  Edit,
  GitBranch,
  RefreshCw,
} from 'lucide-react';
import { useOrganizationTree, useOrganizationHistory, useOrgHistorySearchParams } from '../hooks/useOrganization';
import type { OrgHistoryEventType } from '../services/organizationService';
import { cn } from '@/lib/utils';

const EVENT_TYPE_ICONS: Record<OrgHistoryEventType, React.ElementType> = {
  department_created: Building2,
  department_deleted: Building2,
  department_renamed: Edit,
  department_moved: GitBranch,
  department_deactivated: Building2,
  manager_changed: UserPlus,
  employee_joined: UserPlus,
  employee_left: UserMinus,
  employee_transferred: ArrowRightLeft,
};

const EVENT_TYPE_COLORS: Record<OrgHistoryEventType, string> = {
  department_created: 'bg-green-500',
  department_deleted: 'bg-red-500',
  department_renamed: 'bg-blue-500',
  department_moved: 'bg-purple-500',
  department_deactivated: 'bg-orange-500',
  manager_changed: 'bg-indigo-500',
  employee_joined: 'bg-green-500',
  employee_left: 'bg-red-500',
  employee_transferred: 'bg-amber-500',
};

export default function OrgHistoryPage() {
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const EVENT_TYPE_LABELS: Record<OrgHistoryEventType, string> = {
    department_created: t('history.eventTypes.department_created'),
    department_deleted: t('history.eventTypes.department_deleted'),
    department_renamed: t('history.eventTypes.department_renamed'),
    department_moved: t('history.eventTypes.department_moved'),
    department_deactivated: t('history.eventTypes.department_deactivated'),
    manager_changed: t('history.eventTypes.manager_changed'),
    employee_joined: t('history.eventTypes.employee_joined'),
    employee_left: t('history.eventTypes.employee_left'),
    employee_transferred: t('history.eventTypes.employee_transferred'),
  };

  const { data: treeData } = useOrganizationTree();
  const { params, searchState, setDepartmentId, setEventType, setDateRange, setPage, resetFilters } =
    useOrgHistorySearchParams();

  const { data: historyData, isLoading, refetch } = useOrganizationHistory({
    ...params,
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  });

  const tree = treeData?.data ?? [];
  const history = historyData?.data?.content ?? [];
  const totalPages = historyData?.data?.page?.totalPages ?? 0;

  // Flatten tree for department select
  const flattenTree = (
    nodes: typeof tree,
    result: { id: string; name: string; level: number }[] = []
  ) => {
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, level: node.level });
      if (node.children) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };
  const flatDepartments = flattenTree(tree);

  const handleApplyDateFilter = () => {
    setDateRange(
      startDate ? format(startDate, 'yyyy-MM-dd') : '',
      endDate ? format(endDate, 'yyyy-MM-dd') : ''
    );
  };

  const handleReset = () => {
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
    resetFilters();
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['organization-history'] });
  };

  // Render timeline event
  const renderTimelineEvent = (event: typeof history[0]) => {
    const Icon = EVENT_TYPE_ICONS[event.type];
    const colorClass = EVENT_TYPE_COLORS[event.type];

    return (
      <div
        key={event.id}
        className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
      >
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
            colorClass
          )}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{event.title}</p>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.date), 'yyyy.MM.dd HH:mm', { locale: ko })}
              </p>
              <Badge variant="outline" className="mt-1">
                {EVENT_TYPE_LABELS[event.type]}
              </Badge>
            </div>
          </div>

          {/* Change comparison */}
          {event.previousValue && event.newValue && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 line-through">
                {event.previousValue}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {event.newValue}
              </span>
            </div>
          )}

          {/* Actor */}
          {event.actor && (
            <div className="mt-2 text-xs text-muted-foreground">
              {t('history.changedBy')} {event.actor.name}
            </div>
          )}

          {/* Department */}
          {event.departmentName && (
            <div className="mt-1 text-xs text-muted-foreground">
              {t('history.departmentLabel')} {event.departmentName}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{t('history.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('history.mobileDescription')}</p>
            </div>
            <Button
              size="sm"
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-card rounded-xl border p-4 space-y-4">
              <div className="space-y-2">
                <Label>{t('history.department')}</Label>
                <Select
                  value={searchState.departmentId || 'all'}
                  onValueChange={(value) => setDepartmentId(value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('history.allDepartments')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('history.allDepartments')}</SelectItem>
                    {flatDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {'\u3000'.repeat(Math.max(0, dept.level - 1))}
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('history.eventType')}</Label>
                <Select
                  value={searchState.eventType || 'all'}
                  onValueChange={(value) =>
                    setEventType(value === 'all' ? '' : (value as OrgHistoryEventType))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('history.allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('history.allTypes')}</SelectItem>
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('history.startDate')}</Label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder={t('history.startDatePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('history.endDate')}</Label>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder={t('history.endDatePlaceholder')}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleReset}>
                  {tCommon('reset')}
                </Button>
                <Button size="sm" className="flex-1" onClick={handleApplyDateFilter}>
                  {t('history.apply')}
                </Button>
              </div>
            </div>
          )}

          {/* Event Type Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setEventType('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !searchState.eventType
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tCommon('all')}
            </button>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setEventType(value as OrgHistoryEventType)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  searchState.eventType === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* History Timeline */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('history.noHistory')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('history.noHistoryDescription')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(renderTimelineEvent)}

              {totalPages > 1 && (
                <Pagination
                  page={searchState.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
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
        title={t('history.title')}
        description={t('history.description')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('history.refresh')}
            </Button>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {tCommon('filter')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t('history.searchFilter')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>{t('history.department')}</Label>
                <Select
                  value={searchState.departmentId || 'all'}
                  onValueChange={(value) => setDepartmentId(value === 'all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('history.allDepartments')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('history.allDepartments')}</SelectItem>
                    {flatDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {'\u3000'.repeat(Math.max(0, dept.level - 1))}
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('history.eventType')}</Label>
                <Select
                  value={searchState.eventType || 'all'}
                  onValueChange={(value) =>
                    setEventType(value === 'all' ? '' : (value as OrgHistoryEventType))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('history.allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('history.allTypes')}</SelectItem>
                    {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('history.startDate')}</Label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder={t('history.startDateSelectPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('history.endDate')}</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder={t('history.endDateSelectPlaceholder')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleReset}>
                {tCommon('reset')}
              </Button>
              <Button onClick={handleApplyDateFilter}>{t('history.apply')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('history.timeline')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={History}
              title={t('history.noHistory')}
              description={t('history.noHistoryDescription')}
            />
          ) : (
            <div className="space-y-4">
              {history.map(renderTimelineEvent)}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    page={searchState.page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
