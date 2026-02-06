import * as React from 'react';
import { useForm } from 'react-hook-form';
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

const tenantSchema = z.object({
  code: z.string()
    .min(2, '코드는 2자 이상이어야 합니다.')
    .max(20, '코드는 20자 이내여야 합니다.')
    .regex(/^[A-Z0-9_]+$/, '영문 대문자, 숫자, 언더스코어만 사용 가능합니다.'),
  name: z.string()
    .min(1, '테넌트명을 입력해주세요.')
    .max(100, '100자 이내로 입력해주세요.'),
  nameEn: z.string().max(100, '100자 이내로 입력해주세요.').optional(),
  businessNumber: z.string()
    .regex(/^(\d{3}-\d{2}-\d{5})?$/, '사업자등록번호 형식이 올바르지 않습니다. (XXX-XX-XXXXX)')
    .optional()
    .or(z.literal('')),
  description: z.string().max(500, '500자 이내로 입력해주세요.').optional(),
  adminName: z.string().max(50, '50자 이내로 입력해주세요.').optional(),
  adminEmail: z.string().email('올바른 이메일을 입력해주세요.').optional().or(z.literal('')),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  maxEmployees: z.number().min(1, '최소 1명 이상이어야 합니다.').max(100000, '최대 100,000명까지 가능합니다.'),
});

type TenantFormData = z.infer<typeof tenantSchema>;

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
  const isEditMode = !!tenant;
  const [selectedModules, setSelectedModules] = React.useState<TenantModule[]>(
    (tenant?.policies?.allowedModules as TenantModule[] | undefined) || DEFAULT_MODULES
  );
  const [selectedParentId, setSelectedParentId] = React.useState<string | undefined>(
    tenant?.parentId
  );

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
          <DialogTitle>{isEditMode ? '테넌트 수정' : '테넌트 등록'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '테넌트 정보를 수정합니다.' : '새로운 테넌트를 등록합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 그룹사 선택 (생성 모드에서만) */}
              {!isEditMode && groupTenants.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    소속 그룹사
                  </Label>
                  <Select
                    value={selectedParentId || '_none'}
                    onValueChange={(value) => setSelectedParentId(value === '_none' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="그룹사 선택 (선택 안하면 독립 테넌트)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">독립 테넌트 (그룹사 없음)</SelectItem>
                      {groupTenants.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {selectedParentId
                      ? '계열사로 등록됩니다. 그룹사의 정책을 상속받을 수 있습니다.'
                      : '독립 테넌트(그룹사)로 등록됩니다.'}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">테넌트 코드 *</Label>
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
                  <Label htmlFor="name">테넌트명 *</Label>
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
                  <Label htmlFor="nameEn">영문명</Label>
                  <Input
                    id="nameEn"
                    {...register('nameEn')}
                    placeholder="예: ACME Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessNumber">사업자등록번호</Label>
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
                  <Label htmlFor="maxEmployees">최대 인원</Label>
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
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="테넌트에 대한 설명을 입력하세요."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Admin Info */}
          {!isEditMode && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">관리자 정보</CardTitle>
                <CardDescription>
                  테넌트 관리자의 정보를 입력합니다. 계정 생성 후 이메일이 발송됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">관리자명</Label>
                    <Input
                      id="adminName"
                      {...register('adminName')}
                      placeholder="예: 홍길동"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">관리자 이메일</Label>
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
                <CardTitle className="text-base">계약 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contractStartDate">계약 시작일</Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      {...register('contractStartDate')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">계약 종료일</Label>
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
                <CardTitle className="text-base">사용 모듈</CardTitle>
                <CardDescription>
                  테넌트에서 사용할 수 있는 모듈을 선택합니다.
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
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
