// Cek Khodam
// Feature: Random khodam generator

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

        const cekkhodam = () => {
            const animals = [
                "Kucing", "Tikus", "Kadal", "Kuda Nil", "Bunglon", "Siput", "Koala", "Kodok",
                "Monyet", "Anjing", "Harimau", "Kuda", "Komodo", "Gajah", "Cicak", "Ular",
                "Kura-kura", "Lele", "Singa", "Zebra", "Bebek", "Ayam", "Buaya", "Gorila",
                "Naga", "Ikan", "Ubur-ubur", "Cacing", "Semut", "Udang", "Musang", "Kecoak",
                "Kupu-kupu", "Laba-laba", "Elang", "Sapi", "Kambing", "Kelinci", "Belut",
                "Berang-berang", "Hiu", "Paus", "Lumba-lumba", "Burung Hantu", "Kakaktua",
                "Merpati", "Ayam Kalkun", "Kepiting", "Lobster", "Ular Piton", "Iguana",
                "Salamander", "Katak Pohon", "Burung Pelikan", "Burung Cendrawasih", "Rubah",
                "Serigala", "Beruang", "Babi Hutan", "Kijang", "Antelop", "Jerapah",
                "Kanguru", "Wombat", "Platipus", "Tarsius", "Orangutan", "Mandril", "Panda"
            ];

            const behaviours = [
                "Jawa", "Depresi", "Mekanik", "Metal", "Insom", "Skizo", "Klepto", "Bunting",
                "Birahi", "Sigma", "Raksasa", "Berkaki Seribu", "Sad boy", "Mewing", "Gyatt",
                "Yapper", "Ambis", "Dribble", "Ngesot", "Sunda", "Kalimantan", "Kutub",
                "Sumatera", "Mendengkur", "Berjalan", "Melompat", "Terbang", "Berenang",
                "Berkelahi", "Mengunyah", "Mendaki", "Mengendus", "Memburu", "Merayap",
                "Bersarang", "Menangis", "Tertawa", "Bersorak"
            ];

            const things = [
                "Speaker JBL", "Toa Masjid", "Lemari 2 Pintu", "Kulkas", "Taplak Meja",
                "Pecel Lele", "Charger iPhone", "TWS", "Kalkulator", "Sendal Jepit",
                "Undur-undur Maju", "Bagas Dribble", "Sapu Lidi", "Gagang Pintu",
                "Tutup Toples", "Rice Cooker", "Gerobak Ketoprak", "Ban Motor",
                "Bakwan Jagung", "Kompor Gas", "Laptop", "Handphone", "Televisi",
                "Kipas Angin", "Mesin Cuci", "Sepeda Motor", "Mobil", "Traktor",
                "Oven", "Microwave", "Blender", "Lampu", "Kamera", "Proyektor",
                "Mesin Jahit", "Printer", "Dispenser", "Pemanggang Roti", "Setrika"
            ];

            const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
            const randomBehaviour = behaviours[Math.floor(Math.random() * behaviours.length)];
            const randomThing = things[Math.floor(Math.random() * things.length)];
            const randomTest = Math.random() > 0.5;

            const animalDescriptions = [
                `Khodam ini menunjukkan keberanian dan ketangkasan dari ${randomAnimal} yang ${randomBehaviour}.`,
                `${randomAnimal} yang ${randomBehaviour} membawa energi yang kuat dan melindungi Anda.`,
                `Kombinasi dari ${randomAnimal} dan ${randomBehaviour} memberikan Anda kekuatan luar biasa.`,
                `${randomAnimal} yang ${randomBehaviour} akan membantu Anda dalam mengatasi berbagai rintangan.`,
                `Keberadaan ${randomAnimal} yang ${randomBehaviour} dalam diri Anda menunjukkan sifat kepemimpinan dan kebijaksanaan.`,
            ];

            const thingDescriptions = [
                "mampu menghasilkan suara luar biasa",
                "membawa berkah dalam setiap doa",
                "menyimpan kenangan dalam pintunya",
                "menyegarkan suasana dengan dinginnya",
                "menambah keindahan meja makan",
                "menggugah selera dengan citarasa lezat",
                "menyimpan daya untuk waktu yang lama",
                "memutar musik dengan kualitas terbaik",
                "memecahkan masalah dengan perhitungan cepat",
                "menjadikan setiap langkah nyaman",
                "bergerak mundur dengan ketepatan",
                "memiliki keahlian dribble yang luar biasa",
                "membersihkan segala kotoran",
                "membuka pintu kesempatan",
                "menjaga kesegaran makanan"
            ];

            const description = randomTest
                ? animalDescriptions[Math.floor(Math.random() * animalDescriptions.length)]
                : thingDescriptions[Math.floor(Math.random() * thingDescriptions.length)];

            return {
                khodam: randomTest ? `${randomAnimal} ${randomBehaviour}` : randomThing,
                description
            };
        };

        const result = cekkhodam();

        // Safely get target user
        let targetUser = m.sender; // Default to sender
        if (m.quoted && m.quoted.sender) {
            targetUser = m.quoted.sender;
        }

        // Ensure targetUser is valid
        if (!targetUser) {
            targetUser = m.key.remoteJid; // Fallback to chat JID
        }

        const userName = targetUser.split("@")[0];

        const message = `🔮 *CEK KHODAM*\n\n` +
            `👤 *User*: @${userName}\n` +
            `✨ *Khodam*: ${result.khodam}\n\n` +
            `📝 *Penjelasan*:\n${result.description}`;

        await conn.sendMessage(m.chat, {
            text: message,
            mentions: [targetUser]
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

    } catch (error) {
        console.error('Khodam error:', error);

        conn.sendMessage(m.chat, {
            react: {
                text: '❌',
                key: m.key
            }
        });

        return m.reply(`❌ Gagal mengecek khodam.\n\nError: ${error.message}`);
    }
};

handler.help = ['cekkhodam'];
handler.tags = ['fun'];
handler.command = ['cekkodam', 'khodam', 'cekkhodam', 'ck'];

module.exports = handler;
