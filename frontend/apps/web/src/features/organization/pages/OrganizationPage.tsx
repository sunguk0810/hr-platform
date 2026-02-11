import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Building2, Plus, Pencil, Trash2, Users, User, Search, RefreshCw, GitMerge } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { usePermission } from '@/components/common/PermissionGate';
import { OrgTree } from '../components/OrgTree';
import { DepartmentAccordion, DepartmentDetailSheet } from '../components/mobile';
import { ReorgImpactModal, type ReorgChangeType } from '../components/ReorgImpactModal';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';
import {
  useOrganizationTree,
  useDepartment,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../hooks/useOrganization';
import type { DepartmentTreeNode, CreateDepartmentRequest, UpdateDepartmentRequest } from '@hr-platform/shared-types';

export default function OrganizationPage() {
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');

  const [selectedNode, setSelectedNode] = useState<DepartmentTreeNode | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [isReorgImpactOpen, setIsReorgImpactOpen] = useState(false);
  const [reorgChangeType, setReorgChangeType] = useState<ReorgChangeType>('delete');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const isMobile = useIsMobile();

  // 조직 편집 권한 체크
  const canEdit = usePermission({ permissions: ['organization:write'] });

  const [formData, setFormData] = useState<CreateDepartmentRequest>({
    code: '',
    name: '',
    nameEn: '',
    parentId: undefined,
  });

  const { data: treeData, isLoading: isTreeLoading, isError: isTreeError, refetch } = useOrganizationTree();
  const { data: departmentData } = useDepartment(selectedNode?.id || '');
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const tree = treeData?.data ?? [];
  const selectedDepartment = departmentData?.data;

  // Pull to refresh for mobile
  const handleRefresh = async () => {
    await refetch();
  };

  const { isPulling, isRefreshing, pullProgress, pullDistance, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMobileSelect = (node: DepartmentTreeNode) => {
    setSelectedNode(node);
    setDetailSheetOpen(true);
  };

  const handleSelect = (node: DepartmentTreeNode) => {
    setSelectedNode(node);
  };

  const handleCreateOpen = (parentId?: string) => {
    setFormData({
      code: '',
      name: '',
      nameEn: '',
      parentId,
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditOpen = () => {
    if (!selectedDepartment) return;
    setFormData({
      code: selectedDepartment.code,
      name: selectedDepartment.name,
      nameEn: selectedDepartment.nameEn || '',
      parentId: selectedDepartment.parentId,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteOpen = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleReorgImpactOpen = (type: ReorgChangeType) => {
    setReorgChangeType(type);
    setIsReorgImpactOpen(true);
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
    if (!selectedNode) return;
    try {
      const updateData: UpdateDepartmentRequest = {
        name: formData.name,
        nameEn: formData.nameEn,
      };
      await updateMutation.mutateAsync({ id: selectedNode.id, data: updateData });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update department:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    try {
      await deleteMutation.mutateAsync(selectedNode.id);
      setSelectedNode(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete department:', error);
    }
  };

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

  // Filter tree for search
  const filterTree = (nodes: DepartmentTreeNode[], query: string): DepartmentTreeNode[] => {
    if (!query) return nodes;

    return nodes.reduce<DepartmentTreeNode[]>((acc, node) => {
      const matchesSearch = node.name.toLowerCase().includes(query.toLowerCase()) ||
        node.code?.toLowerCase().includes(query.toLowerCase());

      const filteredChildren = node.children ? filterTree(node.children, query) : [];

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren,
        });
      }

      return acc;
    }, []);
  };

  const filteredTree = filterTree(tree, searchQuery);

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-full" {...handlers}>
        {/* Pull to refresh indicator */}
        {(isPulling || isRefreshing) && (
          <div
            className="flex justify-center items-center py-4"
            style={{ height: pullDistance }}
          >
            <RefreshCw
              className={cn(
                'h-6 w-6 text-primary transition-transform',
                isRefreshing && 'animate-spin',
                pullProgress >= 1 && !isRefreshing && 'text-green-500'
              )}
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
              }}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('mobileDescription')}</p>
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => handleCreateOpen()}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div data-tour="department-search" className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('department.searchPlaceholderMobile')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Department List */}
        {isTreeLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : isTreeError ? (
          <EmptyState
            icon={Building2}
            title={t('department.loadError')}
            description={t('department.loadErrorDesc')}
          />
        ) : filteredTree.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={searchQuery ? t('department.searchNoResults') : t('department.noDepartments')}
            description={searchQuery ? t('department.searchNoResultsDesc') : t('department.noDepartmentsAction')}
            action={
              !searchQuery && canEdit
                ? {
                    label: t('department.add'),
                    onClick: () => handleCreateOpen(),
                  }
                : undefined
            }
          />
        ) : (
          <div className="bg-card rounded-xl border p-2">
            <DepartmentAccordion
              departments={filteredTree}
              selectedId={selectedNode?.id}
              onSelect={handleMobileSelect}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
            />
          </div>
        )}

        {/* Department Detail Sheet */}
        <DepartmentDetailSheet
          open={detailSheetOpen}
          onClose={() => setDetailSheetOpen(false)}
          department={selectedDepartment || null}
        />

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
                        {'　'.repeat(Math.max(0, dept.level - 1))}{dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">{`${t('department.code')} *`}</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder={t('department.placeholders.code')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">{`${t('department.name')} *`}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('department.placeholders.name')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nameEn">{tCommon('englishName')}</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                  placeholder={t('department.placeholders.englishName')}
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
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          canEdit && (
            <Button onClick={() => handleCreateOpen()}>
              <Plus className="mr-2 h-4 w-4" />
              {t('department.add')}
            </Button>
          )
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card data-tour="org-tree" className="md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('orgChart.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isTreeLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : isTreeError ? (
              <EmptyState
                icon={Building2}
                title={t('department.loadError')}
                description={t('department.loadErrorDesc')}
              />
            ) : tree.length === 0 ? (
              <EmptyState
                icon={Building2}
                title={t('department.noDepartments')}
                description={t('department.noDepartmentsAction')}
                action={{
                  label: t('department.add'),
                  onClick: () => handleCreateOpen(),
                }}
              />
            ) : (
              <OrgTree
                data={tree}
                selectedId={selectedNode?.id}
                onSelect={handleSelect}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('department.detail')}</CardTitle>
            {selectedDepartment && canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleCreateOpen(selectedNode?.id)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('department.subDepartment')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleEditOpen}>
                  <Pencil className="mr-1 h-4 w-4" />
                  {tCommon('edit')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReorgImpactOpen('delete')}>
                  <GitMerge className="mr-1 h-4 w-4" />
                  {t('department.impactAnalysis')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteOpen}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  {tCommon('delete')}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedNode ? (
              <p className="text-muted-foreground text-center py-8">
                {t('department.selectFromTree')}
              </p>
            ) : selectedDepartment ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">{t('department.code')}</Label>
                    <p className="font-mono text-sm mt-1">{selectedDepartment.code}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t('department.name')}</Label>
                    <p className="text-sm mt-1">{selectedDepartment.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{tCommon('englishName')}</Label>
                    <p className="text-sm mt-1">{selectedDepartment.nameEn || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{tCommon('status')}</Label>
                    <div className="mt-1">
                      <StatusBadge
                        status={selectedDepartment.status === 'ACTIVE' ? 'success' : 'default'}
                        label={selectedDepartment.status === 'ACTIVE' ? tCommon('active') : tCommon('inactive')}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t('department.parentDepartment')}</Label>
                    <p className="text-sm mt-1">{selectedDepartment.parentName || t('department.topLevel')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">{t('department.orgLevel')}</Label>
                    <p className="text-sm mt-1">{t('department.orgLevelValue', { level: selectedDepartment.level })}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">{t('department.head')}</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedDepartment.managerName || t('department.headNotAssigned')}</p>
                      {selectedDepartment.managerId && (
                        <p className="text-sm text-muted-foreground">
                          {selectedDepartment.managerId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('department.members')}</span>
                    <span className="font-semibold">{selectedDepartment.employeeCount}{tCommon('unit.person')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
              <Label htmlFor="code">{`${t('department.code')} *`}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder={t('department.placeholders.code')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">{`${t('department.name')} *`}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('department.placeholders.name')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameEn">{tCommon('englishName')}</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder={t('department.placeholders.englishName')}
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
              <Label htmlFor="edit-name">{`${t('department.name')} *`}</Label>
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
              <strong className="text-foreground">{selectedNode?.name}</strong>
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

      {/* Reorg Impact Analysis Modal */}
      {selectedNode && (
        <ReorgImpactModal
          open={isReorgImpactOpen}
          onOpenChange={setIsReorgImpactOpen}
          changeType={reorgChangeType}
          sourceDepartment={{ id: selectedNode.id, name: selectedNode.name }}
          onConfirm={() => {
            if (reorgChangeType === 'delete') {
              handleDelete();
            } else if (reorgChangeType === 'rename') {
              handleEditOpen();
            }
          }}
        />
      )}
    </>
  );
}
