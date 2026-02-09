import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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

const createFormSchema = (t: TFunction) =>
  z.object({
    code: z.string().min(1, t('validation.codeRequired')).max(50),
    name: z.string().min(1, t('validation.nameRequired')).max(100),
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

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface MenuItemFormProps {
  menu?: MenuItemResponse;
  parentMenu?: MenuItemResponse;
  onSubmit: (data: CreateMenuItemRequest | UpdateMenuItemRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

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
  const { t } = useTranslation('menu');
  const isEditing = !!menu;

  const formSchema = useMemo(() => createFormSchema(t), [t]);

  const menuTypes: { value: MenuType; label: string }[] = useMemo(
    () => [
      { value: 'INTERNAL', label: t('menuTypes.ROUTE') },
      { value: 'EXTERNAL', label: t('menuTypes.EXTERNAL') },
      { value: 'DIVIDER', label: t('menuTypes.SEPARATOR') },
      { value: 'HEADER', label: t('menuTypes.HEADER') },
    ],
    [t]
  );

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
              {t('form.parentMenu', { name: `${parentMenu.name} (${parentMenu.code})` })}
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.code')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('form.codePlaceholder')}
                    disabled={isEditing}
                  />
                </FormControl>
                <FormDescription>{t('form.codePlaceholder')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.name')}</FormLabel>
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
                <FormLabel>{t('form.nameEn')}</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>{t('form.menuType')}</FormLabel>
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
                <FormLabel>{t('form.path')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('form.pathPlaceholder')} />
                </FormControl>
                <FormDescription>{t('form.pathPlaceholder')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.icon')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('form.iconPlaceholder')} />
                </FormControl>
                <FormDescription>{t('form.iconPlaceholder')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.sortOrder')}</FormLabel>
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
                <FormLabel>{t('form.featureCode')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t('form.featureCodePlaceholder')} />
                </FormControl>
                <FormDescription>{t('form.featureCodePlaceholder')}</FormDescription>
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
                <FormLabel className="!mt-0">{t('form.showInNav')}</FormLabel>
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
                <FormLabel className="!mt-0">{t('form.showInMobile')}</FormLabel>
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
              <FormLabel>{t('form.requiredRoles')}</FormLabel>
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
                    <SelectValue placeholder={t('form.addRole')} />
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
                {t('form.roleDescription')}
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
              <FormLabel>{t('form.requiredPermissions')}</FormLabel>
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
                    <SelectValue placeholder={t('form.addPermission')} />
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
                {t('form.permissionDescription')}
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('form.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('form.saving') : isEditing ? t('form.edit') : t('form.create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default MenuItemForm;
