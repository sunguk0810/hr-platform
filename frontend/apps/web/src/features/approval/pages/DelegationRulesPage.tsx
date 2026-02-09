import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Scale,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  useDelegationRules,
  useDeleteDelegationRule,
  useToggleDelegationRuleStatus,
  useDelegationRuleSearchParams,
} from '../hooks/useApprovals';
import { useToast } from '@/hooks/useToast';
import type {
  DelegationRuleListItem,
  DelegationRuleStatus,
  DelegationRuleConditionType,
} from '@hr-platform/shared-types';
import {
  DELEGATION_RULE_CONDITION_LABELS,
  DELEGATION_RULE_TARGET_LABELS,
} from '@hr-platform/shared-types';
import { cn } from '@/lib/utils';
import { DelegationRuleDialog } from '../components/DelegationRuleDialog';

const STATUS_COLORS: Record<DelegationRuleStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function DelegationRulesPage() {
  const { t } = useTranslation('approval');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DelegationRuleListItem | null>(null);
  const [deletingRule, setDeletingRule] = useState<DelegationRuleListItem | null>(null);

  const {
    params,
    searchState,
    setStatus,
    setConditionType,
    setPage,
    resetFilters,
  } = useDelegationRuleSearchParams();

  const { data, isLoading, refetch } = useDelegationRules(params);
  const deleteMutation = useDeleteDelegationRule();
  const toggleStatusMutation = useToggleDelegationRuleStatus();

  const rules = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;

  const handleToggleStatus = async (rule: DelegationRuleListItem) => {
    try {
      await toggleStatusMutation.mutateAsync(rule.id);
      toast({
        title: t('delegationRulesPage.statusChangeSuccess'),
        description: t('delegationRulesPage.statusChangeSuccessDesc', { status: rule.status === 'ACTIVE' ? t('common.deactivate') : t('common.activate') }),
      });
    } catch {
      toast({
        title: t('delegationRulesPage.statusChangeFailure'),
        description: t('delegationRulesPage.statusChangeFailureDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;

    try {
      await deleteMutation.mutateAsync(deletingRule.id);
      toast({
        title: t('delegationRulesPage.deleteSuccess'),
        description: t('delegationRulesPage.deleteSuccessDesc'),
      });
      setDeletingRule(null);
    } catch {
      toast({
        title: t('delegationRulesPage.deleteFailure'),
        description: t('delegationRulesPage.deleteFailureDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (rule: DelegationRuleListItem) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['delegation-rules'] });
  };

  // Shared dialogs render function
  const renderDialogs = () => (
    <>
      {/* Add/Edit Dialog */}
      <DelegationRuleDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editingRuleId={editingRule?.id}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingRule}
        onOpenChange={(open) => !open && setDeletingRule(null)}
        title={t('delegationRulesPage.deleteTitle')}
        description={t('delegationRulesPage.deleteConfirm', { name: deletingRule?.name })}
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{t('delegationRulesPage.mobileTitle')}</h1>
              <p className="text-sm text-muted-foreground">{t('delegationRulesPage.mobileDescription')}</p>
            </div>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              {t('delegationRulesPage.addShort')}
            </Button>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setStatus('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !searchState.status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('delegationRulesPage.allFilter')}
            </button>
            <button
              onClick={() => setStatus('ACTIVE')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'ACTIVE'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('delegationRulesPage.activeFilter')}
            </button>
            <button
              onClick={() => setStatus('INACTIVE')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                searchState.status === 'INACTIVE'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('delegationRulesPage.inactiveFilter')}
            </button>
          </div>

          {/* Rules List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('delegationRulesPage.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('delegationRulesPage.mobileEmptyDescription')}</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('delegationRulesPage.addRule')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-card rounded-xl border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">#{rule.priority}</span>
                        <Badge className={cn(STATUS_COLORS[rule.status], 'text-xs')}>
                          {rule.status === 'ACTIVE' ? t('delegationRulesPage.activeFilter') : t('delegationRulesPage.inactiveFilter')}
                        </Badge>
                      </div>
                      <p className="font-medium">{rule.name}</p>
                    </div>
                    <Switch
                      checked={rule.status === 'ACTIVE'}
                      onCheckedChange={() => handleToggleStatus(rule)}
                      disabled={toggleStatusMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{t('delegationRulesPage.delegatorLabel')}</span>
                      <span>{rule.delegatorName}</span>
                      {rule.delegatorDepartment && (
                        <span className="text-muted-foreground">({rule.delegatorDepartment})</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {DELEGATION_RULE_CONDITION_LABELS[rule.conditionType]}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {DELEGATION_RULE_TARGET_LABELS[rule.targetType]}
                      </Badge>
                    </div>
                    {(rule.validFrom || rule.validTo) && (
                      <p className="text-xs text-muted-foreground">
                        {t('delegationRulesPage.periodLabel')} {rule.validFrom || '-'} ~ {rule.validTo || '-'}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeletingRule(rule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <Pagination
                  page={searchState.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}

          {renderDialogs()}
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('delegationRulesPage.title')}
        description={t('delegationRulesPage.desktopDescription')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('delegationRulesPage.refresh')}
            </Button>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {t('delegationRulesPage.filterButton')}
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('delegationRulesPage.addRule')}
            </Button>
          </div>
        }
      />

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t('delegationRulesPage.searchFilter')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('delegationRulesPage.statusFilter')}</label>
                <Select
                  value={searchState.status || 'all'}
                  onValueChange={(value) =>
                    setStatus(value === 'all' ? '' : (value as DelegationRuleStatus))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('delegationRulesPage.allFilter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('delegationRulesPage.allFilter')}</SelectItem>
                    <SelectItem value="ACTIVE">{t('delegationRulesPage.activeFilter')}</SelectItem>
                    <SelectItem value="INACTIVE">{t('delegationRulesPage.inactiveFilter')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('delegationRulesPage.conditionTypeFilter')}</label>
                <Select
                  value={searchState.conditionType || 'all'}
                  onValueChange={(value) =>
                    setConditionType(value === 'all' ? '' : (value as DelegationRuleConditionType))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('delegationRulesPage.allFilter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('delegationRulesPage.allFilter')}</SelectItem>
                    {Object.entries(DELEGATION_RULE_CONDITION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={resetFilters}>
                {t('delegationRulesPage.resetFilter')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {t('delegationRulesPage.ruleListTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : rules.length === 0 ? (
            <EmptyState
              icon={Scale}
              title={t('delegationRulesPage.emptyTitle')}
              description={t('delegationRulesPage.emptyDescription')}
              action={{
                label: t('delegationRulesPage.addRule'),
                onClick: () => setIsDialogOpen(true)
              }}
            />
          ) : (
            <>
              <Table aria-label={t('delegationRulesPage.ruleListTitle')}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]" scope="col">{t('delegationRulesPage.tablePriority')}</TableHead>
                    <TableHead scope="col">{t('delegationRulesPage.tableRuleName')}</TableHead>
                    <TableHead scope="col">{t('delegationRulesPage.tableDelegator')}</TableHead>
                    <TableHead scope="col">{t('delegationRulesPage.tableCondition')}</TableHead>
                    <TableHead scope="col">{t('delegationRulesPage.tableTarget')}</TableHead>
                    <TableHead scope="col">{t('delegationRulesPage.tableValidPeriod')}</TableHead>
                    <TableHead className="w-[80px]" scope="col">{t('delegationRulesPage.tableStatus')}</TableHead>
                    <TableHead className="w-[60px]" scope="col"><span className="sr-only">{t('common:actions')}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-mono text-sm">{rule.priority}</TableCell>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <div>
                          <p>{rule.delegatorName}</p>
                          {rule.delegatorDepartment && (
                            <p className="text-xs text-muted-foreground">
                              {rule.delegatorDepartment}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">
                            {DELEGATION_RULE_CONDITION_LABELS[rule.conditionType]}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {rule.conditionSummary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="secondary">
                            {DELEGATION_RULE_TARGET_LABELS[rule.targetType]}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {rule.targetSummary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rule.validFrom || rule.validTo ? (
                          <span className="text-sm">
                            {rule.validFrom || '-'} ~ {rule.validTo || '-'}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">{t('delegationRulesPage.unlimited')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.status === 'ACTIVE'}
                            onCheckedChange={() => handleToggleStatus(rule)}
                            disabled={toggleStatusMutation.isPending}
                          />
                          <Badge className={cn(STATUS_COLORS[rule.status])}>
                            {rule.status === 'ACTIVE' ? t('delegationRulesPage.activeFilter') : t('delegationRulesPage.inactiveFilter')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(rule)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingRule(rule)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    page={searchState.page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {renderDialogs()}
    </>
  );
}
