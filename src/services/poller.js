import { log } from '../logger.js';
import * as meta from '../db/meta.js';
import * as history from '../db/history.js';
import * as payments from './payments.js';
import { all, one, sql } from '../db/index.js';
import { createNotification } from './notifications.js';
import * as webhooks from './webhooks.js';
import { check as checkSession } from './session.js';

const logger = log('poller');

const PAGE_SIZE = 50;
// ponytail: at most 4 pages (200 payments) per pass. A backlog deeper than that
// between two passes is missed until manual reconciliation. Raise the cap, or
// widen `days`, if a merchant's volume ever gets there.
const MAX_PAGES = 4;

/**
 * One pass over GoBiz history.
 *
 * There is no in-process "seen" set to dedupe against — an instance is frozen
 * between invocations, so `gobiz_history` is the memory. That is a straight
 * upgrade on a poller that remembered in RAM: a payment that lands while nothing
 * is running is still unseen on the next pass, so it gets reconciled instead of
 * being silently swallowed at the next cold start.
 *
 * Pages until it reaches an already-archived payment. With no traffic nothing
 * polls, and walk-in payments to the same merchant keep arriving meanwhile, so
 * one page can end before the payment an order is waiting on.
 *
 * No seeding pass is needed on a fresh deployment. `reconcile` never matches a
 * payment to an order created after it, so the pre-deployment history the first
 * pass reads is only archived.
 */
async function retryUnmatched() {
   // Ambil transaksi GoBiz yang udah ke-archive tapi belum ke-match ke order
   const unmatched = await all(`
      SELECT gh."gobizId", gh.amount, gh.raw, gh."matchedTrxId", gh."seenAt",
             t.status AS "trxStatus", t."trxId" AS "linkedTrxId"
      FROM gobiz_history gh
      LEFT JOIN transactions t ON t."trxId" = gh."matchedTrxId"
      WHERE gh."matchedTrxId" IS NULL
         OR t.status IS NULL
         OR t.status != 'PAID'
      ORDER BY gh."seenAt" DESC
      LIMIT 30
   `);

   let matched = 0;
   for (const row of unmatched) {
      const amt = Math.round(Number(row.amount));
      if (!amt) continue;

      // Cari order by payAmount — match PENDING atau EXPIRED
      const trx = await one(`
         SELECT * FROM transactions
         WHERE "payAmount" = $1
           AND status IN ('PENDING', 'EXPIRED')
           AND "createdAt" <= $2
         ORDER BY "createdAt" DESC
         LIMIT 1
      `, [amt, row.seenAt]);

      if (!trx) continue;

      // Mark PAID
      await sql(
         `UPDATE transactions SET status='PAID', "paidAt"=NOW() WHERE "trxId"=$1`,
         [trx.trxId]
      );
      await sql(
         `UPDATE gobiz_history SET "matchedTrxId"=$1 WHERE "gobizId"=$2`,
         [trx.trxId, row.gobizId]
      );

      // Credit saldo + notif
      if (trx.userId) {
         const net = Math.max(0, Number(trx.amount) - Number(trx.fee || 0));
         await sql('UPDATE users SET balance = balance + $1 WHERE id = $2', [net, trx.userId]);
         await createNotification(
            trx.userId, 'payment', 'Saldo tersedia bertambah',
            `Pembayaran ${trx.trxId} berhasil. Saldo Tersedia +Rp ${net.toLocaleString('id-ID')}.`,
            { trxId: trx.trxId, gross: Number(trx.amount), fee: Number(trx.fee||0), net }
         ).catch(() => {});
      }

      // Webhook ke merchant
      await webhooks.enqueue({ ...trx, status: 'PAID', paidAt: new Date().toISOString() }).catch(() => {});

      logger.ok(`RETRY-MATCH ${trx.trxId} | Rp ${amt.toLocaleString('id-ID')} | gobizId=${row.gobizId}`);
      matched++;
   }
   return matched;
}

async function pollOnce(merchant) {
   const fresh = [];
   for (let page = 0; page < MAX_PAGES; page++) {
      const batch = await merchant.getHistory({ days: 1, size: PAGE_SIZE, from: page * PAGE_SIZE });
      const known = await history.seen(batch.map((e) => e.gobizId));
      fresh.push(...batch.filter((e) => Number.isFinite(e.amount) && !known.has(e.gobizId)));
      // Newest first, so a known id means an earlier pass read everything older.
      if (batch.length < PAGE_SIZE || known.size) break;
   }

   let matched = 0;
   for (const e of fresh) {
      logger.ok(`Transaksi baru: Rp ${e.amount.toLocaleString('id-ID')} | ID: ${e.gobizId}`);
      if (await payments.reconcile(e)) matched++;
   }
   return { fresh: fresh.length, matched };
}

/**
 * Run one maintenance cycle, but only if nobody has run one recently.
 *
 * There is no cron and no background process. This is the whole engine: ordinary
 * app traffic drives it. A payer watching the QR screen polls their own status
 * every few seconds, and each read may claim the slot and do a full cycle — poll
 * GoBiz, expire what is overdue, retry owed webhooks.
 *
 * Which means detection is near-real-time exactly while somebody is waiting, and
 * there are zero upstream calls when nobody is. That is also gentler on the GoBiz
 * account than a blind fixed-interval poller.
 *
 * The throttle lives in the database, so it holds across every instance at once.
 *
 * The tradeoff, stated plainly: with literally zero traffic nothing runs, so a
 * `expire` notification can sit until the next request touches the gateway.
 * `settlement` is unaffected — the cycle that finds the payment is the one that
 * settles it and queues the webhook.
 */
export async function cycleIfStale(merchant, minIntervalMs) {
   if (!(await meta.tryClaimPollSlot(minIntervalMs))) return null;
   try {
      // A payer is waiting on this response, so only a small webhook batch rides
      // along. The rest wait for the next cycle.
      return await runCycle(merchant, { session: false, webhookLimit: 5 });
   } catch (e) {
      logger.error(`opportunistic cycle gagal: ${e.message}`);
      return null;
   }
}

/**
 * Everything an always-on process would have done in the background, as one pass.
 *
 * Steps are independent: a failing upstream poll must not stop owed webhooks from
 * being retried or overdue transactions from expiring.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.session] - probe the GoBiz session too. Skipped on the
 *   traffic-driven path, where it would add a second upstream round trip to a
 *   request a payer is waiting on; `getHistory` re-authenticates on its own anyway.
 * @param {number} [opts.webhookLimit] - most owed webhooks to deliver this cycle.
 */
export async function runCycle(merchant, { session = true, webhookLimit = 20 } = {}) {
   const result = { session: null, poll: null, expired: 0, webhooks: 0, errors: [] };

   const step = async (name, fn) => {
      try {
         return await fn();
      } catch (e) {
         result.errors.push(`${name}: ${e.message}`);
         logger.error(`${name} gagal: ${e.message}`);
         return null;
      }
   };

   if (session) result.session = await step('session', () => checkSession(merchant));
   result.poll = await step('poll', async () => {
      await meta.set('poller.lastRunAt', Date.now());
      return pollOnce(merchant);
   });
   // Retry transaksi yang gagal match
   await step('retry', () => retryUnmatched());
   result.expired = (await step('expire', () => payments.expireDue())) ?? 0;
   result.webhooks = (await step('webhooks', () => webhooks.drain({ limit: webhookLimit }))) ?? 0;

   return result;
}
