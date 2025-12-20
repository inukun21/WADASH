// In-memory rate limiter (use Redis in production for distributed systems)
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

export const rateLimitConfigs = {
    login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15min
    api: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 per 15min
    bot: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute
};

export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // Clean up expired entries
    if (entry && entry.resetTime < now) {
        rateLimitStore.delete(key);
        entry = undefined;
    }

    if (!entry) {
        entry = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        rateLimitStore.set(key, entry);
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: entry.resetTime,
        };
    }

    if (entry.count >= config.maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
        };
    }

    entry.count++;
    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
    };
}

// Cleanup old entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60 * 60 * 1000);
