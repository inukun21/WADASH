// Simple Base Botz
// • Credits : wa.me/62895322391225 [ Asyl ]
// • Feature : tools/bstation

const axios = require('axios');
const cheerio = require('cheerio');

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    // Validate URL
    if (!text) {
        return m.reply(`❌ Gunakan: ${usedPrefix}${command} <bilibili url>\n\nContoh: ${usedPrefix}${command} https://www.bilibili.com/video/xxxxx/`);
    }

    if (!/www.bilibili.com|bili.im/.test(text)) {
        return m.reply(`❌ Link tidak valid! Harap masukkan link Bilibili/Bstation yang benar.`);
    }

    try {
        // Send loading reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '⏳',
                key: m.key
            }
        });

        // Fetch video data
        console.log('Fetching Bilibili video:', text);
        const result = await bstation(text, '720');

        if (!result.content || result.status !== 200) {
            throw new Error('Gagal mengambil data video');
        }

        const metadata = result.result.metadata;
        const download = result.result.download;

        // Prepare caption
        let caption = '✅ *Bilibili/Bstation Downloader*\n\n';
        if (metadata.title) caption += `📙 *Title*: ${metadata.title}\n`;
        if (metadata.locate) caption += `🗾 *Locale*: ${metadata.locate}\n`;
        if (metadata.like) caption += `♥️ *Likes*: ${metadata.like}\n`;
        if (metadata.view) caption += `👁️ *Views*: ${metadata.view}\n`;
        if (metadata.description) caption += `\n📝 *Description*:\n${metadata.description.substring(0, 200)}${metadata.description.length > 200 ? '...' : ''}\n`;
        if (metadata.url) caption += `\n🔗 *Link*: ${metadata.url}`;

        // Send thumbnail with metadata
        if (metadata.thumbnail) {
            await conn.sendMessage(m.chat, {
                image: {
                    url: metadata.thumbnail
                },
                caption: caption
            }, {
                quoted: m
            });
        }

        // Download video
        if (!download || !download.url) {
            throw new Error('URL download tidak tersedia');
        }

        console.log('Downloading video from:', download.url.substring(0, 100));

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

        const {
            data
        } = await axios.get(download.url, {
            responseType: 'arraybuffer',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        clearTimeout(timeout);

        const videoBuffer = Buffer.from(data);
        const fileSizeMB = (videoBuffer.length / (1024 * 1024)).toFixed(2);
        console.log('Video downloaded, size:', videoBuffer.length, 'bytes', `(${fileSizeMB}MB)`);

        // Prepare video caption
        let videoCaption = '✅ *Bilibili Video*\n\n';
        if (metadata.title) videoCaption += `📙 *Title*: ${metadata.title}\n`;
        if (metadata.locate) videoCaption += `🗾 *Locale*: ${metadata.locate}\n`;
        if (metadata.url) videoCaption += `🔗 *Link*: ${metadata.url}\n`;
        videoCaption += `📦 *Size*: ${fileSizeMB}MB`;

        // Smart file size handling
        const MAX_VIDEO_SIZE = 16 * 1024 * 1024; // 16MB
        const MAX_DOCUMENT_SIZE = 64 * 1024 * 1024; // 64MB

        if (videoBuffer.length <= MAX_VIDEO_SIZE) {
            // Send as video
            console.log('Sending as video (size within limit)');
            await conn.sendMessage(m.chat, {
                video: videoBuffer,
                caption: videoCaption,
                mimetype: 'video/mp4'
            }, {
                quoted: m
            });
            console.log('Video sent successfully');

        } else if (videoBuffer.length <= MAX_DOCUMENT_SIZE) {
            // Send as document
            console.log('Video too large for video message, sending as document');
            videoCaption += `\n⚠️ *Note*: Video dikirim sebagai dokumen karena ukuran > 16MB`;

            await conn.sendMessage(m.chat, {
                document: videoBuffer,
                mimetype: 'video/mp4',
                fileName: `bilibili_${Date.now()}.mp4`,
                caption: videoCaption
            }, {
                quoted: m
            });
            console.log('Video sent as document successfully');

        } else {
            // Send download URL
            console.log('Video too large even for document, sending URL');

            let urlMessage = '⚠️ *Video Terlalu Besar*\n\n';
            urlMessage += `📦 Ukuran file: ${fileSizeMB}MB (melebihi batas WhatsApp 64MB)\n\n`;
            if (metadata.title) urlMessage += `📙 *Title*: ${metadata.title}\n`;
            urlMessage += `\n🔗 *Download Link*:\n${download.url}\n\n`;
            urlMessage += `💡 *Cara Download*:\n`;
            urlMessage += `1. Klik link di atas\n`;
            urlMessage += `2. Video akan otomatis terdownload\n`;
            urlMessage += `3. Atau klik kanan → Save As\n\n`;
            urlMessage += `⏰ Link valid selama beberapa jam`;

            await m.reply(urlMessage);
            console.log('Download URL sent successfully');
        }

        // Send success reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '✅',
                key: m.key
            }
        });

    } catch (error) {
        console.error('Bilibili download error:', error);

        // Send error reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });

        let errorMsg = '❌ Gagal mengunduh video Bilibili.\n\n';

        if (error.name === 'AbortError') {
            errorMsg += 'Error: Download timeout (video terlalu besar atau koneksi lambat)\n';
        } else if (error.message.includes('URL download tidak tersedia')) {
            errorMsg += 'Error: Video tidak dapat didownload (mungkin private atau region-locked)\n';
        } else if (error.message.includes('522') || error.code === 'ERR_BAD_RESPONSE') {
            errorMsg += 'Error: API download sedang tidak tersedia (Error 522)\n';
            errorMsg += 'API c.blahaj.ca sedang mengalami masalah atau timeout.\n';
        } else if (error.message.includes('Gagal mengambil data video')) {
            errorMsg += 'Error: Tidak dapat mengambil informasi video\n';
            errorMsg += 'Kemungkinan:\n';
            errorMsg += '- Video private atau region-locked\n';
            errorMsg += '- Link tidak valid\n';
            errorMsg += '- API sedang down\n';
        } else {
            errorMsg += `Error: ${error.message}\n`;
        }

        errorMsg += '\n💡 Tips:\n- Pastikan link valid dan public\n- Coba link video lain\n- Tunggu beberapa saat lalu coba lagi\n- API mungkin sedang maintenance';

        return m.reply(errorMsg);
    }
};

handler.help = ['bstation', 'bilibili'];
handler.tags = ['downloader', 'anime'];
handler.command = ['bstation', 'bilibili', 'bili'];

module.exports = handler;

// ============================================
// BILIBILI SCRAPER FUNCTIONS
// ============================================

async function bstation(url, quality) {
    const scrapedData = {
        status: 500,
        content: false,
        result: {
            metadata: {},
            download: {}
        }
    };

    try {
        const format = ["max", "4320", "2160", "1440", "1080", "720", "480", "360", "240", "144", "320", "256", "128", "96", "64", "8"];

        if (!/www.bilibili.com|bili.im/.test(url)) {
            throw new Error('⚠️ Masukan Link Bstation yang valid!');
        }

        if (!format.includes(quality)) {
            throw new Error(`⚠️ Quality tidak valid. Pilihan: ${format.join(', ')}`);
        }

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const finalurl = response.request.res.responseUrl || url;

        scrapedData.status = 200;
        scrapedData.content = true;
        scrapedData.result.metadata.title = $('title').text().trim() || null;
        scrapedData.result.metadata.locate = $('meta[property="og:locale"]').attr('content') || null;
        scrapedData.result.metadata.description = $('meta[name="description"]').attr('content') || null;
        scrapedData.result.metadata.thumbnail = $('meta[property="og:image"]').attr('content') || null;
        scrapedData.result.metadata.like = $('.interactive__btn.interactive__like .interactive__text').text() || null;
        scrapedData.result.metadata.view = $('.bstar-meta__tips-left .bstar-meta-text').first().text() || null;
        scrapedData.result.metadata.url = finalurl;

        // Try to get download link with timeout
        try {
            const download = await axios.post("https://c.blahaj.ca/", {
                url: finalurl,
                videoQuality: quality,
                downloadMode: "auto"
            }, {
                headers: {
                    Accept: "application/json",
                    "Content-type": "application/json"
                },
                timeout: 30000 // 30 second timeout
            }).then(a => a.data);

            scrapedData.result.download = download || null;
        } catch (apiError) {
            console.error('Download API error:', apiError.message);
            // If API fails, still return metadata but mark download as unavailable
            scrapedData.result.download = {
                error: `API tidak tersedia: ${apiError.message}`,
                url: null
            };
        }

        return scrapedData;

    } catch (e) {
        scrapedData.status = 500;
        scrapedData.content = false;
        scrapedData.result.metadata = {
            error: e.message
        };
        scrapedData.result.download = {
            error: e.message
        };
        console.error('Bstation scraper error:', e);
        return scrapedData;
    }
}
