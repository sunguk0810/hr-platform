import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshContainerProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

/**
 * 모바일 풀투리프레시 컨테이너 컴포넌트
 * 터치 디바이스에서 아래로 당겨 새로고침 기능 제공
 */
export function PullToRefreshContainer({
  children,
  onRefresh,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshContainerProps) {
  const { t } = useTranslation('common');
  const { isPulling, isRefreshing, pullProgress, pullDistance, handlers } = usePullToRefresh({
    onRefresh,
    threshold,
  });

  return (
    <div
      className={cn('min-h-full', className)}
      {...(disabled ? {} : handlers)}
    >
      {/* Pull to refresh indicator */}
      {(isPulling || isRefreshing) && !disabled && (
        <div
          className="flex justify-center items-center overflow-hidden transition-[height] duration-200 ease-out"
          style={{ height: pullDistance }}
        >
          <div className="flex flex-col items-center gap-1">
            <RefreshCw
              className={cn(
                'h-6 w-6 text-primary transition-transform',
                isRefreshing && 'animate-spin',
                pullProgress >= 1 && !isRefreshing && 'text-green-500'
              )}
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
              }}
            />
            <span className="text-xs text-muted-foreground">
              {isRefreshing
                ? t('refreshing')
                : pullProgress >= 1
                  ? t('component.releaseToRefresh')
                  : t('component.pullToRefresh')}
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export default PullToRefreshContainer;
