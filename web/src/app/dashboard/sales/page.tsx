'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { salesService, storesService } from '@/services/api';
import { Plus, Edit, Trash2, Loader2, Calendar, Tag } from 'lucide-react';

export default function SalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState<string | null>(null);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            // First get my store to get the ID
            const storeRes = await storesService.getMyStore();
            const store = storeRes.data;
            setStoreId(store.id);

            if (store.id) {
                const salesRes = await salesService.getByStore(store.id);
                setSales(salesRes.data);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this sale?')) {
            try {
                await salesService.delete(id);
                setSales(sales.filter(sale => sale.id !== id));
            } catch (error) {
                console.error('Error deleting sale:', error);
                alert('Failed to delete sale');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!storeId) {
        return (
            <div className="text-center py-12">
                <h3 className="mt-2 text-sm font-medium text-gray-900">No store profile found</h3>
                <p className="mt-1 text-sm text-gray-500">You need to create a store profile before posting sales.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/store"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Create Store Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Sales Management
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link
                        href="/dashboard/sales/new"
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Create New Sale
                    </Link>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {sales.length === 0 ? (
                        <li className="px-4 py-12 text-center">
                            <p className="text-gray-500">No sales found. Create your first sale!</p>
                        </li>
                    ) : (
                        sales.map((sale) => (
                            <li key={sale.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <Tag className="h-6 w-6 text-indigo-600" />
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-indigo-600 truncate">{sale.title}</p>
                                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                                    {sale.discountPercentage && (
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full mr-2">
                                                            {sale.discountPercentage}% OFF
                                                        </span>
                                                    )}
                                                    <span>{sale.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {sale.salePrice ? `₪${sale.salePrice}` : 'Free'}
                                                </p>
                                                {sale.originalPrice && (
                                                    <p className="text-xs text-gray-500 line-through">₪{sale.originalPrice}</p>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={`/dashboard/sales/${sale.id}`}
                                                    className="p-2 text-gray-400 hover:text-indigo-600"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(sale.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                                                Ends: {new Date(sale.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
