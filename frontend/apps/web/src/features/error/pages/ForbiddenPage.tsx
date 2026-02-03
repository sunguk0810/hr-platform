import { useNavigate } from 'react-router-dom';
import { ShieldOff, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <ShieldOff className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="mt-6 text-4xl font-bold text-foreground">403</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          접근 권한이 없습니다
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          이 페이지에 접근할 수 있는 권한이 없습니다.
          필요한 권한이 있다면 관리자에게 문의해 주세요.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            이전 페이지
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            대시보드로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}
