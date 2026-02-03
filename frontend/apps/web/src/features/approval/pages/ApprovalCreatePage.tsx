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
import { ArrowLeft, Send, Plus, X, User } from 'lucide-react';
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
