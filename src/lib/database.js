import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Separate database files
// Separate database files
const WHATSAPP_DB_PATH = path.join(process.cwd(), 'database', 'database.json');
const WEB_DB_PATH = path.join(process.cwd(), 'database', 'dsh.database.json');
const OLD_DB_PATH = path.join(process.cwd(), 'database', 'dsh.database.json');

const whatsappDbs = {};

// Helper to get sanitized filename
const getDbPath = (ownerId) => {
    // Basic sanitization
    const safeId = ownerId.replace(/[^a-z0-9@.]/gi, '_').toLowerCase();
    return path.join(process.cwd(), 'database', `database.${safeId}.json`);
};

// Initialize/Get WhatsApp Database for specific owner
const getWhatsAppDb = (ownerId) => {
    if (!whatsappDbs[ownerId]) {
        const dbPath = getDbPath(ownerId);
        if (fs.existsSync(dbPath)) {
            try {
                const data = fs.readFileSync(dbPath, 'utf-8');
                if (data.trim()) {
                    const parsed = JSON.parse(data);
                    whatsappDbs[ownerId] = {
                        users: parsed.users || {}
                    };
                } else {
                    whatsappDbs[ownerId] = { users: {} };
                }
            } catch (e) {
                console.error(`Failed to load WhatsApp database for ${ownerId}:`, e);
                whatsappDbs[ownerId] = { users: {} };
            }
        } else {
            // New database for this user
            whatsappDbs[ownerId] = { users: {} };
            saveWhatsAppDb(ownerId);
        }
    }
    return whatsappDbs[ownerId];
};

let webDb = { webUsers: {} };

// Save Web Database
export const saveWebDb = () => {
    try {
        console.log('[DB] saveWebDb called. Path:', WEB_DB_PATH);
        console.log('[DB] Current webDb:', JSON.stringify(webDb, null, 2));
        const tempPath = WEB_DB_PATH + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(webDb, null, 2));
        fs.renameSync(tempPath, WEB_DB_PATH);
        console.log('[DB] saveWebDb SUCCESS');
    } catch (e) {
        console.error('[DB] Failed to save Web database:', e);
    }
};

// Initialize Web Database (dsh.database.json)
const initWebDb = () => {
    console.log('[DB] initWebDb called. Path:', WEB_DB_PATH);
    if (fs.existsSync(WEB_DB_PATH)) {
        try {
            const data = fs.readFileSync(WEB_DB_PATH, 'utf-8');
            if (data.trim()) {
                const parsed = JSON.parse(data);
                webDb = {
                    webUsers: parsed.webUsers || {}
                };
                console.log('[DB] Loaded webUsers:', Object.keys(webDb.webUsers));
            }
        } catch (e) {
            console.error('Failed to load Web database:', e);
            const backupPath = WEB_DB_PATH + '.backup.' + Date.now();
            try {
                fs.copyFileSync(WEB_DB_PATH, backupPath);
                console.log('Corrupted Web database backed up to:', backupPath);
            } catch (backupError) {
                console.error('Failed to backup corrupted database:', backupError);
            }
            webDb = { webUsers: {} };
        }
    } else {
        console.log('[DB] WEB_DB_PATH does not exist, checking OLD_DB_PATH');
        // Check if old combined database exists and migrate
        if (fs.existsSync(OLD_DB_PATH)) {
            try {
                const data = fs.readFileSync(OLD_DB_PATH, 'utf-8');
                if (data.trim()) {
                    const parsed = JSON.parse(data);
                    if (parsed.webUsers) {
                        webDb = { webUsers: parsed.webUsers };
                        console.log('Migrated Web users from old database');
                    }
                }
            } catch (e) {
                console.error('Failed to migrate from old database:', e);
            }
        }
        saveWebDb();
    }
};

initWebDb();

// Save WhatsApp Database for specific owner
export const saveWhatsAppDb = (ownerId) => {
    try {
        if (!whatsappDbs[ownerId]) return;

        const dbPath = getDbPath(ownerId);
        const tempPath = dbPath + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(whatsappDbs[ownerId], null, 2));
        fs.renameSync(tempPath, dbPath);

        // Emit update to owner's room
        if (global.io) {
            global.io.to(ownerId).emit('whatsapp-users-updated', {
                users: whatsappDbs[ownerId].users
            });
        }
    } catch (e) {
        console.error(`Failed to save WhatsApp database for ${ownerId}:`, e);
    }
};

// WhatsApp User Functions (Now scoped by ownerId)
export const getUser = (ownerId, jid) => {
    if (!ownerId) {
        console.error('getUser called without ownerId');
        return null;
    }

    const db = getWhatsAppDb(ownerId);

    if (!db.users[jid]) {
        db.users[jid] = {
            jid,
            name: '',
            premium: false,
            limit: 100,
            pasangan: '', // Partner/relationship field
            joinedAt: new Date().toISOString()
        };
        saveWhatsAppDb(ownerId);
    }
    return db.users[jid];
};

export const updateUser = (ownerId, jid, data) => {
    if (!ownerId) return;
    const db = getWhatsAppDb(ownerId);

    if (db.users[jid]) {
        db.users[jid] = { ...db.users[jid], ...data };
        saveWhatsAppDb(ownerId);
    }
};

export const getAllUsers = (ownerId) => {
    if (!ownerId) return {};
    return getWhatsAppDb(ownerId).users;
};

// Web/Dashboard User Functions
const DEFAULT_SETTINGS = {
    autoRead: false,
    publicMode: true,
    botName: "WADASH Bot",
    prefix: "!",
    welcomeMessage: true,
    blockCall: false,
    ownerNumber: "",
    multiPrefix: false
};

export const createWebUser = async (userData) => {
    const { email, password, provider = 'credentials' } = userData;
    if (webDb.webUsers[email]) {
        throw new Error('User already exists');
    }

    // Hash password if provided (credentials provider)
    let hashedPassword = null;
    if (password && provider === 'credentials') {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    // Load global settings as template if available, otherwise use defaults
    let initialSettings = { ...DEFAULT_SETTINGS };
    try {
        const globalSettingsPath = path.join(process.cwd(), 'settings.json');
        if (fs.existsSync(globalSettingsPath)) {
            const globalSettings = JSON.parse(fs.readFileSync(globalSettingsPath, 'utf-8'));
            initialSettings = { ...initialSettings, ...globalSettings };
        }
    } catch (e) {
        // Ignore error, use defaults
    }

    webDb.webUsers[email] = {
        ...userData,
        password: hashedPassword,
        provider: provider,
        providerId: userData.providerId || null,
        image: userData.image || null,
        role: userData.role || 'user',
        createdAt: new Date().toISOString(),
        settings: initialSettings // User-specific settings
    };
    saveWebDb();
    return webDb.webUsers[email];
};

export const getWebUser = (email) => {
    return webDb.webUsers[email];
};

export const verifyPassword = async (email, password) => {
    const user = webDb.webUsers[email];
    if (!user) return false;

    // If password is not hashed (legacy), hash it and update
    if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        if (user.password === password) {
            // Migrate to hashed password
            user.password = await bcrypt.hash(password, 10);
            saveWebDb();
            return true;
        }
        return false;
    }

    // Verify hashed password
    if (!user.password) return false;
    return await bcrypt.compare(password, user.password);
};

export const updateWebUser = async (email, data) => {
    if (webDb.webUsers[email]) {
        // Hash password if being updated
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        webDb.webUsers[email] = { ...webDb.webUsers[email], ...data };
        saveWebDb();
        return webDb.webUsers[email];
    }
    return null;
};

// User Settings Functions
export const getWebUserSettings = (email) => {
    const user = webDb.webUsers[email];
    if (!user) return null;
    if (!user.settings) {
        // Initialize if missing - try to load global settings as template
        let initialSettings = { ...DEFAULT_SETTINGS };
        try {
            const globalSettingsPath = path.join(process.cwd(), 'settings.json');
            if (fs.existsSync(globalSettingsPath)) {
                const globalSettings = JSON.parse(fs.readFileSync(globalSettingsPath, 'utf-8'));
                initialSettings = { ...initialSettings, ...globalSettings };
            }
        } catch (e) {
            // Ignore error
        }

        user.settings = initialSettings;
        saveWebDb();
    }
    return user.settings;
};

export const updateWebUserSettings = (email, settings) => {
    console.log(`[DB] Updating settings for ${email}`, settings);
    const user = webDb.webUsers[email];
    if (!user) {
        console.error(`[DB] User ${email} not found in memory. Available users: ${Object.keys(webDb.webUsers).join(', ')}`);
        // Try reloading DB
        console.log('[DB] Attempting to reload database...');
        if (fs.existsSync(WEB_DB_PATH)) {
            try {
                const data = fs.readFileSync(WEB_DB_PATH, 'utf-8');
                const parsed = JSON.parse(data);
                webDb.webUsers = parsed.webUsers || {};
                console.log('[DB] Reloaded. Users:', Object.keys(webDb.webUsers).join(', '));
            } catch (err) {
                console.error('[DB] Failed to reload:', err);
            }
        }

        // Retry fetch
        if (webDb.webUsers[email]) {
            return updateWebUserSettings(email, settings);
        }

        return null;
    }

    if (!user.settings) {
        user.settings = { ...DEFAULT_SETTINGS };
    }

    user.settings = { ...user.settings, ...settings };
    saveWebDb();
    return user.settings;
};

// Legacy compatibility - deprecated
export const getDb = () => ({ ...whatsappDb, ...webDb });
export const saveDb = () => {
    saveWhatsAppDb();
    saveWebDb();
};

// Bot Session Management Functions
export const getUserBotSession = (email) => {
    const user = webDb.webUsers?.[email];

    if (!user) return null;

    return user.botSession || {
        status: 'disconnected',
        phoneNumber: null,
        connectedAt: null,
        sessionPath: `session/${Buffer.from(email).toString('base64').replace(/[/+=]/g, '-')}`
    };
};

export const updateUserBotSession = (email, sessionData) => {
    if (!webDb.webUsers?.[email]) {
        console.error(`User ${email} not found`);
        return false;
    }

    if (!webDb.webUsers[email].botSession) {
        webDb.webUsers[email].botSession = {
            status: 'disconnected',
            phoneNumber: null,
            connectedAt: null,
            sessionPath: `session/${Buffer.from(email).toString('base64').replace(/[/+=]/g, '-')}`
        };
    }

    webDb.webUsers[email].botSession = {
        ...webDb.webUsers[email].botSession,
        ...sessionData
    };

    saveWebDb();
    return true;
};

export const getAllActiveBots = () => {
    const activeBots = [];

    for (const [email, user] of Object.entries(webDb.webUsers || {})) {
        if (user.botSession && user.botSession.status === 'connected') {
            activeBots.push({
                email,
                name: user.name,
                phoneNumber: user.botSession.phoneNumber,
                connectedAt: user.botSession.connectedAt,
                sessionPath: user.botSession.sessionPath
            });
        }
    }

    return activeBots;
};

export const clearUserBotSession = (email) => {
    if (!webDb.webUsers?.[email]) {
        return false;
    }

    if (webDb.webUsers[email].botSession) {
        const sessionPath = webDb.webUsers[email].botSession.sessionPath;
        webDb.webUsers[email].botSession = {
            status: 'disconnected',
            phoneNumber: null,
            connectedAt: null,
            sessionPath: sessionPath
        };
        saveWebDb();
    }

    return true;
};
