import { useState } from 'react';
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
import { format, addDays } from 'date-fns';
import { useDelegations, useCreateDelegation, useCancelDelegation, useEmployeeSearch } from '../hooks/useApprovals';
import type { DelegationStatus, CreateDelegationRequest } from '@hr-platform/shared-types';

const STATUS_CONFIG: Record<DelegationStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'error' }> = {
  ACTIVE: { label: '활성', variant: 'success' },
  EXPIRED: { label: '만료', variant: 'default' },
  CANCELLED: { label: '취소', variant: 'error' },
};

export default function DelegationPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  const handleCancel = async (id: string) => {
    if (confirm('결재 위임을 취소하시겠습니까?')) {
      try {
        await cancelMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to cancel delegation:', error);
      }
    }
  };

  return (
    <>
      <PageHeader
        title="결재 위임"
        description="부재 시 결재 권한을 다른 사람에게 위임합니다."
        actions={
          !activeDelegation && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              위임 설정
            </Button>
          )
        }
      />

      {/* Current Delegation Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            현재 위임 상태
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
                    <p className="font-medium">{activeDelegation.delegateeName}님에게 위임 중</p>
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
                  위임 취소
                </Button>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">위임 사유: </span>
                {activeDelegation.reason}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-medium">활성화된 위임이 없습니다</p>
                <p className="text-sm text-muted-foreground">
                  부재 시 결재를 위임하려면 위임 설정을 해주세요.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delegation History */}
      <Card>
        <CardHeader>
          <CardTitle>위임 이력</CardTitle>
          <CardDescription>과거 결재 위임 내역입니다.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : delegations.length === 0 ? (
            <EmptyState
              icon={Users}
              title="위임 이력이 없습니다"
              description="결재 위임을 설정하면 이력이 표시됩니다."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      위임 대상
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      기간
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      사유
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {delegations.map((delegation) => {
                    const statusConfig = STATUS_CONFIG[delegation.status];
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
                            label={statusConfig.label}
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
            <DialogTitle>결재 위임 설정</DialogTitle>
            <DialogDescription>
              부재 중 결재를 처리할 대리인을 지정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="delegatee">위임 대상 *</Label>
              <Select
                value={formData.delegateeId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, delegateeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="직원 선택" />
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
                <Label htmlFor="startDate">시작일 *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">종료일 *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">위임 사유 *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="예: 연차 휴가, 출장 등"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
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
              {createMutation.isPending ? '설정 중...' : '위임 설정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
