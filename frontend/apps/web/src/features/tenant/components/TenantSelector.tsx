import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import type { Tenant } from '@hr-platform/shared-types';

export interface TenantSelectorProps {
  className?: string;
}

export function TenantSelector({ className }: TenantSelectorProps) {
  const { t } = useTranslation('tenant');
  const [open, setOpen] = React.useState(false);
  const { currentTenant, availableTenants, setCurrentTenant } = useTenantStore();
  const { hasRole } = useAuthStore();

  const canSwitchTenant = hasRole('SUPER_ADMIN') && availableTenants.length > 1;

  if (!canSwitchTenant || availableTenants.length === 0) {
    if (!currentTenant) return null;

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate max-w-[150px]">
          {currentTenant.name}
        </span>
      </div>
    );
  }

  const handleSelect = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    setOpen(false);
    // 테넌트 전환 시 전체 앱 상태(RLS context, 캐시 등) 리셋 필요 — reload() 의도적 사용
    window.location.reload();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between gap-2', className)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {currentTenant?.name || t('selector.selectTenant')}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-2" align="start">
        <div className="space-y-1">
          {availableTenants.map((tenant) => (
            <button
              key={tenant.id}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                'hover:bg-accent',
                currentTenant?.id === tenant.id && 'bg-accent'
              )}
              onClick={() => handleSelect(tenant)}
            >
              {tenant.logoUrl ? (
                <OptimizedImage
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <div className="h-5 w-5 rounded bg-muted flex items-center justify-center">
                  <Building2 className="h-3 w-3" />
                </div>
              )}
              <span className="flex-1 truncate text-left">{tenant.name}</span>
              {currentTenant?.id === tenant.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
