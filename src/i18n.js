import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'zh-CN',
        supportedLngs: ['zh-CN', 'en'],
        load: 'currentOnly',
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
        backend: {
            loadPath: '/locales/{{lng}}/translation.json',
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            convertDetectedLanguage: (lng) => {
                if (!lng) return 'zh-CN';
                const lower = lng.toLowerCase();
                if (lower.startsWith('zh')) return 'zh-CN';
                if (lower.startsWith('en')) return 'en';
                return 'zh-CN';
            },
        },
    });

export default i18n;
