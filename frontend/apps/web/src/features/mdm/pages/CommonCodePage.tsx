import { useState, useEffect } from 'react';
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
    1: '대분류',
    2: '중분류',
    3: '소분류',
    4: '세분류',
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
        title: '일괄 상태 변경 완료',
        description: `${selectedIds.size}개 코드의 상태가 변경되었습니다.`,
      });
      setSelectedIds(new Set());
      setBulkAction(null);
    } catch (error) {
      console.error('Failed to bulk update status:', error);
      toast({
        title: '일괄 상태 변경 실패',
        description: '상태 변경 중 오류가 발생했습니다.',
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
        title="공통코드 관리"
        description="각 코드그룹의 공통코드를 관리합니다."
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            공통코드 추가
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="코드, 코드명으로 검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={searchState.groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">전체 코드그룹</option>
              {codeGroups.map((group) => (
                <option key={group.id} value={group.groupCode}>
                  {group.groupName}
                </option>
              ))}
            </select>
            <select
              value={searchState.status === null ? '' : searchState.status}
              onChange={(e) => setStatus(e.target.value === '' ? null : e.target.value as 'ACTIVE' | 'INACTIVE' | 'DEPRECATED')}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">전체 상태</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
              <option value="DEPRECATED">폐기</option>
            </select>
            <div className="flex items-center gap-1 border rounded-md p-0.5">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-7 px-2"
              >
                <LayoutList className="h-4 w-4 mr-1" />
                테이블
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="h-7 px-2"
              >
                <GitBranch className="h-4 w-4 mr-1" />
                트리
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
                title="데이터를 불러올 수 없습니다"
                description="잠시 후 다시 시도해주세요."
              />
            ) : commonCodes.length === 0 ? (
              <EmptyState
                icon={Code}
                title="등록된 공통코드가 없습니다"
                description={
                  searchState.keyword || searchState.groupCode
                    ? '검색 조건에 맞는 공통코드가 없습니다.'
                    : '새로운 공통코드를 추가해주세요.'
                }
                action={
                  !searchState.keyword && !searchState.groupCode
                    ? {
                        label: '공통코드 추가',
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
                      {selectedIds.size}개 항목 선택됨
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBulkAction({ action: 'ACTIVE', label: '활성' })}
                      >
                        활성화
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBulkAction({ action: 'INACTIVE', label: '비활성' })}
                      >
                        비활성화
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 hover:text-orange-700"
                        onClick={() => setBulkAction({ action: 'DEPRECATED', label: '폐기' })}
                      >
                        폐기
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
                            aria-label="전체 선택"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          코드그룹
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          코드
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          코드명
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          영문명
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          분류 수준
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          정렬순서
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          작업
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
                              aria-label={`${code.codeName} 선택`}
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
                              label={code.active ? '활성' : '비활성'}
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
                                  수정
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleHistoryOpen(code)}>
                                  <History className="mr-2 h-4 w-4" />
                                  변경 이력
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleImpactOpen(code)}>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  영향도 분석
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {code.active ? (
                                  <DropdownMenuItem onClick={() => handleStatusChangeOpen(code, 'INACTIVE')}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    비활성화
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleStatusChangeOpen(code, 'ACTIVE')}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    활성화
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => handleStatusChangeOpen(code, 'DEPRECATED')}
                                  className="text-orange-600"
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  폐기(Deprecated)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteOpen(code)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  삭제
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
                  총 {totalElements}개
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
                    <SelectValue placeholder="코드그룹 선택" />
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
                    코드그룹을 선택하세요.
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
                        <span className="text-muted-foreground">코드</span>
                        <p className="font-mono font-medium mt-0.5">{selectedTreeNode.code}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">코드명</span>
                        <p className="font-medium mt-0.5">{selectedTreeNode.codeName}</p>
                      </div>
                      {selectedTreeNode.codeNameEn && (
                        <div>
                          <span className="text-muted-foreground">영문명</span>
                          <p className="mt-0.5">{selectedTreeNode.codeNameEn}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">상태</span>
                        <p className="mt-0.5">
                          <StatusBadge
                            status={selectedTreeNode.active ? 'success' : 'default'}
                            label={selectedTreeNode.active ? '활성' : '비활성'}
                          />
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">정렬순서</span>
                        <p className="mt-0.5">{selectedTreeNode.sortOrder}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">계층 레벨</span>
                        <p className="mt-0.5">{selectedTreeNode.level + 1}단계</p>
                      </div>
                      {selectedTreeNode.children.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">하위 코드</span>
                          <p className="mt-0.5">{selectedTreeNode.children.length}개</p>
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
                        수정
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
                        하위 코드 추가
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
                  <p>트리에서 코드를 선택하세요.</p>
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
              수정
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
              하위 코드 추가
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
                  비활성화
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  활성화
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
              삭제
            </button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공통코드 추가</DialogTitle>
            <DialogDescription>
              새로운 공통코드를 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="groupId">코드그룹 *</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, groupId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="코드그룹 선택" />
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
              <Label htmlFor="code">코드 *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }));
                    setDuplicateCheckResult(null);
                    setIgnoreDuplicate(false);
                  }}
                  placeholder="예: ANNUAL"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckDuplicate}
                  disabled={!formData.groupId || !formData.code || !formData.codeName || checkDuplicateMutation.isPending}
                >
                  {checkDuplicateMutation.isPending ? '확인 중...' : '중복 확인'}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="codeName">코드명 *</Label>
              <Input
                id="codeName"
                value={formData.codeName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, codeName: e.target.value }));
                  setDuplicateCheckResult(null);
                  setIgnoreDuplicate(false);
                }}
                placeholder="예: 연차"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="level">분류 수준 *</Label>
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
                  <SelectValue placeholder="분류 수준 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - 대분류</SelectItem>
                  <SelectItem value="2">2 - 중분류</SelectItem>
                  <SelectItem value="3">3 - 소분류</SelectItem>
                  <SelectItem value="4">4 - 세분류</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.level > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="parentCodeId">
                  상위 분류 ({CLASSIFICATION_LABELS[formData.level - 1]}) *
                </Label>
                <Select
                  value={formData.parentCodeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentCodeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`상위 ${CLASSIFICATION_LABELS[formData.level - 1]} 선택`} />
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
                    선택한 코드그룹에 {CLASSIFICATION_LABELS[formData.level - 1]} 코드가 없습니다. 먼저 상위 분류를 등록해주세요.
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
                            무시하고 저장
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : duplicateCheckResult.similarCodes.length > 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div>유사한 코드가 있습니다:</div>
                      <ul className="mt-2 space-y-1 text-sm">
                        {duplicateCheckResult.similarCodes.map((similar) => (
                          <li key={similar.id} className="text-muted-foreground">
                            • {similar.code} - {similar.name} (유사도: {similar.similarity}%)
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      중복되는 코드가 없습니다. 저장할 수 있습니다.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {ignoreDuplicate && (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  중복 경고를 무시하고 저장합니다.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="codeNameEn">영문명</Label>
              <Input
                id="codeNameEn"
                value={formData.codeNameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, codeNameEn: e.target.value }))}
                placeholder="예: Annual Leave"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">정렬순서</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="코드에 대한 설명을 입력하세요."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
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
              {createMutation.isPending ? '저장 중...' : duplicateCheckResult ? '저장' : '중복 확인 후 저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공통코드 수정</DialogTitle>
            <DialogDescription>
              공통코드 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">코드</Label>
              <Input id="edit-code" value={formData.code} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-codeName">코드명 *</Label>
              <Input
                id="edit-codeName"
                value={formData.codeName}
                onChange={(e) => setFormData(prev => ({ ...prev, codeName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-codeNameEn">영문명</Label>
              <Input
                id="edit-codeNameEn"
                value={formData.codeNameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, codeNameEn: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-level">분류 수준</Label>
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
                  <SelectValue placeholder="분류 수준 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - 대분류</SelectItem>
                  <SelectItem value="2">2 - 중분류</SelectItem>
                  <SelectItem value="3">3 - 소분류</SelectItem>
                  <SelectItem value="4">4 - 세분류</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.level > 1 && (
              <div className="grid gap-2">
                <Label htmlFor="edit-parentCodeId">
                  상위 분류 ({CLASSIFICATION_LABELS[formData.level - 1]})
                </Label>
                <Select
                  value={formData.parentCodeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parentCodeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`상위 ${CLASSIFICATION_LABELS[formData.level - 1]} 선택`} />
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
              <Label htmlFor="edit-sortOrder">정렬순서</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.codeName || updateMutation.isPending}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공통코드 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 공통코드를 삭제하시겠습니까?
              <br />
              <strong className="text-foreground">{selectedCode?.codeName}</strong> ({selectedCode?.code})
              <br />
              <span className="text-destructive">이 작업은 되돌릴 수 없습니다.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>코드 상태 변경</DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{selectedCode?.codeName}</strong> ({selectedCode?.code})의 상태를 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>변경할 상태</Label>
              <Select
                value={statusChangeData.status}
                onValueChange={(value) => setStatusChangeData(prev => ({ ...prev, status: value as CodeStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">활성 (ACTIVE)</SelectItem>
                  <SelectItem value="INACTIVE">비활성 (INACTIVE)</SelectItem>
                  <SelectItem value="DEPRECATED">폐기 (DEPRECATED)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status-reason">변경 사유</Label>
              <Textarea
                id="status-reason"
                value={statusChangeData.reason}
                onChange={(e) => setStatusChangeData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="상태 변경 사유를 입력하세요."
              />
            </div>
            {statusChangeData.status === 'DEPRECATED' && (
              <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                <AlertTriangle className="mb-1 inline-block h-4 w-4" />
                <span className="ml-2">
                  폐기(Deprecated) 상태로 변경하면 해당 코드는 더 이상 신규 데이터에 사용되지 않습니다.
                  기존 데이터는 유지됩니다.
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={statusMutation.isPending}
              variant={statusChangeData.status === 'DEPRECATED' ? 'destructive' : 'default'}
            >
              {statusMutation.isPending ? '변경 중...' : '상태 변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impact Analysis Dialog */}
      <Dialog open={isImpactDialogOpen} onOpenChange={setIsImpactDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>영향도 분석</DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{selectedCode?.codeName}</strong> ({selectedCode?.code}) 코드의 사용 현황입니다.
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
                      <div className="text-sm text-muted-foreground">총 영향받는 레코드</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{impactData.data.affectedEntities.length}</div>
                      <div className="text-sm text-muted-foreground">관련 엔티티</div>
                    </CardContent>
                  </Card>
                </div>

                {impactData.data.affectedEntities.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium">영향받는 데이터</h4>
                    {impactData.data.affectedEntities.map((entity, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{entity.entityType}</div>
                              <div className="text-sm text-muted-foreground">{entity.tableName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">{entity.recordCount}건</div>
                            </div>
                          </div>
                          {entity.sampleRecords && entity.sampleRecords.length > 0 && (
                            <div className="mt-3 border-t pt-3">
                              <div className="text-xs text-muted-foreground">샘플 데이터:</div>
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
                    이 코드를 사용하는 데이터가 없습니다. 안전하게 삭제할 수 있습니다.
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
                영향도 데이터를 불러올 수 없습니다.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImpactDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>변경 이력</DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{selectedCode?.codeName}</strong> ({selectedCode?.code}) 코드의 변경 이력입니다.
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
                            history.action === 'CREATE' ? '생성' :
                            history.action === 'DELETE' ? '삭제' :
                            history.action === 'ACTIVATE' ? '활성화' :
                            history.action === 'DEACTIVATE' ? '비활성화' :
                            history.action === 'DEPRECATE' ? '폐기' :
                            '수정'
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
                            {' '}님이 {history.fieldName} 필드를 변경
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
                          사유: {history.changeReason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                변경 이력이 없습니다.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Change AlertDialog */}
      <AlertDialog open={bulkAction !== null} onOpenChange={(open) => { if (!open) setBulkAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일괄 상태 변경</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {selectedIds.size}개의 코드를 '{bulkAction?.label}'(으)로 변경하시겠습니까?
                </p>
                {bulkAction?.action === 'DEPRECATED' && (
                  <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                    <AlertTriangle className="mb-1 inline-block h-4 w-4" />
                    <span className="ml-2">폐기된 코드는 복구할 수 없습니다.</span>
                  </div>
                )}
                <div className="rounded-md bg-muted p-3 text-sm">
                  <div className="mb-1 font-medium">영향받는 코드:</div>
                  <ul className="space-y-0.5 text-muted-foreground">
                    {getSelectedCodeNames().slice(0, 5).map((name, idx) => (
                      <li key={idx}>- {name}</li>
                    ))}
                    {getSelectedCodeNames().length > 5 && (
                      <li className="text-muted-foreground">
                        외 {getSelectedCodeNames().length - 5}건
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatusChange}
              disabled={bulkStatusMutation.isPending}
              className={bulkAction?.action === 'DEPRECATED' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              {bulkStatusMutation.isPending ? '변경 중...' : '확인'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
