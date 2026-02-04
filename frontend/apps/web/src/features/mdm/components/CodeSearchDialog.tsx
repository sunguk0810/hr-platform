import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Search, ArrowRight } from 'lucide-react';
import { useCodeSearch, useCodeGroupList } from '../hooks/useMdm';
import type { CodeSearchResult } from '@hr-platform/shared-types';

interface CodeSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (code: CodeSearchResult) => void;
}

export function CodeSearchDialog({ open, onOpenChange, onSelect }: CodeSearchDialogProps) {
  const [keyword, setKeyword] = useState('');
  const [groupCode, setGroupCode] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const debouncedKeyword = useDebounce(keyword, 300);

  const { data: codeGroupsData } = useCodeGroupList({ size: 100 });
  const codeGroups = codeGroupsData?.data?.content ?? [];

  const { data: searchResults, isLoading } = useCodeSearch(
    {
      keyword: debouncedKeyword,
      groupCode: groupCode || undefined,
      threshold: 50,
      includeInactive,
    },
    open && !!debouncedKeyword
  );

  const results = searchResults?.data ?? [];

  useEffect(() => {
    if (!open) {
      setKeyword('');
      setGroupCode('');
      setIncludeInactive(false);
    }
  }, [open]);

  const handleSelect = (code: CodeSearchResult) => {
    onSelect?.(code);
    onOpenChange(false);
  };

  const getMatchTypeBadge = (matchType: string) => {
    switch (matchType) {
      case 'EXACT':
        return <StatusBadge status="success" label="정확 일치" />;
      case 'PARTIAL':
        return <StatusBadge status="info" label="부분 일치" />;
      default:
        return <StatusBadge status="default" label="유사" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>코드 검색</DialogTitle>
          <DialogDescription>
            코드명 또는 코드로 검색하여 유사한 코드를 찾습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search-keyword">검색어</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="코드 또는 코드명 입력..."
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="w-48">
              <Label>코드그룹</Label>
              <Select value={groupCode || '__all__'} onValueChange={(value) => setGroupCode(value === '__all__' ? '' : value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체</SelectItem>
                  {codeGroups.map((group) => (
                    <SelectItem key={group.id} value={group.code}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-inactive"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="include-inactive" className="text-sm font-normal">
              비활성 코드 포함
            </Label>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelect(result)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{result.code}</span>
                        <span className="text-muted-foreground">-</span>
                        <span className="font-medium">{result.name}</span>
                        {result.nameEn && (
                          <span className="text-sm text-muted-foreground">({result.nameEn})</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{result.groupName}</span>
                        <span>•</span>
                        <StatusBadge
                          status={result.isActive ? 'success' : 'default'}
                          label={result.isActive ? '활성' : '비활성'}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {getMatchTypeBadge(result.matchType)}
                        <div className="mt-1 text-sm text-muted-foreground">
                          유사도 {result.similarity}%
                        </div>
                      </div>
                      {onSelect && (
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : keyword ? (
              <div className="py-8 text-center text-muted-foreground">
                검색 결과가 없습니다.
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                검색어를 입력하세요.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
