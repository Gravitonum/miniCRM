/**
 * LanguageSwitcher — переключатель языка для страниц аутентификации.
 * Использует Radix UI DropdownMenu.
 *
 * @example
 * <LanguageSwitcher />
 */
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from '../lib/utils';

interface LanguageOption {
    code: string;
    label: string;
    flag: string;
}

const LANGUAGES: LanguageOption[] = [
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

/**
 * Переключатель языка интерфейса.
 * @param code - Код языка
 */
export function LanguageSwitcher(): ReactElement {
    const { i18n } = useTranslation();
    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent"
                    aria-label="Switch language"
                >
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
                    <span className="sm:hidden">{currentLang.flag}</span>
                    <ChevronDown className="w-3 h-3 transition-transform duration-200" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => i18n.changeLanguage(lang.code)}
                        className={cn(
                            lang.code === i18n.language
                                ? 'bg-primary/10 text-primary font-semibold'
                                : ''
                        )}
                    >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
