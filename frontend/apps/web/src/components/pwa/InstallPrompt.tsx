import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * PWA 설치 프롬프트 배너
 */
export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall, dismissInstall } = usePWAInstall();
  const isMobile = useIsMobile();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if user dismissed the prompt recently
    const dismissedAt = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, []);

  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (!accepted) {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
    dismissInstall();
    setIsDismissed(true);
  };

  return (
    <div
      className={cn(
        'fixed z-50 bg-card border shadow-lg',
        isMobile
          ? 'bottom-20 left-4 right-4 rounded-xl p-4'
          : 'bottom-4 right-4 rounded-lg p-4 max-w-sm'
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1 pr-4">
          <h3 className="font-medium text-sm">앱으로 설치하기</h3>
          <p className="text-xs text-muted-foreground mt-1">
            홈 화면에 추가하여 더 빠르게 접근하세요.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleDismiss}
        >
          나중에
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={handleInstall}
        >
          <Download className="h-4 w-4 mr-1" />
          설치
        </Button>
      </div>
    </div>
  );
}

export default InstallPrompt;
