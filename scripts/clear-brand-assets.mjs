import 'dotenv/config';
import pg from 'pg';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL tidak ada'); process.exit(1); }
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
try {
   const a = await pool.query("DELETE FROM app_assets WHERE key IN ('logo','favicon','og') RETURNING key");
   const s = await pool.query("DELETE FROM app_settings WHERE key IN ('logo_url','favicon_url','og_url') RETURNING key");
   console.log('app_assets dihapus :', a.rows.map(r => r.key).join(', ') || '(tidak ada)');
   console.log('app_settings dihapus:', s.rows.map(r => r.key).join(', ') || '(tidak ada)');
} catch (e) { console.error('GAGAL:', e.message); process.exit(1); } finally { await pool.end(); }
