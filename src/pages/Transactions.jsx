import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { format } from 'date-fns';   // 先安裝：pnpm add date-fns

export default function Transactions() {
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const res = await api.get('/transactions?start=2026-01-01&end=2026-12-31');
            return res.data;
        }
    });

    if (isLoading) return <div className="text-center py-20">載入交易記錄...</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">交易流水</h2>

            <div className="bg-white rounded-3xl shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日期</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">類別</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">描述</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">金額</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">操作人</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {format(new Date(t.date), 'yyyy-MM-dd')}
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-lg mr-2">{t.categoryName}</span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{t.description || '-'}</td>
                            <td className="px-6 py-4 text-right font-medium">
                                {t.amount > 0 ? (
                                    <span className="text-green-600">+{t.amount.toLocaleString()}</span>
                                ) : (
                                    <span className="text-red-600">{t.amount.toLocaleString()}</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{t.userName}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {transactions.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        還沒有交易記錄，快去新增吧！
                    </div>
                )}
            </div>
        </div>
    );
}