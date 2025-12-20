// Terima - Accept Relationship Proposal
// Feature: Accept partner proposal

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
        const allUsers = getAllUsers();

        // Check if target has proposed to sender
        if (targetData.pasangan !== m.sender) {
            return m.reply(`❌ @${targetJid.split('@')[0]} tidak menembak kamu!\n\nTidak ada proposal untuk diterima.`);
        }

        // Check if sender already has a partner
        if (senderData.pasangan && senderData.pasangan !== '') {
            const partnerData = allUsers[senderData.pasangan];

            if (partnerData && partnerData.pasangan === m.sender && senderData.pasangan !== targetJid) {
                return conn.sendMessage(m.chat, {
                    text: `❌ Kamu sudah berpacaran dengan @${senderData.pasangan.split('@')[0]}\n\n` +
                        `Putus dulu dengan ${usedPrefix}putus sebelum menerima yang lain!\n\n` +
                        `Setia dong! 💔`,
                    mentions: [senderData.pasangan]
                }, {
                    quoted: m
                });
            }
        }

        // Accept the proposal
        updateUser(m.sender, {
            pasangan: targetJid
        });

        await conn.sendMessage(m.chat, {
            text: `🎉 Selamat! @${m.sender.split('@')[0]} menerima @${targetJid.split('@')[0]}\n\n` +
                `Kalian resmi berpacaran! 💕\n\n` +
                `Semoga langgeng dan bahagia selalu! 💑`,
            mentions: [m.sender, targetJid]
        }, {
            quoted: m
        });

    } catch (error) {
        console.error('Terima error:', error);
        return m.reply(`❌ Terjadi kesalahan: ${error.message}`);
    }
};

handler.help = ['terima'];
handler.tags = ['fun'];
handler.command = ['terima', 'accept'];
handler.group = true;

module.exports = handler;
