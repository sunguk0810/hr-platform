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
import { Award, AlertTriangle } from 'lucide-react';
import type { Certificate } from '@hr-platform/shared-types';

interface RecordCardCertificateProps {
  certificates: Certificate[];
}

export function RecordCardCertificate({ certificates }: RecordCardCertificateProps) {
  const { t } = useTranslation('employee');
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const isExpiringSoon = (expirationDate?: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    return expDate > today && expDate <= threeMonthsLater;
  };

  if (certificates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4" />
            {t('recordCard.certificate.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('recordCard.certificate.empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const expiringSoonCount = certificates.filter((c) => isExpiringSoon(c.expirationDate)).length;
  const expiredCount = certificates.filter((c) => c.isExpired).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4" />
          {t('recordCard.certificate.title')}
          <span className="text-sm font-normal text-muted-foreground">({t('recordCard.certificate.count', { count: certificates.length })})</span>
          {(expiringSoonCount > 0 || expiredCount > 0) && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {expiredCount > 0 ? t('certificateInfo.expiredCount', { count: expiredCount }) : t('certificateInfo.expiringSoonCount', { count: expiringSoonCount })}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('recordCard.certificate.certificateName')}</TableHead>
              <TableHead>{t('recordCard.certificate.issuer')}</TableHead>
              <TableHead>{t('recordCard.certificate.acquiredDate')}</TableHead>
              <TableHead>{t('recordCard.certificate.expiryDate')}</TableHead>
              <TableHead>{t('recordCard.certificate.grade')}</TableHead>
              <TableHead>{t('recordCard.certificate.certificateNumber')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificates.map((cert) => {
              const expiringSoon = isExpiringSoon(cert.expirationDate);
              return (
                <TableRow key={cert.id} className={cert.isExpired ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {cert.certificateName}
                      {cert.isExpired && (
                        <Badge variant="destructive" className="text-xs">{t('certificateInfo.expiredBadge')}</Badge>
                      )}
                      {expiringSoon && !cert.isExpired && (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                          {t('certificateInfo.expiringSoonBadge')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{cert.issuingOrg}</TableCell>
                  <TableCell>{formatDate(cert.acquisitionDate)}</TableCell>
                  <TableCell>
                    {cert.expirationDate ? formatDate(cert.expirationDate) : t('certificateInfo.permanent')}
                  </TableCell>
                  <TableCell>{cert.grade || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {cert.certificateNumber || '-'}
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
