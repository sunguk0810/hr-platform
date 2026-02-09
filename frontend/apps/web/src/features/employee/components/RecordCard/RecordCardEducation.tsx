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
import { StatusBadge, StatusType } from '@/components/common/StatusBadge';
import { GraduationCap } from 'lucide-react';
import type { Education } from '@hr-platform/shared-types';

interface RecordCardEducationProps {
  education: Education[];
}

const graduationStatusTypeMap: Record<string, StatusType> = {
  GRADUATED: 'success',
  ENROLLED: 'info',
  DROPPED_OUT: 'default',
  ON_LEAVE: 'warning',
};

export function RecordCardEducation({ education }: RecordCardEducationProps) {
  const { t } = useTranslation('employee');
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
    });
  };

  if (education.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" />
            {t('recordCard.education.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('recordCard.education.empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-4 w-4" />
          {t('recordCard.education.title')}
          <span className="text-sm font-normal text-muted-foreground">({t('recordCard.education.count', { count: education.length })})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('recordCard.education.schoolType')}</TableHead>
              <TableHead>{t('recordCard.education.schoolName')}</TableHead>
              <TableHead>{t('recordCard.education.major')}</TableHead>
              <TableHead>{t('recordCard.education.degree')}</TableHead>
              <TableHead>{t('recordCard.education.period')}</TableHead>
              <TableHead>{t('recordCard.education.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {education.map((edu) => {
              const statusType = graduationStatusTypeMap[edu.graduationStatus] || ('default' as StatusType);
              const statusLabel = t(`educationInfo.graduationStatusOptions.${edu.graduationStatus}`, edu.graduationStatus);
              const status = { type: statusType, label: statusLabel };
              return (
                <TableRow key={edu.id}>
                  <TableCell className="font-medium">{edu.schoolType}</TableCell>
                  <TableCell>
                    <div>
                      <div>{edu.schoolName}</div>
                      {edu.location && (
                        <div className="text-xs text-muted-foreground">{edu.location}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{edu.major || '-'}</TableCell>
                  <TableCell>{edu.degree || '-'}</TableCell>
                  <TableCell>
                    {formatDate(edu.admissionDate)} ~ {formatDate(edu.graduationDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={status.type} label={status.label} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
