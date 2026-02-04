import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeftRight, Save, Send, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
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

const transferSchema = z.object({
  type: z.enum(['TRANSFER_OUT', 'TRANSFER_IN', 'SECONDMENT'] as const),
  employeeId: z.string().min(1, '대상 직원을 선택해주세요'),
  targetTenantId: z.string().min(1, '전입 테넌트를 선택해주세요'),
  targetDepartmentId: z.string().optional(),
  targetPositionId: z.string().optional(),
  targetGradeId: z.string().optional(),
  effectiveDate: z.string().min(1, '발령일을 입력해주세요'),
  returnDate: z.string().optional(),
  reason: z.string().min(1, '이동 사유를 입력해주세요').max(500),
  remarks: z.string().max(1000).optional(),
  handoverItems: z.string().max(2000).optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

export default function TransferRequestPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

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
      effectiveDate: '',
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
        effectiveDate: data.effectiveDate,
        returnDate: data.returnDate || undefined,
        reason: data.reason,
        remarks: data.remarks || undefined,
        handoverItems: data.handoverItems || undefined,
      };

      const result = await createMutation.mutateAsync(request);

      if (!isDraft && result.data?.id) {
        await submitMutation.mutateAsync(result.data.id);
        toast({
          title: '상신 완료',
          description: '인사이동 요청이 상신되었습니다.',
        });
      } else {
        toast({
          title: '임시저장 완료',
          description: '인사이동 요청이 임시저장되었습니다.',
        });
      }

      navigate('/transfer');
    } catch {
      toast({
        title: isDraft ? '저장 실패' : '상신 실패',
        description: '요청 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const isPending = createMutation.isPending || submitMutation.isPending;

  return (
    <>
      <PageHeader
        title="인사이동 요청"
        description="계열사 간 전출/전입 또는 파견을 요청합니다."
      />

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" aria-hidden="true" />
                기본 정보
              </CardTitle>
              <CardDescription>이동 유형과 대상 직원을 선택합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">이동 유형 *</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="유형 선택" />
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
                <Label>대상 직원 *</Label>
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
                      변경
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      placeholder="이름으로 검색..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="pl-9"
                      aria-label="대상 직원 검색"
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
                  <Label htmlFor="effectiveDate">발령일 *</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    {...register('effectiveDate')}
                  />
                  {errors.effectiveDate && (
                    <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>
                  )}
                </div>

                {selectedType === 'SECONDMENT' && (
                  <div className="space-y-2">
                    <Label htmlFor="returnDate">복귀 예정일</Label>
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
              <CardTitle>전입처 정보</CardTitle>
              <CardDescription>이동할 계열사와 소속을 선택합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetTenantId">전입 테넌트 *</Label>
                <Controller
                  name="targetTenantId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="targetTenantId">
                        <SelectValue placeholder="테넌트 선택" />
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
                    <Label htmlFor="targetDepartmentId">전입 부서</Label>
                    <Controller
                      name="targetDepartmentId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger id="targetDepartmentId">
                            <SelectValue placeholder="부서 선택 (선택사항)" />
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
                      <Label htmlFor="targetPositionId">직책</Label>
                      <Controller
                        name="targetPositionId"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger id="targetPositionId">
                              <SelectValue placeholder="직책 선택" />
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
                      <Label htmlFor="targetGradeId">직급</Label>
                      <Controller
                        name="targetGradeId"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || ''} onValueChange={field.onChange}>
                            <SelectTrigger id="targetGradeId">
                              <SelectValue placeholder="직급 선택" />
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
              <CardTitle>이동 사유 및 인수인계</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">이동 사유 *</Label>
                <Textarea
                  id="reason"
                  {...register('reason')}
                  placeholder="인사이동 사유를 입력하세요"
                  rows={3}
                />
                {errors.reason && (
                  <p className="text-sm text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="handoverItems">인수인계 항목</Label>
                <Textarea
                  id="handoverItems"
                  {...register('handoverItems')}
                  placeholder="인수인계가 필요한 업무 및 자료를 입력하세요"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">비고</Label>
                <Textarea
                  id="remarks"
                  {...register('remarks')}
                  placeholder="기타 참고사항을 입력하세요"
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
            취소
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
            임시저장
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
            상신
          </Button>
        </div>
      </form>
    </>
  );
}
