import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FastForward, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ApprovalLine } from '@hr-platform/shared-types';

interface DirectApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (skipToStep: number | undefined, reason: string) => Promise<void>;
  isLoading?: boolean;
  steps: ApprovalLine[];
  currentStepOrder: number;
}

export function DirectApproveDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  steps,
  currentStepOrder,
}: DirectApproveDialogProps) {
  const { t } = useTranslation('approval');
  const [reason, setReason] = useState('');
  const [skipOption, setSkipOption] = useState<'current' | 'final'>('current');

  const pendingSteps = steps.filter(
    (step) => step.sequence >= currentStepOrder && step.status === 'WAITING'
  );
  const finalStepOrder = Math.max(...steps.map((s) => s.sequence));
  const hasMultipleSteps = pendingSteps.length > 1;

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    const skipToStep = skipOption === 'final' ? finalStepOrder : undefined;
    await onConfirm(skipToStep, reason.trim());
    resetState();
  };

  const resetState = () => {
    setReason('');
    setSkipOption('current');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FastForward className="h-5 w-5 text-teal-500" />
            {t('directApproveDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('directApproveDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Alert className="bg-teal-50 border-teal-200 text-teal-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('directApproveDialog.alertText')}
              <br />
              {t('directApproveDialog.alertSubtext')}
            </AlertDescription>
          </Alert>

          {/* 전결 범위 선택 (단계가 여러 개일 때만 표시) */}
          {hasMultipleSteps && (
            <div className="grid gap-2">
              <Label>{t('directApproveDialog.scopeLabel')}</Label>
              <RadioGroup
                value={skipOption}
                onValueChange={(value) => setSkipOption(value as 'current' | 'final')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50">
                  <RadioGroupItem value="current" id="current-step" />
                  <Label
                    htmlFor="current-step"
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <div className="font-medium">{t('directApproveDialog.scopeCurrentOnly')}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('directApproveDialog.scopeCurrentDesc', { step: currentStepOrder })}
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-muted/50">
                  <RadioGroupItem value="final" id="final-step" />
                  <Label
                    htmlFor="final-step"
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <div className="font-medium">{t('directApproveDialog.scopeToFinal')}</div>
                    <div className="text-xs text-muted-foreground">
                      {t('directApproveDialog.scopeToFinalDesc', { from: currentStepOrder, to: finalStepOrder })}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* 전결될 단계 표시 */}
          <div className="rounded-lg bg-muted/50 p-3">
            <Label className="text-xs text-muted-foreground">{t('directApproveDialog.targetStepsLabel')}</Label>
            <div className="mt-2 space-y-1">
              {pendingSteps
                .filter((step) =>
                  skipOption === 'final'
                    ? step.sequence <= finalStepOrder
                    : step.sequence === currentStepOrder
                )
                .map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-medium text-white">
                      {step.sequence}
                    </span>
                    <span>{step.approverName || t('approvalLine.approver')}</span>
                    {step.approverPosition && (
                      <span className="text-muted-foreground">
                        · {step.approverPosition}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* 전결 사유 */}
          <div className="grid gap-2">
            <Label htmlFor="direct-approve-reason">
              {t('directApproveDialog.reasonLabel')} <span className="text-destructive">{t('directApproveDialog.reasonRequired')}</span>
            </Label>
            <Textarea
              id="direct-approve-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('directApproveDialog.reasonPlaceholder')}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {t('directApproveDialog.reasonNote')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? t('common.processing') : t('directApproveDialog.confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DirectApproveDialog;
