import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SessionExpiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionExpiredDialog({ open, onOpenChange }: SessionExpiredDialogProps) {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    onOpenChange(false);
    navigate('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>세션 만료</DialogTitle>
          <DialogDescription>
            로그인 세션이 만료되었습니다. 다시 로그인해주세요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleLoginClick} className="w-full">
            로그인 페이지로 이동
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
