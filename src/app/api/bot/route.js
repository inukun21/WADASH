import { NextResponse } from 'next/server';
import { startBot, stopBot, getStatus } from '@/lib/baileys';

export async function GET() {
    try {
        const status = getStatus();
        return NextResponse.json(status);
    } catch (error) {
        console.error('Error in GET /api/bot:', error);
        return NextResponse.json({ status: 'disconnected', qr: null }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        if (body.action === 'start') {
            await startBot();
            return NextResponse.json({ message: 'Bot started' });
        } else if (body.action === 'stop') {
            await stopBot();
            return NextResponse.json({ message: 'Bot stopped' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error parsing request body:', error);
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
