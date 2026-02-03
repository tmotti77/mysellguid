'use client';

import React from 'react';
import { Compass, Play, RefreshCw, Upload, Link2, Image, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/services/api';

interface DiscoveryStats {
    enabled: boolean;
    sources: { rss: string[]; telegram: string[] };
    autoPublishThreshold: number;
    geminiConfigured: boolean;
}

interface DiscoveryResult {
    rssItems: number;
    telegramItems: number;
    analyzed: number;
    published: number;
    skipped: number;
    pending: number;
    errors: string[];
}

interface MLResult {
    title?: string;
    description?: string;
    discountPercentage?: number;
    originalPrice?: number;
    salePrice?: number;
    category?: string;
    storeName?: string;
    confidence?: number;
    rawText?: string;
    error?: string;
    [key: string]: any;
}

export default function DiscoveryPage() {
    const [stats, setStats] = React.useState<DiscoveryStats | null>(null);
    const [lastRun, setLastRun] = React.useState<DiscoveryResult | null>(null);
    const [runLoading, setRunLoading] = React.useState(false);
    const [mlLoading, setMlLoading] = React.useState(false);
    const [mlResult, setMlResult] = React.useState<MLResult | null>(null);
    const [urlInput, setUrlInput] = React.useState('');
    const [activeTab, setActiveTab] = React.useState<'url' | 'screenshot'>('url');

    React.useEffect(() => {
        api.get('/discovery?action=stats')
            .then(res => setStats(res.data))
            .catch(() => {});
    }, []);

    const runDiscovery = async () => {
        setRunLoading(true);
        setLastRun(null);
        try {
            const res = await api.post('/discovery?action=run');
            setLastRun(res.data.results);
        } catch (err: any) {
            setLastRun({ rssItems: 0, telegramItems: 0, analyzed: 0, published: 0, skipped: 0, pending: 0, errors: [err?.response?.data?.error || 'Failed'] });
        } finally {
            setRunLoading(false);
        }
    };

    const analyzeUrl = async () => {
        if (!urlInput.trim()) return;
        setMlLoading(true);
        setMlResult(null);
        try {
            const res = await api.post('/ml-analyze', { action: 'url', url: urlInput.trim() });
            setMlResult(res.data);
        } catch (err: any) {
            setMlResult({ error: err?.response?.data?.error || 'Analysis failed', confidence: 0 });
        } finally {
            setMlLoading(false);
        }
    };

    const analyzeScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMlLoading(true);
        setMlResult(null);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const res = await api.post('/ml-analyze', {
                    action: 'screenshot',
                    base64Data: reader.result as string,
                    mimeType: file.type,
                });
                setMlResult(res.data);
            } catch (err: any) {
                setMlResult({ error: err?.response?.data?.error || 'Analysis failed', confidence: 0 });
            } finally {
                setMlLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const confColor = (c: number) => c >= 0.75 ? 'text-emerald-400' : c >= 0.4 ? 'text-amber-400' : 'text-red-400';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl" style={{ background: 'var(--gradient-primary)' }}>
                        <Compass className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Discovery Engine</h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>AI-powered sale extraction from URLs, screenshots, and feeds</p>
                    </div>
                </div>
            </div>

            {/* Status & Sources */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${stats.geminiConfigured ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                AI Status: {stats.geminiConfigured ? 'Active' : 'Key needed'}
                            </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Auto-publish threshold: {(stats.autoPublishThreshold * 100)}% confidence
                        </p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>RSS Feeds</p>
                        <ul className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {stats.sources.rss.map(s => <li key={s}>• {s}</li>)}
                        </ul>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Telegram Channels</p>
                        <ul className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {stats.sources.telegram.map(s => <li key={s}>• @{s}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            {/* Two-column layout: Discovery Run + AI Analyzer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Discovery Run */}
                <div className="card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Auto-Discovery</h2>
                        <button
                            onClick={runDiscovery}
                            disabled={runLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                            style={{ background: 'var(--gradient-primary)' }}
                            aria-label="Run discovery scan"
                        >
                            {runLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            {runLoading ? 'Scanning...' : 'Run Now'}
                        </button>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Scans RSS feeds and Telegram channels for Israeli sales. High-confidence results (≥75%) are auto-published.
                    </p>

                    {lastRun && (
                        <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--color-bg-tertiary)' }}>
                            <div className="grid grid-cols-4 gap-3 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-indigo-400">{lastRun.rssItems + lastRun.telegramItems}</p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Candidates</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-emerald-400">{lastRun.published}</p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Published</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-400">{lastRun.skipped}</p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Already saved</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-amber-400">{lastRun.pending}</p>
                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Pending</p>
                                </div>
                            </div>
                            {lastRun.errors.length > 0 && (
                                <div className="text-xs text-red-400 space-y-1">
                                    {lastRun.errors.map((e, i) => <p key={i}>• {e}</p>)}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* AI Analyzer */}
                <div className="card p-6 space-y-4">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>AI Sale Analyzer</h2>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Paste a URL or upload a screenshot to extract sale details using Gemini AI.
                    </p>

                    {/* Tab selector */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('url')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'url' ? 'text-white' : ''}`}
                            style={{ background: activeTab === 'url' ? 'var(--gradient-primary)' : 'var(--color-bg-tertiary)', color: activeTab !== 'url' ? 'var(--color-text-secondary)' : undefined }}
                            aria-label="Switch to URL input"
                        >
                            <Link2 className="h-4 w-4" /> URL
                        </button>
                        <button
                            onClick={() => setActiveTab('screenshot')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'screenshot' ? 'text-white' : ''}`}
                            style={{ background: activeTab === 'screenshot' ? 'var(--gradient-primary)' : 'var(--color-bg-tertiary)', color: activeTab !== 'screenshot' ? 'var(--color-text-secondary)' : undefined }}
                            aria-label="Switch to screenshot upload"
                        >
                            <Image className="h-4 w-4" /> Screenshot
                        </button>
                    </div>

                    {activeTab === 'url' ? (
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && analyzeUrl()}
                                placeholder="https://instagram.com/p/..."
                                className="flex-1 px-3 py-2 rounded-lg text-sm"
                                style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', border: '1px solid var(--border-color)' }}
                                aria-label="Sale URL to analyze"
                            />
                            <button
                                onClick={analyzeUrl}
                                disabled={mlLoading || !urlInput.trim()}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity"
                                style={{ background: 'var(--gradient-primary)' }}
                                aria-label="Analyze URL"
                            >
                                {mlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze'}
                            </button>
                        </div>
                    ) : (
                        <label className="flex items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed cursor-pointer hover:bg-white/5 transition-colors"
                            style={{ borderColor: 'var(--border-color)' }}>
                            <Upload className="h-5 w-5" style={{ color: 'var(--color-text-muted)' }} />
                            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                                {mlLoading ? 'Analyzing...' : 'Click to upload screenshot'}
                            </span>
                            <input type="file" accept="image/*" className="sr-only" onChange={analyzeScreenshot} aria-label="Upload screenshot" />
                        </label>
                    )}

                    {/* ML Result */}
                    {mlResult && (
                        <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--color-bg-tertiary)' }}>
                            {mlResult.error && !mlResult.title ? (
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400">{mlResult.error}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-semibold ${confColor(mlResult.confidence || 0)}`}>
                                            Confidence: {((mlResult.confidence || 0) * 100).toFixed(0)}%
                                        </span>
                                        {(mlResult.confidence || 0) >= 0.75 && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                                    </div>
                                    {mlResult.title && <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{mlResult.title}</p>}
                                    {mlResult.description && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{mlResult.description}</p>}
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        {mlResult.category && <div><span style={{ color: 'var(--color-text-muted)' }}>Category</span><br /><span style={{ color: 'var(--color-text-primary)' }}>{mlResult.category}</span></div>}
                                        {mlResult.discountPercentage && <div><span style={{ color: 'var(--color-text-muted)' }}>Discount</span><br /><span style={{ color: 'var(--color-text-primary)' }}>{mlResult.discountPercentage}%</span></div>}
                                        {mlResult.storeName && <div><span style={{ color: 'var(--color-text-muted)' }}>Store</span><br /><span style={{ color: 'var(--color-text-primary)' }}>{mlResult.storeName}</span></div>}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
