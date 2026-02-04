import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormRow } from '@/components/common/Form';
import { Loader2, KeyRound } from 'lucide-react';
import type { PasswordPolicy } from '@hr-platform/shared-types';

const passwordPolicySchema = z.object({
  minLength: z.number().min(6, '최소 6자 이상').max(32, '최대 32자 이하'),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSpecialChar: z.boolean(),
  expiryDays: z.number().min(0, '0 이상').max(365, '365일 이하'),
  historyCount: z.number().min(0, '0 이상').max(24, '24개 이하'),
});

export interface PasswordPolicySettingsProps {
  initialData?: Partial<PasswordPolicy>;
  onSubmit?: (data: PasswordPolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
  expiryDays: 90,
  historyCount: 3,
};

export function PasswordPolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: PasswordPolicySettingsProps) {
  const methods = useForm<PasswordPolicy>({
    resolver: zodResolver(passwordPolicySchema),
    defaultValues: { ...defaultPasswordPolicy, ...initialData },
  });

  const { register, watch, setValue, handleSubmit } = methods;

  const handleFormSubmit = async (data: PasswordPolicy) => {
    await onSubmit?.(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              비밀번호 정책
            </CardTitle>
            <CardDescription>비밀번호 복잡도 및 만료 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={2}>
              <div className="space-y-2">
                <Label>최소 길이</Label>
                <Input
                  type="number"
                  {...register('minLength', { valueAsNumber: true })}
                  disabled={readOnly}
                  min={6}
                  max={32}
                />
                <p className="text-xs text-muted-foreground">6~32자</p>
              </div>
              <div className="space-y-2">
                <Label>비밀번호 만료 (일)</Label>
                <Input
                  type="number"
                  {...register('expiryDays', { valueAsNumber: true })}
                  disabled={readOnly}
                  min={0}
                  max={365}
                />
                <p className="text-xs text-muted-foreground">0일이면 만료 없음</p>
              </div>
            </FormRow>

            <div className="space-y-2">
              <Label>재사용 금지 개수</Label>
              <Input
                type="number"
                {...register('historyCount', { valueAsNumber: true })}
                disabled={readOnly}
                min={0}
                max={24}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                최근 N개의 비밀번호는 재사용 불가 (0이면 제한 없음)
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-base">비밀번호 복잡도 요구사항</Label>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>대문자 포함</Label>
                  <p className="text-sm text-muted-foreground">A-Z 중 하나 이상</p>
                </div>
                <Switch
                  checked={watch('requireUppercase')}
                  onCheckedChange={(checked) => setValue('requireUppercase', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>소문자 포함</Label>
                  <p className="text-sm text-muted-foreground">a-z 중 하나 이상</p>
                </div>
                <Switch
                  checked={watch('requireLowercase')}
                  onCheckedChange={(checked) => setValue('requireLowercase', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>숫자 포함</Label>
                  <p className="text-sm text-muted-foreground">0-9 중 하나 이상</p>
                </div>
                <Switch
                  checked={watch('requireNumber')}
                  onCheckedChange={(checked) => setValue('requireNumber', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>특수문자 포함</Label>
                  <p className="text-sm text-muted-foreground">!@#$%^&* 등 하나 이상</p>
                </div>
                <Switch
                  checked={watch('requireSpecialChar')}
                  onCheckedChange={(checked) => setValue('requireSpecialChar', checked)}
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
