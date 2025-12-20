import { webDb, saveWebDb } from './database.js';

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
