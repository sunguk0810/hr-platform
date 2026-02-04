import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Code, Plus, Search, Pencil, Trash2, MoreHorizontal, History, AlertTriangle, RefreshCw } from 'lucide-react';
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
  useCodeImpact,
  useCodeHistory,
  useCheckDuplicate,
} from '../hooks/useMdm';
import type { CommonCodeListItem, CreateCommonCodeRequest, UpdateCommonCodeRequest, CodeStatus, CheckDuplicateResponse } from '@hr-platform/shared-types';

export default function CommonCodePage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

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

  const [formData, setFormData] = useState<{
    groupId: string;
    code: string;
    name: string;
    nameEn: string;
    description: string;
    sortOrder: number;
  }>({
    groupId: '',
    code: '',
    name: '',
    nameEn: '',
    description: '',
    sortOrder: 0,
  });

  const {
    params,
    searchState,
    setGroupCode,
    setKeyword,
    setIsActive,
    setPage,
  } = useCommonCodeSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data, isLoading, isError } = useCommonCodeList(params);
  const { data: codeGroupsData } = useCodeGroupList({ size: 100 });
  const createMutation = useCreateCommonCode();
  const updateMutation = useUpdateCommonCode();
  const deleteMutation = useDeleteCommonCode();
  const statusMutation = useUpdateCodeStatus();
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
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;
  const codeGroups = codeGroupsData?.data?.content ?? [];

  const handleCreateOpen = () => {
    setFormData({
      groupId: '',
      code: '',
      name: '',
      nameEn: '',
      description: '',
      sortOrder: 0,
    });
    setDuplicateCheckResult(null);
    setIgnoreDuplicate(false);
    setIsCreateDialogOpen(true);
  };

  // Check for duplicates when code or name changes
  const handleCheckDuplicate = async () => {
    if (!formData.groupId || !formData.code || !formData.name) return;

    const group = codeGroups.find(g => g.id === formData.groupId);
    if (!group) return;

    try {
      const result = await checkDuplicateMutation.mutateAsync({
        groupCode: group.code,
        code: formData.code,
        name: formData.name,
      });
      setDuplicateCheckResult(result.data);
    } catch (error) {
      console.error('Duplicate check failed:', error);
    }
  };

  const handleEditOpen = (code: CommonCodeListItem) => {
    setSelectedCode(code);
    const group = codeGroups.find(g => g.code === code.groupCode);
    setFormData({
      groupId: group?.id || '',
      code: code.code,
      name: code.name,
      nameEn: code.nameEn || '',
      description: '',
      sortOrder: code.sortOrder,
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
        groupId: formData.groupId,
        code: formData.code,
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        description: formData.description || undefined,
        sortOrder: formData.sortOrder || undefined,
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
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        description: formData.description || undefined,
        sortOrder: formData.sortOrder,
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
                <option key={group.id} value={group.code}>
                  {group.name}
                </option>
              ))}
            </select>
            <select
              value={searchState.isActive === null ? '' : searchState.isActive.toString()}
              onChange={(e) => setIsActive(e.target.value === '' ? null : e.target.value === 'true')}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">전체 상태</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
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
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {code.groupCode}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{code.code}</td>
                        <td className="px-4 py-3 text-sm font-medium">{code.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {code.nameEn || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{code.sortOrder}</td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={code.isActive ? 'success' : 'default'}
                            label={code.isActive ? '활성' : '비활성'}
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
                              {code.isActive ? (
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
                      {group.name} ({group.code})
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
                  disabled={!formData.groupId || !formData.code || !formData.name || checkDuplicateMutation.isPending}
                >
                  {checkDuplicateMutation.isPending ? '확인 중...' : '중복 확인'}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">코드명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  setDuplicateCheckResult(null);
                  setIgnoreDuplicate(false);
                }}
                placeholder="예: 연차"
              />
            </div>

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
              <Label htmlFor="nameEn">영문명</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
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
                !formData.name ||
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
              <Label htmlFor="edit-name">코드명 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nameEn">영문명</Label>
              <Input
                id="edit-nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>
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
              disabled={!formData.name || updateMutation.isPending}
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
              <strong className="text-foreground">{selectedCode?.name}</strong> ({selectedCode?.code})
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
              <strong className="text-foreground">{selectedCode?.name}</strong> ({selectedCode?.code})의 상태를 변경합니다.
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
              <strong className="text-foreground">{selectedCode?.name}</strong> ({selectedCode?.code}) 코드의 사용 현황입니다.
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
              <strong className="text-foreground">{selectedCode?.name}</strong> ({selectedCode?.code}) 코드의 변경 이력입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto py-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : historyData?.data?.content && historyData.data.content.length > 0 ? (
              <div className="relative space-y-0 pl-6">
                <div className="absolute bottom-0 left-2 top-0 w-px bg-border" />
                {historyData.data.content.map((history) => (
                  <div key={history.id} className="relative pb-6">
                    <div className="absolute -left-4 flex h-4 w-4 items-center justify-center rounded-full bg-background">
                      <div className={`h-2 w-2 rounded-full ${
                        history.action === 'CREATED' ? 'bg-green-500' :
                        history.action === 'DELETED' ? 'bg-red-500' :
                        history.action === 'STATUS_CHANGED' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={
                            history.action === 'CREATED' ? 'success' :
                            history.action === 'DELETED' ? 'error' :
                            history.action === 'STATUS_CHANGED' ? 'warning' :
                            'info'
                          }
                          label={
                            history.action === 'CREATED' ? '생성' :
                            history.action === 'DELETED' ? '삭제' :
                            history.action === 'STATUS_CHANGED' ? '상태변경' :
                            '수정'
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {new Date(history.changedAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="font-medium">{history.changedBy.name}</span>
                        {history.changedField && (
                          <span className="text-muted-foreground">
                            {' '}님이 {history.changedField} 필드를 변경
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
                      {history.reason && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          사유: {history.reason}
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
    </>
  );
}
