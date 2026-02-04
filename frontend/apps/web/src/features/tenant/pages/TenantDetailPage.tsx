import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { TenantStatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  ArrowLeft,
  Pencil,
  Loader2,
  Users,
  Building2,
  Shield,
  Building,
  ArrowDown,
  History,
} from 'lucide-react';
import {
  useTenant,
  useUpdateTenant,
  useChangeTenantStatus,
  useSubsidiaries,
  useUpdatePolicy,
  useToggleFeature,
  useUpdateBranding,
  useUploadBrandingImage,
  useInheritPolicies,
  useUpdateModules,
  usePolicyHistory,
  useUpdateHierarchy,
} from '../hooks/useTenants';
import { PolicySettings } from '../components/PolicySettings';
import { LeavePolicySettings } from '../components/LeavePolicySettings';
import { AttendancePolicySettings } from '../components/AttendancePolicySettings';
import { ApprovalPolicySettings } from '../components/ApprovalPolicySettings';
import { HierarchySettings } from '../components/HierarchySettings';
import { BrandingSettings } from '../components/BrandingSettings';
import { FeatureToggleList } from '../components/FeatureToggleList';
import { PolicyInheritDialog } from '../components/PolicyInheritDialog';
import { ModuleSettings } from '../components/ModuleSettings';
import { PolicyHistory } from '../components/PolicyHistory';
import type {
  TenantStatus,
  UpdateTenantRequest,
  PolicyType,
  FeatureCode,
  FeatureConfigMap,
  TenantBranding,
  LeavePolicy,
  AttendancePolicy,
  ApprovalPolicy,
  OrganizationLevel,
} from '@hr-platform/shared-types';
import { TENANT_STATUS_LABELS } from '@hr-platform/shared-types';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isInheritDialogOpen, setIsInheritDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TenantStatus>('ACTIVE');
  const [historyPolicyFilter, setHistoryPolicyFilter] = useState<PolicyType | ''>('');

  const [formData, setFormData] = useState<UpdateTenantRequest>({
    name: '',
    nameEn: '',
    description: '',
  });

  const { data, isLoading, isError } = useTenant(id || '');
  const { data: subsidiariesData } = useSubsidiaries(id || '');
  const { data: policyHistoryData, isLoading: isHistoryLoading } = usePolicyHistory(
    id || '',
    historyPolicyFilter || undefined
  );
  const updateMutation = useUpdateTenant();
  const changeStatusMutation = useChangeTenantStatus();
  const updatePolicyMutation = useUpdatePolicy();
  const toggleFeatureMutation = useToggleFeature();
  const updateBrandingMutation = useUpdateBranding();
  const uploadBrandingImageMutation = useUploadBrandingImage();
  const inheritPoliciesMutation = useInheritPolicies();
  const updateModulesMutation = useUpdateModules();
  const updateHierarchyMutation = useUpdateHierarchy();

  const tenant = data?.data;
  const subsidiaries = subsidiariesData?.data ?? [];
  const policyHistory = policyHistoryData?.data ?? [];
  const isGroup = tenant?.level === 0;
  const hasSubsidiaries = subsidiaries.length > 0;

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

  const handlePolicySubmit = async (policyType: PolicyType, data: unknown) => {
    if (!id) return;
    await updatePolicyMutation.mutateAsync({
      id,
      policyType,
      data: data as Parameters<typeof updatePolicyMutation.mutateAsync>[0]['data'],
    });
  };

  const handleFeatureToggle = async (
    code: FeatureCode,
    enabled: boolean,
    config?: FeatureConfigMap[FeatureCode]
  ) => {
    if (!id) return;
    await toggleFeatureMutation.mutateAsync({
      id,
      code,
      data: { enabled, config: config as unknown as Record<string, unknown> },
    });
  };

  const handleBrandingSubmit = async (data: TenantBranding) => {
    if (!id) return;
    await updateBrandingMutation.mutateAsync({ id, data });
  };

  const handleUploadBrandingImage = async (
    file: File,
    type: 'logo' | 'favicon' | 'background'
  ): Promise<string> => {
    if (!id) throw new Error('Tenant ID is required');
    const result = await uploadBrandingImageMutation.mutateAsync({ id, type, file });
    return result.data?.url || '';
  };

  const handleInheritPolicies = async (childIds: string[], policyTypes: PolicyType[]) => {
    if (!id) return;
    await inheritPoliciesMutation.mutateAsync({
      parentId: id,
      data: { childIds, policyTypes },
    });
  };

  const handleModulesUpdate = async (modules: string[]) => {
    if (!id) return;
    await updateModulesMutation.mutateAsync({ id, modules });
  };

  const handleLeavePolicySubmit = async (data: LeavePolicy) => {
    if (!id) return;
    await updatePolicyMutation.mutateAsync({
      id,
      policyType: 'LEAVE',
      data: data as Parameters<typeof updatePolicyMutation.mutateAsync>[0]['data'],
    });
  };

  const handleAttendancePolicySubmit = async (data: AttendancePolicy) => {
    if (!id) return;
    await updatePolicyMutation.mutateAsync({
      id,
      policyType: 'ATTENDANCE',
      data: data as Parameters<typeof updatePolicyMutation.mutateAsync>[0]['data'],
    });
  };

  const handleApprovalPolicySubmit = async (data: ApprovalPolicy) => {
    if (!id) return;
    await updatePolicyMutation.mutateAsync({
      id,
      policyType: 'APPROVAL',
      data: data as Parameters<typeof updatePolicyMutation.mutateAsync>[0]['data'],
    });
  };

  const handleHierarchyUpdate = async (levels: OrganizationLevel[]) => {
    if (!id) return;
    await updateHierarchyMutation.mutateAsync({ id, data: { levels } });
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
        description={`테넌트 코드: ${tenant.code}${tenant.parentName ? ` | 소속: ${tenant.parentName}` : ''}`}
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
        <TabsList className="mb-4">
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="hierarchy">조직 계층</TabsTrigger>
          <TabsTrigger value="policies">정책 설정</TabsTrigger>
          <TabsTrigger value="features">기능 관리</TabsTrigger>
          <TabsTrigger value="branding">브랜딩</TabsTrigger>
          <TabsTrigger value="modules">모듈 설정</TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 h-4 w-4" />
            변경 이력
          </TabsTrigger>
          {isGroup && <TabsTrigger value="subsidiaries">계열사</TabsTrigger>}
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
                {tenant.parentName && (
                  <div className="grid gap-1">
                    <Label className="text-muted-foreground">소속 그룹사</Label>
                    <p>{tenant.parentName}</p>
                  </div>
                )}
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

        <TabsContent value="hierarchy" className="mt-6">
          <HierarchySettings
            levels={tenant.hierarchy?.levels}
            onSave={handleHierarchyUpdate}
            isLoading={updateHierarchyMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="policies" className="mt-6">
          <Tabs defaultValue="leave" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="leave">휴가</TabsTrigger>
              <TabsTrigger value="attendance">근태</TabsTrigger>
              <TabsTrigger value="approval">결재</TabsTrigger>
              <TabsTrigger value="password">비밀번호</TabsTrigger>
              <TabsTrigger value="security">보안</TabsTrigger>
              <TabsTrigger value="notification">알림</TabsTrigger>
              <TabsTrigger value="organization">조직</TabsTrigger>
            </TabsList>

            <TabsContent value="leave">
              <LeavePolicySettings
                initialData={tenant.policies.leavePolicy}
                onSubmit={handleLeavePolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="attendance">
              <AttendancePolicySettings
                initialData={tenant.policies.attendancePolicy}
                onSubmit={handleAttendancePolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="approval">
              <ApprovalPolicySettings
                initialData={tenant.policies.approvalPolicy}
                onSubmit={handleApprovalPolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="password">
              <PolicySettings
                initialData={{ passwordPolicy: tenant.policies.passwordPolicy }}
                onSubmit={handlePolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="security">
              <PolicySettings
                initialData={{ securityPolicy: tenant.policies.securityPolicy }}
                onSubmit={handlePolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="notification">
              <PolicySettings
                initialData={{ notificationPolicy: tenant.policies.notificationPolicy }}
                onSubmit={handlePolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="organization">
              <PolicySettings
                initialData={{ organizationPolicy: tenant.policies.organizationPolicy }}
                onSubmit={handlePolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <FeatureToggleList
            features={tenant.features}
            onToggle={handleFeatureToggle}
            isLoading={toggleFeatureMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingSettings
            initialData={tenant.branding}
            onSubmit={handleBrandingSubmit}
            onUploadImage={handleUploadBrandingImage}
            isLoading={updateBrandingMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <ModuleSettings
            enabledModules={tenant.policies.allowedModules}
            onSave={handleModulesUpdate}
            isLoading={updateModulesMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <PolicyHistory
            history={policyHistory}
            isLoading={isHistoryLoading}
            selectedPolicyType={historyPolicyFilter}
            onFilterChange={setHistoryPolicyFilter}
          />
        </TabsContent>

        {isGroup && (
          <TabsContent value="subsidiaries" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>계열사 목록</CardTitle>
                  <CardDescription>
                    {tenant.name}에 소속된 계열사 {subsidiaries.length}개
                  </CardDescription>
                </div>
                {hasSubsidiaries && (
                  <Button
                    variant="outline"
                    onClick={() => setIsInheritDialogOpen(true)}
                  >
                    <ArrowDown className="mr-2 h-4 w-4" />
                    정책 상속
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {subsidiaries.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    소속된 계열사가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subsidiaries.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => navigate(`/admin/tenants/${sub.id}`)}
                        className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">{sub.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-muted-foreground">
                            <Users className="inline-block mr-1 h-4 w-4" />
                            {sub.employeeCount}명
                          </div>
                          <TenantStatusBadge status={sub.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
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

      {/* Policy Inherit Dialog */}
      <PolicyInheritDialog
        open={isInheritDialogOpen}
        onOpenChange={setIsInheritDialogOpen}
        parentName={tenant.name}
        subsidiaries={subsidiaries}
        onSubmit={handleInheritPolicies}
        isLoading={inheritPoliciesMutation.isPending}
      />
    </>
  );
}
