import { create } from 'zustand';
import api from '@/lib/api';

const useAuthStore = create((set) => ({
    user: null,
    isLoading: false,
    error: null,

    register: async (email, password) => {
        set({ isLoading: true, error: null });
        try{
            const res = await api.post('/auth/register', { email, password });
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            set({ user: { email }, isLoading: false });
            return true;
        } catch (err) {
            set({ error: err.response?.data?.message || 'Registration failed', isLoading: false });
            return false;

        }

    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('refreshToken', res.data.refreshToken);
            set({ user: { email }, isLoading: false });
            return true;
        } catch (err) {
            set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
            return false;
        }
    },

    logout: async () => {
        try{
            await api.post('/api/auth/logut');
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({ user: null });
            window.location.href = '/login';
        }
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;