// Tau Gasih / Tahukah Kamu
// Feature: Random fun facts

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

        console.log('Fetching fun fact...');

        // Fetch fun fact from API
        const response = await fetch('https://api.alfixd.my.id/api/tahukahkamu');

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const json = await response.json();

        if (!json.result) {
            throw new Error('No result from API');
        }

        const message = `💡 *TAHUKAH KAMU?*\n\n${json.result}`;

        await m.reply(message);

        // Send success reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '✅',
                key: m.key
            }
        });

        console.log('Fun fact sent successfully');

    } catch (error) {
        console.error('Taugasih error:', error);

        // Send error reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });

        let errorMsg = '❌ Gagal mengambil fakta menarik.\n\n';

        if (error.message.includes('API returned status')) {
            errorMsg += 'Error: API tidak dapat diakses\n';
        } else if (error.message.includes('No result')) {
            errorMsg += 'Error: Tidak ada data dari API\n';
        } else {
            errorMsg += `Error: ${error.message}\n`;
        }

        errorMsg += '\n💡 Tips:\n- Coba lagi nanti\n- API mungkin sedang maintenance';

        return m.reply(errorMsg);
    }
};

handler.help = ['tahugasih', 'taugasih'];
handler.tags = ['fun'];
handler.command = ['taugasih', 'tahugasih'];

module.exports = handler;
