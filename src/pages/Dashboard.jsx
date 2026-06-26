import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { TrendingUp, Users, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { format, subMonths } from 'date-fns';
import { mergeMonthlyData } from '../utils/transactionHelper';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

export default function Dashboard() {
    const { t } = useTranslation();

    // 日期範圍狀態（預設最近6個月）
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { data: dashboard, isLoading, error} = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => (await api.get('/dashboard')).data,
    });

    const dateRangeReady = !!startDate && !!endDate;

    const { data: monthlyTransferData = [] } = useQuery({
        queryKey: ['monthlyTransfer', startDate, endDate],
        queryFn: async () => {
            const res = await api.get(`/dashboard/monthly-transfer?start=${startDate}&end=${endDate}`);
            return res.data;
        },
        enabled: dateRangeReady,
    });

    const { data: monthlyExpenseData = [] } = useQuery({
        queryKey: ['monthlyExpense', startDate, endDate],
        queryFn: async () => {
            const res = await api.get(`/dashboard/monthly-expense?start=${startDate}&end=${endDate}`);
            return res.data;
        },
        enabled: dateRangeReady,
    });

    const personalBalances = dashboard?.personalBalances || [];

    const contributionData = personalBalances.map((person, index) => ({
        name: person.userName,
        value: Number(person.balance) || 0,
        color: COLORS[index % COLORS.length]
    }));

    const mergedMonthlyData = useMemo(
        () => mergeMonthlyData(monthlyTransferData, monthlyExpenseData),
        [monthlyTransferData, monthlyExpenseData]
    );

    if (isLoading) return <div className="text-center py-20 text-xl">{t('common.loading')}</div>;
    if (error) return <div className="text-center py-20 text-red-600">{t('common.error')}</div>;

    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-4xl font-bold text-gray-900">{t('dashboard.title')}</h2>
                <p className="text-gray-600 mt-2">{t('dashboard.subtitle')}</p>
            </div>

            {/* 總投入 + 當前餘額 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 總投入 */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium">{t('dashboard.totalContribution')}</p>
                            <p className="text-5xl font-bold mt-3">
                                ¥{(personalBalances.reduce((sum, p) => sum + (p.balance || 0), 0) / 10000).toFixed(1)}
                                <span className="text-2xl">{t('common.w')}</span>
                            </p>
                        </div>
                        <TrendingUp className="w-16 h-16 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-6">{t('dashboard.totalContributionDesc')}</p>
                </div>

                {/* 當前餘額 */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">{t('dashboard.currentBalance')}</p>
                            <p className="text-5xl font-bold mt-3">
                                ¥{(dashboard?.currentBalance / 10000).toFixed(1)}
                                <span className="text-2xl">{t('common.w')}</span>
                            </p>
                        </div>
                        <Wallet className="w-16 h-16 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-6">{t('dashboard.currentBalanceDesc')}</p>
                </div>
            </div>

            {/* 個人貢獻金額 */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5" /> {t('dashboard.personalBalanceTitle')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {personalBalances.length > 0 ? (
                        personalBalances.map((person, index) => (
                            <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="font-medium text-gray-700">{person.userName}</span>
                                </div>
                                <div className="text-4xl font-bold text-gray-900">
                                    ¥{(person.balance / 10000).toFixed(1)}<span className="text-2xl">{t('common.w')}</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{t('dashboard.personalContributionLabel')}</div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-4 text-center py-8 text-gray-400">
                            暫無交易記錄，新增交易後即可顯示個人餘額
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-4">* 根據實際交易記錄自動計算</p>
            </div>

            {/* 每月收支趨勢 */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h3 className="text-xl font-semibold">{t('dashboard.monthlyTrend')}</h3>

                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
                        />
                        <span className="text-gray-400">至</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
                        />
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={mergedMonthlyData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                            dataKey="transfer"
                            name={t('dashboard.monthlyTransfer')}
                            fill="#3b82f6"
                            radius={[6, 6, 0, 0]}
                        />
                        <Bar
                            dataKey="expense"
                            name={t('dashboard.monthlyExpense')}
                            fill="#ef4444"
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* 家庭貢獻比例 */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-xl font-semibold mb-6">{t('dashboard.contributionRatio')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={contributionData} cx="50%" cy="50%" innerRadius={70} outerRadius={130} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {contributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}