// Cek Sifat
// Feature: Random personality traits generator

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command
}) => {
    if (!text) {
        return m.reply(`❌ Gunakan: ${usedPrefix}${command} <nama>\n\nContoh: ${usedPrefix}${command} Budi`);
    }

    try {
        // Send loading reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '⏳',
                key: m.key
            }
        });

        const pickRandom = (list) => {
            return list[Math.floor(Math.random() * list.length)];
        };

        const percentages = ["6%", "12%", "20%", "27%", "35%", "41%", "49%", "54%", "60%", "66%", "73%", "78%", "84%", "92%", "93%", "94%", "96%", "98.3%", "99.7%", "99.9%", "1%", "2.9%", "0%", "0.4%"];

        const personalities = ["Baik Hati", "Sombong", "Pelit", "Dermawan", "Rendah Hati", "Rendah Diri", "Pemalu", "Penakut", "Pengusil", "Cengeng"];

        const behaviors = ["Rajin", "Malas", "Membantu", "Ngegosip", "Jail", "Gak jelas", "Shopping", "Chattan sama Doi", "Chattan di WA karna Jomblo", "Sedih", "Kesepian", "Bahagia", "Ngoding tiap hari"];

        const message = `╭━━━━°「 *Sifat ${text}* 」°\n` +
            `┃\n` +
            `┊• Nama : ${text}\n` +
            `┃• Ahlak Baik : ${pickRandom(percentages)}\n` +
            `┊• Ahlak Buruk : ${pickRandom(percentages)}\n` +
            `┃• Orang yang : ${pickRandom(personalities)}\n` +
            `┊• Selalu : ${pickRandom(behaviors)}\n` +
            `┃• Kecerdasan : ${pickRandom(percentages)}\n` +
            `┊• Kenakalan : ${pickRandom(percentages)}\n` +
            `┃• Keberanian : ${pickRandom(percentages)}\n` +
            `┊• Ketakutan : ${pickRandom(percentages)}\n` +
            `╰═┅═━––––––๑`;

        await m.reply(message);

        // Send success reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '✅',
                key: m.key
            }
        });

    } catch (error) {
        console.error('Ceksifat error:', error);

        conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });

        return m.reply(`❌ Gagal mengecek sifat.\n\nError: ${error.message}`);
    }
};

handler.help = ['ceksifat'];
handler.tags = ['fun'];
handler.command = ['ceksifat'];

module.exports = handler;
