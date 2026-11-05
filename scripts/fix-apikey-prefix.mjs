import fs from 'fs';
import crypto from 'crypto';
import pg from 'pg';

for (const f of ['.env.local', '.env']) {
  try {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}

const cs = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL;
if (!cs) { console.error('!! DATABASE_URL gak ketemu di .env/.env.local'); process.exit(1); }

const isLocal = /localhost|127\.0\.0\.1/.test(cs);
const pool = new pg.Pool({ connectionString: cs, ssl: isLocal ? false : { rejectUnauthorized: false } });
const q = (t, p) => pool.query(t, p);

const mode = process.argv[2] || '';
const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const pick = n => { let s = ''; for (const b of crypto.randomBytes(n)) s += abc[b % abc.length]; return s; };
const GEN = {
  '--rp':    () => 'rp_live_' + pick(20),
  '--suuid': () => `${pick(8)}-${pick(4)}-${pick(4)}-${pick(4)}`,
  '--new':   () => pick(32),
  '--uuid':  () => crypto.randomUUID(),
};

const cols = (await q(`SELECT column_name FROM information_schema.columns WHERE table_name = 'api_keys'`)).rows.map(r => r.column_name);
const keyCol = ['api_key', 'key', 'token'].find(c => cols.includes(c));
if (!keyCol) { console.error('!! kolom key gak ketemu di api_keys. kolom ada: ' + cols.join(', ')); process.exit(1); }

const before = (await q(`SELECT * FROM api_keys`)).rows;
console.log('kolom key: ' + keyCol);
console.log('SEBELUM:');
before.forEach(r => console.log('  -', r[keyCol]));

if (GEN[mode]) {
  for (const r of before) {
    const nk = GEN[mode]();
    await q(`UPDATE api_keys SET ${keyCol} = $1 WHERE ${keyCol} = $2`, [nk, r[keyCol]]);
    console.log('REGEN:', r[keyCol], '=>', nk);
  }
} else if (mode === '') {
  const res = await q(`UPDATE api_keys SET ${keyCol} = REPLACE(${keyCol}, 'rp_live_', '') WHERE ${keyCol} LIKE 'rp_live_%' RETURNING ${keyCol}`);
  console.log('strip prefix, baris berubah:', res.rowCount);
} else {
  console.error('mode gak dikenal:', mode, '(pake: --rp / --suuid / --new / --uuid / kosong)');
  await pool.end();
  process.exit(1);
}

const after = (await q(`SELECT * FROM api_keys`)).rows;
console.log('SESUDAH:');
after.forEach(r => console.log('  -', r[keyCol]));
await pool.end();
console.log('SELESAI');
