import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Home, TrendingUp, Users, Wallet, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';
import { format, subMonths } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

export default function Dashboard({ onNavigate }) {
    const { t } = useTranslation();

    // 日期範圍狀態（預設最近6個月）
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const { data: dashboard, isLoading, error, refetch } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => (await api.get('/dashboard')).data,
    });

    // 動態查詢每月轉入數據
    const { data: monthlyTransferData = [] } = useQuery({
        queryKey: ['monthlyTransfer', startDate, endDate],
        queryFn: async () => {
            const res = await api.get(`/dashboard/monthly-transfer?start=${startDate}&end=${endDate}`);
            return res.data;
        },
        enabled: !!startDate && !!endDate,
    });

    const personalBalances = dashboard?.personalBalances || [];

    const contributionData = personalBalances.map((person, index) => ({
        name: person.userName,
        value: Number(person.balance) || 0,
        color: COLORS[index % COLORS.length]
    }));

    if (isLoading) return <div className="text-center py-20 text-xl">{t('common.loading')}</div>;
    if (error) return <div className="text-center py-20 text-red-600">{t('common.error')}</div>;

    const debtInWan = (dashboard?.effectiveDebt / 10000).toFixed(1) || '0.0';
    const offsetPercent = dashboard?.mortgageBalance > 0
        ? ((dashboard.offsetTotal / dashboard.mortgageBalance) * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-4xl font-bold text-gray-900">{t('dashboard.title')}</h2>
                <p className="text-gray-600 mt-2">{t('dashboard.subtitle')}</p>
            </div>

            {/* 核心數據卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-red-600 text-sm font-medium">{t('dashboard.effectiveDebt')}</p>
                            <p className="text-5xl font-bold mt-3">{debtInWan} <span className="text-2xl">W</span></p>
                        </div>
                        <Home className="w-16 h-16 text-red-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-6">{t('dashboard.effectiveDebtDesc')}</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">{t('dashboard.mortgageAccountBalance')}</p>
                            <p className="text-5xl font-bold mt-3">{dashboard?.offsetTotal?.toLocaleString() || 0}</p>
                            <p className="text-green-600">HKD ({offsetPercent}%)</p>
                        </div>
                        <TrendingUp className="w-16 h-16 text-green-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-6">{t('dashboard.mortgageAccountDesc')}</p>
                </div>
            </div>

            {/* 個人剩餘金額（B方案） */}
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
                                    ¥{(person.balance / 10000).toFixed(1)}<span className="text-2xl">W</span>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{t('dashboard.currentBalance')}</div>
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

            {/* 每月轉入按揭帳戶（折線圖 + 動態日期範圍） */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">{t('dashboard.monthlyTransfer')}</h3>

                    {/* 日期範圍選擇器 */}
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

                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTransferData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', r: 4 }}
                        />
                    </LineChart>
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