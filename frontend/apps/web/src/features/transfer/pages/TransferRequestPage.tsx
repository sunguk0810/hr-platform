import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeftRight, Save, Send, Loader2, Search, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  useCreateTransfer,
  useSubmitTransfer,
  useAvailableTenants,
  useTenantDepartments,
  useTenantPositions,
  useTenantGrades,
} from '../hooks/useTransfer';
import { useEmployeeSearch } from '@/features/approval/hooks/useApprovals';
import type { TransferType, CreateTransferRequest } from '@hr-platform/shared-types';
import { TRANSFER_TYPE_LABELS } from '@hr-platform/shared-types';

const createTransferSchema = (t: TFunction) => z.object({
  type: z.enum(['TRANSFER_OUT', 'TRANSFER_IN', 'SECONDMENT'] as const),
  employeeId: z.string().min(1, t('requestValidation.employeeRequired')),
  targetTenantId: z.string().min(1, t('requestValidation.tenantRequired')),
  targetDepartmentId: z.string().optional(),
  targetPositionId: z.string().optional(),
  targetGradeId: z.string().optional(),
  transferDate: z.string().min(1, t('requestValidation.effectiveDateRequired')),
  returnDate: z.string().optional(),
  reason: z.string().min(1, t('requestValidation.reasonRequired')).max(500),
  remarks: z.string().max(1000).optional(),
  handoverItems: z.string().max(2000).optional(),
});

type TransferFormData = z.infer<ReturnType<typeof createTransferSchema>>;

export default function TransferRequestPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation('transfer');

  const transferSchema = useMemo(() => createTransferSchema(t), [t]);

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
    departmentName: string;
  } | null>(null);

  const { data: employeeResults } = useEmployeeSearch(employeeSearch);
  const { data: tenantsData } = useAvailableTenants();

  const createMutation = useCreateTransfer();
  const submitMutation = useSubmitTransfer();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      type: 'TRANSFER_OUT',
      employeeId: '',
      targetTenantId: '',
      transferDate: '',
      reason: '',
    },
  });

  const selectedType = watch('type');
  const selectedTenantId = watch('targetTenantId');

  // Load tenant-specific data when target tenant is selected
  const { data: departmentsData } = useTenantDepartments(selectedTenantId || '');
  const { data: positionsData } = useTenantPositions(selectedTenantId || '');
  const { data: gradesData } = useTenantGrades(selectedTenantId || '');

  const tenants = tenantsData?.data ?? [];
  const departments = departmentsData?.data ?? [];
  const positions = positionsData?.data ?? [];
  const grades = gradesData?.data ?? [];

  const handleEmployeeSelect = (employee: { id: string; name: string; departmentName: string }) => {
    setSelectedEmployee(employee);
    setValue('employeeId', employee.id);
    setEmployeeSearch('');
  };

  const onSubmit = async (data: TransferFormData, isDraft: boolean) => {
    try {
      const request: CreateTransferRequest = {
        type: data.type,
        employeeId: data.employeeId,
        targetTenantId: data.targetTenantId,
        targetDepartmentId: data.targetDepartmentId || undefined,
        targetPositionId: data.targetPositionId || undefined,
        targetGradeId: data.targetGradeId || undefined,
        transferDate: data.transferDate,
        returnDate: data.returnDate || undefined,
        reason: data.reason,
        remarks: data.remarks || undefined,
        handoverItems: data.handoverItems || undefined,
      };

      const result = await createMutation.mutateAsync(request);

      if (!isDraft && result.data?.id) {
        await submitMutation.mutateAsync(result.data.id);
        toast({
          title: t('requestToast.submitSuccess'),
          description: t('requestToast.submitSuccessDesc'),
        });
      } else {
        toast({
          title: t('requestToast.draftSuccess'),
          description: t('requestToast.draftSuccessDesc'),
        });
      }

      navigate('/transfer');
    } catch {
      toast({
        title: isDraft ? t('requestToast.draftFailed') : t('requestToast.submitFailed'),
        description: t('requestToast.failedDesc'),
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending || submitMutation.isPending;

  // Mobile Layout
  if (isMobile) {
    return (
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 pb-28">
        {/* Mobile Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/transfer')}
            className="p-2 -ml-2 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{t('requestPage.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('requestPage.subtitle')}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* 기본 정보 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              {t('requestForm.basicInfo')}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-type">{t('requestForm.transferType')}</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-type">
                      <SelectValue placeholder={t('requestForm.typeSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(TRANSFER_TYPE_LABELS) as [TransferType, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('requestForm.targetEmployee')}</Label>
              {selectedEmployee ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{selectedEmployee.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedEmployee.departmentName}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(null);
                      setValue('employeeId', '');
                    }}
                  >
                    {t('requestForm.changeEmployee')}
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('requestForm.searchPlaceholder')}
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-9"
                  />
                  {employeeSearch.length >= 2 && employeeResults?.data && employeeResults.data.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-auto">
                      {employeeResults.data.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => handleEmployeeSelect(employee)}
                          className="w-full text-left px-3 py-2 hover:bg-muted"
                        >
                          <p className="font-medium text-sm">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.departmentName}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.employeeId && (
                <p className="text-sm text-destructive">{errors.employeeId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-transferDate">{t('requestForm.effectiveDate')}</Label>
              <Input
                id="mobile-transferDate"
                type="date"
                {...register('transferDate')}
              />
              {errors.transferDate && (
                <p className="text-sm text-destructive">{errors.transferDate.message}</p>
              )}
            </div>

            {selectedType === 'SECONDMENT' && (
              <div className="space-y-2">
                <Label htmlFor="mobile-returnDate">{t('requestForm.returnDate')}</Label>
                <Input
                  id="mobile-returnDate"
                  type="date"
                  {...register('returnDate')}
                />
              </div>
            )}
          </div>

          {/* 전입처 정보 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium">{t('requestForm.inboundInfo')}</h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-targetTenantId">{t('requestForm.inboundTenant')}</Label>
              <Controller
                name="targetTenantId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="mobile-targetTenantId">
                      <SelectValue placeholder={t('requestForm.tenantSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.targetTenantId && (
                <p className="text-sm text-destructive">{errors.targetTenantId.message}</p>
              )}
            </div>

            {selectedTenantId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mobile-targetDepartmentId">{t('requestForm.inboundDepartment')}</Label>
                  <Controller
                    name="targetDepartmentId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger id="mobile-targetDepartmentId">
                          <SelectValue placeholder={t('requestForm.departmentSelect')} />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile-targetPositionId">{t('requestForm.position')}</Label>
                    <Controller
                      name="targetPositionId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger id="mobile-targetPositionId">
                            <SelectValue placeholder={t('requestForm.positionSelect')} />
                          </SelectTrigger>
                          <SelectContent>
                            {positions.map((pos) => (
                              <SelectItem key={pos.id} value={pos.id}>
                                {pos.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile-targetGradeId">{t('requestForm.grade')}</Label>
                    <Controller
                      name="targetGradeId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger id="mobile-targetGradeId">
                            <SelectValue placeholder={t('requestForm.gradeSelect')} />
                          </SelectTrigger>
                          <SelectContent>
                            {grades.map((grade) => (
                              <SelectItem key={grade.id} value={grade.id}>
                                {grade.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 이동 사유 섹션 */}
          <div className="bg-card rounded-xl border p-4 space-y-4">
            <h3 className="text-sm font-medium">{t('requestForm.reasonSection')}</h3>

            <div className="space-y-2">
              <Label htmlFor="mobile-reason">{t('requestForm.reason')}</Label>
              <Textarea
                id="mobile-reason"
                {...register('reason')}
                placeholder={t('requestForm.reasonPlaceholder')}
                rows={3}
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-handoverItems">{t('requestForm.handoverItems')}</Label>
              <Textarea
                id="mobile-handoverItems"
                {...register('handoverItems')}
                placeholder={t('requestForm.handoverPlaceholder')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile-remarks">{t('requestForm.remarks')}</Label>
              <Textarea
                id="mobile-remarks"
                {...register('remarks')}
                placeholder={t('requestForm.remarksPlaceholder')}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Fixed Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/transfer')}
              disabled={isPending}
              className="flex-1"
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              {t('buttons.saveDraft')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1 h-4 w-4" />
              )}
              {t('buttons.submit')}
            </Button>
          </div>
        </div>
      </form>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('requestPage.title')}
        description={t('requestPage.description')}
      />

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
                {t('requestForm.basicInfo')}
              </CardTitle>
              <CardDescription>{t('requestForm.basicInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t('requestForm.transferType')}</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder={t('requestForm.typeSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(TRANSFER_TYPE_LABELS) as [TransferType, string][]).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('requestForm.targetEmployee')}</Label>
                {selectedEmployee ? (
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{selectedEmployee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEmployee.departmentName}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(null);
                        setValue('employeeId', '');
                      }}
                    >
                      {t('requestForm.changeEmployee')}
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      placeholder={t('requestForm.searchPlaceholder')}
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="pl-9"
                      aria-label={t('requestForm.targetEmployee')}
                    />
                    {employeeSearch.length >= 2 &&
                      employeeResults?.data &&
                      employeeResults.data.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                          {employeeResults.data.map((employee) => (
                            <button
                              key={employee.id}
                              type="button"
                              onClick={() => handleEmployeeSelect(employee)}
                              className="w-full text-left px-3 py-2 hover:bg-muted"
                            >
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.departmentName}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                )}
                {errors.employeeId && (
                  <p className="text-sm text-destructive">{errors.employeeId.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transferDate">{t('requestForm.effectiveDate')}</Label>
                  <Input
                    id="transferDate"
                    type="date"
                    {...register('transferDate')}
                  />
                  {errors.transferDate && (
                    <p className="text-sm text-destructive">{errors.transferDate.message}</p>
                  )}
                </div>

                {selectedType === 'SECONDMENT' && (
                  <div className="space-y-2">
                    <Label htmlFor="returnDate">{t('requestForm.returnDate')}</Label>
                    <Input
                      id="returnDate"
                      type="date"
                      {...register('returnDate')}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Target Tenant */}
          <Card>
            <CardHeader>
              <CardTitle>{t('requestForm.inboundInfo')}</CardTitle>
              <CardDescription>{t('requestForm.inboundInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetTenantId">{t('requestForm.inboundTenant')}</Label>
                <Controller
                  name="targetTenantId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="targetTenantId">
                        <SelectValue placeholder={t('requestForm.tenantSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name} ({tenant.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.targetTenantId && (
                  <p className="text-sm text-destructive">{errors.targetTenantId.message}</p>
                )}
              </div>

              {selectedTenantId && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="targetDepartmentId">{t('requestForm.inboundDepartment')}</Label>
                    <Controller
                      name="targetDepartmentId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger id="targetDepartmentId">
                            <SelectValue placeholder={t('requestForm.departmentSelect')} />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="targetPositionId">{t('requestForm.position')}</Label>
                      <Controller
                        name="targetPositionId"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger id="targetPositionId">
                              <SelectValue placeholder={t('requestForm.positionSelect')} />
                            </SelectTrigger>
                            <SelectContent>
                              {positions.map((pos) => (
                                <SelectItem key={pos.id} value={pos.id}>
                                  {pos.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetGradeId">{t('requestForm.grade')}</Label>
                      <Controller
                        name="targetGradeId"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger id="targetGradeId">
                              <SelectValue placeholder={t('requestForm.gradeSelect')} />
                            </SelectTrigger>
                            <SelectContent>
                              {grades.map((grade) => (
                                <SelectItem key={grade.id} value={grade.id}>
                                  {grade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Reason & Handover */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('requestForm.reasonSection')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">{t('requestForm.reason')}</Label>
                <Textarea
                  id="reason"
                  {...register('reason')}
                  placeholder={t('requestForm.reasonPlaceholder')}
                  rows={3}
                />
                {errors.reason && (
                  <p className="text-sm text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="handoverItems">{t('requestForm.handoverItems')}</Label>
                <Textarea
                  id="handoverItems"
                  {...register('handoverItems')}
                  placeholder={t('requestForm.handoverPlaceholder')}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">{t('requestForm.remarks')}</Label>
                <Textarea
                  id="remarks"
                  {...register('remarks')}
                  placeholder={t('requestForm.remarksPlaceholder')}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/transfer')}
            disabled={isPending}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {t('buttons.saveDraft')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, false))}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {t('buttons.submit')}
          </Button>
        </div>
      </form>
    </>
  );
}
