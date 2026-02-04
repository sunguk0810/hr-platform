import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/common/Form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileUpload } from '@/components/common/FileUpload';
import { AlertCircle } from 'lucide-react';

const changeRequestSchema = z.object({
  changeType: z.string().min(1, '변경 구분을 선택하세요'),
  fieldName: z.string().min(1, '변경 항목을 선택하세요'),
  currentValue: z.string().optional(),
  newValue: z.string().min(1, '변경 후 값을 입력하세요'),
  reason: z.string().min(10, '변경 사유를 10자 이상 입력하세요'),
  attachments: z.array(z.any()).optional(),
});

type ChangeRequestFormData = z.infer<typeof changeRequestSchema>;

interface ChangeRequestFormProps {
  employeeId: string;
  employeeName: string;
  currentValues?: Record<string, string>;
  onSubmit: (data: ChangeRequestFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const changeTypeOptions = [
  { value: 'BASIC_INFO', label: '기본 정보 변경' },
  { value: 'CONTACT', label: '연락처 변경' },
  { value: 'ADDRESS', label: '주소 변경' },
  { value: 'BANK_ACCOUNT', label: '계좌 정보 변경' },
  { value: 'FAMILY', label: '가족 정보 변경' },
  { value: 'EDUCATION', label: '학력 변경' },
  { value: 'CERTIFICATE', label: '자격증 변경' },
  { value: 'OTHER', label: '기타' },
];

const fieldOptions: Record<string, { value: string; label: string }[]> = {
  BASIC_INFO: [
    { value: 'name', label: '이름' },
    { value: 'nameEn', label: '영문 이름' },
    { value: 'birthDate', label: '생년월일' },
  ],
  CONTACT: [
    { value: 'mobile', label: '휴대전화' },
    { value: 'email', label: '이메일' },
    { value: 'emergencyContact', label: '비상연락처' },
  ],
  ADDRESS: [
    { value: 'address', label: '주소' },
    { value: 'zipCode', label: '우편번호' },
  ],
  BANK_ACCOUNT: [
    { value: 'bankName', label: '은행명' },
    { value: 'accountNumber', label: '계좌번호' },
    { value: 'accountHolder', label: '예금주' },
  ],
  OTHER: [
    { value: 'other', label: '기타 항목' },
  ],
};

export function ChangeRequestForm({
  employeeName,
  currentValues = {},
  onSubmit,
  onCancel,
  isLoading,
}: ChangeRequestFormProps) {
  const form = useForm<ChangeRequestFormData>({
    resolver: zodResolver(changeRequestSchema),
    defaultValues: {
      changeType: '',
      fieldName: '',
      currentValue: '',
      newValue: '',
      reason: '',
      attachments: [],
    },
  });

  const selectedChangeType = form.watch('changeType');

  const availableFields = selectedChangeType
    ? fieldOptions[selectedChangeType] || fieldOptions.OTHER
    : [];

  const handleChangeTypeChange = (value: string) => {
    form.setValue('changeType', value);
    form.setValue('fieldName', '');
    form.setValue('currentValue', '');
  };

  const handleFieldChange = (value: string) => {
    form.setValue('fieldName', value);
    form.setValue('currentValue', currentValues[value] || '');
  };

  const handleSubmit = (values: ChangeRequestFormData) => {
    onSubmit(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>정보 변경 요청</CardTitle>
        <CardDescription>
          {employeeName}님의 인사 정보 변경을 요청합니다. 변경 요청은 담당자의
          승인 후 반영됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">변경 요청 안내</p>
                  <ul className="mt-1 list-inside list-disc space-y-1 text-amber-700 dark:text-amber-300">
                    <li>변경 요청은 결재 승인 후 반영됩니다.</li>
                    <li>증빙 서류가 필요한 경우 첨부해주세요.</li>
                    <li>긴급한 변경은 인사팀에 직접 문의하세요.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="changeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>변경 구분 *</FormLabel>
                    <Select
                      onValueChange={handleChangeTypeChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="변경 구분 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {changeTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fieldName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>변경 항목 *</FormLabel>
                    <Select
                      onValueChange={handleFieldChange}
                      value={field.value}
                      disabled={!selectedChangeType}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="변경 항목 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableFields.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>현재 값</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormDescription>자동으로 불러온 현재 값입니다.</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>변경 후 값 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="변경하려는 값 입력" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>변경 사유 *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="변경 사유를 상세히 입력해주세요."
                    />
                  </FormControl>
                  <FormDescription>
                    승인 검토를 위해 변경 사유를 상세히 작성해주세요.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>첨부 파일</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value || []}
                      onChange={field.onChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxFiles={5}
                      maxSize={10 * 1024 * 1024}
                    />
                  </FormControl>
                  <FormDescription>
                    증빙 서류가 필요한 경우 첨부해주세요. (PDF, JPG, PNG / 최대
                    10MB)
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  취소
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '제출 중...' : '변경 요청'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ChangeRequestForm;
