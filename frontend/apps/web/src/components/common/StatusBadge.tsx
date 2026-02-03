import { cn } from '@/lib/utils';

export type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'default';

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const dotColors: Record<StatusType, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  pending: 'bg-orange-500',
  default: 'bg-gray-500',
};

export function StatusBadge({ status, label, className, dot = false, pulse = false }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {dot && (
        <span className="relative mr-1.5 flex h-2 w-2">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                dotColors[status]
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex h-2 w-2 rounded-full',
              dotColors[status]
            )}
          />
        </span>
      )}
      {label}
    </span>
  );
}

// Preset status badges for common use cases
export function ApprovalStatusBadge({
  status
}: {
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED' | 'CANCELLED'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    DRAFT: { type: 'default', label: '임시저장' },
    PENDING: { type: 'pending', label: '결재대기' },
    APPROVED: { type: 'success', label: '승인' },
    REJECTED: { type: 'error', label: '반려' },
    CANCELED: { type: 'default', label: '취소' },
    CANCELLED: { type: 'default', label: '취소' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

export function EmploymentStatusBadge({
  status
}: {
  status: 'ACTIVE' | 'LEAVE' | 'ON_LEAVE' | 'RESIGNED' | 'RETIRED' | 'SUSPENDED'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    ACTIVE: { type: 'success', label: '재직' },
    LEAVE: { type: 'warning', label: '휴직' },
    ON_LEAVE: { type: 'warning', label: '휴직' },
    RESIGNED: { type: 'default', label: '퇴직' },
    RETIRED: { type: 'default', label: '정년퇴직' },
    SUSPENDED: { type: 'error', label: '정직' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

export function LeaveStatusBadge({
  status
}: {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    PENDING: { type: 'pending', label: '승인대기' },
    APPROVED: { type: 'success', label: '승인' },
    REJECTED: { type: 'error', label: '반려' },
    CANCELLED: { type: 'default', label: '취소' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

export function AttendanceStatusBadge({
  status
}: {
  status: 'NORMAL' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'HOLIDAY' | 'WEEKEND'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    NORMAL: { type: 'success', label: '정상' },
    LATE: { type: 'warning', label: '지각' },
    EARLY_LEAVE: { type: 'warning', label: '조퇴' },
    ABSENT: { type: 'error', label: '결근' },
    HOLIDAY: { type: 'info', label: '휴일' },
    WEEKEND: { type: 'default', label: '주말' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

export function TenantStatusBadge({
  status
}: {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    ACTIVE: { type: 'success', label: '활성' },
    INACTIVE: { type: 'default', label: '비활성' },
    SUSPENDED: { type: 'error', label: '정지' },
    PENDING: { type: 'pending', label: '대기' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

export function LeaveTypeBadge({
  type
}: {
  type: 'ANNUAL' | 'SICK' | 'SPECIAL' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'MATERNITY' | 'PATERNITY' | 'UNPAID'
}) {
  const typeMap: Record<string, { badgeType: StatusType; label: string }> = {
    ANNUAL: { badgeType: 'info', label: '연차' },
    SICK: { badgeType: 'warning', label: '병가' },
    SPECIAL: { badgeType: 'success', label: '특별휴가' },
    HALF_DAY_AM: { badgeType: 'default', label: '반차(오전)' },
    HALF_DAY_PM: { badgeType: 'default', label: '반차(오후)' },
    MATERNITY: { badgeType: 'info', label: '출산휴가' },
    PATERNITY: { badgeType: 'info', label: '배우자출산휴가' },
    UNPAID: { badgeType: 'default', label: '무급휴가' },
  };

  const { badgeType, label } = typeMap[type] || { badgeType: 'default', label: type };
  return <StatusBadge status={badgeType} label={label} />;
}
