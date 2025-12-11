import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple in-memory user store (in production, use a database)
// Simple in-memory user store replaced by persistent JSON db
import { getWebUser, createWebUser, verifyPassword } from '@/lib/database';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, action, firstName, lastName } = body;

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

        // Handle Register
        if (action === 'register') {
            if (!email || !password || !firstName || !lastName) {
                return NextResponse.json({
                    success: false,
                    error: 'All fields are required'
                }, { status: 400 });
            }

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
                    name: `${firstName} ${lastName}`,
                    firstName,
                    lastName,
                    role: 'user',
                    provider: 'credentials'
                });

                // Create session immediately
                const user = newUser;
                // Create simple token (in production, use JWT)
                const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');

                // Set cookies
                const cookieStore = await cookies();
                cookieStore.set('auth-token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7 // 7 days
                });

                cookieStore.set('user-data', JSON.stringify({
                    email: user.email,
                    name: user.name,
                    role: user.role
                }), {
                    httpOnly: false, // Accessible by client JS if needed
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7
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
        if (!email || !password) {
            return NextResponse.json({
                success: false,
                error: 'Email and password are required'
            }, { status: 400 });
        }

        // Find user
        // hardcoded admin check for fallback if DB is empty/fails, or just use DB?
        // Let's stick to DB, but maybe keep the admin backdoor if requested?
        // User didn't request keeping backdoor, but it's "migrasi all database".
        // I should probably ensure the "admin" user from the memory is in the new DB?
        // No, user said "migrasi entire database", implies existing JSON.
        // But the previous auth was in-memory hardcoded.
        // It's better to NOT break access.
        // I'll check DB first. If not found, check hardcoded admin ONLY if migration hasn't happened.
        // Actually, let's just use the DB. If they want admin access, they can register or I can seed it.
        // I will seed the admin user if it doesn't exist for convenience.

        let user = getWebUser(email);

        // Check if user exists
        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'Invalid email or password'
            }, { status: 401 });
        }

        // Verify password (supports both hashed and legacy plain-text)
        const isValidPassword = await verifyPassword(email, password);
        if (!isValidPassword) {
            return NextResponse.json({
                success: false,
                error: 'Invalid email or password'
            }, { status: 401 });
        }

        // Create simple token (in production, use JWT)
        const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');

        // Set cookies
        const cookieStore = await cookies();
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        // Set user data cookie (non-sensitive data)
        cookieStore.set('user-data', JSON.stringify({
            email: user.email,
            name: user.name,
            role: user.role
        }), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
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
