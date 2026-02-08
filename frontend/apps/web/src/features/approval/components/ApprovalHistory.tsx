import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  FileText,
  Send,
  Check,
  X,
  MessageSquare,
  RotateCcw,
  Eye,
  UserCheck,
  FastForward,
  Undo2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ApprovalHistory as ApprovalHistoryType } from '@hr-platform/shared-types';

// 기존 로컬 타입 (하위 호환성)
export type ApprovalHistoryAction =
  | 'DRAFTED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMMENTED'
  | 'RETURNED'
  | 'VIEWED'
  | 'MODIFIED'
  | 'RECALLED'
  | 'DELEGATED'
  | 'DIRECT_APPROVED';

export interface ApprovalHistoryItem {
  id: string;
  action: ApprovalHistoryAction;
  actorName: string;
  actorPosition?: string;
  actorDepartment?: string;
  actorImage?: string;
  timestamp: Date;
  comment?: string;
  details?: string;
  // SDD 4.6 대결 관련
  delegatorId?: string;
  delegatorName?: string;
  // SDD 4.7 전결 관련
  directApproved?: boolean;
}

interface ApprovalHistoryProps {
  items?: ApprovalHistoryItem[];
  historyData?: ApprovalHistoryType[];  // SDD 기반 API 응답 타입
  title?: string;
  className?: string;
}

const actionIcons: Record<ApprovalHistoryAction, React.ReactNode> = {
  DRAFTED: <FileText className="h-4 w-4" />,
  SUBMITTED: <Send className="h-4 w-4" />,
  APPROVED: <Check className="h-4 w-4" />,
  REJECTED: <X className="h-4 w-4" />,
  COMMENTED: <MessageSquare className="h-4 w-4" />,
  RETURNED: <RotateCcw className="h-4 w-4" />,
  VIEWED: <Eye className="h-4 w-4" />,
  MODIFIED: <FileText className="h-4 w-4" />,
  RECALLED: <Undo2 className="h-4 w-4" />,
  DELEGATED: <UserCheck className="h-4 w-4" />,
  DIRECT_APPROVED: <FastForward className="h-4 w-4" />,
};

const actionColors: Record<ApprovalHistoryAction, string> = {
  DRAFTED: 'bg-gray-500',
  SUBMITTED: 'bg-blue-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  COMMENTED: 'bg-amber-500',
  RETURNED: 'bg-orange-500',
  VIEWED: 'bg-gray-400',
  MODIFIED: 'bg-purple-500',
  RECALLED: 'bg-orange-600',
  DELEGATED: 'bg-indigo-500',
  DIRECT_APPROVED: 'bg-teal-500',
};

const actionLabels: Record<ApprovalHistoryAction, string> = {
  DRAFTED: '기안 작성',
  SUBMITTED: '결재 상신',
  APPROVED: '승인',
  REJECTED: '반려',
  COMMENTED: '의견 작성',
  RETURNED: '반송',
  VIEWED: '열람',
  MODIFIED: '수정',
  RECALLED: '회수',
  DELEGATED: '대결',
  DIRECT_APPROVED: '전결',
};

// API 응답 액션 타입을 로컬 타입으로 변환
function mapApiActionToLocal(action: string): ApprovalHistoryAction {
  const mapping: Record<string, ApprovalHistoryAction> = {
    SUBMIT: 'SUBMITTED',
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    RECALL: 'RECALLED',
    DELEGATE: 'DELEGATED',
    DIRECT_APPROVE: 'DIRECT_APPROVED',
    COMMENT: 'COMMENTED',
    RETURN: 'RETURNED',
  };
  return mapping[action] || 'MODIFIED';
}

// API 응답을 로컬 타입으로 변환
function convertApiHistoryToLocal(historyData: ApprovalHistoryType[]): ApprovalHistoryItem[] {
  return historyData.map((item) => ({
    id: item.id,
    action: mapApiActionToLocal(item.action),
    actorName: item.actorName,
    actorPosition: item.actorPosition,
    actorDepartment: item.actorDepartment,
    timestamp: new Date(item.processedAt),
    comment: item.comment,
    delegatorId: item.delegatorId,
    delegatorName: item.delegatorName,
  }));
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ApprovalHistory({
  items,
  historyData,
  title = '결재 이력',
  className,
}: ApprovalHistoryProps) {
  // API 응답이 있으면 변환, 아니면 직접 전달된 items 사용
  const historyItems = historyData
    ? convertApiHistoryToLocal(historyData)
    : items || [];

  const sortedItems = [...historyItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (historyItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-muted-foreground">
            결재 이력이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

          {sortedItems.map((item) => (
            <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Timeline dot */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white',
                  actionColors[item.action]
                )}
              >
                {actionIcons[item.action]}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={item.actorImage} alt={item.actorName} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(item.actorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium">{item.actorName}</span>
                      {item.actorPosition && (
                        <span className="text-sm text-muted-foreground">
                          {' '}
                          · {item.actorPosition}
                        </span>
                      )}
                      {item.actorDepartment && (
                        <span className="text-sm text-muted-foreground">
                          {' '}
                          · {item.actorDepartment}
                        </span>
                      )}
                    </div>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(item.timestamp), 'M월 d일 HH:mm', {
                      locale: ko,
                    })}
                  </time>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-white',
                      actionColors[item.action]
                    )}
                  >
                    {actionIcons[item.action]}
                    {actionLabels[item.action]}
                  </span>

                  {/* 대결 시 원 결재자 표시 */}
                  {item.delegatorName && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      원 결재자: {item.delegatorName}
                    </span>
                  )}
                </div>

                {item.comment && (
                  <div className="mt-2 rounded-lg border bg-muted/50 p-3 text-sm">
                    "{item.comment}"
                  </div>
                )}

                {item.details && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ApprovalHistory;
