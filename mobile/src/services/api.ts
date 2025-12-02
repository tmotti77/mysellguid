import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });

        const { accessToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API Services
export const authService = {
  register: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  logout: () => api.post('/auth/logout'),
};

export const salesService = {
  getNearby: (latitude: number, longitude: number, radius: number = 5000, category?: string) => {
    const params: any = { lat: latitude, lng: longitude, radius };
    if (category) {
      params.category = category;
    }
    return api.get('/sales/nearby', { params });
  },

  getAll: (params?: { category?: string; limit?: number; offset?: number }) =>
    api.get('/sales', { params }),

  getById: (id: string) => api.get(`/sales/${id}`),

  getByStore: (storeId: string) => api.get(`/sales/store/${storeId}`),

  search: (query: string, params?: { category?: string; minDiscount?: number }) =>
    api.get(`/sales/search?q=${query}`, { params }),

  trackShare: (saleId: string) => api.post(`/sales/${saleId}/share`),
};

export const storesService = {
  getNearby: (latitude: number, longitude: number, radius: number = 5000) =>
    api.get(`/stores/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`),

  getById: (id: string) => api.get(`/stores/${id}`),

  search: (query?: string, category?: string) =>
    api.get('/stores/search', { params: { q: query, category } }),
};

export const userService = {
  getProfile: () => api.get('/users/me'),

  updateProfile: (data: any) => api.patch('/users/me', data),

  updatePreferences: (preferences: any) => api.patch('/users/me/preferences', preferences),

  updateLocation: (latitude: number, longitude: number) =>
    api.patch('/users/me/location', { latitude, longitude }),

  updateFcmToken: (fcmToken: string) =>
    api.patch('/users/me/fcm-token', { fcmToken }),
};

export const bookmarksService = {
  getAll: (latitude?: number, longitude?: number) => {
    const params = latitude && longitude ? { lat: latitude, lng: longitude } : {};
    return api.get('/bookmarks', { params });
  },

  add: (saleId: string) => api.post(`/bookmarks/${saleId}`),

  remove: (saleId: string) => api.delete(`/bookmarks/${saleId}`),

  check: (saleId: string) => api.get(`/bookmarks/check/${saleId}`),
};
