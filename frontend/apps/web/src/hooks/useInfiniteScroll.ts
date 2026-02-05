import { useEffect, useRef, useCallback } from 'react';

export interface UseInfiniteScrollOptions {
  /**
   * 다음 페이지 로드 함수
   */
  onLoadMore: () => void;
  /**
   * 더 불러올 데이터가 있는지 여부
   */
  hasMore: boolean;
  /**
   * 로딩 중인지 여부
   */
  isLoading: boolean;
  /**
   * 트리거 영역의 threshold (0-1, 기본값: 0)
   */
  threshold?: number;
  /**
   * 트리거 영역의 rootMargin (기본값: '100px')
   */
  rootMargin?: string;
  /**
   * 비활성화 여부
   */
  disabled?: boolean;
}

/**
 * 무한 스크롤 hook
 * IntersectionObserver를 사용하여 스크롤 끝에 도달하면 다음 페이지를 로드합니다.
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 0,
  rootMargin = '100px',
  disabled = false,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading && !disabled) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoading, disabled]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  return {
    /**
     * 스크롤 끝에 배치할 sentinel element ref
     */
    sentinelRef,
  };
}

export default useInfiniteScroll;
