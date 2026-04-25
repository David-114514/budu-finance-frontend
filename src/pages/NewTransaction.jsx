import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

export default function NewTransaction() {
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        fromAccountId: '',
        toAccountId: '2',           // 預設 Offset Account
        categoryId: '2',            // 預設「轉入抵銷戶口」
        userId: '1',                // 預設丈夫
        contributorId: '',
        description: '',
        mortgageInterestSaved: '0'
    });

    // 獲取下拉選單資料
    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => (await api.get('/accounts')).data,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/categories')).data,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => (await api.get('/users')).data,
    });

    // 提交交易
    const mutation = useMutation({
        mutationFn: (transactionData) => api.post('/transactions', transactionData),
        onSuccess: () => {
            alert('✅ 交易記錄新增成功！');
            // 清空表單
            setForm({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                fromAccountId: '',
                toAccountId: '2',
                categoryId: '2',
                userId: '1',
                contributorId: '',
                description: '',
                mortgageInterestSaved: '0'
            });
            // 刷新 Dashboard
            queryClient.invalidateQueries(['dashboard']);
        },
        onError: (error) => {
            const msg = error.response?.data?.message || error.message || '未知錯誤';
            alert(`❌ 新增失敗：${msg}`);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.amount || parseFloat(form.amount) === 0) {
            alert('請輸入金額（正數為收入，負數為支出）');
            return;
        }
        if (!form.categoryId || !form.userId) {
            alert('請選擇類別和操作人');
            return;
        }

        mutation.mutate(form);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">新增交易記錄</h2>
                <p className="text-gray-600 mb-8">記錄薪資轉入、父母存款、家用開支等</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 日期 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1"
                        />
                    </div>

                    {/* 金額 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">金額 (HKD)</label>
                        <input
                            type="number"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            placeholder="正數=收入，負數=支出（例：-2000）"
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1"
                        />
                    </div>

                    {/* 操作人 + 類別 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">操作人</label>
                            <select
                                value={form.userId}
                                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                            >
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">交易類別</label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 描述 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">描述 / 備註</label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="例如：2026年4月薪水轉入抵銷戶口"
                            className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* 提交按鈕 */}
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl text-lg transition-all mt-4"
                    >
                        {mutation.isPending ? '提交中...' : '✅ 確認新增這筆交易'}
                    </button>
                </form>
            </div>
        </div>
    );
}