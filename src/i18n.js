import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
    .use(HttpBackend)                    // 從 public/locales 載入翻譯檔
    .use(LanguageDetector)               // 自動偵測瀏覽器語言
    .use(initReactI18next)               // 連接 react-i18next
    .init({
        fallbackLng: 'en',                 // 預設英文（可改成 'zh-CN'）
        debug: false,
        interpolation: {
            escapeValue: false,              // React 已經會 escape
        },
        backend: {
            loadPath: '/locales/{{lng}}/translation.json',
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;