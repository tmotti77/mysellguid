'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Store,
    ShoppingBag,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import clsx from 'clsx';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const navigation = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Store', href: '/dashboard/store', icon: Store },
        { name: 'Sales', href: '/dashboard/sales', icon: ShoppingBag },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between">
                <span className="text-xl font-bold text-indigo-600">MySellGuid</span>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <aside className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="h-full flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                            <h1 className="text-2xl font-bold text-indigo-600">MySellGuid</h1>
                            <p className="text-sm text-gray-500 mt-1">Store Dashboard</p>
                        </div>

                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={clsx(
                                            "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700"
                                                : "text-gray-700 hover:bg-gray-50"
                                        )}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-gray-200">
                            <div className="flex items-center mb-4 px-4">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {user?.firstName?.[0] || 'U'}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="mr-3 h-5 w-5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
