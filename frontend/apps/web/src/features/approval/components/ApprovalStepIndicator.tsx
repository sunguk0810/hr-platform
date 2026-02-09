import { useTranslation } from 'react-i18next';
import { Check, X, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ApprovalLineItem, ApprovalLineStatus } from './ApprovalLineFlow';

interface ApprovalStepIndicatorProps {
  steps: ApprovalLineItem[];
  compact?: boolean;
  className?: string;
}

const statusIcons: Record<ApprovalLineStatus, React.ReactNode> = {
  WAITING: <Clock className="h-4 w-4" />,
  CURRENT: <AlertCircle className="h-4 w-4" />,
  APPROVED: <Check className="h-4 w-4" />,
  REJECTED: <X className="h-4 w-4" />,
  SKIPPED: <ChevronRight className="h-4 w-4" />,
};

const statusColors: Record<ApprovalLineStatus, string> = {
  WAITING: 'bg-gray-100 text-gray-500 border-gray-300',
  CURRENT: 'bg-blue-100 text-blue-600 border-blue-500',
  APPROVED: 'bg-green-100 text-green-600 border-green-500',
  REJECTED: 'bg-red-100 text-red-600 border-red-500',
  SKIPPED: 'bg-gray-100 text-gray-400 border-gray-200',
};

const statusLabelKeys: Record<ApprovalLineStatus, string> = {
  WAITING: 'approvalStepIndicator.waiting',
  CURRENT: 'approvalStepIndicator.current',
  APPROVED: 'approvalStepIndicator.approved',
  REJECTED: 'approvalStepIndicator.rejected',
  SKIPPED: 'approvalStepIndicator.skipped',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ApprovalStepIndicator({
  steps,
  compact = false,
  className,
}: ApprovalStepIndicatorProps) {
  const { t } = useTranslation('approval');
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-1', className)}>
          {sortedSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2',
                      statusColors[step.status]
                    )}
                  >
                    {statusIcons[step.status]}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{step.approverName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(statusLabelKeys[step.status])}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
              {index < sortedSteps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-4',
                    step.status === 'APPROVED' || step.status === 'SKIPPED'
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Progress line */}
      <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200">
        <div
          className="w-full bg-green-500 transition-[width]"
          style={{
            height: `${
              ((sortedSteps.filter((s) => s.status === 'APPROVED' || s.status === 'SKIPPED').length) /
                sortedSteps.length) *
              100
            }%`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {sortedSteps.map((step) => (
          <div key={step.id} className="relative flex gap-4">
            {/* Status icon */}
            <div
              className={cn(
                'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-background',
                statusColors[step.status]
              )}
            >
              {statusIcons[step.status]}
              {step.status === 'CURRENT' && (
                <span className="absolute -inset-1 animate-ping rounded-full border-2 border-blue-500 opacity-25" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={step.approverImage} alt={step.approverName} />
                  <AvatarFallback className="text-xs">
                    {getInitials(step.approverName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{step.approverName}</p>
                  <p className="text-sm text-muted-foreground">
                    {step.approverPosition}
                    {step.approverDepartmentName && ` · ${step.approverDepartmentName}`}
                  </p>
                </div>
                <span
                  className={cn(
                    'ml-auto rounded px-2 py-0.5 text-xs font-medium',
                    statusColors[step.status]
                  )}
                >
                  {t(statusLabelKeys[step.status])}
                </span>
              </div>

              {step.comment && (
                <div className="mt-2 rounded-lg bg-muted p-2 text-sm">
                  "{step.comment}"
                </div>
              )}

              {step.completedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(step.completedAt).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ApprovalStepIndicator;
