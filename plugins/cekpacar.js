// Cek Pacar - Check Relationship Status
// Feature: Check someone's relationship status

const handler = async (m, {
    conn,
    text,
    usedPrefix,
    command,
    getUser,
    getAllUsers
}) => {
    // Helper function to extract phone number
    function no(number) {
        if (!number) return '';
        return number.replace(/\s/g, '').replace(/([@+-])/g, '');
    }

    // Determine target user
    let targetJid;
    let targetName;

    // Check if there's a quoted message first
    if (m.quoted && m.quoted.sender) {
        targetJid = m.quoted.sender;
        targetName = "Orang yang kamu tag";
    } else if (text && text.trim()) {
        // Has text input
        const cleanText = no(text);

        if (isNaN(cleanText)) {
            // Mentioned user (@user)
            const number = cleanText.split('@')[1];
            if (number) {
                targetJid = number + '@s.whatsapp.net';
                targetName = "Orang yang kamu tag";
            } else {
                // Invalid mention, check own status
                targetJid = m.sender;
                targetName = "Kamu";
            }
        } else if (cleanText) {
            // Phone number
            targetJid = cleanText + '@s.whatsapp.net';
            targetName = "Orang yang kamu tag";
        } else {
            // Empty text, check own status
            targetJid = m.sender;
            targetName = "Kamu";
        }
    } else {
        // No text and no quoted, check own status
        targetJid = m.sender;
        targetName = "Kamu";
    }

    try {
        const targetData = getUser(targetJid);
        const allUsers = getAllUsers();

        // Check if user has no partner
        if (!targetData.pasangan || targetData.pasangan === '') {
            return conn.sendMessage(m.chat, {
                text: `💔 *${targetName}* tidak memiliki pasangan dan tidak sedang menembak siapapun\n\n` +
                    `Ketik ${usedPrefix}tembak @user untuk menembak seseorang`,
                mentions: [targetJid]
            }, {
                quoted: m
            });
        }

        const partnerData = allUsers[targetData.pasangan];

        // Check if it's not a mutual relationship
        if (!partnerData || partnerData.pasangan !== targetJid) {
            return conn.sendMessage(m.chat, {
                text: `💭 *${targetName}* sedang menunggu jawaban dari @${targetData.pasangan.split('@')[0]}\n\n` +
                    `Status: Menembak (belum diterima/ditolak)\n\n` +
                    `Semoga berhasil! 🤞`,
                mentions: [targetJid, targetData.pasangan]
            }, {
                quoted: m
            });
        }

        // Mutual relationship
        return conn.sendMessage(m.chat, {
            text: `💑 *${targetName}* sedang menjalani hubungan dengan @${targetData.pasangan.split('@')[0]} 💕\n\n` +
                `Status: Berpacaran\n\n` +
                `Semoga langgeng! 🥳`,
            mentions: [targetJid, targetData.pasangan]
        }, {
            quoted: m
        });

    } catch (error) {
        console.error('Cekpacar error:', error);
        return m.reply(`❌ Terjadi kesalahan: ${error.message}`);
    }
};

handler.help = ['cekpacar'];
handler.tags = ['fun'];
handler.command = ['cekpacar', 'cekpasangan'];
handler.group = true;

module.exports = handler;
