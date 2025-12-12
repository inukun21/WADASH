# Auto-Logout Testing Guide

## Fitur yang Diimplementasikan

Sistem auto-logout otomatis akan mengeluarkan user yang sedang login jika akun mereka dihapus oleh admin dari database.

### Mekanisme Proteksi (2 Layer)

1. **API Validation** - Validasi di endpoint `/api/auth` dan `/api/auth/validate`
2. **Client-Side Polling** - Cek session validity setiap 30 detik

> **Note**: Middleware validation tidak digunakan karena Next.js Edge Runtime tidak mendukung Node.js modules (`fs`, `path`). Validasi dilakukan di API routes yang berjalan di Node.js runtime.

## Cara Testing

### Test 1: Client-Side Polling (30 detik)

1. Login sebagai user test
2. Buka `database/dsh.database.json`
3. Hapus user yang sedang login dari `webUsers`
4. Save file
5. Tunggu maksimal 30 detik tanpa navigasi
6. **Expected**: Otomatis redirect ke `/login?reason=account_deleted`

### Test 2: API Validation on Navigation

### Test 2: API Validation on Navigation

1. Login sebagai user test
2. Buka `database/dsh.database.json`
3. Hapus user yang sedang login dari `webUsers`
4. Save file
5. Refresh halaman atau navigasi ke halaman lain
6. **Expected**: Redirect ke `/login?reason=account_deleted` karena API `/api/auth` mendeteksi user tidak ada

### Test 3: Multi-User Scenario

1. Buat 2 user: `user1@test.com` dan `admin@test.com`
2. Login sebagai `user1@test.com` di Browser/Tab 1
3. Login sebagai `admin@test.com` di Browser/Tab 2
4. Di Browser 2, hapus `user1@test.com` dari database
5. **Expected**: 
   - Browser 1 (user1) otomatis logout dalam 30 detik
   - Browser 2 (admin) tetap login normal

### Test 4: Warning Message

1. Setelah auto-logout terjadi
2. **Expected**: Muncul pesan kuning di halaman login:
   > "Your account has been deleted by an administrator. Please contact support if you believe this is an error."

## Files Modified

- ✅ `/src/app/api/auth/validate/route.ts` - NEW: Validation endpoint
- ✅ `/src/hooks/useSessionValidator.tsx` - NEW: Client-side polling hook
- ✅ `/src/components/ConditionalLayout.tsx` - MODIFIED: Added session validator
- ✅ `/src/app/api/auth/route.ts` - MODIFIED: Enhanced GET endpoint with user validation
- ✅ `/src/app/login/page.tsx` - MODIFIED: Added deletion warning message

## Troubleshooting

**Jika auto-logout tidak bekerja:**

1. Cek console browser untuk error
2. Pastikan `npm run dev` berjalan tanpa error
3. Cek network tab untuk request ke `/api/auth/validate`
4. Pastikan cookies tidak di-block oleh browser

**Jika polling terlalu lambat/cepat:**

Edit `VALIDATION_INTERVAL` di `/src/hooks/useSessionValidator.tsx`:
```typescript
const VALIDATION_INTERVAL = 30000; // 30 detik (ubah sesuai kebutuhan)
```
