import { config } from '../config.js';
import { log } from '../logger.js';
import * as store from '../db/webhooks.js';
import { one, sql } from '../db/index.js';
import { createNotification } from './notifications.js';
import { toNotification, statusOf } from './format.js';

const logger = log('webhook');

function backoffMs(attempt) {
   return Math.min(30000 * 2 ** Math.max(0, attempt - 1), config.webhook.maxBackoffMs);
}

export function buildPayload(trx, secret = config.webhook.secret) {
   return toNotification(trx, secret);
}

async function resolveSecret(trx) {
   if (trx.callbackSecret) return trx.callbackSecret;
   if (trx.userId) {
      try {
         const u = await one('SELECT "webhookSecret" FROM users WHERE id = $1', [trx.userId]);
         if (u?.webhookSecret) return u.webhookSecret;
      } catch {}
   }
   return config.webhook.secret;
}

async function writeLog({ userId, trxId, event, url, httpStatus, latencyMs, status, error }) {
   try {
      await sql('INSERT INTO webhook_logs (user_id, trx_id, event, url, http_status, latency_ms, status, error, sent_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
         [userId || null, trxId || null, event, url, httpStatus ?? null, latencyMs ?? null, status, error || null, new Date().toISOString()]);
   } catch (e) {
      logger.warn('gagal tulis webhook_logs: ' + e.message);
   }
}

async function post(url, trx) {
   const body = JSON.stringify(buildPayload(trx, await resolveSecret(trx)));
   const eventName = statusOf(trx).transaction_status;
   const startTime = Date.now();

   try {
      const res = await fetch(url, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'User-Agent': 'G2CSPAY-Notification/1.0' },
         body, redirect: 'manual',
         signal: AbortSignal.timeout(config.webhook.timeoutMs),
      });
      const latencyMs = Date.now() - startTime;
      await writeLog({ userId: trx.userId, trxId: trx.trxId, event: eventName, url, httpStatus: res.status, latencyMs, status: res.ok ? 'delivered' : 'failed', error: res.ok ? null : 'HTTP ' + res.status });
      return res.ok ? { ok: true, status: res.status, latencyMs } : { ok: false, why: 'HTTP ' + res.status, httpStatus: res.status, latencyMs };
   } catch (e) {
      const latencyMs = Date.now() - startTime;
      const why = e.cause?.code || e.cause?.message || e.message;
      await writeLog({ userId: trx.userId, trxId: trx.trxId, event: eventName, url, httpStatus: 0, latencyMs, status: 'failed', error: why });
      return { ok: false, why, httpStatus: 0, latencyMs };
   }
}

async function resolveWebhookUrl(trx) {
   if (trx.userId) {
      try {
         const u = await one('SELECT "webhookUrl" FROM users WHERE id = $1', [trx.userId]);
         if (u?.webhookUrl) return u.webhookUrl;
      } catch {}
   }
   if (trx.callbackUrl) return trx.callbackUrl;
   return config.webhook.url || null;
}

export async function deliver(trx) {
   const url = await resolveWebhookUrl(trx);
   if (!url) { await store.markSent(trx.trxId); return; }

   const attempt = (trx.webhookAttempts || 0) + 1;
   const result = await post(url, trx);

   if (result.ok) {
      await store.markSent(trx.trxId);
      logger.ok(trx.trxId + ' delivered (HTTP ' + result.status + ', ' + result.latencyMs + 'ms)');
      try {
         if (trx.userId && trx.status === 'PAID') {
            const gross = Number(trx.amount) || 0;
            const fee = Number(trx.fee) || 0;
            const net = gross - fee;
            await createNotification(trx.userId, 'payment', 'Saldo tersedia bertambah',
               'Pembayaran ' + trx.trxId + ' berhasil. Saldo +Rp ' + net.toLocaleString('id-ID') + '.',
               { trxId: trx.trxId, gross, fee, net });
         }
      } catch (e) { logger.warn('notif gagal: ' + e.message); }
      return;
   }

   const exhausted = attempt >= config.webhook.maxAttempts;
   const nextAt = exhausted ? null : new Date(Date.now() + backoffMs(attempt)).toISOString();
   await store.markFailed(trx.trxId, result.why, nextAt);
   if (exhausted) logger.error(trx.trxId + ' gave up after ' + attempt + ' attempts: ' + result.why);
   else logger.warn(trx.trxId + ' attempt ' + attempt + '/' + config.webhook.maxAttempts + ' failed: ' + result.why);
}

export async function enqueue(trx) {
   await store.owe(trx.trxId);
   try { await deliver({ ...trx, webhookAttempts: 0 }); }
   catch (e) { logger.error(trx.trxId + ' delivery crashed: ' + e.message); }
}

export async function drain({ limit = 20, concurrency = 5 } = {}) {
   const batch = await store.claim({ maxAttempts: config.webhook.maxAttempts, limit });
   if (!batch.length) return 0;
   const queue = [...batch];
   const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length) {
         const trx = queue.shift();
         try { await deliver(trx); } catch (e) { logger.error(trx.trxId + ' crashed: ' + e.message); }
      }
   });
   await Promise.all(workers);
   return batch.length;
}

export const owedCount = () => store.owedCount();
