import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api, { errorMessage, invalidateFinance } from '../api/axios';
import { categoryLabel } from '../utils/transactionHelper';
import { formatHkd, monthsAgoIso, thisYearRange, todayIso } from '../utils/money';
import EditTransactionDialog from '../components/EditTransactionDialog';

export default function Transactions() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const year = thisYearRange();
    const [startDate, setStartDate] = useState(year.start);
    const [endDate, setEndDate] = useState(year.end);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [userId, setUserId] = useState('');
    const [keyword, setKeyword] = useState('');
    const [includeVoided, setIncludeVoided] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [error, setError] = useState('');

    const listQuery = useQuery({
        queryKey: ['transactions', startDate, endDate, page, size, userId, keyword, includeVoided],
        queryFn: async () => (await api.get('/transactions', {
            params: {
                start: startDate,
                end: endDate,
                page,
                size,
                userId: userId || undefined,
                keyword: keyword || undefined,
                includeVoided,
            },
        })).data,
    });

    const usersQuery = useQuery({
        queryKey: ['users'],
        queryFn: async () => (await api.get('/users')).data,
    });

    const refresh = async () => {
        setConfirmId(null);
        setEditing(null);
        await invalidateFinance(queryClient);
    };

    const voidMutation = useMutation({
        mutationFn: (id) => api.post(`/transactions/${id}/void`),
        onSuccess: refresh,
        onError: (err) => setError(errorMessage(err, t('common.unknownError'))),
    });

    const restoreMutation = useMutation({
        mutationFn: (id) => api.post(`/transactions/${id}/restore`),
        onSuccess: refresh,
        onError: (err) => setError(errorMessage(err, t('common.unknownError'))),
    });

    const exportCsv = async () => {
        setError('');
        try {
            const response = await api.get('/transactions/export', {
                params: {
                    start: startDate,
                    end: endDate,
                    userId: userId || undefined,
                    keyword: keyword || undefined,
                    includeVoided,
                },
                responseType: 'blob',
            });
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'transactions.csv';
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(errorMessage(err, t('common.unknownError')));
        }
    };

    const pageData = listQuery.data;
    const transactions = pageData?.content || [];
    const totalElements = pageData?.totalElements || 0;
    const totalPages = pageData?.totalPages || 0;
    const users = usersQuery.data || [];

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-3xl font-bold">{t('app.transactions')}</h2>
                    <p className="text-sm text-slate-500 mt-1">{t('transaction.count', { count: totalElements })}</p>
                </div>
                <button type="button" onClick={exportCsv} className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm">
                    {t('common.export')}
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-4 mb-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => { const range = thisYearRange(); setStartDate(range.start); setEndDate(range.end); setPage(0); }} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{t('transaction.thisYear')}</button>
                    <button type="button" onClick={() => { setStartDate(monthsAgoIso(6)); setEndDate(todayIso()); setPage(0); }} className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm">{t('transaction.lastSix')}</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(0); }} className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                    <input type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(0); }} className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                    <select value={userId} onChange={(event) => { setUserId(event.target.value); setPage(0); }} className="px-3 py-2 border border-slate-200 rounded-xl text-sm">
                        <option value="">{t('common.all')}</option>
                        {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                    <input
                        type="search"
                        value={keyword}
                        onChange={(event) => { setKeyword(event.target.value); setPage(0); }}
                        placeholder={t('common.search')}
                        className="px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={includeVoided} onChange={(event) => { setIncludeVoided(event.target.checked); setPage(0); }} />
                    {t('transaction.showVoided')}
                </label>
            </div>

            {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
            {listQuery.isLoading && <p className="text-center py-16 text-slate-500">{t('common.loading')}</p>}
            {listQuery.isError && <p className="text-center py-16 text-rose-600">{t('common.error')}</p>}

            {!listQuery.isLoading && transactions.length === 0 && (
                <p className="text-center py-16 text-slate-400">{t('transaction.noRecords')}</p>
            )}

            <div className="md:hidden space-y-3">
                {transactions.map((tx) => (
                    <article key={tx.id} className={`bg-white rounded-3xl border border-slate-200 p-4 ${tx.voided ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-slate-500">{tx.date}</p>
                                <p className="font-medium mt-1">{tx.categoryIcon} {categoryLabel(tx, t)}</p>
                                <p className="text-sm text-slate-500 mt-1">{tx.description || '—'}</p>
                            </div>
                            <p className={`font-semibold tabular-nums ${Number(tx.amount) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{formatHkd(tx.amount)}</p>
                        </div>
                        <EntryMeta tx={tx} t={t} />
                        <EntryActions
                            tx={tx}
                            t={t}
                            confirmId={confirmId}
                            setConfirmId={setConfirmId}
                            onEdit={() => setEditing(tx)}
                            onVoid={() => voidMutation.mutate(tx.id)}
                            onRestore={() => restoreMutation.mutate(tx.id)}
                        />
                    </article>
                ))}
            </div>

            {transactions.length > 0 && (
                <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-left text-sm text-slate-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">{t('transaction.date')}</th>
                                <th className="px-4 py-3 font-medium">{t('transaction.category')}</th>
                                <th className="px-4 py-3 font-medium">{t('transaction.description')}</th>
                                <th className="px-4 py-3 font-medium text-right">{t('transaction.amount')}</th>
                                <th className="px-4 py-3 font-medium">{t('transaction.operator')}</th>
                                <th className="px-4 py-3 font-medium" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className={tx.voided ? 'opacity-60' : ''}>
                                    <td className="px-4 py-3 text-sm whitespace-nowrap">{tx.date}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span>{tx.categoryIcon} {categoryLabel(tx, t)}</span>
                                        {tx.pairGroup && <span className="ml-2 text-xs text-amber-700">{t('transaction.passBadge')}</span>}
                                        {tx.voided && <span className="ml-2 text-xs text-slate-400">{t('transaction.voided')}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{tx.description || '—'}</td>
                                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${Number(tx.amount) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                        {formatHkd(tx.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {tx.userName || t('transaction.household')}
                                        {tx.createdByName && <div className="text-xs text-slate-400">{t('transaction.enteredBy', { name: tx.createdByName })}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <EntryActions
                                            tx={tx}
                                            t={t}
                                            confirmId={confirmId}
                                            setConfirmId={setConfirmId}
                                            onEdit={() => setEditing(tx)}
                                            onVoid={() => voidMutation.mutate(tx.id)}
                                            onRestore={() => restoreMutation.mutate(tx.id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalElements > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm">
                    <p className="text-slate-500">{t('transaction.page', { page: page + 1, pages: Math.max(totalPages, 1) })}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">{t('transaction.perPage')}</span>
                        <select value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(0); }} className="border border-slate-200 rounded-lg px-2 py-1">
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <button type="button" disabled={page <= 0} onClick={() => setPage((value) => value - 1)} className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40">{t('transaction.prev')}</button>
                        <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)} className="px-3 py-1.5 rounded-xl border border-slate-200 disabled:opacity-40">{t('transaction.next')}</button>
                    </div>
                </div>
            )}

            {editing && (
                <EditTransactionDialog
                    transaction={editing}
                    users={users}
                    onClose={() => setEditing(null)}
                    onSaved={refresh}
                />
            )}
        </div>
    );
}

function EntryMeta({ tx, t }) {
    return (
        <div className="mt-3 text-sm text-slate-500 flex flex-wrap gap-2">
            <span>{tx.userName || t('transaction.household')}</span>
            {tx.pairGroup && <span className="text-amber-700">{t('transaction.passBadge')}</span>}
            {tx.voided && <span>{t('transaction.voided')}</span>}
            {tx.createdByName && <span>{t('transaction.enteredBy', { name: tx.createdByName })}</span>}
        </div>
    );
}

function EntryActions({ tx, t, confirmId, setConfirmId, onEdit, onVoid, onRestore }) {
    return (
        <div className="mt-3 md:mt-0 flex flex-wrap justify-end gap-2">
            {!tx.voided && (
                <button type="button" onClick={onEdit} className="text-sm px-3 py-1.5 rounded-xl bg-slate-100">{t('transaction.edit')}</button>
            )}
            {tx.voided ? (
                <button type="button" onClick={onRestore} className="text-sm px-3 py-1.5 rounded-xl bg-slate-100">{t('transaction.restore')}</button>
            ) : confirmId === tx.id ? (
                <button type="button" onClick={onVoid} className="text-sm px-3 py-1.5 rounded-xl bg-rose-600 text-white">{t('transaction.confirmVoid')}</button>
            ) : (
                <button type="button" onClick={() => setConfirmId(tx.id)} className="text-sm px-3 py-1.5 rounded-xl text-rose-600">{t('transaction.void')}</button>
            )}
        </div>
    );
}
