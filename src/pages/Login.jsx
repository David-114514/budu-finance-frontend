import { useState } from 'react';
import api from '../api/axios';

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/login', { username, password });
            localStorage.setItem('token', res.data.token);
            alert('✅ 登入成功！');
            onLoginSuccess();
        } catch (err) {
            setError('帳號或密碼錯誤');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white text-5xl font-bold mb-6">B</div>
                    <h1 className="text-3xl font-bold text-gray-900">Bubu 家庭財務</h1>
                    <p className="text-gray-500 mt-2">請登入後使用</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">帳號</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="dudu 或 bubu"
                            className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="123456"
                            className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-2xl text-lg transition-all"
                    >
                        {loading ? '登入中...' : '登入系統'}
                    </button>
                </form>

                <div className="text-center text-xs text-gray-400 mt-8">
                    帳號：<br />
                    dudu（丈夫） / bubu（妻子） / duduP（丈夫父母） / bubuP（妻子父母）<br />
                    密碼：123456
                </div>
            </div>
        </div>
    );
}