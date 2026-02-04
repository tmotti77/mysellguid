import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://qfffuuqldmjtxxihynug.supabase.co/functions/v1';

// Log the API URL for debugging
console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
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

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired) - Supabase tokens last longer, just logout
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Unauthorized - please login again');
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Wake up the server (Supabase Edge Functions are always warm - no cold starts!)
export const warmUpServer = async (): Promise<boolean> => {
  try {
    await axios.get(`${API_URL}/health`, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
};

export default api;

// API Services
export const authService = {
  register: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
    try {
      console.log('Registering user:', data.email);
      const response = await api.post('/auth-register', data);
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
      const response = await api.post('/auth-login', { email, password });
      console.log('Login successful');
      return response;
    } catch (error: any) {
      console.error('Login error:', error.message, error.response?.data);
      throw error;
    }
  },

  logout: () => Promise.resolve(), // Supabase logout is client-side only
};

export const salesService = {
  getNearby: (latitude: number, longitude: number, radius: number = 5000, category?: string) => {
    const params: any = { lat: latitude, lng: longitude, radius };
    if (category) {
      params.category = category;
    }
    return api.get('/sales-nearby', { params });
  },

  getAll: (params?: { category?: string; limit?: number; offset?: number }) =>
    api.get('/sales-nearby', { params }),

  getById: (id: string) => api.get(`/sales-get/${id}`),

  getByStore: (storeId: string) => api.get(`/sales-by-store/${storeId}`),

  search: (query: string, params?: { category?: string; minDiscount?: number }) => {
    const searchParams: any = { query };
    if (params?.category) searchParams.category = params.category;
    if (params?.minDiscount) searchParams.minDiscount = params.minDiscount;
    return api.get('/sales-search', { params: searchParams });
  },

  trackShare: (saleId: string) => Promise.resolve(), // Not implemented yet

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
  }) => api.post('/sales-create', data),

  delete: (id: string) => api.delete(`/sales-delete/${id}`),
};

export const storesService = {
  getNearby: (latitude: number, longitude: number, radius: number = 5000) =>
    api.get(`/stores-nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`),

  getById: (id: string) => api.get(`/stores-get/${id}`),

  search: (query?: string, category?: string) =>
    api.get('/stores-nearby', { params: { category } }), // Use nearby with filters instead

  getMyStore: () => api.get('/stores-my-stores').then(res => res.data[0]), // Return first store

  getMyStores: () => api.get('/stores-my-stores'),

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
  }) => api.post('/stores-create', data),

  update: (id: string, data: any) => api.patch(`/stores-update/${id}`, data),
};

export const userService = {
  getProfile: () => api.get('/auth-update-profile'),
  updateProfile: (data: any) => api.patch('/auth-update-profile', data),
  updatePreferences: (_preferences: any) => Promise.resolve(), // Stored locally
  updateLocation: (_latitude: number, _longitude: number) => Promise.resolve(), // Stored locally
  updateFcmToken: (_fcmToken: string) => Promise.resolve(), // Not yet wired to push service
};

export const bookmarksService = {
  getAll: (latitude?: number, longitude?: number) => {
    return api.get('/bookmarks-list');
  },

  add: (saleId: string) => api.post(`/bookmarks-add/${saleId}`),

  remove: (saleId: string) => api.delete(`/bookmarks-remove/${saleId}`),

  check: (saleId: string) =>
    api.get('/bookmarks-list').then(res => ({
      data: { isBookmarked: res.data.some((b: any) => b.saleId === saleId) }
    })),
};

// AI/ML Service for sale extraction via ml-analyze edge function
export const mlService = {
  analyzeImage: (imageUrl: string): Promise<any> =>
    api.post('/ml-analyze', { action: 'image', imageUrl }),
  extractFromUrl: (url: string): Promise<any> =>
    api.post('/ml-analyze', { action: 'url', url }),
  analyzeScreenshot: (base64Data: string, mimeType: string = 'image/jpeg'): Promise<any> =>
    api.post('/ml-analyze', { action: 'screenshot', base64Data, mimeType }),
};

// Discovery engine service
export const discoveryService = {
  getStats: (): Promise<any> => api.get('/discovery?action=stats'),
  runDiscovery: (): Promise<any> => api.post('/discovery?action=run'),
};
