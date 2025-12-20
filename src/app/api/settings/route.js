import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getWebUserSettings, updateWebUserSettings } from '@/lib/database';

// GET /api/settings - Get current user's settings
export async function GET(request) {
    try {
        // Check authentication using cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        const userData = cookieStore.get('user-data')?.value;

        if (!token || !userData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = JSON.parse(userData);
        const settings = getWebUserSettings(user.email);

        if (!settings) {
            return NextResponse.json(
                { error: 'Settings not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

// PUT /api/settings - Update current user's settings
export async function PUT(request) {
    try {
        // Check authentication using cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        const userData = cookieStore.get('user-data')?.value;

        if (!token || !userData) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = JSON.parse(userData);
        const body = await request.json();

        // Validate settings
        const allowedSettings = [
            'autoRead',
            'publicMode',
            'botName',
            'prefix',
            'welcomeMessage',
            'blockCall',
            'ownerNumber',
            'multiPrefix'
        ];

        const settings = {};
        for (const key of allowedSettings) {
            if (key in body) {
                settings[key] = body[key];
            }
        }

        // Validate types
        if ('autoRead' in settings && typeof settings.autoRead !== 'boolean') {
            return NextResponse.json(
                { error: 'autoRead must be a boolean' },
                { status: 400 }
            );
        }
        if ('publicMode' in settings && typeof settings.publicMode !== 'boolean') {
            return NextResponse.json(
                { error: 'publicMode must be a boolean' },
                { status: 400 }
            );
        }
        if ('welcomeMessage' in settings && typeof settings.welcomeMessage !== 'boolean') {
            return NextResponse.json(
                { error: 'welcomeMessage must be a boolean' },
                { status: 400 }
            );
        }
        if ('blockCall' in settings && typeof settings.blockCall !== 'boolean') {
            return NextResponse.json(
                { error: 'blockCall must be a boolean' },
                { status: 400 }
            );
        }
        if ('multiPrefix' in settings && typeof settings.multiPrefix !== 'boolean') {
            return NextResponse.json(
                { error: 'multiPrefix must be a boolean' },
                { status: 400 }
            );
        }
        if ('botName' in settings && typeof settings.botName !== 'string') {
            return NextResponse.json(
                { error: 'botName must be a string' },
                { status: 400 }
            );
        }
        if ('prefix' in settings && typeof settings.prefix !== 'string') {
            return NextResponse.json(
                { error: 'prefix must be a string' },
                { status: 400 }
            );
        }
        if ('ownerNumber' in settings && typeof settings.ownerNumber !== 'string') {
            return NextResponse.json(
                { error: 'ownerNumber must be a string' },
                { status: 400 }
            );
        }

        // Validate owner number format if provided
        if (settings.ownerNumber && settings.ownerNumber.trim()) {
            const cleanNumber = settings.ownerNumber.replace(/[^0-9]/g, '');
            if (cleanNumber.length < 10 || cleanNumber.length > 15) {
                return NextResponse.json(
                    { error: 'Owner number must be between 10-15 digits' },
                    { status: 400 }
                );
            }
        }

        const updatedSettings = updateWebUserSettings(user.email, settings);

        if (!updatedSettings) {
            return NextResponse.json(
                { error: 'Failed to update settings' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            settings: updatedSettings
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}
