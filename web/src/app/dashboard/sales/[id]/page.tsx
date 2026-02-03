'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { salesService } from '@/services/api';
import {
    Loader2,
    Save,
    ArrowLeft,
    Trash2,
    ImageIcon,
    X,
    Upload,
    FileText,
    DollarSign,
    Calendar,
    Percent
} from 'lucide-react';

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
        images: [] as string[],
        startDate: '',
        endDate: '',
    });

    const categories = [
        { value: 'clothing', label: 'Clothing', emoji: '👕' },
        { value: 'fashion', label: 'Fashion', emoji: '👗' },
        { value: 'shoes', label: 'Shoes', emoji: '👟' },
        { value: 'accessories', label: 'Accessories', emoji: '👜' },
        { value: 'electronics', label: 'Electronics', emoji: '📱' },
        { value: 'home', label: 'Home', emoji: '🏠' },
        { value: 'furniture', label: 'Furniture', emoji: '🪑' },
        { value: 'beauty', label: 'Beauty', emoji: '💄' },
        { value: 'sports', label: 'Sports', emoji: '⚽' },
        { value: 'food', label: 'Food', emoji: '🍕' },
        { value: 'other', label: 'Other', emoji: '📦' },
    ];

    useEffect(() => {
        fetchSale();
    }, [id]);

    // Auto-calculate sale price when original price and discount change
    useEffect(() => {
        if (formData.originalPrice && formData.discountPercentage) {
            const original = parseFloat(formData.originalPrice);
            const discount = parseInt(formData.discountPercentage);
            if (!isNaN(original) && !isNaN(discount)) {
                const salePrice = original * (1 - discount / 100);
                setFormData(prev => ({ ...prev, salePrice: salePrice.toFixed(2) }));
            }
        }
    }, [formData.originalPrice, formData.discountPercentage]);

    const fetchSale = async () => {
        try {
            const response = await salesService.getById(id);
            const sale = response.data;
            setFormData({
                title: sale.title || '',
                description: sale.description || '',
                category: sale.category || '',
                originalPrice: sale.originalPrice?.toString() || '',
                salePrice: sale.salePrice?.toString() || '',
                discountPercentage: sale.discountPercentage?.toString() || '',
                images: sale.images || [],
                startDate: sale.startDate ? sale.startDate.split('T')[0] : '',
                endDate: sale.endDate ? sale.endDate.split('T')[0] : '',
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Only send remote image URLs to API (skip local base64 previews)
            const remoteImages = formData.images.filter(url => url.startsWith('http'));
            await salesService.update(id, {
                ...formData,
                images: remoteImages,
                originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
                salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
                discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : undefined,
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
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'var(--color-accent-primary)' }} />
                <p style={{ color: 'var(--color-text-muted)' }}>Loading sale details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm mb-4 hover:gap-3 transition-all"
                        style={{ color: 'var(--color-text-muted)' }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sales
                    </button>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Edit Sale
                    </h1>
                </div>
                <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors self-start"
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--color-error)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                    Delete Sale
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg" style={{ background: 'var(--gradient-primary)' }}>
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            Basic Information
                        </h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="title" className="label">Sale Title *</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="label">Description *</label>
                            <textarea
                                name="description"
                                id="description"
                                required
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                className="input resize-none"
                            />
                        </div>

                        <div>
                            <label className="label">Category *</label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                                        className={`p-3 rounded-lg border text-center transition-all ${formData.category === cat.value
                                                ? 'border-indigo-500 bg-indigo-500/20'
                                                : 'hover:border-white/20'
                                            }`}
                                        style={{
                                            borderColor: formData.category === cat.value
                                                ? 'var(--color-accent-primary)'
                                                : 'var(--border-color)',
                                            background: formData.category === cat.value
                                                ? 'rgba(99, 102, 241, 0.15)'
                                                : 'var(--color-bg-tertiary)'
                                        }}
                                    >
                                        <span className="text-xl">{cat.emoji}</span>
                                        <p className="text-xs mt-1" style={{
                                            color: formData.category === cat.value
                                                ? 'var(--color-text-primary)'
                                                : 'var(--color-text-muted)'
                                        }}>
                                            {cat.label}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            Pricing
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="originalPrice" className="label">Original Price (₪)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--color-text-muted)' }}>₪</span>
                                <input
                                    type="number"
                                    name="originalPrice"
                                    id="originalPrice"
                                    value={formData.originalPrice}
                                    onChange={handleChange}
                                    className="input pl-8"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="discountPercentage" className="label">Discount %</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="discountPercentage"
                                    id="discountPercentage"
                                    min="0"
                                    max="100"
                                    value={formData.discountPercentage}
                                    onChange={handleChange}
                                    className="input pr-8"
                                />
                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                                    style={{ color: 'var(--color-text-muted)' }} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="salePrice" className="label">Sale Price (₪)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--color-text-muted)' }}>₪</span>
                                <input
                                    type="number"
                                    name="salePrice"
                                    id="salePrice"
                                    value={formData.salePrice}
                                    onChange={handleChange}
                                    className="input pl-8"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            Duration
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="startDate" className="label">Start Date *</label>
                            <input
                                type="date"
                                name="startDate"
                                id="startDate"
                                required
                                value={formData.startDate}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="label">End Date *</label>
                            <input
                                type="date"
                                name="endDate"
                                id="endDate"
                                required
                                value={formData.endDate}
                                onChange={handleChange}
                                className="input"
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
                            <ImageIcon className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            Images
                        </h2>
                    </div>

                    {/* Upload Button */}
                    <div className="mb-6">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                        />
                        <label
                            htmlFor="image-upload"
                            className="btn-secondary inline-flex items-center gap-2 cursor-pointer"
                        >
                            <Upload className="h-5 w-5" />
                            Add Images
                        </label>
                    </div>

                    {/* Image Grid */}
                    {formData.images.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {formData.images.map((url, index) => (
                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden">
                                    <img
                                        src={url}
                                        alt={`Sale image ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-6 w-6 text-white" />
                                    </button>
                                    {index === 0 && (
                                        <span className="absolute bottom-1 left-1 text-xs px-2 py-0.5 rounded"
                                            style={{ background: 'var(--gradient-primary)', color: 'white' }}>
                                            Cover
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                            No images yet. Click "Add Images" to upload.
                        </p>
                    )}
                </div>

                {/* Submit */}
                <div className="flex items-center justify-between gap-4 pt-4">
                    <Link href="/dashboard/sales" className="btn-secondary">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
