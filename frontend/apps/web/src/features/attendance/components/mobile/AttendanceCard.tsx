import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, LogIn, LogOut } from 'lucide-react';
import { MobileCard, MobileCardContent } from '@/components/mobile';
import { AttendanceStatusBadge } from '@/components/common/StatusBadge';
import type { AttendanceRecord } from '@hr-platform/shared-types';

interface AttendanceCardProps {
  record: AttendanceRecord;
  onClick?: () => void;
}

export function AttendanceCard({ record, onClick }: AttendanceCardProps) {
  const dateDisplay = format(new Date(record.date), 'M월 d일 (E)', { locale: ko });

  return (
    <MobileCard onClick={onClick} className="mb-3">
      <MobileCardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-foreground">{dateDisplay}</span>
          <AttendanceStatusBadge status={record.status} />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <LogIn className="h-4 w-4" />
            <span className="font-mono">{record.checkInTime?.slice(0, 5) || '--:--'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LogOut className="h-4 w-4" />
            <span className="font-mono">{record.checkOutTime?.slice(0, 5) || '--:--'}</span>
          </div>
          {record.workingHours && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Clock className="h-4 w-4" />
              <span>{record.workingHours}h</span>
            </div>
          )}
        </div>
      </MobileCardContent>
    </MobileCard>
  );
}
