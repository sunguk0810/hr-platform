import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/common/Form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useCreatePrivacyAccessRequest } from '../hooks/useEmployees';
import type { Employee, PrivacyField } from '@hr-platform/shared-types';

const PRIVACY_FIELDS: { value: PrivacyField; label: string; description: string }[] = [
  { value: 'residentNumber', label: '주민등록번호', description: '전체 13자리' },
  { value: 'bankAccount', label: '계좌번호', description: '은행 및 계좌번호' },
  { value: 'address', label: '주소', description: '거주지 주소' },
  { value: 'mobile', label: '휴대전화', description: '개인 휴대전화번호' },
  { value: 'email', label: '이메일', description: '개인 이메일 주소' },
  { value: 'birthDate', label: '생년월일', description: '생년월일 정보' },
  { value: 'phone', label: '전화번호', description: '유선 전화번호' },
];

const privacyAccessRequestSchema = z.object({
  fields: z.array(z.string()).min(1, '열람할 개인정보 항목을 1개 이상 선택해주세요'),
  purpose: z.string().min(10, '열람 목적을 10자 이상 입력해주세요').max(500, '열람 목적은 500자 이하로 입력해주세요'),
});

type PrivacyAccessRequestFormData = z.infer<typeof privacyAccessRequestSchema>;

interface PrivacyAccessRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  onSuccess?: () => void;
}

export function PrivacyAccessRequestDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: PrivacyAccessRequestDialogProps) {
  const { toast } = useToast();
  const createMutation = useCreatePrivacyAccessRequest();

  const form = useForm<PrivacyAccessRequestFormData>({
    resolver: zodResolver(privacyAccessRequestSchema),
    defaultValues: {
      fields: [],
      purpose: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fields: [],
        purpose: '',
      });
    }
  }, [open, form]);

  const handleSubmit = async (values: PrivacyAccessRequestFormData) => {
    try {
      await createMutation.mutateAsync({
        targetEmployeeId: employee.id,
        fields: values.fields as PrivacyField[],
        purpose: values.purpose,
      });
      toast({
        title: '열람 요청 완료',
        description: '개인정보 열람 요청이 접수되었습니다. 승인 후 열람이 가능합니다.',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch {
      toast({
        title: '요청 실패',
        description: '개인정보 열람 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            개인정보 열람 요청
          </DialogTitle>
          <DialogDescription>
            {employee.name}({employee.employeeNumber}) 직원의 개인정보 열람을 요청합니다.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            개인정보 열람은 승인권자의 승인 후 가능합니다.
            열람 이력은 감사 로그에 기록됩니다.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fields"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>열람 항목 *</FormLabel>
                    <FormDescription>
                      열람이 필요한 개인정보 항목을 선택해주세요.
                    </FormDescription>
                  </div>
                  <div className="space-y-2">
                    {PRIVACY_FIELDS.map((field) => (
                      <FormField
                        key={field.value}
                        control={form.control}
                        name="fields"
                        render={({ field: formField }) => (
                          <FormItem
                            key={field.value}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                          >
                            <FormControl>
                              <Checkbox
                                checked={formField.value?.includes(field.value)}
                                onCheckedChange={(checked) => {
                                  const current = formField.value || [];
                                  if (checked) {
                                    formField.onChange([...current, field.value]);
                                  } else {
                                    formField.onChange(
                                      current.filter((v) => v !== field.value)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="flex-1 space-y-1 leading-none">
                              <FormLabel className="font-normal cursor-pointer">
                                {field.label}
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                {field.description}
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('fields').length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-sm text-muted-foreground">선택된 항목:</span>
                {form.watch('fields').map((fieldValue) => {
                  const field = PRIVACY_FIELDS.find((f) => f.value === fieldValue);
                  return (
                    <Badge key={fieldValue} variant="secondary">
                      {field?.label}
                    </Badge>
                  );
                })}
              </div>
            )}

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>열람 목적 *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="개인정보 열람이 필요한 구체적인 업무 목적을 입력해주세요.&#10;예: 급여 이체를 위한 계좌번호 확인"
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    열람 목적은 승인 심사 및 감사에 활용됩니다. (10자 이상)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? '요청 중...' : '열람 요청'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default PrivacyAccessRequestDialog;
