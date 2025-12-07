'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Store, Lock, Mail, User, ArrowRight, Loader2, Check } from 'lucide-react';

export default function RegisterPage() {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: 'store_owner',
            });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        'Post unlimited sales and offers',
        'Reach nearby customers instantly',
        'Track views, clicks, and engagement',
        'Get discovered by local shoppers',
    ];

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
            {/* Left - Benefits (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
                        style={{ background: 'var(--gradient-primary)' }} />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10"
                        style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }} />
                </div>

                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                        Grow Your Business with <span className="text-gradient">MySellGuid</span>
                    </h1>
                    <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                        Join hundreds of local businesses connecting with nearby customers.
                    </p>
                    <ul className="space-y-4">
                        {benefits.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                                    <Check className="h-4 w-4" style={{ color: 'var(--color-success)' }} />
                                </div>
                                <span style={{ color: 'var(--color-text-secondary)' }}>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right - Form */}
            <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="card p-8 md:p-10">
                        {/* Logo */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                                style={{ background: 'var(--gradient-primary)' }}>
                                <Store className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                Create Account
                            </h1>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                Start listing your sales in minutes
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="label">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                                            style={{ color: 'var(--color-text-muted)' }} />
                                        <input
                                            id="firstName"
                                            name="firstName"
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className="input pl-10"
                                            placeholder="John"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="label">Last Name</label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="input"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="label">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                                        style={{ color: 'var(--color-text-muted)' }} />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input pl-10"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="label">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                                        style={{ color: 'var(--color-text-muted)' }} />
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="label">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
                                        style={{ color: 'var(--color-text-muted)' }} />
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="input pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="p-3 rounded-lg text-sm"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: 'var(--color-error)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)'
                                    }}>
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>

                            {/* Login Link */}
                            <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                Already have an account?{' '}
                                <Link
                                    href="/login"
                                    className="font-medium hover:underline"
                                    style={{ color: 'var(--color-accent-primary)' }}
                                >
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </div>

                    {/* Branding */}
                    <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        <span className="text-gradient font-bold">MySellGuid</span> • Store Dashboard
                    </p>
                </div>
            </div>
        </div>
    );
}
