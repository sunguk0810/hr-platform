import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FormRow } from '@/components/common/Form';
import { Loader2, Shield } from 'lucide-react';
import type { SecurityPolicy } from '@hr-platform/shared-types';

const securityPolicySchema = z.object({
  sessionTimeoutMinutes: z.number().min(5, '최소 5분').max(480, '최대 8시간'),
  maxLoginAttempts: z.number().min(3, '최소 3회').max(10, '최대 10회'),
  lockoutDurationMinutes: z.number().min(5, '최소 5분').max(1440, '최대 24시간'),
  mfaEnabled: z.boolean(),
  ipWhitelistEnabled: z.boolean(),
  allowedIps: z.array(z.string()).optional(),
});

export interface SecurityPolicySettingsProps {
  initialData?: Partial<SecurityPolicy>;
  onSubmit?: (data: SecurityPolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const defaultSecurityPolicy: SecurityPolicy = {
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  mfaEnabled: false,
  ipWhitelistEnabled: false,
  allowedIps: [],
};

export function SecurityPolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: SecurityPolicySettingsProps) {
  const methods = useForm<SecurityPolicy>({
    resolver: zodResolver(securityPolicySchema),
    defaultValues: { ...defaultSecurityPolicy, ...initialData },
  });

  const { register, watch, setValue, handleSubmit } = methods;
  const ipWhitelistEnabled = watch('ipWhitelistEnabled');

  const handleFormSubmit = async (data: SecurityPolicy) => {
    await onSubmit?.(data);
  };

  const handleIpChange = (value: string) => {
    const ips = value.split('\n').map(ip => ip.trim()).filter(Boolean);
    setValue('allowedIps', ips);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              보안 정책
            </CardTitle>
            <CardDescription>세션 및 로그인 보안 설정</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>세션 타임아웃 (분)</Label>
                <Input
                  type="number"
                  {...register('sessionTimeoutMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                  min={5}
                  max={480}
                />
                <p className="text-xs text-muted-foreground">5~480분</p>
              </div>
              <div className="space-y-2">
                <Label>최대 로그인 시도</Label>
                <Input
                  type="number"
                  {...register('maxLoginAttempts', { valueAsNumber: true })}
                  disabled={readOnly}
                  min={3}
                  max={10}
                />
                <p className="text-xs text-muted-foreground">3~10회</p>
              </div>
              <div className="space-y-2">
                <Label>계정 잠금 시간 (분)</Label>
                <Input
                  type="number"
                  {...register('lockoutDurationMinutes', { valueAsNumber: true })}
                  disabled={readOnly}
                  min={5}
                  max={1440}
                />
                <p className="text-xs text-muted-foreground">5~1440분</p>
              </div>
            </FormRow>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>2단계 인증 (MFA)</Label>
                  <p className="text-sm text-muted-foreground">
                    OTP 또는 인증 앱을 통한 2단계 인증 필수
                  </p>
                </div>
                <Switch
                  checked={watch('mfaEnabled')}
                  onCheckedChange={(checked) => setValue('mfaEnabled', checked)}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>IP 화이트리스트</Label>
                  <p className="text-sm text-muted-foreground">
                    허용된 IP 주소에서만 접속 가능
                  </p>
                </div>
                <Switch
                  checked={ipWhitelistEnabled}
                  onCheckedChange={(checked) => setValue('ipWhitelistEnabled', checked)}
                  disabled={readOnly}
                />
              </div>

              {ipWhitelistEnabled && (
                <div className="space-y-2 pl-4">
                  <Label>허용 IP 목록</Label>
                  <Textarea
                    placeholder="IP 주소 또는 CIDR (한 줄에 하나씩)&#10;예: 192.168.1.0/24&#10;    10.0.0.1"
                    value={watch('allowedIps')?.join('\n') || ''}
                    onChange={(e) => handleIpChange(e.target.value)}
                    disabled={readOnly}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    한 줄에 하나의 IP 주소 또는 CIDR 블록 입력
                  </p>
                </div>
              )}
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
