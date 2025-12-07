export interface Store {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    coverImage?: string;
    address?: string;
    latitude: number;
    longitude: number;
    phone?: string;
    website?: string;
    rating?: number | null;
    reviewCount?: number;
    createdAt?: string;
}

export interface Sale {
    id: string;
    title: string;
    description: string;
    discountPercentage: number;
    originalPrice?: number;
    salePrice?: number;
    category?: string;
    images?: string[] | null;
    startDate?: string | null;
    endDate?: string | null;
    status: 'active' | 'expired' | 'scheduled';
    views: number;
    clicks: number;
    shares?: number;
    saves?: number;
    createdAt: string;
    storeId: string;
    store?: Store;
    distance?: number;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'user' | 'store_owner' | 'admin';
    avatar?: string;
    createdAt?: string;
}
