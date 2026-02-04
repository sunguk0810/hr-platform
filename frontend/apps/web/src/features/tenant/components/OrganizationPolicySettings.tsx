import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Building2 } from 'lucide-react';
import type { OrganizationPolicy } from '@hr-platform/shared-types';

const organizationPolicySchema = z.object({
  maxDepartmentLevel: z.number().min(1, '최소 1단계').max(10, '최대 10단계'),
  positionRequired: z.boolean(),
  gradeRequired: z.boolean(),
  allowMultipleDepartments: z.boolean(),
});

export interface OrganizationPolicySettingsProps {
  initialData?: Partial<OrganizationPolicy>;
  onSubmit?: (data: OrganizationPolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const defaultOrganizationPolicy: OrganizationPolicy = {
  maxDepartmentLevel: 5,
  positionRequired: true,
  gradeRequired: true,
  allowMultipleDepartments: false,
};

export function OrganizationPolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: OrganizationPolicySettingsProps) {
  const methods = useForm<OrganizationPolicy>({
    resolver: zodResolver(organizationPolicySchema),
    defaultValues: { ...defaultOrganizationPolicy, ...initialData },
  });

  const { register, watch, setValue, handleSubmit } = methods;

  const handleFormSubmit = async (data: OrganizationPolicy) => {
    await onSubmit?.(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              조직 정책
            </CardTitle>
            <CardDescription>조직 구조 및 인사 정보 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>최대 부서 단계</Label>
              <Input
                type="number"
                {...register('maxDepartmentLevel', { valueAsNumber: true })}
                disabled={readOnly}
                min={1}
                max={10}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                조직도 깊이 (1~10단계)
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base">인사 정보 필수 항목</Label>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>직책 필수</Label>
                  <p className="text-sm text-muted-foreground">
                    직원 등록 시 직책 입력 필수
                  </p>
                </div>
                <Switch
                  checked={watch('positionRequired')}
                  onCheckedChange={(checked) => setValue('positionRequired', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>직급 필수</Label>
                  <p className="text-sm text-muted-foreground">
                    직원 등록 시 직급 입력 필수
                  </p>
                </div>
                <Switch
                  checked={watch('gradeRequired')}
                  onCheckedChange={(checked) => setValue('gradeRequired', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>복수 부서 소속 허용</Label>
                  <p className="text-sm text-muted-foreground">
                    한 직원이 여러 부서에 소속될 수 있음
                  </p>
                </div>
                <Switch
                  checked={watch('allowMultipleDepartments')}
                  onCheckedChange={(checked) => setValue('allowMultipleDepartments', checked)}
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
