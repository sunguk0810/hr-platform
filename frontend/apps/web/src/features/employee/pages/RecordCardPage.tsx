import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { RecordCard } from '../components/RecordCard';
import { ArrowLeft } from 'lucide-react';

export default function RecordCardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('employee');

  if (!id) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('common.invalidAccess')}</p>
        <Button variant="outline" onClick={() => navigate('/employees')} className="mt-4">
          {t('common.backToListLong')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t('recordCard.pageTitle')}
        description={t('recordCard.pageDescription')}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        }
      />

      <RecordCard employeeId={id} />
    </>
  );
}
