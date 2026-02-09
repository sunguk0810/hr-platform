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
import { Plus, Pencil, Trash2, GraduationCap, GripVertical, Loader2 } from 'lucide-react';
import type { Grade, CreateGradeRequest, UpdateGradeRequest } from '@hr-platform/shared-types';

export interface GradeListProps {
  grades: Grade[];
  isLoading?: boolean;
  onCreate?: (data: CreateGradeRequest) => Promise<void>;
  onUpdate?: (id: string, data: UpdateGradeRequest) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onReorder?: (grades: Grade[]) => Promise<void>;
}

export function GradeList({
  grades,
  isLoading = false,
  onCreate,
  onUpdate,
  onDelete,
}: GradeListProps) {
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedGrade, setSelectedGrade] = React.useState<Grade | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [formData, setFormData] = React.useState<CreateGradeRequest>({
    code: '',
    name: '',
    nameEn: '',
    level: 1,
    sortOrder: 1,
    description: '',
  });

  const sortedGrades = [...grades].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleCreateOpen = () => {
    setFormData({
      code: '',
      name: '',
      nameEn: '',
      level: grades.length + 1,
      sortOrder: grades.length + 1,
      description: '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditOpen = (grade: Grade) => {
    setSelectedGrade(grade);
    setFormData({
      code: grade.code,
      name: grade.name,
      nameEn: grade.nameEn || '',
      level: grade.level,
      sortOrder: grade.sortOrder,
      description: grade.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteOpen = (grade: Grade) => {
    setSelectedGrade(grade);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!onCreate) return;
    setIsSubmitting(true);
    try {
      await onCreate(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create grade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedGrade || !onUpdate) return;
    setIsSubmitting(true);
    try {
      const updateData: UpdateGradeRequest = {
        name: formData.name,
        nameEn: formData.nameEn || undefined,
        level: formData.level,
        sortOrder: formData.sortOrder,
        description: formData.description || undefined,
      };
      await onUpdate(selectedGrade.id, updateData);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update grade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGrade || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(selectedGrade.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete grade:', error);
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
            {t('grade.add')}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {sortedGrades.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={t('grade.noGrades')}
              description={t('grade.noGradesDescription')}
              action={
                onCreate
                  ? {
                      label: t('grade.add'),
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
                      {t('grade.name')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {tCommon('englishName')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {tCommon('level')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {tCommon('order')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      {tCommon('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGrades.map((grade) => (
                    <tr key={grade.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{grade.code}</td>
                      <td className="px-4 py-3 font-medium">{grade.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {grade.nameEn || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{grade.level}</td>
                      <td className="px-4 py-3 text-sm text-center">{grade.sortOrder}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {onUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(grade)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpen(grade)}
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
            <DialogTitle>{t('grade.add')}</DialogTitle>
            <DialogDescription>{t('grade.addDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">{tCommon('code')} *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                }
                placeholder={t('grade.placeholders.code')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">{t('grade.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('grade.placeholders.name')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameEn">{tCommon('englishName')}</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                placeholder={t('grade.placeholders.englishName')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="level">{tCommon('level')}</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  value={formData.level}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, level: parseInt(e.target.value) || 1 }))
                  }
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{tCommon('description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t('grade.placeholders.description')}
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
            <DialogTitle>{t('grade.edit')}</DialogTitle>
            <DialogDescription>{t('grade.editDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">{tCommon('code')}</Label>
              <Input id="edit-code" value={formData.code} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('grade.name')} *</Label>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-level">{tCommon('level')}</Label>
                <Input
                  id="edit-level"
                  type="number"
                  min="1"
                  value={formData.level}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, level: parseInt(e.target.value) || 1 }))
                  }
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
            <DialogTitle>{t('grade.delete')}</DialogTitle>
            <DialogDescription>
              {t('grade.deleteConfirm')}
              <br />
              <strong className="text-foreground">{selectedGrade?.name}</strong>
              <br />
              <span className="text-destructive">
                {t('grade.deleteWarning')}
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
