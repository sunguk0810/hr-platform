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
import { Database, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useCodeGroupList, useCodeGroupSearchParams, useCreateCodeGroup, useUpdateCodeGroup, useDeleteCodeGroup } from '../hooks/useMdm';
import type { CodeGroupListItem, CreateCodeGroupRequest, UpdateCodeGroupRequest } from '@hr-platform/shared-types';

export default function CodeGroupPage() {
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CodeGroupListItem | null>(null);

  const [formData, setFormData] = useState<CreateCodeGroupRequest>({
    code: '',
    name: '',
    nameEn: '',
    description: '',
  });

  const {
    params,
    searchState,
    setKeyword,
    setIsActive,
    setPage,
  } = useCodeGroupSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data, isLoading, isError } = useCodeGroupList(params);
  const createMutation = useCreateCodeGroup();
  const updateMutation = useUpdateCodeGroup();
  const deleteMutation = useDeleteCodeGroup();

  const codeGroups = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;

  const handleCreateOpen = () => {
    setFormData({ code: '', name: '', nameEn: '', description: '' });
    setIsCreateDialogOpen(true);
  };

  const handleEditOpen = (group: CodeGroupListItem) => {
    setSelectedGroup(group);
    setFormData({
      code: group.code,
      name: group.name,
      nameEn: '',
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
        name: formData.name,
        nameEn: formData.nameEn,
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
        title="코드그룹 관리"
        description="공통코드의 그룹을 관리합니다."
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            코드그룹 추가
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
              icon={Database}
              title="데이터를 불러올 수 없습니다"
              description="잠시 후 다시 시도해주세요."
            />
          ) : codeGroups.length === 0 ? (
            <EmptyState
              icon={Database}
              title="등록된 코드그룹이 없습니다"
              description={
                searchState.keyword
                  ? '검색 조건에 맞는 코드그룹이 없습니다.'
                  : '새로운 코드그룹을 추가해주세요.'
              }
              action={
                !searchState.keyword
                  ? {
                      label: '코드그룹 추가',
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
                        코드
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        코드명
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        설명
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        하위코드
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        시스템
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
                    {codeGroups.map((group) => (
                      <tr
                        key={group.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-mono text-sm">{group.code}</td>
                        <td className="px-4 py-3 text-sm font-medium">{group.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {group.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{group.codeCount}개</td>
                        <td className="px-4 py-3">
                          {group.isSystem ? (
                            <StatusBadge status="info" label="시스템" />
                          ) : (
                            <StatusBadge status="default" label="사용자" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={group.isActive ? 'success' : 'default'}
                            label={group.isActive ? '활성' : '비활성'}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(group)}
                              disabled={group.isSystem}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpen(group)}
                              disabled={group.isSystem}
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
            <DialogTitle>코드그룹 추가</DialogTitle>
            <DialogDescription>
              새로운 코드그룹을 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">코드 *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="예: LEAVE_TYPE"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">코드명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: 휴가유형"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameEn">영문명</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="예: Leave Type"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="코드그룹에 대한 설명을 입력하세요."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.code || !formData.name || createMutation.isPending}
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
            <DialogTitle>코드그룹 수정</DialogTitle>
            <DialogDescription>
              코드그룹 정보를 수정합니다.
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
            <DialogTitle>코드그룹 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 코드그룹을 삭제하시겠습니까?
              <br />
              <strong className="text-foreground">{selectedGroup?.name}</strong> ({selectedGroup?.code})
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
