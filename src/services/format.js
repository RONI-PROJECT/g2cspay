// Format response & notifikasi gaya Midtrans Core API.
import crypto from 'node:crypto';

const WIB = 7 * 3600 * 1000;

export function toTime(v) {
   if (!v) return null;
   const t = new Date(v).getTime();
   if (!Number.isFinite(t)) return null;
   return new Date(t + WIB).toISOString().replace('T', ' ').slice(0, 19);
}

export const money = (n) => (Number(n) || 0).toFixed(2);

export function statusOf(trx) {
   if (trx.status === 'PAID') return { transaction_status: 'settlement', status_code: '200', status_message: 'Transaksi berhasil dibayar' };
   if (trx.status === 'EXPIRED' && trx.metadata?.canceled) return { transaction_status: 'cancel', status_code: '202', status_message: 'Transaksi dibatalkan' };
   if (trx.status === 'EXPIRED') return { transaction_status: 'expire', status_code: '407', status_message: 'Transaksi kedaluwarsa' };
   return { transaction_status: 'pending', status_code: '201', status_message: 'Menunggu pembayaran' };
}

export const orderIdOf = (trx) => trx.metadata?.merchant_reference || trx.trxId;

export function signatureKey(orderId, statusCode, grossAmount, secret) {
   return crypto.createHash('sha512').update(`${orderId}${statusCode}${grossAmount}${secret}`).digest('hex');
}

export function toTransaction(trx, base, { withMeta = true, message } = {}) {
   const st = statusOf(trx);
   const gross = Number(trx.amount) || 0;
   const fee = Number(trx.fee) || 0;
   const out = {
      status_code: st.status_code,
      status_message: message || st.status_message,
      transaction_id: trx.trxId,
      order_id: orderIdOf(trx),
      merchant_id: trx.userId ? `G2CSPAY-${trx.userId}` : 'G2CSPAY',
      gross_amount: money(gross),
      fee_amount: money(fee),
      net_amount: money(Math.max(0, gross - fee)),
      pay_amount: money(trx.payAmount ?? trx.amountToPay ?? trx.total ?? gross),
      currency: 'IDR',
      payment_type: 'qris',
      acquirer: 'gopay',
      transaction_time: toTime(trx.createdAt),
      transaction_status: st.transaction_status,
      fraud_status: 'accept',
      expiry_time: toTime(trx.expiresAt),
      qr_string: trx.qrString || null,
      payment_url: `${base}/pay/${encodeURIComponent(trx.trxId)}`,
      actions: [
         { name: 'generate-qr-code', method: 'GET', url: `${base}/api/v2/transaction/${encodeURIComponent(trx.trxId)}/qr` },
         { name: 'payment-page', method: 'GET', url: `${base}/pay/${encodeURIComponent(trx.trxId)}` },
         { name: 'get-status', method: 'GET', url: `${base}/api/v2/${encodeURIComponent(orderIdOf(trx))}/status` },
         { name: 'cancel', method: 'POST', url: `${base}/api/v2/${encodeURIComponent(orderIdOf(trx))}/cancel` },
      ],
   };
   if (trx.paidAt) out.settlement_time = toTime(trx.paidAt);
   if (withMeta && trx.metadata) {
      const { merchant_reference, canceled, canceled_at, ...rest } = trx.metadata;
      if (Object.keys(rest).length) out.metadata = rest;
   }
   return out;
}

export function toNotification(trx, secret) {
   const st = statusOf(trx);
   const gross = money(trx.amount);
   const orderId = orderIdOf(trx);
   const m = trx.metadata || {};
   const n = {
      transaction_time: toTime(trx.createdAt),
      transaction_status: st.transaction_status,
      transaction_id: trx.trxId,
      status_message: st.status_message,
      status_code: st.status_code,
      signature_key: signatureKey(orderId, st.status_code, gross, secret),
      payment_type: 'qris',
      order_id: orderId,
      gross_amount: gross,
      fee_amount: money(trx.fee),
      net_amount: money(Math.max(0, (Number(trx.amount) || 0) - (Number(trx.fee) || 0))),
      pay_amount: money(trx.payAmount ?? trx.amount),
      currency: 'IDR',
      fraud_status: 'accept',
      expiry_time: toTime(trx.expiresAt),
   };
   if (trx.paidAt) n.settlement_time = toTime(trx.paidAt);
   if (m.customer_name || m.customer_email) n.customer_details = { first_name: m.customer_name || null, email: m.customer_email || null };
   return n;
}

export const apiError = (res, code, message, extra = {}) =>
   res.status(code).json({ status_code: String(code), status_message: message, ...extra });
