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
import { useTranslation } from 'react-i18next';
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

export function HelpPanel() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { startTour, isTourCompleted } = useOnboarding();
  const { t } = useTranslation('help');

  const helpLinks: HelpLink[] = [
    {
      title: t('panel.links.guide.title'),
      description: t('panel.links.guide.description'),
      href: '/help/guide',
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: t('panel.links.faq.title'),
      description: t('panel.links.faq.description'),
      href: '/help/faq',
      icon: <HelpCircle className="h-5 w-5" />,
    },
    {
      title: t('panel.links.contact.title'),
      description: t('panel.links.contact.description'),
      href: '/help/contact',
      icon: <MessageCircle className="h-5 w-5" />,
    },
  ];

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
          <SheetTitle>{t('panel.title')}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('panel.searchPlaceholder')}
              className="pl-10"
            />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-medium">{t('panel.quickLinks')}</h3>
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
            <h3 className="mb-3 text-sm font-medium">{t('panel.featureTours')}</h3>
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
                              {t('panel.tourCompleted')}
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
                        {completed ? t('panel.tourReplay') : t('panel.tourStart')}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* External Resources */}
          <div>
            <h3 className="mb-3 text-sm font-medium">{t('panel.externalResources')}</h3>
            <div className="space-y-2">
              <a
                href="https://support.example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                {t('panel.customerSupport')}
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://docs.example.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                {t('panel.apiDocs')}
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
