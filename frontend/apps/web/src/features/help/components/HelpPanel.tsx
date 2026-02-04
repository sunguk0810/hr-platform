import { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Search,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allTours } from '../data/tourSteps';
import { useOnboarding } from '../hooks/useOnboarding';

interface HelpLink {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const helpLinks: HelpLink[] = [
  {
    title: '사용자 가이드',
    description: '기본 기능과 사용법을 확인하세요',
    href: '/help/guide',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: '자주 묻는 질문',
    description: '자주 묻는 질문과 답변',
    href: '/help/faq',
    icon: <HelpCircle className="h-5 w-5" />,
  },
  {
    title: '문의하기',
    description: '관리자에게 문의하세요',
    href: '/help/contact',
    icon: <MessageCircle className="h-5 w-5" />,
  },
];

export function HelpPanel() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { startTour, isTourCompleted } = useOnboarding();

  const filteredTours = allTours.filter(
    (tour) =>
      tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartTour = (tourId: string) => {
    setOpen(false);
    setTimeout(() => startTour(tourId), 300);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg md:bottom-8 md:right-8"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>도움말</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색..."
              className="pl-10"
            />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-medium">빠른 링크</h3>
            <div className="space-y-2">
              {helpLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {link.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{link.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Tours */}
          <div>
            <h3 className="mb-3 text-sm font-medium">기능 투어</h3>
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {filteredTours.map((tour) => {
                  const completed = isTourCompleted(tour.id);

                  return (
                    <div
                      key={tour.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{tour.name}</p>
                          {completed && (
                            <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                              완료
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tour.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartTour(tour.id)}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        {completed ? '다시 보기' : '시작'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* External Resources */}
          <div>
            <h3 className="mb-3 text-sm font-medium">외부 리소스</h3>
            <div className="space-y-2">
              <a
                href="https://support.example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                고객 지원 센터
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://docs.example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                API 문서
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default HelpPanel;
