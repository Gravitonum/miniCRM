/**
 * useTheme — хук для управления тёмной/светлой темой приложения.
 * Хранит выбор в localStorage и применяет CSS-класс `dark` к `<html>`.
 *
 * @example
 * const { theme, toggleTheme } = useTheme();
 * <button onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
 */
import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'gravisales_theme';

/**
 * Применяет класс `dark` к корневому элементу документа.
 * @param theme - Текущая тема
 */
function applyTheme(theme: Theme): void {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Хук для управления темой: возвращает текущую тему и функции для её изменения.
 * @returns {{ theme, setTheme, toggleTheme }}
 */
export function useTheme(): {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
} {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        if (stored === 'dark' || stored === 'light') return stored;
        // Detect system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    return { theme, setTheme, toggleTheme };
}
