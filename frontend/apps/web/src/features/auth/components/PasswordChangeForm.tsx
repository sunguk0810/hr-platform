import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

// Password strength calculation
function calculatePasswordStrength(password: string): {
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
    return { score: (score / 7) * 100, label: '약함', color: 'bg-red-500' };
  } else if (score <= 4) {
    return { score: (score / 7) * 100, label: '보통', color: 'bg-yellow-500' };
  } else if (score <= 5) {
    return { score: (score / 7) * 100, label: '강함', color: 'bg-green-500' };
  } else {
    return { score: (score / 7) * 100, label: '매우 강함', color: 'bg-green-600' };
  }
}

// Validation rules
const passwordRules = [
  { id: 'length', label: '8자 이상', test: (p: string) => p.length >= 8 },
  { id: 'lowercase', label: '영문 소문자 포함', test: (p: string) => /[a-z]/.test(p) },
  { id: 'uppercase', label: '영문 대문자 포함', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number', label: '숫자 포함', test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: '특수문자 포함', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

// Form schema
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .regex(/[a-z]/, '영문 소문자를 포함해야 합니다.')
      .regex(/[A-Z]/, '영문 대문자를 포함해야 합니다.')
      .regex(/[0-9]/, '숫자를 포함해야 합니다.')
      .regex(/[^a-zA-Z0-9]/, '특수문자를 포함해야 합니다.'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

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
  const [showPasswords, setShowPasswords] = React.useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [success, setSuccess] = React.useState(false);

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
  const passwordStrength = calculatePasswordStrength(newPassword);

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
          <Label htmlFor="currentPassword">현재 비밀번호</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPasswords.current ? 'text' : 'password'}
              placeholder="현재 비밀번호를 입력하세요"
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
        <Label htmlFor="newPassword">새 비밀번호</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            placeholder="새 비밀번호를 입력하세요"
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
              <span className="text-muted-foreground">비밀번호 강도</span>
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
        <Label htmlFor="confirmPassword">비밀번호 확인</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            placeholder="비밀번호를 다시 입력하세요"
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
            비밀번호가 일치합니다
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
          <AlertDescription>비밀번호가 성공적으로 변경되었습니다.</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            변경 중...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            비밀번호 변경
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
            비밀번호 변경
          </CardTitle>
          <CardDescription>
            보안을 위해 주기적으로 비밀번호를 변경하세요.
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
  return (
    <div className={cn('space-y-2', className)}>
      <h4 className="text-sm font-medium">비밀번호 요구사항</h4>
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
