// Putus - Break Up Relationship
// Feature: End current relationship

const handler = async (m, {
    conn,
    usedPrefix,
    command,
    getUser,
    updateUser,
    getAllUsers
}) => {
    try {
        const senderData = getUser(m.sender);
        const allUsers = getAllUsers();

        // Check if user has a partner
        if (!senderData.pasangan || senderData.pasangan === '') {
            return m.reply(`❌ Kamu tidak memiliki pasangan!\n\nTidak ada yang bisa diputus.`);
        }

        const partnerJid = senderData.pasangan;
        const partnerData = allUsers[partnerJid];

        // Check if it's a mutual relationship
        const isMutual = partnerData && partnerData.pasangan === m.sender;

        // Clear sender's partner
        updateUser(m.sender, {
            pasangan: ''
        });

        // Clear partner's relationship if mutual
        if (isMutual) {
            updateUser(partnerJid, {
                pasangan: ''
            });

            await conn.sendMessage(m.chat, {
                text: `💔 @${m.sender.split('@')[0]} dan @${partnerJid.split('@')[0]} telah putus\n\n` +
                    `Hubungan berakhir dengan damai.\n\n` +
                    `Semoga kalian berdua menemukan kebahagiaan masing-masing! 🕊️`,
                mentions: [m.sender, partnerJid]
            }, {
                quoted: m
            });
        } else {
            // Just cancel the proposal
            await conn.sendMessage(m.chat, {
                text: `💭 Kamu membatalkan proposal ke @${partnerJid.split('@')[0]}\n\n` +
                    `Proposal dibatalkan.\n\n` +
                    `Tidak apa-apa, masih banyak kesempatan! 💪`,
                mentions: [m.sender, partnerJid]
            }, {
                quoted: m
            });
        }

    } catch (error) {
        console.error('Putus error:', error);
        return m.reply(`❌ Terjadi kesalahan: ${error.message}`);
    }
};

handler.help = ['putus'];
handler.tags = ['fun'];
handler.command = ['putus', 'breakup', 'ikhlasin'];
handler.group = true;

module.exports = handler;
