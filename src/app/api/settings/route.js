import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to settings file
const SETTINGS_PATH = path.join(process.cwd(), 'settings.json');

// Helper to read settings
const getSettings = () => {
    if (fs.existsSync(SETTINGS_PATH)) {
        try {
            const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading settings:', error);
            return {};
        }
    }
    return {};
};

// Helper to save settings
const saveSettings = (newSettings) => {
    try {
        const currentSettings = getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updatedSettings, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
};

export async function GET() {
    try {
        const settings = getSettings();
        return NextResponse.json({
            success: true,
            settings
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        if (saveSettings(body)) {
            return NextResponse.json({
                success: true,
                message: 'Settings saved successfully',
                settings: body
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to save settings' },
                { status: 500 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Invalid request body' },
            { status: 400 }
        );
    }
}
