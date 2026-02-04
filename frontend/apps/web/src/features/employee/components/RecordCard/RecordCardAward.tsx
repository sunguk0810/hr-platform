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
          포상/징계
          {hasContent && (
            <span className="text-sm font-normal text-muted-foreground">
              (포상 {awards.length}건, 징계 {disciplinary.length}건)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Awards Section */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            포상내역
          </h4>
          {awards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded">
              등록된 포상내역이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">포상일</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>포상명</TableHead>
                  <TableHead>수여기관</TableHead>
                  <TableHead>포상금</TableHead>
                  <TableHead>사유</TableHead>
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
            징계내역
          </h4>
          {disciplinary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded">
              등록된 징계내역이 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">시행일</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>종료일</TableHead>
                  <TableHead>상태</TableHead>
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
                    <TableCell>{disc.duration ? `${disc.duration}일` : '-'}</TableCell>
                    <TableCell>{disc.endDate ? formatDate(disc.endDate) : '-'}</TableCell>
                    <TableCell>
                      {disc.isCurrent ? (
                        <Badge variant="destructive">진행중</Badge>
                      ) : (
                        <Badge variant="outline">종료</Badge>
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
