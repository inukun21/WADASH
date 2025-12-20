'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Activity, Shield, Smartphone, Wifi, RefreshCw, Terminal, Play, Square } from 'lucide-react';
import { io } from 'socket.io-client';

interface LogEntry {
    type: string;
    message: string;
    timestamp: string;
    data?: any;
}

export default function Dashboard() {
    const [status, setStatus] = useState('disconnected');
    const [qr, setQr] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const socketRef = useRef<any>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [uptime, setUptime] = useState('0h 0m');
    const [connectedAt, setConnectedAt] = useState<number | null>(null);
    const wasConnectedRef = useRef(false);
    const [session, setSession] = useState<{
        exists: boolean;
        fileCount: number;
        phoneNumber: string | null;
    }>({
        exists: false,
        fileCount: 0,
        phoneNumber: null
    });
    const [isStarting, setIsStarting] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/bot');


            // Handle unauthorized - just return, middleware will handle redirect
            if (res.status === 401) {
                console.log('Not authenticated');
                return;
            }

            if (!res.ok) {
                console.error('Failed to fetch status:', res.status);
                return;
            }
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Response is not JSON');
                return;
            }
            const data = await res.json();

            // Use connectedAt from server
            if (data.connectedAt && data.status === 'connected') {
                if (!wasConnectedRef.current) {
                    setConnectedAt(data.connectedAt);
                    wasConnectedRef.current = true;
                }
            } else if (data.status !== 'connected' && wasConnectedRef.current) {
                setConnectedAt(null);
                setUptime('0h 0m');
                wasConnectedRef.current = false;
            }

            setStatus(data.status);

            // Update session info
            if (data.session) {
                setSession(data.session);
            }

            // Load logs from server if available
            if (data.logs && Array.isArray(data.logs) && data.logs.length > 0 && logs.length === 0) {
                setLogs(data.logs);
            }

            if (data.qr && data.status === 'scan_qr') {
                const qrUrl = await QRCode.toDataURL(data.qr);
                setQr(qrUrl);
            } else {
                setQr('');
            }
        } catch (error) {
            console.error('Failed to fetch status', error);
        }
    };

    const startBot = async () => {
        setIsStarting(true);
        try {
            const res = await fetch('/api/bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' })
            });

            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            fetchStatus();
        } catch (error) {
            console.error('Failed to start bot', error);
        } finally {
            // Keep the animation for a bit longer for better UX
            setTimeout(() => setIsStarting(false), 600);
        }
    };

    const stopBot = async () => {
        try {
            const res = await fetch('/api/bot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });

            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            fetchStatus();
        } catch (error) {
            console.error('Failed to stop bot', error);
        }
    };

    const restartBot = async () => {
        await stopBot();
        setTimeout(startBot, 1000); // Wait a bit before starting again
    };

    useEffect(() => {
        // Fetch initial status and logs
        const initDashboard = async () => {
            await fetchStatus();

            // Only add initial log if no logs loaded from server
            if (logs.length === 0) {
                setLogs([{
                    type: 'system',
                    message: 'Initializing dashboard...',
                    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
                }]);
            }
        };

        initDashboard();
        setMounted(true);

        // Reduced polling interval from 3s to 5s (40% less API calls)
        const interval = setInterval(() => {
            // Only fetch if page is visible
            if (!document.hidden) {
                fetchStatus();
            }
        }, 5000);

        // Initialize Socket.IO
        socketRef.current = io({
            path: '/socket.io',
        });

        socketRef.current.on('connect', async () => {
            console.log('Connected to Socket.IO');

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
                            console.log('Joined room:', sessionData.user.email);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to join user room:', error);
            }

            setLogs(prev => [...prev, {
                type: 'system',
                message: 'Connected to real-time logs',
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }]);
        });

        socketRef.current.on('log', (log: any) => {
            setLogs(prev => [...prev.slice(-49), log]); // Keep last 50 logs
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from Socket.IO');
        });

        return () => {
            clearInterval(interval);
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Calculate uptime every second
    useEffect(() => {
        if (!connectedAt) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = now - connectedAt;

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setUptime(`${hours}h ${minutes}m ${seconds}s`);
        }, 1000);

        return () => clearInterval(interval);
    }, [connectedAt]);

    return (
        <div className="space-y-6 md:space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)]">
                        Dashboard
                    </h2>
                    <p className="text-[var(--muted)] mt-2 text-base md:text-lg">Monitor bot status and activity</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {status === 'connected' ? (
                        <>
                            <button
                                onClick={restartBot}
                                className="flex-1 md:flex-none px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-[2rem] font-bold text-[var(--foreground)] shadow-[0_10px_30px_rgba(8,145,178,0.3)] hover:shadow-[0_15px_40px_rgba(8,145,178,0.4)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Restart
                            </button>
                            <button
                                onClick={stopBot}
                                className="px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 rounded-[2rem] font-bold text-[var(--foreground)] shadow-[0_10px_30px_rgba(225,29,72,0.3)] hover:shadow-[0_15px_40px_rgba(225,29,72,0.4)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                            >
                                <Square className="w-5 h-5 fill-current" />
                                Stop
                            </button>
                        </>
                    ) : status === 'scan_qr' ? (
                        <button
                            onClick={stopBot}
                            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 rounded-[2rem] font-bold text-[var(--foreground)] shadow-[0_10px_30px_rgba(225,29,72,0.3)] hover:shadow-[0_15px_40px_rgba(225,29,72,0.4)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <Square className="w-5 h-5 fill-current" />
                            Cancel
                        </button>
                    ) : (
                        <button
                            onClick={startBot}
                            disabled={isStarting}
                            className={`relative w-full md:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] font-bold text-[var(--foreground)] shadow-[0_10px_30px_rgba(124,58,237,0.3)] overflow-hidden group
                                ${isStarting
                                    ? 'scale-95 shadow-[0_5px_15px_rgba(124,58,237,0.2)]'
                                    : 'hover:shadow-[0_15px_40px_rgba(124,58,237,0.4)] hover:scale-105'
                                } 
                                transition-all duration-300 flex items-center justify-center gap-3`}
                        >
                            {/* Ripple effect background */}
                            <div className={`absolute inset-0 bg-white/20 rounded-[2rem] ${isStarting ? 'animate-ping' : 'scale-0'} transition-transform duration-500`} />

                            {/* Shimmer effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                            {/* Content */}
                            <div className="relative flex items-center gap-3">
                                <Play className={`w-5 h-5 fill-current ${isStarting ? 'animate-pulse' : ''}`} />
                                <span>{isStarting ? 'Starting...' : 'Start Bot'}</span>
                            </div>
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 relative group hover:bg-white/10 transition-all duration-500 border border-[var(--border)] overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-violet-500/30 transition-colors" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-4 text-violet-300">
                            <Wifi className="w-6 h-6" />
                        </div>
                        <p className="text-[var(--muted)] font-medium mb-1 text-sm md:text-base">Status</p>
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full shadow-[0_0_15px] ${status === 'connected' ? 'bg-emerald-400 shadow-emerald-400' : status === 'scan_qr' ? 'bg-yellow-400 shadow-yellow-400' : 'bg-rose-500 shadow-rose-500'}`} />
                            <h3 className={`text-xl md:text-2xl font-bold tracking-tight ${status === 'connected' ? 'text-emerald-400' : status === 'scan_qr' ? 'text-yellow-400' : 'text-rose-500'}`}>
                                {status.toUpperCase().replace('_', ' ')}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 relative group hover:bg-white/10 transition-all duration-500 border border-[var(--border)] overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-fuchsia-500/30 transition-colors" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center mb-4 text-fuchsia-300">
                            <Shield className="w-6 h-6" />
                        </div>
                        <p className="text-[var(--muted)] font-medium mb-1 text-sm md:text-base">Session</p>
                        <h3 className={`text-xl md:text-2xl font-bold tracking-tight ${session.exists ? 'text-emerald-400' : 'text-[var(--muted)]'}`}>
                            {session.exists ? 'Connected' : 'No Session'}
                        </h3>
                        {session.phoneNumber && (
                            <p className="text-[var(--muted)] text-sm mt-2">+{session.phoneNumber}</p>
                        )}
                        <p className="text-[var(--muted)] text-xs mt-1">{session.fileCount} files</p>
                    </div>
                </div>

                <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 relative group hover:bg-white/10 transition-all duration-500 border border-[var(--border)] overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/30 transition-colors" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4 text-cyan-300">
                            <Activity className="w-6 h-6" />
                        </div>
                        <p className="text-[var(--muted)] font-medium mb-1 text-sm md:text-base">Uptime</p>
                        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)]">{uptime}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-[var(--border)]">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-[var(--foreground)] mb-6 md:mb-8 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        Connection
                    </h3>

                    <div className="flex flex-col items-center justify-center py-8 md:py-12 min-h-[300px] md:min-h-[350px] bg-black/20 rounded-[2rem] border-2 border-dashed border-[var(--border)] relative overflow-hidden">
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                        {status === 'connected' ? (
                            <div className="text-center relative z-10">
                                <div className="w-20 md:w-24 h-20 md:h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                                    <Wifi className="w-8 md:w-10 h-8 md:h-10 text-emerald-400" />
                                </div>
                                <h4 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-2">Connected</h4>
                                <p className="text-[var(--muted)] text-sm md:text-base">Bot is online and ready</p>
                            </div>
                        ) : qr ? (
                            <div className="text-center relative z-10">
                                <div className="bg-white p-3 md:p-4 rounded-3xl mb-4 md:mb-6 inline-block shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                    <img src={qr} alt="QR Code" className="w-48 md:w-56 h-48 md:h-56 rounded-xl" />
                                </div>
                                <p className="text-[var(--muted)] font-medium text-sm md:text-base">Scan with WhatsApp</p>
                            </div>
                        ) : (
                            <div className="text-center relative z-10">
                                <div className="w-20 md:w-24 h-20 md:h-24 bg-[var(--card-bg)] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 animate-pulse">
                                    <Wifi className="w-8 md:w-10 h-8 md:h-10 text-[var(--muted)]" />
                                </div>
                                <p className="text-[var(--muted)] text-sm md:text-base">Waiting for server...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 border border-[var(--border)]">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-[var(--foreground)] mb-6 md:mb-8 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                            <Terminal className="w-5 h-5" />
                        </div>
                        System Logs
                    </h3>
                    <div className="bg-[var(--background)] rounded-[2rem] p-4 md:p-6 h-[300px] md:h-[350px] overflow-y-auto font-mono text-xs md:text-sm border border-[var(--border)] shadow-inner">
                        <div className="space-y-2 md:space-y-3">
                            {logs.map((log, index) => (
                                <div key={index} className="flex gap-2 md:gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <span className="text-[var(--muted)] shrink-0 mt-0.5 text-xs">{log.timestamp}</span>
                                    <div>
                                        <span className={`font-bold text-xs md:text-sm ${log.type === 'system' ? 'text-violet-400' :
                                            log.type === 'success' ? 'text-emerald-400' :
                                                log.type === 'error' ? 'text-rose-400' :
                                                    log.type === 'qr' ? 'text-yellow-400' :
                                                        log.type === 'message' ? 'text-cyan-400' :
                                                            'text-[var(--muted)]'
                                            }`}>
                                            [{log.type.toUpperCase()}]
                                        </span>
                                        <span className="text-[var(--foreground)] ml-2 text-xs md:text-sm">{log.message}</span>
                                        {log.data?.text && (
                                            <span className="text-[var(--muted)] ml-2 italic text-xs">"{log.data.text}"</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
