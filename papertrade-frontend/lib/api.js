import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const getUserId = () => {
    const token = getToken();
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.sub;
};

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const res = await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
                    {},
                    { headers: { Authorization: `Bearer ${refreshToken}` } }
                );
                localStorage.setItem('accessToken', res.data.accessToken);
                original.headers.Authorization = `Bearer ${res.data.accessToken}`;
                return api(original);
            } catch {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
};
export default api;