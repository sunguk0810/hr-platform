import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getIconWithFallback } from '@/utils/iconMap';
import { Circle } from 'lucide-react';
import type { MenuItemResponse } from '../types';

interface MobileMenuPreviewProps {
  menus: MenuItemResponse[];
}

/**
 * Preview component showing how menus will appear in mobile bottom tab bar.
 */
export function MobileMenuPreview({ menus }: MobileMenuPreviewProps) {
  const { t } = useTranslation('menu');

  // Filter to only show mobile menus
  const mobileMenus = menus
    .filter((m) => m.showInMobile && m.isActive)
    .sort((a, b) => (a.mobileSortOrder ?? 999) - (b.mobileSortOrder ?? 999))
    .slice(0, 5); // Max 5 items in bottom tab bar

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h3 className="font-medium">{t('mobilePreviewPanel.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('mobilePreviewPanel.description')}
        </p>
      </div>

      {/* Phone mockup */}
      <div className="flex justify-center p-6">
        <div className="relative w-[280px] rounded-[32px] border-4 border-gray-800 bg-background shadow-xl">
          {/* Notch */}
          <div className="absolute left-1/2 top-0 h-6 w-24 -translate-x-1/2 rounded-b-xl bg-gray-800" />

          {/* Screen content */}
          <div className="h-[480px] overflow-hidden rounded-[28px] bg-gray-50">
            {/* Status bar */}
            <div className="flex h-12 items-center justify-between bg-background px-6 text-xs">
              <span>9:41</span>
              <span>100%</span>
            </div>

            {/* Content area placeholder */}
            <div className="flex h-[360px] items-center justify-center">
              <span className="text-muted-foreground">{t('mobilePreviewPanel.appContent')}</span>
            </div>

            {/* Bottom tab bar */}
            <div className="absolute bottom-0 left-0 right-0 h-16 border-t bg-background">
              <div className="flex h-full items-center justify-around px-2">
                {mobileMenus.length > 0 ? (
                  mobileMenus.map((menu, index) => {
                    const Icon = getIconWithFallback(menu.icon, Circle);
                    const isActive = index === 0;

                    return (
                      <button
                        key={menu.id}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1',
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px]">{menu.name}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('mobilePreviewPanel.empty')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-gray-800" />
        </div>
      </div>

      {/* Mobile menu list */}
      <div className="border-t px-4 py-3">
        <h4 className="mb-2 text-sm font-medium">{t('mobilePreviewPanel.list')}</h4>
        {mobileMenus.length > 0 ? (
          <ul className="space-y-1">
            {mobileMenus.map((menu, index) => (
              <li key={menu.id} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-muted-foreground">{index + 1}.</span>
                <span>{menu.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t('mobilePreviewPanel.sortOrder', { order: menu.mobileSortOrder ?? '-' })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('mobilePreviewPanel.noMobileMenu')}
          </p>
        )}
      </div>
    </div>
  );
}

export default MobileMenuPreview;
