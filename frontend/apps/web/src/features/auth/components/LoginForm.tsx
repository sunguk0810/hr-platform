import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Shield, Users, Briefcase, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLogin } from '../hooks/useAuth';
import { quickLoginAccounts } from '../services/mockAuthData';

const loginSchema = z.object({
  username: z.string().min(1, '아이디를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// 개발 모드 확인
const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK === 'true';

// 역할별 아이콘
const roleIcons: Record<string, React.ReactNode> = {
  SYSTEM_ADMIN: <Shield className="h-4 w-4 text-red-500" />,
  HR_MANAGER: <Users className="h-4 w-4 text-blue-500" />,
  MANAGER: <Briefcase className="h-4 w-4 text-amber-500" />,
  EMPLOYEE: <User className="h-4 w-4 text-green-500" />,
};

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(true);
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  const handleQuickLogin = (username: string, password: string) => {
    setValue('username', username);
    setValue('password', password);
    login({ username, password });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">아이디</Label>
          <Input
            id="username"
            type="text"
            placeholder="아이디를 입력하세요"
            autoComplete="username"
            {...register('username')}
            className={errors.username ? 'border-destructive' : ''}
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              {...register('password')}
              className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {(error as Error).message || '로그인에 실패했습니다.'}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </Button>
      </form>

      {/* 개발 모드 빠른 로그인 */}
      {isDevelopment && (
        <>
          <Separator />
          <Collapsible open={showQuickLogin} onOpenChange={setShowQuickLogin}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-muted-foreground"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  테스트 계정으로 빠른 로그인
                </span>
                <span className="text-xs">
                  {showQuickLogin ? '접기' : '펼치기'}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground mb-3">
                개발/테스트 환경에서만 표시됩니다. 클릭하면 바로 로그인됩니다.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickLoginAccounts.map((account) => (
                  <Button
                    key={account.username}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto py-3 flex flex-col items-start gap-1"
                    onClick={() => handleQuickLogin(account.username, account.password)}
                    disabled={isPending}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {roleIcons[account.roles[0]] || <User className="h-4 w-4" />}
                      <span className="font-medium">{account.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-normal">
                      {account.description}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/70">
                      {account.username} / {account.password}
                    </span>
                  </Button>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>권한 설명:</strong>
                </p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  <li className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-red-500" />
                    시스템 관리자: 모든 기능 접근 가능
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-blue-500" />
                    HR 관리자: 인사/근태/조직 관리
                  </li>
                  <li className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-amber-500" />
                    부서장: 팀원 관리 및 결재 승인
                  </li>
                  <li className="flex items-center gap-2">
                    <User className="h-3 w-3 text-green-500" />
                    일반 직원: 본인 정보 조회/수정
                  </li>
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}
