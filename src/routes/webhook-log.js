import { Router } from 'express';
import { all, one, sql } from '../db/index.js';
import { getSession } from '../services/auth.js';

export function webhookLogRoutes() {
   const router = Router();

   async function requireUser(req, res, next) {
      try {
         const token = req.cookies?.session || req.headers['x-session-token'];
         const s = await getSession(token);
         if (!s) return res.status(401).json({ error: 'Login required' });
         req.user = { id: s.userId };
         next();
      } catch (e) { next(e); }
   }

   router.get('/logs', requireUser, async (req, res, next) => {
      try {
         const limit = Math.min(Number(req.query.limit) || 20, 100);
         const rows = await all(
            `SELECT id, trx_id AS "trxId", event, url,
                    http_status AS "httpStatus",
                    latency_ms AS "latencyMs",
                    status, error, sent_at AS "sentAt"
             FROM webhook_logs
             WHERE user_id = $1
             ORDER BY sent_at DESC
             LIMIT $2`,
            [req.user.id, limit]
         );
         res.json({ success: true, data: rows });
      } catch (e) { next(e); }
   });

   router.get('/stats', requireUser, async (req, res, next) => {
      try {
         const row = await one(
            `SELECT
               COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
               COUNT(*) FILTER (WHERE status = 'failed') AS failed,
               COUNT(*) AS total,
               ROUND(AVG(latency_ms)) AS avg_latency
             FROM webhook_logs WHERE user_id = $1`,
            [req.user.id]
         );
         res.json({
            success: true,
            data: {
               delivered: Number(row.delivered),
               failed: Number(row.failed),
               total: Number(row.total),
               avgLatencyMs: row.avg_latency ? Number(row.avg_latency) : 0,
            },
         });
      } catch (e) { next(e); }
   });

   router.delete('/logs', requireUser, async (req, res, next) => {
      try {
         await sql('DELETE FROM webhook_logs WHERE user_id = $1', [req.user.id]);
         res.json({ success: true });
      } catch (e) { next(e); }
   });

   return router;
}
