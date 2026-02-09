import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldOff, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <ShieldOff className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="mt-6 text-4xl font-bold text-foreground">403</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          {t('error.forbidden.title')}
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground whitespace-pre-line">
          {t('error.forbidden.description')}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('error.forbidden.goBack')}
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            {t('error.forbidden.goHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}
