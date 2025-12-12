import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { getUserBotSession, updateUserBotSession, getWebUserSettings } from './database.js';

// Store multiple bot instances: Map<userId, BotInstance>
const botInstances = new Map();

// Bot Instance structure
class BotInstance {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.qr = null;
        this.status = 'disconnected';
        this.connectedAt = null;
        this.logs = [];
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;
        this.phoneNumber = null;
        this.MAX_RECONNECT_ATTEMPTS = 5;
    }

    emitLog(type, message, data = {}) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const logEntry = {
            type,
            message,
            timestamp,
            data
        };

        // Store in memory (keep last 50 logs)
        this.logs.push(logEntry);
        if (this.logs.length > 50) {
            this.logs.shift();
        }

        // Emit to connected clients in user's room
        if (global.io) {
            global.io.to(this.userId).emit('log', logEntry);
        }

        console.log(`[${this.userId}][${type.toUpperCase()}] ${message}`);
    }

    getStatus() {
        const sessionData = getUserBotSession(this.userId);
        const sessionDir = sessionData?.sessionPath || `session/${this.userId}`;

        let sessionFileCount = 0;
        try {
            if (fs.existsSync(sessionDir)) {
                const files = fs.readdirSync(sessionDir);
                sessionFileCount = files.length;
            }
        } catch (error) {
            console.error('Error counting session files:', error);
        }

        return {
            status: this.status,
            qr: this.qr,
            connectedAt: this.connectedAt,
            logs: this.logs,
            session: {
                exists: sessionFileCount > 0,
                fileCount: sessionFileCount,
                phoneNumber: this.phoneNumber
            }
        };
    }

    async stop() {
        if (this.sock) {
            this.sock.ev.removeAllListeners('connection.update');
            this.sock.ev.removeAllListeners('creds.update');
            this.sock.ev.removeAllListeners('messages.upsert');
            this.sock.end(undefined);
            this.sock = null;
            this.status = 'disconnected';
            this.qr = null;
            this.connectedAt = null;
            this.phoneNumber = null;

            // Update database
            updateUserBotSession(this.userId, {
                status: 'disconnected',
                phoneNumber: null,
                connectedAt: null
            });

            this.emitLog('system', 'Bot stopped manually');
        }
    }

    async start() {
        if (this.sock) {
            this.emitLog('system', 'Bot already running');
            return this.sock;
        }

        this.emitLog('system', 'Starting bot...');

        // Get user's session directory
        const sessionData = getUserBotSession(this.userId);
        const sessionDir = sessionData?.sessionPath || `session/${Buffer.from(this.userId).toString('base64').replace(/[/+=]/g, '-')}`;

        // Create session directory if it doesn't exist
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        this.sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            browser: Browsers.macOS('Desktop'),
            syncFullHistory: false
        });

        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr: qrCode } = update;

            if (qrCode) {
                this.qr = qrCode;
                this.status = 'scan_qr';
                this.emitLog('qr', 'QR Code generated, please scan');

                // Update database
                updateUserBotSession(this.userId, {
                    status: 'scan_qr'
                });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log(`[${this.userId}] Connection closed due to `, lastDisconnect?.error, ', reconnecting ', shouldReconnect);

                this.status = 'disconnected';
                this.qr = null;
                this.sock = null;
                this.connectedAt = null;
                this.phoneNumber = null;
                this.emitLog('error', 'Connection closed', { shouldReconnect });

                // Update database
                updateUserBotSession(this.userId, {
                    status: 'disconnected',
                    phoneNumber: null,
                    connectedAt: null
                });

                if (shouldReconnect && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);
                    this.emitLog('system', `Reconnecting in ${delay / 1000}s... (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);

                    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

                    this.reconnectTimeout = setTimeout(() => {
                        this.start();
                    }, delay);
                } else if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
                    this.emitLog('error', 'Max reconnection attempts reached. Please restart manually.');
                }
            } else if (connection === 'open') {
                console.log(`[${this.userId}] Opened connection`);
                this.status = 'connected';
                this.qr = null;
                this.connectedAt = Date.now();
                this.reconnectAttempts = 0;

                if (this.sock?.user?.id) {
                    this.phoneNumber = this.sock.user.id.split(':')[0];
                    this.emitLog('success', `Bot connected successfully as ${this.phoneNumber}`);

                    // Update database
                    updateUserBotSession(this.userId, {
                        status: 'connected',
                        phoneNumber: this.phoneNumber,
                        connectedAt: this.connectedAt
                    });
                } else {
                    this.emitLog('success', 'Bot connected successfully');

                    // Update database
                    updateUserBotSession(this.userId, {
                        status: 'connected',
                        connectedAt: this.connectedAt
                    });
                }
            }
        });

        this.sock.ev.on('creds.update', saveCreds);

        // Import and use handler
        const { handleMessage } = await import('./handler');
        this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type === 'notify') {
                for (const msg of messages) {
                    if (!msg.message) continue;

                    // Get user settings
                    const settings = getWebUserSettings(this.userId) || {};
                    const { autoRead, publicMode, prefix } = settings;

                    // Auto Read Logic
                    if (autoRead) {
                        await this.sock.readMessages([msg.key]);
                    }

                    const from = msg.key.remoteJid;
                    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

                    if (text) {
                        this.emitLog('message', `Message from ${from.split('@')[0]}`, { text: text.substring(0, 50) });
                    }

                    // Pass settings to handler
                    await handleMessage(this.sock, msg, this.userId, settings);
                }
            }
        });

        // Call event listener for blocking calls
        this.sock.ev.on('call', async (callData) => {
            try {
                const settings = getWebUserSettings(this.userId) || {};

                if (settings.blockCall) {
                    for (const call of callData) {
                        if (call.status === 'offer') {
                            this.emitLog('system', `Rejecting call from ${call.from}`);
                            await this.sock.rejectCall(call.id, call.from);
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling call:', error);
            }
        });

        return this.sock;
    }
}

// Public API functions
export const startBotForUser = async (userId) => {
    let instance = botInstances.get(userId);

    if (!instance) {
        instance = new BotInstance(userId);
        botInstances.set(userId, instance);
    }

    return await instance.start();
};

export const stopBotForUser = async (userId) => {
    const instance = botInstances.get(userId);

    if (instance) {
        await instance.stop();
    }
};

export const deleteSessionForUser = async (userId) => {
    // Stop the bot first
    await stopBotForUser(userId);

    // Get session path
    const sessionData = getUserBotSession(userId);
    const sessionDir = sessionData?.sessionPath || `session/${Buffer.from(userId).toString('base64').replace(/[/+=]/g, '-')}`;

    // Remove session directory
    try {
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
        }
    } catch (error) {
        console.error(`Failed to delete session directory for ${userId}:`, error);
        throw error;
    }

    // Clear session in database (but keep the path structure for next time)
    // We import this at the top: import { getUserBotSession, updateUserBotSession, clearUserBotSession } from './database.js';
    // But since clearUserBotSession is not imported, let's just use updateUserBotSession which we have
    updateUserBotSession(userId, {
        status: 'disconnected',
        phoneNumber: null,
        connectedAt: null
    });

    return true;
};

export const getBotStatus = (userId) => {
    const instance = botInstances.get(userId);

    if (instance) {
        return instance.getStatus();
    }

    // Return default status if no instance
    const sessionData = getUserBotSession(userId);
    const sessionDir = sessionData?.sessionPath || `session/${Buffer.from(userId).toString('base64').replace(/[/+=]/g, '-')}`;

    let sessionFileCount = 0;
    try {
        if (fs.existsSync(sessionDir)) {
            const files = fs.readdirSync(sessionDir);
            sessionFileCount = files.length;
        }
    } catch (error) {
        console.error('Error counting session files:', error);
    }

    return {
        status: 'disconnected',
        qr: null,
        connectedAt: null,
        logs: [],
        session: {
            exists: sessionFileCount > 0,
            fileCount: sessionFileCount,
            phoneNumber: sessionData?.phoneNumber || null
        }
    };
};

export const getAllBotInstances = () => {
    const instances = [];

    for (const [userId, instance] of botInstances.entries()) {
        instances.push({
            userId,
            status: instance.status,
            phoneNumber: instance.phoneNumber,
            connectedAt: instance.connectedAt
        });
    }

    return instances;
};

// Legacy compatibility - kept for backward compatibility but deprecated
export const getStatus = () => {
    console.warn('getStatus() is deprecated. Use getBotStatus(userId) instead.');
    return {
        status: 'disconnected',
        qr: null,
        connectedAt: null,
        logs: [],
        session: { exists: false, fileCount: 0, phoneNumber: null }
    };
};

export const startBot = async () => {
    console.warn('startBot() is deprecated. Use startBotForUser(userId) instead.');
    throw new Error('Please use startBotForUser(userId) instead');
};

export const stopBot = async () => {
    console.warn('stopBot() is deprecated. Use stopBotForUser(userId) instead.');
    throw new Error('Please use stopBotForUser(userId) instead');
};
