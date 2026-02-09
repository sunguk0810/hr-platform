import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/useMediaQuery';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { approvalService } from '../services/approvalService';
import { useToast } from '@/hooks/useToast';
import type { ApprovalTemplate } from '@hr-platform/shared-types';

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  LEAVE_REQUEST: 'approvalTemplatesPage.categoryLeave',
  EXPENSE: 'approvalTemplatesPage.categoryExpense',
  OVERTIME: 'approvalTemplatesPage.categoryOvertime',
  PERSONNEL: 'approvalTemplatesPage.categoryPersonnel',
  GENERAL: 'approvalTemplatesPage.categoryGeneral',
};

export default function ApprovalTemplatesPage() {
  const { t } = useTranslation('approval');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<ApprovalTemplate | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['approval-templates', categoryFilter, statusFilter],
    queryFn: () => approvalService.getTemplates({
      category: categoryFilter || undefined,
      isActive: statusFilter === '' ? undefined : statusFilter === 'active',
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => approvalService.deleteTemplate(id),
    onSuccess: () => {
      toast({ title: t('approvalTemplatesPage.deleteSuccess'), description: t('approvalTemplatesPage.deleteSuccessDesc') });
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: t('approvalTemplatesPage.deleteFailure'), description: t('approvalTemplatesPage.deleteFailureDesc'), variant: 'destructive' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      approvalService.updateTemplate(id, { isActive }),
    onSuccess: (_, variables) => {
      toast({
        title: variables.isActive ? t('approvalTemplatesPage.activateSuccess') : t('approvalTemplatesPage.deactivateSuccess'),
        description: t('approvalTemplatesPage.toggleSuccessDesc', { status: variables.isActive ? t('common.activate') : t('common.deactivate') }),
      });
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
    },
    onError: () => {
      toast({ title: t('approvalTemplatesPage.toggleFailure'), description: t('approvalTemplatesPage.toggleFailureDesc'), variant: 'destructive' });
    },
  });

  const templates = data?.data ?? [];

  const filteredTemplates = templates.filter(template => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        template.name.toLowerCase().includes(keyword) ||
        template.code.toLowerCase().includes(keyword) ||
        (template.description?.toLowerCase().includes(keyword) ?? false)
      );
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleDuplicate = (template: ApprovalTemplate) => {
    navigate(`/settings/approval-templates/new?duplicate=${template.id}`);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{t('approvalTemplatesPage.mobileTitle')}</h1>
              <p className="text-sm text-muted-foreground">{t('approvalTemplatesPage.mobileDescription')}</p>
            </div>
            <Button size="sm" onClick={() => navigate('/settings/approval-templates/new')}>
              <Plus className="mr-1 h-4 w-4" />
              {t('common.register')}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('approvalTemplatesPage.searchPlaceholder')}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setCategoryFilter('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !categoryFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('approvalTemplatesPage.categoryAll')}
            </button>
            {Object.entries(CATEGORY_LABEL_KEYS).map(([value, key]) => (
              <button
                key={value}
                onClick={() => setCategoryFilter(value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {t(key)}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                !statusFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('approvalTemplatesPage.statusAll')}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('approvalTemplatesPage.statusActive')}
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('approvalTemplatesPage.statusInactive')}
            </button>
          </div>

          {/* Templates List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('approvalTemplatesPage.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('approvalTemplatesPage.emptyDescription')}</p>
              <Button className="mt-4" onClick={() => navigate('/settings/approval-templates/new')}>
                <Plus className="mr-2 h-4 w-4" />
                {t('approvalTemplatesPage.registerButton')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-card rounded-xl border p-4"
                  onClick={() => navigate(`/settings/approval-templates/${template.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{template.code}</span>
                        {template.isActive ? (
                          <Badge variant="default" className="bg-green-500 text-xs">{t('approvalTemplatesPage.statusActive')}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{t('approvalTemplatesPage.statusInactive')}</Badge>
                        )}
                      </div>
                      <p className="font-medium">{template.name}</p>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/settings/approval-templates/${template.id}`);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(template);
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {t('common.duplicate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActiveMutation.mutate({
                              id: template.id,
                              isActive: !template.isActive,
                            });
                          }}
                        >
                          {template.isActive ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              {t('common.deactivate')}
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              {t('common.activate')}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(template);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <Badge variant="outline" className="text-xs">
                      {t(CATEGORY_LABEL_KEYS[template.category] || template.category)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t('approvalTemplatesPage.updatedAt', { date: formatDate(template.updatedAt) })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ConfirmDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title={t('approvalTemplatesPage.deleteTitle')}
            description={t('approvalTemplatesPage.deleteConfirm', { name: deleteTarget?.name })}
            confirmLabel={t('common.delete')}
            variant="destructive"
            onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            isLoading={deleteMutation.isPending}
          />
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('approvalTemplatesPage.title')}
        description={t('approvalTemplatesPage.description')}
        actions={
          <Button onClick={() => navigate('/settings/approval-templates/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('approvalTemplatesPage.registerButton')}
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('approvalTemplatesPage.searchPlaceholder')}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('approvalTemplatesPage.documentType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('approvalTemplatesPage.categoryAll')}</SelectItem>
                  {Object.entries(CATEGORY_LABEL_KEYS).map(([value, key]) => (
                    <SelectItem key={value} value={value}>{t(key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t('common:status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('approvalTemplatesPage.statusAll')}</SelectItem>
                  <SelectItem value="active">{t('approvalTemplatesPage.statusActive')}</SelectItem>
                  <SelectItem value="inactive">{t('approvalTemplatesPage.statusInactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FileText}
              title={t('approvalTemplatesPage.emptyTitle')}
              description={t('approvalTemplatesPage.emptyDescription')}
              action={{
                label: t('approvalTemplatesPage.registerButton'),
                onClick: () => navigate('/settings/approval-templates/new'),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('approvalTemplatesPage.tableCode')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('approvalTemplatesPage.tableName')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('approvalTemplatesPage.tableDocType')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('approvalTemplatesPage.tableStatus')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('approvalTemplatesPage.tableUpdatedAt')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((template) => (
                    <tr
                      key={template.id}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/settings/approval-templates/${template.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-mono">
                        {template.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {template.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">
                          {t(CATEGORY_LABEL_KEYS[template.category] || template.category)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {template.isActive ? (
                          <Badge variant="default" className="bg-green-500">{t('approvalTemplatesPage.statusActive')}</Badge>
                        ) : (
                          <Badge variant="secondary">{t('approvalTemplatesPage.statusInactive')}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(template.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/settings/approval-templates/${template.id}`);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(template);
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              {t('common.duplicate')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActiveMutation.mutate({
                                  id: template.id,
                                  isActive: !template.isActive,
                                });
                              }}
                            >
                              {template.isActive ? (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4" />
                                  {t('common.deactivate')}
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4" />
                                  {t('common.activate')}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(template);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('approvalTemplatesPage.deleteTitle')}
        description={t('approvalTemplatesPage.deleteConfirm', { name: deleteTarget?.name })}
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
