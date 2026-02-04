import * as React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Download,
  Upload,
  Check,
  X,
  Key,
  Shield,
} from 'lucide-react';
import type { AuditLog, AuditAction } from '@hr-platform/shared-types';

export interface AuditTimelineProps {
  logs: AuditLog[];
  onItemClick?: (log: AuditLog) => void;
  maxHeight?: string | number;
  className?: string;
}

const actionIcons: Record<AuditAction, React.ComponentType<{ className?: string }>> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  READ: Eye,
  EXPORT: Download,
  IMPORT: Upload,
  APPROVE: Check,
  REJECT: X,
  PASSWORD_CHANGE: Key,
  PERMISSION_CHANGE: Shield,
};

const actionLabels: Record<AuditAction, string> = {
  LOGIN: '로그인',
  LOGOUT: '로그아웃',
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  READ: '조회',
  EXPORT: '내보내기',
  IMPORT: '가져오기',
  APPROVE: '승인',
  REJECT: '반려',
  PASSWORD_CHANGE: '비밀번호 변경',
  PERMISSION_CHANGE: '권한 변경',
};

const actionColors: Record<AuditAction, string> = {
  LOGIN: 'bg-blue-500',
  LOGOUT: 'bg-gray-500',
  CREATE: 'bg-green-500',
  UPDATE: 'bg-yellow-500',
  DELETE: 'bg-red-500',
  READ: 'bg-gray-400',
  EXPORT: 'bg-purple-500',
  IMPORT: 'bg-purple-500',
  APPROVE: 'bg-green-500',
  REJECT: 'bg-red-500',
  PASSWORD_CHANGE: 'bg-orange-500',
  PERMISSION_CHANGE: 'bg-indigo-500',
};

export function AuditTimeline({
  logs,
  onItemClick,
  maxHeight = '500px',
  className,
}: AuditTimelineProps) {
  // Group logs by date
  const groupedLogs = React.useMemo(() => {
    const groups = new Map<string, AuditLog[]>();
    logs.forEach((log) => {
      const date = format(new Date(log.createdAt), 'yyyy-MM-dd');
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(log);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p>감사 로그가 없습니다.</p>
      </div>
    );
  }

  return (
    <ScrollArea className={className} style={{ maxHeight }}>
      <div className="space-y-6 pr-4">
        {groupedLogs.map(([date, dateLogs]) => (
          <div key={date}>
            <div className="sticky top-0 bg-background py-2 z-10">
              <h3 className="text-sm font-medium text-muted-foreground">
                {format(new Date(date), 'yyyy년 M월 d일 (E)', { locale: ko })}
              </h3>
            </div>
            <div className="relative ml-4 border-l-2 border-muted pl-6 space-y-4">
              {dateLogs.map((log) => (
                <TimelineItem
                  key={log.id}
                  log={log}
                  onClick={() => onItemClick?.(log)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

interface TimelineItemProps {
  log: AuditLog;
  onClick?: () => void;
}

function TimelineItem({ log, onClick }: TimelineItemProps) {
  const Icon = actionIcons[log.action];
  const color = actionColors[log.action];

  return (
    <div
      className={cn(
        'relative group',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Dot */}
      <div
        className={cn(
          'absolute -left-[31px] h-4 w-4 rounded-full flex items-center justify-center',
          color,
          'text-white'
        )}
      >
        <Icon className="h-2.5 w-2.5" />
      </div>

      {/* Content */}
      <div
        className={cn(
          'p-3 rounded-lg border bg-card transition-colors',
          onClick && 'group-hover:bg-muted/50'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {actionLabels[log.action]}
              </Badge>
              {log.result === 'SUCCESS' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-sm font-medium mt-1">
              {log.targetName || log.targetType}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {log.userName} · {log.ipAddress}
            </p>
          </div>
          <time className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(log.createdAt), 'HH:mm:ss')}
          </time>
        </div>

        {log.errorMessage && (
          <p className="text-xs text-red-500 mt-2 line-clamp-2">
            {log.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
