import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';

// Log the API URL for debugging
console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout for slow connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration for handling Render cold starts
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor with retry logic for network errors
api.interceptors.request.use(
  async (config: any) => {
    // Initialize retry count if not present
    if (config._retryCount === undefined) {
      config._retryCount = 0;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('Token expired, attempting refresh...');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          console.log('No refresh token found, logging out');
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
          timeout: 30000, // 30 second timeout for refresh
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Save BOTH new tokens
        await AsyncStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }

        console.log('Token refresh successful');
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError.message);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors with retry (Render cold start)
    if (!error.response || error.code === 'ECONNABORTED') {
      const config = error.config;

      if (config._retryCount < MAX_RETRIES) {
        config._retryCount += 1;
        console.log(`Network error - retrying (${config._retryCount}/${MAX_RETRIES})...`);
        await sleep(RETRY_DELAY);
        return api(config);
      }

      console.error('Network error - all retries failed. Server may be down.');
    }

    return Promise.reject(error);
  }
);

export default api;

// API Services
export const authService = {
  register: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
    try {
      console.log('Registering user:', data.email);
      const response = await api.post('/auth/register', data);
      console.log('Registration successful');
      return response;
    } catch (error: any) {
      console.error('Registration error:', error.message, error.response?.data);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      console.log('Logging in user:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('Login successful');
      return response;
    } catch (error: any) {
      console.error('Login error:', error.message, error.response?.data);
      throw error;
    }
  },

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

  create: (data: {
    title: string;
    description: string;
    storeId: string;
    category: string;
    discountPercentage?: number;
    originalPrice?: number;
    salePrice?: number;
    currency?: string;
    images?: string[];
    latitude?: number | string;
    longitude?: number | string;
    startDate?: string;
    endDate?: string;
  }) => api.post('/sales', data),
};

export const storesService = {
  getNearby: (latitude: number, longitude: number, radius: number = 5000) =>
    api.get(`/stores/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`),

  getById: (id: string) => api.get(`/stores/${id}`),

  search: (query?: string, category?: string) =>
    api.get('/stores/search', { params: { q: query, category } }),

  getMyStore: () => api.get('/stores/my-store'),

  getMyStores: () => api.get('/stores/my-stores'),

  create: (data: {
    name: string;
    description?: string;
    category?: string;
    address: string;
    city: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    instagramHandle?: string;
    latitude?: number;
    longitude?: number;
  }) => api.post('/stores', data),

  update: (id: string, data: any) => api.patch(`/stores/${id}`, data),
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
