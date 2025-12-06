// Waifu - Random Waifu Image
// Feature: Random waifu anime image from API

const handler = async (m, {
    conn,
    usedPrefix,
    command
}) => {
    try {
        // Send loading reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '⏳',
                key: m.key
            }
        });

        console.log('Fetching waifu image...');

        // Fetch waifu image from API
        const response = await fetch('https://api.waifu.pics/sfw/waifu');

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const json = await response.json();

        if (!json.url) {
            throw new Error('No image URL from API');
        }

        console.log('Sending waifu image...');

        // Send image
        await conn.sendMessage(m.chat, {
            image: {
                url: json.url
            },
            caption: '✨ *Random Waifu*\n\nWaifunya Kak... 💕'
        }, {
            quoted: m
        });

        // Send success reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '✅',
                key: m.key
            }
        });

        console.log('Waifu image sent successfully');

    } catch (error) {
        console.error('Waifu error:', error);

        // Send error reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });

        let errorMsg = '❌ Gagal mengambil gambar waifu.\n\n';

        if (error.message.includes('API returned status')) {
            errorMsg += 'Error: API tidak dapat diakses\n';
        } else if (error.message.includes('No image URL')) {
            errorMsg += 'Error: Tidak ada gambar dari API\n';
        } else {
            errorMsg += `Error: ${error.message}\n`;
        }

        errorMsg += '\n💡 Tips:\n- Coba lagi nanti\n- API mungkin sedang maintenance';

        return m.reply(errorMsg);
    }
};

handler.help = ['waifu'];
handler.tags = ['anime'];
handler.command = ['waifu'];

module.exports = handler;
