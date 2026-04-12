import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Home, TrendingUp, Users, Wallet } from 'lucide-react';

export default function Dashboard() {
    const { data: dashboard, isLoading, error, refetch } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const res = await api.get('/dashboard');
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="text-lg text-gray-500">載入中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 text-red-600">
                無法連接到後端，請確認後端正在運行（http://localhost:8080）
                <button
                    onClick={() => refetch()}
                    className="mt-4 block mx-auto px-6 py-2 bg-blue-600 text-white rounded-lg"
                >
                    重試
                </button>
            </div>
        );
    }

    const debtInWan = (dashboard.effectiveDebt / 10000).toFixed(1);
    const parentContribInWan = (dashboard.totalParentContribution / 10000).toFixed(1);
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
                {/* 有效淨債務 */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-600 text-sm font-medium tracking-widest">EFFECTIVE DEBT</p>
                            <p className="text-5xl font-bold text-gray-900 mt-3">
                                {debtInWan} <span className="text-2xl">萬</span>
                            </p>
                        </div>
                        <Home className="w-16 h-16 text-red-500 opacity-80" />
                    </div>
                    <p className="text-sm text-gray-500 mt-6">按揭剩餘 - 抵銷戶口</p>
                </div>

                {/* 抵銷戶口 */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium tracking-widest">OFFSET ACCOUNT</p>
                            <p className="text-5xl font-bold text-gray-900 mt-3">
                                {dashboard.offsetTotal.toLocaleString()}
                            </p>
                            <p className="text-green-600 mt-1">HKD</p>
                        </div>
                        <TrendingUp className="w-16 h-16 text-green-500 opacity-80" />
                    </div>
                    <p className="text-sm text-gray-500 mt-6">目前抵銷率 {offsetPercent}%</p>
                </div>

                {/* 父母貢獻 */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium tracking-widest">PARENTS CONTRIBUTION</p>
                            <p className="text-5xl font-bold text-gray-900 mt-3">
                                {parentContribInWan} <span className="text-2xl">萬</span>
                            </p>
                        </div>
                        <Users className="w-16 h-16 text-blue-500 opacity-80" />
                    </div>
                    <p className="text-sm text-gray-500 mt-6">包含首付 + 抵銷存款</p>
                </div>
            </div>

            {/* 快速操作區 */}
            <div className="bg-white rounded-3xl shadow p-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Wallet className="w-5 h-5" /> 快速操作
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => alert('即將開發：新增交易功能')}
                        className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                    >
                        <span className="text-4xl mb-3">💰</span>
                        <span className="font-medium">新增交易</span>
                    </button>

                    <button
                        onClick={() => alert('即將開發：轉入抵銷戶口')}
                        className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-2xl transition-all"
                    >
                        <span className="text-4xl mb-3">🏦</span>
                        <span className="font-medium">轉入抵銷</span>
                    </button>
                </div>
            </div>
        </div>
    );
}