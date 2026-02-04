import { ReactNode } from 'react';
import { FileText, Users, Building2, Bell, Settings, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchResultItem {
  id: string;
  type: 'employee' | 'department' | 'document' | 'approval' | 'notification' | 'setting' | 'page';
  title: string;
  subtitle?: string;
  path?: string;
  icon?: LucideIcon;
}

export interface SearchResultsProps {
  results: SearchResultItem[];
  isLoading?: boolean;
  query?: string;
  onSelect: (item: SearchResultItem) => void;
  selectedIndex?: number;
  emptyMessage?: ReactNode;
  className?: string;
}

const typeIcons: Record<SearchResultItem['type'], LucideIcon> = {
  employee: Users,
  department: Building2,
  document: FileText,
  approval: FileText,
  notification: Bell,
  setting: Settings,
  page: FileText,
};

const typeLabels: Record<SearchResultItem['type'], string> = {
  employee: '직원',
  department: '부서',
  document: '문서',
  approval: '결재',
  notification: '알림',
  setting: '설정',
  page: '페이지',
};

export function SearchResults({
  results,
  isLoading,
  query,
  onSelect,
  selectedIndex = -1,
  emptyMessage,
  className,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className={cn('py-6 text-center', className)}>
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-2 text-sm text-muted-foreground">검색 중...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn('py-6 text-center', className)}>
        {emptyMessage || (
          <>
            <p className="text-sm text-muted-foreground">
              {query ? `"${query}"에 대한 검색 결과가 없습니다.` : '검색어를 입력하세요.'}
            </p>
          </>
        )}
      </div>
    );
  }

  // Group results by type
  const groupedResults = results.reduce(
    (acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, SearchResultItem[]>
  );

  let currentIndex = -1;

  return (
    <div className={cn('max-h-[400px] overflow-y-auto', className)}>
      {Object.entries(groupedResults).map(([type, items]) => {
        const Icon = typeIcons[type as SearchResultItem['type']];
        const label = typeLabels[type as SearchResultItem['type']];

        return (
          <div key={type} className="py-2">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {label}
            </div>
            <ul className="space-y-0.5">
              {items.map((item) => {
                currentIndex++;
                const isSelected = currentIndex === selectedIndex;
                const ItemIcon = item.icon || Icon;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
                        'transition-colors hover:bg-accent hover:text-accent-foreground',
                        'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                        isSelected && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <ItemIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-medium">{item.title}</p>
                        {item.subtitle && (
                          <p className="truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      {item.path && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {item.path}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default SearchResults;
