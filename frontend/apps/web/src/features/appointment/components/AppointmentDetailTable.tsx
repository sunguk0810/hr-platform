import { Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppointmentTypeBadge } from '@/components/common/StatusBadge';
import type { AppointmentDetail } from '@hr-platform/shared-types';

interface AppointmentDetailTableProps {
  details: AppointmentDetail[];
  onRemove?: (detailId: string) => void;
  isEditable?: boolean;
  isLoading?: boolean;
}

export function AppointmentDetailTable({
  details,
  onRemove,
  isEditable = false,
  isLoading = false,
}: AppointmentDetailTableProps) {
  if (details.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>발령 대상이 없습니다.</p>
        {isEditable && (
          <p className="text-sm mt-1">위의 &quot;직원 추가&quot; 버튼을 클릭하여 발령 대상을 추가하세요.</p>
        )}
      </div>
    );
  }

  const renderChangeInfo = (detail: AppointmentDetail) => {
    const changes: React.ReactNode[] = [];

    // 부서 변경
    if (detail.fromDepartmentName || detail.toDepartmentName) {
      if (detail.fromDepartmentName !== detail.toDepartmentName) {
        changes.push(
          <div key="dept" className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">부서:</span>
            <span>{detail.fromDepartmentName || '-'}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{detail.toDepartmentName || '-'}</span>
          </div>
        );
      }
    }

    // 직급 변경
    if (detail.fromGradeName || detail.toGradeName) {
      if (detail.fromGradeName !== detail.toGradeName) {
        changes.push(
          <div key="grade" className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">직급:</span>
            <span>{detail.fromGradeName || '-'}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{detail.toGradeName || '-'}</span>
          </div>
        );
      }
    }

    // 직책 변경
    if (detail.fromPositionName || detail.toPositionName) {
      if (detail.fromPositionName !== detail.toPositionName) {
        changes.push(
          <div key="position" className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">직책:</span>
            <span>{detail.fromPositionName || '-'}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{detail.toPositionName || '-'}</span>
          </div>
        );
      }
    }

    // 직무 변경
    if (detail.fromJobName || detail.toJobName) {
      if (detail.fromJobName !== detail.toJobName) {
        changes.push(
          <div key="job" className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">직무:</span>
            <span>{detail.fromJobName || '-'}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{detail.toJobName || '-'}</span>
          </div>
        );
      }
    }

    if (changes.length === 0) {
      return <span className="text-muted-foreground text-sm">변동 없음</span>;
    }

    return <div className="space-y-1">{changes}</div>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">사번</TableHead>
            <TableHead className="w-[100px]">성명</TableHead>
            <TableHead className="w-[100px]">발령유형</TableHead>
            <TableHead>변경 내용</TableHead>
            <TableHead className="w-[200px]">사유</TableHead>
            {isEditable && <TableHead className="w-[80px]">삭제</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.map((detail) => (
            <TableRow key={detail.id}>
              <TableCell className="font-mono text-sm">
                {detail.employeeNumber || detail.employeeId}
              </TableCell>
              <TableCell className="font-medium">{detail.employeeName}</TableCell>
              <TableCell>
                <AppointmentTypeBadge type={detail.appointmentType} />
              </TableCell>
              <TableCell>{renderChangeInfo(detail)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {detail.reason || '-'}
              </TableCell>
              {isEditable && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove?.(detail.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">삭제</span>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
