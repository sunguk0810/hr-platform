import { ReactNode, RefCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface InfiniteListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  sentinelRef: RefCallback<HTMLDivElement> | React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage: boolean;
  emptyState?: ReactNode;
  className?: string;
  itemClassName?: string;
}

export function InfiniteList<T>({
  items,
  renderItem,
  keyExtractor,
  sentinelRef,
  isLoading,
  isFetchingNextPage = false,
  hasNextPage,
  emptyState,
  className,
  itemClassName,
}: InfiniteListProps<T>) {
  const { t } = useTranslation();

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn('space-y-3', className)} role="list">
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)} className={itemClassName} role="listitem">
          {renderItem(item, index)}
        </div>
      ))}

      {/* Sentinel element for infinite scroll */}
      <div
        ref={sentinelRef as RefCallback<HTMLDivElement>}
        className="h-10 flex items-center justify-center"
        aria-hidden="true"
      >
        {isFetchingNextPage && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
          </div>
        )}
        {!hasNextPage && items.length > 0 && (
          <p className="text-muted-foreground text-sm">{t('common.allLoaded')}</p>
        )}
      </div>
    </div>
  );
}
