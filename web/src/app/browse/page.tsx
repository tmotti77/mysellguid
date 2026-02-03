'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Search, Loader2, Tag, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import { Sale } from '@/types';

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
        </div>
    );
}
