import * as React from 'react';
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
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Plus, Pencil, Trash2, Briefcase, GripVertical, Loader2 } from 'lucide-react';
import type { Position, CreatePositionRequest, UpdatePositionRequest } from '@hr-platform/shared-types';

export interface PositionListProps {
  positions: Position[];
  isLoading?: boolean;
  onCreate?: (data: CreatePositionRequest) => Promise<void>;
  onUpdate?: (id: string, data: UpdatePositionRequest) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onReorder?: (positions: Position[]) => Promise<void>;
}

export function PositionList({
  positions,
  isLoading = false,
  onCreate,
  onUpdate,
  onDelete,
}: PositionListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedPosition, setSelectedPosition] = React.useState<Position | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState<CreatePositionRequest>({
    code: '',
    name: '',
    nameEn: '',
    sortOrder: 1,
    description: '',
  });

  const sortedPositions = [...positions].sort((a, b) => a.sortOrder - b.sortOrder);

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
    if (!onCreate) return;
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create position:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPosition || !onUpdate) return;
    setIsSubmitting(true);
    try {
      const updateData: UpdatePositionRequest = {
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        sortOrder: formData.sortOrder,
        description: formData.description || undefined,
      };
      await onUpdate(selectedPosition.id, updateData);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update position:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPosition || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(selectedPosition.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete position:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        {onCreate && (
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            직책 추가
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {sortedPositions.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="등록된 직책이 없습니다"
              description="새로운 직책을 등록해주세요."
              action={
                onCreate
                  ? {
                      label: '직책 추가',
                      onClick: handleCreateOpen,
                    }
                  : undefined
              }
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
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      순서
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      상태
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
                      <td className="px-4 py-3 text-sm text-center">{position.sortOrder}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge
                          status={position.isActive ? 'success' : 'default'}
                          label={position.isActive ? '활성' : '비활성'}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {onUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(position)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpen(position)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
                placeholder="예: P1"
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
              disabled={!formData.code || !formData.name || isSubmitting}
            >
              {isSubmitting ? '저장 중...' : '저장'}
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
            <Button onClick={handleUpdate} disabled={!formData.name || isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
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
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
