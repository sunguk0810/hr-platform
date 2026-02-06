import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/useToast';
import { CalendarDays, Save } from 'lucide-react';
import { LeaveUsageConditions } from '../components/LeaveUsageConditions';
import { LeaveApprovalLineRules } from '../components/LeaveApprovalLineRules';

interface TenureBonusRow {
  id: string;
  yearFrom: number;
  yearTo: number | null;
  bonusDays: number;
}

interface SpecialLeaveRow {
  id: string;
  name: string;
  days: number;
  description: string;
}

export default function LeavePolicyPage() {
  const { toast } = useToast();

  // Basic Annual Leave Settings
  const [monthlyAccrualCount, setMonthlyAccrualCount] = useState(1);
  const [baseAnnualDays, setBaseAnnualDays] = useState(15);

  // Tenure-based bonus days table
  const [tenureBonusRows, setTenureBonusRows] = useState<TenureBonusRow[]>([
    { id: 'tb-1', yearFrom: 3, yearTo: 5, bonusDays: 1 },
    { id: 'tb-2', yearFrom: 5, yearTo: 10, bonusDays: 3 },
    { id: 'tb-3', yearFrom: 10, yearTo: 15, bonusDays: 5 },
    { id: 'tb-4', yearFrom: 15, yearTo: 20, bonusDays: 7 },
    { id: 'tb-5', yearFrom: 20, yearTo: null, bonusDays: 10 },
  ]);

  // Special Leave Settings
  const [specialLeaves, setSpecialLeaves] = useState<SpecialLeaveRow[]>([
    { id: 'sl-1', name: '결혼', days: 5, description: '본인 결혼' },
    { id: 'sl-2', name: '출산', days: 10, description: '배우자 출산 시' },
    { id: 'sl-3', name: '사망 (배우자)', days: 5, description: '배우자 사망' },
    { id: 'sl-4', name: '사망 (부모)', days: 5, description: '본인 또는 배우자의 부모 사망' },
    { id: 'sl-5', name: '사망 (자녀)', days: 5, description: '자녀 사망' },
    { id: 'sl-6', name: '사망 (조부모/형제)', days: 3, description: '조부모 또는 형제자매 사망' },
    { id: 'sl-7', name: '자녀 결혼', days: 1, description: '자녀 결혼' },
    { id: 'sl-8', name: '생일', days: 0.5, description: '본인 생일 (반차)' },
  ]);

  // Carry-over Policy
  const [carryOverEnabled, setCarryOverEnabled] = useState(true);
  const [maxCarryOverDays, setMaxCarryOverDays] = useState(5);
  const [carryOverExpiry, setCarryOverExpiry] = useState('6');

  const handleTenureBonusChange = (id: string, field: keyof TenureBonusRow, value: number | null) => {
    setTenureBonusRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSpecialLeaveChange = (id: string, days: number) => {
    setSpecialLeaves((prev) =>
      prev.map((row) => (row.id === id ? { ...row, days } : row))
    );
  };

  const handleSave = () => {
    toast({
      title: '저장 완료',
      description: '연차 규칙 설정이 저장되었습니다.',
    });
  };

  return (
    <>
      <PageHeader
        title="연차 규칙 설정"
        description="연차 발생 규칙 및 특별휴가 정책을 관리합니다."
        actions={
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            저장
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Basic Annual Leave Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>기본 연차 설정</CardTitle>
                <CardDescription>연차 발생 기본 규칙을 설정합니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyAccrual">입사 1년 미만 월별 발생일수</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="monthlyAccrual"
                    type="number"
                    min={0}
                    max={5}
                    step={0.5}
                    value={monthlyAccrualCount}
                    onChange={(e) => setMonthlyAccrualCount(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">일 / 월</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  입사 1년 미만 직원에게 매월 발생하는 연차 일수
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseAnnualDays">1년차 이후 기본일수</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="baseAnnualDays"
                    type="number"
                    min={0}
                    max={30}
                    value={baseAnnualDays}
                    onChange={(e) => setBaseAnnualDays(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">일 / 년</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  근속 1년 이상 직원에게 매년 발생하는 기본 연차 일수
                </p>
              </div>
            </div>

            {/* Tenure-based bonus days table */}
            <div className="space-y-3">
              <Label>근속 연수별 가산일수</Label>
              <p className="text-xs text-muted-foreground">
                근속 연수에 따라 기본 연차에 추가로 부여되는 가산일수
              </p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">근속 시작 (년)</TableHead>
                      <TableHead className="w-[140px]">근속 종료 (년)</TableHead>
                      <TableHead className="w-[140px]">가산일수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenureBonusRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={row.yearFrom}
                            onChange={(e) =>
                              handleTenureBonusChange(row.id, 'yearFrom', Number(e.target.value))
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          {row.yearTo !== null ? (
                            <Input
                              type="number"
                              min={row.yearFrom + 1}
                              value={row.yearTo}
                              onChange={(e) =>
                                handleTenureBonusChange(row.id, 'yearTo', Number(e.target.value))
                              }
                              className="w-20"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">이상</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={30}
                              value={row.bonusDays}
                              onChange={(e) =>
                                handleTenureBonusChange(row.id, 'bonusDays', Number(e.target.value))
                              }
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">일</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Leave Settings */}
        <Card>
          <CardHeader>
            <CardTitle>특별휴가 설정</CardTitle>
            <CardDescription>경조사 등 특별휴가 일수를 설정합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">휴가 유형</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead className="w-[140px]">일수</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialLeaves.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={30}
                            step={0.5}
                            value={row.days}
                            onChange={(e) =>
                              handleSpecialLeaveChange(row.id, Number(e.target.value))
                            }
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">일</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Carry-over Policy */}
        <Card>
          <CardHeader>
            <CardTitle>이월 정책</CardTitle>
            <CardDescription>미사용 연차의 이월 정책을 설정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>연차 이월 허용</Label>
                <p className="text-sm text-muted-foreground">
                  미사용 연차를 다음 해로 이월할 수 있도록 허용합니다.
                </p>
              </div>
              <Switch
                checked={carryOverEnabled}
                onCheckedChange={setCarryOverEnabled}
              />
            </div>

            {carryOverEnabled && (
              <div className="grid gap-6 md:grid-cols-2 border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="maxCarryOver">최대 이월일수</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxCarryOver"
                      type="number"
                      min={0}
                      max={30}
                      value={maxCarryOverDays}
                      onChange={(e) => setMaxCarryOverDays(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">일</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    이월 가능한 최대 연차 일수 (0 = 무제한)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carryOverExpiry">이월 연차 만료 기간</Label>
                  <Select
                    value={carryOverExpiry}
                    onValueChange={setCarryOverExpiry}
                  >
                    <SelectTrigger className="w-48" id="carryOverExpiry">
                      <SelectValue placeholder="만료 기간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3개월</SelectItem>
                      <SelectItem value="6">6개월</SelectItem>
                      <SelectItem value="12">12개월</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    이월된 연차가 만료되는 기간
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Usage Conditions - FR-ATT-003-02 */}
        <LeaveUsageConditions />

        {/* Leave Approval Line Rules - FR-ATT-003-03 */}
        <LeaveApprovalLineRules />
      </div>
    </>
  );
}
