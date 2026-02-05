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

const tabs: { value: TabValue; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'unread', label: '읽지 않음' },
  { value: 'approval', label: '결재' },
  { value: 'system', label: '시스템' },
];

export function NotificationTabs({ value, onChange, counts }: NotificationTabsProps) {
  return (
    <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
      {tabs.map((tab) => {
        const count = counts?.[tab.value];
        const isActive = value === tab.value;

        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {tab.label}
            {count !== undefined && count > 0 && tab.value !== 'all' && (
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
