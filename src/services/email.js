import { Resend } from 'resend';
import { log } from '../logger.js';

const logMail = log('mail');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const APP_URL = (process.env.PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function sendMail({ to, subject, html }) {
   if (!resend) {
      logMail.warn('RESEND_API_KEY belum diset, skip kirim email ke ' + to);
      return false;
   }

   try {
      const { data, error } = await resend.emails.send({
         from: `${process.env.MAIL_FROM_NAME || 'G2CSPAY'} <${process.env.MAIL_FROM_ADDRESS || 'onboarding@resend.dev'}>`,
         to: [to],
         subject,
         html,
      });

      if (error) {
         logMail.error('EMAIL failed to ' + to + ': ' + error.message);
         return false;
      }

      logMail.ok('EMAIL sent to ' + to + ' — ' + data.id);
      return true;
   } catch (e) {
      logMail.error('EMAIL failed: ' + e.message);
      return false;
   }
}

export function templateWelcome({ name, siteName = 'G2CSPAY' }) {
   return `
   <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
     <div style="background:#08080b;color:#fff;padding:30px;border-radius:12px 12px 0 0;">
       <h1 style="margin:0;font-size:24px;">Selamat datang di ${siteName}!</h1>
     </div>
     <div style="background:#fff;border:1px solid #eee;padding:30px;border-radius:0 0 12px 12px;">
       <p>Halo <strong>${name}</strong>,</p>
       <p>Akun kamu sudah aktif. Sekarang bisa mulai terima pembayaran QRIS.</p>
       <p><a href="${APP_URL}/merchant" style="background:#08080b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Buka Dashboard</a></p>
     </div>
   </div>`;
}

export function templatePaymentPaid({ trxId, amount, net, siteName = 'G2CSPAY' }) {
   return `
   <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
     <div style="background:#08080b;color:#fff;padding:30px;border-radius:12px 12px 0 0;">
       <h1 style="margin:0;font-size:24px;">Pembayaran Diterima</h1>
     </div>
     <div style="background:#fff;border:1px solid #eee;padding:30px;border-radius:0 0 12px 12px;">
       <p>Pembayaran masuk ke akun kamu:</p>
       <table style="width:100%;border-collapse:collapse;margin:20px 0;">
         <tr><td style="padding:8px 0;color:#666;">Trx ID</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${trxId}</td></tr>
         <tr><td style="padding:8px 0;color:#666;">Jumlah</td><td style="padding:8px 0;text-align:right;font-weight:bold;">Rp ${Number(amount).toLocaleString('id-ID')}</td></tr>
         <tr style="border-top:1px solid #eee;"><td style="padding:8px 0;color:#666;">Masuk saldo</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#22c55e;">+Rp ${Number(net).toLocaleString('id-ID')}</td></tr>
       </table>
     </div>
   </div>`;
}
