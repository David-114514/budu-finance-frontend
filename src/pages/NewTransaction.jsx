import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api, { errorMessage, invalidateFinance } from '../api/axios';
import { isExpenseCategory, sanitizePositiveAmount } from '../utils/transactionHelper';
import { formatHkd, todayIso } from '../utils/money';
import { contributorKey, getUser, lastEntryKey } from '../utils/session';

const MODES = ['in', 'out', 'pass'];

export default function NewTransaction() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [mode, setMode] = useState('in');
    const [form, setForm] = useState({
        date: todayIso(),
        amount: '',
        description: '',
    });
    const [categoryOverride, setCategoryOverride] = useState(null);
    const [userOverride, setUserOverride] = useState(null);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [hasLast, setHasLast] = useState(() => !!localStorage.getItem(lastEntryKey()));

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/categories')).data,
    });
    const usersQuery = useQuery({
        queryKey: ['users'],
        queryFn: async () => (await api.get('/users')).data,
    });

    const categories = categoriesQuery.data ?? [];
    const users = usersQuery.data ?? [];
    const choices = categories.filter((category) => (mode === 'out' ? isExpenseCategory(category) : !isExpenseCategory(category)));
    const needsContributor = mode !== 'out';
    const selectedCategory = choices.find((category) => String(category.id) === String(categoryOverride)) || choices[0];
    const savedContributor = localStorage.getItem(contributorKey());
    const me = getUser();
    const derivedUserId = [userOverride, savedContributor, me?.id, users[0]?.id]
        .find((id) => id != null && users.some((user) => String(user.id) === String(id)));
    const userId = derivedUserId == null ? '' : String(derivedUserId);

    const mutation = useMutation({
        mutationFn: async () => {
            if (mode === 'pass') {
                const response = await api.post('/transactions/pass-through', {
                    date: form.date,
                    amount: Math.abs(parseFloat(form.amount)),
                    userId: Number(userId),
                    description: form.description,
                });
                return response.data;
            }
            const response = await api.post('/transactions', {
                date: form.date,
                amount: Math.abs(parseFloat(form.amount)),
                categoryId: Number(selectedCategory.id),
                description: form.description,
                ...(needsContributor ? { userId: Number(userId) } : {}),
            });
            return response.data;
        },
        onSuccess: async (data) => {
            localStorage.setItem(contributorKey(), String(userId));
            localStorage.setItem(lastEntryKey(), JSON.stringify({
                mode,
                amount: form.amount,
                categoryId: selectedCategory?.id || '',
                userId,
                description: form.description,
            }));
            setHasLast(true);
            setResult(data);
            setError('');
            await invalidateFinance(queryClient);
        },
        onError: (err) => setError(errorMessage(err, t('transaction.failed'))),
    });

    const submit = (event) => {
        event.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            setError(t('transaction.amountRequired'));
            return;
        }
        if (mode !== 'pass' && !choices.length) {
            setError(t('common.unknownError'));
            return;
        }
        setError('');
        mutation.mutate();
    };

    const repeatLast = () => {
        const raw = localStorage.getItem(lastEntryKey());
        if (!raw) return;
        try {
            const last = JSON.parse(raw);
            setMode(last.mode || 'in');
            setCategoryOverride(last.categoryId || null);
            setUserOverride(last.userId || null);
            setForm({
                date: todayIso(),
                amount: last.amount || '',
                description: last.description || '',
            });
            setResult(null);
        } catch {
            localStorage.removeItem(lastEntryKey());
        }
    };

    const reset = () => {
        setResult(null);
        setForm((prev) => ({ ...prev, date: todayIso(), amount: '', description: '' }));
    };

    if (result) {
        return (
            <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-8">
                <p className="text-emerald-700 font-medium">{t('transaction.done')}</p>
                <p className="text-3xl font-bold mt-3 tabular-nums">{t('transaction.balanceNow', { amount: formatHkd(result.ledgerBalance) })}</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <button type="button" onClick={reset} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white">{t('transaction.again')}</button>
                    <Link to="/transactions" className="flex-1 py-3 rounded-2xl border border-slate-200 text-center">{t('transaction.viewLedger')}</Link>
                </div>
            </div>
        );
    }

    const submitLabel = mode === 'pass' ? t('transaction.submitPass') : mode === 'out' ? t('transaction.submitOut') : t('transaction.submitIn');

    return (
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold">{t('transaction.title')}</h2>
            <p className="text-slate-500 mt-1 mb-6">{t('transaction.subtitle')}</p>
            <div className="grid grid-cols-3 gap-2 mb-6">
                {MODES.map((item) => (
                    <button
                        key={item}
                        type="button"
                        onClick={() => setMode(item)}
                        className={`py-3 rounded-2xl text-sm font-medium ${mode === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                    >
                        {t(item === 'in' ? 'transaction.modeIn' : item === 'out' ? 'transaction.modeOut' : 'transaction.modePass')}
                    </button>
                ))}
            </div>
            {mode === 'pass' && <p className="text-sm text-slate-600 bg-slate-50 rounded-2xl px-4 py-3 mb-5">{t('transaction.passHint')}</p>}
            <form onSubmit={submit} className="space-y-5">
                <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.amount')}</span>
                    <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(event) => setForm({ ...form, amount: sanitizePositiveAmount(event.target.value) })}
                        placeholder={t('transaction.amountPlaceholder')}
                        className="w-full px-4 py-4 text-2xl border border-slate-200 rounded-2xl tabular-nums"
                        autoFocus
                    />
                </label>
                <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.date')}</span>
                    <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" required />
                </label>
                {mode !== 'pass' && choices.length > 1 && (
                    <label className="block">
                        <span className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.category')}</span>
                        <select value={selectedCategory ? selectedCategory.id : ''} onChange={(event) => setCategoryOverride(event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl">
                            {choices.map((category) => (
                                <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
                            ))}
                        </select>
                    </label>
                )}
                <label className="block">
                    <span className={`block text-sm font-medium mb-1 ${needsContributor ? 'text-slate-700' : 'text-slate-400'}`}>{t('transaction.operator')}</span>
                    <select
                        value={userId}
                        onChange={(event) => setUserOverride(event.target.value)}
                        disabled={!needsContributor}
                        className={`w-full px-4 py-3 border border-slate-200 rounded-2xl ${needsContributor ? '' : 'bg-slate-100 text-slate-400'}`}
                    >
                        {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                    {!needsContributor && <p className="text-xs text-slate-400 mt-1">{t('transaction.operatorNotRequired')}</p>}
                </label>
                <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.description')}</span>
                    <input
                        type="text"
                        value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                        placeholder={t('transaction.descriptionPlaceholder')}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl"
                    />
                </label>
                {error && <p className="text-sm text-rose-600">{error}</p>}
                <button type="submit" disabled={mutation.isPending} className="w-full bg-blue-600 disabled:bg-slate-300 text-white font-semibold py-4 rounded-2xl">
                    {mutation.isPending ? t('common.submitting') : submitLabel}
                </button>
                {hasLast && (
                    <button type="button" onClick={repeatLast} className="w-full text-sm text-slate-500 py-2">
                        {t('transaction.repeat')}
                    </button>
                )}
            </form>
        </div>
    );
}
