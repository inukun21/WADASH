// Tembak - Ajak Pacaran
// Feature: Relationship system

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
        // Mentioned user
        const number = cleanText.split('@')[1];
        targetJid = number + '@s.whatsapp.net';
    } else if (!isNaN(cleanText) && cleanText) {
        // Phone number
        targetJid = cleanText + '@s.whatsapp.net';
    } else if (m.quoted) {
        // Quoted message
        targetJid = m.quoted.sender;
    } else {
        return m.reply(`❌ Gunakan: ${usedPrefix}${command} @user\n\nContoh: ${usedPrefix}${command} @6281234567890`);
    }

    // Validations
    if (targetJid === m.sender) {
        return m.reply('❌ Tidak bisa berpacaran dengan diri sendiri!');
    }

    if (targetJid === conn.user.jid) {
        return m.reply('❌ Tidak bisa berpacaran dengan bot!');
    }

    try {
        // Get user data
        const senderData = getUser(m.sender);
        const targetData = getUser(targetJid);
        const allUsers = getAllUsers();

        // Check if sender already has a partner
        if (senderData.pasangan && senderData.pasangan !== '') {
            const partnerData = allUsers[senderData.pasangan];

            // Check if it's a mutual relationship
            if (partnerData && partnerData.pasangan === m.sender && senderData.pasangan !== targetJid) {
                return conn.sendMessage(m.chat, {
                    text: `❌ Kamu sudah berpacaran dengan @${senderData.pasangan.split('@')[0]}\n\n` +
                        `Silahkan putus dulu dengan ${usedPrefix}putus untuk menembak @${targetJid.split('@')[0]}\n\n` +
                        `Setia dong! 💔`,
                    mentions: [senderData.pasangan, targetJid]
                }, {
                    quoted: m
                });
            }
        }

        // Check if target already has a partner
        if (targetData.pasangan && targetData.pasangan !== '') {
            const targetPartnerData = allUsers[targetData.pasangan];

            // Check if it's a mutual relationship
            if (targetPartnerData && targetPartnerData.pasangan === targetJid) {
                // If sender is trying to ask their own partner again
                if (m.sender === targetData.pasangan && senderData.pasangan === targetJid) {
                    return conn.sendMessage(m.chat, {
                        text: `❤️ Kamu sudah berpacaran dengan @${targetJid.split('@')[0]}\n\nSetia dong! 💕`,
                        mentions: [targetJid]
                    }, {
                        quoted: m
                    });
                }

                // Target is in a relationship with someone else
                return conn.sendMessage(m.chat, {
                    text: `❌ Tau sopan santun dikit teman\n\n` +
                        `@${targetJid.split('@')[0]} sudah berpacaran dengan @${targetData.pasangan.split('@')[0]}\n\n` +
                        `Silahkan cari pasangan lain aja! 💔`,
                    mentions: [targetJid, targetData.pasangan]
                }, {
                    quoted: m
                });
            }
        }

        // Check if target already asked sender
        if (targetData.pasangan === m.sender) {
            // Auto accept - mutual relationship
            updateUser(m.sender, {
                pasangan: targetJid
            });

            return conn.sendMessage(m.chat, {
                text: `🎉 Selamat! Kamu resmi berpacaran dengan @${targetJid.split('@')[0]}\n\n` +
                    `Semoga langgeng dan bahagia selalu! 💕💕💕`,
                mentions: [targetJid]
            }, {
                quoted: m
            });
        }

        // Send proposal
        updateUser(m.sender, {
            pasangan: targetJid
        });

        await conn.sendMessage(m.chat, {
            text: `💌 Kamu baru saja mengajak @${targetJid.split('@')[0]} berpacaran\n\n` +
                `Silahkan menunggu jawabannya saja ya!\n\n` +
                `Ketik ${usedPrefix}terima @${m.sender.split('@')[0]} atau ${usedPrefix}tolak @${m.sender.split('@')[0]}`,
            mentions: [targetJid, m.sender]
        }, {
            quoted: m
        });

    } catch (error) {
        console.error('Tembak error:', error);
        return m.reply(`❌ Terjadi kesalahan: ${error.message}`);
    }
};

handler.help = ['tembak'];
handler.tags = ['fun'];
handler.command = ['tembak'];
handler.group = true;

module.exports = handler;
