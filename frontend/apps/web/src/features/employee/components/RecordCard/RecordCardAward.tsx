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
import { Trophy, AlertTriangle } from 'lucide-react';
import type { Award, Disciplinary } from '@hr-platform/shared-types';

interface RecordCardAwardProps {
  awards: Award[];
  disciplinary: Disciplinary[];
}

export function RecordCardAward({ awards, disciplinary }: RecordCardAwardProps) {
  const { t } = useTranslation('employee');
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const hasContent = awards.length > 0 || disciplinary.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          {t('recordCard.award.title')}
          {hasContent && (
            <span className="text-sm font-normal text-muted-foreground">
              ({t('recordCard.award.count', { awardCount: awards.length, disciplinaryCount: disciplinary.length })})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Awards Section */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            {t('recordCard.award.awardSection')}
          </h4>
          {awards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded">
              {t('recordCard.award.awardEmpty')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t('recordCard.award.awardDate')}</TableHead>
                  <TableHead>{t('recordCard.award.awardType')}</TableHead>
                  <TableHead>{t('recordCard.award.awardName')}</TableHead>
                  <TableHead>{t('recordCard.award.awardIssuer')}</TableHead>
                  <TableHead>{t('recordCard.award.awardAmount')}</TableHead>
                  <TableHead>{t('recordCard.award.awardReason')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awards.map((award) => (
                  <TableRow key={award.id}>
                    <TableCell className="font-medium">{formatDate(award.awardDate)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{award.awardTypeName}</Badge>
                    </TableCell>
                    <TableCell>{award.awardName}</TableCell>
                    <TableCell>{award.issuingOrg || '-'}</TableCell>
                    <TableCell>{formatCurrency(award.amount)}</TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate" title={award.reason}>
                        {award.reason || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Disciplinary Section */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            {t('recordCard.award.disciplinarySection')}
          </h4>
          {disciplinary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded">
              {t('recordCard.award.disciplinaryEmpty')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t('recordCard.award.disciplinaryDate')}</TableHead>
                  <TableHead>{t('recordCard.award.disciplinaryType')}</TableHead>
                  <TableHead>{t('recordCard.award.disciplinaryReason')}</TableHead>
                  <TableHead>{t('recordCard.award.disciplinaryDuration')}</TableHead>
                  <TableHead>{t('recordCard.award.disciplinaryEndDate')}</TableHead>
                  <TableHead>{t('recordCard.award.disciplinaryStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disciplinary.map((disc) => (
                  <TableRow key={disc.id}>
                    <TableCell className="font-medium">{formatDate(disc.effectiveDate)}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{disc.disciplinaryTypeName}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={disc.reason}>
                        {disc.reason}
                      </div>
                    </TableCell>
                    <TableCell>{disc.duration ? t('common.days', { count: disc.duration }) : '-'}</TableCell>
                    <TableCell>{disc.endDate ? formatDate(disc.endDate) : '-'}</TableCell>
                    <TableCell>
                      {disc.isCurrent ? (
                        <Badge variant="destructive">{t('recordCard.award.disciplinaryActive')}</Badge>
                      ) : (
                        <Badge variant="outline">{t('recordCard.award.disciplinaryEnded')}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
