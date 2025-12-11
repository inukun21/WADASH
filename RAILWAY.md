# WADASH - Deployment ke Railway

Panduan lengkap untuk deploy WADASH ke Railway - **Platform terbaik untuk WhatsApp Bot 24/7**.

## 🚂 Kenapa Railway?

✅ **Persistent Storage** - Session WhatsApp tidak hilang  
✅ **Always-On Containers** - Bot berjalan 24/7  
✅ **Free $5 Credit** - Cukup untuk testing  
✅ **Auto-Deploy** - Otomatis deploy dari GitHub  
✅ **WebSocket Support** - Full support untuk Socket.IO  
✅ **Easy Setup** - Deploy dalam 5 menit  

---

## 🚀 Quick Deploy

### Method 1: Deploy via Railway Dashboard (Recommended)

#### Step 1: Persiapan

1. **Buat akun Railway**
   - Buka [railway.app](https://railway.app)
   - Sign up dengan GitHub account
   - Verify email Anda

2. **Get $5 Free Credit**
   - Railway memberikan $5 credit gratis
   - Cukup untuk ~500 hours runtime

#### Step 2: Deploy Project

1. **New Project**
   - Login ke Railway Dashboard
   - Klik "New Project"
   - Pilih "Deploy from GitHub repo"

2. **Connect Repository**
   - Pilih repository `WADASH`
   - Railway akan auto-detect Next.js

3. **Configure Settings**
   
   Railway akan auto-detect:
   - ✅ Framework: Next.js
   - ✅ Install Command: `npm i`
   - ✅ Build Command: `npm run build` (optional)
   - ✅ Start Command: `npm run dev`

   **PENTING:** Project ini menggunakan custom server (server.js) dengan Socket.IO, jadi:
   - Install: `npm i`
   - Start: `npm run dev` (bukan `npm start`)

#### Step 3: Add Environment Variables

Klik tab "Variables" dan tambahkan:

```env
# Required
NODE_ENV=production
NEXTAUTH_SECRET=<generate-dengan-crypto>
NEXTAUTH_URL=https://your-app.railway.app

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

# Port (Railway auto-assigns)
PORT=3000
```

#### Step 4: Deploy

1. Klik "Deploy"
2. Tunggu build selesai (~2-3 menit)
3. Railway akan generate URL: `https://wadash-production.up.railway.app`

#### Step 5: Update NEXTAUTH_URL

1. Copy URL dari Railway
2. Update environment variable `NEXTAUTH_URL`
3. Redeploy (otomatis)

---

### Method 2: Deploy via Railway CLI

#### Install Railway CLI

```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh
```

#### Login

```bash
railway login
```

#### Deploy

```bash
# Initialize Railway project
railway init

# Link to existing project (optional)
railway link

# Add environment variables
railway variables set NEXTAUTH_SECRET=<your-secret>
railway variables set NEXTAUTH_URL=https://your-app.railway.app
railway variables set NODE_ENV=production

# Deploy
railway up
```

---

## 🔐 Generate Production Secrets

**PENTING:** Generate secret baru untuk production!

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy output dan paste ke Railway environment variables.

---

## 📁 Persistent Storage

Railway menyediakan **persistent volumes** untuk menyimpan data.

### Session Storage

WhatsApp sessions akan tersimpan di:
```
/app/session/
```

Railway akan maintain storage ini bahkan setelah redeploy! ✅

### Database Storage

Database JSON akan tersimpan di:
```
/app/database.json
/app/dsh.database.json
```

Data tidak akan hilang setelah restart! ✅

---

## 🔄 Auto-Deploy dari GitHub

Railway otomatis deploy setiap kali ada push ke GitHub:

1. **Push ke GitHub**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Railway Auto-Deploy**
   - Railway detect changes
   - Auto build & deploy
   - Zero downtime deployment

---

## 📊 Monitoring

### Railway Dashboard

Monitor aplikasi di Railway Dashboard:

- **Metrics** - CPU, Memory, Network usage
- **Logs** - Real-time application logs
- **Deployments** - Deployment history
- **Usage** - Credit usage tracking

### View Logs

```bash
# Via CLI
railway logs

# Via Dashboard
# Go to Project → Deployments → View Logs
```

---

## 💰 Pricing & Credits

### Free Tier

- **$5 Free Credit** per month
- **500 hours** runtime (~20 days)
- **100 GB** bandwidth
- **1 GB** RAM per service

### Paid Plans

Jika credit habis:
- **Developer Plan**: $5/month
- **Team Plan**: $20/month
- **Pay as you go**: $0.000231/GB-sec

**Estimasi untuk WADASH:**
- ~$3-5/month untuk 24/7 uptime
- Lebih murah dari VPS!

---

## 🛠️ Troubleshooting

### Error: "Build Failed"

**Solusi:**
1. Check build logs di Railway dashboard
2. Pastikan `package.json` punya script `build` dan `start`
3. Verify environment variables sudah di-set

### Error: "Application Crashed"

**Solusi:**
1. Check application logs
2. Verify `PORT` environment variable
3. Pastikan `npm run dev` command benar di railway.json

### Bot Session Hilang

**Solusi:**
1. Pastikan menggunakan Railway (bukan Vercel)
2. Session tersimpan di `/app/session/`
3. Railway maintain persistent storage

### Database Reset

**Solusi:**
1. Railway punya persistent storage
2. Database tidak akan reset kecuali Anda hapus volume
3. Backup database secara berkala

---

## 🔧 Advanced Configuration

### Custom Domain

1. **Add Domain di Railway**
   - Go to Settings → Domains
   - Add custom domain
   - Update DNS records

2. **Update NEXTAUTH_URL**
   ```env
   NEXTAUTH_URL=https://wadash.yourdomain.com
   ```

### Environment-Specific Variables

Railway support multiple environments:

```bash
# Production
railway variables set NEXTAUTH_URL=https://wadash.yourdomain.com --environment production

# Staging
railway variables set NEXTAUTH_URL=https://staging.wadash.yourdomain.com --environment staging
```

### Health Checks

Railway auto-detect health dari HTTP responses.

Tambahkan health check endpoint (optional):

```javascript
// src/app/api/health/route.js
export async function GET() {
  return Response.json({ status: 'ok', timestamp: Date.now() });
}
```

---

## 📋 Post-Deployment Checklist

Setelah deploy berhasil:

- [ ] Test login di production URL
- [ ] Verify bot connection (scan QR code)
- [ ] Test multi-user sessions
- [ ] Verify rate limiting works
- [ ] Check security logs
- [ ] Monitor resource usage
- [ ] Setup custom domain (optional)
- [ ] Configure backup strategy

---

## 🔄 Backup Strategy

### Manual Backup

```bash
# Download database via Railway CLI
railway run cat database.json > backup-database.json
railway run cat dsh.database.json > backup-dsh-database.json
```

### Automated Backup (Optional)

Setup GitHub Actions untuk backup otomatis:

```yaml
# .github/workflows/backup.yml
name: Backup Database
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Backup to GitHub
        run: |
          # Add backup script here
```

---

## 🆚 Railway vs Vercel vs VPS

| Feature | Railway | Vercel | VPS |
|---------|---------|--------|-----|
| **Persistent Storage** | ✅ Yes | ❌ No | ✅ Yes |
| **Always-On** | ✅ Yes | ❌ No | ✅ Yes |
| **WhatsApp Bot** | ✅ Perfect | ⚠️ Limited | ✅ Perfect |
| **Setup Time** | 5 min | 2 min | 30+ min |
| **Price** | $3-5/mo | Free | $5-10/mo |
| **Auto-Deploy** | ✅ Yes | ✅ Yes | ❌ Manual |
| **Scaling** | ✅ Easy | ✅ Auto | ⚠️ Manual |

**Rekomendasi:**
- **Railway** - Best untuk WhatsApp bot 24/7 ⭐
- **Vercel** - Best untuk web dashboard only
- **VPS** - Best untuk full control & custom setup

---

## 🚀 Migration dari Vercel ke Railway

Jika sudah deploy di Vercel dan ingin pindah:

1. **Export Data**
   - Backup database dari Vercel
   - Export environment variables

2. **Deploy ke Railway**
   - Follow panduan di atas
   - Import environment variables
   - Deploy

3. **Update DNS**
   - Point domain ke Railway
   - Update NEXTAUTH_URL

4. **Test**
   - Verify semua fitur works
   - Test bot connection
   - Check logs

---

## 📚 Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)
- [Railway Blog](https://blog.railway.app)

---

## 💡 Tips & Best Practices

### 1. Monitor Credit Usage

```bash
# Check credit usage
railway status
```

### 2. Optimize Resource Usage

- Use environment variables untuk config
- Implement proper error handling
- Add logging untuk debugging

### 3. Security

- ✅ Always use HTTPS (Railway provides SSL)
- ✅ Set strong NEXTAUTH_SECRET
- ✅ Enable rate limiting
- ✅ Monitor security logs

### 4. Performance

- Railway auto-scales based on load
- Monitor metrics di dashboard
- Optimize database queries

---

## 🆘 Support

Jika mengalami masalah:

1. **Check Railway Logs**
   ```bash
   railway logs
   ```

2. **Railway Discord**
   - Join Railway Discord
   - Ask di #help channel

3. **Railway Support**
   - Email: team@railway.app
   - Response time: ~24 hours

---

## 📝 Example Deployment

### Successful Deployment Output

```bash
$ railway up

Building...
✓ Build completed (2m 15s)

Deploying...
✓ Deployment successful

Your application is live at:
https://wadash-production.up.railway.app

Deployment ID: dep_abc123xyz
```

### Check Status

```bash
$ railway status

Project: WADASH
Environment: production
Status: Running
URL: https://wadash-production.up.railway.app
Memory: 256 MB / 1 GB
CPU: 0.1 cores
Uptime: 24h 15m
```

---

## 🎉 Summary

Railway adalah platform **terbaik untuk WhatsApp bot**:

✅ **Persistent Storage** - Session tidak hilang  
✅ **Always-On** - Bot jalan 24/7  
✅ **Easy Deploy** - 5 menit setup  
✅ **Auto-Deploy** - Push to deploy  
✅ **Affordable** - $3-5/month  
✅ **Great Support** - Active Discord community  

**Deploy sekarang dan bot Anda siap 24/7!** 🚀

---

**Last Updated:** 11 Desember 2025  
**Railway Version:** Latest  
**Next.js Version:** 16.0.7
