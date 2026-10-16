import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dashboard from './pages/Dashboard';
import NewTransaction from './pages/NewTransaction';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import LanguageSwitcher from './components/LanguageSwitcher';
import PasswordDialog from './components/PasswordDialog';
import { clearSession, getToken, getUser } from './utils/session';

const queryClient = new QueryClient();

const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-xl text-sm font-medium ${isActive ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`;

const tabClass = ({ isActive }) =>
    `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium ${isActive ? 'text-blue-600' : 'text-slate-500'}`;

function Shell() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = getUser();
    const [passwordOpen, setPasswordOpen] = useState(false);

    const logout = () => {
        clearSession();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-0">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 shrink-0 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold">B</div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold truncate">{t('app.title')}</h1>
                            {user && <p className="text-xs text-slate-500 truncate">{user.name}</p>}
                        </div>
                    </div>
                    <nav className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-2xl">
                        <NavLink to="/" end className={linkClass}>{t('app.dashboard')}</NavLink>
                        <NavLink to="/new" className={linkClass}>{t('app.newTransaction')}</NavLink>
                        <NavLink to="/transactions" className={linkClass}>{t('app.transactions')}</NavLink>
                    </nav>
                    <div className="flex items-center gap-2 md:gap-3">
                        <LanguageSwitcher />
                        <button type="button" onClick={() => setPasswordOpen(true)} className="hidden sm:inline text-sm text-slate-500 hover:text-slate-800">
                            {t('app.password')}
                        </button>
                        <button type="button" onClick={logout} className="text-sm text-rose-600">
                            {t('app.logout')}
                        </button>
                    </div>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
                <Outlet />
            </main>
            <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex pb-[max(0.4rem,env(safe-area-inset-bottom))] z-40">
                <NavLink to="/" end className={tabClass}>
                    <LayoutDashboard className="w-5 h-5" />
                    {t('app.dashboard')}
                </NavLink>
                <NavLink to="/new" className={tabClass}>
                    <Plus className="w-5 h-5" />
                    {t('app.newTransaction')}
                </NavLink>
                <NavLink to="/transactions" className={tabClass}>
                    <List className="w-5 h-5" />
                    {t('app.transactions')}
                </NavLink>
            </nav>
            {passwordOpen && <PasswordDialog onClose={() => setPasswordOpen(false)} />}
        </div>
    );
}

function RequireAuth() {
    if (!getToken()) return <Navigate to="/login" replace />;
    return <Shell />;
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<RequireAuth />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/new" element={<NewTransaction />} />
                        <Route path="/transactions" element={<Transactions />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}
