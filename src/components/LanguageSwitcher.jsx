import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        localStorage.setItem('i18nextLng', lng);
    };

    const currentLang = i18n.language;

    return (
        <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
            <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    currentLang === 'en'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:bg-white/70'
                }`}
            >
                EN
            </button>
            <button
                onClick={() => changeLanguage('zh-CN')}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    currentLang === 'zh-CN'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:bg-white/70'
                }`}
            >
                中文
            </button>
        </div>
    );
}