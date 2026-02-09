import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Plus, Pencil, Trash2, GraduationCap, GripVertical, DollarSign } from 'lucide-react';
import { useGrades, useCreateGrade, useUpdateGrade, useDeleteGrade } from '../hooks/useOrganization';
import { SalaryStepSettings } from '../components/SalaryStepSettings';
import type { Grade, CreateGradeRequest, UpdateGradeRequest } from '@hr-platform/shared-types';

export default function GradeManagePage() {
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [salaryStepGradeId, setSalaryStepGradeId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateGradeRequest>({
    code: '',
    name: '',
    nameEn: '',
    level: 1,
    sortOrder: 1,
    description: '',
  });

  const { data: gradesData, isLoading, isError } = useGrades();
  const createMutation = useCreateGrade();
  const updateMutation = useUpdateGrade();
  const deleteMutation = useDeleteGrade();

  const grades = gradesData?.data ?? [];

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
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create grade:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedGrade) return;
    try {
      const updateData: UpdateGradeRequest = {
        name: formData.name,
        nameEn: formData.nameEn,
        level: formData.level,
        sortOrder: formData.sortOrder,
        description: formData.description,
      };
      await updateMutation.mutateAsync({ id: selectedGrade.id, data: updateData });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update grade:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedGrade) return;
    try {
      await deleteMutation.mutateAsync(selectedGrade.id);
      setSelectedGrade(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete grade:', error);
    }
  };

  const handleToggleSalaryStep = (gradeId: string) => {
    setSalaryStepGradeId((prev) => (prev === gradeId ? null : gradeId));
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['grades'] });
  };

  const sortedGrades = [...grades].sort((a, b) => a.sortOrder - b.sortOrder);

  // Shared dialogs render function
  const renderDialogs = () => (
    <>
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
              disabled={!formData.code || !formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? tCommon('saving') : tCommon('save')}
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
            <Button onClick={handleUpdate} disabled={!formData.name || updateMutation.isPending}>
              {updateMutation.isPending ? tCommon('saving') : tCommon('save')}
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
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? tCommon('deleting') : tCommon('delete')}
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
              <h1 className="text-xl font-bold">{t('grade.title')}</h1>
              <p className="text-sm text-muted-foreground">
                {grades.length > 0 ? t('grade.totalCount', { count: grades.length }) : t('grade.infoManagement')}
              </p>
            </div>
            <Button size="sm" onClick={handleCreateOpen}>
              <Plus className="mr-1 h-4 w-4" />
              {tCommon('add')}
            </Button>
          </div>

          {/* Grade List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : isError ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('department.dataLoadError')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('department.loadErrorDesc')}</p>
            </div>
          ) : grades.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">{t('grade.noGrades')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('grade.noGradesDescription')}</p>
              <Button className="mt-4" onClick={handleCreateOpen}>
                <Plus className="mr-2 h-4 w-4" />
                {t('grade.add')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedGrades.map((grade) => (
                <div key={grade.id} className="bg-card rounded-xl border p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{grade.code}</span>
                        <Badge variant="outline" className="text-xs">
                          Lv.{grade.level}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {tCommon('order')}: {grade.sortOrder}
                        </Badge>
                      </div>
                      <p className="font-medium">{grade.name}</p>
                      {grade.nameEn && (
                        <p className="text-sm text-muted-foreground">{grade.nameEn}</p>
                      )}
                    </div>
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {grade.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {grade.description}
                    </p>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleSalaryStep(grade.id)}
                    >
                      <DollarSign className="mr-1 h-4 w-4" />
                      {t('grade.salaryStep')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditOpen(grade)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      {tCommon('edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteOpen(grade)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {salaryStepGradeId === grade.id && (
                    <div className="mt-3">
                      <SalaryStepSettings gradeId={grade.id} gradeName={grade.name} />
                    </div>
                  )}
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
        title={t('grade.title')}
        description={t('grade.description')}
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            {t('grade.add')}
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
              icon={GraduationCap}
              title={t('department.dataLoadError')}
              description={t('department.loadErrorDesc')}
            />
          ) : grades.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={t('grade.noGrades')}
              description={t('grade.noGradesDescription')}
              action={{
                label: t('grade.add'),
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
                      {tCommon('code')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('grade.name')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {tCommon('englishName')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {tCommon('level')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {tCommon('order')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      {t('grade.salaryStepColumn')}
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
                        <td className="px-4 py-3 text-sm">{grade.level}</td>
                        <td className="px-4 py-3 text-sm">{grade.sortOrder}</td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant={salaryStepGradeId === grade.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleSalaryStep(grade.id)}
                          >
                            <DollarSign className="mr-1 h-4 w-4" />
                            {t('grade.salaryStep')}
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(grade)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpen(grade)}
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

      {salaryStepGradeId && (() => {
        const grade = grades.find((g) => g.id === salaryStepGradeId);
        if (!grade) return null;
        return (
          <div className="mt-6">
            <SalaryStepSettings gradeId={grade.id} gradeName={grade.name} />
          </div>
        );
      })()}

      {renderDialogs()}
    </>
  );
}
