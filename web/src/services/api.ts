import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qfffuuqldmjtxxihynug.supabase.co/functions/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 — clear session and redirect to login
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

interface RegisterData {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
}

interface StoreData {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    phoneNumber?: string;
    latitude?: number;
    longitude?: number;
    logo?: string;
}

interface SaleData {
    title: string;
    description?: string;
    category?: string;
    discountPercentage?: number;
    originalPrice?: number;
    salePrice?: number;
    startDate?: string;
    endDate?: string;
    images?: string[];
    storeId?: string;
    latitude?: number;
    longitude?: number;
    currency?: string;
    source?: string;
    status?: string;
}

export const authService = {
    login: (email: string, password: string) => api.post('/auth-login', { email, password }),
    register: (data: RegisterData) => api.post('/auth-register', data),
    logout: () => Promise.resolve(), // Supabase logout is client-side only
};

export const storesService = {
    getMyStores: () => api.get('/stores-my-stores'),
    getMyStore: () => api.get('/stores-my-stores').then(res => ({ data: res.data[0] || null })),
    getById: (id: string) => api.get(`/stores-get/${id}`),
    create: (data: StoreData) => api.post('/stores-create', data),
    update: (id: string, data: Partial<StoreData>) => api.patch(`/stores-update/${id}`, data),
};

export const salesService = {
    getByStore: (storeId: string, limit?: number) => api.get(`/sales-by-store/${storeId}`, { params: { limit } }),
    getById: (id: string) => api.get(`/sales-get/${id}`),
    create: (data: SaleData) => api.post('/sales-create', data),
    update: (id: string, data: Partial<SaleData>) => api.patch(`/sales-update/${id}`, data),
    delete: (id: string) => api.delete(`/sales-delete/${id}`),
};

export default api;
