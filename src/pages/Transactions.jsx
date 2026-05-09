import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function Transactions() {
    const { t, i18n } = useTranslation();

    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const res = await api.get('/transactions?start=2026-01-01&end=2026-12-31');
            return res.data;
        }
    });

    // 類別名稱對照表（前端臨時方案，之後可改成後端支援多語言）
    const getCategoryName = (categoryName) => {
        const categoryMap = {
            '薪資收入': { 'en': 'Salary Income', 'zh-CN': '薪资收入' },
            '轉入抵銷戶口': { 'en': 'Transfer to Offset Account', 'zh-CN': '转入抵销账户' },
            '父母抵銷存款': { 'en': 'Parent Offset Deposit', 'zh-CN': '父母抵销存款' },
            '利息節省返還父母': { 'en': 'Interest Saved Returned to Parents', 'zh-CN': '利息节省返还父母' },
            '家用開支': { 'en': 'Household Expenses', 'zh-CN': '家用开支' },
            '家電購置': { 'en': 'Appliance Purchase', 'zh-CN': '家电购置' },
            '中介及律師費': { 'en': 'Agency & Legal Fees', 'zh-CN': '中介及律师费' },
        };
        const currentLang = i18n.language;
        return categoryMap[categoryName]?.[currentLang] || categoryName;
    };

    if (isLoading) return <div className="text-center py-20">{t('common.loading')}</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">{t('app.transactions')}</h2>
            <div className="bg-white rounded-3xl shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('transaction.date')}</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('transaction.category')}</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('transaction.description')}</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">{t('transaction.amount')}</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">{t('transaction.operator')}</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {format(new Date(t.date), 'yyyy-MM-dd')}
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-lg mr-2">{getCategoryName(t.categoryName)}</span>
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
                        {t('transaction.noRecords')}
                    </div>
                )}
            </div>
        </div>
    );
}