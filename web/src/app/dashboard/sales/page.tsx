'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { salesService, storesService } from '@/services/api';
import {
    Plus,
    Edit,
    Trash2,
    Loader2,
    Clock,
    Tag,
    Eye,
    MousePointer,
    ImageIcon,
    Search,
    Filter,
    Grid,
    List,
    MoreVertical
} from 'lucide-react';
import { Sale } from '@/types';

interface Sale {
    id: string;
    title: string;
    description?: string;
    category?: string;
    discountPercentage?: number;
    originalPrice?: number;
    salePrice?: number;
    endDate: string;
}

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const storeRes = await storesService.getMyStore();
            const store = storeRes.data;
            setStoreId(store.id);

            if (store.id) {
                const salesRes = await salesService.getByStore(store.id);
                setSales(salesRes.data || []);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
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

    const filteredSales = sales.filter(sale => {
        const matchesSearch = sale.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getTimeRemaining = (endDateStr: string | null | undefined): string => {
        if (!endDateStr) return 'No end date';
        try {
            const endDate = new Date(endDateStr);
            const now = new Date();
            const diff = endDate.getTime() - now.getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            if (days < 0) return 'Expired';
            if (days === 0) return 'Ends today';
            if (days === 1) return '1 day left';
            return `${days} days left`;
        } catch {
            return 'Unknown';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'var(--color-accent-primary)' }} />
                <p style={{ color: 'var(--color-text-muted)' }}>Loading your sales...</p>
            </div>
        );
    }

    if (!storeId) {
        return (
            <div className="card text-center py-16 px-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                    style={{ background: 'var(--gradient-primary)' }}>
                    <Tag className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                    No Store Profile Found
                </h3>
                <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                    You need to create a store profile before you can post sales. It only takes a minute!
                </p>
                <Link href="/dashboard/store" className="btn-primary inline-flex items-center gap-2">
                    Create Store Profile
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Sales Management
                    </h1>
                    <p className="mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {sales.length} total sales • {sales.filter(s => s.status === 'active').length} active
                    </p>
                </div>
                <Link href="/dashboard/sales/new" className="btn-primary inline-flex items-center gap-2 self-start">
                    <Plus className="h-5 w-5" />
                    Create New Sale
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                            style={{ color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search sales..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input w-auto"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>

                    {/* View Toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-indigo-500/20' : ''}`}
                            style={{ color: viewMode === 'grid' ? 'var(--color-accent-primary)' : 'var(--color-text-muted)' }}
                        >
                            <Grid className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-indigo-500/20' : ''}`}
                            style={{ color: viewMode === 'list' ? 'var(--color-accent-primary)' : 'var(--color-text-muted)' }}
                        >
                            <List className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sales Grid/List */}
            {filteredSales.length === 0 ? (
                <div className="card text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                        style={{ background: 'var(--color-bg-tertiary)' }}>
                        <Tag className="h-8 w-8" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <h3 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        {searchQuery || statusFilter !== 'all' ? 'No matching sales' : 'No sales yet'}
                    </h3>
                    <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first sale to get started'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                        <Link href="/dashboard/sales/new" className="btn-primary inline-flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Create Your First Sale
                        </Link>
                    )}
                </div>
            ) : viewMode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSales.map((sale, index) => (
                        <Link
                            key={sale.id}
                            href={`/dashboard/sales/${sale.id}`}
                            className="sale-card group"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Image */}
                            <div className="sale-card-image">
                                {sale.images && sale.images[0] ? (
                                    <img src={sale.images[0]} alt={sale.title} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"
                                        style={{ background: 'var(--color-bg-tertiary)' }}>
                                        <ImageIcon className="h-12 w-12" style={{ color: 'var(--color-text-muted)' }} />
                                    </div>
                                )}
                                {/* Discount Badge */}
                                <div className="absolute top-3 left-3 badge-discount">
                                    {sale.discountPercentage}% OFF
                                </div>
                                {/* Status Badge */}
                                <div className={`absolute top-3 right-3 badge ${sale.status === 'active' ? 'badge-success' :
                                        sale.status === 'expired' ? 'badge-error' : 'badge-warning'
                                    }`}>
                                    {sale.status}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-semibold mb-2 line-clamp-2"
                                    style={{ color: 'var(--color-text-primary)' }}>
                                    {sale.title}
                                </h3>

                                {/* Category & Time */}
                                <div className="flex items-center gap-3 mb-3 text-sm"
                                    style={{ color: 'var(--color-text-muted)' }}>
                                    {sale.category && (
                                        <span className="capitalize">{sale.category}</span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {getTimeRemaining(sale.endDate)}
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm"
                                        style={{ color: 'var(--color-text-muted)' }}>
                                        <span className="flex items-center gap-1">
                                            <Eye className="h-4 w-4" />
                                            {sale.views}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MousePointer className="h-4 w-4" />
                                            {sale.clicks}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    {sale.salePrice != null && (
                                        <div className="text-right">
                                            <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                                ₪{sale.salePrice}
                                            </span>
                                            {sale.originalPrice != null && (
                                                <span className="text-xs line-through ml-2"
                                                    style={{ color: 'var(--color-text-muted)' }}>
                                                    ₪{sale.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions - visible on hover */}
                                <div className="flex items-center gap-2 mt-4 pt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <button
                                        className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-2"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.location.href = `/dashboard/sales/${sale.id}`;
                                        }}
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </button>
                                    <button
                                        className="p-2 rounded-lg transition-colors"
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}
                                        onClick={(e) => handleDelete(sale.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                // List View
                <div className="card overflow-hidden">
                    <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                        {filteredSales.map((sale, index) => (
                            <Link
                                key={sale.id}
                                href={`/dashboard/sales/${sale.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Image */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                    {sale.images && sale.images[0] ? (
                                        <img
                                            src={sale.images[0]}
                                            alt={sale.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"
                                            style={{ background: 'var(--color-bg-tertiary)' }}>
                                            <ImageIcon className="h-6 w-6" style={{ color: 'var(--color-text-muted)' }} />
                                        </div>
                                    )}
                                </div>

                                {/* Title & Category */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                        {sale.title}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm mt-1"
                                        style={{ color: 'var(--color-text-muted)' }}>
                                        <span className="badge-discount text-xs py-0.5">
                                            {sale.discountPercentage}% OFF
                                        </span>
                                        {sale.category && <span className="capitalize">{sale.category}</span>}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="hidden sm:flex items-center gap-6 text-sm"
                                    style={{ color: 'var(--color-text-muted)' }}>
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        {sale.views}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MousePointer className="h-4 w-4" />
                                        {sale.clicks}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {getTimeRemaining(sale.endDate)}
                                    </span>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${sale.status === 'active' ? 'badge-success' :
                                            sale.status === 'expired' ? 'badge-error' : 'badge-warning'
                                        }`}>
                                        {sale.status}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                            style={{ color: 'var(--color-text-secondary)' }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.location.href = `/dashboard/sales/${sale.id}`;
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                            style={{ color: 'var(--color-error)' }}
                                            onClick={(e) => handleDelete(sale.id, e)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
