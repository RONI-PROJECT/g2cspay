/**
 * Endpoint untuk cron job / uptime pinger (cron-job.org, UptimeRobot, crontab curl).
 *   GET|POST /api/cron/poll?key=CRON_SECRET     (atau header Authorization: X-API-Key <secret> / X-Cron-Key)
 * Menjalankan 1 siklus penuh: cek mutasi GoBiz, cocokkan pembayaran, expire, kirim webhook tertunda.
 * Set CRON_SECRET di .env. Jadwal disarankan tiap 10-30 detik.
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import { runCycle } from '../services/poller.js';

const eq = (a, b) => {
   const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
   return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export function cronRoutes(merchant) {
   const router = Router();
   let running = false;

   const handler = async (req, res) => {
      const secret = process.env.CRON_SECRET;
      if (!secret) return res.status(503).json({ success: false, error: 'CRON_SECRET belum diset di .env' });
      const bearer = (req.get('authorization') || '').replace(/^X-API-Key\s+/i, '');
      const given = req.query.key || req.get('x-cron-key') || bearer;
      if (!given || !eq(given, secret)) return res.status(401).json({ success: false, error: 'Key salah' });
      if (running) return res.json({ success: true, skipped: 'siklus sebelumnya masih jalan' });
      running = true;
      const t = Date.now();
      try {
         const r = await runCycle(merchant);
         res.json({ success: true, ms: Date.now() - t, expired: r.expired, webhooks: r.webhooks, errors: r.errors });
      } catch (e) {
         res.status(500).json({ success: false, error: e.message });
      } finally { running = false; }
   };

   router.get('/poll', handler);
   router.post('/poll', handler);
   return router;
}
