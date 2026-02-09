import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('auth');

  const handleLoginClick = () => {
    onOpenChange(false);
    navigate('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('sessionExpiredDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('sessionExpiredDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleLoginClick} className="w-full">
            {t('sessionExpiredDialog.goToLogin')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
