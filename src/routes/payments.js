import express from 'express';
import QRCode from 'qrcode';
import { config } from '../config.js';
import { log } from '../logger.js';
import { validateWebhookUrl, isAuthenticated } from '../security.js';
import * as transactions from '../db/transactions.js';
import * as webhookStore from '../db/webhooks.js';
import * as payments from '../services/payments.js';
import * as webhooks from '../services/webhooks.js';
import { cycleIfStale } from '../services/poller.js';
import { toTransaction, apiError, statusOf } from '../services/format.js';

const REF_PATTERN = /^[\w.-]{1,64}$/;

const fail = (res, status, message, extra) => apiError(res, status, message, extra);

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const baseUrlFor = (req) => config.publicUrl || `${req.protocol}://${req.get('host')}`;

const toInt = (v) => (typeof v === 'number' ? v : /^\s*-?\d+\s*$/.test(String(v)) ? Number(v) : NaN);

// Body gaya Midtrans (transaction_details, customer_details, custom_expiry) -> field internal.
function normalizeBody(b = {}) {
   const td = b.transaction_details || {};
   const cd = b.customer_details || {};
   const ce = b.custom_expiry || {};
   const out = { ...b };
   if (td.gross_amount != null) out.amount = Math.round(Number(td.gross_amount));
   if (td.order_id != null) out.reference = td.order_id;
   if (ce.expiry_duration != null) {
      const mult = ce.unit === 'hour' ? 60 : ce.unit === 'day' ? 1440 : 1;
      out.expires_minutes = Number(ce.expiry_duration) * mult;
   }
   if (cd.first_name || cd.email) {
      out.metadata = { ...(b.metadata || {}), customer_name: [cd.first_name, cd.last_name].filter(Boolean).join(' ') || undefined, customer_email: cd.email };
   }
   return out;
}

async function parseCreateBody(body = {}, headers) {
   const amount = toInt(body.amount);
   if (!Number.isInteger(amount) || amount <= 0 || amount > config.maxAmount) {
      return { error: 'invalid_amount', message: `gross_amount harus bilangan bulat 1 - ${config.maxAmount}` };
   }

   let fee = 0;
   if (body.fee != null) {
      fee = toInt(body.fee);
   } else {
      try {
         const { one } = await import('../db/index.js');
         const row = await one("SELECT value FROM app_settings WHERE key = 'fee_transaction_percent'");
         const pct = parseFloat(row?.value || '0');
         if (pct > 0) fee = Math.round(amount * pct / 100);
      } catch {}
   }
   if (!Number.isInteger(fee) || fee < 0 || fee > config.maxAmount) {
      return { error: 'invalid_fee', message: `fee must be an integer between 0 and ${config.maxAmount}` };
   }

   const expireMinutes = (body.expires_minutes ?? body.expireMinutes) == null
      ? config.expireMinutes
      : toInt(body.expires_minutes ?? body.expireMinutes);
   if (!Number.isInteger(expireMinutes) || expireMinutes <= 0 || expireMinutes > config.maxExpireMinutes) {
      return { error: 'invalid_expires_minutes', message: `expires_minutes must be an integer between 1 and ${config.maxExpireMinutes}` };
   }

   const callbackUrl = typeof (body.callback_url ?? body.callbackUrl) === 'string'
      ? (body.callback_url ?? body.callbackUrl) : null;
   if (callbackUrl) {
      const check = validateWebhookUrl(callbackUrl);
      if (!check.ok) return { error: 'invalid_callback_url', message: check.error };
   }

   let callbackSecret = null;
   const rawSecret = body.callback_secret ?? body.callbackSecret;
   if (rawSecret != null) {
      callbackSecret = String(rawSecret);
      if (callbackSecret.length < 8 || callbackSecret.length > 256) {
         return { error: 'invalid_callback_secret', message: 'callback_secret must be 8-256 chars' };
      }
   }

   let trxId = null;
   const rawRef = body.reference ?? body.trxId;
   if (rawRef != null) {
      trxId = String(rawRef);
      if (!REF_PATTERN.test(trxId)) {
         return { error: 'invalid_reference', message: 'reference must be 1-64 chars: letters, digits, _ . -' };
      }
   }

   const baseMeta = (body.metadata && typeof body.metadata === 'object') ? body.metadata : {};
   const description = body.description ? String(body.description).slice(0, 200) : null;
   const finalMetadata = {
      ...baseMeta,
      merchant_reference: trxId,
      ...(description ? { description } : {}),
   };

   return {
      value: {
         amount,
         fee,
         expireMinutes,
         callbackUrl,
         callbackSecret,
         trxId,
         metadata: finalMetadata,
         paymentMethod: 'QRIS',
         idempotencyKey: headers['idempotency-key'] || body.idempotency_key || body.idempotencyKey || null,
      },
   };
}

async function findByReference(ref) {
   let found = await transactions.get(ref);
   if (found) return found;
   const rows = await transactions.list({ limit: 200, offset: 0 });
   return rows.find((t) => t.metadata?.merchant_reference === ref) || null;
}

export function paymentRoutes(guard, merchant = null) {
   const router = express.Router();

   const getStatus = wrap(async (req, res) => {
      let found = await findByReference(req.params.order_id);
      if (!found) return fail(res, 404, 'Transaksi tidak ditemukan');

      if (merchant && found.status === 'PENDING') {
         await cycleIfStale(merchant, config.pollMinIntervalMs);
         found = (await transactions.get(found.trxId)) || found;
      }
      const trx = await payments.expireIfOverdue(found);
      const authed = isAuthenticated(req, config.apiKey) || req.apiKeyUserId;
      res.json(toTransaction(trx, baseUrlFor(req), { withMeta: !!authed }));
   });

   const cancelTrx = wrap(async (req, res) => {
      const trx = await findByReference(req.params.order_id);
      if (!trx) return fail(res, 404, 'Transaksi tidak ditemukan');
      if (trx.status !== 'PENDING') {
         return fail(res, 412, `Transaksi tidak bisa dibatalkan, status saat ini: ${statusOf(trx).transaction_status}`);
      }
      await payments.cancel(trx);
      const fresh = (await transactions.get(trx.trxId)) || trx;
      res.json(toTransaction(fresh, baseUrlFor(req), { message: 'Transaksi berhasil dibatalkan' }));
   });

   // POST /api/v1/charge — buat transaksi QRIS
   router.post('/charge', guard, wrap(async (req, res) => {
      const pt = req.body?.payment_type;
      if (pt && String(pt).toLowerCase() !== 'qris') return fail(res, 400, 'payment_type yang didukung: qris');
      const { error, message, value } = await parseCreateBody(normalizeBody(req.body), req.headers);
      if (error) return fail(res, 400, message || error, { validation_messages: [message || error] });
      const base = baseUrlFor(req);

      if (value.idempotencyKey) {
         const existing = await transactions.getByIdempotencyKey(value.idempotencyKey);
         if (existing) return res.json(toTransaction(existing, base));
      }
      if (value.trxId && await transactions.get(value.trxId)) {
         return fail(res, 406, 'order_id sudah dipakai transaksi lain');
      }
      if (req.apiKeyUserId) value.userId = req.apiKeyUserId;

      try {
         const trx = await payments.create(value);
         res.status(201).json(toTransaction(trx, base, { message: 'Transaksi berhasil dibuat' }));
      } catch (e) {
         if (e.code === 'NO_FREE_CODE') return fail(res, 503, e.message);
         if (e.code === 'DUPLICATE') {
            const existing = value.idempotencyKey && await transactions.getByIdempotencyKey(value.idempotencyKey);
            if (existing) return res.json(toTransaction(existing, base));
            if (value.trxId && await transactions.get(value.trxId)) return fail(res, 406, 'order_id sudah dipakai transaksi lain');
            return fail(res, 503, e.message);
         }
         throw e;
      }
   }));

   // GET /api/v1/transaction/:order_id/status — alias gaya Midtrans: GET /:order_id/status
   router.get('/transaction/:order_id/status', getStatus);
   router.get('/:order_id/status', getStatus);

   router.get('/transaction/:order_id/qr', wrap(async (req, res) => {
      const trx = await findByReference(req.params.order_id);
      if (!trx) {
         res.setHeader('Cache-Control', 'no-store');
         return fail(res, 404, 'Transaksi tidak ditemukan');
      }
      const png = await QRCode.toBuffer(trx.qrString, { scale: 8, errorCorrectionLevel: 'M' });
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.type('png').send(png);
   }));

   // POST /api/v1/transaction/:order_id/cancel — alias gaya Midtrans: POST /:order_id/cancel
   router.post('/transaction/:order_id/cancel', guard, cancelTrx);
   router.post('/:order_id/cancel', guard, cancelTrx);

   // POST /api/v1/transaction/:order_id/notification/resend
   router.post('/transaction/:order_id/notification/resend', guard, wrap(async (req, res) => {
      const trx = await findByReference(req.params.order_id);
      if (!trx) return fail(res, 404, 'Transaksi tidak ditemukan');
      if (trx.status === 'PENDING') return fail(res, 412, 'Transaksi masih pending, tidak ada notifikasi untuk dikirim');

      await webhookStore.owe(trx.trxId);
      try {
         await webhooks.deliver(await transactions.get(trx.trxId));
      } catch (e) {
         log('webhook').error(`${trx.trxId} resend crashed: ${e.message}`);
      }
      const fresh = await transactions.get(trx.trxId);
      res.json({
         status_code: '200',
         status_message: 'Notifikasi dikirim ulang',
         order_id: trx.metadata?.merchant_reference || trx.trxId,
         notification_state: (fresh?.webhookState ?? 'PENDING').toLowerCase(),
      });
   }));

   return router;
}
