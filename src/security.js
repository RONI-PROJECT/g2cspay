// Security middleware — no external deps (no helmet/express-rate-limit needed
// for a single-process self-hosted gateway).
// ponytail: in-memory rate limiter, fixed window. Swap for Redis + sliding
// window if you run multiple instances or need precise limits.
import crypto from 'node:crypto';
import { one } from './db/index.js';

/** Constant-time string compare that won't throw on length mismatch. */
export function safeEqual(a, b) {
   const ba = Buffer.from(String(a));
   const bb = Buffer.from(String(b));
   if (ba.length !== bb.length) {
      // still burn a compare to keep timing flat
      crypto.timingSafeEqual(ba, ba);
      return false;
   }
   return crypto.timingSafeEqual(ba, bb);
}

/** Baseline hardening headers. */
export function securityHeaders(req, res, next) {
   res.setHeader('X-Content-Type-Options', 'nosniff');
   res.setHeader('X-Frame-Options', 'DENY');
   res.setHeader('Referrer-Policy', 'no-referrer');
   res.setHeader('Content-Security-Policy', "default-src 'none'");
   res.removeHeader('X-Powered-By');
   next();
}

/** The key this request presented, from `X-API-Key` or `Authorization: Bearer`. */
function presentedKey(req) {
   const headerKey = req.get('x-api-key') || '';
   const auth = req.get('authorization') || '';
   const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
   let basic = '';
   if (auth.startsWith('Basic ')) {
      try { basic = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':')[0]; } catch {}
   }
   return headerKey || bearer || basic;
}

/**
 * Does this request carry the API key? Never blocks.
 *
 * For endpoints that must answer unauthenticated callers but should reveal more to
 * the operator — the payer polling a payment status has no business seeing the
 * merchant's `metadata`.
 *
 * With no `apiKey` configured everything is already open, so this reports true and
 * the caller's own startup warning is the thing that matters.
 *
 * @param {import('express').Request} req
 * @param {string|null} apiKey
 */
export function isAuthenticated(req, apiKey) {
   if (!apiKey) return true;
   const provided = presentedKey(req);
   return !!provided && safeEqual(provided, apiKey);
}

/**
 * API-key guard (timing-safe). Reads the `X-API-Key` header. No-op if apiKey
 * is falsy. Also accepts `Authorization: Bearer <key>` as a fallback.
 * @param {string|null} apiKey
 */
// Cache in-memory buat performance (5 menit TTL)
const _apiKeyCache = new Map();
const _CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Cek API key di database (tabel api_keys).
 * Return row { userId, status, environment } atau null.
 */
async function lookupApiKeyFromDb(presented) {
   if (!presented) return null;

   // Cek cache
   const cached = _apiKeyCache.get(presented);
   if (cached && cached.expiresAt > Date.now()) {
      return cached.row;
   }

   try {
      const row = await one(
         'SELECT id, "userId", status, environment, ip_whitelist AS "ipWhitelist" FROM api_keys WHERE key = $1 AND status = $2',
         [presented, 'active']
      );
      _apiKeyCache.set(presented, { row, expiresAt: Date.now() + _CACHE_TTL_MS });
      return row;
   } catch (e) {
      // DB error — fallback ke static key (jangan block request)
      console.error('[lookupApiKeyFromDb] error:', e.message);
      return null;
   }
}


/** Cocokkan IP client dengan pola whitelist (support wildcard * dan CIDR sederhana). */
function ipMatches(clientIp, pattern) {
   if (!clientIp || !pattern) return false;
   const ip = String(clientIp).replace(/^::ffff:/, '');
   const pat = String(pattern).trim();
   if (pat === '*' || pat === '0.0.0.0/0') return true;
   if (pat.includes('/')) {
      // CIDR sederhana (IPv4 only)
      const [net, bitsStr] = pat.split('/');
      const bits = parseInt(bitsStr, 10);
      if (![net, bits].every(Boolean) || Number.isNaN(bits)) return false;
      const toInt = (a) => a.split('.').reduce((acc, o) => (acc << 8) + (parseInt(o, 10) & 255), 0) >>> 0;
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (toInt(ip) & mask) === (toInt(net) & mask);
   }
   if (pat.includes('*')) {
      const rx = new RegExp('^' + pat.split('.').map(x => x === '*' ? '\\d+' : x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\.') + '$');
      return rx.test(ip);
   }
   return ip === pat;
}

/** Ambil IP client, mempertimbangkan X-Forwarded-For (di belakang proxy Vercel). */
function clientIp(req) {
   const xff = req.get('x-forwarded-for');
   if (xff) return xff.split(',')[0].trim();
   const xr = req.get('x-real-ip');
   if (xr) return xr.trim();
   return req.ip || req.socket?.remoteAddress || '';
}

export function requireApiKey(apiKey) {
   return async (req, res, next) => {
      // Static key kosong → semua request di-allow (warning startup yang penting)
      if (!apiKey) return next();

      const presented = presentedKey(req);
      if (!presented) {
         return res.status(401).json({ status_code: '401', status_message: 'Unauthorized. API Key tidak dikirim.' });
      }

      // 1) Cek static key dari .env
      if (safeEqual(presented, apiKey)) return next();

      // 2) Cek dari database (multi-key dari dashboard)
      const dbKey = await lookupApiKeyFromDb(presented);
      if (dbKey) {
         // IP whitelist (opsional — kalau di-set)
         const wl = dbKey.ipWhitelist || dbKey.ip_whitelist;
         if (Array.isArray(wl) && wl.length > 0) {
            const ip = clientIp(req);
            if (!wl.some((pat) => ipMatches(ip, pat))) {
               return res.status(403).json({
                  status_code: '403',
                  status_message: 'IP ' + (ip || 'unknown') + ' tidak ada di whitelist',
               });
            }
         }
         req.apiKeyUserId = dbKey.userId;
         req.apiKeyEnvironment = dbKey.environment;
         return next();
      }

      return res.status(401).json({ status_code: '401', status_message: 'Unauthorized. API Key tidak valid.' });
   };
}

/**
 * Fixed-window in-memory rate limiter, keyed by client IP.
 * @param {{ windowMs?: number, max?: number }} [opts]
 */
export function rateLimit({ windowMs = 60_000, max = 60, skip } = {}) {
   /** @type {Map<string, { count: number, reset: number }>} */
   const hits = new Map();
   return (req, res, next) => {
      if (typeof skip === 'function' && skip(req)) return next();
      const now = Date.now();
      const key = req.ip || req.socket?.remoteAddress || 'unknown';
      let rec = hits.get(key);
      if (!rec || now > rec.reset) {
         rec = { count: 0, reset: now + windowMs };
         hits.set(key, rec);
      }
      rec.count++;
      const remaining = Math.max(0, max - rec.count);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      if (rec.count > max) {
         res.setHeader('Retry-After', Math.ceil((rec.reset - now) / 1000));
         return res.status(429).json({ success: false, error: 'rate limited' });
      }
      // opportunistic sweep so the map can't grow unbounded
      if (hits.size > 10_000) {
         for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
      }
      next();
   };
}

/** HMAC-SHA256 signature of a raw string body. */
export function signBody(bodyStr, secret) {
   return crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
}

// ── SSRF guard for caller-supplied webhook URLs ──────────────────────────────
// A malicious `callbackUrl` could point the gateway at internal services
// (cloud metadata 169.254.169.254, localhost:6379, ...). Reject non-http(s) and
// obviously-internal hosts. ponytail: string/literal-IP checks only — no DNS
// resolution. A hostname that resolves to a private IP still slips through;
// add DNS pinning if the gateway runs in a network where that matters.
const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0', '169.254.169.254', 'metadata.google.internal']);

function isPrivateIp(host) {
   // IPv4 literals
   const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
   if (m) {
      const [a, b] = [Number(m[1]), Number(m[2])];
      if (a === 10) return true;                       // 10.0.0.0/8
      if (a === 127) return true;                      // loopback
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
      if (a === 192 && b === 168) return true;         // 192.168.0.0/16
      if (a === 169 && b === 254) return true;         // link-local / metadata
      if (a === 0) return true;
      return false;
   }
   // IPv6 literals only. The URL parser keeps them bracketed, so a hostname that
   // merely starts with "fc" or "fd" (fdic.gov) is not one.
   if (!host.startsWith('[')) return false;
   const h = host.slice(1, -1).toLowerCase();
   // IPv4-mapped or -compatible: [::ffff:127.0.0.1] reaches loopback. The parser
   // rewrites it to [::ffff:7f00:1], so decode the hex back and check it as IPv4.
   const v4 = h.match(/^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
   if (v4) {
      const [hi, lo] = [parseInt(v4[1], 16), parseInt(v4[2], 16)];
      return isPrivateIp(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
   }
   if (h === '::1' || h === '::') return true;
   // unique-local fc00::/7, link-local fe80::/10, site-local fec0::/10
   return /^f[cd]/.test(h) || /^fe[89a-f]/.test(h);
}

/**
 * Validate a caller-supplied webhook URL. Returns { ok, error }.
 * Only http/https, no internal/private hosts, no credentials in the URL.
 */
export function validateWebhookUrl(raw) {
   let url;
   try {
      url = new URL(raw);
   } catch {
      return { ok: false, error: 'callbackUrl is not a valid URL' };
   }
   if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'callbackUrl must be http or https' };
   }
   if (url.username || url.password) {
      return { ok: false, error: 'callbackUrl must not contain credentials' };
   }
   // A trailing dot ("localhost.") resolves the same as without one.
   const host = url.hostname.toLowerCase().replace(/\.$/, '');
   if (BLOCKED_HOSTNAMES.has(host) || isPrivateIp(host)) {
      return { ok: false, error: 'callbackUrl points to a blocked/internal host' };
   }
   return { ok: true };
}

/**
 * Verify an incoming webhook signature. For consumers of THIS gateway —
 * exported so downstream apps can import the same check.
 * @param {string} rawBody
 * @param {string} signature - value from X-Signature header
 * @param {string} secret
 */
export function verifyWebhookSignature(rawBody, signature, secret) {
   return safeEqual(signBody(rawBody, secret), signature || '');
}
