/**
 * Language switcher component for auth pages.
 * Detects browser language on first visit and allows manual switching.
 *
 * @example
 * <LanguageSwitcher />
 */
import { useState, useRef, useEffect, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

interface LanguageOption {
    code: string;
    label: string;
    flag: string;
}

const LANGUAGES: LanguageOption[] = [
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function LanguageSwitcher(): ReactElement {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

    /** Close dropdown on outside click */
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * Changes the application language.
     * @param code - Language code (e.g., 'ru', 'en')
     */
    function handleLanguageChange(code: string): void {
        i18n.changeLanguage(code);
        setIsOpen(false);
    }

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                   transition-all duration-200 cursor-pointer
                   text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                   hover:bg-[var(--color-bg-tertiary)]"
                aria-label="Switch language"
                aria-expanded={isOpen}
            >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{currentLang.flag} {currentLang.label}</span>
                <span className="sm:hidden">{currentLang.flag}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-1 py-1 w-40
                     bg-[var(--color-bg-primary)] rounded-lg
                     border border-[var(--color-border)]
                     shadow-lg z-50 animate-fade-in"
                    role="menu"
                >
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`flex items-center gap-2 w-full px-3 py-2 text-sm
                         transition-colors duration-150 cursor-pointer
                         ${lang.code === i18n.language
                                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'}`}
                            role="menuitem"
                        >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
