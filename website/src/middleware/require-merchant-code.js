import { one } from '../db/index.js';

/**
 * Middleware: Wajib merchant_code di request
 * Ambil dari body.merchant_code atau header X-Merchant-Code
 * Validasi ada di DB users.merchant_code
 */
export function requireMerchantCode() {
   return async (req, res, next) => {
      try {
         const code = (req.body?.merchant_code || req.header('X-Merchant-Code') || '').trim().toUpperCase();

         if (!code) {
            return res.status(400).json({
               success: false,
               error: 'merchant_code_required',
               message: 'merchant_code wajib diisi (body.merchant_code atau header X-Merchant-Code)',
            });
         }

         // Validasi ada di DB
         const user = await one('SELECT id FROM users WHERE merchant_code = $1', [code]);
         if (!user) {
            return res.status(400).json({
               success: false,
               error: 'merchant_code_invalid',
               message: 'merchant_code tidak ditemukan: ' + code,
            });
         }

         // Attach ke request biar dipakai route
         req.merchantUser = user;
         req.merchantCode = code;

         next();
      } catch (e) {
         next(e);
      }
   };
}
