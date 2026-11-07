/**
 * Login GoBiz via OTP (SMS) — struktur disamakan 1:1 dengan lib/gobiz.js asli:
 *   - Semua endpoint ke https://api.gobiz.co.id (portal host 404 untuk /goid/*)
 *   - Authorization: Bearer — BUKAN X-API-Key (itu penyebab "Harap perbarui versi")
 *   - x-uniqueid SATU device id persist di cache, dipakai ulang
 *   - request OTP tanpa login_type; X-AppVersion = build portal Okt 2026
 */
import crypto from 'node:crypto';
import { log } from '../src/logger.js';
import * as meta from '../src/db/meta.js';

const logAuth = log('auth');

const BASE_URL = 'https://api.gobiz.co.id';
const CLIENT_ID = 'go-biz-web-new';
const APP_VERSION = 'platform-v3.125.0-e1923971';
const CACHE_KEY = 'gobiz.cache';

const readCache = async () => (await meta.get(CACHE_KEY)) || {};

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

function normalizePhone(phone) {
   let p = String(phone).trim().replace(/\D/g, '');
   if (p.startsWith('62')) p = p.slice(2);
   else if (p.startsWith('0')) p = p.slice(1);
   if (p.length < 8 || p.length > 15) throw new Error('Nomor HP tidak valid (contoh: 085123456789)');
   return p;
}

async function deviceUniqueId() {
   const cache = await readCache();
   if (cache.deviceUniqueId) return cache.deviceUniqueId;
   const id = crypto.randomUUID();
   await meta.patch(CACHE_KEY, { deviceUniqueId: id }).catch(() => {});
   return id;
}

export async function requestLoginOtp(phone) {
   const p = normalizePhone(phone);
   logAuth.info(`Request OTP GoBiz ke +62${p}`);
   const uid = await deviceUniqueId();
   const res = await postJson(
      `${BASE_URL}/goid/login/request`,
      getAuthHeaders(uid),
      { client_id: CLIENT_ID, phone_number: p, country_code: '62' },
   );
   if (res.body?.errors?.length > 0) {
      const msg = res.body.errors[0].message || '';
      if (/terlalu banyak|too many|rate.?limit|coba lagi|try again/i.test(msg)) {
         throw new Error(`Request OTP dibatalkan — rate-limit: ${msg}`);
      }
      throw new Error(`Request OTP gagal: ${msg || 'coba lagi nanti'}`);
   }
   const otpToken = res.body?.data?.otp_token || res.body?.otp_token || null;
   if (!otpToken) {
      throw new Error(`GoBiz tidak mengembalikan otp_token (HTTP ${res.status}): ${JSON.stringify(res.body).slice(0, 300)}`);
   }
   return { otpToken, phone: `+62${p}` };
}

export async function verifyLoginOtp(otpToken, otp) {
   const code = String(otp ?? '').trim();
   if (!otpToken) throw new Error('otpToken kosong — jalankan /api/gobiz/otp/request dulu');
   if (!code) throw new Error('Kode OTP kosong');

   const uid = await deviceUniqueId();
   const res = await postJson(
      `${BASE_URL}/goid/token`,
      getAuthHeaders(uid),
      { client_id: CLIENT_ID, grant_type: 'otp', data: { otp: code, otp_token: otpToken } },
   );
   if (res.body?.errors?.length > 0) {
      throw new Error(`Login OTP gagal: ${res.body.errors[0].message || 'Kode OTP salah atau sudah kadaluarsa'}`);
   }
   const token = res.body?.access_token;
   if (!token) {
      throw new Error(`GoBiz tidak mengembalikan access_token (HTTP ${res.status}): ${JSON.stringify(res.body).slice(0, 300)}`);
   }

   let merchantId = null;
   let merchantName = null;
   try {
      const resM = await postJson(
         `${BASE_URL}/v1/merchants/search`,
         getAuthHeaders(uid, token),
         { from: 0, to: 50, _source: ['id', 'merchant_name'] },
      );
      if (resM.ok) {
         const d = resM.body;
         const list = Array.isArray(d) ? d
            : Array.isArray(d?.merchants) ? d.merchants
            : Array.isArray(d?.hits?.hits) ? d.hits.hits.map((h) => h._source || h)
            : Array.isArray(d?.hits) ? d.hits
            : Array.isArray(d?.data) ? d.data
            : [];
         if (list.length) {
            merchantId = list[0].id || list[0].merchant_id || null;
            merchantName = list[0].merchant_name || null;
         }
      }
   } catch (e) {
      logAuth.warn(`Validasi merchant gagal (token tetap disimpan): ${e.message}`);
   }

   await meta.patch(CACHE_KEY, {
      token,
      refreshToken: res.body?.refresh_token || null,
      tokenExpiresIn: res.body?.expires_in || null,
      otpLoginAt: Date.now(),
      ...(merchantId ? { merchantId } : {}),
      loginCooldownUntil: null,
      loginFails: 0,
      probeOkAt: Date.now(),
   });
   logAuth.ok(`Login OTP berhasil${merchantName ? ` — merchant: ${merchantName}` : ''}. Token tersimpan.`);
   return { merchantId, merchantName, expiresIn: res.body?.expires_in || null };
}
