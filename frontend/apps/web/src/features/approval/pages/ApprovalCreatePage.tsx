import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DatePicker } from '@/components/common/DatePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Send, Plus, X, User, ChevronRight, Users, FileText, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { format } from 'date-fns';
import { useCreateApproval } from '../hooks/useApprovals';
import type { ApprovalType, ApprovalUrgency, CreateApprovalRequest } from '@hr-platform/shared-types';

const APPROVAL_TYPES: { value: ApprovalType; label: string }[] = [
  { value: 'LEAVE_REQUEST', label: '휴가신청' },
  { value: 'EXPENSE', label: '경비청구' },
  { value: 'OVERTIME', label: '초과근무' },
  { value: 'PERSONNEL', label: '인사관련' },
  { value: 'GENERAL', label: '일반기안' },
];

const URGENCY_OPTIONS: { value: ApprovalUrgency; label: string }[] = [
  { value: 'LOW', label: '낮음' },
  { value: 'NORMAL', label: '보통' },
  { value: 'HIGH', label: '긴급' },
];

// Mock approvers for demo
const MOCK_APPROVERS = [
  { id: 'emp-001', name: '홍길동', department: '개발팀', position: '팀장' },
  { id: 'emp-003', name: '이영희', department: '인사팀', position: '매니저' },
  { id: 'emp-009', name: '임준혁', department: '영업팀', position: '팀장' },
  { id: 'emp-005', name: '최수진', department: '마케팅팀', position: '팀장' },
];

interface Approver {
  id: string;
  name: string;
  department: string;
  position: string;
}

export default function ApprovalCreatePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [mobileStep, setMobileStep] = useState<'form' | 'approvers'>('form');
  const [formData, setFormData] = useState<{
    type: ApprovalType | '';
    title: string;
    content: string;
    urgency: ApprovalUrgency;
    dueDate: Date | undefined;
  }>({
    type: '',
    title: '',
    content: '',
    urgency: 'NORMAL',
    dueDate: undefined,
  });

  const [selectedApprovers, setSelectedApprovers] = useState<Approver[]>([]);
  const [showApproverSelect, setShowApproverSelect] = useState(false);

  const createMutation = useCreateApproval();

  const handleAddApprover = (approver: Approver) => {
    if (!selectedApprovers.find(a => a.id === approver.id)) {
      setSelectedApprovers([...selectedApprovers, approver]);
    }
    setShowApproverSelect(false);
  };

  const handleRemoveApprover = (id: string) => {
    setSelectedApprovers(selectedApprovers.filter(a => a.id !== id));
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.title || !formData.content || selectedApprovers.length === 0) {
      return;
    }

    try {
      const data: CreateApprovalRequest = {
        type: formData.type,
        title: formData.title,
        content: formData.content,
        urgency: formData.urgency,
        dueDate: formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : undefined,
        approverIds: selectedApprovers.map(a => a.id),
      };

      await createMutation.mutateAsync(data);
      navigate('/approvals');
    } catch (error) {
      console.error('Create approval failed:', error);
    }
  };

  const availableApprovers = MOCK_APPROVERS.filter(
    a => !selectedApprovers.find(s => s.id === a.id)
  );

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
              {mobileStep === 'form' ? '결재 작성' : '결재선 설정'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {mobileStep === 'form' ? '문서 내용을 입력하세요' : '결재자를 추가하세요'}
            </p>
          </div>
        </div>

        {/* Mobile Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            mobileStep === 'form' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <FileText className="h-4 w-4" />
            <span>1. 문서</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            mobileStep === 'approvers' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <Users className="h-4 w-4" />
            <span>2. 결재선</span>
          </div>
        </div>

        {/* Mobile Form Step */}
        {mobileStep === 'form' && (
          <div className="space-y-4">
            {/* Document Type & Urgency */}
            <div className="bg-card rounded-2xl border p-4 space-y-4">
              <div className="grid gap-2">
                <Label className="text-sm">문서 유형 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ApprovalType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm">긴급도</Label>
                <div className="flex gap-2">
                  {URGENCY_OPTIONS.map((opt) => (
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
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm">처리기한</Label>
                <DatePicker
                  value={formData.dueDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                  disabledDates={(date) => date < new Date()}
                  placeholder="선택 (선택사항)"
                />
              </div>
            </div>

            {/* Title & Content */}
            <div className="bg-card rounded-2xl border p-4 space-y-4">
              <div className="grid gap-2">
                <Label className="text-sm">제목 *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="문서 제목을 입력하세요"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-sm">내용 *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="문서 내용을 입력하세요"
                  rows={8}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Preview Selected Approvers */}
            {selectedApprovers.length > 0 && (
              <div className="bg-card rounded-2xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">결재선</span>
                  </div>
                  <span className="text-xs text-primary">{selectedApprovers.length}명 선택됨</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedApprovers.map((approver, idx) => (
                    <div
                      key={approver.id}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      {approver.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Approvers Step */}
        {mobileStep === 'approvers' && (
          <div className="space-y-4">
            {/* Selected Approvers */}
            <div className="bg-card rounded-2xl border p-4">
              <p className="text-sm font-medium mb-3">선택된 결재자 ({selectedApprovers.length}명)</p>
              {selectedApprovers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  아래에서 결재자를 선택해주세요
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedApprovers.map((approver, index) => (
                    <div
                      key={approver.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
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

            {/* Available Approvers */}
            {availableApprovers.length > 0 && (
              <div className="bg-card rounded-2xl border p-4">
                <p className="text-sm font-medium mb-3">결재자 추가</p>
                <div className="space-y-2">
                  {availableApprovers.map((approver) => (
                    <button
                      key={approver.id}
                      onClick={() => handleAddApprover(approver)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 active:bg-muted transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{approver.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {approver.department} / {approver.position}
                        </p>
                      </div>
                      <Plus className="h-5 w-5 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>결재선은 순서대로 진행됩니다. 첫 번째 결재자가 승인하면 다음 결재자에게 전달됩니다.</p>
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
                취소
              </Button>
              <Button
                className="flex-1 h-12"
                onClick={() => setMobileStep('approvers')}
                disabled={!formData.type || !formData.title || !formData.content}
              >
                다음
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
                '요청 중...'
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  결재 요청
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
        title="결재 문서 작성"
        description="새 결재 문서를 작성합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/approvals')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.type ||
                !formData.title ||
                !formData.content ||
                selectedApprovers.length === 0 ||
                createMutation.isPending
              }
            >
              <Send className="mr-2 h-4 w-4" />
              {createMutation.isPending ? '요청 중...' : '결재 요청'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>문서 내용</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>문서 유형 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ApprovalType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPROVAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>긴급도</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value as ApprovalUrgency }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>처리기한</Label>
              <DatePicker
                value={formData.dueDate}
                onChange={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                disabledDates={(date) => date < new Date()}
                placeholder="처리기한 선택 (선택사항)"
              />
            </div>

            <div className="grid gap-2">
              <Label>제목 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="문서 제목을 입력하세요."
              />
            </div>

            <div className="grid gap-2">
              <Label>내용 *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="문서 내용을 입력하세요."
                rows={10}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>결재선</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected approvers */}
            <div className="space-y-2">
              {selectedApprovers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  결재자를 추가해주세요.
                </p>
              ) : (
                selectedApprovers.map((approver, index) => (
                  <div
                    key={approver.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {index + 1}
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

            {/* Add approver button */}
            {!showApproverSelect && availableApprovers.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowApproverSelect(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                결재자 추가
              </Button>
            )}

            {/* Approver selection */}
            {showApproverSelect && (
              <div className="space-y-2 p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">결재자 선택</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApproverSelect(false)}
                  >
                    취소
                  </Button>
                </div>
                {availableApprovers.map((approver) => (
                  <button
                    key={approver.id}
                    type="button"
                    onClick={() => handleAddApprover(approver)}
                    className="flex items-center gap-3 w-full p-2 rounded hover:bg-muted text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{approver.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {approver.department} / {approver.position}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/30 rounded">
              결재선은 순서대로 진행됩니다. 첫 번째 결재자가 승인하면 다음 결재자에게 전달됩니다.
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
