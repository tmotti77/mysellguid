export interface Sale {
    id: string;
    title: string;
    description: string;
    discountPercentage: number;
    originalPrice?: number;
    salePrice?: number;
    images: string[];
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'scheduled';
    views: number;
    clicks: number;
    createdAt: string;
    storeId: string;
}
