import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('appointment');

  if (details.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>{t('detailTable.empty')}</p>
        {isEditable && (
          <p className="text-sm mt-1">{t('detailTable.emptyDesc')}</p>
        )}
      </div>
    );
  }

  const renderChangeInfo = (detail: AppointmentDetail) => {
    const changes: React.ReactNode[] = [];

    if (detail.fromDepartmentName || detail.toDepartmentName) {
      if (detail.fromDepartmentName !== detail.toDepartmentName) {
        changes.push(
          <div key="dept" className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">{t('detailTable.department')}</span>
            <span>{detail.fromDepartmentName || '-'}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{detail.toDepartmentName || '-'}</span>
          </div>
        );
      }
    }

    if (detail.fromGradeName || detail.toGradeName) {
      if (detail.fromGradeName !== detail.toGradeName) {
        changes.push(
          <div key="grade" className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">{t('detailTable.grade')}</span>
            <span>{detail.fromGradeName || '-'}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{detail.toGradeName || '-'}</span>
          </div>
        );
      }
    }

    if (detail.fromPositionName || detail.toPositionName) {
      if (detail.fromPositionName !== detail.toPositionName) {
        changes.push(
          <div key="position" className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">{t('detailTable.position')}</span>
            <span>{detail.fromPositionName || '-'}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{detail.toPositionName || '-'}</span>
          </div>
        );
      }
    }

    if (detail.fromJobName || detail.toJobName) {
      if (detail.fromJobName !== detail.toJobName) {
        changes.push(
          <div key="job" className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">{t('detailTable.duty')}</span>
            <span>{detail.fromJobName || '-'}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{detail.toJobName || '-'}</span>
          </div>
        );
      }
    }

    if (changes.length === 0) {
      return <span className="text-muted-foreground text-sm">{t('detailTable.noChange')}</span>;
    }

    return <div className="space-y-1">{changes}</div>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">{t('detailTable.employeeNumber')}</TableHead>
            <TableHead className="w-[100px]">{t('detailTable.name')}</TableHead>
            <TableHead className="w-[100px]">{t('detailTable.appointmentType')}</TableHead>
            <TableHead>{t('detailTable.changes')}</TableHead>
            <TableHead className="w-[200px]">{t('detailTable.reason')}</TableHead>
            {isEditable && <TableHead className="w-[80px]">{t('detailTable.delete')}</TableHead>}
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
                    <span className="sr-only">{t('detailTable.delete')}</span>
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
