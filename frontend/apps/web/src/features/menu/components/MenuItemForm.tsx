import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { MenuItemResponse, CreateMenuItemRequest, UpdateMenuItemRequest, MenuType } from '../types';
import { ROLES } from '@/stores/authStore';

const formSchema = z.object({
  code: z.string().min(1, '코드는 필수입니다').max(50),
  name: z.string().min(1, '이름은 필수입니다').max(100),
  nameEn: z.string().max(100).optional(),
  path: z.string().max(200).optional(),
  icon: z.string().max(50).optional(),
  menuType: z.enum(['INTERNAL', 'EXTERNAL', 'DIVIDER', 'HEADER']),
  externalUrl: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0),
  featureCode: z.string().max(50).optional(),
  showInNav: z.boolean(),
  showInMobile: z.boolean(),
  mobileSortOrder: z.number().int().min(0).optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface MenuItemFormProps {
  menu?: MenuItemResponse;
  parentMenu?: MenuItemResponse;
  onSubmit: (data: CreateMenuItemRequest | UpdateMenuItemRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const menuTypes: { value: MenuType; label: string }[] = [
  { value: 'INTERNAL', label: '내부 경로' },
  { value: 'EXTERNAL', label: '외부 링크' },
  { value: 'DIVIDER', label: '구분선' },
  { value: 'HEADER', label: '헤더' },
];

const commonPermissions = [
  'employee:read',
  'employee:write',
  'employee:read:sensitive',
  'organization:read',
  'organization:write',
  'attendance:read',
  'attendance:write',
  'attendance:approve',
  'approval:read',
  'approval:write',
  'approval:admin',
  'recruitment:read',
  'recruitment:write',
  'transfer:read',
  'transfer:write',
  'mdm:read',
  'mdm:write',
  'audit:read',
  'tenant:admin',
];

export function MenuItemForm({
  menu,
  parentMenu,
  onSubmit,
  onCancel,
  isLoading = false,
}: MenuItemFormProps) {
  const isEditing = !!menu;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: menu?.code || '',
      name: menu?.name || '',
      nameEn: menu?.nameEn || '',
      path: menu?.path || '',
      icon: menu?.icon || '',
      menuType: menu?.menuType || 'INTERNAL',
      externalUrl: menu?.externalUrl || '',
      sortOrder: menu?.sortOrder || 0,
      featureCode: menu?.featureCode || '',
      showInNav: menu?.showInNav ?? true,
      showInMobile: menu?.showInMobile ?? false,
      mobileSortOrder: menu?.mobileSortOrder,
      roles: menu?.roles || [],
      permissions: menu?.permissions || [],
    },
  });

  const handleSubmit = (values: FormValues) => {
    const data = {
      ...values,
      parentId: parentMenu?.id,
    };
    onSubmit(data);
  };

  const addRole = (role: string) => {
    const current = form.getValues('roles');
    if (!current.includes(role)) {
      form.setValue('roles', [...current, role]);
    }
  };

  const removeRole = (role: string) => {
    const current = form.getValues('roles');
    form.setValue('roles', current.filter((r) => r !== role));
  };

  const addPermission = (permission: string) => {
    const current = form.getValues('permissions');
    if (!current.includes(permission)) {
      form.setValue('permissions', [...current, permission]);
    }
  };

  const removePermission = (permission: string) => {
    const current = form.getValues('permissions');
    form.setValue('permissions', current.filter((p) => p !== permission));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {parentMenu && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              상위 메뉴: <strong>{parentMenu.name}</strong> ({parentMenu.code})
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>코드 *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="EMPLOYEES"
                    disabled={isEditing}
                  />
                </FormControl>
                <FormDescription>고유 식별자 (영문 대문자, 언더스코어)</FormDescription>
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
                  <Input {...field} placeholder="인사정보" />
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
                  <Input {...field} placeholder="HR Information" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="menuType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>메뉴 유형</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {menuTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
            name="path"
            render={({ field }) => (
              <FormItem>
                <FormLabel>경로</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="/employees" />
                </FormControl>
                <FormDescription>프론트엔드 라우트 경로</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>아이콘</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Users" />
                </FormControl>
                <FormDescription>Lucide 아이콘 이름</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>정렬 순서</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="featureCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>기능 코드</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="RECRUITMENT" />
                </FormControl>
                <FormDescription>테넌트 기능 플래그 연동</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-6">
          <FormField
            control={form.control}
            name="showInNav"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">네비게이션에 표시</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showInMobile"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">모바일 탭바에 표시</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* Roles */}
        <FormField
          control={form.control}
          name="roles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>필요 역할</FormLabel>
              <div className="flex flex-wrap gap-2">
                {field.value.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                    <button
                      type="button"
                      onClick={() => removeRole(role)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addRole}>
                <FormControl>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="역할 추가..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(ROLES)
                    .filter((r) => !field.value.includes(r))
                    .map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormDescription>
                지정된 역할 중 하나를 가진 사용자만 접근 가능
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Permissions */}
        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>필요 권한</FormLabel>
              <div className="flex flex-wrap gap-2">
                {field.value.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-blue-600">
                    {perm}
                    <button
                      type="button"
                      onClick={() => removePermission(perm)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addPermission}>
                <FormControl>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="권한 추가..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {commonPermissions
                    .filter((p) => !field.value.includes(p))
                    .map((perm) => (
                      <SelectItem key={perm} value={perm}>
                        {perm}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormDescription>
                지정된 권한 중 하나를 가진 사용자만 접근 가능
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장 중...' : isEditing ? '수정' : '생성'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default MenuItemForm;
