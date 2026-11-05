import { Router } from 'express';
import crypto from 'node:crypto';
import { one, all, sql } from '../db/index.js';
import { verifyTurnstile } from '../services/turnstile.js';
import { ensureAssets, ASSET_KEY_RE, ASSET_MIME, MAX_ASSET_BYTES, assetSettingFor } from './assets.js';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_DAYS = 7;

function safeEqual(a, b, len) {
   const bufA = Buffer.alloc(len);
   const bufB = Buffer.alloc(len);
   Buffer.from(String(a).slice(0, len)).copy(bufA);
   Buffer.from(String(b).slice(0, len)).copy(bufB);
   return crypto.timingSafeEqual(bufA, bufB);
}

export function adminPanelRoutes() {
   const router = Router();

   // ═══ LOGIN ADMIN ═══
   router.post('/login', async (req, res, next) => {
      try {
         const { username, password } = req.body || {};
         if (!username || !password) {
            return res.status(400).json({ error: 'Username & password wajib' });
         }
         const cap = await verifyTurnstile(req.body?.turnstileToken, req.ip);
         if (!cap.ok) return res.status(400).json({ error: cap.error });

         const userOk = safeEqual(username, ADMIN_USERNAME, 64);
         const passOk = safeEqual(password, ADMIN_PASSWORD, 128);

         if (!userOk || !passOk) {
            return res.status(401).json({ error: 'Username atau password salah' });
         }

         const token = crypto.randomBytes(32).toString('hex');
         const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

         await sql(
            `INSERT INTO admin_sessions (token, username, "expiresAt")
             VALUES ($1, $2, $3)`,
            [token, ADMIN_USERNAME, expiresAt]
         );

         res.cookie('admin_session', token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
         });

         res.json({ success: true, data: { username: ADMIN_USERNAME } });
      } catch (e) { next(e); }
   });

   // ═══ LOGOUT ═══
   router.post('/logout', async (req, res, next) => {
      try {
         const token = req.cookies?.admin_session;
         if (token) await sql('DELETE FROM admin_sessions WHERE token = $1', [token]);
         res.clearCookie('admin_session');
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   // ═══ GUARD ═══
   async function requireAdmin(req, res, next) {
      try {
         const token = req.cookies?.admin_session;
         if (!token) return res.status(401).json({ error: 'Login admin required' });

         const session = await one(
            `SELECT * FROM admin_sessions WHERE token = $1 AND "expiresAt"::timestamptz > NOW()`,
            [token]
         );
         if (!session) return res.status(401).json({ error: 'Session kadaluwarsa' });

         sql('UPDATE admin_sessions SET "lastSeenAt" = NOW() WHERE token = $1', [token]).catch(() => {});

         req.admin = { username: session.username };
         next();
      } catch (e) { next(e); }
   }

   // ═══ ME ═══
   router.get('/me', requireAdmin, async (req, res) => {
      res.json({ success: true, data: req.admin });
   });

   // ═══ STATS ═══
   router.get('/stats', requireAdmin, async (req, res, next) => {
      try {
         const [users, trx, wd, pendingWd, settings] = await Promise.all([
            one(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'active') AS active FROM users`),
            one(`SELECT
                   COUNT(*) AS total,
                   COUNT(*) FILTER (WHERE status = 'PAID') AS paid,
                   COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
                   COUNT(*) FILTER (WHERE status = 'EXPIRED') AS expired,
                   COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0) AS paid_volume
                 FROM transactions`),
            one(`SELECT
                   COUNT(*) AS total,
                   COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_count,
                   COUNT(*) FILTER (WHERE status = 'DONE') AS done_count,
                   COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0) AS pending_amount,
                   COALESCE(SUM(amount) FILTER (WHERE status = 'DONE'), 0) AS done_amount,
                   COALESCE(SUM(fee) FILTER (WHERE status IN ('PENDING','APPROVED','DONE')), 0) AS total_fee
                 FROM withdrawals`),
            all(`SELECT "wdrId", amount, fee, received, bank, account, status, "createdAt"
                 FROM withdrawals WHERE status = 'PENDING'
                 ORDER BY "createdAt" ASC LIMIT 5`),
            one(`SELECT value FROM app_settings WHERE key = 'maintenance_mode'`),
         ]);

         res.json({
            success: true,
            data: {
               users: { total: Number(users.total), active: Number(users.active) },
               transactions: {
                  total: Number(trx.total), paid: Number(trx.paid),
                  pending: Number(trx.pending), expired: Number(trx.expired),
                  paidVolume: Number(trx.paid_volume),
               },
               withdrawals: {
                  total: Number(wd.total),
                  pendingCount: Number(wd.pending_count),
                  pendingAmount: Number(wd.pending_amount),
                  doneCount: Number(wd.done_count),
                  doneAmount: Number(wd.done_amount),
                  totalFee: Number(wd.total_fee || 0),
               },
               pendingWithdrawals: pendingWd,
               maintenance: settings?.value === 'true',
            },
         });
      } catch (e) { next(e); }
   });

   // ═══ USERS ═══
   router.get('/users', requireAdmin, async (req, res, next) => {
      try {
         const q = (req.query.q || '').toString().slice(0, 100);
         const rows = await all(
            `SELECT id, email, name, role, status, "isAdmin", balance, "createdAt", "lastLoginAt"
             FROM users
             ${q ? `WHERE email ILIKE $1 OR name ILIKE $1` : ''}
             ORDER BY "createdAt" DESC LIMIT 100`,
            q ? [`%${q}%`] : []
         );
         res.json({ success: true, data: rows });
      } catch (e) { next(e); }
   });

   router.post('/users/:id/ban', requireAdmin, async (req, res, next) => {
      try {
         await sql(`UPDATE users SET status = 'banned' WHERE id = $1`, [req.params.id]);
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   router.post('/users/:id/unban', requireAdmin, async (req, res, next) => {
      try {
         await sql(`UPDATE users SET status = 'active' WHERE id = $1`, [req.params.id]);
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   router.post('/users/:id/admin', requireAdmin, async (req, res, next) => {
      try {
         const flag = req.body?.isAdmin === true;
         await sql(`UPDATE users SET "isAdmin" = $1 WHERE id = $2`, [flag, req.params.id]);
         res.json({ success: true, isAdmin: flag });
      } catch (e) { next(e); }
   });

   // ═══ WITHDRAWALS ═══
   router.get('/withdrawals', requireAdmin, async (req, res, next) => {
      try {
         const status = (req.query.status || '').toString().toUpperCase();
         const filter = ['PENDING', 'APPROVED', 'DONE', 'REJECTED'].includes(status)
            ? `WHERE w.status = '${status}'` : '';

         const rows = await all(`
            SELECT w.id, w."wdrId", w."userId", w.amount, w.fee, w.received,
                   w.bank, w.account, w.status, w.note,
                   w."createdAt", w."processedAt",
                   u.email, u.name
            FROM withdrawals w
            LEFT JOIN users u ON u.id = w."userId"
            ${filter}
            ORDER BY w."createdAt" DESC LIMIT 200
         `);
         res.json({ success: true, data: rows });
      } catch (e) { next(e); }
   });

   router.post('/withdrawals/:id/approve', requireAdmin, async (req, res, next) => {
      try {
         const w = await one(`SELECT * FROM withdrawals WHERE id = $1`, [req.params.id]);
         if (!w) return res.status(404).json({ error: 'Withdrawal tidak ditemukan' });
         if (w.status !== 'PENDING') return res.status(400).json({ error: `Status sekarang: ${w.status}` });

         await sql(`UPDATE withdrawals SET status = 'APPROVED', "processedAt" = NOW() WHERE id = $1`, [req.params.id]);
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   router.post('/withdrawals/:id/reject', requireAdmin, async (req, res, next) => {
      try {
         const w = await one(`SELECT * FROM withdrawals WHERE id = $1`, [req.params.id]);
         if (!w) return res.status(404).json({ error: 'Withdrawal tidak ditemukan' });
         if (w.status !== 'PENDING') return res.status(400).json({ error: `Status sekarang: ${w.status}` });

         const reason = (req.body?.reason || '').slice(0, 200);
         await sql(
            `UPDATE withdrawals SET status = 'REJECTED', note = $1, "processedAt" = NOW() WHERE id = $2`,
            [reason ? `DITOLAK: ${reason}` : 'DITOLAK', req.params.id]
         );
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   router.post('/withdrawals/:id/done', requireAdmin, async (req, res, next) => {
      try {
         await sql(`UPDATE withdrawals SET status = 'DONE', "processedAt" = NOW() WHERE id = $1`, [req.params.id]);
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   // ═══ TRANSACTIONS ═══
   router.get('/transactions', requireAdmin, async (req, res, next) => {
      try {
         const status = (req.query.status || '').toString().toUpperCase();
         const filter = ['PENDING', 'PAID', 'EXPIRED'].includes(status)
            ? `AND t.status = '${status}'` : '';

         const rows = await all(`
            SELECT t."trxId", t."userId", t.status, t.amount, t."payAmount",
                   u.email
            FROM transactions t
            LEFT JOIN users u ON u.id = t."userId"
            WHERE 1=1 ${filter}
            ORDER BY t."createdAt" DESC LIMIT 200
         `);
         res.json({ success: true, data: rows });
      } catch (e) { next(e); }
   });

   // ═══ UPLOAD ASET (logo, favicon, og, logo bank) ═══
   router.post('/upload', requireAdmin, async (req, res, next) => {
      try {
         const { key, dataUrl } = req.body || {};
         if (!ASSET_KEY_RE.test(String(key || ''))) return res.status(400).json({ error: 'Key aset tidak valid' });
         const m = /^data:([a-z0-9.+\/-]+);base64,([A-Za-z0-9+\/=]+)$/i.exec(String(dataUrl || ''));
         if (!m || !ASSET_MIME.includes(m[1].toLowerCase())) {
            return res.status(400).json({ error: 'Format harus PNG, JPG, WEBP, GIF atau ICO' });
         }
         if (Buffer.byteLength(m[2], 'base64') > MAX_ASSET_BYTES) {
            return res.status(400).json({ error: 'Ukuran gambar maksimal 1.5 MB' });
         }
         await ensureAssets();
         await sql(
            `INSERT INTO app_assets (key, mime, data, "updatedAt") VALUES ($1, $2, $3, NOW()::text)
             ON CONFLICT (key) DO UPDATE SET mime = $2, data = $3, "updatedAt" = NOW()::text`,
            [key, m[1].toLowerCase(), m[2]]
         );
         const url = await assetSettingFor(key, true);
         res.json({ success: true, url });
      } catch (e) { next(e); }
   });

   router.delete('/upload/:key', requireAdmin, async (req, res, next) => {
      try {
         const key = String(req.params.key || '');
         if (!ASSET_KEY_RE.test(key)) return res.status(400).json({ error: 'Key aset tidak valid' });
         await ensureAssets();
         await sql('DELETE FROM app_assets WHERE key = $1', [key]);
         await assetSettingFor(key, false);
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   // ═══ SETTINGS ═══
   router.get('/settings', requireAdmin, async (req, res, next) => {
      try {
         const rows = await all(`SELECT key, value FROM app_settings`);
         const map = {};
         rows.forEach(r => { map[r.key] = r.value; });
         res.json({ success: true, data: map });
      } catch (e) { next(e); }
   });

   router.post('/settings', requireAdmin, async (req, res, next) => {
      try {
         const updates = req.body || {};
         const allowed = ['maintenance_mode', 'maintenance_message', 'maintenance_eta', 'site_name', 'site_title', 'site_description', 'site_keywords', 'logo_url', 'marquee_text', 'marquee_items', 'footer_text', 'wd_min', 'wd_fee_percent', 'wd_fee_flat', 'fee_transaction_percent', 'hero_title', 'hero_lead', 'favicon_url', 'footer_copyright', 'og_url', 'marquee_banks', 'brand_tagline'];
         for (const [k, v] of Object.entries(updates)) {
            if (!allowed.includes(k)) continue;
            await sql(
               `INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
               [k, String(v)]
            );
         }
         globalThis.__bustSettings?.();
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   router.post('/maintenance', requireAdmin, async (req, res, next) => {
      try {
         const enabled = req.body?.enabled === true;
         await sql(
            `INSERT INTO app_settings (key, value) VALUES ('maintenance_mode', $1) ON CONFLICT (key) DO UPDATE SET value = $1`,
            [enabled ? 'true' : 'false']
         );
         globalThis.__bustSettings?.();
         res.json({ success: true, enabled });
      } catch (e) { next(e); }
   });


   // ═══ DANGER: Hapus semua user (kecuali admin) ═══
   router.post('/users/delete-all', requireAdmin, async (req, res, next) => {
      try {
         const confirm = String(req.body?.confirm || '').trim();
         if (confirm !== 'HAPUS SEMUA USER') {
            return res.status(400).json({ error: 'Konfirmasi tidak cocok' });
         }

         // Hitung dulu
         const before = await one(`SELECT COUNT(*) AS total FROM users WHERE "isAdmin" IS NOT TRUE`);
         const total = Number(before.total);

         if (total === 0) {
            return res.json({ success: true, deleted: 0 });
         }

         // Hapus data turunan
         await sql(`DELETE FROM admin_sessions WHERE 1=1`).catch(() => {});
         await sql(`DELETE FROM sessions WHERE "userId" IN (SELECT id FROM users WHERE "isAdmin" IS NOT TRUE)`).catch(() => {});
         await sql(`DELETE FROM webhook_logs WHERE "userId" IN (SELECT id FROM users WHERE "isAdmin" IS NOT TRUE)`).catch(() => {});
         await sql(`DELETE FROM notifications WHERE "userId" IN (SELECT id FROM users WHERE "isAdmin" IS NOT TRUE)`).catch(() => {});
         await sql(`DELETE FROM withdrawals WHERE "userId" IN (SELECT id FROM users WHERE "isAdmin" IS NOT TRUE)`).catch(() => {});
         await sql(`DELETE FROM transactions WHERE "userId" IN (SELECT id FROM users WHERE "isAdmin" IS NOT TRUE)`).catch(() => {});
         await sql(`DELETE FROM api_keys WHERE "userId" IN (SELECT id FROM users WHERE "isAdmin" IS NOT TRUE)`).catch(() => {});

         // Hapus users
         await sql(`DELETE FROM users WHERE "isAdmin" IS NOT TRUE`);

         res.json({ success: true, deleted: total });
      } catch (e) { next(e); }
   });

   // ═══ Hapus SEMUA user ═══
   router.post('/delete-all-users', requireAdmin, async (req, res, next) => {
      try {
         const before = await one(`SELECT COUNT(*) AS total FROM users`);
         const total = Number(before.total);

         if (total === 0) {
            return res.json({ success: true, deleted: 0 });
         }

         await sql(`DELETE FROM sessions`).catch(() => {});
         await sql(`DELETE FROM webhook_logs`).catch(() => {});
         await sql(`DELETE FROM notifications`).catch(() => {});
         await sql(`DELETE FROM withdrawals`).catch(() => {});
         await sql(`DELETE FROM transactions`).catch(() => {});
         await sql(`DELETE FROM api_keys`).catch(() => {});
         await sql(`DELETE FROM users`);

         res.json({ success: true, deleted: total });
      } catch (e) { next(e); }
   });

   return router;
}
