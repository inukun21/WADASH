'use client';

import { useState, useEffect } from 'react';
import { Save, Bell, Shield, Smartphone, Trash2, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [botConfig, setBotConfig] = useState({
        botName: 'WADASH Bot',
        prefix: '!',
        publicMode: true,
        autoRead: false,
        welcomeMessage: true
    });

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.success) {
                setBotConfig(prev => ({ ...prev, ...data.settings }));
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(botConfig)
            });
            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setSaving(false);
        }
    };

    const handleRestartBot = async () => {
        setMessage({ type: '', text: '' });
        try {
            const res = await fetch('/api/bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });

            if (res.ok) {
                // Wait a bit then start
                setTimeout(async () => {
                    const resStart = await fetch('/api/bot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'start' })
                    });

                    if (resStart.ok) {
                        setMessage({ type: 'success', text: 'Bot restarted successfully!' });
                        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                    } else {
                        setMessage({ type: 'error', text: 'Failed to start bot' });
                    }
                }, 1000);
            } else {
                setMessage({ type: 'error', text: 'Failed to stop bot' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error' });
        }
    };

    const handleDeleteSession = async () => {
        if (!confirm('Are you sure you want to delete your session? This will disconnect the bot.')) return;

        setMessage({ type: '', text: '' });
        try {
            const res = await fetch('/api/bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteSession' })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Session deleted successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to delete session' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error' });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                    Settings
                </h1>
                <p className="text-[var(--muted)] mt-1">Configure your bot preferences and system settings</p>
            </div>

            {/* Message Toast */}
            {message.text && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl border flex items-center gap-2 animate-slide-in ${message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - General Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bot Configuration Card */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--foreground)]">Bot Configuration</h2>
                                <p className="text-sm text-[var(--muted)]">Manage basic bot behavior</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--foreground)]">Bot Name</label>
                                    <input
                                        type="text"
                                        value={botConfig.botName}
                                        onChange={(e) => setBotConfig({ ...botConfig, botName: e.target.value })}
                                        className="w-full px-4 py-3 bg-[var(--foreground)]/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-violet-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[var(--foreground)]">Command Prefix</label>
                                    <input
                                        type="text"
                                        value={botConfig.prefix}
                                        onChange={(e) => setBotConfig({ ...botConfig, prefix: e.target.value })}
                                        className="w-full px-4 py-3 bg-[var(--foreground)]/5 border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-violet-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Public Mode</p>
                                        <p className="text-sm text-[var(--muted)]">Allow everyone to use the bot</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={botConfig.publicMode} onChange={(e) => setBotConfig({ ...botConfig, publicMode: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-[var(--foreground)]/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-[var(--foreground)]">Auto Read</p>
                                        <p className="text-sm text-[var(--muted)]">Automatically mark messages as read</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={botConfig.autoRead} onChange={(e) => setBotConfig({ ...botConfig, autoRead: e.target.checked })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-[var(--foreground)]/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-[var(--background)] font-bold rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--foreground)]">Notifications</h2>
                                <p className="text-sm text-[var(--muted)]">Configure alert preferences</p>
                            </div>
                        </div>
                        {/* Placeholder for notification settings */}
                        <div className="p-4 bg-[var(--foreground)]/5 rounded-xl border border-[var(--border)] text-center text-[var(--muted)] text-sm">
                            Notification settings coming soon...
                        </div>
                    </div>
                </div>

                {/* Right Column - Danger Zone & Info */}
                <div className="space-y-6">
                    {/* Session Management */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--foreground)]">Session</h2>
                                <p className="text-sm text-[var(--muted)]">Connection security</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleRestartBot}
                                className="w-full flex items-center justify-between p-4 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 rounded-xl transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors" />
                                    <span className="text-[var(--foreground)] group-hover:text-[var(--foreground)]">Restart Bot</span>
                                </div>
                            </button>

                            <div className="pt-4 border-t border-[var(--border)]">
                                <h3 className="text-red-400 font-medium mb-2 text-sm uppercase tracking-wider">Danger Zone</h3>
                                <button
                                    onClick={handleDeleteSession}
                                    className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Trash2 className="w-5 h-5 text-red-400" />
                                        <span className="text-red-400 font-medium">Delete Session</span>
                                    </div>
                                </button>
                                <p className="text-xs text-[var(--muted)] mt-2">
                                    Deleting session will disconnect the bot and require re-scanning QR code.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* System Info */}
                    <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-6 text-[var(--foreground)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--foreground)]/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <h3 className="text-lg font-bold mb-1 relative z-10">WADASH Pro</h3>
                        <p className="text-[var(--foreground)]/80 text-sm mb-4 relative z-10">Version 1.0.0</p>
                        <div className="space-y-2 relative z-10">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--foreground)]/70">Node Version</span>
                                <span className="font-mono">v18.x</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--foreground)]/70">Platform</span>
                                <span className="font-mono">win32</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
