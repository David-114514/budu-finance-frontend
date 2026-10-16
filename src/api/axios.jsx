import axios from 'axios';
import { clearSession, getToken } from '../utils/session';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((request) => {
    const token = getToken();
    if (token) {
        request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        if (error.response?.status === 401 && !url.includes('/login')) {
            clearSession();
            if (!window.location.pathname.startsWith('/login')) {
                window.location.assign('/login?expired=1');
            }
        }
        return Promise.reject(error);
    },
);

export function errorMessage(error, fallback) {
    return error?.response?.data?.message || fallback;
}

export function invalidateFinance(queryClient) {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['monthly'] });
    queryClient.invalidateQueries({ queryKey: ['interest'] });
    queryClient.invalidateQueries({ queryKey: ['mortgage'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
}

export default api;
