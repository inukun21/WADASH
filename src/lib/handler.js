import fs from 'fs';
import path from 'path';
import { getUser, updateUser, getAllUsers } from './database.js';

const pluginsDir = path.join(process.cwd(), 'plugins');
const plugins = new Map();

// Utility functions for message handling
const Func = {
    isUrl: (text) => {
        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    }
};

// Dynamic require function to avoid Next.js build issues
const dynamicRequire = (moduleName) => {
    // Handle common modules
    const moduleMap = {
        'axios': () => import('axios').then(m => m.default),
        'yt-search': () => import('yt-search').then(m => m.default),
        '@whiskeysockets/baileys': () => import('@whiskeysockets/baileys'),
        'sharp': () => import('sharp').then(m => m.default),
        'fluent-ffmpeg': () => import('fluent-ffmpeg').then(m => m.default),
        'cheerio': () => import('cheerio'),
        'qs': () => import('qs'),
        'fs': () => Promise.resolve(fs),
        'path': () => Promise.resolve(path),
        'os': () => import('os'),
        'crypto': () => import('crypto')
    };

    if (moduleMap[moduleName]) {
        return moduleMap[moduleName]();
    }
    throw new Error(`Module ${moduleName} not found`);
};

// Load plugins (CommonJS style with eval to avoid Next.js build issues)
const loadPlugins = () => {
    plugins.clear();
    if (!fs.existsSync(pluginsDir)) return;

    const files = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of files) {
        try {
            const fullPath = path.join(pluginsDir, file);

            // Read file content
            const code = fs.readFileSync(fullPath, 'utf8');

            // Create a module context
            const module = { exports: {} };
            const exports = module.exports;

            // Create a synchronous require function for the plugin
            const pluginRequire = (moduleName) => {
                // This is a hack to make require work synchronously in the plugin context
                // We'll need to pre-load these modules
                if (moduleName === 'axios') {
                    // Return a placeholder that will be replaced at runtime
                    return global.__pluginModules?.axios || require('axios');
                }
                if (moduleName === 'yt-search') return global.__pluginModules?.['yt-search'] || require('yt-search');
                if (moduleName === '@whiskeysockets/baileys') return global.__pluginModules?.baileys || require('@whiskeysockets/baileys');
                if (moduleName === 'sharp') return global.__pluginModules?.sharp || require('sharp');
                if (moduleName === 'fluent-ffmpeg') return global.__pluginModules?.ffmpeg || require('fluent-ffmpeg');
                if (moduleName === 'cheerio') return global.__pluginModules?.cheerio || require('cheerio');
                if (moduleName === 'qs') return global.__pluginModules?.qs || require('qs');
                if (moduleName === 'fs') return fs;
                if (moduleName === 'path') return path;
                if (moduleName === 'os') return require('os');
                if (moduleName === 'crypto') return require('crypto');
                throw new Error(`Module ${moduleName} not found`);
            };

            // Evaluate the plugin code
            try {
                const func = new Function('require', 'module', 'exports', 'Func', code);
                func(pluginRequire, module, exports, Func);
            } catch (evalError) {
                console.error(`Error evaluating plugin ${file}:`, evalError);
                continue;
            }

            const handler = module.exports;

            if (handler && handler.command) {
                // Register all commands
                const commands = Array.isArray(handler.command) ? handler.command : [handler.command];
                commands.forEach(cmd => {
                    plugins.set(cmd, handler);
                });
            }
        } catch (e) {
            console.error(`Failed to load plugin ${file}:`, e);
        }
    }
    console.log(`Loaded ${files.length} plugins`);
};

// Pre-load common modules to avoid async issues
if (typeof global !== 'undefined') {
    global.__pluginModules = {};
    try {
        global.__pluginModules.axios = require('axios');
        global.__pluginModules['yt-search'] = require('yt-search');
        global.__pluginModules.baileys = require('@whiskeysockets/baileys');
        global.__pluginModules.sharp = require('sharp');
        global.__pluginModules.ffmpeg = require('fluent-ffmpeg');
        global.__pluginModules.cheerio = require('cheerio');
        global.__pluginModules.qs = require('qs');
    } catch (e) {
        console.log('Some plugin modules not available:', e.message);
    }
}

// Initial load
loadPlugins();

export const handleMessage = async (sock, msg, ownerId, settings = {}) => {
    if (!msg.message) return;

    // Reject if no ownerId
    if (!ownerId) {
        console.error('handleMessage called without ownerId');
        return;
    }

    const remoteJid = msg.key.remoteJid;
    const user = getUser(ownerId, remoteJid); // Ensure user exists in DB

    const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || '';

    // Update user name if available
    if (msg.pushName && user.name !== msg.pushName) {
        updateUser(ownerId, remoteJid, { name: msg.pushName });
    }

    // Settings logic
    const { prefix = '!', publicMode = true } = settings;

    // Public Mode Check
    const isOwner = remoteJid.includes(ownerId.replace(/[^0-9]/g, '')) || msg.key.fromMe;
    if (!publicMode && !isOwner && !msg.key.fromMe) {
        return; // Ignore messages from others if not in public mode
    }

    // Prefix check
    const usedPrefix = messageContent.trim().startsWith(prefix) ? prefix : null;

    if (!usedPrefix) return;

    const [commandName, ...args] = messageContent.slice(usedPrefix.length).trim().split(/\s+/);
    const plugin = plugins.get(commandName);

    if (plugin) {
        try {
            // Create message wrapper object (m)
            const m = {
                ...msg,
                chat: remoteJid,
                reply: async (text) => {
                    return await sock.sendMessage(remoteJid, { text }, { quoted: msg });
                },
                message: msg.message,
                key: msg.key
            };

            // Create context object
            const context = {
                conn: sock,
                text: args.join(' '),
                usedPrefix: usedPrefix,
                command: commandName,
                getPlugins,
                Func,
                // Database functions - Bound to ownerId for plugins
                getUser: (jid) => getUser(ownerId, jid),
                updateUser: (jid, data) => updateUser(ownerId, jid, data),
                getAllUsers: () => getAllUsers(ownerId)
            };

            // Call handler with new structure
            await plugin(m, context);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            await sock.sendMessage(remoteJid, { text: `❌ Error: ${error.message || error}` });
        }
    }
};

export const getPlugins = () => {
    // Return unique plugins (deduplicate aliases)
    const uniquePlugins = new Set(plugins.values());
    return Array.from(uniquePlugins);
};
