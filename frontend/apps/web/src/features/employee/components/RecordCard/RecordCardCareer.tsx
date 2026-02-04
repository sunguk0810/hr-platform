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
      return `${years}년 ${remainingMonths}개월`;
    } else if (years > 0) {
      return `${years}년`;
    } else {
      return `${remainingMonths}개월`;
    }
  };

  if (career.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" />
            경력사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            등록된 경력정보가 없습니다.
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
          경력사항
          <span className="text-sm font-normal text-muted-foreground">({career.length}건)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>회사명</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직위</TableHead>
              <TableHead>기간</TableHead>
              <TableHead>재직기간</TableHead>
              <TableHead>담당업무</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {career.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {item.companyName}
                    {item.isCurrent && (
                      <Badge variant="secondary" className="text-xs">현재</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.department || '-'}</TableCell>
                <TableCell>{item.position || '-'}</TableCell>
                <TableCell>
                  {formatDate(item.startDate)} ~ {item.isCurrent ? '현재' : formatDate(item.endDate)}
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
