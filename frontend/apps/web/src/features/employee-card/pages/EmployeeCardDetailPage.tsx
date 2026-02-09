import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  User,
  Building2,
  Calendar,
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import { useEmployeeCard, useReportLostCard, useRevokeCard } from '../hooks/useEmployeeCard';
import type { EmployeeCardStatus } from '@hr-platform/shared-types';
import { EMPLOYEE_CARD_STATUS_LABELS, CARD_ISSUE_TYPE_LABELS } from '@hr-platform/shared-types';

const STATUS_COLORS: Record<EmployeeCardStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  EXPIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOST: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REVOKED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const ADMIN_ROLES = ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'];

export default function EmployeeCardDetailPage() {
  const { t } = useTranslation('employeeCard');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { hasAnyRole } = useAuthStore();
  const canRevoke = hasAnyRole(ADMIN_ROLES);

  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [lostDate, setLostDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [revokeReason, setRevokeReason] = useState('');

  const { data, isLoading } = useEmployeeCard(id || '');
  const reportLostMutation = useReportLostCard();
  const revokeMutation = useRevokeCard();

  const card = data?.data;

  const handleReportLost = async () => {
    if (!id || !lostDate || !location.trim() || !description.trim()) return;
    try {
      await reportLostMutation.mutateAsync({
        cardId: id,
        lostDate,
        location,
        description,
      });
      setLostDialogOpen(false);
      setLostDate('');
      setLocation('');
      setDescription('');
      toast({
        title: t('lostToast.success'),
        description: t('lostToast.successDesc'),
      });
      navigate('/employee-card');
    } catch {
      toast({
        title: t('lostToast.failed'),
        description: t('lostToast.failedDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async () => {
    if (!id || !revokeReason.trim()) return;
    try {
      await revokeMutation.mutateAsync(id);
      setRevokeDialogOpen(false);
      setRevokeReason('');
      toast({
        title: t('revokeToast.success'),
        description: t('revokeToast.successDesc'),
      });
      navigate('/employee-card');
    } catch {
      toast({
        title: t('revokeToast.failed'),
        description: t('revokeToast.failedDesc'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">{t('notFound.title')}</p>
        <Button variant="outline" onClick={() => navigate('/employee-card')}>
          {t('notFound.goToList')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t('detail')}
        description={t('cardNumber', { number: card.cardNumber })}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
                {t('detailSection.cardInfo')}
              </CardTitle>
              <Badge className={cn(STATUS_COLORS[card.status])}>
                {EMPLOYEE_CARD_STATUS_LABELS[card.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('detailSection.employeeInfo')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{card.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{card.employeeNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{card.departmentName}</p>
                    <p className="text-sm text-muted-foreground">{t('detailSection.department')}</p>
                  </div>
                </div>
                {card.positionName && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('detailSection.position')}</p>
                    <p className="font-medium">{card.positionName}</p>
                  </div>
                )}
                {card.gradeName && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('detailSection.grade')}</p>
                    <p className="font-medium">{card.gradeName}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Card Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('cardInfo.title')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t('cardInfo.cardNumber')}</p>
                  <p className="font-medium">{card.cardNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('cardInfo.issueType')}</p>
                  <p className="font-medium">{CARD_ISSUE_TYPE_LABELS[card.issueType]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('cardInfo.issueDate')}</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(card.issueDate), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('cardInfo.expiryDate')}</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(card.expiryDate), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('cardInfo.accessLevel')}</p>
                  <p className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {card.accessLevel}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('cardInfo.rfid')}</p>
                  <p className="font-medium">{card.rfidEnabled ? t('cardInfo.activated') : t('cardInfo.deactivated')}</p>
                </div>
                {card.qrCode && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('cardInfo.qrCode')}</p>
                    <p className="font-medium font-mono text-xs">{card.qrCode}</p>
                  </div>
                )}
              </div>
              {card.remarks && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{t('cardInfo.remarks')}</p>
                  <p className="font-medium mt-1">{card.remarks}</p>
                </div>
              )}
            </div>

            {/* Lost Info - if status is LOST */}
            {card.status === 'LOST' && (
              <>
                <Separator />
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-400 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <h3 className="font-medium">{t('lostBanner.title')}</h3>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {t('lostBanner.description')}
                  </p>
                </div>
              </>
            )}

            {/* Revoked Info - if status is REVOKED */}
            {card.status === 'REVOKED' && (
              <>
                <Separator />
                <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-800 dark:text-gray-400 mb-2">
                    <XCircle className="h-5 w-5" />
                    <h3 className="font-medium">{t('revokedBanner.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    {t('revokedBanner.description')}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('statusTimeline.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{t('statusTimeline.issued')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(card.issueDate), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                </div>

                {card.status === 'ACTIVE' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('statusTimeline.active')}</p>
                      <p className="text-sm text-muted-foreground">{t('statusTimeline.activeDesc')}</p>
                    </div>
                  </div>
                )}

                {card.status === 'LOST' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('statusTimeline.lost')}</p>
                      <p className="text-sm text-muted-foreground">{t('statusTimeline.lostDesc')}</p>
                    </div>
                  </div>
                )}

                {card.status === 'REVOKED' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('statusTimeline.revoked')}</p>
                      <p className="text-sm text-muted-foreground">{t('statusTimeline.revokedDesc')}</p>
                    </div>
                  </div>
                )}

                {card.status === 'EXPIRED' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('statusTimeline.expired')}</p>
                      <p className="text-sm text-muted-foreground">{t('statusTimeline.expiredDesc')}</p>
                    </div>
                  </div>
                )}

                {card.status === 'PENDING' && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{t('statusTimeline.pendingIssue')}</p>
                      <p className="text-sm text-muted-foreground">{t('statusTimeline.pendingIssueDesc')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {card.status === 'ACTIVE' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('actions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700"
                  onClick={() => setLostDialogOpen(true)}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {t('actions.reportLost')}
                </Button>
                {canRevoke && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setRevokeDialogOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('actions.revoke')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lost Report Dialog */}
      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lostDialog.title')}</DialogTitle>
            <DialogDescription>{t('lostDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lost-date">{t('lostDialog.lostDate')}</Label>
              <Input
                id="lost-date"
                type="date"
                value={lostDate}
                onChange={(e) => setLostDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="location">{t('lostDialog.lostLocation')}</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('lostDialog.lostLocationPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="description">{t('lostDialog.details')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('lostDialog.detailsPlaceholder')}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostDialogOpen(false)}>
              {t('lostDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReportLost}
              disabled={!lostDate || !location.trim() || !description.trim() || reportLostMutation.isPending}
            >
              {reportLostMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('lostDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('revokeDialog.title')}</DialogTitle>
            <DialogDescription>{t('revokeDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="revoke-reason">{t('revokeDialog.reasonLabel')}</Label>
              <Textarea
                id="revoke-reason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder={t('revokeDialog.reasonPlaceholder')}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
              {t('revokeDialog.cancel')}
            </Button>
            <Button
              onClick={handleRevoke}
              disabled={!revokeReason.trim() || revokeMutation.isPending}
            >
              {revokeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('revokeDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
