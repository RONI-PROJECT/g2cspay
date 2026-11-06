import { Router } from 'express';
import QRCode from 'qrcode';
import { one, all, sql } from '../db/index.js';
import { getSession } from '../services/auth.js';
import * as payments from '../services/payments.js';

export function userPaymentRoutes() {
   const router = Router();

   async function requireUser(req, res, next) {
      try {
         const token = req.cookies?.session || req.headers['x-session-token'];
         const s = await getSession(token);
         if (!s) return res.status(401).json({ error: 'Login required' });
         req.user = { id: s.userId, email: s.email, role: s.role };
         next();
      } catch (e) { next(e); }
   }

   router.get('/list', requireUser, async (req, res, next) => {
      try {
         const rows = await all('SELECT "trxId", status, amount, fee, net, "merchantAmount", "feePercent", "payAmount" AS "amountToPay", "qrImageUrl", metadata, "createdAt", "expiresAt", "paidAt" FROM transactions WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50', [req.user.id]);
         res.json({ success: true, data: rows });
      } catch (e) { next(e); }
   });

   router.get('/:trxId', requireUser, async (req, res, next) => {
      try {
         const row = await one('SELECT "trxId", status, amount, fee, net, "merchantAmount", "feePercent", "payAmount" AS "amountToPay", "qrString", "qrImageUrl", metadata, "createdAt", "expiresAt", "paidAt" FROM transactions WHERE "trxId" = $1 AND "userId" = $2 LIMIT 1', [req.params.trxId, req.user.id]);
         if (!row) return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
         res.json({ success: true, data: row });
      } catch (e) { next(e); }
   });

   router.post('/create', requireUser, async (req, res, next) => {
      try {
         const amount = Number(req.body?.amount);
         if (!amount || amount < 1000) return res.status(400).json({ error: 'Amount minimal 1000' });
         if (amount > 100000000) return res.status(400).json({ error: 'Amount maksimal 100 juta' });

         const cfg = await all("SELECT key, value FROM app_settings WHERE key = 'fee_transaction_percent'");
         const feePercent = Number(cfg[0]?.value || 1.8);
         const feeAmount = Math.round(amount * (feePercent / 100));

         const trx = await payments.create({ amount, fee: feeAmount, userId: req.user.id });

         const qrImageUrl = await QRCode.toDataURL(trx.qrString, {
            width: 400, margin: 2, errorCorrectionLevel: 'M',
            color: { dark: '#0f172a', light: '#ffffff' },
         });

         sql('UPDATE transactions SET "qrImageUrl" = $1 WHERE "trxId" = $2', [qrImageUrl, trx.trxId]).catch(() => {});

         const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
         res.json({ success: true, data: {
            trxId: trx.trxId,
            amount: trx.amount,
            amountToPay: trx.payAmount,
            qrString: trx.qrString,
            qrImageUrl,
            paymentUrl: baseUrl + '/pay/' + trx.trxId,
            status: 'PENDING',
            createdAt: trx.createdAt,
            expiresAt: trx.expiresAt,
         }});
      } catch (e) { next(e); }
   });

   return router;
}
