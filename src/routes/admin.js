import { Router } from 'express';
import * as stats from '../db/stats.js';
import * as payments from '../services/payments.js';
import * as webhooks from '../services/webhooks.js';
import * as meta from '../db/meta.js';
import { config } from '../config.js';
import { runCycle } from '../services/poller.js';
import { sessionHealth } from '../services/session.js';

export function adminRoutes(guard, merchant) {
   const router = Router();

   router.get('/stats', guard, async (req, res, next) => {
      try {
         const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 90);
         const [s, d, pollAt, session] = await Promise.all([
            stats.summary(),
            stats.daily(days),
            meta.lastPollAt(),
            sessionHealth(),
         ]);

         const cooldownUntil = merchant?.loginCooldownUntil ? await merchant.loginCooldownUntil() : null;

         res.json({
            success: true,
            data: {
               summary: s,
               daily: d,
               poll: {
                  lastPollAt: pollAt ? new Date(pollAt).toISOString() : null,
                  staleSeconds: pollAt ? Math.floor((Date.now() - pollAt) / 1000) : null,
                  minIntervalMs: config.pollMinIntervalMs,
               },
               session: {
                  ok: session.ok,
                  reauths: session.reauths,
                  lastError: session.lastError,
                  cooldownUntil: cooldownUntil ? new Date(cooldownUntil).toISOString() : null,
                  cooldownSeconds: cooldownUntil ? Math.max(0, Math.floor((cooldownUntil - Date.now()) / 1000)) : 0,
               },
            },
         });
      } catch (e) { next(e); }
   });

   const pollHandler = async (req, res, next) => {
      try {
         if (!merchant) {
            return res.status(503).json({ success: false, error: 'merchant not configured' });
         }
         const result = await runCycle(merchant, { session: true, webhookLimit: 20 });
         res.json({
            success: result.errors.length === 0,
            data: {
               session: result.session,
               poll: result.poll,
               expired: result.expired,
               webhooks: result.webhooks,
               errors: result.errors,
            },
         });
      } catch (e) { next(e); }
   };

   router.get('/poll', guard, pollHandler);
   router.post('/poll', guard, pollHandler);

   router.post('/reconcile', guard, async (req, res, next) => {
      try {
         const { gobizId, trxId } = req.body || {};
         if (!gobizId || !trxId) {
            return res.status(400).json({ success: false, error: 'gobizId and trxId required' });
         }
         const result = await payments.reconcileManually({ gobizId, trxId });
         res.json({
            success: true,
            data: {
               trxId: result.trx.trxId,
               status: result.trx.status,
               previousStatus: result.previousStatus,
               expected: result.trx.payAmount,
               received: result.received,
               difference: result.difference,
            },
         });
      } catch (e) {
         const code = e.code || 'ERROR';
         const status = code === 'NOT_FOUND' ? 404 : code.startsWith('ALREADY') ? 409 : 400;
         res.status(status).json({ success: false, error: e.message });
      }
   });

   router.post('/webhooks/drain', guard, async (req, res, next) => {
      try {
         const attempted = await webhooks.drain({ limit: 50 });
         res.json({ success: true, data: { attempted } });
      } catch (e) { next(e); }
   });

   return router;
}
