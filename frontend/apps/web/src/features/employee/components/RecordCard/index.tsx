import { useTranslation } from 'react-i18next';
import { RecordCardHeader } from './RecordCardHeader';
import { RecordCardBasic } from './RecordCardBasic';
import { RecordCardFamily } from './RecordCardFamily';
import { RecordCardEducation } from './RecordCardEducation';
import { RecordCardCareer } from './RecordCardCareer';
import { RecordCardCertificate } from './RecordCardCertificate';
import { RecordCardAppointment } from './RecordCardAppointment';
import { RecordCardAward } from './RecordCardAward';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecordCard, useRecordCardPdf } from '../../hooks/useEmployees';
import { useToast } from '@/hooks/useToast';
import { Download, Printer, FileText } from 'lucide-react';

interface RecordCardProps {
  employeeId: string;
}

function RecordCardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function RecordCard({ employeeId }: RecordCardProps) {
  const { t } = useTranslation('employee');
  const { toast } = useToast();
  const { data, isLoading, isError } = useRecordCard(employeeId);
  const pdfMutation = useRecordCardPdf();

  const recordCard = data?.data;

  const handleDownloadPdf = async () => {
    try {
      const blob = await pdfMutation.mutateAsync(employeeId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${t('recordCard.title')}_${recordCard?.employee.name}_${recordCard?.employee.employeeNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: t('toast.downloadComplete'),
        description: t('recordCard.downloadComplete'),
      });
    } catch {
      toast({
        title: t('toast.downloadFailure'),
        description: t('recordCard.downloadFailure'),
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <RecordCardSkeleton />;
  }

  if (isError || !recordCard) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('recordCard.cannotLoad')}</p>
      </div>
    );
  }

  const formatGeneratedAt = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold">{t('recordCard.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('recordCard.generatedAt', { date: formatGeneratedAt(recordCard.generatedAt) })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('common.print')}
          </Button>
          <Button onClick={handleDownloadPdf} disabled={pdfMutation.isPending}>
            <Download className="h-4 w-4 mr-2" />
            {pdfMutation.isPending ? t('recordCard.pdfGenerating') : t('recordCard.pdfDownload')}
          </Button>
        </div>
      </div>

      {/* Employee Header */}
      <RecordCardHeader employee={recordCard.employee} />

      {/* Basic Info */}
      <RecordCardBasic detail={recordCard.detail} />

      {/* Family */}
      <RecordCardFamily family={recordCard.family} />

      {/* Education */}
      <RecordCardEducation education={recordCard.education} />

      {/* Career */}
      <RecordCardCareer career={recordCard.career} />

      {/* Certificates */}
      <RecordCardCertificate certificates={recordCard.certificates} />

      {/* Appointments */}
      <RecordCardAppointment appointments={recordCard.appointments} />

      {/* Awards and Disciplinary */}
      <RecordCardAward awards={recordCard.awards} disciplinary={recordCard.disciplinary} />
    </div>
  );
}

export { RecordCardHeader } from './RecordCardHeader';
export { RecordCardBasic } from './RecordCardBasic';
export { RecordCardFamily } from './RecordCardFamily';
export { RecordCardEducation } from './RecordCardEducation';
export { RecordCardCareer } from './RecordCardCareer';
export { RecordCardCertificate } from './RecordCardCertificate';
export { RecordCardAppointment } from './RecordCardAppointment';
export { RecordCardAward } from './RecordCardAward';
