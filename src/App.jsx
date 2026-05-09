import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import NewTransaction from './pages/NewTransaction';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import LanguageSwitcher from './components/LanguageSwitcher';

const queryClient = new QueryClient();

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (localStorage.getItem('token')) {
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentPage('login');
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">B</div>
                <h1 className="text-2xl font-bold text-gray-900">Bubu 家庭財務</h1>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
                  <button onClick={() => setCurrentPage('dashboard')} className={`px-5 py-2.5 rounded-xl font-medium ${currentPage === 'dashboard' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-white'}`}>總覽</button>
                  <button onClick={() => setCurrentPage('newTransaction')} className={`px-5 py-2.5 rounded-xl font-medium ${currentPage === 'newTransaction' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-white'}`}>新增交易</button>
                  <button onClick={() => setCurrentPage('transactions')} className={`px-5 py-2.5 rounded-xl font-medium ${currentPage === 'transactions' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-white'}`}>流水記錄</button>
                </div>
                <LanguageSwitcher />
                <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600">登出</button>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-6 py-8">
            {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
            {currentPage === 'newTransaction' && <NewTransaction />}
            {currentPage === 'transactions' && <Transactions />}
          </main>
        </div>
      </QueryClientProvider>
  );
}

export default App;