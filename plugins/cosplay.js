// Cosplay - Random Cosplay Image
// Feature: Random cosplay anime image

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

        console.log('Fetching cosplay image...');

        const cosplayImages = [
            "https://i.pinimg.com/originals/13/8f/a9/138fa9fab411166bb8c5523bf710ff42.jpg",
            "https://i.pinimg.com/564x/c3/11/9a/c3119aef29726b78b9f0509aa40ccb3b.jpg",
            "https://i.pinimg.com/originals/18/05/40/18054035c2adc989580043b4391e20af.jpg",
            "https://i.pinimg.com/736x/7c/0a/4b/7c0a4bd43596226b6311b8aae2b02408.jpg",
            "https://i.pinimg.com/originals/3d/fe/1d/3dfe1d00cff5b517d4eb56e5297abae9.jpg",
            "https://i.pinimg.com/originals/77/dd/ef/77ddefdd397d0730db97d848781e4df7.jpg",
            "https://i.pinimg.com/736x/43/d9/7d/43d97d69e6552e80da086cd91557c826.jpg",
            "https://i.pinimg.com/originals/e5/f2/86/e5f286ded660f38e8f4db73c8dfafba8.jpg",
            "https://i.pinimg.com/474x/9f/6f/71/9f6f7189691c533cd88ef656ce23bcbb.jpg",
            "https://i.pinimg.com/736x/0d/b8/44/0db844fa29b995dd699bfb9172fad779.jpg",
            "https://i.pinimg.com/736x/41/c3/49/41c349749124411f4b4c0b928eb46207.jpg",
            "https://i.pinimg.com/originals/c6/f7/bf/c6f7bfb44f0c964104ca36c8ee388f71.jpg",
            "https://i.pinimg.com/736x/1e/c5/c3/1ec5c36b3dfa5f1bef5847def89f8df6.jpg",
            "https://i.pinimg.com/originals/76/b6/1a/76b61aebdbc05551c9d8714014d7a30d.jpg",
            "https://i.pinimg.com/originals/3a/3e/fc/3a3efc8f03eb6122b0e04841f4177c2c.jpg",
            "https://i.pinimg.com/originals/77/ae/d7/77aed75e4e9f6bf317f8ca9e872d172a.jpg",
            "https://i.pinimg.com/originals/0d/d5/02/0dd5028b7f3e2e660b78aadb5ee1ecee.jpg",
            "https://i.pinimg.com/474x/9b/b2/d7/9bb2d7e9ca23a61c49c3a9428d6ccb3e.jpg",
            "https://i.pinimg.com/236x/c8/23/40/c82340db05d9ef61411a9d5837eeb2a3.jpg",
            "https://i.pinimg.com/736x/3c/2a/6b/3c2a6b131b6d1377ca31b1cee9eb5e5d.jpg",
            "https://i.pinimg.com/originals/cf/3c/2b/cf3c2bf2ce5ae2555dda6cadf11a67a7.jpg",
            "https://i.pinimg.com/236x/c3/16/e5/c316e5eb1367be33993d2266cc839062.jpg",
            "https://i.pinimg.com/originals/2c/8f/4b/2c8f4bf86a5b05df761cfd0244d37b4d.jpg",
            "https://i.pinimg.com/736x/b4/83/04/b48304a92e85c4eba37b82fdd5d08434.jpg",
            "https://i.pinimg.com/originals/75/b3/99/75b399a50c4ac54e49261dd6e0f81a5b.jpg",
            "https://i.pinimg.com/originals/dd/02/c5/dd02c512af2a70a9840ffab06eb74f4e.jpg",
            "https://i.pinimg.com/originals/53/0a/6d/530a6d47fa85f639587e0c7b54c4457d.jpg",
            "https://i.pinimg.com/originals/1c/eb/aa/1cebaa84d93f590f15933e78efc94f4b.jpg",
            "https://i.pinimg.com/736x/de/e9/68/dee968195b668d1bfd021cedc79cd5ab.jpg",
            "https://i.pinimg.com/originals/20/d9/57/20d957c9ad8d0691768a8968152a311d.jpg"
        ];

        // Pick random cosplay
        const randomCosplay = cosplayImages[Math.floor(Math.random() * cosplayImages.length)];

        console.log('Sending cosplay image...');

        // Send image
        await conn.sendMessage(m.chat, {
            image: {
                url: randomCosplay
            },
            caption: '🎭 *Random Cosplay*\n\nNih Random Cosplaynya.. 💫'
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

        console.log('Cosplay image sent successfully');

    } catch (error) {
        console.error('Cosplay error:', error);

        // Send error reaction
        conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });

        return m.reply(`❌ Gagal mengambil gambar cosplay.\n\nError: ${error.message}`);
    }
};

handler.help = ['cosplay'];
handler.tags = ['anime'];
handler.command = ['cosplay'];

module.exports = handler;
