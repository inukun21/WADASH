const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    // Check if URL is provided
    if (!text) {
        return m.reply(`❌ Gunakan: ${usedPrefix}${command} <link tiktok>\n\nContoh: ${usedPrefix}${command} https://vt.tiktok.com/ZSjqPxxx/`);
    }

    const url = text;

    // Validate TikTok URL
    if (!url.includes('tiktok.com') && !url.includes('vt.tiktok')) {
        return m.reply('❌ Link tidak valid! Harap masukkan link TikTok yang benar.');
    }

    try {
        // Send loading message
        conn.sendMessage(m.chat, {
            react: {
                text: '⏳',
                key: m.key
            }
        });

        // Try multiple APIs in order
        const apis = [{
            name: 'TikWM',
            url: `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
            parseResponse: (data) => ({
                videoUrl: data.data?.hdplay || data.data?.play,
                metadata: {
                    title: data.data?.title,
                    stats: {
                        playCount: data.data?.play_count,
                        likeCount: data.data?.digg_count,
                        commentCount: data.data?.comment_count,
                        shareCount: data.data?.share_count
                    }
                }
            })
        }];

        let videoUrl = null;
        let metadata = {};
        let lastError = null;

        // Try each API until one works
        for (const api of apis) {
            try {
                console.log(`Trying ${api.name}:`, api.url);

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout for API

                const response = await fetch(api.url, {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                clearTimeout(timeout);

                console.log(`${api.name} Response status:`, response.status);

                if (!response.ok) {
                    throw new Error(`API returned status ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType?.includes('application/json')) {
                    console.log(`${api.name} returned non-JSON response`);
                    throw new Error('API did not return JSON');
                }

                const data = await response.json();
                console.log(`${api.name} Response:`, JSON.stringify(data).substring(0, 300));

                const parsed = api.parseResponse(data);

                if (parsed.videoUrl) {
                    videoUrl = parsed.videoUrl;
                    metadata = parsed.metadata || {};
                    console.log(`${api.name} success! Video URL found`);
                    break;
                } else {
                    throw new Error('Video URL not found in response');
                }
            } catch (error) {
                console.log(`${api.name} failed:`, error.message);
                lastError = error;
                continue;
            }
        }

        if (!videoUrl) {
            throw new Error('Semua API gagal. Kemungkinan:\n- Video private/dihapus\n- API sedang down\n- Link tidak valid\n\nCoba lagi nanti atau gunakan link lain.');
        }

        console.log('Downloading video from:', videoUrl.substring(0, 100));

        // Download video with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout for video

        const videoResponse = await fetch(videoUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.tiktok.com/'
            }
        });

        clearTimeout(timeout);

        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.status}`);
        }

        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);
        console.log('Video downloaded, size:', videoBuffer.length, 'bytes', `(${fileSizeMB}MB)`);

        // Prepare caption
        let caption = '✅ *TikTok Video Downloaded*\n\n';
        if (metadata.title) caption += `📝 *Title*: ${metadata.title}\n`;
        if (metadata.description) caption += `📄 *Description*: ${metadata.description}\n`;
        if (metadata.stats) {
            caption += `\n📊 *Statistics*:\n`;
            caption += `👁️ Views: ${metadata.stats.playCount?.toLocaleString() || 'N/A'}\n`;
            caption += `❤️ Likes: ${metadata.stats.likeCount?.toLocaleString() || 'N/A'}\n`;
            caption += `💬 Comments: ${metadata.stats.commentCount?.toLocaleString() || 'N/A'}\n`;
            caption += `🔄 Shares: ${metadata.stats.shareCount?.toLocaleString() || 'N/A'}\n`;
        }
        caption += `\n📦 *File Size*: ${fileSizeMB}MB\n`;

        // Smart file size handling
        const MAX_VIDEO_SIZE = 16 * 1024 * 1024; // 16MB - WhatsApp video limit
        const MAX_DOCUMENT_SIZE = 64 * 1024 * 1024; // 64MB - WhatsApp document limit

        if (videoBuffer.length <= MAX_VIDEO_SIZE) {
            // Option 1: Send as video (< 16MB)
            console.log('Sending as video (size within limit)');
            await conn.sendMessage(m.chat, {
                video: videoBuffer,
                caption: caption,
                mimetype: 'video/mp4'
            }, {
                quoted: m
            });
            console.log('Video sent successfully');

        } else if (videoBuffer.length <= MAX_DOCUMENT_SIZE) {
            // Option 2: Send as document (16MB - 64MB)
            console.log('Video too large for video message, sending as document');
            caption += `\n⚠️ *Note*: Video dikirim sebagai dokumen karena ukuran > 16MB\n`;

            await conn.sendMessage(m.chat, {
                document: videoBuffer,
                mimetype: 'video/mp4',
                fileName: `tiktok_${Date.now()}.mp4`,
                caption: caption
            }, {
                quoted: m
            });
            console.log('Video sent as document successfully');

        } else {
            // Option 3: Send download URL (> 64MB)
            console.log('Video too large even for document, sending URL');

            let urlMessage = '⚠️ *Video Terlalu Besar*\n\n';
            urlMessage += `📦 Ukuran file: ${fileSizeMB}MB (melebihi batas WhatsApp 64MB)\n\n`;

            if (metadata.title) urlMessage += `📝 *Title*: ${metadata.title}\n`;
            if (metadata.stats) {
                urlMessage += `\n📊 *Statistics*:\n`;
                urlMessage += `👁️ Views: ${metadata.stats.playCount?.toLocaleString() || 'N/A'}\n`;
                urlMessage += `❤️ Likes: ${metadata.stats.likeCount?.toLocaleString() || 'N/A'}\n`;
                urlMessage += `💬 Comments: ${metadata.stats.commentCount?.toLocaleString() || 'N/A'}\n`;
                urlMessage += `🔄 Shares: ${metadata.stats.shareCount?.toLocaleString() || 'N/A'}\n`;
            }

            urlMessage += `\n🔗 *Download Link*:\n${videoUrl}\n\n`;
            urlMessage += `💡 *Cara Download*:\n`;
            urlMessage += `1. Klik link di atas\n`;
            urlMessage += `2. Video akan otomatis terdownload\n`;
            urlMessage += `3. Atau klik kanan → Save As\n\n`;
            urlMessage += `⏰ Link valid selama beberapa jam`;

            await m.reply(urlMessage);
            console.log('Download URL sent successfully');
        }

    } catch (error) {
        console.error('TikTok download error:', error);

        let errorMsg = '❌ Gagal mengunduh video TikTok.\n\n';

        if (error.name === 'AbortError') {
            errorMsg += 'Error: Download timeout (video terlalu besar atau koneksi lambat)\n';
        } else {
            errorMsg += `Error: ${error.message}\n`;
        }

        errorMsg += '\n💡 Tips:\n- Pastikan link valid\n- Coba link video lain\n- Tunggu beberapa saat lalu coba lagi';

        return m.reply(errorMsg);
    }
};

handler.help = ['ttdl', 'tiktok', 'tt'];
handler.tags = ['downloader'];
handler.command = ['ttdl', 'tiktok', 'tt'];

module.exports = handler;
