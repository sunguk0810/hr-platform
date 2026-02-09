import { useTranslation } from 'react-i18next';
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

interface GuideSectionDef {
  id: string;
  i18nKey: string;
  icon: LucideIcon;
}

const guideSectionDefs: GuideSectionDef[] = [
  { id: 'getting-started', i18nKey: 'gettingStarted', icon: BookOpen },
  { id: 'employee-management', i18nKey: 'employeeManagement', icon: Users },
  { id: 'attendance-leave', i18nKey: 'attendanceLeave', icon: Calendar },
  { id: 'approval-workflow', i18nKey: 'approvalWorkflow', icon: FileCheck },
  { id: 'organization', i18nKey: 'organization', icon: Building2 },
  { id: 'notifications', i18nKey: 'notifications', icon: Bell },
  { id: 'settings', i18nKey: 'settings', icon: Settings },
];

// Tour에 해당하는 페이지 경로 매핑
const tourPageMap: Record<string, string> = {
  dashboard: '/',
  approval: '/approvals',
  attendance: '/attendance',
  organization: '/organization',
};

export default function HelpGuidePage() {
  const { t } = useTranslation('help');
  const { startTour } = useOnboarding();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const guideSections = guideSectionDefs.map((def) => ({
    id: def.id,
    icon: def.icon,
    title: t(`guide.sections.${def.i18nKey}.title`),
    summary: t(`guide.sections.${def.i18nKey}.summary`),
    content: t(`guide.sections.${def.i18nKey}.content`),
  }));

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
          <h1 className="text-xl font-bold">{t('guide.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('guide.mobileDescription')}</p>
        </div>

        {/* Interactive Tour */}
        <div className="bg-card rounded-xl border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            <h3 className="font-medium">{t('guide.interactiveTour.title')}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('guide.interactiveTour.description')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => handleStartTour('dashboard')}>
              {t('guide.interactiveTour.buttons.dashboardShort')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStartTour('approval')}>
              {t('guide.interactiveTour.buttons.approvalShort')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStartTour('attendance')}>
              {t('guide.interactiveTour.buttons.attendanceShort')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleStartTour('organization')}>
              {t('guide.interactiveTour.buttons.organizationShort')}
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
        title={t('guide.title')}
        description={t('guide.description')}
      />

      <div className="space-y-6">
        {/* Interactive Tour Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" aria-hidden="true" />
              {t('guide.interactiveTour.title')}
            </CardTitle>
            <CardDescription>
              {t('guide.interactiveTour.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3" role="group" aria-label={t('guide.interactiveTour.ariaLabel')}>
              <Button variant="outline" onClick={() => handleStartTour('dashboard')} aria-label={t('guide.interactiveTour.ariaLabels.dashboard')}>
                {t('guide.interactiveTour.buttons.dashboard')}
              </Button>
              <Button variant="outline" onClick={() => handleStartTour('approval')} aria-label={t('guide.interactiveTour.ariaLabels.approval')}>
                {t('guide.interactiveTour.buttons.approval')}
              </Button>
              <Button variant="outline" onClick={() => handleStartTour('attendance')} aria-label={t('guide.interactiveTour.ariaLabels.attendance')}>
                {t('guide.interactiveTour.buttons.attendance')}
              </Button>
              <Button variant="outline" onClick={() => handleStartTour('organization')} aria-label={t('guide.interactiveTour.ariaLabels.organization')}>
                {t('guide.interactiveTour.buttons.organization')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guide Sections */}
        <section aria-label={t('guide.guideDocsAriaLabel')}>
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
