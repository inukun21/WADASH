'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, ArrowLeft, Eye, EyeOff, Chrome, Github, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/';
    const reason = searchParams.get('reason');

    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorDetails, setErrorDetails] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        agreeToTerms: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isSignUp ? {
                    action: 'register',
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName
                } : {
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to dashboard or original destination
                router.push(redirectTo);
                router.refresh();
            } else {
                setError(data.error || 'Login failed');
                if (data.details && Array.isArray(data.details)) {
                    setErrorDetails(data.details);
                } else {
                    setErrorDetails([]);
                }
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: string) => {
        if (provider === 'Google') {
            await signIn('google', { callbackUrl: redirectTo });
        } else {
            console.log(`${provider} login not implemented yet`);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-[var(--card-bg)] rounded-[3rem] overflow-hidden shadow-2xl border border-[var(--border)]">
                <div className="grid md:grid-cols-2 min-h-[600px]">
                    {/* Left Side - Hero Section */}
                    <div className="relative bg-gradient-to-br from-violet-600 via-fuchsia-600 to-purple-700 p-12 hidden md:flex flex-col justify-between overflow-hidden">
                        {/* Animated Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-20">
                            <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
                            <div className="absolute bottom-20 right-10 w-40 h-40 bg-fuchsia-300 rounded-full blur-3xl animate-pulse delay-1000" />
                            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-violet-300 rounded-full blur-3xl animate-pulse delay-500" />
                        </div>

                        {/* Logo and Back Link */}
                        <div className="relative z-10 space-y-4">
                            <h2 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] leading-tight">
                                Managing WhatsApp,
                                <br />
                                Creating Solutions
                            </h2>
                            <p className="text-[var(--foreground)]/80 text-lg">
                                Your powerful WhatsApp bot dashboard for automation and management
                            </p>
                        </div>

                        {/* Decorative Dots */}
                        <div className="relative z-10 flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-white" />
                            <div className="w-2 h-2 rounded-full bg-[var(--foreground)]/50" />
                            <div className="w-2 h-2 rounded-full bg-white/30" />
                        </div>
                    </div>

                    {/* Right Side - Form Section */}
                    <div className="p-12 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full space-y-8">
                            {/* Header */}
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-[var(--foreground)]">
                                    {isSignUp ? 'Create an account' : 'Welcome back'}
                                </h2>
                                <p className="text-[var(--muted)]">
                                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                                    <button
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="text-[var(--accent)] hover:text-[var(--accent)] font-semibold transition-colors"
                                    >
                                        {isSignUp ? 'Log in' : 'Sign up'}
                                    </button>
                                </p>
                            </div>

                            {/* Account Deleted Warning */}
                            {reason === 'account_deleted' && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                    <p className="text-yellow-400 text-sm font-medium">
                                        Your account has been deleted by an administrator. Please contact support if you believe this is an error.
                                    </p>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                                    <p className="text-red-400 text-sm font-medium">{error}</p>
                                    {errorDetails.length > 0 && (
                                        <ul className="list-disc list-inside text-xs text-red-400/80">
                                            {errorDetails.map((detail, index) => (
                                                <li key={index}>{detail}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {isSignUp && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="First name"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="Last name"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full px-4 py-3.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                                        required
                                    />
                                </div>

                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-neutral-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {isSignUp && (
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            checked={formData.agreeToTerms}
                                            onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                                            className="mt-1 w-4 h-4 rounded border-[var(--border)] bg-[var(--foreground)]/5 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
                                            required
                                        />
                                        <label htmlFor="terms" className="text-sm text-[var(--muted)]">
                                            I agree to the{' '}
                                            <a href="#" className="text-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                                                Terms & Conditions
                                            </a>
                                        </label>
                                    </div>
                                )}

                                {!isSignUp && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="remember"
                                                className="w-4 h-4 rounded border-[var(--border)] bg-[var(--foreground)]/5 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
                                            />
                                            <label htmlFor="remember" className="text-sm text-[var(--muted)]">
                                                Remember me
                                            </label>
                                        </div>
                                        <a href="#" className="text-sm text-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                                            Forgot password?
                                        </a>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-[var(--foreground)] shadow-[0_10px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.4)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                    {loading ? 'Please wait...' : (isSignUp ? 'Create account' : 'Sign in')}
                                </button>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[var(--border)]" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-[var(--card-bg)] text-[var(--muted)]">Or continue with</span>
                                    </div>
                                </div>

                                {/* Social Login Buttons */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => handleSocialLogin('Google')}
                                        className="flex items-center justify-center gap-3 px-4 py-3.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-white/10 hover:border-[var(--border)] transition-all group"
                                    >
                                        <Chrome className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors" />
                                        <span className="font-medium">Google</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSocialLogin('GitHub')}
                                        className="flex items-center justify-center gap-3 px-4 py-3.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-white/10 hover:border-[var(--border)] transition-all group"
                                    >
                                        <Github className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors" />
                                        <span className="font-medium">GitHub</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
