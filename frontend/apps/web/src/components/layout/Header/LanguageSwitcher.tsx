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
  { code: 'ko' as const, label: '한국어', flag: '🇰🇷' },
  { code: 'en' as const, label: 'English', flag: '🇺🇸' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useUIStore();

  const currentLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`현재 언어: ${currentLanguage.label}. 언어 변경`}
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
            <span>{lang.label}</span>
            {language === lang.code && (
              <span className="ml-auto text-primary" aria-label="선택됨">
                ✓
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
