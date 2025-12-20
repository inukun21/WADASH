import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const SECURITY_LOG = path.join(LOG_DIR, 'security.log');

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

export enum SecurityEventType {
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILED = 'LOGIN_FAILED',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
    PASSWORD_CHANGED = 'PASSWORD_CHANGED',
    UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
    REGISTRATION_SUCCESS = 'REGISTRATION_SUCCESS',
    REGISTRATION_FAILED = 'REGISTRATION_FAILED',
}

export function logSecurityEvent(
    type: SecurityEventType,
    details: {
        email?: string;
        ip?: string;
        userAgent?: string;
        message?: string;
        [key: string]: any;
    }
) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type,
        ...details,
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
        fs.appendFileSync(SECURITY_LOG, logLine);
    } catch (error) {
        console.error('Failed to write security log:', error);
    }

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
        console.log('[SECURITY]', logEntry);
    }
}
