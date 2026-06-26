import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import { isExpenseCategory, sanitizePositiveAmount, toSignedAmount } from '../utils/transactionHelper';

export default function NewTransaction() {
    const { t, i18n } = useTranslation();
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        categoryId: '',
        userId: '1',
        description: '',
        mortgageInterestSaved: '0'
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/categories')).data,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => (await api.get('/users')).data,
    });

    if (categories.length > 0 && !form.categoryId) {
        setForm(prev => ({ ...prev, categoryId: categories[0].id }));
    }

    const selectedCategory = categories.find(c => c.id == form.categoryId);
    const isExpense = isExpenseCategory(selectedCategory);

    const handleAmountChange = (e) => {
        setForm({ ...form, amount: sanitizePositiveAmount(e.target.value) });
    };

    const handleCategoryChange = (categoryId) => {
        setForm(prev => ({ ...prev, categoryId }));
    };

    const mutation = useMutation({
        mutationFn: (transactionData) => api.post('/transactions', transactionData),
        onSuccess: () => {
            alert(t('transaction.success'));
            setForm({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                categoryId: categories[0]?.id || '',
                userId: '1',
                description: '',
                mortgageInterestSaved: '0'
            });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['monthlyTransfer'] });
            queryClient.invalidateQueries({ queryKey: ['monthlyExpense'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
        const payload = {
            date: form.date,
            amount: toSignedAmount(form.amount, selectedCategory),
            categoryId: form.categoryId,
            description: form.description,
            mortgageInterestSaved: form.mortgageInterestSaved,
        };
        if (!isExpense) {
            payload.userId = form.userId;
        }
        mutation.mutate(payload);
    };

    const getCategoryName = (categoryName, language) => {
        const categoryMap = {
            '轉入按揭戶口': { 'en': 'Transfer to Mortgage Account', 'zh-CN': '轉入按揭戶口' },
            '按揭戶口支出': { 'en': 'Mortgage Account Expense', 'zh-CN': '按揭戶口支出' },
        };
        return categoryMap[categoryName]?.[language] || categoryName;
    };

    const amountColorClass = isExpense
        ? 'border-red-200 focus:border-red-400 focus:ring-red-100 text-red-700'
        : 'border-green-200 focus:border-green-400 focus:ring-green-100 text-green-700';

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('transaction.title')}</h2>
                <p className="text-gray-600 mb-8">{t('transaction.subtitle')}</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('transaction.date')}</label>
                        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('transaction.category')}</label>
                        <select
                            value={form.categoryId}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {getCategoryName(cat.name, i18n.language)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('transaction.amount')}</label>
                        <div className="relative">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold ${isExpense ? 'text-red-500' : 'text-green-600'}`}>
                                {isExpense ? '−' : '+'}
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.amount}
                                onChange={handleAmountChange}
                                placeholder={t('transaction.amountPlaceholder')}
                                className={`w-full pl-10 pr-4 py-3 border rounded-2xl focus:outline-none focus:ring-1 ${amountColorClass}`}
                            />
                        </div>
                        <p className={`text-xs mt-1 ${isExpense ? 'text-red-400' : 'text-green-600'}`}>
                            {isExpense ? t('transaction.amountExpenseHint') : t('transaction.amountIncomeHint')}
                        </p>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1 ${isExpense ? 'text-gray-400' : 'text-gray-700'}`}>
                            {t('transaction.operator')}
                        </label>
                        <select
                            value={form.userId}
                            onChange={(e) => setForm({ ...form, userId: e.target.value })}
                            disabled={isExpense}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 ${isExpense ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                        >
                            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                        {isExpense && (
                            <p className="text-xs text-gray-400 mt-1">{t('transaction.operatorNotRequired')}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('transaction.description')}</label>
                        <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('transaction.descriptionPlaceholder')} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500" />
                    </div>

                    <button type="submit" disabled={mutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl text-lg transition-all mt-4">
                        {mutation.isPending ? t('common.submitting') : t('transaction.submit')}
                    </button>
                </form>
            </div>
        </div>
    );
}