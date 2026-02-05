import { ReactNode, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { cn } from '@/lib/utils';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: 'destructive' | 'success' | 'warning' | 'primary';
  onAction: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  className?: string;
}

const colorMap = {
  destructive: 'bg-destructive text-destructive-foreground',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  primary: 'bg-primary text-primary-foreground',
};

export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const bind = useDrag(
    ({ movement: [mx], last, cancel }: { movement: [number, number]; last: boolean; cancel: () => void }) => {
      // Prevent vertical scrolling when swiping horizontally
      if (Math.abs(mx) < 10) return;

      // Limit swipe distance
      const maxSwipe = 120;
      const clampedOffset = Math.max(-maxSwipe, Math.min(maxSwipe, mx));

      if (last) {
        // On release, check if threshold is met
        if (Math.abs(mx) > threshold) {
          if (mx > 0 && leftActions.length > 0) {
            leftActions[0].onAction();
          } else if (mx < 0 && rightActions.length > 0) {
            rightActions[0].onAction();
          }
        }
        setOffset(0);
      } else {
        // Only allow swipe in directions with actions
        if ((mx > 0 && leftActions.length === 0) || (mx < 0 && rightActions.length === 0)) {
          cancel();
          return;
        }
        setOffset(clampedOffset);
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      {/* Left action background */}
      {leftActions.length > 0 && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 flex items-center justify-start px-4',
            colorMap[leftActions[0].color]
          )}
          style={{ width: Math.abs(offset), opacity: offset > 0 ? 1 : 0 }}
        >
          <div className="flex flex-col items-center">
            {leftActions[0].icon}
            <span className="text-xs mt-1">{leftActions[0].label}</span>
          </div>
        </div>
      )}

      {/* Right action background */}
      {rightActions.length > 0 && (
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 flex items-center justify-end px-4',
            colorMap[rightActions[0].color]
          )}
          style={{ width: Math.abs(offset), opacity: offset < 0 ? 1 : 0 }}
        >
          <div className="flex flex-col items-center">
            {rightActions[0].icon}
            <span className="text-xs mt-1">{rightActions[0].label}</span>
          </div>
        </div>
      )}

      {/* Main card content */}
      <div
        ref={cardRef}
        {...bind()}
        className="relative bg-card touch-pan-y"
        style={{
          transform: `translateX(${offset}px)`,
          transition: offset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
