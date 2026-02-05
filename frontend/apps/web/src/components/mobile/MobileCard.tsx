import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function MobileCard({
  children,
  className,
  onClick,
  variant = 'default',
}: MobileCardProps) {
  const baseStyles = 'rounded-xl p-4 transition-all';

  const variantStyles = {
    default: 'bg-card border border-border',
    elevated: 'bg-card shadow-md',
    outlined: 'bg-transparent border-2 border-border',
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        onClick && 'cursor-pointer active:scale-[0.98]',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface MobileCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function MobileCardHeader({
  title,
  subtitle,
  icon,
  action,
}: MobileCardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

interface MobileCardContentProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardContent({ children, className }: MobileCardContentProps) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

interface MobileCardFooterProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardFooter({ children, className }: MobileCardFooterProps) {
  return (
    <div className={cn('mt-4 flex items-center gap-2 pt-3 border-t border-border', className)}>
      {children}
    </div>
  );
}
