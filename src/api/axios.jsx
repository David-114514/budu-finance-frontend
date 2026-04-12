import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 請求攔截器 - 方便除錯
api.interceptors.request.use(request => {
    console.log('🚀 請求發送:', request.method.toUpperCase(), request.url);
    return request;
});

api.interceptors.response.use(
    response => response,
    error => {
        console.error('❌ API 錯誤:', error.message);
        if (error.response) {
            console.error('狀態碼:', error.response.status);
            console.error('回應資料:', error.response.data);
        } else if (error.request) {
            console.error('後端沒有回應，請確認後端是否運行在 http://localhost:8080');
        }
        return Promise.reject(error);
    }
);

export default api;