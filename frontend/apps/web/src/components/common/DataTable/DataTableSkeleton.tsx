import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
  showToolbar?: boolean;
  showPagination?: boolean;
}

export function DataTableSkeleton({
  columns = 5,
  rows = 10,
  showToolbar = true,
  showPagination = true,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full">
      {showToolbar && (
        <div className="flex items-center justify-between py-4">
          <div className="h-9 w-[250px] bg-muted rounded-md" />
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-muted rounded-md" />
            <div className="h-9 w-24 bg-muted rounded-md" />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex h-12 items-center px-4 gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-4 bg-muted rounded',
                  i === 0 ? 'w-8' : 'flex-1'
                )}
              />
            ))}
          </div>
        </div>

        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b last:border-0">
            <div className="flex h-14 items-center px-4 gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={cn(
                    'h-4 bg-muted rounded',
                    colIndex === 0 ? 'w-8' : 'flex-1',
                    rowIndex % 2 === 0 ? 'opacity-100' : 'opacity-70'
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showPagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="flex items-center gap-4">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-8 w-24 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-8 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
