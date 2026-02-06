import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Route,
} from 'lucide-react';
import { TemplateLineBuilder } from './TemplateLineBuilder';
import type {
  ConditionalRoutingRule,
  RoutingConditionField,
  RoutingConditionOperator,
  ApprovalLineTemplate,
} from '@hr-platform/shared-types';

const CONDITION_FIELD_OPTIONS: Array<{ value: RoutingConditionField; label: string }> = [
  { value: 'AMOUNT', label: '금액 (Amount)' },
  { value: 'LEAVE_DAYS', label: '휴가일수 (Leave Days)' },
];

const CONDITION_OPERATOR_OPTIONS: Array<{ value: RoutingConditionOperator; label: string }> = [
  { value: '>=', label: '>= (이상)' },
  { value: '<=', label: '<= (이하)' },
  { value: '==', label: '== (같음)' },
];

interface ConditionalRoutingRulesProps {
  value: ConditionalRoutingRule[];
  onChange: (value: ConditionalRoutingRule[]) => void;
}

/**
 * FR-APR-003-02: Conditional Routing Rules editor.
 * Allows admins to define conditions that automatically change approval lines
 * based on field values (e.g., amount thresholds, leave days).
 */
export function ConditionalRoutingRules({ value, onChange }: ConditionalRoutingRulesProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAdd = () => {
    const newRule: ConditionalRoutingRule = {
      id: `rule-${Date.now()}`,
      conditionField: 'AMOUNT',
      conditionOperator: '>=',
      conditionValue: 0,
      approvalLine: [],
    };
    onChange([...value, newRule]);
    setExpandedIndex(value.length);
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleUpdateRule = (index: number, updates: Partial<ConditionalRoutingRule>) => {
    const newValue = value.map((rule, i) =>
      i === index ? { ...rule, ...updates } : rule
    );
    onChange(newValue);
  };

  const handleUpdateApprovalLine = (index: number, approvalLine: ApprovalLineTemplate[]) => {
    handleUpdateRule(index, { approvalLine });
  };

  const getConditionSummary = (rule: ConditionalRoutingRule): string => {
    const fieldLabel = CONDITION_FIELD_OPTIONS.find(f => f.value === rule.conditionField)?.label || rule.conditionField;
    const formattedValue = rule.conditionField === 'AMOUNT'
      ? rule.conditionValue.toLocaleString()
      : String(rule.conditionValue);
    return `${fieldLabel} ${rule.conditionOperator} ${formattedValue}`;
  };

  if (value.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <Route className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground mb-4">조건부 라우팅 규칙이 없습니다.</p>
        <p className="text-sm text-muted-foreground mb-4">
          금액이나 휴가일수 등 조건에 따라 다른 결재선을 자동 적용할 수 있습니다.
        </p>
        <Button onClick={handleAdd} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          규칙 추가
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {value.map((rule, index) => (
        <Card key={rule.id} className="overflow-hidden">
          {/* Rule header */}
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50"
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <Route className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium text-sm">
              규칙 {index + 1}
            </span>
            <span className="text-sm text-muted-foreground truncate">
              {getConditionSummary(rule)}
            </span>
            {rule.approvalLine.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex-shrink-0">
                {rule.approvalLine.length}단계
              </span>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {expandedIndex === index ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Rule details (expanded) */}
          {expandedIndex === index && (
            <CardContent className="border-t pt-4 space-y-4">
              {/* Condition configuration */}
              <div>
                <Label className="text-sm font-medium mb-3 block">조건 설정</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">조건 필드</Label>
                    <Select
                      value={rule.conditionField}
                      onValueChange={(val) =>
                        handleUpdateRule(index, { conditionField: val as RoutingConditionField })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_FIELD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">연산자</Label>
                    <Select
                      value={rule.conditionOperator}
                      onValueChange={(val) =>
                        handleUpdateRule(index, { conditionOperator: val as RoutingConditionOperator })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPERATOR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {rule.conditionField === 'AMOUNT' ? '금액 (원)' : '일수'}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={rule.conditionValue}
                      onChange={(e) =>
                        handleUpdateRule(index, {
                          conditionValue: Number(e.target.value) || 0,
                        })
                      }
                      placeholder={rule.conditionField === 'AMOUNT' ? '예: 1000000' : '예: 3'}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {rule.conditionField === 'AMOUNT'
                    ? `예: "금액 >= 1,000,000" 이면 아래 결재선이 적용됩니다.`
                    : `예: "휴가일수 >= 3" 이면 아래 결재선이 적용됩니다.`}
                </p>
              </div>

              {/* Approval line for this condition */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  적용할 결재선
                </Label>
                <TemplateLineBuilder
                  value={rule.approvalLine}
                  onChange={(line) => handleUpdateApprovalLine(index, line)}
                />
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      <Button onClick={handleAdd} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        규칙 추가
      </Button>
    </div>
  );
}
