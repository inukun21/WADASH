import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database.json');

let db = {
    users: {}
};

// Initialize database
if (fs.existsSync(DB_PATH)) {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        if (data.trim()) {
            db = JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to load database:', e);
        // Backup corrupted file
        const backupPath = DB_PATH + '.backup.' + Date.now();
        try {
            fs.copyFileSync(DB_PATH, backupPath);
            console.log('Corrupted database backed up to:', backupPath);
        } catch (backupError) {
            console.error('Failed to backup corrupted database:', backupError);
        }
        // Reset to default
        db = { users: {} };
    }
} else {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const getDb = () => db;

export const saveDb = () => {
    try {
        // Write to temporary file first (atomic write)
        const tempPath = DB_PATH + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(db, null, 2));
        // Rename to actual file (atomic on most systems)
        fs.renameSync(tempPath, DB_PATH);
    } catch (e) {
        console.error('Failed to save database:', e);
    }
};

export const getUser = (jid) => {
    if (!db.users[jid]) {
        db.users[jid] = {
            jid,
            name: '',
            premium: false,
            limit: 100,
            pasangan: '', // Partner/relationship field
            joinedAt: new Date().toISOString()
        };
        saveDb();
    }
    return db.users[jid];
};

export const updateUser = (jid, data) => {
    if (db.users[jid]) {
        db.users[jid] = { ...db.users[jid], ...data };
        saveDb();
    }
};

export const getAllUsers = () => {
    return db.users;
};
