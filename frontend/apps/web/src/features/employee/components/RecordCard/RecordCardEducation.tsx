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

const graduationStatusMap: Record<string, { type: StatusType; label: string }> = {
  GRADUATED: { type: 'success', label: '졸업' },
  ENROLLED: { type: 'info', label: '재학' },
  DROPPED_OUT: { type: 'default', label: '중퇴' },
  ON_LEAVE: { type: 'warning', label: '휴학' },
};

export function RecordCardEducation({ education }: RecordCardEducationProps) {
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
            학력사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            등록된 학력정보가 없습니다.
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
          학력사항
          <span className="text-sm font-normal text-muted-foreground">({education.length}건)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>학교구분</TableHead>
              <TableHead>학교명</TableHead>
              <TableHead>전공</TableHead>
              <TableHead>학위</TableHead>
              <TableHead>기간</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {education.map((edu) => {
              const status = graduationStatusMap[edu.graduationStatus] || {
                type: 'default' as StatusType,
                label: edu.graduationStatus,
              };
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
