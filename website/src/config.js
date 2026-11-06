import 'dotenv/config';

const int = (name, fallback) => {
   const raw = process.env[name];
   if (raw == null || raw === '') return fallback;
   const n = parseInt(raw, 10);
   if (!Number.isInteger(n)) throw new Error(name + ' must be an integer, got "' + raw + '"');
   return n;
};

const str = (name, fallback = null) => process.env[name] || fallback;
const MAX_EXPIRE_MINUTES = 7 * 24 * 60;

export const config = Object.freeze({
   port: int('PORT', 3000),
   publicUrl: (process.env.PUBLIC_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL) || '').replace(/\/$/, ''),
   trustProxy: str('TRUST_PROXY', '1'),
   databaseUrl: str('DATABASE_URL'),
   qrisString: str('QRIS_STRING'),
   pollMinIntervalMs: int('POLL_MIN_INTERVAL_MS', 7000),
   expireMinutes: int('EXPIRE_MINUTES', 5),
   maxExpireMinutes: MAX_EXPIRE_MINUTES,
   rateMax: int('RATE_MAX', 60),
   maxAmount: int('MAX_AMOUNT', 1000000000),
   timeZone: str('TZ_NAME', 'Asia/Jakarta'),
   apiKey: str('API_KEY'),
   apiKeyPrefix: 'csp_',
   mutasiSecret: str('MUTASI_SECRET'),
   uniqueAmount: str('UNIQUE_AMOUNT', '1') !== '0',
   webhook: Object.freeze({
      url: str('WEBHOOK_URL'),
      secret: str('WEBHOOK_SECRET', 'change-me'),
      timeoutMs: int('WEBHOOK_TIMEOUT_MS', 10000),
      maxAttempts: int('WEBHOOK_MAX_ATTEMPTS', 12),
      maxBackoffMs: int('WEBHOOK_MAX_BACKOFF_MS', 900000),
   }),
   isProduction: process.env.NODE_ENV === 'production',
   isServerless: !!process.env.VERCEL,
});

export function checkConfig(c = config) {
   const fatal = [];
   const warn = [];
   if (!c.databaseUrl && c.isServerless) fatal.push('DATABASE_URL not set');
   if (!c.qrisString) fatal.push('QRIS_STRING not set');
   if (c.expireMinutes < 1 || c.expireMinutes > MAX_EXPIRE_MINUTES) fatal.push('EXPIRE_MINUTES must be between 1 and ' + MAX_EXPIRE_MINUTES);
   if (c.webhook.secret === 'change-me') {
      const msg = 'WEBHOOK_SECRET is still default';
      if (c.isProduction) fatal.push(msg); else warn.push(msg);
   }
   if (!c.apiKey) warn.push('API_KEY not set');
   if (c.trustProxy === 'true') warn.push('TRUST_PROXY=true');
   if (c.pollMinIntervalMs < 7000) warn.push('POLL_MIN_INTERVAL_MS=' + c.pollMinIntervalMs + ' aggressive');
   if (c.isServerless) warn.push('rate limit per-instance');
   return { fatal, warn };
}
