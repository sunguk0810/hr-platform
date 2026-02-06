import { http, HttpResponse, delay } from 'msw';

export interface EmployeeNumberRule {
  prefix: string;
  includeYear: boolean;
  sequenceDigits: number;
}

// Mutable state for the rule
let currentRule: EmployeeNumberRule = {
  prefix: 'EMP',
  includeYear: true,
  sequenceDigits: 3,
};

// Track current sequence number per year
let currentSequence = 42;

function generatePreview(rule: EmployeeNumberRule): string {
  const year = new Date().getFullYear().toString();
  const nextSeq = currentSequence + 1;
  const seqStr = String(nextSeq).padStart(rule.sequenceDigits, '0');

  let result = rule.prefix;
  if (rule.includeYear) {
    result += year;
  }
  result += seqStr;

  return result;
}

function generateFormatDescription(rule: EmployeeNumberRule): string {
  let parts: string[] = [];
  parts.push(`접두사(${rule.prefix})`);
  if (rule.includeYear) {
    parts.push('연도(4자리)');
  }
  parts.push(`순번(${rule.sequenceDigits}자리)`);
  return parts.join(' + ');
}

export const employeeNumberRuleHandlers = [
  // Get current employee number rule
  http.get('/api/v1/settings/employee-number-rule', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: currentRule,
      timestamp: new Date().toISOString(),
    });
  }),

  // Update employee number rule
  http.put('/api/v1/settings/employee-number-rule', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as EmployeeNumberRule;

    if (!body.prefix || body.prefix.trim().length === 0) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'SET_001', message: '접두사는 필수 입력 항목입니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (![3, 4, 5].includes(body.sequenceDigits)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'SET_002', message: '순번 자릿수는 3, 4, 5 중 하나여야 합니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    currentRule = {
      prefix: body.prefix.trim().toUpperCase(),
      includeYear: body.includeYear,
      sequenceDigits: body.sequenceDigits,
    };

    return HttpResponse.json({
      success: true,
      data: currentRule,
      message: '사번 규칙이 저장되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get next available employee number preview
  http.get('/api/v1/settings/employee-number-rule/preview', async () => {
    await delay(150);

    const preview = generatePreview(currentRule);
    const formatDescription = generateFormatDescription(currentRule);

    return HttpResponse.json({
      success: true,
      data: {
        nextNumber: preview,
        currentSequence: currentSequence,
        formatDescription,
        rule: currentRule,
      },
      timestamp: new Date().toISOString(),
    });
  }),
];
