# WADASH - Deployment ke Vercel

Panduan lengkap untuk deploy WADASH ke Vercel.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/inukun21/WADASH)

## 📋 Prerequisites

1. Akun Vercel (gratis di [vercel.com](https://vercel.com))
2. Repository GitHub sudah ter-push
3. Environment variables siap

## 🔧 Cara Deploy

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Login ke Vercel**
   - Buka [vercel.com](https://vercel.com)
   - Login dengan GitHub account

2. **Import Project**
   - Klik "Add New..." → "Project"
   - Pilih repository `WADASH`
   - Klik "Import"

3. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

4. **Add Environment Variables**
   
   Klik "Environment Variables" dan tambahkan:

   ```env
   # Required
   NEXTAUTH_SECRET=<generate-baru-untuk-production>
   NEXTAUTH_URL=https://your-app.vercel.app
   
   # Optional - Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Security Settings
   SESSION_MAX_AGE=86400
   SESSION_UPDATE_AGE=3600
   BCRYPT_ROUNDS=12
   MAX_LOGIN_ATTEMPTS=5
   LOCKOUT_DURATION=900000
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_WINDOW_MS=900000
   ```

5. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build selesai (~2-3 menit)
   - Aplikasi akan live di `https://your-app.vercel.app`

---

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Development deployment
   vercel
   
   # Production deployment
   vercel --prod
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   ```

---

## 🔐 Generate Production Secrets

**PENTING:** Jangan gunakan secret yang sama dengan development!

### Generate NEXTAUTH_SECRET

```bash
# Menggunakan Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy output dan paste ke Vercel environment variables.

### Set NEXTAUTH_URL

Setelah deploy pertama kali, Vercel akan memberikan URL seperti:
```
https://wadash-abc123.vercel.app
```

Update environment variable `NEXTAUTH_URL` dengan URL tersebut.

---

## ⚙️ Vercel Configuration

File `vercel.json` sudah dikonfigurasi dengan:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/socket.io/(.*)",
      "dest": "/api/socket"
    }
  ]
}
```

---

## 📝 Post-Deployment Checklist

Setelah deploy berhasil:

- [ ] Test login di production URL
- [ ] Verify security headers (gunakan [securityheaders.com](https://securityheaders.com))
- [ ] Test bot connection (scan QR code)
- [ ] Verify rate limiting works
- [ ] Check security logs
- [ ] Test multi-user sessions
- [ ] Setup custom domain (optional)

---

## 🌐 Custom Domain

1. **Add Domain di Vercel**
   - Go to Project Settings → Domains
   - Add your domain (e.g., `wadash.yourdomain.com`)
   - Follow DNS configuration instructions

2. **Update NEXTAUTH_URL**
   - Update environment variable ke custom domain
   - Redeploy project

---

## 🔄 Auto-Deploy

Vercel otomatis deploy setiap kali ada push ke GitHub:

- **Push ke `main` branch** → Production deployment
- **Push ke branch lain** → Preview deployment

---

## 📊 Monitoring

### Vercel Dashboard

Monitor aplikasi di Vercel Dashboard:
- **Analytics** - Traffic dan performance
- **Logs** - Real-time logs
- **Deployments** - History deployment

### Security Logs

Security logs tersimpan di Vercel Logs:
```bash
# View logs via CLI
vercel logs
```

---

## ⚠️ Limitations di Vercel

### Serverless Functions

Vercel menggunakan serverless functions dengan batasan:

| Limit | Free Plan | Pro Plan |
|-------|-----------|----------|
| Execution Time | 10s | 60s |
| Memory | 1024 MB | 3008 MB |
| Payload Size | 4.5 MB | 4.5 MB |

### WhatsApp Bot Sessions

**PENTING:** Vercel adalah serverless platform, sehingga:

⚠️ **Session Persistence:** WhatsApp sessions mungkin hilang setelah function timeout  
⚠️ **File Storage:** Session files tidak persisten di Vercel  

**Solusi:**
1. Gunakan external storage (S3, Cloudinary) untuk session files
2. Atau deploy ke platform dengan persistent storage (Railway, Render, VPS)

### Recommended untuk Production

Untuk WhatsApp bot yang 24/7, lebih baik deploy ke:
- **Railway** - Persistent storage, always-on
- **Render** - Free tier dengan persistent disk
- **VPS** - Full control (DigitalOcean, Linode)

---

## 🛠️ Troubleshooting

### Error: "NEXTAUTH_SECRET is not set"

**Solusi:**
1. Pastikan environment variable `NEXTAUTH_SECRET` sudah di-set di Vercel
2. Redeploy project

### Error: "Failed to connect to database"

**Solusi:**
1. Vercel serverless tidak support file-based database dengan baik
2. Gunakan database cloud (MongoDB Atlas, PostgreSQL)

### Socket.IO tidak connect

**Solusi:**
1. Vercel serverless functions tidak support WebSocket persistent connections
2. Gunakan Vercel's built-in WebSocket support atau deploy ke platform lain

### Bot session hilang

**Solusi:**
1. Implement session storage ke cloud (S3, MongoDB)
2. Atau gunakan platform dengan persistent storage

---

## 🔄 Alternative Deployment Platforms

Jika Vercel tidak cocok untuk WhatsApp bot (karena serverless limitations):

### Railway (Recommended for WhatsApp Bot)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Kelebihan:**
- ✅ Persistent storage
- ✅ Always-on containers
- ✅ Free tier generous
- ✅ Support WebSocket

### Render

```bash
# Deploy via Render Dashboard
# Connect GitHub repository
# Set environment variables
# Deploy
```

**Kelebihan:**
- ✅ Free tier dengan persistent disk
- ✅ Auto-deploy dari GitHub
- ✅ Support WebSocket

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

---

## 💡 Tips

1. **Always use production secrets** - Jangan gunakan development secrets
2. **Enable HTTPS** - Vercel otomatis provide SSL certificate
3. **Monitor logs** - Check Vercel logs regularly
4. **Test thoroughly** - Test semua fitur setelah deploy
5. **Use custom domain** - Lebih professional

---

## 🆘 Support

Jika mengalami masalah deployment:
1. Check Vercel logs
2. Review environment variables
3. Test locally dengan `vercel dev`
4. Check [Vercel Status](https://www.vercel-status.com/)

---

**Last Updated:** 11 Desember 2025  
**Vercel Version:** 2  
**Next.js Version:** 16.0.7
