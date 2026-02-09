import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ServerCrash, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServerErrorPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

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
          {t('error.server.title')}
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground whitespace-pre-line">
          {t('error.server.description')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('error.server.refresh')}
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            {t('error.server.goHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}
