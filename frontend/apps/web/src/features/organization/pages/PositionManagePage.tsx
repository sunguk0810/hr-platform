import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Briefcase, GripVertical } from 'lucide-react';
import { usePositions, useCreatePosition, useUpdatePosition, useDeletePosition } from '../hooks/useOrganization';
import type { Position, CreatePositionRequest, UpdatePositionRequest } from '@hr-platform/shared-types';

export default function PositionManagePage() {
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
                  {positions
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((position) => (
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
}
