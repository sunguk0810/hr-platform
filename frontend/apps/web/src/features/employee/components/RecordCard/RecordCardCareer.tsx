import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';
import type { Career } from '@hr-platform/shared-types';

interface RecordCardCareerProps {
  career: Career[];
}

export function RecordCardCareer({ career }: RecordCardCareerProps) {
  const { t } = useTranslation('employee');
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0 && remainingMonths > 0) {
      return t('common.yearsMonths', { years, months: remainingMonths });
    } else if (years > 0) {
      return t('common.years', { count: years });
    } else {
      return t('common.months', { count: remainingMonths });
    }
  };

  if (career.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" />
            {t('recordCard.career.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('recordCard.career.empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4" />
          {t('recordCard.career.title')}
          <span className="text-sm font-normal text-muted-foreground">({t('recordCard.career.count', { count: career.length })})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('recordCard.career.companyName')}</TableHead>
              <TableHead>{t('recordCard.career.department')}</TableHead>
              <TableHead>{t('recordCard.career.position')}</TableHead>
              <TableHead>{t('recordCard.career.period')}</TableHead>
              <TableHead>{t('recordCard.career.duration')}</TableHead>
              <TableHead>{t('recordCard.career.duties')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {career.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {item.companyName}
                    {item.isCurrent && (
                      <Badge variant="secondary" className="text-xs">{t('recordCard.career.currentBadge')}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.department || '-'}</TableCell>
                <TableCell>{item.position || '-'}</TableCell>
                <TableCell>
                  {formatDate(item.startDate)} ~ {item.isCurrent ? t('common.present') : formatDate(item.endDate)}
                </TableCell>
                <TableCell>{calculateDuration(item.startDate, item.endDate)}</TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={item.duties}>
                    {item.duties || '-'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
