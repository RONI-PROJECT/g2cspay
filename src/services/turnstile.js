// Verifikasi Cloudflare Turnstile di server.
// Salah konfigurasi server TIDAK boleh memblokir user → dilewati + dicatat di log.
export async function verifyTurnstile(token, ip) {
   const secret = process.env.TURNSTILE_SECRET_KEY;
   if (!secret) return { ok: true, skipped: true };

   // Bersihkan sisa copy-paste: kutip di awal/akhir + spasi
   const cleanSecret = String(secret).trim().replace(/^["']+|["']+$/g, '');

   if (!token) return { ok: false, error: 'Selesaikan captcha terlebih dahulu' };
   try {
      const body = new URLSearchParams({ secret: cleanSecret, response: String(token) });
      if (ip) body.set('remoteip', ip);
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
         method: 'POST', body, signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      if (j.success) return { ok: true };

      const codes = j['error-codes'] || [];
      console.error('[turnstile] GAGAL:', codes.join(', ') || 'unknown',
         '| secret-len:', cleanSecret.length, '| token-len:', String(token).length);

      // Secret salah → salah konfigurasi env di Vercel, JANGAN blokir user
      if (codes.includes('invalid-input-secret')) {
         console.error('[turnstile] !! TURNSTILE_SECRET_KEY salah di env Vercel — captcha DILEWATI.');
         return { ok: true, skipped: true, reason: 'invalid-input-secret' };
      }
      // Token expired/dipakai dobel → wajib diulang
      if (codes.includes('timeout-or-duplicate') || codes.includes('invalid-input-response') || codes.includes('missing-input-response')) {
         return { ok: false, error: 'Captcha kedaluwarsa — muat ulang halaman lalu coba lagi' };
      }
      return { ok: false, error: 'Verifikasi captcha gagal, coba lagi' };
   } catch (e) {
      console.error('[turnstile] siteverify tidak terjangkau, captcha dilewati:', e?.message || e);
      return { ok: true, skipped: true };
   }
}
