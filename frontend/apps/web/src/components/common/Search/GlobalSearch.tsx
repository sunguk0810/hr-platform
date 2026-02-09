import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Command } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchInput } from './SearchInput';
import { SearchResults, SearchResultItem } from './SearchResults';

// Mock search data - In real app, this would come from an API
const mockSearchItems: SearchResultItem[] = [
  { id: '1', type: 'page', title: '대시보드', path: '/', subtitle: '홈 대시보드' },
  { id: '2', type: 'page', title: '조직도', path: '/organization', subtitle: '조직 구조 관리' },
  { id: '3', type: 'page', title: '직원 관리', path: '/employees', subtitle: '직원 목록 및 관리' },
  { id: '4', type: 'page', title: '근태 관리', path: '/attendance', subtitle: '출퇴근 및 휴가 관리' },
  { id: '5', type: 'page', title: '결재 관리', path: '/approvals', subtitle: '결재 요청 및 처리' },
  { id: '6', type: 'page', title: '설정', path: '/settings', subtitle: '시스템 설정' },
  { id: '7', type: 'employee', title: '홍길동', subtitle: '개발팀 / 과장' },
  { id: '8', type: 'employee', title: '김영희', subtitle: '인사팀 / 대리' },
  { id: '9', type: 'department', title: '개발팀', subtitle: 'IT본부' },
  { id: '10', type: 'department', title: '인사팀', subtitle: '경영지원본부' },
];

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GlobalSearch({ open: controlledOpen, onOpenChange }: GlobalSearchProps) {
  const { t } = useTranslation('common');
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [open]);

  // Search logic
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    const timer = setTimeout(() => {
      const filtered = mockSearchItems.filter(
        (item) =>
          item.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      setResults(filtered);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      setOpen(false);

      if (item.path) {
        navigate(item.path);
      } else if (item.type === 'employee') {
        navigate(`/employees/${item.id}`);
      } else if (item.type === 'department') {
        navigate(`/organization/departments/${item.id}`);
      }
    },
    [navigate, setOpen]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalResults = results.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalResults);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < totalResults) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [results, selectedIndex, handleSelect, setOpen]
  );

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:w-64"
      >
        <span className="flex-1 text-left">{t('searchPlaceholder')}</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl gap-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('component.globalSearch')}</DialogTitle>
          </DialogHeader>

          <div className="border-b p-4">
            <SearchInput
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onClear={() => {
                setQuery('');
                setResults([]);
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('component.searchFullPlaceholder')}
              isLoading={isLoading}
              aria-label={t('component.globalSearch')}
            />
          </div>

          <SearchResults
            results={results}
            isLoading={isLoading}
            query={query}
            onSelect={handleSelect}
            selectedIndex={selectedIndex}
            emptyMessage={
              query.trim() ? undefined : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('component.searchInfo')}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <kbd className="rounded border bg-muted px-1.5 py-0.5">↑</kbd>
                    <kbd className="rounded border bg-muted px-1.5 py-0.5">↓</kbd>
                    <span>{t('component.navigate')}</span>
                    <kbd className="rounded border bg-muted px-1.5 py-0.5">Enter</kbd>
                    <span>{t('component.select')}</span>
                    <kbd className="rounded border bg-muted px-1.5 py-0.5">Esc</kbd>
                    <span>{t('close')}</span>
                  </div>
                </div>
              )
            }
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GlobalSearch;
