import { useTranslation } from 'react-i18next';
import { Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryItem {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

interface ApprovalSummaryCardsProps {
  pending: number;
  approved: number;
  rejected: number;
  draft: number;
  onItemClick?: (type: 'pending' | 'approved' | 'rejected' | 'draft') => void;
}

export function ApprovalSummaryCards({
  pending,
  approved,
  rejected,
  draft,
  onItemClick,
}: ApprovalSummaryCardsProps) {
  const { t } = useTranslation('approval');

  const items: (SummaryItem & { type: 'pending' | 'approved' | 'rejected' | 'draft' })[] = [
    {
      type: 'pending',
      icon: <Clock className="h-5 w-5" />,
      label: t('approvalSummaryCards.pending'),
      value: pending,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      type: 'draft',
      icon: <FileText className="h-5 w-5" />,
      label: t('approvalSummaryCards.draft'),
      value: draft,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      type: 'approved',
      icon: <CheckCircle2 className="h-5 w-5" />,
      label: t('approvalSummaryCards.approved'),
      value: approved,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      type: 'rejected',
      icon: <XCircle className="h-5 w-5" />,
      label: t('approvalSummaryCards.rejected'),
      value: rejected,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <button
          key={item.type}
          className={cn(
            'flex flex-col items-center p-3 rounded-xl transition-transform active:scale-95',
            item.bgColor
          )}
          onClick={() => onItemClick?.(item.type)}
        >
          <div className={item.color}>{item.icon}</div>
          <span className="text-xs text-muted-foreground mt-1">{item.label}</span>
          <span className={cn('text-lg font-bold', item.color)}>{item.value}</span>
        </button>
      ))}
    </div>
  );
}
