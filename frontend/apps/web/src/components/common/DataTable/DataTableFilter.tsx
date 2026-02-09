import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DataTableFilterProps } from './types';

export function DataTableFilter({
  globalFilter,
  onGlobalFilterChange,
  placeholder,
}: DataTableFilterProps) {
  const { t } = useTranslation('common');
  const effectivePlaceholder = placeholder || t('table.searchPlaceholder');
  const [value, setValue] = useState(globalFilter);

  useEffect(() => {
    setValue(globalFilter);
  }, [globalFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== globalFilter) {
        onGlobalFilterChange(value);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, globalFilter, onGlobalFilterChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={effectivePlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-9 h-9 w-full sm:w-[250px]"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => {
            setValue('');
            onGlobalFilterChange('');
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
