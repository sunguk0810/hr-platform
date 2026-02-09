import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  User,
  Globe,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import type { AuditLog, AuditAction } from '@hr-platform/shared-types';

export interface AuditDetailProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionColors: Record<AuditAction, string> = {
  LOGIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  UPDATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  READ: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  EXPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  IMPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  APPROVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PASSWORD_CHANGE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  PERMISSION_CHANGE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

export function AuditDetail({ log, open, onOpenChange }: AuditDetailProps) {
  const { t } = useTranslation('audit');
  const [copied, setCopied] = React.useState(false);

  const actionLabels: Record<AuditAction, string> = React.useMemo(() => ({
    LOGIN: t('actions.LOGIN'),
    LOGOUT: t('actions.LOGOUT'),
    CREATE: t('actions.CREATE'),
    UPDATE: t('actions.UPDATE'),
    DELETE: t('actions.DELETE'),
    READ: t('actions.READ'),
    EXPORT: t('actions.EXPORT'),
    IMPORT: t('actions.IMPORT'),
    APPROVE: t('actions.APPROVE'),
    REJECT: t('actions.REJECT'),
    PASSWORD_CHANGE: t('actions.PASSWORD_CHANGE'),
    PERMISSION_CHANGE: t('actions.PERMISSION_CHANGE'),
  }), [t]);

  const handleCopyDetails = async () => {
    if (!log) return;
    const text = JSON.stringify(log, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('detail.title')}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyDetails}
              className="ml-auto"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t('detail.copied')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  {t('detail.copy')}
                </>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('detail.datetime')}</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">
                    {format(new Date(log.createdAt), 'yyyy.MM.dd HH:mm:ss', { locale: ko })}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('detail.result')}</Label>
                {log.result === 'SUCCESS' ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{t('detail.success')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>{t('detail.failure')}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* User Info */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('detail.user')}</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{log.userName}</span>
                <span className="text-muted-foreground">({log.userEmail})</span>
              </div>
            </div>

            {/* IP Address */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('detail.ipAddress')}</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{log.ipAddress}</span>
              </div>
            </div>

            {/* User Agent */}
            {log.userAgent && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('detail.browser')}</Label>
                <p className="text-sm text-muted-foreground break-all">
                  {log.userAgent}
                </p>
              </div>
            )}

            <Separator />

            {/* Action */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('detail.action')}</Label>
              <Badge className={actionColors[log.action]} variant="secondary">
                {actionLabels[log.action]}
              </Badge>
            </div>

            {/* Target */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('detail.target')}</Label>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{log.targetName || '-'}</span>
                <span className="text-xs text-muted-foreground">({log.targetType})</span>
              </div>
              {log.targetId && (
                <p className="text-xs text-muted-foreground font-mono pl-6">
                  ID: {log.targetId}
                </p>
              )}
            </div>

            {/* Error Message */}
            {log.errorMessage && (
              <>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-500" />
                    {t('detail.errorMessage')}
                  </Label>
                  <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                    {log.errorMessage}
                  </p>
                </div>
              </>
            )}

            {/* Details */}
            {log.details && Object.keys(log.details).length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('detail.details')}</Label>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40 font-mono">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {/* Request Info */}
            {log.requestMethod && log.requestUrl && (
              <>
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('detail.requestInfo')}</Label>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.requestMethod}</Badge>
                      <span className="text-sm font-mono break-all">{log.requestUrl}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Timestamps */}
            <Separator />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('detail.logId')}</Label>
              <p className="text-xs font-mono text-muted-foreground">{log.id}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
