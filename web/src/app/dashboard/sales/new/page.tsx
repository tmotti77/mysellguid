'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { salesService, storesService, uploadService } from '@/services/api';
import { Loader2, Save, ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';

export default function NewSalePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        originalPrice: '',
        salePrice: '',
        discountPercentage: '',
        imageUrl: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
    });

    React.useEffect(() => {
        const fetchStore = async () => {
            try {
                const response = await storesService.getMyStore();
                if (response.data) {
                    setStoreId(response.data.id);
                } else {
                    alert('You need to create a store first!');
                    router.push('/dashboard/store');
                }
            } catch (error) {
                console.error('Error fetching store:', error);
            }
        };
        fetchStore();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Create preview immediately
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            // Upload to server
            const response = await uploadService.uploadImage(file);
            // Assuming response.data returns { original: 'url', ... } or similar based on backend
            // Backend returns { original, large, medium, thumbnail }
            setFormData(prev => ({ ...prev, imageUrl: response.data.medium }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
            setPreviewUrl(null);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, imageUrl: '' }));
        setPreviewUrl(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId) {
            alert('Store not found. Please create a store first.');
            return;
        }
        setLoading(true);

        try {
            await salesService.create({
                ...formData,
                storeId,
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
                salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
                discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : undefined,
                images: formData.imageUrl ? [formData.imageUrl] : [],
            });
            router.push('/dashboard/sales');
        } catch (error) {
            console.error('Error creating sale:', error);
            alert('Failed to create sale');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <Link href="/dashboard/sales" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Sales
                </Link>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Create New Sale
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 bg-white shadow rounded-lg p-8">
                <div className="space-y-8 divide-y divide-gray-200">
                    <div>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                    Sale Title
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="title"
                                        id="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                    Category
                                </label>
                                <div className="mt-1">
                                    <select
                                        id="category"
                                        name="category"
                                        required
                                        value={formData.category}
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
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        required
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700">
                                    Original Price (₪)
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="number"
                                        name="originalPrice"
                                        id="originalPrice"
                                        value={formData.originalPrice}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700">
                                    Sale Price (₪)
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="number"
                                        name="salePrice"
                                        id="salePrice"
                                        value={formData.salePrice}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700">
                                    Discount %
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="number"
                                        name="discountPercentage"
                                        id="discountPercentage"
                                        value={formData.discountPercentage}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sale Image
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative">
                                    {previewUrl ? (
                                        <div className="relative">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="max-h-64 rounded-md"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1 text-center">
                                            {uploading ? (
                                                <div className="flex flex-col items-center">
                                                    <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
                                                    <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                    <div className="flex text-sm text-gray-600">
                                                        <label
                                                            htmlFor="file-upload"
                                                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                                        >
                                                            <span>Upload a file</span>
                                                            <input
                                                                id="file-upload"
                                                                name="file-upload"
                                                                type="file"
                                                                className="sr-only"
                                                                accept="image/*"
                                                                onChange={handleImageChange}
                                                            />
                                                        </label>
                                                        <p className="pl-1">or drag and drop</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                                    Start Date
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="date"
                                        name="startDate"
                                        id="startDate"
                                        required
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                                    End Date
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="date"
                                        name="endDate"
                                        id="endDate"
                                        required
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-5">
                    <div className="flex justify-end">
                        <Link
                            href="/dashboard/sales"
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <Save className="h-5 w-5 mr-2" />
                            )}
                            Create Sale
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
