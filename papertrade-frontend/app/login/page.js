'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, error, isLoading, clearError } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-mint">PaperTrade</h1>
                    <p className="text-muted mt-1">Sign in to your account</p>
                </div>

                <div className="bg-card rounded-xl p-8 border border-border">
                    {error && (
                        <div className="mb-4 p-3 bg-crimson/15 border border-crimson/40 rounded-lg text-crimson text-sm flex justify-between">
                            <span>{error}</span>
                            <button onClick={clearError} className="text-crimson hover:text-crimson/70">✕</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-muted text-sm mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                suppressHydrationWarning
                                className="w-full bg-canvas border border-border rounded-lg px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-mint"
                            />
                        </div>
                        <div>
                            <label className="block text-muted text-sm mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                suppressHydrationWarning
                                className="w-full bg-canvas border border-border rounded-lg px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-mint"
                            />
                        </div>
                        <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-mint hover:bg-mint/80 disabled:bg-mint/20 text-canvas font-semibold py-2.5 rounded-lg transition-colors"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-muted text-sm mt-6">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-mint hover:text-mint/70">
                            Register
                        </Link>
                    </p>
                </div>

            </div>

        </div>
    );
}