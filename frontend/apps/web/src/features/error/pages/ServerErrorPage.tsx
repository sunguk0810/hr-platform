import { useNavigate } from 'react-router-dom';
import { ServerCrash, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServerErrorPage() {
  const navigate = useNavigate();

  const handleRefresh = () => {
    // 500 에러 복구를 위한 전체 페이지 리셋 — reload() 의도적 사용
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <ServerCrash className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="mt-6 text-4xl font-bold text-foreground">500</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          서버 오류가 발생했습니다
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground">
          일시적인 서버 오류가 발생했습니다.
          잠시 후 다시 시도해 주세요. 문제가 지속되면 관리자에게 문의해 주세요.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            새로고침
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
