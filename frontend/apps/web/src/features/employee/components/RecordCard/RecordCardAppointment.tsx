import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppointmentTypeBadge } from '@/components/common/StatusBadge';
import { ArrowRight, FileText } from 'lucide-react';
import type { Appointment } from '@hr-platform/shared-types';

interface RecordCardAppointmentProps {
  appointments: Appointment[];
}

export function RecordCardAppointment({ appointments }: RecordCardAppointmentProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            발령사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            등록된 발령사항이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          발령사항
          <span className="text-sm font-normal text-muted-foreground">({appointments.length}건)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">발령일</TableHead>
              <TableHead className="w-[100px]">유형</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직급</TableHead>
              <TableHead>직책</TableHead>
              <TableHead>사유</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell className="font-medium">{formatDate(apt.effectiveDate)}</TableCell>
                <TableCell>
                  <AppointmentTypeBadge type={apt.appointmentType as 'PROMOTION' | 'TRANSFER' | 'POSITION_CHANGE' | 'JOB_CHANGE' | 'LEAVE_OF_ABSENCE' | 'REINSTATEMENT' | 'RESIGNATION' | 'RETIREMENT' | 'DEMOTION' | 'CONCURRENT'} />
                </TableCell>
                <TableCell>
                  {apt.fromDepartmentName || apt.toDepartmentName ? (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">
                        {apt.fromDepartmentName || '-'}
                      </span>
                      {apt.fromDepartmentName && apt.toDepartmentName && (
                        <>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span>{apt.toDepartmentName}</span>
                        </>
                      )}
                      {!apt.fromDepartmentName && apt.toDepartmentName && (
                        <span>{apt.toDepartmentName}</span>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {apt.fromGradeName || apt.toGradeName ? (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">
                        {apt.fromGradeName || '-'}
                      </span>
                      {apt.fromGradeName && apt.toGradeName && (
                        <>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span>{apt.toGradeName}</span>
                        </>
                      )}
                      {!apt.fromGradeName && apt.toGradeName && (
                        <span>{apt.toGradeName}</span>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {apt.fromPositionName || apt.toPositionName ? (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">
                        {apt.fromPositionName || '-'}
                      </span>
                      {apt.fromPositionName && apt.toPositionName && (
                        <>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span>{apt.toPositionName}</span>
                        </>
                      )}
                      {!apt.fromPositionName && apt.toPositionName && (
                        <span>{apt.toPositionName}</span>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px] truncate" title={apt.reason}>
                    {apt.reason || '-'}
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
