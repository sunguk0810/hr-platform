import * as React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultCollapsed = false,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const content = (
    <div
      className={cn(
        'grid gap-4',
        isCollapsed && collapsible && 'hidden',
        className
      )}
    >
      {children}
    </div>
  );

  if (!title) {
    return content;
  }

  return (
    <div className="space-y-4">
      <div
        className={cn('flex items-center justify-between', collapsible && 'cursor-pointer')}
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={(e) => {
          if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
            setIsCollapsed(!isCollapsed);
          }
        }}
      >
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {collapsible && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'h-5 w-5 transition-transform',
              isCollapsed && '-rotate-90'
            )}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </div>
      <Separator />
      {content}
    </div>
  );
}

export interface FormRowProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
}

export function FormRow({ children, className, cols = 2 }: FormRowProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[cols], className)}>{children}</div>
  );
}

export interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function FormActions({
  children,
  className,
  align = 'right',
}: FormActionsProps) {
  const alignmentClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t',
        alignmentClass[align],
        className
      )}
    >
      {children}
    </div>
  );
}
