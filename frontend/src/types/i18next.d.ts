/**
 * Type definitions for i18next to provide type safety for the 't' function.
 * Uses ru.json as the source of truth for available keys.
 */
import 'react-i18next';
import ru from '../locales/ru.json';

declare module 'react-i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation';
        resources: {
            translation: typeof ru;
        };
    }
}
