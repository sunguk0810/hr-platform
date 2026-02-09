import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { t } = useTranslation('accessibility');
  return (
    <span
      role="status"
      aria-label={t('statusLabel', { label })}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {dot && (
        <span className="relative mr-1.5 flex h-2 w-2" aria-hidden="true">
          {pulse && (
            <AnimatePresence>
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.75 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'absolute inline-flex h-full w-full animate-ping rounded-full',
                  dotColors[status]
                )}
              />
            </AnimatePresence>
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

// --- Static type maps (locale-independent, module scope) ---

const approvalTypeMap: Record<string, StatusType> = {
  DRAFT: 'default',
  PENDING: 'pending',
  IN_REVIEW: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
  RECALLED: 'warning',
  CANCELED: 'default',
  CANCELLED: 'default',
};

const employmentTypeMap: Record<string, StatusType> = {
  ACTIVE: 'success',
  LEAVE: 'warning',
  ON_LEAVE: 'warning',
  RESIGNED: 'default',
  RETIRED: 'default',
  SUSPENDED: 'error',
};

const leaveTypeMap: Record<string, StatusType> = {
  PENDING: 'pending',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
};

const attendanceTypeMap: Record<string, StatusType> = {
  NORMAL: 'success',
  LATE: 'warning',
  EARLY_LEAVE: 'warning',
  ABSENT: 'error',
  HOLIDAY: 'info',
  WEEKEND: 'default',
  LEAVE: 'info',
  HALF_DAY: 'info',
  OVERTIME: 'pending',
};

const tenantTypeMap: Record<string, StatusType> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  SUSPENDED: 'error',
  PENDING: 'pending',
};

const leaveKindTypeMap: Record<string, StatusType> = {
  ANNUAL: 'info',
  SICK: 'warning',
  SPECIAL: 'success',
  HALF_DAY_AM: 'default',
  HALF_DAY_PM: 'default',
  HOURLY: 'pending',
  MATERNITY: 'info',
  PATERNITY: 'info',
  UNPAID: 'default',
};

const appointmentDraftTypeMap: Record<string, StatusType> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'pending',
  APPROVED: 'info',
  REJECTED: 'error',
  EXECUTED: 'success',
  CANCELLED: 'default',
};

const appointmentKindTypeMap: Record<string, StatusType> = {
  PROMOTION: 'success',
  TRANSFER: 'info',
  POSITION_CHANGE: 'info',
  JOB_CHANGE: 'info',
  LEAVE_OF_ABSENCE: 'warning',
  REINSTATEMENT: 'success',
  RESIGNATION: 'default',
  RETIREMENT: 'default',
  DEMOTION: 'error',
  CONCURRENT: 'pending',
};

const jobPostingTypeMap: Record<string, StatusType> = {
  DRAFT: 'default',
  PENDING: 'pending',
  PUBLISHED: 'success',
  CLOSED: 'warning',
  CANCELLED: 'error',
  COMPLETED: 'info',
};

const applicationTypeMap: Record<string, StatusType> = {
  RECEIVED: 'info',
  SCREENING: 'pending',
  IN_PROGRESS: 'warning',
  PASSED: 'success',
  FAILED: 'error',
  ON_HOLD: 'default',
  WITHDRAWN: 'default',
  HIRED: 'success',
};

const applicationStageTypeMap: Record<string, StatusType> = {
  DOCUMENT: 'default',
  FIRST_INTERVIEW: 'info',
  SECOND_INTERVIEW: 'info',
  FINAL_INTERVIEW: 'warning',
  OFFER: 'success',
};

const interviewTypeMap: Record<string, StatusType> = {
  SCHEDULING: 'default',
  SCHEDULED: 'pending',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'default',
  NO_SHOW: 'error',
  POSTPONED: 'info',
};

const interviewKindTypeMap: Record<string, StatusType> = {
  FIRST_ROUND: 'default',
  SECOND_ROUND: 'info',
  FINAL_ROUND: 'pending',
  TECHNICAL: 'warning',
  PERSONALITY: 'success',
  PRESENTATION: 'info',
  GROUP: 'default',
  VIDEO: 'info',
  PHONE: 'default',
};

const employmentKindTypeMap: Record<string, StatusType> = {
  FULL_TIME: 'success',
  CONTRACT: 'warning',
  INTERN: 'info',
  PART_TIME: 'default',
};

const recommendationTypeMap: Record<string, StatusType> = {
  STRONG_HIRE: 'success',
  HIRE: 'info',
  NO_HIRE: 'warning',
  STRONG_NO_HIRE: 'error',
};

const offerTypeMap: Record<string, StatusType> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'pending',
  APPROVED: 'info',
  SENT: 'pending',
  ACCEPTED: 'success',
  DECLINED: 'error',
  NEGOTIATING: 'warning',
  EXPIRED: 'default',
  CANCELLED: 'default',
};

// --- Preset status badges ---

export function ApprovalStatusBadge({
  status
}: {
  status: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'RECALLED' | 'CANCELED' | 'CANCELLED'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={approvalTypeMap[status] ?? 'default'} label={t(`approval.${status}`, status)} />;
}

export function EmploymentStatusBadge({
  status
}: {
  status: 'ACTIVE' | 'LEAVE' | 'ON_LEAVE' | 'RESIGNED' | 'RETIRED' | 'SUSPENDED'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={employmentTypeMap[status] ?? 'default'} label={t(`employment.${status}`, status)} />;
}

export function LeaveStatusBadge({
  status
}: {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={leaveTypeMap[status] ?? 'default'} label={t(`leave.${status}`, status)} />;
}

export function AttendanceStatusBadge({
  status
}: {
  status: 'NORMAL' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'HOLIDAY' | 'WEEKEND' | 'LEAVE' | 'HALF_DAY' | 'OVERTIME'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={attendanceTypeMap[status] ?? 'default'} label={t(`attendance.${status}`, status)} />;
}

export function TenantStatusBadge({
  status
}: {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={tenantTypeMap[status] ?? 'default'} label={t(`tenant.${status}`, status)} />;
}

export function LeaveTypeBadge({
  type
}: {
  type: 'ANNUAL' | 'SICK' | 'SPECIAL' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'HOURLY' | 'MATERNITY' | 'PATERNITY' | 'UNPAID'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={leaveKindTypeMap[type] ?? 'default'} label={t(`leaveType.${type}`, type)} />;
}

// Appointment (발령) Status Badge
export function AppointmentDraftStatusBadge({
  status
}: {
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={appointmentDraftTypeMap[status] ?? 'default'} label={t(`appointmentDraft.${status}`, status)} />;
}

// Appointment Type Badge
export function AppointmentTypeBadge({
  type
}: {
  type: 'PROMOTION' | 'TRANSFER' | 'POSITION_CHANGE' | 'JOB_CHANGE' | 'LEAVE_OF_ABSENCE' | 'REINSTATEMENT' | 'RESIGNATION' | 'RETIREMENT' | 'DEMOTION' | 'CONCURRENT'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={appointmentKindTypeMap[type] ?? 'default'} label={t(`appointmentType.${type}`, type)} />;
}

// Job Posting Status Badge (채용공고 상태)
export function JobStatusBadge({
  status
}: {
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED' | 'COMPLETED'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={jobPostingTypeMap[status] ?? 'default'} label={t(`jobPosting.${status}`, status)} />;
}

// Application Status Badge (지원서 상태)
export function ApplicationStatusBadge({
  status
}: {
  status: 'RECEIVED' | 'SCREENING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'ON_HOLD' | 'WITHDRAWN' | 'HIRED'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={applicationTypeMap[status] ?? 'default'} label={t(`application.${status}`, status)} />;
}

// Application Stage Badge (지원 단계)
export function ApplicationStageBadge({
  stage
}: {
  stage: 'DOCUMENT' | 'FIRST_INTERVIEW' | 'SECOND_INTERVIEW' | 'FINAL_INTERVIEW' | 'OFFER'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={applicationStageTypeMap[stage] ?? 'default'} label={t(`applicationStage.${stage}`, stage)} />;
}

// Interview Status Badge (면접 상태)
export function InterviewStatusBadge({
  status
}: {
  status: 'SCHEDULING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'POSTPONED'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={interviewTypeMap[status] ?? 'default'} label={t(`interview.${status}`, status)} />;
}

// Interview Type Badge (면접 유형)
export function InterviewTypeBadge({
  type
}: {
  type: 'FIRST_ROUND' | 'SECOND_ROUND' | 'FINAL_ROUND' | 'TECHNICAL' | 'PERSONALITY' | 'PRESENTATION' | 'GROUP' | 'VIDEO' | 'PHONE'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={interviewKindTypeMap[type] ?? 'default'} label={t(`interviewType.${type}`, type)} />;
}

// Employment Type Badge (고용 유형)
export function RecruitmentEmploymentTypeBadge({
  type
}: {
  type: 'FULL_TIME' | 'CONTRACT' | 'INTERN' | 'PART_TIME'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={employmentKindTypeMap[type] ?? 'default'} label={t(`employmentType.${type}`, type)} />;
}

// Interview Recommendation Badge (면접 추천)
export function InterviewRecommendationBadge({
  recommendation
}: {
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={recommendationTypeMap[recommendation] ?? 'default'} label={t(`recommendation.${recommendation}`, recommendation)} />;
}

// Offer Status Badge (채용 제안 상태)
export function OfferStatusBadge({
  status
}: {
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'NEGOTIATING' | 'EXPIRED' | 'CANCELLED'
}) {
  const { t } = useTranslation('status');
  return <StatusBadge status={offerTypeMap[status] ?? 'default'} label={t(`offer.${status}`, status)} />;
}
