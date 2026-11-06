import { ensureColumns } from '../db/index.js';
import { Router } from 'express';
import { one, all, sql } from '../db/index.js';
import { ensureAssets } from './assets.js';

export function publicRoutes() {
   const router = Router();

   let settingsCache = null;
   let settingsAt = 0;
   let refreshing = false;
   globalThis.__bustSettings = () => { settingsCache = null; settingsAt = 0; };
   router.get('/settings', async (req, res, next) => {
      try {
         res.setHeader('Cache-Control', 'no-store');
         const age = Date.now() - settingsAt;
         if (settingsCache && age < 3000) return res.json(settingsCache);
                  await build();
         return res.json(settingsCache);
      } catch (e) {
         // Settings cuma kosmetik: jangan bikin UI error 500 gara-gara DB lagi lambat
         res.setHeader('Cache-Control', 'no-store');
         return res.json({ success: true, degraded: true, data: {
            maintenance: false, maintenance_mode: 'false', maintenance_message: '', maintenance_eta: '', message: '',
            site_name: 'G2CSPAY', site_title: 'G2CSPAY - Payment Gateway QRIS', site_description: '', site_keywords: '',
            logo_url: '', og_url: '', bank_logos: {}, marquee_banks: '', favicon_url: '', hero_title: '', hero_lead: '',
            marquee_text: '', marquee_items: '', footer_text: '', footer_copyright: '',
            wd_min: 65000, wd_fee_percent: 2.5, wd_fee_flat: 4500, fee_transaction_percent: 1.8,
         }});
      }
   });

   async function build() {
         const rows = await all('SELECT key, value FROM app_settings');
         const map = {};
         rows.forEach(r => { map[r.key] = r.value; });
         const payload = { success: true, data: {
            maintenance: map.maintenance_mode === 'true',
            maintenance_mode: map.maintenance_mode || 'false',
            maintenance_message: map.maintenance_message || '',
            maintenance_eta: map.maintenance_eta || '',
            message: map.maintenance_message || '',
            site_name: map.site_name || 'G2CSPAY',
            site_title: map.site_title || 'G2CSPAY - Payment Gateway QRIS',
            site_description: map.site_description || '',
            site_keywords: map.site_keywords || '',
            logo_url: map.logo_url || '',
            og_url: map.og_url || '',
            bank_logos: (() => { try { return JSON.parse(map.bank_logos || '{}'); } catch { return {}; } })(),
            marquee_banks: map.marquee_banks || '',
            favicon_url: map.favicon_url || '',
            hero_title: map.hero_title || '',
            hero_lead: map.hero_lead || '',
            marquee_text: map.marquee_text || '',
            marquee_items: map.marquee_items || '',
            footer_text: map.footer_text || '',
            footer_copyright: map.footer_copyright || '',
            wd_min: Number(map.wd_min || 65000),
            wd_fee_percent: Number(map.wd_fee_percent || 2.5),
            wd_fee_flat: Number(map.wd_fee_flat || 4500),
            fee_transaction_percent: Number(map.fee_transaction_percent || 1.8),
            theme_color: map.theme_color || 'navy',
            logo_height: Number(map.logo_height || 30),
            bank_logo_shape: map.bank_logo_shape || 'rounded',
            bank_logo_gray: map.bank_logo_gray === 'true',
         }};
         settingsCache = payload; settingsAt = Date.now();
   }
   build().catch(() => {});

   router.get('/asset/:key', async (req, res, next) => {
      try {
         await ensureAssets();
         const row = await one('SELECT mime, data, "updatedAt" FROM app_assets WHERE key = $1', [req.params.key]);
         if (!row) {
            if (req.params.key !== 'favicon') return res.status(404).end();
            res.set({ 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'", 'X-Content-Type-Options': 'nosniff' });
            return res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#14b8a6"/><stop offset="0.55" stop-color="#0d9488"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="96" height="96" rx="22" fill="url(#g)"/><text x="48" y="64" font-family="Arial, sans-serif" font-weight="700" font-size="46" letter-spacing="-2" text-anchor="middle" fill="#ffffff">G2</text></svg>');
         }
         const etag = '"' + Buffer.from(row.updatedAt || '0').toString('base64') + '"';
         if (req.headers['if-none-match'] === etag) return res.status(304).end();
         res.set({ 'Content-Type': row.mime, 'Cache-Control': 'public, max-age=31536000, immutable', ETag: etag, 'X-Content-Type-Options': 'nosniff' });
         res.send(Buffer.from(row.data, 'base64'));
      } catch (e) { next(e); }
   });

   let statsCache = null;
   let statsCacheAt = 0;

   router.get('/stats', async (req, res, next) => {
      try {
         const now = Date.now();
         if (statsCache && now - statsCacheAt < 10000) {
            return res.json({ success: true, data: statsCache });
         }
         const row = await one("SELECT COUNT(*) FILTER (WHERE status = $1) AS paid, COUNT(*) AS total, COALESCE(SUM(amount) FILTER (WHERE status = $1), 0) AS \"totalVolume\" FROM transactions", ['PAID']);
         const merchants = await one('SELECT COUNT(*) AS c FROM users');
         const data = {
            paid: Number(row.paid),
            total: Number(row.total),
            totalVolume: Number(row.totalVolume),
            activeMerchants: Number(merchants.c),
         };
         statsCache = data;
         statsCacheAt = now;
         res.json({ success: true, data });
      } catch (e) { next(e); }
   });

   router.get('/live', async (req, res, next) => {
      try {
         const rows = await all('SELECT RIGHT("trxId", 6) AS id, amount, status FROM transactions ORDER BY "createdAt" DESC LIMIT 5');
         res.json({ success: true, data: rows.map(r => ({
            id: r.id,
            amount: Number(r.amount),
            status: r.status === 'PAID' ? 'paid' : (r.status === 'PENDING' ? 'yellow' : 'gray'),
         }))});
      } catch (e) { next(e); }
   });

   router.get('/payment/:trxId', async (req, res, next) => {
      try {
         const trx = await one('SELECT "trxId", status, amount, fee, "payAmount", "qrString", "createdAt", "expiresAt", "paidAt", metadata FROM transactions WHERE "trxId" = $1', [req.params.trxId]);
         if (!trx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
         if (trx.status === 'PENDING' && new Date(trx.expiresAt).getTime() <= Date.now()) {
            await sql('UPDATE transactions SET status = $1 WHERE "trxId" = $2 AND status = $3', ['EXPIRED', req.params.trxId, 'PENDING']);
            trx.status = 'EXPIRED';
         }
         let storeName = null;
         try {
            const u = await one('SELECT u.store_name FROM transactions t JOIN users u ON u.id = t."userId" WHERE t."trxId" = $1', [req.params.trxId]);
            storeName = u?.store_name || null;
         } catch {}
         res.json({ success: true, data: { ...trx, storeName } });
      } catch (e) { next(e); }
   });

   return router;
}