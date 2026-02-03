'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Search, Loader2, Tag, ShoppingBag, Plus, X, Link2, Check } from 'lucide-react';
import axios from 'axios';
import { Sale } from '@/types';

const REPORT_CATEGORIES = ['clothing', 'shoes', 'electronics', 'home_goods', 'beauty', 'sports', 'food', 'other'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qfffuuqldmjtxxihynug.supabase.co/functions/v1';
const CATEGORIES = ['All', 'Food', 'Fashion', 'Electronics', 'Home', 'Beauty', 'Sports', 'Travel', 'Other'];

// Default: Ramat Gan, Israel
const DEFAULT_LAT = 32.0816;
const DEFAULT_LNG = 34.7965;

export default function BrowsePage() {
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [category, setCategory] = React.useState('All');
    const [locationLabel, setLocationLabel] = React.useState('Israel');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [coords, setCoords] = React.useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

    // Report a Sale modal
    const [showReport, setShowReport] = React.useState(false);
    const [reportUrl, setReportUrl] = React.useState('');
    const [reportLoading, setReportLoading] = React.useState(false);
    const [reportSubmitting, setReportSubmitting] = React.useState(false);
    const [reportSuccess, setReportSuccess] = React.useState(false);
    const [reportError, setReportError] = React.useState('');
    const [reportForm, setReportForm] = React.useState({
        title: '', description: '', discountPercentage: '', originalPrice: '', salePrice: '', category: 'other', storeName: '',
    });

    const resetReport = () => {
        setReportUrl('');
        setReportForm({ title: '', description: '', discountPercentage: '', originalPrice: '', salePrice: '', category: 'other', storeName: '' });
        setReportError('');
        setReportSuccess(false);
    };

    const extractFromUrl = async () => {
        if (!reportUrl.trim()) return;
        setReportLoading(true);
        setReportError('');
        try {
            const res = await axios.post(`${API_URL}/ml-analyze`, { action: 'url', url: reportUrl.trim() });
            const d = res.data;
            if (d.confidence && d.confidence > 0) {
                setReportForm({
                    title: d.title || '',
                    description: d.description || '',
                    discountPercentage: d.discountPercentage ? String(d.discountPercentage) : '',
                    originalPrice: d.originalPrice ? String(d.originalPrice) : '',
                    salePrice: d.salePrice ? String(d.salePrice) : '',
                    category: d.category || 'other',
                    storeName: d.storeName || '',
                });
            } else {
                setReportError('Could not extract sale info. Fill in the details manually.');
            }
        } catch {
            setReportError('Extraction failed — fill in manually below.');
        } finally {
            setReportLoading(false);
        }
    };

    const submitReport = async () => {
        if (!reportForm.title || !reportForm.discountPercentage) {
            setReportError('Title and discount % are required.');
            return;
        }
        setReportSubmitting(true);
        setReportError('');
        try {
            await axios.post(`${API_URL}/sales-report`, {
                title: reportForm.title,
                description: reportForm.description,
                discountPercentage: parseInt(reportForm.discountPercentage),
                originalPrice: reportForm.originalPrice ? parseFloat(reportForm.originalPrice) : null,
                salePrice: reportForm.salePrice ? parseFloat(reportForm.salePrice) : null,
                category: reportForm.category,
                storeName: reportForm.storeName,
                sourceUrl: reportUrl || undefined,
            });
            setReportSuccess(true);
            resetReport();
            // Refresh sales list
            const params: Record<string, string | number> = { lat: coords.lat, lng: coords.lng, radius: 50000, limit: 50 };
            if (category !== 'All') params.category = category;
            axios.get(`${API_URL}/sales-nearby`, { params }).then(res => setSales(res.data)).catch(() => {});
        } catch (err: any) {
            setReportError(err?.response?.data?.error || 'Submit failed');
        } finally {
            setReportSubmitting(false);
        }
    };

    React.useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationLabel('Near you');
                },
                () => setLocationLabel('Israel')
            );
        }
    }, []);

    React.useEffect(() => {
        setLoading(true);
        const params: Record<string, string | number> = { lat: coords.lat, lng: coords.lng, radius: 50000, limit: 50 };
        if (category !== 'All') params.category = category;
        axios.get(`${API_URL}/sales-nearby`, { params })
            .then(res => setSales(res.data))
            .catch(() => setSales([]))
            .finally(() => setLoading(false));
    }, [coords, category]);

    const filtered = searchQuery
        ? sales.filter(s =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.store?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : sales;

    const fmtDist = (d?: number) => {
        if (!d) return '';
        return d < 1000 ? `${Math.round(d)}m` : `${(d / 1000).toFixed(1)}km`;
    };

    return (
        <div className="min-h-dvh" style={{ background: 'var(--color-bg-primary)' }}>
            {/* Nav */}
            <header className="glass-strong sticky top-0 z-50 px-4 py-3">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <span className="text-xl font-bold text-gradient">MySellGuid</span>
                    <Link href="/login" className="text-sm font-medium transition-opacity hover:opacity-70"
                        style={{ color: 'var(--color-text-secondary)' }} aria-label="Store owner sign in">
                        Store Owner →
                    </Link>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
                {/* Hero */}
                <div className="text-center pt-4 space-y-2">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Find Sales <span className="text-gradient">Near You</span>
                    </h1>
                    <p className="text-sm flex items-center justify-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                        <MapPin className="h-4 w-4" /> {locationLabel}
                    </p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search sales, stores..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                        style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                        aria-label="Search sales and stores"
                    />
                </div>

                {/* Category filters */}
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-opacity"
                            style={{
                                background: category === cat ? 'var(--gradient-primary)' : 'var(--color-bg-tertiary)',
                                color: category === cat ? 'white' : 'var(--color-text-secondary)'
                            }}
                            aria-label={`Filter by ${cat}`}
                        >{cat}</button>
                    ))}
                </div>

                {/* Results count */}
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {filtered.length} sale{filtered.length !== 1 ? 's' : ''} found
                </p>

                {/* Sales grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-accent-primary)' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                        <ShoppingBag className="h-12 w-12 mx-auto" style={{ color: 'var(--color-text-muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No sales found nearby</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Try a different category or check back later</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(sale => (
                            <Link key={sale.id} href={`/browse/${sale.id}`} className="sale-card block" aria-label={`View ${sale.title}`}>
                                <div className="sale-card-image">
                                    {sale.images?.[0] ? (
                                        <img src={sale.images[0]} alt={sale.title} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--gradient-card)' }}>
                                            <Tag className="h-10 w-10" style={{ color: 'var(--color-accent-primary)' }} />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <span className="badge badge-discount">{sale.discountPercentage}% OFF</span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{sale.title}</h3>
                                    {sale.store?.name && (
                                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sale.store.name}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        {sale.originalPrice && sale.salePrice ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>₪{sale.salePrice}</span>
                                                <span className="text-xs line-through" style={{ color: 'var(--color-text-muted)' }}>₪{sale.originalPrice}</span>
                                            </div>
                                        ) : (
                                            <span className="badge badge-success">-{sale.discountPercentage}%</span>
                                        )}
                                        {sale.distance && (
                                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                                                <MapPin className="h-3 w-3" /> {fmtDist(sale.distance)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Report a Sale — floating action button */}
            <button
                onClick={() => { setShowReport(true); resetReport(); }}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-opacity hover:opacity-80"
                style={{ background: 'var(--gradient-primary)' }}
                aria-label="Report a sale"
            >
                <Plus className="h-6 w-6" />
            </button>

            {/* Report a Sale modal */}
            {showReport && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowReport(false)} />
                    <div className="relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto"
                        style={{ background: 'var(--color-bg-secondary)' }}>
                        {/* Header */}
                        <div className="sticky top-0 flex items-center justify-between px-5 pt-5 pb-3"
                            style={{ background: 'var(--color-bg-secondary)' }}>
                            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Report a Sale</h2>
                            <button onClick={() => setShowReport(false)} className="p-1 rounded-lg transition-opacity hover:opacity-70"
                                style={{ color: 'var(--color-text-muted)' }} aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="px-5 pb-6 space-y-4">
                            {reportSuccess ? (
                                <div className="text-center py-8 space-y-3">
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--color-bg-tertiary)' }}>
                                        <Check className="h-7 w-7 text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Sale reported!</p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>It will appear in the list shortly.</p>
                                    <button onClick={() => { setShowReport(false); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                                        style={{ background: 'var(--gradient-primary)' }}>Close</button>
                                </div>
                            ) : (
                                <>
                                    {/* URL extraction */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                            Found a deal online? Paste the URL to auto-fill
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                                <input
                                                    type="url"
                                                    value={reportUrl}
                                                    onChange={e => setReportUrl(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && extractFromUrl()}
                                                    placeholder="https://..."
                                                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
                                                    style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                                                    aria-label="Sale URL"
                                                />
                                            </div>
                                            <button onClick={extractFromUrl} disabled={reportLoading || !reportUrl.trim()}
                                                className="shrink-0 px-3 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-40 transition-opacity"
                                                style={{ background: 'var(--gradient-primary)' }} aria-label="Extract from URL">
                                                {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Extract'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>or fill manually</span>
                                        <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                                    </div>

                                    {/* Form fields */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Store name</label>
                                            <input type="text" value={reportForm.storeName}
                                                onChange={e => setReportForm(f => ({ ...f, storeName: e.target.value }))}
                                                placeholder="e.g. Fashion Paradise"
                                                className="w-full px-3 py-2 rounded-lg text-sm mt-1"
                                                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                                                aria-label="Store name" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Sale title *</label>
                                            <input type="text" value={reportForm.title}
                                                onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))}
                                                placeholder="e.g. Summer shoes 40% off at Nike"
                                                className="w-full px-3 py-2 rounded-lg text-sm mt-1"
                                                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                                                aria-label="Sale title" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Discount % *</label>
                                                <input type="number" min="1" max="99" value={reportForm.discountPercentage}
                                                    onChange={e => setReportForm(f => ({ ...f, discountPercentage: e.target.value }))}
                                                    placeholder="30"
                                                    className="w-full px-3 py-2 rounded-lg text-sm mt-1"
                                                    style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                                                    aria-label="Discount percentage" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Original ₪</label>
                                                <input type="number" value={reportForm.originalPrice}
                                                    onChange={e => setReportForm(f => ({ ...f, originalPrice: e.target.value }))}
                                                    placeholder="100"
                                                    className="w-full px-3 py-2 rounded-lg text-sm mt-1"
                                                    style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                                                    aria-label="Original price" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Sale ₪</label>
                                                <input type="number" value={reportForm.salePrice}
                                                    onChange={e => setReportForm(f => ({ ...f, salePrice: e.target.value }))}
                                                    placeholder="70"
                                                    className="w-full px-3 py-2 rounded-lg text-sm mt-1"
                                                    style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                                                    aria-label="Sale price" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Category</label>
                                            <select value={reportForm.category}
                                                onChange={e => setReportForm(f => ({ ...f, category: e.target.value }))}
                                                className="w-full px-3 py-2 rounded-lg text-sm mt-1"
                                                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                                                aria-label="Category">
                                                {REPORT_CATEGORIES.map(c => (
                                                    <option key={c} value={c}>{c.replace('_', ' ').replace(/^./, s => s.toUpperCase())}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Description</label>
                                            <textarea value={reportForm.description}
                                                onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))}
                                                placeholder="What's on sale?"
                                                rows={2}
                                                className="w-full px-3 py-2 rounded-lg text-sm mt-1 resize-none"
                                                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                                                aria-label="Description" />
                                        </div>
                                    </div>

                                    {reportError && (
                                        <p className="text-xs text-red-400">{reportError}</p>
                                    )}

                                    <button onClick={submitReport} disabled={reportSubmitting || !reportForm.title || !reportForm.discountPercentage}
                                        className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                                        style={{ background: 'var(--gradient-primary)' }} aria-label="Submit sale report">
                                        {reportSubmitting ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Report Sale'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
