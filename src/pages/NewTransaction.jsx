import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

export default function NewTransaction() {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        fromAccountId: '',
        toAccountId: '2',
        categoryId: '1',  // 預設：轉入按揭戶口
        userId: '1',
        description: '',
        mortgageInterestSaved: '0'
    });

    const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: async () => (await api.get('/accounts')).data });
    const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories')).data });
    const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data });

    // 根據類別自動處理金額正負號
    const handleAmountChange = (e) => {
        let value = e.target.value;
        const selectedCategory = categories.find(c => c.id == form.categoryId);

        if (selectedCategory) {
            const isIncome = selectedCategory.name.includes('轉入') || selectedCategory.name.includes('Transfer');
            if (isIncome && value.startsWith('-')) {
                value = value.substring(1); // 移除負號
            } else if (!isIncome && value && !value.startsWith('-')) {
                value = '-' + value; // 自動加負號
            }
        }
        setForm({ ...form, amount: value });
    };

    const mutation = useMutation({
        mutationFn: (transactionData) => api.post('/transactions', transactionData),
        onSuccess: () => {
            alert(t('transaction.success'));
            setForm({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                fromAccountId: '',
                toAccountId: '2',
                categoryId: '1',
                userId: '1',
                description: '',
                mortgageInterestSaved: '0'
            });
            queryClient.invalidateQueries(['dashboard']);
        },
        onError: (error) => {
            const msg = error.response?.data?.message || error.message || t('common.unknownError');
            alert(`${t('transaction.failed')}: ${msg}`);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) === 0) {
            alert(t('transaction.amountRequired'));
            return;
        }
        mutation.mutate(form);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('transaction.title')}</h2>
                <p className="text-gray-600 mb-8">{t('transaction.subtitle')}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 日期 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('transaction.date')}</label>
                        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1" />
                    </div>

                    {/* 金額（智能正負號） */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('transaction.amount')}</label>
                        <input
                            type="number"
                            value={form.amount}
                            onChange={handleAmountChange}
                            placeholder={t('transaction.amountPlaceholder')}
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1"
                        />
                        <p className="text-xs text-gray-400 mt-1">選擇類別後金額會自動變正或負</p>
                    </div>

                    {/* 貢獻者 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('transaction.operator')}</label>
                        <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500">
                            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                    </div>

                    {/* 類別（只剩 2 個） */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('transaction.category')}</label>
                        <select
                            value={form.categoryId}
                            onChange={(e) => {
                                const newCategoryId = e.target.value;
                                setForm({ ...form, categoryId: newCategoryId });

                                // 切換類別時自動調整金額正負號
                                if (form.amount) {
                                    const selectedCat = categories.find(c => c.id == newCategoryId);
                                    let newAmount = form.amount;
                                    if (selectedCat) {
                                        const isIncome = selectedCat.name.includes('轉入') || selectedCat.name.includes('Transfer');
                                        if (isIncome && newAmount.startsWith('-')) newAmount = newAmount.substring(1);
                                        else if (!isIncome && newAmount && !newAmount.startsWith('-')) newAmount = '-' + newAmount;
                                    }
                                    setForm(prev => ({ ...prev, categoryId: newCategoryId, amount: newAmount }));
                                }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                        >
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                        </select>
                    </div>

                    {/* 描述 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('transaction.description')}</label>
                        <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('transaction.descriptionPlaceholder')} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500" />
                    </div>

                    {/* 提交按鈕 */}
                    <button type="submit" disabled={mutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl text-lg transition-all mt-4">
                        {mutation.isPending ? t('common.submitting') : t('transaction.submit')}
                    </button>
                </form>
            </div>
        </div>
    );
}