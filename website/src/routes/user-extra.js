import { Router } from 'express';
import crypto from 'node:crypto';
import { one, all, sql } from '../db/index.js';
import { getSession } from '../services/auth.js';
import { createNotification, listNotifications, unreadCount, markAllRead, clearAll } from '../services/notifications.js';

/* 1 CREDENTIAL: API Key (full akses). Client Key dihapus.
   Kolom `key` = API Key; kolom lama `secret` (Client Key) tidak dipakai lagi. */
const newApiKey = (sandbox) => (sandbox ? 'SB-rp_live_' : 'rp_live_') + crypto.randomBytes(15).toString('base64url');

export function userExtraRoutes() {
   const router = Router();

   async function requireUser(req, res, next) {
      try {
         const token = req.cookies?.session || req.headers['x-session-token'];
         const s = await getSession(token);
         if (!s) return res.status(401).json({ error: 'Login required' });
         req.user = { id: s.userId, email: s.email, role: s.role };
         next();
      } catch (e) { next(e); }
   }

   const whsec = () => 'whsec_' + Array.from(globalThis.crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');
   // ═══ API KEYS ═══
   router.get('/api-keys', requireUser, async (req, res, next) => {
      try {
         const rows = await all(
            'SELECT id, name, key, secret, status, environment, "lastUsedAt", "createdAt" FROM api_keys WHERE "userId" = $1 ORDER BY "createdAt" DESC',
            [req.user.id]
         );
         for (const r of rows) {
            if (!r.secret) {
               r.secret = whsec();
               await sql('UPDATE api_keys SET secret = $1 WHERE id = $2', [r.secret, r.id]);
            }
         }
         const userRow = await one('SELECT merchant_code FROM users WHERE id = $1', [req.user.id]);
         res.json({
            success: true,
            data: rows,
            merchant_code: userRow?.merchant_code || null,
         });
      } catch (e) { next(e); }
   });

   router.post('/api-keys', requireUser, async (req, res, next) => {
      try {
         const name = (req.body?.name || 'API Key').slice(0, 100);
         const environment = req.body?.environment === 'sandbox' ? 'sandbox' : 'production';
         const key = newApiKey(environment === 'sandbox');
         const secret = whsec(); // 1 credential — kolom secret (Client Key lama) tidak dipakai lagi
         const now = new Date().toISOString();
         const row = await one(
            'INSERT INTO api_keys ("userId", name, key, secret, environment, "createdAt") VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, key, secret, environment, "createdAt"',
            [req.user.id, name, key, secret, environment, now]
         );
         res.json({ success: true, data: row });
      } catch (e) { next(e); }
   });

   router.post('/api-keys/:id/regenerate', requireUser, async (req, res, next) => {
      try {
         const existing = await one(
            'SELECT id, environment FROM api_keys WHERE id = $1 AND "userId" = $2',
            [req.params.id, req.user.id]
         );
         if (!existing) return res.status(404).json({ error: 'API key tidak ditemukan' });
         const key = newApiKey(existing.environment === 'sandbox');
         const secret = whsec(); // 1 credential — Client Key dihapus
         const row = await one(
            'UPDATE api_keys SET key = $1, secret = $2 WHERE id = $3 RETURNING id, name, key, secret, environment, status, "createdAt"',
            [key, secret, existing.id]
         );
         res.json({ success: true, data: row });
      } catch (e) { next(e); }
   });

   // ═══ MERCHANT CODE REGENERATE ═══
   router.post('/merchant-code/regenerate', requireUser, async (req, res, next) => {
      try {
         const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
         const genCode = () => {
            let s = '';
            for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
            return 'MRC-' + s;
         };

         let code = null;
         for (let tries = 0; tries < 10; tries++) {
            const candidate = genCode();
            const exists = await one('SELECT id FROM users WHERE merchant_code = $1', [candidate]);
            if (!exists) { code = candidate; break; }
         }
         if (!code) return res.status(500).json({ success: false, error: 'Gagal generate merchant code, coba lagi.' });

         await sql('UPDATE users SET merchant_code = $1 WHERE id = $2', [code, req.user.id]);
         res.json({ success: true, data: { merchant_code: code } });
      } catch (e) { next(e); }
   });

   router.delete('/api-keys/:id', requireUser, async (req, res, next) => {
      try {
         await sql('DELETE FROM api_keys WHERE id = $1 AND "userId" = $2', [req.params.id, req.user.id]);
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   // ═══ WEBHOOK ═══
   router.get('/webhook', requireUser, async (req, res, next) => {
      try {
         let row = await one('SELECT "webhookUrl", "webhookSecret" FROM users WHERE id = $1', [req.user.id]);
         if (!row || !row.webhookSecret) {
            const secret = crypto.randomUUID();
            await sql('UPDATE users SET "webhookSecret" = $1 WHERE id = $2', [secret, req.user.id]);
            row = { ...(row || {}), webhookSecret: secret };
         }
         res.json({ success: true, data: row });
      } catch (e) { next(e); }
   });

   router.post('/webhook', requireUser, async (req, res, next) => {
      try {
         const { webhookUrl } = req.body || {};
         const existing = await one('SELECT "webhookSecret" FROM users WHERE id = $1', [req.user.id]);
         if (!existing?.webhookSecret) {
            const secret = crypto.randomUUID();
            await sql('UPDATE users SET "webhookUrl" = $1, "webhookSecret" = $2 WHERE id = $3', [webhookUrl || null, secret, req.user.id]);
         } else {
            await sql('UPDATE users SET "webhookUrl" = $1 WHERE id = $2', [webhookUrl || null, req.user.id]);
         }
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   router.post('/webhook/regenerate', requireUser, async (req, res, next) => {
      try {
         const secret = crypto.randomUUID();
         await sql('UPDATE users SET "webhookSecret" = $1 WHERE id = $2', [secret, req.user.id]);
         res.json({ success: true, data: { webhookSecret: secret } });
      } catch (e) { next(e); }
   });

   // ═══ NOTIFICATIONS ═══
   router.get('/notifications', requireUser, async (req, res, next) => {
      try {
         const limit = Math.min(Number(req.query.limit) || 30, 100);
         const [items, unread] = await Promise.all([
            listNotifications(req.user.id, limit),
            unreadCount(req.user.id),
         ]);
         res.json({ success: true, data: { items, unread } });
      } catch (e) { next(e); }
   });

   router.post('/notifications/read', requireUser, async (req, res, next) => {
      try { await markAllRead(req.user.id); res.json({ success: true }); }
      catch (e) { next(e); }
   });

   router.delete('/notifications', requireUser, async (req, res, next) => {
      try { await clearAll(req.user.id); res.json({ success: true }); }
      catch (e) { next(e); }
   });

   // ═══ WITHDRAWALS ═══
   router.get('/withdrawals', requireUser, async (req, res, next) => {
      try {
         const rows = await all(
            'SELECT id, "wdrId", amount, fee, received, bank, account, status, note, "createdAt", "processedAt" FROM withdrawals WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 100',
            [req.user.id]
         );
         res.json({ success: true, data: rows });
      } catch (e) { next(e); }
   });

   router.post('/withdrawals', requireUser, async (req, res, next) => {
      try {
         if (String(req.get('x-cspay-env') || '').toLowerCase() === 'sandbox' || req.body?.environment === 'sandbox') {
            return res.status(403).json({ success: false, error: 'Mode Sandbox: saldo hanya untuk uji coba dan tidak bisa ditarik. Pindah ke mode Live untuk tarik dana.' });
         }
         const amount = Number(req.body?.amount);
         const bank = (req.body?.bank || '').slice(0, 100);
         const account = (req.body?.account || '').slice(0, 50);
         const note = (req.body?.note || '').slice(0, 200);

         const cfg = await all("SELECT key, value FROM app_settings WHERE key IN ('wd_min','wd_fee_percent','wd_fee_flat')");
         const settings = {};
         cfg.forEach(r => { settings[r.key] = r.value; });

         const WD_MIN = Number(settings.wd_min || 65000);
         const FEE_PERCENT = Number(settings.wd_fee_percent || 2.5);
         const FEE_FLAT = Number(settings.wd_fee_flat || 4500);

         if (!amount || amount < WD_MIN) return res.status(400).json({ error: 'Minimal Rp ' + WD_MIN.toLocaleString('id-ID') });
         if (!bank || !account) return res.status(400).json({ error: 'Bank & rekening wajib' });

         const [paid, wd] = await Promise.all([
            one("SELECT COALESCE(SUM(amount - COALESCE(fee, 0)),0) AS total FROM transactions WHERE \"userId\"=$1 AND status='PAID'", [req.user.id]),
            one("SELECT COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE \"userId\"=$1 AND status IN ('PENDING','APPROVED','DONE')", [req.user.id]),
         ]);

         const available = Number(paid.total) - Number(wd.total);
         if (amount > available) return res.status(400).json({ error: 'Saldo tidak cukup. Tersedia: Rp ' + available.toLocaleString('id-ID') });

         const fee = Math.round(amount * (FEE_PERCENT / 100) + FEE_FLAT);
         const received = amount - fee;
         const wdrId = 'WDR-' + crypto.randomBytes(5).toString('hex').toUpperCase();
         const now = new Date().toISOString();

         await sql('INSERT INTO withdrawals ("wdrId","userId",amount,fee,received,bank,account,status,note,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
                   [wdrId, req.user.id, amount, fee, received, bank, account, 'PENDING', note, now]);

         createNotification(
            req.user.id, 'withdraw', 'Permintaan penarikan dikirim',
            'Penarikan Rp ' + amount.toLocaleString('id-ID') + ' (diterima Rp ' + received.toLocaleString('id-ID') + ') menunggu persetujuan admin.',
            { wdrId, amount, received, bank, account }
         ).catch(() => {});

         res.json({ success: true, data: { wdrId, amount, fee, received, status: 'PENDING' } });
      } catch (e) { next(e); }
   });

   // ═══ BALANCE ═══
   router.get('/balance', requireUser, async (req, res, next) => {
      try {
         const row = await one(
            "SELECT COALESCE((SELECT SUM(amount - COALESCE(fee, 0)) FROM transactions WHERE \"userId\"=$1 AND status='PAID'), 0) AS total_paid, COALESCE((SELECT SUM(amount) FROM transactions WHERE \"userId\"=$1 AND status='PENDING'), 0) AS total_pending, COALESCE((SELECT SUM(amount) FROM withdrawals WHERE \"userId\"=$1 AND status IN ('PENDING','APPROVED','DONE')), 0) AS total_wd",
            [req.user.id]
         );
         const totalPaid = Number(row.total_paid);
         const totalWd = Number(row.total_wd);
         res.json({ success: true, data: {
            available: totalPaid - totalWd,
            pending: Number(row.total_pending),
            totalPaid,
            totalWithdrawn: totalWd,
         }});
      } catch (e) { next(e); }
   });

   // ═══ STATS ═══
   router.get('/stats', requireUser, async (req, res, next) => {
      try {
         const days = Math.min(Number(req.query.days) || 7, 90);

         const [rows, summary] = await Promise.all([
            all('SELECT "createdAt", status, amount FROM transactions WHERE "userId" = $1 AND "createdAt"::timestamptz >= NOW() - ($2 || \' days\')::interval', [req.user.id, days]),
            one("SELECT COUNT(*) FILTER (WHERE status = 'PAID') AS paid, COUNT(*) FILTER (WHERE status = 'PENDING') AS pending, COUNT(*) FILTER (WHERE status = 'EXPIRED') AS expired, COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0) AS total_paid FROM transactions WHERE \"userId\" = $1", [req.user.id]),
         ]);

         const buckets = {};
         for (const r of rows) {
            const key = new Date(r.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            if (!buckets[key]) buckets[key] = { paidAmount: 0, count: 0 };
            if (r.status === 'PAID') { buckets[key].paidAmount += Number(r.amount); buckets[key].count += 1; }
         }

         const series = [];
         for (let i = days - 1; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400000);
            const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            series.push({
               date: key,
               label: d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short' }),
               paidAmount: buckets[key]?.paidAmount || 0,
               count: buckets[key]?.count || 0,
            });
         }

         res.json({ success: true, data: {
            series,
            summary: {
               paid: Number(summary.paid),
               pending: Number(summary.pending),
               expired: Number(summary.expired),
               totalPaid: Number(summary.total_paid),
            },
         }});
      } catch (e) { next(e); }
   });

   return router;
}
