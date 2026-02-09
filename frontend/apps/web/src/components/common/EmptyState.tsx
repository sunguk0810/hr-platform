import { type LucideIcon, Inbox } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} className="mt-4">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <motion.div
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{
          scale: 1,
          rotate: 0,
          opacity: 1,
          y: [0, -8, 0],
        }}
        transition={{
          scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
          rotate: { duration: 0.5, ease: 'easeOut' },
          opacity: { duration: 0.3 },
          y: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          },
        }}
        className="rounded-full bg-muted p-4"
      >
        <Icon className="h-8 w-8 text-muted-foreground" />
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-4 text-lg font-semibold"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-2 max-w-sm text-sm text-muted-foreground"
        >
          {description}
        </motion.p>
      )}

      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Button onClick={action.onClick} className="mt-4">
            {action.label}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
