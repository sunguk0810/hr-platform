import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, X } from 'lucide-react';
import { ProfileImageUpload } from './ProfileImageUpload';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, Gender, DepartmentTreeNode } from '@hr-platform/shared-types';

const createEmployeeSchema = (t: TFunction) =>
  z.object({
    employeeNumber: z.string().optional(),
    name: z.string().min(1, t('form.nameRequired')).max(50, t('form.nameMaxLength')),
    nameEn: z.string().max(100, t('form.nameEnMaxLength')).optional(),
    email: z.string().email(t('form.emailRequired')),
    mobile: z.string().regex(/^010-?\d{4}-?\d{4}$/, t('form.mobileInvalid')).optional().or(z.literal('')),
    birthDate: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    hireDate: z.string().min(1, t('form.hireDateRequired')),
    departmentId: z.string().min(1, t('form.departmentRequired')),
    positionId: z.string().optional(),
    gradeId: z.string().optional(),
  });

type EmployeeFormData = z.infer<ReturnType<typeof createEmployeeSchema>>;

export interface EmployeeFormProps {
  employee?: Employee;
  departments: DepartmentTreeNode[];
  grades?: { id: string; name: string }[];
  positions?: { id: string; name: string }[];
  onSubmit: (data: CreateEmployeeRequest | UpdateEmployeeRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  autoGenerateEmployeeNumber?: boolean;
}

export function EmployeeForm({
  employee,
  departments,
  grades = [],
  positions = [],
  onSubmit,
  onCancel,
  isLoading = false,
  autoGenerateEmployeeNumber = true,
}: EmployeeFormProps) {
  const { t } = useTranslation('employee');
  const [, setProfileImage] = React.useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = React.useState<string | undefined>(
    employee?.profileImageUrl
  );
  const [useAutoNumber, setUseAutoNumber] = React.useState(autoGenerateEmployeeNumber && !employee);

  const isEditMode = !!employee;

  const employeeSchema = React.useMemo(() => createEmployeeSchema(t), [t]);

  const methods = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeNumber: employee?.employeeNumber || '',
      name: employee?.name || '',
      nameEn: employee?.nameEn || '',
      email: employee?.email || '',
      mobile: employee?.mobile || '',
      birthDate: employee?.birthDate || '',
      gender: employee?.gender,
      hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
      departmentId: employee?.departmentId || '',
      positionId: employee?.positionCode || '',
      gradeId: employee?.gradeCode || '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  // Flatten department tree
  const flattenTree = (
    nodes: DepartmentTreeNode[],
    result: { id: string; name: string; level: number }[] = []
  ): { id: string; name: string; level: number }[] => {
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, level: node.level });
      if (node.children) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };

  const flatDepartments = flattenTree(departments);

  const handleFormSubmit = async (data: EmployeeFormData) => {
    const submitData: CreateEmployeeRequest | UpdateEmployeeRequest = {
      ...data,
      employeeNumber: useAutoNumber ? undefined : data.employeeNumber,
      mobile: data.mobile || undefined,
      birthDate: data.birthDate || undefined,
      gender: data.gender || undefined,
      positionId: data.positionId || undefined,
      gradeId: data.gradeId || undefined,
    };

    await onSubmit(submitData);
  };

  const handleProfileImageChange = (file: File | undefined) => {
    if (file) {
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setProfileImageUrl(url);
    } else {
      setProfileImage(null);
      setProfileImageUrl(undefined);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('basicInfo.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-start gap-6">
              <ProfileImageUpload
                value={profileImageUrl}
                onChange={handleProfileImageChange}
              />
              <div className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('createPage.profileUploadDescription')}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('basicInfo.nameLabel')}</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="홍길동"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn">{t('basicInfo.nameEn')}</Label>
                <Input
                  id="nameEn"
                  {...register('nameEn')}
                  placeholder="Gil-dong Hong"
                />
                {errors.nameEn && (
                  <p className="text-sm text-destructive">{errors.nameEn.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('basicInfo.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="hong@example.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">{t('basicInfo.mobile')}</Label>
                <Input
                  id="mobile"
                  {...register('mobile')}
                  placeholder="010-1234-5678"
                  className={errors.mobile ? 'border-destructive' : ''}
                />
                {errors.mobile && (
                  <p className="text-sm text-destructive">{errors.mobile.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">{t('basicInfo.birthDate')}</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register('birthDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">{t('gender.label')}</Label>
                <Select
                  value={watch('gender') || ''}
                  onValueChange={(value) => setValue('gender', value as Gender)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">{t('gender.male')}</SelectItem>
                    <SelectItem value="FEMALE">{t('gender.female')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('organizationInfo.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="departmentId">{t('organizationInfo.department')}</Label>
                <Select
                  value={watch('departmentId')}
                  onValueChange={(value) => setValue('departmentId', value)}
                >
                  <SelectTrigger className={errors.departmentId ? 'border-destructive' : ''}>
                    <SelectValue placeholder={t('organizationInfo.departmentPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {flatDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {'\u3000'.repeat(Math.max(0, dept.level - 1))}
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentId && (
                  <p className="text-sm text-destructive">{errors.departmentId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeId">{t('organizationInfo.grade')}</Label>
                <Select
                  value={watch('gradeId') || ''}
                  onValueChange={(value) => setValue('gradeId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('organizationInfo.gradePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="positionId">{t('organizationInfo.position')}</Label>
                <Select
                  value={watch('positionId') || ''}
                  onValueChange={(value) => setValue('positionId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('organizationInfo.positionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">{t('organizationInfo.hireDate')}</Label>
                <Input
                  id="hireDate"
                  type="date"
                  {...register('hireDate')}
                  className={errors.hireDate ? 'border-destructive' : ''}
                />
                {errors.hireDate && (
                  <p className="text-sm text-destructive">{errors.hireDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        {!isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle>{t('accountInfo.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="employeeNumber">{t('accountInfo.employeeNumber')}</Label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={useAutoNumber}
                        onChange={(e) => setUseAutoNumber(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      {t('accountInfo.autoGenerate')}
                    </label>
                  </div>
                  <Input
                    id="employeeNumber"
                    {...register('employeeNumber')}
                    placeholder={useAutoNumber ? t('accountInfo.autoGeneratedPlaceholder') : 'EMP2024001'}
                    disabled={useAutoNumber}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('accountInfo.initialPassword')}</Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('accountInfo.initialPasswordDescription')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? t('common.saving') : t('common.registering')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? t('common.save') : t('common.register')}
              </>
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
