import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWebUser, createWebUser, verifyPassword as dbVerifyPassword } from '@/lib/database';
import { checkRateLimit, rateLimitConfigs } from '@/lib/security/rateLimit';
import { isAccountLocked, recordFailedLogin, resetFailedAttempts, getLockedUntil } from '@/lib/security/accountLockout';
import { validatePasswordStrength, hashPassword, verifyPassword } from '@/lib/security/password';
import { validateEmail, sanitizeEmail, sanitizeString } from '@/lib/security/validation';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email: rawEmail, password, action, firstName, lastName } = body;

        // Handle logout
        if (action === 'logout') {
            const cookieStore = await cookies();
            cookieStore.delete('auth-token');
            cookieStore.delete('user-data');
            return NextResponse.json({
                success: true,
                message: 'Logged out successfully'
            });
        }

        // Get client IP for rate limiting
        const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        // Handle Register
        if (action === 'register') {
            // Rate limiting for registration
            const rateLimit = checkRateLimit(`register:${clientIp}`, rateLimitConfigs.login);
            if (!rateLimit.allowed) {
                return NextResponse.json({
                    success: false,
                    error: 'Too many registration attempts. Please try again later.'
                }, { status: 429 });
            }

            if (!rawEmail || !password || !firstName || !lastName) {
                return NextResponse.json({
                    success: false,
                    error: 'All fields are required'
                }, { status: 400 });
            }

            // Validate and sanitize email
            const email = sanitizeEmail(rawEmail);
            if (!validateEmail(email)) {
                return NextResponse.json({
                    success: false,
                    error: 'Invalid email format'
                }, { status: 400 });
            }

            // Validate password strength
            const passwordValidation = validatePasswordStrength(password);
            if (!passwordValidation.valid) {
                return NextResponse.json({
                    success: false,
                    error: 'Password does not meet requirements',
                    details: passwordValidation.errors
                }, { status: 400 });
            }

            // Sanitize name inputs
            const sanitizedFirstName = sanitizeString(firstName);
            const sanitizedLastName = sanitizeString(lastName);

            try {
                // Check if user exists
                if (getWebUser(email)) {
                    return NextResponse.json({
                        success: false,
                        error: 'Email already registered'
                    }, { status: 400 });
                }

                // Create new user with hashed password
                const newUser = await createWebUser({
                    email,
                    password, // Will be hashed in createWebUser
                    name: `${sanitizedFirstName} ${sanitizedLastName}`,
                    firstName: sanitizedFirstName,
                    lastName: sanitizedLastName,
                    role: 'user',
                    provider: 'credentials'
                });

                // Create session
                const user = newUser;
                const token = Buffer.from(`${user.email}:${Date.now()}:${Math.random()}`).toString('base64');

                // Set secure cookies
                const cookieStore = await cookies();
                cookieStore.set('auth-token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400') // 24 hours
                });

                cookieStore.set('user-data', JSON.stringify({
                    email: user.email,
                    name: user.name,
                    role: user.role
                }), {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400')
                });

                return NextResponse.json({
                    success: true,
                    message: 'Registration successful',
                    user: {
                        email: user.email,
                        name: user.name,
                        role: user.role
                    }
                });

            } catch (err: any) {
                return NextResponse.json({
                    success: false,
                    error: err.message || 'Registration failed'
                }, { status: 400 });
            }
        }

        // Handle Login
        if (!rawEmail || !password) {
            return NextResponse.json({
                success: false,
                error: 'Email and password are required'
            }, { status: 400 });
        }

        // Validate and sanitize email
        const email = sanitizeEmail(rawEmail);
        if (!validateEmail(email)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid email format'
            }, { status: 400 });
        }

        // Rate limiting for login
        const rateLimit = checkRateLimit(`login:${clientIp}`, rateLimitConfigs.login);
        if (!rateLimit.allowed) {
            return NextResponse.json({
                success: false,
                error: 'Too many login attempts. Please try again later.',
                resetTime: new Date(rateLimit.resetTime).toISOString()
            }, { status: 429 });
        }

        // Check account lockout
        if (isAccountLocked(email)) {
            const lockedUntil = getLockedUntil(email);
            const minutesRemaining = lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 60000) : 15;
            return NextResponse.json({
                success: false,
                error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes.`,
                lockedUntil: lockedUntil ? new Date(lockedUntil).toISOString() : null
            }, { status: 423 });
        }

        // Find user
        let user = getWebUser(email);

        // Check if user exists
        if (!user) {
            // Record failed attempt even for non-existent users (prevent user enumeration)
            recordFailedLogin(email);
            return NextResponse.json({
                success: false,
                error: 'Invalid email or password'
            }, { status: 401 });
        }

        // Verify password (supports both hashed and legacy plain-text)
        const isValidPassword = await dbVerifyPassword(email, password);
        if (!isValidPassword) {
            // Record failed login attempt
            const lockout = recordFailedLogin(email);

            if (lockout.locked) {
                return NextResponse.json({
                    success: false,
                    error: 'Account locked for 15 minutes due to too many failed attempts.',
                    lockedUntil: lockout.lockedUntil ? new Date(lockout.lockedUntil).toISOString() : null
                }, { status: 423 });
            }

            return NextResponse.json({
                success: false,
                error: 'Invalid email or password',
                attemptsRemaining: lockout.attemptsRemaining
            }, { status: 401 });
        }

        // Successful login - reset failed attempts
        resetFailedAttempts(email);

        // Create session token
        const token = Buffer.from(`${user.email}:${Date.now()}:${Math.random()}`).toString('base64');

        // Set secure cookies
        const cookieStore = await cookies();
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400')
        });

        cookieStore.set('user-data', JSON.stringify({
            email: user.email,
            name: user.name,
            role: user.role
        }), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400')
        });

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        const userData = cookieStore.get('user-data')?.value;

        if (!token || !userData) {
            return NextResponse.json({
                success: false,
                authenticated: false
            });
        }

        // Parse user data and validate user still exists in database
        const user = JSON.parse(userData);
        const dbUser = getWebUser(user.email);

        // If user no longer exists in database, clear session
        if (!dbUser) {
            cookieStore.delete('auth-token');
            cookieStore.delete('user-data');

            return NextResponse.json({
                success: false,
                authenticated: false,
                reason: 'User account has been deleted'
            });
        }

        return NextResponse.json({
            success: true,
            authenticated: true,
            user: JSON.parse(userData)
        });

    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({
            success: false,
            authenticated: false
        });
    }
}
