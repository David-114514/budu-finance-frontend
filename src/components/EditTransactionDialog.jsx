import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api, { errorMessage } from '../api/axios';
import { isExpenseCategory, sanitizePositiveAmount } from '../utils/transactionHelper';
import Modal from './Modal';

export default function EditTransactionDialog({ transaction, users, onClose, onSaved }) {
    const { t } = useTranslation();
    const paired = !!transaction.pairGroup;
    const expense = isExpenseCategory(transaction);
    const needsContributor = paired || !expense;
    const [form, setForm] = useState({
        date: transaction.date,
        amount: String(Math.abs(Number(transaction.amount) || 0)),
        userId: transaction.userId ? String(transaction.userId) : (users[0] ? String(users[0].id) : ''),
        description: transaction.description || '',
    });
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: () => api.put(`/transactions/${transaction.id}`, {
            date: form.date,
            amount: Math.abs(parseFloat(form.amount)),
            categoryId: transaction.categoryId,
            description: form.description,
            ...(needsContributor ? { userId: Number(form.userId) } : {}),
        }),
        onSuccess: () => onSaved(),
        onError: (err) => setError(errorMessage(err, t('transaction.failed'))),
    });

    const submit = (event) => {
        event.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            setError(t('transaction.amountRequired'));
            return;
        }
        setError('');
        mutation.mutate();
    };

    return (
        <Modal title={t('transaction.editTitle')} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                {paired && <p className="text-sm text-amber-700 bg-amber-50 rounded-2xl px-4 py-3">{t('transaction.editPair')}</p>}
                <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.date')}</span>
                    <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" required />
                </label>
                <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.amount')}</span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(event) => setForm({ ...form, amount: sanitizePositiveAmount(event.target.value) })}
                        className="w-full px-4 py-3 border border-slate-200 rounded-2xl"
                        required
                    />
                </label>
                {needsContributor && (
                    <label className="block">
                        <span className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.operator')}</span>
                        <select value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" required>
                            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                    </label>
                )}
                <label className="block">
                    <span className="block text-sm font-medium text-slate-700 mb-1">{t('transaction.description')}</span>
                    <input type="text" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                </label>
                {error && <p className="text-sm text-rose-600">{error}</p>}
                <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200">{t('common.cancel')}</button>
                    <button type="submit" disabled={mutation.isPending} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white disabled:bg-slate-300">
                        {mutation.isPending ? t('common.submitting') : t('transaction.saveEdit')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
