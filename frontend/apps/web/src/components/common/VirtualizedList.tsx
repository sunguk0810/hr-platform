import { useRef, ReactNode, CSSProperties } from 'react';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

export interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, virtualItem: VirtualItem) => ReactNode;
  estimateSize?: number | ((index: number) => number);
  overscan?: number;
  horizontal?: boolean;
  className?: string;
  containerClassName?: string;
  getItemKey?: (index: number, item: T) => string | number;
  paddingStart?: number;
  paddingEnd?: number;
  gap?: number;
  emptyMessage?: ReactNode;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 50,
  overscan = 5,
  horizontal = false,
  className,
  containerClassName,
  getItemKey,
  paddingStart = 0,
  paddingEnd = 0,
  gap = 0,
  emptyMessage,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof estimateSize === 'function' ? estimateSize : () => estimateSize,
    overscan,
    horizontal,
    getItemKey: getItemKey ? (index) => getItemKey(index, items[index]) : undefined,
    paddingStart,
    paddingEnd,
    gap,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-8 text-muted-foreground',
          className
        )}
      >
        {emptyMessage || '데이터가 없습니다.'}
      </div>
    );
  }

  const totalSize = virtualizer.getTotalSize();

  const containerStyle: CSSProperties = horizontal
    ? { width: `${totalSize}px`, height: '100%', position: 'relative' }
    : { height: `${totalSize}px`, width: '100%', position: 'relative' };

  return (
    <div
      ref={parentRef}
      className={cn(
        'overflow-auto',
        horizontal ? 'overflow-x-auto overflow-y-hidden' : 'overflow-y-auto overflow-x-hidden',
        className
      )}
    >
      <div style={containerStyle} className={containerClassName}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          const style: CSSProperties = horizontal
            ? {
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${virtualItem.size}px`,
                transform: `translateX(${virtualItem.start}px)`,
              }
            : {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              };

          return (
            <div key={virtualItem.key} style={style} data-index={virtualItem.index}>
              {renderItem(item, virtualItem.index, virtualItem)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook to use virtualizer directly for more control
 */
export { useVirtualizer };

export default VirtualizedList;
