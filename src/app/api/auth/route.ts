import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simple in-memory user store (in production, use a database)
const users = [
    {
        email: 'admin@wadash.com',
        password: 'admin123',
        name: 'Admin',
        role: 'admin'
    },
    {
        email: 'user@wadash.com',
        password: 'user123',
        name: 'User',
        role: 'user'
    }
];

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, action } = body;

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

        // Handle login
        if (!email || !password) {
            return NextResponse.json({
                success: false,
                error: 'Email and password are required'
            }, { status: 400 });
        }

        // Find user
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
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
