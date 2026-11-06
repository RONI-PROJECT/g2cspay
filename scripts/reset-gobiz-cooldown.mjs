// Hapus cooldown login GoBiz yang tersimpan di DB (meta "gobiz.cache").
// PAKAI HANYA setelah GOPAY_EMAIL / GOPAY_PASSWORD di .env sudah benar & kamu menunggu rate-limit GoBiz reda,
// kalau tidak, login gagal lagi dan cooldown 15 menit mulai dari awal.
import 'dotenv/config';
import pg from 'pg';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL tidak ada'); process.exit(1); }
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
try {
   const before = await pool.query("SELECT value->>'loginCooldownUntil' AS until FROM meta WHERE key = 'gobiz.cache'");
   const until = Number(before.rows[0]?.until || 0);
   console.log('cooldown sekarang :', until ? `${Math.max(0, Math.ceil((until - Date.now()) / 1000))} detik lagi` : '(tidak ada)');
   await pool.query("UPDATE meta SET value = (value - 'loginCooldownUntil') - 'token' WHERE key = 'gobiz.cache'");
   console.log('cooldown & token lama dihapus. Server akan login ulang pada poll berikutnya.');
} catch (e) { console.error('GAGAL:', e.message); process.exit(1); } finally { await pool.end(); }
