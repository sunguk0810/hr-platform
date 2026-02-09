import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  Lock,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import type { TFunction } from 'i18next';

// Password strength calculation
function calculatePasswordStrength(
  password: string,
  t: TFunction
): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (!password) {
    return { score: 0, label: '', color: 'bg-muted' };
  }

  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character types
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Penalties for common patterns
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  if (/^[0-9]+$/.test(password)) score -= 2; // Only numbers
  if (/^[a-zA-Z]+$/.test(password)) score -= 1; // Only letters

  score = Math.max(0, Math.min(score, 7));

  if (score <= 2) {
    return { score: (score / 7) * 100, label: t('passwordChange.strengthWeak'), color: 'bg-red-500' };
  } else if (score <= 4) {
    return { score: (score / 7) * 100, label: t('passwordChange.strengthFair'), color: 'bg-yellow-500' };
  } else if (score <= 5) {
    return { score: (score / 7) * 100, label: t('passwordChange.strengthStrong'), color: 'bg-green-500' };
  } else {
    return { score: (score / 7) * 100, label: t('passwordChange.strengthVeryStrong'), color: 'bg-green-600' };
  }
}

// Validation rules
function getPasswordRules(t: TFunction) {
  return [
    { id: 'length', label: t('passwordChange.rule.length'), test: (p: string) => p.length >= 8 },
    { id: 'lowercase', label: t('passwordChange.rule.lowercase'), test: (p: string) => /[a-z]/.test(p) },
    { id: 'uppercase', label: t('passwordChange.rule.uppercase'), test: (p: string) => /[A-Z]/.test(p) },
    { id: 'number', label: t('passwordChange.rule.number'), test: (p: string) => /[0-9]/.test(p) },
    { id: 'special', label: t('passwordChange.rule.special'), test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
  ];
}

// Form schema factory
function createPasswordChangeSchema(t: TFunction) {
  return z
    .object({
      currentPassword: z.string().min(1, t('passwordChange.currentPasswordRequired')),
      newPassword: z
        .string()
        .min(8, t('passwordChange.newPasswordMinLength'))
        .regex(/[a-z]/, t('passwordChange.newPasswordLowercase'))
        .regex(/[A-Z]/, t('passwordChange.newPasswordUppercase'))
        .regex(/[0-9]/, t('passwordChange.newPasswordNumber'))
        .regex(/[^a-zA-Z0-9]/, t('passwordChange.newPasswordSpecial')),
      confirmPassword: z.string().min(1, t('passwordChange.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: t('passwordChange.newPasswordSameAsCurrent'),
      path: ['newPassword'],
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('passwordChange.confirmPasswordMismatch'),
      path: ['confirmPassword'],
    });
}

type PasswordChangeFormData = z.infer<ReturnType<typeof createPasswordChangeSchema>>;

export interface PasswordChangeFormProps {
  onSubmit: (data: { currentPassword: string; newPassword: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  onSuccess?: () => void;
  showCurrentPassword?: boolean;
  variant?: 'default' | 'card' | 'compact';
  className?: string;
}

export function PasswordChangeForm({
  onSubmit,
  isLoading = false,
  error,
  onSuccess,
  showCurrentPassword = true,
  variant = 'default',
  className,
}: PasswordChangeFormProps) {
  const { t } = useTranslation('auth');
  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [success, setSuccess] = React.useState(false);

  const passwordChangeSchema = React.useMemo(() => createPasswordChangeSchema(t), [t]);
  const passwordRules = React.useMemo(() => getPasswordRules(t), [t]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword', '');
  const confirmPassword = watch('confirmPassword', '');
  const passwordStrength = calculatePasswordStrength(newPassword, t);

  const handleFormSubmit = async (data: PasswordChangeFormData) => {
    setSuccess(false);
    try {
      await onSubmit({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();
      onSuccess?.();
    } catch (e) {
      // Error handled by parent
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const formContent = (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Current Password */}
      {showCurrentPassword && (
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t('passwordChange.currentPassword')}</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPasswords.current ? 'text' : 'password'}
              placeholder={t('passwordChange.currentPasswordPlaceholder')}
              autoComplete="current-password"
              {...register('currentPassword')}
              className={cn(
                'pr-10',
                errors.currentPassword && 'border-destructive'
              )}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>
      )}

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t('passwordChange.newPassword')}</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            placeholder={t('passwordChange.newPasswordPlaceholder')}
            autoComplete="new-password"
            {...register('newPassword')}
            className={cn('pr-10', errors.newPassword && 'border-destructive')}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('new')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-sm text-destructive">{errors.newPassword.message}</p>
        )}

        {/* Password Strength Indicator */}
        {newPassword && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('passwordChange.strength')}</span>
              <span className={cn('font-medium', passwordStrength.color.replace('bg-', 'text-'))}>
                {passwordStrength.label}
              </span>
            </div>
            <Progress value={passwordStrength.score} className="h-1.5" />
          </div>
        )}

        {/* Password Rules */}
        {variant !== 'compact' && newPassword && (
          <div className="grid grid-cols-2 gap-1 mt-2">
            {passwordRules.map((rule) => {
              const passed = rule.test(newPassword);
              return (
                <div
                  key={rule.id}
                  className={cn(
                    'flex items-center gap-1.5 text-xs',
                    passed ? 'text-green-600' : 'text-muted-foreground'
                  )}
                >
                  {passed ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  {rule.label}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('passwordChange.confirmPassword')}</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            placeholder={t('passwordChange.confirmPasswordPlaceholder')}
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={cn(
              'pr-10',
              errors.confirmPassword && 'border-destructive',
              confirmPassword && newPassword === confirmPassword && 'border-green-500'
            )}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirm')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
        {!errors.confirmPassword && confirmPassword && newPassword === confirmPassword && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            {t('passwordChange.passwordMatch')}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{t('passwordChange.success')}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('passwordChange.changing')}
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            {t('passwordChange.changeButton')}
          </>
        )}
      </Button>
    </form>
  );

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('passwordChange.title')}
          </CardTitle>
          <CardDescription>
            {t('passwordChange.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>{formContent}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{formContent}</div>;
}

// Password requirements display component
export interface PasswordRequirementsProps {
  className?: string;
}

export function PasswordRequirements({ className }: PasswordRequirementsProps) {
  const { t } = useTranslation('auth');
  const passwordRules = React.useMemo(() => getPasswordRules(t), [t]);

  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium">{t('passwordChange.requirements')}</h4>
      <ul className="text-xs text-muted-foreground space-y-1">
        {passwordRules.map((rule) => (
          <li key={rule.id} className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-muted-foreground/50" />
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
