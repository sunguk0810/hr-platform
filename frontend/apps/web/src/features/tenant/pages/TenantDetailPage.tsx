import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { TenantStatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Pencil, Loader2, Users, Building2, Shield } from 'lucide-react';
import {
  useTenant,
  useUpdateTenant,
  useChangeTenantStatus,
} from '../hooks/useTenants';
import type { TenantStatus, UpdateTenantRequest } from '@hr-platform/shared-types';
import { TENANT_STATUS_LABELS, TENANT_MODULES } from '@hr-platform/shared-types';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TenantStatus>('ACTIVE');

  const [formData, setFormData] = useState<UpdateTenantRequest>({
    name: '',
    nameEn: '',
    description: '',
  });

  const { data, isLoading, isError } = useTenant(id || '');
  const updateMutation = useUpdateTenant();
  const changeStatusMutation = useChangeTenantStatus();

  const tenant = data?.data;

  const handleEditOpen = () => {
    if (!tenant) return;
    setFormData({
      name: tenant.name,
      nameEn: tenant.nameEn || '',
      description: tenant.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleStatusOpen = () => {
    if (!tenant) return;
    setNewStatus(tenant.status);
    setIsStatusDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleStatusChange = async () => {
    if (!id) return;
    try {
      await changeStatusMutation.mutateAsync({ id, status: newStatus });
      setIsStatusDialogOpen(false);
    } catch (error) {
      console.error('Status change failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">테넌트를 찾을 수 없습니다.</p>
        <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={tenant.name}
        description={`테넌트 코드: ${tenant.code}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
            <Button variant="outline" onClick={handleStatusOpen}>
              상태 변경
            </Button>
            <Button onClick={handleEditOpen}>
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">상태</p>
                <TenantStatusBadge status={tenant.status} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">직원 수</p>
                <p className="text-xl font-bold">{tenant.employeeCount}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">부서 수</p>
                <p className="text-xl font-bold">{tenant.departmentCount}개</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">최대 인원</p>
                <p className="text-xl font-bold">{tenant.policies.maxEmployees}명</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="policies">정책 설정</TabsTrigger>
          <TabsTrigger value="modules">모듈 설정</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">테넌트코드</Label>
                  <p className="font-mono">{tenant.code}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">테넌트명</Label>
                  <p>{tenant.name}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">영문명</Label>
                  <p>{tenant.nameEn || '-'}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">설명</Label>
                  <p>{tenant.description || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>관리자 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">관리자명</Label>
                  <p>{tenant.adminName || '-'}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">관리자 이메일</Label>
                  <p>{tenant.adminEmail || '-'}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">등록일</Label>
                  <p>{format(new Date(tenant.createdAt), 'yyyy년 M월 d일', { locale: ko })}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">계약 기간</Label>
                  <p>
                    {tenant.contractStartDate && tenant.contractEndDate
                      ? `${format(new Date(tenant.contractStartDate), 'yyyy.M.d')} ~ ${format(new Date(tenant.contractEndDate), 'yyyy.M.d')}`
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="policies" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>휴가 정책</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">기본 연차</span>
                  <span className="text-sm">{tenant.policies.leavePolicy.annualLeaveBaseDays}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">연차 증가분</span>
                  <span className="text-sm">연 {tenant.policies.leavePolicy.annualLeaveIncrement}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">최대 연차</span>
                  <span className="text-sm">{tenant.policies.leavePolicy.maxAnnualLeave}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">병가</span>
                  <span className="text-sm">{tenant.policies.leavePolicy.sickLeaveDays}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">이월 가능</span>
                  <span className="text-sm">
                    {tenant.policies.leavePolicy.carryOverEnabled ? '예' : '아니오'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>근태 정책</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">출근 시간</span>
                  <span className="text-sm">{tenant.policies.attendancePolicy.workStartTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">퇴근 시간</span>
                  <span className="text-sm">{tenant.policies.attendancePolicy.workEndTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">지각 유예</span>
                  <span className="text-sm">{tenant.policies.attendancePolicy.lateGraceMinutes}분</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">필수 근무시간</span>
                  <span className="text-sm">{tenant.policies.attendancePolicy.requiredWorkHours}시간</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">초과근무 허용</span>
                  <span className="text-sm">
                    {tenant.policies.attendancePolicy.overtimeEnabled ? '예' : '아니오'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>결재 정책</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">최대 결재단계</span>
                  <span className="text-sm">{tenant.policies.approvalPolicy.maxApprovalSteps}단계</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">자동승인</span>
                  <span className="text-sm">
                    {tenant.policies.approvalPolicy.autoApprovalEnabled ? '예' : '아니오'}
                  </span>
                </div>
                {tenant.policies.approvalPolicy.autoApprovalEnabled && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">자동승인 기간</span>
                    <span className="text-sm">{tenant.policies.approvalPolicy.autoApprovalDays}일</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">병렬결재</span>
                  <span className="text-sm">
                    {tenant.policies.approvalPolicy.parallelApprovalEnabled ? '예' : '아니오'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>사용 가능 모듈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {TENANT_MODULES.map((module) => {
                  const isEnabled = tenant.policies.allowedModules.includes(module.code);
                  return (
                    <div
                      key={module.code}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-muted'
                      }`}
                    >
                      <div
                        className={`h-3 w-3 rounded-full ${
                          isEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className={`text-sm ${isEnabled ? 'font-medium' : 'text-muted-foreground'}`}>
                        {module.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>테넌트 수정</DialogTitle>
            <DialogDescription>
              테넌트 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">테넌트명 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nameEn">영문명</Label>
              <Input
                id="edit-nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">설명</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || updateMutation.isPending}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상태 변경</DialogTitle>
            <DialogDescription>
              테넌트 상태를 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>상태</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as TenantStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TENANT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={changeStatusMutation.isPending}
            >
              {changeStatusMutation.isPending ? '변경 중...' : '변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
