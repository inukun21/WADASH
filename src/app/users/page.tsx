'use client';

import { useState } from 'react';
import { Search, Filter, MoreVertical, UserPlus, Shield, Trash2, Edit2, Mail, Phone } from 'lucide-react';

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data
    const users = [
        { id: 1, name: 'Admin User', email: 'admin@wadash.com', role: 'Admin', status: 'Active', lastActive: 'Now', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' },
        { id: 2, name: 'Regular User', email: 'user@wadash.com', role: 'User', status: 'Active', lastActive: '2h ago', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User' },
        { id: 3, name: 'John Doe', email: 'john@example.com', role: 'User', status: 'Offline', lastActive: '1d ago', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John' },
        { id: 4, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active', lastActive: '5m ago', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' },
        { id: 5, name: 'Bot Account', email: 'bot@wadash.com', role: 'Bot', status: 'Maintenance', lastActive: '1w ago', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bot' },
    ];

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        Users Management
                    </h1>
                    <p className="text-[var(--muted)] mt-1">Manage access and permissions for your dashboard</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-[var(--foreground)] rounded-xl transition-colors shadow-lg shadow-violet-600/20 font-medium">
                    <UserPlus className="w-4 h-4" />
                    <span>Add New User</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border)] bg-[var(--foreground)]/5">
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">User</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">Role</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)]">Last Active</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[var(--foreground)] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-[var(--foreground)]/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-[var(--foreground)]/5" />
                                            <div>
                                                <p className="font-medium text-[var(--foreground)]">{user.name}</p>
                                                <p className="text-sm text-[var(--muted)]">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${user.role === 'Admin'
                                            ? 'bg-violet-500/10 border-violet-500/20 text-violet-300'
                                            : 'bg-neutral-500/10 border-neutral-500/20 text-[var(--muted)]'
                                            }`}>
                                            {user.role === 'Admin' && <Shield className="w-3 h-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                                                user.status === 'Maintenance' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                                                    'bg-neutral-500'
                                                }`} />
                                            <span className="text-sm text-[var(--foreground)]">{user.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-[var(--muted)]">{user.lastActive}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-[var(--foreground)]/10 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--muted)] hover:text-red-400 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination / Footer */}
                <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between text-sm text-[var(--muted)]">
                    <p>Showing {filteredUsers.length} of {users.length} users</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 hover:bg-[var(--foreground)]/5 rounded-lg transition-colors disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 hover:bg-[var(--foreground)]/5 rounded-lg transition-colors">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
