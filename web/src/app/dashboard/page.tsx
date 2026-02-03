'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, Users, TrendingUp, Star, Loader2, Eye, MousePointer } from 'lucide-react';
import { salesService, storesService } from '@/services/api';
import { Sale } from '@/types';

export default function DashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeSales: 0,
        totalViews: 0,
        ctr: 0,
        rating: 0,
    });
    const [recentSales, setRecentSales] = useState<Sale[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const storeRes = await storesService.getMyStore();
                if (storeRes?.data) {
                    const salesData = await salesService.getByStore(storeRes.data.id);
                    const allSales: Sale[] = salesData.data || [];

                    const activeSales = allSales.filter(s => s.status === 'active').length;
                    const totalViews = allSales.reduce((sum, s) => sum + (s.views || 0), 0);
                    const totalClicks = allSales.reduce((sum, s) => sum + (s.clicks || 0), 0);

                    setStats({
                        activeSales,
                        totalViews,
                        ctr: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
                        rating: 5.0,
                    });
                    setRecentSales(allSales.slice(0, 5));
                }
            } catch {
                // User doesn't have a store yet - this is normal for new users
                console.log('No store found for user');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statItems = [
        { name: 'Active Sales', value: stats.activeSales.toString(), icon: ShoppingBag, color: 'bg-blue-500' },
        { name: 'Total Views', value: stats.totalViews.toString(), icon: Users, color: 'bg-green-500' },
        { name: 'Conversion Rate', value: `${stats.ctr.toFixed(1)}%`, icon: TrendingUp, color: 'bg-purple-500' },
        { name: 'Store Rating', value: stats.rating.toFixed(1), icon: Star, color: 'bg-yellow-500' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
                <p className="text-gray-500">Here&apos;s what&apos;s happening with your store today.</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className={`rounded-md p-3 ${item.color}`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                            <dd className="text-lg font-medium text-gray-900">{item.value}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h2>
                <div className="flow-root">
                    <ul className="-my-5 divide-y divide-gray-200">
                        {recentSales.length > 0 ? (
                            recentSales.map((sale) => (
                                <li key={sale.id} className="py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {sale.images && sale.images[0] ? (
                                                <img className="h-10 w-10 rounded-full object-cover" src={sale.images[0]} alt="" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <ShoppingBag className="h-6 w-6 text-indigo-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {sale.title}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {sale.discountPercentage}% OFF &bull; {new Date(sale.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Eye className="h-4 w-4 mr-1" />
                                                {sale.views}
                                            </div>
                                            <div className="flex items-center">
                                                <MousePointer className="h-4 w-4 mr-1" />
                                                {sale.clicks}
                                            </div>
                                            <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {sale.status}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="py-4 text-center text-gray-500">
                                No sales yet. Create your first sale to see activity!
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
