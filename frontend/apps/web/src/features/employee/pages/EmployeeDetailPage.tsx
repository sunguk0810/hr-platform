import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
        title: '삭제 완료',
        description: '직원 정보가 삭제되었습니다.',
      });
      navigate('/employees');
    } catch {
      toast({
        title: '삭제 실패',
        description: '직원 정보 삭제 중 오류가 발생했습니다.',
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
    return gender === 'MALE' ? '남성' : '여성';
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  const isResigned = employee?.employmentStatus === 'RESIGNED' || employee?.employmentStatus === 'RETIRED';

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
        title="직원 삭제"
        description={`정말로 "${employee?.name}" 직원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
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
          title="직원 상세"
          description="로딩 중..."
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          }
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
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
          title="직원 상세"
          description="직원 정보를 찾을 수 없습니다."
          actions={
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              목록으로
            </Button>
          }
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">요청한 직원 정보를 찾을 수 없습니다.</p>
            <Button variant="outline" onClick={() => navigate('/employees')} className="mt-4">
              목록으로 돌아가기
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
                  <h1 className="text-lg font-bold">직원 상세</h1>
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
                  <EmploymentStatusBadge status={employee.employmentStatus} />
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
                  <span className="text-xs">전화</span>
                </button>
                <button
                  onClick={() => window.location.href = `mailto:${employee.email}`}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card border"
                  disabled={!employee.email}
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">메일</span>
                </button>
                <button
                  onClick={() => navigate(`/employees/${id}/record-card`)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card border"
                >
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="text-xs">인사카드</span>
                </button>
                <button
                  onClick={() => setIsUnmaskDialogOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card border"
                >
                  <Eye className="h-5 w-5 text-orange-600" />
                  <span className="text-xs">열람</span>
                </button>
              </div>

              {/* Section Navigation */}
              <div className="space-y-2">
                <MobileSectionItem
                  icon={User}
                  label="기본 정보"
                  section="info"
                  description="연락처, 생년월일 등"
                />
                <MobileSectionItem
                  icon={Briefcase}
                  label="인사 정보"
                  section="hr"
                  description="부서, 직급, 입사일 등"
                />
                <MobileSectionItem
                  icon={Building2}
                  label="소속 정보"
                  section="positions"
                  description="겸직 현황"
                />
                <MobileSectionItem
                  icon={History}
                  label="변경 이력"
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
                      전출 요청
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => setIsResignationDialogOpen(true)}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      퇴직 처리
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
                <h1 className="text-lg font-bold">기본 정보</h1>
              </div>

              <div className="bg-card rounded-2xl border p-4">
                <MobileInfoRow
                  label="이메일"
                  value={employee.email ? <MaskedField value={employee.email} type="email" /> : '-'}
                />
                <MobileInfoRow
                  label="연락처"
                  value={employee.mobile ? <MaskedField value={employee.mobile} type="phone" /> : '-'}
                />
                {employee.phone && (
                  <MobileInfoRow
                    label="전화번호"
                    value={<MaskedField value={employee.phone} type="phone" />}
                  />
                )}
                <MobileInfoRow label="성별" value={formatGender(employee.gender)} />
                <MobileInfoRow label="생년월일" value={formatDate(employee.birthDate)} />
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
                <h1 className="text-lg font-bold">인사 정보</h1>
              </div>

              <div className="bg-card rounded-2xl border p-4">
                <MobileInfoRow label="부서" value={employee.departmentName} />
                <MobileInfoRow label="직급" value={employee.gradeName} />
                <MobileInfoRow label="직책" value={employee.positionName} />
                {employee.jobFamilyName && <MobileInfoRow label="직군" value={employee.jobFamilyName} />}
                <MobileInfoRow label="관리자" value={employee.managerName} />
                <MobileInfoRow
                  label="고용상태"
                  value={<EmploymentStatusBadge status={employee.employmentStatus} />}
                />
                {employee.employmentType && (
                  <MobileInfoRow
                    label="고용유형"
                    value={
                      {
                        REGULAR: '정규직',
                        CONTRACT: '계약직',
                        PARTTIME: '파트타임',
                        INTERN: '인턴',
                        DISPATCH: '파견직',
                      }[employee.employmentType]
                    }
                  />
                )}
                <MobileInfoRow label="입사일" value={formatDate(employee.hireDate)} />
                {employee.contractEndDate && (
                  <MobileInfoRow label="계약만료일" value={formatDate(employee.contractEndDate)} />
                )}
              </div>

              {employee.resignationDate && (
                <div className="bg-card rounded-2xl border p-4">
                  <p className="text-sm font-medium text-destructive mb-3">퇴직 정보</p>
                  <MobileInfoRow label="퇴직일" value={formatDate(employee.resignationDate)} />
                  {employee.resignationType && (
                    <MobileInfoRow
                      label="퇴직유형"
                      value={
                        {
                          VOLUNTARY: '자발적 퇴사',
                          DISMISSAL: '해고',
                          RETIREMENT: '정년퇴직',
                          CONTRACT_END: '계약만료',
                          TRANSFER: '전출',
                        }[employee.resignationType]
                      }
                    />
                  )}
                  {employee.resignationReason && (
                    <MobileInfoRow label="퇴직사유" value={employee.resignationReason} />
                  )}
                </div>
              )}

              {employee.workLocation && (
                <div className="bg-card rounded-2xl border p-4">
                  <MobileInfoRow label="근무지" value={employee.workLocation} />
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
                <h1 className="text-lg font-bold">소속 정보</h1>
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
                <h1 className="text-lg font-bold">변경 이력</h1>
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
              목록으로
            </Button>
            <PermissionGate
              roles={['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER']}
              permissions={['employee:write']}
            >
              <Button onClick={() => navigate(`/employees/${id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                수정
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
                  인사기록카드
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsUnmaskDialogOpen(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  개인정보 열람
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
                        전출 요청
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsResignationDialogOpen(true)}>
                        <LogOut className="mr-2 h-4 w-4" />
                        퇴직 처리
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem>비밀번호 초기화</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    삭제
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="positions">
            <Building2 className="mr-2 h-4 w-4" />
            소속 정보
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            변경 이력
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
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
                  <InfoRow label="이메일" value={employee.email ? <MaskedField value={employee.email} type="email" /> : '-'} />
                  <InfoRow label="연락처" value={employee.mobile ? <MaskedField value={employee.mobile} type="phone" /> : '-'} />
                  {employee.phone && <InfoRow label="전화번호" value={<MaskedField value={employee.phone} type="phone" />} />}
                  <InfoRow label="성별" value={formatGender(employee.gender)} />
                  <InfoRow label="생년월일" value={formatDate(employee.birthDate)} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>인사 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  <InfoRow label="부서" value={employee.departmentName} />
                  <InfoRow label="직급" value={employee.gradeName} />
                  <InfoRow label="직책" value={employee.positionName} />
                  {employee.jobFamilyName && <InfoRow label="직군" value={employee.jobFamilyName} />}
                  <InfoRow label="관리자" value={employee.managerName} />
                  <InfoRow
                    label="고용상태"
                    value={<EmploymentStatusBadge status={employee.employmentStatus} />}
                  />
                  {employee.employmentType && (
                    <InfoRow
                      label="고용유형"
                      value={
                        {
                          REGULAR: '정규직',
                          CONTRACT: '계약직',
                          PARTTIME: '파트타임',
                          INTERN: '인턴',
                          DISPATCH: '파견직',
                        }[employee.employmentType]
                      }
                    />
                  )}
                  <InfoRow label="입사일" value={formatDate(employee.hireDate)} />
                  {employee.contractEndDate && (
                    <InfoRow label="계약만료일" value={formatDate(employee.contractEndDate)} />
                  )}
                  {employee.resignationDate && (
                    <>
                      <Separator className="my-2" />
                      <InfoRow label="퇴직일" value={formatDate(employee.resignationDate)} />
                      {employee.resignationType && (
                        <InfoRow
                          label="퇴직유형"
                          value={
                            {
                              VOLUNTARY: '자발적 퇴사',
                              DISMISSAL: '해고',
                              RETIREMENT: '정년퇴직',
                              CONTRACT_END: '계약만료',
                              TRANSFER: '전출',
                            }[employee.resignationType]
                          }
                        />
                      )}
                      {employee.resignationReason && (
                        <InfoRow label="퇴직사유" value={employee.resignationReason} />
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
                <CardTitle>근무 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  <InfoRow label="근무지" value={employee.workLocation} />
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
