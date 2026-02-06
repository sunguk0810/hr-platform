import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/useToast';
import { Save, Users, ChevronDown } from 'lucide-react';

interface LeaveApprovalRule {
  id: string;
  leaveType: string;
  leaveTypeName: string;
  approvalSteps: number;
  approverRoles: string[];
  autoSubmit: boolean;
  note: string;
}

const DEFAULT_RULES: LeaveApprovalRule[] = [
  { id: 'lar-1', leaveType: 'ANNUAL', leaveTypeName: '연차', approvalSteps: 1, approverRoles: ['팀장'], autoSubmit: false, note: '' },
  { id: 'lar-2', leaveType: 'HALF_DAY', leaveTypeName: '반차', approvalSteps: 1, approverRoles: ['팀장'], autoSubmit: true, note: '자동 승인 가능' },
  { id: 'lar-3', leaveType: 'HOURLY', leaveTypeName: '시간제연차', approvalSteps: 1, approverRoles: ['팀장'], autoSubmit: true, note: '' },
  { id: 'lar-4', leaveType: 'SICK', leaveTypeName: '병가', approvalSteps: 2, approverRoles: ['팀장', '인사팀장'], autoSubmit: false, note: '3일 이상 시 진단서' },
  { id: 'lar-5', leaveType: 'CONDOLENCE', leaveTypeName: '경조휴가', approvalSteps: 2, approverRoles: ['팀장', '부서장'], autoSubmit: false, note: '' },
  { id: 'lar-6', leaveType: 'MATERNITY', leaveTypeName: '출산휴가', approvalSteps: 3, approverRoles: ['팀장', '부서장', '인사팀장'], autoSubmit: false, note: '필수 서류 제출' },
  { id: 'lar-7', leaveType: 'PARENTAL', leaveTypeName: '육아휴직', approvalSteps: 3, approverRoles: ['팀장', '부서장', '임원'], autoSubmit: false, note: '30일 전 신청' },
];

const AVAILABLE_ROLES = ['팀장', '부서장', '인사팀장', '임원', 'HR담당자'];

export function LeaveApprovalLineRules() {
  const { toast } = useToast();
  const [rules, setRules] = useState<LeaveApprovalRule[]>(DEFAULT_RULES);

  const updateRule = (id: string, updates: Partial<LeaveApprovalRule>) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule))
    );
  };

  const toggleRole = (id: string, role: string) => {
    setRules((prev) =>
      prev.map((rule) => {
        if (rule.id !== id) return rule;
        const roles = rule.approverRoles.includes(role)
          ? rule.approverRoles.filter((r) => r !== role)
          : [...rule.approverRoles, role];
        return { ...rule, approverRoles: roles };
      })
    );
  };

  const handleSave = () => {
    toast({
      title: '저장 완료',
      description: '휴가 유형별 결재선 규칙이 저장되었습니다.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>휴가 유형별 결재선 규칙</CardTitle>
              <CardDescription>
                휴가 유형에 따른 결재 단계 및 결재자 역할을 설정합니다. (FR-ATT-003-03)
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleSave} size="sm">
            <Save className="mr-2 h-4 w-4" />
            저장
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">휴가 유형</TableHead>
                <TableHead className="w-[130px]">결재 단계 수</TableHead>
                <TableHead className="w-[260px]">결재 역할</TableHead>
                <TableHead className="w-[100px] text-center">자동 상신</TableHead>
                <TableHead>비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.leaveTypeName}</TableCell>
                  <TableCell>
                    <Select
                      value={String(rule.approvalSteps)}
                      onValueChange={(value) =>
                        updateRule(rule.id, { approvalSteps: Number(value) })
                      }
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1단계</SelectItem>
                        <SelectItem value="2">2단계</SelectItem>
                        <SelectItem value="3">3단계</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-between font-normal"
                        >
                          <div className="flex flex-wrap gap-1 overflow-hidden">
                            {rule.approverRoles.length === 0 ? (
                              <span className="text-muted-foreground">역할 선택</span>
                            ) : (
                              rule.approverRoles.map((role) => (
                                <Badge key={role} variant="secondary" className="text-xs">
                                  {role}
                                </Badge>
                              ))
                            )}
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-3" align="start">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            결재 역할 선택
                          </p>
                          {AVAILABLE_ROLES.map((role) => (
                            <div key={role} className="flex items-center gap-2">
                              <Checkbox
                                id={`role-${rule.id}-${role}`}
                                checked={rule.approverRoles.includes(role)}
                                onCheckedChange={() => toggleRole(rule.id, role)}
                              />
                              <label
                                htmlFor={`role-${rule.id}-${role}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {role}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.autoSubmit}
                      onCheckedChange={(checked) =>
                        updateRule(rule.id, { autoSubmit: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={rule.note}
                      onChange={(e) => updateRule(rule.id, { note: e.target.value })}
                      placeholder="비고 입력"
                      className="h-8 text-sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
