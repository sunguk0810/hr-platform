import { cn } from '@/lib/utils';

type TabValue = 'pending' | 'requested' | 'completed' | 'draft' | '';

interface ApprovalFilterTabsProps {
  value: TabValue;
  onChange: (value: TabValue) => void;
  counts?: {
    pending: number;
    requested?: number;
    completed?: number;
    draft: number;
  };
}

const tabs: { value: TabValue; label: string; countKey?: keyof NonNullable<ApprovalFilterTabsProps['counts']> }[] = [
  { value: 'pending', label: '결재 대기', countKey: 'pending' },
  { value: 'requested', label: '내가 요청한' },
  { value: 'completed', label: '완료' },
  { value: 'draft', label: '임시저장', countKey: 'draft' },
];

export function ApprovalFilterTabs({ value, onChange, counts }: ApprovalFilterTabsProps) {
  return (
    <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
      {tabs.map((tab) => {
        const count = tab.countKey && counts ? counts[tab.countKey] : undefined;
        const isActive = value === tab.value || (!value && tab.value === 'pending');

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
            {count !== undefined && count > 0 && (
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
