'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, MoreVertical, UserPlus, Shield, Trash2, Edit2, Mail, Phone, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<any>(null);

    const fetchUsers = async () => {
        // Only set loading on initial fetch or manual refresh, not background updates
        if (users.length === 0) setLoading(true);
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            if (data.success) {
                // Convert users dictionary to array
                const usersList = Object.values(data.users);
                setUsers(usersList);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();

        // Initialize Socket.IO
        socketRef.current = io({
            path: '/socket.io',
        });

        socketRef.current.on('connect', async () => {
            console.log('Connected to Socket.IO for Users');

            // Get current user session to join their room
            try {
                const sessionRes = await fetch('/api/auth');
                if (sessionRes.ok) {
                    const contentType = sessionRes.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const sessionData = await sessionRes.json();
                        if (sessionData?.user?.email) {
                            // Join user-specific room
                            socketRef.current.emit('join', sessionData.user.email);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to join user room:', error);
            }
        });

        // Listen for realtime updates
        socketRef.current.on('whatsapp-users-updated', (data: any) => {
            console.log('Received users update', data);
            if (data.users) {
                const usersList = Object.values(data.users);
                setUsers(usersList);
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const filteredUsers = users.filter((user: any) =>
        (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.jid || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        WhatsApp Users
                    </h1>
                    <p className="text-[var(--muted)] mt-1">Manage users collected from WhatsApp</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh Data</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <input
                        type="text"
                        placeholder="Search users by name or number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--foreground)]/5">
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">User / JID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">Name</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">Premium</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">Limit</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">Joined At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-[var(--muted)]">
                                        {loading ? 'Loading users...' : 'No users found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user: any) => (
                                    <tr key={user.jid} className="group hover:bg-[var(--foreground)]/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--foreground)] text-sm">{user.jid.split('@')[0]}</p>
                                                    <p className="text-xs text-[var(--muted)]">{user.jid}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[var(--foreground)]">{user.name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${user.premium
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                                : 'bg-neutral-500/10 border-neutral-500/20 text-[var(--muted)]'
                                                }`}>
                                                {user.premium ? 'Premium' : 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-mono text-[var(--foreground)]">{user.limit}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-[var(--muted)]">
                                                {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination / Footer */}
                <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--muted)]">
                    <p>Showing {filteredUsers.length} users</p>
                </div>
            </div>
        </div>
    );
}
