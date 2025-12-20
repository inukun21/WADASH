'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Zap, Terminal, Users, MessageSquare, LogOut, Sun, Moon, Settings } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Features', icon: Zap, path: '/features' },
    { name: 'CMD', icon: Terminal, path: '/cmd' },
    { name: 'Users', icon: Users, path: '/users' },
    { name: 'Settings', icon: Settings, path: '/settings' },
];


export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' })
            });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 h-screen bg-[var(--sidebar-bg)]/80 backdrop-blur-xl border-r border-[var(--border)] flex-col fixed left-0 top-0 z-50 transition-colors duration-300">
                <div className="p-8 flex items-center gap-4">
                    <div className="w-12 h-12 relative flex-shrink-0">
                        <img
                            src="/wadash-logo.png"
                            alt="WADASH Logo"
                            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">WADASH</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                    ? 'bg-[var(--accent)] text-white shadow-lg shadow-violet-500/20'
                                    : 'text-[var(--muted)] hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-[var(--muted)] group-hover:text-[var(--foreground)]'}`} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 space-y-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all duration-300 group"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="w-5 h-5 text-yellow-400" />
                                <span className="font-medium">Light Mode</span>
                            </>
                        ) : (
                            <>
                                <Moon className="w-5 h-5 text-violet-400" />
                                <span className="font-medium">Dark Mode</span>
                            </>
                        )}
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        <span className="font-medium">{loggingOut ? 'Logging out...' : 'Logout'}</span>
                    </button>

                    {/* Status Card */}
                    <div className="bg-gradient-to-br from-[var(--card-bg)] to-[var(--card-bg)]/50 rounded-3xl p-5 border border-[var(--border)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl -mr-8 -mt-8" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                            <div>
                                <p className="text-xs text-[var(--muted)] font-medium uppercase tracking-wider">Status</p>
                                <p className="text-sm font-bold text-emerald-400">System Online</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Nav - Floating Pill Style */}
            <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
                <nav className="bg-[var(--sidebar-bg)]/90 backdrop-blur-2xl border border-[var(--border)] rounded-[2rem] p-2 flex justify-between items-center shadow-2xl shadow-black/20">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 ${isActive ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'fill-current/20' : ''}`} />
                            </Link>
                        );
                    })}
                    <button
                        onClick={toggleTheme}
                        className="flex flex-col items-center justify-center w-14 h-14 rounded-full text-[var(--muted)] hover:bg-[var(--foreground)]/5 transition-all duration-300"
                    >
                        {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
                </nav>
            </div>
        </>
    );
}
