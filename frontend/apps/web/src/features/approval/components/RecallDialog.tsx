import { useState } from 'react';
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
            결재 회수
          </DialogTitle>
          <DialogDescription>
            {documentTitle ? (
              <>"{documentTitle}" 문서를 회수하시겠습니까?</>
            ) : (
              '이 결재 문서를 회수하시겠습니까?'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Alert variant="destructive" className="bg-orange-50 border-orange-200 text-orange-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              회수된 문서는 <strong>회수됨</strong> 상태로 변경되며, 결재 진행이 중단됩니다.
              <br />
              회수 후에는 동일 내용으로 새로 기안해야 합니다.
            </AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <Label htmlFor="recall-reason">
              회수 사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="recall-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="회수 사유를 입력하세요. (예: 첨부파일 누락, 내용 수정 필요 등)"
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              회수 사유는 결재 이력에 기록됩니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? '처리 중...' : '회수하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RecallDialog;
