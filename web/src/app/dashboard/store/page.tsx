'use client';

import React, { useState, useEffect } from 'react';
import { storesService } from '@/services/api';
import { Loader2, Save, MapPin, Phone, Upload, X } from 'lucide-react';

interface StoreFormData {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    address?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    logo?: string;
}

export default function StoreProfilePage() {
    const [store, setStore] = useState<StoreFormData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        try {
            const response = await storesService.getMyStore();
            setStore(response.data);
        } catch {
            // Error handled silently - store may not exist yet
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!store) return;
        
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            if (store.id) {
                await storesService.update(store.id, store);
            } else {
                await storesService.create(store);
            }
            setMessage({ type: 'success', text: 'Store profile updated successfully!' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to update store profile.' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!store) return;
        setStore({ ...store, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setStore((prev) => prev ? { ...prev, logo: reader.result as string } : null);
        };
        reader.readAsDataURL(file);
    };

    const removeLogo = () => {
        setStore((prev) => prev ? { ...prev, logo: '' } : null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Store Profile
                    </h2>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 bg-white shadow rounded-lg p-8">
                <div className="space-y-8 divide-y divide-gray-200">
                    <div>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Store Logo
                                </label>
                                <div className="mt-1 flex items-center">
                                    {store?.logo ? (
                                        <div className="relative">
                                            <img
                                                src={store.logo}
                                                alt="Store Logo"
                                                className="h-32 w-32 rounded-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeLogo}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-32 w-32 rounded-full border-2 border-gray-300 border-dashed">
                                            <label
                                                htmlFor="logo-upload"
                                                className="cursor-pointer flex flex-col items-center justify-center h-full w-full rounded-full hover:bg-gray-50"
                                            >
                                                <Upload className="h-8 w-8 text-gray-400" />
                                                <span className="mt-1 text-xs text-gray-500">Upload</span>
                                                <input
                                                    id="logo-upload"
                                                    name="logo-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    onChange={handleLogoChange}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="sm:col-span-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Store Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={store?.name || ''}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        value={store?.description || ''}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">Write a few sentences about your store.</p>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                    Category
                                </label>
                                <div className="mt-1">
                                    <select
                                        id="category"
                                        name="category"
                                        value={store?.category || ''}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    >
                                        <option value="">Select a category</option>
                                        <option value="fashion">Fashion</option>
                                        <option value="clothing">Clothing</option>
                                        <option value="shoes">Shoes</option>
                                        <option value="accessories">Accessories</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="home">Home & Living</option>
                                        <option value="furniture">Furniture</option>
                                        <option value="beauty">Beauty</option>
                                        <option value="sports">Sports</option>
                                        <option value="books">Books</option>
                                        <option value="toys">Toys</option>
                                        <option value="food">Food & Drink</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 mt-6 mb-4">Location & Contact</h3>
                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                    <div className="sm:col-span-6">
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                            Street Address
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MapPin className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="address"
                                                id="address"
                                                value={store?.address || ''}
                                                onChange={handleChange}
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                            City
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="city"
                                                id="city"
                                                value={store?.city || ''}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                                            Country
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                type="text"
                                                name="country"
                                                id="country"
                                                value={store?.country || ''}
                                                onChange={handleChange}
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                                            Phone Number
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                id="phoneNumber"
                                                value={store?.phoneNumber || ''}
                                                onChange={handleChange}
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-5">
                    {message.text && (
                        <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                        >
                            {saving ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <Save className="h-5 w-5 mr-2" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
