import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, AlertCircle, Check } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/Form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

function createPasswordSchema(t: TFunction) {
  return z
    .object({
      currentPassword: z.string().min(1, t('passwordChange.validation.currentRequired')),
      newPassword: z
        .string()
        .min(8, t('passwordChange.validation.minLength'))
        .regex(/[A-Z]/, t('passwordChange.validation.uppercase'))
        .regex(/[a-z]/, t('passwordChange.validation.lowercase'))
        .regex(/[0-9]/, t('passwordChange.validation.number'))
        .regex(/[^A-Za-z0-9]/, t('passwordChange.validation.special')),
      confirmPassword: z.string().min(1, t('passwordChange.validation.confirmRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('passwordChange.validation.mismatch'),
      path: ['confirmPassword'],
    });
}

type PasswordFormData = z.infer<ReturnType<typeof createPasswordSchema>>;

interface PasswordChangeProps {
  onSubmit: (data: { currentPassword: string; newPassword: string }) => void;
  isLoading?: boolean;
}

function getPasswordStrength(password: string): {
  score: number;
  labelKey: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 25, labelKey: 'passwordChange.strengthWeak', color: 'bg-red-500' };
  if (score <= 4) return { score: 50, labelKey: 'passwordChange.strengthFair', color: 'bg-yellow-500' };
  if (score <= 5) return { score: 75, labelKey: 'passwordChange.strengthStrong', color: 'bg-green-500' };
  return { score: 100, labelKey: 'passwordChange.strengthVeryStrong', color: 'bg-green-600' };
}

export function PasswordChange({ onSubmit, isLoading }: PasswordChangeProps) {
  const { t } = useTranslation('settings');
  const passwordSchema = React.useMemo(() => createPasswordSchema(t), [t]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = form.watch('newPassword');
  const strength = getPasswordStrength(newPassword);

  const requirements = [
    { label: t('passwordChange.requirements.minLength'), met: newPassword.length >= 8 },
    { label: t('passwordChange.requirements.uppercase'), met: /[A-Z]/.test(newPassword) },
    { label: t('passwordChange.requirements.lowercase'), met: /[a-z]/.test(newPassword) },
    { label: t('passwordChange.requirements.number'), met: /[0-9]/.test(newPassword) },
    { label: t('passwordChange.requirements.special'), met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const handleSubmit = (values: PasswordFormData) => {
    onSubmit({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('passwordChange.title')}</CardTitle>
        <CardDescription>
          {t('passwordChange.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('passwordChange.currentPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="pl-10 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('passwordChange.newPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        className="pl-10 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  {newPassword && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={strength.score}
                          className={cn('h-1.5', strength.color)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {t(strength.labelKey)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {requirements.map((req) => (
                          <div
                            key={req.label}
                            className="flex items-center gap-1 text-xs"
                          >
                            {req.met ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span
                              className={cn(
                                req.met
                                  ? 'text-green-600'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('passwordChange.confirmPassword')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="pl-10 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">{t('passwordChange.notice.title')}</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-amber-700 dark:text-amber-300">
                    <li>{t('passwordChange.notice.reloginRequired')}</li>
                    <li>{t('passwordChange.notice.otherSessionsLogout')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('passwordChange.changing') : t('passwordChange.changeButton')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default PasswordChange;
