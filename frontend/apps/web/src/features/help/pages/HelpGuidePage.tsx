import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useOnboarding } from '../hooks/useOnboarding';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useNavigate } from 'react-router-dom';
import { MarkdownContent } from '../components/MarkdownContent';
import {
  BookOpen,
  Users,
  Calendar,
  FileCheck,
  Building2,
  Play,
  Settings,
  Bell,
  type LucideIcon,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  content: string;
}

const guideSections: GuideSection[] = [
  {
    id: 'getting-started',
    title: '시작하기',
    icon: BookOpen,
    summary: 'HR Platform 사용을 위한 기본 가이드',
    content: `## HR Platform 시작하기

HR Platform에 오신 것을 환영합니다! 이 가이드에서는 플랫폼의 기본적인 사용법을 안내합니다.

### 로그인
1. 회사에서 제공받은 이메일과 비밀번호로 로그인합니다.
2. 최초 로그인 시 비밀번호 변경이 필요할 수 있습니다.
3. 로그인 상태를 유지하려면 "로그인 상태 유지"를 체크하세요.

### 대시보드
로그인 후 대시보드에서 다음 정보를 한눈에 확인할 수 있습니다:
- 오늘의 근태 현황
- 잔여 휴가 정보
- 대기 중인 결재 문서
- 최근 알림

### 메뉴 구성
- **내 정보**: 개인 프로필 및 정보 확인
- **인사정보**: 직원 정보 조회 및 관리
- **조직관리**: 부서/직급/직책 관리
- **근태/휴가**: 출퇴근 및 휴가 관리
- **전자결재**: 결재 문서 작성 및 승인
- **설정**: 개인 설정 및 알림 관리`,
  },
  {
    id: 'employee-management',
    title: '인사정보 관리',
    icon: Users,
    summary: '직원 정보 조회 및 관리 방법',
    content: `## 인사정보 관리

### 직원 목록 조회
- 검색: 이름, 사번, 이메일로 직원을 검색할 수 있습니다.
- 필터: 재직 상태별로 필터링이 가능합니다.
- 뷰 모드: 테이블/카드 뷰를 선택할 수 있습니다.

### 직원 상세 정보
직원 카드 또는 행을 클릭하면 상세 정보를 확인할 수 있습니다:
- 기본 정보 (이름, 사번, 연락처)
- 소속 정보 (부서, 직급, 직책)
- 근무 이력
- 인사 발령 이력

### 데이터 관리
- **내보내기**: 직원 목록을 Excel/CSV로 내보낼 수 있습니다.
- **가져오기**: Excel 템플릿을 사용하여 일괄 등록이 가능합니다.

### 권한에 따른 기능
- 일반 사용자: 조회만 가능
- 인사 담당자: 등록/수정/삭제 가능`,
  },
  {
    id: 'attendance-leave',
    title: '근태/휴가 관리',
    icon: Calendar,
    summary: '출퇴근 기록 및 휴가 신청 방법',
    content: `## 근태/휴가 관리

### 출퇴근 기록
1. 대시보드의 출근/퇴근 버튼을 클릭합니다.
2. 현재 위치가 자동으로 기록됩니다 (선택적).
3. 출근/퇴근 시간이 실시간으로 반영됩니다.

### 휴가 신청
1. 근태/휴가 > 휴가 신청 메뉴로 이동합니다.
2. 휴가 유형을 선택합니다 (연차, 반차, 공가 등).
3. 시작일과 종료일을 선택합니다.
4. 사유를 입력하고 제출합니다.

### 휴가 조회
- **내 휴가**: 본인의 휴가 사용 내역과 잔여 휴가를 확인합니다.
- **휴가 캘린더**: 팀원들의 휴가 일정을 캘린더에서 확인합니다.

### 초과근무 신청
1. 근태/휴가 > 초과근무 메뉴로 이동합니다.
2. 초과근무 일시와 사유를 입력합니다.
3. 결재를 요청합니다.`,
  },
  {
    id: 'approval-workflow',
    title: '전자결재',
    icon: FileCheck,
    summary: '결재 문서 작성 및 처리 방법',
    content: `## 전자결재

### 결재 문서 작성
1. 전자결재 > 결재 작성 메뉴로 이동합니다.
2. 문서 양식을 선택합니다.
3. 결재선을 설정합니다 (기본 결재선 또는 직접 지정).
4. 문서 내용을 작성하고 첨부파일을 추가합니다.
5. 상신 버튼을 클릭하여 제출합니다.

### 결재 처리
1. 알림 또는 결재 목록에서 대기 문서를 확인합니다.
2. 문서 내용을 검토합니다.
3. 승인 또는 반려를 선택합니다.
4. 의견을 입력하고 확인합니다.

### 결재 위임
출장이나 휴가 시 결재 권한을 위임할 수 있습니다:
1. 전자결재 > 결재 위임 메뉴로 이동합니다.
2. 위임 기간과 대상자를 선택합니다.
3. 위임 설정을 저장합니다.

### 결재 현황
- **내 결재**: 내가 상신한 문서 목록
- **결재 대기**: 내가 처리해야 할 문서 목록
- **결재 완료**: 처리 완료된 문서 목록`,
  },
  {
    id: 'organization',
    title: '조직 관리',
    icon: Building2,
    summary: '조직도 및 부서/직급 관리',
    content: `## 조직 관리

### 조직도 조회
- **트리 뷰**: 계층 구조로 조직을 확인합니다.
- **차트 뷰**: 시각적인 조직도를 확인합니다.
- **테이블 뷰**: 목록 형태로 부서를 확인합니다.

### 부서 관리 (관리자)
- 부서 추가/수정/삭제
- 상위 부서 설정
- 부서 순서 변경

### 직급/직책 관리 (관리자)
- 직급 체계 설정
- 직책 관리
- 표시 순서 설정

### 조직 이력
조직 변경 이력을 타임라인으로 확인할 수 있습니다.`,
  },
  {
    id: 'notifications',
    title: '알림 설정',
    icon: Bell,
    summary: '알림 수신 및 설정 방법',
    content: `## 알림 설정

### 알림 확인
- 헤더의 알림 아이콘을 클릭하여 최근 알림을 확인합니다.
- 알림 센터에서 전체 알림 목록을 확인할 수 있습니다.

### 알림 채널 설정
설정 > 알림에서 알림 수신 방법을 설정합니다:
- **이메일 알림**: 중요 알림을 이메일로 받습니다.
- **푸시 알림**: 브라우저 푸시 알림을 받습니다.

### 알림 유형 설정
수신할 알림 유형을 선택합니다:
- 결재 요청
- 결재 완료
- 휴가 승인
- 공지사항`,
  },
  {
    id: 'settings',
    title: '개인 설정',
    icon: Settings,
    summary: '프로필 및 보안 설정',
    content: `## 개인 설정

### 프로필 설정
- 프로필 사진 변경
- 기본 정보 확인 (수정은 인사팀 문의)

### 보안 설정
- 비밀번호 변경
- 활성 세션 관리
- 다른 기기 로그아웃

### 외관 설정
- 테마 선택 (라이트/다크/시스템)
- 언어 설정

### 알림 설정
- 알림 채널 설정
- 알림 유형별 수신 설정`,
  },
];

// Tour에 해당하는 페이지 경로 매핑
const tourPageMap: Record<string, string> = {
  dashboard: '/',
  approval: '/approvals',
  attendance: '/attendance',
  organization: '/organization',
};

export default function HelpGuidePage() {
  const { startTour } = useOnboarding();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // 투어 시작 시 해당 페이지로 이동 후 시작
  const handleStartTour = (tourId: string) => {
    const targetPath = tourPageMap[tourId];
    if (targetPath) {
      navigate(targetPath);
      // 페이지 이동 후 투어 시작 (DOM이 준비될 때까지 대기)
      setTimeout(() => startTour(tourId), 500);
    } else {
      startTour(tourId);
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4 pb-20">
        {/* Mobile Header */}
        <div>
          <h1 className="text-xl font-bold">사용자 가이드</h1>
          <p className="text-sm text-muted-foreground">HR Platform 사용법을 확인하세요</p>
        </div>

        {/* Interactive Tour */}
        <div className="bg-card rounded-xl border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            <h3 className="font-medium">인터랙티브 투어</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            버튼을 누르면 해당 페이지로 이동하여 실제 화면에서 기능을 배워봅니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => handleStartTour('dashboard')}>
              대시보드
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStartTour('approval')}>
              결재 기능
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStartTour('attendance')}>
              근태 관리
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStartTour('organization')}>
              조직도
            </Button>
          </div>
        </div>

        {/* Guide Accordion */}
        <Accordion type="single" collapsible className="space-y-2">
          {guideSections.map((section) => {
            const Icon = section.icon;
            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="bg-card rounded-xl border px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-sm text-muted-foreground">{section.summary}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <MarkdownContent content={section.content} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="사용자 가이드"
        description="HR Platform 사용법을 확인하세요."
      />

      <div className="space-y-6">
        {/* Interactive Tour Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" aria-hidden="true" />
              인터랙티브 투어
            </CardTitle>
            <CardDescription>
              버튼을 누르면 해당 페이지로 이동하여 실제 화면에서 기능을 배워봅니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3" role="group" aria-label="투어 시작 버튼">
              <Button variant="outline" onClick={() => handleStartTour('dashboard')} aria-label="대시보드 기능 투어 시작">
                대시보드 투어
              </Button>
              <Button variant="outline" onClick={() => handleStartTour('approval')} aria-label="결재 기능 투어 시작">
                결재 기능 투어
              </Button>
              <Button variant="outline" onClick={() => handleStartTour('attendance')} aria-label="근태 관리 기능 투어 시작">
                근태 관리 투어
              </Button>
              <Button variant="outline" onClick={() => handleStartTour('organization')} aria-label="조직도 기능 투어 시작">
                조직도 투어
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guide Sections */}
        <section aria-label="사용자 가이드 문서">
          <Accordion type="single" collapsible className="space-y-4">
            {guideSections.map((section) => {
              const Icon = section.icon;
              return (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className="border rounded-lg"
                >
                  <Card>
                    <AccordionTrigger className="hover:no-underline px-6 py-4 [&[data-state=open]>div>div>svg]:rotate-0">
                      <div className="flex items-center gap-4 text-left w-full">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-lg">{section.title}</div>
                          <div className="text-sm text-muted-foreground">{section.summary}</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <CardContent className="pt-0 pb-6">
                        <MarkdownContent content={section.content} />
                      </CardContent>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>
      </div>
    </>
  );
}
