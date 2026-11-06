/**
 * /api/mutasi — webhook mutasi mandiri (deteksi pembayaran TANPA login GoBiz).
 *
 *   GET|POST /api/mutasi/in?key=SECRET        → terima notif mutasi (SMS/notif/email), match ke trx PENDING
 *   GET|POST /api/mutasi/test?key=SECRET&text=... → parsing doang (tanpa DB), buat debug payload forwarder
 *
 * SECRET = env MUTASI_SECRET (fallback: CRON_SECRET biar gak perlu nambah env baru).
 *
 * Sumber payload fleksibel — body/query yang diterima:
 *   { text | message | msg | body | content | description | remark | note | title }
 *   { from | sender | source | address | bank }        (opsional)
 *   { time | date | timestamp | created_at }           (opsional)
 *   { amount }                                         (opsional, gaya Moota/CekMutasi)
 * Kompatibel webhook Moota/CekMutasi: kalau nanti mau pindah ke layanan itu,
 * tinggal arahkan webhook-nya ke endpoint ini.
 *
 * Cara kerja:
 *   1. Ekstrak semua nominal dari teks ("Rp50.037", "50037.00", "1.234.567" dst).
 *   2. Cari trx PENDING/EXPIRED dengan payAmount persis sama (nominal unik dari /charge).
 *   3. Klaim lewat gobiz_history (hash SMS) → anti dobel kredit walau SMS masuk 2x.
 *   4. markPaid → webhook Midtrans-style ke callback_url (sama persis seperti jalur lama).
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import { log } from '../logger.js';
import * as transactions from '../db/transactions.js';
import * as history from '../db/history.js';
import * as payments from '../services/payments.js';

const logger = log('mutasi');

const eq = (a, b) => {
   const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
   return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/* Kata yang nandaikan "ini nominal pembayarannya", bukan saldo/ referencing lain. */
const STRONG = ['menerima', 'transfer masuk', 'diterima', 'pembayaran', 'pembayaran qris', 'qris', 'cr', 'credit', 'kredit', 'settlement', 'incoming', 'berhasil masuk'];

export function extractAmounts(text) {
   const t = String(text || '');
   const found = [];
   const re = /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d{4,12}(?:[.,]\d{2})?)/gi;
   let m;
   while ((m = re.exec(t))) {
      const raw = m[1];
      let norm = raw;
      if (/[.,]\d{2}$/.test(norm)) norm = norm.slice(0, -3);   // buang desimal ".00" / ",37" gaya bank
      norm = norm.replace(/[.,]/g, '');
      if (!/^\d+$/.test(norm)) continue;
      const value = parseInt(norm, 10);
      if (value < 100 || value > 999999999) continue;
      const ctxStart = Math.max(0, m.index - 40);
      const ctx = t.slice(ctxStart, m.index + raw.length + 20).toLowerCase();
      let dist = Infinity;
      for (const k of STRONG) {
         const i = ctx.indexOf(k);
         if (i !== -1) {
            const end = ctxStart + i + k.length;                 /* posisi habisnya kata kunci */
            const d = Math.max(0, m.index - end);
            if (m.index >= end && d < dist) dist = d;
         }
      }
      const score = Number.isFinite(dist) ? 100 - Math.min(dist, 40) : 0;
      found.push({ value, score });
   }
   const best = new Map();
   for (const a of found) {
      const prev = best.get(a.value);
      if (!prev || a.score > prev.score) best.set(a.value, a);
   }
   return [...best.values()].sort((a, b) => b.score - a.score || b.value - a.value);
}

const TEXT_KEYS = ['text', 'message', 'msg', 'body', 'content', 'description', 'remark', 'note', 'title', 'snippet'];
const FROM_KEYS = ['from', 'sender', 'source', 'address', 'bank', 'bank_code'];
const TIME_KEYS = ['time', 'date', 'timestamp', 'created_at', 'datetime', 'sms_date'];

function pick(obj, keys) {
   for (const k of keys) {
      const v = obj?.[k];
      if (v != null && String(v).trim() !== '') return String(v).trim();
   }
   return '';
}

function parsePayload(src) {
   const body = src.body && typeof src.body === 'object' ? src.body : {};
   const q = src.query || {};
   const text = pick(body, TEXT_KEYS) || pick(q, TEXT_KEYS) || (typeof body === 'string' ? body : '');
   const from = pick(body, FROM_KEYS) || pick(q, FROM_KEYS);
   const time = pick(body, TIME_KEYS) || pick(q, TIME_KEYS);

   let explicit = body.amount ?? q.amount;
   if (explicit != null && String(explicit).trim() !== '') {
      const v = parseInt(String(explicit).replace(/[^0-9.]/g, '').split('.')[0] || '0', 10);
      if (v >= 100) {
         const rest = extractAmounts(text).filter((a) => a.value !== v);
         return { text, from, time, explicit: v, rest };
      }
   }
   return { text, from, time, explicit: null, rest: extractAmounts(text) };
}

function paidTimeOf(rawTime) {
   if (!rawTime) return new Date().toISOString();
   const t = Date.parse(rawTime) || (Number(rawTime) > 1e12 ? Number(rawTime) : NaN);
   if (!Number.isFinite(t) || t > Date.now() + 5 * 60000 || t < Date.now() - 24 * 3600e3) {
      return new Date().toISOString();
   }
   return new Date(t).toISOString();
}

export function mutasiRoutes() {
   const router = Router();

   const auth = (req, res) => {
      const secret = process.env.MUTASI_SECRET || process.env.CRON_SECRET;
      if (!secret) { res.status(503).json({ success: false, error: 'MUTASI_SECRET belum diset di env' }); return null; }
      const bearer = (req.get('authorization') || '').replace(/^X-(API|Mutasi|Cron)-Key\s+/i, '');
      const given = req.query.key || req.get('x-mutasi-key') || req.get('x-cron-key') || bearer;
      if (!given || !eq(given, secret)) { res.status(401).json({ success: false, error: 'Key salah' }); return null; }
      return secret;
   };

   const info = { success: true, endpoint: '/api/mutasi/in', method: 'POST', note: 'POST JSON {text, from, time} pakai ?key=MUTASI_SECRET (atau CRON_SECRET). /api/mutasi/test buat debug parsing.' };

   router.get('/', (req, res) => res.json(info));
   router.get('/test', (req, res) => {
      if (!auth(req, res)) return;
      const p = parsePayload(req);
      res.json({ success: true, mode: 'test (tanpa DB)', parsed: p.explicit != null ? [p.explicit, ...p.rest.map((a) => a.value)] : p.rest.map((a) => a.value), text: p.text.slice(0, 300) });
   });
   router.post('/test', (req, res) => {
      if (!auth(req, res)) return;
      const p = parsePayload(req);
      res.json({ success: true, mode: 'test (tanpa DB)', parsed: p.explicit != null ? [p.explicit, ...p.rest.map((a) => a.value)] : p.rest.map((a) => a.value), text: p.text.slice(0, 300) });
   });

   const inHandler = async (req, res) => {
      if (!auth(req, res)) return;
      const p = parsePayload(req);
      if (!p.text && p.explicit == null) {
         return res.status(400).json({ success: false, error: 'Payload kosong. Kirim {"text":"..."} atau query ?text=...' });
      }

      /* urutan kandidat: amount eksplisit (Moota) → yang ada kata kunci → nominal terbesar.
         Kalau ada kandidat ber-kata-kunci, kandidat "polos" (misal angka saldo) dibuang. */
      let scored = p.rest;
      if (scored.some((a) => a.score > 0)) scored = scored.filter((a) => a.score > 0);
      const candidates = [];
      if (p.explicit != null) candidates.push(p.explicit);
      candidates.push(...scored.map((a) => a.value));

      if (!candidates.length) {
         logger.warn('gak ada nominal kebaca dari: ' + p.text.slice(0, 120));
         return res.json({ success: true, matched: false, reason: 'nominal gak kebaca', text: p.text.slice(0, 200) });
      }

      const paidAt = paidTimeOf(p.time);
      const parsedAll = candidates.slice(0, 8);
      let matched = null;

      for (const amount of candidates) {
         const trx = await transactions.getPendingByAmount(amount, paidAt);
         if (!trx) continue;

         /* hash unik per SMS → SMS yang sama dikirim ulang gak bakal kredit 2x */
         const hash = crypto.createHash('sha256')
            .update(p.from + '|' + p.time + '|' + p.text + '|' + String(p.explicit ?? ''))
            .digest('hex').slice(0, 32);
         const gobizId = 'SMS-' + hash;

         const claimed = await history.claim({
            gobizId, amount, time: paidAt,
            raw: { source: 'mutasi', from: p.from, time: p.time || null, text: p.text.slice(0, 500) },
            seenAt: new Date().toISOString(),
         });
         if (!claimed) {
            return res.json({ success: true, matched: false, reason: 'notif ini sudah pernah diproses', trxId: trx.trxId });
         }

         const entry = { gobizId, amount, time: paidAt, raw: { source: 'mutasi', from: p.from, text: p.text.slice(0, 500) } };
         const ok = await payments.markPaid(trx, entry);
         matched = ok ? { trxId: trx.trxId, order: (trx.metadata && trx.metadata.merchant_reference) || null, credited: trx.amount, paid: trx.payAmount } : null;
         if (ok) logger.ok('MATCH ' + trx.trxId + ' pay=' + trx.payAmount + ' dari mutasi (' + p.from + ')');
         break;   /* 1 notif = 1 pembayaran */
      }

      if (!matched) {
         return res.json({ success: true, matched: false, parsed: parsedAll, reason: 'gak ada trx PENDING dengan nominal itu (mungkin sudah lunas/beda nominal)' });
      }
      res.json({ success: true, matched: true, ...matched });
   };

   router.get('/in', (req, res) => inHandler(req, res).catch((e) => {
      logger.error('mutasi/in: ' + e.message);
      res.status(500).json({ success: false, error: e.message });
   }));
   router.post('/in', (req, res) => inHandler(req, res).catch((e) => {
      logger.error('mutasi/in: ' + e.message);
      res.status(500).json({ success: false, error: e.message });
   }));

   return router;
}
