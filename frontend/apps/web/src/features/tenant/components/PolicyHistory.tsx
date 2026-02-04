import * as React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, History, ArrowRight, User, Calendar, ArrowDownLeft, FileText } from 'lucide-react';
import type {
  PolicyChangeHistory,
  PolicyType,
  PolicyChangeAction,
} from '@hr-platform/shared-types';
import {
  POLICY_TYPE_LABELS,
  POLICY_CHANGE_ACTION_LABELS,
} from '@hr-platform/shared-types';

export interface PolicyHistoryProps {
  history: PolicyChangeHistory[];
  isLoading?: boolean;
  onFilterChange?: (policyType: PolicyType | '') => void;
  selectedPolicyType?: PolicyType | '';
}

function getActionBadgeVariant(action: PolicyChangeAction): 'default' | 'secondary' | 'outline' {
  switch (action) {
    case 'CREATE':
      return 'default';
    case 'UPDATE':
      return 'secondary';
    case 'INHERIT':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getActionIcon(action: PolicyChangeAction) {
  switch (action) {
    case 'CREATE':
      return <FileText className="h-4 w-4" />;
    case 'UPDATE':
      return <History className="h-4 w-4" />;
    case 'INHERIT':
      return <ArrowDownLeft className="h-4 w-4" />;
    default:
      return null;
  }
}

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PolicyChangeHistory | null;
}

function DetailDialog({ open, onOpenChange, item }: DetailDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            정책 변경 상세
          </DialogTitle>
          <DialogDescription>
            {format(new Date(item.changedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}에 변경됨
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={getActionBadgeVariant(item.action)}>
              {POLICY_CHANGE_ACTION_LABELS[item.action]}
            </Badge>
            <Badge variant="outline">{POLICY_TYPE_LABELS[item.policyType]}</Badge>
          </div>

          <div className="grid gap-4 text-sm">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <span className="font-medium">변경자:</span>{' '}
                <span>{item.changedByName}</span>
              </div>
            </div>

            {item.reason && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <span className="font-medium">변경 사유:</span>{' '}
                  <span>{item.reason}</span>
                </div>
              </div>
            )}

            {item.sourceName && (
              <div className="flex items-start gap-2">
                <ArrowDownLeft className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <span className="font-medium">상속 원본:</span>{' '}
                  <span>{item.sourceName}</span>
                </div>
              </div>
            )}
          </div>

          {item.beforeValue && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">변경 전</h4>
              <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                {JSON.stringify(item.beforeValue, null, 2)}
              </pre>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">변경 후</h4>
            <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(item.afterValue, null, 2)}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PolicyHistory({
  history,
  isLoading = false,
  onFilterChange,
  selectedPolicyType = '',
}: PolicyHistoryProps) {
  const [selectedItem, setSelectedItem] = React.useState<PolicyChangeHistory | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              정책 변경 이력
            </CardTitle>
            <CardDescription>
              정책 설정의 변경 내역을 확인합니다.
            </CardDescription>
          </div>
          {onFilterChange && (
            <Select
              value={selectedPolicyType || '__all__'}
              onValueChange={(value) => onFilterChange(value === '__all__' ? '' : value as PolicyType)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="전체 정책" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">전체 정책</SelectItem>
                {Object.entries(POLICY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>변경 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    {getActionIcon(item.action)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getActionBadgeVariant(item.action)}>
                        {POLICY_CHANGE_ACTION_LABELS[item.action]}
                      </Badge>
                      <Badge variant="outline">
                        {POLICY_TYPE_LABELS[item.policyType]}
                      </Badge>
                      {item.sourceName && (
                        <span className="text-xs text-muted-foreground">
                          ({item.sourceName}에서 상속)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.changedByName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.changedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                      </span>
                    </div>
                    {item.reason && (
                      <p className="text-sm text-muted-foreground truncate">
                        {item.reason}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    상세
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DetailDialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        item={selectedItem}
      />
    </>
  );
}
