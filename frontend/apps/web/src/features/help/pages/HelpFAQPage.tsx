import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useIsMobile } from '@/hooks/useMediaQuery';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_CATEGORY_KEYS = [
  'account',
  'attendance',
  'leave',
  'approval',
  'organization',
  'notification',
  'other',
] as const;

export default function HelpFAQPage() {
  const { t } = useTranslation('help');
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const faqItems = t('faq.items', { returnObjects: true }) as Array<{
    id: string;
    category: string;
    question: string;
    answer: string;
  }>;

  const faqData: FAQItem[] = faqItems.map((item) => ({
    id: item.id,
    category: t(`faq.categories.${item.category}`),
    question: item.question,
    answer: item.answer,
  }));

  const categories = FAQ_CATEGORY_KEYS.map((key) => t(`faq.categories.${key}`));

  const filteredFAQ = faqData.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-4 pb-20">
        {/* Mobile Header */}
        <div>
          <h1 className="text-xl font-bold">{t('faq.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('faq.mobileDescription')}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('faq.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {t('faq.all')}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-2">
          {filteredFAQ.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('faq.noResults')}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {filteredFAQ.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="bg-card rounded-xl border px-4"
                >
                  <AccordionTrigger className="text-left text-sm py-4">
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="w-fit text-xs">
                        {item.category}
                      </Badge>
                      <span className="font-medium">{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('faq.title')}
        description={t('faq.description')}
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('faq.searchPlaceholder')}
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
                  {t('faq.all')}
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
              {t('faq.countLabel', { count: filteredFAQ.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFAQ.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                {t('faq.noResults')}
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
