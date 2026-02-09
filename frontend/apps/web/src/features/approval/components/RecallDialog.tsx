import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
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

interface RecallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
  documentTitle?: string;
}

export function RecallDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  documentTitle,
}: RecallDialogProps) {
  const { t } = useTranslation('approval');
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    await onConfirm(reason.trim());
    setReason('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            {t('recallDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {documentTitle ? (
              <>{t('recallDialog.confirmWithTitle', { title: documentTitle })}</>
            ) : (
              t('recallDialog.confirmDefault')
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Alert variant="destructive" className="bg-orange-50 border-orange-200 text-orange-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <span dangerouslySetInnerHTML={{ __html: t('recallDialog.warningText') }} />
              <br />
              {t('recallDialog.warningSubtext')}
            </AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <Label htmlFor="recall-reason">
              {t('recallDialog.reasonLabel')} <span className="text-destructive">{t('recallDialog.reasonRequired')}</span>
            </Label>
            <Textarea
              id="recall-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('recallDialog.reasonPlaceholder')}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {t('recallDialog.reasonNote')}
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? t('common.processing') : t('recallDialog.confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RecallDialog;
