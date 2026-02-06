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
      role="status"
      aria-label={`상태: ${label}`}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {dot && (
        <span className="relative mr-1.5 flex h-2 w-2" aria-hidden="true">
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
  status: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'RECALLED' | 'CANCELED' | 'CANCELLED'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    DRAFT: { type: 'default', label: '임시저장' },
    PENDING: { type: 'pending', label: '결재대기' },
    IN_REVIEW: { type: 'info', label: '검토중' },
    APPROVED: { type: 'success', label: '승인' },
    REJECTED: { type: 'error', label: '반려' },
    RECALLED: { type: 'warning', label: '회수됨' },
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
  status: 'NORMAL' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'HOLIDAY' | 'WEEKEND' | 'LEAVE' | 'HALF_DAY' | 'OVERTIME'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    NORMAL: { type: 'success', label: '정상' },
    LATE: { type: 'warning', label: '지각' },
    EARLY_LEAVE: { type: 'warning', label: '조퇴' },
    ABSENT: { type: 'error', label: '결근' },
    HOLIDAY: { type: 'info', label: '휴일' },
    WEEKEND: { type: 'default', label: '주말' },
    LEAVE: { type: 'info', label: '휴가' },
    HALF_DAY: { type: 'info', label: '반차' },
    OVERTIME: { type: 'pending', label: '초과근무' },
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
  type: 'ANNUAL' | 'SICK' | 'SPECIAL' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'HOURLY' | 'MATERNITY' | 'PATERNITY' | 'UNPAID'
}) {
  const typeMap: Record<string, { badgeType: StatusType; label: string }> = {
    ANNUAL: { badgeType: 'info', label: '연차' },
    SICK: { badgeType: 'warning', label: '병가' },
    SPECIAL: { badgeType: 'success', label: '특별휴가' },
    HALF_DAY_AM: { badgeType: 'default', label: '반차(오전)' },
    HALF_DAY_PM: { badgeType: 'default', label: '반차(오후)' },
    HOURLY: { badgeType: 'pending', label: '시간차' },
    MATERNITY: { badgeType: 'info', label: '출산휴가' },
    PATERNITY: { badgeType: 'info', label: '배우자출산휴가' },
    UNPAID: { badgeType: 'default', label: '무급휴가' },
  };

  const { badgeType, label } = typeMap[type] || { badgeType: 'default', label: type };
  return <StatusBadge status={badgeType} label={label} />;
}

// Appointment (발령) Status Badge
export function AppointmentDraftStatusBadge({
  status
}: {
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    DRAFT: { type: 'default', label: '임시저장' },
    PENDING_APPROVAL: { type: 'pending', label: '결재대기' },
    APPROVED: { type: 'info', label: '승인' },
    REJECTED: { type: 'error', label: '반려' },
    EXECUTED: { type: 'success', label: '시행완료' },
    CANCELLED: { type: 'default', label: '취소' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

// Appointment Type Badge
export function AppointmentTypeBadge({
  type
}: {
  type: 'PROMOTION' | 'TRANSFER' | 'POSITION_CHANGE' | 'JOB_CHANGE' | 'LEAVE_OF_ABSENCE' | 'REINSTATEMENT' | 'RESIGNATION' | 'RETIREMENT' | 'DEMOTION' | 'CONCURRENT'
}) {
  const typeMap: Record<string, { badgeType: StatusType; label: string }> = {
    PROMOTION: { badgeType: 'success', label: '승진' },
    TRANSFER: { badgeType: 'info', label: '전보' },
    POSITION_CHANGE: { badgeType: 'info', label: '보직변경' },
    JOB_CHANGE: { badgeType: 'info', label: '직무변경' },
    LEAVE_OF_ABSENCE: { badgeType: 'warning', label: '휴직' },
    REINSTATEMENT: { badgeType: 'success', label: '복직' },
    RESIGNATION: { badgeType: 'default', label: '사직' },
    RETIREMENT: { badgeType: 'default', label: '정년퇴직' },
    DEMOTION: { badgeType: 'error', label: '강등' },
    CONCURRENT: { badgeType: 'pending', label: '겸직' },
  };

  const { badgeType, label } = typeMap[type] || { badgeType: 'default', label: type };
  return <StatusBadge status={badgeType} label={label} />;
}

// Job Posting Status Badge (채용공고 상태)
export function JobStatusBadge({
  status
}: {
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'COMPLETED'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    DRAFT: { type: 'default', label: '임시저장' },
    OPEN: { type: 'success', label: '진행중' },
    CLOSED: { type: 'warning', label: '마감' },
    CANCELLED: { type: 'error', label: '취소' },
    COMPLETED: { type: 'info', label: '완료' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

// Application Status Badge (지원서 상태)
export function ApplicationStatusBadge({
  status
}: {
  status: 'RECEIVED' | 'SCREENING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ON_HOLD' | 'WITHDRAWN' | 'HIRED'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    RECEIVED: { type: 'info', label: '접수' },
    SCREENING: { type: 'pending', label: '서류심사중' },
    IN_PROGRESS: { type: 'warning', label: '진행중' },
    PASSED: { type: 'success', label: '합격' },
    FAILED: { type: 'error', label: '불합격' },
    ON_HOLD: { type: 'default', label: '보류' },
    WITHDRAWN: { type: 'default', label: '지원취소' },
    HIRED: { type: 'success', label: '채용확정' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

// Application Stage Badge (지원 단계)
export function ApplicationStageBadge({
  stage
}: {
  stage: 'DOCUMENT' | 'FIRST_INTERVIEW' | 'SECOND_INTERVIEW' | 'FINAL_INTERVIEW' | 'OFFER'
}) {
  const stageMap: Record<string, { badgeType: StatusType; label: string }> = {
    DOCUMENT: { badgeType: 'default', label: '서류전형' },
    FIRST_INTERVIEW: { badgeType: 'info', label: '1차면접' },
    SECOND_INTERVIEW: { badgeType: 'info', label: '2차면접' },
    FINAL_INTERVIEW: { badgeType: 'warning', label: '최종면접' },
    OFFER: { badgeType: 'success', label: '오퍼' },
  };

  const { badgeType, label } = stageMap[stage] || { badgeType: 'default', label: stage };
  return <StatusBadge status={badgeType} label={label} />;
}

// Interview Status Badge (면접 상태)
export function InterviewStatusBadge({
  status
}: {
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    SCHEDULED: { type: 'pending', label: '예정' },
    CONFIRMED: { type: 'info', label: '확정' },
    IN_PROGRESS: { type: 'warning', label: '진행중' },
    COMPLETED: { type: 'success', label: '완료' },
    CANCELLED: { type: 'default', label: '취소' },
    NO_SHOW: { type: 'error', label: '불참' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}

// Interview Type Badge (면접 유형)
export function InterviewTypeBadge({
  type
}: {
  type: 'PHONE' | 'VIDEO' | 'ONSITE' | 'TECHNICAL' | 'FINAL'
}) {
  const typeMap: Record<string, { badgeType: StatusType; label: string }> = {
    PHONE: { badgeType: 'default', label: '전화면접' },
    VIDEO: { badgeType: 'info', label: '화상면접' },
    ONSITE: { badgeType: 'success', label: '대면면접' },
    TECHNICAL: { badgeType: 'warning', label: '기술면접' },
    FINAL: { badgeType: 'pending', label: '최종면접' },
  };

  const { badgeType, label } = typeMap[type] || { badgeType: 'default', label: type };
  return <StatusBadge status={badgeType} label={label} />;
}

// Employment Type Badge (고용 유형)
export function RecruitmentEmploymentTypeBadge({
  type
}: {
  type: 'FULL_TIME' | 'CONTRACT' | 'INTERN' | 'PART_TIME'
}) {
  const typeMap: Record<string, { badgeType: StatusType; label: string }> = {
    FULL_TIME: { badgeType: 'success', label: '정규직' },
    CONTRACT: { badgeType: 'warning', label: '계약직' },
    INTERN: { badgeType: 'info', label: '인턴' },
    PART_TIME: { badgeType: 'default', label: '파트타임' },
  };

  const { badgeType, label } = typeMap[type] || { badgeType: 'default', label: type };
  return <StatusBadge status={badgeType} label={label} />;
}

// Interview Recommendation Badge (면접 추천)
export function InterviewRecommendationBadge({
  recommendation
}: {
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE'
}) {
  const recMap: Record<string, { badgeType: StatusType; label: string }> = {
    STRONG_HIRE: { badgeType: 'success', label: '강력 추천' },
    HIRE: { badgeType: 'info', label: '추천' },
    NO_HIRE: { badgeType: 'warning', label: '비추천' },
    STRONG_NO_HIRE: { badgeType: 'error', label: '강력 비추천' },
  };

  const { badgeType, label } = recMap[recommendation] || { badgeType: 'default', label: recommendation };
  return <StatusBadge status={badgeType} label={label} />;
}

// Offer Status Badge (채용 제안 상태)
export function OfferStatusBadge({
  status
}: {
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED'
}) {
  const statusMap: Record<string, { type: StatusType; label: string }> = {
    DRAFT: { type: 'default', label: '작성중' },
    SENT: { type: 'pending', label: '발송됨' },
    ACCEPTED: { type: 'success', label: '수락' },
    REJECTED: { type: 'error', label: '거절' },
    WITHDRAWN: { type: 'warning', label: '철회' },
    EXPIRED: { type: 'default', label: '만료' },
  };

  const { type, label } = statusMap[status] || { type: 'default', label: status };
  return <StatusBadge status={type} label={label} />;
}
