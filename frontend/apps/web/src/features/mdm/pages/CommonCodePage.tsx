import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Code, Plus, Search, Pencil, Trash2, MoreHorizontal, History, AlertTriangle, RefreshCw, LayoutList, GitBranch, Ban, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useCommonCodeList,
  useCommonCodeSearchParams,
  useCodeGroupList,
  useCreateCommonCode,
  useUpdateCommonCode,
  useDeleteCommonCode,
  useUpdateCodeStatus,
  useBulkUpdateCodeStatus,
  useCodeImpact,
  useCodeHistory,
  useCheckDuplicate,
} from '../hooks/useMdm';
import type { CommonCodeListItem, CreateCommonCodeRequest, UpdateCommonCodeRequest, CodeStatus, CheckDuplicateResponse, CodeTreeNode } from '@hr-platform/shared-types';
import { CodeTree } from '../components/CodeTree';

export default function CommonCodePage() {
  const { t } = useTranslation('mdm');
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

  // View mode toggle state
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');
  const [selectedGroupForTree, setSelectedGroupForTree] = useState<string>('');
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string>();
  const [selectedTreeNode, setSelectedTreeNode] = useState<CodeTreeNode | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isImpactDialogOpen, setIsImpactDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<CommonCodeListItem | null>(null);
  const [statusChangeData, setStatusChangeData] = useState<{ status: CodeStatus; reason: string }>({
    status: 'ACTIVE',
    reason: '',
  });
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<CheckDuplicateResponse | null>(null);
  const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<{ action: string; label: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: CodeTreeNode;
  } | null>(null);
  const { toast } = useToast();

  const CLASSIFICATION_LABELS: Record<number, string> = {
    1: t('commonCode.levels.major'),
    2: t('commonCode.levels.middle'),
    3: t('commonCode.levels.minor'),
    4: t('commonCode.levels.detail'),
  };

  const CLASSIFICATION_BADGE_COLORS: Record<number, string> = {
    1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    2: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    3: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    4: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  const [formData, setFormData] = useState<{
    groupId: string;
    code: string;
    codeName: string;
    codeNameEn: string;
    description: string;
    sortOrder: number;
    level: number;
    parentCodeId: string;
  }>({
    groupId: '',
    code: '',
    codeName: '',
    codeNameEn: '',
    description: '',
    sortOrder: 0,
    level: 1,
    parentCodeId: '',
  });

  const {
    params,
    searchState,
    setGroupCode,
    setKeyword,
    setStatus,
    setPage,
  } = useCommonCodeSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data, isLoading, isError } = useCommonCodeList(params);
  const { data: codeGroupsData } = useCodeGroupList();
  const createMutation = useCreateCommonCode();
  const updateMutation = useUpdateCommonCode();
  const deleteMutation = useDeleteCommonCode();
  const statusMutation = useUpdateCodeStatus();
  const bulkStatusMutation = useBulkUpdateCodeStatus();
  const checkDuplicateMutation = useCheckDuplicate();

  // Impact and history queries (enabled when dialog is open)
  const { data: impactData, isLoading: impactLoading } = useCodeImpact(
    selectedCode?.id || '',
    isImpactDialogOpen && !!selectedCode
  );
  const { data: historyData, isLoading: historyLoading } = useCodeHistory(
    selectedCode?.id || ''
  );

  const commonCodes = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;
  const totalElements = data?.data?.page?.totalElements ?? 0;
  // Backend returns List (array) for code groups
  const codeGroups = codeGroupsData?.data ?? [];

  // Fetch all codes (unfiltered) for parent code selection in dialogs
  const { data: allCodesData } = useCommonCodeList({ size: 200 });
  const allCodes = allCodesData?.data?.content ?? [];

  // Get parent code options for cascading selection
  // When level is N, parents must be level N-1 and belong to the same code group
  const getParentCodeOptions = (level: number, groupId: string) => {
    if (level <= 1) return [];
    const parentLevel = level - 1;
    const group = codeGroups.find(g => g.id === groupId);
    if (!group) return [];
    return allCodes.filter(
      c => c.level === parentLevel && c.groupCode === group.groupCode
    );
  };

  // Helper to build CommonCodeListItem from CodeTreeNode for use with existing handlers
  const treeNodeToCodeItem = (node: CodeTreeNode): CommonCodeListItem => ({
    id: node.id,
    code: node.code,
    codeName: node.codeName,
    codeNameEn: node.codeNameEn,
    groupCode: selectedGroupForTree,
    sortOrder: node.sortOrder,
    active: node.active,
    status: node.active ? 'ACTIVE' : 'INACTIVE',
    level: node.level + 1,
    parentCodeId: '',
  });

  const handleCreateOpen = () => {
    setFormData({
      groupId: '',
      code: '',
      codeName: '',
      codeNameEn: '',
      description: '',
      sortOrder: 0,
      level: 1,
      parentCodeId: '',
    });
    setDuplicateCheckResult(null);
    setIgnoreDuplicate(false);
    setIsCreateDialogOpen(true);
  };

  // Check for duplicates when code or name changes
  const handleCheckDuplicate = async () => {
    if (!formData.groupId || !formData.code || !formData.codeName) return;

    const group = codeGroups.find(g => g.id === formData.groupId);
    if (!group) return;

    try {
      const result = await checkDuplicateMutation.mutateAsync({
        groupCode: group.groupCode,
        code: formData.code,
        name: formData.codeName,
      });
      setDuplicateCheckResult(result.data);
    } catch (error) {
      console.error('Duplicate check failed:', error);
    }
  };

  const handleEditOpen = (code: CommonCodeListItem) => {
    setSelectedCode(code);
    const group = codeGroups.find(g => g.groupCode === code.groupCode);
    setFormData({
      groupId: group?.id || '',
      code: code.code,
      codeName: code.codeName,
      codeNameEn: code.codeNameEn || '',
      description: '',
      sortOrder: code.sortOrder,
      level: code.level || 1,
      parentCodeId: code.parentCodeId || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteOpen = (code: CommonCodeListItem) => {
    setSelectedCode(code);
    setIsDeleteDialogOpen(true);
  };

  const handleStatusChangeOpen = (code: CommonCodeListItem, newStatus: CodeStatus) => {
    setSelectedCode(code);
    setStatusChangeData({ status: newStatus, reason: '' });
    setIsStatusDialogOpen(true);
  };

  const handleImpactOpen = (code: CommonCodeListItem) => {
    setSelectedCode(code);
    setIsImpactDialogOpen(true);
  };

  const handleHistoryOpen = (code: CommonCodeListItem) => {
    setSelectedCode(code);
    setIsHistoryDialogOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedCode) return;
    try {
      await statusMutation.mutateAsync({
        id: selectedCode.id,
        data: statusChangeData,
      });
      setIsStatusDialogOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleCreate = async () => {
    // Check for duplicates if not already checked or ignored
    if (!ignoreDuplicate && !duplicateCheckResult) {
      await handleCheckDuplicate();
      return;
    }

    // Block if exact duplicate and not ignored
    if (!ignoreDuplicate && duplicateCheckResult?.hasDuplicate && duplicateCheckResult.duplicateType !== 'SIMILAR') {
      return;
    }

    try {
      const createData: CreateCommonCodeRequest = {
        codeGroupId: formData.groupId,
        code: formData.code,
        codeName: formData.codeName,
        codeNameEn: formData.codeNameEn || undefined,
        description: formData.description || undefined,
        sortOrder: formData.sortOrder || undefined,
        parentCodeId: formData.parentCodeId || undefined,
      };
      await createMutation.mutateAsync(createData);
      setIsCreateDialogOpen(false);
      setDuplicateCheckResult(null);
      setIgnoreDuplicate(false);
    } catch (error) {
      console.error('Failed to create common code:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCode) return;
    try {
      const updateData: UpdateCommonCodeRequest = {
        codeName: formData.codeName,
        codeNameEn: formData.codeNameEn || undefined,
        description: formData.description || undefined,
        sortOrder: formData.sortOrder,
        parentCodeId: formData.parentCodeId || undefined,
      };
      await updateMutation.mutateAsync({ id: selectedCode.id, data: updateData });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update common code:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedCode) return;
    try {
      await deleteMutation.mutateAsync(selectedCode.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete common code:', error);
    }
  };

  // Bulk selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === commonCodes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(commonCodes.map(c => c.id)));
    }
  };

  const handleBulkStatusChange = async () => {
    if (!bulkAction) return;
    try {
      await bulkStatusMutation.mutateAsync({
        ids: Array.from(selectedIds),
        status: bulkAction.action,
      });
      toast({
        title: t('commonCode.bulkStatusDialog.successTitle'),
        description: t('commonCode.bulkStatusDialog.successDescription', { count: selectedIds.size }),
      });
      setSelectedIds(new Set());
      setBulkAction(null);
    } catch (error) {
      console.error('Failed to bulk update status:', error);
      toast({
        title: t('commonCode.bulkStatusDialog.failTitle'),
        description: t('commonCode.bulkStatusDialog.failDescription'),
        variant: 'destructive',
      });
    }
  };

  const getSelectedCodeNames = () => {
    return commonCodes
      .filter(c => selectedIds.has(c.id))
      .map(c => c.codeName);
  };

  return (
    <>
      <PageHeader
        title={t('commonCode.pageTitle')}
        description={t('commonCode.pageDescription')}
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            {t('commonCode.addButton')}
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('commonCode.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={searchState.groupCode} onValueChange={setGroupCode}>
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
              value={searchState.status === null ? '' : searchState.status}
              onValueChange={(value) => setStatus(value === '' ? null : value as 'ACTIVE' | 'INACTIVE' | 'DEPRECATED')}
            >
              <SelectTrigger className="h-10 w-[180px]">
                <SelectValue placeholder={t('common.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.allStatus')}</SelectItem>
                <SelectItem value="ACTIVE">{t('common.statusActive')}</SelectItem>
                <SelectItem value="INACTIVE">{t('common.statusInactive')}</SelectItem>
                <SelectItem value="DEPRECATED">{t('common.statusDeprecated')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border rounded-md p-0.5">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-7 px-2"
              >
                <LayoutList className="h-4 w-4 mr-1" />
                {t('commonCode.viewModeTable')}
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="h-7 px-2"
              >
                <GitBranch className="h-4 w-4 mr-1" />
                {t('commonCode.viewModeTree')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : isError ? (
              <EmptyState
                icon={Code}
                title={t('common.errorLoadData')}
                description={t('common.errorRetry')}
              />
            ) : commonCodes.length === 0 ? (
              <EmptyState
                icon={Code}
                title={t('commonCode.emptyTitle')}
                description={
                  searchState.keyword || searchState.groupCode
                    ? t('commonCode.emptySearchDescription')
                    : t('commonCode.emptyDescription')
                }
                action={
                  !searchState.keyword && !searchState.groupCode
                    ? {
                        label: t('commonCode.addButton'),
                        onClick: handleCreateOpen,
                      }
                    : undefined
                }
              />
            ) : (
              <>
                {selectedIds.size > 0 && (
                  <div className="flex items-center justify-between border-b bg-blue-50 px-4 py-3 dark:bg-blue-950">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {t('commonCode.selectedCount', { count: selectedIds.size })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBulkAction({ action: 'ACTIVE', label: t('common.statusActive') })}
                      >
                        {t('commonCode.bulkActivate')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBulkAction({ action: 'INACTIVE', label: t('common.statusInactive') })}
                      >
                        {t('commonCode.bulkDeactivate')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 hover:text-orange-700"
                        onClick={() => setBulkAction({ action: 'DEPRECATED', label: t('common.statusDeprecated') })}
                      >
                        {t('commonCode.bulkDeprecate')}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left">
                          <Checkbox
                            checked={commonCodes.length > 0 && selectedIds.size === commonCodes.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label={t('commonCode.selectAllAriaLabel')}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('commonCode.columns.codeGroup')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('commonCode.columns.code')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('commonCode.columns.codeName')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('commonCode.columns.englishName')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('commonCode.columns.classificationLevel')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('commonCode.columns.sortOrder')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('commonCode.columns.status')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          {t('commonCode.columns.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {commonCodes.map((code) => (
                        <tr
                          key={code.id}
                          className={`border-b transition-colors hover:bg-muted/50 ${selectedIds.has(code.id) ? 'bg-blue-50/50 dark:bg-blue-950/50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedIds.has(code.id)}
                              onCheckedChange={() => toggleSelect(code.id)}
                              aria-label={t('commonCode.selectItemAriaLabel', { name: code.codeName })}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {code.groupCode}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm">{code.code}</td>
                          <td className="px-4 py-3 text-sm font-medium">{code.codeName}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {code.codeNameEn || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {code.level ? (
                              <Badge
                                variant="outline"
                                className={CLASSIFICATION_BADGE_COLORS[code.level]}
                              >
                                {CLASSIFICATION_LABELS[code.level]}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{code.sortOrder}</td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              status={code.active ? 'success' : 'default'}
                              label={code.active ? t('common.statusActive') : t('common.statusInactive')}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditOpen(code)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t('commonCode.dropdownMenu.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleHistoryOpen(code)}>
                                  <History className="mr-2 h-4 w-4" />
                                  {t('commonCode.dropdownMenu.history')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleImpactOpen(code)}>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  {t('commonCode.dropdownMenu.impactAnalysis')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {code.active ? (
                                  <DropdownMenuItem onClick={() => handleStatusChangeOpen(code, 'INACTIVE')}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {t('commonCode.dropdownMenu.deactivate')}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleStatusChangeOpen(code, 'ACTIVE')}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {t('commonCode.dropdownMenu.activate')}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleStatusChangeOpen(code, 'DEPRECATED')}
                                  className="text-orange-600"
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  {t('commonCode.dropdownMenu.deprecate')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteOpen(code)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('commonCode.dropdownMenu.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                  {t('common.totalCount', { count: totalElements })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'tree' && (
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Code Group selector + Tree */}
          <div className="col-span-5">
            <Card>
              <CardHeader className="pb-3">
                <Select value={selectedGroupForTree} onValueChange={(value) => {
                  setSelectedGroupForTree(value);
                  setSelectedTreeNodeId(undefined);
                  setSelectedTreeNode(null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('commonCode.selectCodeGroup')} />
                  </SelectTrigger>
                  <SelectContent>
                    {codeGroups.map((group) => (
                      <SelectItem key={group.groupCode} value={group.groupCode}>
                        {group.groupName} ({group.groupCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {selectedGroupForTree ? (
                  <CodeTree
                    groupCode={selectedGroupForTree}
                    selectedId={selectedTreeNodeId}
                    onSelect={(node) => {
                      setSelectedTreeNodeId(node.id);
                      setSelectedTreeNode(node);
                    }}
                    onContextMenu={(event, node) => {
                      setContextMenu({ x: event.clientX, y: event.clientY, node });
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('commonCode.selectCodeGroupPrompt')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Selected node detail */}
          <div className="col-span-7">
            <Card>
              {selectedTreeNode ? (
                <>
                  <CardHeader>
                    <CardTitle className="text-base">{selectedTreeNode.codeName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('commonCode.treeNodeDetail.code')}</span>
                        <p className="font-mono font-medium mt-0.5">{selectedTreeNode.code}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('commonCode.treeNodeDetail.codeName')}</span>
                        <p className="font-medium mt-0.5">{selectedTreeNode.codeName}</p>
                      </div>
                      {selectedTreeNode.codeNameEn && (
                        <div>
                          <span className="text-muted-foreground">{t('commonCode.treeNodeDetail.englishName')}</span>
                          <p className="mt-0.5">{selectedTreeNode.codeNameEn}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">{t('commonCode.treeNodeDetail.status')}</span>
                        <p className="mt-0.5">
                          <StatusBadge
                            status={selectedTreeNode.active ? 'success' : 'default'}
                            label={selectedTreeNode.active ? t('common.statusActive') : t('common.statusInactive')}
                          />
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('commonCode.treeNodeDetail.sortOrder')}</span>
                        <p className="mt-0.5">{selectedTreeNode.sortOrder}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('commonCode.treeNodeDetail.hierarchyLevel')}</span>
                        <p className="mt-0.5">{t('commonCode.treeNodeDetail.hierarchyLevelValue', { level: selectedTreeNode.level + 1 })}</p>
                      </div>
                      {selectedTreeNode.children.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">{t('commonCode.treeNodeDetail.childCodes')}</span>
                          <p className="mt-0.5">{t('commonCode.treeNodeDetail.childCodeCount', { count: selectedTreeNode.children.length })}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        onClick={() => {
                          handleEditOpen(treeNodeToCodeItem(selectedTreeNode));
                        }}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        {t('common.editButton')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Pre-fill create dialog with this node as parent
                          const group = codeGroups.find(g => g.groupCode === selectedGroupForTree);
                          setFormData({
                            groupId: group?.id || '',
                            code: '',
                            codeName: '',
                            codeNameEn: '',
                            description: '',
                            sortOrder: 0,
                            level: Math.min(selectedTreeNode.level + 2, 4),
                            parentCodeId: selectedTreeNode.id,
                          });
                          setDuplicateCheckResult(null);
                          setIgnoreDuplicate(false);
                          setIsCreateDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        {t('commonCode.addChildCode')}
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                  <p>{t('commonCode.selectCodePrompt')}</p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tree Context Menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
          <div
            className="absolute bg-popover border rounded-md shadow-md py-1 w-48 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                handleEditOpen(treeNodeToCodeItem(contextMenu.node));
                setContextMenu(null);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('commonCode.contextMenu.edit')}
            </button>
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                const group = codeGroups.find(g => g.groupCode === selectedGroupForTree);
                setFormData({
                  groupId: group?.id || '',
                  code: '',
                  codeName: '',
                  codeNameEn: '',
                  description: '',
                  sortOrder: 0,
                  level: Math.min(contextMenu.node.level + 2, 4),
                  parentCodeId: contextMenu.node.id,
                });
                setDuplicateCheckResult(null);
                setIgnoreDuplicate(false);
                setIsCreateDialogOpen(true);
                setContextMenu(null);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('commonCode.contextMenu.addChild')}
            </button>
            <div className="border-t my-1" />
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2"
              onClick={() => {
                const newStatus: CodeStatus = contextMenu.node.active ? 'INACTIVE' : 'ACTIVE';
                handleStatusChangeOpen(treeNodeToCodeItem(contextMenu.node), newStatus);
                setContextMenu(null);
              }}
            >
              {contextMenu.node.active ? (
                <>
                  <Ban className="h-3.5 w-3.5" />
                  {t('commonCode.contextMenu.deactivate')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t('commonCode.contextMenu.activate')}
                </>
              )}
            </button>
            <button
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
              onClick={() => {
                handleDeleteOpen(treeNodeToCodeItem(contextMenu.node));
                setContextMenu(null);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('commonCode.contextMenu.delete')}
            </button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('commonCode.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('commonCode.createDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="groupId">{t('commonCode.createDialog.codeGroupLabel')}</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('commonCode.createDialog.codeGroupPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {codeGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.groupName} ({group.groupCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">{t('commonCode.createDialog.codeLabel')}</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }));
                    setDuplicateCheckResult(null);
                    setIgnoreDuplicate(false);
                  }}
                  placeholder={t('commonCode.createDialog.codePlaceholder')}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckDuplicate}
                  disabled={!formData.groupId || !formData.code || !formData.codeName || checkDuplicateMutation.isPending}
                >
                  {checkDuplicateMutation.isPending ? t('commonCode.createDialog.duplicateChecking') : t('commonCode.createDialog.duplicateCheckButton')}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="codeName">{t('commonCode.createDialog.codeNameLabel')}</Label>
              <Input
                id="codeName"
                value={formData.codeName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, codeName: e.target.value }));
                  setDuplicateCheckResult(null);
                  setIgnoreDuplicate(false);
                }}
                placeholder={t('commonCode.createDialog.codeNamePlaceholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="level">{t('commonCode.createDialog.classificationLabel')}</Label>
              <Select
                value={formData.level.toString()}
                onValueChange={(value) => {
                  const level = parseInt(value);
                  setFormData(prev => ({
                    ...prev,
                    level,
                    parentCodeId: level === 1 ? '' : prev.parentCodeId,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('commonCode.createDialog.classificationPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('commonCode.levelOption.1')}</SelectItem>
                  <SelectItem value="2">{t('commonCode.levelOption.2')}</SelectItem>
                  <SelectItem value="3">{t('commonCode.levelOption.3')}</SelectItem>
                  <SelectItem value="4">{t('commonCode.levelOption.4')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.level > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="parentCodeId">
                  {t('commonCode.createDialog.parentLabel', { label: CLASSIFICATION_LABELS[formData.level - 1] })}
                </Label>
                <Select
                  value={formData.parentCodeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentCodeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('commonCode.createDialog.parentPlaceholder', { label: CLASSIFICATION_LABELS[formData.level - 1] })} />
                  </SelectTrigger>
                  <SelectContent>
                    {getParentCodeOptions(formData.level, formData.groupId).map((parentCode) => (
                      <SelectItem key={parentCode.id} value={parentCode.id}>
                        {parentCode.codeName} ({parentCode.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.groupId && getParentCodeOptions(formData.level, formData.groupId).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t('commonCode.createDialog.noParentCodes', { label: CLASSIFICATION_LABELS[formData.level - 1] })}
                  </p>
                )}
              </div>
            )}

            {/* Duplicate Check Result */}
            {duplicateCheckResult && (
              <div className="space-y-2">
                {duplicateCheckResult.hasDuplicate ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {duplicateCheckResult.duplicateMessage}
                      {duplicateCheckResult.duplicateType === 'SIMILAR' && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIgnoreDuplicate(true)}
                          >
                            {t('commonCode.createDialog.ignoreAndSave')}
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : duplicateCheckResult.similarCodes.length > 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div>{t('commonCode.createDialog.similarCodesFound')}</div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {duplicateCheckResult.similarCodes.map((similar) => (
                          <li key={similar.id} className="text-muted-foreground">
                            {t('commonCode.createDialog.similarCodeItem', { code: similar.code, name: similar.name, similarity: similar.similarity })}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {t('commonCode.createDialog.noDuplicate')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {ignoreDuplicate && (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  {t('commonCode.createDialog.duplicateWarningIgnored')}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="codeNameEn">{t('common.labelEnglishName')}</Label>
              <Input
                id="codeNameEn"
                value={formData.codeNameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, codeNameEn: e.target.value }))}
                placeholder={t('commonCode.createDialog.englishNamePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">{t('common.labelSortOrder')}</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('common.labelDescription')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('commonCode.createDialog.descriptionPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancelButton')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.groupId ||
                !formData.code ||
                !formData.codeName ||
                (formData.level > 1 && !formData.parentCodeId) ||
                createMutation.isPending ||
                (duplicateCheckResult?.hasDuplicate && duplicateCheckResult.duplicateType !== 'SIMILAR' && !ignoreDuplicate)
              }
            >
              {createMutation.isPending ? t('common.savingText') : duplicateCheckResult ? t('common.saveButton') : t('commonCode.createDialog.saveAfterCheck')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('commonCode.editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('commonCode.editDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">{t('commonCode.editDialog.codeLabel')}</Label>
              <Input id="edit-code" value={formData.code} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-codeName">{t('commonCode.editDialog.codeNameLabel')}</Label>
              <Input
                id="edit-codeName"
                value={formData.codeName}
                onChange={(e) => setFormData(prev => ({ ...prev, codeName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-codeNameEn">{t('commonCode.editDialog.englishNameLabel')}</Label>
              <Input
                id="edit-codeNameEn"
                value={formData.codeNameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, codeNameEn: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-level">{t('commonCode.editDialog.classificationLabel')}</Label>
              <Select
                value={formData.level.toString()}
                onValueChange={(value) => {
                  const level = parseInt(value);
                  setFormData(prev => ({
                    ...prev,
                    level,
                    parentCodeId: level === 1 ? '' : prev.parentCodeId,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('commonCode.editDialog.classificationPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('commonCode.levelOption.1')}</SelectItem>
                  <SelectItem value="2">{t('commonCode.levelOption.2')}</SelectItem>
                  <SelectItem value="3">{t('commonCode.levelOption.3')}</SelectItem>
                  <SelectItem value="4">{t('commonCode.levelOption.4')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.level > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="edit-parentCodeId">
                  {t('commonCode.editDialog.parentLabel', { label: CLASSIFICATION_LABELS[formData.level - 1] })}
                </Label>
                <Select
                  value={formData.parentCodeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentCodeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('commonCode.editDialog.parentPlaceholder', { label: CLASSIFICATION_LABELS[formData.level - 1] })} />
                  </SelectTrigger>
                  <SelectContent>
                    {getParentCodeOptions(formData.level, formData.groupId).map((parentCode) => (
                      <SelectItem key={parentCode.id} value={parentCode.id}>
                        {parentCode.codeName} ({parentCode.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-sortOrder">{t('commonCode.editDialog.sortOrderLabel')}</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">{t('commonCode.editDialog.descriptionLabel')}</Label>
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
              disabled={!formData.codeName || updateMutation.isPending}
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
            <DialogTitle>{t('commonCode.deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('commonCode.deleteDialog.description')}
              <br />
              <strong className="text-foreground">{selectedCode?.codeName}</strong> ({selectedCode?.code})
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

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('commonCode.statusDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('commonCode.statusDialog.description', { name: selectedCode?.codeName, code: selectedCode?.code })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('commonCode.statusDialog.targetStatusLabel')}</Label>
              <Select
                value={statusChangeData.status}
                onValueChange={(value) => setStatusChangeData(prev => ({ ...prev, status: value as CodeStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t('commonCode.statusDialog.statusActive')}</SelectItem>
                  <SelectItem value="INACTIVE">{t('commonCode.statusDialog.statusInactive')}</SelectItem>
                  <SelectItem value="DEPRECATED">{t('commonCode.statusDialog.statusDeprecated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status-reason">{t('commonCode.statusDialog.reasonLabel')}</Label>
              <Textarea
                id="status-reason"
                value={statusChangeData.reason}
                onChange={(e) => setStatusChangeData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={t('commonCode.statusDialog.reasonPlaceholder')}
              />
            </div>
            {statusChangeData.status === 'DEPRECATED' && (
              <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                <AlertTriangle className="mb-1 inline-block h-4 w-4" />
                <span className="ml-2">
                  {t('commonCode.statusDialog.deprecatedWarning')}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              {t('common.cancelButton')}
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={statusMutation.isPending}
              variant={statusChangeData.status === 'DEPRECATED' ? 'destructive' : 'default'}
            >
              {statusMutation.isPending ? t('commonCode.statusDialog.changingStatus') : t('commonCode.statusDialog.changeStatusButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impact Analysis Dialog */}
      <Dialog open={isImpactDialogOpen} onOpenChange={setIsImpactDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('commonCode.impactDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('commonCode.impactDialog.description', { name: selectedCode?.codeName, code: selectedCode?.code })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {impactLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : impactData?.data ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{impactData.data.totalAffectedRecords}</div>
                      <div className="text-sm text-muted-foreground">{t('commonCode.impactDialog.totalAffectedRecords')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{impactData.data.affectedEntities.length}</div>
                      <div className="text-sm text-muted-foreground">{t('commonCode.impactDialog.relatedEntities')}</div>
                    </CardContent>
                  </Card>
                </div>

                {impactData.data.affectedEntities.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium">{t('commonCode.impactDialog.affectedDataTitle')}</h4>
                    {impactData.data.affectedEntities.map((entity, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{entity.entityType}</div>
                              <div className="text-sm text-muted-foreground">{entity.tableName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">{t('common.recordCount', { count: entity.recordCount })}</div>
                            </div>
                          </div>
                          {entity.sampleRecords && entity.sampleRecords.length > 0 && (
                            <div className="mt-3 border-t pt-3">
                              <div className="text-xs text-muted-foreground">{t('commonCode.impactDialog.sampleDataLabel')}</div>
                              <ul className="mt-1 space-y-1 text-sm">
                                {entity.sampleRecords.map((record) => (
                                  <li key={record.id} className="truncate">
                                    • {record.displayValue}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-950 dark:text-green-200">
                    {t('commonCode.impactDialog.noAffectedData')}
                  </div>
                )}

                {!impactData.data.canDelete && impactData.data.deleteBlockReason && (
                  <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                    <AlertTriangle className="mb-1 inline-block h-4 w-4" />
                    <span className="ml-2">{impactData.data.deleteBlockReason}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {t('commonCode.impactDialog.errorLoadImpact')}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImpactDialogOpen(false)}>
              {t('common.closeButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('commonCode.historyDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('commonCode.historyDialog.description', { name: selectedCode?.codeName, code: selectedCode?.code })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto py-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : historyData?.data && Array.isArray(historyData.data) && historyData.data.length > 0 ? (
              <div className="relative space-y-0 pl-6">
                <div className="absolute bottom-0 left-2 top-0 w-px bg-border" />
                {historyData.data.map((history) => (
                  <div key={history.id} className="relative pb-6">
                    <div className="absolute -left-4 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                      <div className={`h-2 w-2 rounded-full ${
                        history.action === 'CREATE' ? 'bg-green-500' :
                        history.action === 'DELETE' ? 'bg-red-500' :
                        (history.action === 'ACTIVATE' || history.action === 'DEACTIVATE' || history.action === 'DEPRECATE') ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={
                            history.action === 'CREATE' ? 'success' :
                            history.action === 'DELETE' ? 'error' :
                            (history.action === 'ACTIVATE' || history.action === 'DEACTIVATE' || history.action === 'DEPRECATE') ? 'warning' :
                            'info'
                          }
                          label={
                            history.action === 'CREATE' ? t('commonCode.historyDialog.actionCreate') :
                            history.action === 'DELETE' ? t('commonCode.historyDialog.actionDelete') :
                            history.action === 'ACTIVATE' ? t('commonCode.historyDialog.actionActivate') :
                            history.action === 'DEACTIVATE' ? t('commonCode.historyDialog.actionDeactivate') :
                            history.action === 'DEPRECATE' ? t('commonCode.historyDialog.actionDeprecate') :
                            t('commonCode.historyDialog.actionUpdate')
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {new Date(history.changedAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="font-medium">{history.changedBy}</span>
                        {history.fieldName && (
                          <span className="text-muted-foreground">
                            {t('commonCode.historyDialog.fieldChanged', { fieldName: history.fieldName })}
                          </span>
                        )}
                      </div>
                      {(history.oldValue || history.newValue) && (
                        <div className="mt-2 rounded bg-muted p-2 text-sm">
                          {history.oldValue && (
                            <div className="text-red-600 dark:text-red-400">
                              - {history.oldValue}
                            </div>
                          )}
                          {history.newValue && (
                            <div className="text-green-600 dark:text-green-400">
                              + {history.newValue}
                            </div>
                          )}
                        </div>
                      )}
                      {history.changeReason && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {t('commonCode.historyDialog.changeReason', { reason: history.changeReason })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {t('commonCode.historyDialog.noHistory')}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              {t('common.closeButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Change AlertDialog */}
      <AlertDialog open={bulkAction !== null} onOpenChange={(open) => { if (!open) setBulkAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('commonCode.bulkStatusDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {t('commonCode.bulkStatusDialog.description', { count: selectedIds.size, label: bulkAction?.label })}
                </p>
                {bulkAction?.action === 'DEPRECATED' && (
                  <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                    <AlertTriangle className="mb-1 inline-block h-4 w-4" />
                    <span className="ml-2">{t('commonCode.bulkStatusDialog.deprecatedWarning')}</span>
                  </div>
                )}
                <div className="rounded-md bg-muted p-3 text-sm">
                  <div className="mb-1 font-medium">{t('commonCode.bulkStatusDialog.affectedCodesTitle')}</div>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {getSelectedCodeNames().slice(0, 5).map((name, idx) => (
                      <li key={idx}>- {name}</li>
                    ))}
                    {getSelectedCodeNames().length > 5 && (
                      <li className="text-muted-foreground">
                        {t('commonCode.bulkStatusDialog.moreItems', { count: getSelectedCodeNames().length - 5 })}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancelButton')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusChange}
              disabled={bulkStatusMutation.isPending}
              className={bulkAction?.action === 'DEPRECATED' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              {bulkStatusMutation.isPending ? t('commonCode.bulkStatusDialog.changingStatus') : t('common.confirmButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
