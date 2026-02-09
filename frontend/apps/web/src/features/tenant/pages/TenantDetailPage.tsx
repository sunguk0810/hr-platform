import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { LeavePolicySettings } from '../components/LeavePolicySettings';
import { AttendancePolicySettings } from '../components/AttendancePolicySettings';
import { ApprovalPolicySettings } from '../components/ApprovalPolicySettings';
import { PasswordPolicySettings } from '../components/PasswordPolicySettings';
import { SecurityPolicySettings } from '../components/SecurityPolicySettings';
import { NotificationPolicySettings } from '../components/NotificationPolicySettings';
import { OrganizationPolicySettings } from '../components/OrganizationPolicySettings';
import { HierarchySettings } from '../components/HierarchySettings';
import { BrandingSettings } from '../components/BrandingSettings';
import { FeatureToggleList } from '../components/FeatureToggleList';
import { PolicyInheritDialog } from '../components/PolicyInheritDialog';
import { ModuleSettings } from '../components/ModuleSettings';
import { PolicyHistory } from '../components/PolicyHistory';
import { NotificationChannelSettings } from '@/features/settings/components/NotificationChannelSettings';
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
  PasswordPolicy,
  SecurityPolicy,
  NotificationPolicy,
  OrganizationPolicy,
  OrganizationLevel,
} from '@hr-platform/shared-types';
import { TENANT_STATUS_LABELS } from '@hr-platform/shared-types';

export default function TenantDetailPage() {
  const { t } = useTranslation('tenant');
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
    businessNumber: '',
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
      businessNumber: tenant.businessNumber || '',
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

  const handlePasswordPolicySubmit = async (data: PasswordPolicy) => {
    if (!id) return;
    await updatePolicyMutation.mutateAsync({
      id,
      policyType: 'PASSWORD',
      data: data as Parameters<typeof updatePolicyMutation.mutateAsync>[0]['data'],
    });
  };

  const handleSecurityPolicySubmit = async (data: SecurityPolicy) => {
    if (!id) return;
    await updatePolicyMutation.mutateAsync({
      id,
      policyType: 'SECURITY',
      data: data as Parameters<typeof updatePolicyMutation.mutateAsync>[0]['data'],
    });
  };

  const handleNotificationPolicySubmit = async (data: NotificationPolicy) => {
    if (!id) return;
    await updatePolicyMutation.mutateAsync({
      id,
      policyType: 'NOTIFICATION',
      data: data as Parameters<typeof updatePolicyMutation.mutateAsync>[0]['data'],
    });
  };

  const handleOrganizationPolicySubmit = async (data: OrganizationPolicy) => {
    if (!id) return;
    await updatePolicyMutation.mutateAsync({
      id,
      policyType: 'ORGANIZATION',
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
        <p className="text-muted-foreground">{t('detail.tenantNotFound')}</p>
        <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('detail.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={tenant.name}
        description={`${t('detail.tenantCodePrefix', { code: tenant.code })}${tenant.parentName ? ` | ${t('detail.belongsTo', { name: tenant.parentName })}` : ''}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('detail.backToList')}
            </Button>
            <Button variant="outline" onClick={handleStatusOpen}>
              {t('detail.changeStatus')}
            </Button>
            <Button onClick={handleEditOpen}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('detail.edit')}
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
                <p className="text-sm text-muted-foreground">{t('detail.summary.status')}</p>
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
                <p className="text-sm text-muted-foreground">{t('detail.summary.employeeCount')}</p>
                <p className="text-xl font-bold">{t('detail.summary.countSuffix', { count: tenant.employeeCount })}</p>
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
                <p className="text-sm text-muted-foreground">{t('detail.summary.departmentCount')}</p>
                <p className="text-xl font-bold">{t('detail.summary.departmentSuffix', { count: tenant.departmentCount })}</p>
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
                <p className="text-sm text-muted-foreground">{t('detail.summary.maxEmployees')}</p>
                <p className="text-xl font-bold">{t('detail.summary.countSuffix', { count: tenant.policies.maxEmployees })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info">
        <TabsList className="mb-4">
          <TabsTrigger value="info">{t('detail.tabs.info')}</TabsTrigger>
          <TabsTrigger value="hierarchy">{t('detail.tabs.hierarchy')}</TabsTrigger>
          <TabsTrigger value="policies">{t('detail.tabs.policies')}</TabsTrigger>
          <TabsTrigger value="features">{t('detail.tabs.features')}</TabsTrigger>
          <TabsTrigger value="branding">{t('detail.tabs.branding')}</TabsTrigger>
          <TabsTrigger value="modules">{t('detail.tabs.modules')}</TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-1 h-4 w-4" />
            {t('detail.tabs.history')}
          </TabsTrigger>
          {isGroup && <TabsTrigger value="subsidiaries">{t('detail.tabs.subsidiaries')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.basicInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">{t('detail.tenantCode')}</Label>
                  <p className="font-mono">{tenant.code}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">{t('detail.tenantName')}</Label>
                  <p>{tenant.name}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">{t('detail.englishName')}</Label>
                  <p>{tenant.nameEn || '-'}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">{t('detail.businessNumber')}</Label>
                  <p className="font-mono">{tenant.businessNumber || '-'}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">{t('detail.descriptionLabel')}</Label>
                  <p>{tenant.description || '-'}</p>
                </div>
                {tenant.parentName && (
                  <div className="grid gap-1">
                    <Label className="text-muted-foreground">{t('detail.parentGroup')}</Label>
                    <p>{tenant.parentName}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('detail.adminInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">{t('detail.adminName')}</Label>
                  <p>{tenant.adminName || '-'}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">{t('detail.adminEmail')}</Label>
                  <p>{tenant.adminEmail || '-'}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">{t('detail.registeredDate')}</Label>
                  <p>{format(new Date(tenant.createdAt), 'yyyy년 M월 d일', { locale: ko })}</p>
                </div>
                <div className="grid gap-1">
                  <Label className="text-muted-foreground">{t('detail.contractPeriod')}</Label>
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
              <TabsTrigger value="leave">{t('policyTabs.leave')}</TabsTrigger>
              <TabsTrigger value="attendance">{t('policyTabs.attendance')}</TabsTrigger>
              <TabsTrigger value="approval">{t('policyTabs.approval')}</TabsTrigger>
              <TabsTrigger value="password">{t('policyTabs.password')}</TabsTrigger>
              <TabsTrigger value="security">{t('policyTabs.security')}</TabsTrigger>
              <TabsTrigger value="notification">{t('policyTabs.notification')}</TabsTrigger>
              <TabsTrigger value="organization">{t('policyTabs.organization')}</TabsTrigger>
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
              <PasswordPolicySettings
                initialData={tenant.policies.passwordPolicy}
                onSubmit={handlePasswordPolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="security">
              <SecurityPolicySettings
                initialData={tenant.policies.securityPolicy}
                onSubmit={handleSecurityPolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="notification" className="space-y-6">
              <NotificationPolicySettings
                initialData={tenant.policies.notificationPolicy}
                onSubmit={handleNotificationPolicySubmit}
                isLoading={updatePolicyMutation.isPending}
              />
              <NotificationChannelSettings />
            </TabsContent>

            <TabsContent value="organization">
              <OrganizationPolicySettings
                initialData={tenant.policies.organizationPolicy}
                onSubmit={handleOrganizationPolicySubmit}
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
                  <CardTitle>{t('detail.subsidiaryList')}</CardTitle>
                  <CardDescription>
                    {t('detail.subsidiaryCount', { name: tenant.name, count: subsidiaries.length })}
                  </CardDescription>
                </div>
                {hasSubsidiaries && (
                  <Button
                    variant="outline"
                    onClick={() => setIsInheritDialogOpen(true)}
                  >
                    <ArrowDown className="mr-2 h-4 w-4" />
                    {t('detail.policyInherit')}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {subsidiaries.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {t('detail.noSubsidiaries')}
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
                            {t('tree.employeeCount', { count: sub.employeeCount })}
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
            <DialogTitle>{t('editDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('editDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('editDialog.tenantName')}</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nameEn">{t('editDialog.englishName')}</Label>
              <Input
                id="edit-nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-businessNumber">{t('editDialog.businessNumber')}</Label>
              <Input
                id="edit-businessNumber"
                placeholder="000-00-00000"
                value={formData.businessNumber}
                maxLength={12}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  let formatted = raw;
                  if (raw.length > 3 && raw.length <= 5) {
                    formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
                  } else if (raw.length > 5) {
                    formatted = `${raw.slice(0, 3)}-${raw.slice(3, 5)}-${raw.slice(5, 10)}`;
                  }
                  setFormData(prev => ({ ...prev, businessNumber: formatted }));
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t('form.businessNumberFormat')}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">{t('editDialog.descriptionLabel')}</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || updateMutation.isPending}
            >
              {updateMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('statusDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('statusDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('statusDialog.statusLabel')}</Label>
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
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={changeStatusMutation.isPending}
            >
              {changeStatusMutation.isPending ? t('statusDialog.changing') : t('statusDialog.change')}
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
