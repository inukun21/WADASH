// Tolak - Reject Relationship Proposal
// Feature: Reject partner proposal

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command,
    getUser,
    updateUser,
    getAllUsers
}) => {
    // Helper function to extract phone number
    function no(number) {
        if (!number) return '';
        return number.replace(/\s/g, '').replace(/([@+-])/g, '');
    }

    const cleanText = no(text);

    // Determine target user
    let targetJid;
    if (isNaN(cleanText)) {
        const number = cleanText.split('@')[1];
        targetJid = number + '@s.whatsapp.net';
    } else if (!isNaN(cleanText) && cleanText) {
        targetJid = cleanText + '@s.whatsapp.net';
    } else if (m.quoted) {
        targetJid = m.quoted.sender;
    } else {
        return m.reply(`❌ Gunakan: ${usedPrefix}${command} @user\n\nContoh: ${usedPrefix}${command} @6281234567890`);
    }

    try {
        const senderData = getUser(m.sender);
        const targetData = getUser(targetJid);

        // Check if target has proposed to sender
        if (targetData.pasangan !== m.sender) {
            return m.reply(`❌ @${targetJid.split('@')[0]} tidak menembak kamu!\n\nTidak ada proposal untuk ditolak.`);
        }

        // Reject the proposal - clear target's pasangan
        updateUser(targetJid, {
            pasangan: ''
        });

        await conn.sendMessage(m.chat, {
            text: `💔 @${m.sender.split('@')[0]} menolak @${targetJid.split('@')[0]}\n\n` +
                `Sabar ya, masih banyak ikan di laut! 🐟\n\n` +
                `Jangan menyerah! 💪`,
            mentions: [m.sender, targetJid]
        }, {
            quoted: m
        });

    } catch (error) {
        console.error('Tolak error:', error);
        return m.reply(`❌ Terjadi kesalahan: ${error.message}`);
    }
};

handler.help = ['tolak'];
handler.tags = ['fun'];
handler.command = ['tolak', 'reject'];
handler.group = true;

module.exports = handler;
