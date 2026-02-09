import { useTranslation } from 'react-i18next';
import { User, ChevronRight, Zap, GitFork, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalMode, RecommendedApprover } from '@hr-platform/shared-types';

interface ApproverInfo {
  id: string;
  name: string;
  department: string;
  position: string;
}

interface ApprovalLinePreviewBaseProps {
  requesterName: string;
  approvers: ApproverInfo[] | RecommendedApprover[];
  className?: string;
}

interface ApprovalLinePreviewWithMode extends ApprovalLinePreviewBaseProps {
  mode: ApprovalMode;
}

interface ApprovalLinePreviewSimple extends ApprovalLinePreviewBaseProps {
  mode?: undefined;
}

type ApprovalLinePreviewProps = ApprovalLinePreviewWithMode | ApprovalLinePreviewSimple;

/**
 * A reusable visual preview of the approval line shown as a horizontal stepper.
 * Displays: 기안자 -> 결재자1 -> 결재자2 -> ... for SEQUENTIAL mode (or no mode)
 * Displays: 기안자 -> 최종결재자 for DIRECT mode
 * Displays: 기안자 -> [결재자1, 결재자2, ...] (fan-out) for PARALLEL mode
 * Displays: 기안자 -> [합의자1, 합의자2, ...] -> 최종결재자 for CONSENSUS mode
 */
export function ApprovalLinePreview({
  mode,
  requesterName,
  approvers,
  className,
}: ApprovalLinePreviewProps) {
  const { t } = useTranslation('approval');

  if (approvers.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto py-2', className)}>
      {/* Requester (기안자) */}
      <div className="flex flex-col items-center min-w-[72px] flex-shrink-0">
        <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
        <p className="text-xs mt-1 font-medium truncate max-w-[72px]">{requesterName}</p>
        <p className="text-[10px] text-muted-foreground">{t('approvalLinePreview.requester')}</p>
      </div>

      {/* Arrow connector */}
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />

      {/* Approvers */}
      {mode === 'DIRECT' ? (
        /* DIRECT mode: show only the single final approver */
        <div className="flex flex-col items-center min-w-[72px] flex-shrink-0">
          <div className="h-9 w-9 rounded-full bg-teal-500 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <p className="text-xs mt-1 font-medium truncate max-w-[72px]">
            {approvers[0].name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {approvers[0].position}
          </p>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
            {t('approvalLinePreview.finalApprover')}
          </span>
        </div>
      ) : mode === 'PARALLEL' ? (
        /* PARALLEL mode: fan-out layout - all approvers in a group */
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="flex items-center gap-0.5 mb-1">
            <GitFork className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{t('approvalLinePreview.simultaneous')}</span>
          </div>
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30">
            {approvers.map((approver) => (
              <div key={approver.id} className="flex flex-col items-center min-w-[64px]">
                <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-medium text-white">
                  <User className="h-4 w-4" />
                </div>
                <p className="text-xs mt-1 font-medium truncate max-w-[64px]">
                  {approver.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {approver.position}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : mode === 'CONSENSUS' ? (
        /* CONSENSUS mode: consensus group + final approver */
        <>
          {approvers.length > 1 ? (
            <>
              {/* Consensus group (all except last) */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="flex items-center gap-0.5 mb-1">
                  <Handshake className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">{t('approvalLinePreview.agreement')}</span>
                </div>
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30">
                  {approvers.slice(0, -1).map((approver) => (
                    <div key={approver.id} className="flex flex-col items-center min-w-[64px]">
                      <div className="h-9 w-9 rounded-full bg-purple-500 flex items-center justify-center text-sm font-medium text-white">
                        <User className="h-4 w-4" />
                      </div>
                      <p className="text-xs mt-1 font-medium truncate max-w-[64px]">
                        {approver.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {approver.position}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              {/* Final approver */}
              <div className="flex flex-col items-center min-w-[72px] flex-shrink-0">
                <div className="h-9 w-9 rounded-full bg-purple-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs mt-1 font-medium truncate max-w-[72px]">
                  {approvers[approvers.length - 1].name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {approvers[approvers.length - 1].position}
                </p>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                  {t('approvalLinePreview.finalApproval')}
                </span>
              </div>
            </>
          ) : (
            /* Only one approver in consensus = single final approver */
            <div className="flex flex-col items-center min-w-[72px] flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-purple-700 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <p className="text-xs mt-1 font-medium truncate max-w-[72px]">
                {approvers[0].name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {approvers[0].position}
              </p>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                {t('approvalLinePreview.finalApproval')}
              </span>
            </div>
          )}
        </>
      ) : (
        /* SEQUENTIAL mode (or no mode): show all approvers in order */
        approvers.map((approver, index) => (
          <div key={approver.id} className="flex items-center gap-1">
            <div className="flex flex-col items-center min-w-[72px] flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <p className="text-xs mt-1 font-medium truncate max-w-[72px]">
                {approver.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {approver.position}
              </p>
              {'department' in approver && approver.department && (
                <p className="text-[10px] text-muted-foreground/70">
                  {approver.department}
                </p>
              )}
            </div>
            {index < approvers.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))
      )}
    </div>
  );
}
