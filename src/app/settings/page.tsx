'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [authenticated, setAuthenticated] = useState(false);

    const [settings, setSettings] = useState({
        botName: '',
        autoRead: false,
        blockCall: false,
        ownerNumber: '',
        prefix: '!',
        multiPrefix: false,
        publicMode: true,
        welcomeMessage: true
    });

    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth');
                if (response.ok) {
                    const data = await response.json();
                    if (data?.user?.email) {
                        setAuthenticated(true);
                        fetchSettings();
                    } else {
                        router.push('/login');
                    }
                } else {
                    router.push('/login');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/login');
            }
        };
        checkAuth();
    }, [router]);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
            } else {
                setMessage({ type: 'error', text: 'Failed to load settings' });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
                setSettings(data.settings);
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading || !authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
                    <p className="text-[var(--muted)]">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
                        Bot Settings
                    </h2>
                    <p className="text-[var(--muted)] mt-2 text-lg">Configure your WhatsApp bot preferences</p>
                </div>
            </header>

            {/* Message Alert */}
            {message.text && (
                <div className={`p-4 rounded-2xl border backdrop-blur-xl ${message.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/50 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Settings Cards */}
            <div className="space-y-6">
                {/* General Settings */}
                <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2.5rem] p-8 border border-[var(--border)] relative overflow-hidden group hover:bg-white/10 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-violet-500/30 transition-colors" />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <span className="text-xl">⚙️</span>
                            </div>
                            General Settings
                        </h3>

                        <div className="space-y-6">
                            {/* Bot Name */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                                    Bot Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.botName}
                                    onChange={(e) => handleChange('botName', e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                    placeholder="Enter bot name"
                                />
                            </div>

                            {/* Prefix */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                                    Command Prefix
                                </label>
                                <input
                                    type="text"
                                    value={settings.prefix}
                                    onChange={(e) => handleChange('prefix', e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                    placeholder="!"
                                    maxLength={3}
                                />
                                <p className="mt-1 text-xs text-[var(--muted)]">Character(s) that trigger bot commands</p>
                            </div>

                            {/* Owner Number */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted)] mb-2">
                                    Owner Number
                                </label>
                                <input
                                    type="text"
                                    value={settings.ownerNumber}
                                    onChange={(e) => handleChange('ownerNumber', e.target.value.replace(/[^0-9]/g, ''))}
                                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                    placeholder="628123456789"
                                    maxLength={15}
                                />
                                <p className="mt-1 text-xs text-[var(--muted)]">WhatsApp number without + or spaces (e.g., 628123456789)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bot Behavior */}
                <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2.5rem] p-8 border border-[var(--border)] relative overflow-hidden group hover:bg-white/10 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-fuchsia-500/30 transition-colors" />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <span className="text-xl">🤖</span>
                            </div>
                            Bot Behavior
                        </h3>

                        <div className="space-y-4">
                            <ToggleSwitch
                                label="Auto Read Messages"
                                description="Automatically mark messages as read"
                                checked={settings.autoRead}
                                onChange={(checked: boolean) => handleChange('autoRead', checked)}
                            />

                            <ToggleSwitch
                                label="Block Calls"
                                description="Automatically reject incoming calls"
                                checked={settings.blockCall}
                                onChange={(checked: boolean) => handleChange('blockCall', checked)}
                            />

                            <ToggleSwitch
                                label="Public Mode"
                                description="Allow anyone to use bot commands"
                                checked={settings.publicMode}
                                onChange={(checked: boolean) => handleChange('publicMode', checked)}
                            />

                            <ToggleSwitch
                                label="Welcome Message"
                                description="Send welcome message to new users"
                                checked={settings.welcomeMessage}
                                onChange={(checked: boolean) => handleChange('welcomeMessage', checked)}
                            />

                            <ToggleSwitch
                                label="Multi-Prefix Support"
                                description="Enable support for multiple command prefixes"
                                checked={settings.multiPrefix}
                                onChange={(checked: boolean) => handleChange('multiPrefix', checked)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] font-bold text-white shadow-[0_10px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.4)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {saving ? (
                        <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Saving...
                        </span>
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>
        </div>
    );
}

// Toggle Switch Component
function ToggleSwitch({ label, description, checked, onChange }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-[var(--background)]/30 rounded-2xl border border-[var(--border)]/50 hover:border-[var(--border)] transition-all">
            <div className="flex-1">
                <h3 className="text-[var(--foreground)] font-medium">{label}</h3>
                <p className="text-sm text-[var(--muted)] mt-1">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[var(--background)] ${checked ? 'bg-violet-500' : 'bg-[var(--border)]'
                    }`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-lg ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );
}
