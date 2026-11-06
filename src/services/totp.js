import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'node:crypto';

authenticator.options = {
   window: 2,      // toleransi 60 detik (2 x 30s) — atasi time drift
   step: 30,
};

export function generateSecret() {
   // Paksa 32 karakter (160 bit) — standar TOTP
   const buffer = crypto.randomBytes(20); // 20 bytes = 32 base32 chars
   const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
   let secret = '';
   for (const byte of buffer) {
      secret += base32Alphabet[byte % 32];
   }
   return secret;
}

export function generateBackupCodes(count = 8) {
   const codes = [];
   for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
   }
   return codes;
}

export async function generateQRCode(email, secret) {
   const otpauth = authenticator.keyuri(email, 'Ronpay', secret);
   const qrDataUrl = await QRCode.toDataURL(otpauth, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0a0a', light: '#ffffff' },
   });
   return { otpauth, qrDataUrl };
}

export function verifyToken(token, secret) {
   try {
      const clean = String(token).replace(/\s/g, '');
      return authenticator.verify({ token: clean, secret });
   } catch (e) {
      console.error('[totp] verify error:', e.message);
      return false;
   }
}
