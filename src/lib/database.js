import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Separate database files
const WHATSAPP_DB_PATH = path.join(process.cwd(), 'database.json');
const WEB_DB_PATH = path.join(process.cwd(), 'dsh.database.json');
const OLD_DB_PATH = path.join(process.cwd(), 'dsh.database.json');

let whatsappDb = { users: {} };
let webDb = { webUsers: {} };

// Initialize WhatsApp Database (database.json)
const initWhatsAppDb = () => {
    if (fs.existsSync(WHATSAPP_DB_PATH)) {
        try {
            const data = fs.readFileSync(WHATSAPP_DB_PATH, 'utf-8');
            if (data.trim()) {
                const parsed = JSON.parse(data);
                whatsappDb = {
                    users: parsed.users || {}
                };
            }
        } catch (e) {
            console.error('Failed to load WhatsApp database:', e);
            const backupPath = WHATSAPP_DB_PATH + '.backup.' + Date.now();
            try {
                fs.copyFileSync(WHATSAPP_DB_PATH, backupPath);
                console.log('Corrupted WhatsApp database backed up to:', backupPath);
            } catch (backupError) {
                console.error('Failed to backup corrupted database:', backupError);
            }
            whatsappDb = { users: {} };
        }
    } else {
        // Check if old combined database exists and migrate
        if (fs.existsSync(OLD_DB_PATH)) {
            try {
                const data = fs.readFileSync(OLD_DB_PATH, 'utf-8');
                if (data.trim()) {
                    const parsed = JSON.parse(data);
                    if (parsed.users) {
                        whatsappDb = { users: parsed.users };
                        console.log('Migrated WhatsApp users from old database');
                    }
                }
            } catch (e) {
                console.error('Failed to migrate from old database:', e);
            }
        }
        saveWhatsAppDb();
    }
};

// Initialize Web Database (dsh.database.json)
const initWebDb = () => {
    if (fs.existsSync(WEB_DB_PATH)) {
        try {
            const data = fs.readFileSync(WEB_DB_PATH, 'utf-8');
            if (data.trim()) {
                const parsed = JSON.parse(data);
                webDb = {
                    webUsers: parsed.webUsers || {}
                };
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

// Initialize both databases
initWhatsAppDb();
initWebDb();

// Save functions
export const saveWhatsAppDb = () => {
    try {
        const tempPath = WHATSAPP_DB_PATH + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(whatsappDb, null, 2));
        fs.renameSync(tempPath, WHATSAPP_DB_PATH);
    } catch (e) {
        console.error('Failed to save WhatsApp database:', e);
    }
};

export const saveWebDb = () => {
    try {
        const tempPath = WEB_DB_PATH + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(webDb, null, 2));
        fs.renameSync(tempPath, WEB_DB_PATH);
    } catch (e) {
        console.error('Failed to save Web database:', e);
    }
};

// WhatsApp User Functions
export const getUser = (jid) => {
    if (!whatsappDb.users[jid]) {
        whatsappDb.users[jid] = {
            jid,
            name: '',
            premium: false,
            limit: 100,
            pasangan: '', // Partner/relationship field
            joinedAt: new Date().toISOString()
        };
        saveWhatsAppDb();
    }
    return whatsappDb.users[jid];
};

export const updateUser = (jid, data) => {
    if (whatsappDb.users[jid]) {
        whatsappDb.users[jid] = { ...whatsappDb.users[jid], ...data };
        saveWhatsAppDb();
    }
};

export const getAllUsers = () => {
    return whatsappDb.users;
};

// Web/Dashboard User Functions
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

    webDb.webUsers[email] = {
        ...userData,
        password: hashedPassword,
        provider: provider,
        providerId: userData.providerId || null,
        image: userData.image || null,
        role: userData.role || 'user',
        createdAt: new Date().toISOString()
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

// Legacy compatibility - deprecated
export const getDb = () => ({ ...whatsappDb, ...webDb });
export const saveDb = () => {
    saveWhatsAppDb();
    saveWebDb();
};
