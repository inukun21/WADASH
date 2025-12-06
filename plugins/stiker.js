const {
    downloadMediaMessage
} = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const {
    tmpdir
} = require('os');
const crypto = require('crypto');

const handler = async (m, {
    conn
}) => {
    // Check if message is image or video
    const type = Object.keys(m.message)[0];
    const isImage = type === 'imageMessage';
    const isVideo = type === 'videoMessage';
    const isQuotedImage = type === 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo?.quotedMessage?.imageMessage;
    const isQuotedVideo = type === 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo?.quotedMessage?.videoMessage;

    if (!isImage && !isVideo && !isQuotedImage && !isQuotedVideo) {
        return m.reply('❌ Kirim gambar/video dengan caption !stiker atau reply gambar/video.');
    }

    try {
        // Download media
        const messageToDownload = isQuotedImage || isQuotedVideo ? m.message.extendedTextMessage.contextInfo.quotedMessage : m.message;
        const buffer = await downloadMediaMessage({
            message: messageToDownload,
            key: m.key
        },
            'buffer', {}, {
            logger: console,
            reuploadRequest: conn.updateMediaMessage
        }
        );

        const tempFile = path.join(tmpdir(), `${crypto.randomBytes(16).toString('hex')}`);

        if (isImage || isQuotedImage) {
            // Process image
            const webpBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: {
                        r: 0,
                        g: 0,
                        b: 0,
                        alpha: 0
                    }
                })
                .webp({
                    quality: 90
                })
                .toBuffer();

            await conn.sendMessage(m.chat, {
                sticker: webpBuffer
            }, {
                quoted: m
            });
        } else {
            // Process video
            const inputPath = tempFile + '.mp4';
            const outputPath = tempFile + '.webp';

            fs.writeFileSync(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .outputOptions([
                        '-vcodec', 'libwebp',
                        '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0',
                        '-loop', '0',
                        '-preset', 'default',
                        '-an',
                        '-vsync', '0',
                        '-s', '512:512'
                    ])
                    .toFormat('webp')
                    .on('end', () => resolve())
                    .on('error', (err) => reject(err))
                    .save(outputPath);
            });

            const stickerBuffer = fs.readFileSync(outputPath);
            await conn.sendMessage(m.chat, {
                sticker: stickerBuffer
            }, {
                quoted: m
            });

            // Cleanup
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);
        }
    } catch (error) {
        console.error('Error creating sticker:', error);
        return m.reply('❌ Gagal membuat stiker. Pastikan file tidak terlalu besar.');
    }
};

handler.help = ['stiker', 's', 'stick', 'sticker'];
handler.tags = ['tools'];
handler.command = ['stiker', 's', 'stick', 'sticker'];

module.exports = handler;
