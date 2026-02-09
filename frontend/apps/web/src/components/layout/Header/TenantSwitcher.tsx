import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Building2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTenantStore, Tenant } from '@/stores/tenantStore';
import { cn } from '@/lib/utils';

interface TenantSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function TenantSwitcher({ compact = false, className }: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { t } = useTranslation('common');
  const { currentTenant, availableTenants, setCurrentTenant } = useTenantStore();

  const handleSelect = (tenant: Tenant) => {
    if (tenant.id === currentTenant?.id) {
      setOpen(false);
      return;
    }
    setCurrentTenant(tenant);
    setOpen(false);
    setSearch('');
    // 테넌트 전환 시 페이지 새로고침하여 데이터 갱신
    window.location.reload();
  };

  // 검색 필터링
  const filteredTenants = availableTenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.code.toLowerCase().includes(search.toLowerCase())
  );

  // 테넌트가 1개 이하면 전환 UI 불필요
  if (availableTenants.length <= 1) {
    if (compact) {
      return null;
    }
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {currentTenant?.name || t('tenant.noTenant')}
        </span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={t('tenant.selectTenant')}
          className={cn(
            'justify-between gap-2',
            compact ? 'w-auto px-2' : 'w-[220px]',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {currentTenant?.logoUrl ? (
              <img
                src={currentTenant.logoUrl}
                alt={currentTenant.name}
                className="h-4 w-4 rounded object-contain"
              />
            ) : (
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            {!compact && (
              <span className="truncate text-sm font-medium">
                {currentTenant?.name || t('tenant.selectTenant')}
              </span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {/* 검색 입력 */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={t('tenant.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* 계열사 목록 */}
        <ScrollArea className="h-[250px]">
          <div className="p-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {t('tenant.tenantList')} ({filteredTenants.length})
            </div>
            {filteredTenants.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t('tenant.noResults')}
              </div>
            ) : (
              filteredTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelect(tenant)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm outline-none transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground',
                    currentTenant?.id === tenant.id && 'bg-accent'
                  )}
                >
                  {tenant.logoUrl ? (
                    <img
                      src={tenant.logoUrl}
                      alt={tenant.name}
                      className="h-6 w-6 rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col items-start min-w-0">
                    <span className="truncate font-medium">{tenant.name}</span>
                    <span className="text-xs text-muted-foreground">{tenant.code}</span>
                  </div>
                  {currentTenant?.id === tenant.id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default TenantSwitcher;
