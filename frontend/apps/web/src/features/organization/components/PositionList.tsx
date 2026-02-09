import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');

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
            {t('position.add')}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {sortedPositions.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={t('position.noPositions')}
              description={t('position.noPositionsDescription')}
              action={
                onCreate
                  ? {
                      label: t('position.add'),
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
                      {tCommon('code')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('position.name')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {tCommon('englishName')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {tCommon('order')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {tCommon('status')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      {tCommon('actions')}
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
                          label={position.isActive ? tCommon('active') : tCommon('inactive')}
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
            <DialogTitle>{t('position.add')}</DialogTitle>
            <DialogDescription>{t('position.addDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">{`${tCommon('code')} *`}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder={t('position.placeholders.code')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">{`${t('position.name')} *`}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('position.placeholders.name')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameEn">{tCommon('englishName')}</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                placeholder={t('position.placeholders.englishName')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">{tCommon('order')}</Label>
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
              <Label htmlFor="description">{tCommon('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t('position.placeholders.description')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.code || !formData.name || isSubmitting}
            >
              {isSubmitting ? tCommon('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('position.edit')}</DialogTitle>
            <DialogDescription>{t('position.editDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">{tCommon('code')}</Label>
              <Input id="edit-code" value={formData.code} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{`${t('position.name')} *`}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nameEn">{tCommon('englishName')}</Label>
              <Input
                id="edit-nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sortOrder">{tCommon('order')}</Label>
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
              <Label htmlFor="edit-description">{tCommon('description')}</Label>
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
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name || isSubmitting}>
              {isSubmitting ? tCommon('saving') : tCommon('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('position.delete')}</DialogTitle>
            <DialogDescription>
              {t('position.deleteConfirm')}
              <br />
              <strong className="text-foreground">{selectedPosition?.name}</strong>
              <br />
              <span className="text-destructive">
                {t('position.deleteWarning')}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? tCommon('deleting') : tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
