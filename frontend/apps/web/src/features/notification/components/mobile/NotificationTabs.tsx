import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type TabValue = 'all' | 'unread' | 'approval' | 'system';

interface NotificationTabsProps {
  value: TabValue;
  onChange: (value: TabValue) => void;
  counts?: {
    all: number;
    unread: number;
    approval: number;
    system: number;
  };
}

const tabKeys: TabValue[] = ['all', 'unread', 'approval', 'system'];

export function NotificationTabs({ value, onChange, counts }: NotificationTabsProps) {
  const { t } = useTranslation('notification');
  return (
    <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
      {tabKeys.map((tabValue) => {
        const count = counts?.[tabValue];
        const isActive = value === tabValue;

        return (
          <button
            key={tabValue}
            onClick={() => onChange(tabValue)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {t(`tabs.${tabValue}`)}
            {count !== undefined && count > 0 && tabValue !== 'all' && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background text-foreground'
                )}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
