import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

interface LanguageOption {
  code: 'ko' | 'en';
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
];

export function LanguageSettings() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useUIStore();

  const handleLanguageChange = (code: 'ko' | 'en') => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5" />
          언어 설정
        </CardTitle>
        <CardDescription>
          서비스에서 사용할 언어를 선택하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {languages.map((lang) => {
            const isSelected = language === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-4 text-left transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                    : 'hover:bg-muted/50'
                )}
              >
                <span className="text-3xl">{lang.flag}</span>
                <div className="flex-1">
                  <p className="font-medium">{lang.nativeName}</p>
                  <p className="text-sm text-muted-foreground">{lang.name}</p>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          일부 콘텐츠는 선택한 언어로 표시되지 않을 수 있습니다.
        </p>
      </CardContent>
    </Card>
  );
}

export default LanguageSettings;
