// Random Japan Image
// Feature: Random image from GitHub database

const handler = async (m, {
    conn,
    text,
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

        console.log(`Fetching ${command} images from database...`);

        // Fetch image URLs from GitHub database
        const response = await fetch(
            `https://github.com/ArifzynXD/database/raw/master/asupan/${command}.json`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error('No images found in database');
        }

        // Get random image URL
        const randomImage = data[Math.floor(Math.random() * data.length)];
        const imageUrl = randomImage.url || randomImage;

        console.log(`Sending random ${command} image...`);

        // Send image
        await conn.sendMessage(m.chat, {
            image: {
                url: imageUrl
            },
            caption: `✅ *Random ${command.toUpperCase()} Image*\n\n📸 Image ${Math.floor(Math.random() * data.length) + 1}/${data.length}\n🔗 Source: GitHub Database`
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

        console.log('Image sent successfully');

    } catch (error) {
        console.error(`${command} error:`, error);

        // Send error reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });

        let errorMsg = `❌ Gagal mengambil gambar ${command}.\n\n`;

        if (error.message.includes('Failed to fetch')) {
            errorMsg += 'Error: Database tidak dapat diakses\n';
        } else if (error.message.includes('No images found')) {
            errorMsg += 'Error: Tidak ada gambar di database\n';
        } else {
            errorMsg += `Error: ${error.message}\n`;
        }

        errorMsg += '\n💡 Tips:\n- Coba lagi nanti\n- Database mungkin sedang maintenance';

        return m.reply(errorMsg);
    }
};

handler.help = ['japan'];
handler.tags = ['fun'];
handler.command = ['japan'];

module.exports = handler;
