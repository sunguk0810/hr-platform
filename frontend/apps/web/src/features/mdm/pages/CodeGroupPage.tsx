import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Database, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useCodeGroupList, useCodeGroupSearchParams, useCreateCodeGroup, useUpdateCodeGroup, useDeleteCodeGroup } from '../hooks/useMdm';
import type { CodeGroupListItem, CreateCodeGroupRequest, UpdateCodeGroupRequest } from '@hr-platform/shared-types';

export default function CodeGroupPage() {
  const { t } = useTranslation('mdm');
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CodeGroupListItem | null>(null);

  const [formData, setFormData] = useState<CreateCodeGroupRequest>({
    groupCode: '',
    groupName: '',
    groupNameEn: '',
    description: '',
  });

  const {
    params,
    searchState,
    setKeyword,
    setActive,
  } = useCodeGroupSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data, isLoading, isError } = useCodeGroupList(params);
  const createMutation = useCreateCodeGroup();
  const updateMutation = useUpdateCodeGroup();
  const deleteMutation = useDeleteCodeGroup();

  // Backend returns List (array), not PageResponse
  const codeGroups = data?.data ?? [];
  const totalElements = codeGroups.length;

  const handleCreateOpen = () => {
    setFormData({ groupCode: '', groupName: '', groupNameEn: '', description: '' });
    setIsCreateDialogOpen(true);
  };

  const handleEditOpen = (group: CodeGroupListItem) => {
    setSelectedGroup(group);
    setFormData({
      groupCode: group.groupCode,
      groupName: group.groupName,
      groupNameEn: '',
      description: group.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteOpen = (group: CodeGroupListItem) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create code group:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedGroup) return;
    try {
      const updateData: UpdateCodeGroupRequest = {
        groupName: formData.groupName,
        groupNameEn: formData.groupNameEn,
        description: formData.description,
      };
      await updateMutation.mutateAsync({ id: selectedGroup.id, data: updateData });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update code group:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    try {
      await deleteMutation.mutateAsync(selectedGroup.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete code group:', error);
    }
  };

  return (
    <>
      <PageHeader
        title={t('codeGroup.pageTitle')}
        description={t('codeGroup.pageDescription')}
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            {t('codeGroup.addButton')}
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('codeGroup.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={searchState.active === null ? '' : searchState.active.toString()}
              onChange={(e) => setActive(e.target.value === '' ? null : e.target.value === 'true')}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">{t('common.allStatus')}</option>
              <option value="true">{t('common.statusActive')}</option>
              <option value="false">{t('common.statusInactive')}</option>
            </select>
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
              icon={Database}
              title={t('common.errorLoadData')}
              description={t('common.errorRetry')}
            />
          ) : codeGroups.length === 0 ? (
            <EmptyState
              icon={Database}
              title={t('codeGroup.emptyTitle')}
              description={
                searchState.keyword
                  ? t('codeGroup.emptySearchDescription')
                  : t('codeGroup.emptyDescription')
              }
              action={
                !searchState.keyword
                  ? {
                      label: t('codeGroup.addButton'),
                      onClick: handleCreateOpen,
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('codeGroup.columns.code')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('codeGroup.columns.codeName')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('codeGroup.columns.description')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('codeGroup.columns.childCodes')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('codeGroup.columns.system')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('codeGroup.columns.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('codeGroup.columns.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {codeGroups.map((group) => (
                      <tr
                        key={group.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-mono text-sm">{group.groupCode}</td>
                        <td className="px-4 py-3 text-sm font-medium">{group.groupName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {group.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{t('codeGroup.childCodeCount', { count: group.codeCount })}</td>
                        <td className="px-4 py-3">
                          {group.system ? (
                            <StatusBadge status="info" label={t('common.typeSystem')} />
                          ) : (
                            <StatusBadge status="default" label={t('common.typeUser')} />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={group.active ? 'success' : 'default'}
                            label={group.active ? t('common.statusActive') : t('common.statusInactive')}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(group)}
                              disabled={group.system}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpen(group)}
                              disabled={group.system}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 text-sm text-muted-foreground">
                {t('common.totalCount', { count: totalElements })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('codeGroup.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('codeGroup.createDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="groupCode">{t('common.labelCodeRequired')}</Label>
              <Input
                id="groupCode"
                value={formData.groupCode}
                onChange={(e) => setFormData(prev => ({ ...prev, groupCode: e.target.value.toUpperCase() }))}
                placeholder={t('codeGroup.createDialog.codePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="groupName">{t('common.labelCodeNameRequired')}</Label>
              <Input
                id="groupName"
                value={formData.groupName}
                onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
                placeholder={t('codeGroup.createDialog.codeNamePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="groupNameEn">{t('common.labelEnglishName')}</Label>
              <Input
                id="groupNameEn"
                value={formData.groupNameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, groupNameEn: e.target.value }))}
                placeholder={t('codeGroup.createDialog.englishNamePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('common.labelDescription')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('codeGroup.createDialog.descriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancelButton')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.groupCode || !formData.groupName || createMutation.isPending}
            >
              {createMutation.isPending ? t('common.savingText') : t('common.saveButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('codeGroup.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('codeGroup.editDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-groupCode">{t('common.labelCode')}</Label>
              <Input id="edit-groupCode" value={formData.groupCode} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-groupName">{t('common.labelCodeNameRequired')}</Label>
              <Input
                id="edit-groupName"
                value={formData.groupName}
                onChange={(e) => setFormData(prev => ({ ...prev, groupName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-groupNameEn">{t('common.labelEnglishName')}</Label>
              <Input
                id="edit-groupNameEn"
                value={formData.groupNameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, groupNameEn: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">{t('common.labelDescription')}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancelButton')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.groupName || updateMutation.isPending}
            >
              {updateMutation.isPending ? t('common.savingText') : t('common.saveButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('codeGroup.deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('codeGroup.deleteDialog.description')}
              <br />
              <strong className="text-foreground">{selectedGroup?.groupName}</strong> ({selectedGroup?.groupCode})
              <br />
              <span className="text-destructive">{t('common.irreversibleAction')}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common.cancelButton')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('common.deletingText') : t('common.deleteButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
