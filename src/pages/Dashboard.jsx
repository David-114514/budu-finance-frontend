import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Home, TrendingUp, Users, Wallet, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

export default function Dashboard({ onNavigate }) {   // 接收來自 App.jsx 的跳轉函數
    const { data: dashboard, isLoading, error, refetch } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => (await api.get('/dashboard')).data,
    });

    // 每月轉入示意數據（之後可改成後端真實數據）
    const monthlyData = [
        { month: '1月', transfer: 45000 },
        { month: '2月', transfer: 62000 },
        { month: '3月', transfer: 38000 },
        { month: '4月', transfer: 55000 },
    ];

    const contributionData = [
        { name: '丈夫', value: 280000, color: '#3b82f6' },
        { name: '妻子', value: 170000, color: '#60a5fa' },
        { name: '丈夫父母', value: 800000, color: '#10b981' },
        { name: '妻子父母', value: 400000, color: '#34d399' },
    ];

    if (isLoading) return <div className="text-center py-20 text-xl">載入中...</div>;
    if (error) {
        return (
            <div className="text-center py-20 text-red-600">
                無法連接到後端
                <button onClick={refetch} className="mt-4 block mx-auto px-6 py-2 bg-blue-600 text-white rounded-lg">重試</button>
            </div>
        );
    }

    const debtInWan = (dashboard.effectiveDebt / 10000).toFixed(1);
    const parentInWan = (dashboard.totalParentContribution / 10000).toFixed(1);
    const offsetPercent = dashboard.mortgageBalance > 0
        ? ((dashboard.offsetTotal / dashboard.mortgageBalance) * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-4xl font-bold text-gray-900">家庭財務總覽</h2>
                <p className="text-gray-600 mt-2">即時掌握按揭進度與家庭貢獻</p>
            </div>

            {/* 核心數據卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-red-600 text-sm font-medium">EFFECTIVE DEBT</p>
                            <p className="text-5xl font-bold mt-3">{debtInWan} <span className="text-2xl">萬</span></p>
                        </div>
                        <Home className="w-16 h-16 text-red-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-6">按揭剩餘 - 抵銷戶口</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">OFFSET ACCOUNT</p>
                            <p className="text-5xl font-bold mt-3">{dashboard.offsetTotal.toLocaleString()}</p>
                            <p className="text-green-600">HKD ({offsetPercent}%)</p>
                        </div>
                        <TrendingUp className="w-16 h-16 text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium">PARENTS CONTRIBUTION</p>
                            <p className="text-5xl font-bold mt-3">{parentInWan} <span className="text-2xl">萬</span></p>
                        </div>
                        <Users className="w-16 h-16 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500 mt-6">包含首付 + 抵銷存款</p>
                </div>
            </div>

            {/* 圖表區域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h3 className="text-xl font-semibold mb-6">每月轉入抵銷戶口</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="transfer" fill="#3b82f6" radius={8} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 貢獻比例餅圖 - 四人版 */}
                <div className="bg-white rounded-3xl shadow-xl p-8">
                    <h3 className="text-xl font-semibold mb-6">家庭貢獻比例</h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={contributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={130}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {contributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                        {contributionData.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-lg flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-gray-500">¥{(item.value / 10000).toFixed(1)}萬</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}