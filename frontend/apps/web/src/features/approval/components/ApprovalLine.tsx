import { useTranslation } from 'react-i18next';
import { Check, Clock, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalLine as ApprovalLineType } from '@hr-platform/shared-types';

interface ApprovalLineProps {
  steps: ApprovalLineType[];
  requesterName: string;
  className?: string;
}

export function ApprovalLine({ steps, requesterName, className }: ApprovalLineProps) {
  const { t } = useTranslation('approval');

  const getStepIcon = (status: ApprovalLineType['status']) => {
    switch (status) {
      case 'APPROVED':
        return <Check className="h-4 w-4 text-white" />;
      case 'REJECTED':
        return <X className="h-4 w-4 text-white" />;
      case 'SKIPPED':
        return <span className="text-xs text-white">-</span>;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepBgColor = (status: ApprovalLineType['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500';
      case 'REJECTED':
        return 'bg-red-500';
      case 'SKIPPED':
        return 'bg-gray-400';
      default:
        return 'bg-muted border-2 border-muted-foreground/20';
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Requester (기안자) */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{requesterName}</p>
          <p className="text-xs text-muted-foreground">{t('approvalLine.requester')}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Steps */}
      {steps.map((step) => (
        <div key={step.id} className="relative">
          {/* Connector line */}
          <div
            className={cn(
              'absolute left-5 -top-4 w-0.5 h-4',
              step.status === 'APPROVED' ? 'bg-green-500' :
              step.status === 'REJECTED' ? 'bg-red-500' :
              'bg-muted-foreground/20'
            )}
          />

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {step.sequence}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{step.approverName || t('approvalLine.approver')}</p>
              <p className="text-xs text-muted-foreground">
                {step.status === 'WAITING' ? t('approvalLine.waitingForApproval') :
                 step.status === 'APPROVED' ? t('approvalStepIndicator.approved') :
                 step.status === 'REJECTED' ? t('approvalStepIndicator.rejected') :
                 t('approvalStepIndicator.skipped')}
              </p>
              {step.comment && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  "{step.comment}"
                </p>
              )}
            </div>
            <div className={cn(
              'h-8 w-8 rounded-full flex items-center justify-center',
              getStepBgColor(step.status)
            )}>
              {getStepIcon(step.status)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ApprovalLineHorizontalProps {
  steps: ApprovalLineType[];
  requesterName: string;
  className?: string;
}

export function ApprovalLineHorizontal({ steps, requesterName, className }: ApprovalLineHorizontalProps) {
  const { t } = useTranslation('approval');

  const getStepBgColor = (status: ApprovalLineType['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500 text-white';
      case 'REJECTED':
        return 'bg-red-500 text-white';
      case 'SKIPPED':
        return 'bg-gray-400 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto', className)}>
      {/* Requester */}
      <div className="flex flex-col items-center min-w-[80px]">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <p className="text-xs mt-1 font-medium truncate max-w-[80px]">{requesterName}</p>
        <p className="text-xs text-muted-foreground">{t('approvalLine.draft')}</p>
      </div>

      {/* Arrow */}
      <div className="h-0.5 w-8 bg-green-500" />

      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className="flex flex-col items-center min-w-[80px]">
            <div className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium',
              getStepBgColor(step.status)
            )}>
              {step.status === 'APPROVED' ? <Check className="h-5 w-5" /> :
               step.status === 'REJECTED' ? <X className="h-5 w-5" /> :
               step.sequence}
            </div>
            <p className="text-xs mt-1 font-medium truncate max-w-[80px]">
              {step.approverName || t('approvalLine.approver')}
            </p>
            <p className="text-xs text-muted-foreground">
              {step.status === 'WAITING' ? t('approvalStepIndicator.waiting') :
               step.status === 'APPROVED' ? t('approvalStepIndicator.approved') :
               step.status === 'REJECTED' ? t('approvalStepIndicator.rejected') : '-'}
            </p>
          </div>

          {index < steps.length - 1 && (
            <div className={cn(
              'h-0.5 w-8',
              step.status === 'APPROVED' ? 'bg-green-500' :
              step.status === 'REJECTED' ? 'bg-red-500' :
              'bg-muted-foreground/20'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
