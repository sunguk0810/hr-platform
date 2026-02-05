import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SplitViewProps {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: string;
  className?: string;
  showRight?: boolean;
}

export function SplitView({
  left,
  right,
  leftWidth = 'w-[40%]',
  className,
  showRight = true,
}: SplitViewProps) {
  return (
    <div className={cn('flex h-full gap-4', className)}>
      {/* Left Panel - List */}
      <div
        className={cn(
          'flex-shrink-0 overflow-hidden rounded-xl border bg-card',
          showRight ? leftWidth : 'w-full'
        )}
      >
        <div className="h-full overflow-y-auto">{left}</div>
      </div>

      {/* Right Panel - Detail */}
      {showRight && (
        <div className="flex-1 overflow-hidden rounded-xl border bg-card">
          <div className="h-full overflow-y-auto">{right}</div>
        </div>
      )}
    </div>
  );
}

interface SplitViewPanelProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
}

export function SplitViewPanel({ children, className, header }: SplitViewPanelProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {header && (
        <div className="flex-shrink-0 border-b p-4">{header}</div>
      )}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
