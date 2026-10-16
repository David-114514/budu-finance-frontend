import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import api, { errorMessage, invalidateFinance } from '../api/axios';
import { fillMonthlyData } from '../utils/transactionHelper';
import { formatAxis, formatHkd, monthsAgoIso, todayIso } from '../utils/money';

const COLORS = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#e11d48', '#0891b2'];

export default function Dashboard() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [startDate, setStartDate] = useState(monthsAgoIso(6));
    const [endDate, setEndDate] = useState(todayIso());
    const [bankBalance, setBankBalance] = useState('');
    const [asOfDate, setAsOfDate] = useState(todayIso());
    const [note, setNote] = useState('');
    const [reconcileResult, setReconcileResult] = useState(null);
    const [actionError, setActionError] = useState('');

    const dashboardQuery = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => (await api.get('/dashboard')).data,
    });

    const monthlyQuery = useQuery({
        queryKey: ['monthly', startDate, endDate],
        queryFn: async () => (await api.get('/dashboard/monthly', { params: { start: startDate, end: endDate } })).data,
        enabled: !!startDate && !!endDate && startDate <= endDate,
    });

    const interestQuery = useQuery({
        queryKey: ['interest', startDate, endDate],
        queryFn: async () => (await api.get('/dashboard/interest', { params: { start: startDate, end: endDate } })).data,
        enabled: !!startDate && !!endDate && startDate <= endDate,
    });

    const dashboard = dashboardQuery.data;

    const filled = useMemo(
        () => fillMonthlyData(monthlyQuery.data || [], startDate, endDate),
        [monthlyQuery.data, startDate, endDate],
    );

    const contributionData = (dashboard?.personalBalances || [])
        .filter((person) => Number(person.balance) > 0)
        .map((person, index) => ({
            name: person.userName,
            value: Number(person.balance) || 0,
            color: COLORS[index % COLORS.length],
        }));

    const repair = useMutation({
        mutationFn: () => api.post('/ledger/sync'),
        onSuccess: () => invalidateFinance(queryClient),
        onError: (error) => setActionError(errorMessage(error, t('common.unknownError'))),
    });

    const reconcile = useMutation({
        mutationFn: () => api.post('/reconciliations', {
            asOfDate,
            bankBalance: Number(bankBalance),
            note,
        }),
        onSuccess: async (response) => {
            setReconcileResult(response.data);
            setActionError('');
            await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
        onError: (error) => setActionError(errorMessage(error, t('common.unknownError'))),
    });

    if (dashboardQuery.isLoading) return <p className="text-center py-20 text-slate-500">{t('common.loading')}</p>;
    if (dashboardQuery.isError) return <p className="text-center py-20 text-rose-600">{t('common.error')}</p>;

    const people = dashboard.personalBalances || [];
    const differenceText = (result) => {
        const difference = Number(result.difference);
        if (Math.abs(difference) < 0.005) return t('reconcile.match');
        if (difference > 0) return t('reconcile.bankHigher', { amount: formatHkd(difference) });
        return t('reconcile.bookHigher', { amount: formatHkd(Math.abs(difference)) });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold">{t('dashboard.title')}</h2>
                <p className="text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
            </div>

            {dashboard.balanceInSync === false && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <p className="font-medium text-amber-900">{t('dashboard.repairTitle')}</p>
                        <p className="text-sm text-amber-800 mt-1">
                            {t('dashboard.repairDetail', {
                                cached: formatHkd(dashboard.cachedBalance),
                                ledger: formatHkd(dashboard.currentBalance),
                            })}
                        </p>
                    </div>
                    <button type="button" onClick={() => repair.mutate()} disabled={repair.isPending} className="px-4 py-2 rounded-2xl bg-amber-600 text-white text-sm disabled:opacity-50">
                        {t('dashboard.repair')}
                    </button>
                </div>
            )}

            <section className="bg-white rounded-3xl border border-emerald-100 p-6 md:p-8">
                <p className="text-emerald-700 text-sm font-medium">{t('dashboard.currentBalance')}</p>
                <p className="text-4xl md:text-5xl font-bold mt-2 tabular-nums tracking-tight">{formatHkd(dashboard.currentBalance)}</p>
                <p className="text-sm text-slate-500 mt-3">{t('dashboard.currentBalanceDesc')}</p>
            </section>

            <MortgageCard />

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Stat label={t('dashboard.totalContribution')} value={dashboard.totalContribution} hint={t('dashboard.totalContributionDesc')} tone="text-blue-700" />
                <Stat label={t('dashboard.totalExpense')} value={dashboard.totalExpense} hint={t('dashboard.totalExpenseDesc')} tone="text-rose-700" />
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold mb-4">{t('dashboard.personalBalanceTitle')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {people.length === 0 && <p className="text-slate-400">{t('dashboard.noPeople')}</p>}
                    {people.map((person, index) => (
                        <div key={person.userId} className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="font-medium">{person.userName}</span>
                                <span className="text-xs text-slate-400">{t(`roles.${person.role}`, { defaultValue: person.role })}</span>
                            </div>
                            <p className="text-2xl font-bold tabular-nums">{formatHkd(person.balance)}</p>
                            <p className="text-xs text-slate-500 mt-1">{t('dashboard.personalContributionLabel')}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold">{t('dashboard.monthlyTrend')}</h3>
                    <div className="flex items-center gap-2">
                        <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                        <span className="text-slate-400 text-sm">{t('dashboard.to')}</span>
                        <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filled} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={formatAxis} width={48} />
                            <Tooltip formatter={(value, name) => [formatHkd(value), name]} />
                            <Legend />
                            <Bar dataKey="transfer" name={t('dashboard.monthlyTransfer')} fill="#2563eb" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="expense" name={t('dashboard.monthlyExpense')} fill="#e11d48" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold">{t('interest.title')}</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">{t('interest.caption')}</p>
                    {interestQuery.data?.annualRatePercent != null && (
                        <p className="text-sm text-slate-600 mb-3">{t('interest.usingRate', { rate: formatRate(interestQuery.data.annualRatePercent) })}</p>
                    )}
                    {interestQuery.data?.amount != null && (
                        <p className="text-3xl font-bold tabular-nums mb-1">{formatHkd(interestQuery.data.amount)}</p>
                    )}
                    {interestQuery.data?.amount != null && <p className="text-xs text-slate-400">{t('interest.forRange')}</p>}
                    {interestQuery.data && interestQuery.data.amount == null && (
                        <p className="text-sm text-slate-600">{t('interest.missing')}</p>
                    )}
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold">{t('reconcile.title')}</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">{t('reconcile.caption')}</p>
                    <div className="space-y-3">
                        <label className="block">
                            <span className="block text-sm text-slate-600 mb-1">{t('reconcile.date')}</span>
                            <input type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                        </label>
                        <label className="block">
                            <span className="block text-sm text-slate-600 mb-1">{t('reconcile.bank')}</span>
                            <input type="number" step="0.01" value={bankBalance} onChange={(event) => setBankBalance(event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                        </label>
                        <label className="block">
                            <span className="block text-sm text-slate-600 mb-1">{t('reconcile.note')}</span>
                            <input type="text" value={note} placeholder={t('reconcile.notePlaceholder')} onChange={(event) => setNote(event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                        </label>
                        <button type="button" onClick={() => reconcile.mutate()} disabled={reconcile.isPending || bankBalance === ''} className="w-full py-3 rounded-2xl bg-slate-900 text-white disabled:bg-slate-300">
                            {t('reconcile.submit')}
                        </button>
                        {reconcileResult && <p className="text-sm text-slate-700">{differenceText(reconcileResult)}</p>}
                        {!reconcileResult && dashboard.lastReconciliation && (
                            <p className="text-xs text-slate-400">
                                {t('reconcile.last', {
                                    date: dashboard.lastReconciliation.asOfDate,
                                    amount: formatHkd(dashboard.lastReconciliation.difference),
                                })}
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {actionError && <p className="text-sm text-rose-600">{actionError}</p>}

            <section className="bg-white rounded-3xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold mb-4">{t('dashboard.contributionRatio')}</h3>
                {contributionData.length === 0 ? (
                    <p className="text-slate-400">{t('dashboard.noChart')}</p>
                ) : (
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={contributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                                    {contributionData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(value, name) => [formatHkd(value), name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>
        </div>
    );
}

function formatRate(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    return n.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

const MORTGAGE_FIELDS = [
    'originalPrincipal',
    'annualRatePercent',
    'termYears',
    'startDate',
    'paymentDay',
    'interestCreditDay',
    'monthlyInstallment',
    'principalDescription',
    'interestDescription',
];

function MortgageCard() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState(null);
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');

    const mortgageQuery = useQuery({
        queryKey: ['mortgage'],
        queryFn: async () => (await api.get('/mortgage')).data,
    });

    const save = useMutation({
        mutationFn: (body) => api.put('/mortgage', body),
        onSuccess: async (response) => {
            queryClient.setQueryData(['mortgage'], response.data);
            setDraft(null);
            setMessage(t('mortgage.saved'));
            await invalidateFinance(queryClient);
        },
        onError: (error) => setMessage(errorMessage(error, t('common.unknownError'))),
    });

    if (mortgageQuery.isLoading) {
        return <section className="bg-white rounded-3xl border border-slate-200 p-6"><p className="text-slate-500">{t('common.loading')}</p></section>;
    }
    if (mortgageQuery.isError || !mortgageQuery.data) {
        return <section className="bg-white rounded-3xl border border-slate-200 p-6"><p className="text-rose-600">{errorMessage(mortgageQuery.error, t('common.error'))}</p></section>;
    }

    const mortgage = mortgageQuery.data;
    const valueOf = (name) => (draft ? draft[name] : (mortgage[name] ?? ''));
    const edit = (name, value) => {
        const next = {};
        for (const field of MORTGAGE_FIELDS) {
            next[field] = valueOf(field);
        }
        next[name] = value;
        setDraft(next);
        setMessage('');
    };
    const filled = MORTGAGE_FIELDS.every((name) => String(valueOf(name)).trim() !== '');
    const formula = Number(mortgage.formulaInstallment);
    const installment = Number(mortgage.monthlyInstallment);
    const showFormulaGap = Number.isFinite(formula) && Number.isFinite(installment) && Math.abs(formula - installment) >= 0.005;
    const remaining = Number(mortgage.remainingPrincipal);

    const submit = () => {
        save.mutate({
            originalPrincipal: Number(valueOf('originalPrincipal')),
            annualRatePercent: Number(valueOf('annualRatePercent')),
            termYears: Number(valueOf('termYears')),
            startDate: valueOf('startDate'),
            paymentDay: Number(valueOf('paymentDay')),
            interestCreditDay: Number(valueOf('interestCreditDay')),
            monthlyInstallment: Number(valueOf('monthlyInstallment')),
            principalDescription: String(valueOf('principalDescription')).trim(),
            interestDescription: String(valueOf('interestDescription')).trim(),
        });
    };

    return (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6">
            <div>
                <p className="text-sm font-medium text-slate-500">{t('mortgage.remaining')}</p>
                <p className="text-4xl md:text-5xl font-bold mt-2 tabular-nums tracking-tight">{formatHkd(mortgage.remainingPrincipal)}</p>
                <p className="text-sm text-slate-500 mt-3">
                    {t('mortgage.originalLine', {
                        original: formatHkd(mortgage.originalPrincipal),
                        repaid: formatHkd(mortgage.principalRepaid),
                        paid: mortgage.paidPeriods,
                        total: mortgage.totalPeriods,
                    })}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                    {t('mortgage.termsLine', {
                        rate: formatRate(mortgage.annualRatePercent),
                        installment: formatHkd(mortgage.monthlyInstallment),
                        years: mortgage.termYears,
                        start: mortgage.startDate,
                        payDay: mortgage.paymentDay,
                        creditDay: mortgage.interestCreditDay,
                    })}
                </p>
            </div>

            {mortgage.nextPaymentDate ? (
                <div>
                    <p className="font-medium">
                        {t('mortgage.nextDate', { date: mortgage.nextPaymentDate, days: mortgage.daysInNextPeriod })}
                    </p>
                    {mortgage.nextPaymentOverdue && <p className="text-sm text-amber-700 mt-1">{t('mortgage.overdue')}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <Mini label={t('mortgage.nextInterest')} value={mortgage.nextInterest} />
                        <Mini label={t('mortgage.nextPrincipal')} value={mortgage.nextPrincipal} />
                        <Mini label={t('mortgage.nextTotal')} value={mortgage.nextTotal} />
                    </div>
                </div>
            ) : (
                <p className="text-sm text-slate-600">{remaining < 0 ? t('mortgage.overpaid') : t('mortgage.cleared')}</p>
            )}

            {showFormulaGap && (
                <p className="text-sm text-slate-500">
                    {t('mortgage.formulaGap', {
                        bank: formatHkd(mortgage.monthlyInstallment),
                        formula: formatHkd(mortgage.formulaInstallment),
                    })}
                </p>
            )}

            <div className="border-t border-slate-100 pt-5">
                <h3 className="text-lg font-semibold">{t('mortgage.cashTitle')}</h3>
                <p className="text-sm text-slate-500 mt-1">{t('mortgage.cashCaption')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <Mini label={t('mortgage.daily')} value={mortgage.dailyCashInterest} />
                    <Mini label={t('mortgage.accrued', { start: mortgage.accrualStart })} value={mortgage.accruedCashInterest} />
                    <Mini label={t('mortgage.projected', { date: mortgage.nextInterestCreditDate })} value={mortgage.projectedCashInterest} />
                </div>
            </div>

            <div>
                <button type="button" onClick={() => setOpen((current) => !current)} className="text-sm font-medium text-blue-700">
                    {open ? t('mortgage.hide') : t('mortgage.edit')}
                </button>
                {open && (
                    <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label={t('mortgage.rate')}>
                                <input type="number" min="0" max="30" step="0.001" value={valueOf('annualRatePercent')} onChange={(event) => edit('annualRatePercent', event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                            </Field>
                            <Field label={t('mortgage.principal')}>
                                <input type="number" min="0" step="0.01" value={valueOf('originalPrincipal')} onChange={(event) => edit('originalPrincipal', event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                            </Field>
                            <Field label={t('mortgage.term')}>
                                <input type="number" min="1" max="50" step="1" value={valueOf('termYears')} onChange={(event) => edit('termYears', event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                            </Field>
                            <Field label={t('mortgage.installment')}>
                                <input type="number" min="0" step="0.01" value={valueOf('monthlyInstallment')} onChange={(event) => edit('monthlyInstallment', event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                            </Field>
                            <Field label={t('mortgage.start')}>
                                <input type="date" value={valueOf('startDate')} onChange={(event) => edit('startDate', event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                            </Field>
                            <Field label={t('mortgage.paymentDay')}>
                                <input type="number" min="1" max="31" step="1" value={valueOf('paymentDay')} onChange={(event) => edit('paymentDay', event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                            </Field>
                            <Field label={t('mortgage.creditDay')}>
                                <input type="number" min="1" max="31" step="1" value={valueOf('interestCreditDay')} onChange={(event) => edit('interestCreditDay', event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                            </Field>
                            <Field label={t('mortgage.principalNote')}>
                                <input type="text" value={valueOf('principalDescription')} onChange={(event) => edit('principalDescription', event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                            </Field>
                            <Field label={t('mortgage.interestNote')} className="sm:col-span-2">
                                <input type="text" value={valueOf('interestDescription')} onChange={(event) => edit('interestDescription', event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-2xl" />
                            </Field>
                        </div>
                        <p className="text-xs text-slate-500">{t('mortgage.noteHint')}</p>
                        <p className="text-xs text-slate-500">
                            {t('mortgage.formulaHint', {
                                formula: formatHkd(mortgage.formulaInstallment),
                                reset: formatHkd(mortgage.resetInstallment),
                                months: mortgage.remainingPeriods,
                            })}
                        </p>
                        <p className="text-xs text-slate-500">{t('mortgage.assumption')}</p>
                        <button type="button" onClick={submit} disabled={save.isPending || !filled} className="px-4 py-3 rounded-2xl bg-blue-600 text-white text-sm disabled:bg-slate-300">
                            {save.isPending ? t('common.submitting') : t('mortgage.save')}
                        </button>
                        {message && <p className="text-sm text-slate-600">{message}</p>}
                    </div>
                )}
            </div>
        </section>
    );
}

function Mini({ label, value }) {
    return (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold tabular-nums mt-1">{formatHkd(value)}</p>
        </div>
    );
}

function Field({ label, children, className = '' }) {
    return (
        <label className={`block ${className}`}>
            <span className="block text-sm text-slate-600 mb-1">{label}</span>
            {children}
        </label>
    );
}

function Stat({ label, value, hint, tone }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <p className={`text-sm font-medium ${tone}`}>{label}</p>
            <p className="text-3xl font-bold mt-2 tabular-nums">{formatHkd(value)}</p>
            <p className="text-sm text-slate-500 mt-3">{hint}</p>
        </div>
    );
}
