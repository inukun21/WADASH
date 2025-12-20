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
        <div className="space-y-6 md:space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)]">
                        WhatsApp Users
                    </h1>
                    <p className="text-[var(--muted)] mt-2 text-base md:text-lg">Manage users collected from WhatsApp</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="flex items-center justify-center gap-2 px-6 py-3 md:px-6 md:py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all w-full md:w-auto hover:shadow-lg"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="font-medium">Refresh Data</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <input
                        type="text"
                        placeholder="Search users by name or number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 md:pl-14 pr-4 py-3 md:py-4 bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border)] rounded-[1.5rem] text-[var(--foreground)] placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm md:text-base"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border)] rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--foreground)]/5">
                                <th className="px-6 md:px-8 py-4 md:py-6 text-xs md:text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">User / JID</th>
                                <th className="px-6 md:px-8 py-4 md:py-6 text-xs md:text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Name</th>
                                <th className="px-6 md:px-8 py-4 md:py-6 text-xs md:text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Premium</th>
                                <th className="px-6 md:px-8 py-4 md:py-6 text-xs md:text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Limit</th>
                                <th className="px-6 md:px-8 py-4 md:py-6 text-xs md:text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Joined At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 md:px-8 py-12 text-center text-[var(--muted)]">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 rounded-2xl bg-[var(--foreground)]/5 flex items-center justify-center">
                                                <Search className="w-8 h-8 opacity-50" />
                                            </div>
                                            <p className="text-lg font-medium">{loading ? 'Loading users...' : 'No users found'}</p>
                                            {!loading && <p className="text-sm">Try adjusting your search terms</p>}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user: any) => (
                                    <tr key={user.jid} className="group hover:bg-[var(--foreground)]/[0.02] transition-colors">
                                        <td className="px-6 md:px-8 py-4 md:py-6">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold text-sm md:text-base md:group-hover:scale-110 transition-transform duration-300">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[var(--foreground)] text-sm md:text-base">{user.jid.split('@')[0]}</p>
                                                    <p className="text-xs text-[var(--muted)] font-mono opacity-60">{user.jid}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 md:px-8 py-4 md:py-6">
                                            <span className="text-[var(--foreground)] font-medium text-sm md:text-base">{user.name || '-'}</span>
                                        </td>
                                        <td className="px-6 md:px-8 py-4 md:py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${user.premium
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                : 'bg-neutral-500/10 border-neutral-500/20 text-[var(--muted)]'
                                                }`}>
                                                {user.premium ? 'Premium' : 'Free'}
                                            </span>
                                        </td>
                                        <td className="px-6 md:px-8 py-4 md:py-6">
                                            <span className="text-sm md:text-base font-mono text-[var(--foreground)] bg-[var(--foreground)]/5 px-3 py-1 rounded-lg">{user.limit}</span>
                                        </td>
                                        <td className="px-6 md:px-8 py-4 md:py-6">
                                            <span className="text-sm md:text-base text-[var(--muted)]">
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
                <div className="px-6 md:px-8 py-4 md:py-6 border-t border-[var(--border)] flex items-center justify-between text-xs md:text-sm text-[var(--muted)] bg-[var(--foreground)]/[0.01]">
                    <p>Showing <span className="font-bold text-[var(--foreground)]">{filteredUsers.length}</span> users</p>
                </div>
            </div>
        </div>
    );
}
