'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Tag, Store, Loader2, Calendar } from 'lucide-react';
import axios from 'axios';
import { Sale } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qfffuuqldmjtxxihynug.supabase.co/functions/v1';

export default function SaleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [sale, setSale] = React.useState<Sale | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [imgIdx, setImgIdx] = React.useState(0);

    React.useEffect(() => {
        if (!id) return;
        axios.get(`${API_URL}/sales-get/${id}`)
            .then(res => setSale(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-accent-primary)' }} />
        </div>
    );

    if (!sale) return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4" style={{ background: 'var(--color-bg-primary)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Sale not found</p>
            <Link href="/browse" className="text-sm font-medium" style={{ color: 'var(--color-accent-primary)' }} aria-label="Back to browse">← Back to Browse</Link>
        </div>
    );

    const images = (sale.images || []).filter(Boolean);

    return (
        <div className="min-h-dvh" style={{ background: 'var(--color-bg-primary)' }}>
            {/* Nav */}
            <header className="glass-strong sticky top-0 z-50 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/browse" className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                        style={{ color: 'var(--color-text-secondary)' }} aria-label="Back to browse">
                        <ArrowLeft className="h-4 w-4" /> Browse
                    </Link>
                    <Link href="/login" className="text-sm" style={{ color: 'var(--color-text-muted)' }} aria-label="Store owner sign in">
                        Store Owner →
                    </Link>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                {/* Image gallery */}
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
                    {images.length > 0 ? (
                        <>
                            <div className="relative aspect-video">
                                <img src={images[imgIdx]} alt={sale.title} className="w-full h-full object-cover" />
                                <div className="absolute top-3 left-3">
                                    <span className="badge badge-discount">{sale.discountPercentage}% OFF</span>
                                </div>
                            </div>
                            {images.length > 1 && (
                                <div className="flex gap-2 p-3 overflow-x-auto">
                                    {images.map((img, i) => (
                                        <button key={i} onClick={() => setImgIdx(i)}
                                            className="shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-opacity"
                                            style={{ borderColor: i === imgIdx ? 'var(--color-accent-primary)' : 'transparent', opacity: i === imgIdx ? 1 : 0.6 }}
                                            aria-label={`View image ${i + 1}`}>
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="aspect-video flex items-center justify-center" style={{ background: 'var(--gradient-card)' }}>
                            <Tag className="h-16 w-16" style={{ color: 'var(--color-accent-primary)' }} />
                        </div>
                    )}
                </div>

                {/* Title + description */}
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{sale.title}</h1>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{sale.description}</p>
                </div>

                {/* Price */}
                <div className="card p-5">
                    <div className="flex items-end gap-3 flex-wrap">
                        {sale.salePrice ? (
                            <>
                                <span className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>₪{sale.salePrice}</span>
                                {sale.originalPrice && <span className="text-lg line-through mb-1" style={{ color: 'var(--color-text-muted)' }}>₪{sale.originalPrice}</span>}
                                <span className="badge badge-discount mb-1">Save {sale.discountPercentage}%</span>
                            </>
                        ) : (
                            <span className="badge badge-discount text-base px-3 py-1">{sale.discountPercentage}% OFF</span>
                        )}
                    </div>
                    {sale.originalPrice && sale.salePrice && (
                        <p className="text-sm mt-2" style={{ color: 'var(--color-success)' }}>
                            You save ₪{(sale.originalPrice - sale.salePrice).toFixed(2)}
                        </p>
                    )}
                </div>

                {/* Meta info grid */}
                <div className="grid grid-cols-2 gap-3">
                    {sale.store?.name && (
                        <div className="card p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                                <Store className="h-5 w-5" style={{ color: 'var(--color-accent-primary)' }} />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Store</p>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{sale.store.name}</p>
                            </div>
                        </div>
                    )}
                    {sale.category && (
                        <div className="card p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ background: 'var(--color-bg-tertiary)' }}>
                                <Tag className="h-5 w-5" style={{ color: 'var(--color-accent-secondary)' }} />
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Category</p>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{sale.category}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dates */}
                {(sale.startDate || sale.endDate) && (
                    <div className="card p-4 flex items-center gap-3">
                        <Calendar className="h-5 w-5" style={{ color: 'var(--color-warning)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {sale.startDate && <>From {new Date(sale.startDate).toLocaleDateString('en-IL')}</>}
                            {sale.startDate && sale.endDate && ' · '}
                            {sale.endDate && <>Until {new Date(sale.endDate).toLocaleDateString('en-IL')}</>}
                        </p>
                    </div>
                )}

                {/* Store address */}
                {sale.store?.address && (
                    <div className="card p-4 flex items-center gap-3">
                        <MapPin className="h-5 w-5" style={{ color: 'var(--color-accent-tertiary)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{sale.store.address}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
