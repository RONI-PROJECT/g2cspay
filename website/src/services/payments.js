import crypto from 'node:crypto';
import { config } from '../config.js';
import { log } from '../logger.js';
import { buildDynamicQris } from '../qris.js';
import * as transactions from '../db/transactions.js';
import * as history from '../db/history.js';
import * as webhooks from './webhooks.js';
import { createNotification } from './notifications.js';
import { sql } from '../db/index.js';

const logTrx = log('trx');
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const isUniqueViolation = (e) => e?.code === '23505';

function generateTrxId() {
   const bytes = crypto.randomBytes(10);
   let id = '';
   for (const b of bytes) id += ID_ALPHABET[b % ID_ALPHABET.length];
   return 'CSP-' + id;
}

export const isOverdue = (trx) => trx.status === 'PENDING' && new Date(trx.expiresAt).getTime() <= Date.now();

export function toPublic(trx, baseUrl = '') {
   const qrPath = '/api/payment/' + trx.trxId + '/qr.png';
   const qrImageUrl = trx.qrImageUrl || (baseUrl ? baseUrl + qrPath : qrPath);
   const meta = (trx.metadata && typeof trx.metadata === 'object') ? trx.metadata : {};

   return {
      id: trx.trxId,
      payment_method: 'QRIS',
      merchant_reference: meta.merchant_reference || null,
      net_amount: Math.max(0, (trx.amount || 0) - (trx.fee || 0)),
      currency: 'IDR',
      qr_image: qrImageUrl,
      created_at: trx.createdAt,
      customer_name: meta.customer_name || null,
      customer_email: meta.customer_email || null,
      trxId: trx.trxId,
      status: trx.status,
      amount: trx.amount,
      fee: trx.fee,
      amountToPay: trx.payAmount,
      qrString: trx.qrString,
      qrImageUrl,
      callbackUrl: trx.callbackUrl || null,
      metadata: trx.metadata || null,
      createdAt: trx.createdAt,
      expiresAt: trx.expiresAt,
      paidAt: trx.paidAt || null,
      webhook: trx.webhookState ? {
         state: trx.webhookState,
         attempts: trx.webhookAttempts || 0,
         nextAttemptAt: trx.webhookNextAt || null,
         lastError: trx.webhookLastError || null,
      } : null,
   };
}

export async function create({ amount, fee = 0, trxId, callbackUrl = null, callbackSecret = null, expireMinutes, metadata = null, idempotencyKey = null, userId = null }) {
   const net = Math.max(0, amount - fee);
   const minutes = expireMinutes ?? config.expireMinutes;
   const payAmount = amount;

   const trx = {
      trxId: trxId || generateTrxId(),
      userId, status: 'PENDING', amount, fee, net,
      merchantAmount: net,
      feePercent: amount > 0 ? (fee / amount) * 100 : 0,
      total: amount, payAmount,
      qrString: buildDynamicQris(config.qrisString, payAmount),
      callbackUrl, callbackSecret, idempotencyKey, metadata,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + minutes * 60000).toISOString(),
      paidAt: null, entry: null,
   };

   try {
      await transactions.insert(trx);
      logTrx.info('CREATE ' + trx.trxId + ' userId=' + userId + ' amount=' + amount + ' fee=' + fee + ' amountToPay=' + payAmount);
      return trx;
   } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      if (e.constraint === 'idx_idempotency') throw Object.assign(new Error('idempotencyKey already exists'), { code: 'DUPLICATE', cause: e });
      throw Object.assign(new Error('trxId already exists'), { code: 'DUPLICATE', cause: e });
   }
}

export async function expire(trx) {
   if (trx.status !== 'PENDING') return false;
   if (!(await transactions.settle({ ...trx, status: 'EXPIRED' }))) return false;
   await webhooks.enqueue({ ...trx, status: 'EXPIRED' });
   return true;
}

export async function cancel(trx) {
   if (trx.status !== 'PENDING') return false;
   const meta = { ...(trx.metadata || {}), canceled: true, canceled_at: new Date().toISOString() };
   const next = { ...trx, status: 'EXPIRED', metadata: meta };
   if (!(await transactions.settle(next))) return false;
   await sql('UPDATE transactions SET metadata = $2::jsonb WHERE "trxId" = $1', [trx.trxId, JSON.stringify(meta)]);
   await webhooks.enqueue(next);
   return true;
}

async function markPaid(trx, entry) {
   if (trx.status !== 'PENDING') return false;
   const paid = { ...trx, status: 'PAID', paidAt: new Date().toISOString(), entry };
   if (!(await transactions.settle(paid))) { logTrx.warn(trx.trxId + ' already settled, skipping'); return false; }

   if (trx.userId) {
      try {
         const net = Math.max(0, Number(trx.amount) - Number(trx.fee || 0));
         await sql('UPDATE users SET balance = balance + $1 WHERE id = $2', [net, trx.userId]);
         logTrx.ok('CREDIT user=' + trx.userId + ' +' + net + ' trx=' + trx.trxId);
      } catch (e) { logTrx.error('CREDIT failed: ' + e.message); }

      try {
         await createNotification(trx.userId, 'payment', 'Saldo tersedia bertambah',
            'Pembayaran ' + trx.trxId + ' berhasil. Saldo Tersedia +Rp ' + net.toLocaleString('id-ID') + '.',
            { trxId: trx.trxId, amount: trx.amount });
      } catch (e) { logTrx.error('NOTIF failed: ' + e.message); }
   }

   await history.linkIfUnmatched(entry.gobizId, trx.trxId);
   logTrx.ok('PAID ' + trx.trxId + ' amountToPay=' + trx.payAmount);
   await webhooks.enqueue(paid);
   return true;
}

export async function expireIfOverdue(trx) {
   if (!trx || !isOverdue(trx)) return trx;
   await expire(trx);
   return (await transactions.get(trx.trxId)) || trx;
}

export async function expireDue() {
   const overdue = await transactions.listExpired();
   let expired = 0;
   for (const trx of overdue) if (await expire(trx)) expired++;
   if (expired) logTrx.info('expired ' + expired + ' overdue trx');
   return expired;
}

export async function reconcileManually({ gobizId, trxId }) {
   const fail = (code, message) => { throw Object.assign(new Error(message), { code }); };
   const entry = await history.getById(gobizId);
   if (!entry) fail('NOT_FOUND', 'payment ' + gobizId + ' not in archive');
   if (entry.matchedTrxId) fail('ALREADY_MATCHED', 'payment already linked to ' + entry.matchedTrxId);

   const trx = await transactions.get(trxId);
   if (!trx) fail('NOT_FOUND', 'transaction ' + trxId + ' does not exist');
   if (trx.status === 'PAID') fail('ALREADY_PAID', trxId + ' is already PAID');

   if (!(await history.linkIfUnmatched(gobizId, trxId))) fail('ALREADY_MATCHED', 'payment just linked by someone else');

   const paidAt = new Date().toISOString();
   const previousStatus = trx.status;
   if (!(await transactions.forcePaid({ trxId, paidAt, entry: entry.raw ?? entry }))) {
      await history.unlink(gobizId, trxId);
      fail('ALREADY_PAID', trxId + ' became PAID');
   }

   if (trx.userId) {
      try {
         const net = Math.max(0, Number(trx.amount) - Number(trx.fee || 0));
         await sql('UPDATE users SET balance = balance + $1 WHERE id = $2', [net, trx.userId]);
         await createNotification(trx.userId, 'payment', 'Saldo tersedia bertambah',
            'Pembayaran ' + trx.trxId + ' berhasil. Saldo Tersedia +Rp ' + net.toLocaleString('id-ID') + '.',
            { trxId: trx.trxId, amount: trx.amount, manual: true });
      } catch (e) { logTrx.error('CREDIT/NOTIF failed: ' + e.message); }
   }

   const difference = entry.amount - trx.payAmount;
   logTrx.warn('MANUAL RECONCILE ' + trxId + ' (' + previousStatus + ' → PAID) gobizId=' + gobizId + ' received=' + entry.amount + ' expected=' + trx.payAmount + ' diff=' + difference);
   const paid = { ...trx, status: 'PAID', paidAt, entry: entry.raw ?? entry };
   await webhooks.enqueue(paid);
   return { trx: paid, previousStatus, received: entry.amount, difference };
}

export async function reconcile(entry) {
   const amount = Math.round(entry.amount);
   const claimed = await history.claim({ gobizId: entry.gobizId, amount, time: entry.time ?? null, raw: entry, seenAt: new Date().toISOString() });
   if (!claimed) return null;
   const trx = entry.paidAt ? await transactions.getPendingByAmount(amount, entry.paidAt) : null;
   if (trx && (await markPaid(trx, entry))) return trx;
   const why = entry.paidAt ? '' : ', no payment time to match on';
   logTrx.warn('unmatched payment Rp ' + entry.amount + ' (gobizId=' + entry.gobizId + ')' + why + ' — archived only');
   return null;
}
