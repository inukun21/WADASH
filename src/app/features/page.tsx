'use client';

import { useState, useEffect } from 'react';
import { Package, Command, Tag, Clock, FileCode, Search, RefreshCw } from 'lucide-react';

interface Plugin {
    filename: string;
    name: string;
    commands: string[];
    aliases: string[];
    tags: string[];
    help: string[];
    description: string;
    size?: number;
    lastModified?: string;
    error?: string;
}

interface FeaturesResponse {
    success: boolean;
    count: number;
    features: Plugin[];
    timestamp: string;
    error?: string;
}

export default function FeaturesPage() {
    const [features, setFeatures] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [lastUpdate, setLastUpdate] = useState<string>('');

    const fetchFeatures = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/features');
            const data: FeaturesResponse = await res.json();

            if (data.success) {
                setFeatures(data.features);
                setLastUpdate(new Date(data.timestamp).toLocaleString());
            }
        } catch (error) {
            console.error('Failed to fetch features:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatures();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchFeatures, 30000);
        return () => clearInterval(interval);
    }, []);

    // Get unique tags
    const allTags = ['all', ...new Set(features.flatMap(f => f.tags))];

    // Filter features
    const filteredFeatures = features.filter(feature => {
        const matchesSearch =
            feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            feature.commands.some(cmd => cmd.toLowerCase().includes(searchQuery.toLowerCase())) ||
            feature.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTag = selectedTag === 'all' || feature.tags.includes(selectedTag);

        return matchesSearch && matchesTag;
    });

    // Group by category
    const groupedFeatures: Record<string, Plugin[]> = {};
    filteredFeatures.forEach(feature => {
        const category = feature.tags[0] || 'other';
        if (!groupedFeatures[category]) {
            groupedFeatures[category] = [];
        }
        groupedFeatures[category].push(feature);
    });

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
                        Features
                    </h2>
                    <p className="text-[var(--muted)] mt-2 text-lg">
                        {features.length} plugins available
                        {lastUpdate && <span className="text-[var(--muted)] text-sm ml-2">• Updated {lastUpdate}</span>}
                    </p>
                </div>
                <button
                    onClick={fetchFeatures}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] font-bold text-[var(--foreground)] shadow-[0_10px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.4)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </header>

            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <input
                        type="text"
                        placeholder="Search plugins..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[var(--card-bg)] backdrop-blur-xl rounded-[2rem] border border-[var(--border)] text-[var(--foreground)] placeholder-neutral-400 focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`px-6 py-3 rounded-[2rem] font-medium whitespace-nowrap transition-all ${selectedTag === tag
                                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-[var(--foreground)] shadow-[0_10px_30px_rgba(124,58,237,0.3)]'
                                : 'bg-[var(--card-bg)] text-[var(--muted)] hover:bg-white/10'
                                }`}
                        >
                            {tag.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Features Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-12 h-12 text-[var(--accent)] animate-spin" />
                        <p className="text-[var(--muted)]">Loading features...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.keys(groupedFeatures).length === 0 ? (
                        <div className="text-center py-20">
                            <Package className="w-16 h-16 text-[var(--muted)] mx-auto mb-4" />
                            <p className="text-[var(--muted)] text-lg">No features found</p>
                        </div>
                    ) : (
                        Object.entries(groupedFeatures).map(([category, plugins]) => (
                            <div key={category}>
                                <h3 className="text-2xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                                        <Tag className="w-5 h-5 text-[var(--accent)]" />
                                    </div>
                                    {category.toUpperCase()}
                                    <span className="text-sm text-[var(--muted)] font-normal">({plugins.length})</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {plugins.map((plugin, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2rem] p-6 border border-[var(--border)] hover:bg-white/10 hover:border-violet-500/30 transition-all duration-300 group"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Package className="w-6 h-6 text-[var(--accent)]" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-[var(--foreground)]">{plugin.name}</h4>
                                                        <p className="text-xs text-[var(--muted)]">{plugin.filename}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {plugin.description && (
                                                <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2">
                                                    {plugin.description}
                                                </p>
                                            )}

                                            {plugin.commands.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Command className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-xs font-semibold text-cyan-400">COMMANDS</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {plugin.commands.map((cmd, i) => (
                                                            <code
                                                                key={i}
                                                                className="px-3 py-1 bg-[var(--foreground)]/10 rounded-lg text-xs text-emerald-400 font-mono border border-emerald-500/20"
                                                            >
                                                                !{cmd}
                                                            </code>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {plugin.tags.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {plugin.tags.map((tag, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-2 py-1 bg-violet-500/10 rounded-lg text-xs text-violet-300 border border-violet-500/20"
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-3 border-t border-[var(--border)]">
                                                <div className="flex items-center gap-1">
                                                    <FileCode className="w-3 h-3" />
                                                    {formatFileSize(plugin.size)}
                                                </div>
                                                {plugin.lastModified && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(plugin.lastModified).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>

                                            {plugin.error && (
                                                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                    <p className="text-xs text-red-400">⚠️ {plugin.error}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
