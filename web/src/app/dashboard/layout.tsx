'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    Loader2,
    LayoutDashboard,
    Store,
    ShoppingBag,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronRight,
    Compass
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) return null;

    const navigation = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Store', href: '/dashboard/store', icon: Store },
        { name: 'Sales', href: '/dashboard/sales', icon: ShoppingBag },
        { name: 'Discovery', href: '/dashboard/discovery', icon: Compass },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    // Get breadcrumb from pathname
    const getBreadcrumb = () => {
        const segments = pathname.split('/').filter(Boolean);
        return segments.map((seg, i) => ({
            name: seg.charAt(0).toUpperCase() + seg.slice(1),
            href: '/' + segments.slice(0, i + 1).join('/'),
            isLast: i === segments.length - 1
        }));
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
            {/* Mobile Header */}
            <div className="lg:hidden glass-strong fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between">
                <span className="text-xl font-bold text-gradient">MySellGuid</span>
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <Bell className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            <div className="flex min-h-screen pt-14 lg:pt-0">
                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-40 w-64 
                    sidebar transform transition-transform duration-300 ease-in-out
                    lg:static lg:translate-x-0
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="h-full flex flex-col">
                        {/* Logo */}
                        <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                            <h1 className="text-2xl font-bold text-gradient">MySellGuid</h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                Store Dashboard
                            </p>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                        {isActive && (
                                            <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* User Section */}
                        <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <div className="flex items-center mb-4 px-3 py-2 rounded-lg"
                                style={{ background: 'var(--color-bg-tertiary)' }}>
                                <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white"
                                    style={{ background: 'var(--gradient-primary)' }}>
                                    {user?.firstName?.[0] || 'U'}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                                        {user?.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors"
                                style={{
                                    color: 'var(--color-error)',
                                    background: 'rgba(239, 68, 68, 0.1)'
                                }}
                            >
                                <LogOut className="mr-3 h-5 w-5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Mobile overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    {/* Breadcrumb - Desktop */}
                    <div className="hidden lg:block px-8 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="flex items-center justify-between">
                            <nav className="flex items-center space-x-2 text-sm">
                                {getBreadcrumb().map((crumb, i) => (
                                    <React.Fragment key={crumb.href}>
                                        {i > 0 && (
                                            <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
                                        )}
                                        <Link
                                            href={crumb.href}
                                            className={`hover:text-white transition-colors ${crumb.isLast ? '' : ''
                                                }`}
                                            style={{
                                                color: crumb.isLast ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                                            }}
                                        >
                                            {crumb.name}
                                        </Link>
                                    </React.Fragment>
                                ))}
                            </nav>
                            <div className="flex items-center gap-4">
                                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
                                    <Bell className="h-5 w-5" style={{ color: 'var(--color-text-secondary)' }} />
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full"
                                        style={{ background: 'var(--color-accent-tertiary)' }} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Page Content */}
                    <div className="p-4 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
