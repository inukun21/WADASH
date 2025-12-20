import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const pluginsDir = path.join(process.cwd(), 'plugins');

        // Check if plugins directory exists
        if (!fs.existsSync(pluginsDir)) {
            return NextResponse.json({
                error: 'Plugins directory not found',
                features: []
            }, { status: 404 });
        }

        // Read all plugin files
        const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));

        const features = [];

        for (const file of files) {
            try {
                const filePath = path.join(pluginsDir, file);
                const fileContent = fs.readFileSync(filePath, 'utf-8');

                // Parse plugin metadata
                const plugin = {
                    filename: file,
                    name: file.replace('.js', ''),
                    commands: [],
                    aliases: [],
                    tags: [],
                    help: [],
                    description: '',
                    size: fs.statSync(filePath).size,
                    lastModified: fs.statSync(filePath).mtime
                };

                // Extract handler.command
                const commandMatch = fileContent.match(/handler\.command\s*=\s*\[(.*?)\]/s);
                if (commandMatch) {
                    const commands = commandMatch[1]
                        .split(',')
                        .map(cmd => cmd.trim().replace(/['"]/g, ''))
                        .filter(cmd => cmd);
                    plugin.commands = commands;
                }

                // Extract handler.help
                const helpMatch = fileContent.match(/handler\.help\s*=\s*\[(.*?)\]/s);
                if (helpMatch) {
                    const help = helpMatch[1]
                        .split(',')
                        .map(h => h.trim().replace(/['"]/g, ''))
                        .filter(h => h);
                    plugin.help = help;
                }

                // Extract handler.tags
                const tagsMatch = fileContent.match(/handler\.tags\s*=\s*\[(.*?)\]/s);
                if (tagsMatch) {
                    const tags = tagsMatch[1]
                        .split(',')
                        .map(tag => tag.trim().replace(/['"]/g, ''))
                        .filter(tag => tag);
                    plugin.tags = tags;
                }

                // Extract description from comments or first reply
                const descMatch = fileContent.match(/\/\/\s*(.+)/);
                if (descMatch) {
                    plugin.description = descMatch[1].trim();
                } else {
                    // Try to find description in reply messages
                    const replyMatch = fileContent.match(/m\.reply\(['"`](.+?)['"`]\)/);
                    if (replyMatch) {
                        plugin.description = replyMatch[1].substring(0, 100);
                    }
                }

                // Set primary command as name if available
                if (plugin.commands.length > 0) {
                    plugin.name = plugin.commands[0];
                    plugin.aliases = plugin.commands.slice(1);
                }

                features.push(plugin);
            } catch (error) {
                console.error(`Error parsing plugin ${file}:`, error);
                // Add basic info even if parsing fails
                features.push({
                    filename: file,
                    name: file.replace('.js', ''),
                    commands: [],
                    aliases: [],
                    tags: ['unknown'],
                    help: [],
                    description: 'Error parsing plugin',
                    error: error.message
                });
            }
        }

        // Sort by category/tags
        features.sort((a, b) => {
            const tagA = a.tags[0] || 'other';
            const tagB = b.tags[0] || 'other';
            return tagA.localeCompare(tagB);
        });

        return NextResponse.json({
            success: true,
            count: features.length,
            features: features,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in GET /api/features:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            features: []
        }, { status: 500 });
    }
}
