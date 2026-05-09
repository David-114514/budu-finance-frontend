import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 請求攔截器：自動帶 token
api.interceptors.request.use(request => {
    const token = localStorage.getItem('token');
    if (token) {
        request.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🚀 請求發送:', request.method.toUpperCase(), request.url);
    return request;
});

api.interceptors.response.use(
    response => response,
    error => {
        console.error('❌ API 錯誤:', error.message);
        if (error.response?.status === 401) {
            alert('登入已過期，請重新登入');
            localStorage.removeItem('token');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default api;