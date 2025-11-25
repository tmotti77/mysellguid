'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { salesService } from '@/services/api';
import { Loader2, Save, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function EditSalePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        originalPrice: '',
        salePrice: '',
        discountPercentage: '',
        imageUrl: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        fetchSale();
    }, [id]);

    const fetchSale = async () => {
        try {
            const response = await salesService.getById(id);
            const sale = response.data;
            setFormData({
                title: sale.title,
                description: sale.description,
                category: sale.category,
                originalPrice: sale.originalPrice?.toString() || '',
                salePrice: sale.salePrice?.toString() || '',
                discountPercentage: sale.discountPercentage?.toString() || '',
                imageUrl: sale.images?.[0] || '',
                startDate: sale.startDate.split('T')[0],
                endDate: sale.endDate.split('T')[0],
            });
        } catch (error) {
            console.error('Error fetching sale:', error);
            alert('Failed to load sale details');
            router.push('/dashboard/sales');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await salesService.update(id, {
                ...formData,
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
                salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
                discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : undefined,
                images: formData.imageUrl ? [formData.imageUrl] : [],
            });
            router.push('/dashboard/sales');
        } catch (error) {
            console.error('Error updating sale:', error);
            alert('Failed to update sale');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
            try {
                await salesService.delete(id);
                router.push('/dashboard/sales');
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

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link href="/dashboard/sales" className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Sales
                    </Link>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Edit Sale
                    </h2>
                </div>
                <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Sale
                </button>
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
                                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                                    Image URL
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="imageUrl"
                                        id="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                        placeholder="https://example.com/image.jpg"
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                    />
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
