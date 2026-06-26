import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { format, subMonths } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function Transactions() {
    const { t, i18n } = useTranslation();

    // 日期範圍（預設 2026 全年，可調整）
    const [startDate, setStartDate] = useState('2026-01-01');
    const [endDate, setEndDate] = useState('2026-12-31');

    // 分頁狀態
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);

    const { data: pageData, isLoading } = useQuery({
        queryKey: ['transactions', startDate, endDate, page, size],
        queryFn: async () => {
            const res = await api.get(
                `/transactions?start=${startDate}&end=${endDate}&page=${page}&size=${size}`
            );
            return res.data;
        }
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/categories')).data,
    });

    const categoryIconMap = Object.fromEntries(
        categories.map(cat => [cat.id, cat.icon])
    );

    const transactions = pageData?.content || [];
    const totalElements = pageData?.totalElements || 0;
    const totalPages = pageData?.totalPages || 0;
    const currentPageIndex = pageData?.number ?? page;

    // 類別名稱對照表（只保留 2 個類別）
    const getCategoryName = (categoryName) => {
        const categoryMap = {
            '轉入按揭戶口': { 'en': 'Transfer to Mortgage Account', 'zh-CN': '轉入按揭戶口' },
            '按揭戶口支出': { 'en': 'Mortgage Account Expense', 'zh-CN': '按揭戶口支出' },
        };
        const currentLang = i18n.language;
        return categoryMap[categoryName]?.[currentLang] || categoryName;
    };

    // 日期或每頁筆數改變時，重置到第一頁
    const handleDateChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(0);
    };

    const handleSizeChange = (e) => {
        setSize(Number(e.target.value));
        setPage(0);
    };

    const goToPage = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    if (isLoading) return <div className="text-center py-20">{t('common.loading')}</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">{t('app.transactions')}</h2>

            {/* 日期範圍選擇器（與 Dashboard 月度圖表風格一致） */}
            <div className="flex items-center gap-3 mb-4">
                <input
                    type="date"
                    value={startDate}
                    onChange={handleDateChange(setStartDate)}
                    className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
                <span className="text-gray-400">至</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={handleDateChange(setEndDate)}
                    className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
                <span className="text-sm text-gray-500 ml-2">
                    共 {totalElements} 筆記錄
                </span>
            </div>

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
                    {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {format(new Date(tx.date), 'yyyy-MM-dd')}
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-2">
                                    <span className="text-xl">{categoryIconMap[tx.categoryId] || ''}</span>
                                    <span>{getCategoryName(tx.categoryName)}</span>
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{tx.description || '-'}</td>
                            <td className="px-6 py-4 text-right font-medium">
                                {tx.amount > 0 ? (
                                    <span className="text-green-600">+{tx.amount.toLocaleString()}</span>
                                ) : (
                                    <span className="text-red-600">{tx.amount.toLocaleString()}</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {tx.userName || (tx.amount < 0 ? t('transaction.household') : '-')}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {transactions.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        {t('transaction.noRecords')}
                    </div>
                )}

                {/* 分頁控制 */}
                {totalElements > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gray-50 border-t text-sm">
                        <div className="text-gray-600 mb-2 md:mb-0">
                            第 {currentPageIndex + 1} / {totalPages} 頁　共 {totalElements} 筆
                        </div>

                        <div className="flex items-center gap-3">
                            {/* 每頁筆數選擇 */}
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">每頁</span>
                                <select
                                    value={size}
                                    onChange={handleSizeChange}
                                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                                <span className="text-gray-500">筆</span>
                            </div>

                            {/* 分頁按鈕 */}
                            <button
                                onClick={() => goToPage(currentPageIndex - 1)}
                                disabled={currentPageIndex <= 0}
                                className="px-4 py-1.5 rounded-xl border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                上一頁
                            </button>
                            <button
                                onClick={() => goToPage(currentPageIndex + 1)}
                                disabled={currentPageIndex >= totalPages - 1}
                                className="px-4 py-1.5 rounded-xl border border-gray-300 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                下一頁
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-400 mt-3">
                提示：可調整上方日期範圍縮小查詢區間，資料量大時建議使用較小的每頁筆數。
            </p>
        </div>
    );
}
