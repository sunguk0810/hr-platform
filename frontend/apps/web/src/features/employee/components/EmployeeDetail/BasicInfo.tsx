import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/Form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/common/DatePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaskedField } from '@/components/common/MaskedField';

const basicInfoSchema = z.object({
  employeeNumber: z.string().min(1, '사번은 필수입니다'),
  name: z.string().min(1, '이름은 필수입니다'),
  nameEn: z.string().optional(),
  email: z.string().email('올바른 이메일을 입력하세요'),
  mobile: z.string().min(1, '연락처는 필수입니다'),
  birthDate: z.date().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  nationalIdNumber: z.string().optional(),
  address: z.string().optional(),
  detailAddress: z.string().optional(),
  zipCode: z.string().optional(),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export interface EmployeeBasicInfo {
  employeeNumber: string;
  name: string;
  nameEn?: string;
  email: string;
  mobile: string;
  birthDate?: Date;
  gender?: 'MALE' | 'FEMALE';
  nationalIdNumber?: string;
  address?: string;
  detailAddress?: string;
  zipCode?: string;
}

interface BasicInfoProps {
  data?: EmployeeBasicInfo;
  editable?: boolean;
  onSave?: (data: BasicInfoFormData) => void;
  isLoading?: boolean;
}

export function BasicInfo({
  data,
  editable = false,
  onSave,
  isLoading,
}: BasicInfoProps) {
  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      employeeNumber: data?.employeeNumber || '',
      name: data?.name || '',
      nameEn: data?.nameEn || '',
      email: data?.email || '',
      mobile: data?.mobile || '',
      birthDate: data?.birthDate,
      gender: data?.gender,
      nationalIdNumber: data?.nationalIdNumber || '',
      address: data?.address || '',
      detailAddress: data?.detailAddress || '',
      zipCode: data?.zipCode || '',
    },
  });

  const handleSubmit = (values: BasicInfoFormData) => {
    onSave?.(values);
  };

  if (!editable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem label="사번" value={data?.employeeNumber} />
            <InfoItem label="이름" value={data?.name} />
            <InfoItem label="영문 이름" value={data?.nameEn} />
            <InfoItem label="이메일" value={data?.email} />
            <InfoItem
              label="연락처"
              value={data?.mobile}
              masked
              maskType="phone"
            />
            <InfoItem
              label="생년월일"
              value={data?.birthDate ? format(data.birthDate, 'yyyy-MM-dd') : undefined}
            />
            <InfoItem
              label="성별"
              value={data?.gender === 'MALE' ? '남성' : data?.gender === 'FEMALE' ? '여성' : undefined}
            />
            <InfoItem
              label="주민등록번호"
              value={data?.nationalIdNumber}
              masked
              maskType="ssn"
            />
            <InfoItem label="우편번호" value={data?.zipCode} className="sm:col-span-2" />
            <InfoItem
              label="주소"
              value={data?.address}
              className="sm:col-span-2"
            />
            <InfoItem
              label="상세주소"
              value={data?.detailAddress}
              className="sm:col-span-2"
            />
          </dl>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">기본 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="employeeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사번 *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름 *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>영문 이름</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일 *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>연락처 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="010-0000-0000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>생년월일</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="생년월일 선택"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>성별</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="성별 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">남성</SelectItem>
                        <SelectItem value="FEMALE">여성</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationalIdNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>주민등록번호</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="000000-0000000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>우편번호</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>주소</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="detailAddress"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>상세주소</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface InfoItemProps {
  label: string;
  value?: string | null;
  masked?: boolean;
  maskType?: 'phone' | 'ssn' | 'email' | 'name';
  className?: string;
}

function InfoItem({ label, value, masked, maskType, className }: InfoItemProps) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">
        {masked && value ? (
          <MaskedField value={value} maskType={maskType} />
        ) : (
          value || '-'
        )}
      </dd>
    </div>
  );
}

export default BasicInfo;
