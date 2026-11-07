import { Router } from 'express';
import { requestLoginOtp, verifyLoginOtp } from '../../lib/gobiz-otp.js';

export function gobizOtpRoutes(guard) {
   const router = Router();

   router.post('/otp/request', guard, async (req, res) => {
      try {
         const phone = (req.body || {}).phone || '';
         if (!phone) {
            return res.status(400).json({ success: false, error: 'phone wajib. contoh: {"phone":"085123456789"}' });
         }
         const r = await requestLoginOtp(phone);
         res.json({ success: true, status_message: 'OTP terkirim via SMS', data: r });
      } catch (e) {
         res.status(400).json({ success: false, error: e.message });
      }
   });

   router.post('/otp/verify', guard, async (req, res) => {
      try {
         const { otpToken, otp } = req.body || {};
         if (!otpToken || !otp) {
            return res.status(400).json({ success: false, error: 'otpToken & otp wajib' });
         }
         const r = await verifyLoginOtp(otpToken, otp);
         res.json({
            success: true,
            status_message: 'Login OTP berhasil, token tersimpan — poller otomatis pakai token ini',
            data: r,
         });
      } catch (e) {
         res.status(400).json({ success: false, error: e.message });
      }
   });

   return router;
}
