export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  categories: string[];
  brands: string[];
  minDiscount: number;
  maxDistance: number;
  notificationEnabled: boolean;
  quietHours: { start: string; end: string };
  language: 'he' | 'en';
}

export interface Store {
  id: string;
  name: string;
  description?: string;
  category: string;
  logo?: string;
  coverImage?: string;
  address: string;
  city: string;
  country: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  instagramHandle?: string;
  facebookPage?: string;
  openingHours?: object;
  latitude: number;
  longitude: number;
  distance?: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

export interface Sale {
  id: string;
  title: string;
  description: string;
  category: string;
  discountPercentage?: number;
  originalPrice?: number | string;
  salePrice?: number | string;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending';
  images: string[];
  store?: Store; // Can be null/undefined in some API responses
  storeId: string;
  latitude: number | string; // API returns string
  longitude: number | string; // API returns string
  distance?: number;
  views: number;
  clicks: number;
  shares: number;
  saves: number;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Discover: undefined;
  Search: undefined;
  Saved: undefined;
  Profile: undefined;
};

export type DiscoverStackParamList = {
  DiscoverHome: undefined;
  SaleDetail: { saleId: string };
  StoreDetail: { storeId: string };
};

export type SearchStackParamList = {
  SearchHome: undefined;
  SaleDetail: { saleId: string };
  StoreDetail: { storeId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  Preferences: undefined;
};

export type SavedStackParamList = {
  SavedHome: undefined;
  SaleDetail: { saleId: string };
  StoreDetail: { storeId: string };
};
