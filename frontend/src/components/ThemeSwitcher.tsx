/**
 * ThemeSwitcher — кнопка переключения тёмной/светлой темы.
 * Использует хук useTheme и shadcn/ui Tooltip для подсказки.
 *
 * @example
 * <ThemeSwitcher />
 */
import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/useTheme';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from './ui/tooltip';

/**
 * Кнопка-иконка для переключения темы (Sun/Moon).
 * Использует Tooltip для отображения подсказки.
 */
export function ThemeSwitcher(): ReactElement {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();

    return (
        <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={t('theme.toggle', 'Toggle theme')}
                    className="relative p-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 cursor-pointer"
                >
                    {/* Sun icon — shown in dark mode (to switch to light) */}
                    <Sun
                        className={`w-4.5 h-4.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${theme === 'dark'
                                ? 'opacity-100 rotate-0 scale-100'
                                : 'opacity-0 rotate-90 scale-50'
                            }`}
                    />
                    {/* Moon icon — shown in light mode (to switch to dark) */}
                    <Moon
                        className={`w-4.5 h-4.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${theme === 'light'
                                ? 'opacity-100 rotate-0 scale-100'
                                : 'opacity-0 -rotate-90 scale-50'
                            }`}
                    />
                    {/* Spacer to maintain button size */}
                    <span className="w-4.5 h-4.5 block opacity-0" aria-hidden="true" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
                {theme === 'dark' ? t('theme.light', 'Light') : t('theme.dark', 'Dark')}
            </TooltipContent>
        </Tooltip>
    );
}
