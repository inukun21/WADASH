const handler = async (m, {
    conn,
    usedPrefix,
    getPlugins
}) => {
    const plugins = getPlugins();
    let menuText = '🤖 *WADASH BOT MENU* 🤖\n\n';

    const categories = {};
    plugins.forEach(plugin => {
        const category = plugin.tags?.[0] || 'main';
        if (!categories[category]) categories[category] = [];
        categories[category].push(plugin);
    });

    for (const category in categories) {
        menuText += `*${category.toUpperCase()}*\n`;
        categories[category].forEach(plugin => {
            const cmd = plugin.command?.[0] || plugin.help?.[0];
            const desc = plugin.help?.[0] || cmd;
            menuText += `➤ ${usedPrefix}${cmd} - ${desc}\n`;
        });
        menuText += '\n';
    }

    await conn.sendMessage(m.chat, {
        text: menuText
    }, {
        quoted: m
    });
};

handler.help = ['menu', 'help', 'm'];
handler.tags = ['main'];
handler.command = ['menu', 'help', 'm'];

module.exports = handler;
