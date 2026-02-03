import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoginForm } from '../components/LoginForm';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border bg-card p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">HR Platform</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              인사관리 시스템에 로그인하세요
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          &copy; 2024 HR SaaS Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
