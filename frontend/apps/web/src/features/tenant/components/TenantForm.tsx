import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Building2 } from 'lucide-react';
import type { TenantDetail, CreateTenantRequest, UpdateTenantRequest, TenantModule, TenantListItem } from '@hr-platform/shared-types';

function createTenantSchema(t: TFunction) {
  return z.object({
    code: z.string()
      .min(2, t('validation.codeMin2'))
      .max(20, t('validation.codeMax20'))
      .regex(/^[A-Z0-9_]+$/, t('validation.codeFormat')),
    name: z.string()
      .min(1, t('validation.tenantNameRequired'))
      .max(100, t('validation.max100')),
    nameEn: z.string().max(100, t('validation.max100')).optional(),
    businessNumber: z.string()
      .regex(/^(\d{3}-\d{2}-\d{5})?$/, t('validation.businessNumberFormat'))
      .optional()
      .or(z.literal('')),
    description: z.string().max(500, t('validation.max500')).optional(),
    adminName: z.string().max(50, t('validation.max50')).optional(),
    adminEmail: z.string().email(t('validation.validEmail')).optional().or(z.literal('')),
    contractStartDate: z.string().optional(),
    contractEndDate: z.string().optional(),
    maxEmployees: z.number().min(1, t('validation.minEmployee1')).max(100000, t('validation.maxEmployee100000')),
  });
}

type TenantFormData = z.infer<ReturnType<typeof createTenantSchema>>;

export interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: TenantDetail;
  availableModules: TenantModule[];
  groupTenants?: TenantListItem[]; // 그룹사 목록 (계열사 생성 시 선택)
  onSubmit: (data: CreateTenantRequest | UpdateTenantRequest) => Promise<void>;
  isLoading?: boolean;
}

const DEFAULT_MODULES: TenantModule[] = ['EMPLOYEE', 'ORGANIZATION', 'ATTENDANCE', 'LEAVE', 'APPROVAL'];

export function TenantForm({
  open,
  onOpenChange,
  tenant,
  availableModules,
  groupTenants = [],
  onSubmit,
  isLoading = false,
}: TenantFormProps) {
  const { t } = useTranslation('tenant');
  const isEditMode = !!tenant;
  const [selectedModules, setSelectedModules] = React.useState<TenantModule[]>(
    (tenant?.policies?.allowedModules as TenantModule[] | undefined) || DEFAULT_MODULES
  );
  const [selectedParentId, setSelectedParentId] = React.useState<string | undefined>(
    tenant?.parentId
  );

  const tenantSchema = React.useMemo(() => createTenantSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      code: '',
      name: '',
      nameEn: '',
      businessNumber: '',
      description: '',
      adminName: '',
      adminEmail: '',
      contractStartDate: '',
      contractEndDate: '',
      maxEmployees: 100,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (tenant) {
        reset({
          code: tenant.code,
          name: tenant.name,
          nameEn: tenant.nameEn || '',
          businessNumber: tenant.businessNumber || '',
          description: tenant.description || '',
          adminName: tenant.adminName || '',
          adminEmail: tenant.adminEmail || '',
          contractStartDate: tenant.contractStartDate || '',
          contractEndDate: tenant.contractEndDate || '',
          maxEmployees: tenant.policies?.maxEmployees || 100,
        });
        setSelectedModules((tenant.policies?.allowedModules as TenantModule[] | undefined) || DEFAULT_MODULES);
        setSelectedParentId(tenant.parentId);
      } else {
        reset({
          code: '',
          name: '',
          nameEn: '',
          businessNumber: '',
          description: '',
          adminName: '',
          adminEmail: '',
          contractStartDate: '',
          contractEndDate: '',
          maxEmployees: 100,
        });
        setSelectedModules(DEFAULT_MODULES);
        setSelectedParentId(undefined);
      }
    }
  }, [open, tenant, reset]);

  const handleModuleToggle = (module: TenantModule) => {
    setSelectedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const handleFormSubmit = async (data: TenantFormData) => {
    if (isEditMode) {
      const updateData: UpdateTenantRequest = {
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateTenantRequest = {
        code: data.code,
        name: data.name,
        nameEn: data.nameEn || undefined,
        description: data.description || undefined,
        adminName: data.adminName!,
        adminEmail: data.adminEmail!,
        policies: {
          maxEmployees: data.maxEmployees,
          allowedModules: selectedModules,
        },
        parentId: selectedParentId,
      };
      await onSubmit(createData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('form.editFormTitle') : t('form.createFormTitle')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('form.editFormDescription') : t('form.createFormDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">{t('form.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 그룹사 선택 (생성 모드에서만) */}
              {!isEditMode && groupTenants.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('form.parentGroup')}
                  </Label>
                  <Select
                    value={selectedParentId || '_none'}
                    onValueChange={(value) => setSelectedParentId(value === '_none' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.parentGroupPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{t('form.independentTenant')}</SelectItem>
                      {groupTenants.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {selectedParentId
                      ? t('form.parentGroupHintSubsidiary')
                      : t('form.parentGroupHintIndependent')}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">{t('form.tenantCode')}</Label>
                  <Input
                    id="code"
                    {...register('code')}
                    placeholder="예: ACME_CORP"
                    disabled={isEditMode}
                    className={errors.code ? 'border-destructive' : ''}
                  />
                  {errors.code && (
                    <p className="text-sm text-destructive">{errors.code.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t('form.tenantName')}</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="예: ACME 주식회사"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t('form.englishName')}</Label>
                  <Input
                    id="nameEn"
                    {...register('nameEn')}
                    placeholder="예: ACME Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessNumber">{t('form.businessNumber')}</Label>
                  <Input
                    id="businessNumber"
                    {...register('businessNumber')}
                    placeholder="000-00-00000"
                    maxLength={12}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      let formatted = raw;
                      if (raw.length > 3 && raw.length <= 5) {
                        formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
                      } else if (raw.length > 5) {
                        formatted = `${raw.slice(0, 3)}-${raw.slice(3, 5)}-${raw.slice(5, 10)}`;
                      }
                      e.target.value = formatted;
                      register('businessNumber').onChange(e);
                    }}
                    className={errors.businessNumber ? 'border-destructive' : ''}
                  />
                  {errors.businessNumber && (
                    <p className="text-sm text-destructive">{errors.businessNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxEmployees">{t('form.maxEmployees')}</Label>
                  <Input
                    id="maxEmployees"
                    type="number"
                    {...register('maxEmployees', { valueAsNumber: true })}
                    min={1}
                    max={100000}
                    className={errors.maxEmployees ? 'border-destructive' : ''}
                  />
                  {errors.maxEmployees && (
                    <p className="text-sm text-destructive">{errors.maxEmployees.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('form.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder={t('form.descriptionPlaceholder')}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Admin Info */}
          {!isEditMode && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{t('form.adminInfo')}</CardTitle>
                <CardDescription>
                  {t('form.adminInfoDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">{t('form.adminName')}</Label>
                    <Input
                      id="adminName"
                      {...register('adminName')}
                      placeholder="예: 홍길동"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">{t('form.adminEmail')}</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      {...register('adminEmail')}
                      placeholder="예: admin@acme.com"
                      className={errors.adminEmail ? 'border-destructive' : ''}
                    />
                    {errors.adminEmail && (
                      <p className="text-sm text-destructive">{errors.adminEmail.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contract Info */}
          {!isEditMode && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{t('form.contractInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractStartDate">{t('form.contractStartDate')}</Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      {...register('contractStartDate')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">{t('form.contractEndDate')}</Label>
                    <Input
                      id="contractEndDate"
                      type="date"
                      {...register('contractEndDate')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modules */}
          {!isEditMode && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">{t('form.modules')}</CardTitle>
                <CardDescription>
                  {t('form.modulesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {availableModules.map((module) => (
                    <div
                      key={module}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`module-${module}`}
                        checked={selectedModules.includes(module)}
                        onCheckedChange={() => handleModuleToggle(module)}
                      />
                      <Label
                        htmlFor={`module-${module}`}
                        className="text-sm cursor-pointer"
                      >
                        {module}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.save')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
