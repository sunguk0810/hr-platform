import { Clock, AlertTriangle, LogOut, TrendingUp } from 'lucide-react';
import { MobileCard, MobileCardContent } from '@/components/mobile';
import { cn } from '@/lib/utils';

interface SummaryItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant?: 'default' | 'warning' | 'success';
}

function SummaryItem({ icon, label, value, variant = 'default' }: SummaryItemProps) {
  const variantStyles = {
    default: 'text-foreground',
    warning: 'text-yellow-600 dark:text-yellow-400',
    success: 'text-green-600 dark:text-green-400',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-lg font-semibold', variantStyles[variant])}>{value}</p>
      </div>
    </div>
  );
}

interface MonthlySummaryCardProps {
  attendedDays?: number;
  totalWorkingHours?: number;
  lateDays?: number;
  earlyLeaveDays?: number;
  totalOvertimeHours?: number;
}

export function MonthlySummaryCard({
  attendedDays = 0,
  totalWorkingHours = 0,
  lateDays = 0,
  earlyLeaveDays = 0,
  totalOvertimeHours = 0,
}: MonthlySummaryCardProps) {
  return (
    <MobileCard>
      <MobileCardContent>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">이번 달 현황</h3>

        <div className="grid grid-cols-2 gap-2">
          <SummaryItem
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="총 근무일"
            value={`${attendedDays}일`}
          />
          <SummaryItem
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="근무시간"
            value={`${Math.round(totalWorkingHours)}h`}
          />
          <SummaryItem
            icon={<AlertTriangle className="h-5 w-5 text-yellow-500" />}
            label="지각"
            value={`${lateDays}회`}
            variant={lateDays > 0 ? 'warning' : 'default'}
          />
          <SummaryItem
            icon={<LogOut className="h-5 w-5 text-orange-500" />}
            label="조퇴"
            value={`${earlyLeaveDays}회`}
            variant={earlyLeaveDays > 0 ? 'warning' : 'default'}
          />
        </div>

        {totalOvertimeHours > 0 && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">초과근무</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {Math.round(totalOvertimeHours)}시간
              </span>
            </div>
          </div>
        )}
      </MobileCardContent>
    </MobileCard>
  );
}
