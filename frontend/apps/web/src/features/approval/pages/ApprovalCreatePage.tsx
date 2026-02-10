import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { DatePicker } from '@/components/common/DatePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Send, Plus, X, ChevronRight, Users, FileText, AlertCircle, Zap, ShieldAlert, GitFork, Handshake } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { format } from 'date-fns';
import { useCreateApproval } from '../hooks/useApprovals';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/apiClient';
import { ApprovalLinePreview } from '../components/ApprovalLinePreview';
import { OrgTreeApproverPicker } from '../components/OrgTreeApproverPicker';
import type { SelectedApprover } from '../components/OrgTreeApproverPicker';
import type { ApprovalType, ApprovalUrgency, ApprovalMode, ParallelCompletionCondition, CreateApprovalRequest } from '@hr-platform/shared-types';

const APPROVAL_TYPE_KEYS: { value: ApprovalType; key: string }[] = [
  { value: 'LEAVE_REQUEST', key: 'type.leaveRequest' },
  { value: 'EXPENSE', key: 'type.expense' },
  { value: 'OVERTIME', key: 'type.overtime' },
  { value: 'PERSONNEL', key: 'type.personnel' },
  { value: 'GENERAL', key: 'type.general' },
];

const URGENCY_OPTION_KEYS: { value: ApprovalUrgency; key: string }[] = [
  { value: 'LOW', key: 'urgency.low' },
  { value: 'NORMAL', key: 'urgency.normal' },
  { value: 'HIGH', key: 'urgency.high' },
];

const APPROVAL_MODE_OPTION_KEYS: { value: ApprovalMode; labelKey: string; descKey: string; disabled: boolean }[] = [
  { value: 'SEQUENTIAL', labelKey: 'mode.sequential', descKey: 'mode.sequentialDesc', disabled: false },
  { value: 'DIRECT', labelKey: 'mode.direct', descKey: 'mode.directDesc', disabled: false },
  { value: 'PARALLEL', labelKey: 'mode.parallel', descKey: 'mode.parallelDesc', disabled: false },
  { value: 'CONSENSUS', labelKey: 'mode.consensus', descKey: 'mode.consensusDesc', disabled: false },
];

const PARALLEL_COMPLETION_KEYS: Record<ParallelCompletionCondition, string> = {
  ALL: 'completionCondition.all',
  MAJORITY: 'completionCondition.majorityApproval',
  ANY: 'completionCondition.any',
};

interface Approver {
  id: string;
  name: string;
  department: string;
  position: string;
}

export default function ApprovalCreatePage() {
  const { t } = useTranslation('approval');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentUser = useAuthStore((state) => state.user);

  const [mobileStep, setMobileStep] = useState<'form' | 'approvers'>('form');
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('SEQUENTIAL');
  const [selfApprovalWarning, setSelfApprovalWarning] = useState(false);

  // Load parallel completion condition from tenant config
  const { data: parallelFeature } = useQuery({
    queryKey: ['tenant', 'features', 'PARALLEL_APPROVAL'],
    queryFn: async () => {
      const res = await apiClient.get('/tenants/current/features/PARALLEL_APPROVAL');
      return res.data?.data;
    },
  });

  // Derive parallelCompletion from tenant config instead of local state
  const parallelCompletion: ParallelCompletionCondition =
    parallelFeature?.config?.minApprovers === 'majority' ? 'MAJORITY' :
    parallelFeature?.config?.minApprovers === 'one' ? 'ANY' : 'ALL';
  const [formData, setFormData] = useState<{
    documentType: ApprovalType | '';
    title: string;
    content: string;
    urgency: ApprovalUrgency;
    dueDate: Date | undefined;
  }>({
    documentType: '',
    title: '',
    content: '',
    urgency: 'NORMAL',
    dueDate: undefined,
  });

  const [selectedApprovers, setSelectedApprovers] = useState<Approver[]>([]);
  const [isApproverPickerOpen, setIsApproverPickerOpen] = useState(false);

  const createMutation = useCreateApproval();

  const handleModeChange = (mode: ApprovalMode) => {
    setApprovalMode(mode);
    // When switching to DIRECT mode, keep only the first approver (or clear all)
    if (mode === 'DIRECT' && selectedApprovers.length > 1) {
      setSelectedApprovers([selectedApprovers[0]]);
    }
  };

  const getModeIcon = (mode: ApprovalMode) => {
    switch (mode) {
      case 'DIRECT': return <Zap className="h-3.5 w-3.5 text-teal-500" />;
      case 'PARALLEL': return <GitFork className="h-3.5 w-3.5 text-blue-500" />;
      case 'CONSENSUS': return <Handshake className="h-3.5 w-3.5 text-purple-500" />;
      default: return null;
    }
  };

  const handleApproversSelected = (newApprovers: SelectedApprover[]) => {
    // Self-approval prevention: filter out the current user
    const filtered = newApprovers.filter(a => {
      if (currentUser && (a.id === currentUser.employeeId || a.id === currentUser.id)) {
        setSelfApprovalWarning(true);
        setTimeout(() => setSelfApprovalWarning(false), 4000);
        return false;
      }
      return true;
    });

    if (filtered.length === 0) return;

    // Map SelectedApprover to Approver (department/position field names differ)
    const mapped: Approver[] = filtered.map(a => ({
      id: a.id,
      name: a.name,
      department: a.departmentName,
      position: a.positionName || '',
    }));

    if (approvalMode === 'DIRECT') {
      // In DIRECT mode, replace the approver (only one allowed)
      setSelectedApprovers([mapped[0]]);
    } else {
      // Add to existing list, avoiding duplicates
      setSelectedApprovers(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const unique = mapped.filter(a => !existingIds.has(a.id));
        return [...prev, ...unique];
      });
    }
  };

  const handleRemoveApprover = (id: string) => {
    setSelectedApprovers(selectedApprovers.filter(a => a.id !== id));
  };

  const handleSubmit = async () => {
    if (!formData.documentType || !formData.title || !formData.content || selectedApprovers.length === 0) {
      return;
    }

    try {
      const data: CreateApprovalRequest = {
        documentType: formData.documentType,
        title: formData.title,
        content: formData.content,
        urgency: formData.urgency,
        dueDate: formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : undefined,
        approvalLines: selectedApprovers.map(a => ({
          approverId: a.id,
          approverName: a.name,
          approverDepartmentName: a.department,
          approverPosition: a.position,
        })),
        mode: approvalMode,
        parallelCompletionCondition: approvalMode === 'PARALLEL' ? parallelCompletion : undefined,
      };

      await createMutation.mutateAsync(data);
      navigate('/approvals');
    } catch (error) {
      console.error('Create approval failed:', error);
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="pb-24">
        {/* Mobile Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              if (mobileStep === 'approvers') {
                setMobileStep('form');
              } else {
                navigate(-1);
              }
            }}
            className="p-2 -ml-2 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">
              {mobileStep === 'form' ? t('approvalCreatePage.mobileFormTitle') : t('approvalCreatePage.mobileApproversTitle')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {mobileStep === 'form' ? t('approvalCreatePage.mobileFormDesc') : t('approvalCreatePage.mobileApproversDesc')}
            </p>
          </div>
        </div>

        {/* Mobile Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            mobileStep === 'form' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <FileText className="h-4 w-4" />
            <span>{t('approvalCreatePage.stepDocument')}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            mobileStep === 'approvers' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <Users className="h-4 w-4" />
            <span>{t('approvalCreatePage.stepApprovalLine')}</span>
          </div>
        </div>

        {/* Mobile Form Step */}
        {mobileStep === 'form' && (
          <div className="space-y-4">
            {/* Document Type & Urgency */}
            <div className="bg-card rounded-2xl border p-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="mobile-type" className="text-sm">{t('approvalCreatePage.documentType')}</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value as ApprovalType }))}
                >
                  <SelectTrigger id="mobile-type">
                    <SelectValue placeholder={t('approvalCreatePage.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_TYPE_KEYS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {t(type.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm">{t('approvalCreatePage.urgencyLabel')}</Label>
                <div className="flex gap-2">
                  {URGENCY_OPTION_KEYS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData(prev => ({ ...prev, urgency: opt.value }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.urgency === opt.value
                          ? opt.value === 'HIGH'
                            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                            : 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {t(opt.key)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm">{t('approvalCreatePage.dueDateLabel')}</Label>
                <DatePicker
                  value={formData.dueDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                  disabledDates={(date) => date < new Date()}
                  placeholder={t('approvalCreatePage.dueDatePlaceholder')}
                />
              </div>
            </div>

            {/* Approval Mode Selector (Mobile) */}
            <div className="bg-card rounded-2xl border p-4 space-y-3">
              <Label className="text-sm font-medium">{t('approvalCreatePage.approvalModeLabel')}</Label>
              <RadioGroup
                value={approvalMode}
                onValueChange={(v) => handleModeChange(v as ApprovalMode)}
                className="grid grid-cols-2 gap-2"
              >
                {APPROVAL_MODE_OPTION_KEYS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                      approvalMode === opt.value
                        ? 'bg-primary/5 border-primary'
                        : 'bg-muted/30 border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={opt.value} />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1">
                        {getModeIcon(opt.value)}
                        {t(opt.labelKey)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t(opt.descKey)}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>

              {/* Parallel completion condition (mobile) - read-only from tenant config */}
              {approvalMode === 'PARALLEL' && (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs text-muted-foreground">{t('approvalCreatePage.completionConditionTenant')}</Label>
                  <Badge variant="outline">
                    {t(PARALLEL_COMPLETION_KEYS[parallelCompletion])}
                  </Badge>
                </div>
              )}
            </div>

            {/* Title & Content */}
            <div className="bg-card rounded-2xl border p-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="mobile-title" className="text-sm">{t('approvalCreatePage.titleLabel')}</Label>
                <Input
                  id="mobile-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('approvalCreatePage.titlePlaceholder')}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mobile-content" className="text-sm">{t('approvalCreatePage.contentLabel')}</Label>
                <Textarea
                  id="mobile-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={t('approvalCreatePage.contentPlaceholder')}
                  rows={8}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Preview Selected Approvers with ApprovalLinePreview */}
            {selectedApprovers.length > 0 && (
              <div className="bg-card rounded-2xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('approvalCreatePage.approvalLine')}</span>
                    {approvalMode === 'DIRECT' && (
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded">{t('mode.direct')}</span>
                    )}
                  </div>
                  <span className="text-xs text-primary">{t('approvalCreatePage.selectedCount', { count: selectedApprovers.length })}</span>
                </div>
                <ApprovalLinePreview
                  mode={approvalMode}
                  requesterName={currentUser?.name || t('common.me')}
                  approvers={selectedApprovers}
                />
              </div>
            )}
          </div>
        )}

        {/* Mobile Approvers Step */}
        {mobileStep === 'approvers' && (
          <div className="space-y-4">
            {/* Self-approval warning */}
            {selfApprovalWarning && (
              <Alert variant="warning" className="rounded-2xl">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>
                  {t('approvalCreatePage.selfApprovalWarning')}
                </AlertDescription>
              </Alert>
            )}

            {/* Selected Approvers */}
            <div className="bg-card rounded-2xl border p-4">
              <p className="text-sm font-medium mb-3">
                {approvalMode === 'DIRECT' ? t('approvalCreatePage.finalApprover') : t('approvalCreatePage.selectedApprovers', { count: selectedApprovers.length })}
              </p>
              {selectedApprovers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {approvalMode === 'DIRECT'
                    ? t('approvalCreatePage.selectFinalApprover')
                    : t('approvalCreatePage.selectApprover')}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedApprovers.map((approver, index) => (
                    <div
                      key={approver.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        approvalMode === 'DIRECT' ? 'bg-teal-500 text-white' : 'bg-primary text-primary-foreground'
                      }`}>
                        {approvalMode === 'DIRECT' ? <Zap className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{approver.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {approver.department} / {approver.position}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveApprover(approver.id)}
                        className="p-2 rounded-full hover:bg-muted active:bg-muted/80"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add approver button */}
            {(approvalMode !== 'DIRECT' || selectedApprovers.length === 0) && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl"
                onClick={() => setIsApproverPickerOpen(true)}
              >
                <Plus className="mr-2 h-5 w-5" />
                {approvalMode === 'DIRECT' ? t('approvalCreatePage.orgChartFinalApprover') : t('approvalCreatePage.orgChartAddApprover')}
              </Button>
            )}

            <OrgTreeApproverPicker
              open={isApproverPickerOpen}
              onOpenChange={setIsApproverPickerOpen}
              onSelect={handleApproversSelected}
              excludeIds={selectedApprovers.map(a => a.id)}
              maxSelection={approvalMode === 'DIRECT' ? 1 : undefined}
            />

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                {approvalMode === 'DIRECT'
                  ? t('approvalCreatePage.directModeInfo')
                  : approvalMode === 'PARALLEL'
                  ? t('approvalCreatePage.parallelModeInfo')
                  : approvalMode === 'CONSENSUS'
                  ? t('approvalCreatePage.consensusModeInfo')
                  : t('approvalCreatePage.sequentialModeInfo')}
              </p>
            </div>
          </div>
        )}

        {/* Mobile Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 pb-safe z-50">
          {mobileStep === 'form' ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={() => navigate(-1)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1 h-12"
                onClick={() => setMobileStep('approvers')}
                disabled={!formData.documentType || !formData.title || !formData.content}
              >
                {t('common.next')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              className="w-full h-12"
              onClick={handleSubmit}
              disabled={selectedApprovers.length === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? (
                t('common.requesting')
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  {t('approvalCreatePage.submitRequest')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('approvalCreatePage.title')}
        description={t('approvalCreatePage.description')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/approvals')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.documentType ||
                !formData.title ||
                !formData.content ||
                selectedApprovers.length === 0 ||
                createMutation.isPending
              }
            >
              <Send className="mr-2 h-4 w-4" />
              {createMutation.isPending ? t('common.requesting') : t('approvalCreatePage.submitRequest')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('approvalCreatePage.documentContentCard')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="type">{t('approvalCreatePage.documentType')}</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value as ApprovalType }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder={t('approvalCreatePage.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_TYPE_KEYS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {t(type.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="urgency">{t('approvalCreatePage.urgencyLabel')}</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value as ApprovalUrgency }))}
                >
                  <SelectTrigger id="urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTION_KEYS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {t(opt.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t('approvalCreatePage.dueDateLabel')}</Label>
              <DatePicker
                value={formData.dueDate}
                onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                disabledDates={(date) => date < new Date()}
                placeholder={t('approvalCreatePage.dueDateDesktopPlaceholder')}
              />
            </div>

            {/* Approval Mode Selector (Desktop) */}
            <div className="grid gap-3">
              <Label>{t('approvalCreatePage.approvalModeLabel')}</Label>
              <RadioGroup
                value={approvalMode}
                onValueChange={(v) => handleModeChange(v as ApprovalMode)}
                className="flex flex-wrap gap-3"
              >
                {APPROVAL_MODE_OPTION_KEYS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      approvalMode === opt.value
                        ? 'bg-primary/5 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={opt.value} />
                    <span className="text-sm font-medium flex items-center gap-1">
                      {getModeIcon(opt.value)}
                      {t(opt.labelKey)}
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      ({t(opt.descKey)})
                    </span>
                  </label>
                ))}
              </RadioGroup>

              {/* Parallel completion condition - read-only from tenant config */}
              {approvalMode === 'PARALLEL' && (
                <div className="ml-1 mt-2 space-y-2">
                  <Label className="text-sm text-muted-foreground">{t('approvalCreatePage.completionConditionTenant')}</Label>
                  <Badge variant="outline">
                    {t(PARALLEL_COMPLETION_KEYS[parallelCompletion])}
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">{t('approvalCreatePage.titleLabel')}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('approvalCreatePage.titlePlaceholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">{t('approvalCreatePage.contentLabel')}</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t('approvalCreatePage.contentPlaceholder')}
                rows={10}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t('approvalCreatePage.approvalLine')}
              {approvalMode === 'DIRECT' && (
                <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded font-normal">
                  {t('mode.direct')}
                </span>
              )}
              {approvalMode === 'PARALLEL' && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-normal">
                  {t('mode.parallelShort')}
                </span>
              )}
              {approvalMode === 'CONSENSUS' && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-normal">
                  {t('mode.consensusShort')}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Self-approval warning */}
            {selfApprovalWarning && (
              <Alert variant="warning">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>
                  {t('approvalCreatePage.selfApprovalWarning')}
                </AlertDescription>
              </Alert>
            )}

            {/* Selected approvers */}
            <div className="space-y-2">
              {selectedApprovers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {approvalMode === 'DIRECT'
                    ? t('approvalCreatePage.selectFinalApproverPlease')
                    : t('approvalCreatePage.addApproverPlease')}
                </p>
              ) : (
                selectedApprovers.map((approver, index) => (
                  <div
                    key={approver.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      approvalMode === 'DIRECT' ? 'bg-teal-500 text-white' : 'bg-muted'
                    }`}>
                      {approvalMode === 'DIRECT' ? <Zap className="h-4 w-4" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{approver.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {approver.department} / {approver.position}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveApprover(approver.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Add approver button - hide if DIRECT mode already has an approver */}
            {(approvalMode !== 'DIRECT' || selectedApprovers.length === 0) && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsApproverPickerOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {approvalMode === 'DIRECT' ? t('approvalCreatePage.orgChartFinalApprover') : t('approvalCreatePage.orgChartAddApprover')}
              </Button>
            )}

            <OrgTreeApproverPicker
              open={isApproverPickerOpen}
              onOpenChange={setIsApproverPickerOpen}
              onSelect={handleApproversSelected}
              excludeIds={selectedApprovers.map(a => a.id)}
              maxSelection={approvalMode === 'DIRECT' ? 1 : undefined}
            />

            {/* Approval Line Preview */}
            {selectedApprovers.length > 0 && (
              <div className="border rounded-lg p-3 bg-muted/10">
                <p className="text-xs font-medium text-muted-foreground mb-2">{t('approvalCreatePage.approvalLinePreview')}</p>
                <ApprovalLinePreview
                  mode={approvalMode}
                  requesterName={currentUser?.name || t('common.me')}
                  approvers={selectedApprovers}
                />
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded">
              {approvalMode === 'DIRECT'
                ? t('approvalCreatePage.directModeInfoFull')
                : approvalMode === 'PARALLEL'
                ? t('approvalCreatePage.parallelModeInfo')
                : approvalMode === 'CONSENSUS'
                ? t('approvalCreatePage.consensusModeInfoFull')
                : t('approvalCreatePage.sequentialModeInfo')}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
