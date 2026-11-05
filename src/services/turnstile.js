// Verifikasi Cloudflare Turnstile di server. Kalau TURNSTILE_SECRET_KEY kosong, dilewati.
export async function verifyTurnstile(token, ip) {
   const secret = process.env.TURNSTILE_SECRET_KEY;
   if (!secret) return { ok: true, skipped: true };
   if (!token) return { ok: false, error: 'Selesaikan captcha terlebih dahulu' };
   try {
      const body = new URLSearchParams({ secret, response: String(token) });
      if (ip) body.set('remoteip', ip);
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
         method: 'POST', body, signal: AbortSignal.timeout(8000),
      });
      const j = await r.json();
      return j.success ? { ok: true } : { ok: false, error: 'Verifikasi captcha gagal, coba lagi' };
   } catch {
      return { ok: false, error: 'Captcha tidak bisa diverifikasi, coba lagi' };
   }
}
