import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ApproverOption {
  id: string;
  name: string;
  departmentName: string;
  positionName?: string;
  profileImageUrl?: string;
}

export interface ApproverSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: ApproverOption;
  onSelect: (approver: ApproverOption) => void;
  onSearch?: (keyword: string) => Promise<ApproverOption[]>;
  className?: string;
}

export function ApproverSelector({
  open,
  onOpenChange,
  value,
  onSelect,
  onSearch,
  className,
}: ApproverSelectorProps) {
  const { t } = useTranslation('approval');
  const [keyword, setKeyword] = React.useState('');
  const [results, setResults] = React.useState<ApproverOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setKeyword('');
      setResults([]);
    }
  }, [open]);

  React.useEffect(() => {
    if (!keyword || !onSearch) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await onSearch(keyword);
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, onSearch]);

  const handleSelect = (approver: ApproverOption) => {
    onSelect(approver);
    onOpenChange(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn('w-full justify-start font-normal', className)}
        onClick={() => onOpenChange(true)}
      >
        {value ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={value.profileImageUrl} />
              <AvatarFallback className="text-xs">
                {value.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span>{value.name}</span>
            <span className="text-muted-foreground text-xs">
              ({value.departmentName})
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">{t('approverSelector.selectApprover')}</span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('approverSelector.selectApprover')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('approverSelector.searchPlaceholder')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {keyword
                    ? t('common.noSearchResults')
                    : t('common.searchByNameOrDept')}
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((approver) => (
                    <button
                      key={approver.id}
                      type="button"
                      className={cn(
                        'w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors',
                        value?.id === approver.id && 'bg-accent'
                      )}
                      onClick={() => handleSelect(approver)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={approver.profileImageUrl} />
                        <AvatarFallback>
                          {approver.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{approver.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {approver.departmentName}
                          {approver.positionName && ` · ${approver.positionName}`}
                        </p>
                      </div>
                      {value?.id === approver.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export interface MultiApproverSelectorProps
  extends Omit<ApproverSelectorProps, 'value' | 'onSelect'> {
  value?: ApproverOption[];
  onSelect: (approvers: ApproverOption[]) => void;
  maxSelections?: number;
}

export function MultiApproverSelector({
  open,
  onOpenChange,
  value = [],
  onSelect,
  onSearch,
  maxSelections,
  className,
}: MultiApproverSelectorProps) {
  const { t } = useTranslation('approval');
  const [keyword, setKeyword] = React.useState('');
  const [results, setResults] = React.useState<ApproverOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<ApproverOption[]>(value);

  React.useEffect(() => {
    setSelected(value);
  }, [value, open]);

  React.useEffect(() => {
    if (!open) {
      setKeyword('');
      setResults([]);
    }
  }, [open]);

  React.useEffect(() => {
    if (!keyword || !onSearch) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await onSearch(keyword);
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, onSearch]);

  const handleToggle = (approver: ApproverOption) => {
    const isSelected = selected.some((a) => a.id === approver.id);
    if (isSelected) {
      setSelected(selected.filter((a) => a.id !== approver.id));
    } else {
      if (maxSelections && selected.length >= maxSelections) return;
      setSelected([...selected, approver]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onOpenChange(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn('w-full justify-start font-normal', className)}
        onClick={() => onOpenChange(true)}
      >
        {value.length > 0 ? (
          <span>{t('approverSelector.selectedCount', { count: value.length })}</span>
        ) : (
          <span className="text-muted-foreground">{t('approverSelector.selectApprover')}</span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('approverSelector.selectApprover')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('approverSelector.searchPlaceholder')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Selected list */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((approver) => (
                  <span
                    key={approver.id}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1 text-xs"
                  >
                    {approver.name}
                    <button
                      type="button"
                      className="hover:bg-primary/20 rounded-full p-0.5"
                      onClick={() => handleToggle(approver)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="max-h-[250px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {keyword
                    ? t('common.noSearchResults')
                    : t('common.searchByNameOrDept')}
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((approver) => {
                    const isSelected = selected.some((a) => a.id === approver.id);
                    const isDisabled =
                      !isSelected &&
                      maxSelections !== undefined &&
                      selected.length >= maxSelections;

                    return (
                      <button
                        key={approver.id}
                        type="button"
                        disabled={isDisabled}
                        className={cn(
                          'w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors',
                          isSelected && 'bg-accent',
                          isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() => handleToggle(approver)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={approver.profileImageUrl} />
                          <AvatarFallback>
                            {approver.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{approver.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {approver.departmentName}
                            {approver.positionName && ` · ${approver.positionName}`}
                          </p>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="button" onClick={handleConfirm}>
                {t('approverSelector.confirmSelection', { count: selected.length })}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
