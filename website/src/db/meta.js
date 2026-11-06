import { all, one, sql } from './index.js';

export const get = async (key) => {
   const row = await one('SELECT value FROM meta WHERE key = $1', [key]);
   return row ? row.value : null;
};

export const set = async (key, value) => {
   await sql('INSERT INTO meta (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = excluded.value', [key, JSON.stringify(value ?? null)]);
};

export const patch = async (key, fields) => {
   await sql('INSERT INTO meta (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = meta.value || excluded.value', [key, JSON.stringify(fields)]);
};

export async function tryClaimPollSlot(minIntervalMs, now = Date.now()) {
   const rows = await all("INSERT INTO meta (key, value) VALUES ('poller.lastRunAt', to_jsonb($1::bigint)) ON CONFLICT (key) DO UPDATE SET value = to_jsonb($1::bigint) WHERE (meta.value)::bigint <= $2 RETURNING key", [now, now - minIntervalMs]);
   return rows.length > 0;
}

export async function lastPollAt() {
   const value = await get('poller.lastRunAt');
   return value == null ? null : Number(value);
}
