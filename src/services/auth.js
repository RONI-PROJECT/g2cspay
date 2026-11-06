import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { sql, one } from '../db/index.js';

export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
export const generateToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

export async function createSession(userId, ip, ua) {
   const token = generateToken();
   const now = new Date().toISOString();
   const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
   await sql(
      `INSERT INTO sessions (token, "userId", "createdAt", "expiresAt", "ipAddress", "userAgent")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [token, userId, now, expiresAt, ip, ua]
   );
   return { token, expiresAt };
}

// Cache sesi di memori: dashboard nembak 5-8 request paralel per halaman dan
// tiap request dulu = 1 query ke DB remote. TTL pendek, sesi logout langsung dihapus.
const SESSION_TTL = 20_000;
const SESSION_STALE_OK = 5 * 60_000; // kalau DB sedang error, sesi lama masih boleh dipakai
const sessionCache = new Map();
const sessionInflight = new Map();

export async function getSession(token) {
   if (!token) return null;
   const now = Date.now();
   const hit = sessionCache.get(token);
   if (hit && now - hit.at < SESSION_TTL) return hit.value;

   if (sessionInflight.has(token)) return sessionInflight.get(token);
   const p = (async () => {
      try {
         const value = await one(
            `SELECT s.*, u.email, u.name, u.role, u.status AS "userStatus"
             FROM sessions s JOIN users u ON u.id = s."userId"
             WHERE s.token = $1 AND s."expiresAt" > $2`,
            [token, new Date().toISOString()]
         );
         if (value) sessionCache.set(token, { value, at: Date.now() });
         else sessionCache.delete(token);
         if (sessionCache.size > 5000) sessionCache.delete(sessionCache.keys().next().value);
         return value;
      } catch (e) {
         if (hit && now - hit.at < SESSION_STALE_OK && new Date(hit.value.expiresAt) > new Date()) return hit.value;
         throw e;
      } finally { sessionInflight.delete(token); }
   })();
   sessionInflight.set(token, p);
   return p;
}

export async function deleteSession(token) {
   sessionCache.delete(token);
   await sql('DELETE FROM sessions WHERE token = $1', [token]);
}

function genMerchantCode() {
   const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
   let s = '';
   for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
   return 'MRC-' + s;
}

export async function createUser({ email, password, name, phone, storeName, role = 'user' }) {
   const hash = await hashPassword(password);
   const now = new Date().toISOString();

   // Generate merchant_code unik (retry kalau bentrok)
   let merchantCode = null;
   for (let tries = 0; tries < 10; tries++) {
      const code = genMerchantCode();
      const exists = await one('SELECT id FROM users WHERE merchant_code = $1', [code]);
      if (!exists) { merchantCode = code; break; }
   }

   return await one(
      `INSERT INTO users (email, password, name, phone, role, merchant_code, store_name, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, email, name, phone, role, merchant_code, store_name, "createdAt"`,
      [email.toLowerCase(), hash, name, phone || null, role, merchantCode, storeName || null, now]
   );
}
