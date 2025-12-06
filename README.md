# 🤖 WADASH - WhatsApp Bot Dashboard

WhatsApp Bot dengan Dashboard modern untuk mengelola bot dan session WhatsApp.

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) untuk melihat dashboard.

### Running Production

```bash
npm run build
npm start
```

## 📱 Bot Features

### Multi-Prefix Support ⭐ NEW!

Bot mendukung **26 prefix berbeda** untuk command:

```
! @ # $ % ^ & * ( ) < > , . / ? : " ; ' { } [ ] \ |
```

**Contoh penggunaan:**
```bash
!menu          # Menggunakan !
@menu          # Menggunakan @
#menu          # Menggunakan #
.menu          # Menggunakan .
/menu          # Menggunakan /
?menu          # Menggunakan ?
```

Semua prefix akan berfungsi dengan baik! User bebas memilih prefix favorit mereka.

### Available Commands

#### 📋 General Commands
- `!menu` / `@menu` / `#menu` - Tampilkan daftar command
- `!owner` - Tampilkan informasi owner
- `!stiker` - Buat sticker dari gambar/video/GIF

#### 🎮 Fun Commands
- `!japan` - Random Japan image dari database
- `!korea` - Random Korea image dari database
- `!khodam` / `!cekkhodam` - Cek khodam random
- `!ceksifat <nama>` - Cek sifat seseorang
- `!taugasih` - Fakta menarik random
- `!tembak @user` - Ajak pacaran ⭐ NEW!
- `!terima @user` - Terima ajakan pacaran ⭐ NEW!
- `!tolak @user` - Tolak ajakan pacaran ⭐ NEW!
- `!cekpacar [@user]` - Cek status pacaran ⭐ NEW!
- `!putus` - Putus hubungan ⭐ NEW!

#### 📥 Downloader Commands

**Instagram Downloader** ⭐ NEW!
```bash
!ig <instagram-url>
!instagram <instagram-url>
!igdl <instagram-url>
```

Fitur:
- ✅ Download foto & video Instagram
- ✅ Support carousel posts (multiple media)
- ✅ Dual API fallback (GraphQL + Snapsave)
- ✅ Smart file size handling
- ✅ Rich metadata (likes, comments, caption)

**TikTok Downloader**
```bash
!ttdl <tiktok-url>
!tiktok <tiktok-url>
!tt <tiktok-url>
```

Fitur:
- ✅ Download video TikTok HD
- ✅ Smart file size handling (video/document/link)
- ✅ Metadata display (views, likes, comments)
- ✅ Timeout protection

**Bilibili/Bstation Downloader** ⭐ NEW!
```bash
!bstation <bilibili-url>
!bilibili <bilibili-url>
!bili <bilibili-url>
```

Fitur:
- ✅ Download video dari Bilibili/Bstation
- ✅ Support quality selection (720p default)
- ✅ Smart file size handling
- ✅ Rich metadata (title, views, likes, locale)
- ✅ Thumbnail preview
- ✅ Timeout protection

## 🎯 Usage Examples

### Multi-Prefix Examples

```bash
# Instagram Downloader
!ig https://www.instagram.com/p/xxxxx/
@ig https://www.instagram.com/p/xxxxx/
#ig https://www.instagram.com/p/xxxxx/

# TikTok Downloader
.ttdl https://vt.tiktok.com/ZSjqPxxx/
/ttdl https://vt.tiktok.com/ZSjqPxxx/
?ttdl https://vt.tiktok.com/ZSjqPxxx/

# Bilibili/Bstation Downloader
!bstation https://www.bilibili.com/video/xxxxx/
@bilibili https://www.bilibili.com/video/xxxxx/
#bili https://www.bilibili.com/video/xxxxx/

# Menu
!menu
@menu
#menu
```

### Sticker Maker

```bash
# Kirim gambar dengan caption
!stiker

# Atau reply gambar/video dengan
!stiker
```

## 🔧 Project Structure

```
WADASH/
├── plugins/              # Bot command plugins
│   ├── menu.js          # Menu command
│   ├── owner.js         # Owner info
│   ├── stiker.js        # Sticker maker
│   ├── ttdl.js          # TikTok downloader
│   ├── igdl.js          # Instagram downloader
│   ├── bstation.js      # Bilibili/Bstation downloader
│   ├── japan.js         # Random Japan image
│   ├── korea.js         # Random Korea image
│   ├── khodam.js        # Cek khodam random
│   ├── ceksifat.js      # Cek sifat
│   ├── taugasih.js      # Fakta menarik
│   ├── tembak.js        # Ajak pacaran ⭐ NEW!
│   ├── terima.js        # Terima ajakan ⭐ NEW!
│   ├── tolak.js         # Tolak ajakan ⭐ NEW!
│   ├── cekpacar.js      # Cek status pacaran ⭐ NEW!
│   └── putus.js         # Putus hubungan ⭐ NEW!
├── src/
│   ├── app/             # Next.js app pages
│   ├── components/      # React components
│   └── lib/
│       ├── handler.js   # Message handler (multi-prefix support)
│       ├── baileys.js   # WhatsApp connection
│       ├── database.js  # User database (with relationship support)
│       └── socket.js    # Socket.IO handler
├── session/             # WhatsApp session data
├── database.json        # User database
└── server.js           # Custom server with Socket.IO
```

## 🛠️ Development

### Adding New Plugins

Buat file baru di folder `plugins/`:

```javascript
const handler = async (m, { conn, text, usedPrefix, command }) => {
    // Validasi input
    if (!text) {
        return m.reply(`❌ Gunakan: ${usedPrefix}${command} <parameter>`);
    }
    
    // Logic command Anda
    try {
        // ... kode Anda
        await m.reply('✅ Berhasil!');
    } catch (error) {
        await m.reply(`❌ Error: ${error.message}`);
    }
};

handler.help = ['commandname'];
handler.tags = ['category'];
handler.command = ['commandname', 'alias1', 'alias2'];

module.exports = handler;
```

**Key Points:**
- ✅ Gunakan `usedPrefix` untuk dynamic error messages
- ✅ Plugin otomatis support semua 26 prefix
- ✅ Tidak perlu konfigurasi tambahan

### Available Modules in Plugins

Modules yang bisa di-require dalam plugin:

```javascript
const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const ytSearch = require('yt-search');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
```

## 📊 Features Overview

### ✨ Multi-Prefix Support
- **26 different prefixes** tersedia
- **Dynamic detection** - bot auto-detect prefix yang digunakan
- **Dynamic error messages** - pesan error show prefix yang benar
- **Backward compatible** - semua command existing tetap work

### 📸 Instagram Downloader
- **Dual API fallback** untuk reliability
- **Multiple media support** (carousel posts)
- **Smart file handling** (auto-detect size limits)
- **Rich metadata** (likes, comments, caption)
- **Timeout protection** (60s per media)

### 🎵 TikTok Downloader
- **HD video support**
- **Smart file handling** (video/document/link)
- **Metadata display** (views, likes, comments, shares)
- **Timeout protection** (120s)

### 📺 Bilibili/Bstation Downloader
- **Quality selection** (720p default, support multiple qualities)
- **Smart file handling** (video/document/link)
- **Rich metadata** (title, views, likes, locale, description)
- **Thumbnail preview** before video download
- **Timeout protection** (120s)
- **Region support** for Bilibili international content

### 🎨 Sticker Maker
- Support image, video, dan GIF
- Auto-resize untuk WhatsApp
- Quality optimization

## 🧪 Testing

### Test Multi-Prefix
```bash
!menu
@menu
#menu
.menu
/menu
```

### Test Instagram Downloader
```bash
!ig https://www.instagram.com/p/xxxxx/
@ig https://www.instagram.com/reel/xxxxx/
#ig https://www.instagram.com/p/xxxxx/
```

### Test TikTok Downloader
```bash
.ttdl https://vt.tiktok.com/ZSjqPxxx/
/ttdl https://www.tiktok.com/@user/video/xxxxx
?ttdl https://vt.tiktok.com/ZSjqPxxx/
```

### Test Bilibili/Bstation Downloader
```bash
!bstation https://www.bilibili.com/video/xxxxx/
@bilibili https://www.bilibili.com/video/xxxxx/
#bili https://bili.im/xxxxx
```

## 📦 Dependencies

### Main Dependencies
- `@whiskeysockets/baileys` - WhatsApp Web API
- `next` - React framework
- `socket.io` - Real-time communication
- `axios` - HTTP client
- `cheerio` - HTML parsing (for Instagram fallback)
- `qs` - Query string encoding (for Instagram GraphQL)
- `sharp` - Image processing
- `fluent-ffmpeg` - Video processing
- `yt-search` - YouTube search

## 🔐 Environment Variables

Tidak ada environment variables yang diperlukan. Bot akan otomatis:
- Generate session baru jika belum ada
- Create database.json jika belum ada
- Load semua plugins dari folder `plugins/`

## 📝 Version History

### v1.1.0 (2025-12-05)
- ✅ Added multi-prefix support (26 prefixes)
- ✅ Added Instagram downloader plugin
- ✅ Added cheerio & qs module support
- ✅ Dynamic error messages
- ✅ Updated documentation

### v1.0.0 (2025-12-04)
- ✅ Initial release
- ✅ WhatsApp bot with dashboard
- ✅ TikTok downloader
- ✅ Sticker maker
- ✅ Menu & owner commands
- ✅ Session management
- ✅ User database

## 🤝 Contributing

Saat menambahkan fitur baru:
1. Buat plugin di folder `plugins/`
2. Gunakan `usedPrefix` untuk error messages
3. Test dengan berbagai prefix
4. Update README.md dengan informasi command baru

## ⚠️ Notes

### Special Characters
Beberapa prefix mungkin perlu perhatian:
- `*`, `_`, `~` - WhatsApp formatting characters
- `(`, `)`, `<`, `>` - Mungkin perlu escape di beberapa platform
- `"`, `'` - Quote characters

Bot akan tetap recognize semua prefix ini dengan benar.

### File Size Limits

**Videos:**
- < 16MB: Sent as video message
- 16-64MB: Sent as document
- \> 64MB: Send download link

**Images:**
- < 5MB: Sent as image message
- 5-64MB: Sent as document
- \> 64MB: Send download link

## 🎉 Summary

WADASH Bot features:
- ✅ **26 prefix options** untuk maksimal fleksibilitas
- ✅ **Instagram downloader** dengan dual API fallback
- ✅ **TikTok downloader** dengan HD support
- ✅ **Bilibili/Bstation downloader** dengan quality selection
- ✅ **Sticker maker** dari images/videos
- ✅ **Random Japan & Korea image** dari GitHub database
- ✅ **Cek Khodam** random generator
- ✅ **Cek Sifat** personality traits
- ✅ **Fakta Menarik** random fun facts
- ✅ **Relationship System** (tembak, terima, tolak, cekpacar, putus)
- ✅ **Dynamic error messages** showing correct prefix
- ✅ **Modern dashboard** untuk management
- ✅ **Session persistence** otomatis
- ✅ **User database** built-in dengan relationship support

**Status**: ✅ **READY TO USE**

## 📞 Support

Untuk issues atau questions:
- Check plugin source code di `plugins/` folder
- Review handler logic di `src/lib/handler.js`
- Test dengan berbagai prefix

---

**Last Updated**: 2025-12-05  
**Version**: 1.1.0  
**License**: MIT
