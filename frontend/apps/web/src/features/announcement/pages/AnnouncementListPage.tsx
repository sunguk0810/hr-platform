import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Search, Pin, Paperclip, Eye, Plus, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  useAnnouncementList,
  useInfiniteAnnouncementList,
  useAnnouncementSearchParams,
} from '../hooks/useAnnouncements';
import { InfiniteList } from '@/components/ui/InfiniteList';
import type { AnnouncementListItem } from '@hr-platform/shared-types';

const ADMIN_ROLES = ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'];

const CATEGORY_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  NOTICE: { label: '공지', variant: 'default' },
  EVENT: { label: '이벤트', variant: 'secondary' },
  UPDATE: { label: '업데이트', variant: 'outline' },
  URGENT: { label: '긴급', variant: 'destructive' },
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function AnnouncementListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAnyRole } = useAuthStore();
  const canWrite = hasAnyRole(ADMIN_ROLES);
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

  const {
    params,
    searchState,
    setKeyword,
    setCategory,
    setPage,
  } = useAnnouncementSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  // Desktop: paginated query
  const { data, isLoading, isError } = useAnnouncementList(params);

  // Mobile: infinite scroll query
  const infiniteParams = useMemo(() => ({
    size: 15,
    ...(searchState.category && { category: searchState.category }),
    ...(searchState.keyword && { keyword: searchState.keyword }),
  }), [searchState.category, searchState.keyword]);

  const {
    allItems: infiniteAnnouncements,
    isLoading: isInfiniteLoading,
    isFetchingNextPage,
    hasNextPage,
    sentinelRef,
    refetch: refetchInfinite,
  } = useInfiniteAnnouncementList(infiniteParams);

  const announcements = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  const handleRowClick = (id: string) => {
    navigate(`/announcements/${id}`);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    await refetchInfinite();
  };

  const renderMobileAnnouncementItem = (announcement: AnnouncementListItem) => {
    const categoryInfo = CATEGORY_LABELS[announcement.category] || { label: announcement.category, variant: 'outline' as const };
    return (
      <button
        onClick={() => handleRowClick(announcement.id)}
        className="w-full bg-card rounded-xl border p-4 text-left transition-colors active:bg-muted"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={categoryInfo.variant} className="text-xs">
                {categoryInfo.label}
              </Badge>
              {announcement.isPinned && (
                <Pin className="h-3 w-3 text-primary" />
              )}
            </div>
            <p className="font-medium text-sm truncate">{announcement.title}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{announcement.authorName}</span>
              <span>•</span>
              <span>{format(new Date(announcement.createdAt), 'M/d', { locale: ko })}</span>
              {announcement.hasAttachment && (
                <>
                  <span>•</span>
                  <Paperclip className="h-3 w-3" />
                </>
              )}
              <span>•</span>
              <div className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {announcement.viewCount}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </button>
    );
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">공지사항</h1>
              <p className="text-sm text-muted-foreground">회사 소식을 확인하세요</p>
            </div>
            {canWrite && (
              <Button size="sm" onClick={() => navigate('/announcements/new')}>
                <Plus className="mr-1 h-4 w-4" />
                작성
              </Button>
            )}
          </div>

          {/* Mobile Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="검색..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              <button
                onClick={() => setCategory('')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  searchState.category === ''
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                전체
              </button>
              {Object.entries(CATEGORY_LABELS).map(([value, { label }]) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    searchState.category === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Announcement List with Infinite Scroll */}
          <InfiniteList<AnnouncementListItem>
            items={infiniteAnnouncements}
            renderItem={renderMobileAnnouncementItem}
            keyExtractor={(item) => item.id}
            sentinelRef={sentinelRef}
            isLoading={isInfiniteLoading}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage ?? false}
            emptyState={
              <EmptyState
                icon={Megaphone}
                title="공지사항이 없습니다"
                description="등록된 공지사항이 없습니다."
              />
            }
          />
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="공지사항"
        description="회사 공지사항 및 소식을 확인하세요."
        actions={
          canWrite && (
            <Button onClick={() => navigate('/announcements/new')}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              작성
            </Button>
          )
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>공지사항 목록</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="제목, 내용 검색..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 w-[200px]"
                  aria-label="공지사항 검색"
                />
              </div>
              <select
                value={searchState.category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                aria-label="공지사항 분류 필터"
              >
                <option value="">전체 분류</option>
                {Object.entries(CATEGORY_LABELS).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="mt-4">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : isError ? (
              <EmptyState
                icon={Megaphone}
                title="데이터를 불러올 수 없습니다"
                description="잠시 후 다시 시도해주세요."
              />
            ) : announcements.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="공지사항이 없습니다"
                description="등록된 공지사항이 없습니다."
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label="공지사항 목록">
                  <table className="w-full" role="grid" aria-label="공지사항">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          분류
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          제목
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          작성자
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[80px]">
                          조회수
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-[100px]">
                          작성일
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements.map((announcement) => {
                        const categoryInfo = CATEGORY_LABELS[announcement.category] || { label: announcement.category, variant: 'outline' as const };
                        return (
                          <tr
                            key={announcement.id}
                            onClick={() => handleRowClick(announcement.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRowClick(announcement.id)}
                            className="border-b cursor-pointer transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            tabIndex={0}
                            role="row"
                            aria-label={`${categoryInfo.label}: ${announcement.title}`}
                          >
                            <td className="px-4 py-3">
                              <Badge variant={categoryInfo.variant}>
                                {categoryInfo.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                {announcement.isPinned && (
                                  <Pin className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                                )}
                                {announcement.isPinned && <span className="sr-only">고정됨</span>}
                                <span className="font-medium max-w-[400px] truncate">
                                  {announcement.title}
                                </span>
                                {announcement.hasAttachment && (
                                  <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                                )}
                                {announcement.hasAttachment && <span className="sr-only">첨부파일 있음</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {announcement.authorName}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" aria-hidden="true" />
                                <span aria-label={`조회수 ${announcement.viewCount}`}>{announcement.viewCount}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {format(new Date(announcement.createdAt), 'M/d', { locale: ko })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={searchState.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
