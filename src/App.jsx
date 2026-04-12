import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import NewTransaction from './pages/NewTransaction';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-50">
          {/* 頂部導航 */}
          <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                  B
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Bubu 家庭財務</h1>
              </div>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
                <button
                    onClick={() => setCurrentPage('dashboard')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${currentPage === 'dashboard' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-white'}`}
                >
                  總覽
                </button>
                <button
                    onClick={() => setCurrentPage('newTransaction')}
                    className={`px-6 py-2.5 rounded-xl font-medium transition-all ${currentPage === 'newTransaction' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-white'}`}
                >
                  新增交易
                </button>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-6 py-8">
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'newTransaction' && <NewTransaction />}
          </main>
        </div>
      </QueryClientProvider>
  );
}

export default App;