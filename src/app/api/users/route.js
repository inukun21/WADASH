import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { getAllUsers } from '@/lib/database';

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

export async function GET() {
    try {
        const userEmail = await getCurrentUser();

        if (!userEmail) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const users = getAllUsers(userEmail);
        return NextResponse.json({
            success: true,
            users: users || {}
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
