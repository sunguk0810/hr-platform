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
            자격증
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            등록된 자격증이 없습니다.
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
          자격증
          <span className="text-sm font-normal text-muted-foreground">({certificates.length}건)</span>
          {(expiringSoonCount > 0 || expiredCount > 0) && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {expiredCount > 0 ? `만료 ${expiredCount}` : `곧 만료 ${expiringSoonCount}`}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>자격증명</TableHead>
              <TableHead>발급기관</TableHead>
              <TableHead>취득일</TableHead>
              <TableHead>유효기간</TableHead>
              <TableHead>등급</TableHead>
              <TableHead>자격번호</TableHead>
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
                        <Badge variant="destructive" className="text-xs">만료</Badge>
                      )}
                      {expiringSoon && !cert.isExpired && (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                          곧 만료
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{cert.issuingOrg}</TableCell>
                  <TableCell>{formatDate(cert.acquisitionDate)}</TableCell>
                  <TableCell>
                    {cert.expirationDate ? formatDate(cert.expirationDate) : '영구'}
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
