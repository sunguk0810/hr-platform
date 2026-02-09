import type { ReactNode } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SwipeAction {
  icon: ReactNode;
  color: string;
  label: string;
  onClick: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  threshold?: number;
  className?: string;
}

export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  threshold = 80,
  className,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const { trigger } = useHapticFeedback();

  const backgroundColor = useTransform(
    x,
    [-threshold, 0, threshold],
    [
      rightAction?.color || 'transparent',
      'transparent',
      leftAction?.color || 'transparent',
    ]
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;

    if (Math.abs(offset) < threshold) {
      return;
    }

    trigger('medium');

    if (offset > 0 && leftAction) {
      leftAction.onClick();
    } else if (offset < 0 && rightAction) {
      rightAction.onClick();
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-6"
        style={{ backgroundColor }}
      >
        {leftAction && (
          <div className="flex items-center gap-2 text-white">
            {leftAction.icon}
            <span className="text-sm font-medium">{leftAction.label}</span>
          </div>
        )}
        {rightAction && (
          <div className="ml-auto flex items-center gap-2 text-white">
            <span className="text-sm font-medium">{rightAction.label}</span>
            {rightAction.icon}
          </div>
        )}
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10 bg-background"
      >
        {children}
      </motion.div>
    </div>
  );
}
