import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export interface Session {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  lastActiveAt: Date;
  createdAt: Date;
  isCurrent: boolean;
}

interface SessionManagerProps {
  sessions: Session[];
  onRevokeSession: (sessionId: string) => void;
  onRevokeAllSessions: () => void;
  isLoading?: boolean;
}

const deviceIcons: Record<string, React.ReactNode> = {
  desktop: <Monitor className="h-5 w-5" />,
  mobile: <Smartphone className="h-5 w-5" />,
  tablet: <Tablet className="h-5 w-5" />,
};

export function SessionManager({
  sessions,
  onRevokeSession,
  onRevokeAllSessions,
  isLoading,
}: SessionManagerProps) {
  const { t } = useTranslation('settings');
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const handleRevokeSession = () => {
    if (revokeId) {
      onRevokeSession(revokeId);
      setRevokeId(null);
    }
  };

  const handleRevokeAll = () => {
    onRevokeAllSessions();
    setShowRevokeAllDialog(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{t('sessionManager.title')}</CardTitle>
            <CardDescription>
              {t('sessionManager.description')}
            </CardDescription>
          </div>
          {otherSessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRevokeAllDialog(true)}
              disabled={isLoading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('sessionManager.logoutAllDevices')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session */}
        {currentSession && (
          <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {deviceIcons[currentSession.deviceType]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{currentSession.deviceName}</h4>
                  <Badge variant="default" className="text-xs">{t('sessionManager.currentDevice')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentSession.browser} · {currentSession.os}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {currentSession.ipAddress}
                  </span>
                  {currentSession.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {currentSession.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Sessions */}
        {otherSessions.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t('sessionManager.otherDevices', { count: otherSessions.length })}
            </h4>
            {otherSessions.map((session) => {
              const lastActive = formatDistanceToNow(session.lastActiveAt, {
                addSuffix: true,
                locale: ko,
              });

              return (
                <div
                  key={session.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {deviceIcons[session.deviceType]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{session.deviceName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {session.browser} · {session.os}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {session.ipAddress}
                      </span>
                      {session.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </span>
                      )}
                      <span>{t('sessionManager.lastActivity', { time: lastActive })}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevokeId(session.id)}
                    disabled={isLoading}
                    className="text-destructive hover:text-destructive"
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    {t('sessionManager.logout')}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t('sessionManager.noOtherSessions')}
          </p>
        )}

        {/* Security Notice */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">{t('sessionManager.securityNotice.title')}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t('sessionManager.securityNotice.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Revoke Single Session Dialog */}
        <ConfirmDialog
          open={!!revokeId}
          onOpenChange={(open) => !open && setRevokeId(null)}
          title={t('sessionManager.revokeDialog.title')}
          description={t('sessionManager.revokeDialog.description')}
          confirmText={t('sessionManager.revokeDialog.confirm')}
          cancelText={t('sessionManager.revokeDialog.cancel')}
          variant="destructive"
          onConfirm={handleRevokeSession}
        />

        {/* Revoke All Sessions Dialog */}
        <ConfirmDialog
          open={showRevokeAllDialog}
          onOpenChange={setShowRevokeAllDialog}
          title={t('sessionManager.revokeAllDialog.title')}
          description={t('sessionManager.revokeAllDialog.description')}
          confirmText={t('sessionManager.revokeAllDialog.confirm')}
          cancelText={t('sessionManager.revokeAllDialog.cancel')}
          variant="destructive"
          onConfirm={handleRevokeAll}
        />
      </CardContent>
    </Card>
  );
}

export default SessionManager;
