interface LockoutEntry {
    attempts: number;
    lockedUntil: number | null;
}

const lockoutStore = new Map<string, LockoutEntry>();

const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION || '900000'); // 15min

export function recordFailedLogin(email: string): {
    locked: boolean;
    attemptsRemaining: number;
    lockedUntil: number | null;
} {
    const entry = lockoutStore.get(email) || { attempts: 0, lockedUntil: null };

    entry.attempts++;

    if (entry.attempts >= MAX_ATTEMPTS) {
        entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
        lockoutStore.set(email, entry);
        return {
            locked: true,
            attemptsRemaining: 0,
            lockedUntil: entry.lockedUntil,
        };
    }

    lockoutStore.set(email, entry);
    return {
        locked: false,
        attemptsRemaining: MAX_ATTEMPTS - entry.attempts,
        lockedUntil: null,
    };
}

export function isAccountLocked(email: string): boolean {
    const entry = lockoutStore.get(email);
    if (!entry || !entry.lockedUntil) return false;

    if (Date.now() > entry.lockedUntil) {
        // Lockout expired
        lockoutStore.delete(email);
        return false;
    }

    return true;
}

export function resetFailedAttempts(email: string): void {
    lockoutStore.delete(email);
}

export function getLockedUntil(email: string): number | null {
    const entry = lockoutStore.get(email);
    return entry?.lockedUntil || null;
}
