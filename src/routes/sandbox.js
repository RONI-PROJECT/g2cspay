/**
 * Sandbox API gaya Midtrans. Auth: API Key sandbox (SB-rp_live_...).
 * Data di transactions_sandbox, terpisah dari produksi. Tidak ada uang berpindah.
 *
 *   POST /api/sandbox/charge
 *   GET  /api/sandbox/transaction/:order_id/status
 *   GET  /api/sandbox/transaction/:order_id/qr
 *   POST /api/sandbox/transaction/:order_id/cancel
 *   POST /api/sandbox/transaction/:order_id/pay      (simulasi bayar)
 *   POST /api/sandbox/transaction/:order_id/expire   (simulasi kedaluwarsa)
 *   POST /api/sandbox/transaction/:order_id/notification/resend
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { one, all, sql } from '../db/index.js';
import { apiError, money, toTime, signatureKey } from '../services/format.js';

const REF = /^[\w.-]{1,64}$/;
const MAX = 100000000;

let ready;
function ensureSchema() {
   if (!ready) {
      ready = (async () => {
         await sql(`CREATE TABLE IF NOT EXISTS transactions_sandbox (
            "trxId"         TEXT PRIMARY KEY,
            "userId"        TEXT NOT NULL,
            status          TEXT NOT NULL,
            amount          BIGINT NOT NULL,
            fee             BIGINT NOT NULL DEFAULT 0,
            total           BIGINT NOT NULL,
            "amountToPay"   BIGINT NOT NULL,
            "qrString"      TEXT NOT NULL,
            "qrImageUrl"    TEXT,
            "createdAt"     TEXT NOT NULL,
            "expiresAt"     TEXT NOT NULL,
            "paidAt"        TEXT,
            "orderId"       TEXT,
            "customerName"  TEXT,
            "customerEmail" TEXT
         )`);
         await sql(`CREATE INDEX IF NOT EXISTS idx_sbx_user_order ON transactions_sandbox("userId", "orderId")`);
         await sql(`CREATE INDEX IF NOT EXISTS idx_sbx_created ON transactions_sandbox("createdAt" DESC)`);
      })().catch((e) => { ready = null; throw e; });
   }
   return ready;
}

function statusOf(t) {
   if (t.status === 'PAID') return { transaction_status: 'settlement', status_code: '200', status_message: 'Transaksi berhasil dibayar' };
   if (t.status === 'CANCELED') return { transaction_status: 'cancel', status_code: '202', status_message: 'Transaksi dibatalkan' };
   if (t.status === 'EXPIRED') return { transaction_status: 'expire', status_code: '407', status_message: 'Transaksi kedaluwarsa' };
   return { transaction_status: 'pending', status_code: '201', status_message: 'Menunggu pembayaran' };
}

function shape(t, base, message) {
   const st = statusOf(t);
   const oid = t.orderId || t.trxId;
   const out = {
      status_code: st.status_code,
      status_message: message || st.status_message,
      transaction_id: t.trxId,
      order_id: oid,
      gross_amount: money(t.amount),
      currency: 'IDR',
      payment_type: 'qris',
      transaction_time: toTime(t.createdAt),
      transaction_status: st.transaction_status,
      fraud_status: 'accept',
      expiry_time: toTime(t.expiresAt),
      qr_string: t.qrString,
      actions: [{ name: 'generate-qr-code', method: 'GET', url: `${base}/api/sandbox/transaction/${encodeURIComponent(oid)}/qr` }],
      sandbox: true,
   };
   if (t.paidAt) out.settlement_time = toTime(t.paidAt);
   return out;
}

export function sandboxRoutes() {
   const router = Router();
   const wrap = (h) => (req, res, next) => Promise.resolve(h(req, res, next)).catch(next);
   const baseOf = (req) => `${req.protocol}://${req.get('host')}`;

   async function guard(req, res, next) {
      try {
         await ensureSchema();
         const auth = req.get('authorization') || '';
         let key = req.get('x-api-key') || '';
         if (!key && auth.startsWith('Bearer ')) key = auth.slice(7);
         if (!key && auth.startsWith('Basic ')) {
            try { key = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':')[0]; } catch {}
         }
         if (!key) return apiError(res, 401, 'API Key tidak ditemukan');
         const row = await one(
            `SELECT k.*, u.id AS "userId", u.status AS "userStatus"
             FROM api_keys k JOIN users u ON u.id = k."userId"
             WHERE k.key = $1 AND k.status = 'active'`, [key]);
         if (!row) return apiError(res, 401, 'API Key tidak valid');
         if (row.environment !== 'sandbox') return apiError(res, 403, 'Gunakan API Key sandbox (SB-rp_live_...)');
         if (row.userStatus !== 'active') return apiError(res, 403, 'Akun disuspend');
         req.user = { id: row.userId };
         next();
      } catch (e) { next(e); }
   }

   async function find(req) {
      const id = req.params.order_id;
      const t = await one(
         `SELECT * FROM transactions_sandbox WHERE ("orderId" = $1 OR "trxId" = $1) AND "userId" = $2 ORDER BY "createdAt" DESC LIMIT 1`,
         [id, req.user.id]);
      if (t && t.status === 'PENDING' && new Date(t.expiresAt).getTime() < Date.now()) {
         await sql(`UPDATE transactions_sandbox SET status = 'EXPIRED' WHERE "trxId" = $1`, [t.trxId]);
         t.status = 'EXPIRED';
      }
      return t;
   }

   router.post('/charge', guard, wrap(async (req, res) => {
      const b = req.body || {};
      const pt = b.payment_type;
      if (pt && String(pt).toLowerCase() !== 'qris') return apiError(res, 400, 'payment_type yang didukung: qris');
      const td = b.transaction_details || {};
      const amount = Math.round(Number(td.gross_amount ?? b.amount));
      if (!Number.isInteger(amount) || amount < 1000 || amount > MAX) {
         return apiError(res, 400, `gross_amount harus bilangan bulat 1000 - ${MAX}`, { validation_messages: ['gross_amount tidak valid'] });
      }
      const orderId = td.order_id != null ? String(td.order_id) : 'SBX-' + crypto.randomBytes(6).toString('hex').toUpperCase();
      if (!REF.test(orderId)) return apiError(res, 400, 'order_id tidak valid (maks 64 karakter: huruf, angka, . _ -)');
      const dup = await one(`SELECT 1 FROM transactions_sandbox WHERE "orderId" = $1 AND "userId" = $2`, [orderId, req.user.id]);
      if (dup) return apiError(res, 406, 'order_id sudah dipakai transaksi lain');

      const ce = b.custom_expiry || {};
      const mult = ce.unit === 'hour' ? 60 : ce.unit === 'day' ? 1440 : 1;
      const minutes = Math.min(Math.max(Number(ce.expiry_duration) * mult || 15, 1), 1440);
      const cd = b.customer_details || {};
      const trxId = 'SBX-' + crypto.randomBytes(8).toString('hex').toUpperCase();
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + minutes * 60000).toISOString();
      const qrString = `SANDBOX|${trxId}|${amount}`;
      const qrImageUrl = await QRCode.toDataURL(qrString, { width: 400, margin: 2, errorCorrectionLevel: 'M' });

      await sql(
         `INSERT INTO transactions_sandbox
          ("trxId","userId",status,amount,fee,total,"amountToPay","qrString","qrImageUrl","createdAt","expiresAt","orderId","customerName","customerEmail")
          VALUES ($1,$2,'PENDING',$3,0,$3,$3,$4,$5,$6,$7,$8,$9,$10)`,
         [trxId, req.user.id, amount, qrString, qrImageUrl, now, expiresAt, orderId,
            [cd.first_name, cd.last_name].filter(Boolean).join(' ') || null, cd.email || null]);

      const t = await one(`SELECT * FROM transactions_sandbox WHERE "trxId" = $1`, [trxId]);
      res.status(201).json(shape(t, baseOf(req), 'Transaksi sandbox berhasil dibuat'));
   }));

   router.get('/transaction/:order_id/status', guard, wrap(async (req, res) => {
      const t = await find(req);
      if (!t) return apiError(res, 404, 'Transaksi tidak ditemukan');
      res.json(shape(t, baseOf(req)));
   }));

   router.get('/transaction/:order_id/qr', guard, wrap(async (req, res) => {
      const t = await find(req);
      if (!t) return apiError(res, 404, 'Transaksi tidak ditemukan');
      const png = await QRCode.toBuffer(t.qrString, { scale: 8, errorCorrectionLevel: 'M' });
      res.setHeader('Cache-Control', 'no-store');
      res.type('png').send(png);
   }));

   router.post('/transaction/:order_id/cancel', guard, wrap(async (req, res) => {
      const t = await find(req);
      if (!t) return apiError(res, 404, 'Transaksi tidak ditemukan');
      if (t.status !== 'PENDING') return apiError(res, 412, `Transaksi tidak bisa dibatalkan, status saat ini: ${statusOf(t).transaction_status}`);
      await sql(`UPDATE transactions_sandbox SET status = 'CANCELED' WHERE "trxId" = $1`, [t.trxId]);
      t.status = 'CANCELED';
      res.json(shape(t, baseOf(req), 'Transaksi berhasil dibatalkan'));
   }));

   // Simulasi: tandai lunas
   router.post('/transaction/:order_id/pay', guard, wrap(async (req, res) => {
      const t = await find(req);
      if (!t) return apiError(res, 404, 'Transaksi tidak ditemukan');
      if (t.status !== 'PENDING') return apiError(res, 412, `Transaksi sudah ${statusOf(t).transaction_status}`);
      const paidAt = new Date().toISOString();
      await sql(`UPDATE transactions_sandbox SET status = 'PAID', "paidAt" = $1 WHERE "trxId" = $2`, [paidAt, t.trxId]);
      t.status = 'PAID'; t.paidAt = paidAt;
      res.json(shape(t, baseOf(req)));
   }));

   // Simulasi: kedaluwarsa
   router.post('/transaction/:order_id/expire', guard, wrap(async (req, res) => {
      const t = await find(req);
      if (!t) return apiError(res, 404, 'Transaksi tidak ditemukan');
      if (t.status !== 'PENDING') return apiError(res, 412, `Transaksi sudah ${statusOf(t).transaction_status}`);
      await sql(`UPDATE transactions_sandbox SET status = 'EXPIRED' WHERE "trxId" = $1`, [t.trxId]);
      t.status = 'EXPIRED';
      res.json(shape(t, baseOf(req)));
   }));

   // Bentuk notifikasi (tanpa kirim ke URL merchant) untuk uji verifikasi signature_key
   router.post('/transaction/:order_id/notification/resend', guard, wrap(async (req, res) => {
      const t = await find(req);
      if (!t) return apiError(res, 404, 'Transaksi tidak ditemukan');
      if (t.status === 'PENDING') return apiError(res, 412, 'Transaksi masih pending, tidak ada notifikasi untuk dikirim');
      const st = statusOf(t);
      const oid = t.orderId || t.trxId;
      const key = (req.get('x-api-key') || (req.get('authorization') || '').replace(/^Bearer /, '')).trim();
      res.json({
         status_code: '200',
         status_message: 'Notifikasi sandbox dibentuk ulang',
         notification: {
            transaction_status: st.transaction_status,
            transaction_id: t.trxId,
            order_id: oid,
            status_code: st.status_code,
            gross_amount: money(t.amount),
            payment_type: 'qris',
            signature_key: signatureKey(oid, st.status_code, money(t.amount), key),
         },
      });
   }));

   // Saldo uji coba (tidak nyata). Tidak pernah bisa ditarik.
   router.get('/balance', guard, wrap(async (req, res) => {
      const r = await one(`SELECT COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0) AS paid, COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0) AS pending FROM transactions_sandbox WHERE "userId" = $1`, [req.user.id]);
      res.json({ status_code: '200', status_message: 'OK', sandbox: true, test_balance: money(Number(r.paid)), pending: money(Number(r.pending)), withdrawable: money(0), note: 'Saldo sandbox hanya untuk tes dan tidak bisa ditarik.' });
   }));
   router.post('/withdraw', guard, wrap(async (req, res) => apiError(res, 403, 'Sandbox: saldo uji coba tidak bisa ditarik. Gunakan API Key production untuk dana nyata.')));

   router.get('/health', (req, res) => res.json({ status_code: '200', status_message: 'OK', sandbox: true, time: new Date().toISOString() }));

   return router;
}
