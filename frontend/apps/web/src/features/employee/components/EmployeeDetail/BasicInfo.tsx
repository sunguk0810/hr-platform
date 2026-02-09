import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

const createBasicInfoSchema = (t: TFunction) =>
  z.object({
    employeeNumber: z.string().min(1, t('basicInfo.employeeNumberRequired')),
    name: z.string().min(1, t('basicInfo.nameRequired')),
    nameEn: z.string().optional(),
    email: z.string().email(t('basicInfo.emailRequired')),
    mobile: z.string().min(1, t('basicInfo.mobileRequired')),
    birthDate: z.date().optional(),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    nationalIdNumber: z.string().optional(),
    address: z.string().optional(),
    detailAddress: z.string().optional(),
    zipCode: z.string().optional(),
  });

type BasicInfoFormData = z.infer<ReturnType<typeof createBasicInfoSchema>>;

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
  const { t } = useTranslation('employee');
  const basicInfoSchema = React.useMemo(() => createBasicInfoSchema(t), [t]);

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
          <CardTitle className="text-lg">{t('basicInfo.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem label={t('employeeNumber')} value={data?.employeeNumber} />
            <InfoItem label={t('name')} value={data?.name} />
            <InfoItem label={t('basicInfo.nameEn')} value={data?.nameEn} />
            <InfoItem label={t('email')} value={data?.email} />
            <InfoItem
              label={t('phone')}
              value={data?.mobile}
              masked
              maskType="phone"
            />
            <InfoItem
              label={t('basicInfo.birthDate')}
              value={data?.birthDate ? format(data.birthDate, 'yyyy-MM-dd') : undefined}
            />
            <InfoItem
              label={t('gender.label')}
              value={data?.gender === 'MALE' ? t('gender.male') : data?.gender === 'FEMALE' ? t('gender.female') : undefined}
            />
            <InfoItem
              label={t('basicInfo.nationalIdNumber')}
              value={data?.nationalIdNumber}
              masked
              maskType="ssn"
            />
            <InfoItem label={t('basicInfo.zipCode')} value={data?.zipCode} className="sm:col-span-2" />
            <InfoItem
              label={t('basicInfo.address')}
              value={data?.address}
              className="sm:col-span-2"
            />
            <InfoItem
              label={t('basicInfo.detailAddress')}
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
        <CardTitle className="text-lg">{t('basicInfo.title')}</CardTitle>
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
                    <FormLabel>{t('accountInfo.employeeNumber')} *</FormLabel>
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
                    <FormLabel>{t('basicInfo.nameLabel')}</FormLabel>
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
                    <FormLabel>{t('basicInfo.nameEnLabel')}</FormLabel>
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
                    <FormLabel>{t('basicInfo.emailLabel')}</FormLabel>
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
                    <FormLabel>{t('basicInfo.mobileLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('basicInfo.mobilePlaceholder')} />
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
                    <FormLabel>{t('basicInfo.birthDate')}</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('basicInfo.birthDatePlaceholder')}
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
                    <FormLabel>{t('gender.label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('gender.selectPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">{t('gender.male')}</SelectItem>
                        <SelectItem value="FEMALE">{t('gender.female')}</SelectItem>
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
                    <FormLabel>{t('basicInfo.nationalIdNumber')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('basicInfo.nationalIdPlaceholder')} />
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
                    <FormLabel>{t('basicInfo.zipCode')}</FormLabel>
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
                    <FormLabel>{t('basicInfo.address')}</FormLabel>
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
                    <FormLabel>{t('basicInfo.detailAddress')}</FormLabel>
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
                {isLoading ? t('common.saving') : t('common.save')}
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
