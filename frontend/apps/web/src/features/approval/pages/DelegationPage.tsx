import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Users, Plus, Trash2, UserCheck, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { format, addDays } from 'date-fns';
import { useDelegations, useCreateDelegation, useCancelDelegation, useEmployeeSearch } from '../hooks/useApprovals';
import type { DelegationStatus, CreateDelegationRequest } from '@hr-platform/shared-types';

const STATUS_CONFIG_KEYS: Record<DelegationStatus, { key: string; variant: 'default' | 'warning' | 'success' | 'error' }> = {
  ACTIVE: { key: 'delegationPage.statusActive', variant: 'success' },
  EXPIRED: { key: 'delegationPage.statusExpired', variant: 'default' },
  CANCELLED: { key: 'delegationPage.statusCancelled', variant: 'error' },
};

export default function DelegationPage() {
  const { t } = useTranslation('approval');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [employeeSearch] = useState('');
  const [formData, setFormData] = useState<CreateDelegationRequest>({
    delegateeId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    reason: '',
  });

  const { data: delegationsData, isLoading } = useDelegations();
  const { data: employeesData } = useEmployeeSearch(employeeSearch);
  const createMutation = useCreateDelegation();
  const cancelMutation = useCancelDelegation();

  const delegations = delegationsData?.data ?? [];
  const employees = employeesData?.data ?? [];
  const activeDelegation = delegations.find((d) => d.status === 'ACTIVE');

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        delegateeId: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        reason: '',
      });
    } catch (error) {
      console.error('Failed to create delegation:', error);
    }
  };

  const handleCancel = (id: string) => {
    setCancelTargetId(id);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    try {
      await cancelMutation.mutateAsync(cancelTargetId);
    } catch (error) {
      console.error('Failed to cancel delegation:', error);
    } finally {
      setCancelTargetId(null);
    }
  };

  return (
    <>
      <PageHeader
        title={t('delegationPage.title')}
        description={t('delegationPage.description')}
        actions={
          !activeDelegation && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('delegationPage.setupButton')}
            </Button>
          )
        }
      />

      {/* Current Delegation Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t('delegationPage.currentStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeDelegation ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">{t('delegationPage.delegatingTo', { name: activeDelegation.delegateeName })}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(activeDelegation.startDate), 'yyyy.MM.dd')} ~{' '}
                      {format(new Date(activeDelegation.endDate), 'yyyy.MM.dd')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleCancel(activeDelegation.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('delegationPage.cancelDelegation')}
                </Button>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">{t('delegationPage.delegationReason')}</span>
                {activeDelegation.reason}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-medium">{t('delegationPage.noActiveDelegation')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('delegationPage.noActiveDelegationDesc')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delegation History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('delegationPage.historyTitle')}</CardTitle>
          <CardDescription>{t('delegationPage.historyDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : delegations.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t('delegationPage.emptyHistory')}
              description={t('delegationPage.emptyHistoryDesc')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('delegationPage.tableDelegatee')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('delegationPage.tablePeriod')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('delegationPage.tableReason')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t('delegationPage.tableStatus')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {delegations.map((delegation) => {
                    const statusConfig = STATUS_CONFIG_KEYS[delegation.status];
                    return (
                      <tr key={delegation.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{delegation.delegateeName}</td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(delegation.startDate), 'yyyy.MM.dd')} ~{' '}
                          {format(new Date(delegation.endDate), 'yyyy.MM.dd')}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {delegation.reason}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={statusConfig.variant}
                            label={t(statusConfig.key)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('delegationPage.createDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('delegationPage.createDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="delegatee">{t('delegationPage.delegateeLabel')}</Label>
              <Select
                value={formData.delegateeId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, delegateeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('delegationPage.delegateePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.departmentName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">{t('delegationPage.startDateLabel')}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">{t('delegationPage.endDateLabel')}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">{t('delegationPage.reasonLabel')}</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder={t('delegationPage.reasonPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                !formData.delegateeId ||
                !formData.startDate ||
                !formData.endDate ||
                !formData.reason ||
                createMutation.isPending
              }
            >
              {createMutation.isPending ? t('delegationPage.submitting') : t('delegationPage.submitButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!cancelTargetId}
        onOpenChange={(open) => !open && setCancelTargetId(null)}
        title={t('delegationPage.cancelConfirmTitle')}
        description={t('delegationPage.cancelConfirmDesc')}
        variant="destructive"
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
