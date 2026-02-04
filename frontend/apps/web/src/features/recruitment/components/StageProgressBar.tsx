import { cn } from '@/lib/utils';
import type { ApplicationStage } from '@hr-platform/shared-types';

const STAGES: { key: ApplicationStage; label: string }[] = [
  { key: 'DOCUMENT', label: '서류전형' },
  { key: 'FIRST_INTERVIEW', label: '1차면접' },
  { key: 'SECOND_INTERVIEW', label: '2차면접' },
  { key: 'FINAL_INTERVIEW', label: '최종면접' },
  { key: 'OFFER', label: '오퍼' },
];

interface StageProgressBarProps {
  currentStage: ApplicationStage;
  className?: string;
}

export function StageProgressBar({ currentStage, className }: StageProgressBarProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={stage.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors',
                  isCompleted && 'bg-green-500 border-green-500 text-white',
                  isCurrent && 'bg-blue-500 border-blue-500 text-white',
                  !isCompleted && !isCurrent && 'bg-muted border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-xs text-center',
                  isCurrent ? 'text-blue-600 font-medium' : 'text-muted-foreground'
                )}
              >
                {stage.label}
              </span>
            </div>
            {index < STAGES.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 -mt-5',
                  isCompleted ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface StageCountBarProps {
  stageCounts: { stage: ApplicationStage; count: number }[];
  className?: string;
}

export function StageCountBar({ stageCounts, className }: StageCountBarProps) {
  const total = stageCounts.reduce((sum, s) => sum + s.count, 0);

  const getCount = (stage: ApplicationStage) => {
    return stageCounts.find((s) => s.stage === stage)?.count || 0;
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">전체 지원자</span>
        <span className="font-medium">{total}명</span>
      </div>
      <div className="flex rounded-lg overflow-hidden h-6">
        {STAGES.map((stage) => {
          const count = getCount(stage.key);
          const percentage = total > 0 ? (count / total) * 100 : 0;
          if (percentage === 0) return null;

          const colorMap: Record<ApplicationStage, string> = {
            DOCUMENT: 'bg-gray-400',
            FIRST_INTERVIEW: 'bg-blue-400',
            SECOND_INTERVIEW: 'bg-indigo-400',
            FINAL_INTERVIEW: 'bg-purple-400',
            OFFER: 'bg-green-500',
          };

          return (
            <div
              key={stage.key}
              className={cn(
                'flex items-center justify-center text-xs text-white font-medium transition-all',
                colorMap[stage.key]
              )}
              style={{ width: `${percentage}%` }}
              title={`${stage.label}: ${count}명 (${percentage.toFixed(1)}%)`}
            >
              {percentage > 10 && count}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {STAGES.map((stage) => {
          const count = getCount(stage.key);
          const colorMap: Record<ApplicationStage, string> = {
            DOCUMENT: 'bg-gray-400',
            FIRST_INTERVIEW: 'bg-blue-400',
            SECOND_INTERVIEW: 'bg-indigo-400',
            FINAL_INTERVIEW: 'bg-purple-400',
            OFFER: 'bg-green-500',
          };

          return (
            <div key={stage.key} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-full', colorMap[stage.key])} />
              <span className="text-muted-foreground">
                {stage.label}: <span className="font-medium text-foreground">{count}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
