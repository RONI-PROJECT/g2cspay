import { Router } from 'express';
import crypto from 'node:crypto';
import { one, sql, ensureColumns } from '../db/index.js';
import { createUser, verifyPassword, createSession, deleteSession } from '../services/auth.js';
import { createNotification } from '../services/notifications.js';
import * as totp from '../services/totp.js';
import { verifyTurnstile } from '../services/turnstile.js';

const router = Router();
router.use((req, res, next) => {
   Promise.race([ensureColumns(), new Promise((r) => setTimeout(r, 6000))]).catch((e) => console.error('[auth] ensureColumns:', e.message)).finally(() => next());
});

function genMerchantCode() {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return 'MRC-' + s;
}


function generateWebhookSecret() {
   return 'whsec_' + crypto.randomBytes(24).toString('hex');
}

// ═══ CHECK EMAIL AVAILABILITY ═══
router.get('/check-email', async (req, res, next) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!email) return res.json({ success: true, data: { available: false, reason: 'empty' } });
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({ success: true, data: { available: false, reason: 'invalid' } });
    }
    
    const existing = await one('SELECT id FROM users WHERE email = $1', [email]);
    return res.json({ success: true, data: { available: !existing } });
  } catch (e) {
    console.error('[check-email] error:', e.message);
    next(e);
  }
});

// ═══ CHECK PHONE AVAILABILITY ═══
router.get('/check-phone', async (req, res, next) => {
  try {
    const phone = String(req.query.phone || '').trim();
    if (!phone) return res.json({ success: true, data: { available: false, reason: 'empty' } });
    
    // Normalisasi: 08xxx atau +628xxx
    const normalized = phone.replace(/\D/g, '');
    if (normalized.length < 9 || normalized.length > 15) {
      return res.json({ success: true, data: { available: false, reason: 'invalid' } });
    }
    
    const existing = await one('SELECT id FROM users WHERE phone = $1', [phone]);
    return res.json({ success: true, data: { available: !existing } });
  } catch (e) {
    console.error('[check-phone] error:', e.message);
    next(e);
  }
});

// ═══ REGISTER ═══
router.post('/register', async (req, res, next) => {
   try {
      const { email, password, name, phone, storeName } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Email & password wajib' });
      const cap = await verifyTurnstile(req.body?.turnstileToken, req.ip);
      if (!cap.ok) return res.status(400).json({ error: cap.error });
      const store = String(storeName || '').trim().slice(0, 60);
      if (store.length < 2) return res.status(400).json({ error: 'Nama toko minimal 2 karakter' });
      if (password.length < 6) return res.status(400).json({ error: 'Password min 6 karakter' });
      if (!phone) return res.status(400).json({ error: 'Nomor HP wajib diisi' });

      const emailLower = String(email).toLowerCase().trim();
      const existing = await one('SELECT id FROM users WHERE email = $1', [emailLower]);
      if (existing) return res.status(409).json({ error: 'Email sudah terdaftar' });

      const user = await createUser({ email: emailLower, password, name, phone, storeName: store });

      // Semua step di bawah OPTIONAL — jangan bikin register gagal
      try {
         const webhookSecret = 'whsec_' + require('node:crypto').randomBytes(24).toString('hex');
         await sql('UPDATE users SET "webhookSecret" = $1 WHERE id = $2', [webhookSecret, user.id]);
      } catch (e) { console.error('[register] webhookSecret gagal:', e.message); }

      try {
         // Baca site_name dari app_settings (dinamis ikut panel admin)
         let siteName = 'Ronpay';
         try {
            const setting = await one(
               `SELECT value FROM app_settings WHERE key = 'site_name' LIMIT 1`
            );
            if (setting?.value) siteName = setting.value;
         } catch {}

         await createNotification(
            user.id, 'info',
            `Selamat datang di ${siteName}`,
            'Akun Anda sudah aktif. Mulai terima pembayaran QRIS sekarang.',
            { welcome: true }
         );
      } catch (e) { console.error('[register] notif gagal:', e.message); }

      try {
         const { token } = await createSession(user.id, req.ip, req.headers['user-agent']);
         res.cookie('session', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
      } catch (e) {
         console.error('[register] session gagal:', e.message);
      }

      return res.json({
         success: true,
         data: {
            user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
         },
      });
   } catch (e) {
      console.error('[register] fatal:', e.message, e.stack);
      next(e);
   }
});

// ═══ LOGIN — cek 2FA ═══
router.post('/login', async (req, res, next) => {
   try {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: 'Email & password wajib' });
      const cap = await verifyTurnstile(req.body?.turnstileToken, req.ip);
      if (!cap.ok) return res.status(400).json({ error: cap.error });

      const user = await one('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (!user) return res.status(401).json({ error: 'Email atau password salah' });
      if (user.status !== 'active') return res.status(403).json({ error: 'Akun dinonaktifkan' });

      const ok = await verifyPassword(password, user.password);
      if (!ok) return res.status(401).json({ error: 'Email atau password salah' });

      // ═══ CEK APAKAH 2FA AKTIF ═══
      if (user.totp_enabled) {
         // Bikin session sementara (5 menit) buat verifikasi 2FA
         const { token: tempToken } = await createSession(user.id, req.ip, req.headers['user-agent']);

         // Kirim flag requires2fa
         return res.json({
            success: true,
            data: {
               requires2fa: true,
               tempToken,
               email: user.email,
            },
         });
      }

      // ═══ GA ADA 2FA — LANGSUNG LOGIN ═══
      if (!user.webhookSecret) {
         const webhookSecret = generateWebhookSecret();
         await sql('UPDATE users SET "webhookSecret" = $1 WHERE id = $2', [webhookSecret, user.id]);
      }

      await sql('UPDATE users SET "lastLoginAt" = $1 WHERE id = $2', [new Date().toISOString(), user.id]);

      const { token } = await createSession(user.id, req.ip, req.headers['user-agent']);
      res.cookie('session', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.json({
         success: true,
         data: {
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
         },
      });
   } catch (e) { next(e); }
});

// ═══ LOGIN TOTP — endpoint dipertahankan tapi tidak dipakai ═══
router.post('/login/totp', async (req, res, next) => {
   try {
      const { email, token } = req.body || {};
      if (!email || !token) return res.status(400).json({ error: 'Email & kode wajib' });

      const user = await one('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      if (!user) return res.status(401).json({ error: 'User tidak ditemukan' });
      if (!user.totp_enabled) return res.status(400).json({ error: '2FA belum di-setup' });

      const ok = totp.verifyToken(token, user.totp_secret);
      if (!ok) return res.status(401).json({ error: 'Kode 2FA salah' });

      await sql('UPDATE users SET "lastLoginAt" = $1 WHERE id = $2', [new Date().toISOString(), user.id]);
      const { token: sessionToken } = await createSession(user.id, req.ip, req.headers['user-agent']);
      res.cookie('session', sessionToken, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

      res.json({
         success: true,
         data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      });
   } catch (e) { next(e); }
});

// ═══ 2FA SETUP — endpoint tetap ada buat aktivasi manual di pengaturan ═══
router.post('/2fa/setup', async (req, res, next) => {
   try {
      const token = req.cookies?.session || req.headers['x-session-token'];
      if (!token) return res.status(401).json({ error: 'Login required' });

      const session = await one(
         `SELECT s."userId", u.email, u.name, u.totp_enabled
          FROM sessions s JOIN users u ON u.id = s."userId"
          WHERE s.token = $1 AND s."expiresAt" > $2`,
         [token, new Date().toISOString()]
      );
      if (!session) return res.status(401).json({ error: 'Login required' });
      if (session.totp_enabled) return res.status(400).json({ error: '2FA udah aktif' });

      const secret = totp.generateSecret();
      await sql('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret, session.userId]);

      const { otpauth, qrDataUrl } = await totp.generateQRCode(session.email, secret);

      res.json({
         success: true,
         data: {
            secret,
            otpauth,
            qrDataUrl,
            manualEntry: secret.match(/.{1,4}/g)?.join(' ') || secret,
         },
      });
   } catch (e) { next(e); }
});

// ═══ 2FA VERIFY SETUP ═══
router.post('/2fa/verify-setup', async (req, res, next) => {
   try {
      const { token: code } = req.body || {};
      if (!code) return res.status(400).json({ error: 'Kode wajib' });

      const sessionToken = req.cookies?.session || req.headers['x-session-token'];
      const session = await one(
         `SELECT s."userId", u.totp_secret FROM sessions s JOIN users u ON u.id = s."userId"
          WHERE s.token = $1 AND s."expiresAt" > $2`,
         [sessionToken, new Date().toISOString()]
      );
      if (!session || !session.totp_secret) return res.status(401).json({ error: 'Setup dulu' });

      const ok = totp.verifyToken(code, session.totp_secret);
      if (!ok) return res.status(401).json({ error: 'Kode salah, coba lagi' });

      const backupCodes = totp.generateBackupCodes(8);

      await sql(
         'UPDATE users SET totp_enabled = true, totp_backup_codes = $1, totp_verified_at = $2 WHERE id = $3',
         [JSON.stringify(backupCodes), new Date().toISOString(), session.userId]
      );

      await createNotification(
         session.userId,
         'info',
         '2FA berhasil diaktifkan',
         'Akun Anda sekarang dilindungi dengan 2FA TOTP. Simpan backup code di tempat aman.',
         { enabled: true }
      );

      res.json({ success: true, data: { backupCodes, enabled: true } });
   } catch (e) { next(e); }
});

// ═══ 2FA DISABLE ═══
router.post('/2fa/disable', async (req, res, next) => {
   try {
      const { token: code, password } = req.body || {};
      const sessionToken = req.cookies?.session || req.headers['x-session-token'];
      const session = await one(
         `SELECT s."userId", u.totp_secret, u.password FROM sessions s JOIN users u ON u.id = s."userId"
          WHERE s.token = $1 AND s."expiresAt" > $2`,
         [sessionToken, new Date().toISOString()]
      );
      if (!session) return res.status(401).json({ error: 'Login required' });

      const ok = totp.verifyToken(code, session.totp_secret);
      if (!ok) return res.status(401).json({ error: 'Kode 2FA salah' });

      await sql(
         'UPDATE users SET totp_enabled = false, totp_secret = NULL, totp_backup_codes = NULL WHERE id = $1',
         [session.userId]
      );

      res.json({ success: true, data: { enabled: false } });
   } catch (e) { next(e); }
});

// ═══ LOGOUT ═══
router.post('/logout', async (req, res, next) => {
   try {
      const token = req.cookies?.session;
      if (token) await deleteSession(token);
      res.clearCookie('session');
      res.json({ success: true });
   } catch (e) { next(e); }
});

// ═══ ME ═══
// ═══ UPDATE NAMA TOKO ═══
router.patch('/profile', async (req, res, next) => {
   try {
      const token = req.cookies?.session || req.headers['x-session-token'];
      if (!token) return res.status(401).json({ error: 'Login required' });
      const sess = await one('SELECT "userId" FROM sessions WHERE token = $1 AND "expiresAt" > $2', [token, new Date().toISOString()]);
      if (!sess) return res.status(401).json({ error: 'Login required' });
      const store = String(req.body?.storeName || '').trim().slice(0, 60);
      if (store.length < 2) return res.status(400).json({ error: 'Nama toko minimal 2 karakter' });
      await sql('UPDATE users SET store_name = $1 WHERE id = $2', [store, sess.userId]);
      res.json({ success: true, data: { storeName: store } });
   } catch (e) { next(e); }
});

router.get('/me', async (req, res, next) => {
   try {
      const token = req.cookies?.session || req.headers['x-session-token'];
      if (!token) return res.status(401).json({ error: 'Login required' });

      const session = await one(
         `SELECT s."userId", u.*
          FROM sessions s JOIN users u ON u.id = s."userId"
          WHERE s.token = $1 AND s."expiresAt" > $2`,
         [token, new Date().toISOString()]
      );
      if (!session) return res.status(401).json({ error: 'Login required' });

      if (!session.webhookSecret) {
         const webhookSecret = generateWebhookSecret();
         await sql('UPDATE users SET "webhookSecret" = $1 WHERE id = $2', [webhookSecret, session.userId]);
         session.webhookSecret = webhookSecret;
      }

      res.json({
         success: true,
         data: {
            id: session.id,
            email: session.email,
            name: session.name,
            phone: session.phone || null,
            storeName: session.store_name || null,
            role: session.role,
            status: session.status,
            balance: Number(session.balance || 0),
            adminBalance: Number(session.adminBalance || 0),
            isAdmin: session.isAdmin === true,
            webhookUrl: session.webhookUrl,
            webhookSecret: session.webhookSecret,
            totpEnabled: session.totp_enabled,
            createdAt: session.createdAt,
            lastLoginAt: session.lastLoginAt,
         },
      });
   } catch (e) { next(e); }
});

export default router;
