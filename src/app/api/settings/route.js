import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/baileys';

export async function GET() {
    try {
        const settings = getSettings();
        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const updatedSettings = updateSettings(body);
        return NextResponse.json({ success: true, settings: updatedSettings });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
