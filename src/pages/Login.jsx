import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { errorMessage } from '../api/axios';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getToken, saveSession } from '../utils/session';

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (getToken()) return <Navigate to="/" replace />;

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/login', { username: username.trim(), password });
            saveSession(res.data.token, res.data.user);
            navigate('/', { replace: true });
        } catch (err) {
            setError(errorMessage(err, t('login.failed')));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
                <div className="flex justify-end mb-2">
                    <LanguageSwitcher />
                </div>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4">B</div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('app.title')}</h1>
                    <p className="text-slate-500 mt-1">{t('login.subtitle')}</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                    <label className="block">
                        <span className="block text-sm font-medium text-slate-700 mb-1">{t('login.username')}</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder={t('login.usernamePlaceholder')}
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl"
                            autoComplete="username"
                            required
                        />
                    </label>
                    <label className="block">
                        <span className="block text-sm font-medium text-slate-700 mb-1">{t('login.password')}</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-2xl"
                            autoComplete="current-password"
                            required
                        />
                    </label>
                    {(error || params.get('expired')) && (
                        <p className="text-rose-600 text-sm text-center">{error || t('login.expired')}</p>
                    )}
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3.5 rounded-2xl">
                        {loading ? t('login.submitting') : t('login.submit')}
                    </button>
                </form>
                <p className="text-center text-xs text-slate-400 mt-6">{t('login.hint')}</p>
            </div>
        </div>
    );
}
