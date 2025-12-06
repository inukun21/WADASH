// Jadwal Anime - Anime Release Schedule
// Feature: Get anime release schedule from Otakudesu

const axios = require('axios');
const cheerio = require('cheerio');

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

        console.log('Fetching anime schedule...');

        // Fetch anime schedule
        const response = await axios.get('https://otakudesu.cloud/jadwal-rilis/');
        const $ = cheerio.load(response.data);

        const schedule = {};

        $('.kglist321').each((i, e) => {
            let day = $(e).find('h2').text().trim().toLowerCase();
            schedule[day] = [];

            $(e).find('a').each((i, e) => {
                schedule[day].push({
                    title: $(e).text().trim(),
                    link: $(e).attr('href')
                });
            });
        });

        // Format message
        let message = '📅 *JADWAL RILIS ANIME*\n\n';

        for (const day in schedule) {
            message += `*${day.toUpperCase()}*\n`;
            schedule[day].forEach(anime => {
                message += `• ${anime.title}\n`;
            });
            message += '\n';
        }

        message += '🔗 Source: Otakudesu';

        await m.reply(message.trim());

        // Send success reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '✅',
                key: m.key
            }
        });

        console.log('Anime schedule sent successfully');

    } catch (error) {
        console.error('Jadwal anime error:', error);

        // Send error reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });

        let errorMsg = '❌ Gagal mengambil jadwal anime.\n\n';

        if (error.message.includes('getaddrinfo')) {
            errorMsg += 'Error: Website tidak dapat diakses\n';
        } else {
            errorMsg += `Error: ${error.message}\n`;
        }

        errorMsg += '\n💡 Tips:\n- Coba lagi nanti\n- Website mungkin sedang maintenance';

        return m.reply(errorMsg);
    }
};

handler.help = ['jadwalanime'];
handler.tags = ['anime'];
handler.command = ['jadwalanime', 'jadwal'];

module.exports = handler;
