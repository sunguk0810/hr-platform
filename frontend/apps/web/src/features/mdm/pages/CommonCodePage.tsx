import { useState, useEffect } from 'react';
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
import { Code, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import {
  useCommonCodeList,
  useCommonCodeSearchParams,
  useCodeGroupList,
  useCreateCommonCode,
  useUpdateCommonCode,
  useDeleteCommonCode,
} from '../hooks/useMdm';
import type { CommonCodeListItem, CreateCommonCodeRequest, UpdateCommonCodeRequest } from '@hr-platform/shared-types';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function CommonCodePage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<CommonCodeListItem | null>(null);

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
    setIsCreateDialogOpen(true);
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

  const handleCreate = async () => {
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
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(code)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpen(code)}
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
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="예: ANNUAL"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">코드명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 연차"
              />
            </div>
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
              disabled={!formData.groupId || !formData.code || !formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? '저장 중...' : '저장'}
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
    </>
  );
}
