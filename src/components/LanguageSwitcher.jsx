import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const isEnglish = (i18n.resolvedLanguage || i18n.language || '').startsWith('en');

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
            <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium ${isEnglish ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}
            >
                EN
            </button>
            <button
                type="button"
                onClick={() => changeLanguage('zh-CN')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium ${!isEnglish ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}
            >
                中文
            </button>
        </div>
    );
}
