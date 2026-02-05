import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Plus, Pencil, Trash2, Briefcase, GripVertical } from 'lucide-react';
import { usePositions, useCreatePosition, useUpdatePosition, useDeletePosition } from '../hooks/useOrganization';
import type { Position, CreatePositionRequest, UpdatePositionRequest } from '@hr-platform/shared-types';

export default function PositionManagePage() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const [formData, setFormData] = useState<CreatePositionRequest>({
    code: '',
    name: '',
    nameEn: '',
    sortOrder: 1,
    description: '',
  });

  const { data: positionsData, isLoading, isError } = usePositions();
  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();

  const positions = positionsData?.data ?? [];

  const handleCreateOpen = () => {
    setFormData({
      code: '',
      name: '',
      nameEn: '',
      sortOrder: positions.length + 1,
      description: '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditOpen = (position: Position) => {
    setSelectedPosition(position);
    setFormData({
      code: position.code,
      name: position.name,
      nameEn: position.nameEn || '',
      sortOrder: position.sortOrder,
      description: position.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteOpen = (position: Position) => {
    setSelectedPosition(position);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create position:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPosition) return;
    try {
      const updateData: UpdatePositionRequest = {
        name: formData.name,
        nameEn: formData.nameEn,
        sortOrder: formData.sortOrder,
        description: formData.description,
      };
      await updateMutation.mutateAsync({ id: selectedPosition.id, data: updateData });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedPosition) return;
    try {
      await deleteMutation.mutateAsync(selectedPosition.id);
      setSelectedPosition(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete position:', error);
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['positions'] });
  };

  const sortedPositions = [...positions].sort((a, b) => a.sortOrder - b.sortOrder);

  // Shared dialogs render function
  const renderDialogs = () => (
    <>
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>직책 추가</DialogTitle>
            <DialogDescription>새로운 직책을 추가합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">코드 *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder="예: TL"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">명칭 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="예: 팀장"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameEn">영문명</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                placeholder="예: Team Leader"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">순서</Label>
              <Input
                id="sortOrder"
                type="number"
                min="1"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="직책에 대한 설명"
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
            <DialogTitle>직책 수정</DialogTitle>
            <DialogDescription>직책 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">코드</Label>
              <Input id="edit-code" value={formData.code} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">명칭 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nameEn">영문명</Label>
              <Input
                id="edit-nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sortOrder">순서</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                min="1"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name || updateMutation.isPending}>
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>직책 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 직책을 삭제하시겠습니까?
              <br />
              <strong className="text-foreground">{selectedPosition?.name}</strong>
              <br />
              <span className="text-destructive">
                해당 직책이 적용된 직원이 있는 경우 삭제할 수 없습니다.
              </span>
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

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">직책 관리</h1>
              <p className="text-sm text-muted-foreground">
                {positions.length > 0 ? `총 ${positions.length}개 직책` : '직책 정보 관리'}
              </p>
            </div>
            <Button size="sm" onClick={handleCreateOpen}>
              <Plus className="mr-1 h-4 w-4" />
              추가
            </Button>
          </div>

          {/* Position List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : isError ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">데이터를 불러올 수 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">잠시 후 다시 시도해주세요.</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">등록된 직책이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">새로운 직책을 등록해주세요.</p>
              <Button className="mt-4" onClick={handleCreateOpen}>
                <Plus className="mr-2 h-4 w-4" />
                직책 추가
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPositions.map((position) => (
                <div key={position.id} className="bg-card rounded-xl border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{position.code}</span>
                        <Badge variant="outline" className="text-xs">
                          순서: {position.sortOrder}
                        </Badge>
                      </div>
                      <p className="font-medium">{position.name}</p>
                      {position.nameEn && (
                        <p className="text-sm text-muted-foreground">{position.nameEn}</p>
                      )}
                    </div>
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {position.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {position.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditOpen(position)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteOpen(position)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
        title="직책 관리"
        description="직책 정보를 등록하고 관리합니다."
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            직책 추가
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : isError ? (
            <EmptyState
              icon={Briefcase}
              title="데이터를 불러올 수 없습니다"
              description="잠시 후 다시 시도해주세요."
            />
          ) : positions.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="등록된 직책이 없습니다"
              description="새로운 직책을 등록해주세요."
              action={{
                label: '직책 추가',
                onClick: handleCreateOpen,
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="w-10 px-4 py-3"></th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      코드
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      명칭
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      영문명
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      순서
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      설명
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPositions.map((position) => (
                      <tr key={position.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{position.code}</td>
                        <td className="px-4 py-3 font-medium">{position.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {position.nameEn || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{position.sortOrder}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {position.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(position)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpen(position)}
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
          )}
        </CardContent>
      </Card>

      {renderDialogs()}
    </>
  );
}
