import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { EmploymentStatusBadge } from '@/components/common/StatusBadge';
import { SkeletonCard, SkeletonAvatar } from '@/components/common/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { MaskedField } from '@/components/common/MaskedField';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  FileText,
  ArrowRightLeft,
  Eye,
  History,
  LogOut,
  Building2,
  Mail,
  Phone,
  Briefcase,
  User,
  ChevronRight,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { PermissionGate } from '@/components/common/PermissionGate';
import { queryKeys } from '@/lib/queryClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmployee, useDeleteEmployee } from '../hooks/useEmployees';
import { useToast } from '@/hooks/useToast';
import { ResignationDialog } from '../components/ResignationDialog';
import { TransferDialog } from '../components/TransferDialog';
import { UnmaskDialog } from '../components/UnmaskDialog';
import { EmployeeHistory } from '../components/EmployeeHistory';
import { ConcurrentPositionList } from '../components/EmployeeDetail/ConcurrentPositionList';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex py-2 border-b last:border-b-0">
      <dt className="w-28 flex-shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || '-'}</dd>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useTranslation('employee');
  const { data, isLoading, isError, refetch } = useEmployee(id!);
  const deleteMutation = useDeleteEmployee();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResignationDialogOpen, setIsResignationDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isUnmaskDialogOpen, setIsUnmaskDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [mobileSection, setMobileSection] = useState<'list' | 'info' | 'hr' | 'positions' | 'history'>('list');

  const employee = data?.data;

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: t('toast.deleteComplete'),
        description: t('detailPage.deleteSuccess'),
      });
      navigate('/employees');
    } catch {
      toast({
        title: t('toast.deleteFailure'),
        description: t('detailPage.deleteFailure'),
        variant: 'destructive',
      });
    }
  };

  const handleResignationSuccess = () => {
    refetch();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatGender = (gender?: 'MALE' | 'FEMALE') => {
    if (!gender) return '-';
    return gender === 'MALE' ? t('gender.male') : t('gender.female');
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  const isResigned = employee?.status === 'RESIGNED' || employee?.status === 'RETIRED';

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(id!) });
  };

  // Dialogs render function (shared between mobile and desktop)
  const renderDialogs = () => (
    <>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t('detailPage.deleteTitle')}
        description={t('detailPage.deleteDescription', { name: employee?.name })}
        confirmLabel={t('common.delete')}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Resignation Dialog */}
      {employee && (
        <ResignationDialog
          open={isResignationDialogOpen}
          onOpenChange={setIsResignationDialogOpen}
          employee={employee}
          onSuccess={handleResignationSuccess}
        />
      )}

      {/* Transfer Dialog */}
      {employee && (
        <TransferDialog
          open={isTransferDialogOpen}
          onOpenChange={setIsTransferDialogOpen}
          employee={employee}
        />
      )}

      {/* Unmask Dialog */}
      {employee && (
        <UnmaskDialog
          open={isUnmaskDialogOpen}
          onOpenChange={setIsUnmaskDialogOpen}
          employee={employee}
        />
      )}
    </>
  );

  if (isLoading) {
    return (
      <>
        <PageHeader
          title={t('detailPage.title')}
          description={t('common.loading')}
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.backToList')}
            </Button>
          }
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('basicInfo.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <SkeletonAvatar className="h-20 w-20" />
                <SkeletonCard className="flex-1 border-0 p-0" />
              </div>
            </CardContent>
          </Card>
          <SkeletonCard />
        </div>
      </>
    );
  }

  if (isError || !employee) {
    return (
      <>
        <PageHeader
          title={t('detailPage.title')}
          description={t('detailPage.notFoundDescription')}
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.backToList')}
            </Button>
          }
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('detailPage.notFoundMessage')}</p>
            <Button variant="outline" onClick={() => navigate('/employees')} className="mt-4">
              {t('common.backToListLong')}
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // Mobile section components
  const MobileSectionItem = ({ icon: Icon, label, section, description }: {
    icon: React.ElementType;
    label: string;
    section: typeof mobileSection;
    description?: string;
  }) => (
    <button
      onClick={() => setMobileSection(section)}
      className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border active:bg-muted transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );

  const MobileInfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value || '-'}</span>
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="pb-20">
          {/* Mobile Section List */}
          {mobileSection === 'list' && (
            <div className="space-y-4">
              {/* Mobile Header */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-2 rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <h1 className="text-lg font-bold">{t('detailPage.title')}</h1>
                </div>
                <PermissionGate
                  roles={['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER']}
                  permissions={['employee:write']}
                >
                  <Button size="sm" onClick={() => navigate(`/employees/${id}/edit`)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </PermissionGate>
              </div>

              {/* Profile Card */}
              <div className="bg-card rounded-2xl border p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={employee.profileImageUrl} alt={employee.name} />
                  <AvatarFallback className="text-xl">{getInitials(employee.name)}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold mt-4">{employee.name}</h2>
                {employee.nameEn && (
                  <p className="text-sm text-muted-foreground">{employee.nameEn}</p>
                )}
                <p className="text-sm text-muted-foreground font-mono mt-1">{employee.employeeNumber}</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="text-sm">{employee.departmentName}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm">{employee.positionName || employee.gradeName}</span>
                </div>
                <div className="mt-3">
                  <EmploymentStatusBadge status={employee.status} />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => window.location.href = `tel:${employee.mobile}`}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card border"
                  disabled={!employee.mobile}
                >
                  <Phone className="h-5 w-5 text-green-600" />
                  <span className="text-xs">{t('detailPage.mobileQuickCall')}</span>
                </button>
                <button
                  onClick={() => window.location.href = `mailto:${employee.email}`}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card border"
                  disabled={!employee.email}
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">{t('detailPage.mobileQuickMail')}</span>
                </button>
                <button
                  onClick={() => navigate(`/employees/${id}/record-card`)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card border"
                >
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="text-xs">{t('detailPage.mobileQuickCard')}</span>
                </button>
                <button
                  onClick={() => setIsUnmaskDialogOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card border"
                >
                  <Eye className="h-5 w-5 text-orange-600" />
                  <span className="text-xs">{t('detailPage.mobileQuickView')}</span>
                </button>
              </div>

              {/* Section Navigation */}
              <div className="space-y-2">
                <MobileSectionItem
                  icon={User}
                  label={t('basicInfo.title')}
                  section="info"
                  description={t('detailPage.mobileBasicInfoDesc')}
                />
                <MobileSectionItem
                  icon={Briefcase}
                  label={t('detailPage.hrInfo')}
                  section="hr"
                  description={t('detailPage.mobileHrInfoDesc')}
                />
                <MobileSectionItem
                  icon={Building2}
                  label={t('detailPage.positionsInfo')}
                  section="positions"
                  description={t('detailPage.mobilePositionsDesc')}
                />
                <MobileSectionItem
                  icon={History}
                  label={t('detailPage.changeHistory')}
                  section="history"
                />
              </div>

              {/* Action Buttons */}
              <PermissionGate
                roles={['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER']}
                permissions={['employee:write']}
              >
                {!isResigned && (
                  <div className="space-y-2 pt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsTransferDialogOpen(true)}
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      {t('detailPage.transferRequest')}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => setIsResignationDialogOpen(true)}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('detailPage.resignationProcess')}
                    </Button>
                  </div>
                )}
              </PermissionGate>
            </div>
          )}

          {/* Mobile Info Section */}
          {mobileSection === 'info' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSection('list')}
                  className="p-2 -ml-2 rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-bold">{t('basicInfo.title')}</h1>
              </div>

              <div className="bg-card rounded-2xl border p-4">
                <MobileInfoRow
                  label={t('email')}
                  value={employee.email ? <MaskedField value={employee.email} type="email" /> : '-'}
                />
                <MobileInfoRow
                  label={t('phone')}
                  value={employee.mobile ? <MaskedField value={employee.mobile} type="phone" /> : '-'}
                />
                {employee.phone && (
                  <MobileInfoRow
                    label={t('basicInfo.phoneLabel')}
                    value={<MaskedField value={employee.phone} type="phone" />}
                  />
                )}
                <MobileInfoRow label={t('gender.label')} value={formatGender(employee.gender)} />
                <MobileInfoRow label={t('basicInfo.birthDate')} value={formatDate(employee.birthDate)} />
              </div>
            </div>
          )}

          {/* Mobile HR Section */}
          {mobileSection === 'hr' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSection('list')}
                  className="p-2 -ml-2 rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-bold">{t('detailPage.hrInfo')}</h1>
              </div>

              <div className="bg-card rounded-2xl border p-4">
                <MobileInfoRow label={t('department')} value={employee.departmentName} />
                <MobileInfoRow label={t('grade')} value={employee.gradeName} />
                <MobileInfoRow label={t('position')} value={employee.positionName} />
                {employee.jobFamilyName && <MobileInfoRow label={t('organizationInfo.jobFamily')} value={employee.jobFamilyName} />}
                <MobileInfoRow label={t('organizationInfo.manager')} value={employee.managerName} />
                <MobileInfoRow
                  label={t('organizationInfo.employmentStatus')}
                  value={<EmploymentStatusBadge status={employee.status} />}
                />
                {employee.employmentType && (
                  <MobileInfoRow
                    label={t('employmentType.label')}
                    value={t(`employmentType.${employee.employmentType}`)}
                  />
                )}
                <MobileInfoRow label={t('joinDate')} value={formatDate(employee.hireDate)} />
                {employee.contractEndDate && (
                  <MobileInfoRow label={t('organizationInfo.contractEndDate')} value={formatDate(employee.contractEndDate)} />
                )}
              </div>

              {employee.resignDate && (
                <div className="bg-card rounded-2xl border p-4">
                  <p className="text-sm font-medium text-destructive mb-3">{t('detailPage.resignationInfo')}</p>
                  <MobileInfoRow label={t('detailPage.resignDate')} value={formatDate(employee.resignDate)} />
                  {employee.resignationType && (
                    <MobileInfoRow
                      label={t('detailPage.resignType')}
                      value={t(`resignation.typeOptions.${employee.resignationType}`)}
                    />
                  )}
                  {employee.resignationReason && (
                    <MobileInfoRow label={t('detailPage.resignReason')} value={employee.resignationReason} />
                  )}
                </div>
              )}

              {employee.workLocation && (
                <div className="bg-card rounded-2xl border p-4">
                  <MobileInfoRow label={t('organizationInfo.workLocation')} value={employee.workLocation} />
                </div>
              )}
            </div>
          )}

          {/* Mobile Positions Section */}
          {mobileSection === 'positions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSection('list')}
                  className="p-2 -ml-2 rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-bold">{t('detailPage.positionsInfo')}</h1>
              </div>

              <ConcurrentPositionList
                employeeId={id!}
                employeeName={employee.name}
                editable={!isResigned}
              />
            </div>
          )}

          {/* Mobile History Section */}
          {mobileSection === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileSection('list')}
                  className="p-2 -ml-2 rounded-full hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-bold">{t('detailPage.changeHistory')}</h1>
              </div>

              <EmployeeHistory employeeId={id!} />
            </div>
          )}
        </div>

        {renderDialogs()}
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={employee.name}
        description={`${employee.departmentName} · ${employee.positionName || ''}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.backToList')}
            </Button>
            <PermissionGate
              roles={['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER']}
              permissions={['employee:write']}
            >
              <Button onClick={() => navigate(`/employees/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </Button>
            </PermissionGate>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/employees/${id}/record-card`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('detailPage.recordCard')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsUnmaskDialogOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('detailPage.privacyAccess')}
                </DropdownMenuItem>
                <PermissionGate
                  roles={['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER']}
                  permissions={['employee:write']}
                >
                  <DropdownMenuSeparator />
                  {!isResigned && (
                    <>
                      <DropdownMenuItem onClick={() => setIsTransferDialogOpen(true)}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        {t('detailPage.transferRequest')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsResignationDialogOpen(true)}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('detailPage.resignationProcess')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem>{t('detailPage.resetPassword')}</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    {t('common.delete')}
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">{t('basicInfo.title')}</TabsTrigger>
          <TabsTrigger value="positions">
            <Building2 className="mr-2 h-4 w-4" />
            {t('detailPage.positionsInfo')}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            {t('detailPage.changeHistory')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('basicInfo.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={employee.profileImageUrl} alt={employee.name} />
                    <AvatarFallback className="text-lg">{getInitials(employee.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{employee.name}</h3>
                    {employee.nameEn && (
                      <p className="text-sm text-muted-foreground">{employee.nameEn}</p>
                    )}
                    {employee.nameChinese && (
                      <p className="text-sm text-muted-foreground">{employee.nameChinese}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{employee.employeeNumber}</p>
                  </div>
                </div>
                <dl>
                  <InfoRow label={t('email')} value={employee.email ? <MaskedField value={employee.email} type="email" /> : '-'} />
                  <InfoRow label={t('phone')} value={employee.mobile ? <MaskedField value={employee.mobile} type="phone" /> : '-'} />
                  {employee.phone && <InfoRow label={t('basicInfo.phoneLabel')} value={<MaskedField value={employee.phone} type="phone" />} />}
                  <InfoRow label={t('gender.label')} value={formatGender(employee.gender)} />
                  <InfoRow label={t('basicInfo.birthDate')} value={formatDate(employee.birthDate)} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('detailPage.hrInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  <InfoRow label={t('department')} value={employee.departmentName} />
                  <InfoRow label={t('grade')} value={employee.gradeName} />
                  <InfoRow label={t('position')} value={employee.positionName} />
                  {employee.jobFamilyName && <InfoRow label={t('organizationInfo.jobFamily')} value={employee.jobFamilyName} />}
                  <InfoRow label={t('organizationInfo.manager')} value={employee.managerName} />
                  <InfoRow
                    label={t('organizationInfo.employmentStatus')}
                    value={<EmploymentStatusBadge status={employee.status} />}
                  />
                  {employee.employmentType && (
                    <InfoRow
                      label={t('employmentType.label')}
                      value={t(`employmentType.${employee.employmentType}`)}
                    />
                  )}
                  <InfoRow label={t('joinDate')} value={formatDate(employee.hireDate)} />
                  {employee.contractEndDate && (
                    <InfoRow label={t('organizationInfo.contractEndDate')} value={formatDate(employee.contractEndDate)} />
                  )}
                  {employee.resignDate && (
                    <>
                      <Separator className="my-2" />
                      <InfoRow label={t('detailPage.resignDate')} value={formatDate(employee.resignDate)} />
                      {employee.resignationType && (
                        <InfoRow
                          label={t('detailPage.resignType')}
                          value={t(`resignation.typeOptions.${employee.resignationType}`)}
                        />
                      )}
                      {employee.resignationReason && (
                        <InfoRow label={t('detailPage.resignReason')} value={employee.resignationReason} />
                      )}
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          {employee.workLocation && (
            <Card>
              <CardHeader>
                <CardTitle>{t('detailPage.workInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  <InfoRow label={t('organizationInfo.workLocation')} value={employee.workLocation} />
                </dl>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="positions">
          <ConcurrentPositionList
            employeeId={id!}
            employeeName={employee.name}
            editable={!isResigned}
          />
        </TabsContent>

        <TabsContent value="history">
          <EmployeeHistory employeeId={id!} />
        </TabsContent>
      </Tabs>

      {renderDialogs()}
    </>
  );
}
