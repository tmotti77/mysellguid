'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { salesService, storesService, uploadService } from '@/services/api';
import { Loader2, Upload, X, Calendar } from 'lucide-react';

interface StoreData {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

export default function NewSalePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [store, setStore] = useState<StoreData | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'clothing',
        discountPercentage: '',
        originalPrice: '',
        salePrice: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        images: [] as string[],
    });

    const categories = [
        { value: 'clothing', label: 'Clothing' },
        { value: 'fashion', label: 'Fashion' },
        { value: 'shoes', label: 'Shoes' },
        { value: 'accessories', label: 'Accessories' },
        { value: 'electronics', label: 'Electronics' },
        { value: 'home', label: 'Home' },
        { value: 'home_goods', label: 'Home Goods' },
        { value: 'furniture', label: 'Furniture' },
        { value: 'beauty', label: 'Beauty' },
        { value: 'sports', label: 'Sports' },
        { value: 'food', label: 'Food' },
        { value: 'other', label: 'Other' },
    ];

    useEffect(() => {
        fetchStore();
    }, []);

    const fetchStore = async () => {
        try {
            const res = await storesService.getMyStore();
            setStore(res.data);
        } catch (error) {
            console.error('Error fetching store:', error);
            alert('Failed to load store information');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);
        try {
            const uploadPromises = Array.from(files).map(file => uploadService.uploadImage(file));
            const results = await Promise.all(uploadPromises);
            const imageUrls = results.map(res => res.data.url);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...imageUrls] }));
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images');
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!store) {
            alert('Store information not loaded');
            return;
        }

        if (!formData.title || !formData.description) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await salesService.create({
                ...formData,
                storeId: store.id,
                latitude: store.latitude,
                longitude: store.longitude,
                discountPercentage: parseInt(formData.discountPercentage) || 0,
                originalPrice: parseFloat(formData.originalPrice) || 0,
                salePrice: parseFloat(formData.salePrice) || 0,
                currency: 'ILS',
                source: 'store_dashboard',
                status: 'active',
            });

            alert('Sale created successfully!');
            router.push('/dashboard/sales');
        } catch (error: any) {
            console.error('Error creating sale:', error);
            alert(error.response?.data?.message || 'Failed to create sale');
        } finally {
            setLoading(false);
        }
    };

    if (!store) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Create New Sale
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Post a new sale for {store.name}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div className="px-4 py-6 sm:p-8">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                        {/* Title */}
                        <div className="sm:col-span-6">
                            <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                                Sale Title *
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g. 50% OFF Everything - End of Season Sale!"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-6">
                            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                                Description *
                            </label>
                            <div className="mt-2">
                                <textarea
                                    name="description"
                                    id="description"
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="Describe the sale, what items are included, any special terms..."
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="sm:col-span-3">
                            <label htmlFor="category" className="block text-sm font-medium leading-6 text-gray-900">
                                Category *
                            </label>
                            <div className="mt-2">
                                <select
                                    name="category"
                                    id="category"
                                    required
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Discount Percentage */}
                        <div className="sm:col-span-3">
                            <label htmlFor="discountPercentage" className="block text-sm font-medium leading-6 text-gray-900">
                                Discount % *
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    name="discountPercentage"
                                    id="discountPercentage"
                                    required
                                    min="0"
                                    max="100"
                                    value={formData.discountPercentage}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="e.g. 50"
                                />
                            </div>
                        </div>

                        {/* Original Price */}
                        <div className="sm:col-span-2">
                            <label htmlFor="originalPrice" className="block text-sm font-medium leading-6 text-gray-900">
                                Original Price (₪)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    name="originalPrice"
                                    id="originalPrice"
                                    min="0"
                                    step="0.01"
                                    value={formData.originalPrice}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="299.99"
                                />
                            </div>
                        </div>

                        {/* Sale Price */}
                        <div className="sm:col-span-2">
                            <label htmlFor="salePrice" className="block text-sm font-medium leading-6 text-gray-900">
                                Sale Price (₪)
                            </label>
                            <div className="mt-2">
                                <input
                                    type="number"
                                    name="salePrice"
                                    id="salePrice"
                                    min="0"
                                    step="0.01"
                                    value={formData.salePrice}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    placeholder="149.99"
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="sm:col-span-3">
                            <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900">
                                Start Date *
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="startDate"
                                    id="startDate"
                                    required
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="endDate" className="block text-sm font-medium leading-6 text-gray-900">
                                End Date *
                            </label>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    name="endDate"
                                    id="endDate"
                                    required
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        {/* Images */}
                        <div className="sm:col-span-6">
                            <label className="block text-sm font-medium leading-6 text-gray-900">
                                Sale Images
                            </label>
                            <div className="mt-2">
                                <div className="flex items-center gap-4">
                                    <label className="relative cursor-pointer rounded-md bg-white px-4 py-2 text-sm font-semibold text-indigo-600 border border-indigo-600 hover:bg-indigo-50">
                                        <span>{uploadingImage ? 'Uploading...' : 'Upload Images'}</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploadingImage}
                                            className="sr-only"
                                        />
                                    </label>
                                    {uploadingImage && <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />}
                                </div>
                                {formData.images.length > 0 && (
                                    <div className="mt-4 grid grid-cols-3 gap-4">
                                        {formData.images.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={url}
                                                    alt={`Sale image ${index + 1}`}
                                                    className="h-24 w-full object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-sm font-semibold leading-6 text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Creating...
                            </span>
                        ) : (
                            'Create Sale'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
