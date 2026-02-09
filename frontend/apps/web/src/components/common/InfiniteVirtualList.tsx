import { useRef, ReactNode, CSSProperties, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface InfiniteVirtualListProps<T> {
  /**
   * 렌더링할 아이템 배열
   */
  items: T[];
  /**
   * 아이템 렌더링 함수
   */
  renderItem: (item: T, index: number) => ReactNode;
  /**
   * 아이템 높이 추정값 (기본값: 80)
   */
  estimateSize?: number;
  /**
   * 오버스캔 아이템 수 (기본값: 5)
   */
  overscan?: number;
  /**
   * 아이템 간 간격 (기본값: 0)
   */
  gap?: number;
  /**
   * 더 불러올 데이터가 있는지 여부
   */
  hasMore?: boolean;
  /**
   * 로딩 중인지 여부
   */
  isLoading?: boolean;
  /**
   * 다음 페이지 로드 함수
   */
  onLoadMore?: () => void;
  /**
   * 컨테이너 className
   */
  className?: string;
  /**
   * 아이템 키 생성 함수
   */
  getItemKey?: (index: number, item: T) => string | number;
  /**
   * 빈 상태 렌더링
   */
  emptyState?: ReactNode;
  /**
   * 로딩 상태 텍스트
   */
  loadingText?: string;
  /**
   * 끝 도달 텍스트
   */
  endText?: string;
  /**
   * 무한 스크롤 비활성화
   */
  disableInfiniteScroll?: boolean;
}

/**
 * 무한 스크롤 + 가상화 리스트 컴포넌트
 *
 * @example
 * ```tsx
 * <InfiniteVirtualList
 *   items={employees}
 *   renderItem={(employee) => <EmployeeCard employee={employee} />}
 *   hasMore={hasNextPage}
 *   isLoading={isFetchingNextPage}
 *   onLoadMore={fetchNextPage}
 *   estimateSize={100}
 *   gap={12}
 * />
 * ```
 */
export function InfiniteVirtualList<T>({
  items,
  renderItem,
  estimateSize = 80,
  overscan = 5,
  gap = 0,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  className,
  getItemKey,
  emptyState,
  loadingText,
  endText,
  disableInfiniteScroll = false,
}: InfiniteVirtualListProps<T>) {
  const { t } = useTranslation('common');
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
    getItemKey: getItemKey ? (index) => getItemKey(index, items[index]) : undefined,
    gap,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (disableInfiniteScroll || !onLoadMore) return;

    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        root: parentRef.current,
        rootMargin: '100px',
        threshold: 0,
      }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore, disableInfiniteScroll]);

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        {emptyState || (
          <p className="text-muted-foreground">{t('noData')}</p>
        )}
      </div>
    );
  }

  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className={cn('h-full overflow-y-auto overflow-x-hidden', className)}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          const style: CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`,
          };

          return (
            <div key={virtualItem.key} style={style} data-index={virtualItem.index}>
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>

      {/* Load more sentinel & status */}
      <div
        ref={loadMoreRef}
        className="flex items-center justify-center py-4 text-sm text-muted-foreground"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>{loadingText ?? t('loading')}</span>
          </div>
        ) : !hasMore && items.length > 0 ? (
          <span>{endText ?? t('allLoaded')}</span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * 간단한 무한 스크롤 리스트 (가상화 없음)
 * 아이템 수가 적은 경우 사용
 */
export interface SimpleInfiniteListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  className?: string;
  emptyState?: ReactNode;
  loadingText?: string;
  endText?: string;
}

export function SimpleInfiniteList<T>({
  items,
  renderItem,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  className,
  emptyState,
  loadingText,
  endText,
}: SimpleInfiniteListProps<T>) {
  const { t } = useTranslation('common');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore) return;

    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0,
      }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (items.length === 0 && !isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        {emptyState || (
          <p className="text-muted-foreground">{t('noData')}</p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}

      {/* Load more sentinel & status */}
      <div
        ref={loadMoreRef}
        className="flex items-center justify-center py-4 text-sm text-muted-foreground"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>{loadingText ?? t('loading')}</span>
          </div>
        ) : !hasMore && items.length > 0 ? (
          <span>{endText ?? t('allLoaded')}</span>
        ) : null}
      </div>
    </div>
  );
}

export default InfiniteVirtualList;
