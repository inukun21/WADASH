const handler = async (m, {
    conn
}) => {
    const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
        + 'VERSION:3.0\n'
        + 'FN:Owner Bot\n' // full name
        + 'ORG:WADASH;\n' // the organization of the contact
        + 'TEL;type=CELL;type=VOICE;waid=6283175858167:+62 831-7585-8167\n' // WhatsApp ID + phone number
        + 'END:VCARD';

    await conn.sendMessage(m.chat, {
        contacts: {
            displayName: 'Owner Bot',
            contacts: [{
                vcard
            }]
        }
    }, {
        quoted: m
    });
};

handler.help = ['owner', 'creator'];
handler.tags = ['info'];
handler.command = ['owner', 'creator'];

module.exports = handler;
