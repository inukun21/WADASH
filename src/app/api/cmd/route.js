import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req) {
    try {
        const { command } = await req.json();

        if (!command || typeof command !== 'string') {
            return NextResponse.json(
                { error: 'Invalid command' },
                { status: 400 }
            );
        }

        // Security: Block dangerous commands
        const dangerousPatterns = [
            /rm\s+-rf\s+\//,
            /format\s+/,
            /del\s+\/[sf]/i,
            /shutdown/i,
            /reboot/i,
        ];

        if (dangerousPatterns.some(pattern => pattern.test(command))) {
            return NextResponse.json(
                { error: 'Command blocked for security reasons', output: '', exitCode: 1 },
                { status: 403 }
            );
        }

        // Execute command with timeout
        const { stdout, stderr } = await execAsync(command, {
            timeout: 30000, // 30 seconds timeout
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });

        return NextResponse.json({
            output: stdout || stderr || 'Command executed successfully',
            exitCode: 0
        });

    } catch (error) {
        console.error('Command execution error:', error);

        return NextResponse.json({
            error: error.message,
            output: error.stderr || error.stdout || error.message,
            exitCode: error.code || 1
        });
    }
}
