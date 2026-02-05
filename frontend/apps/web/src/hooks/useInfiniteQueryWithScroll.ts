import { useInfiniteQuery, UseInfiniteQueryOptions, QueryKey } from '@tanstack/react-query';
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
  const infiniteQuery = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const response = await queryFn({ page: pageParam, size });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.page + 1;
    },
    initialPageParam: 0,
    enabled,
    staleTime,
    gcTime,
  } as UseInfiniteQueryOptions<PageResponse<T>, Error, { pages: PageResponse<T>[] }, PageResponse<T>, TQueryKey, number>);

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
  const allItems = infiniteQuery.data?.pages.flatMap((page) => page.content) ?? [];

  // Get total count from the first page
  const totalElements = infiniteQuery.data?.pages[0]?.totalElements ?? 0;

  return {
    ...infiniteQuery,
    sentinelRef,
    allItems,
    totalElements,
  };
}
