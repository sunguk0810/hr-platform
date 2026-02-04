import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { announcementService, type AnnouncementListParams } from '../services/announcementService';

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

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: announcementQueryKeys.detail(id),
    queryFn: () => announcementService.getDetail(id),
    enabled: !!id,
  });
}
