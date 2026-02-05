import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import {
  announcementService,
  type AnnouncementListParams,
  type CreateAnnouncementRequest,
  type UpdateAnnouncementRequest,
} from '../services/announcementService';

export const announcementQueryKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementQueryKeys.all, 'list'] as const,
  list: (params: AnnouncementListParams) => [...announcementQueryKeys.lists(), params] as const,
  details: () => [...announcementQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...announcementQueryKeys.details(), id] as const,
};

export function useAnnouncementSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchState = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '0', 10),
    category: searchParams.get('category') || '',
    keyword: searchParams.get('keyword') || '',
  }), [searchParams]);

  const setCategory = useCallback((category: string) => {
    setSearchParams((prev) => {
      if (category) {
        prev.set('category', category);
      } else {
        prev.delete('category');
      }
      prev.set('page', '0');
      return prev;
    });
  }, [setSearchParams]);

  const setKeyword = useCallback((keyword: string) => {
    setSearchParams((prev) => {
      if (keyword) {
        prev.set('keyword', keyword);
      } else {
        prev.delete('keyword');
      }
      prev.set('page', '0');
      return prev;
    });
  }, [setSearchParams]);

  const setPage = useCallback((page: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(page));
      return prev;
    });
  }, [setSearchParams]);

  const params: AnnouncementListParams = useMemo(() => ({
    page: searchState.page,
    size: 10,
    ...(searchState.category && { category: searchState.category }),
    ...(searchState.keyword && { keyword: searchState.keyword }),
  }), [searchState]);

  return {
    params,
    searchState,
    setCategory,
    setKeyword,
    setPage,
  };
}

export function useAnnouncementList(params: AnnouncementListParams) {
  return useQuery({
    queryKey: announcementQueryKeys.list(params),
    queryFn: () => announcementService.getList(params),
  });
}

export function useInfiniteAnnouncementList(params: Omit<AnnouncementListParams, 'page'>) {
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...announcementQueryKeys.lists(), 'infinite', params],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await announcementService.getList({ ...params, page: pageParam });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.page + 1;
    },
    initialPageParam: 0,
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

  const allItems = infiniteQuery.data?.pages.flatMap((page) => page.content) ?? [];

  return {
    ...infiniteQuery,
    sentinelRef,
    allItems,
  };
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: announcementQueryKeys.detail(id),
    queryFn: () => announcementService.getDetail(id),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAnnouncementRequest) => announcementService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.lists() });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementRequest }) =>
      announcementService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.lists() });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => announcementService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.lists() });
    },
  });
}
