import { all, sql } from './index.js';

const LEASE_MS = 60000;

const parse = (row) => ({ ...row, amount: Number(row.amount), fee: Number(row.fee), total: Number(row.total), payAmount: Number(row.payAmount) });

export const owe = async (trxId, nextAt = new Date(Date.now() + LEASE_MS).toISOString()) => {
   await sql("UPDATE transactions SET \"webhookState\" = 'PENDING', \"webhookAttempts\" = 0, \"webhookNextAt\" = $2, \"webhookLastError\" = NULL WHERE \"trxId\" = $1", [trxId, nextAt]);
};

export const markSent = async (trxId) => {
   await sql("UPDATE transactions SET \"webhookState\" = 'SENT', \"webhookNextAt\" = NULL, \"webhookLastError\" = NULL, \"webhookAttempts\" = \"webhookAttempts\" + 1 WHERE \"trxId\" = $1", [trxId]);
};

export const markFailed = async (trxId, error, nextAt) => {
   await sql('UPDATE transactions SET "webhookAttempts" = "webhookAttempts" + 1, "webhookNextAt" = $2, "webhookLastError" = $3 WHERE "trxId" = $1', [trxId, nextAt, String(error).slice(0, 500)]);
};

export async function due({ maxAttempts = 12, limit = 20, now = new Date().toISOString() } = {}) {
   const rows = await all("SELECT * FROM transactions WHERE \"webhookState\" = 'PENDING' AND \"webhookAttempts\" < $1 AND (\"webhookNextAt\" IS NULL OR \"webhookNextAt\" <= $2) ORDER BY \"webhookNextAt\" LIMIT $3", [maxAttempts, now, limit]);
   return rows.map(parse);
}

export async function claim({ maxAttempts = 12, limit = 20, now = Date.now() } = {}) {
   const nowIso = new Date(now).toISOString();
   const leaseIso = new Date(now + LEASE_MS).toISOString();
   const rows = await all("UPDATE transactions SET \"webhookNextAt\" = $4 WHERE \"trxId\" IN (SELECT \"trxId\" FROM transactions WHERE \"webhookState\" = 'PENDING' AND \"webhookAttempts\" < $1 AND (\"webhookNextAt\" IS NULL OR \"webhookNextAt\" <= $2) ORDER BY \"webhookNextAt\" LIMIT $3 FOR UPDATE SKIP LOCKED) RETURNING *", [maxAttempts, nowIso, limit, leaseIso]);
   return rows.map(parse);
}

export const owedCount = async () => {
   const rows = await all("SELECT COUNT(*) AS n FROM transactions WHERE \"webhookState\" = 'PENDING'");
   return Number(rows[0].n);
};
