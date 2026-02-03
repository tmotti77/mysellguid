'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Settings
                </h2>
            </div>

            <div className="bg-white shadow rounded-lg p-8 space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                    <p className="mt-1 text-sm text-gray-500">Your account details.</p>
                </div>

                <div className="border-t pt-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="mt-1 text-sm text-gray-900">{user?.firstName} {user?.lastName}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{user?.role || 'user'}</p>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900">Password & Security</h3>
                    <p className="mt-1 text-sm text-gray-500">Password reset and two-factor authentication coming soon.</p>
                </div>
            </div>
        </div>
    );
}
