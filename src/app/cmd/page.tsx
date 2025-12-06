'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Trash2, Copy, Check } from 'lucide-react';

interface CommandHistory {
    command: string;
    output: string;
    timestamp: string;
    exitCode?: number;
}

export default function CMDPage() {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<CommandHistory[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [copied, setCopied] = useState<number | null>(null);
    const outputEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const executeCommand = async () => {
        if (!command.trim() || isExecuting) return;

        setIsExecuting(true);
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

        try {
            const res = await fetch('/api/cmd', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command.trim() })
            });

            const data = await res.json();

            setHistory(prev => [...prev, {
                command: command.trim(),
                output: data.output || data.error || 'No output',
                timestamp,
                exitCode: data.exitCode
            }]);

            setCommand('');
        } catch (error) {
            setHistory(prev => [...prev, {
                command: command.trim(),
                output: `Error: ${error}`,
                timestamp,
                exitCode: 1
            }]);
        } finally {
            setIsExecuting(false);
        }
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const copyOutput = (index: number, text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(index);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            executeCommand();
        }
    };

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
                    Command Terminal
                </h2>
                <p className="text-[var(--muted)] mt-2 text-lg">Execute system commands remotely</p>
            </header>

            {/* Command Input */}
            <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2.5rem] p-8 border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Execute Command</h3>
                </div>

                <div className="flex gap-3">
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter command (e.g., ls, pwd, npm --version)"
                        className="flex-1 bg-[var(--foreground)]/10 border border-[var(--border)] rounded-2xl px-6 py-4 text-[var(--foreground)] placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono"
                        disabled={isExecuting}
                    />
                    <button
                        onClick={executeCommand}
                        disabled={!command.trim() || isExecuting}
                        className="px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-bold text-[var(--foreground)] shadow-[0_10px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.4)] hover:scale-105 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        <Play className={`w-5 h-5 ${isExecuting ? 'animate-pulse' : ''}`} />
                        {isExecuting ? 'Running...' : 'Execute'}
                    </button>
                    {history.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="px-6 py-4 bg-red-600/20 hover:bg-red-600/30 rounded-2xl text-red-400 transition-all duration-300 flex items-center gap-2"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <p className="text-[var(--muted)] text-sm mt-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    Warning: Be careful with commands that modify system files
                </p>
            </div>

            {/* Command History */}
            <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-[2.5rem] p-8 border border-[var(--border)]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Output History</h3>
                    </div>
                    <span className="text-[var(--muted)] text-sm">{history.length} command(s)</span>
                </div>

                <div className="bg-[var(--background)] rounded-[2rem] p-6 min-h-[400px] max-h-[600px] overflow-y-auto font-mono text-sm border border-[var(--border)] shadow-inner">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[350px] text-[var(--muted)]">
                            <Terminal className="w-16 h-16 mb-4 opacity-20" />
                            <p>No commands executed yet</p>
                            <p className="text-xs mt-2">Enter a command above to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {history.map((item, index) => (
                                <div key={index} className="border-b border-[var(--border)] pb-6 last:border-0">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[var(--muted)] text-xs">{item.timestamp}</span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.exitCode === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {item.exitCode === 0 ? 'SUCCESS' : 'ERROR'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => copyOutput(index, item.output)}
                                            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-2 hover:bg-[var(--card-bg)] rounded-lg"
                                        >
                                            {copied === index ? (
                                                <Check className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="mb-2">
                                        <span className="text-violet-400 font-bold">$ </span>
                                        <span className="text-[var(--foreground)]">{item.command}</span>
                                    </div>
                                    <pre className="text-[var(--foreground)] whitespace-pre-wrap break-words bg-[var(--foreground)]/10 p-4 rounded-xl border border-[var(--border)]">
                                        {item.output}
                                    </pre>
                                </div>
                            ))}
                            <div ref={outputEndRef} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
