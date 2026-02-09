import { useState } from 'react';
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
        title: '정책 추가 완료',
        description: '경조비 정책이 성공적으로 추가되었습니다.',
      });
    } catch (error) {
      toast({
        title: '정책 추가 실패',
        description: '경조비 정책 추가 중 오류가 발생했습니다.',
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
        title: '정책 수정 완료',
        description: '경조비 정책이 성공적으로 수정되었습니다.',
      });
    } catch (error) {
      toast({
        title: '정책 수정 실패',
        description: '경조비 정책 수정 중 오류가 발생했습니다.',
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
        title: '정책 삭제 완료',
        description: '경조비 정책이 성공적으로 삭제되었습니다.',
      });
    } catch (error) {
      toast({
        title: '정책 삭제 실패',
        description: '경조비 정책 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  return (
    <>
      <PageHeader
        title="경조비 정책 관리"
        description="경조비 지급 정책을 설정하고 관리합니다."
        actions={
          <Button onClick={handleCreateOpen}>
            <Plus className="mr-2 h-4 w-4" />
            정책 추가
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            경조비 정책 목록
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
              <p className="font-medium">등록된 정책이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                새 정책을 추가하여 경조비 지급 기준을 설정하세요.
              </p>
              <Button className="mt-4" onClick={handleCreateOpen}>
                <Plus className="mr-2 h-4 w-4" />
                정책 추가
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        경조 유형
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        지급 금액
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        경조휴가
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        설명
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
                          {policy.leaveDays}일
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {policy.description}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                            {policy.isActive ? '활성' : '비활성'}
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
                총 {policies.length}개 정책
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정책 추가</DialogTitle>
            <DialogDescription>
              새로운 경조비 정책을 추가합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eventType">경조 유형 *</Label>
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
              <Label htmlFor="amount">지급 금액 (원) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="10000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))
                }
                placeholder="예: 200000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="leaveDays">경조휴가 (일) *</Label>
              <Input
                id="leaveDays"
                type="number"
                min="0"
                value={formData.leaveDays}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, leaveDays: parseInt(e.target.value) || 0 }))
                }
                placeholder="예: 5"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명 *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="예: 본인 결혼"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">활성 상태</Label>
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
              취소
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.description || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정책 수정</DialogTitle>
            <DialogDescription>
              경조비 정책 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-eventType">경조 유형 *</Label>
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
              <Label htmlFor="edit-amount">지급 금액 (원) *</Label>
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
              <Label htmlFor="edit-leaveDays">경조휴가 (일) *</Label>
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
              <Label htmlFor="edit-description">설명 *</Label>
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
              <Label htmlFor="edit-isActive">활성 상태</Label>
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
              취소
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.description || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정책 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 정책을 삭제하시겠습니까?
              <br />
              <strong className="text-foreground">
                {selectedPolicy && CONDOLENCE_TYPE_LABELS[selectedPolicy.eventType]}
              </strong>{' '}
              ({selectedPolicy && formatAmount(selectedPolicy.amount)})
              <br />
              <span className="text-destructive">
                이 작업은 되돌릴 수 없습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
