import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Pencil, RotateCcw, Building2 } from 'lucide-react';
import {
  useTenantCodeList,
  useCodeGroupList,
  useUpdateTenantCode,
  useResetTenantCode,
} from '../hooks/useMdm';
import type { TenantCodeSetting, UpdateTenantCodeRequest } from '@hr-platform/shared-types';

export default function TenantCodePage() {
  const { t } = useTranslation('mdm');
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);
  const [groupCode, setGroupCode] = useState('');
  const [isEnabledFilter, setIsEnabledFilter] = useState<boolean | null>(null);
  const [page, setPage] = useState(0);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<TenantCodeSetting | null>(null);
  const [formData, setFormData] = useState<UpdateTenantCodeRequest>({
    customName: '',
    customNameEn: '',
    enabled: true,
    sortOrder: undefined,
  });

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, groupCode, isEnabledFilter]);

  const { data: codeGroupsData } = useCodeGroupList();
  const codeGroups = codeGroupsData?.data ?? [];

  const { data, isLoading, isError } = useTenantCodeList({
    page,
    size: 20,
    groupCode: groupCode || undefined,
    keyword: debouncedKeyword || undefined,
    enabled: isEnabledFilter ?? undefined,
  });

  const updateMutation = useUpdateTenantCode();
  const resetMutation = useResetTenantCode();

  const tenantCodes = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;
  const totalElements = data?.data?.page?.totalElements ?? 0;

  const handleEditOpen = (setting: TenantCodeSetting) => {
    setSelectedSetting(setting);
    setFormData({
      customName: setting.customName || '',
      customNameEn: setting.customNameEn || '',
      enabled: setting.enabled,
      sortOrder: setting.sortOrder,
    });
    setIsEditDialogOpen(true);
  };

  const handleResetOpen = (setting: TenantCodeSetting) => {
    setSelectedSetting(setting);
    setIsResetDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSetting) return;
    try {
      await updateMutation.mutateAsync({
        codeId: selectedSetting.codeId,
        data: formData,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update tenant code:', error);
    }
  };

  const handleReset = async () => {
    if (!selectedSetting) return;
    try {
      await resetMutation.mutateAsync(selectedSetting.codeId);
      setIsResetDialogOpen(false);
    } catch (error) {
      console.error('Failed to reset tenant code:', error);
    }
  };

  const handleToggleEnabled = async (setting: TenantCodeSetting) => {
    try {
      await updateMutation.mutateAsync({
        codeId: setting.codeId,
        data: { enabled: !setting.enabled },
      });
    } catch (error) {
      console.error('Failed to toggle enabled:', error);
    }
  };

  return (
    <>
      <PageHeader
        title={t('tenantCode.pageTitle')}
        description={t('tenantCode.pageDescription')}
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('common.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={groupCode} onValueChange={setGroupCode}>
              <SelectTrigger className="h-10 w-[220px]">
                <SelectValue placeholder={t('common.allCodeGroups')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.allCodeGroups')}</SelectItem>
                {codeGroups.map((group) => (
                  <SelectItem key={group.id} value={group.groupCode}>
                    {group.groupName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={isEnabledFilter === null ? '' : isEnabledFilter.toString()}
              onValueChange={(value) => setIsEnabledFilter(value === '' ? null : value === 'true')}
            >
              <SelectTrigger className="h-10 w-[180px]">
                <SelectValue placeholder={t('common.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.allStatus')}</SelectItem>
                <SelectItem value="true">{t('common.statusEnabled')}</SelectItem>
                <SelectItem value="false">{t('common.statusDisabled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} />
            </div>
          ) : isError ? (
            <EmptyState
              icon={Building2}
              title={t('common.errorLoadData')}
              description={t('common.errorRetry')}
            />
          ) : tenantCodes.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={t('tenantCode.emptyTitle')}
              description={
                searchInput || groupCode
                  ? t('tenantCode.emptySearchDescription')
                  : t('tenantCode.emptyDescription')
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('tenantCode.columns.codeGroup')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('tenantCode.columns.code')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('tenantCode.columns.originalName')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('tenantCode.columns.customName')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('tenantCode.columns.enabled')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('tenantCode.columns.updatedAt')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('tenantCode.columns.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantCodes.map((setting) => (
                      <tr
                        key={setting.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {setting.groupCode}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{setting.code}</td>
                        <td className="px-4 py-3 text-sm">{setting.originalName}</td>
                        <td className="px-4 py-3 text-sm">
                          {setting.customName ? (
                            <span className="font-medium text-primary">{setting.customName}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Switch
                            checked={setting.enabled}
                            onCheckedChange={() => handleToggleEnabled(setting)}
                            disabled={updateMutation.isPending}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(setting.updatedAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(setting)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetOpen(setting)}
                              disabled={!setting.customName && setting.enabled}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
              <div className="px-4 pb-3 text-sm text-muted-foreground">
                {t('common.totalCount', { count: totalElements })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tenantCode.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('tenantCode.editDialog.description', { code: selectedSetting?.code })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-md bg-muted p-3">
              <div className="text-sm text-muted-foreground">{t('tenantCode.editDialog.originalNameLabel')}</div>
              <div className="font-medium">{selectedSetting?.originalName}</div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customName">{t('tenantCode.editDialog.customNameLabel')}</Label>
              <Input
                id="customName"
                value={formData.customName}
                onChange={(e) => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                placeholder={t('tenantCode.editDialog.customNamePlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('tenantCode.editDialog.customNameHelp')}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customNameEn">{t('tenantCode.editDialog.customNameEnLabel')}</Label>
              <Input
                id="customNameEn"
                value={formData.customNameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, customNameEn: e.target.value }))}
                placeholder={t('tenantCode.editDialog.customNameEnPlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">{t('tenantCode.editDialog.sortOrderLabel')}</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder ?? ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sortOrder: e.target.value ? parseInt(e.target.value) : undefined,
                }))}
                placeholder={t('tenantCode.editDialog.sortOrderPlaceholder')}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="enabled">{t('tenantCode.editDialog.enabledLabel')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancelButton')}
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('common.savingText') : t('common.saveButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('tenantCode.resetDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('tenantCode.resetDialog.description', { code: selectedSetting?.code })}
              <br />
              {t('tenantCode.resetDialog.detail')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              {t('common.cancelButton')}
            </Button>
            <Button onClick={handleReset} disabled={resetMutation.isPending}>
              {resetMutation.isPending ? t('tenantCode.resetDialog.resettingText') : t('tenantCode.resetDialog.resetButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
