import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { PullToRefreshContainer } from '@/components/mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/useMediaQuery';
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
import { Building2, Plus, Search, Pencil, Trash2, Users, ChevronRight } from 'lucide-react';
import {
  useDepartmentList,
  useDepartmentSearchParams,
  useOrganizationTree,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../hooks/useOrganization';
import type { Department, CreateDepartmentRequest, UpdateDepartmentRequest, DepartmentStatus, DepartmentTreeNode } from '@hr-platform/shared-types';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function DepartmentListPage() {
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const [formData, setFormData] = useState<CreateDepartmentRequest>({
    code: '',
    name: '',
    nameEn: '',
    parentId: undefined,
  });

  const {
    params,
    searchState,
    setKeyword,
    setStatus,
    setPage,
  } = useDepartmentSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data, isLoading, isError } = useDepartmentList(params);
  const { data: treeData } = useOrganizationTree();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const departments = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;
  const totalElements = data?.data?.page?.totalElements ?? 0;
  const tree = treeData?.data ?? [];

  // Flatten tree for parent select
  const flattenTree = (nodes: DepartmentTreeNode[], result: { id: string; name: string; level: number }[] = []): { id: string; name: string; level: number }[] => {
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, level: node.level });
      if (node.children) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };
  const flatDepartments = flattenTree(tree);

  const handleCreateOpen = () => {
    setFormData({ code: '', name: '', nameEn: '', parentId: undefined });
    setIsCreateDialogOpen(true);
  };

  const handleEditOpen = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      code: department.code,
      name: department.name,
      nameEn: department.nameEn || '',
      parentId: department.parentId,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteOpen = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create department:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDepartment) return;
    try {
      const updateData: UpdateDepartmentRequest = {
        name: formData.name,
        nameEn: formData.nameEn,
      };
      await updateMutation.mutateAsync({ id: selectedDepartment.id, data: updateData });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update department:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    try {
      await deleteMutation.mutateAsync(selectedDepartment.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete department:', error);
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['departments'] });
  };

  // Shared dialogs render function
  const renderDialogs = () => (
    <>
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('department.add')}</DialogTitle>
            <DialogDescription>
              {t('department.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="parentId">{t('department.parentDepartment')}</Label>
              <Select
                value={formData.parentId || 'none'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value === 'none' ? undefined : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('department.selectParent')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('department.topLevel')}</SelectItem>
                  {flatDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {'　'.repeat(dept.level - 1)}{dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">{t('department.code')} *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="예: DEV-FE"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">{t('department.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 프론트엔드팀"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameEn">{tCommon('englishName')}</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="예: Frontend Team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.code || !formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? tCommon('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('department.edit')}</DialogTitle>
            <DialogDescription>
              {t('department.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">{t('department.code')}</Label>
              <Input id="edit-code" value={formData.code} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('department.name')} *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nameEn">{tCommon('englishName')}</Label>
              <Input
                id="edit-nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || updateMutation.isPending}
            >
              {updateMutation.isPending ? tCommon('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('department.delete')}</DialogTitle>
            <DialogDescription>
              {t('department.deleteConfirm')}
              <br />
              <strong className="text-foreground">{selectedDepartment?.name}</strong> ({selectedDepartment?.code})
              <br />
              <span className="text-destructive">
                {t('department.deleteWarning')}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? tCommon('deleting') : tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
              <h1 className="text-xl font-bold">{t('department.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {totalElements > 0 ? t('department.totalCount', { count: totalElements }) : t('department.list')}
              </p>
            </div>
            <Button size="sm" onClick={handleCreateOpen}>
              <Plus className="mr-1 h-4 w-4" />
              {tCommon('add')}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('department.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatus('')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                !searchState.status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tCommon('all')}
            </button>
            <button
              onClick={() => setStatus('ACTIVE')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchState.status === 'ACTIVE'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tCommon('active')}
            </button>
            <button
              onClick={() => setStatus('INACTIVE')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchState.status === 'INACTIVE'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tCommon('inactive')}
            </button>
          </div>

          {/* Department List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : isError ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('department.dataLoadError')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('department.loadErrorDesc')}</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('department.noDepartments')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchState.keyword
                  ? t('department.noSearchResults')
                  : t('department.noDepartmentsAction')
                }
              </p>
              {!searchState.keyword && (
                <Button className="mt-4" onClick={handleCreateOpen}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('department.add')}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {departments.map((dept) => (
                <div key={dept.id} className="bg-card rounded-xl border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{dept.code}</span>
                        <Badge
                          variant={dept.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className={dept.status === 'ACTIVE' ? 'bg-green-500 text-xs' : 'text-xs'}
                        >
                          {dept.status === 'ACTIVE' ? tCommon('active') : tCommon('inactive')}
                        </Badge>
                      </div>
                      <p className="font-medium">{dept.name}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="space-y-1 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{t('department.parent')}</span>
                      <span>{dept.parentName || t('department.topLevel')}</span>
                    </div>
                    {dept.managerName && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t('department.head')}:</span>
                        <span>{dept.managerName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{dept.employeeCount}{tCommon('unit.person')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditOpen(dept)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      {tCommon('edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteOpen(dept)}
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
        title={t('department.title')}
        description={t('department.description')}
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            {t('department.add')}
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('department.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={searchState.status}
              onValueChange={(value) => setStatus(value as DepartmentStatus | '')}
            >
              <SelectTrigger className="h-10 w-[180px]">
                <SelectValue placeholder={t('department.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('department.allStatuses')}</SelectItem>
                <SelectItem value="ACTIVE">{tCommon('active')}</SelectItem>
                <SelectItem value="INACTIVE">{tCommon('inactive')}</SelectItem>
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
              title={t('department.dataLoadError')}
              description={t('department.loadErrorDesc')}
            />
          ) : departments.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={t('department.noDepartments')}
              description={
                searchState.keyword
                  ? t('department.noSearchResults')
                  : t('department.noDepartmentsAction')
              }
              action={
                !searchState.keyword
                  ? {
                      label: t('department.add'),
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
                        {t('department.code')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('department.name')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('department.parentDepartment')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('department.head')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('department.memberCount')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {tCommon('status')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {tCommon('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr
                        key={dept.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-mono text-sm">{dept.code}</td>
                        <td className="px-4 py-3 text-sm font-medium">{dept.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {dept.parentName || t('department.topLevel')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {dept.managerName || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{dept.employeeCount}{tCommon('unit.person')}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={dept.status === 'ACTIVE' ? 'success' : 'default'}
                            label={dept.status === 'ACTIVE' ? tCommon('active') : tCommon('inactive')}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(dept)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpen(dept)}
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
              <Pagination
                page={searchState.page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
              <div className="px-4 pb-3 text-sm text-muted-foreground">
                {t('department.totalCountSuffix', { count: totalElements })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {renderDialogs()}
    </>
  );
}
