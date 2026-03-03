/**
 * i18n configuration for GraviSales CRM.
 * Uses react-i18next with browser language detection.
 *
 * @example
 * // In a component:
 * import { useTranslation } from 'react-i18next';
 * const { t } = useTranslation();
 * return <h1>{t('login.title')}</h1>;
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from '../locales/ru.json';
import en from '../locales/en.json';
import uz from '../locales/uz.json';
import kk from '../locales/kk.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            ru: { translation: ru },
            en: { translation: en },
            uz: { translation: uz },
            kk: { translation: kk },
        },
        fallbackLng: 'ru',
        supportedLngs: ['ru', 'en', 'uz', 'kk'],
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'gravisales_language',
        },
    });

export default i18n;
