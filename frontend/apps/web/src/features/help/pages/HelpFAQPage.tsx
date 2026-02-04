import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Search, HelpCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    category: '계정',
    question: '비밀번호를 잊어버렸어요. 어떻게 해야 하나요?',
    answer: '로그인 페이지에서 "비밀번호 찾기" 링크를 클릭하세요. 등록된 이메일로 비밀번호 재설정 링크가 발송됩니다. 이메일이 오지 않는 경우 스팸 폴더를 확인하거나 인사팀에 문의해 주세요.',
  },
  {
    id: '2',
    category: '계정',
    question: '비밀번호 변경은 어떻게 하나요?',
    answer: '설정 > 보안 메뉴에서 현재 비밀번호와 새 비밀번호를 입력하여 변경할 수 있습니다. 비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.',
  },
  {
    id: '3',
    category: '계정',
    question: '다른 기기에서 로그인된 세션을 종료하고 싶어요.',
    answer: '설정 > 보안 > 활성 세션에서 현재 로그인된 기기 목록을 확인할 수 있습니다. 개별 세션을 로그아웃하거나 "다른 모든 세션 로그아웃" 버튼으로 일괄 종료할 수 있습니다.',
  },
  {
    id: '4',
    category: '근태',
    question: '출퇴근 기록이 누락되었어요. 어떻게 하나요?',
    answer: '근태/휴가 메뉴에서 해당 날짜의 근태 기록을 수정 요청할 수 있습니다. 수정 요청 시 사유를 입력하면 관리자 승인 후 반영됩니다.',
  },
  {
    id: '5',
    category: '근태',
    question: '재택근무 시 출퇴근은 어떻게 기록하나요?',
    answer: '일반 출퇴근과 동일하게 대시보드에서 출근/퇴근 버튼을 클릭하면 됩니다. 재택근무 시에는 위치 정보가 "재택"으로 표시됩니다. 회사 정책에 따라 별도 신청이 필요할 수 있습니다.',
  },
  {
    id: '6',
    category: '휴가',
    question: '휴가 신청은 며칠 전에 해야 하나요?',
    answer: '회사 정책에 따라 다르지만, 일반적으로 연차휴가는 3일 전, 반차는 1일 전까지 신청하는 것을 권장합니다. 긴급한 경우 사유를 명확히 기재하여 신청해 주세요.',
  },
  {
    id: '7',
    category: '휴가',
    question: '잔여 연차는 어디서 확인하나요?',
    answer: '대시보드의 휴가 현황 위젯 또는 근태/휴가 > 내 휴가 메뉴에서 잔여 연차, 사용 내역, 소멸 예정 휴가를 확인할 수 있습니다.',
  },
  {
    id: '8',
    category: '휴가',
    question: '휴가 신청을 취소하고 싶어요.',
    answer: '결재가 완료되기 전이라면 내 결재 목록에서 직접 취소할 수 있습니다. 이미 승인된 휴가는 취소 신청을 별도로 제출해야 합니다.',
  },
  {
    id: '9',
    category: '결재',
    question: '결재 문서를 수정하고 싶어요.',
    answer: '상신 전 임시저장 상태에서는 자유롭게 수정 가능합니다. 이미 상신한 문서는 결재권자가 반려 처리한 후 수정하여 재상신할 수 있습니다.',
  },
  {
    id: '10',
    category: '결재',
    question: '결재선은 어떻게 설정하나요?',
    answer: '결재 문서 작성 시 결재선 설정에서 지정합니다. 기본 결재선이 설정되어 있으면 자동으로 적용되며, 필요시 직접 결재자를 추가하거나 변경할 수 있습니다.',
  },
  {
    id: '11',
    category: '결재',
    question: '출장 중에 결재를 처리할 수 없을 때는요?',
    answer: '전자결재 > 결재 위임 메뉴에서 위임 설정을 할 수 있습니다. 기간과 대리 결재자를 지정하면 해당 기간 동안 대리 결재가 가능합니다.',
  },
  {
    id: '12',
    category: '조직',
    question: '부서 이동이 되었는데 정보가 업데이트되지 않아요.',
    answer: '인사 발령 처리 후 시스템에 반영되기까지 영업일 기준 1-2일이 소요될 수 있습니다. 급한 경우 인사팀에 문의해 주세요.',
  },
  {
    id: '13',
    category: '조직',
    question: '다른 부서 직원 정보를 조회할 수 있나요?',
    answer: '권한에 따라 조회 범위가 다릅니다. 일반 직원은 같은 부서원 정보만, 관리자는 하위 조직 전체를 조회할 수 있습니다. 전체 조직 조회가 필요한 경우 인사팀에 권한 요청을 해주세요.',
  },
  {
    id: '14',
    category: '알림',
    question: '알림이 오지 않아요.',
    answer: '설정 > 알림에서 알림 설정을 확인해 주세요. 브라우저 푸시 알림의 경우 브라우저 설정에서 알림 권한이 허용되어 있어야 합니다. 이메일 알림이 스팸으로 분류되었는지도 확인해 보세요.',
  },
  {
    id: '15',
    category: '기타',
    question: '모바일에서도 사용할 수 있나요?',
    answer: 'HR Platform은 반응형 웹으로 제작되어 모바일 브라우저에서도 사용 가능합니다. 스마트폰 브라우저로 동일한 URL에 접속하면 모바일에 최적화된 화면으로 제공됩니다.',
  },
  {
    id: '16',
    category: '기타',
    question: '데이터 내보내기는 어떻게 하나요?',
    answer: '대부분의 목록 화면에서 엑셀 내보내기 기능을 제공합니다. 목록 상단의 "내보내기" 또는 "엑셀" 버튼을 클릭하면 현재 조회 조건에 맞는 데이터를 Excel 또는 CSV 파일로 다운로드할 수 있습니다.',
  },
];

const categories = Array.from(new Set(faqData.map((item) => item.category)));

export default function HelpFAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFAQ = faqData.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <PageHeader
        title="자주 묻는 질문"
        description="궁금한 점을 빠르게 찾아보세요."
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="질문 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  전체
                </Badge>
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ ({filteredFAQ.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFAQ.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                검색 결과가 없습니다.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQ.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="shrink-0">
                          {item.category}
                        </Badge>
                        <span>{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
