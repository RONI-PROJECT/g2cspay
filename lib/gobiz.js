/**
 * GoBiz (GoPay Merchant) client.
 *
 * Serverless-shaped: no child processes, no local cache file, no polling loop.
 * The access token and merchant id are cached in the database, because a Vercel
 * function has no writable disk and no memory that survives an invocation — a
 * per-invocation login would get the account rate-limited within minutes.
 *
 * Adapted from kavionn/cspay.
 *
 * Session recovery order (when the cached access token is rejected):
 *   1. a newer token that another instance already cached
 *   2. refresh_token grant (the token saved by the OTP login — long-lived)
 *   3. password login, ONLY if GOBIZ_PASSWORD_LOGIN=1 (off by default)
 *   4. otherwise stop and report NEEDS_OTP — never loop on failing logins
 */
import moment from 'moment-timezone';
import crypto from 'node:crypto';
import { log } from '../src/logger.js';
import * as meta from '../src/db/meta.js';

const logMerchant = log('merchant');
const logAuth = log('auth');

const BASE_URL = 'https://api.gobiz.co.id';
const ANALYTICS_URL = 'https://api.gojekapi.com/merchant-analytics/v2/merchants/transactions';
const CLIENT_ID = 'go-biz-web-new';
const CACHE_KEY = 'gobiz.cache';
const TZ = process.env.TZ_NAME || 'Asia/Jakarta';

/** Same build/UA as lib/gobiz-otp.js — an old X-AppVersion gets "Harap perbarui versi". */
const APP_VERSION = 'platform-v3.125.0-e1923971';

/** Statuses that mean money actually arrived. Refunds must never look like a payin. */
const PAYIN_STATUSES = ['SETTLEMENT', 'CAPTURE'];
const PAYMENT_TYPES = ['QRIS', 'GOPAY', 'OFFLINE_CREDIT_CARD', 'OFFLINE_DEBIT_CARD', 'CREDIT_CARD'];

/** Password-login backoff: 15m → 1h → 6h → 24h (cap). Reset by a successful login. */
const LOGIN_COOLDOWNS_MS = [15 * 60_000, 60 * 60_000, 6 * 60 * 60_000, 24 * 60 * 60_000];
/** Cooldown after GoBiz answers a refresh with 429. */
const REFRESH_COOLDOWN_MS = 10 * 60_000;
/** Soft lock so concurrent instances don't all refresh at once (not atomic, best effort). */
const REFRESH_LOCK_MS = 30_000;

/**
 * Password login used to be the automatic fallback. It is off by default now:
 * GoBiz asks for OTP on unknown/expired sessions, so it just fails repeatedly and
 * deepens the rate-limit. Set GOBIZ_PASSWORD_LOGIN=1 to bring it back.
 */
const PASSWORD_LOGIN_ENABLED = process.env.GOBIZ_PASSWORD_LOGIN === '1';

export class NeedsOtpError extends Error {
   constructor(message) {
      super(message || '[GoPayMerchant] NEEDS_OTP: sesi GoBiz habis dan refresh token tidak valid. '
         + 'Login OTP ulang sekali (POST /api/gobiz/otp/request lalu verify).');
      this.name = 'NeedsOtpError';
      this.code = 'NEEDS_OTP';
   }
}

const readCache = async () => (await meta.get(CACHE_KEY)) || {};
const writeCache = (fields) => meta.patch(CACHE_KEY, fields);

/** True while the "needs OTP" flag is newer than the last successful OTP login. */
const needsOtpNow = (cache) => !!cache.needsOtp && (cache.needsOtpAt || 0) >= (cache.otpLoginAt || 0);

function getAuthHeaders(uniqueId, accessToken) {
   return {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'id',
      'Authentication-Type': 'go-id',
      'Authorization': accessToken ? `Bearer ${accessToken}` : 'Bearer',
      'Content-Type': 'application/json',
      'Gojek-Country-Code': 'ID',
      'Gojek-Timezone': 'Asia/Jakarta',
      'Origin': 'https://portal.gofoodmerchant.co.id',
      'Referer': 'https://portal.gofoodmerchant.co.id/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
      'X-AppVersion': APP_VERSION,
      'X-PhoneMake': 'Windows 10 64-bit',
      'X-PhoneModel': 'Chrome 148.0.0.0 on Windows 10 64-bit',
      'X-Platform': 'Web',
      'X-User-Locale': 'en-US',
      'X-User-Type': 'merchant',
      'sec-ch-ua': '"Google Chrome";v="148", "Chromium";v="148", "Not)A;Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'x-DeviceOS': 'Web',
      'x-appId': 'go-biz-web-dashboard',
      'x-uniqueid': uniqueId,
   };
}

/** POST JSON with a hard timeout, returning the parsed body whatever the status. */
async function postJson(url, headers, payload, timeoutMs = 15_000) {
   const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
   });
   const text = await res.text();
   let body;
   try {
      body = JSON.parse(text);
   } catch {
      throw new Error(`Respons GoBiz bukan JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
   }
   return { status: res.status, ok: res.ok, body };
}

async function loginWithPassword(email, password, uid) {
   const headers = getAuthHeaders(uid);

   logAuth.info(`Memvalidasi email: ${email}`);
   const validation = await postJson(`${BASE_URL}/goid/login/request`, headers, {
      email, login_type: 'password', client_id: CLIENT_ID,
   });

   if (validation.body.errors?.length > 0) {
      const msg = validation.body.errors[0].message || '';
      logAuth.warn(`Peringatan validasi email: ${msg}`);
      // Rate-limited at the validation step → the token request will also fail
      // AND deepen the ban. Bail out now instead of pushing another request.
      if (/terlalu banyak|too many|rate.?limit|coba lagi|try again/i.test(msg)) {
         throw new Error(`Login dibatalkan — rate-limit di validasi email: ${msg}`);
      }
   }

   logAuth.info('Mengirim kredensial login...');
   const token = await postJson(`${BASE_URL}/goid/token`, headers, {
      client_id: CLIENT_ID,
      grant_type: 'password',
      data: { email, password },
   });

   if (token.body.errors?.length > 0) {
      throw new Error(`Login gagal: ${token.body.errors[0].message || 'Password salah atau akun bermasalah'}`);
   }
   if (!token.body.access_token) {
      throw new Error(`Login gagal: GoBiz tidak mengembalikan access_token (HTTP ${token.status})`);
   }
   return token.body;
}

export default class GoPayMerchant {
   constructor(options = {}) {
      this.token = options.token || null;
      this.merchantId = options.merchantId || null;
      this._initialized = false;
      this._deviceId = null;
      // Successful password logins by this instance. The session health check
      // counts re-auths from this, not from its own calls to init().
      this.logins = 0;
      // Successful refresh_token renewals by this instance.
      this.refreshes = 0;
   }

   /**
    * ONE device id for every request, persisted in the cache. Using a fresh random
    * x-uniqueid per request makes GoBiz see a brand-new device each time, which is
    * what pushes it into OTP / rate-limit. The refresh token is bound to this id.
    */
   async _uid() {
      if (this._deviceId) return this._deviceId;
      const cache = await readCache();
      if (cache.deviceUniqueId) {
         this._deviceId = cache.deviceUniqueId;
         return this._deviceId;
      }
      const id = crypto.randomUUID();
      await writeCache({ deviceUniqueId: id }).catch(() => {});
      this._deviceId = id;
      return id;
   }

   /**
    * Probe the token. Three-valued on purpose: a 429 or a 5xx says nothing about
    * whether the token is good, and treating it as "invalid" would trigger a
    * login that deepens an existing rate-limit.
    * @returns {Promise<'valid'|'invalid'|'unknown'>}
    */
   async tokenState(token) {
      if (!token) return 'invalid';
      try {
         const res = await postJson(
            `${BASE_URL}/v1/merchants/search`,
            getAuthHeaders(await this._uid(), token),
            { from: 0, to: 1, _source: ['id'] },
         );
         if (res.status === 401 || res.status === 403) return 'invalid';
         return res.ok ? 'valid' : 'unknown';
      } catch {
         return 'unknown';
      }
   }

   /** Back-compat shape for the health probe: only an explicit 'invalid' is false. */
   async _isTokenValid(token) {
      return (await this.tokenState(token)) !== 'invalid';
   }

   /**
    * Renew the access token with the stored refresh token.
    * @returns {Promise<'ok'|'rejected'>} 'rejected' = GoBiz says the refresh token is dead.
    *   Transient problems (429, 5xx, timeout, another instance refreshing) throw instead,
    *   so they never mark the session as dead.
    */
   async _refresh(cache) {
      const now = Date.now();

      if (cache.refreshCooldownUntil && now < cache.refreshCooldownUntil) {
         const waitS = Math.ceil((cache.refreshCooldownUntil - now) / 1000);
         throw new Error(`[GoPayMerchant] Refresh token di-cooldown ${waitS}s (rate-limit GoBiz).`);
      }

      if (cache.refreshLockUntil && now < cache.refreshLockUntil) {
         // Another instance is refreshing right now. Wait briefly and use its result:
         // with a rotating refresh token, two parallel refreshes kill each other.
         await new Promise((r) => setTimeout(r, 4000));
         const fresh = await readCache();
         if (fresh.token && fresh.token !== this.token && (await this.tokenState(fresh.token)) === 'valid') {
            this.token = fresh.token;
            return 'ok';
         }
         throw new Error('[GoPayMerchant] Refresh sedang dijalankan instance lain, coba lagi sebentar.');
      }

      await writeCache({ refreshLockUntil: now + REFRESH_LOCK_MS });

      logAuth.info('Access token habis, refresh dengan refresh token...');
      let res;
      try {
         res = await postJson(
            `${BASE_URL}/goid/token`,
            getAuthHeaders(await this._uid()),
            { client_id: CLIENT_ID, grant_type: 'refresh_token', data: { refresh_token: cache.refreshToken } },
         );
      } catch (e) {
         await writeCache({ refreshLockUntil: null });
         throw e;
      }

      const errMsg = res.body?.errors?.[0]?.message || '';

      if (res.ok && res.body?.access_token) {
         this.token = res.body.access_token;
         await writeCache({
            token: this.token,
            // Refresh tokens may rotate — always keep the newest one.
            refreshToken: res.body.refresh_token || cache.refreshToken,
            tokenExpiresIn: res.body.expires_in || null,
            refreshedAt: Date.now(),
            probeOkAt: Date.now(),
            refreshLockUntil: null,
            refreshCooldownUntil: null,
            needsOtp: false,
         });
         this.refreshes++;
         logAuth.ok('Refresh token berhasil, access token diperbarui.');
         return 'ok';
      }

      if (res.status === 429 || /terlalu banyak|too many|rate.?limit/i.test(errMsg)) {
         await writeCache({ refreshLockUntil: null, refreshCooldownUntil: Date.now() + REFRESH_COOLDOWN_MS });
         throw new Error(`[GoPayMerchant] Refresh kena rate-limit GoBiz: ${errMsg || 'HTTP 429'}`);
      }

      if (res.status >= 500 || (res.ok && !res.body?.access_token)) {
         await writeCache({ refreshLockUntil: null });
         throw new Error(`[GoPayMerchant] Refresh gagal sementara (HTTP ${res.status}) ${errMsg}`.trim());
      }

      // 4xx / errors[] → the refresh token itself is rejected (expired, revoked,
      // account logged out elsewhere). Retrying cannot help; flag it once.
      logAuth.warn(`Refresh token ditolak GoBiz (HTTP ${res.status}): ${errMsg || 'tanpa pesan'}`);
      await writeCache({
         token: null,
         refreshLockUntil: null,
         needsOtp: true,
         needsOtpAt: Date.now(),
         lastRefreshError: `HTTP ${res.status}: ${errMsg}`.slice(0, 300),
      });
      return 'rejected';
   }

   /** Last-resort password login (only when GOBIZ_PASSWORD_LOGIN=1), with exponential backoff. */
   async _doLogin() {
      const email = process.env.GOPAY_EMAIL;
      const password = process.env.GOPAY_PASSWORD;
      if (!email || !password) {
         throw new Error('[GoPayMerchant] GOPAY_EMAIL/GOPAY_PASSWORD belum diisi');
      }

      const cache = await readCache();
      if (cache.loginCooldownUntil && Date.now() < cache.loginCooldownUntil) {
         const waitS = Math.ceil((cache.loginCooldownUntil - Date.now()) / 1000);
         throw new Error(
            `[GoPayMerchant] Login di-cooldown ${waitS}s (rate-limit / kredensial salah). `
            + 'Tunggu cooldown habis atau login OTP.',
         );
      }

      logMerchant.info(`Login password sebagai: ${email}`);
      let body;
      try {
         body = await loginWithPassword(email, password, await this._uid());
      } catch (e) {
         // Persisted, not in-memory: the next invocation is a different instance
         // and would otherwise retry immediately and deepen the ban.
         const fails = (cache.loginFails || 0) + 1;
         const wait = LOGIN_COOLDOWNS_MS[Math.min(fails - 1, LOGIN_COOLDOWNS_MS.length - 1)];
         await writeCache({
            loginFails: fails,
            loginCooldownUntil: Date.now() + wait,
            lastLoginError: String(e.message).slice(0, 300),
         });
         throw e;
      }
      this.token = body.access_token;
      await writeCache({
         token: this.token,
         refreshToken: body.refresh_token || cache.refreshToken || null,
         tokenExpiresIn: body.expires_in || null,
         loginCooldownUntil: null,
         loginFails: 0,
         needsOtp: false,
      });
      this.logins++;
      logMerchant.ok('Login berhasil, token disimpan.');
   }

   /** Bring the session back without ever looping on a login that cannot work. */
   async _recoverSession() {
      const cache = await readCache();

      // 1. Another instance may already have renewed the token.
      if (cache.token && cache.token !== this.token && (await this.tokenState(cache.token)) === 'valid') {
         this.token = cache.token;
         logMerchant.info('Memakai token baru dari cache (sudah diperbarui instance lain).');
         return;
      }

      // 2. Refresh token — skipped once GoBiz has rejected it (until a new OTP login).
      if (!needsOtpNow(cache) && cache.refreshToken) {
         const result = await this._refresh(cache);
         if (result === 'ok') return;
      }

      // 3. Password login: opt-in only.
      if (PASSWORD_LOGIN_ENABLED) {
         await this._doLogin();
         return;
      }

      // 4. Stop. One OTP login restores everything; hammering GoBiz does not.
      throw new NeedsOtpError();
   }

   async _detectMerchantId() {
      logMerchant.info('Mendeteksi Merchant ID...');
      const res = await postJson(
         `${BASE_URL}/v1/merchants/search`,
         getAuthHeaders(await this._uid(), this.token),
         { from: 0, to: 50, _source: ['id', 'merchant_name'] },
      );
      if (!res.ok) {
         throw new Error(`Gagal mengambil list merchant (${res.status}): ${res.body?.errors?.[0]?.message || 'Gagal autentikasi'}`);
      }

      const data = res.body;
      const list = Array.isArray(data) ? data
         : Array.isArray(data?.merchants) ? data.merchants
         : Array.isArray(data?.hits?.hits) ? data.hits.hits.map((h) => h._source || h)
         : Array.isArray(data?.hits) ? data.hits
         : Array.isArray(data?.data) ? data.data
         : [];

      if (!list.length) throw new Error('[GoPayMerchant] Tidak ada merchant terasosiasi dengan akun ini.');

      this.merchantId = list[0].id || list[0].merchant_id;
      logMerchant.ok(`Menggunakan merchant: ${list[0].merchant_name || 'Tidak diketahui'} (ID: ${this.merchantId})`);
      await writeCache({ merchantId: this.merchantId });
   }

   async init() {
      if (this._initialized) return;
      const cache = await readCache();

      if (!this.token && cache.token) {
         this.token = cache.token;
         logMerchant.info('Token dimuat dari cache.');
      }

      // A cached token may be newer than the one passed in via env.
      if (this.token && cache.token && this.token !== cache.token
          && (await this.tokenState(this.token)) === 'invalid') {
         logMerchant.info('Token utama invalid, mencoba token dari cache...');
         this.token = cache.token;
      }

      if ((await this.tokenState(this.token)) === 'invalid') {
         logMerchant.info('Token tidak valid atau belum ada, memulihkan sesi...');
         await this._recoverSession();
      }

      if (!this.merchantId) this.merchantId = cache.merchantId || null;
      if (!this.merchantId) await this._detectMerchantId();

      this._initialized = true;
   }

   /**
    * When the login cooldown lifts (epoch ms), or null if there is none.
    *
    * Surfaced so the dashboard can show a countdown and disable "check now":
    * retrying login during a GoBiz rate-limit is what deepens the ban, and an
    * operator staring at "session down" has no other way to learn that waiting is
    * the fix.
    */
   async loginCooldownUntil() {
      const { loginCooldownUntil: until } = await readCache();
      return until && until > Date.now() ? until : null;
   }

   /** True when only a fresh OTP login can bring the session back. */
   async needsOtp() {
      return needsOtpNow(await readCache());
   }

   /** Drop the cached access token so the next init() recovers the session. */
   async invalidateToken() {
      this.token = null;
      this._initialized = false;
      await writeCache({ token: null });
   }

   /**
    * Incoming transactions, newest first.
    *
    * Only settled payins — REFUND and PARTIAL_REFUND are deliberately excluded.
    * They carry a positive gross_amount, so including them would let a refund
    * whose value happens to equal a pending order's payable amount mark that
    * order PAID.
    */
   async getHistory({ days = 1, size = 50, from = 0 } = {}) {
      await this.init();

      const analytics = await this._fetchAnalytics({ days, size, from });
      if (Array.isArray(analytics?.transactions)) return this._normalize(analytics.transactions);

      // The analytics endpoint is undocumented and has changed shape before. The
      // journal search returns the same transactions the long way round.
      logMerchant.warn('Analytics tidak mengembalikan transactions[], fallback ke journal.');
      const journal = await this._fetchJournal({ days, size, from });
      const nested = Array.isArray(journal?.data)
         ? journal.data.map((item) => item.metadata?.transaction).filter(Boolean)
         : [];
      return this._normalize(nested);
   }

   /**
    * Upstream rows → the flat shape the reconciler consumes.
    *
    * The status field is `transaction_status` on the analytics endpoint. Reading
    * plain `status` here silently dropped every single payment — the filter matched
    * nothing, so `getHistory` always returned [] and no payment was ever
    * reconciled. `status` is kept as a fallback because the journal fallback path
    * nests a differently-shaped transaction object.
    */
   _normalize(transactions) {
      return transactions
         .filter((tx) => PAYIN_STATUSES.includes(
            String(tx.transaction_status ?? tx.status ?? '').toUpperCase(),
         ))
         .map((tx) => {
            // Strict ISO, so moment never guesses. A timestamp without an offset is
            // read as merchant-local time.
            const at = tx.transaction_time ? moment.tz(tx.transaction_time, moment.ISO_8601, TZ) : null;
            const valid = !!at?.isValid();
            return {
               gobizId: String(tx.transaction_id ?? tx.id ?? tx.order_id ?? `${tx.transaction_time}_${tx.gross_amount}`),
               // Upstream reports cents.
               amount: typeof tx.gross_amount === 'number' ? tx.gross_amount / 100 : Number.NaN,
               time: valid ? at.clone().locale('id').format('DD MMM YYYY - HH:mm:ss') : null,
               // When the payer paid, as ISO UTC. The reconciler matches on this.
               paidAt: valid ? at.toISOString() : null,
               raw: tx,
            };
         });
   }

   async _fetchAnalytics({ days, size, from = 0 }) {
      const url = new URL(ANALYTICS_URL);
      url.searchParams.set('from', String(from));
      url.searchParams.set('size', String(size));
      url.searchParams.set('statuses', PAYIN_STATUSES.join(','));
      url.searchParams.set('payment_types', PAYMENT_TYPES.join(','));
      url.searchParams.set('start_time', moment().tz(TZ).subtract(days, 'days').toISOString());
      url.searchParams.set('end_time', moment().tz(TZ).toISOString());
      url.searchParams.set('merchant_ids', this.merchantId);

      const send = () => fetch(url, {
         method: 'GET',
         headers: {
            accept: 'application/json, text/plain, */*',
            'authentication-type': 'go-id',
            authorization: `Bearer ${this.token}`,
            'content-type': 'application/json',
         },
         signal: AbortSignal.timeout(15_000),
      });

      let res = await send();
      if (res.status === 401) {
         // Another instance may already have renewed the token. Use that one
         // instead of wiping it: a wipe pushes every other instance into its own
         // recovery, and a burst of those gets the account rate-limited.
         const { token: cached } = await readCache();
         if (cached && cached !== this.token) {
            logMerchant.info('Token expired, memakai token baru dari cache...');
            this.token = cached;
         } else {
            logMerchant.info('Token expired, memulihkan sesi...');
            await this.invalidateToken();
            await this.init();
         }
         res = await send();
      }
      if (!res.ok) throw new Error(`HTTP Error Analytics: ${res.status} ${res.statusText}`);
      return res.json();
   }

   /** Fallback source. Same transactions, wrapped in journal entries. */
   async _fetchJournal({ days, size, from = 0 }) {
      const body = {
         from,
         size,
         sort: { time: { order: 'desc' } },
         included_categories: { incoming: ['transaction_share', 'action'] },
         query: [{
            op: 'and',
            clauses: [
               {
                  op: 'not',
                  clauses: [{
                     op: 'or',
                     clauses: [
                        { field: 'metadata.source', op: 'in', value: ['GOSAVE_ONLINE', 'GoSave', 'GODEALS_ONLINE'] },
                        { field: 'metadata.gopay.source', op: 'in', value: ['GOSAVE_ONLINE', 'GoSave', 'GODEALS_ONLINE'] },
                     ],
                  }],
               },
               {
                  field: 'metadata.transaction.status',
                  op: 'in',
                  value: PAYIN_STATUSES.map((s) => s.toLowerCase()),
               },
               {
                  field: 'metadata.transaction.payment_type',
                  op: 'in',
                  value: PAYMENT_TYPES.map((t) => t.toLowerCase()),
               },
               { field: 'metadata.transaction.transaction_time', op: 'gte', value: moment().tz(TZ).subtract(days, 'days').toISOString() },
               { field: 'metadata.transaction.transaction_time', op: 'lte', value: moment().tz(TZ).toISOString() },
               { field: 'metadata.transaction.merchant_id', op: 'equal', value: this.merchantId },
            ],
         }],
      };

      const res = await postJson(
         `${BASE_URL}/journals/search`,
         {
            ...getAuthHeaders(await this._uid(), this.token),
            accept: 'application/json, text/plain, */*, application/vnd.journal.v1+json',
         },
         body,
      );
      if (!res.ok) throw new Error(`HTTP Error Journal: ${res.status}`);
      return res.body;
   }
}
