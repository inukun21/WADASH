import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

const SESSION_DIR = 'session';

// Global variable to store the socket instance in development
let sock = null;
let qr = null;
let status = 'disconnected'; // 'disconnected', 'connecting', 'connected'
let connectedAt = null;
let logs = [];
let reconnectAttempts = 0;
let reconnectTimeout = null;
const MAX_RECONNECT_ATTEMPTS = 5;
let phoneNumber = null; // Store connected phone number

const emitLog = (type, message, data = {}) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const logEntry = {
        type,
        message,
        timestamp,
        data
    };

    // Store in memory (keep last 50 logs for better performance)
    logs.push(logEntry);
    if (logs.length > 50) {
        logs.shift();
    }

    // Emit to connected clients
    if (global.io) {
        global.io.emit('log', logEntry);
    }

    console.log(`[${type.toUpperCase()}] ${message}`);
};

export const getStatus = () => {
    // Count session files
    let sessionFileCount = 0;
    try {
        if (fs.existsSync(SESSION_DIR)) {
            const files = fs.readdirSync(SESSION_DIR);
            sessionFileCount = files.length;
        }
    } catch (error) {
        console.error('Error counting session files:', error);
    }

    return {
        status,
        qr,
        connectedAt,
        logs,
        session: {
            exists: sessionFileCount > 0,
            fileCount: sessionFileCount,
            phoneNumber: phoneNumber
        }
    };
};

export const stopBot = async () => {
    if (sock) {
        sock.ev.removeAllListeners('connection.update');
        sock.ev.removeAllListeners('creds.update');
        sock.ev.removeAllListeners('messages.upsert');
        sock.end(undefined);
        sock = null;
        status = 'disconnected';
        qr = null;
        connectedAt = null;
        phoneNumber = null;
        console.log('Bot stopped manually');
        emitLog('system', 'Bot stopped manually');
    }
};

const SETTINGS_FILE = 'settings.json';

// Default settings
const defaultSettings = {
    autoRead: false,
    publicMode: true,
    botName: 'WADASH Bot',
    prefix: '!'
};

// Helper to read settings
const readSettings = () => {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return { ...defaultSettings, ...JSON.parse(data) };
        }
    } catch (error) {
        console.error('Error reading settings:', error);
    }
    return defaultSettings;
};

// Helper to write settings
const writeSettings = (newSettings) => {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
    } catch (error) {
        console.error('Error writing settings:', error);
    }
};

// Initialize settings
let settings = readSettings();

export const getSettings = () => {
    settings = readSettings(); // Always read fresh
    return settings;
};

export const updateSettings = (newSettings) => {
    settings = { ...settings, ...newSettings };
    writeSettings(settings);
    emitLog('system', 'Settings updated', settings);
    return settings;
};

export const startBot = async () => {
    if (sock) return sock;

    emitLog('system', 'Starting bot...');
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr: qrCode } = update;

        if (qrCode) {
            qr = qrCode;
            status = 'scan_qr';
            emitLog('qr', 'QR Code generated, please scan');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);

            status = 'disconnected';
            qr = null;
            sock = null;
            connectedAt = null;
            phoneNumber = null;
            emitLog('error', 'Connection closed', { shouldReconnect });

            if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000); // Exponential backoff, max 10s
                emitLog('system', `Reconnecting in ${delay / 1000}s... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

                // Clear any existing timeout
                if (reconnectTimeout) clearTimeout(reconnectTimeout);

                reconnectTimeout = setTimeout(() => {
                    startBot();
                }, delay);
            } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                emitLog('error', 'Max reconnection attempts reached. Please restart manually.');
            }
        } else if (connection === 'open') {
            console.log('Opened connection');
            status = 'connected';
            qr = null;
            connectedAt = Date.now();
            reconnectAttempts = 0; // Reset on successful connection

            // Get phone number from socket
            if (sock?.user?.id) {
                phoneNumber = sock.user.id.split(':')[0];
                emitLog('success', `Bot connected successfully as ${phoneNumber}`);
            } else {
                emitLog('success', 'Bot connected successfully');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Import and use handler
    const { handleMessage } = await import('./handler');
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            for (const msg of messages) {
                if (!msg.message) continue;

                // Auto Read Logic
                if (settings.autoRead) {
                    try {
                        await sock.readMessages([msg.key]);
                    } catch (error) {
                        console.error('Failed to auto-read message:', error);
                    }
                }

                const from = msg.key.remoteJid;
                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

                if (text) {
                    emitLog('message', `Message from ${from.split('@')[0]}`, { text: text.substring(0, 50) });
                }

                await handleMessage(sock, msg);
            }
        }
    });

    return sock;
};
