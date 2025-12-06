// Neko - Random Neko Image
// Feature: Random neko anime image

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

        console.log('Fetching neko image...');

        // Fetch neko image list from GitHub
        const response = await fetch('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/random/anime/neko.txt');

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const text = await response.text();
        const nekoList = text.split('\n').filter(url => url.trim());

        if (nekoList.length === 0) {
            throw new Error('No neko images found');
        }

        // Pick random neko
        const randomNeko = nekoList[Math.floor(Math.random() * nekoList.length)];

        console.log('Sending neko image...');

        // Send image
        await conn.sendMessage(m.chat, {
            image: {
                url: randomNeko
            },
            caption: '🐾 *Random Neko*\n\nNih Neko nya 🐾💗'
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

        console.log('Neko image sent successfully');

    } catch (error) {
        console.error('Neko error:', error);

        // Send error reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });

        let errorMsg = '❌ Gagal mengambil gambar neko.\n\n';

        if (error.message.includes('Failed to fetch')) {
            errorMsg += 'Error: Database tidak dapat diakses\n';
        } else if (error.message.includes('No neko images')) {
            errorMsg += 'Error: Tidak ada gambar di database\n';
        } else {
            errorMsg += `Error: ${error.message}\n`;
        }

        errorMsg += '\n💡 Tips:\n- Coba lagi nanti\n- Database mungkin sedang maintenance';

        return m.reply(errorMsg);
    }
};

handler.help = ['neko'];
handler.tags = ['anime'];
handler.command = ['neko'];

module.exports = handler;
