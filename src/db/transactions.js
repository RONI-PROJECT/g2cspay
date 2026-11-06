import { all, one, changed } from './index.js';

const parse = (row) => (row ? {
   ...row,
   amount: Number(row.amount),
   fee: Number(row.fee),
   net: Number(row.net ?? 0),
   total: Number(row.total),
   payAmount: Number(row.payAmount),
} : null);

export function clampPage({ limit, offset } = {}) {
   return {
      limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200),
      offset: Math.max(parseInt(offset, 10) || 0, 0),
   };
}

export async function insert(trx) {
   const fee = trx.fee ?? 0;
   const amount = trx.amount ?? 0;
   const netAmount = trx.net != null ? trx.net : Math.max(0, amount - fee);
   const feePercent = amount > 0 ? (fee / amount) * 100 : 0;

   await one(
      'INSERT INTO transactions ("trxId", "userId", status, amount, fee, net, "merchantAmount", "feePercent", total, "payAmount", "qrString", "callbackUrl", "callbackSecret", "idempotencyKey", metadata, "createdAt", "expiresAt", "paidAt", entry) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING "trxId"',
      [trx.trxId, trx.userId ?? null, trx.status, amount, fee, netAmount, netAmount, feePercent, trx.total, trx.payAmount, trx.qrString, trx.callbackUrl ?? null, trx.callbackSecret ?? null, trx.idempotencyKey ?? null, trx.metadata != null ? JSON.stringify(trx.metadata) : null, trx.createdAt, trx.expiresAt, trx.paidAt ?? null, trx.entry != null ? JSON.stringify(trx.entry) : null],
   );
}

export const get = async (trxId) => parse(await one('SELECT * FROM transactions WHERE "trxId" = $1', [trxId]));

export const getPendingByAmount = async (payAmount, paidAt = null) =>
   parse(await one("SELECT * FROM transactions WHERE \"payAmount\" = $1 AND status IN ('PENDING', 'EXPIRED') AND ($2::text IS NULL OR \"createdAt\" <= $2) ORDER BY \"createdAt\" DESC LIMIT 1", [payAmount, paidAt]));

export const getByIdempotencyKey = async (key) => parse(await one('SELECT * FROM transactions WHERE "idempotencyKey" = $1', [key]));

export const listPending = async () => (await all("SELECT * FROM transactions WHERE status = 'PENDING'")).map(parse);

export const listExpired = async (now = new Date().toISOString(), limit = 500) =>
   (await all('SELECT * FROM transactions WHERE status = $1 AND "expiresAt" <= $2 ORDER BY "expiresAt" LIMIT $3', ['PENDING', now, limit])).map(parse);

export async function list({ status = null, ...page } = {}) {
   const { limit, offset } = clampPage(page);
   const rows = await all('SELECT * FROM transactions WHERE ($1::text IS NULL OR status = $1) ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3', [status, limit, offset]);
   return rows.map(parse);
}

export async function settle(trx) {
   return await changed("UPDATE transactions SET status = $2, \"paidAt\" = $3, entry = $4 WHERE \"trxId\" = $1 AND status = 'PENDING'", [trx.trxId, trx.status, trx.paidAt ?? null, trx.entry != null ? JSON.stringify(trx.entry) : null]) > 0;
}

export async function forcePaid({ trxId, paidAt, entry = null }) {
   return await changed("UPDATE transactions SET status = 'PAID', \"paidAt\" = $2, entry = $3 WHERE \"trxId\" = $1 AND status <> 'PAID'", [trxId, paidAt, entry != null ? JSON.stringify(entry) : null]) > 0;
}

export const counts = async () => {
   const row = await one("SELECT (SELECT COUNT(*) FROM transactions WHERE status = 'PENDING') AS pending, (SELECT COUNT(*) FROM transactions) AS total, (SELECT COUNT(*) FROM transactions WHERE \"webhookState\" = 'PENDING') AS \"webhooksOwed\"");
   return { pending: Number(row.pending), total: Number(row.total), webhooksOwed: Number(row.webhooksOwed) };
};
