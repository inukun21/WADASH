import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { startBotForUser, stopBotForUser, getBotStatus } from '@/lib/baileys';
import { checkRateLimit, rateLimitConfigs } from '@/lib/security/rateLimit';

// Helper to get user from either NextAuth or custom auth
async function getCurrentUser() {
    // Try NextAuth first
    const session = await auth();
    if (session?.user?.email) {
        return session.user.email;
    }

    // Fallback to custom auth
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    const userData = cookieStore.get('user-data')?.value;

    if (authToken && userData) {
        try {
            const user = JSON.parse(userData);
            return user.email;
        } catch (e) {
            console.error('Failed to parse user data:', e);
        }
    }

    return null;
}

export async function GET(req) {
    try {
        // Rate limiting
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimit = checkRateLimit(`bot-api:${clientIp}`, rateLimitConfigs.bot);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': rateLimitConfigs.bot.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
                    }
                }
            );
        }

        // Get current user from either auth system
        const userEmail = await getCurrentUser();

        if (!userEmail) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            );
        }

        // Get bot status for current user
        const status = getBotStatus(userEmail);

        const response = NextResponse.json(status);
        response.headers.set('X-RateLimit-Limit', rateLimitConfigs.bot.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

        return response;
    } catch (error) {
        console.error('Error in GET /api/bot:', error);
        return NextResponse.json(
            { status: 'disconnected', qr: null, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        // Rate limiting
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const rateLimit = checkRateLimit(`bot-api:${clientIp}`, rateLimitConfigs.bot);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': rateLimitConfigs.bot.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
                    }
                }
            );
        }

        // Get current user from either auth system
        const userEmail = await getCurrentUser();

        if (!userEmail) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            );
        }

        const body = await req.json();

        if (body.action === 'start') {
            await startBotForUser(userEmail);
            const response = NextResponse.json({
                message: 'Bot started successfully',
                userId: userEmail
            });
            response.headers.set('X-RateLimit-Limit', rateLimitConfigs.bot.maxRequests.toString());
            response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
            response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
            return response;
        } else if (body.action === 'stop') {
            await stopBotForUser(userEmail);
            const response = NextResponse.json({
                message: 'Bot stopped successfully',
                userId: userEmail
            });
            response.headers.set('X-RateLimit-Limit', rateLimitConfigs.bot.maxRequests.toString());
            response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
            response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
            return response;
        } else if (body.action === 'deleteSession') {
            const { deleteSessionForUser } = await import('@/lib/baileys');
            await deleteSessionForUser(userEmail);

            const response = NextResponse.json({
                message: 'Session deleted successfully',
                userId: userEmail
            });
            response.headers.set('X-RateLimit-Limit', rateLimitConfigs.bot.maxRequests.toString());
            response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
            response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
            return response;
        }

        return NextResponse.json(
            { error: 'Invalid action. Use "start" or "stop".' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error in POST /api/bot:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process request' },
            { status: 500 }
        );
    }
}
