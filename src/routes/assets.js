import { one, sql } from '../db/index.js';

export const ASSET_KEY_RE = /^(logo|favicon|og|bank-[A-Z0-9]{2,12})$/;
export const ASSET_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon'];
export const MAX_ASSET_BYTES = 1.5 * 1024 * 1024;

let ready = false;
export async function ensureAssets() {
   if (ready) return;
   await sql(`CREATE TABLE IF NOT EXISTS app_assets (
      key TEXT PRIMARY KEY, mime TEXT NOT NULL, data TEXT NOT NULL, "updatedAt" TEXT DEFAULT (now())::text
   )`);
   ready = true;
}

async function setSetting(k, v) {
   await sql(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [k, v]
   );
}

// Sinkronkan setting (logo_url / favicon_url / og_url / bank_logos) dengan aset yang di-upload.
export async function assetSettingFor(key, present) {
   const url = present ? `/api/public/asset/${key}?v=${Date.now()}` : '';
   if (key === 'logo') await setSetting('logo_url', url);
   else if (key === 'favicon') await setSetting('favicon_url', url);
   else if (key === 'og') await setSetting('og_url', url);
   else {
      const code = key.slice(5);
      const row = await one(`SELECT value FROM app_settings WHERE key = 'bank_logos'`);
      let map = {};
      try { map = JSON.parse(row?.value || '{}') || {}; } catch {}
      if (present) map[code] = url; else delete map[code];
      await setSetting('bank_logos', JSON.stringify(map));
   }
   return url;
}
