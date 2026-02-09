import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/stores/uiStore';

const LANGUAGES = [
  { code: 'ko' as const, labelKey: 'component.korean', flag: '🇰🇷' },
  { code: 'en' as const, labelKey: 'English', flag: '🇺🇸' },
];

export function LanguageSwitcher() {
  const { t } = useTranslation('common');
  const { language, setLanguage } = useUIStore();

  const getLabel = (labelKey: string) => {
    return labelKey.startsWith('component.') ? t(labelKey) : labelKey;
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('component.currentLanguage', { language: getLabel(currentLanguage.labelKey) })}
        >
          <Globe className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center gap-2"
          >
            <span aria-hidden="true">{lang.flag}</span>
            <span>{getLabel(lang.labelKey)}</span>
            {language === lang.code && (
              <span className="ml-auto text-primary" aria-label={t('component.selected')}>
                ✓
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
