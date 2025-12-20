import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWebUser } from '@/lib/database';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const userData = cookieStore.get('user-data')?.value;

        if (!userData) {
            return NextResponse.json({
                valid: false,
                reason: 'No session found'
            });
        }

        const user = JSON.parse(userData);

        // Check if user still exists in database
        const dbUser = getWebUser(user.email);

        if (!dbUser) {
            return NextResponse.json({
                valid: false,
                reason: 'User account has been deleted'
            });
        }

        return NextResponse.json({
            valid: true,
            user: {
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role
            }
        });

    } catch (error) {
        console.error('Session validation error:', error);
        return NextResponse.json({
            valid: false,
            reason: 'Validation error'
        }, { status: 500 });
    }
}
