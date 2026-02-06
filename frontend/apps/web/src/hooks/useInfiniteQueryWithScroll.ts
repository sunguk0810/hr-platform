import { useInfiniteQuery, QueryKey } from '@tanstack/react-query';
import { PageResponse } from '@/lib/apiClient';
import { useInfiniteScroll } from './useInfiniteScroll';

interface UseInfiniteQueryWithScrollOptions<T, TQueryKey extends QueryKey> {
  queryKey: TQueryKey;
  queryFn: (params: { page: number; size: number }) => Promise<{ data: PageResponse<T> }>;
  size?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export function useInfiniteQueryWithScroll<T, TQueryKey extends QueryKey = QueryKey>({
  queryKey,
  queryFn,
  size = 20,
  enabled = true,
  staleTime,
  gcTime,
}: UseInfiniteQueryWithScrollOptions<T, TQueryKey>) {
  const infiniteQuery = useInfiniteQuery<PageResponse<T>, Error, { pages: PageResponse<T>[] }, TQueryKey, number>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const response = await queryFn({ page: pageParam, size });
      return response.data;
    },
    getNextPageParam: (lastPage: PageResponse<T>) => {
      if (lastPage.page.last) return undefined;
      return lastPage.page.number + 1;
    },
    initialPageParam: 0,
    enabled,
    staleTime,
    gcTime,
  });

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: () => {
      if (infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
        infiniteQuery.fetchNextPage();
      }
    },
    hasMore: !!infiniteQuery.hasNextPage,
    isLoading: infiniteQuery.isFetchingNextPage,
  });

  // Flatten all pages into a single array
  const allItems = infiniteQuery.data?.pages.flatMap((page: PageResponse<T>) => page.content) ?? [];

  // Get total count from the first page
  const totalElements = infiniteQuery.data?.pages[0]?.page?.totalElements ?? 0;

  return {
    ...infiniteQuery,
    sentinelRef,
    allItems,
    totalElements,
  };
}
