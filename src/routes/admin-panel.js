import { Router } from 'express';
import crypto from 'node:crypto';
import { one, all, sql } from '../db/index.js';
import { verifyTurnstile } from '../services/turnstile.js';
import { createNotification } from '../services/notifications.js';
import { hashPassword } from '../services/auth.js';
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

   // TOP UP SALDO MANUAL (restore saldo user)
   router.post('/users/:id/topup', requireAdmin, async (req, res, next) => {
      try {
         const user = await one(`SELECT id, email, name FROM users WHERE id = $1`, [req.params.id]);
         if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
         const amount = Math.floor(Number(req.body?.amount));
         if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 100 || amount > 50000000) {
            return res.status(400).json({ error: 'Nominal tidak valid (min Rp 100, max Rp 50.000.000)' });
         }
         const note = String(req.body?.note || '').slice(0, 200);
         let feePercent = 2;
         try {
            const row = await one(`SELECT value FROM app_settings WHERE key = 'fee_transaction_percent'`);
            const pct = Number(row?.value);
            if (Number.isFinite(pct) && pct >= 0) feePercent = pct;
         } catch {}
         const fee = Math.round(amount * feePercent / 100);
         const net = Math.max(0, amount - fee);
         const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
         const trxId = 'CSP-' + Array.from(crypto.randomBytes(10)).map((b) => A[b % A.length]).join('');
         const now = new Date().toISOString();
         await sql(
            `INSERT INTO transactions
               ("trxId","userId",status,amount,fee,net,"merchantAmount","feePercent",total,"payAmount","qrString","createdAt","expiresAt","paidAt",metadata)
             VALUES ($1,$2,'PAID',$3,$4,$5,$5,$6,$3,$3,'MANUAL-TOPUP',$7,$7,$7,$8::jsonb)`,
            [trxId, user.id, amount, fee, net, feePercent, now,
             JSON.stringify({ topup: true, note: note || undefined, by: 'admin' })]
         );
         await sql(`UPDATE users SET balance = balance + $1 WHERE id = $2`, [net, user.id]);
         await createNotification(user.id, 'payment', 'Saldo tersedia bertambah',
            'Saldo ditambahkan admin. Saldo Tersedia +Rp ' + net.toLocaleString('id-ID') + '.' + (note ? ' Catatan: ' + note : ''),
            { trxId, amount, fee, net, topup: true });
         const u = await one(`SELECT balance FROM users WHERE id = $1`, [user.id]);
         res.json({ success: true, data: { trxId, amount, fee, feePercent, net, balance: Number(u?.balance || 0) } });
      } catch (e) { next(e); }
   });

   router.post('/users/:id/password', requireAdmin, async (req, res, next) => {
      try {
         const user = await one(`SELECT id FROM users WHERE id = $1`, [req.params.id]);
         if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
         const pw = String(req.body?.password || '');
         if (pw.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
         await sql(`UPDATE users SET password = $1 WHERE id = $2`, [await hashPassword(pw), req.params.id]);
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   router.post('/users/:id/email', requireAdmin, async (req, res, next) => {
      try {
         const user = await one(`SELECT id FROM users WHERE id = $1`, [req.params.id]);
         if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
         const email = String(req.body?.email || '').trim().toLowerCase();
         if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Format email tidak valid' });
         const dup = await one(`SELECT id FROM users WHERE email = $1 AND id <> $2`, [email, req.params.id]);
         if (dup) return res.status(400).json({ error: 'Email sudah dipakai user lain' });
         await sql(`UPDATE users SET email = $1 WHERE id = $2`, [email, req.params.id]);
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   // BACKUP ZIP (.env + dump semua tabel)
   function sqlVal(v) {
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'number') return String(v);
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
      if (v instanceof Date) return `'${v.toISOString()}'`;
      if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
      return `'${String(v).replace(/'/g, "''")}'`;
   }
   function crc32(buf) {
      if (!crc32.table) {
         crc32.table = new Int32Array(256);
         for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            crc32.table[n] = c;
         }
      }
      let crc = -1;
      for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crc32.table[(crc ^ buf[i]) & 0xFF];
      return (crc ^ -1) >>> 0;
   }
   function zipStore(entries) {
      const chunks = []; const central = []; let offset = 0;
      const now = new Date();
      const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | (Math.floor(now.getSeconds() / 2) & 0x1f);
      const dosDate = (((now.getFullYear() - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0xf) << 5) | (now.getDate() & 0x1f);
      for (const e of entries) {
         const nameBuf = Buffer.from(e.name, 'utf8');
         const crc = crc32(e.data);
         const lh = Buffer.alloc(30);
         lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6);
         lh.writeUInt16LE(0, 8); lh.writeUInt16LE(dosTime, 10); lh.writeUInt16LE(dosDate, 12);
         lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(e.data.length, 18); lh.writeUInt32LE(e.data.length, 22);
         lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
         chunks.push(lh, nameBuf, e.data);
         const ch = Buffer.alloc(46);
         ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
         ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(0, 10);
         ch.writeUInt16LE(dosTime, 12); ch.writeUInt16LE(dosDate, 14);
         ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(e.data.length, 20); ch.writeUInt32LE(e.data.length, 24);
         ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32);
         ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(offset, 42);
         central.push(Buffer.concat([ch, nameBuf]));
         offset += 30 + nameBuf.length + e.data.length;
      }
      const cdBuf = Buffer.concat(central);
      const eocd = Buffer.alloc(22);
      eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
      eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
      eocd.writeUInt32LE(cdBuf.length, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20);
      return Buffer.concat([...chunks, cdBuf, eocd]);
   }
   router.get('/backup', requireAdmin, async (req, res, next) => {
      try {
         const skipEnv = (k) => /^(npm_|NODE_|VERCEL_|LAMBDA_|AWS_|LD_)/.test(k) ||
            ['PATH', 'HOME', 'PWD', 'TMPDIR', 'LANG', 'TZ', 'PORT', 'SHLVL', '_', 'INIT_CWD', 'TERM', 'SHELL', 'USER', 'LOGNAME'].includes(k);
         const envOut = Object.entries(process.env)
            .filter(([k]) => !skipEnv(k))
            .map(([k, v]) => `${k}=${v}`)
            .sort((a, b) => a.localeCompare(b))
            .join('\n');
         let dbSql = '';
         try {
            const tables = (await all(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`))
               .map((r) => r.table_name);
            dbSql = `-- G2CSPAY BACKUP ${new Date().toISOString()}\n-- Restore: jalankan migrations/schema.sql dulu, lalu file ini\nBEGIN;\n`;
            for (const t of tables) {
               const rows = await all(`SELECT * FROM "${t}"`);
               if (!rows.length) { dbSql += `\n-- ${t}: (kosong)\n`; continue; }
               dbSql += `\n-- ${t} (${rows.length} baris)\n`;
               for (const row of rows) {
                  const cols = Object.keys(row).map((c) => `"${c}"`).join(',');
                  const vals = Object.values(row).map(sqlVal).join(',');
                  dbSql += `INSERT INTO "${t}" (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
               }
            }
            dbSql += '\nCOMMIT;\n';
         } catch (e) { dbSql = '-- DB dump gagal: ' + e.message + '\n'; }
         const info = JSON.stringify({ app: 'g2cspay', backupAt: new Date().toISOString(), isi: ['.env', 'database.sql', 'info.json'] }, null, 2);
         const zip = zipStore([
            { name: '.env', data: Buffer.from(envOut, 'utf8') },
            { name: 'database.sql', data: Buffer.from(dbSql, 'utf8') },
            { name: 'info.json', data: Buffer.from(info, 'utf8') },
         ]);
         res.setHeader('Content-Type', 'application/zip');
         res.setHeader('Content-Disposition', `attachment; filename="backup-g2cspay-${new Date().toISOString().slice(0, 10)}.zip"`);
         res.setHeader('Content-Length', String(zip.length));
         res.send(zip);
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
         const allowed = ['maintenance_mode', 'maintenance_message', 'maintenance_eta', 'site_name', 'site_title', 'site_description', 'site_keywords', 'logo_url', 'marquee_text', 'marquee_items', 'footer_text', 'wd_min', 'wd_fee_percent', 'wd_fee_flat', 'fee_transaction_percent', 'hero_title', 'hero_lead', 'favicon_url', 'footer_copyright', 'og_url', 'marquee_banks', 'brand_tagline', 'theme_color', 'logo_height', 'bank_logo_shape', 'bank_logo_gray'];
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
