import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Settings, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  useCondolencePolicies,
  useCreateCondolencePolicy,
  useUpdateCondolencePolicy,
  useDeleteCondolencePolicy,
} from '../hooks/useCondolence';
import type { CondolencePolicy, CondolenceType } from '@hr-platform/shared-types';
import { CONDOLENCE_TYPE_LABELS } from '@hr-platform/shared-types';

interface PolicyFormData {
  eventType: CondolenceType;
  amount: number;
  leaveDays: number;
  description: string;
  isActive: boolean;
}

export default function CondolencePolicyPage() {
  const { t } = useTranslation('condolence');
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<CondolencePolicy | null>(null);
  const [formData, setFormData] = useState<PolicyFormData>({
    eventType: 'MARRIAGE',
    amount: 0,
    leaveDays: 0,
    description: '',
    isActive: true,
  });

  const { data, isLoading } = useCondolencePolicies();
  const createMutation = useCreateCondolencePolicy();
  const updateMutation = useUpdateCondolencePolicy();
  const deleteMutation = useDeleteCondolencePolicy();

  const policies = data?.data ?? [];

  const handleCreateOpen = () => {
    setFormData({
      eventType: 'MARRIAGE',
      amount: 0,
      leaveDays: 0,
      description: '',
      isActive: true,
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditOpen = (policy: CondolencePolicy) => {
    setSelectedPolicy(policy);
    setFormData({
      eventType: policy.eventType,
      amount: policy.amount,
      leaveDays: policy.leaveDays,
      description: policy.description,
      isActive: policy.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteOpen = (policy: CondolencePolicy) => {
    setSelectedPolicy(policy);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      toast({
        title: t('policyToast.addSuccess'),
        description: t('policyToast.addSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('policyToast.addFailed'),
        description: t('policyToast.addFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedPolicy) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedPolicy.id,
        data: formData,
      });
      setIsEditDialogOpen(false);
      toast({
        title: t('policyToast.editSuccess'),
        description: t('policyToast.editSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('policyToast.editFailed'),
        description: t('policyToast.editFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPolicy) return;

    try {
      await deleteMutation.mutateAsync(selectedPolicy.id);
      setIsDeleteDialogOpen(false);
      toast({
        title: t('policyToast.deleteSuccess'),
        description: t('policyToast.deleteSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('policyToast.deleteFailed'),
        description: t('policyToast.deleteFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString() + t('policyPage.currencyUnit');
  };

  return (
    <>
      <PageHeader
        title={t('policyPage.title')}
        description={t('policyPage.description')}
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            {t('policyPage.addPolicy')}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('policyPage.listTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : policies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-medium">{t('policyPage.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('policyPage.emptyDescription')}
              </p>
              <Button className="mt-4" onClick={handleCreateOpen}>
                <Plus className="mr-2 h-4 w-4" />
                {t('policyPage.addPolicy')}
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('policyPage.table.eventType')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('policyPage.table.amount')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('policyPage.table.leave')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('policyPage.table.description')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('policyPage.table.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('policyPage.table.action')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((policy) => (
                      <tr
                        key={policy.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {CONDOLENCE_TYPE_LABELS[policy.eventType]}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatAmount(policy.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {policy.leaveDays}{t('policyPage.dayUnit')}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {policy.description}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                            {policy.isActive ? t('policyPage.active') : t('policyPage.inactive')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditOpen(policy)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOpen(policy)}
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
              <div className="px-4 py-3 text-sm text-muted-foreground border-t">
                {t('policyPage.totalCount', { count: policies.length })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('policyDialog.addTitle')}</DialogTitle>
            <DialogDescription>
              {t('policyDialog.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eventType">{t('policyDialog.typeLabel')}</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, eventType: value as CondolenceType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONDOLENCE_TYPE_LABELS) as CondolenceType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {CONDOLENCE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">{t('policyDialog.amountLabel')}</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="10000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))
                }
                placeholder={t('policyDialog.amountPlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="leaveDays">{t('policyDialog.leaveLabel')}</Label>
              <Input
                id="leaveDays"
                type="number"
                min="0"
                value={formData.leaveDays}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, leaveDays: parseInt(e.target.value) || 0 }))
                }
                placeholder={t('policyDialog.leavePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('policyDialog.descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t('policyDialog.descriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">{t('policyDialog.activeLabel')}</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('policyDialog.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.description || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('policyDialog.saving')}
                </>
              ) : (
                t('policyDialog.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('policyDialog.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('policyDialog.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-eventType">{t('policyDialog.typeLabel')}</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, eventType: value as CondolenceType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONDOLENCE_TYPE_LABELS) as CondolenceType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {CONDOLENCE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">{t('policyDialog.amountLabel')}</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="10000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-leaveDays">{t('policyDialog.leaveLabel')}</Label>
              <Input
                id="edit-leaveDays"
                type="number"
                min="0"
                value={formData.leaveDays}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, leaveDays: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">{t('policyDialog.descriptionLabel')}</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">{t('policyDialog.activeLabel')}</Label>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('policyDialog.cancel')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.description || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('policyDialog.saving')}
                </>
              ) : (
                t('policyDialog.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('policyDeleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('policyDeleteDialog.description')}
              <br />
              <strong className="text-foreground">
                {selectedPolicy && CONDOLENCE_TYPE_LABELS[selectedPolicy.eventType]}
              </strong>{' '}
              ({selectedPolicy && formatAmount(selectedPolicy.amount)})
              <br />
              <span className="text-destructive">
                {t('policyDeleteDialog.warning')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('policyDeleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('policyDeleteDialog.deleting')}
                </>
              ) : (
                t('policyDeleteDialog.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
