import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

// Add a response interceptor to handle token refresh (simplified for web)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
                    headers: { Authorization: `Bearer ${refreshToken}` }
                });
                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
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
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    register: (data: RegisterData) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/users/me'),
};

export const storesService = {
    getMyStore: () => api.get('/stores/my-store'),
    create: (data: StoreData) => api.post('/stores', data),
    update: (id: string, data: Partial<StoreData>) => api.patch(`/stores/${id}`, data),
};

export const salesService = {
    getByStore: (storeId: string, limit?: number) => api.get(`/sales/store/${storeId}`, { params: { limit } }),
    getById: (id: string) => api.get(`/sales/${id}`),
    create: (data: SaleData) => api.post('/sales', data),
    update: (id: string, data: Partial<SaleData>) => api.patch(`/sales/${id}`, data),
    delete: (id: string) => api.delete(`/sales/${id}`),
    getStatistics: (storeId?: string) => api.get('/sales/statistics', { params: { storeId } }),
};

export const uploadService = {
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post('/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export default api;
