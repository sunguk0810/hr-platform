import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BarChart3,
  PieChart,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock tenant data
const mockTenants = [
  { id: 'tenant-1', name: 'A 계열사', code: 'A-CORP' },
  { id: 'tenant-2', name: 'B 계열사', code: 'B-CORP' },
  { id: 'tenant-3', name: 'C 계열사', code: 'C-CORP' },
  { id: 'tenant-4', name: 'D 계열사', code: 'D-CORP' },
];

interface TenantMetrics {
  tenantId: string;
  tenantName: string;
  employeeCount: number;
  activeUsers: number;
  monthlyApprovals: number;
  avgApprovalTime: number; // hours
  leaveUsageRate: number; // percentage
  overtimeHours: number;
}

const mockMetrics: Record<string, TenantMetrics> = {
  'tenant-1': {
    tenantId: 'tenant-1',
    tenantName: 'A 계열사',
    employeeCount: 1250,
    activeUsers: 1180,
    monthlyApprovals: 456,
    avgApprovalTime: 4.2,
    leaveUsageRate: 78,
    overtimeHours: 2340,
  },
  'tenant-2': {
    tenantId: 'tenant-2',
    tenantName: 'B 계열사',
    employeeCount: 890,
    activeUsers: 820,
    monthlyApprovals: 312,
    avgApprovalTime: 6.8,
    leaveUsageRate: 65,
    overtimeHours: 1890,
  },
  'tenant-3': {
    tenantId: 'tenant-3',
    tenantName: 'C 계열사',
    employeeCount: 2100,
    activeUsers: 1950,
    monthlyApprovals: 723,
    avgApprovalTime: 3.5,
    leaveUsageRate: 82,
    overtimeHours: 4120,
  },
  'tenant-4': {
    tenantId: 'tenant-4',
    tenantName: 'D 계열사',
    employeeCount: 560,
    activeUsers: 510,
    monthlyApprovals: 198,
    avgApprovalTime: 8.2,
    leaveUsageRate: 58,
    overtimeHours: 980,
  },
};

function MetricComparisonCard({
  title,
  icon: Icon,
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
  format = 'number',
  higherIsBetter = true,
}: {
  title: string;
  icon: React.ElementType;
  leftValue: number;
  rightValue: number;
  leftLabel: string;
  rightLabel: string;
  format?: 'number' | 'percentage' | 'hours';
  higherIsBetter?: boolean;
}) {
  const formatValue = (value: number) => {
    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'hours':
        return `${value}시간`;
      default:
        return value.toLocaleString();
    }
  };

  const diff = leftValue - rightValue;
  const diffPercent = rightValue !== 0 ? ((diff / rightValue) * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">{formatValue(leftValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{leftLabel}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                diff > 0 ? (higherIsBetter ? 'text-green-600' : 'text-red-600') : diff < 0 ? (higherIsBetter ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'
              )}
            >
              {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : null}
              {diff !== 0 && `${diff > 0 ? '+' : ''}${diffPercent}%`}
            </div>
          </div>
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold">{formatValue(rightValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{rightLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantComparisonPage() {
  const [leftTenant, setLeftTenant] = useState<string>('tenant-1');
  const [rightTenant, setRightTenant] = useState<string>('tenant-2');

  const leftMetrics = mockMetrics[leftTenant];
  const rightMetrics = mockMetrics[rightTenant];

  const handleExport = () => {
    alert('비교 리포트를 내보냅니다.');
  };

  return (
    <>
      <PageHeader
        title="테넌트 비교 분석"
        description="계열사별 주요 지표를 비교합니다."
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            리포트 내보내기
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Tenant Selection */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-8">
              <div className="flex-1 max-w-xs">
                <Select value={leftTenant} onValueChange={setLeftTenant}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTenants
                      .filter((t) => t.id !== rightTenant)
                      .map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {tenant.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm font-medium">VS</span>
              </div>
              <div className="flex-1 max-w-xs">
                <Select value={rightTenant} onValueChange={setRightTenant}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTenants
                      .filter((t) => t.id !== leftTenant)
                      .map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {tenant.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricComparisonCard
            title="총 직원 수"
            icon={Users}
            leftValue={leftMetrics.employeeCount}
            rightValue={rightMetrics.employeeCount}
            leftLabel={leftMetrics.tenantName}
            rightLabel={rightMetrics.tenantName}
          />
          <MetricComparisonCard
            title="활성 사용자"
            icon={Users}
            leftValue={leftMetrics.activeUsers}
            rightValue={rightMetrics.activeUsers}
            leftLabel={leftMetrics.tenantName}
            rightLabel={rightMetrics.tenantName}
          />
          <MetricComparisonCard
            title="월간 결재 건수"
            icon={FileText}
            leftValue={leftMetrics.monthlyApprovals}
            rightValue={rightMetrics.monthlyApprovals}
            leftLabel={leftMetrics.tenantName}
            rightLabel={rightMetrics.tenantName}
          />
          <MetricComparisonCard
            title="평균 결재 시간"
            icon={Clock}
            leftValue={leftMetrics.avgApprovalTime}
            rightValue={rightMetrics.avgApprovalTime}
            leftLabel={leftMetrics.tenantName}
            rightLabel={rightMetrics.tenantName}
            format="hours"
            higherIsBetter={false}
          />
          <MetricComparisonCard
            title="휴가 사용률"
            icon={PieChart}
            leftValue={leftMetrics.leaveUsageRate}
            rightValue={rightMetrics.leaveUsageRate}
            leftLabel={leftMetrics.tenantName}
            rightLabel={rightMetrics.tenantName}
            format="percentage"
          />
          <MetricComparisonCard
            title="월간 초과근무"
            icon={Clock}
            leftValue={leftMetrics.overtimeHours}
            rightValue={rightMetrics.overtimeHours}
            leftLabel={leftMetrics.tenantName}
            rightLabel={rightMetrics.tenantName}
            format="hours"
            higherIsBetter={false}
          />
        </div>

        {/* Detailed Comparison */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Tenant Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {leftMetrics.tenantName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>활성 사용자 비율</span>
                  <span className="font-medium">
                    {((leftMetrics.activeUsers / leftMetrics.employeeCount) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={(leftMetrics.activeUsers / leftMetrics.employeeCount) * 100}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>휴가 사용률</span>
                  <span className="font-medium">{leftMetrics.leaveUsageRate}%</span>
                </div>
                <Progress value={leftMetrics.leaveUsageRate} />
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">직원당 월 결재 건수</span>
                  <span className="font-medium">
                    {(leftMetrics.monthlyApprovals / leftMetrics.employeeCount).toFixed(2)}건
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">직원당 월 초과근무</span>
                  <span className="font-medium">
                    {(leftMetrics.overtimeHours / leftMetrics.employeeCount).toFixed(1)}시간
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Tenant Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {rightMetrics.tenantName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>활성 사용자 비율</span>
                  <span className="font-medium">
                    {((rightMetrics.activeUsers / rightMetrics.employeeCount) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={(rightMetrics.activeUsers / rightMetrics.employeeCount) * 100}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>휴가 사용률</span>
                  <span className="font-medium">{rightMetrics.leaveUsageRate}%</span>
                </div>
                <Progress value={rightMetrics.leaveUsageRate} />
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">직원당 월 결재 건수</span>
                  <span className="font-medium">
                    {(rightMetrics.monthlyApprovals / rightMetrics.employeeCount).toFixed(2)}건
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">직원당 월 초과근무</span>
                  <span className="font-medium">
                    {(rightMetrics.overtimeHours / rightMetrics.employeeCount).toFixed(1)}시간
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Insights */}
        <Card>
          <CardHeader>
            <CardTitle>분석 인사이트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  {leftMetrics.avgApprovalTime < rightMetrics.avgApprovalTime
                    ? leftMetrics.tenantName
                    : rightMetrics.tenantName}{' '}
                  강점
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>
                    • 평균 결재 시간이{' '}
                    {Math.abs(leftMetrics.avgApprovalTime - rightMetrics.avgApprovalTime).toFixed(1)}
                    시간 더 빠름
                  </li>
                  {leftMetrics.leaveUsageRate > rightMetrics.leaveUsageRate ? (
                    <li>• 휴가 사용률이 더 높아 워라밸이 양호</li>
                  ) : (
                    <li>• 초과근무 시간이 더 적음</li>
                  )}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">개선 권장사항</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• 결재 프로세스 간소화 검토</li>
                  <li>• 휴가 사용 권장 정책 도입</li>
                  <li>• 초과근무 모니터링 강화</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
